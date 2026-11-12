import {BASES,AFFIXES,RARITY,RARE_A,RARE_B,UNIQUES,STAT_NAMES,PCT,SLOT_NAMES,SUPPORTS,CORRUPT_IMPL,CORRUPT_GOOD,CORRUPT_BAD,CONVERT_GROUPS,SETS,MAX_SCALING_DEPTH} from './data.js';
import {rng,fmt} from './util.js';
let UID=1;
const slotTag=b=>b.slot==='ring'?'ring':b.slot;
export const isEquip=it=>!!it.base;
export function scaleVal(a,ilvl,v){
  if(a.sc==='exp') return v*Math.pow(1.075,ilvl-1);
  if(a.sc==='lin') return v*(1+Math.min(ilvl,60)*0.02);
  return v;
}
function rollAffix(a,ilvl){
  const t=0.75+rng.next()*0.25*(1+Math.min(ilvl,40)/40);
  let v=scaleVal(a,ilvl,a.v[0]+(a.v[1]-a.v[0])*rng.next()*t);
  v=PCT.has(a.s)||a.sc==='none'||v>=10?Math.round(v):Math.round(v*10)/10;
  if(a.cap) v=Math.min(v,a.cap);
  return {id:a.id,s:a.s,v:Math.max(1,v)};
}
function poolFor(base){ const tag=slotTag(base); return AFFIXES.filter(a=>a.slots==='*'||a.slots.split(',').includes(tag)); }
function addAffixes(it,n){
  const base=BASES.find(b=>b.id===it.base); const pool=poolFor(base);
  for(let i=0;i<n;i++){
    const cand=pool.filter(a=>!it.aff.some(x=>x.id===a.id)&&(!a.rare||rng.chance(a.rare)));
    if(!cand.length) break; const a=rng.pick(cand), r=rollAffix(a,it.ilvl);
    if(it.eg&&rng.chance(Math.min(0.15,0.02+it.eg*0.008))){ r.v=PCT.has(a.s)||a.sc==='none'||r.v>=10?Math.round(r.v*1.35):Math.round(r.v*1.35*10)/10; if(a.cap) r.v=Math.min(r.v,Math.round(a.cap*1.35)); r.t1=1; }
    it.aff.push(r);
  }
}
// MF s klesajícími výnosy: násobič 1 + 1,5·MF/(MF+120) → max 2,5×. Unikáty a sety mají vlastní strop.
export function mfMult(mf=0){ mf=Math.max(-90,mf); return mf>=0?1+1.5*mf/(mf+120):1+mf/100; }
export function rollRarity(mf=0,boost=0,ilvl=10){
  const f=Math.min(1,0.2+ilvl*0.08), M=mfMult(mf);
  const r=rng.next()*100;
  const lg=Math.min((1.0+boost*1.5)*f*M, 3+boost*4), sb=ilvl>=3?Math.min((0.8+boost*1.2)*f*M, 2.5+boost*3):0;
  if(r<lg) return 'legendary';
  if(r<lg+sb) return 'set';
  if(r<lg+sb+(10+boost*8)*M) return 'rare';
  if(r<lg+sb+(40+boost*10)*M) return 'magic';
  return 'common';
}
export function makeSetItem(ilvl,setId,pi){ ilvl=Math.min(ilvl,MAX_SCALING_DEPTH); const cands=[]; for(const S of SETS) S.pieces.forEach((pc,i)=>{ const b=BASES.find(x=>x.id===pc.base); if(b&&b.min<=ilvl+4&&(!setId||S.id===setId)&&(pi==null||pi===i)) cands.push([S,pc,i]); });
  if(!cands.length) return null; const [S,pc,i]=rng.pick(cands); const it=makeItem(ilvl,{baseId:pc.base,rarity:'common'}); it.rarity='set'; it.set=S.id; it.piece=i; it.name=pc.name;
  for(const [st,v] of Object.entries(pc.fixed)){ const a=AFFIXES.find(a=>a.s===st); it.aff.push({id:'s_'+st,s:st,v:a?Math.round(scaleVal(a,ilvl,v)*10)/10:v,fixed:1}); }
  addAffixes(it,rng.int(1,2)); return it; }
