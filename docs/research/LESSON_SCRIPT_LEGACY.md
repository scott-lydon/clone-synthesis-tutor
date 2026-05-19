# Clone Synthesis Tutor — Lesson Script

The complete tutor utterances, branching logic, and manipulative cues for the fraction-equivalence lesson. Every state and transition here gets implemented one-to-one in `src/state/tutor.machine.ts`. Atom references in `BRACKETS` link back to `clone-synthesis-tutor-ATOMIZATION.md`.

Style rules for every tutor line:
- Warm, patient, encouraging. Match Synthesis's voice ("warm, patient, encouraging").
- Contractions are mandatory ("you've got it," not "you have got it").
- No exclamation-mark stacking. Maximum one "!" per line, and only when celebrating a correct answer.
- No "Great job!" "Excellent!" "Amazing!" None of that. Specific praise only: name what they did right.
- Third-grade vocabulary. Short sentences. No multi-clause prose.
- One question at a time. Never compound questions.
- No emojis. No mascots. No fantasy. The tutor is a friendly human voice in chat, full stop.

## Frame: who is the tutor

The chat UI shows tutor lines on the left. No avatar image. No name. The vibe is "a patient older sibling," not "AI assistant" and not "teacher with a clipboard." Lines arrive one at a time with a brief typing-indicator pause (250 to 400 ms) for cadence; no realistic typing animation longer than that, because that crosses into theatrical and burns time.

## Phase 1 — Explore (target ~90 seconds, mostly silent)

### State `explore.intro`
- **Tutor:** "Hey. See this bar at the top? It's one whole thing." `[A1.whole]`
- **Wait:** 800 ms.
- **Tutor:** "Try tapping it."
- **Cue:** the bar pulses once, very gently.

### State `explore.first_split`
**Trigger:** kid taps the bar.
- **Manipulative:** the bar splits cleanly into two equal pieces along a vertical center line. Soft "click" via Tone.js (a single short woodblock-ish tone, ~120 ms). `[A2.split] [A3.equal_pieces]`
- **Tutor:** "Nice. You split it into two pieces. Each piece is the same size, right?"
- **Wait:** 600 ms.
- **Tutor:** "Try splitting a piece again."

### State `explore.second_split`
**Trigger:** kid taps one of the halves.
- **Manipulative:** the tapped half splits into two equal quarters. The other half stays as a half. Now there are three pieces visible total: one half on the left, two quarters on the right.
- **Tutor (only if the kid pauses for >4 seconds):** "Cool. You can keep splitting. Or move on whenever you want."
- **Affordance:** a subtle "next" button fades in after the first split, in the bottom right.

### State `explore.poke`
**Trigger:** kid keeps poking. No tutor speech unless they idle.
- **Idle prompt at 20 seconds:** "Tap *Next* when you're ready for a question."

### Transition out
**Trigger:** kid taps Next.
- Go to `instruct.q1`.

## Phase 2 — Instruct (target ~2 minutes)

The manipulative resets to a clean state at the start of this phase: one whole bar, plus an empty workspace below labeled "Your workspace."

### State `instruct.q1` — Atom under test: `A5.piece_size_name`

- **Manipulative:** show one bar split into two halves. Label each half with "1/2." Below, a second bar split into four quarters, labels "1/4" on each.
- **Tutor:** "Look at the top bar. Each piece is called *one half*. We write it like this: 1/2."
- **Wait:** 1200 ms.
- **Tutor:** "Now look at the bottom bar. There are four pieces. What do we call each one of those pieces?"
- **Answer options (multiple choice, large touch-friendly buttons):**
  - "One half" → wrong: `remediate.q1.misconception_half`
  - "One fourth" → right: `instruct.q2`
  - "One quarter" → right: `instruct.q2` (synonym, accept)
  - "Four" → wrong: `remediate.q1.misconception_count`

