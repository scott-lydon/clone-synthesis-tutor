import { Polyomino } from "./Polyomino";
import type { Side } from "./Polyomino";
import type { RuleColor } from "./Rule";

/**
 * Per-cell side colors for a Piece. For each cell of the polyomino, the four
 * sides are either uncolored (null) or carry a RuleColor.
 *
 * Convention: only EXTERNAL sides (sides that face outside the polyomino) ever
 * carry a color. INTERNAL sides (where two cells of the same piece meet) are
 * always null. This is enforced in Piece's constructor.
 *
 * Keyed by `${col},${row}` so it survives JSON round-trips and Set lookups.
 */
export type SideColorMap = ReadonlyMap<string, Readonly<Partial<Record<Side, RuleColor>>>>;

/**
 * A draggable game piece. Wraps a Polyomino with side colors.
 *
 * The piece's "square count" (which the hand-sketched concept shows as a small
 * label on each tray piece) is just polyomino.size.
 */
export class Piece {
  readonly id: string;
  readonly polyomino: Polyomino;
  readonly sideColors: SideColorMap;

  constructor(id: string, polyomino: Polyomino, sideColors: SideColorMap) {
    // Verify no internal side carries a color (would be a logic bug in the generator).
    const externals = polyomino.externalSides();
    for (const [cellKey, colors] of sideColors) {
      const ext = externals.get(cellKey);
      if (!ext) {
        throw new Error(
          `Piece ${id} has sideColors for cell ${cellKey} that does not exist in the polyomino. ` +
            `Bug: the generator wrote a color for a cell that isn't part of this piece. Check the keys produced by the side-painter.`,
        );
      }
      for (const side of Object.keys(colors) as Side[]) {
        if (!ext.has(side)) {
          throw new Error(
            `Piece ${id} has a color on internal side ${side} of cell ${cellKey}. ` +
              `Bug: only external sides (facing outside the polyomino) can carry rule colors. Verify the side-painter only colors external sides.`,
          );
        }
      }
    }
    this.id = id;
    this.polyomino = polyomino;
    this.sideColors = sideColors;
  }

  get squareCount(): number {
    return this.polyomino.size;
  }

  colorOn(col: number, row: number, side: Side): RuleColor | null {
    const key = `${col},${row}`;
    const cellColors = this.sideColors.get(key);
    if (!cellColors) return null;
    return cellColors[side] ?? null;
  }

  /**
   * Return a new Piece identical to this one except every (cell, side) pair in
   * `cleared` has its color removed. Used by the placement pipeline: when a
   * placed neighbor's color outranks the new piece's color at a seam, the new
   * piece's conflicting triangle gets cleared so the seam reads as a single
   * color (placed's). Same id and polyomino — only the side-color map shrinks.
   *
   * Implementation: copy the existing sideColors map, then for each entry in
   * `cleared` rewrite that cell's record without the named side. If a cell
   * ends up with zero colored sides, drop the cell entry entirely so the
   * downstream "every cell in sideColors must be a real polyomino cell"
   * invariant in the Piece constructor stays clean.
   */
  withClearedColors(
    cleared: ReadonlyArray<{ localCol: number; localRow: number; side: Side }>,
  ): Piece {
    if (cleared.length === 0) return this;
    const next = new Map<string, Partial<Record<Side, RuleColor>>>();
    for (const [cellKey, sides] of this.sideColors) {
      next.set(cellKey, { ...sides });
    }
    for (const { localCol, localRow, side } of cleared) {
      const cellKey = `${localCol},${localRow}`;
      const existing = next.get(cellKey);
      if (!existing) continue;
      const { [side]: _drop, ...rest } = existing;
      void _drop; // explicit discard; we ARE clearing this side
      if (Object.keys(rest).length === 0) {
        next.delete(cellKey);
      } else {
        next.set(cellKey, rest);
      }
    }
    return new Piece(this.id, this.polyomino, next);
  }
}
