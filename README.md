# Story Scroll Horror

A website where the scroll is a horror story the visitor stars in. The webcam shows the visitor live, cut out from their room, over spooky scenes. Each scroll section is a chapter with its own scene and 2D costume. Gestures trigger events, and the visitor ends with a shareable movie poster.

Built for Kiroween 2026, Costume Contest category.

## Run

Requires Node 22 and npm.

```bash
npm install
npm run dev        # http://localhost:3000 (first run downloads MediaPipe models, about 17 MB)
```

No environment variables are needed (see `.env.example`).

## Test and build

```bash
npm run lint
npm run typecheck
npm test           # vitest and fast-check
npm run build
npm run test:e2e   # Playwright (run `npx playwright install chromium` once)
```

## Privacy

Camera frames, photos, masks and posters never leave your browser. There are no uploads, no server storage and no analytics on media. Model and WASM files are static assets served from this site. Fonts are self-hosted.

## Camera fallback

If the camera is denied or missing, the story runs with a sample person and every gesture has a button alternative. (Planned for Stages 1 and 3.)

## Stage status

| Stage | Goal | Status |
| --- | --- | --- |
| 0 | Scaffold and performance spike | Scaffold done, spike pending |
| 1 | Live person plus scroll-driven scenes | Not started |
| 2 | Story chapters, costumes, colour and motion | Not started |
| 3 | Gesture reactions with button fallbacks | Not started |
| 4 | Poster export (PNG and Web Share) | Not started |

Public URL: to be added after the first Vercel deployment.

## Assets

Every asset and its licence is listed in [ASSETS.md](ASSETS.md).

## Licence

MIT, see [LICENSE](LICENSE). Fonts are under the SIL Open Font License, copies in `public/fonts/`.
