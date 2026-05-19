/**
 * Trade Mogging game state machine (XState v5).
 *
 * States:
 *   intro       — title screen, "Tap to start" gesture (also bootstraps Tone.js)
 *   shopping    — customer waiting, kid drags pieces to tray
 *   resolving   — submit pressed, evaluating
 *   mogSplash   — capybara sits on vendor head, MOGGED banner, profit drops in
 *   profitOk    — correct serve, not cheapest. Smaller cheer.
 *   lesson      — wrong serve, mini-lesson + explanation field
 *   advancing   — next customer is loading
 *   complete    — all customers served, final cash + recap
 *
 * Everything is event-driven; UI never sets state directly. The machine is the single source of
 * truth for "what should be on screen right now".
 */
import { assign, setup } from 'xstate';
import type { Customer, TradeOutcome, TrayPiece } from './types';
import { CUSTOMERS, STARTING_CASH } from './curriculum';
import { evaluateTrade } from './validate';

interface GameContext {
  cash: number;
  customerIndex: number;
  tray: TrayPiece[];
  lastOutcome: TradeOutcome | null;
  // The mogged vendor id is tracked separately so the animation has a stable target while
  // the tray is being cleared by the assign action.
  moggedVendorId: string | null;
}

type GameEvent =
  | { type: 'START' }
  | { type: 'DROP_PIECE'; tp: TrayPiece }
  | { type: 'REMOVE_PIECE'; trayId: string }
  | { type: 'CLEAR_TRAY' }
  | { type: 'SUBMIT' }
  | { type: 'ADVANCE' }
  | { type: 'RESTART' };

export const makeInitialContext = (): GameContext => ({
  cash: STARTING_CASH,
  customerIndex: 0,
  tray: [],
  lastOutcome: null,
  moggedVendorId: null,
});

/** Pull the active customer out of the curriculum without bounds-checking — guards downstream. */
export const customerFromContext = (ctx: GameContext): Customer | null =>
  ctx.customerIndex < CUSTOMERS.length ? CUSTOMERS[ctx.customerIndex] : null;

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    isMog: ({ context }) => context.lastOutcome?.kind === 'mog',
    isProfit: ({ context }) => context.lastOutcome?.kind === 'profit',
    isWrong: ({ context }) => {
      const k = context.lastOutcome?.kind;
      return k === 'wrong-amount' || k === 'wrong-food';
    },
    hasMoreCustomers: ({ context }) => context.customerIndex + 1 < CUSTOMERS.length,
  },
  actions: {
    addPieceToTray: assign({
      tray: ({ context, event }) => {
        if (event.type !== 'DROP_PIECE') return context.tray;
        return [...context.tray, event.tp];
      },
    }),
    removePieceFromTray: assign({
      tray: ({ context, event }) => {
        if (event.type !== 'REMOVE_PIECE') return context.tray;
        return context.tray.filter((tp) => tp.trayId !== event.trayId);
      },
    }),
    clearTray: assign({ tray: [] }),
    evaluateAndStore: assign(({ context }) => {
      const customer = customerFromContext(context);
      if (!customer) {
        return {
          lastOutcome: null,
          cash: context.cash,
          moggedVendorId: null,
        };
      }
      const outcome = evaluateTrade(customer, context.tray);
      let cashDelta = 0;
      let moggedVendorId: string | null = null;
      switch (outcome.kind) {
        case 'mog':
          cashDelta = outcome.profit + outcome.bonus;
          // The vendor that gets sat on = the vendor that contributed the most pieces by count.
          // Tiebreak: most expensive piece. This matches the visual intuition ("you outsmarted
          // THAT guy specifically").
          {
            const counts = new Map<string, { count: number; spent: number }>();
            for (const tp of context.tray) {
              const cur = counts.get(tp.piece.vendorId) ?? { count: 0, spent: 0 };
              cur.count += 1;
              cur.spent += tp.piece.price;
              counts.set(tp.piece.vendorId, cur);
            }
            let best: { vendorId: string; count: number; spent: number } | null = null;
            for (const [vendorId, agg] of counts) {
              if (
                best === null ||
                agg.count > best.count ||
                (agg.count === best.count && agg.spent > best.spent)
              ) {
                best = { vendorId, ...agg };
              }
            }
            moggedVendorId = best?.vendorId ?? null;
          }
          break;
        case 'profit':
          cashDelta = outcome.profit;
          break;
        case 'wrong-amount':
          cashDelta = -outcome.depositLost;
          break;
        case 'wrong-food':
          cashDelta = -outcome.depositLost;
          break;
      }
      return {
        lastOutcome: outcome,
        cash: Math.max(0, context.cash + cashDelta),
        moggedVendorId,
      };
    }),
    advanceCustomer: assign({
      customerIndex: ({ context }) => context.customerIndex + 1,
      tray: [],
      lastOutcome: null,
      moggedVendorId: null,
    }),
    resetGame: assign(() => makeInitialContext()),
  },
}).createMachine({
  id: 'trade-mogging',
  initial: 'intro',
  context: makeInitialContext(),
  states: {
    intro: {
      on: { START: 'shopping' },
    },
    shopping: {
      on: {
        DROP_PIECE: { actions: 'addPieceToTray' },
        REMOVE_PIECE: { actions: 'removePieceFromTray' },
        CLEAR_TRAY: { actions: 'clearTray' },
        SUBMIT: { target: 'resolving' },
      },
    },
    resolving: {
      entry: 'evaluateAndStore',
      always: [
        { target: 'mogSplash', guard: 'isMog' },
        { target: 'profitOk', guard: 'isProfit' },
        { target: 'lesson', guard: 'isWrong' },
      ],
    },
    mogSplash: {
      on: { ADVANCE: [{ target: 'advancing', guard: 'hasMoreCustomers' }, { target: 'complete' }] },
    },
    profitOk: {
      on: { ADVANCE: [{ target: 'advancing', guard: 'hasMoreCustomers' }, { target: 'complete' }] },
    },
    lesson: {
      // Kid can either acknowledge and move on, OR clear the tray and retry the SAME customer.
      // The CLEAR_TRAY event also sends them back to shopping so they get the same order.
      on: {
        ADVANCE: [{ target: 'advancing', guard: 'hasMoreCustomers' }, { target: 'complete' }],
        CLEAR_TRAY: { target: 'shopping', actions: 'clearTray' },
      },
    },
    advancing: {
      entry: 'advanceCustomer',
      always: 'shopping',
    },
    complete: {
      on: { RESTART: { target: 'intro', actions: 'resetGame' } },
    },
  },
});
