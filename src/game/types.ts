/**
 * Trade Mogging domain types.
 *
 * Everything is modeled as exact rational numbers (numerator / denominator) so that
 * fraction arithmetic in {@link sumPieces} is bit-exact. Using JS floats here would
 * silently turn 1/3 + 1/3 + 1/3 into 0.9999... and then "wrong amount" punishments
 * would fire on correct kid answers. We've already lost three classrooms to that bug
 * in other tutors. Don't.
 */

/** A non-zero rational number with explicitly tracked numerator and denominator. */
export interface Fraction {
  /** Always >= 0 in this game. Customers never order negative pita. */
  readonly num: number;
  /** Always > 0. Validated at construction by {@link makeFraction}. */
  readonly den: number;
}

/** Pre-built bundle a vendor sells. e.g. the Goat sells "1/4 of a hummus tub for $2.50". */
export interface VendorPiece {
  readonly id: string;
  readonly vendorId: VendorId;
  /** The fraction-of-the-whole this piece represents (e.g. 1/4 of a hummus). */
  readonly size: Fraction;
  /** Price in dollars. Whole-cent precision. */
  readonly price: number;
  /** The food being sold; must match the customer's requested food for an order to fill. */
  readonly food: FoodId;
}

/** A piece the kid has dragged into the assembly tray. Same shape as VendorPiece plus a tray slot id. */
export interface TrayPiece {
  readonly trayId: string;
  readonly piece: VendorPiece;
}

/** All vendors in the bazaar. Closed set — add a new vendor here AND in curriculum.ts together. */
export type VendorId =
  | 'camel-pita'
  | 'goat-hummus'
  | 'pigeon-olive'
  | 'cat-falafel'
  | 'buffalo-boss';

/** All foods in the bazaar. Closed set. A vendor sells exactly one food. */
export type FoodId = 'pita' | 'hummus' | 'olive-scoop' | 'falafel' | 'baklava';

export interface Vendor {
  readonly id: VendorId;
  readonly displayName: string;
  readonly food: FoodId;
  readonly foodDisplayName: string;
  /** Pieces this vendor offers per customer round. Re-randomized between rounds if desired. */
  readonly pieces: ReadonlyArray<VendorPiece>;
  /** True for the boss (water buffalo). Bosses appear less often and carry the trickier denominators. */
  readonly isBoss: boolean;
}

export interface Customer {
  readonly id: string;
  /** Spoken-style order shown to the kid above the assembly tray. */
  readonly orderText: string;
  /** Exact fraction the kid must assemble. */
  readonly target: Fraction;
  /** Which food the customer wants. Pieces of other foods do not count toward the target. */
  readonly food: FoodId;
  /** Cash the customer pays IF the kid serves correctly. Higher than the kid's cost; difference = profit. */
  readonly payout: number;
  /** Internal: the cheapest possible cost to assemble this order using current vendor catalog.
   * Computed up front; used to detect MOG (kid found the cheapest combination). */
  readonly minimumCost: number;
  /** Bonus paid on top of payout for finding a cheapest-cost combo. The "you mogged the trader" prize. */
  readonly mogBonus: number;
}

/** The result of submitting an assembled tray. Discriminated union — match exhaustively. */
export type TradeOutcome =
  | { kind: 'mog'; profit: number; bonus: number; submittedCost: number }
  | { kind: 'profit'; profit: number; submittedCost: number; cheaperBy: number }
  | { kind: 'wrong-amount'; submittedTotal: Fraction; depositLost: number }
  | { kind: 'wrong-food'; depositLost: number };

/** Score the explanation field gets from the silent AI validator. Drives which scripted response shows. */
export type ExplanationScore = 1 | 2 | 3 | 4 | 5;
