# Breakout Defense — Trade Mogging (5 min spoken)

Spoken aloud to three cohort members in the breakout room. Target pace is roughly 4 minutes 30 seconds so there is a 30-second buffer.

---

## [0:00 – 0:30] What it is

Trade Mogging is a single-player iPad-browser game that teaches fraction equivalence to a third grader. The kid plays a capybara at a Middle-Eastern night bazaar. Customers walk up with orders in fraction form, "I need three-quarters of a hummus tub," and the kid combines pieces from vendor stalls to fulfill the order. There are five vendors, each selling their food in different fraction sizes. Clever combinations using equivalence cost less, and the cheaper combo "mogs the vendor" for a bonus.

## [0:30 – 1:15] The pedagogical move

The fraction equivalence math is the gameplay loop. There is no separation between "the fun part" and "the math part." Two quarters of hummus and one half of hummus look different in the kid's tray and cost different amounts, but the customer is fulfilled by either. The kid sees the visual wedge, sees the numeric fraction, and sees the cash impact, simultaneously. Atom by atom, they build the schema for `2/4 = 1/2`, `3/6 = 1/2`, `4/12 = 1/3`, the same way Engelmann's Direct Instruction recommends: minimize misinterpretation, isolate the skill, then integrate.

The curriculum is six customers, hand-tuned. Each customer's `minimumCost` was computed by hand against the catalog so the MOG-detection threshold is exact, not floating-point fuzzed.

## [1:15 – 2:00] Architecture

XState v5 is the single source of truth for what is on screen. Eight states: intro, shopping, resolving, mogSplash, profitOk, lesson, advancing, complete. Validation is a pure function in `game/validate.ts`. Fraction arithmetic is integer-only in `game/fraction.ts`; three classrooms have been lost in other tutors to a kid combining `1/3 + 1/3 + 1/3` and getting `0.9999`, then the app firing wrong-amount on a correct answer. We refuse to be the fourth.

Drag and drop uses `@dnd-kit/core`. iPad Safari does not respect HTML5 drag-and-drop on touch, so this library is mandatory. Sound is Tone.js, lazy-initialized on first user gesture per Safari's autoplay policy.

## [2:00 – 2:45] The three calls I'm proudest of

First: the cheapest-combo solver runs at submit time, in the browser, on every trade. The kid serves three quarters of olive and the validator checks not only that the amount is right, but whether any combination from the vendor catalog would have been cheaper. If not, MOG with bonus. The solver is a bounded BFS with pruning. Catalog tops at five piece types per food, search space is under a hundred nodes, no DP needed.

Second: the "mogged vendor" pick is data-driven. When the kid MOGs a trade, exactly one vendor wobbles on screen with cracked-lens sunglasses. We chose the vendor that contributed the most pieces, tiebroken by most spent. This matches the visual intuition: you outsmarted *that* guy specifically, not the bazaar in general. It was a one-line `reduce` decision and it sells the moment.

Third: the off-ramp. Six customers, then the bazaar closes. No daily streak, no XP across runs, no leaderboard. Skinner's substack last November named this as the most overlooked feature of edtech. We respected it literally.

## [2:45 – 3:30] Trade-offs

The kid can game the score by always choosing one large piece when the order allows it. We let this happen because the next customer's order is `3/4` or `5/8`, where no single piece works and equivalence becomes mandatory. If the kid finishes the run with mostly mog bonuses, they actually demonstrated they got it.

We left fraction *addition* unaddressed in the explicit copy. The mechanic is addition (the tray sums sizes) but we never call it that. A third-grader gets addition implicitly here; the next-week tutor can name it.

We used hand-authored piece sets instead of procedural generation. Five days. Procedural is on the v1.1 list.

## [3:30 – 4:15] Things I left out on purpose

No LLM in the demo URL. Patrick Skinner's own product FAQ says they "do not simply outsource your child's education to an LLM." Seven failure modes I would have to defend (inappropriate content, validating wrong answers, fraction math errors on the model side, topic drift, latency, cost handling, voice mismatch); the scripted version has none of them and the curriculum atomization is what makes it feel smart.

No mascot beyond the capybara. Skinner cited a 2025 meta-analysis: pace doesn't hurt kids, fantasy does. A talking pita would burn working memory the kid needs for the fraction. The capybara is the kid's avatar, not a fantasy character.

No persistence between sessions. Off-ramp principle.

## [4:15 – 4:30] Closing

Six customers. Five vendors. One mechanic. The kid plays for five minutes and walks away knowing that one half equals two quarters equals four eighths, and that picking the right one earns more money than picking the obvious one. That is the lesson.

---

## Critique cheat-sheet (for poking holes in peer architectures)

- Did they ship a scripted version or an LLM version? If LLM, ask what happens when the model says something off-script to a child.
- Did they put the math on a side panel or in the gameplay loop? Side panel = lesson, gameplay loop = product.
- Did they respect the off-ramp? If their app has a daily streak or XP across runs, the off-ramp is broken.
- Did they author their curriculum or autogenerate? Autogenerated math problems often have edge cases that fire wrong-answer on a correct response.
- Does their game work on a real iPad in Safari, or only Chrome devtools simulation? HTML5 drag-and-drop and `touch-action` are common breakage points.

## Vote-criteria mental model

The breakout votes go to the architecture that:
1. Ships a clean live URL on iPad.
2. Has the math *inside* the loop, not on a side panel.
3. Doesn't pretend to be more than it is. Scope honesty wins.
4. Defends its decisions out loud, with citations to a published thinker, not hand-waves.

## Pre-call checklist

- Live URL open in Safari on the iPad sitting on the desk.
- `docs/ARCHITECTURE.md` open in another tab on the laptop.
- One-sentence elevator pitch rehearsed.
- One pre-baked concrete example per topic ready to deploy when asked "give me a specific case."
