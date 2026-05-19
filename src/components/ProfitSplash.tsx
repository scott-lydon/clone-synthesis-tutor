/**
 * Smaller "correct but not cheapest" splash. The kid did the math right, just paid too much.
 * No MOG banner. Capybara is chill, not smug. Cheaper-route hint shown.
 */
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Capybara } from '../art/Animals';
import { playChaCh } from '../game/sound';

interface ProfitSplashProps {
  readonly profit: number;
  readonly cheaperBy: number;
  readonly hasMore: boolean;
  readonly onAdvance: () => void;
}

export const ProfitSplash: React.FC<ProfitSplashProps> = ({ profit, cheaperBy, hasMore, onAdvance }) => {
  useEffect(() => {
    playChaCh();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bazaar-night/90 backdrop-blur-sm p-6"
    >
      <div className="w-40 h-36">
        <Capybara mood="chill" className="w-full h-full" />
      </div>
      <div className="mt-4 px-6 py-3 rounded-2xl bg-mint-fresh/20 border-2 border-mint-fresh text-mint-fresh">
        <div className="text-3xl font-display text-center">CORRECT</div>
        <div className="text-base text-center mt-1">+${profit.toFixed(2)} profit</div>
      </div>
      <div className="text-text-muted text-sm mt-3 text-center max-w-xs">
        You could have used a cheaper combination and saved <span className="text-lantern-gold font-bold">${cheaperBy.toFixed(2)}</span>. Equivalent fractions are your friend.
      </div>
      <button
        onClick={onAdvance}
        className="mt-6 px-6 py-3 rounded-xl bg-bazaar-panel border-2 border-lantern-deep text-lantern-gold font-display text-lg tracking-wider active:scale-95"
      >
        {hasMore ? 'Next customer →' : 'See total →'}
      </button>
    </motion.div>
  );
};
