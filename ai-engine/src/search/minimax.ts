import { Chess, type Move } from 'chess.js';
import { evaluate } from '../eval/evaluate.js';
import {
  HistoryTable,
  KillerTable,
  moveKey,
  orderMoves,
} from '../ordering/moveOrder.js';
import type { PieceType } from '../eval/pst.js';
import { quiescence } from './quiescence.js';

/**
 * Negamax + alpha-beta search.
 *
 * Sign convention: all internal scores are from the side-to-move perspective.
 * The caller (engine) sign-corrects to white-perspective only when reporting
 * evaluatePosition().
 *
 * Search supports:
 *  - alpha-beta pruning
 *  - move ordering (PV, MVV-LVA, killers, history)
 *  - optional quiescence at horizon
 *  - iterative deepening at the root with `stopped` check between depths
 */

export interface SearchOptions {
  depth: number;             // target depth (or max depth for iterative deepening)
  useQuiescence: boolean;
  iterativeDeepening: boolean;
}

export interface SearchContext {
  killers: KillerTable;
  history: HistoryTable;
  stopped: boolean;
  nodes: number;
  useQuiescence: boolean;
}

export interface SearchResult {
  bestMove: Move | null;
  score: number;             // side-to-move perspective, cp
  depthReached: number;
  nodes: number;
  topCandidates: { move: Move; score: number }[]; // root-level scored moves
}

export function createSearchContext(useQuiescence: boolean): SearchContext {
  return {
    killers: new KillerTable(),
    history: new HistoryTable(),
    stopped: false,
    nodes: 0,
    useQuiescence,
  };
}

/**
 * Inner negamax with alpha-beta. Returns score from side-to-move perspective.
 */
function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  ctx: SearchContext,
): number {
  ctx.nodes++;

  if (ctx.stopped) return 0;

  if (chess.isCheckmate()) {
    // We are checkmated. Prefer shorter mates by encoding ply.
    return -100000 + ply;
  }
  if (
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isInsufficientMaterial() ||
    chess.isThreefoldRepetition()
  ) {
    return 0;
  }

  if (depth <= 0) {
    if (ctx.useQuiescence) {
      return quiescence(chess, alpha, beta, ctx, 0, 4);
    }
    return evaluate(chess);
  }

  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    // Shouldn't happen given the isCheckmate/isStalemate guards, but safety.
    return evaluate(chess);
  }

  const ordered = orderMoves(moves, ply, ctx.killers, ctx.history);

  let best = -Infinity;
  for (const move of ordered) {
    chess.move(move);
    const score = -negamax(chess, depth - 1, -beta, -alpha, ply + 1, ctx);
    chess.undo();

    if (ctx.stopped) return 0;

    if (score > best) best = score;
    if (best > alpha) alpha = best;

    if (alpha >= beta) {
      // Beta cutoff. Quiet moves get killer + history credit.
      if (!move.captured && !move.promotion) {
        ctx.killers.store(ply, moveKey(move));
        ctx.history.add(move.piece as PieceType, move.color as 'w' | 'b', move.to, depth);
      }
      break;
    }
  }
  return best;
}

/**
 * Root search: returns the best move plus all scored root moves
 * (so callers can sample top-K for the easier difficulties).
 */
export function searchRoot(
  chess: Chess,
  options: SearchOptions,
  ctx: SearchContext,
): SearchResult {
  const rootMoves = chess.moves({ verbose: true });
  if (rootMoves.length === 0) {
    return { bestMove: null, score: 0, depthReached: 0, nodes: ctx.nodes, topCandidates: [] };
  }

  let depthReached = 0;
  let bestRoot: Move | null = null;
  let bestRootScore = -Infinity;
  let lastScored: { move: Move; score: number }[] = [];

  const maxDepth = Math.max(1, options.depth);
  const startDepth = options.iterativeDeepening ? 1 : maxDepth;

  for (let d = startDepth; d <= maxDepth; d++) {
    if (ctx.stopped) break;

    let alpha = -Infinity;
    const beta = Infinity;
    let iterBest: Move | null = null;
    let iterBestScore = -Infinity;
    const scored: { move: Move; score: number }[] = [];

    // Order root moves: previous-iteration PV first.
    const ordered = orderMoves(
      rootMoves,
      0,
      ctx.killers,
      ctx.history,
      bestRoot ? moveKey(bestRoot) : undefined,
    );

    for (const move of ordered) {
      chess.move(move);
      const score = -negamax(chess, d - 1, -beta, -alpha, 1, ctx);
      chess.undo();

      if (ctx.stopped) break;

      scored.push({ move, score });

      if (score > iterBestScore) {
        iterBestScore = score;
        iterBest = move;
      }
      if (score > alpha) alpha = score;
    }

    if (ctx.stopped) break;

    if (iterBest) {
      bestRoot = iterBest;
      bestRootScore = iterBestScore;
      depthReached = d;
      lastScored = scored;
    }
  }

  // Fallback: if we never finished even depth 1, take any legal move.
  if (!bestRoot && rootMoves.length > 0) {
    bestRoot = rootMoves[0]!;
    bestRootScore = 0;
    depthReached = 0;
    lastScored = rootMoves.map((m) => ({ move: m, score: 0 }));
  }

  // Sort scored moves descending for top-K sampling.
  lastScored.sort((a, b) => b.score - a.score);

  return {
    bestMove: bestRoot,
    score: bestRootScore,
    depthReached,
    nodes: ctx.nodes,
    topCandidates: lastScored,
  };
}
