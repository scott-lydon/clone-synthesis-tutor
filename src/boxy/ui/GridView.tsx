import { useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { CELL_PX } from "./sizing";
import { PieceView } from "./PieceView";
import { setGridDropInfo, clearGridDropInfo } from "./dropTargets";
import { AdjacencyGlow } from "./AdjacencyGlow";

/**
 * The main play area. Renders the empty cells of the grid plus every placement
 * (anchors + kid-placed). Registers its drop info so DraggablePiece can map a
 * drop point to a (col, row) cell.
 *
 * Layered as one SVG-per-placement positioned absolutely so each piece's
 * triangular side colorings remain pixel-perfect at any cell size. Anchors and
 * kid placements are visually identical except anchors are not removable (they
 * have a thin orange ring to indicate "starting block").
 */
export function GridView() {
  const grid = useGameStore((s) => s.grid);
  const removePlacement = useGameStore((s) => s.removePlacement);
  const submitted = useGameStore((s) => s.submitted);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setGridDropInfo({
        left: r.left,
        top: r.top,
        cellPx: CELL_PX,
        cols: grid.cols,
        rows: grid.rows,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const t = setTimeout(update, 100);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      clearGridDropInfo();
    };
  }, [grid.cols, grid.rows]);

  const w = grid.cols * CELL_PX;
  const h = grid.rows * CELL_PX;

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl"
      style={{
        width: w,
        height: h,
        background:
          "linear-gradient(160deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Empty-cell grid lines, very faint so the grid reads as quiet space. */}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 pointer-events-none">
        {Array.from({ length: grid.cols + 1 }).map((_, i) => (
          <line key={`v${i}`} x1={i * CELL_PX} y1={0} x2={i * CELL_PX} y2={h} stroke="rgba(148,163,184,0.07)" strokeWidth={1} />
        ))}
        {Array.from({ length: grid.rows + 1 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * CELL_PX} x2={w} y2={i * CELL_PX} stroke="rgba(148,163,184,0.07)" strokeWidth={1} />
        ))}
      </svg>
      <AdjacencyGlow />
      {/* Placed pieces */}
      {grid.placements.map((p) => {
        const left = p.origin.col * CELL_PX;
        const top = p.origin.row * CELL_PX;
        return (
          <div
            key={p.placementId}
            className="absolute"
            style={{
              left,
              top,
              cursor: !p.anchor && !submitted ? "pointer" : "default",
            }}
            onClick={() => {
              if (!p.anchor && !submitted) removePlacement(p.placementId);
            }}
            role={!p.anchor && !submitted ? "button" : undefined}
            aria-label={p.anchor ? "Anchor piece" : "Placed piece; tap to remove"}
            title={p.anchor ? "Starting piece" : "Tap to remove"}
          >
            <PieceView
              piece={p.piece}
              cellPx={CELL_PX}
              showCount
              // Placed pieces share the default background-dark outline (set
              // in PieceView) so adjacent placements have a clear dark gutter
              // between them. Anchor gets a dusty terracotta ring so the
              // "this one stays put" signal remains, without screaming.
              outlineColor={p.anchor ? "rgba(232, 168, 124, 0.7)" : undefined}
              outlineWidth={p.anchor ? 2 : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
