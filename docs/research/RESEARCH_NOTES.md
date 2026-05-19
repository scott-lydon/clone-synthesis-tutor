# Clone Synthesis Tutor — Research Notes (Monday, May 18 2026)

Findings that will ground every design decision. Will move into `docs/research/` once the repo at `/Users/scottlydon/Desktop/Clutter/iOS/clone-synthesis-tutor` is scaffolded.

## Primary sources read

- **Patrick Skinner, "The Ultimate Balance: Cognitive Load, Learning Outcomes, and Motivation in EdTech"** ([patskinner.substack.com/p/the-ultimate-balance-cognitive-load](https://patskinner.substack.com/p/the-ultimate-balance-cognitive-load), Nov 19 2025). This is the design rationale.
- **Patrick Skinner, "Why You Shouldn't Work in EdTech"** ([patskinner.substack.com/p/why-you-shouldnt-work-in-edtech](https://patskinner.substack.com/p/why-you-shouldnt-work-in-edtech), Nov 24 2025). Mission-alignment context.
- **Synthesis Tutor product** ([synthesis.com/tutor](https://www.synthesis.com/tutor), [synthesis.com/educators](https://www.synthesis.com/educators)). Brand voice and product positioning.
- **National Institute for Direct Instruction, Basic Philosophy of DI** ([nifdi.org/what-is-di/basic-philosophy.html](https://www.nifdi.org/what-is-di/basic-philosophy.html)). Engelmann's five principles, 10/90 mastery rule.
- **Superbuilders site** ([superbuilders.school](https://www.superbuilders.school/)). Brand owner; foundry for ed-tech companies staffed by GauntletAI's first cohort.

## Substack URL gotcha (recorded so I don't repeat it)

Patrick Skinner has two Substack accounts. The one with actual posts is `patskinner.substack.com` (no "rick"). The one that looks empty (2 subscribers, no posts on the profile page) is `patrickskinner.substack.com`. Always go to `patskinner.substack.com`.

## The two-word framework: clarifying, not distracting

Skinner's central insight, paraphrased: every aesthetic choice in a learning app either *clarifies* (helps the learner build a mental model, which is germane cognitive load) or *distracts* (steals working memory for no pedagogical reason, which is extraneous cognitive load). Beautiful is fine. Beautiful-but-pointless is not.

The equation Skinner proposes: `L = M × G(C) × T`, where:
- `L` = learning outcome
- `M` = motivation (multiplier, not just additive)
- `G(C)` = an inverted-U function of cognitive load (Yerkes-Dodson: peak at moderate load, collapse at extremes)
- `T` = time

Motivation cannot save a poorly-loaded experience. This is the framework the tutor will defend itself against in `docs/AI_INTERVIEW_PREP.md`.

## Design rules that fall out of the framework

1. **No fantastical mascots.** No talking fraction wizard, no anthropomorphized pizza slices. A 9-year-old's brain burns working memory reconciling impossibilities. The tutor is a friendly human voice in chat; the manipulative is a realistic-looking fraction bar with realistic split behavior.
2. **Every animation must teach.** The smash gesture (two 1/4 blocks combining into a 1/2 block) is clarifying because it shows how the math actually works. Confetti on win is acceptable only as the briefest "I did it" affirmation; if it stays on screen longer than 1.5 seconds it shifts from clarifying to distracting.
3. **Cognitive coherence beats calm or flashy.** Skinner cites a 2025 meta-analysis (Hinten et al.) showing pace does not matter, *fantasy* does. Our pace can be brisk so long as the world stays believable.
4. **Competence is the motivator.** Ages 4 to 8 (our target is 9, edge of the band) respond to "I did it" more than to stickers. The win screen reads "You got it. 1/2 and 2/4 are the same amount." It does not read "You earned 50 XP! Keep playing!"
5. **Design the off-ramp.** Skinner: the most overlooked feature of any ed-tech tool is the moment the kid leaves it. The lesson must end. No "play again to earn more coins." The brief's "lesson ends when they win" requirement is the off-ramp; respect it literally.
6. **Engelmann's 90/10 rule.** Each instructional moment is only 10% new material, 90% review and application. The check phase pulls from atoms we already taught in the explore and instruct phases.
7. **Skills isolated, then integrated** (Engelmann). Teach "splitting a whole into pieces" first. Then "pieces are equal sized." Then "two small pieces can equal one big piece." Only after each atom is solid does the lesson combine them into "1/2 equals 2/4."
8. **Tutor voice: warm, patient, encouraging.** Synthesis's own descriptor, also matches the brief. Specifically: contractions ("you've got it"), no rehearsed-sounding praise ("Excellent work!"), no condescension ("Good job, buddy!"), no exclamation points piled up.

## What Synthesis is and what we are not trying to clone

Synthesis is a full K-5 product with adaptive AI, micro-assessments throughout every lesson, multi-sensory experiences, parent and teacher dashboards, and progress reports. We are not building any of that. We are building **one** lesson, **one** concept (1/2 = 2/4), one explore-instruct-check arc, and shipping in five days.

The deliberate gap is the point. The README and breakout script will name what we left out and why, citing the brief's "scope is your friend" line.

Synthesis explicitly avoids raw LLMs ("we do not simply outsource your child's education teaching to an LLM"). That language is our authorization to ship scripted with confidence.

## Brand match anchors

- **Synthesis theme color (meta tag):** `#010d29` deep navy. We use this as the background.
- **Synthesis logo treatment:** white sans-serif wordmark, no decoration.
- **Synthesis tone words:** "warm, patient, encouraging," "math that clicks," "math that feels alive," "deep understanding," "multi-sensory."
- **Superbuilders site:** extremely minimal. Logo on a video background. Single paragraph. No nav. No marketing fluff. Confirms the Skinner principle of "beautifully simple" applies even to their own marketing.
- **Patrick Skinner personal brand:** authoritative, research-cited, footnotes everywhere, no jargon-for-jargon's-sake.

## What the breakout defense will cite

Three pre-baked, story-shaped concrete examples (per the AI interview prep rule about concrete examples):

1. **The aesthetic-paradox call.** "I deliberately did not add a confetti shower at the end. Skinner's Nov 19 piece cites Javora 2019 showing kids report preferring decorated apps but learn less from them. The win screen is one beat of subtle visual affirmation, then silence."
2. **The fantasy call.** "I did not animate the fraction bars as faces or characters. Hinten 2025 meta-analysis: pace does not hurt kids, fantasy does. A talking 1/4 block would steal cognitive bandwidth the kid needs to map the visual to the numeral."
3. **The off-ramp call.** "The lesson ends. There is no 'play again to earn coins' loop. Skinner: the off-ramp is the most overlooked feature in ed-tech. We respect it literally."

## Still to track down

- Skinner may have more on his Hashnode at [blog.patrickskinner.tech](https://blog.patrickskinner.tech). Lower priority than the build; revisit Friday if time permits.
- Superbuilders does not publish a brand guide. Will pull exact colors from their SVG assets once the repo is scaffolded (`brand-white.svg`, `logo.svg`).
- Tap-target spec: Apple HIG says 44pt minimum. Verify on a real iPad Thursday during QA day.
