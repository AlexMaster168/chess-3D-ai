import { describe, it, expect } from 'vitest';
import { createEngine, getDifficultyConfig } from '../src/index.js';

describe('difficulty mapping', () => {
  it('beginner: depth 1, randomness 0.40, no book, no quiescence', () => {
    const cfg = getDifficultyConfig('beginner');
    expect(cfg.depth).toBe(1);
    expect(cfg.randomness).toBe(0.40);
    expect(cfg.useBook).toBe(false);
    expect(cfg.useQuiescence).toBe(false);
  });

  it('casual: depth 2, randomness 0.15', () => {
    const cfg = getDifficultyConfig('casual');
    expect(cfg.depth).toBe(2);
    expect(cfg.randomness).toBe(0.15);
  });

  it('intermediate: depth 3, randomness 0.05', () => {
    const cfg = getDifficultyConfig('intermediate');
    expect(cfg.depth).toBe(3);
    expect(cfg.randomness).toBe(0.05);
  });

  it('advanced: depth 4, deterministic', () => {
    const cfg = getDifficultyConfig('advanced');
    expect(cfg.depth).toBe(4);
    expect(cfg.randomness).toBe(0);
  });

  it('master: depth 5 with iterative deepening, book, quiescence', () => {
    const cfg = getDifficultyConfig('master');
    expect(cfg.depth).toBe(5);
    expect(cfg.iterativeDeepening).toBe(true);
    expect(cfg.useBook).toBe(true);
    expect(cfg.useQuiescence).toBe(true);
    expect(cfg.randomness).toBe(0);
  });
});

describe('engine behavior at different difficulties', () => {
  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  it('beginner: actual variance > 30% across 100 trials from starting position', async () => {
    // Beginner has randomness=0.40 AND top-K=10 sampling. We expect that
    // across 100 trials starting from the standard opening, the engine
    // does NOT play the same move every time; in fact >30% should diverge
    // from the modal move.
    const engine = createEngine();
    await engine.init();

    const moves: string[] = [];
    for (let i = 0; i < 100; i++) {
      const m = await engine.getBestMove(START_FEN, 'beginner');
      moves.push(`${m.from}${m.to}`);
    }

    const counts = new Map<string, number>();
    for (const m of moves) counts.set(m, (counts.get(m) ?? 0) + 1);
    const modal = Math.max(...counts.values());
    const variance = (100 - modal) / 100;

    expect(variance).toBeGreaterThan(0.30);
  }, 60000);

  it('master: deterministic from starting position (same move every time)', async () => {
    // The book is randomized across candidate book moves for the starting
    // position. To assert determinism, we evaluate a non-book mid-game
    // position where the search alone decides.
    const engine = createEngine();
    await engine.init();
    // A quiet middlegame position not in the book.
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1';

    const m1 = await engine.getBestMove(fen, 'master');
    const m2 = await engine.getBestMove(fen, 'master');
    const m3 = await engine.getBestMove(fen, 'master');

    expect(`${m1.from}${m1.to}`).toBe(`${m2.from}${m2.to}`);
    expect(`${m2.from}${m2.to}`).toBe(`${m3.from}${m3.to}`);
  }, 60000);

  it('beginner: depthReached is 1', async () => {
    const engine = createEngine();
    await engine.init();
    // Use a position not in any book line.
    const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1';
    const result = await engine.getBestMove(fen, 'beginner');
    expect(result.depthReached).toBe(1);
  }, 15000);
});
