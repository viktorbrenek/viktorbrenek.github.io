// DOM UI v2: HUD, panels (inventory, character, skills+supports, passive tree, craft), tooltips, modals, banners, boss bar
import {SKILLS,SUPPORTS,CLASSES,SLOTS,SLOT_NAMES,UNIQUES,PASSIVES,PASSIVE_MAP,KEYSTONES,STAT_NAMES,PCT,MON_MODS,LORE,SEASON,FORMS,SETS,skillsFor,GRAVE_MSGS,dailyMod} from './data.js';
import {tooltipHTML,rarityColor,itemValue,rerollCost,upgradeCost,craftReroll,craftUpgrade,craftExalt,statLine,corruptText,reforgeCost,canReforge,craftReforge} from './items.js';
import {fmt} from './util.js';
import {Game,Roster,Stash,STASH_MAX,LootFilter} from './game.js';
import {audio} from './audio.js';
import {LB} from './net.js';
import {NEWS,NEWS_LATEST} from './news.js';
import {Backup} from './backup.js';
const $=s=>document.querySelector(s);
const STAT_HELP={
  'Život':'Když klesne na nulu, padneš. Roste se Silou, úrovní a předměty. Část může být rezervovaná přisluhovači.',
  'Esence':'Platíš jí za dovednosti. Obnovuje se každý tah, mimo boj rychleji.',
  'Poškození zbraně':'Rozsah fyzického poškození tvé zbraně. Základ pro útoky a dovednosti se zbraní.',
  'Zvýšené poškození':'Součet všech „% poškození“. Fyzické a elementální bonusy se přičítají k příslušnému druhu zvlášť.',
  'Síla kouzel':'Základní poškození kouzel (roste s úrovní a holí) a v závorce procentní bonus z Důvtipu a předmětů.',
  'Kritický zásah':'Šance, že zásah bude kritický, a kolikrát silnější pak je (150 % = 1,5×).',
  'Násobič v čase / průraz':'Násobič zvyšuje jed, hoření a krvácení. Průraz snižuje odolnosti nepřátel vůči jedu, ohni a hnilobě.',
  'Zbroj':'Snižuje fyzické poškození. Proti slabým úderům víc, proti silným méně (nejvýš o 85 %).',
  'Úhyb / blok':'<b>Úhyb</b>: šance, že se útoku monstra úplně vyhneš (0 poškození). <b>Blok</b>: šance zásah zastavit štítem (0 poškození). Nepomáhají proti zónám na zemi ani proti jedu a krvácení, které už na tobě jsou.',
  'Odolnost jed / oheň / hniloba':'O kolik procent snížíš poškození daného živlu (nejvýš 75 %). Každých 5 pater hloubky je hlubina oslabuje – to je postih hloubky.',
  'Regenerace':'Kolik života se ti obnoví za tah. Mimo boj se navíc léčíš rychleji.',
  'Esence regen.':'Kolik esence se ti obnoví za tah.',
  'Život za zabití':'Kolik života dostaneš za každého zabitého nepřítele.',
  'Přisluhovači':'Bonusy tvých vyvolaných přisluhovačů.',
  'Daň přisluhovačů':'Každý živý přisluhovač si rezervuje část tvého maximálního života. Úprava ji snižuje.',
  'Podoba zvířete':'Bonusy, které platí jen v podobě zvířete.',
  'Pochodeň':'Dosah tvého světla v polích. Nepřátele ve tmě hůř vidíš a oni tebe taky.',
  'Šance otrávit / zapálit / krvácení':'Šance, že tvůj zásah způsobí jed, hoření nebo krvácení.',
  'Vysátí života':'Kolik procent způsobeného poškození se ti vrátí jako život.',
  'Kouzelné předměty':'Zvyšuje šanci, že z nepřátel padnou lepší předměty.',
  'Zkrácení přebíjení':'O kolik procent se zkrátí přebíjení dovedností.',
  'Další':'Ostatní bonusy z pasivního stromu a předmětů.',
};
const HUD_HELP={hp:['Život','Když klesne na nulu, padneš. Q vypije lektvar.'],mp:['Esence','Platíš jí za dovednosti.'],es:['Výtrusný štít','Pohlcuje poškození dřív než život a obnovuje se, když 2 tahy nedostaneš zásah.'],xp:['Zkušenosti','Postup k další úrovni.'],
  gold:['Zlato','Platíš jím u překupníka.'],dust:['Výtrusný prach','Získáš rozkládáním předmětů. Platíš jím na Oltáři hniloby a za přerozdělení stromu.'],cores:['Zkažená jádra','Z Plodnic pradávných, Zkažených jeskyní a skřítků. Na Oltáři hniloby jimi zkazíš předmět – může se zlepšit, proklít, nebo zničit.'],
  rp:['Odolnost vůči jedu','O kolik % snížíš jedové poškození. Hloubka ji snižuje.'],rf:['Odolnost vůči ohni','O kolik % snížíš ohnivé poškození. Hloubka ji snižuje.'],rd:['Odolnost vůči hnilobě','O kolik % snížíš hnilobné poškození. Hloubka ji snižuje.']};
