import type {
  Difficulty,
  MoveResult,
  WorkerRequest,
  WorkerResponse,
} from '@/types/shared';

// Spawns the chess Web Worker and exposes a typed Promise-based API.
// Hides correlation-id plumbing from the rest of the app.

interface Pending {
  resolve: (value: WorkerResponse) => void;
  reject: (err: Error) => void;
}

export class EngineWorker {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  start(): void {
    if (this.worker) return;
    this.worker = new Worker(
      new URL('../workers/chess.worker.ts', import.meta.url),
      { type: 'module', name: 'chess-engine-worker' },
    );
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleError);
  }

  stop(): void {
    if (!this.worker) return;
    this.send({ id: this.nextId++, kind: 'stop' }).catch(() => {
      // ignore — we are tearing down
    });
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleError);
    this.worker.terminate();
    this.worker = null;
    for (const p of this.pending.values()) {
      p.reject(new Error('Worker terminated'));
    }
    this.pending.clear();
  }

  async init(): Promise<void> {
    this.start();
    await this.send({ id: this.nextId++, kind: 'init' });
  }

  async getBestMove(
    fen: string,
    difficulty: Difficulty,
  ): Promise<MoveResult> {
    this.start();
    const res = await this.send({
      id: this.nextId++,
      kind: 'bestMove',
      fen,
      difficulty,
    });
    if (res.kind !== 'bestMove') {
      throw new Error(`Unexpected worker response: ${res.kind}`);
    }
    return res.result;
  }

  async evaluatePosition(fen: string): Promise<number> {
    this.start();
    const res = await this.send({
      id: this.nextId++,
      kind: 'evaluate',
      fen,
    });
    if (res.kind !== 'evaluate') {
      throw new Error(`Unexpected worker response: ${res.kind}`);
    }
    return res.score;
  }

  private send(req: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not started'));
        return;
      }
      this.pending.set(req.id, { resolve, reject });
      this.worker.postMessage(req);
    });
  }

  private handleMessage = (ev: MessageEvent<WorkerResponse>): void => {
    const msg = ev.data;
    // Broadcast "ready" with id === -1 is informational, ignore.
    if (msg.id < 0) return;
    const pending = this.pending.get(msg.id);
    if (!pending) return;
    this.pending.delete(msg.id);
    if (msg.kind === 'error') {
      pending.reject(new Error(msg.message));
    } else {
      pending.resolve(msg);
    }
  };

  private handleError = (ev: ErrorEvent): void => {
    for (const p of this.pending.values()) {
      p.reject(new Error(ev.message || 'Worker error'));
    }
    this.pending.clear();
  };
}

// Singleton because we only ever want one engine.
export const engineWorker = new EngineWorker();
