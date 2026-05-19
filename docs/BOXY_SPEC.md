# Boxy — Game Spec and Build Plan

Build plan and full game specification. Supersedes the earlier `clone-synthesis-tutor-LESSON_SCRIPT.md` (guided-lesson direction), which is now archived.

## One-line summary

Single-player iPad-browser block puzzle. The kid drags fraction-rectangle pieces onto a board so the cells where pieces touch satisfy fraction rules associated with colored edges. Wrong placement = math wrong. Right placement = math right. Fraction equivalence is the strategy.

## Core mechanic

Each piece is a multi-cell shape (Blokus-style permutations of 1 to 5 unit cells). Each piece has 4 axis-aligned edges (north, south, east, west); each edge has a cell-count equal to how many cells of the piece touch that edge.

The board starts with seed pieces. Some seed-piece edges are colored. Each color is bound to a *fraction rule* (e.g. `BLUE = 1/2`), shown in a legend at the top.

When the kid places a piece adjacent to a colored edge, the cells of the kid's piece that touch the colored edge must satisfy the rule applied to the colored edge's cell count. Concrete: blue rule = 1/2, blue edge has 4 cells, kid's touching cells must equal 4 × 1/2 = 2.

**Combining.** A colored edge does not have to be satisfied by one piece. The kid can place multiple pieces along the colored edge, and the *sum* of their touching cells must satisfy the rule. This is where fraction addition shows up implicitly (two 1-cell touches sum to 2 cells, the same as one 2-cell touch).

## Round structure

1. **Setup.** Board appears with seed pieces and colored edges. Legend shows color-to-fraction rules. Hand of 10 pieces visible on the side.
2. **Simplify (optional, levels 3+).** Rules may appear unsimplified (`4/8`, `2/4`). A small "simplify" affordance on each rule chip lets the kid rewrite it. Optional, no score penalty, no required step.
3. **Play.** Drag pieces from hand to board. Validation runs on drop. Invalid placement snaps back with one-line visual reason.
4. **Submit.** Kid taps Submit when satisfied. Round ends.
5. **Score.** Empty cells (lower better), hand pieces remaining (lower better), grade-level chip shown, restart button.

The rules stay fixed throughout a round. The kid decides when to submit.

## Validation rule (the heart of the build)

For a piece P placed at position (x, y) with orientation o, for each cell of P, check whether it sits on the board interior, does not overlap an existing piece, and whether any of its 4 cell-edges abut a colored edge of a neighboring piece.

For each colored edge of a neighbor that is now touched by one or more cells of P (or by P plus any pieces placed earlier this round), let:
- `colored_count` = total cells along that colored edge (constant per seed piece)
- `touching_count` = total cells of all kid-placed pieces that currently touch that colored edge
- `rule` = the fraction bound to that color

Then the placement is valid for that edge if `touching_count == rule.numerator / rule.denominator × colored_count`. Internally we keep both sides as integers: `touching_count × rule.denominator == rule.numerator × colored_count`. No floats. No rounding.

A placement is valid overall if every colored edge it touches passes, AND every other already-touched colored edge on the board still passes after this placement (a placement can never break an existing satisfaction).

## Pieces and hand

Hand-authored piece sets for the Friday demo, one set per level. Each piece has:
- a unique id
- a 2D cell array (`Array<{x, y}>`)
- 4 rotation states (computed)
- a color (kid color, not rule color)

Pieces displayed in a grid (collection view) on the right side of the screen (or below on portrait iPad). Tap to rotate. Drag to place. Once placed, the piece is removed from the hand.

## Levels (escalation)

| level | grade chip | rules | piece set size | notes |
|---|---|---|---|---|
| L1 | Grade 3 | `BLUE = 1/2` | 10 pieces | introduction |
| L2 | Grade 3 | `BLUE = 1/2`, `RED = 1/4` | 12 pieces | multi-rule |
| L3 | Grade 3 to 4 | `BLUE = 2/4`, `RED = 3/12` | 12 pieces | unsimplified rules; simplify button appears |
| L4 | Grade 4 | `BLUE = 1/2`, `RED = 3/4`, `GREEN = 5/4` | 14 pieces | improper fraction (touching side bigger than colored side) |
| L5+ | beyond MVP | stretch | | only if time |

The Friday demo ships L1 polished and L2 working. L3 onward are noted in `IPAD_ROADMAP.md` as planned content, ship if time permits.

## Tutor (silent, on-demand only)

Per the user's direction. No tutor speech unless the kid taps a Hint? button at the bottom-right.

Hint engine reads the current game state and surfaces one scripted line. State branches:

