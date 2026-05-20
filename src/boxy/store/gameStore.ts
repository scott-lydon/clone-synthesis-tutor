import { create } from "zustand";
import { Grid } from "../domain/Grid";
import { generateRound, gridFromRound, type GeneratedRound } from "../domain/Generator";
import type { Piece } from "../domain/Piece";
import type { Placement } from "../domain/Grid";
import type { Rule } from "../domain/Rule";

export interface GameMessage {
  readonly id: string;
  readonly text: string;
  readonly kind: "info" | "warn" | "win";
}

interface StoreData {
  round: GeneratedRound;
  grid: Grid;
  // pieces still available in the tray (subset of round.trayPieces, minus those placed)
  trayPieceIds: string[];
  // pieces the student dropped on the grid in a rules-rejected spot. They are
  // visibly preserved in the "Dropped" basket as a record of what was spent
  // and why, so the student can compare misplaced pieces against the rules
  // panel. Order is chronological: most recent at the tail. Once a piece is
  // dropped it stays dropped for the rest of the round (resetPlacements
  // restores them when retrying the same puzzle).
  droppedPieceIds: string[];
  messages: GameMessage[];
  messageCounter: number;
  placementCounter: number;
  revealedSolution: boolean;
  submitted: boolean;
  score: number; // 0..100
  // Box-count totals exposed for the toolbar's fraction readout. Cheaper than
  // recomputing every render and keeps "filled" and "possible" using the same
  // denominator (total grid cells) so the two readouts compare cleanly.
  totalCells: number; // grid.cols * grid.rows
  possibleCells: number; // sum of every solution placement's squareCount
}

interface StoreActions {
  placePieceAt: (pieceId: string, gridCol: number, gridRow: number) => void;
  removePlacement: (placementId: string) => void;
  newRound: (cols?: number, rows?: number, maxPieceSize?: number) => void;
  revealSolution: () => void;
  submit: () => void;
  dismissMessages: () => void;
  resetPlacements: () => void;
}

export type GameStore = StoreData & StoreActions;

function initialRound(cols: number, rows: number, maxPieceSize: number): GeneratedRound {
  // Keep regenerating until we have a usable round (at least 2 tiles + 1 anchor + at least 1 tray piece).
  for (let i = 0; i < 25; i++) {
    const r = generateRound({ cols, rows, maxPieceSize });
    if (r.trayPieces.length >= 1 && r.rules.length >= 1) return r;
  }
  throw new Error(
    `Generator failed to produce a usable round after 25 attempts for cols=${cols}, rows=${rows}, maxPieceSize=${maxPieceSize}. ` +
      `Bug: either the grid is too small to produce variety, or the tile() function is rejecting too many candidates. ` +
      `Try a larger grid or larger maxPieceSize.`,
  );
}

/**
 * Appends a message. The panel only renders the latest one, so we deliberately
 * REPLACE rather than stack when the same text fires consecutively — three
 * identical "I think it might land another way..." messages stacked on top of
 * each other was the bug this guards against. Different text from a previous
 * message still appends so the player sees the new advice.
 *
 * `win` is exempt from dedupe. A win message is an event ("the player just
 * cleared the tray"), not a status; if the player removes the last piece and
 * re-places it, the second clearance is a NEW event and must re-prompt the
 * "Tap Submit to score" instruction. Dedupe by content alone silently swallowed
 * that case before — flagged by qa-adversary as finding #1.
 */
function appendMessage(s: StoreData, kind: GameMessage["kind"], text: string): StoreData {
  const last = s.messages[s.messages.length - 1];
  if (kind !== "win" && last && last.text === text && last.kind === kind) return s;
  return {
    ...s,
    messages: [...s.messages, { id: `msg-${s.messageCounter + 1}`, kind, text }],
    messageCounter: s.messageCounter + 1,
  };
}

const DEFAULT_COLS = 6;
const DEFAULT_ROWS = 5;
const DEFAULT_MAX_PIECE_SIZE = 5;

