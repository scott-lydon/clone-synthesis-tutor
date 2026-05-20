import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RULE_COLOR_FILL } from "../domain/Rule";

/**
 * Inline how-to-play, paged. One idea per card. The kid steps forward through
 * five short cards instead of reading a wall of text. Lives at the bottom of
 * the play column so it does not compete with the grid for attention.
 */
export function HowToPlay() {
  const [page, setPage] = useState(0);
  const total = PAGES.length;

  return (
    <div
      className="w-full max-w-3xl rounded-2xl"
      style={{
        background: "rgba(31, 41, 55, 0.45)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.10)",
      }}
    >
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(212, 200, 178, 0.08)" }}
      >
        <div
          className="font-semibold text-sm uppercase tracking-[0.18em]"
          style={{ color: "rgba(212, 200, 178, 0.75)" }}
        >
          How to play
        </div>
        <div className="text-slate-500 text-xs font-mono">
          {page + 1} / {total}
        </div>
      </div>
      <div className="px-6 py-6 min-h-[180px] relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {PAGES[page]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(212, 200, 178, 0.08)" }}
      >
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-slate-400 hover:text-slate-200 disabled:opacity-30 text-sm"
        >
          ← Back
        </button>
        <div className="flex gap-1.5">
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                background: i === page ? "#e6c879" : "rgba(212, 200, 178, 0.20)",
              }}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="disabled:opacity-30 text-sm font-semibold"
          style={{ color: "#e8d9a8" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

const PAGES: React.ReactNode[] = [
  <div key="goal">
    <h3 className="text-slate-100 text-lg font-semibold mb-2">Fill the grid</h3>
    <p className="text-slate-400 text-sm leading-relaxed">
      The grid starts with one piece already placed. Drag pieces from the tray to
      cover as many cells as you can. The grid intentionally has gaps; you do not
      need to fill it perfectly.
    </p>
  </div>,

  <div key="pieces">
    <h3 className="text-slate-100 text-lg font-semibold mb-2">Read each piece</h3>
    <p className="text-slate-400 text-sm leading-relaxed">
      Each tray piece shows its <em>shape</em> and a <em>box count</em> (the
      number in the middle). Colors stay hidden in the tray so you cannot
      shape-and-color match the answer; you reason about counts first. Colors
      reveal once the piece is placed on the grid.
    </p>
  </div>,

  <div key="rules">
    <h3 className="text-slate-100 text-lg font-semibold mb-2">Read the rules</h3>
    <p className="text-slate-400 text-sm leading-relaxed mb-3">
      Each rule is a color and a box-count ratio between two touching pieces.
      Order doesn't matter — a 2-box piece next to a 3-box piece reads the
      same as 3-box next to 2-box, both satisfy a green rule of{" "}
      <span className="text-slate-200 font-mono">2:3</span>:
    </p>
    <div
      className="flex items-center gap-3 rounded-lg p-3"
      style={{
        background: "rgba(20, 27, 41, 0.55)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.10)",
      }}
    >
      <div className="flex flex-col items-center">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="0" y="0" width="40" height="40" fill="#f5efe3" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="#e3d9c2" />
        </svg>
        <span className="text-slate-500 text-[10px] mt-1">2 boxes</span>
      </div>
      <div className="w-2 h-12 rounded" style={{ background: RULE_COLOR_FILL.green, opacity: 0.8 }} />
      <div className="flex flex-col items-center">
        <svg width="40" height="60" viewBox="0 0 40 60">
          <rect x="0" y="0" width="40" height="60" fill="#f5efe3" />
          <line x1="0" y1="20" x2="40" y2="20" stroke="#e3d9c2" />
          <line x1="0" y1="40" x2="40" y2="40" stroke="#e3d9c2" />
        </svg>
        <span className="text-slate-500 text-[10px] mt-1">3 boxes</span>
      </div>
      <div className="text-slate-300 text-xs leading-snug flex-1">
        A 2-box piece touching a 3-box piece satisfies the rule.{" "}
        <span className="text-slate-500">
          Equivalent ratios work: 4:6, 6:9, 8:12.
        </span>
      </div>
    </div>
  </div>,

  <div key="place">
    <h3 className="text-slate-100 text-lg font-semibold mb-2">Place a piece</h3>
    <p className="text-slate-400 text-sm leading-relaxed">
      Drag from the tray and drop on the grid. The piece sticks if every piece
      it touches makes a valid ratio with it (any rule). If not, it bounces back
      with a hint. Tap a placed piece to remove it. Anchors stay put.
    </p>
  </div>,

  <div key="hints">
    <h3 className="text-slate-100 text-lg font-semibold mb-2">Reach the ceiling</h3>
    <p className="text-slate-400 text-sm leading-relaxed">
      The toolbar shows two percents: <em>filled</em> (updates as you place) and{" "}
      <em>possible</em> (the ceiling for this round — most rounds have intentional
      gaps, so the ceiling is usually below 100%). Aim for the ceiling, not for 100%.
    </p>
  </div>,
];
