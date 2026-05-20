import type { Piece } from "./Piece";
import { oppositeSide, sideDelta, type Side } from "./Polyomino";
import type { Rule, RuleColor } from "./Rule";
import { ruleSatisfied } from "./Rule";

/**
 * A reference to one (cell, side) on a piece, in the piece's LOCAL coordinate
 * frame. canPlace returns a list of these to mark which colored triangles the
 * caller should strip from the new piece before placing it — the "placed
 * wins" rule means a new piece's conflicting triangle gets cleared at the
 * seam where it lost to a placed neighbor's color.
 */
export interface EdgeRef {
  readonly localCol: number;
  readonly localRow: number;
  readonly side: Side;
}

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
    | { ok: true; edgesToClear: readonly EdgeRef[] }
    | { ok: false; reason: "out_of_bounds" }
    | { ok: false; reason: "overlap"; col: number; row: number }
    | {
        ok: false;
        reason: "no_adjacency";
      }
    | {
        ok: false;
        reason: "rule_mismatch";
        placedCount: number;
        newCount: number;
        edgeColor: RuleColor | null;
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

    // 2. Per-edge check. Each shared edge between the new piece and a placed
    //    neighbor is its own contract:
    //
    //     "Placed wins." The placed neighbor was here first and its colored
    //     triangle at this seam is the authoritative rule for the seam. The
    //     new piece must satisfy THAT specific rule's box-count ratio.
    //
    //     If the new piece carries a different color on its own side of the
    //     seam — like a blue 2-box piece dropped next to a purple 2-box
    //     piece — the new piece's color is irrelevant for the legality
    //     check (placed's purple wins) AND the new piece's conflicting
    //     triangle gets CLEARED on placement. The seam belongs to the
    //     placed piece's color now, and the new piece visually agrees.
    //     The list of edges to clear is returned to the caller so it can
    //     build the trimmed piece for the placement.
    //
    //     If only one side is colored, that side picks the rule. If neither
    //     is colored, any rule's ratio works (the permissive fallback for
    //     seams the solution didn't paint).
    //
    //  Why per-edge instead of per-neighbor: a single (newPiece, neighbor)
    //  pair can share multiple cell-edges, and those edges can carry
    //  different colors. Lumping them into one per-neighbor check silently
    //  let a wrong-color edge slip through if the box-count ratio happened
    //  to satisfy SOME other rule. The bug that motivated this: a 2-box
    //  piece with a blue side dropped next to a placed 2-box piece with a
    //  purple side. 2:2 satisfied the blue rule (1:1) under the old
    //  any-rule check, so the placement went through — but the placed
    //  purple triangle was claiming "expect a 1:2 partner here," which
    //  2:2 violates. Under placed-wins, the purple rule (1:2) is the only
    //  one consulted, and the placement is rightly rejected.
    let touchedSomething = false;
    const edgesToClear: EdgeRef[] = [];
    for (const cell of piece.polyomino.cells) {
      const absCol = origin.col + cell.col;
      const absRow = origin.row + cell.row;
      const sides: Side[] = ["N", "E", "S", "W"];
      for (const side of sides) {
        const { dcol, drow } = sideDelta(side);
        const neighbor = this.cellOccupier(absCol + dcol, absRow + drow);
        if (!neighbor) continue;
        touchedSomething = true;

        // Color on the NEW piece's side of the edge (local coords).
        const newColor = piece.colorOn(cell.col, cell.row, side);
        // Color on the NEIGHBOR's side of the edge (local coords inside that
        // placement). The side facing back is the opposite of `side`.
        const nbrLocalCol = absCol + dcol - neighbor.origin.col;
        const nbrLocalRow = absRow + drow - neighbor.origin.row;
        const nbrColor = neighbor.piece.colorOn(
          nbrLocalCol,
          nbrLocalRow,
          oppositeSide(side),
        );

        // Effective color picks the rule. Placed neighbor wins outright when
        // both sides are colored OR only the placed side is colored. The new
        // piece's color only picks the rule when the placed side has no
        // color of its own.
        const edgeColor: RuleColor | null = nbrColor ?? newColor;
        const placedCount = neighbor.piece.squareCount;
        const newCount = piece.squareCount;

        if (edgeColor) {
          const rule = rules.find((r) => r.color === edgeColor);
          if (!rule) {
            // A color was painted on a piece for which no rule exists in this
            // round. Generator invariant violation — surface explicitly so a
            // future regression here doesn't silently let bad placements
            // through as "no rule, no constraint."
            throw new Error(
              `Edge color ${edgeColor} has no matching rule in the round (rules: ${rules
                .map((r) => r.color)
                .join(", ")}). ` +
                `Bug: the generator painted a piece with a color whose rule was not added to the round, ` +
                `or rules were filtered after pieces were built. Check Generator.deriveRules / paintSides for symmetry.`,
            );
          }
          const ratioOk =
            ruleSatisfied(rule, placedCount, newCount) ||
            ruleSatisfied(rule, newCount, placedCount);
          if (!ratioOk) {
            return {
              ok: false,
              reason: "rule_mismatch",
              placedCount,
              newCount,
              edgeColor,
            };
          }
          // Placed-wins clearing: the new piece carried a DIFFERENT color
          // on its side of this seam. The legality check used placed's
          // color (above); the visual cleanup is to clear the new piece's
          // conflicting triangle so the seam reads as a single color. The
          // new piece keeps every OTHER colored side it has (only this
          // specific cell-side is cleared).
          if (newColor && nbrColor && newColor !== nbrColor) {
            edgesToClear.push({ localCol: cell.col, localRow: cell.row, side });
          }
        } else {
          // No color on either side: any rule's ratio is acceptable.
          const ratioOk = rules.some(
            (r) =>
              ruleSatisfied(r, placedCount, newCount) ||
              ruleSatisfied(r, newCount, placedCount),
          );
          if (!ratioOk) {
            return {
              ok: false,
              reason: "rule_mismatch",
              placedCount,
              newCount,
              edgeColor: null,
            };
          }
        }
      }
    }

    // 3. The piece must touch at least one existing piece (we don't allow
    //    floating placements; this also keeps the rules from being trivially
    //    avoidable).
    if (!touchedSomething && this.placements.length > 0) {
      return { ok: false, reason: "no_adjacency" };
    }

    return { ok: true, edgesToClear };
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
