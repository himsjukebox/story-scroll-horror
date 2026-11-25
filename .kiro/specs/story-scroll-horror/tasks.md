# Implementation Plan

Tasks are ordered by stage. The app must work and be deployable at the end of every stage. Each task lists the requirements it covers. Tasks marked `*` are optional and are dropped first when the schedule is tight. Property-based tests are written next to the code they check, and each stage ends with its gate task.

Gate for every stage: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and from Task 2 on `npm run test:e2e`.

## Stage 0: Spike and scaffold (Nov 20 to 21)

- [ ] 1. Performance spike on a real mid-range phone
  - Create the Next.js app first if needed (Task 2), then add a hidden `src/app/spike/page.tsx` that runs the Image Segmenter, Face Landmarker, Pose Landmarker and Hand Landmarker in switchable combinations.
  - Show fps, ms per task and long-task count on screen. Camera needs HTTPS: deploy the spike branch as a Vercel preview, or use a temporary secure tunnel (for example Cloudflare Tunnel or localtunnel) to the laptop dev server. Do not add a tunnel tool as a project dependency.
  - Test on one phone from the last 4 years and on the dev laptop. Write numbers to `.kiro/specs/story-scroll-horror/spike-results.md` (device, browser, task combination, fps).
  - Decide worker versus main thread and which tasks run together, then update the "Which MediaPipe tasks run together" and "Open Decisions" sections of `design.md`.
  - Pass criteria are in `design.md` (Performance Spike).
  - Log the result in `.kiro/KIRO_USAGE_NOTES.md`.
  - _Requirements: 5.1, 5.2, 5.4, 19.1, open question 5_

- [ ] 2. Scaffold the project
  - [x] 2.1 Create Next.js (App Router, TypeScript strict, Node 22, npm) in the repo root without touching `.kiro/` or `LICENSE`.
    - Add scripts `lint`, `typecheck` (`tsc --noEmit`), `test` (vitest run), `test:e2e` (playwright test), `build`.
    - Add vitest, fast-check and Playwright as dev dependencies. No runtime dependency that uploads data or loads third-party scripts.
    - _Requirements: 18.2, 20.1, 20.2, 20.7_
  - [x] 2.2 Create the folder layout from `.kiro/steering/tech.md`: `src/core`, `src/content`, `src/vision`, `src/components`, `src/styles/tokens.css`, `public/{scenes,costumes,models,fonts,samples}`.
    - Declare all palette tokens and the focus ring in `tokens.css`. No hex values in components.
    - _Requirements: 9.1, 10.3_
  - [x] 2.3 Add `README.md` (description, run, test and build commands, privacy statement, licence, stage status), `ASSETS.md` (table template from `design.md`), `.env.example` (empty, with a comment), and confirm `.gitignore` does not list `.kiro`.
    - _Requirements: 17.1, 17.2, 17.3, 18.1, 18.4, 18.5_
  - [x] 2.4 Self-host fonts: download Creepster or Nosifer and Inter as WOFF2, copy the OFL licence text, load through `next/font/local`, add rows to `ASSETS.md`.
    - _Requirements: 21.4, 17.3_
  - [x] 2.5 Add security headers and CSP in `next.config.ts` as described in `design.md` (Deployment).
    - _Requirements: 2.2, 21.4_
  - [ ] 2.6 First Vercel deployment of the empty app, record the public URL in `README.md`.
    - _Requirements: 17.5_

## Stage 1: Live person with scroll-driven scenes (target Nov 22 to 24)

