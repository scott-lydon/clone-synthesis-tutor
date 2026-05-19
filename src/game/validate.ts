/**
 * Tray validator + cheapest-combination solver.
 *
 * The two things this module decides:
 *   1. Did the kid's submitted tray equal the customer's target fraction? (Outcome split)
 *   2. Was it the cheapest possible way to get there? (MOG detection)
 *
 * The cheapest-combo solver is a small bounded BFS over piece counts. It is intentionally
 * NOT optimized — the catalog tops out at ~5 piece types per food, and targets are at most
 * 1 whole, so the search space is < 100 nodes. If we ever scale beyond that, swap for DP on
 * the LCM-scaled integer weight (which is what the brute force is morally doing anyway).
 */
import type { Customer, Fraction, TrayPiece, TradeOutcome, VendorPiece } from './types';
import { addFractions, equalFractions, lessThan, makeFraction, sumSizes, ZERO } from './fraction';
import { piecesForFood, WRONG_AMOUNT_DEPOSIT, WRONG_FOOD_DEPOSIT } from './curriculum';

/** Submit the tray. Pure function — caller mutates state. */
export const evaluateTrade = (customer: Customer, tray: ReadonlyArray<TrayPiece>): TradeOutcome => {
  // Empty tray = wrong amount (zero), counts as a fail, kid loses deposit.
  if (tray.length === 0) {
    return { kind: 'wrong-amount', submittedTotal: ZERO, depositLost: WRONG_AMOUNT_DEPOSIT };
  }

  // Wrong-food check is checked first so the kid gets a specific error instead of just "wrong amount".
  // Mixed-food tray also counts as wrong-food (we don't try to be clever about subsetting).
  const allCorrectFood = tray.every((tp) => tp.piece.food === customer.food);
  if (!allCorrectFood) {
    return { kind: 'wrong-food', depositLost: WRONG_FOOD_DEPOSIT };
  }

  const total = sumSizes(tray.map((tp) => tp.piece.size));
  const submittedCost = tray.reduce((acc, tp) => acc + tp.piece.price, 0);

  if (!equalFractions(total, customer.target)) {
    return { kind: 'wrong-amount', submittedTotal: total, depositLost: WRONG_AMOUNT_DEPOSIT };
  }

  // Correct amount. Was it cheapest? Use a tiny epsilon because we are comparing dollars, not fractions,
  // and the catalog uses .25 / .50 / .75 values which are float-exact, but a future $1.99 price could
  // introduce drift. 0.005 = half a penny is safe and still narrower than any catalog gap.
  const cheaperBy = submittedCost - customer.minimumCost;
  if (cheaperBy <= 0.005) {
    return {
      kind: 'mog',
      profit: customer.payout - submittedCost,
      bonus: customer.mogBonus,
      submittedCost,
    };
  }

  return {
    kind: 'profit',
    profit: customer.payout - submittedCost,
    submittedCost,
    cheaperBy,
  };
};

/**
 * Find the cheapest combination of pieces summing exactly to `target`, restricted to pieces of the
 * customer's food. Returns null if no combination exists (curriculum guarantees one always exists,
 * but the validator should be honest).
 *
 * Used by:
 *   - curriculum-author tooling (to verify the minimumCost value in CUSTOMERS)
 *   - the lesson panel after a wrong serve, to show the kid an example cheapest path
 */
export const cheapestCombination = (customer: Customer): { pieces: VendorPiece[]; cost: number } | null => {
  const catalog = piecesForFood(customer.food);
  // Each piece can be used multiple times. Limit count per piece to ceil(target / size) so we don't
  // search infinite combinations of microscopic pieces.
  type Node = { remaining: Fraction; chosen: VendorPiece[]; cost: number };
  const start: Node = { remaining: customer.target, chosen: [], cost: 0 };
  let best: { pieces: VendorPiece[]; cost: number } | null = null;

  // Sort catalog descending by size to prune fast: pick big pieces first, then dust.
  const sortedCatalog = [...catalog].sort((a, b) => b.size.num / b.size.den - a.size.num / a.size.den);

  const search = (node: Node, startIdx: number): void => {
    if (equalFractions(node.remaining, ZERO)) {
      if (best === null || node.cost < best.cost) {
        best = { pieces: [...node.chosen], cost: node.cost };
      }
      return;
    }
    if (best !== null && node.cost >= best.cost) return; // prune
    for (let i = startIdx; i < sortedCatalog.length; i++) {
      const piece = sortedCatalog[i];
      // Only try this piece if it fits in remaining.
      if (lessThan(node.remaining, piece.size) && !equalFractions(node.remaining, piece.size)) continue;
      const nextRemaining = addFractions(node.remaining, { num: -piece.size.num, den: piece.size.den });
      search(
        {
          remaining: nextRemaining,
          chosen: [...node.chosen, piece],
          cost: node.cost + piece.price,
        },
        i, // allow reusing the same piece type
      );
    }
  };

  search(start, 0);
  return best;
};
