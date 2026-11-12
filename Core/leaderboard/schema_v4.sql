-- Sporium v26: endgame žebříček (Výtrusné mapy, Šedá královna)
-- Spustit JEDNOU před nasazením workeru v26:
--   npx wrangler d1 execute sporium --remote --file schema_v4.sql
ALTER TABLE runs ADD COLUMN eg INTEGER NOT NULL DEFAULT 0;
ALTER TABLE runs ADD COLUMN queen INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS runs_eg ON runs (season, eg DESC, queen DESC, lvl DESC);
