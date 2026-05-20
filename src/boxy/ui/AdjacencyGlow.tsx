import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { CELL_PX } from "./sizing";
import { RULE_COLOR_GLOW } from "../domain/Rule";
import { sideDelta, SIDES } from "../domain/Polyomino";
import type { RuleColor } from "../domain/Rule";

interface Glow {
  readonly col: number;
  readonly row: number;
  readonly color: RuleColor;
}

/**
 * Computes a "color hint" overlay: for every external colored side of every
 * placed piece, if the cell on the other side of that edge is still empty,
 * paint that empty cell with a soft radial gradient in the rule's color.
 *
 * Why: the player cannot see the colors on tray pieces, so they need a way to
 * reason "this empty cell sits next to a green edge of the anchor; I should
 * look for the piece that has a green side AND a square count that satisfies
 * the green rule with the anchor". The glow surfaces that signal without
 * giving away which piece is right.
 *
 * Multiple placements may glow the same empty cell with different colors; the
 * gradients composite naturally, which is the right behavior - that cell has
 * to satisfy more than one rule and the kid sees both expectations.
 */
export function AdjacencyGlow() {
  const grid = useGameStore((s) => s.grid);
  const glows = useMemo((): Glow[] => {
    const result: Glow[] = [];
    for (const placement of grid.placements) {
      for (const cell of placement.piece.polyomino.cells) {
        const absCol = placement.origin.col + cell.col;
        const absRow = placement.origin.row + cell.row;
        for (const side of SIDES) {
          const color = placement.piece.colorOn(cell.col, cell.row, side);
          if (!color) continue;
          const { dcol, drow } = sideDelta(side);
          const nCol = absCol + dcol;
          const nRow = absRow + drow;
          if (nCol < 0 || nRow < 0 || nCol >= grid.cols || nRow >= grid.rows) continue;
          if (grid.cellOccupier(nCol, nRow)) continue;
          result.push({ col: nCol, row: nRow, color });
        }
      }
    }
    return result;
  }, [grid]);

  if (glows.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {glows.map((g, i) => (
        <div
          key={`${g.col}-${g.row}-${g.color}-${i}`}
          className="absolute"
          style={{
            left: g.col * CELL_PX,
            top: g.row * CELL_PX,
            width: CELL_PX,
            height: CELL_PX,
            background: `radial-gradient(circle at center, ${RULE_COLOR_GLOW[g.color]} 0%, transparent 72%)`,
          }}
        />
      ))}
    </div>
  );
}
