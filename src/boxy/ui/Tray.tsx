import { useGameStore } from "../store/gameStore";
import { DraggablePiece } from "./DraggablePiece";

export function Tray() {
  const round = useGameStore((s) => s.round);
  const trayPieceIds = useGameStore((s) => s.trayPieceIds);

  // Build a stable mapping from id to piece.
  const idToPiece = new Map(round.trayPieces.map((p) => [p.id, p]));
  const pieces = trayPieceIds.map((id) => idToPiece.get(id)).filter((p) => p !== undefined);

  if (pieces.length === 0) {
    return (
      <div className="w-full max-w-3xl rounded-2xl border border-dashed border-slate-700/50 p-8 text-center text-slate-500 text-sm">
        Tray is empty. Hit <em>Submit</em> to score or <em>New round</em> for a new puzzle.
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-3xl rounded-2xl p-6"
      style={{
        background: "rgba(31, 41, 55, 0.45)",
        backdropFilter: "blur(6px)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.10)",
      }}
    >
      <div
        className="text-xs uppercase tracking-[0.18em] font-semibold mb-4"
        style={{ color: "rgba(212, 200, 178, 0.7)" }}
      >
        Parts <span className="text-slate-500 ml-1">({pieces.length})</span>
      </div>
      <div className="flex flex-wrap gap-6 items-start">
        {pieces.map((p) => (
          <DraggablePiece key={p!.id} piece={p!} />
        ))}
      </div>
    </div>
  );
}
