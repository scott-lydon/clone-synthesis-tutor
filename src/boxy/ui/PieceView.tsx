import type { Piece } from "../domain/Piece";
import type { Side } from "../domain/Polyomino";
import { RULE_COLOR_FILL } from "../domain/Rule";

/**
 * Pure-SVG renderer for a single Piece.
 *
 * Layered rendering, in order:
 *   1) A solid neutral square per cell. No diagonals drawn, ever, for cells
 *      whose sides are all uncolored. (This is why the tray pieces no longer
 *      show an "X" through every square.)
 *   2) Subtle internal seams BETWEEN cells of the same polyomino. The student
 *      can count cells without a heavy grid line breaking up the piece.
 *   3) For each side that DOES carry a rule color, a single triangle from
 *      the cell's two outer corners to the cell center, filled with that color.
 *      The triangle/diagonal concept is what the student associates with a
 *      colored edge — it only exists where color exists.
 *   4) An external outline that traces the polyomino's silhouette (not the
 *      rectangular bounding box), so an L-tetromino reads as L, not as a
 *      rectangle with a notch.
 *   5) A center badge with the piece's box count.
 */
export function PieceView({
  piece,
  cellPx,
  showCount = true,
  faded = false,
  // Default outline matches the dark panel/page background so adjacent pieces
  // — whether sitting side-by-side in the tray or touching on the grid —
  // separate clearly via a visible dark gutter. Cream-on-cream silhouettes
  // bled into each other, which is the visual problem this default fixes.
  outlineColor = "#0a0e1a",
  outlineWidth = 1.5,
  hideColors = false,
}: {
  piece: Piece;
  cellPx: number;
  showCount?: boolean;
  faded?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  /**
   * When true, suppress colored triangles entirely. Used historically for the
   * tray. Default is false now — students see the colors so they can reason
   * about the ratio before placing.
   */
  hideColors?: boolean;
}) {
  const { cols, rows } = piece.polyomino.bounds;
  const w = cols * cellPx;
  const h = rows * cellPx;

  // Centroid of actual cells (NOT bounding box). Skews the count badge into
  // the polyomino's body rather than into a concave corner.
  let sumCol = 0;
  let sumRow = 0;
  for (const c of piece.polyomino.cells) {
    sumCol += c.col + 0.5;
    sumRow += c.row + 0.5;
  }
  const cx = (sumCol / piece.polyomino.cells.length) * cellPx;
  const cy = (sumRow / piece.polyomino.cells.length) * cellPx;

  // External outline segments (silhouette of the polyomino).
  const outline: { x1: number; y1: number; x2: number; y2: number }[] = [];
  // Internal seams: edges shared by two cells of THIS polyomino, drawn once.
  const seams: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const seenSeam = new Set<string>();
  for (const c of piece.polyomino.cells) {
    const x0 = c.col * cellPx;
    const y0 = c.row * cellPx;
    const x1 = x0 + cellPx;
    const y1 = y0 + cellPx;
    // Each side either bounds the outside (-> outline) or bounds a sibling cell
    // (-> seam). Hash each edge by its two endpoints in canonical order so we
    // don't draw it twice from the neighbor's perspective.
    const edges: { side: Side; line: typeof outline[number] }[] = [
      { side: "N", line: { x1: x0, y1: y0, x2: x1, y2: y0 } },
      { side: "E", line: { x1: x1, y1: y0, x2: x1, y2: y1 } },
      { side: "S", line: { x1: x0, y1: y1, x2: x1, y2: y1 } },
      { side: "W", line: { x1: x0, y1: y0, x2: x0, y2: y1 } },
    ];
    for (const { side, line } of edges) {
      const dc = side === "E" ? 1 : side === "W" ? -1 : 0;
      const dr = side === "S" ? 1 : side === "N" ? -1 : 0;
      const inside = piece.polyomino.contains(c.col + dc, c.row + dr);
      if (inside) {
        const key = `${Math.min(line.x1, line.x2)},${Math.min(line.y1, line.y2)}-${Math.max(line.x1, line.x2)},${Math.max(line.y1, line.y2)}`;
        if (!seenSeam.has(key)) {
          seenSeam.add(key);
          seams.push(line);
        }
      } else {
        outline.push(line);
      }
    }
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ opacity: faded ? 0.45 : 1, overflow: "visible", touchAction: "none" }}
    >
      {/* Step 1: solid base square per cell. */}
      {piece.polyomino.cells.map((c) => (
        <rect
          key={`base-${c.col},${c.row}`}
          x={c.col * cellPx}
          y={c.row * cellPx}
          width={cellPx}
          height={cellPx}
          fill="#f5efe3"
        />
      ))}
      {/* Step 2: subtle internal seams between cells of the same polyomino.
          Solid hairline a shade darker than the cell fill (#f5efe3 → #e3d9c2).
          Dotted seams read as decorative; solid reads as a real boundary, which
          is what we want the student to count along. */}
      {seams.map((l, i) => (
        <line
          key={`seam-${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#e3d9c2"
          strokeWidth={1}
          strokeLinecap="square"
        />
      ))}
      {/* Step 3: colored triangle per colored side, only where color exists. */}
      {!hideColors &&
        piece.polyomino.cells.map((c) => (
          <ColoredSides
            key={`colors-${c.col},${c.row}`}
            piece={piece}
            col={c.col}
            row={c.row}
            cellPx={cellPx}
          />
        ))}
      {/* Step 4: external polyomino outline. */}
      {outline.map((l, i) => (
        <line
          key={`out-${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={outlineColor}
          strokeWidth={outlineWidth}
          strokeLinecap="square"
        />
      ))}
      {/* Step 5: count badge. */}
      {showCount && (
        <g pointerEvents="none">
          <circle cx={cx} cy={cy} r={cellPx * 0.3} fill="rgba(31, 36, 47, 0.82)" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cellPx * 0.34}
            fontWeight={700}
            fill="#f5efe3"
            style={{ letterSpacing: -0.5 }}
          >
            {piece.squareCount}
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * For one cell, draw a triangle (cell corner -> cell corner -> cell center)
 * for each side that actually carries a rule color. Uncolored sides draw
 * nothing — the base square underneath shows through, no diagonal seam, no X.
 */
function ColoredSides({
  piece,
  col,
  row,
  cellPx,
}: {
  piece: Piece;
  col: number;
  row: number;
  cellPx: number;
}) {
  const x0 = col * cellPx;
  const y0 = row * cellPx;
  const x1 = x0 + cellPx;
  const y1 = y0 + cellPx;
  const cx = x0 + cellPx / 2;
  const cy = y0 + cellPx / 2;
  const sides: { side: Side; points: string }[] = [
    { side: "N", points: `${x0},${y0} ${x1},${y0} ${cx},${cy}` },
    { side: "E", points: `${x1},${y0} ${x1},${y1} ${cx},${cy}` },
    { side: "S", points: `${x1},${y1} ${x0},${y1} ${cx},${cy}` },
    { side: "W", points: `${x0},${y1} ${x0},${y0} ${cx},${cy}` },
  ];
  return (
    <g>
      {sides.map(({ side, points }) => {
        const color = piece.colorOn(col, row, side);
        if (!color) return null;
        return <polygon key={side} points={points} fill={RULE_COLOR_FILL[color]} />;
      })}
    </g>
  );
}
