import { Chess, type Move } from 'chess.js';
import { precomputePST } from './eval/pst.js';
import { evaluateWhitePerspective } from './eval/evaluate.js';
import { createSearchContext, searchRoot } from './search/minimax.js';
import { getDifficultyConfig } from './difficulty.js';
import { initBook, lookupBookMove } from './book/openingBook.js';

// ----------------------------- public types -----------------------------

export type Difficulty = 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'master';

export interface MoveResult {
  from: string;
  to: string;
  promotion?: string;
  evaluation: number;
  depthReached: number;
  nodesSearched: number;
}

export interface ChessEngine {
  init(): Promise<void>;
  getBestMove(fen: string, difficulty: Difficulty): Promise<MoveResult>;
  evaluatePosition(fen: string): Promise<number>;
  stop(): void;
}

// --------------------------- implementation -----------------------------

class Engine implements ChessEngine {
  private inited = false;
  /**
   * Currently-running search context (if any). `stop()` flips its flag.
   * Internal mutable state — narrow `any`-like usage isolated to this field.
   */
  private currentCtx: { stopped: boolean } | null = null;

  async init(): Promise<void> {
    if (this.inited) return;
    precomputePST();
    initBook();
    this.inited = true;
  }

  async getBestMove(fen: string, difficulty: Difficulty): Promise<MoveResult> {
    if (!this.inited) await this.init();

    const cfg = getDifficultyConfig(difficulty);
    const chess = new Chess(fen);

    // 1. Opening book lookup for master.
    if (cfg.useBook) {
      const bookMove = lookupBookMove(fen);
      if (bookMove) {
        // Validate book move is legal in this exact position.
        const legal = chess.moves({ verbose: true }) as Move[];
        const match = legal.find(
          (m) => m.from === bookMove.from && m.to === bookMove.to && (m.promotion ?? '') === (bookMove.promotion ?? ''),
        );
        if (match) {
          // Eval after the book move (cheap, depth 0).
          const result: MoveResult = {
            from: match.from,
            to: match.to,
            evaluation: 0,
            depthReached: 0,
            nodesSearched: 0,
          };
          if (match.promotion) result.promotion = match.promotion;
          return result;
        }
      }
    }

    // 2. Run search.
    const ctx = createSearchContext(cfg.useQuiescence);
    this.currentCtx = ctx;
    let searchOutcome;
    try {
      searchOutcome = searchRoot(
        chess,
        {
          depth: cfg.depth,
          useQuiescence: cfg.useQuiescence,
          iterativeDeepening: cfg.iterativeDeepening,
        },
        ctx,
      );
    } finally {
      this.currentCtx = null;
    }

    const legal = chess.moves({ verbose: true }) as Move[];
    if (legal.length === 0) {
      throw new Error('No legal moves available for given FEN');
    }

    // 3. Apply randomness for easier difficulties.
    //    After search, choose from top-K, then with probability=randomness
    //    swap for a random legal move.
    let chosen: Move | null = searchOutcome.bestMove;
    let chosenScore = searchOutcome.score;

    if (cfg.topK > 1 && searchOutcome.topCandidates.length > 0) {
      const top = searchOutcome.topCandidates.slice(0, cfg.topK);
      const pick = top[Math.floor(Math.random() * top.length)]!;
      chosen = pick.move;
      chosenScore = pick.score;
    }

    if (cfg.randomness > 0 && Math.random() < cfg.randomness) {
      const random = legal[Math.floor(Math.random() * legal.length)]!;
      chosen = random;
      // Score is unknown for a random move; report 0 to indicate "not evaluated".
      chosenScore = 0;
    }

    if (!chosen) chosen = legal[0]!;

    // Convert internal (side-to-move) score back to white perspective for the
    // public MoveResult.evaluation field, matching evaluatePosition() convention.
    const whitePerspectiveScore = chess.turn() === 'w' ? chosenScore : -chosenScore;

    const result: MoveResult = {
      from: chosen.from,
      to: chosen.to,
      evaluation: whitePerspectiveScore,
      depthReached: searchOutcome.depthReached,
      nodesSearched: searchOutcome.nodes,
    };
    if (chosen.promotion) result.promotion = chosen.promotion;
    return result;
  }

  async evaluatePosition(fen: string): Promise<number> {
    if (!this.inited) await this.init();
    const chess = new Chess(fen);
    return evaluateWhitePerspective(chess);
  }

  stop(): void {
    if (this.currentCtx) this.currentCtx.stopped = true;
  }
}

export function createEngine(): ChessEngine {
  return new Engine();
}

// Re-exports for advanced use cases / testing.
export { getDifficultyConfig } from './difficulty.js';
export { evaluateWhitePerspective, evaluate } from './eval/evaluate.js';
export { lookupBookMove, bookSize, initBook } from './book/openingBook.js';
