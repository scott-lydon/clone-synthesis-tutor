import type { Piece } from "./Piece";
import { sideDelta, type Side } from "./Polyomino";
import type { Rule } from "./Rule";
import { ruleSatisfied } from "./Rule";

/**
 * A placement of a Piece on the grid: the piece, the grid-coords of its (0,0)
 * cell, and a unique placement id so the UI can track instances across rerenders.
 */
export interface Placement {
  readonly placementId: string;
  readonly piece: Piece;
  readonly origin: { col: number; row: number };
  readonly anchor: boolean; // true if this was a starting placement, not placed by the kid
}

/**
 * Immutable grid state. Tracks placements (anchor + kid-placed). Out-of-band
 * lookups (cellOccupier(col, row), canPlace(...), withPlacement(...)) avoid
 * exposing the placements array directly so callers don't accidentally mutate.
 */
export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly placements: readonly Placement[];

  constructor(cols: number, rows: number, placements: readonly Placement[] = []) {
    if (!Number.isInteger(cols) || cols <= 0 || !Number.isInteger(rows) || rows <= 0) {
      throw new Error(
        `Grid requires positive integer dimensions, got cols=${cols}, rows=${rows}. ` +
          `Bug: the round generator passed bad dimensions, or a default value leaked through.`,
      );
    }
    this.cols = cols;
    this.rows = rows;
    this.placements = placements;
  }

  /** Returns the placement that occupies (col, row), or null if empty / out of bounds. */
  cellOccupier(col: number, row: number): Placement | null {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
    for (const p of this.placements) {
      for (const c of p.piece.polyomino.cells) {
        if (p.origin.col + c.col === col && p.origin.row + c.row === row) return p;
      }
    }
    return null;
  }

  /**
   * Returns the cells (in absolute grid coords) that a candidate placement
   * of `piece` at `origin` would occupy.
   */
  static cellsFor(piece: Piece, origin: { col: number; row: number }): { col: number; row: number }[] {
    return piece.polyomino.cells.map((c) => ({ col: origin.col + c.col, row: origin.row + c.row }));
  }

  /**
   * Test whether a piece can be placed at origin. Returns a structured result
   * so the UI can give targeted feedback ("you went off the board", "you're on
   * top of another piece", "the green side of this piece must touch a piece of 5 squares").
   */
  canPlace(
    piece: Piece,
    origin: { col: number; row: number },
    rules: readonly Rule[],
  ):
    | { ok: true }
    | { ok: false; reason: "out_of_bounds" }
    | { ok: false; reason: "overlap"; col: number; row: number }
    | { ok: false; reason: "no_adjacency" }
    | {
        ok: false;
        reason: "color_mismatch";
        col: number;
        row: number;
        side: Side;
        newColor: string | null;
        neighborColor: string | null;
      }
    | {
        ok: false;
        reason: "rule_mismatch";
        color: string;
        placedCount: number;
        newCount: number;
      } {
    const cells = Grid.cellsFor(piece, origin);
    // 1. In bounds and not overlapping.
    for (const cell of cells) {
      if (cell.col < 0 || cell.row < 0 || cell.col >= this.cols || cell.row >= this.rows) {
        return { ok: false, reason: "out_of_bounds" };
      }
      const occ = this.cellOccupier(cell.col, cell.row);
      if (occ) {
        return { ok: false, reason: "overlap", col: cell.col, row: cell.row };
      }
    }

    // 2. Per-edge color contract. For every cell-edge between the new piece
    //    and an adjacent placed piece:
    //      - both sides white (uncolored) → no rule applies, edge OK
    //      - one side colored, other side white → REJECT (color_mismatch with
    //        null on the white side). A colored edge cannot meet a blank wall.
    //      - both sides colored, different colors → REJECT.
    //      - both sides colored, same color → the rule for that color must
    //        be satisfied by the (newCount, placedCount) pair in either
    //        ordering (so 3:5 is the same as 5:3, and equivalents like 6:10
    //        also satisfy 3:5).
    //
    //    Rationale: an earlier revision dropped color matching ("any rule
    //    that fits the count ratio works") to make placement easier. That
    //    let the player drop pieces wherever the math happened to land,
    //    even when the actual colors at the edge said something different.
    //    Field feedback confirmed bug: 4-piece accepted next to 6-piece on
    //    a 1:3-colored edge because 4:6 reduces to 2:3 (which IS a rule,
    //    just not THIS edge's rule). Restoring per-edge color match makes
    //    the math the actual gate.
    let touchedSomething = false;
    for (const cell of piece.polyomino.cells) {
      const absCol = origin.col + cell.col;
      const absRow = origin.row + cell.row;
      const sides: Side[] = ["N", "E", "S", "W"];
      for (const side of sides) {
        const { dcol, drow } = sideDelta(side);
        const neighbor = this.cellOccupier(absCol + dcol, absRow + drow);
        if (!neighbor) continue;
        touchedSomething = true;

        const newColor = piece.colorOn(cell.col, cell.row, side);
        // Find the neighbor cell that faces this edge and ask for ITS color
        // on the OPPOSITE side.
        const nbrLocalCol = absCol + dcol - neighbor.origin.col;
        const nbrLocalRow = absRow + drow - neighbor.origin.row;
        const opposite: Side =
          side === "N" ? "S" : side === "S" ? "N" : side === "E" ? "W" : "E";
        const neighborColor = neighbor.piece.colorOn(nbrLocalCol, nbrLocalRow, opposite);

        // Both blank: skip — no rule applies on this edge.
        if (!newColor && !neighborColor) continue;
        // Exactly one blank: invalid.
        if (!newColor || !neighborColor) {
          return {
            ok: false,
            reason: "color_mismatch",
            col: absCol,
            row: absRow,
            side,
            newColor,
            neighborColor,
          };
        }
        // Both colored but different colors: invalid.
        if (newColor !== neighborColor) {
          return {
            ok: false,
            reason: "color_mismatch",
            col: absCol,
            row: absRow,
            side,
            newColor,
            neighborColor,
          };
        }
        // Same color: that color's rule must be satisfied by the box counts.
        const rule = rules.find((r) => r.color === newColor);
        if (!rule) {
          throw new Error(
            `Edge at (${absCol},${absRow}) carries color "${newColor}" but no Rule for that color exists in the round's rule set. ` +
              `Bug: the generator painted a side with a color it did not register as a rule. ` +
              `Check the rule-derivation pass in src/boxy/domain/Generator.ts.`,
          );
        }
        const placedCount = neighbor.piece.squareCount;
        const newCount = piece.squareCount;
        const ruleOk =
          ruleSatisfied(rule, placedCount, newCount) ||
          ruleSatisfied(rule, newCount, placedCount);
        if (!ruleOk) {
          return {
            ok: false,
            reason: "rule_mismatch",
            color: newColor,
            placedCount,
            newCount,
          };
        }
      }
    }

    // 3. The piece must touch at least one existing piece (we don't allow
    //    floating placements; this also keeps the rules from being trivially
    //    avoidable).
    if (!touchedSomething && this.placements.length > 0) {
      return { ok: false, reason: "no_adjacency" };
    }

    return { ok: true };
  }

  withPlacement(p: Placement): Grid {
    return new Grid(this.cols, this.rows, [...this.placements, p]);
  }

  withoutPlacement(placementId: string): Grid {
    return new Grid(
      this.cols,
      this.rows,
      this.placements.filter((p) => p.placementId !== placementId),
    );
  }

  /** Percentage of cells covered, [0, 1]. */
  fillRatio(): number {
    let filled = 0;
    for (const p of this.placements) filled += p.piece.squareCount;
    return filled / (this.cols * this.rows);
  }
}
