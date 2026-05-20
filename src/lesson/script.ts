/**
 * Lesson script. Scripted phases, scripted lines, scripted remediation.
 *
 * Why scripted and not LLM-generated: the Synthesis brief and Engelmann's
 * Direct Instruction both demand faultless examples and unambiguous progress.
 * The LLM is the silent rubric scorer at the end (existing /api/validate on
 * the Trade Mogging side), not the teacher. The teacher is this file.
 *
 * Each Phase has:
 *   - id            stable string for navigation and tests
 *   - title         short header for the manipulative panel
 *   - chat[]        ordered tutor lines for this phase (rendered one at a time
 *                   with a small typing pause)
 *   - manipulative  declarative state for the bar panel
 *   - advance       what counts as "the kid is ready for the next phase"
 *   - remediation   keyed by reason — if the kid answers wrong, the tutor
 *                   says THIS line and re-asks. No "Try again," no shaming.
 *
 * Adding a new phase: append to PHASES, give it a unique id, and pick an
 * advance condition that maps to a single observable kid action (tap, drag,
 * multi-choice click). Avoid compound triggers; one decision per stage is
 * the whole point of atomization.
 */

/** A line the tutor says to the kid. */
export interface TutorLine {
  readonly text: string;
  /** How long to wait before showing the NEXT line, in ms. Sets the cadence. */
  readonly pauseAfterMs?: number;
}

/** A multiple-choice question with one or more correct answers. */
export interface ChoiceQuestion {
  readonly question: string;
  readonly choices: readonly Choice[];
}
export interface Choice {
  readonly label: string;
  readonly correct: boolean;
  /** If wrong, what the tutor says before re-asking. */
  readonly remediation?: string;
}

/**
 * Manipulative shape per phase. The lesson uses a small set of patterns:
 *   - "tap-split": one bar, kid taps it to split into halves, then again into
 *                  quarters. Pure exploration; advance on first split, not
 *                  on a specific count.
 *   - "compare-bars": two bars stacked, one split into halves, one into N
 *                     equal pieces. Kid drags-or-taps to fill the bottom bar
 *                     with pieces until it matches the top.
 *   - "two-bars-equivalence": same as compare-bars but with explicit target
 *                             ("fill the bottom bar to match the top half").
 *   - "info":       no manipulative; just a chat-driven phase with a Continue
 *                   button. Used for the bridge phases that hand off to Boxy
 *                   or Trade Mogging.
 */
export type Manipulative =
  | { readonly kind: 'tap-split'; readonly startingSplit: 1 | 2 | 4 }
  | {
      readonly kind: 'compare-bars';
      /** Top bar split into N equal pieces, all visible. */
      readonly topPieces: number;
      /** Bottom bar's denominator. Kid drops these pieces into it. */
      readonly bottomDenominator: number;
      /** How many pieces the kid must drop to advance. */
      readonly bottomTarget: number;
    }
  | { readonly kind: 'info' };

/** Phase-advance trigger. */
export type Advance =
  | { readonly kind: 'continue' } // shows a Continue button
  | { readonly kind: 'tap-anywhere' } // any tap on the bar
  | { readonly kind: 'split-twice' } // tap-split: kid must split at least twice
  | { readonly kind: 'choice'; readonly question: ChoiceQuestion }
  | { readonly kind: 'bar-filled' } // compare-bars: bottom bar reaches target
  | { readonly kind: 'jump-out'; readonly route: '/boxy' | '/trade' };

export interface Phase {
  readonly id: string;
  readonly title: string;
  readonly chat: readonly TutorLine[];
  readonly manipulative: Manipulative;
  readonly advance: Advance;
}

/* ──────────────────────────  THE SCRIPT  ────────────────────────── */

