/**
 * Hand-authored level configurations for Boxy.
 *
 * Level 1: introduces a single rule, BLUE = 1/2. A 6x6 board with three seed
 * pieces, each carrying a blue colored edge. The hand has 10 shapes drawn from
 * the library, chosen so that several different placements satisfy each edge.
 *
 * Higher levels will add more rules, larger boards, and unsimplified rules
 * (e.g., BLUE = 2/4 with a simplify affordance). Authored later.
 */

import { fraction } from '../lib/fractions';
import { resolveCells } from '../lib/geometry';
import type { Level, PlacedPiece } from '../state/types';
import { getShape } from './pieces';

/** Build a seed piece from a shape id, origin, rotation, and its colored edges. */
function seed(
  id: string,
  shapeId: string,
  origin: { x: number; y: number },
  rotation: 0 | 1 | 2 | 3,
  coloredEdges: PlacedPiece['coloredEdges'],
): PlacedPiece {
  const shape = getShape(shapeId);
  return {
    id,
    shapeId,
    origin,
    rotation,
    cells: resolveCells(shape, origin, rotation),
    isSeed: true,
    coloredEdges,
  };
}

export const LEVEL_1: Level = {
  id: 1,
  gradeLabel: 'Grade 3',
  title: 'Half of it',
  boardWidth: 6,
  boardHeight: 6,
  rules: [{ color: 'blue', fraction: fraction(1, 2) }],
  seedPieces: [
    // A 4-cell horizontal bar in the top-left area with its south face blue.
    seed(
      'seed-1',
      '4_T',
      { x: 1, y: 0 },
      0,
      [
        {
          id: 'seed-1-S',
          color: 'blue',
          direction: 'S',
          // The T-shape at origin (1, 0) rotation 0 occupies (1,0), (2,0), (3,0), (2,1).
          // The south-facing edge consists of cells (1,0) and (3,0) on the "top row"
          // (because they have nothing below) plus (2,1) at the stem tip.
          // For a clean blue edge we color only the top row's south face on cells (1,0) and (3,0).
          // This gives a blue edge of cell-count 2; 1/2 * 2 = 1, so the kid needs 1 touching cell.
          cells: [
            { x: 1, y: 0 },
            { x: 3, y: 0 },
          ],
        },
      ],
    ),
    // A 4-cell L in the middle-right with its west face blue.
    seed(
      'seed-2',
      '4_L',
      { x: 4, y: 1 },
      0,
      [
        {
          id: 'seed-2-W',
          color: 'blue',
          direction: 'W',
          // 4_L at (4, 1) rotation 0 occupies (4,1), (4,2), (4,3), (5,3).
          // The west-facing edge of the vertical leg is at cells (4,1), (4,2), (4,3).
          // Blue edge cell-count = 3; 1/2 * 3 is not an integer (3/2). To keep level 1 clean,
          // color only two of them so the rule produces a whole-number target.
          cells: [
            { x: 4, y: 1 },
            { x: 4, y: 2 },
          ],
        },
      ],
    ),
    // A 3-cell row at the bottom with its north face blue.
    seed(
      'seed-3',
      '3_horiz',
      { x: 1, y: 5 },
      0,
      [
        {
          id: 'seed-3-N',
          color: 'blue',
          direction: 'N',
          // 3_horiz at (1, 5) rotation 0 occupies (1,5), (2,5), (3,5).
          // North-facing edge cells: (1,5), (2,5), (3,5). Pick two to keep the
          // rule target a whole number (1/2 * 2 = 1).
          cells: [
            { x: 1, y: 5 },
            { x: 3, y: 5 },
          ],
        },
      ],
    ),
  ],
  handShapeIds: [
    '1_dot',
    '1_dot',
    '2_horiz',
    '2_vert',
    '3_L',
    '3_horiz',
    '4_square',
    '4_T',
    '4_S',
    '5_horiz',
  ],
};

export const LEVELS: readonly Level[] = [LEVEL_1];
