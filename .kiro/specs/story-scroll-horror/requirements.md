# Requirements Document

## Introduction

Story Scroll Horror is a website where the scroll is a horror story the visitor stars in. The visitor's webcam shows them live on the home page. The person is cut out of the camera feed in the browser and placed in front of a spooky background. Each scroll section is a chapter. When the visitor scrolls, the background and the 2D costume change to fit the chapter (graveyard, haunted mansion, witch's forest, and others). Gestures trigger story events, for example raising a hand to light a lantern or blinking to scare a ghost. At the end the visitor receives a shareable movie poster of their own horror story.

The design uses a colourful neon Halloween look (neon orange, purple, green, magenta) with motion that gives each chapter a strong visual impact.

Hackathon target: Kiroween 2026, Costume Contest category. Submission deadline is Dec 4 2026, 2:00 PM PT.

Defaults agreed for this project:

- Next.js website (App Router, TypeScript)
- Person segmentation in the browser with MediaPipe, no video leaves the device
- 2D costume overlays
- 6 scenes
- Neon Halloween colours
- Photo capture for the poster

### Staged delivery plan

The app must work at the end of every stage.

| Stage | Outcome | Requirements |
| --- | --- | --- |
| 1 | Live person with scroll-driven scenes | 1 to 6 |
| 2 | Story chapters, costumes, colour and motion design | 7 to 10, 22 to 24 |
| 3 | Gesture reactions | 11 to 13 |
| 4 | Poster export | 14 to 16, 25 |
| All | Non-functional and hackathon requirements | 17 to 21 |

