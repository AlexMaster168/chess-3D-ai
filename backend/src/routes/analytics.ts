import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { HttpError, asyncHandler } from '../middleware/error.js';
import { AI_DIFFICULTIES } from '../services/elo.js';
import {
  gameRowToGame,
  type GameRow,
  type GlobalAnalytics,
  type LeaderboardEntry,
  type PlayerAnalytics,
  type PlayerRow,
} from '../types.js';

export const analyticsRouter = Router();

analyticsRouter.get(
  '/player/:id',
  asyncHandler((req: Request, res: Response) => {
    const db = getDb();
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id) as
      | PlayerRow
      | undefined;
    if (!player) throw new HttpError(404, 'Player not found');

    const id = player.id;

    const wins = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM games
           WHERE (white_id = ? AND result = '1-0')
              OR (black_id = ? AND result = '0-1')`,
        )
        .get(id, id) as { c: number }
    ).c;
    const losses = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM games
           WHERE (white_id = ? AND result = '0-1')
              OR (black_id = ? AND result = '1-0')`,
        )
        .get(id, id) as { c: number }
    ).c;
    const draws = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM games
           WHERE (white_id = ? OR black_id = ?) AND result = '1/2-1/2'`,
        )
        .get(id, id) as { c: number }
    ).c;

    // Avg move time: prefer the moves table if populated; otherwise fall back
    // to game.duration_sec / moves_count averaged over the player's games.
    const movesAvg = db
      .prepare(
        `SELECT AVG(m.time_ms) AS avg_ms
         FROM moves m
         INNER JOIN games g ON g.id = m.game_id
         WHERE g.white_id = ? OR g.black_id = ?`,
      )
      .get(id, id) as { avg_ms: number | null };

    let avgMoveTimeSec = 0;
    if (movesAvg.avg_ms && movesAvg.avg_ms > 0) {
      avgMoveTimeSec = +(movesAvg.avg_ms / 1000).toFixed(2);
    } else {
      const fallback = db
        .prepare(
          `SELECT AVG(CASE WHEN moves_count > 0
                           THEN CAST(duration_sec AS REAL) / moves_count
                           ELSE 0 END) AS avg_s
           FROM games
           WHERE white_id = ? OR black_id = ?`,
        )
        .get(id, id) as { avg_s: number | null };
      avgMoveTimeSec = fallback.avg_s ? +fallback.avg_s.toFixed(2) : 0;
    }

    const openings = db
      .prepare(
        `SELECT eco, opening_name AS name, COUNT(*) AS count
         FROM games
         WHERE (white_id = ? OR black_id = ?) AND eco IS NOT NULL
         GROUP BY eco, opening_name
         ORDER BY count DESC
         LIMIT 10`,
      )
      .all(id, id) as { eco: string; name: string; count: number }[];

    const recentRows = db
      .prepare(
        `SELECT * FROM games
         WHERE white_id = ? OR black_id = ?
         ORDER BY datetime(created_at) DESC
         LIMIT 10`,
      )
      .all(id, id) as GameRow[];

    const out: PlayerAnalytics = {
      playerId: id,
      wins,
      losses,
      draws,
      rating: player.rating,
      avgMoveTimeSec,
      openings,
      recentGames: recentRows.map(gameRowToGame),
    };
    res.json(out);
  }),
);

const LeaderboardQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

analyticsRouter.get(
  '/leaderboard',
  asyncHandler((req: Request, res: Response) => {
    const q = LeaderboardQuery.parse(req.query);
    const db = getDb();

    const rows = db
      .prepare(
        `SELECT
           p.id AS playerId,
           p.name AS name,
           p.rating AS rating,
           (SELECT COUNT(*) FROM games g
              WHERE (g.white_id = p.id AND g.result = '1-0')
                 OR (g.black_id = p.id AND g.result = '0-1')) AS wins,
           (SELECT COUNT(*) FROM games g
              WHERE (g.white_id = p.id AND g.result = '0-1')
                 OR (g.black_id = p.id AND g.result = '1-0')) AS losses
         FROM players p
         WHERE p.is_ai = 0
         ORDER BY p.rating DESC, p.name ASC
         LIMIT ?`,
      )
      .all(q.limit) as LeaderboardEntry[];

    res.json(rows);
  }),
);

analyticsRouter.get(
  '/global',
  asyncHandler((_req: Request, res: Response) => {
    const db = getDb();

    const totalGames = (
      db.prepare('SELECT COUNT(*) AS c FROM games').get() as { c: number }
    ).c;
    const totalPlayers = (
      db.prepare('SELECT COUNT(*) AS c FROM players WHERE is_ai = 0').get() as { c: number }
    ).c;
    const avgLen = db.prepare('SELECT AVG(duration_sec) AS a FROM games').get() as {
      a: number | null;
    };
    const avgGameLengthSec = avgLen.a ? +avgLen.a.toFixed(2) : 0;

    // AI win rate by difficulty: for each game where one side is AI, count
    // wins for that AI side / total games at that difficulty.
    const aiRows = db
      .prepare(
        `SELECT
           g.ai_difficulty AS diff,
           SUM(CASE
                 WHEN pw.is_ai = 1 AND g.result = '1-0' THEN 1
                 WHEN pb.is_ai = 1 AND g.result = '0-1' THEN 1
                 ELSE 0
               END) AS ai_wins,
           COUNT(*) AS total
         FROM games g
         INNER JOIN players pw ON pw.id = g.white_id
         INNER JOIN players pb ON pb.id = g.black_id
         WHERE g.ai_difficulty IS NOT NULL
           AND (pw.is_ai = 1 OR pb.is_ai = 1)
         GROUP BY g.ai_difficulty`,
      )
      .all() as { diff: string; ai_wins: number; total: number }[];

    const aiWinRateByDifficulty: Record<string, number> = {};
    for (const d of AI_DIFFICULTIES) aiWinRateByDifficulty[d] = 0;
    for (const r of aiRows) {
      if (r.total > 0) {
        aiWinRateByDifficulty[r.diff] = +(r.ai_wins / r.total).toFixed(4);
      }
    }

    const out: GlobalAnalytics = {
      totalGames,
      totalPlayers,
      avgGameLengthSec,
      aiWinRateByDifficulty,
    };
    res.json(out);
  }),
);
