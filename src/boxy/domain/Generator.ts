import { Polyomino, type CellCoord, type Side, SIDES, sideDelta } from "./Polyomino";
import { Piece, type SideColorMap } from "./Piece";
import { Fraction } from "./Fraction";
import { type Rule, RULE_COLOR_PALETTE, type RuleColor } from "./Rule";
import { Grid, type Placement } from "./Grid";

/**
 * The generation algorithm follows the process note in the original Boxy
 * concept image:
 *
 *   "First fill the grid with a random set of block shapes, then calculate the
 *    ratios between the sides and the shapes. Create the rules from the ratios
 *    that are found on it."
 *
 * Concretely:
 *   1. Greedy-fill the grid with random polyominoes of size 2..MAX_SIZE.
 *   2. For each pair of orthogonally-adjacent polyominoes, compute their
 *      square-count ratio (smaller/larger). Collect unique ratios.
 *   3. Assign each unique ratio a color. That gives us the Rules.
 *   4. Color the shared edges: for every edge between adjacent polyominoes,
 *      paint both sides with the rule color matching their ratio.
 *   5. Pick one tile to leave on the grid as the anchor; the rest become
 *      tray pieces with their colored sides intact.
 *
 * Every round generated this way is solvable, because the "solution" is just
 * the tiling we started with.
 */

export interface GeneratedRound {
  readonly cols: number;
  readonly rows: number;
  readonly rules: readonly Rule[];
  readonly anchorPlacements: readonly Placement[]; // already on the grid
  readonly trayPieces: readonly Piece[];
  readonly solutionPlacements: readonly Placement[]; // for the reveal feature
}