- [ ] 3. Core scroll logic with property-based tests
  - [ ] 3.1 Implement `src/core/scroll.ts` (`clampProgress`, `chapterIndex`, `chaptersRemaining`, `CHAPTER_COUNT`).
    - _Requirements: 4.2 to 4.6, 24.1_
  - [ ] 3.2 Write `src/core/scroll.test.ts` with fast-check for properties P1 to P4 and P16 from `design.md`.
    - Include arbitrary doubles, NaN, Infinity, negative values, and exact boundaries i/6.
    - _Requirements: 20.3_
  - [ ] 3.3 Implement `src/core/camera-state.ts` (idle, asking, live, fallback) with unit tests for every transition including "Try camera again".
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 4. Camera, privacy notice and fallback
  - [ ] 4.1 Build `PrivacyNotice`, `GhostPrompt` (real "Start camera" button, ghost art decorative) and the `/privacy` page, linked from every page.
    - Notice appears before any permission request.
    - _Requirements: 1.1, 2.5, 21.1, 23.1, 23.2_
  - [ ] 4.2 Implement `src/vision/camera.ts` (start, stop all tracks, list cameras, front camera default on mobile) and the secure-origin and feature checks.
    - _Requirements: 1.2, 1.3, 1.7, 6.2, 6.3, 19.2, 19.3_
  - [ ] 4.3 Add the sample fallback source (`src/vision/sample-source.ts`, files in `public/samples/`) and the "Try camera again" control. Record the sample's origin and consent or AI source in `ASSETS.md`.
    - _Requirements: 1.4, 1.5, 1.6, 10.5_
  - [ ] 4.4 Playwright test: camera denied leads to fallback and the story still scrolls.
    - _Requirements: 1.4, 10.5, 20.2_

- [ ] 5. Segmentation, scenes and scroll
  - [ ] 5.1 Implement `src/vision/models.ts` (dynamic import, static model and WASM from `public/`), `frame-loop.ts` (throttle, pause when hidden, adaptive quality) and the inference worker if the spike decided so.
    - _Requirements: 2.1, 2.4, 3.1, 5.2, 5.3, 5.4, 19.4_
  - [ ] 5.2 Implement `compose.ts` and `Stage`: person over the active Scene, mirror, no raw background, fit the viewport, framed cutout fallback if MediaPipe fails.
    - _Requirements: 3.2 to 3.6, 6.1, 6.4_
  - [ ] 5.3 Add the 6 placeholder Scenes (gradients and simple SVG shapes, listed in `ASSETS.md`), scroll area, scene transition of 800 ms or less, correct Scene on reload, themed loading state.
    - _Requirements: 4.1, 4.7, 4.8, 5.5_
  - [ ] 5.4 Add reduced-motion handling (cross-fade of 200 ms or less), keyboard navigation, `ErrorBoundary` with "Reload".
    - _Requirements: 6.5, 6.6, 10.4, 19.5_
  - [ ] 5.5 Playwright test for requirement 2.3: with a fake camera, record all requests and assert no request body carries media data and only static files are fetched. Add a keyboard test across the 6 Chapters.
    - _Requirements: 2.3, 10.4, 20.2_
  - [ ] 5.6 Stage 1 gate and deploy. Manual pass on the real phone (front camera, rotation). Update README stage status and `.kiro/KIRO_USAGE_NOTES.md`.
    - _Requirements: 20.7_

## Stage 2: Story, costumes, colour and motion (target Nov 25 to 27)

- [ ] 6. Chapter content and narration
  - [ ] 6.1 Write `src/content/chapters.ts` with the typed `Chapter` data for 6 Chapters (beginning, middle, end, final call to action), and a unit test for the data shape (6 entries, at most 40 words, palette tokens exist, at least 2 Chapters with events).
    - _Requirements: 4.1, 7.1, 7.3, 7.4, 11.6_
  - [ ] 6.2 Build `NarrationPanel` (semi-opaque `--ink` panel, ARIA live region announcing Chapter changes), optional name field, default hero name.
    - _Requirements: 7.2, 7.5, 7.6, 10.1, 10.2_

