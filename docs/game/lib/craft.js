// S2: nová výroba na Oltáři hniloby – Výtrusné krystaly a recepty (inspirace Horadrickou kostkou).
// Krystaly se neukládají do inventáře, ale do „měšce“ player.crystals = {life:[g1..g5], war:[...], mind:[...]}.
import {AFFIXES,BASES,UNIQUES} from './data.js';
import {addAffixes,rollAffix,famOf,makeItem,tooltipHTML,statLine,itemSprite,itemValue,nameItem} from './items.js';
import {rng,fmt} from './util.js';

export const CFAM={
  life:{name:'Míza',adj:'Mízy',color:'#ec829e',spr:'crystal_green',tint:[0.6,1,0.55],desc:'život, odolnosti, zbroj, obrana'},
  war:{name:'Zuřivost',adj:'Zuřivosti',color:'#f0a463',spr:'crystal_violet',tint:[1.25,0.45,0.35],desc:'poškození, kritické zásahy, síla, obratnost'},
  mind:{name:'Mysl',adj:'Mysli',color:'#b98cff',spr:'crystal_violet',tint:[0.8,0.6,1.2],desc:'kouzla, živly, neduhy, esence, přisluhovači'},
};
export const GRADES=['Úlomek','Zrnko','Krystal','Čistý krystal','Bezvadný krystal'];
const FAMS=['life','war','mind'];
export const walletOf=p=>{ const w=p.crystals||(p.crystals={}); for(const f of FAMS) if(!Array.isArray(w[f])||w[f].length!==5) w[f]=[0,0,0,0,0]; return w; };
export const makeCrystal=(fam,g)=>({type:'crystal',fam,g,spr:CFAM[fam].spr,tint:CFAM[fam].tint,name:`${GRADES[g-1]} ${CFAM[fam].adj}`});
// potřebný stupeň krystalu podle úrovně předmětu
export const needGrade=it=>Math.max(1,Math.min(4,Math.ceil((it.ilvl||1)/15)));
const has=(w,f,g,n=1)=>w[f][g-1]>=n;
const take=(w,f,g,n=1)=>{ w[f][g-1]-=n; };
// nejnižší dostupný stupeň ≥ g dané rodiny (nebo libovolné, když f==='any')
const bestFrom=(w,f,g,n=1)=>{ for(const ff of f==='any'?FAMS:[f]) for(let k=g;k<=5;k++) if(w[ff][k-1]>=n) return [ff,k]; return null; };

