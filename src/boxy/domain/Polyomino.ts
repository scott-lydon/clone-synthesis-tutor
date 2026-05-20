/**
 * Polyomino: a set of orthogonally-connected unit cells, identified by their
 * (col, row) coordinates in a local frame. The cells live in a small bounding
 * box anchored at (0, 0) after normalization.
 *
 * Why normalized: rotation, reflection, and equality testing all become easy
 * when (0,0) is the top-left of the bounding box and there are no negatives.
 *
 * We use these for two reasons:
 *  1. The game's tray pieces (the "parts" in the hand-sketched concept).
 *  2. The generator's tiling pass that fills the grid before any rules exist.
 */

export type CellCoord = { readonly col: number; readonly row: number };

export type Side = "N" | "E" | "S" | "W";

export const SIDES: readonly Side[] = ["N", "E", "S", "W"];

export function oppositeSide(s: Side): Side {
  if (s === "N") return "S";
  if (s === "S") return "N";
  if (s === "E") return "W";
  return "E";
}

export function sideDelta(s: Side): { dcol: number; drow: number } {
  if (s === "N") return { dcol: 0, drow: -1 };
  if (s === "S") return { dcol: 0, drow: 1 };
  if (s === "E") return { dcol: 1, drow: 0 };
  return { dcol: -1, drow: 0 };
}

export class Polyomino {
  readonly cells: readonly CellCoord[];

  constructor(cells: readonly CellCoord[]) {
    if (cells.length === 0) {
      throw new Error(
        "Polyomino requires at least one cell. Bug: generator handed an empty cell list to the Polyomino constructor.",
      );
    }
    // Deduplicate just in case a generator double-counts.
    const seen = new Set<string>();
    const unique: CellCoord[] = [];
    for (const c of cells) {
      if (!Number.isInteger(c.col) || !Number.isInteger(c.row)) {
        throw new Error(
          `Polyomino cell coords must be integers, got col=${c.col}, row=${c.row}. ` +
            `Bug: a generator produced a non-integer coord, probably via a math operation that should have stayed integer.`,
        );
      }
      const key = `${c.col},${c.row}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ col: c.col, row: c.row });
      }
    }
    this.cells = Polyomino.normalize(unique);
  }

  get size(): number {
    return this.cells.length;
  }

  get bounds(): { cols: number; rows: number } {
    let maxCol = 0;
    let maxRow = 0;
    for (const c of this.cells) {
      if (c.col > maxCol) maxCol = c.col;
      if (c.row > maxRow) maxRow = c.row;
    }
    return { cols: maxCol + 1, rows: maxRow + 1 };
  }

  /** Returns the cells shifted so the top-left of the bounding box sits at (0,0). */
  private static normalize(cells: readonly CellCoord[]): CellCoord[] {
    let minCol = Infinity;
    let minRow = Infinity;
    for (const c of cells) {
      if (c.col < minCol) minCol = c.col;
      if (c.row < minRow) minRow = c.row;
    }
    return cells.map((c) => ({ col: c.col - minCol, row: c.row - minRow }));
  }

  /** Returns a new polyomino rotated 90 degrees clockwise. */
  rotated90CW(): Polyomino {
    // (col, row) -> (rows - 1 - row, col) where rows = current height
    const { rows } = this.bounds;
    return new Polyomino(this.cells.map((c) => ({ col: rows - 1 - c.row, row: c.col })));
  }

  /** True if this polyomino contains the given local cell. */
  contains(col: number, row: number): boolean {
    for (const c of this.cells) {
      if (c.col === col && c.row === row) return true;
    }
    return false;
  }

  /**
   * For each cell in the polyomino and each side, returns whether that side is
   * "external" (no cell of this polyomino exists in that direction) or "internal"
   * (the polyomino continues that way).
   */
  externalSides(): Map<string, Set<Side>> {
    const result = new Map<string, Set<Side>>();
    for (const c of this.cells) {
      const ext = new Set<Side>();
      for (const s of SIDES) {
        const { dcol, drow } = sideDelta(s);
        if (!this.contains(c.col + dcol, c.row + drow)) {
          ext.add(s);
        }
      }
      result.set(`${c.col},${c.row}`, ext);
    }
    return result;
  }
}
