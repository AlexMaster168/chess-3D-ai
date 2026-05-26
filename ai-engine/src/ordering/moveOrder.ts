import type { Move } from 'chess.js';
import { PIECE_VALUES } from '../eval/evaluate.js';
import type { PieceType } from '../eval/pst.js';

/**
 * Move ordering for alpha-beta search.
 *
 *   1. Hash / PV move first (caller-provided)
 *   2. Captures sorted by MVV-LVA
 *   3. Promotions (boosted)
 *   4. Killer moves (per ply)
 *   5. History heuristic (per piece-to-square)
 *   6. Everything else
 */

export class KillerTable {
  // 2 killers per ply
  private readonly killers: (string | undefined)[][] = [];

  store(ply: number, moveKey: string): void {
    let slot = this.killers[ply];
    if (!slot) {
      slot = [];
      this.killers[ply] = slot;
    }
    if (slot[0] === moveKey) return;
    slot[1] = slot[0];
    slot[0] = moveKey;
  }

  isKiller(ply: number, moveKey: string): boolean {
    const slot = this.killers[ply];
    if (!slot) return false;
    return slot[0] === moveKey || slot[1] === moveKey;
  }

  clear(): void {
    this.killers.length = 0;
  }
}

export class HistoryTable {
  // Keyed by `${piece}-${to}`. Indexed by side for tighter locality.
  private readonly table: Map<string, number> = new Map();

  add(piece: PieceType, color: 'w' | 'b', toSquare: string, depth: number): void {
    const key = `${color}${piece}-${toSquare}`;
    const prev = this.table.get(key) ?? 0;
    this.table.set(key, prev + depth * depth);
  }

  get(piece: PieceType, color: 'w' | 'b', toSquare: string): number {
    return this.table.get(`${color}${piece}-${toSquare}`) ?? 0;
  }

  clear(): void {
    this.table.clear();
  }
}

export function moveKey(m: Move): string {
  return `${m.from}${m.to}${m.promotion ?? ''}`;
}

/**
 * Compute an ordering score for a move. Higher = search first.
 * `bestMove` is the PV/hash move to bubble to the top.
 */
export function scoreMove(
  m: Move,
  ply: number,
  killers: KillerTable,
  history: HistoryTable,
  bestMove?: string,
): number {
  const key = moveKey(m);

  if (bestMove && key === bestMove) return 1_000_000;

  // Captures: MVV-LVA. Use 100k base so all captures outrank quiet moves.
  if (m.captured) {
    const victim = PIECE_VALUES[m.captured as PieceType];
    const attacker = PIECE_VALUES[m.piece as PieceType];
    return 100_000 + victim * 10 - attacker;
  }

  // Promotions to queen are very strong; lesser promotions still beat quiets.
  if (m.promotion) {
    return 90_000 + PIECE_VALUES[m.promotion as PieceType];
  }

  if (killers.isKiller(ply, key)) return 80_000;

  return history.get(
    m.piece as PieceType,
    m.color as 'w' | 'b',
    m.to,
  );
}

export function orderMoves(
  moves: Move[],
  ply: number,
  killers: KillerTable,
  history: HistoryTable,
  bestMove?: string,
): Move[] {
  const scored = moves.map((m) => ({
    m,
    s: scoreMove(m, ply, killers, history, bestMove),
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.m);
}

/** Strip move list down to captures + promotions for quiescence. */
export function tacticalMovesOnly(moves: Move[]): Move[] {
  return moves.filter((m) => m.captured !== undefined || m.promotion !== undefined);
}

/** MVV-LVA-only ordering for quiescence (no killers/history). */
export function orderCaptures(moves: Move[]): Move[] {
  const scored = moves.map((m) => {
    const victim = m.captured ? PIECE_VALUES[m.captured as PieceType] : 0;
    const attacker = PIECE_VALUES[m.piece as PieceType];
    const promo = m.promotion ? PIECE_VALUES[m.promotion as PieceType] : 0;
    return { m, s: victim * 10 - attacker + promo };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.m);
}