interface RawTile {
  cells: CellCoord[]; // ABSOLUTE grid coords
  id: number;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Mulberry32 PRNG. Deterministic given a seed; good enough for puzzles. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Greedy random tiling of a cols x rows grid into polyominoes of size 2..maxSize. */
function tile(cols: number, rows: number, maxSize: number, rng: () => number): RawTile[] {
  const occupied: number[][] = [];
  for (let r = 0; r < rows; r++) occupied.push(new Array(cols).fill(-1));
  const tiles: RawTile[] = [];

  function freeNeighbors(cells: CellCoord[]): CellCoord[] {
    const out: CellCoord[] = [];
    const seen = new Set<string>();
    for (const c of cells) {
      for (const s of SIDES) {
        const { dcol, drow } = sideDelta(s);
        const ncol = c.col + dcol;
        const nrow = c.row + drow;
        if (ncol < 0 || nrow < 0 || ncol >= cols || nrow >= rows) continue;
        if (occupied[nrow][ncol] !== -1) continue;
        const key = `${ncol},${nrow}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ col: ncol, row: nrow });
      }
    }
    return out;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (occupied[r][c] !== -1) continue;
      const tileId = tiles.length;
      const targetSize = 2 + Math.floor(rng() * (maxSize - 1));
      const cells: CellCoord[] = [{ col: c, row: r }];
      occupied[r][c] = tileId;
      while (cells.length < targetSize) {
        const frontier = freeNeighbors(cells);
        if (frontier.length === 0) break;
        const chosen = shuffle(frontier, rng)[0];
        cells.push(chosen);
        occupied[chosen.row][chosen.col] = tileId;
      }
      tiles.push({ cells, id: tileId });
    }
  }

  // Merge any 1-cell tiles into a neighbor so every tile has size >= 2 (avoids
  // degenerate "1/N" rules everywhere).
  for (const tile of tiles) {
    if (tile.cells.length !== 1) continue;
    const lone = tile.cells[0];
    let merged = false;
    for (const s of shuffle(SIDES.slice(), rng)) {
      const { dcol, drow } = sideDelta(s);
      const ncol = lone.col + dcol;
      const nrow = lone.row + drow;
      if (ncol < 0 || nrow < 0 || ncol >= cols || nrow >= rows) continue;
      const nbrId = occupied[nrow][ncol];
      if (nbrId === -1 || nbrId === tile.id) continue;
      tiles[nbrId].cells.push(lone);
      occupied[lone.row][lone.col] = nbrId;
      tile.cells = [];
      merged = true;
      break;
    }
    if (!merged) {
      // Stranded; leave it. Rare for cols*rows >= 8.
    }
  }
  return tiles.filter((t) => t.cells.length > 0);
}

/** Build an adjacency map: tileId -> Set of neighboring tileIds. */
function adjacencies(tiles: RawTile[], cols: number, rows: number): Map<number, Set<number>> {
  // Re-index occupancy first.
  const occupied: number[][] = [];
  for (let r = 0; r < rows; r++) occupied.push(new Array(cols).fill(-1));
  for (const t of tiles) {
    for (const c of t.cells) occupied[c.row][c.col] = t.id;
  }
  const adj = new Map<number, Set<number>>();
  for (const t of tiles) adj.set(t.id, new Set<number>());
  for (const t of tiles) {
    for (const c of t.cells) {
      for (const s of SIDES) {
        const { dcol, drow } = sideDelta(s);
        const ncol = c.col + dcol;
        const nrow = c.row + drow;
        if (ncol < 0 || nrow < 0 || ncol >= cols || nrow >= rows) continue;
        const nbrId = occupied[nrow][ncol];
        if (nbrId === -1 || nbrId === t.id) continue;
        adj.get(t.id)!.add(nbrId);
        adj.get(nbrId)!.add(t.id);
      }
    }
  }
  return adj;
}

/** Build the rule list from the unique smaller/larger ratios across adjacent tiles. */
function deriveRules(tiles: RawTile[], adj: Map<number, Set<number>>): Map<string, Rule> {
  const ratioKey = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const g = gcd(lo, hi);
    return `${lo / g}/${hi / g}`;
  };
  // Index by id, not array position, because the tiles list can be sparse after
  // void removal. Looking up tiles[nbrId] by array index when a tile has been
  // removed lands on the wrong neighbor (or undefined). This was the bug behind
  // "Cannot read properties of undefined (reading 'cells')" on first deploy of
  // the gaps-in-solution change.
  const byId = new Map<number, RawTile>();
  for (const t of tiles) byId.set(t.id, t);

  const seen = new Map<string, Rule>();
  let colorIdx = 0;
  for (const t of tiles) {
    for (const nbrId of adj.get(t.id)!) {
      if (nbrId <= t.id) continue;
      const nbr = byId.get(nbrId);
      if (!nbr) continue; // neighbor was removed by void pass; no rule needed for this edge
      const key = ratioKey(t.cells.length, nbr.cells.length);
      if (seen.has(key)) continue;
      const [num, den] = key.split("/").map((x) => parseInt(x, 10));
      const color: RuleColor = RULE_COLOR_PALETTE[colorIdx % RULE_COLOR_PALETTE.length];
      colorIdx += 1;
      seen.set(key, { color, fraction: new Fraction(num, den) });
    }
  }
  return seen;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a === 0 ? 1 : a;
}

/** Paint a tile's external sides using the rules derived above. */
function paintSides(
  tile: RawTile,
  tiles: RawTile[],
  cols: number,
  rows: number,
  rulesByKey: Map<string, Rule>,
): SideColorMap {
  // Build id->tile lookup once. Same reason as deriveRules: array-index lookup
  // breaks when the tiles list is sparse after void removal.
  const byId = new Map<number, RawTile>();
  for (const t of tiles) byId.set(t.id, t);

  const occupied: number[][] = [];
  for (let r = 0; r < rows; r++) occupied.push(new Array(cols).fill(-1));
  for (const t of tiles) {
    for (const c of t.cells) occupied[c.row][c.col] = t.id;
  }

  let minCol = Infinity;
  let minRow = Infinity;
  for (const c of tile.cells) {
    if (c.col < minCol) minCol = c.col;
    if (c.row < minRow) minRow = c.row;
  }

  const map = new Map<string, Partial<Record<Side, RuleColor>>>();
  for (const c of tile.cells) {
    for (const s of SIDES) {
      const { dcol, drow } = sideDelta(s);
      const ncol = c.col + dcol;
      const nrow = c.row + drow;
      if (ncol < 0 || nrow < 0 || ncol >= cols || nrow >= rows) continue;
      const nbrId = occupied[nrow][ncol];
      if (nbrId === -1 || nbrId === tile.id) continue;
      const nbr = byId.get(nbrId);
      if (!nbr) continue;
      const lo = Math.min(tile.cells.length, nbr.cells.length);
      const hi = Math.max(tile.cells.length, nbr.cells.length);
      const g = gcd(lo, hi);
      const key = `${lo / g}/${hi / g}`;
      const rule = rulesByKey.get(key);
      if (!rule) continue;
      const localKey = `${c.col - minCol},${c.row - minRow}`;
      const existing = map.get(localKey) ?? {};
      map.set(localKey, { ...existing, [s]: rule.color });
    }
  }
  return map;
}

export function generateRound(opts: {
  cols: number;
  rows: number;
  maxPieceSize?: number;
  seed?: number;
  anchorCount?: number;
  /**
   * Target fraction of grid cells that should be VOID (not part of the solution).
   * Defaults to 0.25 so that ~25% of the grid is intentionally unfillable by the
   * solution. This stops a kid from shape-matching their way to the answer.
   */
  voidFraction?: number;
}): GeneratedRound {
  const cols = opts.cols;
  const rows = opts.rows;
  const maxSize = opts.maxPieceSize ?? 5;
  const seed = opts.seed ?? Math.floor(Math.random() * 0x7fffffff);
  const anchorCount = opts.anchorCount ?? 1;
  const voidFraction = Math.min(0.6, Math.max(0, opts.voidFraction ?? 0.25));
  const rng = makeRng(seed);

  let tiles = tile(cols, rows, maxSize, rng);

  // Reserve the anchor (largest tile) FIRST so it never gets dropped as a void.
  const sortedByCount = [...tiles].sort((a, b) => b.cells.length - a.cells.length);
  const anchorTilesPicked = sortedByCount.slice(0, anchorCount);
  const anchorTileIds = new Set(anchorTilesPicked.map((t) => t.id));

  // Drop random non-anchor tiles until we have ~voidFraction cells removed.
  // Removed tiles become permanent gaps in the solution; the rules are derived
  // only from adjacencies among the remaining tiles, so a kid placing pieces
  // into the gap zone is fine as long as their color/rule contract holds with
  // whatever they touch.
  if (voidFraction > 0) {
    const totalCells = cols * rows;
    const targetVoid = Math.floor(totalCells * voidFraction);
    const candidates = shuffle(
      tiles.filter((t) => !anchorTileIds.has(t.id)),
      rng,
    );
    const removed = new Set<number>();
    let voidedCells = 0;
    for (const t of candidates) {
      if (voidedCells >= targetVoid) break;
      // Avoid making any one removal blow past the target by 50%+ (keeps gaps small and spread out).
      if (t.cells.length + voidedCells > targetVoid * 1.5) continue;
      removed.add(t.id);
      voidedCells += t.cells.length;
    }
    tiles = tiles.filter((t) => !removed.has(t.id));
  }

  const adj = adjacencies(tiles, cols, rows);
  const rulesByKey = deriveRules(tiles, adj);

  // Build a Piece for each tile.
  const piecesById = new Map<number, Piece>();
  const solutionPlacements: Placement[] = [];
  for (const t of tiles) {
    let minCol = Infinity;
    let minRow = Infinity;
    for (const c of t.cells) {
      if (c.col < minCol) minCol = c.col;
      if (c.row < minRow) minRow = c.row;
    }
    const localCells = t.cells.map((c) => ({ col: c.col - minCol, row: c.row - minRow }));
    const poly = new Polyomino(localCells);
    const sideColors = paintSides(t, tiles, cols, rows, rulesByKey);
    const piece = new Piece(`piece-${t.id}`, poly, sideColors);
    piecesById.set(t.id, piece);
    solutionPlacements.push({
      placementId: `sol-${t.id}`,
      piece,
      origin: { col: minCol, row: minRow },
      anchor: false,
    });
  }

  // Anchor: the same tile(s) we reserved at the start. Re-resolve from the (possibly
  // smaller) tiles list so the anchor object references match the surviving entries.
  const anchorTiles = tiles.filter((t) => anchorTileIds.has(t.id));
  const anchorIds = anchorTileIds;
  if (anchorTiles.length === 0) {
    throw new Error(
      `Anchor tile disappeared after void removal. Bug: voidFraction removal dropped the reserved anchor. ` +
        `Check the loop that builds the void set - it should never include anchorTileIds.`,
    );
  }

  const anchorPlacements: Placement[] = anchorTiles.map((t) => {
    const piece = piecesById.get(t.id)!;
    let minCol = Infinity;
    let minRow = Infinity;
    for (const c of t.cells) {
      if (c.col < minCol) minCol = c.col;
      if (c.row < minRow) minRow = c.row;
    }
    return {
      placementId: `anchor-${t.id}`,
      piece,
      origin: { col: minCol, row: minRow },
      anchor: true,
    };
  });

  const trayPieces: Piece[] = [];
  for (const t of tiles) {
    if (anchorIds.has(t.id)) continue;
    trayPieces.push(piecesById.get(t.id)!);
  }

  const rules = Array.from(rulesByKey.values());
  return {
    cols,
    rows,
    rules,
    anchorPlacements,
    trayPieces,
    solutionPlacements,
  };
}

/** Convenience: build a Grid from a round's anchors. */
export function gridFromRound(round: GeneratedRound): Grid {
  return new Grid(round.cols, round.rows, round.anchorPlacements);
}
