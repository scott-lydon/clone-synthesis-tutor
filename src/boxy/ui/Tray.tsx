import type { ReactNode } from "react";
import { useGameStore } from "../store/gameStore";
import { DraggablePiece } from "./DraggablePiece";
import { PieceView } from "./PieceView";
import { TRAY_CELL_PX } from "./sizing";
import type { Piece } from "../domain/Piece";

/**
 * Counter badge for a basket header. Mirrors PieceView's per-piece count
 * badge so the two counters — "how many parts are in this basket" and
 * "how many boxes is this piece" — read as the same vocabulary. Same dark
 * circle fill (rgba(31, 36, 47, 0.82)), same cream numeral (#f5efe3), bold
 * weight, tight letter spacing.
 *
 * Sized off SVG (not a CSS circle) so the numeral centers the same way
 * PieceView centers its number; text rendering with CSS line-height in a
 * small badge tends to drift a pixel or two.
 */
function CountBadge({ count, ariaLabel }: { count: number; ariaLabel: string }) {
  const px = 22;
  const cx = px / 2;
  const cy = px / 2;
  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} role="img" aria-label={ariaLabel}>
      <circle cx={cx} cy={cy} r={px * 0.46} fill="rgba(31, 36, 47, 0.82)" />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={px * 0.55}
        fontWeight={700}
        fill="#f5efe3"
        style={{ letterSpacing: -0.5 }}
      >
        {count}
      </text>
    </svg>
  );
}

/**
 * Generic basket container shared by the "Parts" tray and the "Dropped"
 * basket. Same surface, header treatment, and empty-state copy shape so the
 * two read as siblings (one holds what you have left, the other holds what
 * you spent). Pulled into one component so a future restyle touches both
 * baskets in lockstep — divergent baskets would muddy the "Dropped is just
 * the other half of Parts" mental model.
 */
function Basket({
  label,
  count,
  ariaCountLabel,
  emptyMessage,
  tone = "neutral",
  children,
}: {
  label: string;
  count: number;
  ariaCountLabel: string;
  emptyMessage?: ReactNode;
  /** "neutral" = parts basket, "spent" = slightly dimmer label color. */
  tone?: "neutral" | "spent";
  children: ReactNode;
}) {
  const labelColor =
    tone === "spent" ? "rgba(212, 200, 178, 0.45)" : "rgba(212, 200, 178, 0.7)";
  if (count === 0 && emptyMessage) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-slate-700/50 p-6 text-center text-slate-500 text-sm">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div
      className="w-full rounded-2xl p-6"
      style={{
        background: "rgba(31, 41, 55, 0.45)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.10)",
      }}
    >
      <div
        className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 flex items-center gap-2"
        style={{ color: labelColor }}
      >
        <span>{label}</span>
        <CountBadge count={count} ariaLabel={ariaCountLabel} />
      </div>
      <div className="flex flex-wrap gap-6 items-start">{children}</div>
    </div>
  );
}

/**
 * The "Parts" basket. Live, draggable. The student's working inventory:
 * every piece here is still available to place on the grid.
 */
export function Tray() {
  const round = useGameStore((s) => s.round);
  const trayPieceIds = useGameStore((s) => s.trayPieceIds);

  // Build a stable mapping from id to piece.
  const idToPiece = new Map(round.trayPieces.map((p) => [p.id, p]));
  const pieces: Piece[] = [];
  for (const id of trayPieceIds) {
    const p = idToPiece.get(id);
    if (p) pieces.push(p);
  }

  return (
    <Basket
      label="Parts"
      count={pieces.length}
      ariaCountLabel={`${pieces.length} parts available`}
      emptyMessage={
        <>
          Tray is empty. Hit <em>Submit</em> to score or <em>New round</em> for a new puzzle.
        </>
      }
    >
      {pieces.map((p) => (
        <DraggablePiece key={p.id} piece={p} />
      ))}
    </Basket>
  );
}

/**
 * The "Dropped" basket. Visible record of pieces the student spent by
 * dropping them on the grid in a rules-rejected spot. Faded so the eye
 * separates "alive" parts from "spent" ones at a glance; non-interactive
 * (no drag, no click) because spent pieces are spent for the rest of the
 * round (Reset restores them as part of "retry the same puzzle").
 *
 * Colors are HIDDEN, same as a tray piece — the student is being asked to
 * reason about the box count and the placed neighbor's color, not to
 * pattern-match the dropped piece's own painted colors. Showing colors here
 * would also imply the dropped piece "looked correct" all along, which is
 * the wrong mental model: it was dropped because it ended up at the wrong
 * seam, not because of any inherent color property.
 */
export function Dropped() {
  const round = useGameStore((s) => s.round);
  const droppedPieceIds = useGameStore((s) => s.droppedPieceIds);

  const idToPiece = new Map(round.trayPieces.map((p) => [p.id, p]));
  const pieces: Piece[] = [];
  for (const id of droppedPieceIds) {
    const p = idToPiece.get(id);
    if (p) pieces.push(p);
  }

  return (
    <Basket
      label="Dropped"
      count={pieces.length}
      ariaCountLabel={`${pieces.length} pieces dropped`}
      emptyMessage="Nothing dropped yet."
      tone="spent"
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          aria-label="Dropped piece (no longer usable this round)"
          style={{
            opacity: 0.42,
            filter: "saturate(0.55)",
            cursor: "not-allowed",
          }}
        >
          <PieceView piece={p} cellPx={TRAY_CELL_PX} showCount hideColors />
        </div>
      ))}
    </Basket>
  );
}
