// Endgame: Výtrusné mapy (semena), Kořenová síť, Šedá královna Mirun.
// Vše, co se ukládá, žije v player.atlas, player.egLore a v předmětech typu 'seed' / 'frag'.
import {RIFT_MODS,BOSSES,BIOMES,SPECIAL} from './data.js';
import {makeItem,corruptAgain,tooltipHTML} from './items.js';
import {generate} from './dungeon.js';
import {rng,RNG,fmt,dist} from './util.js';
import {CORE_ANGELS} from './tactics.js';
import {makeCrystal} from './craft.js';

export const EG_MIN_DEPTH=60;
export const SEED_MAX_TIER=16;
const mapLife=t=>1+t*0.12; // S2: lineárně (T16 ×2,9)
const mapDamage=t=>1+t*0.09; // S2: T16 ×2,44
const uid=()=>1e9+Math.floor(Math.random()*1e9);
const esc=s=>String(s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));

export const FRAGS=[
  {name:'Úlomek: Mirunina koruna',spr:'frag_crown'},
  {name:'Úlomek: Zvon poslední písně',spr:'frag_bell'},
  {name:'Úlomek: Kořen trůnu',spr:'frag_root'},
  {name:'Úlomek: Oko, které nespí',spr:'frag_eye'},
];
export const QUEEN={id:'b_mirun',name:'Šedá královna Mirun',spr:'queen_mirun',sprRage:'queen_mirun_enraged',hp:700,dmg:[26,40],arm:18,spd:100,regen:0.002,xp:900,ai:'boss',sc:2.6,el:'decay',
  pat:['nova','spit','summon','slam','charge'],res:{decay:60,poison:40,fire:25},adds:'capling',light:[0.75,0.55,1]};
export const QUEEN_LORE=[
  {t:'Mirun, poslední zápis',x:'Neodešla jsem dolů, abych se skryla. Odešla jsem, abych hlubině zazpívala ukolébavku. Zpívám už tak dlouho, že nevím, jestli zpívám já, nebo ona mnou.'},
  {t:'Koruna, která myslí',x:'Když jsi mi srazil korunu, na okamžik bylo ticho. Pak podhoubí zašeptalo tvé jméno. Neboj se. Neznamená to, že tě chce. Znamená to, že tě už má.'},
];

// ---------- Kořenová síť ----------
export const ATLAS=[
  {id:'a1',br:0,name:'Hojná půda',desc:'+15 % kvantity předmětů ve Výtrusných mapách',fx:{qty:0.15}},
  {id:'a2',br:0,req:'a1',name:'Zlatá míza',desc:'+10 % vzácnosti předmětů ve Výtrusných mapách',fx:{mf:10}},
  {id:'a5',br:0,req:'a2',name:'Krystalické žíly',desc:'V mapách padá o 50 % víc Výtrusných krystalů',fx:{crystal:0.5}},
  {id:'a3',br:0,req:'a5',name:'Kořist strážce',desc:'Strážce mapy upustí 2 předměty navíc',fx:{bossItems:2}},
  {id:'a6',br:0,req:'a3',name:'Zlaté podloží',desc:'+40 % zlata ve Výtrusných mapách',fx:{gf:40}},
  {id:'a4',br:0,req:'a6',name:'Dvojí hniloba',desc:'Na Oltáři můžeš zkažený předmět zkazit podruhé (3 jádra)',fx:{double:1}},
  {id:'b1',br:1,name:'Plodné výtrusy',desc:'Semena padají o 30 % častěji',fx:{seedCh:0.3}},
  {id:'b2',br:1,req:'b1',name:'Vzestupný klíček',desc:'+15 % šance, že semeno padne o tier výš',fx:{up:0.15}},
  {id:'b5',br:1,req:'b2',name:'Bujné klíčení',desc:'Na semeno jde přidat o 1 mod víc',fx:{modCap:1}},
  {id:'b3',br:1,req:'b5',name:'Dvojí úroda',desc:'Strážce mapy vždy upustí i semeno stejného tieru',fx:{twin:1}},
  {id:'b6',br:1,req:'b3',name:'Jarní déšť',desc:'20% šance, že se zasazené semeno vrátí do inventáře',fx:{keepSeed:0.2}},
  {id:'b4',br:1,req:'b6',name:'Šepot královny',desc:'Úlomky královny padají už od T8 a o 15 % častěji',fx:{frag:1}},
  {id:'c1',br:2,name:'Zkažené jádro',desc:'Strážce mapy upustí +1 zkažené jádro',fx:{cores:1}},
  {id:'c2',br:2,req:'c1',name:'Volba půdy',desc:'Při zasazení semene si vybereš biom',fx:{biome:1}},
  {id:'c3',br:2,req:'c2',name:'Bezpečné klíčení',desc:'Zkažení semene ho nikdy nezničí',fx:{safe:1}},
  {id:'c5',br:2,req:'c3',name:'Pevné kořeny',desc:'Když v mapě zemřeš, semeno se ti vrátí',fx:{deathKeep:1}},
  {id:'c6',br:2,req:'c5',name:'Kořenová stezka',desc:'Na posledním patře mapy stojí u startu Oltář hniloby',fx:{mapAltar:1}},
  {id:'c4',br:2,req:'c6',name:'Hrabivé podhoubí',desc:'Na každém patře mapy čeká Hrabivý skřítek',fx:{goblin:1}},
  {id:'d1',br:3,name:'Hladová půda',desc:'Zasazené semeno dostane +1 náhodný mod, mapa +15 % kvantity',fx:{extraMod:1,qty:0.15}},
  {id:'d2',br:3,req:'d1',name:'Krvavá daň',desc:'Monstra v mapách +20 % poškození, ty +25 % zkušeností',fx:{mdmg:0.2,xp:0.25}},
  {id:'d3',br:3,req:'d2',name:'Bez milosti',desc:'Vzácná monstra v mapách mají +1 vlastnost, +15 % vzácnosti',fx:{eliteMod:1,mf:15}},
  {id:'d4',br:3,req:'d3',name:'Zkažená zem',desc:'Zkažení semene vychází o polovinu méně často naprázdno',fx:{corrLuck:1}},
  {id:'d5',br:3,req:'d4',name:'Lov pokladů',desc:'Hrabivý skřítek v mapě upustí jádro a krystal IV',fx:{goblinLoot:1}},
  {id:'d6',br:3,req:'d5',name:'Jediná cesta',desc:'Mapa má jen poslední patro se strážcem, ale strážce dá dvojnásobnou kořist',fx:{oneFloor:1}},
  {id:'e1',br:4,name:'Pevná kořist',desc:'Strážce mapy upustí krystal stupně IV',fx:{bossCrystal:1}},
  {id:'e2',br:4,req:'e1',name:'Rozzuřený strážce',desc:'Strážce má +30 % života, ale dá +1 předmět a +1 jádro',fx:{bossHp:0.3,bossItems:1,cores:1}},
  {id:'e3',br:4,req:'e2',name:'Trofej',desc:'Strážce mapy má 12% šanci upustit unikát',fx:{bossUnique:0.12}},
  {id:'e4',br:4,req:'e3',name:'Dvojí strážce',desc:'Na posledním patře čeká i druhý, slabší strážce',fx:{twinBoss:1}},
  {id:'e5',br:4,req:'e4',name:'Ozvěna strážce',desc:'Po pádu strážce se otevře Trhlina jádra',fx:{bossRift:1}},
  {id:'e6',br:4,req:'e5',name:'Lov na strážce',desc:'Strážce dá +50 % zkušeností a jeho semeno je o tier vyšší',fx:{bossXp:0.5,bossUp:1}},
  {id:'h1',br:5,name:'Šepot Mirun',desc:'Úlomky královny padají o 10 % častěji',fx:{fragCh:0.1}},
  {id:'h2',br:5,req:'h1',name:'Tichá koruna',desc:'Šedá královna má o 10 % méně života',fx:{queenHp:-0.1}},
  {id:'h3',br:5,req:'h2',name:'Ozvěna trůnu',desc:'V mapách T13+ se s 15% šancí zjeví Archanděl hniloby',fx:{archCh:0.15}},
  {id:'h4',br:5,req:'h3',name:'Druhý verš',desc:'Za Mirun dostaneš +2 andělská pera a 2 krystaly V',fx:{queenLoot:1}},
  {id:'h5',br:5,req:'h4',name:'Tajná cesta',desc:'Na každém patře mapy je 8% šance na tajnou komoru s pokladem',fx:{secret:0.08}},
  {id:'h6',br:5,req:'h5',name:'Probuzená královna',desc:'Mirun se probudí: +100 % života a +40 % poškození, ale dá 2 unikáty jistě a +2 body sítě poprvé',fx:{uber:1}},
];
const BRANCHES=['Hojnost','Semena','Kořeny','Nebezpečí','Strážci','Hlubina'];
export const atlasOf=p=>{ const a=p.atlas||(p.atlas={}); a.done=a.done||[]; a.nodes=a.nodes||[]; a.pts=a.pts||0; a.queen=a.queen||0; return a; };
export function atlasFx(p){ const fx={}; for(const id of atlasOf(p).nodes){ const n=ATLAS.find(x=>x.id===id); if(n) for(const [k,v] of Object.entries(n.fx)) fx[k]=(fx[k]||0)+v; } return fx; }

