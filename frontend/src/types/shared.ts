// Mirrors types from SHARED_CONTRACTS.md.
// These are duplicated locally so the frontend can compile while the sibling
// packages (`@chess-ai/design`, `@chess-ai/engine`) and backend are still
// being built in parallel. When those packages publish their types, we can
// re-export from them — same shapes so swap is a no-op.

export type Difficulty =
  | 'beginner'
  | 'casual'
  | 'intermediate'
  | 'advanced'
  | 'master';

export type BoardTheme = 'classic' | 'neon' | 'glass';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type Color = 'w' | 'b';
export type GameResult = '1-0' | '0-1' | '1/2-1/2';

export interface StructuredMove {
  from: string;
  to: string;
  promotion?: string;
}

// --- Backend types ---
export interface Player {
  id: string;
  name: string;
  rating: number;
  createdAt: string;
}

export interface Game {
  id: string;
  whiteId: string;
  blackId: string;
  result: GameResult;
  pgn: string;
  fenHistory: string[];
  movesCount: number;
  durationSec: number;
  aiDifficulty?: Difficulty;
  createdAt: string;
}

export type CreateGameDto = Omit<Game, 'id' | 'createdAt'>;

export interface PlayerAnalytics {
  playerId: string;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  avgMoveTimeSec: number;
  openings: { eco: string; name: string; count: number }[];
  recentGames: Game[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
}

export interface GlobalAnalytics {
  totalGames: number;
  totalPlayers: number;
  avgGameLengthSec: number;
  aiWinRateByDifficulty: Record<string, number>;
}

// --- Engine types ---
export interface MoveResult {
  from: string;
  to: string;
  promotion?: string;
  evaluation: number;
  depthReached: number;
  nodesSearched: number;
}

// --- Design types ---
export interface ChessBoard3D {
  mount(container: HTMLElement): Promise<void>;
  unmount(): void;
  setBoardState(fen: string, animated?: boolean): void;
  setAnimationSpeed(speed: AnimationSpeed): void;
  highlightSquares(
    squares: string[],
    kind?: 'legal' | 'last-move' | 'check',
  ): void;
  setTheme(theme: BoardTheme): void;
  on(event: 'squareClick', cb: (square: string) => void): void;
  on(event: 'move', cb: (m: StructuredMove) => void): void;
  on(event: 'animationEnd', cb: (kind: string) => void): void;
  playEffect(kind: 'capture' | 'check' | 'checkmate' | 'castle'): void;
}

// --- Worker protocol (frontend-internal) ---
export type WorkerRequest =
  | { id: number; kind: 'init' }
  | { id: number; kind: 'bestMove'; fen: string; difficulty: Difficulty }
  | { id: number; kind: 'evaluate'; fen: string }
  | { id: number; kind: 'stop' };

export type WorkerResponse =
  | { id: number; kind: 'ready' }
  | { id: number; kind: 'bestMove'; result: MoveResult }
  | { id: number; kind: 'evaluate'; score: number }
  | { id: number; kind: 'error'; message: string };
