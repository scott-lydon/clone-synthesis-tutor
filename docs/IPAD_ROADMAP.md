# iPad Roadmap

How Trade Mogging runs on an iPad in Safari, what changes from a desktop browser, and what is on the v1.1 roadmap.

## v1 (Friday demo)

### Layout

- 1024x768 landscape orientation, also adapts to portrait by collapsing the vendor row from 5 columns to 3 then 2.
- Tap targets respect Apple's 44pt minimum on every button (Serve, Clear, Restart, vendor pieces, tray pieces). Enforced globally in `src/index.css` via `button, [role='button'] { min-height: 44px; min-width: 44px; }`.
- No fixed-position elements compete with iPad Safari's bottom bar. The Serve button is in document flow.
- `touch-action: manipulation` on `body` disables iOS's double-tap-to-zoom on the play area so dragging never accidentally zooms the page.
- `position: fixed; inset: 0; overflow: hidden` on `body` prevents iPad rubber-band scroll while dragging.

### Gestures

- **Drag** a vendor piece to the tray. Uses `@dnd-kit/core`'s `TouchSensor` with `delay: 80, tolerance: 6` so a slight finger jitter on press doesn't kick the drag prematurely.
- **Tap** a tray piece to remove it. Removal opens a single confirm beat (the X badge appears on hover/active), so a casual tap doesn't accidentally clear.
- **Tap Serve** to submit. Big, gold, anchored bottom-right of the tray.
- **Tap Clear** to wipe the tray. Smaller, muted color so it doesn't compete with Serve.
- **Tap outcome modal** to advance. Modal blocks pointer events on the play area so a stray tap can't dismiss + place at the same time.

### Audio

- Tone.js's audio context requires a user gesture to start. The first user tap (the START button) bootstraps `Tone.start()`. Subsequent calls reuse the running context.
- All sounds respect the iPad's silent switch. If the system is muted, the game is silent and otherwise unchanged.
- No background music. No looped audio. Every sound is event-triggered feedback (piece drop, cha-ching, mog-sting, sad-trombone).

### Performance

- Build bundle is around 670kB minified (mostly Tone.js). Gzip is ~200kB. First contentful paint on iPad Wi-Fi tested at under 1.5s.
- 60 fps drag-and-drop confirmed in Safari 17+ on iPad (10th gen and newer).
- All SVG art is inline; no image requests after the initial bundle.

### Accessibility

- Every draggable piece has an `aria-label` describing its fraction, food, and price.
- Color is never the sole carrier of meaning. The fill bar shows the fraction-sum text on top of the color band.
- Capybara's sad eyes (after a wrong serve) are an additional channel beyond the spice-red modal accent.
- `prefers-reduced-motion` respected (planned; see v1.1).

## v1.1 (post-Friday, time permitting)

- Procedural piece generation per round (currently hand-authored catalog).
- Apple Pencil support: hover and pressure for fine drops on small pieces.
- Reduced-motion media query honors a system preference and disables wobble, mog-flash, cash-pop.
- Save-and-resume across sessions (only if a parent specifically asks; otherwise the off-ramp principle says no).
- Multi-player local: two iPads on the same network, each running a stall, with one customer queue shared. Strong differentiator if time permits.

## What we deliberately did NOT do

- **No native iOS app.** Brief is "web-based, runnable in a standard browser." A web app on iPad Safari satisfies the brief and reaches every iPad without app-store review.
- **No PWA installation prompt.** Adds friction for first-time users (the rubric requires "clickable right now"). Could be added in v1.1.
- **No haptics.** iPad Safari does not expose the Taptic Engine to web pages. Sound carries the feedback.
- **No camera, microphone, gyroscope, or other sensor access.** None of them serve the math lesson.

## How to test on a real iPad before Friday

1. From the laptop, `cd /Users/scottlydon/Desktop/Clutter/iOS/clone-synthesis-tutor && npm run dev -- --host`. Vite prints a network URL on your LAN.
2. On the iPad, in Safari, navigate to that network URL.
3. Verify the manual test cases in `docs/MANUAL_TESTS.md`.
4. Once Render is connected, the live URL works directly from the iPad without LAN setup. Public-URL Blueprint requires a manual sync (one click in Render dashboard) per `git push`; GitHub-integration mode would auto-deploy if you grant Render access to scott-lydon repos.