// ---------- semena ----------
const modCount=t=>t<=3?rng.int(1,2):t<=8?rng.int(2,3):t<=12?rng.int(3,4):rng.int(4,5);
export const seedModMax=t=>t<=3?3:t<=8?4:t<=12?5:6;
const rollMods=(n,keep=[])=>{ const pool=rng.shuffle(RIFT_MODS.map(m=>m.id).filter(id=>!keep.includes(id))); return [...keep,...pool.slice(0,Math.max(0,n-keep.length))]; };
export function makeSeed(tier){ const t=Math.max(1,Math.min(SEED_MAX_TIER,tier|0)); return {uid:uid(),type:'seed',tier:t,mods:rollMods(modCount(t)),spr:seedSpr({tier:t}),name:'Výtrusné semeno · T'+t}; }
export function makeFrag(i){ i=i==null?rng.int(0,3):i; return {uid:uid(),type:'frag',frag:i,spr:FRAGS[i].spr,name:FRAGS[i].name}; }
export const seedSpr=s=>s.corrupted?'seed_corrupt':s.tier>=16?'seed_t4':s.tier>=11?'seed_t3':s.tier>=6?'seed_t2':'seed_t1';
const CSEED={qty:{n:'+25 % kvantity předmětů',l:{qty:0.25}},mf:{n:'+40 % vzácnosti předmětů',l:{mf:40}},xp:{n:'+30 % zkušeností',l:{xp:0.3}},seed:{n:'Strážce upustí semeno navíc',l:{},seed:1}};
export function seedReward(seed,fx={}){ let qty=0.2+seed.tier*0.02+(fx.qty||0), mf=5+seed.tier*1.5+(fx.mf||0), xp=seed.tier*0.04; // S2: MF v mapách jen trochu
  for(const id of seed.mods){ const m=RIFT_MODS.find(x=>x.id===id); if(!m) continue; qty+=(m.loot?.qty||0)*0.5+0.05; mf+=(m.loot?.mf||0)*0.3; xp+=m.loot?.xp||0; }
  for(const c of seed.cmods||[]){ const l=CSEED[c]?.l||{}; qty+=l.qty||0; mf+=l.mf||0; xp+=l.xp||0; }
  return {qty,mf,xp}; }
export function seedTooltip(seed,fx){ const r=seedReward(seed,fx);
  return `<div class="tt-name" style="color:#9df07a">${esc(seed.name)}</div><div class="tt-sub">Výtrusná mapa · 3 patra + strážce${seed.corrupted?' · <span style="color:#d77">ZKAŽENÉ</span>':''}</div>
  <div class="tt-aff">${seed.mods.map(id=>{ const m=RIFT_MODS.find(x=>x.id===id); return m?`<div class="cu">${m.name}: ${m.desc}</div>`:''; }).join('')}${(seed.cmods||[]).map(c=>`<div class="cr">${CSEED[c]?.n||c}</div>`).join('')}</div>
  <div class="tt-line">Monstra: +${Math.round((mapLife(seed.tier)-1)*100)} % života, +${Math.round((mapDamage(seed.tier)-1)*100)} % poškození · tvůj úhyb a blok −${Math.min(24,Math.round(seed.tier*1.5))} %</div>
  <div class="tt-line good">Odměna: +${Math.round(r.qty*100)} % kvantity · +${Math.round(r.mf)} % vzácnosti · zkušenosti ×${(1.12**seed.tier*(1+r.xp)).toFixed(1)}</div>
  <div class="tt-hint">Zasaď ho u Oltáře hniloby. Předměty z map mají šanci na ★ hlubinné vlastnosti.</div>`; }
