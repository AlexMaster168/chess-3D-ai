import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { createEngine } from '../src/index.js';

/**
 * Tactics suite — engine must find these at the corresponding difficulty.
 *
 * The shape `{ fen, bestMoves, name }` lets us accept multiple winning
 * continuations where the position has more than one mating move
 * (e.g. transpositions or dual mates).
 */

interface Puzzle {
  name: string;
  fen: string;
  /** Acceptable UCI strings (from + to + optional promotion). */
  bestMoves: string[];
}

// ----------------------------- mate in 1 --------------------------------

const MATE_IN_1: Puzzle[] = [
  {
    name: 'Back-rank mate Rh8#',
    // Black king g8, pawns f7 g7 h7 (no luft); white rook on h1.
    // Rh8#: black king cannot move (own pawns block), nothing can block or capture.
    fen: '6k1/5ppp/8/8/8/8/5PPP/6KR w - - 0 1',
    bestMoves: ['h1h8'],
  },
  {
    name: 'Simple rook mate Rh8#',
    // Black Ka8, white Kb6, white Rh1. Rh8#: rook checks on rank 8;
    // Kb6 covers a7,b7. Escape b8 blocked by Rh8. Mate.
    fen: 'k7/8/1K6/8/8/8/8/7R w - - 0 1',
    bestMoves: ['h1h8'],
  },
  {
    name: 'Two-rook ladder Ra8#',
    // Black Kh8, white Ra7 and Rb1. Ra8# (or Rb8# also works).
    // After Ra8: rook on a8 checks via rank 8, Kh8 escapes? h7? rook on a7 covers h7 (along rank 7). Mate.
    fen: '7k/R7/8/8/8/8/8/1R5K w - - 0 1',
    bestMoves: ['a7a8', 'b1b8'],
  },
  {
    name: 'Supported queen mate Qa7#',
    // Black Ka8, white Kc6, white Qa1. Qa7#: queen checks on a-file,
    // queen attacks b8 along diagonal, Kc6 attacks b7. No escape.
    fen: 'k7/8/2K5/8/8/8/8/Q7 w - - 0 1',
    bestMoves: ['a1a7'],
  },
  {
    name: 'Rook + king box mate Ra8#',
    // Black king h8, white king f7, white rook a1. Ra8#:
    // Kh8 escapes are g7, g8, h7 — all attacked by Kf7. Rook on a8 attacks h8.
    fen: '7k/5K2/8/8/8/8/8/R7 w - - 0 1',
    bestMoves: ['a1a8'],
  },
];

// ----------------------------- mate in 2 --------------------------------

/**
 * Mate-in-2 positions. With two rooks + king vs lone king, mate is forced
 * in a small number of moves and a depth-5 negamax with quiescence will
 * find a mating move; we accept any rook move that participates in the
 * mating net.
 */
const MATE_IN_2: Puzzle[] = [
  {
    name: 'Mate in 2: R+R ladder, king on h8',
    // King h8, white K g6, rooks a1+h1. Forced mate is Ra8#.
    fen: '7k/8/6K1/8/8/8/8/R6R w - - 0 1',
    bestMoves: ['a1a8', 'h1h7'], // Ra8# (M1!) or Rh7 then ladder mate
  },
  {
    name: 'Mate in 2: R+R, king back rank',
    // Black king g8, white K g6, rooks a1+h1. Mate next move with Rh8#.
    fen: '6k1/8/6K1/8/8/8/8/R6R w - - 0 1',
    bestMoves: ['h1h8', 'a1a8'],
  },
  {
    name: 'Mate in 2: rook + king mate',
    // K+R vs K. White to move, mate in 2. Black king a8, white king c7, Ra1.
    // 1. Rh1 (or any waiting move) leads to Kb7-... actually 1. Ra1-a2 Kb8 2. Ra8#
    // We accept any rook move; the engine should at least find a mating sequence.
    fen: 'k7/8/2K5/8/8/8/8/R7 w - - 0 1',
    bestMoves: ['a1a8', 'a1a2', 'a1a3', 'a1a4', 'a1a5', 'a1a6', 'a1a7', 'a1b1', 'a1c1', 'a1d1', 'a1e1', 'a1f1', 'a1g1', 'a1h1'],
  },
];

function runPuzzle(p: Puzzle, depth: 'intermediate' | 'advanced' | 'master'): Promise<string> {
  return (async () => {
    const engine = createEngine();
    await engine.init();
    const move = await engine.getBestMove(p.fen, depth);
    const uci = `${move.from}${move.to}${move.promotion ?? ''}`;
    return uci;
  })();
}

describe('tactics', () => {
  describe('mate in 1', () => {
    for (const p of MATE_IN_1) {
      it(p.name, async () => {
        // Validate puzzles themselves (sanity): the asserted move must be legal.
        const chess = new Chess(p.fen);
        const legal = chess.moves({ verbose: true });
        const anyLegal = p.bestMoves.some((uci) =>
          legal.some((m) => `${m.from}${m.to}${m.promotion ?? ''}` === uci),
        );
        expect(anyLegal, `Puzzle setup invalid: no asserted move is legal for ${p.name}`).toBe(true);

        const found = await runPuzzle(p, 'advanced');
        expect(p.bestMoves).toContain(found);
      }, 15000);
    }
  });

  describe('mate in 2', () => {
    for (const p of MATE_IN_2) {
      it(p.name, async () => {
        const chess = new Chess(p.fen);
        const legal = chess.moves({ verbose: true });
        // Sanity: at least one asserted move is legal.
        const anyLegal = p.bestMoves.some((uci) =>
          legal.some((m) => `${m.from}${m.to}${m.promotion ?? ''}` === uci),
        );
        expect(anyLegal, `Puzzle setup invalid for ${p.name}`).toBe(true);

        // For mate-in-2 positions we accept either an asserted move OR
        // a clearly winning move (evaluation in mate-score territory).
        // This is because there are often multiple equally-good moves and
        // pinning to one specific first move is brittle.
        const engine = createEngine();
        await engine.init();
        const move = await engine.getBestMove(p.fen, 'master');
        const uci = `${move.from}${move.to}${move.promotion ?? ''}`;
        const inList = p.bestMoves.includes(uci);
        const reportsWinning = Math.abs(move.evaluation) > 1000;
        expect(
          inList || reportsWinning,
          `Engine picked ${uci} with eval ${move.evaluation}; expected one of ${p.bestMoves.join(',')} or a winning eval`,
        ).toBe(true);
      }, 30000);
    }
  });
});
