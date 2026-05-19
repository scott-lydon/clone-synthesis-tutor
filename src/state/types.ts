/**
 * Boxy core types.
 *
 * Every value used by validation, scoring, rendering, and the state machine.
 * Kept in one file to make the data model easy to follow; split later if it grows.
 *
 * Coordinate system: (0, 0) is top-left. x increases rightward, y increases downward.
 * Direction 'N' means "the top face of a cell points toward y - 1."
 */

/** Rule color. A small closed set on purpose; one rule per color per round. */
export type RuleColor = 'blue' | 'red' | 'green' | 'yellow';

/** Axis-aligned face of a single unit cell. */
export type Direction = 'N' | 'S' | 'E' | 'W';

/** Integer board position. */
export interface Cell {
  readonly x: number;
  readonly y: number;
}

/**
 * A fraction kept as integers. `d` is always > 0. We never compare or multiply
 * with floats; equivalence is `a.n * b.d === b.n * a.d`.
 */
export interface Fraction {
  readonly n: number;
  readonly d: number;
}

/**
 * A piece template (no board position). `cells` are relative to a (0, 0)
 * anchor inside the piece's local frame. Rotations are computed on the fly.
 */
export interface PieceShape {
  readonly id: string;
  readonly cells: readonly Cell[];
}

/** Rotation around the piece's anchor: 0, 90, 180, 270 clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

/**
 * A piece resolved onto the board. `cells` are the resolved board positions
 * after rotation and translation. Validation operates on these.
 *
 * Seed pieces are placed by the level designer and may carry colored edges.
 * Kid-placed pieces have `isSeed: false` and never carry colored edges.
 */
export interface PlacedPiece {
  readonly id: string;            // unique within a round; PlacedPiece may share `shapeId` if multi-copy
  readonly shapeId: string;       // references a PieceShape
  readonly origin: Cell;          // where the piece's anchor sits on the board
  readonly rotation: Rotation;
  readonly cells: readonly Cell[]; // resolved board positions
  readonly isSeed: boolean;
  readonly coloredEdges: readonly ColoredEdge[];  // only seeds carry these
}

/**
 * A colored edge of a seed piece. Hand-authored per level: the designer
 * picks the cells whose `direction` face is colored. Cells must belong to
 * the seed piece. The cell-count of this edge is `cells.length`.
 */
export interface ColoredEdge {
  readonly id: string;
  readonly color: RuleColor;
  readonly direction: Direction;
  readonly cells: readonly Cell[];
}

/** A rule binds a color to a fraction. Multiple rules per level. */
export interface Rule {
  readonly color: RuleColor;
  readonly fraction: Fraction;
}

/** Level configuration. All fields are static; play state is separate. */
export interface Level {
  readonly id: number;
  readonly gradeLabel: string;     // e.g., "Grade 3"
  readonly title: string;          // shown briefly at round start
  readonly boardWidth: number;     // in cells
  readonly boardHeight: number;    // in cells
  readonly rules: readonly Rule[];
  readonly seedPieces: readonly PlacedPiece[];
  readonly handShapeIds: readonly string[];
}

/** Active round state. Mutated through XState; never mutated directly elsewhere. */
export interface RoundState {
  readonly level: Level;
  readonly placedPieces: readonly PlacedPiece[];  // seeds + kid placements
  readonly handShapeIds: readonly string[];        // remaining
  readonly lastFailure: PlacementFailure | null;
}

/** Why a placement was rejected. Surfaced to the hint engine. */
export interface PlacementFailure {
  readonly reason: 'overlap' | 'rule-mismatch' | 'off-board' | 'no-anchor';
  readonly edgeId?: string;     // for rule-mismatch: which edge failed
  readonly needed?: number;     // expected touching cells
  readonly got?: number;        // actual touching cells
}
