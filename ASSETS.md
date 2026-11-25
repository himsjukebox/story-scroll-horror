# Assets

Every asset is original, AI-generated with terms that allow contest use, or properly licensed.

| Path | Type | Source or tool and prompt | Licence | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| public/fonts/Creepster-Regular.woff2 | Font (display) | Fontsource build of Creepster by Font Diner, from [Google Fonts](https://fonts.google.com/specimen/Creepster) | SIL OFL 1.1 (public/fonts/OFL-Creepster.txt) | 2026-11-25 | Headings only |
| public/fonts/Inter-Variable.woff2 | Font (body) | Fontsource build of Inter variable by the Inter Project Authors, from [rsms/inter](https://github.com/rsms/inter) | SIL OFL 1.1 (public/fonts/OFL-Inter.txt) | 2026-11-25 | Body text |
| public/models/selfie_segmenter.tflite | ML model, not committed, fetched by `npm run fetch-models` | [Google MediaPipe](https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite) | Apache 2.0 | 2026-11-25 | Served as static files, never loaded from a third party at runtime |
| public/models/face_landmarker.task | ML model, not committed, fetched | [Google MediaPipe](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task) | Apache 2.0 | 2026-11-25 | Served as static files, never loaded from a third party at runtime |
| public/models/pose_landmarker_lite.task | ML model, not committed, fetched | [Google MediaPipe](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task) | Apache 2.0 | 2026-11-25 | Served as static files, never loaded from a third party at runtime |
| public/models/hand_landmarker.task | ML model, not committed, fetched | [Google MediaPipe](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task) | Apache 2.0 | 2026-11-25 | Served as static files, never loaded from a third party at runtime |
| public/wasm/vision_wasm_internal.js, .wasm, vision_bundle.js | WASM runtime, not committed, copied from node_modules by `npm run fetch-models` | [@mediapipe/tasks-vision 1.2.3](https://www.npmjs.com/package/@mediapipe/tasks-vision) | Apache 2.0 | 2026-11-25 | Served as static files, never loaded from a third party at runtime |
