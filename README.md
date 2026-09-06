# Trade Mogging

A single-player iPad-browser game that teaches fraction equivalence to a 9-year-old.

Gauntlet G5 Week 4 hiring-partner submission for Superbuilders.

## What it is

You are a capybara hustler at a goofy Middle Eastern bazaar. Customers walk up and order exact fractional amounts of food (e.g., "7/12 of a baklava tray"). Five vendor animals — a flat-capped Camel, a be-sunglassed Goat, a fez-wearing Pigeon, a gold-chained Cat, and a boss Water Buffalo — sell fractional pieces at different prices. You drag pieces to your tray, combining them using fraction equivalence to hit the exact amount, cheapest. When you find the cheapest valid combination, you "MOG" the vendor: your capybara literally hops up and sits on the vendor's head (this is real capybara behavior, which makes it funny). Wrong amount = customer walks, deposit lost, mini lesson appears.

The math IS the game. Every reward exists *because of* the math, not in spite of it.

## Why it teaches

Built on two foundations:

1. **Patrick Skinner's cognitive-load framework** ([L = M × G(C) × T](https://patskinner.substack.com/p/the-ultimate-balance-cognitive-load)). Competence drives engagement, not the other way around. The cash stack growing is functional feedback, not a decorative reward. No XP, no streaks, no loot.

2. **Engelmann's Direct Instruction**. The knowledge tree is atomized in [`docs/ATOMIZATION.md`](docs/ATOMIZATION.md) (atoms A1 through A11). Each customer in the curriculum maps to a specific atom or composition. Customers progress from "drag one piece" (no equivalence) to "boss order 7/12" (equivalence mechanically required).

## How the AI tutor works (and doesn't)

When the kid serves the wrong amount, a mini lesson appears with side-by-side wedges (served vs. wanted) and one worked example of a cheapest combination. The kid types one sentence in their own words explaining what went wrong.

That text is sent to a `/api/validate` endpoint which calls the Anthropic API to score the explanation on a 1-5 rubric. The kid never sees the LLM's raw response. The frontend maps the integer score to one of 5 pre-written scripted responses. This satisfies the Synthesis brief's rule that LLM text is never exposed to the kid — we use the LLM's pedagogical judgment, not its prose.

If the API call fails (missing key, offline, rate limit), the client falls back to keyword-based scoring so the lesson still functions.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. Tested in Safari on iPad.

For the AI validation to work locally, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without the key, the local-keyword fallback runs.

## Build for production

```bash
npm run build
npm run preview
```

## Deploy

[Render](https://render.com) Node Web Service auto-deploys on push to `main`. Config is in [`render.yaml`](render.yaml) at the repo root (Render reads it as a Blueprint on first connect). The Express server in [`server/index.mjs`](server/index.mjs) serves the Vite-built SPA from `dist/` AND owns `/api/validate`, so the entire app is a single service on one URL — no two-service split, no CORS gymnastics.

Set `ANTHROPIC_API_KEY` in Render dashboard → your service → Environment. The blueprint marks it `sync: false` so the value never lives in the repo. Pro plan recommended so the service does not sleep (free tier has a 30-second cold start after 15 minutes of idle, which is bad for live demos).

## Stack

Vite, React 19, TypeScript. Tailwind CSS for styling. `@dnd-kit/core` for touch-first drag-and-drop. XState 5 for game state (single source of truth, UI is a pure render of context). Framer Motion for the MOG animation and outcome splashes. Tone.js for functional audio (cha-ching, sad trombone, mog sting). Express on Node 20 for the server (`server/index.mjs`), Render Web Service for hosting, Anthropic Claude Haiku 4.5 for silent rubric scoring on the lesson panel.

## Docs

- [`docs/ATOMIZATION.md`](docs/ATOMIZATION.md) — knowledge tree from "what is a whole" through "1/2 = 2/4"
- [`docs/BOXY_SPEC.md`](docs/BOXY_SPEC.md) — original game spec (pre-pivot, kept for context)
- [`docs/research/RESEARCH_NOTES.md`](docs/research/RESEARCH_NOTES.md) — Skinner, Synthesis, Direct Instruction synthesis
- [`docs/MANUAL_TESTS.md`](docs/MANUAL_TESTS.md) — playable test scenarios for the manipulative
- [`docs/IPAD_ROADMAP.md`](docs/IPAD_ROADMAP.md) — what would change to ship as a native iPad app
- [`docs/DEFENSE_BREAKOUT_SCRIPT.md`](docs/DEFENSE_BREAKOUT_SCRIPT.md) — 5-minute cohort defense
- [`docs/AI_INTERVIEW_PREP.md`](docs/AI_INTERVIEW_PREP.md) — anticipatory answers for the AI video interview
- [`website/index.html`](website/index.html) — single-page architecture website

## Repo conventions

Conventional Commits format (`feat:`, `fix:`, `docs:`, `chore:`). Separate commits per logical unit. No squashing of unrelated changes.

## Live demo

**Retired 2026-09-03.** It was [trade-mogging.onrender.com](https://trade-mogging.onrender.com). The Render account was suspended for non-payment on 2026-08-31 and every service on it was deleted on 2026-09-03, so the host now answers 404. The repository and its commit history are unaffected and remain the reviewable artefact. What follows describes the deployment as it ran: Render Starter Node web service, Node 20, service ID `srv-d85tgplckfvc73e63hkg`. Auto-deploys from `main` via [`.github/workflows/render-deploy.yml`](.github/workflows/render-deploy.yml), which POSTs to the Render Deploy Hook URL stored as repo secret `RENDER_DEPLOY_HOOK_URL`. The Express server in `server/index.mjs` serves the Vite SPA from `dist/` and owns `/api/validate`. Smoke-tested end-to-end: `/healthz` confirms `anthropicKey: true`, `/api/validate` scores strong explanations 5 and gibberish 1.

This was the SOLE live URL for the project while it ran. Earlier iterations had a `trade-mogging-v7ua.onrender.com` orphan service and a standalone `boxy-fractions.onrender.com` (with its own copy of the Boxy game). All three are now retired. While this deployment ran, the canonical Boxy lived at `/boxy` under this URL, kept in sync by the same auto-deploy. Boxy Fractions has since been republished on its own at https://boxy-fractions.pages.dev, which is live.
