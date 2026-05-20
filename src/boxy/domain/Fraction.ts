/**
 * Fraction value type. Immutable. Supports the operations needed for the fraction
 * equivalence lesson: simplify, equivalence check, addition (via the Bar reducer),
 * decimal conversion.
 *
 * Why a class instead of a tuple {n, d}: this is the one place we enforce the
 * invariants (denominator non-zero, sign on the numerator). A bare object literal
 * would let any { numerator, denominator } pretend to be a Fraction and skip those
 * checks, which is exactly the bug class fractions in elementary curricula are
 * famous for.
 */
export class Fraction {
  readonly numerator: number;
  readonly denominator: number;

  constructor(numerator: number, denominator: number) {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
      throw new Error(
        `Fraction requires integer numerator and denominator, got ${numerator}/${denominator}. ` +
          `Bug: a non-integer reached the Fraction constructor. Trace the call site and round ` +
          `to integers before constructing. If a decimal value was intended, this is the wrong type.`,
      );
    }
    if (denominator === 0) {
      throw new Error(
        `Fraction denominator cannot be zero (numerator was ${numerator}). ` +
          `Bug: a divide-by-zero reached this code path. Most likely the divisor came from an ` +
          `unvalidated source (JSON, user input, default value). Validate at the source.`,
      );
    }
    // Normalize the sign onto the numerator so simplified() and equivalentTo() are predictable.
    if (denominator < 0) {
      this.numerator = -numerator;
      this.denominator = -denominator;
    } else {
      this.numerator = numerator;
      this.denominator = denominator;
    }
  }

  /** Greatest common divisor, always positive. */
  private static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return a === 0 ? 1 : a;
  }

  /** Returns this fraction in lowest terms. 4/8 -> 1/2, 6/9 -> 2/3, 0/anything -> 0/1. */
  simplified(): Fraction {
    if (this.numerator === 0) return new Fraction(0, 1);
    const g = Fraction.gcd(this.numerator, this.denominator);
    return new Fraction(this.numerator / g, this.denominator / g);
  }

  isSimplified(): boolean {
    if (this.numerator === 0) return this.denominator === 1;
    return Fraction.gcd(this.numerator, this.denominator) === 1;
  }

  valueAsDecimal(): number {
    return this.numerator / this.denominator;
  }

  /** Two fractions are equivalent if their cross-products are equal. 1/2 ≡ 2/4 because 1*4 == 2*2. */
  equivalentTo(other: Fraction): boolean {
    return this.numerator * other.denominator === other.numerator * this.denominator;
  }

  toString(): string {
    return `${this.numerator}/${this.denominator}`;
  }
}
