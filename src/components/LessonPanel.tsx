/**
 * Mini lesson + AI-validated explanation field.
 *
 * Triggered after a wrong-amount or wrong-food serve. Shows:
 *   1. What the kid submitted vs. what was wanted (visual, side-by-side wedge comparison)
 *   2. One worked example of a correct (cheapest) combination
 *   3. A text field: "In your own words, what went wrong?"
 *   4. After the kid types and submits, the explanation is sent silently to /api/validate.
 *      The server returns a 1-5 rubric score. We map that to one of 5 pre-written scripted
 *      responses. The kid NEVER sees the LLM's raw response — Skinner brief satisfied.
 *
 * AI validation is a feature gate. If the API call fails or the env var is missing, we fall back
 * to client-side keyword matching so the lesson still functions in offline / local dev. The kid
 * gets a slightly less calibrated response but the game does not break.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Customer, TradeOutcome, ExplanationScore } from '../game/types';
import { Capybara } from '../art/Animals';
import { FoodPiece } from '../art/Food';
import { formatFraction } from '../game/fraction';
import { cheapestCombination } from '../game/validate';
import { playSadTrombone } from '../game/sound';

interface LessonPanelProps {
  readonly customer: Customer;
  readonly outcome: TradeOutcome;
  readonly hasMore: boolean;
  readonly onRetry: () => void;
  readonly onAdvance: () => void;
}

/** Scripted responses keyed by AI-assigned rubric score. The kid sees ONLY one of these strings. */
const SCRIPTED_RESPONSES: Record<ExplanationScore, string> = {
  5: "Exactly right. You said the key idea. Onward.",
  4: "Yes, that is the right shape. Lock it in.",
  3: "Close. You named part of it. The full idea: equivalent fractions let you swap one piece for two smaller pieces that add to the same amount.",
  2: "Not quite. The rule: pieces only add up correctly when they all measure the SAME whole. 1/2 and 1/4 are different sized pieces of the same pie, and you can mix them. 1/2 of pita does not equal 1/2 of hummus.",
  1: "Take another look. Compare the wedge you served to the wedge the customer wanted. Then read the cheapest combo we showed and try again.",
};

/** Client-side fallback when /api/validate is unavailable. Coarse but functional. */
const localScore = (text: string, hadWrongFood: boolean): ExplanationScore => {
  const t = text.toLowerCase().trim();
  if (t.length < 3) return 1;
  const concepts = ['equivalen', 'denominator', 'common', 'equal', 'same', 'twelfth', 'eighth', 'sixth', 'quarter', 'half', 'piece'];
  const hits = concepts.filter((c) => t.includes(c)).length;
  if (hadWrongFood && (t.includes('food') || t.includes('wrong') || t.includes('hummus') || t.includes('pita'))) return 4;
  if (hits >= 3) return 5;
  if (hits === 2) return 4;
  if (hits === 1) return 3;
  if (t.length > 30) return 2;
  return 1;
};

