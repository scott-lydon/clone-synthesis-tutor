/**
 * MOG splash overlay: capybara literally sits on the vendor's head.
 *
 * Sequence (~2.2s):
 *   t=0      Vendor wobbles, dazed eyes
 *   t=0.2s   Capybara enters from off-screen-bottom, leaping toward vendor head
 *   t=0.6s   Capybara lands, sits, sunglasses appear (smug mood)
 *   t=0.8s   "TRADE MOGGED!" banner flashes in
 *   t=1.2s   Profit + bonus number floats up
 *   t=2.2s   "Next customer →" button appears
 *
 * Closing the splash is a tap, not an auto-advance. The kid controls pacing.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import type { Vendor } from '../game/types';
import { Capybara, VendorArt } from '../art/Animals';
import { playMogSting } from '../game/sound';

interface MogSplashProps {
  readonly vendor: Vendor;
  readonly profit: number;
  readonly bonus: number;
  readonly customerLabel: string;
  readonly hasMore: boolean;
  readonly onAdvance: () => void;
}

export const MogSplash: React.FC<MogSplashProps> = ({ vendor, profit, bonus, customerLabel, hasMore, onAdvance }) => {
  useEffect(() => {
    // Sound trigger lives in the splash itself because the splash mounts when (and only when) a
    // MOG fires. Keeps audio side-effects co-located with the visual effect.
    playMogSting();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bazaar-night/95 backdrop-blur-sm p-6"
    >
      <div className="relative w-72 h-80">
        {/* Vendor — wobbling and dazed */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-56"
          animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <VendorArt vendorId={vendor.id} state="mogged" className="w-full h-full" />
        </motion.div>
        {/* Capybara — leaps in, lands on vendor's head */}
        <motion.div
          className="absolute w-32 h-28"
          initial={{ y: 400, x: 80, rotate: -20, opacity: 0 }}
          animate={{ y: -8, x: 80, rotate: 0, opacity: 1 }}
          transition={{
            y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
            opacity: { duration: 0.2 },
            delay: 0.15,
          }}
        >
          <Capybara mood="smug" className="w-full h-full" />
        </motion.div>
      </div>

      <AnimatePresence>
        <motion.div
          key="mog-banner"
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="mt-6 px-8 py-4 rounded-2xl bg-lantern-gold text-bazaar-night"
        >
          <div className="text-5xl font-display tracking-widest text-center">TRADE MOGGED!</div>
          <div className="text-lg text-center mt-1 font-semibold">
            You outsmarted {vendor.displayName}
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.3 }}
        className="mt-4 flex flex-col items-center gap-1"
      >
        <div className="text-mint-fresh text-3xl font-display">+${(profit + bonus).toFixed(2)}</div>
        <div className="text-text-muted text-sm">
          ${profit.toFixed(2)} profit + ${bonus.toFixed(2)} mog bonus
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.3 }}
        onClick={onAdvance}
        className="mt-8 px-6 py-3 rounded-xl bg-bazaar-panel border-2 border-lantern-deep text-lantern-gold font-display text-lg tracking-wider active:scale-95"
      >
        {hasMore ? `Next customer →` : 'See total →'}
      </motion.button>
      <div className="text-text-muted text-xs mt-2 italic">{customerLabel}</div>
    </motion.div>
  );
};