- [ ] 7. Asset batch (one sitting, fixed prompt template and palette)
  - [ ] 7.1 Produce the 6 Scenes (3 layers each) and replace placeholders. Record tool, terms URL and prompt for each file in `ASSETS.md`. The asset hook checks each new file.
    - _Requirements: 4.1, 17.3, 17.4_
  - [ ] 7.2 Produce 6 costume sets with anchor metadata, plus in-world art (ghost, lantern, 2 or more runes, candle) as SVG.
    - _Requirements: 8.1, 23.6_
  - [ ] 7.3 Audit `ASSETS.md`: every file under `public/` has a row, no trademarks, no copyrighted music.
    - _Requirements: 17.3, 17.4_

- [ ] 8. Costumes and anchoring
  - [ ] 8.1 Implement `src/vision/anchors.ts` (landmarks to transform, smoothing, 100 ms update, fade after 500 ms lost) and unit tests for the smoothing function.
    - _Requirements: 8.3 to 8.6_
  - [ ] 8.2 Draw behind and front pieces in the right order, swap on Chapter change with a visible transition, use precomputed landmarks in fallback mode.
    - _Requirements: 8.2, 8.7, 8.8_

- [ ] 9. Colour, motion and spooky UI
  - [ ] 9.1 Per-Chapter palette transition, colour grade, parallax layers, fog and particles, neon glow outline in the accent colour, static versions under reduced motion. Max 3 flashes per second.
    - _Requirements: 9.1 to 9.6, 10.7_
  - [ ] 9.2 Implement `src/core/quality.ts` (`trackingQuality`, `smoothQuality`, `atmosphereFor`, `hintFor`) with fast-check properties P13 and P14, then wire fog density, vignette and the text hint (ARIA polite live region) to it. Compute brightness and mask confidence in `src/vision/`.
    - _Requirements: 22.1 to 22.7_
  - [ ] 9.3 Build `Candle` (progress element with "Chapter N of 6" text, flame height from `chaptersRemaining`). Property P16 is covered in Task 3.2.
    - _Requirements: 24.1 to 24.4_
  - [ ] 9.4 Restyle the controls as in-world objects with text labels, 44 px targets, focus rings and 200 ms feedback. Check contrast with an automated axe check in Playwright.
    - _Requirements: 10.1, 10.3, 10.6, 23.1 to 23.6_
  - [ ] 9.5 Stage 2 gate and deploy. Manual phone pass. Update README and `.kiro/KIRO_USAGE_NOTES.md`.
    - _Requirements: 20.7_
  - [ ]* 9.6 Candle click jumps to the first Chapter.
    - _Requirements: 24.5_

## Stage 3: Gesture reactions (target Nov 28 to 30)

- [ ] 10. Gesture core with property-based tests
  - [ ] 10.1 Create `src/core/gesture-config.ts` with named constants (`RAISE_MARGIN`, `RAISE_HOLD_MS`, `EAR_BLINK_THRESHOLD`, `BLINK_MIN_MS`, `BLINK_MAX_MS`, `COOLDOWN_MS`).
    - _Requirements: 11.5_
  - [ ] 10.2 Implement `src/core/gestures.ts` (`stepGestures`, `resetForChapter`) using frame timestamps in milliseconds.
    - _Requirements: 11.1, 11.3, 11.7, 12.1 to 12.3, 12.6_
  - [ ] 10.3 Write `src/core/gestures.test.ts` with fast-check for P5 to P10. Generate sequences with irregular timestamps, long holds, noise, and null inputs.
    - _Requirements: 12.5, 20.4_
  - [ ] 10.4 Implement `src/core/story-events.ts` (lantern and ghost events, completion tracking, session counters) with unit tests and a property that button and gesture paths give identical state.
    - _Requirements: 11.2, 11.4, 12.4, 13.2, 25.1_

