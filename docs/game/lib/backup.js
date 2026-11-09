// Záloha savu: soubor (export/import) a cloudový kód přes worker.
import {LB_URL} from './config.js';
import {LB} from './net.js';
const KEYS=['sporium_roster_v1','sporium_stash_v1','sporium_player_v1','sporium_news_seen','sporium_lootfilter','sporium_tips','sporium_intro_off'];
const AUTO='sporium_backup_auto', CODE='sporium_backup_code', LAST='sporium_backup_last';
const ls={ get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} } };
const b64=u8=>{ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); };
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pipe(u8,stream){ const r=new Response(new Blob([u8]).stream().pipeThrough(stream)); return new Uint8Array(await r.arrayBuffer()); }
export const Backup={
  collect(){ const d={sporium:1,t:Date.now(),keys:{}}; for(const k of KEYS){ const v=ls.get(k); if(v!=null) d.keys[k]=v; } return d; },
  valid(d){ if(!d||d.sporium!==1||!d.keys) return false; try{ const r=JSON.parse(d.keys.sporium_roster_v1||'null'); return !!(r&&r.chars&&typeof r.chars==='object'); }catch(e){ return false; } },
  count(d){ try{ return Object.keys(JSON.parse(d.keys.sporium_roster_v1).chars).length; }catch(e){ return 0; } },
  apply(d){ if(!this.valid(d)) return false; for(const k of KEYS) if(k in d.keys) ls.set(k,d.keys[k]); return true; },
  download(){ const d=this.collect(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'})); a.download=`sporium-zaloha-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); },
  async readFile(file){ const txt=await file.text(); const d=JSON.parse(txt); if(!this.valid(d)) throw new Error('bad'); return d; },
  async pack(d){ const raw=new TextEncoder().encode(JSON.stringify(d)); if(typeof CompressionStream==='undefined') return 'J'+b64(raw); return 'G'+b64(await pipe(raw,new CompressionStream('gzip'))); },
  async unpack(s){ const kind=s[0], u8=unb64(s.slice(1)); const raw=kind==='G'?await pipe(u8,new DecompressionStream('gzip')):u8; return JSON.parse(new TextDecoder().decode(raw)); },
  enabled(){ return !!LB_URL; },
  code(){ return ls.get(CODE); }, auto(){ return ls.get(AUTO)==='1'; }, setAuto(on){ ls.set(AUTO,on?'1':null); },
  lastTime(){ return +(ls.get(LAST)||0); },
  async cloudSave(){ if(!LB_URL) return {error:'offline'}; const data=await this.pack(this.collect()); const r=await LB.post('/backup',{key:LB.player().key,data});
    if(r?.ok&&r.code){ ls.set(CODE,r.code); if(!r.throttled) ls.set(LAST,String(Date.now())); ls.set(AUTO,'1'); } return r||{error:'offline'}; },
  async cloudRestore(code){ if(!LB_URL) return {error:'offline'}; try{ const r=await fetch(LB.base()+'/restore?code='+encodeURIComponent(code)); const j=await r.json().catch(()=>({})); if(!r.ok||!j.data) return {error:j.error||r.status};
      const d=await this.unpack(j.data); if(!this.valid(d)) return {error:'bad'}; return {ok:true,data:d,updated:j.updated}; }catch(e){ return {error:'offline'}; } },
  // called from Game.save(): refresh the cloud copy at most every 10 minutes once the player turned it on
  tick(){ if(!this.auto()||!LB_URL) return; if(Date.now()-this.lastTime()<10*60*1000||this._busy) return; this._busy=true; this.cloudSave().finally(()=>{ this._busy=false; }); },
};
