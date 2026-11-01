// Sporium leaderboard – Cloudflare Worker + D1 (binding: DB)
// POST /submit  {season,id,key,nick,cls,best,lvl,kills,playsec}
// GET  /top?season=1&cls=all&limit=50
// GET  /me?season=1&id=...   -> rank of one character
const CLASSES = ['blade','warden','myco','ranger','summoner','shifter'];
const NICK_RE = /^[\p{L}\p{N} _.\-]{2,16}$/u;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (req.method === 'GET' && url.pathname === '/top') {
        const season = +url.searchParams.get('season') || 1, cls = url.searchParams.get('cls') || 'all';
        const limit = Math.min(100, Math.max(1, +url.searchParams.get('limit') || 50));
        const q = cls !== 'all' && CLASSES.includes(cls)
          ? env.DB.prepare('SELECT id,nick,cls,best,lvl,kills,playsec FROM runs WHERE season=? AND cls=? ORDER BY best DESC,lvl DESC,playsec ASC LIMIT ?').bind(season, cls, limit)
          : env.DB.prepare('SELECT id,nick,cls,best,lvl,kills,playsec FROM runs WHERE season=? ORDER BY best DESC,lvl DESC,playsec ASC LIMIT ?').bind(season, limit);
        const { results } = await q.all();
        return json({ season, cls, rows: results.map(r => ({ ...r, id: r.id.slice(-6) })) });
      }
      if (req.method === 'GET' && url.pathname === '/me') {
        const season = +url.searchParams.get('season') || 1, id = url.searchParams.get('id') || '';
        const me = await env.DB.prepare('SELECT best,lvl,playsec FROM runs WHERE season=? AND id=?').bind(season, id).first();
        if (!me) return json({ rank: null });
        const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM runs WHERE season=? AND (best>? OR (best=? AND lvl>?) OR (best=? AND lvl=? AND playsec<?))').bind(season, me.best, me.best, me.lvl, me.best, me.lvl, me.playsec).first();
        return json({ rank: r.n + 1, best: me.best });
      }
      if (req.method === 'POST' && url.pathname === '/submit') {
        const b = await req.json();
        const nick = String(b.nick || '').trim().replace(/\s+/g, ' ');
        if (!int(b.season, 1, 999) || typeof b.id !== 'string' || b.id.length < 6 || b.id.length > 40) return json({ error: 'bad id' }, 400);
        if (typeof b.key !== 'string' || b.key.length < 16 || b.key.length > 80) return json({ error: 'bad key' }, 400);
        if (!NICK_RE.test(nick)) return json({ error: 'nick' }, 400);
        if (!CLASSES.includes(b.cls)) return json({ error: 'cls' }, 400);
        if (!int(b.best, 1, 6000) || !int(b.lvl, 1, 999) || !int(b.kills ?? 0, 0, 1e8) || !int(b.playsec ?? 0, 0, 1e8)) return json({ error: 'values' }, 400);
        // plausibility (client-side game – keeps out the obvious fakes)
        if (b.best > 8 + b.lvl * 2.5) return json({ error: 'implausible depth for level' }, 422);
        if (b.playsec < (b.best - 1) * 25) return json({ error: 'too fast' }, 422);
        if (b.kills < (b.best - 1) * 5) return json({ error: 'too few kills' }, 422);
        const kh = await sha(b.key), now = Date.now();
        // nick ownership
        const nl = nick.toLowerCase();
        const own = await env.DB.prepare('SELECT keyhash FROM nicks WHERE nick_l=?').bind(nl).first();
        if (own && own.keyhash !== kh) {
          // nick belongs to another key – allowed only if that key's character has the same id (never) → reject
          return json({ error: 'nick taken' }, 409);
        }
        const prev = await env.DB.prepare('SELECT keyhash,best,updated FROM runs WHERE season=? AND id=?').bind(b.season, b.id).first();
        if (prev && prev.keyhash !== kh) return json({ error: 'forbidden' }, 403);
        if (prev && now - prev.updated < 15000) return json({ ok: true, throttled: true });
        if (prev && prev.best - b.best > 0 && b.best < prev.best) { /* never lower the record */ }
        if (!own) await env.DB.prepare('INSERT OR IGNORE INTO nicks (nick_l,keyhash,created) VALUES (?,?,?)').bind(nl, kh, now).run();
        await env.DB.prepare(`INSERT INTO runs (season,id,keyhash,nick,cls,best,lvl,kills,playsec,updated) VALUES (?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(season,id) DO UPDATE SET nick=excluded.nick, cls=excluded.cls, best=MAX(runs.best,excluded.best), lvl=MAX(runs.lvl,excluded.lvl),
          kills=MAX(runs.kills,excluded.kills), playsec=CASE WHEN excluded.best>runs.best THEN excluded.playsec ELSE runs.playsec END, updated=excluded.updated`)
          .bind(b.season, b.id, kh, nick, b.cls, b.best, b.lvl, b.kills || 0, b.playsec || 0, now).run();
        return json({ ok: true });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) { return json({ error: 'server', msg: String(e.message || e) }, 500); }
  },
};
