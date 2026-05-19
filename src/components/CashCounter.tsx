/**
 * Cash counter pill. Sits in the top-right of the header.
 *
 * Uses Framer Motion's animate-on-change pattern so the cash pop visibly when
 * it changes (cha-ching feels good even silently). The cash-pop keyframe in
 * tailwind.config.js handles the animation; we just toggle a key to re-trigger.
 */
import { useEffect, useState, type FC } from 'react';

interface CashCounterProps {
  readonly cash: number;
}

export const CashCounter: FC<CashCounterProps> = ({ cash }) => {
  // Re-key the visual whenever cash changes so the cash-pop animation re-plays.
  const [popKey, setPopKey] = useState(0);
  useEffect(() => {
    setPopKey((k) => k + 1);
  }, [cash]);

  return (
    <div className="bg-bazaar-stall border border-bazaar-edge rounded-full px-4 py-2 flex items-center gap-2">
      <span className="text-text-muted text-xs uppercase tracking-widest">Cash</span>
      <span key={popKey} className="font-mono text-2xl text-mint-fresh tabular-nums animate-cash-pop">
        ${cash.toFixed(2)}
      </span>
    </div>
  );
};