export function makeItem(ilvl,{rarity,baseId,uniqueId,mf=0,boost=0,spore=0,eg=0}={}){
  ilvl=Math.min(ilvl,MAX_SCALING_DEPTH);
  let base;
  if(rarity==='set'||(!rarity&&!uniqueId&&!baseId&&(rarity=rollRarity(mf,boost,ilvl))==='set')){ const it=makeSetItem(ilvl); if(it) return it; rarity='rare'; }
  if(uniqueId){ const u=UNIQUES.find(x=>x.id===uniqueId); base=BASES.find(b=>b.id===u.base); rarity='legendary'; }
  else if(baseId) base=BASES.find(b=>b.id===baseId);
  else base=eg&&rng.chance(Math.min(0.45,0.2+eg*0.015))?rng.pick(BASES.filter(b=>b.eg)):rng.pick(BASES.filter(b=>!b.eg&&b.min<=ilvl+1));
  rarity=rarity||rollRarity(mf,boost,ilvl);
  // v27b: pevný základ (překupník, odměny) – sadový/legendární jen pokud pro ten základ existuje, jinak vzácný (dřív vznikal fialový předmět bez vlastností nebo předmět jiného slotu)
  if(baseId&&!uniqueId&&rarity==='set'){ const ok=SETS.some(S=>S.pieces.some(pc=>pc.base===baseId)); if(ok){ for(let k=0;k<30;k++){ const st=makeSetItem(ilvl); if(st&&st.base===baseId) return st; } } rarity='rare'; }
  if(baseId&&!uniqueId&&rarity==='legendary'){ const us=UNIQUES.filter(u=>u.base===baseId&&!u.eg); if(us.length) return makeItem(ilvl,{uniqueId:rng.pick(us).id,eg}); rarity='rare'; }
  if(rarity==='rare'&&spore&&rng.chance(spore)) rarity='sporeborn';
  const it={uid:UID++,base:base.id,slot:base.slot,spr:base.spr,ilvl,rarity,aff:[],name:base.name}; if(eg) it.eg=eg;
  if(base.dmg){ const m=Math.pow(1.095,ilvl-1); const q=0.85+rng.next()*0.3; it.dmg=[Math.max(1,Math.round(base.dmg[0]*m*q)),Math.max(2,Math.round(base.dmg[1]*m*q))]; it.kind=base.kind; }
  it.imp={...(base.imp||{})}; if(it.imp.armor) it.imp.armor=Math.round(it.imp.armor*Math.pow(1.075,ilvl-1)); if(it.imp.life) it.imp.life=Math.round(it.imp.life*Math.pow(1.075,ilvl-1)); if(it.imp.mana) it.imp.mana=Math.round(it.imp.mana*Math.pow(1.06,ilvl-1));
  if(rarity==='legendary'){
    const u=uniqueId?UNIQUES.find(x=>x.id===uniqueId):eg&&rng.chance(0.25)?rng.pick(UNIQUES.filter(u=>u.eg==='map')):rng.pick(UNIQUES.filter(u=>!u.eg&&BASES.find(b=>b.id===u.base).min<=ilvl+4));
    if(u){ const ub=BASES.find(b=>b.id===u.base);
      if(ub.id!==base.id){ return makeItem(ilvl,{uniqueId:u.id,eg}); }
      it.unique=u.id; it.name=u.name; it.spr=u.spr;
      for(const [s,v] of Object.entries(u.fixed)){ const a=AFFIXES.find(a=>a.s===s); it.aff.push({id:'u_'+s,s,v:a?Math.round(scaleVal(a,ilvl,v)*10)/10:v,fixed:1}); }
      addAffixes(it,rng.int(1,2));
    } else { rarity=it.rarity='rare'; }
  }
  if(rarity==='magic'||rarity==='rare'||rarity==='sporeborn'){ const R=RARITY.find(r=>r.id===rarity); addAffixes(it,rng.int(R.aff[0],R.aff[1])); }
  if(rarity==='sporeborn'){ it.aff.forEach(a=>{ if(!a.fixed&&!['torch','skill','aoe'].includes(a.s)) a.v=Math.round(a.v*1.35*10)/10; }); it.aff.push({id:'sb',s:'skill',v:1}); }
  nameItem(it); return it;
}
function nameItem(it){
  const base=BASES.find(b=>b.id===it.base);
  if(it.rarity==='magic'){ const p=it.aff.find(a=>AFFIXES.find(x=>x.id===a.id)?.p==='P'); const s=it.aff.find(a=>AFFIXES.find(x=>x.id===a.id)?.p==='S');
    it.name=(p?AFFIXES.find(x=>x.id===p.id).name[0]+' ':'')+base.name.toLowerCase()+(s?' '+AFFIXES.find(x=>x.id===s.id).name[0]:'');
    it.name=it.name[0].toUpperCase()+it.name.slice(1); }
  else if(it.rarity==='rare'||it.rarity==='sporeborn') it.name=rng.pick(RARE_A)+' '+rng.pick(RARE_B).toLowerCase()+' · '+base.name.toLowerCase();
  else if(it.rarity==='common') it.name=base.name;
}
export function itemStats(it){ const s={...it.imp}; for(const a of it.aff) s[a.s]=(s[a.s]||0)+a.v; return s; }
export const rarityColor=r=>RARITY.find(x=>x.id===r)?.color||'#ccc';
export const rarityName=r=>RARITY.find(x=>x.id===r)?.name||'';
export function statLine(s,v){ const n=STAT_NAMES[s]||s; const vv=Math.round(v*10)/10; const sg=vv<0?'':'+';
  if(s==='skill'||s==='aoe'||s==='torch'||s==='reach') return `${sg}${vv} ${n.replace(/^\+ /,'')}`;
  return PCT.has(s)?`${sg}${vv} ${n.replace(/^% /,'% ')}`:`${sg}${fmt(vv)} ${n}`; }
