/**
 * Bar manipulative — tap-split + compare-bars renderer.
 *
 * Two modes, declared by the {@link Manipulative} discriminated union from
 * the script:
 *
 *   - tap-split   one bar; each tap on a piece splits it in half (1 → 2 → 4
 *                 → 8). Reports the new piece count to the parent so the
 *                 lesson can advance when the kid hits the target.
 *   - compare-bars  two bars stacked. Top is pre-filled at `topPieces`
 *                   density; bottom starts empty, denominator `N`, and the
 *                   kid taps the empty cells to deposit a 1/N piece. Reports
 *                   the count of placed pieces so the lesson can advance
 *                   when the bottom matches the top.
 *
 * The component is deliberately minimal — no drag-and-drop, no Tone.js
 * sound, no Framer animations. A 9-year-old on an iPad in Safari taps; the
 * bar responds. That's the entire interaction surface. Adding flair later
 * is purely additive.
 *
 * Internal state is the piece count (tap-split) or filled-count
 * (compare-bars). The parent owns nothing about the manipulative beyond the
 * advance signal it receives — that keeps the lesson reducer simple.
 */
import { useEffect, useState } from 'react';
import type { Manipulative } from './script';

interface Props {
  readonly manipulative: Manipulative;
  /** Reset internal state when this changes (phase change). */
  readonly resetKey: string;
  /** Number of split-events the kid has performed (tap-split). */
  readonly onTapSplit?: (currentPieces: number) => void;
  /** Number of pieces placed in the bottom bar (compare-bars). */
  readonly onFillProgress?: (count: number) => void;
}

const BAR_W = 480;
const BAR_H = 60;
const BAR_FILL = '#f5efe3';
const BAR_STROKE = '#0a0e1a';
const ACCENT = '#e6c879';

export const BarManipulative: React.FC<Props> = ({
  manipulative,
  resetKey,
  onTapSplit,
  onFillProgress,
}) => {
  if (manipulative.kind === 'info') {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm italic">
        (read the tutor on the left, then continue)
      </div>
    );
  }
  if (manipulative.kind === 'tap-split') {
    return (
      <TapSplit
        startingSplit={manipulative.startingSplit}
        resetKey={resetKey}
        onTapSplit={onTapSplit}
      />
    );
  }
  return (
    <CompareBars
      topPieces={manipulative.topPieces}
      bottomDenominator={manipulative.bottomDenominator}
      resetKey={resetKey}
      onFillProgress={onFillProgress}
    />
  );
};

/* ──────────────────────────  tap-split  ────────────────────────── */

const TapSplit: React.FC<{
  startingSplit: 1 | 2 | 4;
  resetKey: string;
  onTapSplit?: (currentPieces: number) => void;
}> = ({ startingSplit, resetKey, onTapSplit }) => {
  const [pieces, setPieces] = useState<number>(startingSplit);

  useEffect(() => {
    setPieces(startingSplit);
  }, [startingSplit, resetKey]);

  // A tap on any piece doubles the total piece count. Capped at 16 so a
  // panic-tapper does not split into invisible slivers.
  const onTap = (): void => {
    setPieces((p) => {
      const next = Math.min(p * 2, 16);
      if (onTapSplit) onTapSplit(next);
      return next;
    });
  };

  const sliceW = BAR_W / pieces;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={BAR_W}
        height={BAR_H}
        viewBox={`0 0 ${BAR_W} ${BAR_H}`}
        role="button"
        aria-label="Tap to split"
        onClick={onTap}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <rect x={0} y={0} width={BAR_W} height={BAR_H} fill={BAR_FILL} stroke={BAR_STROKE} strokeWidth={2} rx={6} />
        {Array.from({ length: pieces - 1 }).map((_, i) => {
          const x = sliceW * (i + 1);
          return <line key={i} x1={x} y1={0} x2={x} y2={BAR_H} stroke={BAR_STROKE} strokeWidth={2} />;
        })}
      </svg>
      <div className="text-text-muted text-sm">
        {pieces === 1 ? 'one whole' : `${pieces} equal pieces`}
      </div>
    </div>
  );
};

/* ──────────────────────────  compare-bars  ────────────────────────── */

const CompareBars: React.FC<{
  topPieces: number;
  bottomDenominator: number;
  resetKey: string;
  onFillProgress?: (count: number) => void;
}> = ({ topPieces, bottomDenominator, resetKey, onFillProgress }) => {
  // The TOP bar is shown with just one piece highlighted (the "target half"
  // we want the kid to match). Indices [0..topHighlighted - 1] are filled.
  const topHighlighted = 1;
  const [filled, setFilled] = useState<number>(0);

  useEffect(() => {
    setFilled(0);
  }, [resetKey, bottomDenominator]);

  const topSliceW = BAR_W / topPieces;
  const botSliceW = BAR_W / bottomDenominator;

  const onPlace = (): void => {
    if (filled >= bottomDenominator) return;
    setFilled((n) => {
      const next = n + 1;
      if (onFillProgress) onFillProgress(next);
      return next;
    });
  };

  const onUndo = (): void => {
    setFilled((n) => {
      const next = Math.max(0, n - 1);
      if (onFillProgress) onFillProgress(next);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* TOP bar — target */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-text-muted text-[11px] uppercase tracking-wider">target — fill this much</div>
        <svg width={BAR_W} height={BAR_H} viewBox={`0 0 ${BAR_W} ${BAR_H}`}>
          <rect x={0} y={0} width={BAR_W} height={BAR_H} fill={BAR_FILL} stroke={BAR_STROKE} strokeWidth={2} rx={6} />
          {Array.from({ length: topPieces }).map((_, i) => (
            <rect
              key={i}
              x={topSliceW * i}
              y={0}
              width={topSliceW}
              height={BAR_H}
              fill={i < topHighlighted ? ACCENT : 'transparent'}
              stroke={BAR_STROKE}
              strokeWidth={2}
            />
          ))}
        </svg>
      </div>

      {/* BOTTOM bar — workspace */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-text-muted text-[11px] uppercase tracking-wider">
          your bar — tap a cell to add a 1/{bottomDenominator}
        </div>
        <svg
          width={BAR_W}
          height={BAR_H}
          viewBox={`0 0 ${BAR_W} ${BAR_H}`}
          style={{ cursor: 'pointer' }}
          onClick={onPlace}
          role="button"
          aria-label={`Tap to add one ${bottomDenominator === 4 ? 'fourth' : `${bottomDenominator}th`} piece`}
        >
          <rect x={0} y={0} width={BAR_W} height={BAR_H} fill={BAR_FILL} stroke={BAR_STROKE} strokeWidth={2} rx={6} />
          {Array.from({ length: bottomDenominator }).map((_, i) => (
            <rect
              key={i}
              x={botSliceW * i}
              y={0}
              width={botSliceW}
              height={BAR_H}
              fill={i < filled ? '#a8c69f' : 'transparent'}
              stroke={BAR_STROKE}
              strokeWidth={2}
            />
          ))}
        </svg>
        <button
          type="button"
          onClick={onUndo}
          disabled={filled === 0}
          className="text-text-muted text-xs underline disabled:opacity-30"
        >
          take one off
        </button>
      </div>
    </div>
  );
};
