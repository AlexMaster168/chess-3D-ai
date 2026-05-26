import { Chess } from 'chess.js';
import { evaluate } from '../eval/evaluate.js';
import { orderCaptures, tacticalMovesOnly } from '../ordering/moveOrder.js';
import type { SearchContext } from './minimax.js';

/**
 * Quiescence search.
 *
 * Standard "stand-pat + captures-only" extension at the horizon to dampen
 * the horizon effect. Side-to-move perspective (negamax). Returns cp.
 *
 * Max additional depth: 4 plies of captures (configurable via `maxQDepth`).
 */
export function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  ctx: SearchContext,
  qDepth: number = 0,
  maxQDepth: number = 4,
): number {
  ctx.nodes++;
  if (ctx.stopped) return 0;

  if (chess.isCheckmate()) {
    // Side to move is mated → very bad for us.
    return -100000 + qDepth;
  }
  if (
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isInsufficientMaterial() ||
    chess.isThreefoldRepetition()
  ) {
    return 0;
  }

  const standPat = evaluate(chess);
  if (standPat >= beta) return beta;
  if (standPat > alpha) alpha = standPat;

  if (qDepth >= maxQDepth) return alpha;

  const all = chess.moves({ verbose: true });
  const tactical = orderCaptures(tacticalMovesOnly(all));

  for (const move of tactical) {
    chess.move(move);
    const score = -quiescence(chess, -beta, -alpha, ctx, qDepth + 1, maxQDepth);
    chess.undo();

    if (ctx.stopped) return 0;
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}
