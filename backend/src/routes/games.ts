import { Router, type Request, type Response } from 'express';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getDb, transaction } from '../db/index.js';
import { HttpError, asyncHandler } from '../middleware/error.js';
import {
  AI_DIFFICULTIES,
  AI_RATINGS,
  aiPlayerName,
  parseAiId,
  updateRatings,
  type Difficulty,
} from '../services/elo.js';
import { detectOpening } from '../services/analytics.js';
import {
  gameRowToGame,
  type GameRow,
  type PlayerRow,
} from '../types.js';

export const gamesRouter = Router();

const DifficultyEnum = z.enum(AI_DIFFICULTIES as [Difficulty, ...Difficulty[]]);

const CreateGameSchema = z.object({
  whiteId: z.string().min(1),
  blackId: z.string().min(1),
  result: z.enum(['1-0', '0-1', '1/2-1/2']),
  pgn: z.string().default(''),
  fenHistory: z.array(z.string()).default([]),
  movesCount: z.number().int().nonnegative().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  aiDifficulty: DifficultyEnum.optional(),
  // Optional: per-move timing in seconds, parallel to fenHistory transitions.
  moveTimesSec: z.array(z.number().nonnegative()).optional(),
});

/** Ensure a player row exists for the given id. Auto-creates AI rows on demand. */
function ensurePlayer(id: string): PlayerRow {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as
    | PlayerRow
    | undefined;
  if (existing) return existing;

  const aiDiff = parseAiId(id);
  if (!aiDiff) {
    throw new HttpError(404, `Player not found: ${id}`);
  }
  const row: PlayerRow = {
    id,
    name: aiPlayerName(aiDiff),
    rating: AI_RATINGS[aiDiff],
    is_ai: 1,
    difficulty: aiDiff,
    created_at: dayjs().toISOString(),
  };
  db.prepare(
    `INSERT INTO players (id, name, rating, is_ai, difficulty, created_at)
     VALUES (@id, @name, @rating, @is_ai, @difficulty, @created_at)`,
  ).run(row);
  return row;
}

gamesRouter.post(
  '/',
  asyncHandler((req: Request, res: Response) => {
    const body = CreateGameSchema.parse(req.body ?? {});
    const db = getDb();

    const white = ensurePlayer(body.whiteId);
    const black = ensurePlayer(body.blackId);

    // Infer aiDifficulty if not provided but one side is AI.
    let aiDifficulty: Difficulty | null = body.aiDifficulty ?? null;
    if (!aiDifficulty) {
      if (white.is_ai) aiDifficulty = white.difficulty as Difficulty;
      else if (black.is_ai) aiDifficulty = black.difficulty as Difficulty;
    }

    const fenHistory = body.fenHistory;
    const movesCount =
      body.movesCount ?? Math.max(0, fenHistory.length > 0 ? fenHistory.length - 1 : 0);

    // Compute durationSec if missing: sum moveTimesSec if provided, else 0.
    let durationSec = body.durationSec;
    if (durationSec === undefined) {
      durationSec = body.moveTimesSec
        ? Math.round(body.moveTimesSec.reduce((a, b) => a + b, 0))
        : 0;
    }

    const opening = detectOpening(body.pgn);

    const id = uuid();
    const createdAt = dayjs().toISOString();

    const row: GameRow = {
      id,
      white_id: body.whiteId,
      black_id: body.blackId,
      result: body.result,
      pgn: body.pgn,
      fen_history: JSON.stringify(fenHistory),
      moves_count: movesCount,
      duration_sec: durationSec,
      ai_difficulty: aiDifficulty,
      eco: opening?.eco ?? null,
      opening_name: opening?.name ?? null,
      created_at: createdAt,
    };

    // Update Elo (skip AI players: they keep fixed ratings).
    const next = updateRatings(white.rating, black.rating, body.result);
    const updatePlayer = db.prepare('UPDATE players SET rating = ? WHERE id = ?');

    transaction(() => {
      db.prepare(
        `INSERT INTO games
         (id, white_id, black_id, result, pgn, fen_history, moves_count,
          duration_sec, ai_difficulty, eco, opening_name, created_at)
         VALUES (@id, @white_id, @black_id, @result, @pgn, @fen_history, @moves_count,
                 @duration_sec, @ai_difficulty, @eco, @opening_name, @created_at)`,
      ).run(row);

      if (!white.is_ai) updatePlayer.run(next.whiteRating, white.id);
      if (!black.is_ai) updatePlayer.run(next.blackRating, black.id);

      // Persist optional per-move timing rows.
      if (body.moveTimesSec && body.moveTimesSec.length > 0) {
        const insertMove = db.prepare(
          `INSERT INTO moves (game_id, ply, uci, san, fen_after, time_ms)
           VALUES (?, ?, ?, ?, ?, ?)`,
        );
        body.moveTimesSec.forEach((sec, idx) => {
          insertMove.run(id, idx + 1, '', null, fenHistory[idx + 1] ?? null, Math.round(sec * 1000));
        });
      }
    });

    res.status(201).json(gameRowToGame(row));
  }),
);

gamesRouter.get(
  '/:id',
  asyncHandler((req: Request, res: Response) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id) as
      | GameRow
      | undefined;
    if (!row) throw new HttpError(404, 'Game not found');
    res.json(gameRowToGame(row));
  }),
);

const ListGamesQuery = z.object({
  player: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

gamesRouter.get(
  '/',
  asyncHandler((req: Request, res: Response) => {
    const q = ListGamesQuery.parse(req.query);
    const db = getDb();

    let rows: GameRow[];
    if (q.player) {
      rows = db
        .prepare(
          `SELECT * FROM games
           WHERE white_id = ? OR black_id = ?
           ORDER BY datetime(created_at) DESC
           LIMIT ?`,
        )
        .all(q.player, q.player, q.limit) as GameRow[];
    } else {
      rows = db
        .prepare('SELECT * FROM games ORDER BY datetime(created_at) DESC LIMIT ?')
        .all(q.limit) as GameRow[];
    }

    res.json(rows.map(gameRowToGame));
  }),
);
