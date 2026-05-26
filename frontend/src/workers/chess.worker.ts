/// <reference lib="webworker" />
// Web Worker wrapping @chess-ai/engine. While the engine package is not
// available we fall back to a chess.js random-legal-move stub. The wire
// protocol matches WorkerRequest/WorkerResponse in @/types/shared so the
// real engine can be dropped in later with zero changes on the main thread.

import { Chess } from 'chess.js';
import type {
  Difficulty,
  MoveResult,
  WorkerRequest,
  WorkerResponse,
} from '../types/shared';

interface EngineLike {
  init(): Promise<void>;
  getBestMove(fen: string, difficulty: Difficulty): Promise<MoveResult>;
  evaluatePosition(fen: string): Promise<number>;
  stop(): void;
}

let engine: EngineLike | null = null;

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

async function loadEngine(): Promise<EngineLike> {
  try {
    // Dynamic import — only resolves once the sibling package is built.
    const mod = (await import('@chess-ai/engine')) as {
      createEngine?: () => EngineLike;
    };
    if (!mod.createEngine) throw new Error('createEngine missing');
    const real = mod.createEngine();
    await real.init();
    return real;
  } catch {
    return createStubEngine();
  }
}

function createStubEngine(): EngineLike {
  return {
    async init(): Promise<void> {
      // no-op
    },
    async getBestMove(
      fen: string,
      difficulty: Difficulty,
    ): Promise<MoveResult> {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length === 0) {
        throw new Error('No legal moves available');
      }
      // Difficulty influences a fake "evaluation" but logic is uniform random.
      const idx = Math.floor(Math.random() * moves.length);
      const m = moves[idx];
      const depthByDifficulty: Record<Difficulty, number> = {
        beginner: 1,
        casual: 2,
        intermediate: 3,
        advanced: 4,
        master: 5,
      };
      return {
        from: m.from,
        to: m.to,
        promotion: m.promotion,
        evaluation: 0,
        depthReached: depthByDifficulty[difficulty],
        nodesSearched: moves.length,
      };
    },
    async evaluatePosition(fen: string): Promise<number> {
      // Naive material-only eval as a placeholder.
      const chess = new Chess(fen);
      const values: Record<string, number> = {
        p: 1,
        n: 3,
        b: 3,
        r: 5,
        q: 9,
        k: 0,
      };
      let score = 0;
      for (const row of chess.board()) {
        for (const sq of row) {
          if (!sq) continue;
          const v = values[sq.type] ?? 0;
          score += sq.color === 'w' ? v : -v;
        }
      }
      return score;
    },
    stop(): void {
      // no-op
    },
  };
}

async function ensureEngine(): Promise<EngineLike> {
  if (!engine) engine = await loadEngine();
  return engine;
}

ctx.addEventListener('message', async (ev: MessageEvent<WorkerRequest>) => {
  const msg = ev.data;
  try {
    switch (msg.kind) {
      case 'init': {
        await ensureEngine();
        const res: WorkerResponse = { id: msg.id, kind: 'ready' };
        ctx.postMessage(res);
        break;
      }
      case 'bestMove': {
        const eng = await ensureEngine();
        const result = await eng.getBestMove(msg.fen, msg.difficulty);
        const res: WorkerResponse = {
          id: msg.id,
          kind: 'bestMove',
          result,
        };
        ctx.postMessage(res);
        break;
      }
      case 'evaluate': {
        const eng = await ensureEngine();
        const score = await eng.evaluatePosition(msg.fen);
        const res: WorkerResponse = { id: msg.id, kind: 'evaluate', score };
        ctx.postMessage(res);
        break;
      }
      case 'stop': {
        engine?.stop();
        break;
      }
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown worker error';
    const res: WorkerResponse = { id: msg.id, kind: 'error', message };
    ctx.postMessage(res);
  }
});

// Informational broadcast that the worker module loaded. id < 0 is
// filtered by the main thread's correlator.
ctx.postMessage({ id: -1, kind: 'ready' } satisfies WorkerResponse);
