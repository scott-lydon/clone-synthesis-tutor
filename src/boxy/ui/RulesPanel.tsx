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
      <div
        className="w-9 h-9 rounded-lg flex-shrink-0"
        style={{
          background: fill,
          boxShadow: `0 4px 10px ${fill}30`,
        }}
        aria-label={color}
      />
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
