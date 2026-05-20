/**
 * Drop-target registry for the grid. The grid registers its bounding rect and
 * cell size on mount, on resize, and on scroll. DraggablePiece queries this
 * at drop time to map a pointer position to a grid (col, row).
 *
 * Kept out of Zustand so window resize does not cascade through React state.
 */

export interface GridDropInfo {
  readonly left: number;
  readonly top: number;
  readonly cellPx: number;
  readonly cols: number;
  readonly rows: number;
}

let grid: GridDropInfo | null = null;

export function setGridDropInfo(info: GridDropInfo): void {
  grid = info;
}

export function clearGridDropInfo(): void {
  grid = null;
}

/**
 * Given a pointer position (in viewport coords) and the offset of the piece's
 * (0,0) hotspot relative to the pointer when grabbed, returns the grid cell
 * the (0,0) cell should drop into, or null if outside the grid.
 */
export function gridCellAtPoint(x: number, y: number): { col: number; row: number } | null {
  if (!grid) return null;
  const col = Math.floor((x - grid.left) / grid.cellPx);
  const row = Math.floor((y - grid.top) / grid.cellPx);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
  return { col, row };
}
