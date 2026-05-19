/**
 * Integer-only fraction utilities. No floats anywhere. The point of this
 * module is to make fraction equivalence questions (1/2 vs 2/4) bulletproof
 * by never letting JavaScript number-coercion enter the validation path.
 *
 * Used by the validation rule engine and by the legend's "simplify" affordance.
 */

import type { Fraction } from '../state/types';

/**
 * Construct a fraction. Denominator must be > 0. Negative numerators are fine
 * (improper fractions on higher levels reuse the same type).
 *
 * Throws on invalid denominator so the bug surfaces at construction, not at
 * comparison time three frames later.
 */
export function fraction(n: number, d: number): Fraction {
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    throw new Error(`fraction(${n}, ${d}): numerator and denominator must be integers`);
  }
  if (d <= 0) {
    throw new Error(`fraction(${n}, ${d}): denominator must be positive, got ${d}`);
  }
  return { n, d };
}

/**
 * Are two fractions the same amount? This is the equivalence check used
 * everywhere: 1/2 equals 2/4 equals 4/8 because 1*4 == 2*2, 2*8 == 4*4, etc.
 */
export function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return a.n * b.d === b.n * a.d;
}

/** Greatest common divisor by Euclidean algorithm. Always returns >= 0. */
function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Reduce a fraction to lowest terms. 4/8 simplifies to 1/2. The sign stays
 * on the numerator. 0/anything returns 0/1 (canonical zero).
 */
export function simplify(f: Fraction): Fraction {
  if (f.n === 0) return { n: 0, d: 1 };
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}

/** True if the fraction is already in lowest terms. */
export function isSimplified(f: Fraction): boolean {
  const s = simplify(f);
  return s.n === f.n && s.d === f.d;
}

/**
 * Multiply a fraction by an integer, returning a result only if the product
 * is itself a whole number. Used by the validation rule: the rule says "blue
 * = 1/2"; the touching count must be exactly 1/2 * (colored-cell-count).
 * If 1/2 * (colored-cell-count) is not an integer, the level was authored
 * wrong; surface the bug rather than rounding.
 */
export function multiplyByInt(f: Fraction, k: number): { ok: true; value: number } | { ok: false } {
  if (!Number.isInteger(k)) {
    throw new Error(`multiplyByInt: k must be integer, got ${k}`);
  }
  const num = f.n * k;
  if (num % f.d !== 0) return { ok: false };
  return { ok: true, value: num / f.d };
}

/** Render "1/2" or "2/4". No simplification, no spaces. */
export function formatFraction(f: Fraction): string {
  return `${f.n}/${f.d}`;
}