/**
 * The most you could ever fill: every solution piece placed. The generator
 * voids some tiles by design, so this is the puzzle's ceiling (cells < total
 * on most rounds). Surfaced live in the toolbar so the student knows the
 * target. Returned as a raw cell count so the toolbar can render it as a
 * fraction (X / total) — younger students may not yet be working with
 * percentages, so cells-out-of-cells reads more naturally than "37%".
 */
function possibleCellsFor(round: GeneratedRound): number {
  let cells = 0;
  for (const p of round.solutionPlacements) cells += p.piece.squareCount;
  const total = round.cols * round.rows;
  if (total === 0) {
    throw new Error(
      `Round has zero cells (cols=${round.cols}, rows=${round.rows}). ` +
        `Bug: a round was generated with empty dimensions. Check the round generator inputs.`,
    );
  }
  return cells;
}

const initialData = (): StoreData => {
  const round = initialRound(DEFAULT_COLS, DEFAULT_ROWS, DEFAULT_MAX_PIECE_SIZE);
  // No intro message in the panel: the header subtitle, rules panel, and
  // How-to-play carousel already explain the goal. A third copy in the message
  // panel was redundant chrome that competed with real, actionable feedback
  // (placement errors, win confirmation) for the player's attention.
  return {
    round,
    grid: gridFromRound(round),
    trayPieceIds: round.trayPieces.map((p) => p.id),
    droppedPieceIds: [],
    messages: [],
    messageCounter: 0,
    placementCounter: 0,
    revealedSolution: false,
    submitted: false,
    score: 0,
    totalCells: round.cols * round.rows,
    possibleCells: possibleCellsFor(round),
  };
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialData(),

  placePieceAt: (pieceId, gridCol, gridRow) => {
    set((s) => {
      // Terminal-state guards. After Submit or Reveal, the round is over: any
      // further placement would corrupt the score or contradict the revealed
      // solution. The UI disables the drag in those states, but a public action
      // contract has to enforce its own preconditions — any future keyboard
      // shortcut, programmatic test, or third-party drag library that bypasses
      // the drag={!submitted} prop would otherwise silently mutate state.
      // (qa-adversary findings #2 and #3.)
      if (s.submitted || s.revealedSolution) return s;
      const piece = pieceById(s.round, pieceId);
      if (!piece) return appendMessage(s, "warn", `Unknown piece id ${pieceId}.`);
      if (!s.trayPieceIds.includes(pieceId)) {
        return appendMessage(s, "warn", `Piece ${pieceId} is no longer in the tray.`);
      }
      // (gridCol, gridRow) is the cell the pointer was over on release, NOT the
      // piece's (0,0) origin. Try every local cell of the piece as the hot-spot
      // and pick the legal origin whose piece-centroid lands closest to that
      // drop cell. This eliminates the false "out of bounds" / "spot already
      // taken" errors that fired when a multi-cell piece's (0,0) corner
      // happened to land off-grid or on the anchor even though the visual
      // drop was on a valid empty cell.
      const snap = findBestOrigin(piece, { col: gridCol, row: gridRow }, s.grid, s.round.rules);
      if (!snap.ok) {
        // Consume the piece on incorrect placement: the student dropped it on
        // the grid in a spot the rules reject, so the piece is spent. The
        // piece moves from the tray to the visible "Dropped" basket so the
        // student can see exactly what they spent and reason about why. This
        // is the design switch from "every wrong drop bounces back to the
        // tray and the student keeps trying until something sticks" to "every
        // drop is a commitment — read the rules before you let go."
        //
        // Only on-grid rejections consume. A drag that releases outside the
        // grid entirely never reaches placePieceAt (DraggablePiece returns
        // early when gridCellAtPoint() is null), so it still snaps back. That
        // way, releasing a piece you didn't really mean to drop (mid-thought,
        // dragging it off the side, etc.) doesn't burn it.
        const newTray = s.trayPieceIds.filter((id) => id !== pieceId);
        const newDropped = [...s.droppedPieceIds, pieceId];
        const consumed = appendMessage(s, "warn", consumedReason(snap.reason));
        return { ...consumed, trayPieceIds: newTray, droppedPieceIds: newDropped };
      }
      // Placed-wins cleanup: at every seam where the new piece's color
      // differs from the placed neighbor's, the new piece's triangle gets
      // cleared (placed neighbor's color is the seam's authoritative rule
      // and the legality check used it; we now make the visual agree). The
      // piece is otherwise identical — same id, same shape, same colors on
      // every non-conflicting side.
      const placedPiece =
        snap.edgesToClear.length === 0 ? piece : piece.withClearedColors(snap.edgesToClear);
      const placementId = `placement-${s.placementCounter + 1}`;
      const placement: Placement = {
        placementId,
        piece: placedPiece,
        origin: snap.origin,
        anchor: false,
      };
      const newGrid = s.grid.withPlacement(placement);
      const newTray = s.trayPieceIds.filter((id) => id !== pieceId);
      let next: StoreData = {
        ...s,
        grid: newGrid,
        trayPieceIds: newTray,
        placementCounter: s.placementCounter + 1,
      };
      if (newTray.length === 0) {
        next = appendMessage(next, "win", "Every piece placed. Tap Submit to score.");
      }
      return next;
    });
  },

  removePlacement: (placementId) => {
    set((s) => {
      // Terminal-state guards. Once the round is over (Submit or Reveal), every
      // placement on the board is part of the final state — pulling one back
      // into the tray would either invalidate the score or contradict the
      // displayed solution. (qa-adversary finding #4: after Reveal Answer,
      // clicking any solution piece was removing it because revealed
      // placements are stored with anchor:false.)
      if (s.submitted || s.revealedSolution) return s;
      const placement = s.grid.placements.find((p) => p.placementId === placementId);
      if (!placement || placement.anchor) return s;
      const newGrid = s.grid.withoutPlacement(placementId);
      // Restore the piece to the tray.
      return {
        ...s,
        grid: newGrid,
        trayPieceIds: [...s.trayPieceIds, placement.piece.id],
      };
    });
  },

  newRound: (cols, rows, maxPieceSize) => {
    set(() => {
      const round = initialRound(
        cols ?? DEFAULT_COLS,
        rows ?? DEFAULT_ROWS,
        maxPieceSize ?? DEFAULT_MAX_PIECE_SIZE,
      );
      // Same as initial: no intro message. The toolbar's filled/possible
      // readout resets visibly when a new round starts, which is the only
      // status the player needs.
      return {
        round,
        grid: gridFromRound(round),
        trayPieceIds: round.trayPieces.map((p) => p.id),
        droppedPieceIds: [],
        messages: [],
        messageCounter: 0,
        placementCounter: 0,
        revealedSolution: false,
        submitted: false,
        score: 0,
        totalCells: round.cols * round.rows,
        possibleCells: possibleCellsFor(round),
      };
    });
  },

  revealSolution: () => {
    set((s) => {
      // Replace the grid with the full solution.
      const newGrid = new Grid(
        s.round.cols,
        s.round.rows,
        s.round.solutionPlacements.map((p, i) => ({
          ...p,
          placementId: `reveal-${i}`,
          anchor: false,
        })),
      );
      // Reveal shows the answer — every solution piece lands on the grid,
      // including ones the student previously dropped. Empty the Dropped
      // basket so the student doesn't see the same piece in two states at
      // once ("spent" in Dropped AND "shown" on the grid). The round is
      // already terminal at this point; nothing else acts on
      // droppedPieceIds until newRound or resetPlacements clears them.
      return {
        ...s,
        grid: newGrid,
        trayPieceIds: [],
        droppedPieceIds: [],
        revealedSolution: true,
        messages: [
          ...s.messages,
          {
            id: `msg-${s.messageCounter + 1}`,
            kind: "info",
            text: "Showing one solution. Tap New Round to play again.",
          },
        ],
        messageCounter: s.messageCounter + 1,
      };
    });
  },

  resetPlacements: () => {
    // Retry the SAME puzzle. Pulls every non-anchor placement off the grid
    // AND every dropped (consumed) piece out of the Dropped basket, putting
    // both kinds back into the tray. Clears terminal state so the student
    // can try for a higher score. The anchor and the rule set stay intact —
    // that's what makes this a retry, not a "new round" (which generates a
    // fresh puzzle with new pieces and rules).
    //
    // The Dropped basket exists precisely so the student can see what they
    // spent and reason about why. Reset undoes that spending so they can
    // approach the same puzzle with fresh attempts; without restoring
    // dropped pieces here, "Reset" would feel like a partial undo and
    // contradict the "retry the same puzzle" mental model.
    //
    // Score, messages, and counters all reset because they describe a run,
    // and the student is starting a new run on the same board.
    set((s) => {
      const anchors = s.grid.placements.filter((p) => p.anchor);
      const removedIds: string[] = [];
      for (const p of s.grid.placements) {
        if (!p.anchor) removedIds.push(p.piece.id);
      }
      const newGrid = new Grid(s.grid.cols, s.grid.rows, anchors);
      // Rebuild the tray from the round's full tray-piece list rather than
      // appending removed/dropped ids — that way two consecutive resets
      // cannot leak duplicate ids and the order matches a fresh round.
      const aliveOrReclaimed = (id: string): boolean =>
        removedIds.includes(id) ||
        s.trayPieceIds.includes(id) ||
        s.droppedPieceIds.includes(id);
      const trayPieceIds = s.round.trayPieces.map((p) => p.id).filter(aliveOrReclaimed);
      return {
        ...s,
        grid: newGrid,
        trayPieceIds,
        droppedPieceIds: [],
        messages: [],
        messageCounter: 0,
        placementCounter: 0,
        submitted: false,
        revealedSolution: false,
        score: 0,
      };
    });
  },

  dismissMessages: () => {
    // Clear the entire stack. The panel only renders the latest message
    // anyway, so dismissing what the player sees is equivalent to clearing
    // all backing state — and prevents an old dismissed message reappearing
    // if a render-only filter later changes.
    set((s) => ({ ...s, messages: [] }));
  },

  submit: () => {
    set((s) => {
      const fill = s.grid.fillRatio();
      const score = Math.round(fill * 100);
      return {
        ...s,
        submitted: true,
        score,
        messages: [
          ...s.messages,
          {
            id: `msg-${s.messageCounter + 1}`,
            kind: score === 100 ? "win" : "info",
            text:
              score === 100
                ? `Perfect! You filled the whole grid.`
                : `You filled ${score}% of the grid. Tap a placed piece to remove it and try again, or Reveal the answer.`,
          },
        ],
        messageCounter: s.messageCounter + 1,
      };
    });
  },
}));