export const PHASES: readonly Phase[] = [
  /* ─── Phase 1: One whole.  Kid splits it. ─── */
  {
    id: 'whole',
    title: 'One whole bar',
    chat: [
      { text: 'Hey. See this long bar?', pauseAfterMs: 600 },
      { text: 'It is one whole thing.', pauseAfterMs: 800 },
      { text: 'Tap it.' },
    ],
    manipulative: { kind: 'tap-split', startingSplit: 1 },
    advance: { kind: 'tap-anywhere' },
  },

  /* ─── Phase 2: Halves. Kid splits again. ─── */
  {
    id: 'halves',
    title: 'Two pieces of the same size',
    chat: [
      { text: 'Nice. Now there are two pieces.', pauseAfterMs: 700 },
      { text: 'Each piece is the same size.', pauseAfterMs: 800 },
      { text: 'These are halves.', pauseAfterMs: 800 },
      { text: 'Tap a piece to split it again.' },
    ],
    manipulative: { kind: 'tap-split', startingSplit: 2 },
    advance: { kind: 'split-twice' },
  },

  /* ─── Phase 3: Quarters appear, name them. ─── */
  {
    id: 'name-fourths',
    title: 'Four pieces of the same size',
    chat: [
      { text: 'You split a half. Now you have smaller pieces.', pauseAfterMs: 900 },
      { text: 'Four equal pieces. What do we call each one?' },
    ],
    manipulative: { kind: 'tap-split', startingSplit: 4 },
    advance: {
      kind: 'choice',
      question: {
        question: 'Each of these four pieces is called…',
        choices: [
          {
            label: 'One half',
            correct: false,
            remediation:
              'A half is when you split into TWO. Here we split into FOUR. Try again.',
          },
          { label: 'One fourth', correct: true },
          { label: 'One quarter', correct: true },
          {
            label: 'Four',
            correct: false,
            remediation:
              'The number of pieces is four, but the name of each piece comes from how many we split into. Each one is a fourth.',
          },
        ],
      },
    },
  },

  /* ─── Phase 4: Bigger/smaller, the trap. ─── */
  {
    id: 'compare',
    title: 'Bigger pieces, smaller pieces',
    chat: [
      { text: 'You got it. Each piece is a fourth.', pauseAfterMs: 800 },
      { text: 'Quick question.' },
    ],
    manipulative: { kind: 'tap-split', startingSplit: 4 },
    advance: {
      kind: 'choice',
      question: {
        question: 'Which is bigger, one half or one fourth?',
        choices: [
          { label: 'One half', correct: true },
          {
            label: 'One fourth',
            correct: false,
            remediation:
              'When the bottom number gets bigger, the pieces get smaller. Four pieces of the bar are smaller than two pieces of the same bar.',
          },
          {
            label: 'They are the same',
            correct: false,
            remediation:
              'Look at the bar. The half takes up two of the small pieces. Halves are bigger.',
          },
        ],
      },
    },
  },

  /* ─── Phase 5: Write a fraction. ─── */
  {
    id: 'notation',
    title: 'How we write a fraction',
    chat: [
      { text: 'Cool. Now I will show you how we WRITE these.', pauseAfterMs: 900 },
      {
        text: 'One half looks like this: 1/2. The bottom number is how many pieces the bar got split into. The top number is how many pieces we are talking about.',
        pauseAfterMs: 1500,
      },
      {
        text: 'So one fourth looks like 1/4. Split into 4. Talking about 1.',
        pauseAfterMs: 1000,
      },
      { text: 'Tap Continue when ready.' },
    ],
    manipulative: { kind: 'info' },
    advance: { kind: 'continue' },
  },

  /* ─── Phase 6: Equivalence with quarters. ─── */
  {
    id: 'equivalence-quarters',
    title: 'How many fourths fit in one half?',
    chat: [
      { text: 'Here are two bars.', pauseAfterMs: 800 },
      {
        text: 'The top bar shows one half (1/2). The bottom bar is empty and split into fourths.',
        pauseAfterMs: 1100,
      },
      {
        text: 'Drop fourths into the bottom bar until it matches the top bar.',
      },
    ],
    manipulative: {
      kind: 'compare-bars',
      topPieces: 2,
      bottomDenominator: 4,
      bottomTarget: 2,
    },
    advance: { kind: 'bar-filled' },
  },

  /* ─── Phase 7: Name the equivalence. ─── */
  {
    id: 'equivalence-name',
    title: 'Two fourths = one half',
    chat: [
      { text: 'Two fourths fill the same space as one half.', pauseAfterMs: 900 },
      { text: 'We say: 1/2 equals 2/4. They are the same amount.', pauseAfterMs: 1100 },
      { text: 'This is called EQUIVALENCE. Same amount, different pieces.', pauseAfterMs: 1100 },
      { text: 'Tap Continue.' },
    ],
    manipulative: { kind: 'info' },
    advance: { kind: 'continue' },
  },

  /* ─── Phase 8: Equivalence with sixths. ─── */
  {
    id: 'equivalence-sixths',
    title: 'How many sixths fit in one half?',
    chat: [
      { text: 'Try it with sixths.', pauseAfterMs: 700 },
      { text: 'Drop sixths into the bottom bar until it matches the top half.' },
    ],
    manipulative: {
      kind: 'compare-bars',
      topPieces: 2,
      bottomDenominator: 6,
      bottomTarget: 3,
    },
    advance: { kind: 'bar-filled' },
  },

  /* ─── Phase 9: Three equivalents. ─── */
  {
    id: 'equivalence-summary',
    title: 'Same amount, different names',
    chat: [
      { text: 'Three sixths is also one half.', pauseAfterMs: 800 },
      { text: 'So 1/2 = 2/4 = 3/6.', pauseAfterMs: 1100 },
      {
        text: 'Every time you cut the pieces smaller, you need MORE of them to make the same amount.',
        pauseAfterMs: 1200,
      },
      { text: 'You are ready for the big game. Tap Continue.' },
    ],
    manipulative: { kind: 'info' },
    advance: { kind: 'continue' },
  },

  /* ─── Phase 10: Hand-off to Boxy. ─── */
  {
    id: 'bridge-boxy',
    title: 'Boxy puzzles',
    chat: [
      { text: 'Now: boxy puzzles.', pauseAfterMs: 700 },
      {
        text:
          'You will drag block shapes onto a grid. Two blocks that touch each other have to follow a count ratio — like 1:2 or 3:5. The rules panel tells you which ratios count.',
        pauseAfterMs: 1500,
      },
      { text: 'Try it. The site nav at the top lets you come back to the lesson anytime.' },
    ],
    manipulative: { kind: 'info' },
    advance: { kind: 'jump-out', route: '/boxy' },
  },

  /* ─── Phase 11: Hand-off to Trade Mogging. ─── */
  {
    id: 'bridge-trade',
    title: 'Trade Mogging',
    chat: [
      { text: 'Last one: the bazaar.', pauseAfterMs: 700 },
      {
        text:
          'Customers come up and order a fraction of food, like 7/12 of a pita. Five vendors sell pieces in different sizes. Mix the pieces to match the order, cheapest. When you get it right, your capybara MOGS the vendor.',
        pauseAfterMs: 1600,
      },
      { text: 'Equivalence is the trick. Same amount, different pieces.' },
    ],
    manipulative: { kind: 'info' },
    advance: { kind: 'jump-out', route: '/trade' },
  },
];

export const phaseById = (id: string): Phase | undefined => PHASES.find((p) => p.id === id);
export const nextPhaseId = (currentId: string): string | null => {
  const i = PHASES.findIndex((p) => p.id === currentId);
  if (i < 0 || i === PHASES.length - 1) return null;
  return PHASES[i + 1].id;
};