export function itemValue(it){ if(it.type==='seed') return 10*it.tier; if(it.type==='frag') return 40; if(!it.base) return 3; return Math.max(1,Math.round((1+it.aff.length*2+(it.rarity==='legendary'?12:it.rarity==='sporeborn'?20:0))*(1+it.ilvl*0.15))); }
export function itemScore(it){ return it.aff.length*10+(it.dmg?(it.dmg[0]+it.dmg[1]):0)+(it.imp.armor||0); }
export function makeSupport(id){ id=id||rng.pick(Object.keys(SUPPORTS)); const s=SUPPORTS[id]; return {uid:UID++,type:'support',sup:id,name:'Runa: '+s.name,spr:s.spr,desc:s.desc}; }
let setCount=null, setHave=null; export function setTooltipCtx(cnt,have){ setCount=cnt; setHave=have; }
let egTip=null; export const setEgTip=f=>{ egTip=f; };
export function tooltipHTML(it,cmp){
  if((it.type==='seed'||it.type==='frag')&&egTip) return egTip(it);
  if(it.type==='support') return `<div class="tt-name" style="color:#7fe0c9">${it.name}</div><div class="tt-sub">Podpůrná runa · vlož do dovednosti [K]</div><div class="tt-line">${it.desc}</div>${it.fromWell?`<div class="tt-well">Vyloveno z Hnilobné studny · hodil: ${String(it.fromWell).replace(/[<>&]/g,'')}</div>`:''}<div class="tt-dim">Platí pro: ${SUPPORTS[it.sup].tags.map(t=>({single:'jednocílové',proj:'projektily',aoe:'plošné',attack:'útoky',spell:'kouzla',buff:'posílení',move:'pohyb',minion:'přisluhovači',summon:'vyvolávání'}[t])).join(', ')}</div>`;
  if(it.type==='potion') return `<div class="tt-name" style="color:#e66">${it.name}</div><div class="tt-sub">Doplní 1 náboj léčivého lektvaru</div>`;
  if(it.type==='tome') return `<div class="tt-name" style="color:#b9f">${it.name}</div><div class="tt-sub">Kniha dovednosti</div><div class="tt-line">${it.desc}</div><div class="tt-hint">Klikni pro naučení / zvýšení úrovně</div>`;
  const base=BASES.find(b=>b.id===it.base);
  let h=`<div class="tt-name" style="color:${rarityColor(it.rarity)}">${it.name}</div><div class="tt-sub">${rarityName(it.rarity)} · ${SLOT_NAMES[it.slot==='ring'?'ring1':it.slot]} · úroveň ${it.ilvl}${it.eg?` · <span class="tt-eg">Výtrusná mapa T${it.eg}</span>`:''}${BASES.find(b=>b.id===it.base)?.eg?' · <span class="tt-eg">hlubinný základ</span>':''}</div>`;
  if(it.dmg){ const k={melee:'Na blízko',bow:'Na dálku',staff:'Kouzelná'}[it.kind]; h+=`<div class="tt-main">${fmt(it.dmg[0])}–${fmt(it.dmg[1])} poškození <span class="tt-dim">${k}</span>`;
    if(cmp&&cmp.dmg){ const d=(it.dmg[0]+it.dmg[1])-(cmp.dmg[0]+cmp.dmg[1]); h+=` <span class="${d>=0?'up':'down'}">${d>=0?'▲':'▼'}</span>`; } h+='</div>'; }
  const imp=Object.entries(it.imp||{}); if(imp.length) h+='<div class="tt-imp">'+imp.map(([s,v])=>`<div>${statLine(s,v)}</div>`).join('')+'</div>';
  if(it.aff.length) h+='<div class="tt-aff">'+it.aff.map(a=>`<div class="${a.fixed?'fx':''}${a.corr?' cr':''}${a.curse?' cu':''}${a.conv?' cv':''}${a.t1?' t1':''}">${a.t1?'★ ':''}${statLine(a.s,a.v)}${a.conv?` <small>(dříve ${STAT_NAMES[a.from]||a.from})</small>`:''}${a.lk?' <small class="lk">· zamčeno</small>':''}</div>`).join('')+'</div>';
  if(it.unique){ const u=UNIQUES.find(x=>x.id===it.unique); h+=`<div class="tt-power">✦ ${u.power}</div>`; }
  if(it.set){ const S=SETS.find(x=>x.id===it.set); const n=setCount?.[it.set]||0; const have=setHave||new Set();
    h+=`<div class="tt-set"><b>${S.name}</b> (${n}/${S.pieces.length})${S.pieces.map((pc,i)=>`<div class="${have.has(it.set+':'+i)?'on':''}">${pc.name}</div>`).join('')}`;
    for(const t of [2,3]) h+=`<div class="sb ${n>=t?'on':''}">(${t}) ${Object.entries(S.bonus[t]).map(([k,v])=>statLine(k,v)).join(', ')}</div>`;
    h+=`<div class="sb ${n>=4?'on':''}">(4) ${S.power}</div></div>`; }
  if(it.fromWell) h+=`<div class="tt-well">Vyloveno z Hnilobné studny · hodil: ${String(it.fromWell).replace(/[<>&]/g,'')}</div>`;
  if(it.corrupted) h+=`<div class="tt-corr">ZKAŽENÝ${it.corr2?' DVAKRÁT':''} · ${corruptText(it.corrRes)}${it.corr2?' · '+corruptText(it.corr2):''}</div>`;
  if(cmp&&cmp!==it){ const a=itemStats(it), b=itemStats(cmp); const keys=new Set([...Object.keys(a),...Object.keys(b)]); const diff=[];
    for(const k of keys){ const d=(a[k]||0)-(b[k]||0); if(Math.abs(d)>0.05) diff.push(`<span class="${d>0?'up':'down'}">${d>0?'+':''}${Math.round(d*10)/10} ${STAT_NAMES[k]||k}</span>`); }
    if(diff.length) h+=`<div class="tt-cmp"><div class="tt-dim">Oproti nasazenému:</div>${diff.join('<br>')}</div>`; }
  return h;
}
// crafting
export function rerollCost(it){ return Math.ceil(itemValue(it)*1.5); }
export function upgradeCost(it){ return it.rarity==='common'?Math.ceil(6+it.ilvl):it.rarity==='magic'?Math.ceil(20+it.ilvl*3):null; }
export function craftReroll(it){ const keep=it.aff.filter(a=>a.fixed||a.id==='sb'||a.lk); const n=it.aff.length-keep.length; it.aff=keep; addAffixes(it,Math.max(1,n)); if(it.rarity==='sporeborn') it.aff.forEach(a=>{ if(!a.fixed&&a.id!=='sb'&&!['torch','skill','aoe'].includes(a.s)) a.v=Math.round(a.v*1.35*10)/10; }); if(it.rarity!=='legendary') nameItem(it); }
export function craftUpgrade(it){ if(it.rarity==='common'){ it.rarity='magic'; addAffixes(it,rng.int(1,2)); } else if(it.rarity==='magic'){ it.rarity='rare'; addAffixes(it,rng.int(1,3)); } nameItem(it); }
export function craftExalt(it){ addAffixes(it,1); }
// v17 Přeroubování: vyměň jednu vlastnost za novou, nová se zamkne (nejde znovu přeroubovat a přežije Přeměnu vlastností)
export function reforgeCost(it){ return Math.ceil(itemValue(it)*2); }
export const canReforge=a=>!a.fixed&&!a.corr&&!a.curse&&!a.lk&&a.id!=='sb';
export function craftReforge(it,idx){ const a=it.aff[idx]; if(!a||!canReforge(a)) return null; const rest=it.aff.filter((_,i)=>i!==idx); it.aff=rest; const before=it.aff.length; addAffixes(it,1);
  if(it.aff.length===before){ it.aff.splice(idx,0,a); return null; } const nw=it.aff.pop(); if(it.rarity==='sporeborn'&&!['torch','skill','aoe'].includes(nw.s)) nw.v=Math.round(nw.v*1.35*10)/10; nw.lk=1; it.aff.splice(idx,0,nw); return nw; }