export const GameCraft={
  crystalGrade(){ const d=Math.min(this.depth||1,60); let g=Math.max(1,Math.min(4,1+Math.floor(d/15))); if(this.mapRun&&this.mapRun.tier>=6&&rng.chance(0.15+this.mapRun.tier*0.02)) g=5; return g; },
  craftDrops(m){ if(m.thief) return; const ch=(m.boss?1:m.mapBoss?1:m.unique?0.5:m.rarity==='rare'?0.25:m.rarity==='magic'?0.06:0.015)*(1+(this.floorMods?.crystal||0)); const n=m.boss||m.mapBoss?rng.int(2,3):1;
    for(let i=0;i<n;i++){ if(!rng.chance(ch)) continue; let g=this.crystalGrade(); if((m.boss||m.mapBoss)&&this.depth>=45&&rng.chance(0.3)) g=5; const it=makeCrystal(rng.pick(FAMS),g); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); } },
  addCrystal(it){ const w=walletOf(this.player); w[it.fam][it.g-1]++; this.float(this.player.x,this.player.y,'+'+it.name,CFAM[it.fam].color,0.9); this.log('Sebráno: '+it.name,'loot:sporeborn'); this.snd('loot_rare');
    this.ui?.hint?.('crystal','<b>Výtrusný krystal</b> se uložil do měšce. U <b>Oltáře hniloby</b> v záložce <b>Recepty</b> z nich vyrobíš lepší výbavu. Tři stejné krystaly spojíš ve vyšší stupeň.'); },
  // ---- recepty ----
  rcCombine(f,g){ const w=walletOf(this.player), p=this.player, cost=10*g*g; if(g>=5||!has(w,f,g,3)||p.dust<cost) return false; take(w,f,g,3); w[f][g]++; p.dust-=cost; this.snd('loot_rare'); return true; },
  rcTransmute(it,f){ const w=walletOf(this.player); if(!it?.base||it.corrupted||it.rarity!=='common') return false; const src=bestFrom(w,f,1); if(!src) return false; take(w,...src);
    it.rarity='magic'; addAffixes(it,rng.int(1,2),f); this.renameItem(it); this.snd('loot'); return true; },
  rcPromote(it,f){ const w=walletOf(this.player), g=needGrade(it); if(!it?.base||it.corrupted||it.rarity!=='magic') return false; const src=bestFrom(w,f,g,3); if(!src) return false; take(w,src[0],src[1],3);
    it.rarity='rare'; const want=rng.int(3,4); addAffixes(it,Math.max(0,want-it.aff.length),f); this.renameItem(it); this.snd('loot_rare'); return true; },
  rcReroll(it,idx){ const p=this.player, w=walletOf(p), a=it?.aff?.[idx]; if(!a||a.fixed||a.corr||a.curse||a.id==='sb'||it.corrupted) return false; const def=AFFIXES.find(x=>x.id===a.id); if(!def) return false;
    const f=famOf(a.s), g=Math.min(5,needGrade(it)+1); const src=bestFrom(w,f,g); if(!src||!(p.cores>0)) return false; take(w,...src); p.cores--;
    const r=rollAffix(def,it.ilvl); if(a.t1){ r.v=Math.round(r.v*1.35*10)/10; r.t1=1; } if(a.lk) r.lk=1; it.aff[idx]=r; this.recalc(); this.snd('loot_rare'); return r; },
  rcReplace(it,idx,f){ const w=walletOf(this.player), a=it?.aff?.[idx]; if(!a||a.fixed||a.corr||a.curse||a.lk||a.id==='sb'||it.corrupted||it.rarity==='common') return false; const src=bestFrom(w,f,3,2); if(!src) return false;
    const rest=it.aff.filter((_,i)=>i!==idx); const keep=it.aff, n0=rest.length; it.aff=rest; addAffixes(it,1,f); if(it.aff.length===n0){ it.aff=keep; return false; } take(w,src[0],src[1],2);
    const nw=it.aff.pop(); nw.lk=1; it.aff.splice(idx,0,nw); this.recalc(); this.snd('loot_rare'); return nw; },
  rcAdd(it,f){ const w=walletOf(this.player); if(!it?.base||it.corrupted||!['rare','sporeborn','legendary','set'].includes(it.rarity)||it.aff.length>=6) return false; if(!has(w,f,5,3)) return false;
    const n0=it.aff.length; addAffixes(it,1,f); if(it.aff.length===n0) return false; take(w,f,5,3); this.recalc(); this.snd('loot_leg'); return true; },
  rcUnique(it){ const p=this.player, w=walletOf(p); if(!it?.unique||it.corrupted) return false; const src=bestFrom(w,'any',5); if(!src||(p.cores||0)<3) return false; take(w,...src); p.cores-=3;
    const keep=it.aff.filter(a=>a.fixed||a.corr||a.t1); const n=it.aff.length-keep.length; it.aff=keep; addAffixes(it,Math.max(1,n)); this.recalc(); this.snd('loot_leg'); return true; },
  rcFusion(it){ const p=this.player, w=walletOf(p); if(it?.rarity!=='legendary'||it.corrupted||!p.inv.includes(it)) return null; const others=p.inv.filter(x=>x!==it&&x.rarity==='legendary'&&!x.corrupted).sort((a,b)=>itemValue(a)-itemValue(b)).slice(0,2);
    if(others.length<2) return null; const src=bestFrom(w,'any',4); if(!src) return null; take(w,...src);
    for(const x of [it,...others]) p.inv.splice(p.inv.indexOf(x),1);
    const slot=it.slot, il=Math.max(it.ilvl,...others.map(o=>o.ilvl)); const pool=UNIQUES.filter(u=>!u.eg&&BASES.find(b=>b.id===u.base)?.slot===slot&&u.id!==it.unique);
    const u=pool.length?rng.pick(pool):null; const out=u?makeItem(il,{uniqueId:u.id}):makeItem(il,{rarity:'legendary'}); p.inv.push(out); this.snd('loot_leg'); return out; },
  renameItem(it){ nameItem(it); },
};

