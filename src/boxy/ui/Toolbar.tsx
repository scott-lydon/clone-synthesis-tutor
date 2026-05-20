import { useGameStore } from "../store/gameStore";

/**
 * Toolbar with: New round, Submit, Reveal, plus a live two-line stat that
 * shows BOTH the current fill (updates with every placement) and the ceiling
 * possible for this round. The ceiling is computed from the generated
 * solution; it is almost always < 100% because the round generator leaves
 * intentional voids in the grid. Without showing the ceiling, "you got 77%"
 * sounds like a failure when it might actually be perfect for this puzzle.
 *
 * Styling: dusty pastel palette to match the rules panel. Bright gradient
 * amber was the previous look and clashed with the calm rule tiles next to it.
 */
export function Toolbar() {
  const newRound = useGameStore((s) => s.newRound);
  const resetPlacements = useGameStore((s) => s.resetPlacements);
  const revealSolution = useGameStore((s) => s.revealSolution);
  const submit = useGameStore((s) => s.submit);
  const submitted = useGameStore((s) => s.submitted);
  const revealed = useGameStore((s) => s.revealedSolution);
  const grid = useGameStore((s) => s.grid);
  const max = useGameStore((s) => s.maxPossiblePercent);
  const placementsLen = grid.placements.length;
  const anchorOnly = grid.placements.every((p) => p.anchor);
  const total = grid.cols * grid.rows;
  let filled = 0;
  for (const p of grid.placements) filled += p.piece.squareCount;
  const current = total === 0 ? 0 : Math.round((filled / total) * 100);
  // Reset is only meaningful once the player has placed at least one piece
  // (anchor-only state = same as a reset). Greying-out when nothing-to-reset
  // prevents the "I clicked but nothing changed" confusion.
  const canReset = placementsLen > 0 && !anchorOnly;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={() => newRound()}
        className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
        style={{
          background: "rgba(230, 200, 121, 0.18)",
          color: "#e8d9a8",
          boxShadow: "inset 0 0 0 1px rgba(230, 200, 121, 0.35)",
        }}
      >
        New round
      </button>
      <button
        onClick={() => resetPlacements()}
        disabled={!canReset}
        title="Send every placed piece back to the tray. Same puzzle, fresh attempt."
        className="px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-30"
        style={{
          background: "rgba(184, 167, 201, 0.14)",
          color: "#d4c7df",
          boxShadow: "inset 0 0 0 1px rgba(184, 167, 201, 0.32)",
        }}
      >
        Reset
      </button>
      <button
        onClick={() => submit()}
        disabled={submitted || revealed}
        className="px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40"
        style={{
          background: "rgba(168, 198, 159, 0.14)",
          color: "#c9d8c0",
          boxShadow: "inset 0 0 0 1px rgba(168, 198, 159, 0.32)",
        }}
      >
        Submit
      </button>
      <button
        onClick={() => revealSolution()}
        disabled={revealed}
        className="px-5 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40"
        style={{
          color: "rgba(212, 200, 178, 0.6)",
        }}
      >
        Reveal answer
      </button>
      <FillReadout current={current} max={max} />
    </div>
  );
}

/**
 * Two stacked rows: live "filled" and the ceiling "possible". Both update on
 * every placement (current) / on every new round (max).
 */
function FillReadout({ current, max }: { current: number; max: number }) {
  return (
    <div
      className="px-4 py-2 rounded-2xl flex items-center gap-3 tabular-nums"
      style={{
        background: "rgba(31, 41, 55, 0.5)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.18)",
      }}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">filled</span>
        <span className="text-lg font-semibold" style={{ color: "#e8d9a8" }}>
          {current}%
        </span>
      </div>
      <div className="w-px h-8" style={{ background: "rgba(212, 200, 178, 0.15)" }} />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">possible</span>
        <span className="text-lg font-semibold" style={{ color: "rgba(212, 200, 178, 0.7)" }}>
          {max}%
        </span>
      </div>
    </div>
  );
}