export function fragTooltip(it,have){ return `<div class="tt-name" style="color:#c9a0ff">${esc(it.name)}</div><div class="tt-sub">Úlomek Šedé královny (${have}/4)</div><div class="tt-line">Čtyři různé úlomky otevřou u Oltáře hniloby Síň Šedé královny.</div>`; }
export function itemTipEg(it,g){ if(it.type==='seed') return seedTooltip(it,g?atlasFx(g.player):{}); if(it.type==='frag') return fragTooltip(it,g?fragSet(g.player).size:0); return null; }
const fragSet=p=>new Set(p.inv.filter(i=>i.type==='frag').map(i=>i.frag));

// ---------- floor mods pro běh mapy ----------
function runFloorMods(run,p){ const fx=atlasFx(p); const t=run.tier; const fm={name:'',mon:{},loot:{corrupt:0.04},torch:0,eg:t};
  for(const id of run.mods){ const md=RIFT_MODS.find(x=>x.id===id); if(!md) continue; for(const [k,v] of Object.entries(md.mon||{})) fm.mon[k]=typeof v==='number'&&fm.mon[k]?fm.mon[k]*v:v; if(md.torch) fm.torch+=md.torch; if(md.noRegen) fm.noRegen=true; if(md.resDown) fm.resDown=(fm.resDown||0)+md.resDown; if(md.loot?.corrupt) fm.loot.corrupt+=md.loot.corrupt; }
  fm.mon.hp=(fm.mon.hp||1)*mapLife(t); fm.mon.dmg=(fm.mon.dmg||1)*mapDamage(t); fm.blind=Math.min(24,Math.round(t*1.5)); fm.mon.res=(fm.mon.res||0)+Math.min(20,Math.round(t*1.5));
  const r=run.queen?{qty:1,mf:120,xp:0.8}:seedReward(run,fx); fm.loot.qty=r.qty; fm.loot.mf=r.mf; fm.loot.xp=r.xp; fm.loot.xpMul=1.12**t; fm.loot.gf=40+t*5;
  if(fx.mdmg) fm.mon.dmg*=1+fx.mdmg; if(fx.xp) fm.loot.xp+=fx.xp; if(fx.eliteMod) fm.mon.extraMod=true; if(fx.gf) fm.loot.gf+=fx.gf; fm.crystal=fx.crystal||0;
  fm.name=run.queen?(run.uber?'Síň Probuzené královny':'Síň Šedé královny'):`Výtrusná mapa T${t} · patro ${run.floor}/3`; fm.mods=run.mods.map(id=>RIFT_MODS.find(x=>x.id===id)).filter(Boolean);
  return fm; }