- *No pieces placed yet:* "Look at the blue edge over there. Count the blue cells. The rule says half of that. What number is half?"
- *Last placement just failed:* "Your last piece had `<n>` cells touching the blue edge. The blue edge has `<m>` cells. You need half of `<m>`, which is `<m/2>`. Try a piece with `<m/2>` cells on its touching side."
- *About to submit with empty cells:* "You can still place more pieces if you want a higher score. Or submit if you're done."
- *About to submit cleanly:* "Looks good. Tap Submit when ready."

Scripted lines live in `src/data/tutorLines.ts`. Every line names the atom from `clone-synthesis-tutor-ATOMIZATION.md` it remediates.

## Scoring

```
score = base
      - empty_cells × 2
      - pieces_remaining × 1
      + (all_pieces_placed ? 5 : 0)
```

`base` = 100. The kid sees the final number and a label: `good` (60+), `great` (80+), `excellent` (95+). No leaderboard, no streak, no XP.

## Off-ramp

Manual Submit ends the round. Score screen has one button: Restart. No auto-advance, no "play again to earn coins," no daily progression. Skinner's off-ramp principle, respected literally.

## Visual language

- Background: `#010d29` (Synthesis theme color, deep navy)
- Accent: `#c5a572` (warm gold-amber, Gauntlet-brand-adjacent)
- Empty cell: 1px slate-700 stroke on transparent fill
- Seed piece body: slate-300 fill with 2px slate-100 stroke
- Seed colored edge: 4px stroke in the rule color (blue/red/green/yellow saturated)
- Placed piece body: gold-amber fill with 2px gold-darker stroke
- Hand piece: same as placed but with 0.85 opacity until grabbed
- No gradients, no shadows beyond a subtle drop-shadow on dragged pieces, no decorative animation
- One animation: smooth snap-to-grid on drop (200ms ease-out)
- One animation: pulse on the violated edge if a placement fails (300ms scale 1.0 → 1.08 → 1.0)
- One animation: 1.2s soft confetti burst on submit-with-no-empties, then silence

## Audio

- Snap on valid placement: woodblock tone, ~120ms (Tone.js MembraneSynth)
- Buzz on invalid placement: slightly lower, ~80ms (Tone.js, attenuated)
- Win chord on submit-with-no-empties: short major triad, ~400ms
- All sounds respect device mute. No background music.

## Tech architecture

### Stack (locked)

- Vite + React 18 + TypeScript 5
- Tailwind CSS 3 (utility classes only, no `@apply` inside components)
- `@dnd-kit/core` for drag-and-drop (touch-first, iPad Safari compatible)
- XState 5 for game state machine
- Framer Motion 11 for animation
- Tone.js 14 for audio
- Vercel for deployment

### File layout (target)

```
clone-synthesis-tutor/
├── docs/
│   ├── BOXY_SPEC.md             (this file, copied in)
│   ├── ATOMIZATION.md           (knowledge tree)
│   ├── ARCHITECTURE.md          (high-level, for the breakout)
│   ├── DEFENSE_BREAKOUT_SCRIPT.md
│   ├── AI_INTERVIEW_PREP.md
│   ├── IPAD_ROADMAP.md
│   ├── MANUAL_TESTS.md
│   └── research/
│       └── RESEARCH_NOTES.md    (Skinner, Engelmann, Synthesis)
├── website/
│   └── index.html               (single-file architecture site)
├── public/
│   └── (favicon, og image)
├── src/
│   ├── components/
│   │   ├── App.tsx
│   │   ├── Board.tsx            (8x8 grid + seed pieces + placed pieces)
│   │   ├── BoardCell.tsx        (drop target)
│   │   ├── Piece.tsx            (SVG render of one piece)
│   │   ├── Hand.tsx             (hand grid + tap-to-rotate)
│   │   ├── Legend.tsx           (color-to-rule chips + simplify affordance)
│   │   ├── HintButton.tsx       (on-demand tutor)
│   │   ├── ScoreScreen.tsx
│   │   └── DragOverlay.tsx      (custom @dnd-kit drag preview)
│   ├── state/
│   │   ├── game.machine.ts      (XState: idle → setup → playing → submitted → scored)
│   │   └── types.ts
│   ├── data/
│   │   ├── pieces.ts            (hand-authored piece sets per level)
│   │   ├── levels.ts            (level config: rules, seeds, hand)
│   │   └── tutorLines.ts        (scripted hint lines)
│   ├── lib/
│   │   ├── geometry.ts          (piece rotation, edge cell counts, neighbor detection)
│   │   ├── validation.ts        (the integer-math validation rule)
│   │   ├── scoring.ts
│   │   ├── fractions.ts         (Fraction type with simplify, equal, multiply)
│   │   └── audio.ts             (Tone.js wrappers)
│   ├── styles/
│   │   └── index.css            (Tailwind base + iPad tap-target reset)
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Game state machine (XState)

```
idle
  → (start clicked) → setup
