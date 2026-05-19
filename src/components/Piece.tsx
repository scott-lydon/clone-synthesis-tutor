/**
 * Renders a single piece (seed or placed) as a group of SVG rect elements.
 *
 * Each cell is a `<rect>` of size CELL_PX, offset by the cell's board position.
 * Seed pieces use a neutral slate fill; kid-placed pieces use the boxy-gold accent.
 *
 * Colored edges are drawn as thick strokes on the outer face of each colored cell.
 * The stroke is offset slightly inward so it reads as "the edge of the cell, painted"
 * rather than a separate line floating next to the piece.
 */

import type { ColoredEdge, Direction, PlacedPiece, RuleColor } from '../state/types';

export const CELL_PX = 56;

const FILL_SEED = '#cbd5e1';      // slate-300, calm
const STROKE_SEED = '#f1f5f9';    // slate-100, edge of seed
const FILL_PLACED = '#c5a572';    // boxy-gold
const STROKE_PLACED = '#9d8158';  // boxy-gold-dark

const RULE_COLOR_HEX: Record<RuleColor, string> = {
  blue: '#3b82f6',     // blue-500, saturated
  red: '#ef4444',      // red-500
  green: '#22c55e',    // green-500
  yellow: '#eab308',   // yellow-500
};

interface PieceProps {
  piece: PlacedPiece;
}

export function Piece({ piece }: PieceProps) {
  const fill = piece.isSeed ? FILL_SEED : FILL_PLACED;
  const stroke = piece.isSeed ? STROKE_SEED : STROKE_PLACED;

  return (
    <g data-piece-id={piece.id}>
      {piece.cells.map((cell) => (
        <rect
          key={`${cell.x},${cell.y}`}
          x={cell.x * CELL_PX}
          y={cell.y * CELL_PX}
          width={CELL_PX}
          height={CELL_PX}
          fill={fill}
          stroke={stroke}
          strokeWidth={2}
          rx={4}
        />
      ))}
      {piece.coloredEdges.map((edge) => (
        <ColoredEdgeMark key={edge.id} edge={edge} />
      ))}
    </g>
  );
}

interface ColoredEdgeMarkProps {
  edge: ColoredEdge;
}

/**
 * Draws a thick colored stroke on the outer face of each colored cell in the
 * given direction. The stroke is inset slightly so the cell's body still shows
 * underneath.
 *
 * Inset rationale: drawing the stroke exactly on the cell boundary makes it
 * straddle the boundary, which renders fuzzy on retina displays and hides the
 * underlying cell color. A 3px inset reads as "the edge of this cell is painted."
 */
function ColoredEdgeMark({ edge }: ColoredEdgeMarkProps) {
  const hex = RULE_COLOR_HEX[edge.color];
  const inset = 3;
  const lines = edge.cells.map((cell) => {
    const left = cell.x * CELL_PX;
    const right = left + CELL_PX;
    const top = cell.y * CELL_PX;
    const bottom = top + CELL_PX;
    const coords = edgeLineCoords(edge.direction, left, top, right, bottom, inset);
    return (
      <line
        key={`${cell.x},${cell.y},${edge.direction}`}
        x1={coords.x1}
        y1={coords.y1}
        x2={coords.x2}
        y2={coords.y2}
        stroke={hex}
        strokeWidth={6}
        strokeLinecap="round"
      />
    );
  });
  return <g data-edge-id={edge.id}>{lines}</g>;
}

function edgeLineCoords(
  dir: Direction,
  left: number,
  top: number,
  right: number,
  bottom: number,
  inset: number,
): { x1: number; y1: number; x2: number; y2: number } {
  switch (dir) {
    case 'N':
      return { x1: left + inset, y1: top + inset, x2: right - inset, y2: top + inset };
    case 'S':
      return { x1: left + inset, y1: bottom - inset, x2: right - inset, y2: bottom - inset };
    case 'E':
      return { x1: right - inset, y1: top + inset, x2: right - inset, y2: bottom - inset };
    case 'W':
      return { x1: left + inset, y1: top + inset, x2: left + inset, y2: bottom - inset };
  }
}
