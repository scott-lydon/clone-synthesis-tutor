import { useGameStore } from "../store/gameStore";
import { RULE_COLOR_FILL } from "../domain/Rule";

/**
 * Rules legend.
 *
 * Each rule is a color + a box-count ratio between two touching pieces. The
 * ratio is symmetric: a piece-pair of (3, 5) and a piece-pair of (5, 3) both
 * satisfy a 3:5 rule, as do equivalents like 6:10. The previous version
 * labeled the two numbers "smaller" and "larger" which (a) misled the player
 * into thinking the order mattered for placement and (b) created a layout
 * with stacked labels that fought the eye. Both problems gone now: the rule
 * renders as a single bold "N : M boxes" line.
 */
export function RulesPanel() {
  const rules = useGameStore((s) => s.round.rules);
  if (rules.length === 0) return null;
  return (
    <div
      className="rounded-2xl p-5 w-full"
      style={{
        background: "rgba(31, 41, 55, 0.45)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.10)",
      }}
    >
      <div
        className="text-xs uppercase tracking-[0.18em] font-semibold mb-2"
        style={{ color: "rgba(212, 200, 178, 0.7)" }}
      >
        Rules
      </div>
      <div className="text-slate-400 text-[11px] mb-1 leading-relaxed">
        When two pieces touch, their box counts must make one of these ratios
        (or an equivalent, like 6:10 for 3:5). Order doesn't matter — a 3-box
        piece next to a 5-box piece is the same as 5-box next to 3-box.
      </div>
      <div className="text-slate-500 text-[11px] mb-4 leading-relaxed italic">
        Example: a 3-box piece touching a 5-box piece makes 3:5.
      </div>
      <div className="flex flex-col gap-2.5">
        {rules.map((r) => (
          <RuleRow
            key={r.color}
            color={r.color}
            a={r.fraction.numerator}
            b={r.fraction.denominator}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One legend row.
 *
 *   [swatch]   3 : 5   boxes
 *
 * Single baseline, big numbers, colon-spaced. No two-line stacking, no
 * mismatched labels.
 *
 * The swatch is a miniature game piece, not a solid color chip — same cream
 * cell background (#f5efe3) the placed pieces use on the grid, with a single
 * colored triangle pointing into the cell. Matching the on-grid visual idiom
 * here means the kid sees the rule as "the kind of triangle that has to
 * appear at a seam," not as an abstract palette token. The triangle uses the
 * same N-side wedge geometry as PieceView's ColoredSides so the swatch and
 * the placed pieces read as the same vocabulary.
 */
function RuleRow({
  color,
  a,
  b,
}: {
  color: keyof typeof RULE_COLOR_FILL;
  a: number;
  b: number;
}) {
  const fill = RULE_COLOR_FILL[color];
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-3 py-3"
      style={{
        background: "rgba(20, 27, 41, 0.55)",
        boxShadow: `inset 0 0 0 1px ${fill}40`,
      }}
    >
      <RuleSwatch color={color} />
      <div className="flex items-baseline gap-2 flex-1">
        <span
          className="text-slate-100 font-mono text-2xl font-semibold tabular-nums"
          style={{ color: "#f0e9d6" }}
        >
          {a}
        </span>
        <span
          className="text-2xl font-mono"
          style={{ color: `${fill}` }}
          aria-hidden
        >
          :
        </span>
        <span
          className="text-slate-100 font-mono text-2xl font-semibold tabular-nums"
          style={{ color: "#f0e9d6" }}
        >
          {b}
        </span>
        <span
          className="text-[11px] uppercase tracking-wider text-slate-500 ml-1"
        >
          boxes
        </span>
      </div>
    </div>
  );
}

/**
 * Miniature game-piece swatch: a cream cell (the same #f5efe3 every placed
 * piece uses) with a single colored triangle from the top corners to the cell
 * center. Mirrors PieceView/ColoredSides geometry for the N (top) side so the
 * rule swatch reads as the same visual unit as a placed piece's seam.
 */
function RuleSwatch({ color }: { color: keyof typeof RULE_COLOR_FILL }) {
  const fill = RULE_COLOR_FILL[color];
  const px = 36; // matches the previous w-9 h-9 swatch dimensions
  const cx = px / 2;
  const cy = px / 2;
  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className="flex-shrink-0 rounded-lg overflow-visible"
      style={{ boxShadow: `0 4px 10px ${fill}30` }}
      aria-label={color}
      role="img"
    >
      {/* Cream cell background — same color the placed pieces use on the grid. */}
      <rect x={0} y={0} width={px} height={px} fill="#f5efe3" rx={6} ry={6} />
      {/* North-side rule triangle. Same wedge shape as PieceView's ColoredSides. */}
      <polygon points={`0,0 ${px},0 ${cx},${cy}`} fill={fill} />
      {/* Subtle outline to separate from the panel background. */}
      <rect
        x={0}
        y={0}
        width={px}
        height={px}
        fill="none"
        stroke="rgba(10, 14, 26, 0.5)"
        strokeWidth={1}
        rx={6}
        ry={6}
      />
    </svg>
  );
}