function pieceById(round: GeneratedRound, id: string): Piece | undefined {
  for (const p of round.trayPieces) if (p.id === id) return p;
  for (const a of round.anchorPlacements) if (a.piece.id === id) return a.piece;
  return undefined;
}

/**
 * Snap-to-legal placement.
 *
 * The drop tells us only what cell the pointer was over. The piece is multi-
 * cell; the player's intent is "put the piece such that this cell is part of
 * it." So we try every local cell of the piece as the hot-spot. For each
 * candidate, the piece's origin would be `dropCell - localCell`. We pick the
 * candidate whose canPlace returns ok AND whose piece-centroid lands closest
 * to the drop cell (that matches the player's visual intent).
 *
 * If no candidate is legal, we collect the rejection reasons and pick the
 * most useful one to surface (rule mismatch outranks out-of-bounds, since the
 * math is the thing the player should think about). Returns the chosen reason
 * for the caller to phrase.
 */
type CanPlaceResult = ReturnType<Grid["canPlace"]>;
type CanPlaceOk = Extract<CanPlaceResult, { ok: true }>;
type CanPlaceFail = Exclude<CanPlaceResult, { ok: true }>;
type SnapResult =
  | {
      ok: true;
      origin: { col: number; row: number };
      edgesToClear: CanPlaceOk["edgesToClear"];
    }
  | { ok: false; reason: CanPlaceFail };

