---
inclusion: always
---

# Tech stack and conventions

## Stack
- Next.js (App Router) with TypeScript in strict mode. Node 22, npm.
- MediaPipe Tasks Vision (`@mediapipe/tasks-vision`) for person segmentation, face, hand and pose landmarks. Run it client-only through dynamic import (`ssr: false` or inside `useEffect`). Never import it in server components.
- Rendering: canvas 2D (WebGL only if the performance spike requires it).
- Tests: vitest and fast-check. Playwright from Stage 1 for end-to-end checks, including the no-media-upload network test (requirement 2.3 and 20.2).
- Deploy: Vercel (public URL).

## Folder layout
```
src/
  app/                 Next.js routes and layout
  components/          UI components (client components marked "use client")
  core/                Pure logic, no browser APIs, fully testable in Node
    scroll.ts          progress to chapter mapping
    gestures.ts        gesture state machine, debounce
    poster-layout.ts   poster text layout and bounds
  content/chapters.ts  Typed chapter data (title, narration, scene, costume, palette, events)
  vision/              MediaPipe wrappers and the frame loop
  styles/tokens.css    Design tokens
public/
  scenes/ costumes/ models/ fonts/ samples/
ASSETS.md  README.md  LICENSE  .env.example
```

## Rules
- Keep `core/` free of DOM and MediaPipe imports.
- Put gesture thresholds in one config file as named constants.
- Run inference off the scroll path (Web Worker or throttled loop) and pause when the tab is hidden.
- Tests: property-based tests for scroll mapping, gesture debounce and poster layout bounds.
- Before finishing a stage run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.
- Do not add dependencies that upload data or load third-party scripts.
- Self-host fonts and all other assets. No run-time requests to third-party origins.
- Express blink limits in milliseconds (`BLINK_MIN_MS`, `BLINK_MAX_MS`), never in frames.
- Never put `.kiro` in `.gitignore`.
