// Sporium online leaderboard client
import {LB_URL} from './config.js';
import {SEASON} from './data.js';
const PK='sporium_player_v1';
export const LB={
  enabled(){ return !!LB_URL; },
  player(){ let p=null; try{ p=JSON.parse(localStorage.getItem(PK)); }catch(e){} if(!p||!p.key){ const a=new Uint8Array(24); crypto.getRandomValues(a); p={key:[...a].map(b=>b.toString(16).padStart(2,'0')).join(''),nick:''}; try{ localStorage.setItem(PK,JSON.stringify(p)); }catch(e){} } return p; },
  setDefaultNick(n){ const p=this.player(); p.nick=n; try{ localStorage.setItem(PK,JSON.stringify(p)); }catch(e){} },
  validNick(n){ return /^[\p{L}\p{N} _.\-]{2,16}$/u.test(String(n||'').trim()); },
  last:0, lastErr:null,
  async submit(g,force){ if(!LB_URL) return null; const p=g.player; if(!p?.nick||!g.charId) return null; const now=Date.now(); if(!force&&now-this.last<16000) return null; this.last=now;
    const body={season:SEASON.n,id:g.charId,key:this.player().key,nick:p.nick,cls:p.cls,best:g.best|0,lvl:p.lvl|0,kills:g.kills|0,playsec:Math.round(p.playSec||0),eg:Math.max(0,...(p.atlas?.done||[]))|0,queen:(p.atlas?.queen||0)|0};
    try{ const r=await fetch(LB_URL.replace(/\/$/,'')+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const j=await r.json().catch(()=>({})); this.lastErr=r.ok?null:(j.error||r.status); return {ok:r.ok,status:r.status,...j}; }
    catch(e){ this.lastErr='offline'; return {ok:false,error:'offline'}; } },
  today(){ return new Date().toISOString().slice(0,10); },
  base(){ return LB_URL.replace(/\/$/,''); },
  async post(path,body){ if(!LB_URL) return null; try{ const r=await fetch(this.base()+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const j=await r.json().catch(()=>({})); return {ok:r.ok,status:r.status,...j}; }catch(e){ return {ok:false,error:'offline'}; } },
  async dailySubmit(g,dead){ const p=g.player; if(!LB_URL||!p?.nick||!g.daily) return null; const now=Date.now(); if(!dead&&now-this.last<9000) return {throttled:true}; this.last=now;
    return this.post('/daily-submit',{day:g.daily.day,id:g.charId,key:this.player().key,nick:p.nick,cls:p.cls,best:g.best|0,lvl:p.lvl|0,kills:g.kills|0,playsec:Math.round(p.playSec||0),dead:!!dead}); },
  async daily(day){ if(!LB_URL) return null; try{ const r=await fetch(`${this.base()}/daily?day=${day||this.today()}`); return r.ok?await r.json():null; }catch(e){ return null; } },
  async graves(depth,day){ if(!LB_URL) return null; try{ const r=await fetch(`${this.base()}/graves?season=${SEASON.n}&depth=${depth}&day=${day||''}`); return r.ok?await r.json():null; }catch(e){ return null; } },
  grave(g,killer,msg){ const p=g.player; if(!LB_URL||!p?.nick) return null; return this.post('/grave',{season:SEASON.n,day:g.daily?.day||'',depth:g.depth,key:this.player().key,nick:p.nick,cls:p.cls,lvl:p.lvl,killer:String(killer||'').slice(0,40),msg}); },
  forget(){ return this.post('/forget',{key:this.player().key}); },
  well(item,nick){ return this.post('/well',{season:SEASON.n,key:this.player().key,nick:nick||'',item}); },
  async top(cls='all'){ if(!LB_URL) return null; try{ const r=await fetch(`${LB_URL.replace(/\/$/,'')}/top?season=${SEASON.n}&cls=${cls==='eg'?'all&sort=eg':cls}&limit=50`); return r.ok?await r.json():null; }catch(e){ return null; } },
  async me(id){ if(!LB_URL||!id) return null; try{ const r=await fetch(`${LB_URL.replace(/\/$/,'')}/me?season=${SEASON.n}&id=${encodeURIComponent(id)}`); return r.ok?await r.json():null; }catch(e){ return null; } },
};