setup
  → (animation done) → playing
playing
  → (hint tapped) → hintShown → playing
  → (piece dropped valid) → playing (updates board state)
  → (piece dropped invalid) → playing (snap back, pulse edge)
  → (submit tapped) → scored
scored
  → (restart tapped) → setup
```

Context: `board`, `hand`, `placedPieces`, `currentLevel`, `score`, `lastFailureReason`.

### Validation in code (sketch)

```ts
type Fraction = { n: number; d: number };  // always stored with d > 0

function multiplyByInt(f: Fraction, k: number): { ok: boolean; value: number } {
  // returns { ok: true, value: x } iff f * k is an integer x
  const num = f.n * k;
  if (num % f.d !== 0) return { ok: false, value: NaN };
  return { ok: true, value: num / f.d };
}

function validatePlacement(
  piece: PlacedPiece,
  board: Board,
  rules: Map<Color, Fraction>,
): { valid: boolean; reason?: string } {
  // for each colored edge of any neighbor touched by `piece`:
  //   compute total touching cells (across all placed pieces, including `piece`)
  //   compute expected = multiplyByInt(rule, colored_count)
  //   if !expected.ok or touching !== expected.value: invalid with reason
  // return valid
}
```

No floats. Integer arithmetic only. Equivalence test is `a.n × b.d === b.n × a.d`.

## Build order (phases, not days)

**Phase A — Scaffold and hello-world deploy** ← in progress this turn
- Vite + React + TS project at `/Users/scottlydon/Desktop/Clutter/iOS/clone-synthesis-tutor`
- Tailwind configured
- Stub App.tsx renders "Boxy" title screen
- Git initialized, initial commit
- (next step) GitHub repo created, pushed
- (next step) Vercel connected, hello-world deployed
- Verify on real iPad Safari that the deploy is reachable

**Phase B — Static board with seed pieces**
- `lib/geometry.ts` (piece cell math, rotation)
- `data/pieces.ts` (level 1 hand-authored set)
- `data/levels.ts` (level 1: 8x8 board, 3 seeds with blue edges)
- `components/Board.tsx`, `components/Piece.tsx`
- Renders the board with seeds, no interaction yet

**Phase C — Hand UI and rotation**
- `components/Hand.tsx`
- Tap-to-rotate (no drag yet)
- Visual selection state

**Phase D — Drag-and-drop (no validation)**
- `@dnd-kit/core` integration
- Pieces snap to grid cells on drop
- Pieces stay where dropped (no validation gate)

**Phase E — Validation**
- `lib/fractions.ts` (Fraction type, equal, simplify, multiplyByInt)
- `lib/validation.ts` (the rule engine)
- Invalid drops snap back with violated-edge pulse
- Audio: snap on valid, buzz on invalid

**Phase F — Combining**
- Validation accumulates touching cells across all placed pieces along the same colored edge
- Test case: place two 1-cell pieces sharing a blue edge totaling 2 cells (1/2 of 4)

**Phase G — Submit and score**
- `lib/scoring.ts`
- `components/ScoreScreen.tsx`
- Restart wires back to setup

**Phase H — Hint engine**
- `data/tutorLines.ts`
- `components/HintButton.tsx`
- State-aware line surfacing

**Phase I — Level 2 (multi-rule)**
- `data/levels.ts` level 2 entry
- Tests that validation handles multiple colored rules simultaneously

**Phase J — Simplify pre-round (levels 3+)**
- `components/Legend.tsx` with tap-to-simplify on unsimplified rules
- `data/levels.ts` level 3 entry

**Phase K — iPad polish**
- Tap target audit (44pt min)
- High-contrast color pass
- `prefers-reduced-motion` respect
- Audio mute-state respect
- Real iPad Safari smoke

**Phase L — Deliverables**
- `README.md`, `IPAD_ROADMAP.md`, `MANUAL_TESTS.md`
- `docs/DEFENSE_BREAKOUT_SCRIPT.md`, `website/index.html`, `docs/AI_INTERVIEW_PREP.md`
- Demo video on iPad
- Final Vercel deploy
- Submission

## What this spec deliberately does not promise

- Procedural piece generation (hand-authored is fine for the demo; procedural is a v1.1 stretch).
- AI opponent or any opponent (single-player only).
- Persisted progress across sessions (the off-ramp principle).
- Account system, auth, or user data of any kind.
- Sound design beyond the three Tone.js wrappers.
- Localization. English-only.
- Animations beyond the four named ones (snap, pulse, confetti, drag preview).