// ---------- metody hry ----------
export const GameEG={
  altarNear(){ const p=this.player; return !!this.props?.some(q=>q.type==='altar'&&dist(q.x,q.y,p.x,p.y)<=2); },
  plantBlock(){ if(this.daily) return 'V Denní hlubině mapy nejdou.'; if(this.inRift) return 'Nejdřív opusť Zkaženou jeskyni.'; if(this.mapRun) return 'Už jsi ve Výtrusné mapě.'; if(!this.altarNear()) return 'Musíš stát u Oltáře hniloby.'; if(this.player.hp<=0) return 'Jsi mrtvý.'; return null; },
  plantSeed(seed,biomeId){ const why=this.plantBlock(); if(why){ this.log(why,'warn'); return false; } const p=this.player; const i=p.inv.indexOf(seed); if(i<0||seed.type!=='seed') return false;
    p.inv.splice(i,1); const fx=atlasFx(p); const biome=fx.biome&&BIOMES.some(b=>b.id===biomeId)?biomeId:rng.pick(BIOMES).id;
    if(fx.keepSeed&&rng.chance(fx.keepSeed)){ p.inv.push({...seed,uid:uid()}); this.log('Jarní déšť: semeno ti zůstalo.','good'); }
    const mods=fx.extraMod?rollMods(Math.min(RIFT_MODS.length,seed.mods.length+1),seed.mods):seed.mods.slice();
    this.startRun({tier:seed.tier,mods,cmods:(seed.cmods||[]).slice(),floor:fx.oneFloor?3:1,one:!!fx.oneFloor,corrupted:!!seed.corrupted,biome,boss:rng.int(0,BOSSES.length-1),name:seed.name}); return true; },
  openQueen(){ const why=this.plantBlock(); if(why){ this.log(why,'warn'); return false; } const p=this.player; const have=fragSet(p); if(have.size<4) return false;
    for(let k=0;k<4;k++){ const j=p.inv.findIndex(i=>i.type==='frag'&&i.frag===k); if(j>=0) p.inv.splice(j,1); }
    this.startRun({tier:SEED_MAX_TIER,mods:['extra','resist'],cmods:[],floor:3,biome:'cathedral',boss:0,queen:true,uber:!!atlasFx(p).uber,name:'Síň Šedé královny'}); return true; },
  startRun(run){ const keep=['map','props','monsters','ground','explored','visible','light','lightU8','R','floorMods','pillarRun','cursed','bossRef','hazards'];
    this.mapStash={pos:[this.player.x,this.player.y]}; for(const k of keep) this.mapStash[k]=this[k];
    this.mapRun=run; this.snd('descend'); this.mapFloor(true); this.save();
    this.ui?.banner?.(run.queen?'Síň Šedé královny':'Výtrusná mapa T'+run.tier,run.queen?'Ticho před poslední písní':run.mods.map(id=>RIFT_MODS.find(m=>m.id===id)?.name).filter(Boolean).join(' · ')); },
  mapFloor(first){ const run=this.mapRun, p=this.player; this.floorMods=runFloorMods(run,p);
    const biome=BIOMES.find(b=>b.id===run.biome)||BIOMES[0];
    const map=this.map=generate(this.depth,(Math.random()*4e9)>>>0,{endgame:true,biome,boss:run.floor===3,community:false,city:false});
    this.explored=new Uint8Array(map.W*map.H); this.visible=new Uint8Array(map.W*map.H); this.light=new Float32Array(map.W*map.H*3); this.lightU8=new Uint8Array(map.W*map.H*4);
    this.props=map.props; this.monsters=[]; this.ground=[]; this.fx=[]; this.projs=[]; this.texts=[]; this.hazards=[]; this.cursed=null; this.pillarRun=null; this.bossRef=null; this.inRift=false; this.R=new RNG((Math.random()*4e9)>>>0);
    p.x=p.rx=map.start[0]; p.y=p.ry=map.start[1]; p.path=null; p.status={}; p.steps=0; if(first) p.potions=p.potionMax;
    this.recalc(); this.spawnMonsters(); if(this.bossRef){ this.bossRef.mapBoss=true; if(run.queen){ this.bossRef.queen=true; this.bossRef.unique=true; } }
    if(run.queen) this.queenDecor();
    this.egFloorExtras(run,map);
    if(atlasFx(p).goblin&&!this.monsters.some(m=>m.thief)){ const r=rng.pick(map.rooms.slice(1)); const pos=r&&this.freeIn(r); if(pos){ const m=this.addMonster(SPECIAL.goblin,pos[0],pos[1]); m.hp=m.maxhp=m.maxhp*2.4; m.thief=true; m.flee=0; } }
    this.placeMinions(first); this.lightCache=new Map(); this.turn=0; this.updateFOV(); this.ui?.onFloor?.();
    this.log(run.queen?'Vstupuješ do Síně Šedé královny. Zvony mlčí.':`${this.floorMods.name} · ${biome.name}`,'sys');
    if(run.floor===3&&!run.queen) this.log('Strážce mapy čeká u východu.','warn'); },
  queenDecor(){ const b=this.bossRef, map=this.map; if(!b) return; const room=map.rooms.find(r=>b.x>=r.x&&b.x<r.x+r.w&&b.y>=r.y&&b.y<r.y+r.h)||map.rooms[map.rooms.length-1];
    const ok=(x,y)=>this.passable(x,y)&&!this.monAt(x,y)&&!this.props.some(q=>q.x===x&&q.y===y)&&!(x===map.stairs.x&&y===map.stairs.y);
    const spots=[]; for(let y=room.y;y<room.y+room.h;y++) for(let x=room.x;x<room.x+room.w;x++) if(ok(x,y)) spots.push([x,y]);
    const top=spots.filter(([x,y])=>y===room.y).sort((a,c)=>Math.abs(a[0]-b.x)-Math.abs(c[0]-b.x))[0]; if(top) this.props.push({type:'deco',x:top[0],y:top[1],spr:'queen_throne',block:true,sz:[1.6,2.1],light:[0.75,0.55,1],lr:4});
    const corners=[[room.x,room.y],[room.x+room.w-1,room.y],[room.x,room.y+room.h-1],[room.x+room.w-1,room.y+room.h-1]];
    for(const [x,y] of corners) if(ok(x,y)) this.props.push({type:'deco',x,y,spr:'queen_bell',block:true,sz:[1.1,1.25]});
    this.invalidateLight(); },
  mapDescend(){ const run=this.mapRun; if(run.floor<3&&!run.done){ run.floor++; this.snd('descend'); this.mapFloor(false); this.save(); return; } this.exitMap(); },
  exitMap(){ const S=this.mapStash; this.mapRun=null; this.mapStash=null; if(!S){ this.enterFloor(this.depth); this.save(); return; }
    for(const k of Object.keys(S)) if(k!=='pos') this[k]=S[k]; const p=this.player; p.x=p.rx=S.pos[0]; p.y=p.ry=S.pos[1]; p.path=null; this.inRift=false;
    this.placeMinions(); this.lightCache=new Map(); this.recalc(); this.updateFOV(); this.ui?.onFloor?.(); this.snd('descend'); this.log('Mapa za tebou zarůstá. Jsi zpět u oltáře.','sys'); this.save(); },
  resumeMap(run){ if(!run||this.daily) return; const keep=['map','props','monsters','ground','explored','visible','light','lightU8','R','floorMods','pillarRun','cursed','bossRef','hazards'];
    this.mapStash={pos:[this.player.x,this.player.y]}; for(const k of keep) this.mapStash[k]=this[k]; this.mapRun={...run};
    if(run.done){ this.exitMap(); return; } this.mapFloor(false); this.log('Vracíš se do rozehrané mapy (patro se vygenerovalo znovu).','sys'); },
  mapBossDef(){ const r=this.mapRun; if(!r) return null; return r.queen?QUEEN:BOSSES[r.boss%BOSSES.length]; },
  awardMapKey(item){
    const p=this.player;
    if(p.inv.length<30) p.inv.push(item);
    else (atlasOf(p).pending||=[]).push(item);
    this.log('✦ '+item.name+(p.inv.includes(item)?' přidáno do inventáře.':' čeká u oltáře.'),'loot:sporeborn');
  },
  claimMapKeys(){
    const pending=atlasOf(this.player).pending;
    if(!pending?.length||!this.altarNear()||this.mapRun||this.inRift||this.daily) return false;
    const space=30-this.player.inv.length;
    if(space<=0){ this.log('Inventář je plný!','warn'); return false; }
    this.player.inv.push(...pending.splice(0,space)); this.save(); return true;
  },
  // ---- drops ----
  egDrops(m){ if(this.daily||m.thief||m.mapBoss) return; const p=this.player, fx=atlasFx(p), run=this.mapRun;
    let ch, tier;
    if(run){ if(run.queen) return; ch=m.unique||m.rarity==='rare'?0.06:m.rarity==='magic'?0.015:0.004; tier=run.tier; }
    else if(this.depth>=EG_MIN_DEPTH&&!this.inRift){ ch=m.boss?1:m.unique||m.rarity==='rare'?0.04:m.rarity==='magic'?0.008:0.002; tier=Math.min(5,1+Math.floor((this.depth-EG_MIN_DEPTH)/10)); }
    else return;
    if(!m.boss) ch*=1+(fx.seedCh||0);
    if(rng.chance(ch)) this.dropSeed(m.x,m.y,tier+(rng.chance(0.2+(fx.up||0))?1:0)); },
  dropSeed(x,y,tier){ const s=makeSeed(tier); const pos=this.scatter(x,y); this.ground.push({x:pos[0],y:pos[1],item:s}); this.log('✦ '+s.name+' leží na zemi!','loot:sporeborn'); this.snd('loot_leg'); this.ui?.hint?.('seed','<b>Výtrusné semeno</b> otevře endgame mapu. Zasaď ho u <b>Oltáře hniloby</b> (od hloubky 60 stojí hned u startu patra) v záložce <b>Výtrusná semena</b>. Strážce mapy upustí semeno vyššího tieru.'); return s; },
  mapBossKilled(m){ const run=this.mapRun; if(m.twin){ for(let i=0;i<2;i++) this.dropItem(m.x,m.y,{boost:1.5,rarity:i===0?'rare':undefined}); return; } if(!run||run.done) return; const p=this.player, a=atlasOf(p), fx=atlasFx(p), t=run.tier; run.done=true;
    const lm=this.floorMods?.loot||{};
    const n=(2+Math.round((lm.qty||0)*1.5)+(fx.bossItems||0)+(run.queen?3:0))*(run.one?2:1); // S2: méně, ale cennější
    this.egBossExtras(m,run,fx,a);
    for(let i=0;i<n;i++) this.dropItem(m.x,m.y,{boost:i===0?2:1,rarity:i===0?(run.queen||rng.chance(this.legChance(0.25))?'legendary':'rare'):i<2?'rare':undefined});
    for(let i=0;i<4;i++) this.dropGold(m.x,m.y,3);
    const cores=1+Math.floor(t/5)+(fx.cores||0); p.cores=(p.cores||0)+cores; this.log(`+${cores} zkažené jádro.`,'loot:sporeborn');
    if(run.queen){ a.queen++; const uq=rng.shuffle(['q_crown','q_heart','q_scepter','q_blade']); const got=[uq[0]]; if(rng.chance(0.3)) got.push(uq[1]);
      for(const id of got){ const it=makeItem(60,{uniqueId:id,eg:SEED_MAX_TIER}); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); this.log('✦ '+it.name+' leží na zemi!','loot:legendary'); }
      this.dropSeed(m.x,m.y,SEED_MAX_TIER); this.dropSeed(m.x,m.y,SEED_MAX_TIER);
      if(a.queen===1){ a.pts+=2; this.log('Kořenová síť: +2 body za Šedou královnu.','good'); }
      const li=Math.min(QUEEN_LORE.length-1,(p.egLore||0)); if((p.egLore||0)<QUEEN_LORE.length) p.egLore=(p.egLore||0)+1; this.ui?.loreModal?.(QUEEN_LORE[li].t,QUEEN_LORE[li].x,true);
      this.ui?.banner?.('Šedá královna padla','Zvony utichly'); }
    else {
      this.dropSeed(m.x,m.y,Math.min(SEED_MAX_TIER,t+1+(fx.bossUp||0)));
      if(fx.twin||rng.chance(0.5)) this.dropSeed(m.x,m.y,t+(rng.chance(fx.up||0)?1:0));
      if((run.cmods||[]).includes('seed')) this.dropSeed(m.x,m.y,t);
      const fmin=fx.frag?8:10, fch=fx.fragCh||0;
      if(t===SEED_MAX_TIER||(t>=fmin&&rng.chance(Math.min(0.85,0.35+(t-fmin)*0.05+(fx.frag?0.15:0)+fch)))){
        const have=fragSet(p);
        for(const item of a.pending||[]) if(item.type==='frag') have.add(item.frag);
        const missing=FRAGS.map((_,i)=>i).filter(i=>!have.has(i));
        this.awardMapKey(makeFrag(missing.length?rng.pick(missing):undefined));
      }
      if(t===SEED_MAX_TIER){
        const seed=makeSeed(t); seed.corrupted=true; seed.cmods=[rng.pick(['qty','mf','xp','seed'])];
        seed.spr=seedSpr(seed); seed.name='Zkažené výtrusné semeno · T'+t;
        this.awardMapKey(seed);
      }
      this.ui?.banner?.('Mapa T'+t+' dobyta','Východ je otevřený'); }
    if(!run.queen&&run.corrupted&&!(a.cdone||(a.cdone=[])).includes(t)){ a.cdone.push(t); a.pts++; this.log(`Kořenová síť: zkažená mapa T${t} poprvé dokončena, +1 bod.`,'good'); }
    if(!run.queen&&!a.done.includes(t)){ a.done.push(t); a.pts++; this.log(`Kořenová síť: tier ${t} poprvé dokončen, +1 bod. Utratíš ho v Kořenové síti [N].`,'good'); this.ui?.hint?.('atlas','<b>Kořenová síť [N]</b>: za první dokončení každého tieru mapy dostaneš bod. Utratíš ho kdykoli tlačítkem <b>N</b> vedle pasivního stromu – a body jdou zdarma vrátit.'); }
    this.save(); },
  egFloorExtras(run,map){ const p=this.player, fx=atlasFx(p);
    if(this.bossRef&&run.floor===3){ const b=this.bossRef; if(run.queen){ const k=(1+(fx.queenHp||0))*(run.uber?2:1); b.hp=b.maxhp=b.maxhp*k; if(run.uber){ b.dmg=b.dmg.map(v=>v*1.4); b.name='Probuzená královna Mirun'; } }
      else { if(fx.bossHp) b.hp=b.maxhp=b.maxhp*(1+fx.bossHp);
        if(fx.twinBoss){ const pos=this.freeNear(b.x,b.y); if(pos){ const tw=this.addMonster(rng.pick(BOSSES),pos[0],pos[1],{boss:true}); tw.hp=tw.maxhp=tw.maxhp*0.6; tw.mapBoss=true; tw.twin=true; tw.name+=' (ozvěna)'; } } } }
    if(fx.archCh&&run.tier>=13&&!run.queen&&rng.chance(fx.archCh)){ const r=rng.pick(map.rooms.slice(1)); const pos=r&&this.freeIn(r); if(pos){ const a=this.addMonster(CORE_ANGELS[3],pos[0],pos[1]); a.unique=true; this.log('Ve tmě zazněla andělská píseň. Archanděl hniloby je blízko.','warn'); } }
    if(fx.secret&&rng.chance(fx.secret)){ const r=rng.pick(map.rooms.slice(1)); const pos=r&&this.freeIn(r); if(pos) this.props.push({type:'chest',x:pos[0],y:pos[1],spr:'cath_reliquary',block:true,secret:true,light:[1,0.85,0.5],lr:3}); }
    if(fx.mapAltar&&run.floor===3&&!run.queen){ const pos=this.freeNear(map.start[0]+1,map.start[1]); if(pos) this.props.push({type:'altar',x:pos[0],y:pos[1],spr:'altar',block:true,light:[0.6,1,0.5],lr:3,known:true}); } },
  egBossExtras(m,run,fx,a){ const p=this.player;
    if(fx.bossCrystal){ const it=makeCrystal(rng.pick(['life','war','mind']),4); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); }
    if(fx.bossUnique&&!run.queen&&rng.chance(fx.bossUnique)) this.dropItem(m.x,m.y,{boost:2,rarity:'legendary'});
    if(fx.bossXp) this.gainXP(m.xp*fx.bossXp);
    if(fx.bossRift&&!run.queen){ const pos=this.freeNear(m.x+2,m.y); if(pos){ this.props.push({type:'corerift',x:pos[0],y:pos[1],spr:'arch_broken',block:true,state:'idle',light:[0.85,0.55,1],lr:5}); this.invalidateLight(); this.log('Ze stop strážce se otevřela Trhlina jádra.','warn'); } }
    if(run.queen&&fx.queenLoot){ p.feathers=(p.feathers||0)+2; for(let i=0;i<2;i++){ const it=makeCrystal(rng.pick(['life','war','mind']),5); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); } }
    if(run.queen&&run.uber){ const uq=['q_crown','q_heart','q_scepter','q_blade']; const it=makeItem(60,{uniqueId:rng.pick(uq),eg:SEED_MAX_TIER}); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); if(!a.uber){ a.uber=1; a.pts+=2; this.log('Kořenová síť: +2 body za Probuzenou královnu.','good'); } } },
  egDeath(){ const run=this.mapRun, p=this.player; if(!run||run.done||run.queen||!atlasFx(p).deathKeep) return; const s=makeSeed(run.tier); s.mods=run.mods.slice(); s.cmods=(run.cmods||[]).slice(); if(run.corrupted){ s.corrupted=true; s.spr=seedSpr(s); } if(p.inv.length<30){ p.inv.push(s); this.log('Pevné kořeny: semeno se ti vrátilo.','good'); } },
  egKill(m){ if(m.thief&&this.mapRun&&atlasFx(this.player).goblinLoot){ this.player.cores=(this.player.cores||0)+1; const it=makeCrystal(rng.pick(['life','war','mind']),4); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); } },
  // ---- crafting semen ----
  seedReroll(seed){ const p=this.player; if(seed.corrupted||!(p.cores>0)) return false; p.cores--; seed.mods=rollMods(seed.mods.length); this.snd('loot_rare'); return true; },
  seedAddCost(seed){ return 40+seed.tier*25; },
  seedAdd(seed){ const p=this.player, c=this.seedAddCost(seed); if(seed.corrupted||p.dust<c||seed.mods.length>=seedModMax(seed.tier)+(atlasFx(p).modCap||0)) return false; p.dust-=c; seed.mods=rollMods(seed.mods.length+1,seed.mods); this.snd('loot_rare'); return true; },
  seedCorrupt(seed){ const p=this.player; if(seed.corrupted||!(p.cores>0)) return null; p.cores--; const safe=atlasFx(p).safe; const r=Math.random(); let res;
    if(r<0.1&&!safe){ res='destroyed'; const i=p.inv.indexOf(seed); if(i>=0) p.inv.splice(i,1); p.dust+=seed.tier*15; }
    else if(r<0.32){ res=atlasFx(p).corrLuck&&rng.chance(0.5)?'qty':'nothing'; if(res==='qty') seed.cmods=[...(seed.cmods||[]),'qty']; }
    else if(r<0.52){ res='tier'; if(seed.tier<SEED_MAX_TIER){ seed.tier++; seed.name='Výtrusné semeno · T'+seed.tier; } else { seed.cmods=[...(seed.cmods||[]),'qty']; res='qty'; } }
    else if(r<0.74){ res='mods'; seed.mods=rollMods(Math.min(RIFT_MODS.length,seed.mods.length+2),seed.mods); seed.cmods=[...(seed.cmods||[]),'mf']; }
    else { res=rng.pick(['qty','xp','seed']); seed.cmods=[...(seed.cmods||[]),res]; }
    if(res!=='destroyed'){ seed.corrupted=true; seed.spr=seedSpr(seed); } this.snd(res==='destroyed'?'wrong':res==='nothing'?'curse':'loot_leg'); return res; },
  corruptTwice(it){ const p=this.player; if(!it.base||!it.corrupted||it.corr2||!atlasFx(p).double||(p.cores||0)<3) return null; p.cores-=3; const r=corruptAgain(it); this.snd(r==='destroyed'?'wrong':r==='nothing'?'curse':'loot_leg');
    if(r==='destroyed'){ for(const s of Object.keys(p.equip)) if(p.equip[s]===it) p.equip[s]=null; const i=p.inv.indexOf(it); if(i>=0) p.inv.splice(i,1); } this.recalc(); return r; },
  atlasCan(id){ const p=this.player, a=atlasOf(p), n=ATLAS.find(x=>x.id===id); return !!n&&a.pts>0&&!a.nodes.includes(id)&&(!n.req||a.nodes.includes(n.req)); },
  atlasAlloc(id){ if(!this.atlasCan(id)) return false; const a=atlasOf(this.player); a.pts--; a.nodes.push(id); this.save(); return true; },
  atlasReset(){ const a=atlasOf(this.player); a.pts+=a.nodes.length; a.nodes=[]; this.save(); },
  // ---- unikáty z endgamu ----
  egRecalc(st){ const u=st.uniques, p=this.player; const bl=this.floorMods?.blind||0; if(bl){ st.dodge=Math.max(0,st.dodge-bl); st.block=Math.max(0,st.block-bl); }
    if(u.has('eg_seedcrown')) st.more*=1+Math.min(16,atlasOf(p).done.length)/100;
    if(u.has('eg_rootplate')) st.dr+=Math.min(10,Math.floor(st.armor/400));
    if(u.has('eg_bellring')){ st.skill+=1; st.life=Math.round(st.life*0.9); }
    if(u.has('eg_mirestep')&&this.mapRun) st.mf+=40;
    if(u.has('q_crown')) st.pen+=15;
    if(u.has('q_scepter')) st.more*=1.2*(this.mapRun?1.2:1); },
  egCheatDeath(){ const p=this.player; if(!p.stats.uniques?.has('q_heart')||this._qheart===this.map) return false; this._qheart=this.map; p.hp=Math.max(1,Math.round(p.stats.life*0.3));
    this.log('Srdce, které nespí, tě nenechalo padnout!','good'); this.float(p.x,p.y,'Nespí!','#c9a0ff',1.3); this.burst(p.x,p.y,[0.75,0.55,1],30,110); return true; },
};

