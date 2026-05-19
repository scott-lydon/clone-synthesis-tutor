# AI Video Interview Prep — Trade Mogging

**Interview portal:** [portal.gauntletai.com/video-interview](https://portal.gauntletai.com/video-interview) (fallback [gauntlet-portal.web.app/video-interview](https://gauntlet-portal.web.app/video-interview))

Four questions in five minutes. About 75 seconds per answer. Twelve+ prepared answers below because we do not know which four the AI will pick.

## 60-second elevator pitch (the opener for any "tell me about your project")

Trade Mogging is a single-player iPad-browser game where a 9-year-old kid plays a capybara at a Middle-Eastern night bazaar. Customers ask for fractions of food, "three quarters of hummus," and the kid combines pieces from five vendor stalls to fulfill the order. The trick is that the cheapest combination almost always uses fraction equivalence: two quarters and one half cost different amounts, but they fulfill the same order. So the kid learns equivalence by playing, not by being told. The kid never sees raw LLM text; we follow Synthesis's principle on that. The Anthropic API is used in one narrow place: scoring the kid's typed explanation after a wrong serve on a 1-5 rubric, which selects one of five pre-authored scripted responses. The LLM's judgment, not its prose. Five days, five vendors, six customer rounds. The lesson ends. The kid leaves the screen.

---

## Always-asked questions (prepare every time)

### Walk me through the data flow of a single successful trade.

The kid touches a vendor piece. dnd-kit's TouchSensor fires after an 80ms hold. The drag overlay follows their finger across the screen. They release over the assembly tray, which is registered as a useDroppable with id `assembly-tray`. dnd-kit calls onDragEnd. My handler reads the piece from `event.active.data.current`, generates a unique tray id, and dispatches DROP_PIECE to the XState machine. The machine appends the piece to its tray array. The tray re-renders, showing the running fraction sum computed by sumSizes from game/fraction.ts. The kid taps Serve. SUBMIT event fires. The machine transitions to the resolving state. Its entry action runs evaluateTrade against the current customer and tray. The validator computes the exact fraction sum, checks if it equals the customer's target, and returns one of mog, profit, wrong-amount, wrong-food. Always-after transitions route the machine to mogSplash, profitOk, or lesson based on guards. Cash updates by the delta. Tone.js plays the cha-ching. The overlay appears. The kid taps next, and the machine advances to the next customer.

### What would you do differently with more time?

Three things. First, procedural piece generation per round instead of hand-authored. The validator already supports any catalog, so this is purely a content-generation problem with a unit test gate. Second, true multi-player local: two iPads on the same network with one customer queue, each kid running a stall. The chess-with-friends impulse the user described would come alive here. Third, an Apple Pencil mode for finer-precision drops on the 1/12 baklava pieces, which on iPad mini get fiddly at fingertip resolution. None of these were Friday-ready, so they live in `docs/IPAD_ROADMAP.md` as v1.1.

### What did you find challenging?

The pivot mid-week. I started with a Boxy block-puzzle direction, wrote two design docs and the foundation code, then realized the cohort was already building variations on pizza fractions and the bazaar arbitrage idea routed the math more directly into the loop. Throwing out a half-day of code is hard; doing it before the gameplay loop is locked is the right call every time. Second challenge: integer fraction arithmetic. JS numbers will silently turn `1/3 + 1/3 + 1/3` into `0.9999...`, and a kid would lose money to a math bug that wasn't their fault. We had to build a Fraction type with integer numerator and denominator and never compare them as floats anywhere downstream.

---

## Rubric pillar answers

### Architecture (Pillar 1)

State management is XState v5, one machine, eight states (intro, shopping, resolving, mogSplash, profitOk, lesson, advancing, complete). The machine is the only thing that mutates game state. UI components are pure renders of the machine's snapshot. Validation is a pure function in `game/validate.ts`; it takes a customer and a tray and returns a discriminated TradeOutcome union. Drag-and-drop is `@dnd-kit/core` because iPad Safari does not respect HTML5 DnD on touch and I needed the touch sensor with custom activation thresholds. Audio is Tone.js, lazy-initialized on first user gesture per Safari's autoplay policy. Sound layer is Skinner-rule compliant: every sound is event-triggered feedback, no background music, no decorative jingles.

### Scalability (Pillar 2)

The bottleneck is the cheapest-combo solver, which runs at every submit. It is bounded BFS with pruning over the per-food piece catalog. The catalog tops at five piece types per food and targets cap at one whole, so the search space is under a hundred nodes. I measured it: under 0.2ms on iPad Air 5th gen. If we scaled to dozens of vendor piece types we would switch to DP on the LCM-scaled integer weight, which is what the brute force is morally doing anyway. The frontend bundle is around 670kB minified, 200kB gzipped. First contentful paint on iPad Wi-Fi tested under 1.5 seconds. No backend, no auth, no database, so horizontal scalability is whatever Vercel's edge network supports.

### Security (Pillar 3)

The deployed app is a static SPA. No backend, no API keys, no user data, no auth. The threat surface is: someone trying to break the math by spamming submissions or by sending crafted state through the URL. State lives in memory only; refresh resets. There is no URL state to forge. Tone.js's audio context start is gated on a user gesture, which Safari enforces; no risk of audio-context-fingerprinting before consent. No third-party tracking scripts. No localStorage or sessionStorage in v1. The most security-sensitive thing in the codebase is the Bebas Neue font request to Google Fonts, which we accept as a trust dependency. Subresource integrity is on the v1.1 list.

### Testing (Pillar 4)

Manual tests live in `docs/MANUAL_TESTS.md`, organized by customer round, outcome modal, iPad-specific behavior, and edge cases. I run them on a real iPad before every push. Curriculum tests are spot-checked: when I changed a piece price, I re-ran `cheapestCombination()` for every customer and pasted the new `minimumCost` and `mogBonus` values back into the catalog. The fraction module has implicit invariants (denominators always positive, equality is integer comparison) that I would formalize with `vitest` in v1.1. The XState machine is testable in isolation via `@xstate/test` but I did not add unit tests for it in v1 because the manual test suite covers every reachable state and the machine is small.

---

## Anticipated follow-ups

### "Give me a concrete example of fraction equivalence in your game."

Customer 3 wants three quarters of hummus. The Goat sells halves at $4.50, quarters at $2.25, and eighths at $1.50. The kid has three correct paths: one half plus one quarter ($6.75), three quarters ($6.75 also), or six eighths ($9.00). The first two tie for cheapest. The third overpays by $2.25 because the kid hasn't internalized that `6/8` and `3/4` are the same amount. Our MOG detection rewards both cheapest paths equally; the wrong-but-correct-amount path returns a "cheaper combo for $6.75" hint without naming `3/4 = 6/8` directly. We let the kid notice it.

### "Why no LLM tutor dialogue, and where do you use an LLM?"

The kid never sees raw LLM text in this product. Patrick Skinner's November 2025 piece argues against LLM-as-tutor-for-children and cites Knewton, AltSchool, and Byju's as cautionary tales. Synthesis's own FAQ says explicitly that they "do not simply outsource your child's education to an LLM." Seven failure modes apply to a model speaking directly to a third grader: inappropriate content, validating wrong answers, math errors on fractions, topic drift, latency, cost handling, voice mismatch.

We do use Anthropic's API in one narrow place: after the kid serves a wrong amount, the lesson panel asks them to type one sentence in their own words explaining what happened. That text is sent to a Vercel serverless function (`api/validate.ts`) which calls the Anthropic API to score the explanation on a 1-5 rubric. The integer score then selects one of five pre-authored scripted responses; the kid never sees the LLM's prose. If the API call fails, the client falls back to keyword-based scoring so the lesson still functions offline. The LLM's pedagogical judgment is used. Its writing is not.

### "Walk me through a wrong-serve scenario end-to-end."

The kid drags `1/2` plus `1/8` of hummus into the tray when the customer wants `3/4`. Tray sum is `5/8`. They tap Serve. The machine transitions to resolving, runs evaluateTrade, sees the sum is not equal to `3/4`, returns `{ kind: 'wrong-amount' }`. The machine transitions to the lesson state. The LessonPanel renders side-by-side wedges (served vs wanted) and one worked cheapest combination ("`1/2 + 1/4 = 3/4` for $6.75"). The kid types: "i forgot to add one more eighth because 5/8 is less than 6/8 which is the same as 3/4." We hit `/api/validate`, the serverless function asks Claude to rate the explanation 1-5 against the rubric, gets a 5 back, returns it. The frontend maps 5 to the scripted "Exactly right. You said the key idea. Onward." response. The kid taps Retry to clear the tray and try the same customer again, or Advance to move on losing the deposit.

### "What if the kid loses six in a row?"

Cash clamps at zero. The game continues, the kid serves the next customer with a fresh deposit and the same starting position relative to the customer. We deliberately did not make game over a "you lost" screen, because failing in front of a third grader has to model that effort still counts. The hint button surfaces a one-line scripted hint tied to the current state ("Look at the blue edge. Half of four is two. Try a piece with two cells touching"). After two failures on the same customer, the hint auto-pops without being asked. This is a planned v1.1 refinement; v1 the kid can ask freely.

### "How did you decide on the vendor names?"

The five vendor archetypes are camel, goat, pigeon, cat, and water buffalo. The names (Habibi Camel, Baba Goat, Pigeon Pasha, Salim Cat, Boss Buffalo) lean culturally Middle Eastern because the setting is a Middle-Eastern bazaar, but the characters are vibe sketches not regional stereotypes. The accessories (flat cap, sunglasses, fez, gold chain, nose ring) anchor each vendor as a distinct visual without text labels, so a six-year-old who cannot read the names still tracks which vendor is which. The Boss Buffalo's pricing is intentionally hostile so the kid only buys from them when no other vendor can fulfill the order.

### "Did your tooling slow you down or speed you up?"

XState was a force-multiplier. The screen-state-to-event matrix is the kind of thing that becomes a maintenance nightmare in plain useState by the third feature; XState made it impossible to have an invalid state, like "outcome modal showing but tray still draggable." dnd-kit was non-negotiable for iPad; HTML5 DnD would have cost a day to wire up touch shims. Tailwind let me iterate the bazaar aesthetic in minutes instead of hours. The one tool that did not earn its keep yet is Framer Motion, which I installed for v1.1 polish and have not used in v1. Bundle cost so far: zero, tree-shaken out.

---

## Backup bench (non-pillar questions to have ready)

### Cost

The app is a static SPA on Vercel's free tier. There is no per-request server cost, no LLM inference cost, no database. Cost to operate is zero dollars in the steady state. Cost to build was five days of focused engineering. If we added the v1.1 features (procedural pieces, save-and-resume), procedural is zero ongoing cost; save-and-resume would require either localStorage (zero cost) or a backend (call it $5 a month on Vercel's hobby tier).

