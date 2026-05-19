# Manual Tests — Trade Mogging

Playable, repeatable scenarios for verifying the manipulative on iPad Safari. Each scenario has the kid action, the expected on-screen result, and the underlying math being exercised.

These are the source of truth for "is the demo working?" Run every scenario before any demo or new submission.

## Setup

1. Open the deployed URL on iPad Safari (or `npm run dev` and open the printed URL).
2. Tap **OPEN THE STALL**.
3. Confirm the title screen disappears and Customer 1 of 6 appears with the order "I want exactly 1/2 of a pita, please."

## Scenario 1 — single-piece serve (no equivalence)

**Customer:** "I want exactly 1/2 of a pita, please." (Customer 1)

**Steps:**
1. Drag the **1/2 pita** piece from Habibi Camel into the tray.
2. Confirm the visual fill bar fills exactly halfway and shows **1/2 of 1/2 ✓** in green.
3. Tap **SERVE**.

**Expected:** MOG splash fires. Capybara hops onto Habibi Camel's head with sunglasses. "TRADE MOGGED!" banner. Cash increases from $15.00 to $20.50 ($3.00 profit + $2.50 bonus). 

**Atom exercised:** A2 (split), A5 (piece size name), A6 (notation), A7 (combine pieces — degenerate single-piece case).

## Scenario 2 — combine two same-denominator pieces

**Customer:** "Give me 1/2 of hummus. The good stuff." (Customer 2)

**Steps:**
1. Drag **two** 1/4 hummus pieces from Baba Goat into the tray.
2. Confirm fill bar shows **1/2 of 1/2 ✓** in green.
3. Tap **SERVE**.

**Expected:** Profit splash (not MOG). 1/4 + 1/4 cost $4.50 vs. cheapest 1/2 single piece at $4.50 — it's tied cheapest so MOG actually fires here. Confirm MOG fires.

**Wait — known edge case:** with prices $4.50 for one 1/2 vs $2.25 + $2.25 for two 1/4s, the total is exactly equal at $4.50. The cheapest-cost detection uses `<= 0.005` epsilon so both should MOG. Confirm.

**Atom exercised:** A7 (combine pieces), A9 (first equivalence — 2× 1/4 = 1/2).

## Scenario 3 — first true equivalence problem

**Customer:** "I am hosting guests. Bring me 3/4 of a hummus tub." (Customer 3)

**Steps:**
1. Drag 1× 1/2 hummus and 1× 1/4 hummus from Baba Goat.
2. Confirm fill bar reads **3/4 of 3/4 ✓**.
3. Tap **SERVE**.

**Expected:** MOG splash. Cash up by $11.00 payout − $6.75 cost + $3.50 mog bonus = +$7.75 net.

**Alternate steps (suboptimal):**
1. Drag 6× 1/8 hummus from Baba Goat instead.
2. Total: 6/8 = 3/4 ✓ but cost is $9.00.
3. Tap **SERVE**.
**Expected:** Profit splash (correct but not cheapest). "You could have used a cheaper combination and saved $2.25." Cash up by $11 − $9 = +$2.00.

**Atom exercised:** A9 (equivalence — 6/8 = 3/4).

## Scenario 4 — wrong amount, AI-validated lesson

**Customer:** Any non-trivial customer (use Customer 3 for repeatability).

**Steps:**
1. Drag 1× 1/2 hummus + 1× 1/8 hummus → tray shows 5/8.
2. Tap **SERVE**.

**Expected:**
- Sad trombone audio.
- Lesson panel slides up with side-by-side wedges: "You served 5/8 ≠ They wanted 3/4".
- A cheapest combination shown: "1/2 + 1/4 = 3/4 for $6.75".
- Text field "In your own words, what went wrong?" with a SERVE-yellow check-my-answer button.

**Steps continued:**
3. Type: `i forgot to add one more eighth because 5/8 is less than 6/8 which is the same as 3/4`.
4. Tap **Check my answer**.

**Expected:** Scripted response appears — should be the score-5 line: "Exactly right. You said the key idea. Onward." (Mention of "6/8 = 3/4" + naming equivalence should land at 5.)

**Steps continued:**
5. Type instead: `idk`.
**Expected:** Score-1 scripted response: "Take another look. Compare the wedge you served..."

**Atom exercised:** A9 (equivalence — through reflection), A10 (equals sign as relation).

## Scenario 5 — wrong food

**Customer:** Any non-pita customer.

**Steps:**
1. Drag a pita piece from Habibi Camel into the tray when the customer wants something else.
2. Tap **SERVE**.

**Expected:** Lesson panel: "You served the wrong food. Customer wanted [food]." Deposit lost is $4.00 (not $2.00 — wrong-food has a steeper deposit).

## Scenario 6 — boss customer (equivalence forced)

**Customer:** "7/12 of my finest baklava. Do not waste my time." (Customer 6, boss)

**Steps (slick route):**
1. Drag 1× 1/3 baklava + 1× 1/4 baklava from Boss Buffalo.
2. Confirm fill bar reads **7/12** (because 1/3 = 4/12 and 1/4 = 3/12, sum = 7/12).
3. Tap **SERVE**.

**Expected:** MOG splash. Cost $7.50 = minimumCost. +$14.00 payout − $7.50 cost + $5.00 bonus = +$11.50 net.

**Atom exercised:** A9 (equivalence — converting 1/3 and 1/4 to twelfths), A8 (compare length / common denominator reasoning).

## Scenario 7 — retry after lesson

After any wrong serve and dismissing the lesson, tap **Retry this customer**. Confirm the tray clears, the same customer is still there, and you can drag fresh pieces.

## Scenario 8 — game complete

After serving all 6 customers, confirm the bazaar-closed screen appears with the total cash and an "Open tomorrow's bazaar" button that restarts to the intro.

## iPad-specific checks

- **Touch drag responsiveness:** A piece should follow the finger within ~80ms (TouchSensor delay). If lag is visible, check `useSensors` config in `Game.tsx`.
- **Pinch zoom blocked:** Two-finger pinch on the game area should not zoom. Confirmed via the viewport meta tag.
- **Audio unlock:** First tap (the START button) must successfully kick `Tone.start()`. If subsequent sounds are silent, Safari blocked the AudioContext start. Reload and retry.
- **Safe area:** On iPads with Face ID (no Home button), confirm no UI is hidden behind the home indicator at the bottom.

## Known issues to verify before declaring demo-ready

- Bundle size warning at build time (676 KB). Cosmetic — well under what a fiber-fed iPad will load instantly.
- AI validation requires `ANTHROPIC_API_KEY` set in Vercel env. Without it, the local fallback runs but the kid's response calibration is coarser.

## Issue reports — add new scenarios here as they're discovered

(none yet)