// ---------- UI ----------
export const UIEG={
  egTabs(){ const t=this.craftTab||'items'; const a=atlasOf(this.g.player);
    return `<div class="ctabs">${[['items','Recepty'],['seeds','Výtrusná semena'],['atlas','Kořenová síť'+(a.pts?` (${a.pts})`:'')]].map(([k,n])=>`<button data-ct="${k}" class="${t===k?'on':''}">${n}</button>`).join('')}</div>`; },
  egSeedsHTML(){ const g=this.g,p=g.player, fx=atlasFx(p); const seeds=p.inv.filter(i=>i.type==='seed'), frags=p.inv.filter(i=>i.type==='frag'); const have=fragSet(p);
    if(this.seedSel&&!p.inv.includes(this.seedSel)) this.seedSel=null; const s=this.seedSel; const block=g.plantBlock();
    let act='';
    if(s){ const add=g.seedAddCost(s), canAdd=s.mods.length<seedModMax(s.tier)+(atlasFx(g.player).modCap||0);
      act=`<div class="craftsel"><div class="ttc">${seedTooltip(s,fx)}</div><div class="cbtn">
        ${fx.biome?`<label class="egbio">Biom: <select id="eg-bio">${BIOMES.map(b=>`<option value="${b.id}" ${this.egBiome===b.id?'selected':''}>${b.name}</option>`).join('')}</select></label>`:''}
        <button data-eg="plant" class="corrbtn" ${block?'disabled':''}>🌱 Zasadit a vstoupit</button>${block?`<div class="hint">${block}</div>`:''}
        ${s.corrupted?'<div class="hint">Zkažené semeno už nejde měnit.</div>':`
        <button data-eg="reroll" ${(p.cores||0)<1?'disabled':''}>Přerolovat mody · 1 jádro (${p.cores||0})</button>
        ${canAdd?`<button data-eg="add" ${p.dust<add?'disabled':''}>Přidat mod · ${fmt(add)} ✦</button>`:''}
        <button data-eg="corrupt" ${(p.cores||0)<1?'disabled':''}>☣ Zkazit semeno · 1 jádro${fx.safe?' (nezničí se)':''}</button>`}</div></div>`; }
    const q=have.size>=4?`<button data-eg="queen" class="egbtn corrbtn" ${block?'disabled':''}>👑 Otevřít Síň Šedé královny (spotřebuje 4 úlomky)</button>`:'';
    const waiting=atlasOf(p).pending?.length||0;
    return `<h2>Oltář hniloby · Výtrusná semena</h2><div class="hint">Semena padají od hloubky ${EG_MIN_DEPTH}. Mapa má 3 patra a strážce. Od T10 můžeš získat úlomek Šedé královny. T16 vždy odmění úlomkem a zkaženým semenem. Úlomky nejdřív doplňují chybějící kusy. Smrt v mapě mapu ukončí.</div>
      ${waiting?`<button data-eg="claim" class="egbtn" ${block?'disabled':''}>Vyzvednout odměny (${waiting})</button>`:''}
      <div class="bag craftbag">${seeds.map(i=>this.slotHTML(i,`data-seed="${p.inv.indexOf(i)}" ${i===s?'data-sel="1"':''}`)).join('')||'<div class="hint">Nemáš žádné semeno.</div>'}</div>${act}
      <h3 class="sm">Úlomky královny (${have.size}/4)</h3><div class="bag craftbag">${frags.map(i=>this.slotHTML(i,`data-frag="${p.inv.indexOf(i)}"`)).join('')||'<div class="hint">Žádné úlomky.</div>'}</div>${q}`; },
  egAtlasHTML(){ const g=this.g,p=g.player, a=atlasOf(p); const UI=n=>`assets/ui/${n}.webp`;
    const ICO={a1:'coins3',a2:'ico_luck',a3:'chest',a4:'crystal_violet',a5:'crystal_green',a6:'coins2',b1:'seed_t1',b2:'seed_t2',b3:'seed_t3',b4:'frag_crown',b5:'deco_shroom10',b6:'pool_water',c1:'crystal_violet',c2:'deco_shroom12',c3:'roots',c4:'npc_merchant',c5:'stump',c6:'altar',d1:'spore_cloud',d2:'skull',d3:'eye_blob',d4:'seed_corrupt',d5:'bag_shroom',d6:'arch_broken',e1:'boss_moss',e2:'boss_giant',e3:'chest',e4:'boss_giant2',e5:'arch',e6:'treant',h1:'frag_eye',h2:'q_crown',h3:'cath_bell',h4:'q_heart',h5:'tomb',h6:'queen_mirun'};
    const cols=BRANCHES.map((bn,bi)=>{ const ns=ATLAS.filter(n=>n.br===bi);
      return `<div class="atcol"><div class="atbr">${bn}</div>${ns.map((n,k)=>{ const on=a.nodes.includes(n.id), can=g.atlasCan(n.id), key=k===ns.length-1;
        const fr=UI((key?'node_k':'node_n')+(on?'_on':'')); const lit=on||(k>0&&a.nodes.includes(ns[k-1].id));
        return `${k?`<div class="atl ${lit&&on?'on':''}"></div>`:''}<div class="atn ${on?'on':can?'can':'lock'} ${key?'key':''}" data-at="${n.id}" data-node="eg-${n.id}" style="background-image:url(${fr})"><img src="${this.icon(ICO[n.id],64)}"></div><div class="atname ${on?'on':''}">${n.name}</div>`; }).join('')}</div>`; }).join('');
    const next=Array.from({length:SEED_MAX_TIER},(_,i)=>i+1).find(t=>!a.done.includes(t));
    const tiers=Array.from({length:SEED_MAX_TIER},(_,i)=>{ const t=i+1, on=a.done.includes(t), cd=(a.cdone||[]).includes(t); return `<span class="att ${on?'on':''} ${cd?'cd':''} ${t===next?'next':''}" style="background-image:url(${UI(on?'node_s_on':'node_s')})" title="Tier ${t}${on?' dokončen':''}">${t}</span>`; }).join('');
    return `<h2>Kořenová síť</h2><div class="hint">Body: každý tier poprvé (1), každý tier se <b style="color:#c99bff">zkaženým semenem</b> poprvé (1, fialová linka), Šedá královna (2) a Probuzená královna (2). Najetím na uzel uvidíš, co dělá.</div>
      <div class="atinfo"><span class="atpts">Volné body: <b>${a.pts}</b></span><span>Šedá královna poražena: <b>${a.queen}×</b></span>${a.nodes.length?'<button data-at="reset" class="egbtn">Vrátit body</button>':''}</div>
      <div class="attiers">${tiers}</div><div class="atlas">${cols}</div>`; },
  egDoubleBtn(it){ const p=this.g.player; if(!it?.corrupted||it.corr2||!atlasFx(p).double) return ''; return `<button data-eg="c2" class="corrbtn" ${(p.cores||0)<3?'disabled':''}>☣☣ Zkazit podruhé · 3 jádra (${p.cores||0})</button>`; },
  egWire(el){ const g=this.g,p=g.player;
    el.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{ this.craftTab=b.dataset.ct; this.tip(null); this.renderPanel(); });
    const tipOn=(n,it)=>{ n.onmouseenter=e=>this.tip(itemTipEg(it,g)||tooltipHTML(it),e); n.onmouseleave=()=>this.tip(null); };
    el.querySelectorAll('[data-seed]').forEach(n=>{ const it=p.inv[+n.dataset.seed]; if(!it) return; tipOn(n,it); n.onclick=()=>{ this.seedSel=it; this.tip(null); this.renderPanel(); }; });
    el.querySelectorAll('[data-frag]').forEach(n=>{ const it=p.inv[+n.dataset.frag]; if(it) tipOn(n,it); });
    const bio=el.querySelector('#eg-bio'); if(bio){ if(!this.egBiome) this.egBiome=bio.value; bio.onchange=()=>{ this.egBiome=bio.value; }; }
    el.querySelectorAll('[data-eg]').forEach(b=>b.onclick=()=>{ const s=this.seedSel, c=b.dataset.eg; this.tip(null);
      if(c==='plant'&&s){ if(g.plantSeed(s,this.egBiome)){ this.seedSel=null; this.panel=null; this.renderPanel(); this.refresh(); } return; }
      if(c==='queen'){ if(g.openQueen()){ this.panel=null; this.renderPanel(); this.refresh(); } return; }
      if(c==='claim') g.claimMapKeys();
      if(c==='reroll'&&s){ if(g.seedReroll(s)) g.log('Semeno přerostlo: '+s.mods.map(id=>RIFT_MODS.find(m=>m.id===id)?.name).join(', '),'good'); }
      if(c==='add'&&s){ if(g.seedAdd(s)) g.log('Semenu narostl nový mod.','good'); }
      if(c==='corrupt'&&s){ const r=g.seedCorrupt(s); if(r){ const t={destroyed:'Semeno se rozpadlo v prach.',nothing:'Zkaženo – beze změny.',tier:'Semeno povyrostlo o tier!',mods:'Semenu narostly 2 mody a lepší odměna.',qty:'Zkažené: +25 % kvantity.',xp:'Zkažené: +30 % zkušeností.',seed:'Zkažené: strážce upustí semeno navíc.'}[r]; g.log('Oltář: '+t,r==='destroyed'?'warn':'loot:sporeborn'); this.banner(r==='destroyed'?'Rozpadlo se':'Zkaženo',t); if(r==='destroyed') this.seedSel=null; } }
      if(c==='c2'){ const it=this.craftSel; const r=g.corruptTwice(it); if(r){ g.log('Dvojí hniloba: '+(r==='destroyed'?'předmět se rozpadl.':'předmět se zkazil podruhé.'),r==='destroyed'?'warn':'loot:sporeborn'); if(r==='destroyed') this.craftSel=null; } }
      this.refresh(); });
    el.querySelectorAll('[data-at]').forEach(b=>{ const n=ATLAS.find(x=>x.id===b.dataset.at);
      if(n){ b.onmouseenter=e=>{ const a=atlasOf(p), on=a.nodes.includes(n.id), can=g.atlasCan(n.id), req=n.req&&ATLAS.find(x=>x.id===n.req);
        this.tip(`<div class="tt-name" style="color:${on?'#9df07a':'#d9c38c'}">${n.name}</div><div class="tt-sub">${BRANCHES[n.br]}${on?' · aktivní':''}</div><div class="tt-line">${n.desc}</div><div class="tt-hint">${on?'Uzel je aktivní.':can?'Klikni pro aktivaci (1 bod).':a.pts<1?'Nemáš volný bod – dokonči nový tier mapy.':req?'Nejdřív aktivuj: '+req.name:''}</div>`,e); }; b.onmouseleave=()=>this.tip(null); }
      b.onclick=()=>{ this.tip(null); if(b.dataset.at==='reset') g.atlasReset(); else if(!g.atlasAlloc(b.dataset.at)) return; this.renderPanel(); }; }); },
  egUnlocked(){ const g=this.g, p=g?.player; if(!p||g.daily) return false; return (g.best||0)>=EG_MIN_DEPTH||!!p.atlas||p.inv.some(i=>i.type==='seed'||i.type==='frag'); },
  egInvClick(it){ const g=this.g; if(g.altarNear()&&!g.mapRun){ this.panel='craft'; this.craftTab='seeds'; if(it.type==='seed') this.seedSel=it; this.renderPanel(); return; }
    g.log(it.type==='seed'?'Semeno zasadíš u Oltáře hniloby (od hloubky 60 stojí hned u startu patra).':'Čtyři různé úlomky otevřou u Oltáře hniloby Síň Šedé královny.','hint'); },
};
