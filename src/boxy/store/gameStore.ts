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
  messages: GameMessage[];
  messageCounter: number;
  placementCounter: number;
  revealedSolution: boolean;
  submitted: boolean;
  score: number; // 0..100
  // Ceiling % the player COULD reach if every piece in the round were placed.
  // Round generator removes void tiles; this caps fill at < 100% so the player
  // can see up-front what "perfect" looks like for this puzzle.
  maxPossiblePercent: number;
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
 * voids some tiles by design, so this is the puzzle's ceiling (< 100% on most
 * rounds). Surfaced live in the toolbar so the player knows the target.
 */
function maxPossiblePercentFor(round: GeneratedRound): number {
  let cells = 0;
  for (const p of round.solutionPlacements) cells += p.piece.squareCount;
  const total = round.cols * round.rows;
  if (total === 0) {
    throw new Error(
      `Round has zero cells (cols=${round.cols}, rows=${round.rows}). ` +
        `Bug: a round was generated with empty dimensions. Check the round generator inputs.`,
    );
  }
  return Math.round((cells / total) * 100);
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
    messages: [],
    messageCounter: 0,
    placementCounter: 0,
    revealedSolution: false,
    submitted: false,
    score: 0,
    maxPossiblePercent: maxPossiblePercentFor(round),
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
        return appendMessage(s, "warn", softReason(snap.reason));
      }
      const placementId = `placement-${s.placementCounter + 1}`;
      const placement: Placement = {
        placementId,
        piece,
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
        messages: [],
        messageCounter: 0,
        placementCounter: 0,
        revealedSolution: false,
        submitted: false,
        score: 0,
        maxPossiblePercent: maxPossiblePercentFor(round),
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
      return {
        ...s,
        grid: newGrid,
        trayPieceIds: [],
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
    // Retry the SAME puzzle. Pulls every non-anchor placement off the grid,
    // dumps the pieces back into the tray, and clears any terminal state so
    // the player can try for a higher score. The anchor and the rule set stay
    // intact — that's what makes this a retry, not a "new round" (which
    // generates a fresh puzzle with new pieces and rules).
    //
    // Score, messages, and counters all reset because they describe a run, and
    // the player is starting a new run on the same board.
    set((s) => {
      const anchors = s.grid.placements.filter((p) => p.anchor);
      const removedIds: string[] = [];
      for (const p of s.grid.placements) {
        if (!p.anchor) removedIds.push(p.piece.id);
      }
      const newGrid = new Grid(s.grid.cols, s.grid.rows, anchors);
      // Rebuild the tray from the round's full tray-piece list rather than
      // appending removed ids — that way two consecutive resets cannot leak
      // duplicate ids and the order matches a fresh round.
      const trayPieceIds = s.round.trayPieces
        .map((p) => p.id)
        .filter((id) => removedIds.includes(id) || s.trayPieceIds.includes(id));
      return {
        ...s,
        grid: newGrid,
        trayPieceIds,
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
type CanPlaceFail = Exclude<ReturnType<Grid["canPlace"]>, { ok: true }>;
type SnapResult =
  | { ok: true; origin: { col: number; row: number } }
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

  let bestOk: { origin: { col: number; row: number }; dist: number } | null = null;
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
      if (!bestOk || dist < bestOk.dist) bestOk = { origin, dist };
    } else {
      fails.push(r);
    }
  }
  if (bestOk) return { ok: true, origin: bestOk.origin };

  // Rank rejection reasons so we surface the most-useful one. rule_mismatch is
  // about the math (the actual puzzle), so it outranks geometric reasons.
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
 * Suggestion-voice copy. Treats every rejection as "try another way" rather
 * than "you failed." Pedagogical: a 7th-grader sees yellow and reads
 * "I think it might be another way", not red and "you got it wrong."
 */
function softReason(r: CanPlaceFail): string {
  switch (r.reason) {
    case "rule_mismatch":
      return `I think it might land another way — those two pieces would meet in a ${r.placedCount}:${r.newCount} ratio, and no rule in the panel allows that. Try a different piece, or a spot next to a different piece.`;
    case "overlap":
      return "I think it might fit another way — every box of the piece has to land on an empty cell, and at least one of these would overlap. Try a spot a cell over.";
    case "no_adjacency":
      return "I think it might fit another way — pieces have to touch one already on the grid. Try a spot next to an existing piece.";
    case "out_of_bounds":
      return "I think it might fit another way — at least one box would land off the grid no matter how I align this piece. Try a spot further inside.";
  }
}
