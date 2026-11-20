---
inclusion: always
---

# Product: Story Scroll Horror

## Vision
A website where the scroll is a horror story the visitor stars in. The webcam shows the visitor live, cut out from their room, over spooky scenes. Each scroll section is a chapter. The scene and the 2D costume change per chapter. Gestures trigger events. The visitor ends with a shareable movie poster.

## Stages (the app must work after each one)
1. Live person plus scroll-driven scenes (6 scenes).
2. Story chapters, costume overlays, colour and motion design.
3. Gesture reactions (raise hand lights a lantern, blink scares a ghost), with button fallbacks.
4. Poster export (PNG download and Web Share).

Specs live in `.kiro/specs/story-scroll-horror/`. Read `requirements.md` before changing behaviour.

## Privacy rule (never break)
Camera frames, photos, masks and posters never leave the browser. No uploads, no server storage, no analytics on media. Model and WASM files are static assets only.

## Hackathon constraints
- Kiroween 2026, Costume Contest category. Deadline Dec 4 2026, 2:00 PM PT.
- Public GitHub repo, MIT licence. `.kiro/` stays at the repo root and is never in `.gitignore`.
- Only original, AI-generated or licensed assets, each listed in `ASSETS.md`.
- No copyrighted music, third-party trademarks, logos or real film names.
- Public deployed URL and a public demo video under 3 minutes are required.

## Working rules
- Every feature has a camera-free fallback and a non-gesture fallback.
- Keep the text free of em dashes.
