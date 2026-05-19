/**
 * Exact rational arithmetic for Trade Mogging.
 *
 * Why a custom Fraction module instead of just `number`: when a kid combines 1/3 + 1/3 + 1/3
 * we MUST get exactly 1, never 0.9999999... A wrong-amount punishment fired on a correct answer
 * would be catastrophic for the brief (kid mistrusts the math, not the tutor). All comparisons
 * in this module are exact integer comparisons on a/b.
 */
import type { Fraction } from './types';

/** Greatest common divisor via Euclid. Returns the absolute value. */
const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
};

/**
 * Construct a normalized Fraction. Throws on zero denominator (and not silently — this is the
 * exact bug class we want to surface loudly the first time someone introduces it).
 */
export const makeFraction = (num: number, den: number): Fraction => {
  if (!Number.isInteger(num) || !Number.isInteger(den)) {
    throw new Error(
      `[Fraction] makeFraction requires integers. Got num=${num} (${typeof num}), den=${den} (${typeof den}). ` +
        `If you are reading user input, parse it to integers FIRST.`,
    );
  }
  if (den === 0) {
    throw new Error(
      `[Fraction] Zero denominator passed to makeFraction(num=${num}, den=0). ` +
        `Likely cause: a vendor catalog entry forgot to set the piece's denominator. ` +
        `Check curriculum.ts for the offending VendorPiece.`,
    );
  }
  // Force positive denominator so equality below is unambiguous.
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: (num * sign) / g, den: (den * sign) / g };
};

export const ZERO: Fraction = { num: 0, den: 1 };
export const ONE: Fraction = { num: 1, den: 1 };

export const addFractions = (a: Fraction, b: Fraction): Fraction =>
  makeFraction(a.num * b.den + b.num * a.den, a.den * b.den);

export const equalFractions = (a: Fraction, b: Fraction): boolean =>
  // Both are normalized in makeFraction, so this is exact.
  a.num === b.num && a.den === b.den;

export const lessThan = (a: Fraction, b: Fraction): boolean =>
  a.num * b.den < b.num * a.den;

/** Pretty-print as "3/4" or "1" (when denominator collapses to 1). For UI only — never parsed back. */
export const formatFraction = (f: Fraction): string => {
  if (f.den === 1) return String(f.num);
  return `${f.num}/${f.den}`;
};

/** Decimal preview used by the live total bar's width, not by any equality check. */
export const toNumber = (f: Fraction): number => f.num / f.den;

/** Sum every tray piece's size. Empty tray returns 0/1. */
export const sumSizes = (sizes: ReadonlyArray<Fraction>): Fraction =>
  sizes.reduce<Fraction>((acc, s) => addFractions(acc, s), ZERO);
