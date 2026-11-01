-- Sporium leaderboard (Cloudflare D1)
CREATE TABLE IF NOT EXISTS runs (
  season   INTEGER NOT NULL,
  id       TEXT    NOT NULL,          -- character id from the game save
  keyhash  TEXT    NOT NULL,          -- sha256 of the character's secret key
  nick     TEXT    NOT NULL,
  cls      TEXT    NOT NULL,
  best     INTEGER NOT NULL,          -- deepest floor reached
  lvl      INTEGER NOT NULL,
  kills    INTEGER NOT NULL DEFAULT 0,
  playsec  INTEGER NOT NULL DEFAULT 0,
  updated  INTEGER NOT NULL,
  PRIMARY KEY (season, id)
);
CREATE INDEX IF NOT EXISTS runs_rank ON runs (season, best DESC, lvl DESC, playsec ASC);
CREATE TABLE IF NOT EXISTS nicks (
  nick_l   TEXT PRIMARY KEY,          -- lowercased nick
  keyhash  TEXT NOT NULL,             -- owner (first character that claimed it)
  created  INTEGER NOT NULL
);
