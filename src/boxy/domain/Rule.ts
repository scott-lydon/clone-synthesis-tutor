import { Fraction } from "./Fraction";

/**
 * A color identity for a rule. We use a small palette of accessible, kid-readable
 * colors. The palette is also accessible (no red/green pair sole-distinction; the
 * shapes' square count is always visible too).
 */
export type RuleColor =
  | "orange"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "yellow"
  | "cyan";

export const RULE_COLOR_PALETTE: readonly RuleColor[] = [
  "orange",
  "green",
  "blue",
  "purple",
  "pink",
  "yellow",
  "cyan",
];

/**
 * Hex value for each rule color. A deliberately dusty, low-saturation palette
 * so the pieces feel calm on a dark surface and adjacent colors transition
 * smoothly into each other. Chosen to match the SuperBuilders feel: refined,
 * understated, never garish. Designer note: every value sits between 50% and
 * 70% saturation; full-saturation primaries are intentionally avoided.
 */
export const RULE_COLOR_FILL: Record<RuleColor, string> = {
  orange: "#e8a87c", // dusty terracotta
  green: "#a8c69f", // sage
  blue: "#9ab7c8", // slate-blue mist
  purple: "#b8a7c9", // dusty mauve
  pink: "#d9a7b0", // dusty rose
  yellow: "#e6c879", // honey
  cyan: "#94c0b6", // seafoam
};

/**
 * A glow color (rgba) for each rule. Used to paint adjacency hints on empty
 * grid cells next to a placed colored side, so the kid sees "here is what
 * color would have to extend if you placed a piece here." Lower opacity than
 * FILL so it reads as a hint, not a placement.
 */
export const RULE_COLOR_GLOW: Record<RuleColor, string> = {
  orange: "rgba(232, 168, 124, 0.22)",
  green: "rgba(168, 198, 159, 0.22)",
  blue: "rgba(154, 183, 200, 0.22)",
  purple: "rgba(184, 167, 201, 0.22)",
  pink: "rgba(217, 167, 176, 0.22)",
  yellow: "rgba(230, 200, 121, 0.22)",
  cyan: "rgba(148, 192, 182, 0.22)",
};

/**
 * A rule the player must satisfy when placing pieces adjacent to each other.
 *
 * Reading: "When two pieces share a side colored {color}, the placed piece's
 * square count over the new piece's square count must equal {fraction}, or any
 * equivalent fraction."
 *
 * The fraction is stored as authored (possibly unsimplified) so the kid can
 * tap to simplify it for a bonus, per the original Boxy concept.
 */
export interface Rule {
  readonly color: RuleColor;
  readonly fraction: Fraction;
}

/**
 * Does the (placedCount, newCount) pair satisfy this rule? Equivalent fractions
 * satisfy it: a rule of 2/5 is satisfied by 4/10, 6/15, etc.
 */
export function ruleSatisfied(rule: Rule, placedCount: number, newCount: number): boolean {
  const actual = new Fraction(placedCount, newCount);
  return actual.equivalentTo(rule.fraction);
}