function findBestOrigin(
  piece: Piece,
  dropCell: { col: number; row: number },
  grid: Grid,
  rules: readonly Rule[],
): SnapResult {
  let centroidCol = 0;
  let centroidRow = 0;
  for (const c of piece.polyomino.cells) {
    centroidCol += c.col;
    centroidRow += c.row;
  }
  centroidCol /= piece.polyomino.cells.length;
  centroidRow /= piece.polyomino.cells.length;

  let bestOk: {
    origin: { col: number; row: number };
    dist: number;
    edgesToClear: CanPlaceOk["edgesToClear"];
  } | null = null;
  const fails: CanPlaceFail[] = [];

  for (const local of piece.polyomino.cells) {
    const origin = { col: dropCell.col - local.col, row: dropCell.row - local.row };
    const r = grid.canPlace(piece, origin, rules);
    if (r.ok) {
      // Distance from the piece's centroid (in absolute grid coords) to the
      // drop cell. Smaller = the piece feels visually centered on the drop.
      const absCentroidCol = origin.col + centroidCol;
      const absCentroidRow = origin.row + centroidRow;
      const dx = absCentroidCol - dropCell.col;
      const dy = absCentroidRow - dropCell.row;
      const dist = dx * dx + dy * dy;
      if (!bestOk || dist < bestOk.dist) {
        bestOk = { origin, dist, edgesToClear: r.edgesToClear };
      }
    } else {
      fails.push(r);
    }
  }
  if (bestOk) {
    return { ok: true, origin: bestOk.origin, edgesToClear: bestOk.edgesToClear };
  }

  // Rank rejection reasons so we surface the most-useful one. rule_mismatch
  // is about the puzzle math (the actual thing the student should reason
  // about), so it outranks geometric reasons.
  const priority: Record<CanPlaceFail["reason"], number> = {
    rule_mismatch: 0,
    overlap: 1,
    no_adjacency: 2,
    out_of_bounds: 3,
  };
  fails.sort((a, b) => priority[a.reason] - priority[b.reason]);
  return { ok: false, reason: fails[0] };
}

