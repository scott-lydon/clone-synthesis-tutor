/**
 * Hand-authored piece shape library for Boxy.
 *
 * Each shape is a small array of cell positions relative to a (0, 0) anchor.
 * Pieces are intentionally Blokus-ish: 1 to 5 cells, varying configurations.
 *
 * Naming convention: `<cells>_<shape>` (e.g., `1_dot`, `2_horiz`, `3_L`).
 *
 * Anchor convention: the anchor (0, 0) is always one of the piece's cells.
 * Other cells are offsets from it. This keeps rotation math simple.
 */

import type { PieceShape } from '../state/types';

export const PIECE_LIBRARY: Record<string, PieceShape> = {
  '1_dot': {
    id: '1_dot',
    cells: [{ x: 0, y: 0 }],
  },
  '2_horiz': {
    id: '2_horiz',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
  },
  '2_vert': {
    id: '2_vert',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
  },
  '3_horiz': {
    id: '3_horiz',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  },
  '3_L': {
    id: '3_L',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  '4_square': {
    id: '4_square',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  '4_T': {
    id: '4_T',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
    ],
  },
  '4_L': {
    id: '4_L',
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
  '4_S': {
    id: '4_S',
    cells: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  '5_horiz': {
    id: '5_horiz',
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ],
  },
};

/** Look up a shape by id. Throws if missing, because a missing shape is a content bug. */
export function getShape(id: string): PieceShape {
  const s = PIECE_LIBRARY[id];
  if (!s) throw new Error(`PIECE_LIBRARY: no shape with id "${id}"`);
  return s;
}