export const LessonPanel: React.FC<LessonPanelProps> = ({ customer, outcome, hasMore, onRetry, onAdvance }) => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scriptedResponse, setScriptedResponse] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    playSadTrombone();
  }, []);

  const cheapest = cheapestCombination(customer);
  const submittedTotal = outcome.kind === 'wrong-amount' ? outcome.submittedTotal : null;

  const handleSubmit = async (): Promise<void> => {
    if (text.trim().length === 0) return;
    setSubmitting(true);
    let score: ExplanationScore = 3;
    try {
      // Server route attempt. If the kid is offline (or the deploy doesn't have the API key),
      // this throws and we fall back to local scoring. We don't leak the raw response either way.
      const resp = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          explanation: text,
          target: formatFraction(customer.target),
          submitted: submittedTotal ? formatFraction(submittedTotal) : 'wrong food',
          food: customer.food,
        }),
      });
      if (!resp.ok) {
        throw new Error(
          `[LessonPanel] /api/validate returned HTTP ${resp.status}. ` +
            `Likely cause: ANTHROPIC_API_KEY env var missing on Vercel, or the function timed out. ` +
            `Falling back to local keyword scorer so the lesson still completes.`,
        );
      }
      const json = (await resp.json()) as { score?: number };
      const s = json.score;
      if (typeof s === 'number' && s >= 1 && s <= 5 && Number.isInteger(s)) {
        score = s as ExplanationScore;
      } else {
        // Bad payload — fall back, but log loudly so prod issues surface in dev tools.
        // eslint-disable-next-line no-console
        console.warn('[LessonPanel] /api/validate returned non-integer score; falling back. Got:', json);
        score = localScore(text, outcome.kind === 'wrong-food');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[LessonPanel] AI validation failed, using local fallback:', err);
      score = localScore(text, outcome.kind === 'wrong-food');
    }
    setScriptedResponse(SCRIPTED_RESPONSES[score]);
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-bazaar-night/95 backdrop-blur-sm p-4 pt-8"
    >
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-20 h-18">
            <Capybara mood="sad" className="w-full h-full" />
          </div>
          <div>
            <div className="text-2xl font-display text-spice-red">CUSTOMER WALKED.</div>
            <div className="text-text-muted text-sm">
              {outcome.kind === 'wrong-amount'
                ? `You served ${submittedTotal ? formatFraction(submittedTotal) : '?'}. Customer wanted ${formatFraction(customer.target)}.`
                : `You served the wrong food. Customer wanted ${customer.food.replace('-', ' ')}.`}
            </div>
          </div>
        </div>

        {/* Side-by-side visual: what kid served vs what was wanted */}
        {outcome.kind === 'wrong-amount' && submittedTotal && (
          <div className="flex items-center justify-around gap-4 p-4 mb-4 rounded-2xl bg-bazaar-panel border-2 border-bazaar-edge">
            <div className="flex flex-col items-center">
              <div className="text-text-muted text-xs uppercase mb-1">You served</div>
              <FoodPiece food={customer.food} size={submittedTotal} diameter={80} />
              <div className="text-spice-red font-display text-2xl mt-1">{formatFraction(submittedTotal)}</div>
            </div>
            <div className="text-text-muted text-3xl">≠</div>
            <div className="flex flex-col items-center">
              <div className="text-text-muted text-xs uppercase mb-1">They wanted</div>
              <FoodPiece food={customer.food} size={customer.target} diameter={80} />
              <div className="text-lantern-gold font-display text-2xl mt-1">{formatFraction(customer.target)}</div>
            </div>
          </div>
        )}

        {/* Cheapest worked example */}
        {cheapest && (
          <div className="p-4 mb-4 rounded-2xl bg-bazaar-panel border-2 border-mint-fresh/40">
            <div className="text-text-muted text-xs uppercase mb-2">A cheapest combination</div>
            <div className="flex flex-wrap items-center gap-2">
              {cheapest.pieces.map((p, i) => (
                <div key={`${p.id}-${i}`} className="flex items-center gap-1">
                  <FoodPiece food={p.food} size={p.size} diameter={48} />
                  <span className="text-lantern-gold font-display">{formatFraction(p.size)}</span>
                  {i < cheapest.pieces.length - 1 && <span className="text-text-muted">+</span>}
                </div>
              ))}
              <span className="text-text-muted">=</span>
              <span className="text-mint-fresh font-display text-xl">{formatFraction(customer.target)}</span>
              <span className="text-text-muted ml-2">for</span>
              <span className="text-mint-fresh font-bold">${cheapest.cost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Explanation field */}
        {!submitted ? (
          <div className="p-4 mb-4 rounded-2xl bg-bazaar-stall border-2 border-bazaar-edge">
            <label className="block text-text-muted text-sm uppercase tracking-wider mb-2">
              In your own words, what went wrong?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a sentence or two..."
              className="w-full min-h-[80px] p-3 rounded-xl bg-bazaar-night border-2 border-bazaar-edge text-text-primary placeholder:text-text-muted focus:border-lantern-gold focus:outline-none"
              maxLength={300}
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={text.trim().length === 0 || submitting}
              className="mt-3 w-full px-5 py-3 rounded-xl bg-lantern-gold text-bazaar-night font-display text-lg tracking-wider disabled:opacity-30 active:scale-95"
            >
              {submitting ? 'Checking...' : 'Check my answer'}
            </button>
          </div>
        ) : (
          <div className="p-4 mb-4 rounded-2xl bg-mint-fresh/10 border-2 border-mint-fresh">
            <div className="text-text-muted text-xs uppercase mb-2">Tutor says</div>
            <div className="text-text-primary text-base leading-relaxed">{scriptedResponse}</div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 rounded-xl bg-bazaar-edge text-text-primary font-semibold active:scale-95"
          >
            Retry this customer
          </button>
          <button
            onClick={onAdvance}
            className="flex-1 px-4 py-3 rounded-xl bg-bazaar-panel border-2 border-lantern-deep text-lantern-gold font-display tracking-wider active:scale-95"
          >
            {hasMore ? 'Next customer →' : 'See total →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