#### Wrong-answer branches for q1
- **`remediate.q1.misconception_half`:** "Look at how many pieces the bar got split into. Four pieces means we call each one a *fourth*, not a half." Cue: pulse all four quarters in sequence, then highlight just the leftmost with "1/4" floating above. Loop back to `instruct.q1`.
- **`remediate.q1.misconception_count`:** "Almost. There are four pieces, but the *name* of each piece comes from how many we split into. Each one is a *fourth*." Cue: same pulse as above. Loop back to `instruct.q1`.

### State `instruct.q2` — Atom under test: `A5.piece_size_name` (the bigger-number trap)

- **Tutor:** "You got it. Each one is a fourth."
- **Wait:** 800 ms.
- **Tutor:** "Quick check. Which is bigger: one half, or one fourth?"
- **Answer options:**
  - "One half" → right: `instruct.q3`
  - "One fourth" → wrong: `remediate.q2.bigger_number`
  - "They're the same" → wrong: `remediate.q2.same_trap`

#### Wrong-answer branches for q2
- **`remediate.q2.bigger_number`:** "When the bottom number gets bigger, the *pieces* get smaller. Four pieces of the same bar are smaller than two pieces of the same bar." Cue: animate the two bars sliding to share a baseline. The 1/2 piece visibly extends past the 1/4 piece. Loop back to `instruct.q2`.
- **`remediate.q2.same_trap`:** "Look closely. Line them up next to each other." Cue: 1/2 and 1/4 slide to the same baseline. The size difference is now obvious. "Which one reaches further?" → re-ask `instruct.q2`.

### State `instruct.q3` — Atom under test: `A7.combine_pieces`, introduce the smash

- **Tutor:** "Right. One half is bigger than one fourth."
- **Wait:** 800 ms.
- **Tutor:** "Now try this. Drag two of the one-fourth pieces on top of each other in your workspace."
- **Manipulative:** the workspace lights up subtly. Two 1/4 blocks are now draggable. A faint outline shows where to drop them.

#### Correct interaction
**Trigger:** kid drags one 1/4 onto another 1/4 in the workspace.
- **Manipulative:** smash animation. The two 1/4 blocks merge into a single 1/2-sized block, with a satisfying "thunk" via Tone.js (a slightly lower-pitched, slightly longer tone than the split click, ~250 ms). The new block is labeled "1/2" above and "2/4" below it. `[A7.combine_pieces]`
- Go to `instruct.q4`.

#### Wrong interaction
- **Tried to drag a 1/2 onto a 1/4:** snap back, the 1/4 floats home, two 1/4 blocks pulse gently. Tutor: "Pieces only combine when they are the same size. Try the two pieces that look exactly alike."
- **Idle for >25 seconds without dragging:** Tutor: "Try grabbing one of the small pieces and dragging it on top of the other small piece." A finger-pointer animation shows the gesture once.

### State `instruct.q4` — Atom under test: `A9.equivalence`, `A10.equals_sign`

- **Tutor:** "Look at what you just made. It says 1/2 on top and 2/4 on the bottom."
- **Wait:** 1000 ms.
- **Tutor:** "Are 1/2 and 2/4 the same amount, or different amounts?"
- **Answer options:**
  - "The same amount" → right: `instruct.q4.celebrate` then `check.problem1`
  - "Different amounts" → wrong: `remediate.q4.length_check`
  - "I don't know" → soft-wrong: `remediate.q4.length_check`

#### Wrong/uncertain branches for q4
- **`remediate.q4.length_check`:** "Let's check. Watch what happens when we line them up." Cue: the combined block slides next to a fresh 1/2 block. They share a baseline. They are visually identical in length. "What do you see?" Re-ask q4.

#### Celebrate
- **`instruct.q4.celebrate`:** Tutor: "You've got it. 1/2 and 2/4 are the same amount." The equals sign between them illuminates with a single soft pulse. No confetti yet; the explicit celebration is the win screen at the end.

## Phase 3 — Check (target ~60 seconds, three problems)

The check phase pulls from atoms already taught. Per Engelmann's 10/90 rule, only one new wrinkle (the 1/8 transfer in problem 3); everything else is review and application.