Requirements 22 to 25 make the spooky design do real work in the interface (Costume Contest rule: spooky design elements must enhance the app's function). They are numbered after the others to keep earlier references stable.

## Glossary

- **Chapter**: One section of the scroll story, with a title, narration text, a Scene, a Costume overlay and a palette.
- **Scene**: A full-screen background (image layers, fog, particles) shown behind the visitor. There are 6 Scenes, one per Chapter.
- **Costume overlay**: A 2D image (hat, cape, mask and similar) drawn over the visitor and anchored to face or pose landmarks.
- **Segmentation mask**: A per-pixel mask from MediaPipe that separates the person from the camera background.
- **Gesture**: A visitor action detected by MediaPipe, such as a raised hand or a blink.
- **Poster**: A client-generated PNG movie poster built from a captured photo of the visitor, the chosen Costume overlay and Scene, a title, a tagline and credits.
- **System**: The Story Scroll Horror web application running in the visitor's browser.
- **Visitor**: The person using the website.

## Stage 1: Live person with scroll-driven scenes

### Requirement 1

**User Story:** As a visitor, I want a clear and safe way to give camera access, so that I can see myself in the story and understand what happens to my video.

#### Acceptance Criteria

1. WHEN the home page loads THEN the System SHALL show a short privacy notice and a "Start camera" button before requesting camera permission.
2. WHEN the visitor activates "Start camera" THEN the System SHALL request camera access through the browser permission prompt.
3. WHEN the visitor grants permission THEN the System SHALL show the live camera feed within 3 seconds on a mid-range laptop.
4. IF the visitor denies permission, or no camera is available, THEN the System SHALL show an explanation and switch to a fallback mode that uses a bundled sample still or sample video of a person.
5. WHEN the System is in fallback mode THEN the System SHALL provide a "Try camera again" control that repeats the permission request.
6. IF the camera is in use by another application or fails during use, THEN the System SHALL show an error message and switch to fallback mode without a page reload.
7. WHEN the visitor leaves the page or stops the camera THEN the System SHALL stop all camera tracks.

### Requirement 2

**User Story:** As a privacy-conscious visitor, I want my video to stay on my device, so that I can use the site without worrying about uploads.

#### Acceptance Criteria

1. THE System SHALL run all person segmentation, gesture detection and poster generation in the visitor's browser.
2. THE System SHALL NOT send camera frames, captured photos, segmentation masks or Posters to any server.
3. WHEN the System is in use THEN the System SHALL make no network request whose body contains media data (verifiable in browser dev tools and by an automated test that records network requests).
4. THE System SHALL load MediaPipe model and WASM files as static assets that are either bundled with the site or fetched as read-only files, with no visitor data in the request.
5. THE System SHALL show a privacy notice that states that video does not leave the device.

### Requirement 3

**User Story:** As a visitor, I want to see only myself, cut out from my room, on the home page, so that the spooky background looks like I am really there.

#### Acceptance Criteria

1. WHEN the camera feed is active THEN the System SHALL run MediaPipe person segmentation (Image Segmenter or selfie segmentation) on each processed frame in the browser.
2. WHEN a Segmentation mask is available THEN the System SHALL composite the person over the active Scene so that camera background pixels are not visible.
3. WHEN the visitor is not detected in a frame THEN the System SHALL show the Scene without a person and SHALL NOT show the raw camera background.
4. IF MediaPipe fails to load or initialise THEN the System SHALL show a notice and fall back to showing the visitor in a framed cutout box over the Scene.
5. WHEN the front camera is used THEN the System SHALL mirror the composite so it behaves like a mirror.
6. THE System SHALL keep the composite within the visible viewport at any window size, preserving the camera aspect ratio.

### Requirement 4

**User Story:** As a visitor, I want the scenery to change as I scroll, so that I move through different spooky places.

#### Acceptance Criteria

1. THE System SHALL provide exactly 6 Scenes: graveyard, haunted mansion, witch's forest, pumpkin patch, crypt and catacombs, and midnight moonlit sky.
2. THE System SHALL divide the scrollable page into 6 consecutive Chapters, one per Scene, in a fixed order.
3. THE System SHALL define the chapter boundaries as fractions of total scroll progress, where Chapter i (0-indexed) covers the range from i/6 inclusive to (i+1)/6 exclusive, and the last Chapter also includes progress 1.0.
4. WHEN the scroll position changes THEN the System SHALL map the scroll progress to exactly one Chapter.
5. WHEN scroll progress increases THEN the mapped Chapter index SHALL NOT decrease (the mapping is monotonic non-decreasing).
6. IF scroll progress is outside 0 to 1 (for example from overscroll bounce) THEN the System SHALL clamp it to the range 0 to 1 before mapping.
7. WHEN the mapped Chapter changes THEN the System SHALL switch to the new Scene with a transition no longer than 800 ms.
8. WHEN the visitor reloads the page at any scroll position THEN the System SHALL show the Scene for that position without a visible flash of another Scene.

### Requirement 5

**User Story:** As a visitor on any device, I want the site to run smoothly, so that the experience feels live.

#### Acceptance Criteria

1. WHEN the System runs on a mid-range laptop (4 cores, integrated GPU, 2020 or later) THEN the System SHALL keep the composite at 24 frames per second or more on average.
2. WHEN the measured frame rate stays below 20 frames per second for 3 seconds THEN the System SHALL reduce segmentation frequency or resolution and particle count to recover.
3. WHEN the page tab is hidden THEN the System SHALL pause segmentation and rendering.
4. THE System SHALL run model inference off the main scroll path so that scrolling remains responsive (no scroll input delay above 100 ms).
5. WHEN assets are loading THEN the System SHALL show a themed loading state and SHALL show the first Scene within 4 seconds on a typical broadband connection.

### Requirement 6

**User Story:** As a mobile visitor, I want the site to work on my phone, so that I can use my front camera.

#### Acceptance Criteria

1. THE System SHALL provide a responsive layout that works from 320 px to 2560 px viewport width in portrait and landscape.
2. WHEN the visitor uses a mobile device THEN the System SHALL request the front-facing camera by default.
3. WHEN the device has more than one camera THEN the System SHALL provide a control to switch cameras.
4. WHEN the device orientation changes THEN the System SHALL resize the composite without restarting the camera.
5. WHEN the visitor's operating system has prefers-reduced-motion enabled THEN the System SHALL disable parallax, particle animation and flashing effects, and SHALL replace Scene transitions with a simple cross-fade of 200 ms or less.
6. THE System SHALL support scrolling with touch, mouse wheel, keyboard and assistive technology.

## Stage 2: Story chapters, costumes, colour and motion

### Requirement 7

**User Story:** As a visitor, I want each chapter to tell a short part of a horror story, so that scrolling feels like a plot and not a slide show.

#### Acceptance Criteria

1. THE System SHALL provide, for each of the 6 Chapters, a title and narration text of at most 40 words.
2. WHEN a Chapter becomes active THEN the System SHALL display its title and narration text on screen.
3. THE System SHALL order the Chapters as a story with a beginning (arrival), middle (trials) and end (escape or victory) that finishes at a final call to action to create the Poster.
4. THE System SHALL store Chapter content (title, narration, Scene, Costume overlay, palette) in a typed data file separate from components so content can change without code changes elsewhere.
5. WHEN the visitor enters a name in an optional name field THEN the System SHALL insert it into the narration where the story refers to the hero.
6. IF the visitor leaves the name empty THEN the System SHALL use a default hero name.

### Requirement 8

**User Story:** As a visitor, I want my costume to change with the scene, so that I look like I belong in each place.

#### Acceptance Criteria

1. THE System SHALL provide one 2D Costume overlay set per Chapter, made of at least one piece (for example hat, cape, mask or collar).
2. WHEN the Chapter changes THEN the System SHALL swap to that Chapter's Costume overlay with a visible transition.
3. WHEN face landmarks are detected THEN the System SHALL anchor head pieces (hat, mask) to the face using landmark position, scale and roll angle.
4. WHEN pose landmarks are detected THEN the System SHALL anchor body pieces (cape, collar) to the shoulders using landmark position and scale.
5. WHEN the visitor moves, THEN the System SHALL update overlay position within 100 ms of the landmark update and apply smoothing so that overlays do not jitter.
6. IF landmarks are lost for more than 500 ms THEN the System SHALL fade out the overlays and SHALL fade them back in when landmarks return.
7. WHEN the System is in fallback mode with a sample person THEN the System SHALL anchor the overlays using precomputed landmark data for the sample.
8. THE System SHALL draw overlays in the correct order relative to the person (for example, a cape behind the shoulders and a hat in front of the hair).

### Requirement 9

**User Story:** As a visitor, I want a bold and colourful look, so that the experience feels fun and not grim.

#### Acceptance Criteria

1. THE System SHALL define one neon palette per Chapter built from neon orange, purple, green and magenta tokens declared in the design system.
2. WHEN the Chapter changes THEN the System SHALL transition the UI accent colours and a colour grade on the Scene to the new Chapter palette.
3. THE System SHALL provide motion design for each Scene that includes at least parallax layers, fog and particles (for example bats, embers, fireflies).
4. WHEN the visitor scrolls THEN the System SHALL move the parallax layers at different speeds in proportion to scroll progress.
5. THE System SHALL draw a neon glow outline around the person cutout in the active Chapter's accent colour.
6. WHEN reduced motion is enabled THEN the System SHALL show static versions of the effects in this requirement, as defined in Requirement 6.

### Requirement 10

**User Story:** As a visitor with accessibility needs, I want to follow the story without a camera, without a mouse and with readable text, so that everyone can enjoy it.

#### Acceptance Criteria

1. THE System SHALL provide text on all narration and UI with a contrast ratio of at least 4.5:1 against its background (3:1 for large text), including text shown over neon Scenes.
2. THE System SHALL show narration as on-screen captions in a text panel that is also exposed to screen readers through an ARIA live region that announces Chapter changes.
3. THE System SHALL allow all controls (start camera, switch camera, name field, fallback buttons, download, share) to be operated by keyboard with visible focus indicators.
4. WHEN the visitor presses the keyboard keys Page Down, Page Up, Home, End or the arrow keys THEN the System SHALL scroll between Chapters.
5. THE System SHALL provide a complete experience without a camera, using the fallback sample from Requirement 1.
6. THE System SHALL provide text alternatives for non-decorative images and mark decorative layers as hidden from assistive technology.
7. THE System SHALL NOT include flashing effects that flash more than 3 times per second.

### Requirement 22

**User Story:** As a visitor, I want the atmosphere to tell me when the camera cannot see me well, so that I know how to fix my position or lighting without reading an error message.

#### Acceptance Criteria

1. THE System SHALL compute a tracking quality value between 0 and 1 from segmentation mask confidence, person coverage of the frame, and average frame brightness, as a pure function in `core/`.
2. WHEN the tracking quality falls, THEN the System SHALL thicken the fog layer and narrow the vignette in proportion to the drop, and WHEN it recovers THEN the System SHALL thin the fog and widen the vignette again.
3. WHEN the tracking quality stays below `QUALITY_LOW` for at least 2 seconds THEN the System SHALL show a plain text hint that names the likely cause (for example "Too dark, turn on a light", "Step back so the ghosts can see you", "Move to the middle of the frame").
4. THE System SHALL smooth the tracking quality over time so that fog and vignette change gradually and do not flash (Requirement 10.7).
5. WHEN reduced motion is enabled THEN the System SHALL change fog and vignette in a single step of no more than 200 ms, and SHALL still show the text hint.
6. THE text hint SHALL be exposed through an ARIA live region with polite priority, so that the guidance does not depend on seeing the fog.
7. FOR ANY quality value outside 0 to 1, or any NaN input, THE quality function SHALL return a value inside 0 to 1 (verifiable by a property-based test).

### Requirement 23

**User Story:** As a visitor, I want the controls to belong to the haunted world, so that the interface is part of the story and still easy to use.

#### Acceptance Criteria

1. THE System SHALL present these controls as in-world objects: the permission prompt as a ghost asking to see the visitor, the "Take photo" control as a lantern, the gesture fallback buttons as glowing runes, and the chapter progress as a candle (Requirement 24).
2. THE System SHALL give each in-world control a visible plain text label, an accessible name, a native button or equivalent role, keyboard access, and a visible focus ring (2 px, `--neon-magenta`), so that the theme never replaces the label.
3. THE System SHALL keep every in-world control at least 44 by 44 CSS px.
4. WHEN the visitor activates an in-world control THEN the System SHALL show feedback within 200 ms (glow or a short animation), and the feedback SHALL be limited as in Requirement 10.7.
5. WHEN reduced motion is enabled THEN the System SHALL show the in-world controls without animation.
6. THE ghost, lantern and rune art SHALL be original or licensed assets listed in `ASSETS.md`, and SHALL be marked `aria-hidden="true"` where decorative while the text label carries the meaning.

### Requirement 24

**User Story:** As a visitor, I want to see how far I am in the story, so that I know how many chapters remain.

#### Acceptance Criteria

1. THE System SHALL show a candle whose flame height or remaining wax length reflects the number of Chapters remaining (6 at the start, 1 at the final Chapter), derived from the Chapter index in Requirement 4.
2. THE System SHALL expose the same information as text and as an accessible progressbar value (for example "Chapter 3 of 6").
3. WHEN the Chapter changes THEN the System SHALL update the candle within the 800 ms transition limit of Requirement 4.7.
4. WHEN reduced motion is enabled THEN the System SHALL not animate the flame.
5. WHEN the visitor activates the candle THEN the System MAY jump to the start of the Chapter list; this behaviour is optional and SHALL be dropped first if the schedule is tight.

## Stage 3: Gesture reactions

### Requirement 11

**User Story:** As a visitor, I want my movements to trigger story events, so that I feel part of the story.

#### Acceptance Criteria

1. WHEN hand landmarks show a hand raised above the visitor's shoulder line for at least 300 ms THEN the System SHALL fire a "raise hand" event.
2. WHEN a "raise hand" event fires in a Chapter that has a lantern event THEN the System SHALL light a lantern with a glow effect and a change in the Scene lighting.
3. WHEN face landmarks show a blink (eye aspect ratio below the blink threshold for a continuous time of at least `BLINK_MIN_MS` and at most `BLINK_MAX_MS`, then back above it, with default values of 60 ms and 400 ms) THEN the System SHALL fire a "blink" event.
4. WHEN a "blink" event fires in a Chapter that has a ghost event THEN the System SHALL play a scare animation in which a ghost flees.
5. THE System SHALL define Gesture thresholds (raise height margin, eye aspect ratio, minimum and maximum duration) as named constants in one configuration file.
6. THE System SHALL assign each Chapter zero or more Gesture events in the Chapter data file, and at least 2 Chapters SHALL have a Gesture event.
7. WHEN no hand or face is detected THEN the System SHALL NOT fire Gesture events.

### Requirement 12

**User Story:** As a visitor, I want each gesture to count once and not trigger by accident, so that the events feel deliberate.

#### Acceptance Criteria

1. WHEN a Gesture is held continuously THEN the System SHALL fire exactly one event for that hold until the Gesture is released.
2. WHEN a Gesture event fires THEN the System SHALL ignore the same Gesture for a cooldown of at least 1000 ms (debounce).
3. WHEN the Chapter changes THEN the System SHALL reset the Gesture state for the new Chapter and SHALL NOT carry over a held Gesture from the previous Chapter.
4. WHEN a one-time story event (for example lighting the lantern) has been completed in a Chapter THEN the System SHALL NOT repeat it unless the visitor leaves and re-enters the Chapter.
5. FOR ANY sequence of frames, the number of events fired SHALL be less than or equal to the number of distinct Gesture onsets in the sequence (verifiable by a property-based test).
6. WHEN the time the eye aspect ratio stays below the threshold is shorter than `BLINK_MIN_MS` or longer than `BLINK_MAX_MS`, measured with frame timestamps and not frame counts so that the limit holds when the frame rate varies (Requirement 5.2), THEN the System SHALL NOT count it as a "blink" event, so that natural noise and eye closing are ignored.

### Requirement 13

**User Story:** As a visitor who cannot or does not want to gesture, I want another way to trigger events, so that I do not miss part of the story.

#### Acceptance Criteria

1. THE System SHALL show a labelled button for each Gesture event available in the active Chapter (for example "Light the lantern", "Scare the ghost").
2. WHEN the visitor activates a fallback button THEN the System SHALL fire the same event and visual effect as the matching Gesture.
3. THE System SHALL show the fallback buttons in every mode, whether tracking is working or not, so that no visitor needs a Gesture. WHEN the System is in fallback mode, or when hand or face tracking is unavailable or switched off, THEN the System SHALL also mark the buttons as the primary way to trigger events (larger size and a text hint such as "Tracking is off, use the runes").
4. WHEN a Gesture event fires THEN the System SHALL show visible feedback (glow, animation and a short text hint) within 200 ms.
5. WHEN a Chapter has a Gesture event THEN the System SHALL show a short on-screen hint telling the visitor which Gesture to try.
6. THE System SHALL allow the visitor to turn Gesture detection off, and WHEN it is off THEN the System SHALL stop hand and face event processing.

## Stage 4: Poster export

### Requirement 14

**User Story:** As a visitor, I want to capture a photo of myself in my story, so that the poster shows my own costume and scene.

#### Acceptance Criteria

1. WHEN the visitor reaches the final Chapter THEN the System SHALL show a "Create my poster" call to action.
2. THE System SHALL also provide a "Take photo" control that is available in every Chapter.
3. WHEN the visitor activates "Take photo" THEN the System SHALL capture the current composite (person, Costume overlay and Scene) as a still image in memory after a visible 3-second countdown.
4. WHEN a photo is captured THEN the System SHALL show a preview with "Retake" and "Use this photo" controls.
5. WHEN the visitor chooses a captured photo THEN the System SHALL allow the visitor to select which of the captured photos from this session is used on the Poster.
6. WHEN the System is in fallback mode THEN the System SHALL use the sample person for the photo and SHALL label the Poster as a sample.
7. WHEN the visitor reloads or closes the page THEN the System SHALL discard captured photos (they are kept in memory only).

### Requirement 15

**User Story:** As a visitor, I want a movie poster of my horror story, so that I can keep it and share it.

#### Acceptance Criteria

1. WHEN the visitor requests a Poster THEN the System SHALL generate it in the browser on a canvas at 1080 by 1620 px (2:3 ratio).
2. THE System SHALL compose the Poster from the selected photo, a title, a tagline, and a credits block that includes the visitor-chosen name.
3. WHEN the visitor does not enter a name THEN the System SHALL use the default hero name in the credits.
4. WHEN the visitor enters a name longer than 24 characters THEN the System SHALL limit it to 24 characters.
5. THE System SHALL lay out all Poster text inside the canvas safe margins (at least 48 px from every edge) and SHALL shrink or wrap text so no text is clipped (verifiable by a property-based test on layout bounds for arbitrary names and titles).
6. THE System SHALL let the visitor choose from at least 3 generated title and tagline options based on the visited Chapters.
7. THE System SHALL use only original, AI-generated or licensed fonts, images and text on the Poster, with no third-party trademarks, studio logos or real film titles.
8. THE System SHALL render the Poster text through canvas text drawing, with escaped or plain text only, so that a name containing markup or special characters is shown as literal text.

### Requirement 16

**User Story:** As a visitor, I want to download or share my poster, so that I can post it with friends.

#### Acceptance Criteria

1. WHEN the Poster is ready THEN the System SHALL show a preview of the final image.
2. WHEN the visitor activates "Download" THEN the System SHALL save the Poster as a PNG file with a name like `my-horror-story.png`.
3. WHEN the browser supports the Web Share API with files THEN the System SHALL show a "Share" control that shares the PNG through the native share sheet.
4. IF the Web Share API is not available or is cancelled by the visitor THEN the System SHALL keep the Download control available and SHALL NOT show an error for a cancelled share.
5. THE System SHALL generate and export the Poster without uploading it anywhere.
6. WHEN the visitor activates "Start over" THEN the System SHALL clear captured photos and the Poster and return to the first Chapter.
7. WHEN canvas export fails (for example for low memory) THEN the System SHALL show an error message and offer to retry at a smaller size.

### Requirement 25

**User Story:** As a visitor, I want my poster to record what happened in my story, so that it is unique to my play-through.

#### Acceptance Criteria

1. THE System SHALL count, in memory for the session only, the Costume overlays worn (distinct Chapters visited), the ghosts scared and the lanterns lit, whether triggered by a Gesture or by a fallback button.
2. WHEN the Poster is generated THEN the System SHALL include a credits line built from these counts (for example "3 ghosts scared, 2 lanterns lit, 6 costumes worn").
3. WHEN a count is 0 THEN the System SHALL leave that item out of the credits line, and WHEN all counts are 0 THEN the System SHALL show a neutral line such as "A quiet night".
4. THE System SHALL fit the credits line inside the safe margins of Requirement 15.5, including for large counts.
5. WHEN the visitor activates "Start over" THEN the System SHALL reset the counts.
6. THE counts SHALL NOT be stored in cookies, local storage or sent to any server.

## Non-functional and hackathon requirements

### Requirement 17

**User Story:** As a hackathon judge, I want the project to follow the contest rules, so that it is eligible for the Costume Contest category.

#### Acceptance Criteria

1. THE repository SHALL be public on GitHub and SHALL include an open source licence file (MIT) at the repository root that GitHub detects.
2. THE repository SHALL contain a `.kiro` directory at the repository root with specs, steering and hooks, and the `.kiro` directory SHALL NOT be listed in `.gitignore`.
3. THE project SHALL use only original, AI-generated or properly licensed assets, and SHALL list every asset, its source and its licence in `ASSETS.md`.
4. THE project SHALL NOT include copyrighted music, third-party trademarks or logos, or real film or character names.
5. THE project SHALL be deployed at a public URL (for example on Vercel) that works without login and is free to use for judging.
6. THE project SHALL have a demo video that is shorter than 3 minutes, with the video showing the app working and its use of Kiro, and posted publicly.
7. THE project SHALL only contain work started on or after Oct 30 2026, and the submission SHALL be made before Dec 4 2026, 2:00 PM PT.
8. THE submission text SHALL state the Costume Contest category and explain how Kiro specs, steering and hooks were used.

### Requirement 18

**User Story:** As a developer or judge, I want clear documentation, so that I can run and understand the project.

#### Acceptance Criteria

1. THE repository SHALL include a README with a description, a screenshot or GIF, the install, run, test and build commands, the list of supported browsers, the privacy statement, and the licence.
2. WHEN a developer follows the README on a machine with Node 22 and npm THEN the project SHALL start with `npm install` and `npm run dev` with no extra manual steps.
3. THE README SHALL list the stage status (stages 1 to 4) and how to use the camera fallback.
4. THE repository SHALL document environment variables in `.env.example`, and the app SHALL work with no environment variables set.
5. THE repository SHALL NOT contain secrets.

### Requirement 19

**User Story:** As a visitor, I want the site to work in my browser, so that I do not need to install anything.

#### Acceptance Criteria

1. THE System SHALL support the latest two stable versions of Chrome, Edge, Firefox and Safari (macOS and iOS), and Chrome on Android.
2. WHEN a browser lacks a required feature (getUserMedia, WebAssembly, or canvas) THEN the System SHALL show a clear unsupported message and the non-camera experience where possible.
3. WHEN the page is served over a non-secure origin other than localhost THEN the System SHALL explain that camera access needs HTTPS.
4. THE System SHALL load MediaPipe only in the browser, through dynamic import, and SHALL NOT break server rendering of the page.
5. WHEN JavaScript throws an unexpected error in the visual pipeline THEN the System SHALL show an error boundary with a "Reload" control and SHALL keep the rest of the page text readable.

### Requirement 20

**User Story:** As a developer, I want the core logic to be well tested, so that regressions are caught early.

#### Acceptance Criteria

1. THE project SHALL provide unit tests with vitest and property-based tests with fast-check, runnable with `npm test`.
2. THE project SHALL provide end-to-end tests with Playwright, runnable with `npm run test:e2e`, that include a network test for Requirement 2.3 (record all requests during a session with a fake camera and assert that no request body contains media data and that only static model, WASM, font and image files are fetched). Playwright is added in Stage 1, with Chromium's fake media stream flags for camera input.
3. THE project SHALL include property-based tests for scroll-to-Chapter mapping (exactly one Chapter per progress value, monotonic, clamped, boundaries from Requirement 4).
4. THE project SHALL include property-based tests for Gesture debounce (at most one event per onset, cooldown respected, blink duration limits in milliseconds from Requirement 12, including sequences with irregular frame timestamps).
5. THE project SHALL include property-based tests for Poster layout bounds (all text inside safe margins for arbitrary names and titles from Requirement 15).
6. THE project SHALL keep the core logic (scroll mapping, Gesture state machine, Poster layout) as pure functions in modules that do not import browser APIs, so that the logic can be tested in Node.
7. THE project SHALL pass `npm run lint`, `npm run typecheck` and `npm run build` with no errors before each stage is declared complete.

### Requirement 21

**User Story:** As a visitor, I want a clear notice about how my data is handled, so that I can trust the site.

#### Acceptance Criteria

1. THE System SHALL provide a privacy notice that is reachable from every page and states that camera video is processed only on the device and is not stored or sent.
2. THE System SHALL NOT use cookies or local storage to store camera frames or photos.
3. WHEN the System uses analytics THEN the System SHALL use only analytics that collect no camera or photo data and SHALL list them in the privacy notice (analytics are optional and off by default).
4. THE System SHALL NOT load third-party scripts that receive visitor media or identifiers, other than static asset hosting. Fonts SHALL be self-hosted (for example through `next/font/local` or files in `public/fonts/`), and the System SHALL NOT request fonts or other assets from Google Fonts or any other third-party origin at run time.

## Out of scope

- Short video clip export of the story (possible stretch goal after Stage 4)
- User accounts, login or profiles
- Server storage, databases or any upload of photos or posters
- 3D costumes or 3D scenes
- Multi-person scenes
- Native mobile apps (the site is a responsive web app)
- Audio and music (if added later, it must be original or licensed and must be muted by default)

## Open questions

1. Which hosting target should be used for the public URL (Vercel is the default assumption)?
2. Which tool will create the 6 Scene images and Costume overlays (AI image generation or hand-drawn), and where will its licence terms be recorded in `ASSETS.md`?
3. Should the sample fallback be a still image or a short looping video of a person, and who is the licensed model?
4. Should narration be spoken (text-to-speech) as an option, or captions only?
5. Which MediaPipe tasks run together on one frame (segmentation, face landmarks, hands, pose), and what is the combined cost on a mid-range laptop? A spike in Stage 1 should measure this before Stage 2 begins.
6. Is a short clip export worth attempting after Stage 4 if time remains?
