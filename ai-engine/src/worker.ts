/**
 * Web Worker entry for @chess-ai/engine.
 *
 * Protocol:
 *   Request:  { id: string, type: 'getBestMove', fen: string, difficulty: Difficulty }
 *             { id: string, type: 'evaluate',    fen: string }
 *             { id: string, type: 'stop' }
 *             { id: string, type: 'init' }
 *   Response: { id: string, ok: true,  result: MoveResult | number | null }
 *             { id: string, ok: false, error: string }
 *
 * The frontend may import this directly via `new Worker(new URL(...))`,
 * or it can import the engine module and run it on the main thread. Both work.
 *
 * No node:* imports — runs in the browser worker context.
 */

import { createEngine, type ChessEngine, type Difficulty, type MoveResult } from './index.js';

type WorkerRequest =
  | { id: string; type: 'init' }
  | { id: string; type: 'getBestMove'; fen: string; difficulty: Difficulty }
  | { id: string; type: 'evaluate'; fen: string }
  | { id: string; type: 'stop' };

type WorkerResponse =
  | { id: string; ok: true; result: MoveResult | number | null }
  | { id: string; ok: false; error: string };

// Worker-scope global — only defined when actually running as a Worker.
// Use a narrow internal `any`-shaped reference because lib.webworker.d.ts and
// lib.dom.d.ts give different types depending on tsconfig lib settings.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: any = typeof self !== 'undefined' ? self : undefined;

const engine: ChessEngine = createEngine();

async function handle(req: WorkerRequest): Promise<WorkerResponse> {
  try {
    switch (req.type) {
      case 'init': {
        await engine.init();
        return { id: req.id, ok: true, result: null };
      }
      case 'getBestMove': {
        const result = await engine.getBestMove(req.fen, req.difficulty);
        return { id: req.id, ok: true, result };
      }
      case 'evaluate': {
        const result = await engine.evaluatePosition(req.fen);
        return { id: req.id, ok: true, result };
      }
      case 'stop': {
        engine.stop();
        return { id: req.id, ok: true, result: null };
      }
      default: {
        // Exhaustive check
        const _exhaustive: never = req;
        void _exhaustive;
        return { id: (req as { id: string }).id, ok: false, error: 'unknown message type' };
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { id: req.id, ok: false, error: msg };
  }
}

if (ctx && typeof ctx.addEventListener === 'function') {
  ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
    const req = event.data;
    handle(req).then((resp) => {
      ctx.postMessage(resp);
    });
  });
}

// Also export so the frontend can import the engine directly without
// instantiating a Worker (useful for testing / SSR).
export { createEngine };
export type { ChessEngine, MoveResult, Difficulty };
