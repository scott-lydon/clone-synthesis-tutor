/**
 * Renders the play board as an SVG: empty cells as faint outlines, then seed
 * and placed pieces on top. No interactivity yet; drag-and-drop arrives in
 * Phase D.
 *
 * Board sizing: the SVG viewBox is `width*CELL_PX` by `height*CELL_PX`, and
 * the outer container scales the SVG to fit available space while preserving
 * the aspect ratio. This keeps the math precise (integer coords) and the
 * rendering crisp on any display.
 */

import { CELL_PX, Piece } from './Piece';
import type { Level } from '../state/types';

interface BoardProps {
  level: Level;
}

export function Board({ level }: BoardProps) {
  const widthPx = level.boardWidth * CELL_PX;
  const heightPx = level.boardHeight * CELL_PX;

  return (
    <div className="bg-boxy-bg p-6 rounded-2xl shadow-2xl">
      <svg
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        width={widthPx}
        height={heightPx}
        className="max-w-full h-auto"
        role="img"
        aria-label={`Boxy board, ${level.boardWidth} by ${level.boardHeight} cells`}
      >
        <EmptyGrid width={level.boardWidth} height={level.boardHeight} />
        {level.seedPieces.map((piece) => (
          <Piece key={piece.id} piece={piece} />
        ))}
      </svg>
    </div>
  );
}

interface EmptyGridProps {
  width: number;
  height: number;
}

function EmptyGrid({ width, height }: EmptyGridProps) {
  const cells = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      cells.push(
        <rect
          key={`${x},${y}`}
          x={x * CELL_PX}
          y={y * CELL_PX}
          width={CELL_PX}
          height={CELL_PX}
          fill="transparent"
          stroke="#1e293b"
          strokeWidth={1}
        />,
      );
    }
  }
  return <g data-grid="">{cells}</g>;
}
