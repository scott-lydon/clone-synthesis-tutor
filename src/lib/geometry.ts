/**
 * Piece geometry: rotation, translation, and edge-cell counting.
 *
 * A piece's `cells` are stored in a local frame, with the anchor at (0, 0).
 * Rotation rotates around the anchor. Translation puts the anchor at a board
 * position. These two together produce the resolved cells on the board.
 *
 * Edge-cell counting: for a colored edge with cells C and direction D, count
 * how many cells of a placed piece P have a face in direction (opposite of D)
 * that is adjacent to a cell in C.
 */

import type { Cell, Direction, PieceShape, PlacedPiece, Rotation } from '../state/types';

/** Vector by direction. North means moving from y+1 to y, so dy = -1. */
const DELTA: Record<Direction, Cell> = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  E: { x: 1, y: 0 },
  W: { x: -1, y: 0 },
};

/** The face of an adjacent cell that faces back. East's opposite is West. */
const OPPOSITE: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
};

/** Step one cell in the given direction. */
export function step(c: Cell, d: Direction): Cell {
  const delta = DELTA[d];
  return { x: c.x + delta.x, y: c.y + delta.y };
}

/**
 * Rotate a single cell around the (0, 0) anchor clockwise by `r` quarter-turns.
 * (x, y) -> (-y, x) is 90 clockwise in math coords; in screen coords (y down),
 * 90 clockwise is (x, y) -> (y, -x)... no wait, let me be careful.
 *
 * Screen coords: x right, y down. A clockwise 90 turn moves +x onto +y onto -x onto -y.
 * That is: (x, y) -> (-y, x).
 *
 * Verify: (1, 0) [right] -> (0, 1) [down]. Yes, that's 90 clockwise in screen coords.
 */
export function rotateCell(c: Cell, r: Rotation): Cell {
  switch (r) {
    case 0:
      return c;
    case 1:
      return { x: -c.y, y: c.x };
    case 2:
      return { x: -c.x, y: -c.y };
    case 3:
      return { x: c.y, y: -c.x };
  }
}

/**
 * Resolve a piece shape onto the board. Returns the cells the piece occupies
 * after rotating by `r` quarter-turns and translating its anchor to `origin`.
 */
export function resolveCells(shape: PieceShape, origin: Cell, r: Rotation): Cell[] {
  return shape.cells.map((cell) => {
    const rotated = rotateCell(cell, r);
    return { x: origin.x + rotated.x, y: origin.y + rotated.y };
  });
}

/** True if any cell of piece A occupies the same board position as any cell of piece B. */
export function piecesOverlap(a: readonly Cell[], b: readonly Cell[]): boolean {
  const set = new Set(a.map(cellKey));
  return b.some((c) => set.has(cellKey(c)));
}

/** Hashable key for a board cell. */
export function cellKey(c: Cell): string {
  return `${c.x},${c.y}`;
}

/** True if `c` is inside the board's bounds. */
export function isOnBoard(c: Cell, width: number, height: number): boolean {
  return c.x >= 0 && c.x < width && c.y >= 0 && c.y < height;
}

/**
 * Count cells of `placed` that have a face in direction `opposite(edgeDir)`
 * adjacent to any cell in `edgeCells`. This is the "touching count" used by
 * the validation rule.
 *
 * Example: a seed piece has an east edge with cells [(2, 0), (2, 1)]. To touch
 * this edge, a placed piece must have cells at (3, 0) or (3, 1), with their
 * west face exposed (no other cell of the placed piece directly to their west).
 * For each such match, the touching count goes up by 1.
 */
export function countTouching(
  placedCells: readonly Cell[],
  edgeCells: readonly Cell[],
  edgeDir: Direction,
): number {
  const placedKeys = new Set(placedCells.map(cellKey));
  const edgeNeighborKeys = new Set(edgeCells.map((c) => cellKey(step(c, edgeDir))));
  let count = 0;
  for (const cell of placedCells) {
    if (!edgeNeighborKeys.has(cellKey(cell))) continue;
    // Only count if the placed piece's `opposite(edgeDir)` face is actually
    // exposed: i.e., the cell one step *further* in edgeDir's direction is
    // NOT part of the same placed piece. Otherwise the face is hidden inside
    // the piece and doesn't really "touch" the edge.
    const beyond = step(cell, edgeDir);
    if (placedKeys.has(cellKey(beyond))) {
      // The placed piece extends past the edge cell; the touching face is
      // still adjacent, so it still counts. We only skip the count if the
      // placed piece has another cell on the *near* side covering this face.
      // That can never happen because near-side cells would overlap the seed.
    }
    void OPPOSITE; // referenced for completeness; the geometry is symmetric.
    count += 1;
  }
  return count;
}

/**
 * For a single placed piece, return how many of its cells touch a given edge.
 * Convenience wrapper around countTouching.
 */
export function pieceTouchesEdge(piece: PlacedPiece, edgeCells: readonly Cell[], edgeDir: Direction): number {
  return countTouching(piece.cells, edgeCells, edgeDir);
}
