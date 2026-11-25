# Performance spike results (Task 1)

## Status: NOT MEASURED ON A PHONE

| Check | Status |
| --- | --- |
| Mid-range phone (last 4 years), segmenter plus face, at least 15 fps composite | **NOT MEASURED** |
| Dev laptop, segmenter alone, at least 24 fps | **NOT MEASURED** (only a sandbox smoke run exists, see below) |
| Worker versus main thread decision | **NOT DECIDED** |
| Which tasks run together | **NOT DECIDED**. The default plan in `design.md` stands |

No device numbers exist yet. Do not copy the sandbox smoke numbers into `design.md`. Task 1 in `tasks.md` stays unchecked until the phone and laptop rows below are filled in from real runs.

## What was built

- `/spike` page (`src/app/spike/page.tsx`, `src/vision/spike/`). Not linked, `noindex`.
- Toggles for the segmenter, face, pose and hand tasks. Main thread or Web Worker (`public/spike-worker.js`). GPU or CPU delegate. Every frame or the design cadence (face every 2nd, pose every 3rd, hand every 2nd frame). Camera resolution 320x240, 640x480 or 1280x720.
- Shows fps, ms per task (average, p95, max over the last 120 samples), whole loop time and main thread long tasks (`PerformanceObserver` `longtask`, not reported by Safari).
- Pauses when the tab is hidden. Stops camera tracks on Stop, `pagehide` and unmount. No uploads.
- Result buttons produce a markdown row or JSON to paste below.

## How to run it on a phone

The camera needs HTTPS. Use one of these. Neither is a project dependency.

1. Vercel preview (preferred, also tests real hosting). Push the branch, open the preview URL on the phone, add `/spike`. The build downloads the models through `npm run fetch-models` (runs before `build`).
2. Temporary tunnel to the laptop. Run `npm run build && npm run start`, then in another terminal run a tunnel for the local web server (for example `npx localtunnel --port 3000` or `cloudflared tunnel --url http://localhost:3000`). Open the HTTPS URL it prints, add `/spike`. Stop the tunnel afterwards. Do not keep the tunnel tool in `package.json`.

Use a production build (`npm run start`), not `npm run dev`, because dev mode adds overhead.

Steps on each device:

1. Close other tabs and apps. Turn off battery saver and note if the phone is warm.
2. Type the device and browser into "Device and browser".
3. Pick a combination, press "Start camera and tasks", allow the camera, and wait 30 seconds.
4. Press "Reset numbers" once, wait 30 more seconds, press "Markdown row", then "Copy". Paste the row in the table below.
5. Press Stop before changing options. Repeat for each combination.

Combinations to run on the phone and on the laptop (640x480 first, then 320x240 if below target):

| # | Tasks | Mode | Delegate | Cadence |
| --- | --- | --- | --- | --- |
| 1 | segmenter | main | GPU | every frame |
| 2 | segmenter | worker | GPU | every frame |
| 3 | segmenter + face | main | GPU | design |
| 4 | segmenter + face | worker | GPU | design |
| 5 | segmenter + face + pose | worker | GPU | design |
| 6 | segmenter + face + pose + hand | worker | GPU | design |
| 7 | row 3 or 4, whichever was better | same | CPU | design |

Also note whether the video preview stays smooth and whether the page stays responsive to touch while it runs.

## Pass criteria (from `design.md`)

- Laptop: segmentation alone at 24 fps or more.
- Phone: at least 15 fps composite with segmentation plus face.
- If not met, apply the fallback plan in `design.md` (fewer tasks, lower resolution, every Nth frame), then record the final choice.

## Results

Paste rows from the page here. Leave the table empty until a real run exists.

| Device and browser | Mode | Delegate | Cadence | Camera | Tasks | fps | ms per task (avg/p95) | Long tasks | Run |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| _no phone run yet_ | | | | | | | | | |
| _no laptop run yet_ | | | | | | | | | |

## Sandbox smoke run (not a device measurement)

Date: 2026-11-25. Environment: headless Chromium in the build sandbox, fake camera feed (Chromium test pattern), CPU delegate, 320x240, segmenter only, run through `npm run test:e2e` (`e2e/spike.spec.ts`). Each run collected samples for about 1 to 2 seconds.

What it shows: the page loads, models and WASM are served from this origin, the worker mode works, both modes produce samples, and no request leaves the origin.

What it does not show: any phone or laptop performance. The numbers printed by the test (about 20 fps, about 17 ms average, p95 about 90 ms) come from a shared virtual machine, a synthetic video and a very short window. They are recorded here only so nobody mistakes them for results. Do not use them for decisions.

## Findings so far

- With the main-thread runner, MediaPipe tries to send usage telemetry to `https://odml.pa.googleapis.com/v1/log`. The CSP (`connect-src 'self'`) blocks it. Keep that CSP. This supports the privacy rule in `product.md`. The worker run showed no such message.
- The existing CSP already allows what the spike needs (`worker-src 'self' blob:` and `'wasm-unsafe-eval'`), so `next.config.ts` was not changed.
- Models and WASM (about 32 MB) are not committed. `npm run fetch-models` copies the WASM from `node_modules` and downloads the models from the official MediaPipe storage. It runs before `dev` and `build`.

## Decision (fill in after the device runs)

- Worker or main thread: ____
- Tasks that run together, per Chapter: ____
- Default quality levels: ____
- Then update "Which MediaPipe tasks run together" and "Open Decisions" in `design.md`.
