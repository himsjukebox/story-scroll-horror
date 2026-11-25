/* Throwaway worker for the /spike performance page (tasks.md Task 1).
 * Classic worker: the MediaPipe bundle exposes the global `Vision`.
 * Everything is loaded from this origin. Frames arrive as ImageBitmaps and are
 * never stored or sent anywhere. Timings go back to the page, nothing else. */
let vision = null;
const tasks = {};

function post(message) {
  self.postMessage(message);
}

async function init(data) {
  self.importScripts("/wasm/vision_bundle.js");
  vision = self.Vision;
  const fileset = await vision.FilesetResolver.forVisionTasks(data.wasmBase);
  const base = (id) => ({ modelAssetPath: data.models[id], delegate: data.delegate });
  if (data.enabled.includes("segmenter")) {
    tasks.segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: base("segmenter"),
      runningMode: "VIDEO",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  }
  if (data.enabled.includes("face")) {
    tasks.face = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: base("face"),
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    });
  }
  if (data.enabled.includes("pose")) {
    tasks.pose = await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: base("pose"),
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }
  if (data.enabled.includes("hand")) {
    tasks.hand = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: base("hand"),
      runningMode: "VIDEO",
      numHands: 2,
    });
  }
}

function runFrame(data) {
  const timings = {};
  const time = (id, fn) => {
    const t0 = performance.now();
    fn();
    timings[id] = performance.now() - t0;
  };
  const image = data.bitmap;
  const ts = data.timestampMs;
  try {
    if (tasks.segmenter && data.active.includes("segmenter")) {
      time("segmenter", () => tasks.segmenter.segmentForVideo(image, ts, (result) => result.close()));
    }
    if (tasks.face && data.active.includes("face")) time("face", () => tasks.face.detectForVideo(image, ts));
    if (tasks.pose && data.active.includes("pose")) time("pose", () => tasks.pose.detectForVideo(image, ts, () => {}));
    if (tasks.hand && data.active.includes("hand")) time("hand", () => tasks.hand.detectForVideo(image, ts));
  } finally {
    image.close();
  }
  return timings;
}

self.onmessage = async (event) => {
  const data = event.data;
  try {
    if (data.type === "init") {
      await init(data);
      post({ type: "ready" });
    } else if (data.type === "frame") {
      post({ type: "result", timings: runFrame(data) });
    } else if (data.type === "close") {
      Object.values(tasks).forEach((t) => t.close());
    }
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
};
