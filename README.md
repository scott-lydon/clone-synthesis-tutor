# Boxy

A single-player iPad-browser block puzzle that teaches fraction equivalence to a third grader.

The Gauntlet G5 Week 4 hiring-partner submission for Superbuilders.

## What it is

The kid drags fraction-rectangle pieces onto a board. Each colored edge on the board carries a fraction rule (e.g., `BLUE = 1/2`). When the kid's piece touches a colored edge, the cell count where they touch must satisfy the rule applied to the colored edge's cell count.

Equivalence is the strategy: multiple pieces from the hand can satisfy the same rule, and combining smaller pieces also works (two 1-cell touches sum to 2 cells, the same as one 2-cell touch).

The kid decides when to submit. Score is empty cells (lower better) plus a small bonus for using every piece in hand.

## Why it teaches

Built on Engelmann's Direct Instruction principle that every detail of instruction must be controlled to minimize misinterpretation, and Patrick Skinner's cognitive-load framework that competence is the only reward worth engineering for. Every animation clarifies. There is no decorative reward. The lesson ends. The kid leaves the screen.

See [`docs/BOXY_SPEC.md`](docs/BOXY_SPEC.md) for the full game and architecture spec.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints). Tested in Safari on iPad.

## Build for production

```bash
npm run build
npm run preview
```

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 3
- `@dnd-kit/core` for touch-first drag-and-drop
- XState 5 for game state
- Framer Motion 11 for animation
- Tone.js 14 for audio
- Vercel for deployment

## Repo conventions

Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`). Separate commits per logical unit. No squashing of unrelated changes.

## Live demo

(URL goes here after Vercel connects.)
