import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { closeDb, initDb } from '../src/db/index.js';

let tmpDir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'chess-ai-test-'));
  initDb(join(tmpDir, 'test.db'));
  app = createApp();
});

afterAll(() => {
  closeDb();
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('Players', () => {
  it('creates a player with default name and rating 1200', async () => {
    const res = await request(app).post('/api/players').send({});
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Anonymous', rating: 1200 });
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('creates a player with a given name', async () => {
    const res = await request(app).post('/api/players').send({ name: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Alice');
  });

  it('fetches a player by id', async () => {
    const created = await request(app).post('/api/players').send({ name: 'Bob' });
    const id = created.body.id;
    const fetched = await request(app).get(`/api/players/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(id);
    expect(fetched.body.name).toBe('Bob');
  });

  it('returns 404 for unknown player', async () => {
    const res = await request(app).get('/api/players/no-such-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });
});

describe('Games', () => {
  it('creates a game between two human players and updates Elo', async () => {
    const w = (await request(app).post('/api/players').send({ name: 'White' })).body;
    const b = (await request(app).post('/api/players').send({ name: 'Black' })).body;

    const res = await request(app).post('/api/games').send({
      whiteId: w.id,
      blackId: b.id,
      result: '1-0',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
      fenHistory: ['fen1', 'fen2', 'fen3'],
      movesCount: 5,
      durationSec: 120,
    });

    expect(res.status).toBe(201);
    expect(res.body.whiteId).toBe(w.id);
    expect(res.body.result).toBe('1-0');
    expect(res.body.movesCount).toBe(5);
    expect(res.body.durationSec).toBe(120);
    expect(Array.isArray(res.body.fenHistory)).toBe(true);

    const wAfter = (await request(app).get(`/api/players/${w.id}`)).body;
    const bAfter = (await request(app).get(`/api/players/${b.id}`)).body;
    expect(wAfter.rating).toBeGreaterThan(1200);
    expect(bAfter.rating).toBeLessThan(1200);
  });

  it('auto-creates an AI player and sets aiDifficulty', async () => {
    const human = (await request(app).post('/api/players').send({ name: 'Human' })).body;

    const res = await request(app).post('/api/games').send({
      whiteId: human.id,
      blackId: 'ai:beginner',
      result: '1-0',
      pgn: '1. e4 c5',
      fenHistory: ['fen1', 'fen2'],
    });
    expect(res.status).toBe(201);
    expect(res.body.aiDifficulty).toBe('beginner');

    const ai = (await request(app).get('/api/players/ai:beginner')).body;
    expect(ai.rating).toBe(800);
    expect(ai.name).toMatch(/AI/i);
  });

  it('lists games filtered by player', async () => {
    const p = (await request(app).post('/api/players').send({ name: 'Filter' })).body;
    await request(app).post('/api/games').send({
      whiteId: p.id,
      blackId: 'ai:casual',
      result: '0-1',
      pgn: '1. e4 e5',
      fenHistory: ['a', 'b'],
    });
    const list = await request(app).get(`/api/games?player=${p.id}&limit=5`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThan(0);
    for (const g of list.body) {
      expect(g.whiteId === p.id || g.blackId === p.id).toBe(true);
    }
  });

  it('computes durationSec from moveTimesSec when omitted', async () => {
    const w = (await request(app).post('/api/players').send({ name: 'TimerW' })).body;
    const b = (await request(app).post('/api/players').send({ name: 'TimerB' })).body;
    const res = await request(app).post('/api/games').send({
      whiteId: w.id,
      blackId: b.id,
      result: '1/2-1/2',
      pgn: '1. e4 e5',
      fenHistory: ['a', 'b', 'c'],
      moveTimesSec: [1.5, 2.5, 4],
    });
    expect(res.status).toBe(201);
    expect(res.body.durationSec).toBe(8);
  });
});

describe('Analytics', () => {
  it('returns player analytics', async () => {
    const p = (await request(app).post('/api/players').send({ name: 'AnalyzeMe' })).body;
    await request(app).post('/api/games').send({
      whiteId: p.id,
      blackId: 'ai:intermediate',
      result: '1-0',
      pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5',
      fenHistory: ['a', 'b', 'c', 'd', 'e', 'f'],
      movesCount: 5,
      durationSec: 60,
    });
    const res = await request(app).get(`/api/analytics/player/${p.id}`);
    expect(res.status).toBe(200);
    expect(res.body.playerId).toBe(p.id);
    expect(res.body.wins).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.openings)).toBe(true);
    expect(Array.isArray(res.body.recentGames)).toBe(true);
  });

  it('returns a leaderboard ordered by rating desc, humans only', async () => {
    const res = await request(app).get('/api/analytics/leaderboard?limit=20');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].rating).toBeGreaterThanOrEqual(res.body[i].rating);
    }
    // No AI rows (ai:* ids) should be present.
    for (const row of res.body) {
      expect(row.playerId.startsWith('ai:')).toBe(false);
    }
  });

  it('returns global analytics with aiWinRateByDifficulty', async () => {
    const res = await request(app).get('/api/analytics/global');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalGames).toBe('number');
    expect(typeof res.body.totalPlayers).toBe('number');
    expect(typeof res.body.avgGameLengthSec).toBe('number');
    expect(res.body.aiWinRateByDifficulty).toBeTypeOf('object');
    for (const k of ['beginner', 'casual', 'intermediate', 'advanced', 'master']) {
      expect(k in res.body.aiWinRateByDifficulty).toBe(true);
    }
  });
});
