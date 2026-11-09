// Sporium online – Cloudflare Worker + D1 (binding: DB)
// Žebříček sezóny, denní hlubina, hroby padlých, Hnilobná studna.
// Herní data se importují přímo ze hry, takže validace předmětů vždy sedí s aktuální verzí.
import { BASES, AFFIXES, UNIQUES, SETS, SUPPORTS } from '../../docs/game/lib/data.js';
import { scaleVal } from '../../docs/game/lib/items.js';

const CLASSES = ['blade', 'warden', 'myco', 'ranger', 'summoner', 'shifter'];
const NICK_RE = /^[\p{L}\p{N} _.\-]{2,16}$/u;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...cors } });
const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const today = (off = 0) => new Date(Date.now() + off * 864e5).toISOString().slice(0, 10);
const cleanNick = n => String(n || '').trim().replace(/\s+/g, ' ');
const cleanText = (t, n) => String(t || '').replace(/[<>]/g, '').slice(0, n);

function checkRun(b) {
  if (typeof b.id !== 'string' || b.id.length < 6 || b.id.length > 40) return 'bad id';
  if (typeof b.key !== 'string' || b.key.length < 16 || b.key.length > 80) return 'bad key';
  if (!NICK_RE.test(cleanNick(b.nick))) return 'nick';
  if (!CLASSES.includes(b.cls)) return 'cls';
  if (!int(b.best, 1, 6000) || !int(b.lvl, 1, 999) || !int(b.kills ?? 0, 0, 1e8) || !int(b.playsec ?? 0, 0, 1e8)) return 'values';
  if (b.best > 8 + b.lvl * 2.5) return 'implausible depth for level';
  if (b.playsec < (b.best - 1) * 25) return 'too fast';
  if (b.kills < (b.best - 1) * 5) return 'too few kills';
  return null;
}
async function nickOk(env, nick, kh, now) {
  const nl = nick.toLowerCase();
  const own = await env.DB.prepare('SELECT keyhash FROM nicks WHERE nick_l=?').bind(nl).first();
  if (own && own.keyhash !== kh) return false;
  if (!own) await env.DB.prepare('INSERT OR IGNORE INTO nicks (nick_l,keyhash,created) VALUES (?,?,?)').bind(nl, kh, now).run();
  return true;
}
async function limit(env, kh, kind, max, gapMs) {
  const d = today(), now = Date.now();
  const r = await env.DB.prepare('SELECT n,last FROM limits WHERE keyhash=? AND kind=? AND day=?').bind(kh, kind, d).first();
  if (r && (r.n >= max || now - r.last < gapMs)) return false;
  await env.DB.prepare('INSERT INTO limits (keyhash,kind,day,n,last) VALUES (?,?,?,1,?) ON CONFLICT(keyhash,kind,day) DO UPDATE SET n=n+1,last=excluded.last').bind(kh, kind, d, now).run();
  return true;
}
// ---------- item validation for the well ----------
const RARS = ['common', 'magic', 'rare', 'legendary', 'sporeborn', 'set'];
function validItem(it, maxIlvl) {
  if (!it || typeof it !== 'object') return 'no item';
  if (it.type === 'support') { if (!SUPPORTS[it.sup]) return 'bad rune'; return { ok: { type: 'support', sup: it.sup, name: 'Runa: ' + SUPPORTS[it.sup].name, spr: 'rune_' + it.sup, desc: SUPPORTS[it.sup].desc }, tier: 100 }; }
  const base = BASES.find(b => b.id === it.base); if (!base) return 'bad base';
  if (!RARS.includes(it.rarity)) return 'bad rarity';
  if (!int(it.ilvl, 1, Math.max(12, maxIlvl))) return 'ilvl';
  if (!Array.isArray(it.aff) || it.aff.length > 10) return 'aff';
  const out = { uid: Date.now() % 1e9 + Math.floor(Math.random() * 1e6), base: base.id, slot: base.slot, spr: String(it.spr || base.spr).slice(0, 40), ilvl: it.ilvl, rarity: it.rarity, name: cleanText(it.name || base.name, 60), aff: [], imp: {} };
  if (base.dmg) { const m = Math.pow(1.095, it.ilvl - 1); const mx = Math.round(base.dmg[1] * m * 1.16) + 1;
    if (!Array.isArray(it.dmg) || !int(it.dmg[0], 1, mx) || !int(it.dmg[1], 1, mx) || it.dmg[0] > it.dmg[1]) return 'dmg'; out.dmg = it.dmg; out.kind = base.kind; }
  for (const [k, v] of Object.entries(base.imp || {})) { const cap = (Math.abs(v) + 1) * Math.pow(1.08, it.ilvl) * 2 + 5; const iv = it.imp?.[k] ?? v; if (typeof iv !== 'number' || Math.abs(iv) > cap) return 'imp'; out.imp[k] = iv; }
  if (it.unique) { const u = UNIQUES.find(x => x.id === it.unique); if (!u || u.base !== base.id || it.rarity !== 'legendary') return 'unique'; out.unique = u.id; out.name = u.name; out.spr = u.spr; }
  if (it.set) { const S = SETS.find(x => x.id === it.set); if (!S || !S.pieces[it.piece] || S.pieces[it.piece].base !== base.id) return 'set'; out.set = S.id; out.piece = it.piece; out.name = S.pieces[it.piece].name; }
  for (const a of it.aff) {
    if (!a || typeof a.s !== 'string' || typeof a.v !== 'number' || !isFinite(a.v)) return 'aff';
    const def = AFFIXES.find(x => x.s === a.s);
    let mx;
    if (def) mx = scaleVal(def, it.ilvl, def.v[1]) * 1.35 * 1.3 * 1.15 * 1.25 + 1; // sporeborn × reroll × convert × rezerva
    else mx = 60 * Math.pow(1.04, it.ilvl) + 50; // korupce / pevné hodnoty mimo afixy
    if (def?.cap) mx = Math.max(mx, def.cap * 2);
    if (Math.abs(a.v) > mx) return 'aff value ' + a.s;
    const o = { id: String(a.id || a.s).slice(0, 20), s: a.s, v: a.v }; for (const f of ['fixed', 'corr', 'curse', 'conv', 'lk']) if (a[f]) o[f] = 1; if (a.from) o.from = String(a.from).slice(0, 20);
    out.aff.push(o);
  }
  if (it.corrupted) { out.corrupted = true; out.corrRes = String(it.corrRes || '').slice(0, 12); }
  const tier = { common: 0, magic: 1, rare: 2, set: 3, legendary: 3, sporeborn: 4 }[it.rarity] * 10 + Math.min(9, Math.floor(it.ilvl / 5));
  return { ok: out, tier };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), P = url.pathname, q = k => url.searchParams.get(k);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      // ===== season leaderboard =====
      if (req.method === 'GET' && P === '/top') {
        const season = +q('season') || 1, cls = q('cls') || 'all', lim = Math.min(100, Math.max(1, +q('limit') || 50));
        const st = cls !== 'all' && CLASSES.includes(cls)
          ? env.DB.prepare('SELECT id,nick,cls,best,lvl,kills,playsec FROM runs WHERE season=? AND cls=? ORDER BY best DESC,lvl DESC,playsec ASC LIMIT ?').bind(season, cls, lim)
          : env.DB.prepare('SELECT id,nick,cls,best,lvl,kills,playsec FROM runs WHERE season=? ORDER BY best DESC,lvl DESC,playsec ASC LIMIT ?').bind(season, lim);
        const { results } = await st.all();
        return json({ season, cls, rows: results.map(r => ({ ...r, id: r.id.slice(-6) })) });
      }
      if (req.method === 'GET' && P === '/me') {
        const season = +q('season') || 1, id = q('id') || '';
        const me = await env.DB.prepare('SELECT best,lvl,playsec FROM runs WHERE season=? AND id=?').bind(season, id).first();
        if (!me) return json({ rank: null });
        const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM runs WHERE season=? AND (best>? OR (best=? AND lvl>?) OR (best=? AND lvl=? AND playsec<?))').bind(season, me.best, me.best, me.lvl, me.best, me.lvl, me.playsec).first();
        return json({ rank: r.n + 1, best: me.best });
      }
      if (req.method === 'POST' && P === '/submit') {
        const b = await req.json(); if (!int(b.season, 1, 999)) return json({ error: 'season' }, 400);
        const err = checkRun(b); if (err) return json({ error: err }, err === 'implausible depth for level' || err.startsWith('too') ? 422 : 400);
        const nick = cleanNick(b.nick), kh = await sha(b.key), now = Date.now();
        if (!(await nickOk(env, nick, kh, now))) return json({ error: 'nick taken' }, 409);
        const prev = await env.DB.prepare('SELECT keyhash,updated FROM runs WHERE season=? AND id=?').bind(b.season, b.id).first();
        if (prev && prev.keyhash !== kh) return json({ error: 'forbidden' }, 403);
        if (prev && now - prev.updated < 15000) return json({ ok: true, throttled: true });
        await env.DB.prepare(`INSERT INTO runs (season,id,keyhash,nick,cls,best,lvl,kills,playsec,updated) VALUES (?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(season,id) DO UPDATE SET nick=excluded.nick, cls=excluded.cls, best=MAX(runs.best,excluded.best), lvl=MAX(runs.lvl,excluded.lvl),
          kills=MAX(runs.kills,excluded.kills), playsec=CASE WHEN excluded.best>runs.best THEN excluded.playsec ELSE runs.playsec END, updated=excluded.updated`)
          .bind(b.season, b.id, kh, nick, b.cls, b.best, b.lvl, b.kills || 0, b.playsec || 0, now).run();
        return json({ ok: true });
      }
      // ===== daily depth =====
      if (req.method === 'GET' && P === '/daily') {
        const day = /^\d{4}-\d{2}-\d{2}$/.test(q('day') || '') ? q('day') : today();
        const { results } = await env.DB.prepare('SELECT id,nick,cls,best,lvl,dead,playsec FROM daily WHERE day=? ORDER BY best DESC,lvl DESC,playsec ASC LIMIT 100').bind(day).all();
        return json({ day, rows: results.map(r => ({ ...r, id: r.id.slice(-6) })) });
      }
      if (req.method === 'POST' && P === '/daily-submit') {
        const b = await req.json();
        if (![today(), today(-1)].includes(b.day)) return json({ error: 'day' }, 400);
        const err = checkRun(b); if (err) return json({ error: err }, err === 'implausible depth for level' || err.startsWith('too') ? 422 : 400);
        const nick = cleanNick(b.nick), kh = await sha(b.key), now = Date.now();
        if (!(await nickOk(env, nick, kh, now))) return json({ error: 'nick taken' }, 409);
        const prev = await env.DB.prepare('SELECT id,dead,updated FROM daily WHERE day=? AND keyhash=?').bind(b.day, kh).first();
        if (prev && prev.id !== b.id) return json({ error: 'already played' }, 409);
        if (prev && prev.dead) return json({ error: 'run over' }, 409);
        if (prev && now - prev.updated < 8000 && !b.dead) return json({ ok: true, throttled: true });
        await env.DB.prepare(`INSERT INTO daily (day,keyhash,id,nick,cls,best,lvl,kills,playsec,dead,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(day,keyhash) DO UPDATE SET nick=excluded.nick, best=MAX(daily.best,excluded.best), lvl=MAX(daily.lvl,excluded.lvl), kills=MAX(daily.kills,excluded.kills),
          playsec=CASE WHEN excluded.best>daily.best THEN excluded.playsec ELSE daily.playsec END, dead=MAX(daily.dead,excluded.dead), updated=excluded.updated`)
          .bind(b.day, kh, b.id, nick, b.cls, b.best, b.lvl, b.kills || 0, b.playsec || 0, b.dead ? 1 : 0, now).run();
        return json({ ok: true });
      }
      // ===== graves =====
      if (req.method === 'GET' && P === '/graves') {
        const season = +q('season') || 1, depth = +q('depth') || 1, day = /^\d{4}-\d{2}-\d{2}$/.test(q('day') || '') ? q('day') : '';
        const { results } = await env.DB.prepare('SELECT gid,nick,cls,lvl,killer,msg FROM graves WHERE season=? AND day=? AND depth=? ORDER BY created DESC LIMIT 25').bind(season, day, depth).all();
        const pick = results.sort(() => Math.random() - 0.5).slice(0, 3);
        return json({ rows: pick });
      }
      if (req.method === 'POST' && P === '/grave') {
        const b = await req.json();
        if (!int(b.season, 1, 999) || !int(b.depth, 1, 6000) || !int(b.lvl, 1, 999) || !CLASSES.includes(b.cls) || !NICK_RE.test(cleanNick(b.nick))) return json({ error: 'values' }, 400);
        if (typeof b.key !== 'string' || b.key.length < 16) return json({ error: 'key' }, 400);
        const day = b.day && [today(), today(-1)].includes(b.day) ? b.day : '';
        const kh = await sha(b.key);
        if (!(await limit(env, kh, 'grave', 40, 20000))) return json({ ok: true, throttled: true });
        await env.DB.prepare('INSERT INTO graves (season,day,depth,nick,cls,lvl,killer,msg,keyhash,created) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .bind(b.season, day, b.depth, cleanNick(b.nick), b.cls, b.lvl, cleanText(b.killer, 40) || 'neznámo', int(b.msg, -1, 50) ? b.msg : -1, kh, Date.now()).run();
        return json({ ok: true });
      }
      // ===== Hnilobná studna: hoď 1 předmět, vylov 1 cizí (pokud nějaký je) =====
      if (req.method === 'POST' && P === '/well') {
        const b = await req.json();
        if (!int(b.season, 1, 999) || typeof b.key !== 'string' || b.key.length < 16) return json({ error: 'values' }, 400);
        const kh = await sha(b.key), nick = NICK_RE.test(cleanNick(b.nick)) ? cleanNick(b.nick) : 'Bezejmenný poutník';
        const best = await env.DB.prepare('SELECT MAX(best) AS m FROM runs WHERE season=? AND keyhash=?').bind(b.season, kh).first();
        const maxIlvl = Math.max(12, (best?.m || 0) + 4);
        const v = validItem(b.item, maxIlvl); if (typeof v === 'string') return json({ error: 'item: ' + v }, 422);
        if (!(await limit(env, kh, 'well', 6, 5000))) return json({ error: 'limit' }, 429);
        // vylov: nejdřív stejná třída, pak ±1, pak cokoli – nikdy vlastní předmět
        let got = null;
        for (const [lo, hi] of [[v.tier, v.tier], [v.tier - 1, v.tier + 1], [v.tier - 10, v.tier + 10]]) {
          got = await env.DB.prepare('SELECT wid,item,nick FROM well WHERE season=? AND keyhash<>? AND tier BETWEEN ? AND ? ORDER BY RANDOM() LIMIT 1').bind(b.season, kh, lo, hi).first();
          if (got) break;
        }
        if (got) await env.DB.prepare('DELETE FROM well WHERE wid=?').bind(got.wid).run();
        await env.DB.prepare('INSERT INTO well (season,tier,item,nick,keyhash,created) VALUES (?,?,?,?,?,?)').bind(b.season, v.tier, JSON.stringify(v.ok), nick, kh, Date.now()).run();
        return json({ ok: true, item: got ? JSON.parse(got.item) : null, from: got ? got.nick : null });
      }
      return json({ error: 'not found' }, 404);
    } catch (e) { return json({ error: 'server', msg: String(e.message || e) }, 500); }
  },
};
