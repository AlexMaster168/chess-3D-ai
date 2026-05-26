import express, { type Express } from 'express';
import cors from 'cors';
import { playersRouter } from './routes/players.js';
import { gamesRouter } from './routes/games.js';
import { analyticsRouter } from './routes/analytics.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:4173'],
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/players', playersRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/analytics', analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
