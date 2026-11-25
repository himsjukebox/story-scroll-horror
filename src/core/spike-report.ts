import type { Summary } from "./stats";

export type SpikeTaskId = "segmenter" | "face" | "pose" | "hand";

export const SPIKE_TASK_IDS: readonly SpikeTaskId[] = ["segmenter", "face", "pose", "hand"];

export interface SpikeReport {
  /** Free text typed by the person running the test, for example "Pixel 7, Chrome 130". */
  deviceLabel: string;
  userAgent: string;
  mode: "main" | "worker";
  delegate: "GPU" | "CPU";
  cadence: "every-frame" | "design";
  resolution: string;
  tasks: readonly SpikeTaskId[];
  durationSeconds: number;
  fps: number;
  msPerTask: Partial<Record<SpikeTaskId, Summary>>;
  /** Wall time of one full loop iteration (all active tasks plus any transfer). */
  loopMs: Summary;
  longTasks: number;
  longTaskMs: number;
}

const round = (n: number, digits = 1): string => (Number.isFinite(n) ? n.toFixed(digits) : "n/a");

const escapeCell = (s: string): string => s.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").trim();

/** One markdown table row, matching the table in spike-results.md. */
export function formatMarkdownRow(r: SpikeReport): string {
  const per = SPIKE_TASK_IDS.filter((t) => r.tasks.includes(t))
    .map((t) => {
      const s = r.msPerTask[t];
      return s ? `${t} ${round(s.mean)}/${round(s.p95)}` : `${t} n/a`;
    })
    .join(", ");
  const cells = [
    r.deviceLabel || "(unlabelled)",
    r.mode,
    r.delegate,
    r.cadence === "design" ? "design cadence" : "every frame",
    r.resolution,
    r.tasks.join("+") || "none",
    round(r.fps),
    per || "n/a",
    `${r.longTasks} (${round(r.longTaskMs, 0)} ms)`,
    `${round(r.durationSeconds, 0)} s`,
  ];
  return `| ${cells.map(escapeCell).join(" | ")} |`;
}

export const MARKDOWN_HEADER = [
  "| Device and browser | Mode | Delegate | Cadence | Camera | Tasks | fps | ms per task (avg/p95) | Long tasks | Run |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
].join("\n");

export function formatJson(r: SpikeReport): string {
  return JSON.stringify(r, null, 2);
}
