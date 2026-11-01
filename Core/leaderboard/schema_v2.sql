-- Sporium v2: denní hlubina, hroby padlých, Hnilobná studna
CREATE TABLE IF NOT EXISTS daily (
  day      TEXT    NOT NULL,          -- YYYY-MM-DD (UTC)
  keyhash  TEXT    NOT NULL,
  id       TEXT    NOT NULL,
  nick     TEXT    NOT NULL,
  cls      TEXT    NOT NULL,
  best     INTEGER NOT NULL,
  lvl      INTEGER NOT NULL,
  kills    INTEGER NOT NULL DEFAULT 0,
  playsec  INTEGER NOT NULL DEFAULT 0,
  dead     INTEGER NOT NULL DEFAULT 0,
  updated  INTEGER NOT NULL,
  PRIMARY KEY (day, keyhash)
);
CREATE INDEX IF NOT EXISTS daily_rank ON daily (day, best DESC, lvl DESC, playsec ASC);
CREATE TABLE IF NOT EXISTS graves (
  gid      INTEGER PRIMARY KEY AUTOINCREMENT,
  season   INTEGER NOT NULL,
  day      TEXT    NOT NULL DEFAULT '', -- '' = normální hra, jinak den denní hlubiny
  depth    INTEGER NOT NULL,
  nick     TEXT    NOT NULL,
  cls      TEXT    NOT NULL,
  lvl      INTEGER NOT NULL,
  killer   TEXT    NOT NULL,
  msg      INTEGER NOT NULL DEFAULT -1,
  keyhash  TEXT    NOT NULL,
  created  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS graves_find ON graves (season, day, depth, created DESC);
CREATE TABLE IF NOT EXISTS well (
  wid      INTEGER PRIMARY KEY AUTOINCREMENT,
  season   INTEGER NOT NULL,
  tier     INTEGER NOT NULL,           -- hodnotová třída předmětu
  item     TEXT    NOT NULL,           -- JSON
  nick     TEXT    NOT NULL,
  keyhash  TEXT    NOT NULL,
  created  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS well_pick ON well (season, tier);
CREATE TABLE IF NOT EXISTS limits (
  keyhash  TEXT NOT NULL,
  kind     TEXT NOT NULL,
  day      TEXT NOT NULL,
  n        INTEGER NOT NULL,
  last     INTEGER NOT NULL,
  PRIMARY KEY (keyhash, kind, day)
);