const INTRO=cn=>[
  {t:'Ul-Myr',x:['Bylo jednou království, které rostlo dolů.','Ul-Myr stavělo své síně pod kořeny světa, kde houba nehnije, ale pamatuje. Své mrtvé nepohřbívalo. <b>Zasazovalo je.</b>']},
  {t:'Sklizeň',x:['Bohatství Ul-Myru rašilo v nejhlubších síních. Na podzemních polích se nezasazovali jen mrtví – i dlužníci, zajatci a děti, za které nikdo nezaplatil.','Z jejich těl rostly plodnice, které léčily, omlazovaly a prodávaly se králům celého světa. Nahoře se o tom nemluvilo. Nahoře se platilo.']},
  {t:'Šedá královna',x:['Královna Mirun nosila korunu z živé plodnice a slíbila, že její lid už nikdy nikoho neztratí. Pak se podhoubí naučilo hlad samo.','Velké Zakořenění pohltilo pole, síně i ty, kdo je hlídali. Mirun sestoupila do nejhlubší síně a zavřela za sebou bránu. Od té doby Ul-Myr roste dolů. Nekonečně dolů.']},
  {t:'Sestup',x:[`Nahoře zbyla jen zřícená brána a pověsti o pokladech pod ní. Sestupuješ jako <b>${cn}</b>.`,'Zapal pochodeň. Pochodeň není světlo – je to slib, že ještě nejsi jejich.','<small class="tt-dim">Každých 5 pater po poražení strážce je kontrolní bod. Když padneš, probudíš se v něm.</small>']},
];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SUPC='#7fe0c9';
const UI_=n=>`assets/ui/${n}.webp`; const IC=(n,c='ico')=>`<img class="${c}" src="${UI_(n)}">`;
export class UI{
  constructor(atlasImg,meta){ this.img=atlasImg; this.meta=meta; this.icons=new Map(); this.modal=null; this.panel=null; this.salvageMode=false; this.craftSel=null; this.selSkill=null; }
  icon(n,size=64){ const k=n+'@'+size; if(this.icons.has(k)) return this.icons.get(k); const s=this.meta.s[n]; if(!s) return '';
    const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d'); const sc=Math.min(size/s[2],size/s[3])*0.9; const w=s[2]*sc,h=s[3]*sc;
    x.imageSmoothingQuality='high'; x.drawImage(this.img,s[0],s[1],s[2],s[3],(size-w)/2,(size-h)/2,w,h); const u=c.toDataURL(); this.icons.set(k,u); return u; }
  bind(g){ this.pend={attr:[],pas:[]}; if(this.bound){ this.g=g; g.ui=this; document.body.classList.add('ingame'); this.panel=null; this.renderPanel(); this.buildHUD(); this.refresh(); this.onLog(); return; } this.bound=true; document.addEventListener('click',e=>{ if(e.target.closest('button,.slot,.skc,.link,[data-node],.sk')) audio.play('ui_click'); },true); document.addEventListener('mouseover',e=>{ if(e.target.closest&&e.target.closest('button,.slot,.sk')) audio.play('hover'); }); this.wireHudTips(); this.g=g; g.ui=this; document.body.classList.add('ingame'); this.buildHUD(); this.refresh(); this.onLog(); }
  buildHUD(){
    $('#skillbar').innerHTML=[0,1,2,3].map(i=>`<div class="sk" data-i="${i}"><img><div class="cd"></div><span class="key">${i+1}</span><span class="mc"></span><span class="sups"></span></div>`).join('')+
      `<div class="sk pot" id="potion"><img src="${this.icon('pot_red',64)}"><span class="key">Q</span><span class="cnt"></span></div>`+
      `<div class="btns"><button data-p="inv" title="Inventář [I]"><img src="${UI_('i_inventory')}"><span>I</span></button><button data-p="char" title="Postava [C]"><img src="${UI_('i_character')}"><span>C</span><b class="pts" id="ptsC"></b></button><button data-p="skills" title="Dovednosti a runy [K]"><img src="${UI_('i_skills')}"><span>K</span></button><button data-p="tree" title="Pasivní strom [P]"><img src="${UI_('i_tree')}"><span>P</span><b class="pts" id="ptsP"></b></button></div>`;
    document.querySelectorAll('#skillbar .sk[data-i]').forEach(el=>{ el.onclick=()=>this.onSkillKey(+el.dataset.i); el.onmouseenter=e=>{ const id=this.g.player.bar[+el.dataset.i]; if(id) this.tip(this.skillTip(id),e); }; el.onmouseleave=()=>this.tip(null); });
    $('#potion').onclick=()=>{ if(this.g.canAct()) this.g.quaff(); };
    document.querySelectorAll('#skillbar .btns button').forEach(b=>b.onclick=()=>this.toggle(b.dataset.p));
  }
  skillTip(id){ const s=SKILLS[id], g=this.g, L=g.skillLevel(id); const su=[...g.sups(id)];
    const cl=s.cls==='*'?'Univerzální':CLASSES.find(c=>c.id===s.cls)?.name||'';
    return `<div class="tt-name" style="color:#b9f">${s.name}</div><div class="tt-sub">${cl}${s.needForm?' · '+FORMS[s.needForm].name:''}</div><div class="tt-sub">Úroveň ${L} · ${g.skillCost(id)} ${g.usesLife()?'života':'esence'} · přebíjení ${s.cd}</div><div class="tt-line">${s.desc}</div>${su.length?`<div class="tt-aff" style="color:${SUPC}">${su.map(x=>'◆ '+SUPPORTS[x].name).join('<br>')}</div>`:''}<div class="tt-dim">+12 % účinnosti za úroveň</div>`; }
  monTip(m){ const col=m.boss||m.unique?'#f08a3c':m.rarity==='rare'?'#f2d36b':m.rarity==='magic'?'#7fa8ff':'#eee';
    const mods=m.mods.map(id=>{ const d=MON_MODS.find(x=>x.id===id); return d?d.name+(d.desc?` (${d.desc})`:''):id; }).join(', ');
    const res=['poison','fire','decay'].filter(k=>m.res[k]).map(k=>`${{poison:'jed',fire:'oheň',decay:'hniloba'}[k]} ${m.res[k]} %`).join(' · ');
    return `<div class="tt-name" style="color:${col}">${esc(m.name)}</div><div class="tt-sub">Život ${fmt(Math.ceil(m.hp))} / ${fmt(Math.ceil(m.maxhp))}${m.el?' · útočí: '+{poison:'jed',fire:'oheň',decay:'hniloba'}[m.el]:''}</div>${mods?`<div class="tt-aff">${mods}</div>`:''}${res?`<div class="tt-dim">Odolnosti: ${res}</div>`:''}`; }
  onSkillKey(i){ const g=this.g; if(!g.canAct()) return; const id=g.player.bar[i]; if(!id) return; const s=SKILLS[id];
    if(s.target==='self'){ g.useSkill(id); g.targeting=null; return; }
    if(s.target==='adjacent'){ const adj=g.monsters.filter(m=>m.hp>0&&Math.max(Math.abs(m.x-g.player.x),Math.abs(m.y-g.player.y))<=1+g.player.stats.reach&&g.canSee(m)); if(adj.length===1){ g.useSkill(id,adj[0].x,adj[0].y); return; } }
    if(s.target==='enemy'&&!g.targeting){ const vis=g.visibleEnemies().filter(m=>Math.hypot(m.x-g.player.x,m.y-g.player.y)<=s.range+0.5); if(vis.length===1){ g.useSkill(id,vis[0].x,vis[0].y); return; } }
    if(s.target==='tile'&&id!=='blink'&&!g.targeting){ const vis=g.visibleEnemies().filter(m=>Math.hypot(m.x-g.player.x,m.y-g.player.y)<=s.range+0.5); if(vis.length===1){ g.useSkill(id,vis[0].x,vis[0].y); return; } }
    g.targeting=g.targeting===id?null:id; if(g.targeting) g.log(`${s.name}: vyber cíl kliknutím (Esc zruší).`,'hint'); this.refresh(); }
  refresh(){ const g=this.g; if(!g?.player) return; const p=g.player, st=p.stats;
    $('#hp .fill').style.width=(p.hp/st.life*100)+'%'; $('#hp .txt').textContent=`${fmt(p.hp)} / ${fmt(st.life)}`+(st.reserve>0?` · rez. ${Math.round(st.reserve*100)} %`:'');
    $('#mp').style.display=st.mana>0?'':'none'; if(st.mana>0){ $('#mp .fill').style.width=(p.mp/st.mana*100)+'%'; $('#mp .txt').textContent=`${fmt(p.mp)} / ${fmt(st.mana)}`; }
    $('#xp .fill').style.width=(p.xp/g.xpNeed()*100)+'%';
    $('#lvl').textContent=p.lvl; $('#depth').textContent=`Hloubka ${g.depth}`; $('#biome').textContent=g.map.biome.name+(g.floorMods?' · '+g.floorMods.name:'')+(g.map.event?' · '+({storm:'Bouře',nest:'Hnízdo',cursed:'Prokletí',hunter:'Lovec',blackout:'Zatmění'}[g.map.event]):'');
    $('#gold').textContent=fmt(p.gold); $('#dust').textContent=fmt(p.dust); $('#cores').textContent=fmt(p.cores||0);
    $('#es').style.display=st.esMax?'':'none'; if(st.esMax){ $('#es .fill').style.width=((p.es||0)/st.esMax*100)+'%'; $('#es .txt').textContent=`${fmt(p.es||0)} / ${fmt(st.esMax)}`; }
    $('#res').innerHTML=`<span class="rp" data-tip="rp">${IC('i_rpoison')}${Math.round(st.resPoison)}%</span><span class="rf" data-tip="rf">${IC('i_rfire')}${Math.round(st.resFire)}%</span><span class="rd" data-tip="rd">${IC('i_rdecay')}${Math.round(st.resDecay)}%</span>`;
    const mc={}; for(const mn of g.minions) if(mn.hp>0) mc[mn.name]=(mc[mn.name]||0)+1;
    $('#status').innerHTML=[...(p.form?[`<span class="buff form">${IC('i_buff')}${FORMS[p.form].name}</span>`]:[]),...Object.entries(mc).map(([n,c])=>`<span class="buff minion">${IC('i_skills')}${n} ×${c}</span>`),...p.buffs.map(b=>`<span class="buff">${IC('i_buff')}${b.name} ${b.turns}</span>`),...Object.entries(p.status).map(([k,v])=>`<span class="debuff">${IC({poison:'i_poison',burn:'i_burn',bleed:'i_bleed',root:'i_root',slow:'i_debuff'}[k]||'i_debuff')}${{poison:'Otráven',burn:'Hoříš',bleed:'Krvácíš',root:'Zakořeněn',slow:'Zpomalen'}[k]||k} ${v.turns??v}</span>`)].join('');
    document.querySelectorAll('#skillbar .sk[data-i]').forEach(el=>{ const id=p.bar[+el.dataset.i]; const img=el.querySelector('img');
      if(id){ img.src=this.icon(SKILLS[id].icon,64); img.style.display=''; const cd=p.cds?.[id]||0; el.querySelector('.cd').textContent=cd?cd:''; el.classList.toggle('cooling',cd>0); el.classList.toggle('nomana',!g.canPay(g.skillCost(id))); el.querySelector('.mc').textContent=g.skillCost(id); el.classList.toggle('armed',g.targeting===id); el.querySelector('.sups').textContent='◆'.repeat(g.sups(id).size); }
      else { img.style.display='none'; el.querySelector('.cd').textContent=''; el.querySelector('.mc').textContent=''; el.querySelector('.sups').textContent=''; } });
    $('#potion .cnt').textContent=`${p.potions}/${p.potionMax}`; $('#potion').classList.toggle('empty',p.potions<=0);
    $('#ptsC').textContent=p.points||''; $('#ptsP').textContent=p.ppoints||'';
    const b=g.bossRef&&g.bossRef.hp>0&&g.bossRef.aware?g.bossRef:g.monsters.find(m=>(m.unique||m.nest)&&m.aware&&g.canSee(m));
    const bb=$('#bossbar'); if(b){ bb.style.display='block'; bb.querySelector('.n').textContent=b.name+(b.enraged?' · ZUŘÍ':''); bb.querySelector('.fill').style.width=(b.hp/b.maxhp*100)+'%'; } else bb.style.display='none';
    if(this.panel&&this.panel!=='tree') this.renderPanel(); else if(this.panel==='tree') this.updateTreeHead(); }
  onFloor(){ this.refresh(); }
  onLog(){ const g=this.g; if(!g) return; const el=$('#log'); el.innerHTML=g.msgs.slice(-7).map(m=>{ let c=m.c, st=''; if(c.startsWith('loot:')){ const r=c.slice(5); st=`style="color:${r==='support'?SUPC:r==='tome'?'#b9f':rarityColor(r)}"`; c='loot'; } return `<div class="m ${c}" ${st}>${esc(m.t)}</div>`; }).join(''); }
  banner(t,sub){ const b=$('#banner'); b.innerHTML=`<b>${esc(t)}</b>${sub?`<span>${esc(sub)}</span>`:''}`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
  tip(html,e){ const t=$('#tooltip'); if(!html){ t.style.display='none'; t.classList.remove('wide'); return; } t.classList.toggle('wide',html.includes('tt-wrap')); t.innerHTML=html; t.style.display='block'; if(e) this.moveTip(e); }
  itemTip(it){ const g=this.g, p=g?.player; if(!it||!it.base||!p) return tooltipHTML(it);
    const slots=it.slot==='ring'?['ring1','ring2']:[it.slot]; const eq=slots.map(s=>p.equip[s]).filter(x=>x&&x!==it);
    if(Object.values(p.equip).includes(it)) return tooltipHTML(it);
    const target=it.slot==='ring'?(!p.equip.ring1?'ring1':!p.equip.ring2?'ring2':'ring1'):it.slot;
    const sum=this.swapSummary(it,target);
    const left=`<div class="tt-col">${tooltipHTML(it,p.equip[target])}${sum}</div>`;
    if(!eq.length) return `<div class="tt-wrap">${left}</div>`;
    return `<div class="tt-wrap">${left}${eq.map(e=>`<div class="tt-col eq"><div class="tt-eqh">Nasazeno${slots.length>1?(e===p.equip[target]?' · nahradí se':''):''}</div>${tooltipHTML(e)}</div>`).join('')}</div>`; }
  swapSummary(it,slot){ const d=this.g.previewSwap(it,slot); if(!d) return ''; const fm=v=>Math.abs(v)>=10?Math.round(v):Math.round(v*10)/10;
    const rows=[['life','Život'],['mana','Esence'],['wdmg','Poškození zbraně'],['spellPow','Síla kouzel'],['dmgPct','% poškození'],['crit','% krit. šance'],['critMult','% krit. násobič'],['armor','Zbroj'],['dodge','% úhyb'],['block','% blok'],['resPoison','% odol. jed'],['resFire','% odol. oheň'],['resDecay','% odol. hniloba'],['dot','% poškození v čase'],['regen','Regenerace / tah'],['minionDmg','% přisluhovači']]
      .filter(([k])=>Math.abs(d[k]||0)>=0.05).map(([k,n])=>`<span class="${d[k]>0?'up':'down'}">${d[k]>0?'▲ +':'▼ '}${fm(d[k])} ${n}</span>`);
    return `<div class="tt-cmp"><div class="tt-dim">Když si ho nasadíš:</div>${rows.length?rows.join('<br>'):'<span class="tt-dim">beze změny hlavních hodnot</span>'}</div>`; }
  // ---- pending allocations (confirm / cancel) ----
  commitPending(kind){ const P=this.pend; if(!P) return; let any=false; for(const k of kind?[kind]:['attr','pas']) if(P[k]?.length){ P[k]=[]; any=true; }
    if(any){ this.g?.save?.(); if(this.panel==='char') this.renderPanel(); else if(this.panel==='tree'){ this.drawTree(); this.updateTreeHead(); } } }
  cancelPending(kind){ const P=this.pend, g=this.g, p=g?.player; if(!P||!p) return;
    if(kind==='attr'){ for(const k of P.attr.reverse()){ p.base[k]--; p.points++; } P.attr=[]; g.recalc(); this.renderPanel(); }
    if(kind==='pas'){ for(const id of P.pas.reverse()) g.unalloc(id); P.pas=[]; this.drawTree(); this.updateTreeHead(); }
    this.refresh(); }
  // ---- HUD tooltips ----
  wireHudTips(){ const hud=$('#hud'); if(!hud||hud._tips) return; hud._tips=true;
    hud.addEventListener('mouseover',e=>{ const t=e.target.closest?.('[data-tip]'); if(!t) return; const k=t.dataset.tip; const h=HUD_HELP[k]; if(h) this.tip(`<div class="tt-name">${h[0]}</div><div class="tt-line">${h[1]}</div>`,e); });
    hud.addEventListener('mouseout',e=>{ const t=e.target.closest?.('[data-tip]'); if(t&&!t.contains(e.relatedTarget)) this.tip(null); });
    hud.addEventListener('mousemove',e=>{ if(e.target.closest?.('[data-tip]')) this.moveTip(e); }); }
  // ---- first-time hints ----
  hint(key,html){ let seen={}; try{ seen=JSON.parse(localStorage.getItem('sporium_tips')||'{}'); }catch(e){} if(seen[key]) return; seen[key]=1; try{ localStorage.setItem('sporium_tips',JSON.stringify(seen)); }catch(e){}
    let el=$('#gtip'); if(!el){ el=document.createElement('div'); el.id='gtip'; document.body.appendChild(el); }
    el.innerHTML=`<b>Tip</b><div>${html}</div><button>Rozumím</button>`; el.classList.add('on'); el.querySelector('button').onclick=()=>el.classList.remove('on'); clearTimeout(this._gtT); this._gtT=setTimeout(()=>el.classList.remove('on'),20000); }
  // ---- intro story ----
  introModal(cls,back){ if(!back&&localStorage.getItem('sporium_intro_off')) return; const cn=CLASSES.find(c=>c.id===cls)?.name||'poutník'; let i=0;
    const pages=INTRO(cn); const show=()=>{ const pg=pages[i];
      this.showModal(`<div class="intro"><div class="ipg">${i+1} / ${pages.length}</div><h2>${pg.t}</h2>${pg.x.map(x=>`<p>${x}</p>`).join('')}</div>
        <div class="pmenu"><button class="big" id="in-n">${i<pages.length-1?'Dál':'Sestoupit'}</button>${i<pages.length-1?'<button class="big" id="in-s">Přeskočit</button>':''}</div>${back?'':`<label class="lfo inoff"><input type="checkbox" id="in-off"> Úvod u dalších postav už neukazovat</label>`}`,
        m=>{ const fin=()=>{ if(m.querySelector('#in-off')?.checked) try{ localStorage.setItem('sporium_intro_off','1'); }catch(e){} if(back) back(); else this.hideModal(); };
          m.querySelector('#in-n').onclick=()=>{ if(i<pages.length-1){ const off=m.querySelector('#in-off')?.checked; i++; show(); if(off){ const c=$('#modal #in-off'); if(c) c.checked=true; } } else fin(); };
          m.querySelector('#in-s')&&(m.querySelector('#in-s').onclick=fin); }); }; show(); }
  // ---- soukromí (GDPR) – při změně ukládaných dat uprav i RETENTION ve workeru ----
  privacyModal(back){ const on=LB.enabled();
    this.showModal(`<h2>Soukromí</h2><div class="privacy">
      <p><b>Kdo:</b> hru provozuje Viktor Břenek, <a href="mailto:viktorbrenek@gmail.com">viktorbrenek@gmail.com</a>. Žádné cookies, analytika ani reklama.</p>
      <h3>V tvém prohlížeči</h3><p>Postavy, sdílená truhla, nastavení a náhodný klíč hráče se ukládají jen u tebe (localStorage) a nikam se neposílají, dokud nezapneš online funkce. Smažeš je vymazáním dat tohoto webu v prohlížeči.</p>
      ${on?`<h3>Online – jen když použiješ přezdívku nebo zálohu</h3>
      <ul><li><b>Žebříček sezóny</b>: přezdívka, třída, hloubka, úroveň, zabití a čas hraní. Drží se po dobu sezóny.</li>
      <li><b>Denní hlubina</b>: totéž pro daný den, maže se po 90 dnech.</li>
      <li><b>Hroby</b>: přezdívka, kdo tě zabil a vybraný vzkaz. Maže se po 180 dnech.</li>
      <li><b>Hnilobná studna</b>: hozený předmět s přezdívkou. Maže se po 365 dnech.</li>
      <li><b>Záloha savu</b>: tvoje postavy pod kódem zálohy. Maže se 180 dní po poslední aktualizaci.</li>
      <li>Tvůj klíč hráče server zná jen jako hash. <b>IP adresu neukládáme</b>: při obnově zálohy se z ní kvůli ochraně proti zneužití počítá hash, který se každý den mění a po 3 dnech se maže.</li></ul>
      <p>Data běží na Cloudflare (Workers a D1) jako zpracovateli. Web hostuje GitHub Pages, který může krátce logovat IP adresy kvůli bezpečnosti. Online data zpracováváme proto, že sis funkci sám zapnul a bez nich by nefungovala.</p>
      <p class="warn">Přezdívka je veřejně vidět. <b>Nepoužívej své skutečné jméno.</b></p>
      <h3>Tvoje práva</h3><p>Můžeš chtít přístup ke svým datům, jejich opravu nebo smazání. Stačí napsat e-mail (vyřídíme do 30 dnů), nebo smazat vše hned tlačítkem níže. Stížnost můžeš podat u <a href="https://uoou.gov.cz" target="_blank" rel="noopener">ÚOOÚ</a>.</p>`:''}
      </div><div class="bkmsg hint"></div><div class="pmenu">${on?'<button class="big" id="pv-del">Smazat moje online data</button>':''}<button class="big" id="pv-back">Zpět</button></div>`,
    m=>{ m.querySelector('#pv-back').onclick=()=>back?back():this.hideModal();
      const del=m.querySelector('#pv-del'); if(del) del.onclick=async()=>{ if(!del.dataset.sure){ del.dataset.sure='1'; del.textContent='Opravdu smazat? Klikni znovu'; return; }
        del.disabled=true; const r=await LB.forget(); const msg=m.querySelector('.bkmsg');
        if(!r?.ok){ msg.innerHTML='<span style="color:#ff8a7a">Smazání se nepovedlo (jsi offline?). Zkus to znovu, nebo napiš e-mail.</span>'; del.disabled=false; return; }
        // nic dalšího se už neodešle: zrušíme přezdívky a automatickou zálohu
        try{ const R=Roster.all(); for(const c of Object.values(R.chars)){ c.player.nick=''; c.player.nickAsked=true; } localStorage.setItem('sporium_roster_v1',JSON.stringify(R)); }catch(e){}
        if(this.g?.player){ this.g.player.nick=''; this.g.player.nickAsked=true; } LB.setDefaultNick(''); Backup.setAuto(false); try{ localStorage.removeItem('sporium_backup_code'); localStorage.removeItem('sporium_backup_last'); }catch(e){}
        msg.innerHTML='Hotovo. Tvoje online data jsou smazaná a přezdívky odebrané. Postavy v prohlížeči zůstaly.'; del.remove(); }; }); }
  // ---- backup (file + cloud code) ----
  backupModal(back,beforeSave){ beforeSave?.(); const code=Backup.code(), on=Backup.enabled(); const last=Backup.lastTime();
    this.showModal(`<h2>Záloha postav</h2><p class="hint">Hra se ukládá jen v tomto prohlížeči. Když si mažeš historii nebo hraješ jinde, zálohuj si postavy – souborem, nebo kódem.</p>
      <div class="bk"><div class="bkc"><b>Soubor</b><p>Stáhne všechny postavy, sdílenou truhlu i přezdívku do jednoho souboru.</p><button id="bk-dl">Stáhnout zálohu</button><button id="bk-ul">Nahrát zálohu ze souboru</button><input type="file" id="bk-file" accept=".json,application/json" hidden></div>
      ${on?`<div class="bkc"><b>Kód zálohy</b><p>Uloží zálohu na server a dá ti kód. Kódem si postavy obnovíš kdekoli. Pak se záloha sama obnovuje zhruba každých 10 minut hraní. Na serveru se drží 180 dní od poslední aktualizace (viz Soukromí).</p>
        ${code?`<div class="bkcode">${code}</div><small class="tt-dim">${last?'Naposledy uloženo '+new Date(last).toLocaleString('cs-CZ'):''}</small>`:''}<button id="bk-up">${code?'Uložit zálohu teď':'Vytvořit kód zálohy'}</button>
        <div class="bkr"><input id="bk-code" placeholder="Obnovit z kódu: XXXXX-XXXXX" maxlength="11" autocomplete="off"><button id="bk-rs">Obnovit</button></div></div>`:''}</div>
      <div class="bkmsg hint"></div><div class="pmenu"><button class="big" id="bk-back">Zpět</button></div>`,
      m=>{ const msg=t=>m.querySelector('.bkmsg').innerHTML=t;
        const confirmApply=(d,src)=>{ const n=Backup.count(d); this.showModal(`<h2>Obnovit zálohu?</h2><p class="hint">Záloha (${src}) obsahuje <b>${n}</b> ${n===1?'postavu':n<5?'postavy':'postav'}. <b>Nahradí</b> všechny postavy a truhlu v tomto prohlížeči.</p><div class="pmenu"><button class="big" id="cf-ok">Obnovit</button><button class="big" id="cf-no">Zpět</button></div>`,
          mm=>{ mm.querySelector('#cf-ok').onclick=()=>{ Backup.apply(d); location.reload(); }; mm.querySelector('#cf-no').onclick=()=>this.backupModal(back); }); };
        m.querySelector('#bk-dl').onclick=()=>{ Backup.download(); msg('Záloha stažena.'); };
        const f=m.querySelector('#bk-file'); m.querySelector('#bk-ul').onclick=()=>f.click(); f.onchange=async()=>{ try{ confirmApply(await Backup.readFile(f.files[0]),'soubor'); }catch(e){ msg('<span class="down">Tohle není platná záloha Sporia.</span>'); } };
        m.querySelector('#bk-up')&&(m.querySelector('#bk-up').onclick=async()=>{ msg('Ukládám…'); const r=await Backup.cloudSave(); if(r?.ok&&r.code) this.backupModal(back); else msg(`<span class="down">Uložení se nepovedlo (${esc(String(r?.error||r?.status||'offline'))}). Zkus to za chvíli.</span>`); });
        const ci=m.querySelector('#bk-code'); if(ci){ ci.onkeydown=e=>e.stopPropagation(); m.querySelector('#bk-rs').onclick=async()=>{ const c=ci.value.trim(); if(c.replace(/[^A-Za-z0-9]/g,'').length!==10){ msg('<span class="down">Kód má 10 znaků, např. K7QXM-3PZ9A.</span>'); return; } msg('Hledám zálohu…'); const r=await Backup.cloudRestore(c); if(r.ok) confirmApply(r.data,'kód '+esc(c.toUpperCase())); else msg(`<span class="down">${r.error===404||r.error==='not found'?'Záloha s tímto kódem neexistuje.':'Obnovení se nepovedlo – zkus to znovu.'}</span>`); }; }
        m.querySelector('#bk-back').onclick=back; }); }
  newsHTML(max){ const seen=+(localStorage.getItem('sporium_news_seen')||0); return NEWS.slice(0,max||NEWS.length).map(n=>`<div class="nw ${n.v>seen?'new':''}"><div class="nwh"><b>${n.t}</b><small>${n.d}${n.v>seen?' · <i>nové</i>':''}</small></div><ul>${n.i.map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join(''); }
  markNewsSeen(){ try{ localStorage.setItem('sporium_news_seen',NEWS_LATEST); }catch(e){} }
  lootModal(back){ const f=LootFilter.get(); const opt=(v,t)=>`<label class="lfo"><input type="radio" name="lfmin" value="${v}" ${f.min===v?'checked':''}> ${t}</label>`;
    this.showModal(`<h2>Filtr kořisti</h2><p class="hint">Předměty, které filtrem neprojdou, se na zemi nezobrazí, nesebereš je chůzí a neukáže se jejich popisek. Podržením <b>Alt</b> je uvidíš a sebereš i tak. Legendární, sadové a výtrusorozené předměty, zlato a lektvary se ukazují vždy.</p>
      <div class="lf"><b>Vybavení: ukazovat od</b>${opt('common','Všechno (i obyčejné)')}${opt('magic','Kouzelné a lepší')}${opt('rare','Vzácné a lepší')}${opt('legendary','Jen legendární a sady')}
      <b>Ostatní</b><label class="lfo"><input type="checkbox" id="lf-r" ${f.runes?'checked':''}> Runy</label><label class="lfo"><input type="checkbox" id="lf-t" ${f.tomes?'checked':''}> Knihy dovedností</label></div>
      <div class="pmenu"><button class="big" id="lf-ok">Uložit</button><button class="big" id="lf-back">Zpět</button></div>`,
      m=>{ m.querySelector('#lf-ok').onclick=()=>{ const nf={min:m.querySelector('input[name=lfmin]:checked')?.value||'common',runes:m.querySelector('#lf-r').checked,tomes:m.querySelector('#lf-t').checked}; LootFilter.set(nf); if(this.g) this.g._lf=null; back(); }; m.querySelector('#lf-back').onclick=back; }); }
  newsModal(back){ this.showModal(`<h2>Novinky</h2><div class="newslist">${this.newsHTML()}</div><div class="pmenu"><button class="big" id="nw-back">Zpět</button></div>`,m=>{ this.markNewsSeen(); m.querySelector('#nw-back').onclick=back; }); }
  moveTip(e){ const t=$('#tooltip'); if(t.style.display!=='block') return; const w=t.offsetWidth,h=t.offsetHeight; let x=e.clientX+18,y=e.clientY+14; if(x+w>innerWidth-8) x=e.clientX-w-14; if(y+h>innerHeight-8) y=innerHeight-h-8; t.style.left=x+'px'; t.style.top=Math.max(8,y)+'px'; }
  // ---------- panels ----------
  toggle(p){ if(this.modal) return; this.commitPending(); audio.play(this.panel===p?'close':'open'); this.panel=this.panel===p?null:p; this.salvageMode=false; this.renderPanel(); }
  close(){ this.commitPending(); if(this.panel) audio.play('close'); this.panel=null; this.renderPanel(); this.tip(null); }
  renderPanel(){ this.tip(null); const el=$('#panel'); el.classList.toggle('wide',this.panel==='tree'); if(!this.panel){ el.style.display='none'; el.innerHTML=''; return; } el.style.display='block';
    const f={well:()=>this.wellHTML(),inv:()=>this.invHTML(),char:()=>this.charHTML(),skills:()=>this.skillsHTML(),craft:()=>this.craftHTML(),tree:()=>this.treeHTML(),lore:()=>this.loreHTML(),shop:()=>this.shopHTML()}[this.panel];
    el.innerHTML=`<button class="x">✕</button>`+f(); el.querySelector('.x').onclick=()=>this.close(); this.wirePanel(el); }
  slotHTML(it,attrs,eq){ if(!it) return `<div class="slot empty" ${attrs} ${eq?`style="background-image:url(${UI_('eq_'+(eq==='ring2'?'ring1':eq))})"`:''}></div>`; const c=it.rarity?rarityColor(it.rarity):it.type==='tome'?'#b9f':it.type==='support'?SUPC:'#e66'; return `<div class="slot r-${it.rarity||it.type||'x'}" style="--rc:${c}" ${attrs}><img src="${this.icon(it.spr,64)}"></div>`; }
  invHTML(){ const p=this.g.player; const offX=p.stats?.ks?.has('apex'); const eq=SLOTS.map(s=>`<div class="eqs ${offX&&s==='offhand'?'offx':''}" ${offX&&s==='offhand'?'title="Vrcholový predátor: druhá ruka nedává bonusy"':''}><label>${SLOT_NAMES[s]}${offX&&s==='offhand'?' ✕':''}</label>${this.slotHTML(p.equip[s],`data-eq="${s}"`,s)}</div>`).join('');
    const bag=Array.from({length:30},(_,i)=>this.slotHTML(p.inv[i],`data-inv="${i}"`)).join('');
    return `<h2>Inventář</h2><div class="inv"><div class="equip">${eq}</div><div><div class="bag">${bag}</div>
      <div class="invbar"><span>${IC('i_gold')} ${fmt(p.gold)}</span><span class="dust">${IC('i_dust')} ${fmt(p.dust)} prachu</span><button class="sal ${this.salvageMode?'on':''}">${this.salvageMode?'Rozkládání: ZAP':'Rozložit předměty'}</button><button class="salall">Rozložit obyčejné a kouzelné</button></div>
      <div class="hint">Klik = nasadit / použít · Shift+klik = rozložit · Pravý klik na nasazený = sundat · Runy vkládej v [K]</div></div></div>`; }
  charHTML(){ const g=this.g,p=g.player,st=p.stats; const at=(k,n,d)=>`<div class="attr"><b>${n}</b><span>${Math.round(st[k])}</span>${p.points?`<button data-attr="${k}">+</button>`:''}<small>${d}</small></div>`;
    const row=(n,v)=>`<div class="row" data-h="${n}"><span>${n}</span><b>${v}</b></div>`; const pct=v=>Math.round(v*10)/10+' %'; const rc=v=>`<b class="${v<0?'down':v>=60?'up':''}">${Math.round(v)} %</b>`;
    return `<h2>${CLASSES.find(c=>c.id===p.cls).name} · úroveň ${p.lvl}</h2><div class="char"><div><div class="pts">Volné body: <b>${p.points}</b></div>${this.pend?.attr?.length?`<div class="pendbar">Rozděleno ${this.pend.attr.length} ${this.pend.attr.length===1?'bod':this.pend.attr.length<5?'body':'bodů'} <button data-pend="ok:attr">Potvrdit</button><button data-pend="x:attr">Zrušit</button></div>`:''}
      ${at('might','Síla','+1 % dmg na blízko, +1,5 života')}${at('finesse','Obratnost','+krit, úhyb, zbroj, dmg luků')}${at('wits','Důvtip','+esence, +1,2 % síla kouzel')}
      <div class="sub">Hloubka: ${g.depth} · Nejhlouběji: ${g.best} · Kontrolní bod: ${g.checkpoint} · Zabito: ${fmt(g.kills)}</div>
      ${(()=>{ const t=CLASSES.find(c=>c.id===p.cls)?.trait; return t?`<div class="pw trait">◈ <b>${t.name}:</b> ${t.desc}</div>`:''; })()}
      ${[...st.ks].filter(k=>KEYSTONES[k]).map(k=>`<div class="pw ks">⬢ ${KEYSTONES[k]}</div>`).join('')}
      ${Object.entries(st.setCnt||{}).map(([sid,n])=>{ const S=SETS.find(x=>x.id===sid); return S?`<div class="pw set">❖ ${S.name} (${n}/4)${n>=4?': '+S.power:''}</div>`:''; }).join('')}</div>
      <div class="stats">${row('Život',fmt(st.life))}${row('Esence',fmt(st.mana))}${row('Poškození zbraně',fmt(st.dmg[0])+'–'+fmt(st.dmg[1]))}${row('Zvýšené poškození',pct(st.dmgPct)+' (+'+st.physPct+' % fyz, +'+st.elemPct+' % elem)')}${row('Síla kouzel',fmt(st.spellBase)+' (+'+Math.round(st.spell)+' %)')}
      ${row('Kritický zásah',pct(st.crit)+' ×'+st.critMult+' %')}${row('Násobič v čase / průraz',`+${st.dot} % / ${st.pen} %`)}${row('Zbroj',fmt(st.armor))}${row('Úhyb / blok',pct(st.dodge)+' / '+pct(st.block))}
      <div class="row"><span>Odolnost jed / oheň / hniloba <small class="tt-dim">(postih hloubky ${st.resPen} %)</small></span><span>${rc(st.resPoison)} ${rc(st.resFire)} ${rc(st.resDecay)}</span></div>
      ${row('Regenerace',Math.round(st.regen*10)/10+' / tah')}${row('Esence regen.',Math.round(st.manaRegen*10)/10+' / tah')}${row('Život za zabití',fmt(st.lifeKill))}
      ${st.minionDmg||st.minionLife||st.minionMax?row('Přisluhovači',`+${st.minionDmg} % poškození · +${st.minionLife} % života · +${st.minionMax} max`):''}${p.cls==='summoner'||st.reserve?row('Daň přisluhovačů',`${Math.round((st.reserve||0)*100)} % života rezervováno · úprava ${st.minionUpkeep} %`):''}${st.formPct||st.formLife?row('Podoba zvířete',`+${st.formPct} % poškození · +${st.formLife} % života`):''}${row('Pochodeň',st.torch)}${row('Šance otrávit / zapálit / krvácení',`${st.poisonCh} / ${st.burnCh} / ${st.bleed} %`)}${row('Vysátí života',pct(st.leech))}${row('Kouzelné předměty',pct(st.mf))}${row('Zkrácení přebíjení',pct(st.cdr))}${(()=>{ const ex=['meleePct','projPct','aoePct','firePct','poisonPct','decayPct','doubleDmg','ailDur','buffDur','costRed','dr','weakCh','fearCh','manaKill','regenPct'].filter(k=>st[k]); return ex.length?`<div class="row ex"><span>Další</span><span>${ex.map(k=>statLine(k,st[k])).join('<br>')}</span></div>`:''; })()}
      ${[...st.uniques].map(u=>`<div class="pw">✦ ${UNIQUES.find(x=>x.id===u).power}</div>`).join('')}</div></div>`; }
  skillsHTML(){ const g=this.g,p=g.player; const known=Object.keys(p.skills); const sel=this.selSkill&&p.skills[this.selSkill]?this.selSkill:known[0]; this.selSkill=sel;
    const links=p.links[sel]||[null,null,null]; const supInv=p.inv.map((it,i)=>[it,i]).filter(([it])=>it.type==='support');
    const fits=id=>SUPPORTS[id].tags.some(t=>SKILLS[sel].tags.includes(t));
    const pool=skillsFor(p.cls); const cname=CLASSES.find(c=>c.id===p.cls)?.name;
    const book=`<div class="book"><span>Kniha třídy · ${cname}:</span>${pool.map(id=>`<img class="${p.skills[id]?'on':''}" title="${SKILLS[id].name}${p.skills[id]?'':' (zatím nenaučeno)'}" src="${this.icon(SKILLS[id].icon,40)}">`).join('')}</div>`;
    return `<h2>Dovednosti a runy</h2>${book}<div class="hint">Knihy dovedností padají jen pro tvou třídu (a univerzální). Vyber dovednost vlevo. Klikni na runu ve sklepě a pak na volný slot dovednosti. Do lišty 1–4 dáš dovednost tlačítky pod ní.</div>
      <div class="skwrap"><div class="skl">${known.map(id=>`<div class="skc ${sel===id?'sel':''}" data-skill="${id}"><img src="${this.icon(SKILLS[id].icon,48)}"><div><b>${SKILLS[id].name}</b> <small>úr. ${g.skillLevel(id)}</small><div class="mini">${(p.links[id]||[]).filter(Boolean).map(s=>`<i style="color:${fits(s)||true?SUPC:'#777'}">◆ ${SUPPORTS[s].name}</i>`).join(' ')}</div></div></div>`).join('')}</div>
      <div class="skdet"><div class="skhead"><img src="${this.icon(SKILLS[sel].icon,64)}"><div><h3>${SKILLS[sel].name} <small>úr. ${g.skillLevel(sel)}</small></h3><p>${SKILLS[sel].desc}</p><p class="tt-dim">Cena ${g.skillCost(sel)} · přebíjení ${SKILLS[sel].cd} · štítky: ${SKILLS[sel].tags.join(', ')}</p></div></div>
        <div class="links">${[0,1,2].map(i=>{ const s=links[i]; return `<div class="link ${s&&!fits(s)?'bad':''}" data-link="${i}">${s?`<img src="${this.icon(SUPPORTS[s].spr,48)}"><b>${SUPPORTS[s].name}</b><small>${SUPPORTS[s].desc}</small>`:'<span>Prázdný slot runy</span>'}</div>`; }).join('')}</div>
        ${sel!=='attack'?`<div class="barset">Dát na lištu: ${[0,1,2,3].map(i=>`<button data-bar="${i}" class="${p.bar[i]===sel?'on':''}">${i+1}</button>`).join('')}</div>`:'<div class="hint">Základní útok se používá klikem / pohybem do nepřítele.</div>'}
        <h3 class="sm">Runy ve sklepě</h3><div class="bag runes">${supInv.length?supInv.map(([it,i])=>`<div class="slot r-support ${this.pickRune===i?'picked':''} ${fits(it.sup)?'':'dim'}" style="--rc:${SUPC}" data-rune="${i}"><img src="${this.icon(it.spr,64)}"></div>`).join(''):'<div class="hint">Žádné runy. Padají z vzácných monster, trezorů a bossů.</div>'}</div>
      </div></div>`; }
  treeHTML(){ const p=this.g.player; return `<h2>Mycelium · pasivní strom</h2><div class="treehead"></div><div class="tree"><svg id="treesvg" viewBox="-1450 -1450 2900 2900"></svg></div><div class="hint">Kolečko = zoom · táhni = posun · <input class="treeq" placeholder="Hledat (např. jed, krit, přisluhovač)…"></div>`; }
  updateTreeHead(){ const p=this.g.player, h=$('#panel .treehead'); if(!h) return; h.innerHTML=`Volné pasivní body: <b>${p.ppoints||0}</b> · Přidělené: ${p.passives.length-1} ${this.pend?.pas?.length?`<span class="pendbar">Nově ${this.pend.pas.length} <button data-pend="ok:pas">Potvrdit</button><button data-pend="x:pas">Zrušit</button></span>`:''} <button class="respec">Přerozdělit vše (${this.g.respecCost()} ✦)</button>`; h.querySelectorAll('[data-pend]').forEach(b=>b.onclick=()=>{ const [act,kind]=b.dataset.pend.split(':'); if(act==='ok') this.commitPending(kind); else this.cancelPending(kind); }); h.querySelector('.respec').onclick=()=>{ this.commitPending(); if(this.g.respec()){ this.drawTree(); this.updateTreeHead(); this.refresh(); } else this.g.log('Nedostatek výtrusného prachu.','warn'); }; }
  drawTree(){ const svg=$('#treesvg'); if(!svg) return; const g=this.g,p=g.player; const has=id=>p.passives.includes(id);
    let h=''; const seen=new Set(); const L=[];
    for(const n of PASSIVES) for(const l of PASSIVE_MAP[n.id].adj){ const k=[n.id,l].sort().join('-'); if(seen.has(k)) continue; seen.add(k); const o=PASSIVE_MAP[l]; L.push([n,o,has(n.id)&&has(l)]); }
    for(const [n,o] of L) h+=`<line class="o" x1="${n.x}" y1="${n.y}" x2="${o.x}" y2="${o.y}"/>`;
    for(const [n,o,on] of L) h+=`<line class="c ${on?'on':''}" x1="${n.x}" y1="${n.y}" x2="${o.x}" y2="${o.y}"/>`;
    for(const n of PASSIVES){ const r=n.k?40:n.notable?28:n.start?34:17; const on=has(n.id); const st=on?'on':g.canAlloc(n.id)?'can':'lock'; const col=n.x<-20&&n.y>0?'s':n.x>20&&n.y>0?'f':n.y<0?'w':'m';
      const img='node_'+(n.k?'k':n.notable?'n':n.start?'start':'s')+(on?'_on':'');
      h+=`<g class="node ${st} c-${col}" data-node="${n.id}"><circle cx="${n.x}" cy="${n.y}" r="${r*0.55}" fill="${on?{s:'#5a2418',f:'#24401a',w:'#1e2c4c',m:'#4a3818'}[col]:'#120d0a'}"/><image href="${UI_(img)}" x="${n.x-r}" y="${n.y-r}" width="${r*2}" height="${r*2}"/>${n.k?`<text x="${n.x}" y="${n.y+6}">⬢</text>`:''}</g>`; }
    svg.innerHTML=h; this.wireTreeNav(svg);
    const q=$('#panel .treeq'); if(q&&!q._w){ q._w=true; q.value=this.treeQ||''; q.oninput=()=>{ this.treeQ=q.value; this.markTree(); }; q.onkeydown=e=>e.stopPropagation(); } this.markTree();
    svg.querySelectorAll('[data-node]').forEach(el=>{ const n=PASSIVE_MAP[el.dataset.node];
      el.onmouseenter=e=>this.tip(`<div class="tt-name" style="color:${n.k?'#f08a3c':n.notable?'#f2d36b':'#ddd'}">${n.n}</div>${n.k?`<div class="tt-power">${KEYSTONES[n.k]}</div>`:''}<div class="tt-aff">${Object.entries(n.s).map(([s,v])=>statLine(s,v)).join('<br>')}</div>${p.passives.includes(n.id)?'<div class="tt-dim">Přiděleno</div>':g.canAlloc(n.id)?'<div class="tt-hint">Klikni pro přidělení</div>':''}`,e);
      el.onmouseleave=()=>this.tip(null);
      el.onclick=()=>{ if(performance.now()-(this.treeDragged||0)<150) return; if(g.alloc(n.id)){ (this.pend||(this.pend={attr:[],pas:[]})).pas.push(n.id); this.drawTree(); this.updateTreeHead(); this.refresh(); this.tip(null); } }; }); }
  markTree(){ const svg=$('#treesvg'); if(!svg) return; const t=(this.treeQ||'').trim().toLowerCase(); svg.querySelectorAll('[data-node]').forEach(el=>{ const n=PASSIVE_MAP[el.dataset.node]; let hit=false;
      if(t.length>=2){ const txt=(n.n+' '+(n.k?KEYSTONES[n.k]:'')+' '+Object.keys(n.s).map(k=>STAT_NAMES[k]||k).join(' ')).toLowerCase(); hit=txt.includes(t); } el.classList.toggle('hit',hit); }); }
  wireTreeNav(svg){ if(svg._nav) return; svg._nav=true; let vb=this.treeVB&&this.treeVB[2]>0?this.treeVB:[-1000,-1000,2000,2000]; const set=()=>{ svg.setAttribute('viewBox',vb.join(' ')); this.treeVB=vb; }; set();
    svg.addEventListener('wheel',e=>{ e.preventDefault(); const r=svg.getBoundingClientRect(); const mx=vb[0]+(e.clientX-r.left)/r.width*vb[2], my=vb[1]+(e.clientY-r.top)/r.height*vb[3]; const f=e.deltaY>0?1.15:1/1.15; const nw=Math.max(400,Math.min(3000,vb[2]*f)); const k=nw/vb[2]; vb=[mx-(mx-vb[0])*k,my-(my-vb[1])*k,nw,nw]; set(); },{passive:false});
    let drag=null; svg.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY,vb:vb.slice(),moved:false}; });
    addEventListener('pointermove',e=>{ if(!drag) return; const r=svg.getBoundingClientRect(); const dx=(e.clientX-drag.x)/r.width*vb[2], dy=(e.clientY-drag.y)/r.height*vb[3]; if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>4) drag.moved=true; vb=[drag.vb[0]-dx,drag.vb[1]-dy,vb[2],vb[3]]; set(); });
    addEventListener('pointerup',()=>{ if(drag?.moved) this.treeDragged=performance.now(); drag=null; }); }
  craftHTML(){ const p=this.g.player; const it=this.craftSel; const items=[...Object.values(p.equip).filter(Boolean),...p.inv.filter(i=>i.base)];
    let act=''; if(it){ const up=upgradeCost(it), rc=rerollCost(it), ex=Math.ceil(itemValue(it)*4); const cor=it.corrupted;
      act=`<div class="craftsel"><div class="ttc">${tooltipHTML(it)}</div><div class="cbtn">${cor?'<div class="hint">Zkažený předmět už nejde měnit.</div>':`<button data-c="corrupt" class="corrbtn" ${(p.cores||0)<1?'disabled':''}>☣ Zkazit · 1 jádro (${p.cores||0})</button>`}
        ${up&&!cor?`<button data-c="up" ${p.dust<up?'disabled':''}>Zušlechtit (${it.rarity==='common'?'→ kouzelný':'→ vzácný'}) · ${up} ✦</button>`:''}
        ${it.rarity!=='common'&&!cor?`<button data-c="re" ${p.dust<rc?'disabled':''}>Přeměnit vlastnosti · ${rc} ✦</button>`:''}
        ${(it.rarity==='rare'||it.rarity==='legendary'||it.rarity==='sporeborn')&&it.aff.length<7&&!cor?`<button data-c="ex" ${p.dust<ex?'disabled':''}>Přidat vlastnost · ${ex} ✦</button>`:''}
        ${it.rarity!=='common'&&!cor&&it.aff.some(canReforge)?`<div class="reforge"><div class="hint">Přeroubovat · ${reforgeCost(it)} ✦ · vyber vlastnost, nová se zamkne:</div>${it.aff.map((a,i)=>canReforge(a)?`<button data-rf="${i}" ${p.dust<reforgeCost(it)?'disabled':''}>${statLine(a.s,a.v)}</button>`:'').join('')}</div>`:''}</div></div>`; }
    return `<h2>Oltář hniloby</h2><div class="hint">Výtrusný prach (✦ ${fmt(p.dust)}) získáš rozkládáním předmětů. Zkažená jádra (${p.cores||0}) z Plodnic pradávných, jeskyní a skřítků. <b>Zkažení</b> je nevratné: může předmět vylepšit, proklít, přeměnit vlastnost… nebo zničit.</div><div class="bag craftbag">${items.map((i,k)=>this.slotHTML(i,`data-craft="${k}" ${i===it?'data-sel="1"':''}`)).join('')}</div>${act}`; }
  wirePanel(el){ const g=this.g,p=g.player;
    const hoverTip=(node,it,cmp)=>{ node.onmouseenter=e=>this.tip(cmp!==undefined&&it.base?this.itemTip(it):tooltipHTML(it,cmp),e); node.onmouseleave=()=>this.tip(null); };
    el.querySelectorAll('[data-eq]').forEach(n=>{ const it=p.equip[n.dataset.eq]; if(!it) return; hoverTip(n,it); n.oncontextmenu=e=>{ e.preventDefault(); g.unequip(n.dataset.eq); this.tip(null); this.refresh(); }; });
    el.querySelectorAll('[data-inv]').forEach(n=>{ const it=p.inv[+n.dataset.inv]; if(!it) return; hoverTip(n,it,it.base?null:undefined);
      n.onclick=e=>{ this.tip(null); if(e.shiftKey||this.salvageMode){ if(it.type==='tome'){ g.learn(it); } else { const v=g.salvage(it); g.log(`Rozloženo: +${v} ✦`,'sys'); } this.refresh(); return; }
        if(it.type==='tome') g.learn(it); else if(it.type==='support'){ this.panel='skills'; this.pickRune=p.inv.indexOf(it); } else if(it.base) g.equip(it); this.refresh(); }; });
    el.querySelector('.sal')&&(el.querySelector('.sal').onclick=()=>{ this.salvageMode=!this.salvageMode; this.renderPanel(); });
    el.querySelector('.salall')&&(el.querySelector('.salall').onclick=()=>{ let v=0; for(const it of p.inv.slice()) if(it.base&&(it.rarity==='common'||it.rarity==='magic')) v+=g.salvage(it); g.log(`Rozloženo: +${v} ✦`,'sys'); this.refresh(); });
    el.querySelectorAll('[data-attr]').forEach(b=>b.onclick=()=>{ if(p.points>0){ p.points--; p.base[b.dataset.attr]++; (this.pend||(this.pend={attr:[],pas:[]})).attr.push(b.dataset.attr); g.recalc(); this.refresh(); } });
    el.querySelectorAll('[data-pend]').forEach(b=>b.onclick=()=>{ const [act,kind]=b.dataset.pend.split(':'); if(act==='ok') this.commitPending(kind); else this.cancelPending(kind); });
    el.querySelectorAll('[data-h]').forEach(n=>{ const h=STAT_HELP[n.dataset.h]; if(!h) return; n.onmouseenter=e=>this.tip(`<div class="tt-name">${n.dataset.h}</div><div class="tt-line">${h}</div>`,e); n.onmouseleave=()=>this.tip(null); });
    el.querySelectorAll('[data-skill]').forEach(n=>{ n.onclick=()=>{ this.selSkill=n.dataset.skill; this.renderPanel(); }; n.onmouseenter=e=>this.tip(this.skillTip(n.dataset.skill),e); n.onmouseleave=()=>this.tip(null); });
    el.querySelectorAll('[data-bar]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.bar, s=this.selSkill; const j=p.bar.indexOf(s); if(j>=0) p.bar[j]=p.bar[i]; p.bar[i]=s; this.refresh(); });
    el.querySelectorAll('[data-rune]').forEach(n=>{ const it=p.inv[+n.dataset.rune]; hoverTip(n,it); n.onclick=()=>{ this.pickRune=this.pickRune===+n.dataset.rune?null:+n.dataset.rune; this.renderPanel(); }; });
    el.querySelectorAll('[data-link]').forEach(n=>{ const i=+n.dataset.link; const cur=(p.links[this.selSkill]||[])[i];
      if(cur){ n.onmouseenter=e=>this.tip(`<div class="tt-name" style="color:${SUPC}">${SUPPORTS[cur].name}</div><div class="tt-line">${SUPPORTS[cur].desc}</div><div class="tt-hint">Pravý klik = vyjmout</div>`,e); n.onmouseleave=()=>this.tip(null); }
      n.onclick=()=>{ if(this.pickRune!=null&&p.inv[this.pickRune]?.type==='support'){ g.socket(this.selSkill,i,p.inv[this.pickRune]); this.pickRune=null; this.tip(null); this.refresh(); } };
      n.oncontextmenu=e=>{ e.preventDefault(); g.unsocket(this.selSkill,i); this.tip(null); this.refresh(); }; });
    const items=[...Object.values(p.equip).filter(Boolean),...p.inv.filter(i=>i.base)];
    el.querySelectorAll('[data-craft]').forEach(n=>{ const it=items[+n.dataset.craft]; n.onclick=()=>{ this.craftSel=it; this.renderPanel(); }; hoverTip(n,it); });
    el.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{ const it=this.craftSel, cost=reforgeCost(it); if(p.dust<cost) return; const old=it.aff[+b.dataset.rf]; const nw=craftReforge(it,+b.dataset.rf); if(!nw){ g.log('Pro tuhle vlastnost není náhrada.','warn'); return; } p.dust-=cost; g.recalc(); g.log(`Přeroubováno: ${statLine(old.s,old.v)} → ${statLine(nw.s,nw.v)}`,'good'); this.refresh(); });
    el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const it=this.craftSel; const c=b.dataset.c;
      if(c==='corrupt'){ const r=g.corrupt(it); if(r){ g.log('Oltář: '+corruptText(r),r==='destroyed'?'warn':'loot:sporeborn'); this.banner(r==='destroyed'?'Rozpadlo se':'Zkaženo',corruptText(r)); if(r==='destroyed') this.craftSel=null; } this.refresh(); return; }
      const cost=c==='up'?upgradeCost(it):c==='re'?rerollCost(it):Math.ceil(itemValue(it)*4); if(p.dust<cost) return; p.dust-=cost;
      if(c==='up') craftUpgrade(it); else if(c==='re') craftReroll(it); else craftExalt(it); g.recalc(); g.log('Oltář pulzuje: '+it.name,'good'); this.refresh(); });
    el.querySelectorAll('[data-stash]').forEach(n=>{ const it=Stash.get()[+n.dataset.stash]; if(!it) return; n.onmouseenter=e=>this.tip(this.itemTip(it),e); n.onmouseleave=()=>this.tip(null); n.onclick=()=>{ this.tip(null); g.stashTake(+n.dataset.stash); this.refresh(); }; });
    el.querySelectorAll('[data-sput]').forEach(n=>{ const it=p.inv[+n.dataset.sput]; if(!it) return; n.onmouseenter=e=>this.tip(tooltipHTML(it),e); n.onmouseleave=()=>this.tip(null); n.onclick=()=>{ this.tip(null); g.stashPut(it); this.refresh(); }; });
    el.querySelectorAll('[data-gam]').forEach(b=>b.onclick=()=>{ const it=g.gamble(b.dataset.gam); if(it){ this.lastGamble=it; g.log('Z pytle vypadl: '+it.name,'loot:'+it.rarity); } this.refresh(); });
    el.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const ok=b.dataset.buy==='pot'?g.buyPotionSlot():g.buyCore(); if(ok) g.log(b.dataset.buy==='pot'?'Brašna rozšířena.':'Koupeno zkažené jádro.','good'); this.refresh(); });
    el.querySelectorAll('[data-wsel]').forEach(n=>{ const it=p.inv[+n.dataset.wsel]; hoverTip(n,it); n.onclick=()=>{ this.wellSel=+n.dataset.wsel; this.renderPanel(); }; });
    const wt=el.querySelector('#w-throw'); if(wt) wt.onclick=async()=>{ const it=p.inv[this.wellSel]; if(!it) return; wt.disabled=true; wt.textContent='Předmět padá do tmy…'; const r=await g.wellThrow(it,this.wellPr);
      if(r?.error){ this.wellRes=`<div class="hint" style="color:#ff8a7a">Studna tě odmítla (${esc(r.error)}). Předmět ti zůstal.</div>`; this.renderPanel(); el.querySelector('.hint').insertAdjacentHTML('afterend',this.wellRes); return; }
      this.wellRes=r.item?`<div class="tt-sub">Vylovil jsi:</div>${tooltipHTML(r.item)}`:'<div class="hint">Studna mlčí… nic se nevynořilo.</div>'; this.banner(r.item?'Studna vydala předmět':'Studna mlčí',r.item?r.item.name:''); this.wellSel=null; this.renderPanel(); this.refresh(); };
    if(this.panel==='tree'){ this.drawTree(); this.updateTreeHead(); }
  }
  loreHTML(){ const p=this.g.player; const got=(p.lore||[]).slice().sort((a,b)=>a-b);
    return `<h2>Kronika Ul-Myru</h2><div class="hint">Nalezeno ${got.length} / ${LORE.length} zápisů. Hledej runové desky v hlubinách.</div><div class="lorelist">${got.map(i=>`<div class="lorei"><b>${LORE[i].t}</b><p>${LORE[i].x}</p></div>`).join('')||'<div class="hint">Zatím nic. Runové desky září slabým modrým světlem.</div>'}</div>`; }
  shopHTML(){ const g=this.g,p=g.player; const c=g.gambleCost(), pc=g.potionSlotCost(), cc=g.coreCost(); const slots=[['weapon','Zbraň'],['offhand','Druhá ruka'],['helm','Helma'],['chest','Zbroj'],['gloves','Rukavice'],['boots','Boty'],['amulet','Amulet'],['ring','Prsten']];
    return `<h2>Hnilobný překupník</h2><div class="hint">„Co je v pytli, to je tvoje. Co v něm není… to si nech zdát.“ Máš ${IC('i_gold')} ${fmt(p.gold)}.</div>
      <h3 class="sm">Hazard (${fmt(c)} zl)</h3><div class="shopg">${slots.map(([s,n])=>`<button data-gam="${s}" ${p.gold<c?'disabled':''}>${n}</button>`).join('')}</div>
      <h3 class="sm">Zboží</h3><div class="shopg"><button data-buy="pot" ${pc==null||p.gold<pc?'disabled':''}>Větší brašna na lektvary (${p.potionMax}/6) · ${pc==null?'max':fmt(pc)+' zl'}</button><button data-buy="core" ${p.gold<cc?'disabled':''}>Zkažené jádro · ${fmt(cc)} zl</button></div>
      <div class="shopres">${this.lastGamble?tooltipHTML(this.lastGamble):''}</div>
      ${g.daily?'<h3 class="sm">Sdílená truhla</h3><div class="hint">V denní hlubině je sdílená truhla zapečetěná.</div>':`<h3 class="sm">Sdílená truhla (${Stash.get().length}/${STASH_MAX})</h3><div class="hint">Předměty v truhle uvidí každá tvoje postava, když potká překupníka. Klik na předmět v truhle = vzít, klik v batohu = vložit.</div>
      <div class="bag">${Array.from({length:STASH_MAX},(_,i)=>this.slotHTML(Stash.get()[i],`data-stash="${i}"`)).join('')}</div>
      <h3 class="sm">Batoh</h3><div class="bag">${p.inv.map((it,i)=>this.slotHTML(it,`data-sput="${i}"`)).join('')}</div>`}`; }
  openShop(){ this.panel='shop'; this.lastGamble=null; this.renderPanel(); }
  loreModal(title,text,runes){ this.showModal(`${runes?'<div class="runes-h">ᚢᛚ · ᛗᛁᚱ</div>':''}<h2>${title}</h2><p class="loretext">${text}</p><button class="big" id="lclose">Pokračovat</button>`,m=>m.querySelector('#lclose').onclick=()=>this.hideModal()); }
  riftPrompt(portal,mods){ this.showModal(`<h2>Zkažená jeskyně</h2><p class="hint">Z oblouku dýchá hladové podhoubí. Vstup je dobrovolný – normální schodiště dolů zůstává. Uvnitř tě čeká Srdce jeskyně; po jeho smrti se otevře cesta zpět.</p>
      <div class="corr">${mods.map(m=>`<div class="rmod"><b>${m.name}</b><span class="bad">${m.desc}</span></div>`).join('')}</div>
      <p class="good">Odměna: +30 % kvantity a vzácnosti, +1 úroveň předmětů, šance na zkažené předměty, zkažená jádra.</p>
      <button class="big" id="rin">Vstoupit</button><button class="big" id="rno">Zatím ne</button>`,
    m=>{ m.querySelector('#rin').onclick=()=>{ this.hideModal(); this.g.enterRift(portal,mods); }; m.querySelector('#rno').onclick=()=>this.hideModal(); }); }
  openCraft(){ this.panel='craft'; this.craftSel=null; this.renderPanel(); }
  // ---------- modals ----------
  showModal(html,wire){ const m=$('#modal'); m.innerHTML=`<div class="box">${html}</div>`; m.style.display='flex'; this.modal=true; wire?.(m); }
  hideModal(){ const m=$('#modal'); m.style.display='none'; m.innerHTML=''; this.modal=false; }
  chooseCorruption(opts){ this.showModal(`<h2>Výtrusná korupce</h2><p class="hint">Hloubka ${this.g.depth+1} tě volá. Vyber korupci, která patro zesílí a zlepší odměny.</p>
      <div class="corr">${opts.map((o,i)=>`<button data-o="${i}"><b>${o.name}</b><span class="bad">${o.desc}</span><span class="good">${o.reward}</span></button>`).join('')}<button data-o="-1"><b>Čistý sestup</b><span>Bez úprav</span></button></div>`,
    m=>m.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.o; this.hideModal(); this.g.goDown(i>=0?opts[i]:null); })); }
  recapHTML(){ const g=this.g, R=(g.recap||[]); if(!R.length) return ''; const endT=R[R.length-1].t; const ev=R.filter(e=>endT-e.t<=6).slice(-5);
    const EL={fire:['oheň','#ff9a4a'],poison:['jed','#9df07a'],decay:['hniloba','#c79bff']}; const tot=ev.reduce((a,e)=>a+e.d,0)||1, max=ev[ev.length-1].max||1;
    const rows=ev.map(e=>{ const [en,ec]=e.el?EL[e.el]||[e.el,'#ccc']:['fyzické','#e8dcc8']; const dt=e.t-endT; const pct=Math.round(e.hp/max*100);
      return `<div class="rc-row"><span class="rc-t">${dt===0?'poslední tah':'tah −'+(-dt)}</span><span class="rc-who">${esc(e.who)}${e.note?` <i>(${e.note})</i>`:''}${e.n>1?` ×${e.n}`:''}</span><span class="rc-d" style="color:${ec}">−${fmt(e.d)} ${en}</span><span class="rc-hp"><b style="width:${pct}%"></b></span></div>`; }).join('');
    const sum=k=>ev.filter(k).reduce((a,e)=>a+e.d,0); const big=ev.reduce((a,e)=>e.d>a.d?e:a,ev[0]); let tip='';
    if(sum(e=>e.haz)>tot*0.4) tip='Většinu poškození ti daly zóny na zemi. Vystup z nich hned, jak se objeví varování.';
    else if(sum(e=>e.dot)>tot*0.4) tip='Zabil tě hlavně jed, oheň nebo krvácení. Lektvar tyhle stavy očistí.';
    else if(big.d>max*0.4) tip=`Jeden zásah (${esc(big.who)}${big.note?', '+big.note:''}) ti vzal ${Math.min(100,Math.round(big.d/max*100))} % života.${big.note?' Sleduj červená pole telegrafu.':' Zvaž zbroj a odolnosti.'}`;
    else if(new Set(ev.filter(e=>e.mon).map(e=>e.who)).size>=3) tip='Obklíčilo tě víc nepřátel naráz. Ustup do chodby, ať útočí po jednom.';
    return `<div class="recap"><div class="rc-h">Poslední výtrusy</div>${rows}${tip?`<div class="rc-tip">${tip}</div>`:''}</div>`; }
  onDeath(by){ const g=this.g, p=g.player, daily=!!g.daily; let msg=-1; const canGrave=LB.enabled()&&p.nick;
    const graveUI=canGrave?`<div class="gravepick"><div class="hint">Zanech vzkaz na svém hrobě (uvidí ho ostatní hráči v této hloubce):</div>${GRAVE_MSGS.map((t,i)=>`<button data-gm="${i}">${t}</button>`).join('')}</div>`:'';
    const sendGrave=()=>{ if(canGrave&&!this._graveSent){ this._graveSent=true; LB.grave(g,by,msg); } };
    this._graveSent=false;
    setTimeout(()=>this.showModal(daily?`<h2 class="dead">Denní hlubina skončila</h2><p>Zabil tě: <b>${esc(by)}</b>. Došel jsi do hloubky <b>${g.best}</b> (úroveň ${p.lvl}).</p>${this.recapHTML()}${graveUI}<p class="hint">Zítra čeká nová hlubina.</p><div class="pmenu"><button class="big" id="d-lb">Denní žebříček</button><button class="big" id="d-menu">Do menu</button></div>`
      :`<h2 class="dead">Padl jsi</h2><p>Zabil tě: <b>${esc(by)}</b> v hloubce ${g.depth}.</p>${this.recapHTML()}${graveUI}<p class="hint">Probudíš se na kontrolním bodě (hloubka ${g.checkpoint}). Ztratíš čtvrtinu zlata a polovinu zkušeností do další úrovně.</p><button class="big" id="resp">Vstát z výtrusů</button>`,
    m=>{ m.querySelectorAll('[data-gm]').forEach(b=>b.onclick=()=>{ msg=+b.dataset.gm; m.querySelectorAll('[data-gm]').forEach(x=>x.classList.toggle('on',x===b)); });
      if(daily){ m.querySelector('#d-lb').onclick=()=>{ sendGrave(); this.leaderboard(()=>this.onDeath(by),'daily'); }; m.querySelector('#d-menu').onclick=()=>{ sendGrave(); this.hideModal(); this.toTitleFn?.(); }; }
      else m.querySelector('#resp').onclick=()=>{ sendGrave(); this.hideModal(); g.respawn(); }; }),900); }
  openWell(pr){ this.panel='well'; this.wellPr=pr; this.wellSel=null; this.renderPanel(); }
  wellHTML(){ const g=this.g,p=g.player, pr=this.wellPr; const items=p.inv.map((it,i)=>[it,i]).filter(([it])=>it.base||it.type==='support');
    if(!pr||pr.used) return `<h2>Hnilobná studna</h2><div class="hint">Studna vyschla.</div>${this.wellRes?`<div class="shopres">${this.wellRes}</div>`:''}`;
    const sel=this.wellSel!=null?p.inv[this.wellSel]:null;
    return `<h2>Hnilobná studna</h2><div class="hint">Do studny smíš hodit <b>jeden</b> předmět. Studna ti na oplátku vydá předmět podobné hodnoty, který do ní hodil jiný poutník – když tam nějaký je. Když je prázdná, nedostaneš nic. Pak vyschne.</div>
      <div class="bag">${items.map(([it,i])=>this.slotHTML(it,`data-wsel="${i}" ${this.wellSel===i?'data-sel="1"':''}`)).join('')||'<div class="hint">Nemáš co hodit.</div>'}</div>
      ${sel?`<div class="craftsel"><div class="ttc">${tooltipHTML(sel)}</div><div class="cbtn"><button id="w-throw" class="corrbtn">Hodit do studny</button></div></div>`:''}`; }
  dailyModal(onStart){ const day=LB.today(), dm=dailyMod(day); const mine=Roster.list().find(c=>c.daily===day);
    const back=()=>this.title(onStart);
    if(mine){ this.showModal(`<h2>Denní hlubina · ${day}</h2><p class="hint">Kletba dne: <b>${dm.name}</b> – ${dm.desc}</p>${mine.dead?`<p>Dnešní pokus skončil v hloubce <b>${mine.best}</b>. Zítra čeká nová hlubina.</p>`:`<p>Tvůj dnešní běh pokračuje (hloubka ${mine.depth}).</p>`}
      <div class="pmenu">${mine.dead?'':`<button class="big" id="dd-play">Pokračovat</button>`}<button class="big" id="dd-lb">Denní žebříček</button><button class="big" id="dd-back">Zpět</button></div>`,
      m=>{ m.querySelector('#dd-play')&&(m.querySelector('#dd-play').onclick=()=>{ this.hideModal(); onStart({id:mine.id}); }); m.querySelector('#dd-lb').onclick=()=>this.leaderboard(()=>this.dailyModal(onStart),'daily'); m.querySelector('#dd-back').onclick=back; }); return; }
    this.showModal(`<h2>Denní hlubina · ${day}</h2><p class="hint">Všichni hráči dnes procházejí <b>stejný dungeon</b>. Jeden život – smrt znamená konec. Jeden pokus denně, žádná sdílená truhla ani studna.</p>
      <p>Kletba dne: <b class="bad">${dm.name}</b> – ${dm.desc} <span class="good">(${dm.reward})</span></p>
      <p class="hint">Přezdívka je veřejně vidět v žebříčku. <b>Nepoužívej své skutečné jméno.</b></p><input id="nk-in" maxlength="16" placeholder="Přezdívka" value="${esc(LB.player().nick||'')}" autocomplete="off"><div class="nkerr hint" style="color:#ff8a7a"></div>
      <div class="classes dsel">${CLASSES.map(c=>`<button data-dc="${c.id}"><img src="${this.icon(c.spr,64)}"><b>${c.name}</b></button>`).join('')}</div>
      <div class="pmenu"><button class="big" id="dd-lb">Denní žebříček</button><button class="big" id="dd-back">Zpět</button></div>`,
      m=>{ const inp=m.querySelector('#nk-in'); inp.onkeydown=e=>e.stopPropagation();
        m.querySelectorAll('[data-dc]').forEach(b=>b.onclick=()=>{ const v=inp.value.trim().replace(/\s+/g,' '); if(LB.enabled()&&!LB.validNick(v)){ m.querySelector('.nkerr').textContent='Pro denní žebříček zadej přezdívku (2–16 znaků).'; return; } if(v) LB.setDefaultNick(v); this.hideModal(); onStart({cls:b.dataset.dc,nick:v,daily:day}); });
        m.querySelector('#dd-lb').onclick=()=>this.leaderboard(()=>this.dailyModal(onStart),'daily'); m.querySelector('#dd-back').onclick=back; }); }
  title(onStart){ const list=Roster.list(); document.body.classList.remove('ingame');
    const cn=id=>CLASSES.find(c=>c.id===id);
    this.showModal(`<div class="title"><h1>SPORIUM</h1>
      <div class="season"><span class="sn">Sezóna ${SEASON.n}</span><b>${SEASON.name}</b><small>${SEASON.desc}</small></div>
      <p class="tag">Sestup do hnijících hlubin. Každé patro hlouběji, každý výtrus temnější.</p>
      <div class="lbrow"><button class="big daily" id="t-daily">☼ Denní hlubina</button><button class="big" id="t-lb">Žebříček sezóny</button><button class="big" id="t-bk">Záloha</button><button class="big" id="t-pv">Soukromí</button><button class="big newsb" id="t-news">Novinky${NEWS_LATEST>+(localStorage.getItem('sporium_news_seen')||0)?' <span class="nbadge">nové</span>':''}</button></div>
      ${list.length?`<h3>Tvoje postavy</h3><div class="roster">${list.map(c=>`<div class="rch"><img src="${this.icon(cn(c.cls)?.spr||'hero_blade',64)}"><div class="ri"><b>${esc(cn(c.cls)?.name||c.name)}${c.nick?` <span class="nk">· ${esc(c.nick)}</span>`:''}${c.daily?` <span class="dtag">☼ ${c.daily}</span>`:''}</b><small>Úroveň ${c.lvl} · ${c.dead?'padl v hloubce '+c.best:c.daily&&c.daily!==LB.today()?'uzavřeno · hloubka '+c.best:'hloubka '+c.depth+' · nejhlouběji '+c.best}</small></div>${c.daily?'<span></span>':`<button class="nkb" data-nick="${c.id}" title="Přezdívka pro žebříček">${c.nick?'✎':'+ nick'}</button>`}${c.dead||(c.daily&&c.daily!==LB.today())?'<span></span>':`<button data-play="${c.id}">Hrát</button>`}<button class="del" data-del="${c.id}" title="Smazat">✕</button></div>`).join('')}</div>`:''}
      <h3>${list.length?'Nová postava':'Vyber hrdinu'}</h3><div class="classes">${CLASSES.map(c=>`<button data-c="${c.id}"><img src="${this.icon(c.spr,96)}"><b>${c.name}</b><small>${c.desc}</small><i class="trt">◈ ${c.trait.name}: ${c.trait.desc}</i></button>`).join('')}</div>
      <p class="keys">Tab mapa · WASD / šipky (držet) / klik – pohyb a útok · 1–4 dovednosti · Q lektvar · E / mezerník interakce · Enter sestup · I C K P J panely · M zvuk · Esc menu · kolečko zoom</p></div>`,
    m=>{ m.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{ this.hideModal(); onStart({id:b.dataset.play}); });
      m.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(!confirm('Opravdu smazat tuto postavu? Nelze vrátit.')) return; Roster.del(b.dataset.del); this.title(onStart); });
      m.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ const cls=b.dataset.c; this.nickModal(LB.player().nick,'Nová postava',nick=>{ this.hideModal(); if(nick) LB.setDefaultNick(nick); onStart({cls,nick}); },()=>this.title(onStart)); });
      m.querySelectorAll('[data-nick]').forEach(b=>b.onclick=()=>{ const id=b.dataset.nick; const s=Roster.get(id); this.nickModal(s.player.nick||LB.player().nick,'Přezdívka postavy',nick=>{ s.player.nick=nick||''; s.player.nickAsked=true; Roster.put(id,s); if(nick) LB.setDefaultNick(nick); this.title(onStart); },()=>this.title(onStart)); });
      m.querySelector('#t-lb').onclick=()=>this.leaderboard(()=>this.title(onStart)); m.querySelector('#t-daily').onclick=()=>this.dailyModal(onStart);
      m.querySelector('#t-news').onclick=()=>this.newsModal(()=>this.title(onStart)); m.querySelector('#t-bk').onclick=()=>this.backupModal(()=>this.title(onStart)); m.querySelector('#t-pv').onclick=()=>this.privacyModal(()=>this.title(onStart));
      m.insertAdjacentHTML('beforeend',`<aside id="newsSide"><h3>Novinky</h3>${this.newsHTML(3)}<button id="ns-all">Všechny novinky</button></aside>`); m.querySelector('#ns-all').onclick=()=>this.newsModal(()=>this.title(onStart)); }); }
  nickModal(cur,title,done,back){ const on=LB.enabled();
    this.showModal(`<h2>${title}</h2><p class="hint">Přezdívka se zobrazí v online žebříčku sezóny a je veřejně vidět. Žádná registrace ani e-mail – stačí jméno (2–16 znaků). <b>Nepoužívej své skutečné jméno.</b>${on?'':' <b>Žebříček zatím není zapnutý</b>, přezdívka se uloží a odešle, až bude.'}</p>
      <input id="nk-in" maxlength="16" placeholder="Tvoje přezdívka" value="${esc(cur||'')}" autocomplete="off"><div class="nkerr hint" style="color:#ff8a7a"></div>
      <div class="pmenu"><button class="big" id="nk-ok">Pokračovat</button><button class="big" id="nk-skip">Bez žebříčku</button>${back?'<button class="big" id="nk-back">Zpět</button>':''}</div>`,
    m=>{ const inp=m.querySelector('#nk-in'); setTimeout(()=>inp.focus(),30); const ok=()=>{ const v=inp.value.trim().replace(/\s+/g,' '); if(!LB.validNick(v)){ m.querySelector('.nkerr').textContent='Použij 2–16 písmen, číslic, mezer nebo _ . -'; return; } done(v); };
      inp.onkeydown=e=>{ e.stopPropagation(); if(e.key==='Enter') ok(); }; m.querySelector('#nk-ok').onclick=ok; m.querySelector('#nk-skip').onclick=()=>done(''); if(back) m.querySelector('#nk-back').onclick=back; }); }
  askNickOnce(){ const p=this.g.player; if(p.nick||p.nickAsked) return; this.nickModal(LB.player().nick,'Přidej přezdívku',nick=>{ p.nickAsked=true; if(nick){ p.nick=nick; LB.setDefaultNick(nick); } this.hideModal(); this.g.save(); this.g.lbSync(true); this.refresh(); }); }
  async leaderboard(back,cls='all'){ const g=this.g; const tabs=[['daily','☼ Denní'],['all','Všichni'],...CLASSES.map(c=>[c.id,c.name])];
    const head=`<h2>${cls==='daily'?'Denní hlubina · '+LB.today():'Žebříček · Sezóna '+SEASON.n}</h2><div class="lbtabs">${tabs.map(([id,n])=>`<button data-lbc="${id}" class="${id===cls?'on':''}">${n}</button>`).join('')}</div>`;
    const wire=m=>{ m.querySelectorAll('[data-lbc]').forEach(b=>b.onclick=()=>this.leaderboard(back,b.dataset.lbc)); m.querySelector('#lb-back').onclick=()=>back?back():this.hideModal(); };
    if(!LB.enabled()){ this.showModal(head+`<p class="hint">Online žebříček zatím není zapnutý.</p><button class="big" id="lb-back">Zpět</button>`,wire); return; }
    this.showModal(head+`<p class="hint">Načítám…</p><button class="big" id="lb-back">Zpět</button>`,wire);
    const d=cls==='daily'?await LB.daily():await LB.top(cls); const myIds=new Set(Roster.list().map(c=>c.id.slice(-6)));
    const rows=d?.rows||[]; const cn=id=>CLASSES.find(c=>c.id===id);
    const body=d?(rows.length?`<div class="lbt"><div class="lbh"><span>#</span><span>Přezdívka</span><span>Třída</span><span>Hloubka</span><span>Úroveň</span></div>${rows.map((r,i)=>`<div class="lbr ${myIds.has(r.id)?'me':''} ${i<3?'top'+(i+1):''}"><span>${i+1}</span><span>${esc(r.nick)}</span><span><img src="${this.icon(cn(r.cls)?.spr||'hero_blade',32)}">${cn(r.cls)?.name||r.cls}</span><span>${r.best}${r.dead?' ✝':''}</span><span>${r.lvl}</span></div>`).join('')}</div>`:'<p class="hint">Zatím nikdo. Buď první!</p>'):'<p class="hint">Žebříček je teď nedostupný. Zkus to později.</p>';
    if(!document.querySelector('.lbtabs')) return; this.showModal(head+body+`<p class="hint">Výsledek se odešle automaticky, když postava s přezdívkou dosáhne nové hloubky.</p><button class="big" id="lb-back">Zpět</button>`,wire); }
  pauseMenu(toTitle){ const g=this.g; this.showModal(`<h2>Menu</h2><p class="hint">${esc(g.player.name)} · úroveň ${g.player.lvl} · hloubka ${g.depth}${g.inRift?' · ve Zkažené jeskyni (uloží se před vchodem)':''}</p>
      <div class="pmenu"><button class="big" id="pm-c">Pokračovat</button><button class="big" id="pm-lb">Žebříček</button><button class="big" id="pm-lf">Filtr kořisti</button><button class="big" id="pm-bk">Záloha</button><button class="big" id="pm-st">Příběh</button><button class="big" id="pm-nw">Novinky${NEWS_LATEST>+(localStorage.getItem('sporium_news_seen')||0)?' <span class="nbadge">nové</span>':''}</button><button class="big" id="pm-n">Přezdívka${g.player.nick?': '+esc(g.player.nick):''}</button><button class="big" id="pm-pv">Soukromí</button><button class="big" id="pm-s">Uložit a do menu</button><button class="big" id="pm-m">${audio.vol.muted?'Zapnout zvuk':'Vypnout zvuk'}</button></div>`,
    m=>{ m.querySelector('#pm-c').onclick=()=>this.hideModal(); m.querySelector('#pm-lb').onclick=()=>this.leaderboard(()=>this.pauseMenu(toTitle)); m.querySelector('#pm-nw').onclick=()=>this.newsModal(()=>this.pauseMenu(toTitle)); m.querySelector('#pm-lf').onclick=()=>this.lootModal(()=>this.pauseMenu(toTitle)); m.querySelector('#pm-bk').onclick=()=>this.backupModal(()=>this.pauseMenu(toTitle),()=>g.save()); m.querySelector('#pm-st').onclick=()=>this.introModal(g.player.cls,()=>this.pauseMenu(toTitle)); m.querySelector('#pm-pv').onclick=()=>this.privacyModal(()=>this.pauseMenu(toTitle));
      m.querySelector('#pm-n').onclick=()=>this.nickModal(g.player.nick||LB.player().nick,'Přezdívka postavy',nick=>{ g.player.nick=nick||''; g.player.nickAsked=true; g._nickWarned=false; if(nick) LB.setDefaultNick(nick); g.save(); g.lbSync(true); this.pauseMenu(toTitle); },()=>this.pauseMenu(toTitle)); m.querySelector('#pm-m').onclick=()=>{ audio.toggleMute(); this.hideModal(); }; m.querySelector('#pm-s').onclick=()=>{ if(g.inRift) g.exitRift(); g.save(); this.hideModal(); this.panel=null; this.renderPanel(); toTitle(); }; }); }
}
