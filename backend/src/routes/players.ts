import { Router, type Request, type Response } from 'express';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { HttpError, asyncHandler } from '../middleware/error.js';
import { playerRowToPlayer, type PlayerRow } from '../types.js';

export const playersRouter = Router();

const CreatePlayerSchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
});

playersRouter.post(
  '/',
  asyncHandler((req: Request, res: Response) => {
    const body = CreatePlayerSchema.parse(req.body ?? {});
    const db = getDb();

    const player: PlayerRow = {
      id: uuid(),
      name: body.name && body.name.length > 0 ? body.name : 'Anonymous',
      rating: 1200,
      is_ai: 0,
      difficulty: null,
      created_at: dayjs().toISOString(),
    };

    db.prepare(
      `INSERT INTO players (id, name, rating, is_ai, difficulty, created_at)
       VALUES (@id, @name, @rating, @is_ai, @difficulty, @created_at)`,
    ).run(player);

    res.status(201).json(playerRowToPlayer(player));
  }),
);

playersRouter.get(
  '/:id',
  asyncHandler((req: Request, res: Response) => {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM players WHERE id = ?')
      .get(req.params.id) as PlayerRow | undefined;
    if (!row) throw new HttpError(404, 'Player not found');
    res.json(playerRowToPlayer(row));
  }),
);
