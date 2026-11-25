"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatJson, formatMarkdownRow, MARKDOWN_HEADER, SPIKE_TASK_IDS, type SpikeReport, type SpikeTaskId } from "@/core/spike-report";
import { RollingStats, type Summary } from "@/core/stats";
import {
  DESIGN_CADENCE,
  EVERY_FRAME_CADENCE,
  FPS_WINDOW_MS,
  RESOLUTIONS,
  ROLLING_WINDOW,
  TASK_LABELS,
  UI_REFRESH_MS,
} from "./config";
import { createMainRunner, createWorkerRunner, type Delegate, type Runner } from "./runner";
import styles from "./spike.module.css";

type Mode = "main" | "worker";
type Cadence = "every-frame" | "design";
type Phase = "idle" | "starting" | "running";

interface Snapshot {
  fps: number;
  msPerTask: Partial<Record<SpikeTaskId, Summary>>;
  loopMs: Summary;
  longTasks: number;
  longTaskMs: number;
  seconds: number;
  hidden: boolean;
}

const EMPTY: Summary = { count: 0, mean: 0, p95: 0, max: 0 };
const EMPTY_SNAPSHOT: Snapshot = { fps: 0, msPerTask: {}, loopMs: EMPTY, longTasks: 0, longTaskMs: 0, seconds: 0, hidden: false };

interface Session {
  stopped: boolean;
  stream: MediaStream;
  runner: Runner;
  cancelWait: (() => void) | null;
  observer: PerformanceObserver | null;
}

function waitForVisible(): Promise<void> {
  return new Promise((resolve) => {
    const onChange = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", onChange);
        resolve();
      }
    };
    document.addEventListener("visibilitychange", onChange);
  });
}

function waitForFrame(video: HTMLVideoElement, session: Session): Promise<void> {
  return new Promise((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      const handle = video.requestVideoFrameCallback(() => resolve());
      session.cancelWait = () => {
        video.cancelVideoFrameCallback(handle);
        resolve();
      };
    } else {
      const handle = requestAnimationFrame(() => resolve());
      session.cancelWait = () => {
        cancelAnimationFrame(handle);
        resolve();
      };
    }
  });
}

