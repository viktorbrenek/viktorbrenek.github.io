-- Sporium v3: cloudová záloha savu (kód pro obnovu)
CREATE TABLE IF NOT EXISTS backups (
  keyhash  TEXT    PRIMARY KEY,
  code     TEXT    NOT NULL UNIQUE,
  data     TEXT    NOT NULL,          -- gzip+base64 JSON celého lokálního savu
  updated  INTEGER NOT NULL
);
