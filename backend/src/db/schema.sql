-- Chess AI backend schema. Idempotent: safe to run on every boot.

CREATE TABLE IF NOT EXISTS players (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 1200,
  is_ai       INTEGER NOT NULL DEFAULT 0,
  difficulty  TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_rating ON players(rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_is_ai  ON players(is_ai);

CREATE TABLE IF NOT EXISTS games (
  id             TEXT PRIMARY KEY,
  white_id       TEXT NOT NULL,
  black_id       TEXT NOT NULL,
  result         TEXT NOT NULL CHECK (result IN ('1-0','0-1','1/2-1/2')),
  pgn            TEXT NOT NULL DEFAULT '',
  fen_history    TEXT NOT NULL DEFAULT '[]', -- JSON array of FEN strings
  moves_count    INTEGER NOT NULL DEFAULT 0,
  duration_sec   INTEGER NOT NULL DEFAULT 0,
  ai_difficulty  TEXT,
  eco            TEXT,
  opening_name   TEXT,
  created_at     TEXT NOT NULL,
  FOREIGN KEY (white_id) REFERENCES players(id),
  FOREIGN KEY (black_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_games_white     ON games(white_id);
CREATE INDEX IF NOT EXISTS idx_games_black     ON games(black_id);
CREATE INDEX IF NOT EXISTS idx_games_created   ON games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_ai_diff   ON games(ai_difficulty);

-- Optional per-move detail (useful for avg move time + future replays).
CREATE TABLE IF NOT EXISTS moves (
  game_id     TEXT NOT NULL,
  ply         INTEGER NOT NULL,
  uci         TEXT NOT NULL,
  san         TEXT,
  fen_after   TEXT,
  time_ms     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, ply),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id);
