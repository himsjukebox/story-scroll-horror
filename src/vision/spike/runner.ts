import type { FaceLandmarker, HandLandmarker, ImageSegmenter, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { SpikeTaskId } from "@/core/spike-report";
import { MODEL_URLS, WASM_BASE, WORKER_URL } from "./config";

export type Delegate = "GPU" | "CPU";
export type TaskTimings = Partial<Record<SpikeTaskId, number>>;

export interface RunnerOptions {
  enabled: readonly SpikeTaskId[];
  delegate: Delegate;
}

/** Same shape for the main-thread and the worker implementation. */
export interface Runner {
  /** Runs the given tasks on the current video frame and resolves with ms per task. */
  process(video: HTMLVideoElement, active: readonly SpikeTaskId[], timestampMs: number): Promise<TaskTimings>;
  close(): void;
}

export async function createMainRunner(options: RunnerOptions): Promise<Runner> {
  // Client-only dynamic import. Never import MediaPipe statically.
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
  const base = (task: SpikeTaskId) => ({ modelAssetPath: MODEL_URLS[task], delegate: options.delegate });

  let segmenter: ImageSegmenter | undefined;
  let face: FaceLandmarker | undefined;
  let pose: PoseLandmarker | undefined;
  let hand: HandLandmarker | undefined;

  try {
    // Created one after another so a failure names the task that failed.
    if (options.enabled.includes("segmenter")) {
      segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: base("segmenter"),
        runningMode: "VIDEO",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
    }
    if (options.enabled.includes("face")) {
      face = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: base("face"),
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
    }
    if (options.enabled.includes("pose")) {
      pose = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: base("pose"),
        runningMode: "VIDEO",
        numPoses: 1,
      });
    }
    if (options.enabled.includes("hand")) {
      hand = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: base("hand"),
        runningMode: "VIDEO",
        numHands: 2,
      });
    }
  } catch (error) {
    segmenter?.close();
    face?.close();
    pose?.close();
    hand?.close();
    throw error;
  }

  return {
    async process(video, active, timestampMs) {
      const timings: TaskTimings = {};
      const time = (id: SpikeTaskId, fn: () => void) => {
        const t0 = performance.now();
        fn();
        timings[id] = performance.now() - t0;
      };
      if (segmenter && active.includes("segmenter")) {
        time("segmenter", () => {
          segmenter!.segmentForVideo(video, timestampMs, (result) => result.close());
        });
      }
      if (face && active.includes("face")) time("face", () => void face!.detectForVideo(video, timestampMs));
      if (pose && active.includes("pose")) time("pose", () => pose!.detectForVideo(video, timestampMs, () => undefined));
      if (hand && active.includes("hand")) time("hand", () => void hand!.detectForVideo(video, timestampMs));
      return timings;
    },
    close() {
      segmenter?.close();
      face?.close();
      pose?.close();
      hand?.close();
    },
  };
}

interface WorkerReply {
  type: "ready" | "error" | "result";
  message?: string;
  timings?: TaskTimings;
}

export async function createWorkerRunner(options: RunnerOptions): Promise<Runner> {
  // Classic worker served from public/, so importScripts can load the bundled
  // MediaPipe runtime from the same origin (no third-party request).
  const worker = new Worker(WORKER_URL);
  let pending: { resolve: (t: TaskTimings) => void; reject: (e: Error) => void } | null = null;

  const ready = new Promise<void>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      const data = event.data;
      if (data.type === "ready") resolve();
      else if (data.type === "error") {
        const err = new Error(data.message ?? "Worker error");
        reject(err);
        pending?.reject(err);
        pending = null;
      } else if (data.type === "result") {
        pending?.resolve(data.timings ?? {});
        pending = null;
      }
    };
    worker.onerror = (event) => {
      const err = new Error(event.message || "Worker failed to start");
      reject(err);
      pending?.reject(err);
      pending = null;
    };
  });
  worker.postMessage({
    type: "init",
    enabled: options.enabled,
    delegate: options.delegate,
    wasmBase: WASM_BASE,
    models: MODEL_URLS,
  });
  try {
    await ready;
  } catch (error) {
    worker.terminate();
    throw error;
  }

  return {
    async process(video, active, timestampMs) {
      if (active.length === 0) return {};
      const bitmap = await createImageBitmap(video);
      return new Promise<TaskTimings>((resolve, reject) => {
        pending = { resolve, reject };
        worker.postMessage({ type: "frame", bitmap, active, timestampMs }, [bitmap]);
      });
    },
    close() {
      worker.postMessage({ type: "close" });
      worker.terminate();
    },
  };
}
