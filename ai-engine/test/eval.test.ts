import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { evaluateWhitePerspective } from '../src/eval/evaluate.js';
import { createEngine } from '../src/index.js';

describe('evaluate', () => {
  it('starting position is approximately balanced (|cp| <= 50)', () => {
    const chess = new Chess();
    const score = evaluateWhitePerspective(chess);
    expect(Math.abs(score)).toBeLessThanOrEqual(50);
  });

  it('white up a queen is a clear win for white', () => {
    // White has an extra queen on d4.
    const chess = new Chess('rnbqkbnr/pppppppp/8/8/3Q4/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const score = evaluateWhitePerspective(chess);
    expect(score).toBeGreaterThan(500); // queen is ~900cp; with mobility, well above 500
  });

  it('black up a rook is a clear win for black', () => {
    // Standard start with an extra black rook on d5.
    const chess = new Chess('rnbqkbnr/pppppppp/8/3r4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const score = evaluateWhitePerspective(chess);
    expect(score).toBeLessThan(-300);
  });

  it('engine.evaluatePosition returns white-perspective cp', async () => {
    const engine = createEngine();
    await engine.init();
    // Black to move, down a queen.
    const fen = 'rnbqkbnr/pppppppp/8/8/3Q4/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1';
    const score = await engine.evaluatePosition(fen);
    expect(score).toBeGreaterThan(500);
  });

  it('checkmate is reported as a huge score', () => {
    // Fool's mate: white is checkmated.
    const chess = new Chess();
    chess.move('f3');
    chess.move('e5');
    chess.move('g4');
    chess.move('Qh4#');
    expect(chess.isCheckmate()).toBe(true);
    const score = evaluateWhitePerspective(chess);
    // White is mated → very negative from white's perspective.
    expect(score).toBeLessThan(-50000);
  });
});