// ---------------- UI ----------------
export const UICraft={
  crystalIcon(f){
    const fallback=CFAM[f].spr, spr=itemSprite({type:'crystal',fam:f,spr:fallback},this.meta.s);
    return `<img class="cico${spr===fallback?' c-'+f:''}" alt="" src="${this.icon(spr,48)}">`;
  },
  walletHTML(){ const w=walletOf(this.g.player); return `<div class="wallet">${FAMS.map(f=>`<div class="wf"><span class="wn" style="color:${CFAM[f].color}">${this.crystalIcon(f)} ${CFAM[f].name}</span>${w[f].map((n,i)=>`<span class="wg ${n?'':'z'}" title="${GRADES[i]} ${CFAM[f].adj}">${['I','II','III','IV','V'][i]}<b>${n}</b>${i<4&&n>=3?`<button data-cmb="${f}:${i+1}" title="Spojit 3× ${GRADES[i]} → 1× ${GRADES[i+1]} (${10*(i+1)*(i+1)} ✦)">⇧</button>`:''}</span>`).join('')}</div>`).join('')}</div>`; },
  recipeHTML(){ const g=this.g,p=g.player,w=walletOf(p); const it=this.craftSel; const items=[...Object.values(p.equip).filter(Boolean),...p.inv.filter(i=>i.base)];
    const feather=this.icon('feather_angel',48);
    const fsel=this.rcFam||'life'; const famBtns=`<div class="famsel">${FAMS.map(f=>`<button data-rcf="${f}" class="${f===fsel?'on':''}" style="--fc:${CFAM[f].color}">${this.crystalIcon(f)} ${CFAM[f].name}<small>${CFAM[f].desc}</small></button>`).join('')}</div>`;
    let act='';
    if(it){ const cor=it.corrupted, need=needGrade(it); const B=(id,label,ok,why)=>`<button data-rc="${id}" ${ok?'':'disabled'} title="${why||''}">${label}</button>`;
      const cnt=(f,g)=>{ let n=0; for(let k=g;k<=5;k++) n+=w[f][k-1]; return n; };
      const rows=[];
      if(cor) rows.push(`<div class="hint">Zkažený předmět už nejde měnit.</div>${this.egDoubleBtn(it)}`);
      else {
        rows.push(`<button data-c="corrupt" class="corrbtn" ${(p.cores||0)<1?'disabled':''}>☣ Zkazit · 1 jádro (${p.cores||0})</button>`);
        if(it.rarity==='common') rows.push(B('tr',`Proměna → kouzelný · 1× ${CFAM[fsel].adj} (I+)`,cnt(fsel,1)>=1));
        if(it.rarity==='magic') rows.push(B('pr',`Povýšení → vzácný · 3× ${CFAM[fsel].adj} (${['I','II','III','IV'][need-1]}+)`,!!bestFrom(w,fsel,need,3)));
        if(['rare','sporeborn','legendary','set'].includes(it.rarity)&&it.aff.length<6) rows.push(B('ad',`Přidat vlastnost ${CFAM[fsel].adj} · 3× V`,has(w,fsel,5,3)));
        if(it.unique) rows.push(B('un',`Přerolovat volné vlastnosti unikátu · 3 jádra + 1× V`,(p.cores||0)>=3&&!!bestFrom(w,'any',5)));
        if(it.rarity==='legendary'&&p.inv.includes(it)) rows.push(B('fu',`Fúze: tento + 2 nejslabší unikáty → nový unikát · 1× IV`,p.inv.filter(x=>x!==it&&x.rarity==='legendary'&&!x.corrupted).length>=2&&!!bestFrom(w,'any',4)));
        const rr=it.aff.map((a,i)=>[a,i]).filter(([a])=>!a.fixed&&!a.corr&&!a.curse&&a.id!=='sb');
        if(rr.length&&it.rarity!=='common'){ rows.push(`<div class="reforge"><div class="hint">Přebrousit hodnotu (stejná vlastnost, nový hod) · 1 jádro + 1 krystal její rodiny (${['I','II','III','IV','V'][Math.min(5,need+1)-1]}+):</div>${rr.map(([a,i])=>`<button data-rr="${i}" style="border-left:3px solid ${CFAM[famOf(a.s)].color}" ${(p.cores||0)>0&&bestFrom(w,famOf(a.s),Math.min(5,need+1))?'':'disabled'}>${statLine(a.s,a.v)}</button>`).join('')}</div>`);
          const rp=rr.filter(([a])=>!a.lk); if(rp.length) rows.push(`<div class="reforge"><div class="hint">Vyměnit vlastnost za novou z rodiny ${CFAM[fsel].adj} (nová se zamkne) · 2× III+:</div>${rp.map(([a,i])=>`<button data-rp="${i}" ${bestFrom(w,fsel,3,2)?'':'disabled'}>${statLine(a.s,a.v)}</button>`).join('')}</div>`); }
      }
      act=`<div class="craftsel"><div class="ttc">${tooltipHTML(it)}</div><div class="cbtn">${rows.join('')}</div></div>`; }
    return `<h2>Oltář hniloby · Recepty</h2><div class="hint">Krystaly padají z monster (vzácná a bossové častěji). Barva určuje, jaké vlastnosti recept přidá. Tři stejné krystaly spojíš ve vyšší stupeň (⇧). Výtrusný prach (✦ ${fmt(p.dust)}) slouží ke spojování krystalů. Zkažená jádra: ${p.cores||0}.</div>
      ${this.walletHTML()}<div class="feath">${feather?`<img class="cico" alt="" src="${feather}">`:'🪶'} Andělská pera: <b>${p.feathers||0}</b> <small>(ze zavřených Trhlin jádra)</small> <button data-fth="1" class="egbtn" ${(p.feathers||0)>=g.featherCost()?'':'disabled'}>Sezónní unikát · ${g.featherCost()} per</button></div>${famBtns}<div class="bag craftbag">${items.map((i,k)=>this.slotHTML(i,`data-craft="${k}" ${i===it?'data-sel="1"':''}`)).join('')}</div>${act}`; },
  craftWire(el){ const g=this.g,p=g.player; const it=this.craftSel;
    el.querySelectorAll('[data-rcf]').forEach(b=>b.onclick=()=>{ this.rcFam=b.dataset.rcf; this.renderPanel(); });
    el.querySelectorAll('[data-fth]').forEach(b=>b.onclick=()=>{ const it=g.buyFeatherUnique(); if(it){ this.banner('Dar jádra',it.name); g.log('Pera se proměnila: '+it.name,'loot:legendary'); this.craftSel=it; } this.refresh(); });
    el.querySelectorAll('[data-cmb]').forEach(b=>b.onclick=()=>{ const [f,gr]=b.dataset.cmb.split(':'); if(g.rcCombine(f,+gr)) g.log(`Spojeno: 3× ${GRADES[gr-1]} → ${GRADES[+gr]} ${CFAM[f].adj}.`,'good'); else g.log('Na spojení nemáš dost krystalů nebo prachu.','warn'); this.refresh(); });
    const f=this.rcFam||'life'; const done=(ok,msg)=>{ if(ok){ g.recalc(); g.log('Oltář: '+msg,'loot:sporeborn'); } else g.log('Recept se nepovedl – chybí suroviny.','warn'); this.refresh(); };
    el.querySelectorAll('[data-rc]').forEach(b=>b.onclick=()=>{ const c=b.dataset.rc;
      if(c==='tr') done(g.rcTransmute(it,f),'proměna – '+it.name);
      if(c==='pr') done(g.rcPromote(it,f),'povýšení – '+it.name);
      if(c==='ad') done(g.rcAdd(it,f),'nová vlastnost na '+it.name);
      if(c==='un') done(g.rcUnique(it),'unikát přerostl – '+it.name);
      if(c==='fu'){ const out=g.rcFusion(it); if(out){ this.craftSel=out; this.banner('Fúze unikátů',out.name); } done(!!out,'fúze – '+(out?.name||'')); } });
    el.querySelectorAll('[data-rr]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.rr, old=it.aff[i]; const r=g.rcReroll(it,i); done(!!r,r?`${statLine(old.s,old.v)} → ${statLine(r.s,r.v)}`:''); });
    el.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.rp, old=it.aff[i]; const r=g.rcReplace(it,i,f); done(!!r,r?`${statLine(old.s,old.v)} → ${statLine(r.s,r.v)}`:''); }); },
};