### State `check.problem1` — `A7` + `A9` integrated

- **Manipulative reset:** workspace cleared. A "target" outline appears showing a 1/2-sized empty space. Below the workspace, an unlimited supply of 1/4 and 1/8 blocks is available to drag.
- **Tutor:** "Show me 1/2 by combining smaller pieces."
- **Correct:** kid drags two 1/4 blocks into the target. Smash. Block reads "1/2" with "2/4" beneath. → `check.problem2`.
- **Acceptable alt:** kid drags four 1/8 blocks into the target. They smash pairwise into 1/4 blocks, then again into 1/2. Tutor reaction: "Nice. Four eighths also make a half." → `check.problem2` with a small atom credit for `transfer.A11`.
- **Wrong:** kid drags a single 1/4 in. Tutor: "That's a quarter. We need a half. Try adding another piece." Manipulative leaves the 1/4 in place.

### State `check.problem2` — `A9` solo

- **Manipulative:** display two 1/4 blocks on the left side, one 1/2 block on the right side. Both groups are at the same baseline. An empty "=" or "≠" choice in the middle.
- **Tutor:** "Look at this. Are these the same amount, or different?"
- **Correct:** kid taps "=" → "You got it. Two fourths is the same as one half." → `check.problem3`.
- **Wrong:** kid taps "≠." Tutor: "Look at the lengths. Line them up." Both arrangements pulse to show identical width. Re-ask.

### State `check.problem3` — `A7` chained, transfer

- **Manipulative:** target outline showing a 1/2-sized empty space. Supply: only 1/8 blocks now (no 1/4 or 1/2 available).
- **Tutor:** "Last one. Make a half using only the smallest pieces."
- **Correct:** kid drags four 1/8 blocks in. They smash pairwise into 1/4s, then again into 1/2. → `win`.
- **Stuck (idle >30 seconds):** Tutor: "Try combining two of the small pieces first to make a bigger one." (Hints at the chain, does not solve it.)
- **Wrong (e.g., drops 3 1/8s and stops):** Tutor: "Almost. You need one more piece to make a half. How many eighths make a half?"

## Win screen

- **Manipulative:** all the 1/2-sized blocks the kid has made through the lesson slide into a vertical stack, aligned at a shared baseline, with their labels visible. The visual is a tidy column showing 1/2 = 2/4 = 4/8.
- **Tutor:** "You got it. 1/2 and 2/4 are the same amount. So are 4/8."
- **Visual affirmation:** one quick soft confetti burst, ~1.2 seconds. Then silence. The "Restart lesson" button fades in.
- **No "next lesson," no "keep playing," no XP, no coins, no badges, no leaderboard, no streak.** This is the off-ramp. Per Skinner: "the most overlooked feature of any educational tool is the moment the user leaves the digital environment."

## Edge cases the script must handle

- **Tab visibility change:** if the kid backgrounds the app mid-lesson, on return the tutor says "Welcome back. We were on this part." and shows the current question again.
- **Reload:** the lesson resets cleanly to `explore.intro`. No persisted state required for a 5-minute lesson.
- **Audio muted:** every tutor line is also visible as text in the chat UI. The Tone.js sounds are not load-bearing. The smash gesture works silently.
- **Accessibility:** tutor lines are screen-reader friendly (no decorative characters that read aloud). Manipulative pieces have ARIA labels matching their fraction name ("one fourth piece"). High-contrast pass for color blindness: the 1/2 and 1/4 colors must be distinguishable in grayscale.
- **Touch vs mouse:** every gesture works with both. No hover-only states. No double-tap requirements.

## What this script intentionally does *not* include

- No second concept (no 1/3, no 3/4, no simplification). Scope.
- No assessment summary at the end. Scope.
- No teacher-dashboard view. Scope.
- No persisted progress across sessions. Scope.
- No personalization based on the kid's name. Scope.

All of those are listed in `docs/research/SCOPE_CUTS.md` once the repo is scaffolded, so the cohort breakout and AI interview can answer "what did you leave out and why" without scrambling.