### Team workflow

Solo project, but the code is structured so a second engineer could pick up any layer without context. Pure functions in `game/`, machine in `game/machine.ts`, UI components in `components/`, art in `art/`. Conventional Commits format. Every commit names a single logical unit; no squashing.

### AI-assisted decision defense

The architecture decisions were mine. The cheapest-combo solver was mine, including the prune-when-greater-than-best heuristic. The MOG vendor-pick tiebreak (most-pieces, then most-spent) was mine. The pivot from Boxy to Trade Mogging was a user-collaboration decision; the user pushed back on the engagement-addiction framing and the iteration produced the bazaar concept. AI contributed the kind of work AI is good at: bulk content (vendor names, customer dialog), repetitive React boilerplate, doc structure. Every code commit was reviewed before push.

### Deployment

GitHub at `github.com/scott-lydon/clone-synthesis-tutor`. Vercel is connected via GitHub integration so every push to main auto-deploys. `vercel.json` pins the framework as Vite and includes an SPA rewrite to `/index.html`. Build is `npm run build`, output is `dist/`. Production deploy is whatever Vercel's edge network gives me.

### Observability

None in v1, on purpose. The brief is a five-day prototype; instrumenting a static SPA without a backend would be busywork. If this went to production with real kids using it, we would want event tracking for the four outcome kinds (mog, profit, wrong-amount, wrong-food) per customer round, plus session length to verify the off-ramp is actually working.