/**
 * Copy for a CONSUMED placement: the piece has been spent, so the message
 * names what went wrong and adds the "that piece is now used up" tag. No
 * "try this piece again" language — the piece is gone.
 *
 * Kept in suggestion-voice rather than blame-voice ("I think it landed
 * another way" rather than "you placed it wrong") so a 7th-grader reads it
 * as guidance, not punishment.
 */
function consumedReason(r: CanPlaceFail): string {
  const tail = " That piece is used up now. Read the rules before you place the next one.";
  switch (r.reason) {
    case "rule_mismatch":
      if (r.edgeColor) {
        return (
          `I think it landed another way — that seam was a ${r.edgeColor} edge, and the ` +
          `${r.placedCount}:${r.newCount} ratio doesn't match the ${r.edgeColor} rule.` +
          tail
        );
      }
      return (
        `I think it landed another way — those two pieces would meet in a ${r.placedCount}:${r.newCount} ` +
        `ratio, and no rule in the panel allows that.` +
        tail
      );
    case "overlap":
      return (
        "I think it landed another way — at least one of its boxes covered a cell that already had a piece." +
        tail
      );
    case "no_adjacency":
      return (
        "I think it landed another way — pieces have to touch one already on the grid, and this one didn't." +
        tail
      );
    case "out_of_bounds":
      return (
        "I think it landed another way — at least one box would have gone off the grid." +
        tail
      );
  }
}