// corruption (season craft). mild=true → drop-corruption without destroy/curse extremes
const CORR_TXT={nothing:'Zkaženo – beze změny.',implicit:'Zkažený implicit!',cursed:'Prokletí: něco skvělého, něco zlého.',lucky:'Šťastné prokletí!',convert:'Přeměna vlastnosti.',reroll:'Výtrusné přerození – silnější vlastnosti.',sporeborn:'Proměna ve Výtrusorozený!',destroyed:'Předmět se rozpadl v prach.'};
export const corruptText=r=>CORR_TXT[r]||r;
const scaleObj=(o,f,ilvl)=>Object.entries(o).map(([s,v])=>{ const a=AFFIXES.find(x=>x.s===s); let val=v*f; if(a&&a.sc==='exp'&&Math.abs(val)>=1) val=val*Math.pow(1.04,ilvl-1); return {id:'c_'+s,s,v:Math.round(val*10)/10,corr:1}; });
export function corruptItem(it,mild=false){
  if(!it.base||it.corrupted) return null; const r=Math.random(); let res;
  if(!mild&&r<0.06) res='destroyed';
  else if(r<0.26) res='nothing';
  else if(r<0.42){ res='implicit'; it.aff.push(...scaleObj(rng.pick(CORRUPT_IMPL),1,it.ilvl)); }
  else if(r<0.57&&!mild){ res='cursed'; it.aff.push(...scaleObj(rng.pick(CORRUPT_GOOD),1.25,it.ilvl)); it.aff.push(...scaleObj(rng.pick(CORRUPT_BAD),1,it.ilvl).map(a=>({...a,curse:1}))); }
  else if(r<0.67){ res='lucky'; const g=rng.shuffle(CORRUPT_GOOD.slice()); it.aff.push(...scaleObj(g[0],0.9,it.ilvl),...scaleObj(g[1],0.9,it.ilvl)); }
  else if(r<0.8){ res='convert'; const cands=it.aff.filter(a=>CONVERT_GROUPS.some(g=>g.includes(a.s))); if(cands.length){ const a=rng.pick(cands); const g=CONVERT_GROUPS.find(g=>g.includes(a.s)); const to=rng.pick(g.filter(x=>x!==a.s)); a.from=a.s; a.s=to; a.v=Math.round(a.v*1.15*10)/10; a.conv=1; } else { res='implicit'; it.aff.push(...scaleObj(rng.pick(CORRUPT_IMPL),1,it.ilvl)); } }
  else if(r<0.92){ res='reroll'; for(const a of it.aff) if(!a.fixed&&!a.corr&&!['torch','skill','aoe'].includes(a.s)) a.v=Math.round(a.v*1.3*10)/10; }
  else { res='sporeborn'; if(it.rarity!=='legendary'){ it.rarity='sporeborn'; addAffixes(it,1); } else it.aff.push(...scaleObj(rng.pick(CORRUPT_IMPL),1,it.ilvl)); }
  if(res!=='destroyed'){ it.corrupted=true; it.corrRes=res; }
  return res;
}

// v25 Dvojí hniloba: druhé zkažení (odemyká Kořenová síť). Ničí častěji.
export function corruptAgain(it){
  if(!it.base||!it.corrupted||it.corr2) return null;
  if(Math.random()<0.12) return 'destroyed';
  const first=it.corrRes; it.corrupted=false; let r=corruptItem(it,true); if(!r) r='nothing';
  it.corrupted=true; it.corrRes=first; it.corr2=r; return r;
}

// v27b: oprava starých rozbitých předmětů (sadová rarita bez sady = fialový bez vlastností) → vzácný s vlastnostmi
export function repairItem(it){ if(!it||!it.base||it.rarity!=='set'||it.set) return false; it.rarity='rare'; addAffixes(it,rng.int(3,5)); nameItem(it); return true; }