export function SpikeClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<Session | null>(null);
  const loopStats = useRef(new RollingStats(ROLLING_WINDOW));
  const taskStats = useRef<Record<SpikeTaskId, RollingStats>>({
    segmenter: new RollingStats(ROLLING_WINDOW),
    face: new RollingStats(ROLLING_WINDOW),
    pose: new RollingStats(ROLLING_WINDOW),
    hand: new RollingStats(ROLLING_WINDOW),
  });
  const frameTimes = useRef<number[]>([]);
  const longTasks = useRef({ count: 0, ms: 0 });
  const startedAt = useRef(0);
  const hiddenMs = useRef(0);

  const [enabled, setEnabled] = useState<Record<SpikeTaskId, boolean>>({ segmenter: true, face: false, pose: false, hand: false });
  const [mode, setMode] = useState<Mode>("main");
  const [delegate, setDelegate] = useState<Delegate>("GPU");
  const [cadence, setCadence] = useState<Cadence>("design");
  const [resolution, setResolution] = useState<string>("640x480");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [output, setOutput] = useState("");
  const [secure, setSecure] = useState<boolean | null>(null);
  const [longTaskSupported, setLongTaskSupported] = useState(true);

  useEffect(() => {
    // Browser capabilities are only known after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSecure(window.isSecureContext && !!navigator.mediaDevices?.getUserMedia);
    setLongTaskSupported(
      typeof PerformanceObserver !== "undefined" && (PerformanceObserver.supportedEntryTypes ?? []).includes("longtask"),
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const resetMetrics = useCallback(() => {
    loopStats.current.reset();
    SPIKE_TASK_IDS.forEach((id) => taskStats.current[id].reset());
    frameTimes.current = [];
    longTasks.current = { count: 0, ms: 0 };
    startedAt.current = performance.now();
    hiddenMs.current = 0;
  }, []);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.stopped = true;
    session.cancelWait?.();
    session.observer?.disconnect();
    session.stream.getTracks().forEach((track) => track.stop());
    session.runner.close();
    sessionRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPhase("idle");
  }, []);

  // Stop tracks on pagehide and unmount.
  useEffect(() => {
    window.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("pagehide", stop);
      stop();
    };
  }, [stop]);

  // Refresh the on-screen numbers at a fixed interval, off the inference path.
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const recent = frameTimes.current.filter((t) => now - t <= FPS_WINDOW_MS);
      const first = recent[0] ?? 0;
      const last = recent[recent.length - 1] ?? 0;
      const span = recent.length > 1 ? (last - first) / 1000 : 0;
      const msPerTask: Partial<Record<SpikeTaskId, Summary>> = {};
      SPIKE_TASK_IDS.forEach((t) => {
        if (taskStats.current[t].size > 0) msPerTask[t] = taskStats.current[t].summary();
      });
      setSnapshot({
        fps: span > 0 ? (recent.length - 1) / span : 0,
        msPerTask,
        loopMs: loopStats.current.summary(),
        longTasks: longTasks.current.count,
        longTaskMs: longTasks.current.ms,
        seconds: Math.max(0, (now - startedAt.current - hiddenMs.current) / 1000),
        hidden: document.hidden,
      });
    }, UI_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const start = useCallback(async () => {
    setError(null);
    const tasks = SPIKE_TASK_IDS.filter((t) => enabled[t]);
    if (tasks.length === 0) {
      setError("Enable at least one task.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera API unavailable. Camera needs HTTPS (or localhost on a desktop). See spike-results.md.");
      return;
    }
    setPhase("starting");
    let stream: MediaStream | null = null;
    let runner: Runner | null = null;
    try {
      const size = RESOLUTIONS.find((r) => r.label === resolution) ?? RESOLUTIONS[1];
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: size.width }, height: { ideal: size.height } },
      });
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      runner = await (mode === "worker" ? createWorkerRunner : createMainRunner)({ enabled: tasks, delegate });
    } catch (e) {
      stream?.getTracks().forEach((track) => track.stop());
      runner?.close();
      if (videoRef.current) videoRef.current.srcObject = null;
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
      return;
    }

    const session: Session = { stopped: false, stream, runner, cancelWait: null, observer: null };
    sessionRef.current = session;
    resetMetrics();

    if (longTaskSupported) {
      try {
        session.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.current.count += 1;
            longTasks.current.ms += entry.duration;
          }
        });
        session.observer.observe({ entryTypes: ["longtask"] });
      } catch {
        session.observer = null;
      }
    }
    setPhase("running");

    const cadenceMap = cadence === "design" ? DESIGN_CADENCE : EVERY_FRAME_CADENCE;
    const video = videoRef.current!;
    let iteration = 0;
    let lastTs = 0;
    while (!session.stopped) {
      if (document.hidden) {
        // Pause while the tab is hidden, and do not count that time.
        const hiddenAt = performance.now();
        await waitForVisible();
        hiddenMs.current += performance.now() - hiddenAt;
        frameTimes.current = [];
        continue;
      }
      await waitForFrame(video, session);
      if (session.stopped || document.hidden) continue;
      const active = tasks.filter((t) => iteration % cadenceMap[t] === 0);
      iteration += 1;
      const t0 = performance.now();
      const ts = Math.max(t0, lastTs + 1); // MediaPipe needs strictly increasing timestamps
      lastTs = ts;
      try {
        const timings = await runner.process(video, active, ts);
        if (session.stopped) break;
        const t1 = performance.now();
        loopStats.current.push(t1 - t0);
        SPIKE_TASK_IDS.forEach((id) => {
          const ms = timings[id];
          if (ms !== undefined) taskStats.current[id].push(ms);
        });
        frameTimes.current.push(t1);
        if (frameTimes.current.length > 600) frameTimes.current.splice(0, frameTimes.current.length - 600);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        stop();
        return;
      }
    }
  }, [enabled, mode, delegate, cadence, resolution, longTaskSupported, resetMetrics, stop]);

  const buildReport = useCallback((): SpikeReport => {
    return {
      deviceLabel,
      userAgent: navigator.userAgent,
      mode,
      delegate,
      cadence,
      resolution,
      tasks: SPIKE_TASK_IDS.filter((t) => enabled[t]),
      durationSeconds: snapshot.seconds,
      fps: snapshot.fps,
      msPerTask: snapshot.msPerTask,
      loopMs: snapshot.loopMs,
      longTasks: snapshot.longTasks,
      longTaskMs: snapshot.longTaskMs,
    };
  }, [deviceLabel, mode, delegate, cadence, resolution, enabled, snapshot]);

  const showMarkdown = () => setOutput(`${MARKDOWN_HEADER}\n${formatMarkdownRow(buildReport())}`);
  const showJson = () => setOutput(formatJson(buildReport()));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      setError("Copy failed. Select the text and copy it by hand.");
    }
  };

  const running = phase !== "idle";
  const fmt = (n: number) => n.toFixed(1);

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="spike-title">
        <h1 id="spike-title" className={styles.title}>
          Performance spike
        </h1>
        <p>
          Internal page. Camera frames stay in this browser tab (or its worker). Nothing is uploaded or stored. See
          .kiro/specs/story-scroll-horror/spike-results.md for how to run and record a test.
        </p>
        {secure === false && (
          <p className={styles.error} role="alert">
            This page is not in a secure context, so the camera is blocked. Open it over HTTPS (Vercel preview or a
            temporary tunnel). Localhost works on desktop only.
          </p>
        )}
        {!longTaskSupported && <p>This browser does not report long tasks. The long task count will stay at 0 and is not a measurement.</p>}
      </section>

      <section className={styles.panel} aria-labelledby="spike-config">
        <h2 id="spike-config">Configuration</h2>
        <div className={styles.grid}>
          <fieldset className={styles.field} disabled={running}>
            <legend>Tasks</legend>
            {SPIKE_TASK_IDS.map((id) => (
              <label key={id} className={styles.check}>
                <input type="checkbox" checked={enabled[id]} onChange={(e) => setEnabled((s) => ({ ...s, [id]: e.target.checked }))} />
                {TASK_LABELS[id]}
              </label>
            ))}
          </fieldset>
          <div className={styles.field}>
            <label htmlFor="spike-mode">Where inference runs</label>
            <select id="spike-mode" className={styles.select} value={mode} disabled={running} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="main">Main thread</option>
              <option value="worker">Web Worker</option>
            </select>
            <label htmlFor="spike-delegate">Delegate</label>
            <select id="spike-delegate" className={styles.select} value={delegate} disabled={running} onChange={(e) => setDelegate(e.target.value as Delegate)}>
              <option value="GPU">GPU</option>
              <option value="CPU">CPU</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="spike-cadence">Task cadence</label>
            <select id="spike-cadence" className={styles.select} value={cadence} disabled={running} onChange={(e) => setCadence(e.target.value as Cadence)}>
              <option value="design">Design plan (face /2, pose /3, hand /2)</option>
              <option value="every-frame">Every task every frame</option>
            </select>
            <label htmlFor="spike-res">Camera resolution</label>
            <select id="spike-res" className={styles.select} value={resolution} disabled={running} onChange={(e) => setResolution(e.target.value)}>
              {RESOLUTIONS.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="spike-device">Device and browser (type it, for example &quot;Pixel 7, Chrome 130&quot;)</label>
            <input id="spike-device" className={styles.input} value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} />
          </div>
        </div>
        <div className={styles.row}>
          <button type="button" className={styles.button} onClick={start} disabled={running}>
            {phase === "starting" ? "Starting..." : "Start camera and tasks"}
          </button>
          <button type="button" className={styles.buttonAlt} onClick={stop} disabled={!running}>
            Stop
          </button>
          <button type="button" className={styles.buttonAlt} onClick={resetMetrics} disabled={phase !== "running"}>
            Reset numbers
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="spike-live">
        <h2 id="spike-live">Live numbers</h2>
        <video ref={videoRef} className={styles.video} muted playsInline aria-label="Camera preview, local only" />
        <p className={styles.big} aria-live="off">
          {fmt(snapshot.fps)} fps
        </p>
        {snapshot.hidden && <p>Paused: tab hidden.</p>}
        <table className={styles.table}>
          <caption>Rolling window of the last {ROLLING_WINDOW} samples, in ms</caption>
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Samples</th>
              <th scope="col">Avg</th>
              <th scope="col">p95</th>
              <th scope="col">Max</th>
            </tr>
          </thead>
          <tbody>
            {SPIKE_TASK_IDS.filter((t) => enabled[t]).map((t) => {
              const s = snapshot.msPerTask[t];
              return (
                <tr key={t}>
                  <th scope="row">{TASK_LABELS[t]}</th>
                  <td>{s?.count ?? 0}</td>
                  <td>{s ? fmt(s.mean) : "n/a"}</td>
                  <td>{s ? fmt(s.p95) : "n/a"}</td>
                  <td>{s ? fmt(s.max) : "n/a"}</td>
                </tr>
              );
            })}
            <tr>
              <th scope="row">Whole loop iteration</th>
              <td>{snapshot.loopMs.count}</td>
              <td>{snapshot.loopMs.count ? fmt(snapshot.loopMs.mean) : "n/a"}</td>
              <td>{snapshot.loopMs.count ? fmt(snapshot.loopMs.p95) : "n/a"}</td>
              <td>{snapshot.loopMs.count ? fmt(snapshot.loopMs.max) : "n/a"}</td>
            </tr>
          </tbody>
        </table>
        <p>
          Long tasks (over 50 ms on the main thread): {snapshot.longTasks} ({snapshot.longTaskMs.toFixed(0)} ms total). Run time:{" "}
          {snapshot.seconds.toFixed(0)} s.
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="spike-out">
        <h2 id="spike-out">Result</h2>
        <p>Let the run settle for 30 seconds before copying.</p>
        <div className={styles.row}>
          <button type="button" className={styles.button} onClick={showMarkdown} disabled={snapshot.loopMs.count === 0}>
            Markdown row
          </button>
          <button type="button" className={styles.buttonAlt} onClick={showJson} disabled={snapshot.loopMs.count === 0}>
            JSON
          </button>
          <button type="button" className={styles.buttonAlt} onClick={copy} disabled={!output}>
            Copy
          </button>
        </div>
        <label htmlFor="spike-output" className={styles.field}>
          Result text
        </label>
        <textarea id="spike-output" className={styles.output} readOnly value={output} />
      </section>
    </main>
  );
}
