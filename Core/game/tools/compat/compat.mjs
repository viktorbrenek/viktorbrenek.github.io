// Sporium – kontrola kompatibility savů + kouřový test.
//   node compat.mjs make   <url-staré-verze>  [fixture.json]   → nahraje postavy všech tříd na staré verzi, uloží localStorage
//   node compat.mjs verify <url-nové-verze>   [fixture.json]   → načte fixturu do nové verze, každou postavu načte a odehraje
//   node compat.mjs smoke  <url>                                → nové postavy, hraní, chyby v konzoli
// URL = adresa docs/game servírovaná přes http (např. python3 -m http.server).
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'fs';
const [mode, url, file='fixture.json'] = process.argv.slice(2);
if(!mode||!url){ console.log('použití: node compat.mjs make|verify|smoke <url> [fixture.json]'); process.exit(1); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1280,height:800} });
const errors=[];
page.on('pageerror', e=>errors.push('pageerror: '+e.message));
page.on('console', m=>{ if(m.type()==='error'&&!/Failed to load resource|net::|workers\.dev/.test(m.text())) errors.push('console: '+m.text()); });
await page.route(/workers\.dev/, r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
if(mode==='verify'){ const dump=JSON.parse(fs.readFileSync(file,'utf8')); await page.addInitScript(d=>{ if(!sessionStorage.getItem('_seeded')){ for(const [k,v] of Object.entries(d)) localStorage.setItem(k,v); sessionStorage.setItem('_seeded','1'); } }, dump); }
await page.goto(url); await page.waitForFunction(()=>window.SPORIUM&&!document.getElementById('loading'),null,{timeout:30000});

// in-page bot: odehraje N tahů, sbírá kořist, nasazuje lepší věci, padá hlouběji
const BOT = async ({turns, deep})=>{ const {g,ui}=window.SPORIUM; const D=await import('./lib/data.js'); const out={turns:0,deaths:0,floors:0,err:null};
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  try{ for(let t=0;t<turns;t++){ if(ui.modal) ui.hideModal(); if(g.player.hp<=0){ out.deaths++; g.respawn(); continue; }
      const p=g.player; const vis=g.monsters.filter(m=>m.hp>0&&g.canSee(m)); let acted=false;
      if(vis.length&&Math.random()<0.6){ const m=vis.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]; const sk=rnd(p.bar.filter(Boolean).concat(['attack'])); try{ acted=g.useSkill(sk,m.x,m.y)!==false; }catch(e){ throw e; } }
      if(!acted){ const d=rnd([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]); if(!g.tryMove(d[0],d[1])) g.tryMove(-d[0],-d[1]); }
      out.turns++;
      if(t%60===59&&deep){ g.floorMods=null; g.enterFloor(g.depth+deep); out.floors++; }
      if(t%40===0){ for(const it of p.inv.slice()) if(it.slot&&!p.equip[it.slot]&&g.equip) try{ g.equip(it); }catch(e){} }
    } g.save(); }catch(e){ out.err=e.stack||String(e); }
  return out; };

if(mode==='make'||mode==='smoke'){
  const classes = await page.evaluate(async()=>{ const D=await import('./lib/data.js'); return D.CLASSES.map(c=>c.id); });
  for(const cls of classes){ await page.evaluate(c=>{ const {g,ui}=window.SPORIUM; g.charId=null; g.newCharacter(c); ui.bind(g); },cls);
    await page.evaluate(async()=>{ const {g}=window.SPORIUM; const D=await import('./lib/data.js'); const I=await import('./lib/items.js'); const p=g.player;
      g.gainXP(1e6); for(let k=0;k<400&&p.ppoints>0;k++){ const c=Object.keys(D.PASSIVE_MAP).filter(id=>g.canAlloc(id)); if(!c.length) break; g.alloc(c[Math.floor(Math.random()*c.length)]); }
      const pick=a=>a[Math.floor(Math.random()*a.length)];
      for(let i=0;i<6;i++) p.inv.push(I.makeItem(30,{uniqueId:pick(D.UNIQUES).id})); for(let i=0;i<4;i++){ const s=I.makeSetItem(30); if(s) p.inv.push(s); }
      for(let i=0;i<3;i++) p.inv.push(I.makeSupport?I.makeSupport(pick(Object.keys(D.SUPPORTS))):I.makeItem(30));
      for(const it of p.inv.slice()) if(it.slot&&Math.random()<0.5) try{ g.equip(it,undefined,true); }catch(e){} g.recalc(); g.save(); });
    const r=await page.evaluate(BOT,{turns:mode==='smoke'?500:300,deep:3}); console.log(cls,JSON.stringify(r)); if(r.err) errors.push(cls+': '+r.err); }
  if(mode==='make'){ const dump=await page.evaluate(()=>{ const o={}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k.startsWith('sporium')) o[k]=localStorage.getItem(k); } return o; }); fs.writeFileSync(file,JSON.stringify(dump)); console.log('fixtura uložena:',file,Object.keys(dump).join(', ')); }
}
if(mode==='verify'){
  const ids = await page.evaluate(async()=>{ const m=await import('./lib/game.js'); return m.Roster.list().map(c=>c.id); });
  console.log('postav ve fixtuře:',ids.length);
  for(const id of ids){ const ok=await page.evaluate(id=>{ const {g,ui}=window.SPORIUM; const r=g.load(id); if(r) ui.bind(g); return r; },id);
    if(!ok){ errors.push('load selhal: '+id); continue; }
    const chk=await page.evaluate(async()=>{ const {g}=window.SPORIUM; const D=await import('./lib/data.js'); const p=g.player, bad=[];
      for(const n of p.passives) if(!D.PASSIVE_MAP[n]) bad.push('uzel '+n);
      for(const s of Object.keys(p.skills)) if(s!=='attack'&&!D.SKILLS[s]) bad.push('skill '+s);
      for(const it of [...p.inv,...Object.values(p.equip)].filter(Boolean)){ if(it.unique&&!D.UNIQUES.find(u=>u.id===it.unique)) bad.push('unikát '+it.unique); if(it.set&&!D.SETS.find(s=>s.id===it.set)) bad.push('sada '+it.set); }
      if(!(p.stats.life>0)) bad.push('život '+p.stats.life); return {cls:p.cls,lvl:p.lvl,bad}; });
    const r=await page.evaluate(BOT,{turns:150,deep:2}); console.log(id,JSON.stringify(chk),JSON.stringify(r)); if(chk.bad.length) errors.push(id+': '+chk.bad.join(', ')); if(r.err) errors.push(id+': '+r.err); }
}
await browser.close();
if(errors.length){ console.log('\nCHYBY ('+errors.length+'):\n'+[...new Set(errors)].slice(0,30).join('\n')); process.exit(2); }
console.log('\nOK – bez chyb.');