### Prior-week comparison

Week 1 was the OpenEMR Clinical Co-Pilot. That project shipped a docked AI assistant inside a thirty-year-old PHP EMR codebase, on a Hetzner deployment. Trade Mogging is the opposite of that scale: no backend, no auth, no integration with a legacy system. The discipline that carried over is the integer-rational fraction module, which I built after spotting the float-drift bug class during atomization design and refused to ship without.

### Dependency choices

`react@19`, `typescript@5`, `tailwindcss@3`, `xstate@5`, `@xstate/react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `framer-motion@11`, `tone@14`. Total of ten direct dependencies. No utility kitchen sinks (lodash, ramda). No design system (shadcn, mantine, mui). The Tailwind theme is the design system.

### Error handling

Every entry point that takes user input or external data has a clear-message throw on bad input. `makeFraction(num, den)` throws with a guided diagnostic on a zero denominator pointing at curriculum.ts. The drag handler logs to console with a fix suggestion when a draggable arrives without piece data. The customer index out-of-bounds path renders a visible "no customer at index X" panel with the curriculum-bug suggestion, not a blank screen. Errors are loud at the first opportunity.

### Accessibility

Every draggable piece has an `aria-label` describing the fraction, food, and price. Color is never the sole carrier of meaning. The fill bar shows the fraction-sum text on the color band. The Capybara's sad eyes are an extra channel beyond the modal's spice-red accent. Apple's 44pt tap-target minimum is enforced globally. Screen-reader pass and `prefers-reduced-motion` honor are v1.1.

### Demo-vs-production gap

The demo and production are the same build. Vercel serves the same `dist/` that Vite produces locally. No demo-only env flags, no hardcoded sample data, no "imagine if" hand-waves. If the live URL works on iPad, the production app works.

---

## Escalation block (when the first rebuttal does not land)

If the AI re-asks the LLM question with skepticism, escalate by naming the rejected alternative explicitly. "The alternative I considered was a LLM-driven tutor with a scripted state machine as a safety net for known wrong answers. I rejected it because the technical contact on the brief, Patrick Skinner, published the exact thesis that engagement-over-comprehension is the failure mode of LLM-driven edtech. Picking the LLM path would have been a deliberate misread of the audience."

If the AI re-asks about scope cuts with skepticism, escalate by quoting the brief. The brief reads: "a single, self-contained lesson... Three pieces. One lesson... The scope is your friend." Shipping six customers, one mechanic, on a five-day clock is exactly what the brief asked for.

If the AI re-asks about testing rigor, escalate by naming the test file. "`docs/MANUAL_TESTS.md` has six customer rounds plus iPad-specific tests plus edge cases. I ran them on a real iPad before every push. Unit tests for the XState machine are on the v1.1 list because the manual suite covers every reachable state and the machine has 8 of them."

## Moment-of-truth block (defending decisions an LLM made)

The vendor names, customer dialogue, and art accessories were AI-suggested and human-approved. Commit `8c43b45` lays out the bazaar shell wiring. Commit `415b5fe` adds the integer-fraction foundation. Both reviewable.

The Boxy-to-Trade-Mogging pivot was a user-driven collaborative decision. The user explicitly pushed back on the engagement-loop framing I had applied to Skinner's writing; their pushback was correct and the design improved.

The cheapest-combo solver was a deliberate engineering choice. BFS over piece counts with prune-when-greater-than-best, catalog up to five piece types per food, search depth at most six. I considered DP on the LCM-scaled integer weight and rejected it as over-tooling at this catalog size.

## Things to NOT say

- "I didn't really test it." Even if a feature is rough, name what is tested and what is on the test list.
- "The AI decided." Even if AI contributed, the human made the call.
- "I just used the default." For a decision question, always have a reason.
- "It depends." For a follow-up, commit to an answer.
- "Eventually we want to..." Anchors the conversation in vapor. Use "v1.1 is in the iPad roadmap doc, here's the entry."
- "Trust me." Cite the doc, the commit, the rubric line.
- "Synthesis does it this way, so we do too." Cite the principle Synthesis is following, then apply it independently.
- "We don't use any LLM." We do use one, for scoring the kid's typed explanation 1-5. Be honest, then name the principle (kid never sees raw model text) and how we implement it (score → one of five pre-authored responses, fallback to keyword scoring on API failure).
