import { motion } from "framer-motion";
import { useRef, useState } from "react";
import type { Piece } from "../domain/Piece";
import { PieceView } from "./PieceView";
import { TRAY_CELL_PX, CELL_PX } from "./sizing";
import { gridCellAtPoint } from "./dropTargets";
import { useGameStore } from "../store/gameStore";

/**
 * A piece in the tray that can be picked up and dragged onto the grid.
 *
 * During the drag, the piece visually scales up to the grid's cell size
 * (CELL_PX) so the kid sees the same piece size as it will be on the grid.
 * The hot-spot is the (0,0) cell — its top-left corner tracks the pointer.
 *
 * Tray pieces are blank when idle (per the user's "tray pieces hide colors"
 * preference). The moment the kid picks one up to drag, the colors reveal
 * so they can plan placement against the strict per-edge color contract.
 * On drop or cancel, the piece returns to blank in the tray.
 *
 * Why drag-reveal and not always-on tray colors: keeping the static tray
 * blank prevents shape-and-color scanning before the kid has committed to
 * a piece. But once they've COMMITTED (drag started), they need to see the
 * colored sides to satisfy the edge-color rules — otherwise the game is
 * unplayable.
 */
export function DraggablePiece({ piece }: { piece: Piece }) {
  const placePieceAt = useGameStore((s) => s.placePieceAt);
  const submitted = useGameStore((s) => s.submitted);
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <motion.div
      ref={ref}
      drag={!submitted}
      dragSnapToOrigin
      dragMomentum={false}
      whileTap={{ scale: 1.02 }}
      whileDrag={{
        scale: CELL_PX / TRAY_CELL_PX,
        zIndex: 50,
        filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.4))",
      }}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        setDragging(false);
        const dropCell = gridCellAtPoint(info.point.x, info.point.y);
        if (!dropCell) return;
        placePieceAt(piece.id, dropCell.col, dropCell.row);
      }}
      style={{ touchAction: "none", cursor: submitted ? "default" : "grab" }}
      className="select-none"
    >
      <PieceView piece={piece} cellPx={TRAY_CELL_PX} showCount hideColors={!dragging} />
    </motion.div>
  );
}
