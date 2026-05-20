/**
 * Single source of truth for the size of a grid cell in pixels.
 *
 * Tray pieces and grid cells use the same cell size so a piece visually identical
 * in tray and grid drops cleanly. Adjust this if the iPad pixel density needs more
 * tap area; everything downstream scales.
 */
export const CELL_PX = 56;

/** Tray piece cells are slightly smaller so more pieces fit horizontally. */
export const TRAY_CELL_PX = 48;
