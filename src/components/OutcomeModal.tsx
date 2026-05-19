/**
 * Outcome modal. Appears after the kid submits a tray.
 *
 * Four kinds of outcome, four kinds of presentation:
 *   - mog: cheapest combo, biggest celebration (capybara smug + sunglasses pop)
 *   - profit: correct but overpaid, polite win
 *   - wrong-amount: amount did not match target, soft fail with a teaching beat
 *   - wrong-food: tray contained pieces of wrong food, hard fail with a teaching beat
 *
 * The modal is the lesson moment, not the celebration. Per Skinner, the
 * payoff is the kid's competence; we celebrate the math, not the cash.
 * Confetti shows ONLY on mog and is brief.
 */
import type { FC } from 'react';
import type { TradeOutcome } from '../game/types';
import { formatFraction } from '../game/fraction';
import { Capybara } from '../art/Animals';

interface OutcomeModalProps {
  readonly outcome: TradeOutcome;
  readonly targetFraction: { num: number; den: number };
  readonly onContinue: () => void;
  /** True if there is no next customer (last round of the demo). */
  readonly isFinalRound: boolean;
}

export const OutcomeModal: FC<OutcomeModalProps> = ({ outcome, targetFraction, onContinue, isFinalRound }) => {
  const { title, body, accent, mood } = outcomeCopy(outcome, targetFraction);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bazaar-night/85 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-title"
    >
      <div className="bg-bazaar-panel border-2 border-bazaar-edge rounded-3xl p-8 max-w-md w-[90%] text-center shadow-2xl">
        <div className="w-32 h-32 mx-auto mb-4">
          <Capybara mood={mood} className="w-full h-full" />
        </div>
        <h2 id="outcome-title" className={`font-display text-4xl tracking-wider mb-3 ${accent}`}>
          {title}
        </h2>
        <p className="text-text-primary leading-relaxed mb-6 whitespace-pre-line">{body}</p>
        <button
          type="button"
          onClick={onContinue}
          className="px-8 py-3 rounded-xl font-display text-xl tracking-wider bg-lantern-gold text-bazaar-night hover:scale-105 transition-transform shadow-lg"
        >
          {isFinalRound ? 'See score' : 'Next customer'}
        </button>
      </div>
    </div>
  );
};

function outcomeCopy(outcome: TradeOutcome, target: { num: number; den: number }): {
  title: string;
  body: string;
  accent: string;
  mood: 'chill' | 'smug' | 'sad';
} {
  switch (outcome.kind) {
    case 'mog':
      return {
        title: 'You mogged them!',
        body: `Cheapest possible combo. You paid $${outcome.submittedCost.toFixed(2)} and pocketed $${outcome.profit.toFixed(2)} in profit, plus a $${outcome.bonus.toFixed(2)} mog bonus.`,
        accent: 'text-mint-fresh',
        mood: 'smug',
      };
    case 'profit':
      return {
        title: 'Served. Nice profit.',
        body: `You paid $${outcome.submittedCost.toFixed(2)} and made $${outcome.profit.toFixed(2)}. There was a cheaper combo for $${(outcome.submittedCost - outcome.cheaperBy).toFixed(2)} though. Watch for equivalent fractions next time.`,
        accent: 'text-lantern-gold',
        mood: 'chill',
      };
    case 'wrong-amount':
      return {
        title: 'Wrong amount.',
        body: `You served ${formatFraction(outcome.submittedTotal)}, but the customer wanted ${formatFraction(target)}. They walked off and you lost a $${outcome.depositLost.toFixed(2)} deposit. Check your tray total before serving.`,
        accent: 'text-spice-red',
        mood: 'sad',
      };
    case 'wrong-food':
      return {
        title: 'Wrong food.',
        body: `You served the wrong food. The customer is offended. You lost a $${outcome.depositLost.toFixed(2)} deposit. Only the stalls glowing gold sell what this customer wants.`,
        accent: 'text-spice-red',
        mood: 'sad',
      };
  }
}
