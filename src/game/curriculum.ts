/**
 * The bazaar catalog: vendors, the pieces they sell, customers, prices.
 *
 * Curriculum is intentionally hand-tuned, not randomized in v1. Each customer in {@link CUSTOMERS}
 * is designed to teach a specific atom from the atomization doc (A1 through A11). The progression
 * goes from "trivial single-piece order" to "you must use equivalence across vendors". Bosses
 * sit at indexes that force the kid to confront fractions that NO single vendor can produce
 * alone, so equivalence reasoning is mechanically required, not just rewarded.
 *
 * Editing this file? Re-run cheapestCost() in the dev console for every CUSTOMERS entry and
 * paste the new minimumCost / mogBonus values back in. There's no test for this yet because the
 * curriculum is small enough to eyeball, but watch this when the catalog grows.
 */
import type { Customer, FoodId, Vendor, VendorPiece } from './types';
import { makeFraction } from './fraction';

/* ─────────────────────────  Vendors  ──────────────────────────── */

/** Pita Camel sells in halves. Cheap, predictable, the "starter vendor". */
const pitaCamel: Vendor = {
  id: 'camel-pita',
  displayName: 'Habibi Camel',
  food: 'pita',
  foodDisplayName: 'pita',
  isBoss: false,
  pieces: [
    { id: 'camel-pita-1-2', vendorId: 'camel-pita', size: makeFraction(1, 2), price: 4.0, food: 'pita' },
    { id: 'camel-pita-1-4', vendorId: 'camel-pita', size: makeFraction(1, 4), price: 2.5, food: 'pita' },
  ],
};

/** Hummus Goat sells in quarters and eighths. Often the equivalence-bridge vendor. */
const hummusGoat: Vendor = {
  id: 'goat-hummus',
  displayName: 'Baba Goat',
  food: 'hummus',
  foodDisplayName: 'hummus',
  isBoss: false,
  pieces: [
    { id: 'goat-hummus-1-2', vendorId: 'goat-hummus', size: makeFraction(1, 2), price: 4.5, food: 'hummus' },
    { id: 'goat-hummus-1-4', vendorId: 'goat-hummus', size: makeFraction(1, 4), price: 2.25, food: 'hummus' },
    { id: 'goat-hummus-1-8', vendorId: 'goat-hummus', size: makeFraction(1, 8), price: 1.5, food: 'hummus' },
  ],
};

/** Olive Pigeon sells in eighths only. Forces eighths-thinking. */
const olivePigeon: Vendor = {
  id: 'pigeon-olive',
  displayName: 'Pigeon Pasha',
  food: 'olive-scoop',
  foodDisplayName: 'olive scoop',
  isBoss: false,
  pieces: [
    { id: 'pigeon-olive-1-4', vendorId: 'pigeon-olive', size: makeFraction(1, 4), price: 2.0, food: 'olive-scoop' },
    { id: 'pigeon-olive-1-8', vendorId: 'pigeon-olive', size: makeFraction(1, 8), price: 1.25, food: 'olive-scoop' },
  ],
};

/** Falafel Cat sells in thirds and sixths. The kid meets a new denominator family here. */
const falafelCat: Vendor = {
  id: 'cat-falafel',
  displayName: 'Salim Cat',
  food: 'falafel',
  foodDisplayName: 'falafel platter',
  isBoss: false,
  pieces: [
    { id: 'cat-falafel-1-3', vendorId: 'cat-falafel', size: makeFraction(1, 3), price: 3.0, food: 'falafel' },
    { id: 'cat-falafel-1-6', vendorId: 'cat-falafel', size: makeFraction(1, 6), price: 1.75, food: 'falafel' },
  ],
};

/** Boss Water Buffalo sells in twelfths. Pricing is hostile by design — you only use it when forced to. */
const buffaloBoss: Vendor = {
  id: 'buffalo-boss',
  displayName: 'Boss Buffalo',
  food: 'baklava',
  foodDisplayName: 'baklava tray',
  isBoss: true,
  pieces: [
    { id: 'buffalo-baklava-1-2', vendorId: 'buffalo-boss', size: makeFraction(1, 2), price: 6.0, food: 'baklava' },
    { id: 'buffalo-baklava-1-3', vendorId: 'buffalo-boss', size: makeFraction(1, 3), price: 4.25, food: 'baklava' },
    { id: 'buffalo-baklava-1-4', vendorId: 'buffalo-boss', size: makeFraction(1, 4), price: 3.25, food: 'baklava' },
    { id: 'buffalo-baklava-1-6', vendorId: 'buffalo-boss', size: makeFraction(1, 6), price: 2.5, food: 'baklava' },
    { id: 'buffalo-baklava-1-12', vendorId: 'buffalo-boss', size: makeFraction(1, 12), price: 1.5, food: 'baklava' },
  ],
};