- [ ] 11. Gesture tracking, effects and fallbacks
  - [ ] 11.1 Run hand and face landmarks as decided by the spike, feed `stepGestures`, add the gestures on or off toggle that stops hand and face processing.
    - _Requirements: 11.1, 11.3, 13.6_
  - [ ] 11.2 Lantern glow and lighting change, ghost scare animation, visible feedback within 200 ms, on-screen hint per Chapter.
    - _Requirements: 11.2, 11.4, 13.4, 13.5_
  - [ ] 11.3 Build `RuneButtons`: always visible for each event of the active Chapter, enlarged with a "Tracking is off, use the runes" hint when tracking is unavailable or off.
    - _Requirements: 13.1, 13.2, 13.3, 23.1_
  - [ ] 11.4 Playwright test: pressing a rune fires the event and the effect with no camera.
    - _Requirements: 13.2, 20.2_

- [ ] 12. Stage 3 gate and deploy
  - Run the gate, test gestures on the real phone, tune thresholds in `gesture-config.ts` only, update README and `.kiro/KIRO_USAGE_NOTES.md`.
  - _Requirements: 20.7_

## Stage 4: Poster export (target Dec 1)

- [ ] 13. Poster core with property-based tests
  - [ ] 13.1 Implement `src/core/poster-layout.ts` (`layoutPoster`, `limitName`, `creditsLine`, injected `measure`), 1080 by 1620, 48 px margins.
    - _Requirements: 15.1 to 15.6, 25.2 to 25.4_
  - [ ] 13.2 Write `src/core/poster-layout.test.ts` with fast-check for P11, P12 and P15 using unicode, markup, empty and very long strings.
    - _Requirements: 15.5, 15.8, 20.5_

- [ ] 14. Capture and poster UI
  - [ ] 14.1 `LanternButton` "Take photo" in every Chapter, 3-second countdown, in-memory capture, preview with "Retake" and "Use this photo", choose among session photos, sample label in fallback mode. "Create my poster" in the final Chapter.
    - _Requirements: 14.1 to 14.7, 23.1_
  - [ ] 14.2 `PosterDialog`: canvas render using `layoutPoster`, 3 or more title and tagline options from visited Chapters, credits with name and counts, preview, Download PNG (`my-horror-story.png`), Share when supported, silent on cancel, retry smaller on failure, "Start over" clears photos, poster and counts.
    - _Requirements: 15.1 to 15.8, 16.1 to 16.7, 25.1 to 25.6_
  - [ ] 14.3 Playwright test: capture with fake camera, generate poster, download a PNG of 1080 by 1620, and confirm no network request carries it.
    - _Requirements: 2.3, 16.2, 16.5, 20.2_

- [ ] 15. Stage 4 gate and deploy
  - Run the gate, phone pass for capture and share, update README and `.kiro/KIRO_USAGE_NOTES.md`.
  - _Requirements: 20.7_

## Freeze and submission (Dec 2 to 3)

- [ ] 16. Hardening and docs (Dec 2)
  - Cross-browser smoke test (Chrome, Edge, Firefox, Safari, Chrome Android), fix blockers only.
  - Remove or hide `/spike`. Final `ASSETS.md` audit. README screenshot or GIF, supported browsers, stage status. Confirm `.kiro` is tracked and not in any `.gitignore`. Confirm no secrets.
  - Final production deploy, test the public URL on the phone over mobile data.
  - _Requirements: 17.1 to 17.5, 18.1 to 18.5, 19.1_

- [ ] 17. Demo video and Kiro write-up (Dec 2 to 3, reserve 2 to 3 days of buffer by keeping features frozen)
  - Script a demo video shorter than 3 minutes: privacy notice, live cutout, scroll through Chapters, gesture and rune, poster download, then 30 to 40 seconds on how Kiro specs, steering, hooks and property-based tests were used. Shoot on the target phone. Publish publicly.
  - Write the submission text from `.kiro/KIRO_USAGE_NOTES.md`: state the Costume Contest category, explain specs, steering, hooks, and anything else used.
  - Submit before Dec 4 2026, 2:00 PM PT, aiming for Dec 3.
  - _Requirements: 17.5 to 17.8_
