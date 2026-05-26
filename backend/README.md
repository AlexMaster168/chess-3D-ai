# @chess-ai/backend

Node.js + Express + better-sqlite3 REST API for the Chess AI web app.
Stores players, games, and serves analytics. Implements section 2 of
`../SHARED_CONTRACTS.md` exactly.

## Run

```bash
npm install
cp .env.example .env
npm run dev      # tsx watch on src/index.ts
npm test         # vitest
npm run build    # tsc
npm start        # node dist/index.js
```

## Environment

| Var      | Default            | Purpose                          |
|----------|--------------------|----------------------------------|
| `PORT`   | `4000`             | HTTP port                        |
| `DB_PATH`| `./data/chess.db`  | SQLite file (auto-created + WAL) |

CORS is open for `http://localhost:5173` (Vite dev) and `http://localhost:4173`
(Vite preview).

## Routes

Base URL: `http://localhost:4000/api`

| Method | Path                          | Body / Query              | Returns               |
|--------|-------------------------------|---------------------------|-----------------------|
| POST   | `/players`                    | `{ name? }`               | `Player`              |
| GET    | `/players/:id`                | -                         | `Player`              |
| POST   | `/games`                      | `CreateGameDto`           | `Game`                |
| GET    | `/games/:id`                  | -                         | `Game`                |
| GET    | `/games`                      | `?player=&limit=`         | `Game[]`              |
| GET    | `/analytics/player/:id`       | -                         | `PlayerAnalytics`     |
| GET    | `/analytics/leaderboard`      | `?limit=20`               | `LeaderboardEntry[]`  |
| GET    | `/analytics/global`           | -                         | `GlobalAnalytics`     |
| GET    | `/health`                     | -                         | `{ ok: true }`        |

Response shapes match `SHARED_CONTRACTS.md` section 2. All request bodies are
validated with `zod`; validation failures return `400 { error, issues }`.

### AI player auto-provisioning

`POST /games` accepts AI identifiers of the form `ai:<difficulty>` for
`whiteId` / `blackId`. The server creates the corresponding player row on
demand with a fixed rating and never updates it:

| id                | rating |
|-------------------|--------|
| `ai:beginner`     | 800    |
| `ai:casual`       | 1100   |
| `ai:intermediate` | 1500   |
| `ai:advanced`     | 1800   |
| `ai:master`       | 2100   |

`aiDifficulty` is auto-inferred from the AI side when not supplied.

### Elo

Standard Elo with K = 32. Only non-AI players have their rating updated.
New players start at 1200.

## curl examples

```bash
# Create a player
curl -X POST http://localhost:4000/api/players \
  -H 'content-type: application/json' \
  -d '{"name":"Alice"}'

# Fetch a player
curl http://localhost:4000/api/players/<player-id>

# Create a game (Alice vs AI beginner, Alice wins)
curl -X POST http://localhost:4000/api/games \
  -H 'content-type: application/json' \
  -d '{
    "whiteId":"<alice-id>",
    "blackId":"ai:beginner",
    "result":"1-0",
    "pgn":"1. e4 e5 2. Nf3 Nc6 3. Bb5",
    "fenHistory":["fen1","fen2","fen3"],
    "movesCount":5,
    "durationSec":120
  }'

# Fetch a game
curl http://localhost:4000/api/games/<game-id>

# List games for a player
curl 'http://localhost:4000/api/games?player=<alice-id>&limit=20'

# Player analytics
curl http://localhost:4000/api/analytics/player/<alice-id>

# Leaderboard
curl 'http://localhost:4000/api/analytics/leaderboard?limit=20'

# Global analytics
curl http://localhost:4000/api/analytics/global
```

## Schema diagram (ASCII)

```
+-----------------------+         +----------------------------+
|       players         |         |           games            |
+-----------------------+         +----------------------------+
| id          TEXT PK   |<--+--+--| id            TEXT PK      |
| name        TEXT      |   |  |  | white_id      TEXT  FK ----+--> players.id
| rating      INTEGER   |   |  |  | black_id      TEXT  FK ----+--> players.id
| is_ai       INTEGER   |   |  |  | result        TEXT         |
| difficulty  TEXT NULL |   |  |  | pgn           TEXT         |
| created_at  TEXT      |   |  |  | fen_history   TEXT (JSON)  |
+-----------------------+   |  |  | moves_count   INTEGER      |
                            |  |  | duration_sec  INTEGER      |
                            |  |  | ai_difficulty TEXT NULL    |
                            |  |  | eco           TEXT NULL    |
                            |  |  | opening_name  TEXT NULL    |
                            |  |  | created_at    TEXT         |
                            |  |  +----------------------------+
                            |  |               |
                            |  |               | 1
                            |  |               |
                            |  |               * (optional)
                            |  |  +----------------------------+
                            |  |  |          moves             |
                            |  |  +----------------------------+
                            |  +--| game_id   TEXT  FK PK part |
                            |     | ply       INTEGER PK part  |
                            |     | uci       TEXT             |
                            |     | san       TEXT NULL        |
                            |     | fen_after TEXT NULL        |
                            |     | time_ms   INTEGER          |
                            |     +----------------------------+
```

## Project layout

```
backend/
  src/
    index.ts             # boot: env, db, app, listen
    app.ts               # express app factory (used by tests too)
    types.ts             # contract DTOs + row mappers
    db/
      index.ts           # better-sqlite3 init + schema bootstrap
      schema.sql         # idempotent CREATE TABLE IF NOT EXISTS
    routes/
      players.ts         # POST /players, GET /players/:id
      games.ts           # POST /games, GET /games/:id, GET /games
      analytics.ts       # /analytics/{player/:id, leaderboard, global}
    services/
      elo.ts             # K=32 Elo + AI rating table
      analytics.ts       # opening detection from PGN prefix
    data/
      openings.json      # ~30 ECO opening prefixes
    middleware/
      error.ts           # zod-aware central error handler
  test/
    api.test.ts          # vitest + supertest integration tests
  data/                  # SQLite file lives here at runtime
```

## Error contract

All errors are returned as JSON:

```json
{ "error": "message" }
```

Zod validation errors additionally include an `issues` array:

```json
{
  "error": "Validation failed",
  "issues": [{ "path": "whiteId", "message": "Required" }]
}
```
