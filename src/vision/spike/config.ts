import type { SpikeTaskId } from "@/core/spike-report";

export const WASM_BASE = "/wasm";
export const WORKER_URL = "/spike-worker.js";

export const MODEL_URLS: Record<SpikeTaskId, string> = {
  segmenter: "/models/selfie_segmenter.tflite",
  face: "/models/face_landmarker.task",
  pose: "/models/pose_landmarker_lite.task",
  hand: "/models/hand_landmarker.task",
};

export const TASK_LABELS: Record<SpikeTaskId, string> = {
  segmenter: "Image Segmenter (selfie)",
  face: "Face Landmarker",
  pose: "Pose Landmarker (lite)",
  hand: "Hand Landmarker",
};

/** Run a task every Nth loop iteration. Mirrors the plan in design.md. */
export const DESIGN_CADENCE: Record<SpikeTaskId, number> = {
  segmenter: 1,
  face: 2,
  pose: 3,
  hand: 2,
};

export const EVERY_FRAME_CADENCE: Record<SpikeTaskId, number> = {
  segmenter: 1,
  face: 1,
  pose: 1,
  hand: 1,
};

export const RESOLUTIONS = [
  { label: "320x240", width: 320, height: 240 },
  { label: "640x480", width: 640, height: 480 },
  { label: "1280x720", width: 1280, height: 720 },
] as const;

/** Number of recent samples used for the on-screen averages and p95. */
export const ROLLING_WINDOW = 120;
/** Window for the fps counter, in ms. */
export const FPS_WINDOW_MS = 2000;
/** UI refresh interval, in ms. */
export const UI_REFRESH_MS = 500;
