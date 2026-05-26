import type { Difficulty, GameResult } from './services/elo.js';

export type { Difficulty, GameResult };

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

// Internal DB row shapes (snake_case).
export interface PlayerRow {
  id: string;
  name: string;
  rating: number;
  is_ai: number;
  difficulty: string | null;
  created_at: string;
}

export interface GameRow {
  id: string;
  white_id: string;
  black_id: string;
  result: GameResult;
  pgn: string;
  fen_history: string; // JSON
  moves_count: number;
  duration_sec: number;
  ai_difficulty: string | null;
  eco: string | null;
  opening_name: string | null;
  created_at: string;
}

export function playerRowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    rating: row.rating,
    createdAt: row.created_at,
  };
}

export function gameRowToGame(row: GameRow): Game {
  const game: Game = {
    id: row.id,
    whiteId: row.white_id,
    blackId: row.black_id,
    result: row.result,
    pgn: row.pgn,
    fenHistory: JSON.parse(row.fen_history) as string[],
    movesCount: row.moves_count,
    durationSec: row.duration_sec,
    createdAt: row.created_at,
  };
  if (row.ai_difficulty) game.aiDifficulty = row.ai_difficulty as Difficulty;
  return game;
}
