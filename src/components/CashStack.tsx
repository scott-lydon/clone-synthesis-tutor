/**
 * Cash display. The kid's score IS their cash. No XP bar, no level meter, no decorative confetti.
 * The number going up is the feedback.
 *
 * Animates on value change with a brief pop and a "+$X" floater if positive, "-$X" if negative.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CashStackProps {
  readonly cash: number;
}

export const CashStack: React.FC<CashStackProps> = ({ cash }) => {
  const previousRef = useRef(cash);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const prev = previousRef.current;
    if (prev !== cash) {
      const diff = cash - prev;
      setDelta(diff);
      previousRef.current = cash;
      // Clear the floater after 1.2s. State, not setTimeout-in-render. Cancel-safe via the cleanup.
      const t = window.setTimeout(() => setDelta(null), 1200);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [cash]);

  return (
    <div className="relative inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-bazaar-panel border-2 border-lantern-deep shadow-lg">
      <div className="text-3xl">💰</div>
      <div className="text-2xl font-display text-lantern-gold tracking-wider">
        ${cash.toFixed(2)}
      </div>
      <AnimatePresence>
        {delta !== null && delta !== 0 && (
          <motion.div
            key={`delta-${previousRef.current}-${delta}`}
            initial={{ y: 0, opacity: 0, scale: 0.8 }}
            animate={{ y: -32, opacity: 1, scale: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className={`absolute -top-1 right-2 text-xl font-bold pointer-events-none ${
              delta > 0 ? 'text-mint-fresh' : 'text-spice-red'
            }`}
          >
            {delta > 0 ? '+' : ''}${delta.toFixed(2)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
