// Copies the MediaPipe WASM runtime from node_modules into public/wasm and
// downloads the model files from the official MediaPipe model storage into
// public/models. The files are served as static assets, nothing is fetched at
// runtime from a third party. Large files are not committed (see .gitignore).
// Safe to run repeatedly: existing files are kept. Pass --force to refetch.
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const BASE = "https://storage.googleapis.com/mediapipe-models";

const models = [
  ["selfie_segmenter.tflite", `${BASE}/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite`],
  ["face_landmarker.task", `${BASE}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`],
  ["pose_landmarker_lite.task", `${BASE}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`],
  ["hand_landmarker.task", `${BASE}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`],
];

const wasmSrc = join(root, "node_modules", "@mediapipe", "tasks-vision");
// The classic bundle is used by the spike worker through importScripts.
const wasmFiles = [
  ["wasm/vision_wasm_internal.js", "vision_wasm_internal.js"],
  ["wasm/vision_wasm_internal.wasm", "vision_wasm_internal.wasm"],
  ["vision_bundle.js", "vision_bundle.js"],
];

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

await mkdir(join(root, "public", "wasm"), { recursive: true });
await mkdir(join(root, "public", "models"), { recursive: true });

for (const [from, to] of wasmFiles) {
  const dest = join(root, "public", "wasm", to);
  if (!force && (await exists(dest))) continue;
  if (!(await exists(join(wasmSrc, from)))) {
    console.error(`Missing ${from} in node_modules/@mediapipe/tasks-vision. Run npm install first.`);
    process.exit(1);
  }
  await copyFile(join(wasmSrc, from), dest);
  console.log(`copied public/wasm/${to}`);
}

for (const [name, url] of models) {
  const dest = join(root, "public", "models", name);
  if (!force && (await exists(dest))) continue;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Download failed (${res.status}) for ${url}`);
    process.exit(1);
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`downloaded public/models/${name}`);
}