export const ALL_VENDORS: ReadonlyArray<Vendor> = [pitaCamel, hummusGoat, olivePigeon, falafelCat, buffaloBoss];

/** Per-food vendor list — used by the assembly UI to highlight which stalls can fill the current order. */
export const vendorsForFood = (food: FoodId): ReadonlyArray<Vendor> =>
  ALL_VENDORS.filter((v) => v.food === food);

export const piecesForFood = (food: FoodId): ReadonlyArray<VendorPiece> =>
  ALL_VENDORS.filter((v) => v.food === food).flatMap((v) => v.pieces);

/* ─────────────────────────  Customers  ─────────────────────────── */

/**
 * Curriculum sequence. The minimumCost values below were calculated by hand against the catalog
 * above. If you change any vendor price OR piece set, recalc using cheapestCombination() and
 * update mogBonus = round(minimumCost * 0.4 + $1) clamped to $2–$8.
 */
export const CUSTOMERS: ReadonlyArray<Customer> = [
  // A1–A6: kid serves a single piece. Sets up "drag-from-stall to tray = serve customer" without
  // any combination math yet.
  {
    id: 'c-1',
    orderText: 'I want exactly 1/2 of a pita, please.',
    target: makeFraction(1, 2),
    food: 'pita',
    payout: 7.0,
    minimumCost: 4.0, // one 1/2 from camel
    mogBonus: 2.5,
  },
  // A7: combine two pieces. Equivalence not strictly required (1/4 + 1/4 = 1/2 OR one 1/2).
  // Cheapest is 2× 1/4 = $5.00 from Camel; but kid usually picks the single 1/2 = $4.00. THAT
  // is the cheaper combo and the MOG path.
  {
    id: 'c-2',
    orderText: 'Give me 1/2 of hummus. The good stuff.',
    target: makeFraction(1, 2),
    food: 'hummus',
    payout: 8.0,
    minimumCost: 4.5, // one 1/2 from goat
    mogBonus: 2.5,
  },
  // A9: first equivalence problem. 3/4 of hummus. Cheapest is 1/2 + 1/4 from goat ($4.50 + $2.25 = $6.75).
  // The kid who naively does 3× 1/4 ($6.75) ties. The kid who tries 6× 1/8 ($9.00) overpays. Either
  // way they touch equivalence: 6/8 = 3/4 = 1/2 + 1/4.
  {
    id: 'c-3',
    orderText: 'I am hosting guests. Bring me 3/4 of a hummus tub.',
    target: makeFraction(3, 4),
    food: 'hummus',
    payout: 11.0,
    minimumCost: 6.75, // 1/2 + 1/4 from goat (or 3× 1/4, same price)
    mogBonus: 3.5,
  },
  // A9 deeper: 5/8 of olive scoop. Pigeon Pasha sells 1/4 and 1/8 only. Solutions:
  // 1/4 + 1/4 + 1/8 = $5.25 (cheapest)
  // 1/4 + 3× 1/8 = $5.75
  // 5× 1/8 = $6.25
  {
    id: 'c-4',
    orderText: 'My olives. 5/8 of a scoop. Make it fast.',
    target: makeFraction(5, 8),
    food: 'olive-scoop',
    payout: 9.0,
    minimumCost: 5.25,
    mogBonus: 3.0,
  },
  // Thirds family. 2/3 of falafel. Cat sells 1/3 ($3) and 1/6 ($1.75).
  // 2× 1/3 = $6.00 (cheapest)
  // 1/3 + 2× 1/6 = $6.50
  // 4× 1/6 = $7.00
  {
    id: 'c-5',
    orderText: 'Two thirds of a falafel platter for me, my friend.',
    target: makeFraction(2, 3),
    food: 'falafel',
    payout: 10.5,
    minimumCost: 6.0,
    mogBonus: 3.0,
  },
  // BOSS round: 7/12 of baklava from Boss Buffalo. Pricing is hostile, but the kid can still
  // route through equivalence: 1/2 + 1/12 = $6.00 + $1.50 = $7.50 (cheapest)
  // 1/3 + 1/4 = $4.25 + $3.25 = $7.50 (tied cheapest, the SLICK route)
  // 1/4 + 1/4 + 1/12 = $7.75
  // Either cheapest combo MOGs the boss.
  {
    id: 'c-boss-1',
    orderText: '7/12 of my finest baklava. Do not waste my time.',
    target: makeFraction(7, 12),
    food: 'baklava',
    payout: 14.0,
    minimumCost: 7.5,
    mogBonus: 5.0,
  },
];

/** Deposit lost on a wrong serve. Same for every customer — kept simple for the kid's mental model. */
export const WRONG_AMOUNT_DEPOSIT = 2.0;
export const WRONG_FOOD_DEPOSIT = 4.0;

/** Starting cash. The kid can survive a small streak of mistakes; total wipeout takes ~6 bad serves. */
export const STARTING_CASH = 15.0;
