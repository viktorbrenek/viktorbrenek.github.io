// Sporium v2 – core state, turns, combat pipeline (supports, keystones, ailments), AI, bosses, events
import {rng,RNG,clamp,dist,edist,fov,los,astar,DIRS8,fmt,line} from './util.js';
import {generate,WALL,FLOOR} from './dungeon.js';
import {MONSTERS,BOSSES,MINIBOSSES,MON_MODS,MON_RARE_A,MON_RARE_B,SKILLS,SUPPORTS,CLASSES,CORRUPTIONS,BASES,PASSIVE_MAP,EVENTS,resPenalty,SPECIAL,RIFT_MODS,LORE,MINIONS,FORMS,SETS,skillsFor} from './data.js';
import {makeItem,makeSupport,itemStats,itemValue,corruptItem,setTooltipCtx} from './items.js';
import {audio} from './audio.js';
import {LB} from './net.js';

export const T=64;
const SAVE_KEY='sporium_save_v2', ROSTER_KEY='sporium_roster_v1', STASH_KEY='sporium_stash_v1'; export const STASH_MAX=10;
const LS={ get(k){ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }, del(k){ try{ localStorage.removeItem(k); }catch(e){} } };
export const Roster={
  all(){ let r=LS.get(ROSTER_KEY); if(!r){ r={chars:{},last:null}; const old=LS.get(SAVE_KEY); if(old&&old.player){ const id='c'+Date.now(); r.chars[id]=old; r.last=id; LS.del(SAVE_KEY); } LS.set(ROSTER_KEY,r); } return r; },
  list(){ const r=this.all(); return Object.entries(r.chars).map(([id,s])=>({id,cls:s.player.cls,name:s.player.name,nick:s.player.nick||'',lvl:s.player.lvl,depth:s.depth,best:s.best,time:s.time||0})).sort((a,b)=>b.time-a.time); },
  get(id){ return this.all().chars[id]; }, put(id,data){ const r=this.all(); r.chars[id]=data; r.last=id; LS.set(ROSTER_KEY,r); }, del(id){ const r=this.all(); delete r.chars[id]; LS.set(ROSTER_KEY,r); },
};
export const Stash={ get(){ return LS.get(STASH_KEY)||[]; }, set(a){ LS.set(STASH_KEY,a); } };
const HPM=1.55, DMGM=1.85;
const EL=['poison','fire','decay'];
export class Game{
  constructor(ui){ this.ui=ui; this.fx=[]; this.texts=[]; this.projs=[]; this.hazards=[]; this.shake=0; this.time=0; this.msgs=[]; this.floorMods=null; this.minions=[]; }
  snd(n,x,y,o={}){ if(!n) return; const p=this.player; audio.play(n,{x,y,px:p?.x,py:p?.y,...o}); }
  face(e,tx){ if(tx!=null&&tx!==e.x) e.flip=tx<e.x; }
  // ================= setup =================
  newCharacter(clsId){
    this.charId=null; this.floorMods=null; this.msgs=[]; this.minions=[];
    const c=CLASSES.find(x=>x.id===clsId);
    const p=this.player={cls:c.id,spr:c.spr,name:c.name,lvl:1,xp:0,base:{...c.stats},points:0,ppoints:1,passives:['c'],gold:0,dust:0,
      equip:{},inv:[],skills:{attack:1},links:{},bar:[null,null,null,null],form:null,nick:'',playSec:0,potions:3,potionMax:3,stats:{},hp:1,mp:1,es:0,cores:0,lore:[],buffs:[],status:{},steps:0,x:0,y:0,rx:0,ry:0,cds:{}};
    for(const s of c.skills) p.skills[s]=1; p.bar[0]=c.skills[0]; p.bar[1]=c.skills[1];
    for(const b of c.gear){ const it=makeItem(1,{baseId:b,rarity:'common'}); const base=BASES.find(x=>x.id===b); this.equip(it,base.slot==='ring'?'ring1':base.slot,true); }
    p.inv.push(makeSupport(c.rune||'crit'));
    this.depth=1; this.checkpoint=1; this.best=1; this.kills=0; this.seed=(Math.random()*1e9)|0;
    this.recalc(); p.hp=p.stats.life; p.mp=p.stats.mana;
    this.enterFloor(1); this.log(`${c.name} sestupuje do Sporia. Hloubka 1.`,'sys'); this.log('Tip: [P] pasivní strom, [K] dovednosti a runy.','hint'); this.save();
  }
  load(id){ try{ const s=Roster.get(id); if(!s||!s.player) return false; this.charId=id; this.floorMods=null; this.msgs=[]; this.minions=[];
      Object.assign(this,{depth:s.depth,checkpoint:s.checkpoint,best:s.best,kills:s.kills||0,seed:s.seed});
      this.player={links:{},passives:['c'],ppoints:0,cds:{},cores:0,lore:[],es:0,...s.player,buffs:[],status:{},steps:0,rx:0,ry:0,form:null}; for(const it of [...this.player.inv,...Object.values(this.player.equip)]) if(it&&it.type==='support') it.spr='rune_'+it.sup; if(this.player.playSec==null) this.player.playSec=(s.best||1)*60; if(!(this.player.hp>0)){ this.recalc(); this.player.hp=this.player.stats.life; this.player.mp=this.player.stats.mana; } if(this.player.nick==null) this.player.nick=''; { const p=this.player; const ok=p.passives.filter(id=>PASSIVE_MAP[id]); const lost=p.passives.length-ok.length; if(lost){ p.passives=['c']; p.ppoints+=Math.max(0,lost+ok.length-1); this.log('Pasivní strom se rozrostl – body ti byly vráceny [P].','good'); } } this.recalc(); this.enterFloor(this.depth); this.log('Návrat do hlubin. Hloubka '+this.depth+'.','sys'); return true; }catch(e){ console.warn(e); return false; } }
  static hasSave(){ return Roster.list().length>0; }
  save(){ try{ const p=this.player; const {buffs,status,path,rx,ry,lunge,flash,stats,...rest}=p;
      if(!this.charId) this.charId='c'+Date.now()+Math.floor(Math.random()*1000); Roster.put(this.charId,{depth:this.depth,checkpoint:this.checkpoint,best:this.best,kills:this.kills,seed:this.seed,time:Date.now(),player:rest}); }catch(e){ console.warn(e); }
    this.lbSync(); }
  lbSync(force){ const p=this.player; if(!LB.enabled()||!p?.nick) return; if(!force&&this.best<=(p.lbSent||0)) return;
    LB.submit(this,force).then(r=>{ if(!r||r.throttled){ clearTimeout(this._lbT); this._lbT=setTimeout(()=>this.lbSync(),17500); return; } if(r.ok&&!r.throttled){ p.lbSent=Math.max(p.lbSent||0,this.best); }
      else if(r.status===409&&!this._nickWarned){ this._nickWarned=true; this.log('Žebříček: přezdívka „'+p.nick+'“ je obsazená jiným hráčem. Změň ji v menu [Esc].','warn'); }
      else if(r.status===422&&!this._lbWarned){ this._lbWarned=true; console.warn('leaderboard rejected',r.error); } }); }
  static wipe(){}

  enterFloor(d){
    this.depth=d; this.best=Math.max(this.best,d);
    this.R=new RNG((this.seed^(d*104729)^(Date.now()&0xffff))>>>0);
    const fm=this.floorMods?.mon||{};
    let ev=null; if(d>=2&&d%5!==0&&this.R.chance(0.5)) ev=this.R.pick(Object.keys(EVENTS)); if(fm.hunter) ev='hunter';
    const map=this.map=generate(d,(this.seed+d*7919+(Date.now()&0xfff))>>>0,{event:ev,ambush:fm.ambush});
    this.explored=new Uint8Array(map.W*map.H); this.visible=new Uint8Array(map.W*map.H);
    this.light=new Float32Array(map.W*map.H*3); this.lightU8=new Uint8Array(map.W*map.H*4);
    this.props=map.props; this.monsters=[]; this.ground=[]; this.fx=[]; this.projs=[]; this.texts=[]; this.hazards=[]; this.cursed=null; this.pillarRun=null; this.bossRef=null; this.inRift=false; this.stash=null;
    const p=this.player; p.x=p.rx=map.start[0]; p.y=p.ry=map.start[1]; p.path=null; p.status={}; p.steps=0; p.potions=p.potionMax;
    this.recalc(); this.spawnMonsters(); this.placeMinions(true); this.lightCache=new Map();
    this.turn=0; this.updateFOV(); this.ui?.onFloor?.();
    if(map.puzzle){ const k=map.puzzle.kind; this.log({levers:'Někde v patře pulzují kokony. Zničené kokony otevřou trezor.',braziers:'Vyhaslá žároviště čekají na plamen tvé pochodně.',runes:'Runové kameny šeptají. Hledej obelisk s pořadím.',plates:'Někde dýchají kamenné plotny. Rozsviť je všechny naráz.',bells:'Z hlubin zní krystaly. Matka krystalů zná melodii.',riddle:'Hrob mudrce čeká na odpověď.'}[k],'hint'); }
    if(map.boss) this.log('Ze tmy se ozývá těžký dech. Strážce hloubky je blízko.','warn');
    if(map.event){ const e=EVENTS[map.event]; this.log(`⚠ ${e.name}: ${e.desc}`,'warn'); this.ui?.banner?.(e.name,e.desc); }
    const pen=resPenalty(d); if(d>1&&d%5===1) this.log(`Hlubiny oslabují tvé odolnosti (${pen} %).`,'warn');
  }
  monScale(){ const d=this.depth; const fm=this.floorMods?.mon||{}; const ramp=Math.min(1,0.5+d*0.15); const bo=this.map?.event==='blackout'?1.2:1;
    return {hp:HPM*ramp*Math.pow(1.13,d-1)*(fm.hp||1), dmg:DMGM*ramp*Math.pow(1.10,d-1)*(fm.dmg||1)*bo, xp:Math.pow(1.12,d-1), arm:Math.pow(1.08,d-1)}; }
  spawnMonsters(){
    const d=this.depth, R=this.R, fm=this.floorMods?.mon||{}; const pool=MONSTERS.filter(m=>d>=m.d[0]&&d<=m.d[1]);
    for(const sp of this.map.spawns){
      if(sp.ambush){ sp.pending=true; continue; }
      const pts=sp.pts.slice(); if(fm.count) for(const pt of sp.pts.slice(0,Math.round(sp.pts.length*(fm.count-1)))){ const n=this.freeNear(pt[0],pt[1]); if(n) pts.push(n); }
      if(sp.boss){ const b=BOSSES[Math.floor(d/5-1)%BOSSES.length]; const s=this.map.stairs; const pos=this.freeNear(s.x,s.y)||pts[0]; if(pos) this.bossRef=this.addMonster(b,pos[0],pos[1],{boss:true}); }
      this.spawnPack(pts,pool,R);
    }
    // treasure goblin
    if(d>=2&&!this.inRift&&R.chance(0.16)){ const r=R.pick(this.map.rooms.slice(1)); const pos=this.freeIn(r); if(pos){ const m=this.addMonster(SPECIAL.goblin,pos[0],pos[1]); m.hp=m.maxhp=m.maxhp*2.4; m.thief=true; m.flee=0; } }
    // mini-boss
    if(d>=3&&!this.map.boss&&R.chance(0.3)){ const r=R.pick(this.map.rooms.slice(2)); const pos=this.freeIn(r); if(pos){ const mb=R.pick(MINIBOSSES); const def=MONSTERS.find(m=>m.id===mb.base); const m=this.addMonster(def,pos[0],pos[1],{rarity:'rare',mods:mb.mods}); m.name=mb.name; m.spr=mb.spr; m.unique=true; m.hp=m.maxhp=m.maxhp*1.5; } }
    // events
    const ev=this.map.event, ed=this.map.evData;
    if(ev==='nest'&&ed){ const pr=this.props.find(q=>q.type==='nest'); this.props.splice(this.props.indexOf(pr),1);
      const m=this.addMonster({id:'nest',name:'Plodící hnízdo',spr:'shroom_house2',hp:90,dmg:[0,0],arm:6,spd:100,xp:60,ai:'nest',res:{poison:50},sc:1.25,light:[0.6,1,0.3]},ed.x,ed.y,{}); m.nest=true; }
    if(ev==='hunter'){ const far=this.map.rooms[this.map.rooms.length-1]; const pos=this.freeIn(far)||this.freeNear(this.map.stairs.x,this.map.stairs.y); if(pos){ const def=R.pick(pool.filter(m=>m.ai==='melee'||m.ai==='charger'))||pool[0]; const m=this.addMonster(def,pos[0],pos[1],{rarity:'rare',mods:['swift',R.pick(['berserk','vampiric','reflect','huge'])]}); m.name='Lovec · '+def.name; m.aware=true; m.hunter=true; m.unique=true; } }
  }
  spawnPack(pts,pool,R){
    const d=this.depth, fm=this.floorMods?.mon||{};
    const packType=R.pick(pool); const roll=R.next();
    const rareP=Math.min(0.15,0.02+d*0.004)+(fm.elite||0)*0.5, magicP=Math.min(0.28,0.07+d*0.007)+(fm.elite||0);
    const packRar=d<2?null:roll<rareP?'rare':roll<rareP+magicP?'magic':null;
    const mod=packRar==='magic'?R.pick(MON_MODS).id:null; const out=[];
    pts.forEach((pt,i)=>{ const def=R.chance(0.6)?packType:R.pick(pool);
      if(packRar==='rare'&&i===0) out.push(this.addMonster(def,pt[0],pt[1],{rarity:'rare'}));
      else if(packRar==='magic'&&i<3) out.push(this.addMonster(def,pt[0],pt[1],{rarity:'magic',mods:[mod]}));
      else out.push(this.addMonster(def,pt[0],pt[1])); });
    return out;
  }
  freeIn(r){ for(let k=0;k<60;k++){ const x=this.R.int(r.x,r.x+r.w-1), y=this.R.int(r.y,r.y+r.h-1); if(this.passable(x,y)&&!this.monAt(x,y)&&!this.minAt(x,y)&&!(x===this.player.x&&y===this.player.y)) return [x,y]; } return null; }
  freeNear(x,y){ for(let r=1;r<5;r++) for(const [dx,dy] of DIRS8){ const nx=x+dx*r, ny=y+dy*r; if(this.passable(nx,ny)&&!this.monAt(nx,ny)&&!this.minAt(nx,ny)&&!(nx===this.player.x&&ny===this.player.y)) return [nx,ny]; } return null; }
  addMonster(def,x,y,{rarity,mods,boss}={}){
    const s=this.monScale(), fm=this.floorMods?.mon||{};
    if(fm.allMagic&&!rarity&&!boss&&def.ai!=='thief'){ rarity='magic'; mods=[rng.pick(MON_MODS).id]; }
    if(rarity==='rare'&&!mods){ mods=rng.shuffle(MON_MODS.map(m=>m.id)).slice(0,(this.depth<10?2:3)+(fm.extraMod?1:0)); }
    mods=mods||[]; const has=id=>mods.includes(id);
    const rm=rarity==='rare'?{hp:3.4,dmg:1.35,xp:5}:rarity==='magic'?{hp:1.8,dmg:1.15,xp:2}:{hp:1,dmg:1,xp:1};
    let hp=def.hp*s.hp*rm.hp*(has('huge')?1.6:1)*(boss?1:1);
    const res={poison:0,fire:0,decay:0,...(def.res||{})}; const extra=(fm.res||0)+(has('resist')?40:0)+(boss?10:0); for(const k of EL) res[k]=Math.min(75,res[k]+extra);
    const tint=mods.length?(MON_MODS.find(x=>x.id===mods[0])?.tint):null;
    const m={def,id:def.id,name:def.name,spr:def.spr,x,y,rx:x,ry:y,hp,maxhp:hp,dmg:[def.dmg[0]*s.dmg*rm.dmg,def.dmg[1]*s.dmg*rm.dmg],
      arm:def.arm*s.arm*(has('armored')?2.5:1)*(boss?1.5:1),spd:def.spd*(has('swift')?1.35:1)*(fm.spd||1),energy:rng.int(0,99),ai:def.ai,el:def.el||(has('venom')?'poison':has('fireench')?'fire':has('decayench')?'decay':null),
      xp:def.xp*s.xp*rm.xp*(boss?1.5:1),rarity:rarity||'normal',mods,boss:!!boss,status:{},sc:(def.sc||1)*(has('huge')?1.3:1)*(rarity==='rare'?1.12:rarity==='magic'?1.05:1),light:def.light,aware:!!boss,cd:0,res,tint,flip:rng.chance(0.5),regen:(def.regen||0)+(has('regen')?0.03:0),
      shield:has('shielded')?hp*0.35:0, addEl:(has('fireench')||has('decayench'))?0.5:0, patI:0};
    if(rarity==='magic') m.name=MON_MODS.find(x=>x.id===mods[0]).name+' '+def.name.toLowerCase();
    if(rarity==='rare') m.name=rng.pick(MON_RARE_A)+' '+rng.pick(MON_RARE_B).toLowerCase();
    if(boss){ m.name=def.name; m.patterns=def.pat; }
    this.monsters.push(m); return m;
  }
  // ================= stats =================
  recalc(){
    const p=this.player; const S={}; const add=(k,v)=>S[k]=(S[k]||0)+v;
    const ks=new Set();
    for(const id of p.passives||[]){ const n=PASSIVE_MAP[id]; if(!n) continue; if(n.k) ks.add(n.k); for(const [k,v] of Object.entries(n.s)) add(k,v); }
    const form=p.form||null; const noOff=ks.has('apex')&&form;
    const setCnt={};
    for(const [sl,it] of Object.entries(p.equip)) if(it&&!(noOff&&sl==='offhand')){ for(const [k,v] of Object.entries(itemStats(it))) add(k,v); if(it.set) setCnt[it.set]=(setCnt[it.set]||0)+1; }
    const setPow=new Set(); for(const [sid,n] of Object.entries(setCnt)){ const SD=SETS.find(x=>x.id===sid); if(!SD) continue; for(const t of [2,3]) if(n>=t) for(const [k,v] of Object.entries(SD.bonus[t])) add(k,v); if(n>=4) setPow.add(sid); }
    const cl=CLASSES.find(c=>c.id===p.cls); if(cl?.trait) for(const [k,v] of Object.entries(cl.trait.s)) add(k,v);
    const might=p.base.might+(S.might||0), fin=p.base.finesse+(S.finesse||0), wits=p.base.wits+(S.wits||0);
    const w=p.equip.weapon; const kind=w?.kind||'melee';
    const st={might,finesse:fin,wits,kind:form?'melee':kind,ks,form,setPow,setCnt};
    st.life=Math.round((28+p.lvl*5+might*1.5+(S.life||0))*(1+(S.lifePct||0)/100)*(ks.has('glass')?0.7:1)*(ks.has('bloodmagic')?1.3:1));
    const lifeRaw=st.life;
    st.mana=ks.has('bloodmagic')?0:Math.round(15+p.lvl*1.5+wits*2.5+(S.mana||0));
    st.armor=Math.round((S.armor||0)*(1+((S.armorPct||0)+fin*0.3)/100));
    const wd=w?.dmg||[1,3]; const flat=S.dmg||0;
    st.dmgPct=(S.dmgPct||0)+(kind==='bow'?fin*1.0:kind==='melee'?might*1.0:might*0.3);
    st.physPct=S.physPct||0; st.elemPct=S.elemPct||0;
    st.dmg=[(wd[0]+flat),(wd[1]+flat)];
    st.fire=S.fire||0; st.poison=S.poison||0; st.decay=S.decay||0;
    st.spell=(S.spell||0)+wits*1.2;
    st.spellBase=(3+p.lvl*1.1+(wd[0]+wd[1])*0.5*(kind==='staff'?1:0.35)+(st.fire+st.poison+st.decay)*0.5);
    st.crit=ks.has('rotsoul')?0:Math.min(75,3+fin*0.15+(S.crit||0)+(ks.has('darkhunter')?5:0)); st.critMult=150+(S.critMult||0)-(ks.has('resonance')?30:0);
    st.poisonCh=S.poisonCh||0; st.burnCh=S.burnCh||0; st.bleed=S.bleed||0; st.stun=S.stun||0;
    st.dot=(S.dot||0)+(ks.has('eldritch')?60:0); st.pen=S.pen||0; st.lifeKill=S.lifeKill||0; st.execPct=S.execPct||0;
    st.leech=S.leech||0; st.regen=(S.regen||0); st.manaRegen=ks.has('pact')?0:0.4+wits*0.03+(S.manaRegen||0);
    const pen=resPenalty(this.depth||1)-(this.floorMods?.resDown||0), maxR=75+(S.maxRes||0), res=S.res||0;
    st.resPoison=Math.min(maxR,res+(S.resPoison||0)+pen); st.resFire=Math.min(maxR,res+(S.resFire||0)+pen); st.resDecay=Math.min(maxR,res+(S.resDecay||0)+pen); st.resPen=pen;
    st.torch=5+(S.torch||0)+(this.floorMods?.torch||0)+(this.map?.event==='storm'?-1:0)+(ks.has('darkhunter')?-2:0);
    st.mf=(S.mf||0)+(this.map?.event==='blackout'?20:0); st.gf=S.gf||0; st.cdr=Math.min(50,S.cdr||0); st.thorns=S.thorns||0;
    st.skill=S.skill||0; st.dodge=ks.has('rootwill')||ks.has('iron')?0:Math.min(60,fin*0.15+(S.dodge||0)); st.block=Math.min(ks.has('rootwill')?75:60,(S.block||0)*(ks.has('rootwill')?2:1)); st.xp=S.xp||0; st.potion=S.potion||0;
    st.reach=S.reach||0; st.aoe=S.aoe||0; st.more=(ks.has('glass')?1.4:1);
    st.uniques=new Set(Object.values(p.equip).filter(i=>i&&i.unique).map(i=>i.unique));
    if(st.uniques.has('blood_idol')) ks.add('bloodmagic_item');
    for(const b of p.buffs){ if(b.armorPct) st.armor*=1+b.armorPct; if(b.regen) st.regen+=b.regen; if(b.dmgPct) st.more*=1+b.dmgPct; if(b.torch) st.torch+=b.torch; }
    if(st.uniques.has('rotheart')) st.regen*=3;
    st.torch=Math.max(2,st.torch);
    if(ks.has('pact')) st.skill+=2;
    if(ks.has('berserk')) st.armor=0;
    st.esMax=0; if(ks.has('chitin')){ st.esMax=Math.round(lifeRaw*1.5+st.mana*0.5); st.life=1; }
    st.minionDmg=S.minionDmg||0; st.minionLife=S.minionLife||0; st.minionMax=S.minionMax||0; st.formPct=S.formPct||0; st.formLife=S.formLife||0;
    st.minionUpkeep=S.minionUpkeep||0; { let res=0; for(const mn of this.minions||[]) if(mn.hp>0) res+=MINIONS[mn.kind].upkeep; st.reserve=Math.min(0.85,res*Math.max(0.2,1+st.minionUpkeep/100)); if(st.reserve>0){ st.lifeFull=st.life; st.life=Math.max(1,Math.round(st.life*(1-st.reserve))); } }
    for(const b of p.buffs){ if(b.regenPct) st.regen+=st.life*b.regenPct; if(b.regenPct&&form) st.manaRegen+=st.mana*0.03; }
    if(form){ const fl=1+st.formLife/100, fm=1+st.formPct/100;
      if(form==='bear'){ st.life=Math.round(st.life*1.5*fl); st.armor=Math.round(st.armor*1.6+p.lvl*2); st.more*=1.25*fm; if(st.uniques.has('bear_pelt')){ st.block=Math.min(75,st.block+15); st.thorns+=st.armor*0.1; } }
      else { st.life=Math.round(st.life*fl); st.dodge=Math.min(75,st.dodge+15); st.crit=Math.min(75,st.crit+8); st.bleed+=30; st.more*=1.1*fm; }
      if(ks.has('apex')){ st.more*=1.3; st.regen+=st.life*0.02; } }
    else if(ks.has('wildheart')) st.more*=0.6;
    if(ks.has('symbiosis')) st.more*=0.6;
    setTooltipCtx(setCnt,new Set(Object.values(p.equip).filter(i=>i&&i.set).map(i=>i.set+':'+i.piece)));
    p.drawSpr=form?FORMS[form].spr:p.spr; p.sc=form?FORMS[form].sc:1;
    if(this.floorMods?.noRegen){ st.regen=0; st.manaRegen=0; }
    p.stats=st; if(p.hp>st.life) p.hp=st.life; if(p.mp>st.mana) p.mp=st.mana; if((p.es||0)>st.esMax) p.es=st.esMax; if(p.es==null) p.es=0;
  }
  usesLife(){ const ks=this.player.stats.ks; return ks.has('bloodmagic')||ks.has('bloodmagic_item'); }
  // ================= map queries =================
  inb(x,y){ return x>=0&&y>=0&&x<this.map.W&&y<this.map.H; }
  tile(x,y){ return this.inb(x,y)?this.map.t[y*this.map.W+x]:WALL; }
  propAt(x,y,f){ return this.props.find(p=>p.x===x&&p.y===y&&(!f||f(p))); }
  blockProp(x,y){ return this.props.find(p=>p.x===x&&p.y===y&&p.block); }
  opaque(x,y){ return this.tile(x,y)===WALL||!!this.props.find(p=>p.x===x&&p.y===y&&p.opaque); }
  passable(x,y){ return this.tile(x,y)===FLOOR&&!this.blockProp(x,y); }
  monAt(x,y){ return this.monsters.find(m=>m.x===x&&m.y===y&&m.hp>0); }
  minAt(x,y){ return this.minions.find(m=>m.x===x&&m.y===y&&m.hp>0); }
  isVis(x,y){ return this.inb(x,y)&&this.visible[y*this.map.W+x]===1; }
  lightLevel(x,y){ if(!this.inb(x,y)) return 0; const i=(y*this.map.W+x)*3; const p=this.player; const d=edist(x,y,p.x,p.y); const torch=Math.max(0,1-d/p.stats.torch); return this.light[i]+this.light[i+1]+this.light[i+2]+torch*2; }
  canSee(m){ return this.isVis(m.x,m.y)&&(this.lightLevel(m.x,m.y)>0.25||dist(m.x,m.y,this.player.x,this.player.y)<=2||m.boss||m.nest); }
  oc=(x,y)=>this.opaque(x,y);
  // ================= FOV + lighting =================
  updateFOV(){ const {W}=this.map, p=this.player; this.visible.fill(0);
    fov(p.x,p.y,12,this.oc,(x,y)=>{ if(this.inb(x,y)){ this.visible[y*W+x]=1; this.explored[y*W+x]=1; } }); this.checkAmbush(); }
  lightSources(){
    const L=[]; for(const pr of this.props){ if(pr.light&&(pr.type!=='brazier'||pr.lit)) L.push({x:pr.x,y:pr.y,c:pr.light,r:pr.lr||5,f:pr.type==='walltorch'||pr.type==='brazier'?1:0.25,id:'p'+pr.x+','+pr.y+pr.type}); }
    for(const m of this.monsters) if(m.light&&m.hp>0) L.push({x:m.x,y:m.y,c:m.light,r:m.nest?4:3,f:0.4,id:'m'+m.x+','+m.y});
    for(const f of this.fx) if(f.light) L.push({x:Math.round(f.x),y:Math.round(f.y),c:f.light,r:f.lr||3,f:0,k:f.life/f.max,id:null});
    return L;
  }
  computeLight(time){
    const {W,H}=this.map; const Lb=this.light; Lb.fill(0);
    for(const L of this.lightSources()){
      let cells=L.id&&this.lightCache.get(L.id);
      if(!cells){ cells=[]; fov(L.x,L.y,L.r,this.oc,(x,y,d)=>{ if(this.inb(x,y)){ const f=Math.max(0,1-d/(L.r+0.5)); cells.push(y*W+x,f*f); } }); if(L.id) this.lightCache.set(L.id,cells); }
      const fl=1+(L.f?L.f*(Math.sin(time*9.1+L.x*3.7)*0.08+Math.sin(time*23.3+L.y)*0.05):0); const k=(L.k??1)*fl;
      for(let i=0;i<cells.length;i+=2){ const j=cells[i]*3, f=cells[i+1]*k; Lb[j]+=L.c[0]*f; Lb[j+1]+=L.c[1]*f; Lb[j+2]+=L.c[2]*f; }
    }
    const U=this.lightU8, B=this.blurBuf&&this.blurBuf.length===W*H*4?this.blurBuf:(this.blurBuf=new Float32Array(W*H*4));
    for(let i=0,n=W*H;i<n;i++){ B[i*4]=Lb[i*3]; B[i*4+1]=Lb[i*3+1]; B[i*4+2]=Lb[i*3+2]; B[i*4+3]=this.visible[i]?1:this.explored[i]?0.43:0; }
    for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const o=(y*W+x)*4; const wall=this.map.t[y*W+x]===WALL;
      for(let c=0;c<4;c++){ let s=B[o+c]*4, w=4; if(x>0){s+=B[o-4+c];w++;} if(x<W-1){s+=B[o+4+c];w++;} if(y>0){s+=B[o-W*4+c];w++;} if(y<H-1){s+=B[o+W*4+c];w++;}
        let v=s/w; if(c===3&&wall) v=Math.max(v,B[o+3]*0.9); U[o+c]=Math.min(255,c===3?v*255:v*127); } }
    return U;
  }
  invalidateLight(){ this.lightCache.clear(); }
  // ================= messages / fx =================
  log(t,c=''){ this.msgs.push({t,c,time:performance.now()}); if(this.msgs.length>60) this.msgs.shift(); this.ui?.onLog?.(); }
  float(x,y,text,color='#fff',size=1){ this.texts.push({x:x*T+T/2+rng.range(-8,8),y:y*T,text,color,size,life:1.1,max:1.1}); }
  burst(x,y,color,n=10,spd=60,life=0.6){ for(let i=0;i<n;i++){ const a=rng.next()*Math.PI*2, v=rng.range(spd*0.3,spd); this.fx.push({type:'p',x:x*T+T/2,y:y*T+T/2,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,c:color,s:rng.range(5,11),life,max:life}); } }
  flashLight(x,y,c,r=3,life=0.35){ this.fx.push({type:'l',x,y,light:c,lr:r,life,max:life}); }
  proj(fx,fy,tx,ty,color,spr){ this.projs.push({fx:fx*T+T/2,fy:fy*T+T/2,tx:tx*T+T/2,ty:ty*T+T/2,c:color,spr,t:0,dur:Math.max(0.08,edist(fx,fy,tx,ty)*0.035)}); }
  // ================= player actions =================
  canAct(){ return this.player.hp>0&&!this.ui?.modal; }
  tryMove(dx,dy){
    const p=this.player, nx=p.x+dx, ny=p.y+dy;
    const m=this.monAt(nx,ny); if(m){ this.basicAttack(m); return this.endTurn(); }
    const pr=this.blockProp(nx,ny); if(pr){ if(this.interact(pr)) return this.endTurn(); return false; }
    if(!this.passable(nx,ny)) return false;
    if(dx&&dy&&(!this.passable(p.x+dx,p.y)&&!this.passable(p.x,p.y+dy))) return false;
    if(p.status.root){ this.log('Jsi zakořeněn!','warn'); return this.endTurn(); }
    const mn=this.minAt(nx,ny); if(mn){ mn.x=p.x; mn.y=p.y; }
    p.x=nx; p.y=ny; p.steps++; if(dx) p.flip=dx<0; this.snd('step');
    this.onStep(); return this.endTurn();
  }
  onStep(){
    const p=this.player;
    for(const g of this.ground.filter(g=>g.x===p.x&&g.y===p.y)) this.pickup(g);
    const plate=this.propAt(p.x,p.y,q=>q.type==='plate'); if(plate) this.stepPlate(plate);
    const pool=this.propAt(p.x,p.y,q=>q.type==='pool'&&q.hazard); if(pool) this.hurtPlayer(this.monScale().dmg*3,'poison',null,'jedové jezírko');
    const st=this.map.stairs; if(p.x===st.x&&p.y===st.y) this.log(this.inRift?(st.locked?'Portál je zapečetěný. Poraz Srdce jeskyně.':'Portál ven. [Enter] pro návrat.'):st.locked?'Schodiště je zapečetěno. Poraz strážce.':'Schodiště dolů. [Enter] nebo klik pro sestup.','hint');
  }
  pickup(g){
    const p=this.player;
    if(g.gold){ this.snd('coin'); p.gold+=g.gold; this.float(g.x,g.y,'+'+fmt(g.gold)+' zl','#f2d36b'); }
    else if(g.item.type==='potion'){ if(p.potions<p.potionMax){ p.potions++; this.float(g.x,g.y,'+lektvar','#e66'); } else return; }
    else { if(p.inv.length>=30){ this.log('Inventář je plný!','warn'); return; } p.inv.push(g.item); this.snd(g.item.rarity==='legendary'||g.item.rarity==='sporeborn'||g.item.rarity==='set'?'loot_leg':g.item.rarity==='rare'||g.item.type==='support'?'loot_rare':'loot'); this.log('Sebráno: '+g.item.name,'loot:'+(g.item.rarity||(g.item.type==='support'?'support':'tome'))); }
    this.ground.splice(this.ground.indexOf(g),1); this.ui?.refresh?.();
  }
  wait(){ return this.endTurn(); }
  descend(){
    const p=this.player, st=this.map.stairs; if(p.x!==st.x||p.y!==st.y) return false; if(st.locked){ this.log(this.inRift?'Portál ven se otevře, až padne Srdce jeskyně.':'Schodiště je zapečetěno.','warn'); return false; }
    if(this.inRift){ this.exitRift(); return true; }
    if(this.depth>=8){ this.ui?.chooseCorruption?.(this.rollCorruptions()); return true; }
    this.goDown(null); return true;
  }
  rollCorruptions(){ const a=rng.shuffle(CORRUPTIONS.slice()); return [a[0],a[1]]; }
  goDown(mod){
    this.snd('descend');
    this.floorMods=mod; const nd=this.depth+1; if(nd%5===1&&nd>1) this.checkpoint=nd;
    this.enterFloor(nd); this.log(`Hloubka ${nd} · ${this.map.biome.name}`+(mod?` · Korupce: ${mod.name}`:''),'sys'); this.save();
  }
  quaff(){
    const p=this.player; if(p.potions<=0){ this.log('Žádné lektvary.','warn'); return false; }
    if(p.stats.uniques.has('rotheart')){ this.log('Srdce Hniloby odmítá lektvar.','warn'); return false; }
    this.snd('potion'); p.potions--; const h=p.stats.life*0.4*(1+p.stats.potion/100)*(p.stats.ks.has('apex')&&p.form?0.5:1); p.hp=Math.min(p.stats.life,p.hp+h); p.mp=Math.min(p.stats.mana,p.mp+p.stats.mana*0.25);
    this.float(p.x,p.y,'+'+fmt(h),'#7f7'); this.burst(p.x,p.y,[1,0.3,0.3],8,40); delete p.status.poison; delete p.status.burn; delete p.status.bleed; return this.endTurn();
  }
  interact(pr){
    const pz=this.map.puzzle;
    if(pr.type==='lore'){ this.readLore(pr); return false; }
    if(pr.type==='pillar'){ if(pr.state==='idle') { this.startPillar(pr); return true; } this.log(pr.state==='done'?'Plodnice je vyčerpaná.':'Plodnice pulzuje – přežij vlny!','hint'); return false; }
    if(pr.type==='rift'){ this.ui?.riftPrompt?.(pr,this.rollRiftMods()); return false; }
    if(pr.type==='merchant'){ this.ui?.openShop?.(); return false; }
    if(pr.type==='bellmaster'){ this.playBells(); return true; }
    if(pr.type==='crystal'){ return this.hitCrystal(pr); }
    if(pr.type==='riddle'){ this.ui?.loreModal?.('Hrob mudrce',`„${pr.q}“<br><br><i>Dotkni se kamene se správnou odpovědí.</i>`); return false; }
    if(pr.type==='answer'){ return this.answerRiddle(pr); }
    if(pr.type==='chest'){ this.snd('chest',pr.x,pr.y); this.openChest(pr); return true; }
    if(pr.type==='cursed'){ this.startCursed(pr); return true; }
    if(pr.type==='lever'&&!pr.on){ this.snd('squish',pr.x,pr.y); pr.on=true; pr.spr='spore_pile'; pr.block=false; this.burst(pr.x,pr.y,[0.8,1,0.5],18,90); pz.count++; this.log(`Kokon praskl (${pz.count}/${pz.need}).`,'hint');
      if(rng.chance(0.4)){ this.log('Z kokonu se vyhrnula havěť!','warn'); for(let k=0;k<2;k++){ const n=this.freeNear(pr.x,pr.y); if(n){ const m=this.addMonster(MONSTERS.find(x=>x.id==='blob'),n[0],n[1]); m.aware=true; } } }
      this.checkPuzzle(); return true; }
    if(pr.type==='brazier'&&!pr.lit){ this.snd('ignite',pr.x,pr.y); pr.lit=true; pr.light=[1,0.6,0.25]; pr.lr=5; this.invalidateLight(); this.burst(pr.x,pr.y,[1,0.6,0.2],16,70); pz.count++; this.log(`Žároviště vzplálo (${pz.count}/${pz.need}).`,'hint'); this.checkPuzzle(); return true; }
    if(pr.type==='rune'&&!pr.on){
      if(pz.order[pz.step]===pr.sym){ this.snd('rune',pr.x,pr.y); pr.on=true; pr.light=[0.5,0.8,1]; pr.lr=2; this.invalidateLight(); pz.step++; this.float(pr.x,pr.y,pr.sym,'#9cf',1.6); this.log(`Runa ${pr.sym} se rozzářila.`,'hint'); if(pz.step>=pz.order.length) this.checkPuzzle(true); }
      else { this.snd('wrong',pr.x,pr.y); this.log('Špatná runa! Kameny pohasly a ze stínů se něco plíží…','warn'); pz.step=0; for(const r of this.props) if(r.type==='rune'){ r.on=false; delete r.light; } this.invalidateLight();
        const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); for(let k=0;k<3;k++){ const n=this.freeNear(pr.x,pr.y); if(n){ const m=this.addMonster(rng.pick(pool),n[0],n[1],k===0?{rarity:'magic',mods:[rng.pick(MON_MODS).id]}:{}); m.aware=true; } } }
      return true; }
    if(pr.type==='obelisk'){ this.log(`Obelisk: „Probuď runy v pořadí ${pr.text}.“`,'hint'); this.float(pr.x,pr.y,pr.text,'#9cf',1.2); return false; }
    if(pr.type==='gate'){ this.log('Mříž je pevně zavřená. Vyřeš hádanku patra.','hint'); return false; }
    if(pr.type==='altar'){ this.ui?.openCraft?.(); return false; }
    if(pr.type==='shrine'&&!pr.used){ this.snd('shrine',pr.x,pr.y); pr.used=true; delete pr.light; this.invalidateLight(); const b=rng.pick([{name:'Svatyně zuřivosti',dmgPct:0.4},{name:'Svatyně kůry',armorPct:0.8,regen:2},{name:'Svatyně plamene',torch:3,dmgPct:0.15}]);
      this.player.buffs.push({...b,turns:40}); this.recalc(); this.log(`${b.name}: požehnání na 40 tahů.`,'good'); this.burst(pr.x,pr.y,[0.7,0.5,1],24,100); return true; }
    return false;
  }
  checkPuzzle(force){ const pz=this.map.puzzle; if(pz.done) return; if(force||pz.count>=pz.need){ pz.done=true; const g=this.props.find(p=>p.type==='gate'); if(g){ g.block=false; g.opaque=false; g.spr='arch'; g.open=true; this.snd('gate'); this.invalidateLight(); this.updateFOV(); }
    this.log('Někde se se skřípěním zvedla mříž trezoru! Ale něco ho hlídá…','good'); this.shake=8;
    const v=pz.vault; if(v){ const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); const pts=[]; for(let k=0;k<2;k++){ const x=v.x+rng.int(0,v.w-1), y=v.y+rng.int(0,v.h-1); if(this.passable(x,y)&&!this.monAt(x,y)) pts.push([x,y]); } pts.forEach((pt,i)=>this.addMonster(rng.pick(pool),pt[0],pt[1],i===0?{rarity:'rare'}:{rarity:'magic',mods:[rng.pick(MON_MODS).id]})); } } }
  openChest(pr){
    this.props.splice(this.props.indexOf(pr),1); this.burst(pr.x,pr.y,[1,0.85,0.4],20,90);
    const n=pr.vault?rng.int(3,4):rng.int(1,2);
    for(let i=0;i<n;i++) this.dropItem(pr.x,pr.y,{boost:pr.vault?(i===0?2.5:1):0.3,rarity:pr.vault&&i===0?(rng.chance(this.legChance(0.35))?'legendary':'rare'):undefined});
    this.dropGold(pr.x,pr.y,pr.vault?4:1.5); if(pr.vault){ if(rng.chance(0.5)) this.dropTome(pr.x,pr.y); if(rng.chance(0.6)) this.dropSupport(pr.x,pr.y); }
    this.log(pr.vault?'Trezor otevřen!':'Otevřeno.','good');
  }
  // ---- events ----
  checkAmbush(){
    const p=this.player, r=this.map.room[p.y*this.map.W+p.x]; if(r<0||r===999) return;
    const sp=this.map.spawns.find(s=>s.room===r&&s.pending); if(!sp) return; sp.pending=false;
    const room=this.map.rooms[r]; const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); const pts=[];
    for(let k=0;k<sp.n*3&&pts.length<sp.n;k++){ const x=this.R.int(room.x,room.x+room.w-1), y=this.R.int(room.y,room.y+room.h-1); if(dist(x,y,p.x,p.y)>=2&&this.passable(x,y)&&!this.monAt(x,y)&&!pts.some(q=>q[0]===x&&q[1]===y)) pts.push([x,y]); }
    const ms=this.spawnPack(pts,pool,this.R); for(const m of ms){ m.aware=true; m.energy=0; this.burst(m.x,m.y,[0.5,0.9,0.3],10,60); }
    this.snd('ambush'); this.log('PŘEPADENÍ! Z výtrusných stěn se vynořují nepřátelé!','warn'); this.shake=10; this.ui?.banner?.('Přepadení!','');
  }
  startCursed(pr){ this.snd('curse'); this.props.splice(this.props.indexOf(pr),1); this.cursed={x:pr.x,y:pr.y,wave:0,timer:0}; this.invalidateLight(); this.log('Prokletí se probouzí! Přežij tři vlny.','warn'); this.ui?.banner?.('Prokletá truhla','Vlna 1 / 3'); this.nextWave(); }
  nextWave(){ const c=this.cursed; c.wave++; c.timer=0; const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); const n=3+c.wave; c.mons=[];
    for(let k=0;k<n;k++){ const pos=this.freeNear(c.x+rng.int(-3,3),c.y+rng.int(-3,3)); if(!pos) continue; const m=this.addMonster(rng.pick(pool),pos[0],pos[1],c.wave===3&&k===0?{rarity:'rare'}:rng.chance(0.4)?{rarity:'magic',mods:[rng.pick(MON_MODS).id]}:{}); m.aware=true; c.mons.push(m); this.burst(pos[0],pos[1],[0.9,0.2,0.3],10,70); }
    if(c.wave>1) this.ui?.banner?.('Prokletá truhla',`Vlna ${c.wave} / 3`); }
  tickCursed(){ const c=this.cursed; if(!c||c.done) return; c.timer++; const alive=c.mons.filter(m=>m.hp>0).length;
    if(alive===0||c.timer>14){ if(c.wave<3) this.nextWave(); else if(alive===0){ c.done=true; this.log('Prokletí zlomeno! Truhla vydala poklad.','good'); this.ui?.banner?.('Prokletí zlomeno',''); for(let i=0;i<3;i++) this.dropItem(c.x,c.y,{boost:1.5,rarity:i===0?(rng.chance(this.legChance(0.4))?'legendary':'rare'):'rare'}); this.dropSupport(c.x,c.y); this.dropGold(c.x,c.y,5); } } }
  tickStorm(){ if(this.map.event!=='storm'||this.turn%4!==0) return; const p=this.player;
    for(let k=0;k<3;k++){ const x=p.x+rng.int(-3,3), y=p.y+rng.int(-3,3); this.addHazard(x,y,1,'poison',this.monScale().dmg*1.8,1,3,'Výtrusná bouře'); } }
  addHazard(x,y,r,el,dmg,warn,turns,src){ const tiles=[]; for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(this.tile(x+dx,y+dy)===FLOOR) tiles.push([x+dx,y+dy]); if(tiles.length) this.hazards.push({tiles,el,dmg,warn,turns,src}); }
  tickHazards(){ const p=this.player; for(const h of this.hazards){ if(h.warn>0){ h.warn--; continue; } if(h.tiles.some(([x,y])=>x===p.x&&y===p.y)) this.hurtPlayer(h.dmg,h.el,null,h.src); h.turns--; } this.hazards=this.hazards.filter(h=>h.turns>0); }

  // ---- lore ----
  readLore(pr){ const p=this.player; p.lore=p.lore||[]; let idx;
    if(pr.read) idx=pr.idx; else { idx=p.lore.length<LORE.length?p.lore.length:rng.int(0,LORE.length-1); pr.read=true; pr.idx=idx; if(!p.lore.includes(idx)){ p.lore.push(idx); this.gainXP(this.xpNeed()*0.08); this.log(`Kronika: „${LORE[idx].t}“ zapsáno [J].`,'loot:tome'); } delete pr.light; this.invalidateLight(); }
    this.snd('rune'); this.ui?.loreModal?.(LORE[idx].t,LORE[idx].x,true); }
  // ---- season: Plodnice pradávných (pillar waves) ----
  startPillar(pr){ pr.state='active'; this.pillarRun={pr,wave:0,timer:0,mons:[],waves:4}; this.snd('curse'); this.log('Plodnice pradávných se probouzí! Přežij 4 vlny.','warn'); this.ui?.banner?.('Plodnice pradávných','Vlna 1 / 4'); this.nextPillarWave(); }
  nextPillarWave(){ const r=this.pillarRun; r.wave++; r.timer=0; r.mons=[]; const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]&&m.ai!=='mine'); const n=3+r.wave*2;
    for(let k=0;k<n;k++){ const ang=rng.next()*6.28, rr=rng.int(3,5); const pos=this.freeNear(Math.round(r.pr.x+Math.cos(ang)*rr),Math.round(r.pr.y+Math.sin(ang)*rr))||this.freeNear(r.pr.x,r.pr.y); if(!pos) continue;
      const opt=r.wave===4&&k===0?{rarity:'rare'}:rng.chance(0.15*r.wave)?{rarity:'magic',mods:[rng.pick(MON_MODS).id]}:{}; const m=this.addMonster(rng.pick(pool),pos[0],pos[1],opt); m.aware=true; m.energy=0; r.mons.push(m); this.burst(pos[0],pos[1],[0.5,1,0.4],10,70); }
    this.flashLight(r.pr.x,r.pr.y,[0.5,1,0.4],6,0.8); if(r.wave>1){ this.ui?.banner?.('Plodnice pradávných',`Vlna ${r.wave} / ${r.waves}`); this.snd('ambush'); } }
  tickPillar(){ const r=this.pillarRun; if(!r||r.done) return; r.timer++; const alive=r.mons.filter(m=>m.hp>0).length;
    if(alive===0||r.timer>12){ if(r.wave<r.waves) this.nextPillarWave(); else if(alive===0){ r.done=true; r.pr.state='done'; r.pr.light=[0.3,0.4,0.3]; this.invalidateLight();
      const n=rng.int(1,2)+(this.depth>=10?1:0); this.player.cores=(this.player.cores||0)+n; this.snd('loot_leg'); this.ui?.banner?.('Plodnice utišena',`+${n} zkažené jádro`); this.log(`Plodnice utišena. +${n} zkažené jádro (zkaž předmět na Oltáři hniloby).`,'loot:sporeborn');
      for(let i=0;i<3;i++) this.dropItem(r.pr.x,r.pr.y,{boost:1,rarity:i===0?'rare':undefined}); if(rng.chance(0.4)) this.dropSupport(r.pr.x,r.pr.y); } } }
  // ---- puzzles: plates / bells / riddle ----
  tickPlates(){ const pz=this.map.puzzle; if(!pz||pz.kind!=='plates'||pz.done) return; for(const pl of pz.plates) if(pl.lit>0){ pl.lit--; if(pl.lit===0){ delete pl.light; this.invalidateLight(); } } }
  stepPlate(pl){ const pz=this.map.puzzle; if(pz.done) return; if(!pl.lit) this.snd('rune',pl.x,pl.y); pl.lit=pz.window; pl.light=[0.5,1,0.6]; pl.lr=2; this.invalidateLight();
    const on=pz.plates.filter(q=>q.lit>0).length; this.float(pl.x,pl.y,`${on}/${pz.plates.length}`,'#9df07a'); if(on>=pz.plates.length) this.checkPuzzle(true); else if(on===1) this.log(`Plotna dýchá… Rozsviť všechny do ${pz.window} tahů.`,'hint'); }
  playBells(){ const pz=this.map.puzzle; if(!pz||pz.done) return; pz.step=0; this.log('Matka krystalů zpívá. Opakuj melodii dotyky krystalů.','hint');
    pz.order.forEach((ci,i)=>{ const cr=pz.crystals[ci]; setTimeout(()=>{ audio.play('crystal',{note:ci}); cr.light=[0.6,1,0.9]; cr.lr=3; this.invalidateLight(); this.burst(cr.x,cr.y,[0.6,1,0.9],10,50); setTimeout(()=>{ cr.light=null; this.invalidateLight(); },420); },550*i+300); }); }
  hitCrystal(cr){ const pz=this.map.puzzle; if(!pz||pz.done) return false; audio.play('crystal',{note:cr.idx}); this.burst(cr.x,cr.y,[0.6,1,0.9],8,40);
    if(pz.order[pz.step]===cr.idx){ pz.step++; this.float(cr.x,cr.y,'♪','#9cf',1.4); if(pz.step>=pz.order.length) this.checkPuzzle(true); }
    else { pz.step=0; this.snd('wrong',cr.x,cr.y); this.log('Falešný tón! Krystaly se rozechvěly…','warn'); const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); for(let k=0;k<2;k++){ const n=this.freeNear(cr.x,cr.y); if(n){ const m=this.addMonster(rng.pick(pool),n[0],n[1]); m.aware=true; } } }
    return true; }
  answerRiddle(pr){ const pz=this.map.puzzle; if(!pz||pz.done) return false;
    if(pr.correct){ this.snd('rune',pr.x,pr.y); this.log(`„${pr.ans}.“ Hrob mudrce tiše přikývl.`,'good'); this.checkPuzzle(true); }
    else { this.snd('wrong',pr.x,pr.y); this.log(`„${pr.ans}“? Mrtví se smějí a probouzejí se.`,'warn'); this.props.splice(this.props.indexOf(pr),1); this.burst(pr.x,pr.y,[0.6,0.6,0.7],14,80);
      const pool=MONSTERS.filter(m=>this.depth>=m.d[0]&&this.depth<=m.d[1]); for(let k=0;k<3;k++){ const n=this.freeNear(pr.x,pr.y); if(n){ const m=this.addMonster(rng.pick(pool),n[0],n[1],k===0?{rarity:'magic',mods:[rng.pick(MON_MODS).id]}:{}); m.aware=true; } } }
    return true; }
  // ---- treasure goblin ----
  thiefAct(m,d){ const p=this.player; if(!m.aware){ if(this.isVis(m.x,m.y)&&d<=8){ m.aware=true; m.flee=0; this.log('Hrabivý skřítek! Zabij ho, než uteče portálem!','warn'); this.ui?.banner?.('Hrabivý skřítek!','Zabij ho dřív, než uteče'); this.snd('alert',m.x,m.y); } else return; }
    m.flee++; const left=16-m.flee; m.name=`Hrabivý skřítek · ${Math.max(0,left)}`;
    if(left<=0){ this.burst(m.x,m.y,[0.9,0.8,0.3],30,120,1); this.flashLight(m.x,m.y,[1,0.85,0.3],4,0.8); this.snd('blink',m.x,m.y); this.log('Skřítek se zachichotal a zmizel v portálu.','warn'); this.monsters=this.monsters.filter(x=>x!==m); return; }
    if(rng.chance(0.25)&&this.ground.length<200) { const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],gold:Math.round(rng.range(2,5)*Math.pow(1.1,this.depth))}); }
    // flee: pick neighbour maximizing distance, with path-based lookahead
    let best=null,bd=-1; for(const [dx,dy] of DIRS8){ const nx=m.x+dx, ny=m.y+dy; if(!this.mPass(nx,ny,m)) continue; let free=0; for(const [ax,ay] of DIRS8) if(this.passable(nx+ax,ny+ay)) free++; const dd=edist(nx,ny,p.x,p.y)+free*0.15; if(dd>bd){ bd=dd; best=[nx,ny]; } }
    if(best&&bd>edist(m.x,m.y,p.x,p.y)-0.5){ m.flip=best[0]<m.x; m.x=best[0]; m.y=best[1]; } }
  // ---- rifts (Zkažené jeskyně) ----
  rollRiftMods(){ const n=this.depth>=10?4:3; return rng.shuffle(RIFT_MODS.slice()).slice(0,n); }
  enterRift(portal,mods){
    const fm={name:'Zkažená jeskyně',mods,mon:{},loot:{corrupt:0.06},torch:0}; for(const md of mods){ for(const [k,v] of Object.entries(md.mon||{})) fm.mon[k]=typeof v==='number'&&fm.mon[k]?fm.mon[k]*v:v; for(const [k,v] of Object.entries(md.loot||{})) fm.loot[k]=(fm.loot[k]||0)+v; if(md.torch) fm.torch+=md.torch; if(md.noRegen) fm.noRegen=true; if(md.resDown) fm.resDown=(fm.resDown||0)+md.resDown; }
    fm.loot.qty=(fm.loot.qty||0)+0.3; fm.loot.mf=(fm.loot.mf||0)+30; fm.loot.ilvl=1;
    const keep=['map','props','monsters','ground','explored','visible','light','lightU8','R','floorMods','pillarRun','cursed','bossRef','hazards'];
    this.stash={pos:[this.player.x,this.player.y],portal}; for(const k of keep) this.stash[k]=this[k];
    this.props.splice(this.props.indexOf(portal),1);
    this.floorMods=fm; this.inRiftPending=true; this.snd('descend');
    const d=this.depth; const map=this.map=generate(d+1,(this.seed^0x5f3759df^(Date.now()&0xffff))>>>0,{rift:true,cave:true});
    this.explored=new Uint8Array(map.W*map.H); this.visible=new Uint8Array(map.W*map.H); this.light=new Float32Array(map.W*map.H*3); this.lightU8=new Uint8Array(map.W*map.H*4);
    this.props=map.props; this.monsters=[]; this.ground=[]; this.fx=[]; this.projs=[]; this.hazards=[]; this.cursed=null; this.pillarRun=null; this.bossRef=null; this.R=new RNG((Date.now()^d)>>>0);
    const p=this.player; p.x=p.rx=map.start[0]; p.y=p.ry=map.start[1]; p.path=null; this.recalc();
    this.inRift=true; for(const sp of map.spawns){ sp.ambush=false; } const savedD=this.depth; this.depth=d+1; this.spawnMonsters(); this.depth=savedD;
    const st=map.stairs; const pos=this.freeNear(st.x,st.y); if(pos){ this.depth=d+2; const g=this.addMonster(SPECIAL.guardian,pos[0],pos[1],{rarity:'rare'}); this.depth=savedD; g.name='Srdce jeskyně'; g.riftGuardian=true; g.unique=true; g.maxhp=g.hp=g.maxhp*1.6; this.bossRef=g; }
    this.placeMinions(); this.lightCache=new Map(); this.inRift=true; this.updateFOV(); this.ui?.onFloor?.();
    this.log(`Vstupuješ do Zkažené jeskyně: ${mods.map(m=>m.name).join(', ')}.`,'warn'); this.ui?.banner?.('Zkažená jeskyně',mods.map(m=>m.name).join(' · ')); }
  exitRift(){ const S=this.stash; if(!S) return; for(const k of Object.keys(S)) if(!['pos','portal'].includes(k)) this[k]=S[k];
    const p=this.player; p.x=p.rx=S.pos[0]; p.y=p.ry=S.pos[1]; p.path=null; this.stash=null; this.inRift=false; this.placeMinions(); this.lightCache=new Map(); this.recalc(); this.updateFOV(); this.ui?.onFloor?.(); this.snd('descend');
    this.log('Vracíš se z jeskyně. Podhoubí za tebou zarůstá vchod.','sys'); this.save(); }
  // ---- shared stash (via merchant) ----
  stashPut(it){ const st=Stash.get(); if(st.length>=STASH_MAX){ this.log('Sdílená truhla je plná.','warn'); return false; } const p=this.player; const i=p.inv.indexOf(it); if(i<0) return false; p.inv.splice(i,1); st.push(it); Stash.set(st); this.save(); this.snd('chest'); return true; }
  stashTake(i){ const st=Stash.get(); const p=this.player; if(!st[i]) return false; if(p.inv.length>=30){ this.log('Inventář je plný!','warn'); return false; } p.inv.push(st.splice(i,1)[0]); Stash.set(st); this.save(); this.snd('equip'); return true; }
  // ---- merchant gamble ----
  gambleCost(){ return Math.round(45*Math.pow(1.1,this.depth)); }
  gamble(slot){ const p=this.player, c=this.gambleCost(); if(p.gold<c){ this.log('Nemáš dost zlata.','warn'); return null; } if(p.inv.length>=30){ this.log('Inventář je plný!','warn'); return null; }
    p.gold-=c; const bases=BASES.filter(b=>(b.slot===slot||(slot==='ring'&&b.slot==='ring'))&&b.min<=this.depth+2); const b=rng.pick(bases);
    const it=makeItem(this.depth+1,{baseId:b.id,boost:0.7,mf:p.stats.mf}); if(rng.chance(0.06)){ const u=makeItem(this.depth+1,{rarity:'legendary'}); if(u.slot===b.slot){ p.inv.push(u); this.snd('loot_leg'); return u; } }
    p.inv.push(it); this.snd(it.rarity==='legendary'?'loot_leg':it.rarity==='rare'?'loot_rare':'loot'); return it; }
  buyPotionSlot(){ const p=this.player, c=Math.round(300*Math.pow(1.6,p.potionMax-3)*Math.pow(1.05,this.depth)); if(p.potionMax>=6||p.gold<c) return false; p.gold-=c; p.potionMax++; p.potions=p.potionMax; this.snd('potion'); return true; }
  potionSlotCost(){ const p=this.player; return p.potionMax>=6?null:Math.round(300*Math.pow(1.6,p.potionMax-3)*Math.pow(1.05,this.depth)); }
  buyCore(){ const p=this.player, c=this.coreCost(); if(p.gold<c) return false; p.gold-=c; p.cores=(p.cores||0)+1; this.snd('loot_rare'); return true; }
  coreCost(){ return Math.round(600*Math.pow(1.08,this.depth)); }
  corrupt(it){ const p=this.player; if(!(p.cores>0)||it.corrupted) return null; p.cores--; const r=corruptItem(it); this.snd(r==='destroyed'?'wrong':r==='nothing'?'curse':'loot_leg');
    if(r==='destroyed'){ for(const s of Object.keys(p.equip)) if(p.equip[s]===it) p.equip[s]=null; const i=p.inv.indexOf(it); if(i>=0) p.inv.splice(i,1); p.dust+=itemValue(it)*3; }
    this.recalc(); return r; }
  // ================= minions =================
  minionMax(kind,sk){ const st=this.player.stats, def=MINIONS[kind]; const su=this.sups(sk); return kind==='ent'?1+(st.ks.has('swarm')?1:0)+(su.has('fertile')?1:0):def.max+(kind==='sprout'?st.minionMax:Math.floor(st.minionMax/2))+(st.ks.has('swarm')?2:0)+(su.has('fertile')?1:0); }
  makeMinion(kind,sk,x,y){ const p=this.player, st=p.stats, def=MINIONS[kind]; const L=this.skillLevel(sk), lm=1+(L-1)*0.12; const sw=st.ks.has('swarm')?0.65:1;
    const hp=def.hp*Math.pow(1.10,p.lvl-1)*(1+st.minionLife/100)*lm*sw; const dm=Math.pow(1.09,p.lvl-1)*lm*sw;
    return {ally:true,kind,skill:sk,name:def.name,spr:rng.pick(def.spr),x,y,rx:x,ry:y,hp,maxhp:hp,dmg:[def.dmg[0]*dm,def.dmg[1]*dm],arm:def.arm*Math.pow(1.08,p.lvl-1),ai:def.ai,el:def.el,range:def.range||1,sc:def.sc,status:{},flip:rng.chance(0.5),taunt:!!def.taunt,born:this.turn}; }
  summon(sk){ const s=SKILLS[sk], kind=s.minion, def=MINIONS[kind], p=this.player, st=p.stats; let n=def.n+(kind==='sprout'&&st.uniques.has('mother_staff')?1:0); const max=this.minionMax(kind,sk); let made=0;
    for(let i=0;i<n;i++){ const mine=this.minions.filter(x=>x.kind===kind&&x.hp>0); if(mine.length>=max){ const old=mine.sort((a,b)=>a.born-b.born)[0]; this.killMinion(old,true,true); }
      const pos=this.freeNear(p.x,p.y); if(!pos) break; const mn=this.makeMinion(kind,sk,pos[0],pos[1]); this.minions.push(mn); made++; this.burst(pos[0],pos[1],kind==='jelly'?[0.7,0.5,1]:[0.6,1,0.4],14,70); this.flashLight(pos[0],pos[1],[0.6,1,0.4],2,0.5); }
    this.recalc(); return made; }
  placeMinions(heal){ const p=this.player; const keep=[]; for(const mn of this.minions){ if(mn.hp<=0) continue; const pos=this.freeNear(p.x,p.y); if(!pos) continue; mn.x=mn.rx=pos[0]; mn.y=mn.ry=pos[1]; mn.status={}; if(heal) mn.hp=mn.maxhp; keep.push(mn); } this.minions=keep; }
  hurtMinion(mn,dmg,el,noFx){ if(mn.hp<=0) return; let d=dmg; if(!el) d*=1-Math.min(0.75,mn.arm/(mn.arm+dmg*6+8)); else d*=el==='poison'&&mn.kind==='jelly'?0.4:0.85; d=Math.max(1,d);
    mn.hp-=d; mn.flash=0.12; if(!noFx) this.float(mn.x,mn.y,'-'+fmt(d),'#e8a060',0.8); if(mn.hp<=0) this.killMinion(mn); }
  killMinion(mn,quiet,replaced){ if(!this.minions.includes(mn)) return; mn.hp=0; this.minions=this.minions.filter(x=>x!==mn); this.burst(mn.x,mn.y,[0.6,0.8,0.4],12,70);
    if(!replaced) this.fx.push({type:'corpse',x:mn.x,y:mn.y,spr:mn.spr,sc:mn.sc,flip:mn.flip,life:0.5,max:0.5});
    if(!quiet&&this.player.stats.uniques.has('hive_crown')){ this.fx.push({type:'cloud',x:mn.x,y:mn.y,r:1,life:0.7,max:0.7}); const c={sups:new Set(),tags:['minion'],skill:'minion',minion:mn};
      for(const o of this.monsters) if(o.hp>0&&dist(o.x,o.y,mn.x,mn.y)<=1) this.hitMonster(o,{phys:0,fire:0,poison:mn.maxhp*0.5,decay:0,crit:0,critMult:100},c); }
    if(!quiet) this.log(mn.name+' padl.','sys'); this.recalc(); }
  tickMinions(){ const p=this.player, st=p.stats; const cmd=p.buffs.some(b=>b.cmd);
    for(const mn of this.minions.slice()){ if(mn.hp<=0) continue;
      if(st.uniques.has('rot_totem')) mn.hp=Math.min(mn.maxhp,mn.hp+mn.maxhp*0.04);
      if(mn.status.stun){ if(--mn.status.stun<=0) delete mn.status.stun; continue; }
      const acts=1+(cmd&&this.turn%2===0?1:0); for(let a=0;a<acts&&mn.hp>0;a++) this.minionAct(mn); } }
  minionAct(mn){ const p=this.player; const vis=m=>m.hp>0&&dist(m.x,m.y,mn.x,mn.y)<=8&&(m.aware||dist(m.x,m.y,p.x,p.y)<=6)&&los(mn.x,mn.y,m.x,m.y,this.oc);
    const t=this.monsters.filter(vis).sort((a,b)=>dist(a.x,a.y,mn.x,mn.y)-dist(b.x,b.y,mn.x,mn.y))[0];
    if(dist(mn.x,mn.y,p.x,p.y)>14){ const pos=this.freeNear(p.x,p.y); if(pos){ mn.x=mn.rx=pos[0]; mn.y=mn.ry=pos[1]; } return; }
    if(t){ const d=dist(t.x,t.y,mn.x,mn.y);
      if(mn.ai==='ranged'&&d<=mn.range&&d>=1){ this.proj(mn.x,mn.y,t.x,t.y,[0.75,0.5,1]); this.face(mn,t.x); this.minionStrike(mn,t,1); if(d<2) this.stepAwayFrom(mn,t); return; }
      if(mn.ai!=='ranged'&&d<=1){ this.lunge(mn,t); this.minionStrike(mn,t,1); return; }
      if(dist(mn.x,mn.y,p.x,p.y)<=9) { this.stepToward(mn,t.x,t.y); return; } }
    if(dist(mn.x,mn.y,p.x,p.y)>2) this.stepToward(mn,p.x,p.y); else if(rng.chance(0.15)) this.stepRandomA(mn); }
  minionStrike(mn,m,mult){ const c=this.ctx(mn.skill); c.minion=mn; const v=rng.range(mn.dmg[0],mn.dmg[1])*mult; const h={phys:mn.el?v*0.3:v,fire:0,poison:mn.el==='poison'?v*0.7:0,decay:0,crit:5,critMult:150,attack:true};
    if(mn.el==='poison') c.poisonCh=35; this.hitMonster(m,h,c); }
  stepAwayFrom(e,t){ let best=null,bd=edist(e.x,e.y,t.x,t.y); for(const [dx,dy] of DIRS8){ const nx=e.x+dx, ny=e.y+dy; if(!this.mPass(nx,ny,e)) continue; const dd=edist(nx,ny,t.x,t.y); if(dd>bd){bd=dd;best=[nx,ny];} } if(best){ e.x=best[0]; e.y=best[1]; } }
  stepRandomA(e){ const [dx,dy]=rng.pick(DIRS8); if(this.mPass(e.x+dx,e.y+dy,e)){ e.x+=dx; e.y+=dy; } }
  // ================= skills & attack pipeline =================
  skillLevel(id){ return (this.player.skills[id]||0)+(id==='attack'?0:this.player.stats.skill); }
  sups(id){ const sl=new Set((this.player.links[id]||[]).filter(Boolean)); const tags=SKILLS[id].tags; for(const s of [...sl]) if(!SUPPORTS[s].tags.some(t=>tags.includes(t))) sl.delete(s); return sl; }
  skillCost(id){ const s=SKILLS[id], su=this.sups(id); return Math.round(s.cost*(su.has('echo')?1.5:1)*(su.has('haste')?1.3:1)); }
  skillReady(id){ const p=this.player; return (p.cds?.[id]||0)<=0&&this.canPay(this.skillCost(id)); }
  canPay(c){ const p=this.player; return this.usesLife()?p.hp>c+1:p.mp>=c; }
  pay(c){ const p=this.player; if(this.usesLife()) p.hp-=c; else p.mp-=c; }
  ctx(id,extra={}){ const su=this.sups(id), L=this.skillLevel(id); return {skill:id,sups:su,lm:1+(L-1)*0.12,tags:SKILLS[id].tags,...extra}; }
  // deliver hit to target(s) with multi/chain/echo support
  strike(targets,mkHit,ctx,fxFn){
    const p=this.player, st=p.stats; const hitSet=new Set(); let total=0;
    const one=(m,f)=>{ if(m.hp<=0) return 0; hitSet.add(m); fxFn?.(m); const h=mkHit(); for(const k of ['phys','fire','poison','decay']) h[k]*=f; return this.hitMonster(m,h,ctx); };
    let list=targets.slice(); const single=ctx.tags.includes('single')||ctx.tags.includes('proj');
    let mf=1; if(single&&ctx.sups.has('multi')){ mf=0.7; const extra=this.monsters.filter(o=>o.hp>0&&!list.includes(o)&&this.canSee(o)&&edist(p.x,p.y,o.x,o.y)<=7&&los(p.x,p.y,o.x,o.y,this.oc)).sort((a,b)=>edist(a.x,a.y,list[0].x,list[0].y)-edist(b.x,b.y,list[0].x,list[0].y)).slice(0,2); list.push(...extra); }
    const chains=(single&&ctx.sups.has('chain')?2:0)+(st.uniques.has('storm_eye')&&ctx.skill!=='attack'?1:0);
    for(const m of list){ total+=one(m,mf);
      let last=m; for(let c=1;c<=chains;c++){ const nx=this.monsters.filter(o=>o.hp>0&&!hitSet.has(o)&&edist(o.x,o.y,last.x,last.y)<=4&&los(last.x,last.y,o.x,o.y,this.oc)).sort((a,b)=>edist(a.x,a.y,last.x,last.y)-edist(b.x,b.y,last.x,last.y))[0]; if(!nx) break; this.proj(last.x,last.y,nx.x,nx.y,[0.7,0.9,1]); total+=one(nx,mf*Math.pow(0.8,c)); last=nx; } }
    const echo=ctx.sups.has('echo')?0.6:(ctx.tags.includes('spell')&&st.uniques.has('twin_tome')?0.5:0);
    if(echo&&!ctx.echoed){ const alive=list.filter(m=>m.hp>0); if(alive.length){ this.float(p.x,p.y,'Ozvěna','#c9f',0.9); ctx.echoed=true; for(const m of alive){ fxFn?.(m); const h=mkHit(); for(const k of ['phys','fire','poison','decay']) h[k]*=echo*mf; total+=this.hitMonster(m,h,ctx); } } }
    return total;
  }
  useSkill(id,tx,ty){
    const p=this.player, s=SKILLS[id], st=p.stats; if(!s) return false;
    if((p.cds[id]||0)>0){ this.log(`${s.name} se přebíjí.`,'warn'); return false; }
    if(p.form&&s.tags.includes('spell')){ this.log('V podobě zvířete nemůžeš sesílat kouzla.','warn'); return false; }
    if(s.needForm&&p.form!==s.needForm){ this.log(`${s.name} vyžaduje ${FORMS[s.needForm].acc}.`,'warn'); return false; }
    let cost=this.skillCost(id); if(s.form&&st.ks.has('wildheart')) cost=0; if(!this.canPay(cost)){ this.log(this.usesLife()?'Málo života na krvavou magii.':'Nedostatek esence.','warn'); return false; }
    const c=this.ctx(id); const lm=c.lm; let ok=true; const aoeR=b=>b+st.aoe+(c.sups.has('area')?1:0);
    if(c.sups.has('area')) c.areaMore=1.15;
    const losOk=(m)=>los(p.x,p.y,m.x,m.y,this.oc);
    switch(id){
      case 'cleave': { const r=aoeR(1); const t=this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,p.x,p.y)<=r&&losOk(m)); if(!t.length){ ok=false; this.log('Nikdo v dosahu.','warn'); break; } this.fx.push({type:'arc',x:p.x,y:p.y,r,life:0.25,max:0.25}); this.strike(t,()=>this.weaponHit(1.1*lm),c); break; }
      case 'rotstrike': case 'bash': case 'rend': { const m=this.monAt(tx,ty); if(!m||dist(m.x,m.y,p.x,p.y)>1+st.reach){ ok=false; this.log('Cíl musí být vedle tebe.','warn'); break; } this.lunge(p,m);
        if(id==='rotstrike') c.forcePoison=true; if(id==='rend') c.forceBleed=1.5;
        const mult=id==='bash'?1.3:id==='rend'?0.8:1.9; const shieldArm=id==='bash'?(p.equip.offhand?.imp?.armor||0)*0.6:0;
        this.strike([m],()=>{ const h=this.weaponHit(mult*lm); h.phys+=shieldArm; return h; },c);
        if(id==='bash'&&m.hp>0&&!m.boss){ m.status.stun=2; m.tele=null; const dx=Math.sign(m.x-p.x), dy=Math.sign(m.y-p.y); if(this.passable(m.x+dx,m.y+dy)&&!this.monAt(m.x+dx,m.y+dy)){ m.x+=dx; m.y+=dy; } } break; }
      case 'barkskin': p.buffs=p.buffs.filter(b=>b.id!=='bark'); p.buffs.push({id:'bark',name:'Kůrová kůže',armorPct:0.6*lm,regen:1+this.skillLevel(id)*0.8,turns:6}); this.recalc(); this.burst(p.x,p.y,[0.6,0.45,0.25],16,60); break;
      case 'warcry': { for(const m of this.monsters) if(m.hp>0&&dist(m.x,m.y,p.x,p.y)<=aoeR(1)&&!m.boss){ m.status.stun=1; m.tele=null; } p.buffs=p.buffs.filter(b=>b.id!=='cry'); p.buffs.push({id:'cry',name:'Válečný řev',dmgPct:0.4*lm,turns:5}); this.recalc(); this.fx.push({type:'ring',x:p.x,y:p.y,r:aoeR(1),life:0.4,max:0.4,c:[1,0.8,0.4]}); this.shake=6; break; }
      case 'sporebolt': { const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5||!losOk(m)){ ok=false; this.log('Neplatný cíl.','warn'); break; }
        const t=[m]; if(st.uniques.has('spore_grip')) t.push(...this.monsters.filter(o=>o!==m&&o.hp>0&&this.canSee(o)&&edist(p.x,p.y,o.x,o.y)<=s.range).sort((a,b)=>edist(a.x,a.y,m.x,m.y)-edist(b.x,b.y,m.x,m.y)).slice(0,2));
        c.poisonCh=40; this.strike(t,()=>this.spellHit(1.2*lm,'poison'),c,o=>this.proj(p.x,p.y,o.x,o.y,[0.7,1,0.4])); break; }
      case 'puffbomb': case 'plague': { if(!this.isVis(tx,ty)||edist(p.x,p.y,tx,ty)>s.range+0.5||this.tile(tx,ty)!==FLOOR){ ok=false; this.log('Neplatné místo.','warn'); break; }
        const r=aoeR(id==='plague'?2:1)+(id==='puffbomb'&&st.uniques.has('puff_staff')?1:0); this.proj(p.x,p.y,tx,ty,[0.8,1,0.5]); this.fx.push({type:'cloud',x:tx,y:ty,r,life:0.9,max:0.9}); this.flashLight(tx,ty,[0.6,0.9,0.3],r+2);
        const t=this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,tx,ty)<=r);
        if(id==='puffbomb'){ c.forcePoison=true; this.strike(t,()=>this.spellHit(1.4*lm,'poison'),c); if(st.uniques.has('puff_staff')) this.fx.push({type:'poisonzone',x:tx,y:ty,r,turns:4,life:99,max:99,dmg:st.spellBase*0.4}); }
        else for(const m of t){ this.applyPoison(m,st.spellBase*(1+st.spell/100)*2.0*lm/6,6,c); this.burst(m.x,m.y,[0.6,1,0.3],8,50); }
        break; }
      case 'firebrand': { const r=aoeR(2); this.fx.push({type:'ring',x:p.x,y:p.y,r,life:0.5,max:0.5,c:[1,0.5,0.15]}); this.flashLight(p.x,p.y,[1,0.5,0.15],6,0.6);
        c.burnCh=100; this.strike(this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,p.x,p.y)<=r&&losOk(m)),()=>this.spellHit(1.0*lm,'fire'),c);
        p.buffs=p.buffs.filter(b=>b.id!=='brand'); p.buffs.push({id:'brand',name:'Rozžhavená pochodeň',torch:2,turns:8}); this.recalc(); break; }
      case 'blink': { if(!this.isVis(tx,ty)||edist(p.x,p.y,tx,ty)>s.range+0.5||!this.passable(tx,ty)||this.monAt(tx,ty)||this.minAt(tx,ty)){ ok=false; this.log('Sem skočit nelze.','warn'); break; }
        this.burst(p.x,p.y,[0.7,0.5,1],14,70); p.x=p.rx=tx; p.y=p.ry=ty; this.burst(tx,ty,[0.7,0.5,1],14,70); this.onStep(); break; }
      case 'drain': { const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5){ ok=false; this.log('Neplatný cíl.','warn'); break; }
        const d=this.strike([m],()=>this.spellHit(1.5*lm,'decay'),c,o=>this.proj(o.x,o.y,p.x,p.y,[0.9,0.3,0.5])); this.healPlayer(d*0.5); break; }
      case 'volley': { if(st.kind!=='bow'){ ok=false; this.log('Salva vyžaduje luk.','warn'); break; } const t=this.monsters.filter(m=>m.hp>0&&this.canSee(m)&&edist(p.x,p.y,m.x,m.y)<=8&&losOk(m)).sort((a,b)=>edist(p.x,p.y,a.x,a.y)-edist(p.x,p.y,b.x,b.y)).slice(0,3+st.aoe+(st.setPow.has('hunterset')?2:0));
        if(!t.length){ ok=false; this.log('Žádné cíle.','warn'); break; } this.strike(t,()=>this.weaponHit(0.9*lm),c,o=>this.proj(p.x,p.y,o.x,o.y,[1,0.9,0.7],'arrow')); break; }
      case 'lunge': { const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5||!losOk(m)){ ok=false; this.log('Neplatný cíl.','warn'); break; }
        if(dist(m.x,m.y,p.x,p.y)>1){ const spots=DIRS8.map(([dx,dy])=>[m.x+dx,m.y+dy]).filter(([x,y])=>this.passable(x,y)&&!this.monAt(x,y)&&!this.minAt(x,y)).sort((a,b)=>edist(a[0],a[1],p.x,p.y)-edist(b[0],b[1],p.x,p.y)); if(!spots.length){ ok=false; this.log('K cíli se nedá doskočit.','warn'); break; } this.burst(p.x,p.y,[1,0.9,0.7],8,60); p.x=spots[0][0]; p.y=spots[0][1]; this.onStep(); }
        this.lunge(p,m); c.bleedCh=40; this.strike([m],()=>this.weaponHit(1.6*lm),c); break; }
      case 'spikes': { const r=aoeR(1); const t=this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,p.x,p.y)<=r&&losOk(m)); this.fx.push({type:'ring',x:p.x,y:p.y,r,life:0.4,max:0.4,c:[0.5,0.9,0.4]}); this.shake=5;
        this.strike(t,()=>{ const h=this.weaponHit(1.1*lm); h.phys+=st.armor*0.3; return h; },c); for(const m of t) if(m.hp>0&&!m.boss) m.status.root=Math.max(m.status.root||0,2); break; }
      case 'snipe': case 'arrowrain': { if(st.kind!=='bow'){ ok=false; this.log(s.name+' vyžaduje luk.','warn'); break; }
        if(id==='snipe'){ const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5||!losOk(m)){ ok=false; this.log('Neplatný cíl.','warn'); break; } c.critBonus=40; this.strike([m],()=>this.weaponHit(2.6*lm),c,o=>this.proj(p.x,p.y,o.x,o.y,[1,0.95,0.6],'arrow')); }
        else { if(!this.isVis(tx,ty)||edist(p.x,p.y,tx,ty)>s.range+0.5||this.tile(tx,ty)!==FLOOR){ ok=false; this.log('Neplatné místo.','warn'); break; } const r=aoeR(1);
          this.strike(this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,tx,ty)<=r),()=>this.weaponHit(0.9*lm),c); this.fx.push({type:'arrowzone',x:tx,y:ty,r,turns:2,life:99,max:99,mult:0.45*lm,skill:id}); for(let i=0;i<6;i++) this.proj(p.x,p.y,tx+rng.int(-r,r),ty+rng.int(-r,r),[1,0.9,0.7],'arrow'); }
        break; }
      case 'sproutlings': case 'jellycall': case 'entcall': { const n=this.summon(id); if(!n){ ok=false; this.log('Není kde vyvolat.','warn'); } break; }
      case 'command': { const ms=this.minions.filter(x=>x.hp>0); if(!ms.length){ ok=false; this.log('Nemáš žádné přisluhovače.','warn'); break; }
        for(const mn of ms){ mn.hp=Math.min(mn.maxhp,mn.hp+mn.maxhp*0.35); this.burst(mn.x,mn.y,[1,0.85,0.4],8,50); } p.buffs=p.buffs.filter(b=>b.id!=='cmd'); p.buffs.push({id:'cmd',name:'Mycelový rozkaz',turns:5,cmd:true}); this.fx.push({type:'ring',x:p.x,y:p.y,r:2,life:0.4,max:0.4,c:[1,0.8,0.3]}); break; }
      case 'detonate': { const mn=this.minions.filter(x=>x.hp>0).sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp)[0]; if(!mn){ ok=false; this.log('Nemáš žádné přisluhovače.','warn'); break; }
        const r=aoeR(1), dmg=mn.maxhp*0.9*lm; this.fx.push({type:'cloud',x:mn.x,y:mn.y,r,life:0.9,max:0.9}); this.flashLight(mn.x,mn.y,[0.6,1,0.3],r+2); this.shake=6;
        this.strike(this.monsters.filter(m=>m.hp>0&&dist(m.x,m.y,mn.x,mn.y)<=r),()=>({phys:0,fire:0,poison:dmg*rng.range(0.9,1.1),decay:0,crit:st.crit*0.5,critMult:st.critMult,spell:true}),c); this.killMinion(mn,true); break; }
      case 'bearform': case 'boarform': { const ratio=p.hp/st.life; const was=p.form; p.form=p.form===s.form?null:s.form; this.recalc(); p.hp=Math.max(1,Math.min(p.stats.life,ratio*p.stats.life));
        this.burst(p.x,p.y,s.form==='bear'?[0.8,0.55,0.3]:[0.5,0.9,0.4],24,90); this.flashLight(p.x,p.y,[0.9,0.8,0.5],4,0.5); this.log(p.form?`Měníš se: ${FORMS[p.form].name}.`:'Vracíš se do lidské podoby.','sys');
        if(p.form&&st.setPow.has('shiftset')) this.healPlayer(p.stats.life*0.2);
        if(p.form&&st.uniques.has('moon_mask')){ p.buffs=p.buffs.filter(b=>b.id!=='moon'); p.buffs.push({id:'moon',name:'Úplněk',dmgPct:0.5,turns:3}); this.recalc(); }
        this.snd(p.form==='bear'?'roar':'buff'); break; }
      case 'maul': { const m=this.monAt(tx,ty); if(!m||dist(m.x,m.y,p.x,p.y)>1+st.reach){ ok=false; this.log('Cíl musí být vedle tebe.','warn'); break; } this.lunge(p,m); this.shake=7;
        this.strike([m],()=>this.weaponHit(2.3*lm),c); if(m.hp>0&&!m.boss){ m.status.stun=Math.max(m.status.stun||0,1); m.tele=null; if(st.uniques.has('root_spear')) m.status.root=2; } break; }
      case 'gore': { const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5||!losOk(m)){ ok=false; this.log('Neplatný cíl.','warn'); break; }
        const path=line(p.x,p.y,m.x,m.y).slice(1); const pierce=st.uniques.has('boar_tusk'); const hit=[]; let last=[p.x,p.y];
        for(const [x,y] of path){ const o=this.monAt(x,y); if(o){ hit.push(o); if(!pierce) break; continue; } if(!this.passable(x,y)||this.minAt(x,y)) break; last=[x,y]; }
        this.burst(p.x,p.y,[0.7,0.5,0.3],10,70); p.x=last[0]; p.y=last[1]; this.onStep(); this.shake=8; c.forceBleed=1;
        this.strike(hit,()=>this.weaponHit(1.8*lm),c); for(const o of hit) if(o.hp>0&&!o.boss){ const dx=Math.sign(o.x-p.x), dy=Math.sign(o.y-p.y); if(this.passable(o.x+dx,o.y+dy)&&!this.monAt(o.x+dx,o.y+dy)&&!this.minAt(o.x+dx,o.y+dy)){ o.x+=dx; o.y+=dy; } }
        if(hit[0]) this.face(p,hit[0].x); break; }
      case 'thornroot': { const m=this.monAt(tx,ty); if(!m||!this.canSee(m)||edist(p.x,p.y,m.x,m.y)>s.range+0.5||!losOk(m)){ ok=false; this.log('Neplatný cíl.','warn'); break; }
        const t=[m]; if(st.uniques.has('root_spear')) t.push(...this.monsters.filter(o=>o!==m&&o.hp>0&&dist(o.x,o.y,m.x,m.y)<=1).slice(0,2));
        this.strike(t,()=>this.spellHit(1.3*lm,'decay'),c,o=>{ this.burst(o.x,o.y,[0.5,0.8,0.3],10,50); }); for(const o of t) if(o.hp>0&&!o.boss) o.status.root=Math.max(o.status.root||0,3); break; }
      case 'regrow': { p.buffs=p.buffs.filter(b=>b.id!=='regrow'); p.buffs.push({id:'regrow',name:'Obrůstání',regenPct:0.05*lm,turns:5}); this.recalc(); this.burst(p.x,p.y,[0.4,1,0.6],16,60); break; }
    }
    if(!ok) return false;
    this.snd({cleave:'cleave',rotstrike:'hit',bash:'bash',rend:'swing',barkskin:'buff',warcry:'warcry',sporebolt:'sporebolt',puffbomb:'puffbomb',plague:'plague',firebrand:'fire',blink:'blink',drain:'drain',volley:'bow',lunge:'swing',spikes:'slam',snipe:'bow',arrowrain:'bow',sproutlings:'squish',jellycall:'squish',entcall:'roar',command:'warcry',detonate:'puffbomb',maul:'bash',gore:'slam',thornroot:'drain',regrow:'buff',bearform:null,boarform:null}[id]??(s.form?null:'swing')); if(tx!=null&&!s.form) this.face(p,tx); if(!(s.tags.includes('spell')&&st.setPow.has('ulmyr')&&rng.chance(0.25))) this.pay(cost); else this.float(p.x,p.y,'Zdarma','#9cf',0.9); let cd=Math.ceil(s.cd*(1-st.cdr/100)*(c.sups.has('haste')?0.5:1)*(st.ks.has('pact')?1.5:1)); if(s.form&&(st.ks.has('wildheart')||st.setPow.has('shiftset'))) cd=0; if(st.uniques.has('echo_ring')&&rng.chance(0.25)){ cd=0; this.float(p.x,p.y,'Ozvěna!','#c9f'); } p.cds[id]=cd; p.steps=0;
    return this.endTurn();
  }
  weaponHit(mult=1){ const st=this.player.stats; return {phys:rng.range(st.dmg[0],st.dmg[1])*mult,fire:st.fire*mult,poison:st.poison*mult,decay:st.decay*mult,crit:st.crit,critMult:st.critMult,attack:true}; }
  spellHit(mult,el){ const st=this.player.stats; const h={phys:0,fire:0,poison:0,decay:0,crit:st.crit*0.7,critMult:st.critMult,spell:true}; h[el]=st.spellBase*rng.range(0.85,1.15)*mult; return h; }
  lunge(a,t){ a.lunge={dx:t.x-a.x,dy:t.y-a.y,t:0}; this.face(a,t.x); }
  basicAttack(m){
    const p=this.player, st=p.stats; if(m.x!==p.x) p.flip=m.x<p.x; const ranged=st.kind!=='melee'&&dist(m.x,m.y,p.x,p.y)>1; this.snd(ranged?(st.kind==='bow'?'bow':'zap'):'swing');
    const c=this.ctx('attack'); if(st.uniques.has('silent_step')&&p.steps>=3) c.forceCrit=true;
    const mult=st.kind==='melee'||ranged?1:0.6; let targets=[m];
    if(st.uniques.has('bone_bow')&&st.kind==='bow'){ targets.push(...this.monsters.filter(o=>o!==m&&o.hp>0&&this.canSee(o)&&edist(p.x,p.y,o.x,o.y)<=7).sort((a,b)=>edist(a.x,a.y,m.x,m.y)-edist(b.x,b.y,m.x,m.y)).slice(0,2)); }
    if(!ranged) this.lunge(p,m);
    this.strike(targets,()=>{ const h=this.weaponHit(mult); if(st.kind==='staff'&&ranged){ h.decay+=h.phys*0.5; h.phys*=0.5; } return h; },c,
      o=>{ if(ranged||o!==m) this.proj(p.x,p.y,o.x,o.y,st.kind==='staff'?[0.6,1,0.5]:[1,0.9,0.7],st.kind==='staff'?null:'arrow'); });
    p.steps=0;
  }
  rangedAttack(m){ this.basicAttack(m); return this.endTurn(); }
  canShoot(m){ const p=this.player; return p.stats.kind!=='melee'&&this.canSee(m)&&edist(p.x,p.y,m.x,m.y)<=7.5&&los(p.x,p.y,m.x,m.y,this.oc); }
  // core damage pipeline
  hitMonster(m,h,c={sups:new Set(),tags:[]}){
    if(m.hp<=0) return 0; const p=this.player, st=p.stats, su=c.sups, ks=st.ks;
    // conversions
    if(su.has('venom')){ const v=h.phys*0.4; h.phys-=v; h.poison+=v; }
    if(su.has('pyre')){ for(const k of ['phys','poison','decay']){ const v=h[k]*0.5; h[k]-=v; h.fire+=v; } }
    if(su.has('brutal')){ h.phys*=1.45; h.fire=h.poison=h.decay=0; }
    // increased modifiers
    const mn=c.minion; const nMin=this.minions.length;
    let more;
    if(mn){ const inc=1+st.minionDmg/100; h.phys*=inc; h.fire*=inc; h.poison*=inc; h.decay*=inc;
      more=(c.areaMore||1)*(ks.has('swarm')?0.65:1)*(su.has('fertile')?0.85:1)*(p.buffs.some(b=>b.cmd)?1.5:1)*(st.setPow.has('hiveset')?1.4:1);
      if(m.hp/m.maxhp<0.35&&su.has('execute')) more*=1.6; if(m.status.stun&&su.has('stun')) more*=1.25; }
    else { const inc=1+(st.dmgPct+(h.spell?st.spell:0))/100;
    h.phys*=inc*(1+st.physPct/100); const ei=inc*(1+st.elemPct/100); h.fire*=ei; h.poison*=ei; h.decay*=ei;
    more=st.more*(c.areaMore||1);
    if(m.hp/m.maxhp<0.35) more*=1+(st.execPct+(su.has('execute')?60:0))/100;
    if(m.status.stun) more*=1+(su.has('stun')?0.25:0);
    if(ks.has('darkhunter')&&edist(m.x,m.y,p.x,p.y)>st.torch) more*=1.5;
    if(ks.has('eldritch')) more*=0.7;
    if(ks.has('berserk')) more*=1+Math.max(0,1-p.hp/st.life);
    if(st.uniques.has('blood_idol')&&c.skill!=='attack') more*=1.4;
    if(st.uniques.has('pact_ring')) more*=1+0.06*nMin;
    if(h.spell&&st.setPow.has('ulmyr')) more*=1.2;
    if(m.status.bleed&&st.setPow.has('bladeset')) more*=1.35; }
    // crit
    let cc=h.crit+(su.has('crit')?10:0)+(c.critBonus||0); if(ks.has('rotsoul')&&!mn) cc=0; const crit=c.forceCrit||rng.next()*100<cc; const cm=crit?(h.critMult+(su.has('crit')?40:0))/100:1;
    const hx=m.status.hex?1:0; let phys=h.phys*cm*more; const red=Math.min(0.75,m.arm*(hx?0.8:1)/(m.arm*(hx?0.8:1)+phys*3+6)); phys*=1-red;
    let total=phys; const parts={phys}; for(const k of EL){ const r=Math.max(-50,(m.res[k]||0)-st.pen-hx*20); parts[k]=h[k]*cm*more*(1-r/100); total+=parts[k]; }
    total=Math.max(1,total);
    if(m.shield>0){ const a=Math.min(m.shield,total); m.shield-=a; total-=a; this.float(m.x,m.y,'štít','#9cf',0.8); if(m.shield<=0) this.burst(m.x,m.y,[0.6,0.8,1],10,60); }
    m.hp-=total; m.aware=true; m.flash=0.15; this.snd(crit?'crit':'hit',m.x,m.y);
    const dom=Object.entries(parts).sort((a,b)=>b[1]-a[1])[0][0];
    this.float(m.x,m.y,(crit?'✸ ':'')+fmt(total),crit?'#ffd54a':{phys:'#fff',fire:'#ff9c4a',poison:'#a6e86a',decay:'#d38cff'}[dom],crit?1.35:1);
    this.burst(m.x,m.y,dom==='fire'?[1,0.5,0.1]:dom==='poison'?[0.6,1,0.3]:dom==='decay'?[0.8,0.4,1]:[0.9,0.25,0.2],crit?12:6,crit?110:70,0.45);
    if(crit) this.shake=Math.max(this.shake,4);
    if(su.has('hex')) m.status.hex=3;
    if(crit&&!mn&&st.setPow.has('hunterset')&&!c.cdrDone){ c.cdrDone=true; for(const k in p.cds) if(p.cds[k]>0) p.cds[k]--; }
    // ailments (based on pre-mitigation hit)
    const base=(h.phys+h.fire+h.poison+h.decay)*cm*more;
    const dotM=1+(st.dot+(su.has('dot')?50:0))/100;
    const pch=(mn?0:st.poisonCh)+(c.poisonCh||0)+(su.has('venom')?50:0)+(crit&&ks.has('resonance')&&!mn?100:0);
    if(c.forcePoison||(mn&&st.uniques.has('rot_totem'))||rng.next()*100<pch) this.applyPoison(m,(h.poison*cm*more+h.phys*cm*more*0.3)*0.35+1,4,c,dotM);
    const bch=(mn?0:st.burnCh)+(c.burnCh||0)+(su.has('pyre')?40:0)+(crit&&ks.has('resonance')&&!mn?100:0);
    if(rng.next()*100<bch) this.addAil(m,'burn',(h.fire*cm*more+base*0.15)*0.5*dotM*(1-(m.res.fire||0)/100),3);
    if(c.forceBleed||(h.attack&&rng.next()*100<(mn?0:st.bleed)+(c.bleedCh||0))) this.addAil(m,'bleed',h.phys*cm*more*0.3*(c.forceBleed||1)*dotM,3);
    if(h.attack&&!m.boss&&rng.next()*100<(mn?0:st.stun)+(su.has('stun')?30:0)){ m.status.stun=1; m.tele=null; }
    if(!mn&&h.attack&&c.skill==='attack'&&st.uniques.has('rootblade')&&rng.chance(0.25)&&!m.boss) m.status.root=2;
    if(mn){ if(su.has('leech')) mn.hp=Math.min(mn.maxhp,mn.hp+total*0.05); }
    else { const lch=st.leech+(su.has('leech')?5:0); if(lch) this.healPlayer(total*lch/100,true); }
    // reflect
    if(!mn&&(m.mods.includes('reflect')||this.floorMods?.mon?.reflectAll)){ this.hurtPlayer(total*(m.mods.includes('reflect')?0.2:0.1),null,null,m.name+' (odraz)',true); }
    if(m.hp<=0) this.killMonster(m,c);
    return total;
  }
  applyPoison(m,dmg,turns,c={sups:new Set()},dotM,spread){ const st=this.player.stats; const ks=st.ks; dotM=dotM??1+(st.dot+(c.sups?.has('dot')?50:0))/100;
    if(ks.has('plaguebody')&&!spread) for(const o of this.monsters) if(o!==m&&o.hp>0&&dist(o.x,o.y,m.x,m.y)<=1) this.applyPoison(o,dmg*0.6,turns,c,dotM,true);
    const d=Math.max(1,dmg*dotM*(1-(m.res.poison||0)/100)); const n=st.uniques.has('fruiting')?2:1; const P=m.status.poison||(m.status.poison=[]);
    for(let i=0;i<n;i++) P.push({d,t:turns+(ks.has('rotsoul')?2:0)}); const cap=ks.has('rotsoul')?999:12; while(P.length>cap){ P.sort((a,b)=>a.d-b.d); P.shift(); } }
  addAil(m,k,dmg,turns){ const s=m.status[k]; if(s){ s.dmg=Math.max(s.dmg,dmg); s.turns=Math.max(s.turns,turns); } else m.status[k]={dmg:Math.max(1,dmg),turns}; }
  killMonster(m,c){
    this.snd(m.boss?'bossdie':'die',m.x,m.y);
    const p=this.player; m.hp=0; this.kills++; this.burst(m.x,m.y,[0.5,0.8,0.3],m.boss?60:16,m.boss?160:90,0.8);
    this.fx.push({type:'corpse',x:m.x,y:m.y,spr:m.spr,sc:m.sc,flip:m.flip,life:0.6,max:0.6});
    const lm=this.floorMods?.loot||{}; const st=p.stats;
    this.gainXP(m.xp*(1+st.xp/100+(lm.xp||0)));
    if(st.lifeKill) this.healPlayer(st.lifeKill,true);
    if(c?.minion&&st.setPow.has('hiveset')) this.healPlayer(st.life*0.03,true);
    if(st.uniques.has('hunger')){ this.healPlayer(st.life*0.08,true); p.mp=Math.min(st.mana,p.mp+st.mana*0.08); }
    if(m.status.poison&&st.uniques.has('mycel_crown')) for(const o of this.monsters) if(o.hp>0&&dist(o.x,o.y,m.x,m.y)<=1){ (o.status.poison||(o.status.poison=[])).push(...m.status.poison.map(s=>({...s}))); this.burst(o.x,o.y,[0.6,1,0.3],6,40); }
    if(m.status.burn&&st.uniques.has('ash_crown')) for(const o of this.monsters) if(o.hp>0&&dist(o.x,o.y,m.x,m.y)<=1){ this.addAil(o,'burn',m.status.burn.dmg,3); this.burst(o.x,o.y,[1,0.5,0.1],6,40); }
    if(c?.sups?.has('corpse')){ const dmg=m.maxhp*0.2; this.fx.push({type:'ring',x:m.x,y:m.y,r:1,life:0.35,max:0.35,c:[1,0.45,0.15]}); this.flashLight(m.x,m.y,[1,0.5,0.2],3);
      for(const o of this.monsters) if(o.hp>0&&dist(o.x,o.y,m.x,m.y)<=1) this.hitMonster(o,{phys:0,fire:dmg,poison:0,decay:0,crit:0,critMult:100},{sups:new Set(),tags:[],skill:'corpse'}); }
    if(st.uniques.has('sprouting')) this.fx.push({type:'pmine',x:m.x,y:m.y,turns:1,life:99,max:99});
    if(st.uniques.has('centipede')&&rng.chance(0.3)){ this.extraTurn=true; this.float(p.x,p.y,'Tah navíc!','#9df07a'); }
    if((m.mods.includes('explosive')||this.floorMods?.mon?.explode)&&!m.boss){ this.addHazard(m.x,m.y,1,'fire',m.dmg[1]*1.2,1,1,m.name+' (exploze)'); }
    // loot
    const qty=1+(lm.qty||0)+(this.map.event==='blackout'?0.3:0);
    const base=m.thief?0:m.boss?5:m.unique?3:m.rarity==='rare'?2:m.rarity==='magic'?0.7:m.nest?2:0.22;
    const exp=base*qty; const n=Math.floor(exp)+(rng.next()<exp%1?1:0);
    const boost=m.boss?1.5:m.rarity==='rare'?0.9:m.rarity==='magic'?0.4:0;
    for(let i=0;i<n;i++) this.dropItem(m.x,m.y,{boost,rarity:(m.boss||m.unique)&&i===0?(rng.chance(this.legChance(m.boss?0.45:0.25))||m.hunter&&this.floorMods?.mon?.hunter?'legendary':'rare'):undefined});
    if(m.hunter&&this.floorMods?.mon?.hunter) this.dropItem(m.x,m.y,{rarity:'legendary'});
    if(rng.chance(m.boss?1:0.3)) this.dropGold(m.x,m.y,m.boss?6:m.rarity!=='normal'?2:1);
    if(rng.chance(m.boss?0.8:0.07)) this.ground.push({x:m.x,y:m.y,item:{type:'potion',name:'Léčivý lektvar',spr:'pot_red'}});
    if(rng.chance(m.boss?0.7:m.rarity==='rare'?0.15:0.015)) this.dropTome(m.x,m.y);
    if(rng.chance(m.boss?1:m.rarity==='rare'||m.unique?0.3:m.rarity==='magic'?0.07:0.025)) this.dropSupport(m.x,m.y);
    if(m.boss){ this.map.stairs.locked=false; this.log(`${m.name} padl! Schodiště se otevřelo.`,'good'); this.shake=14; this.checkpoint=this.depth+1; this.ui?.banner?.(m.name+' poražen',''); this.bossRef=null; }
    if(m.nest){ this.log('Hnízdo zničeno!','good'); }
    if(m.thief){ this.log('Hrabivý skřítek padl! Jeho vak praskl.','good'); this.ui?.banner?.('Skřítek chycen!',''); this.snd('loot_leg'); for(let i=0;i<8;i++) this.dropGold(m.x,m.y,3); for(let i=0;i<rng.int(3,5);i++) this.dropItem(m.x,m.y,{boost:1.2,rarity:i===0&&rng.chance(this.legChance(0.3))?'legendary':undefined}); if(rng.chance(0.5)) this.dropSupport(m.x,m.y); this.player.cores=(this.player.cores||0)+(rng.chance(0.4)?1:0); }
    if(m.riftGuardian){ this.map.stairs.locked=false; this.invalidateLight(); this.log('Srdce jeskyně kleslo. Portál ven je otevřený.','good'); this.ui?.banner?.('Jeskyně dobyta',''); const n=1+Math.floor((this.floorMods?.mods?.length||1)/2); this.player.cores=(this.player.cores||0)+n; this.log(`+${n} zkažené jádro.`,'loot:sporeborn'); }
    this.monsters=this.monsters.filter(x=>x!==m);
  }
  legChance(b){ return b*Math.min(1,0.25+this.depth*0.06); }
  gainXP(x){ const p=this.player; p.xp+=x; let up=false; while(p.xp>=this.xpNeed()){ p.xp-=this.xpNeed(); p.lvl++; p.points+=2; p.ppoints=(p.ppoints||0)+1; up=true; }
    if(up){ this.snd('levelup'); this.recalc(); p.hp=p.stats.life; p.mp=p.stats.mana; this.log(`Úroveň ${p.lvl}! +2 atributy [C], +1 pasivní bod [P].`,'good'); this.burst(p.x,p.y,[1,0.9,0.5],30,120,1); this.flashLight(p.x,p.y,[1,0.85,0.5],6,1); this.ui?.refresh?.(); } }
  xpNeed(){ const l=this.player.lvl; return Math.round(30*Math.pow(1.25,l-1)+l*18); }
  dropItem(x,y,{boost=0,rarity}={}){ const lm=this.floorMods?.loot||{}; const it=makeItem(this.depth+(lm.ilvl||0)+(boost>1?1:0),{mf:this.player.stats.mf+(lm.mf||0),boost,rarity,spore:lm.spore||0.0}); if(lm.corrupt&&it.base&&rng.chance(lm.corrupt*(1+boost))){ corruptItem(it,true); } const pos=this.scatter(x,y); this.ground.push({x:pos[0],y:pos[1],item:it}); if(it.rarity==='legendary'||it.rarity==='sporeborn'||it.rarity==='set') this.log('✦ '+it.name+' leží na zemi!','loot:'+it.rarity); }
  dropGold(x,y,m=1){ const g=Math.round(rng.range(3,9)*Math.pow(1.1,this.depth)*m*(1+(this.player.stats.gf+(this.floorMods?.loot?.gf||0))/100)); const pos=this.scatter(x,y); this.ground.push({x:pos[0],y:pos[1],gold:g}); }
  dropTome(x,y){ const pool=skillsFor(this.player.cls); const id=rng.pick(pool.length?pool:Object.keys(SKILLS).filter(k=>k!=='attack')); const s=SKILLS[id]; const pos=this.scatter(x,y); this.ground.push({x:pos[0],y:pos[1],item:{type:'tome',skill:id,name:'Kniha: '+s.name,desc:s.desc,spr:'scroll_shroom',uid:Math.random()}}); }
  dropSupport(x,y){ const pos=this.scatter(x,y); const it=makeSupport(); this.ground.push({x:pos[0],y:pos[1],item:it}); this.log('◆ '+it.name+' leží na zemi.','loot:support'); }
  scatter(x,y){ const opts=[[x,y],...DIRS8.map(([dx,dy])=>[x+dx,y+dy])].filter(([a,b])=>this.passable(a,b)&&!this.ground.some(g=>g.x===a&&g.y===b)); return opts.length?rng.pick(opts):[x,y]; }
  healPlayer(v,quiet){ const p=this.player; if(p.stats.ks?.has('chitin')){ p.es=Math.min(p.stats.esMax,(p.es||0)+v*0.5); return; } const before=p.hp; p.hp=Math.min(p.stats.life,p.hp+v); if(!quiet&&p.hp-before>=1) this.float(p.x,p.y,'+'+fmt(p.hp-before),'#7f7'); }
  hurtPlayer(dmg,el,src,srcName,noAvoid){
    const p=this.player, st=p.stats; if(p.hp<=0) return 0;
    if(src&&!noAvoid&&rng.next()*100<Math.min(75,st.dodge+(st.uniques.has('pact_ring')?2*this.minions.length:0))){ this.float(p.x,p.y,'úhyb','#9cf'); this.snd('dodge'); return 0; }
    if(src&&!noAvoid&&st.block>0&&rng.next()*100<st.block){ this.float(p.x,p.y,'blok','#ccc'); this.snd('block'); if(st.uniques.has('thistle')) this.thorn(src,dmg*0.4); if(st.setPow.has('wardset')){ this.healPlayer(st.life*0.04,true); if(!src.boss&&src.status){ src.status.stun=1; src.tele=null; } } return 0; }
    let d=dmg; if(el==='fire'&&st.ks.has('chitin')) d*=1.5;
    if(!el){ d*=1-Math.min(0.85,st.armor/(st.armor+dmg*6+8)); }
    else { const r=el==='poison'?st.resPoison:el==='fire'?st.resFire:st.resDecay; d*=1-r/100; if(st.ks.has('iron')) d*=1-Math.min(0.85,st.armor/(st.armor+dmg*6+8))*0.5; }
    d=Math.max(1,d);
    if(st.ks.has('symbiosis')&&this.minions.length){ const mn=this.minions.slice().sort((a,b)=>dist(a.x,a.y,p.x,p.y)-dist(b.x,b.y,p.x,p.y))[0]; const a=d*0.35; d-=a; this.hurtMinion(mn,a,null,true); }
    if(st.uniques.has('mycel_cloak')&&p.mp>0){ const a=Math.min(p.mp,d*0.3); p.mp-=a; d-=a; }
    if(st.ks.has('chitin')&&p.es>0){ const a=Math.min(p.es,d); p.es-=a; d-=a; this.lastHit=this.turn; if(d<=0){ this.float(p.x,p.y,'-'+fmt(a),'#9cf'); this.snd('block'); return a; } }
    p.hp-=d; this.snd('hurt'); this.renderHurt=Math.min(1,(this.renderHurt||0)+d/st.life*2.5); this.shake=Math.max(this.shake,3+d/st.life*18);
    this.float(p.x,p.y,'-'+fmt(d),'#ff5a4a'); this.lastHit=this.turn;
    if(src&&st.thorns) this.thorn(src,st.thorns); if(src&&st.uniques.has('thistle')) this.thorn(src,d*0.4);
    if(p.hp<=0){ p.hp=0; this.onDeath(srcName||src?.name||'neznámo'); }
    return d;
  }
  thorn(m,v){ if(m.hp>0){ m.hp-=v; this.float(m.x,m.y,fmt(v),'#c8a060',0.85); if(m.hp<=0) this.killMonster(m); } }
  onDeath(by){ for(const mn of this.minions) this.burst(mn.x,mn.y,[0.5,0.7,0.3],8,50); this.minions=[]; this.snd('death'); this.log(`Padl jsi. Zabil tě: ${by}.`,'warn'); this.burst(this.player.x,this.player.y,[0.8,0.1,0.1],40,120,1.2); this.ui?.onDeath?.(by); }
  respawn(){ const p=this.player; p.form=null; this.minions=[]; const lost=Math.floor(p.gold*0.25); p.gold-=lost; p.xp=Math.floor(p.xp*0.5); p.buffs=[]; this.floorMods=null; p.cds={};
    this.enterFloor(this.checkpoint); p.hp=p.stats.life; p.mp=p.stats.mana; this.log(`Probouzíš se v hloubce ${this.checkpoint}. Ztraceno ${fmt(lost)} zlata.`,'sys'); this.save(); }
  // ================= equipment / progression =================
  equip(it,slot,silent){ if(!silent) this.snd('equip'); const p=this.player; if(!slot){ slot=it.slot==='ring'?(!p.equip.ring1?'ring1':!p.equip.ring2?'ring2':'ring1'):it.slot; }
    const old=p.equip[slot]; p.equip[slot]=it; const i=p.inv.indexOf(it); if(i>=0) p.inv.splice(i,1); if(old) p.inv.push(old);
    if(!silent){ this.recalc(); this.ui?.refresh?.(); } }
  unequip(slot){ const p=this.player; const it=p.equip[slot]; if(!it||p.inv.length>=30) return; p.equip[slot]=null; p.inv.push(it); this.recalc(); }
  salvage(it){ this.snd('salvage'); const p=this.player; const v=itemValue(it); p.dust+=v; p.inv.splice(p.inv.indexOf(it),1); return v; }
  learn(tome){ this.snd('learn'); const p=this.player; p.skills[tome.skill]=(p.skills[tome.skill]||0)+1; p.inv.splice(p.inv.indexOf(tome),1);
    if(!p.bar.includes(tome.skill)){ const e=p.bar.indexOf(null); if(e>=0) p.bar[e]=tome.skill; }
    this.log(`${SKILLS[tome.skill].name} – úroveň ${p.skills[tome.skill]}.`,'good'); }
  socket(skill,idx,sup){ const p=this.player; const L=p.links[skill]||(p.links[skill]=[null,null,null]); const old=L[idx]; L[idx]=sup.sup; p.inv.splice(p.inv.indexOf(sup),1); if(old) p.inv.push(makeSupport(old)); }
  unsocket(skill,idx){ const p=this.player; const L=p.links[skill]; if(!L||!L[idx]||p.inv.length>=30) return; p.inv.push(makeSupport(L[idx])); L[idx]=null; }
  canAlloc(id){ const p=this.player; if(p.passives.includes(id)||!(p.ppoints>0)) return false; return [...PASSIVE_MAP[id].adj].some(a=>p.passives.includes(a)); }
  alloc(id){ if(!this.canAlloc(id)) return false; const p=this.player; p.passives.push(id); p.ppoints--; this.recalc(); return true; }
  respecCost(){ return 20+this.player.lvl*6; }
  respec(){ const p=this.player; const c=this.respecCost(); if(p.dust<c) return false; p.dust-=c; p.ppoints+=p.passives.length-1; p.passives=['c']; this.recalc(); return true; }
  // ================= turn processing =================
  endTurn(){
    const p=this.player; this.turn++;
    if(this.extraTurn){ this.extraTurn=false; this.updateFOV(); this.ui?.refresh?.(); return true; }
    const inCombat=this.monsters.some(m=>m.hp>0&&m.aware&&dist(m.x,m.y,p.x,p.y)<=10)||this.turn-(this.lastHit||-99)<4;
    p.hp=Math.min(p.stats.life,p.hp+p.stats.regen+(inCombat?0:p.stats.life*0.02)); p.mp=Math.min(p.stats.mana,p.mp+p.stats.manaRegen+(inCombat?0:p.stats.mana*0.03));
    for(const k in p.cds) if(p.cds[k]>0) p.cds[k]--;
    if(p.stats.esMax&&this.turn-(this.lastHit||-99)>=2) p.es=Math.min(p.stats.esMax,(p.es||0)+p.stats.esMax*0.25);
    if(p.stats.ks.has('plaguebody')&&!p.stats.ks.has('chitin')) p.hp=Math.max(1,p.hp-p.stats.life*0.01);
    let changed=false; p.buffs=p.buffs.filter(b=>{ b.turns--; if(b.turns<=0) changed=true; return b.turns>0; }); if(changed) this.recalc();
    for(const k of ['poison','burn','bleed']){ const s=p.status[k]; if(s){ this.hurtPlayer(s.dmg,k==='bleed'?null:k==='burn'?'fire':'poison',null,k==='poison'?'jed':k==='burn'?'oheň':'krvácení',true); if(--s.turns<=0) delete p.status[k]; } }
    for(const k of ['root','slow']) if(p.status[k]&&--p.status[k]<=0) delete p.status[k];
    if(p.hp<=0) return true;
    this.tickHazards(); if(p.hp<=0) return true;
    // player effects on world
    if(p.stats.uniques.has('drowned_lantern')){ const st=p.stats, rr=Math.max(2,st.torch*0.6), ch=25+st.burnCh, dmg=(st.spellBase*0.3+st.fire*0.8)*(1+(st.elemPct+st.spell*0.5)/100)*(1+st.dot/100);
      for(const m of this.monsters) if(m.hp>0&&this.canSee(m)&&edist(m.x,m.y,p.x,p.y)<=rr&&rng.next()*100<ch){ this.addAil(m,'burn',dmg*(1-(m.res.fire||0)/100),2); } }
    for(const z of this.fx.filter(f=>f.type==='poisonzone')){ for(const m of this.monsters) if(m.hp>0&&dist(m.x,m.y,z.x,z.y)<=z.r) this.applyPoison(m,z.dmg,2); if(--z.turns<=0) z.life=0; }
    for(const mn of this.fx.filter(f=>f.type==='pmine')){ if(--mn.turns<0){ mn.life=0; this.fx.push({type:'ring',x:mn.x,y:mn.y,r:1,life:0.35,max:0.35,c:[0.6,1,0.3]}); for(const m of this.monsters) if(m.hp>0&&dist(m.x,m.y,mn.x,mn.y)<=1) this.hitMonster(m,this.weaponHit(0.6),{sups:new Set(),tags:[],skill:'mine'}); } }
    for(const z of this.fx.filter(f=>f.type==='arrowzone')){ const c=this.ctx(z.skill); for(const m of this.monsters) if(m.hp>0&&dist(m.x,m.y,z.x,z.y)<=z.r) this.hitMonster(m,this.weaponHit(z.mult),c); if(--z.turns<=0) z.life=0; }
    this.tickMinions();
    this.updateFOV(); this.tickStorm(); this.tickCursed(); this.tickPillar(); this.tickPlates();
    // monsters
    for(const m of this.monsters.slice()){
      if(m.hp<=0) continue;
      this.tickMonsterDots(m); if(m.hp<=0) continue;
      if(m.regen&&m.hp<m.maxhp) m.hp=Math.min(m.maxhp,m.hp+m.maxhp*m.regen);
      if(m.status.stun){ m.status.stun--; if(m.status.stun<=0) delete m.status.stun; continue; }
      m.energy+=m.spd; let acts=0;
      while(m.energy>=100&&acts<2&&m.hp>0&&p.hp>0){ m.energy-=100; acts++; this.monsterAct(m); }
      if(m.status.root&&--m.status.root<=0) delete m.status.root;
    }
    if(this.monsters.some(m=>m.light)) this.invalidateLightMon();
    this.ui?.refresh?.(); if(this.turn%25===0) this.save();
    return true;
  }
  tickMonsterDots(m){ const st=this.player.stats; let tot=0; if(m.status.hex&&--m.status.hex<=0) delete m.status.hex;
    if(m.status.poison){ const P=m.status.poison; let d=0; for(const s of P){ d+=s.d; s.t--; } m.status.poison=P.filter(s=>s.t>0); if(!m.status.poison.length) delete m.status.poison; if(d>0){ tot+=d; this.float(m.x,m.y,fmt(d)+(P.length>1?` ×${P.length}`:''),'#8fd45a',0.8); } }
    for(const k of ['burn','bleed']){ const s=m.status[k]; if(s){ tot+=s.dmg; this.float(m.x,m.y,fmt(s.dmg),k==='burn'?'#ff9c4a':'#d44',0.8); if(--s.turns<=0) delete m.status[k]; } }
    if(tot>0){ m.hp-=tot; if(st.uniques.has('devour_root')&&st.leech) this.healPlayer(tot*(st.leech+5)/100,true); if(m.hp<=0) this.killMonster(m); } }
  invalidateLightMon(){ for(const k of [...this.lightCache.keys()]) if(k[0]==='m') this.lightCache.delete(k); }
  // ================= monster AI =================
  monTarget(m){ const p=this.player; if(!this.minions.length) return p; let best=p, bd=dist(m.x,m.y,p.x,p.y)+0.5;
    for(const mn of this.minions){ if(mn.hp<=0) continue; const d=dist(m.x,m.y,mn.x,mn.y)-(mn.taunt&&dist(m.x,m.y,mn.x,mn.y)<=4?3:0); if(d<bd){ bd=d; best=mn; } } return best; }
  monsterAct(m){
    const pl=this.player; const dP=dist(m.x,m.y,pl.x,pl.y); const seen=this.isVis(m.x,m.y)&&dP<=9;
    if(m.tele) return this.resolveTele(m);
    if(m.ai==='nest') return this.nestAct(m,dP);
    if(m.ai==='thief') return this.thiefAct(m,dP);
    if(!m.aware&&this.minions.some(mn=>dist(mn.x,mn.y,m.x,m.y)<=2)) m.aware=true;
    if(!m.aware){ if(seen&&(this.lightLevel(m.x,m.y)>0.3||dP<=4)){ m.aware=true; if(this.canSee(m)){ this.float(m.x,m.y,'!','#ff5a4a',1.3); this.snd('alert',m.x,m.y); } this.alertPack(m); } else { if(rng.chance(0.2)&&m.ai!=='mine') this.stepRandom(m); return; } }
    const p=m.boss?pl:this.monTarget(m); const d=dist(m.x,m.y,p.x,p.y);
    const sight=los(m.x,m.y,p.x,p.y,this.oc);
    m.cd=Math.max(0,(m.cd||0)-1);
    if(m.mods.includes('summoner')&&m.cd<=0&&rng.chance(0.3)){ const n=this.freeNear(m.x,m.y); if(n){ const a=this.addMonster(MONSTERS.find(x=>x.id==='blob'),n[0],n[1]); a.aware=true; m.cd=3; return; } }
    if(m.mods.includes('blinker')&&m.cd<=0&&d>2&&rng.chance(0.35)){ const n=this.freeNear(p.x,p.y); if(n){ this.burst(m.x,m.y,[0.7,0.5,1],10,60); m.x=m.rx=n[0]; m.y=m.ry=n[1]; m.cd=3; return; } }
    if(m.ai==='boss') return this.bossAct(m,d,sight);
    if(m.ai==='mine'){ if(d<=1){ this.telegraph(m,this.area(m.x,m.y,1),'mine',1.6); } return; }
    if(m.ai==='burster'&&d<=1){ this.telegraph(m,this.area(m.x,m.y,1),'burst',1.5); return; }
    if(m.ai==='healer'&&m.cd<=0){ const w=this.monsters.filter(o=>o!==m&&o.hp>0&&o.hp<o.maxhp*0.7&&dist(o.x,o.y,m.x,m.y)<=5).sort((a,b)=>a.hp/a.maxhp-b.hp/b.maxhp)[0];
      if(w){ const h=w.maxhp*0.25; w.hp=Math.min(w.maxhp,w.hp+h); this.proj(m.x,m.y,w.x,w.y,[0.5,1,0.5]); if(this.canSee(w)) this.float(w.x,w.y,'+'+fmt(h),'#7f7'); m.cd=3; return; } }
    if(m.ai==='charger'&&m.cd<=0&&d>=2&&d<=5&&sight&&(m.x===p.x||m.y===p.y||Math.abs(m.x-p.x)===Math.abs(m.y-p.y))){ const dx=Math.sign(p.x-m.x), dy=Math.sign(p.y-m.y); const tiles=[]; let x=m.x,y=m.y; for(let i=0;i<6;i++){ x+=dx; y+=dy; if(!this.passable(x,y)) break; tiles.push([x,y]); } if(tiles.length){ this.telegraph(m,tiles,'charge',1.6,{dir:[dx,dy]}); m.cd=4; return; } }
    if((m.ai==='ranged'||m.ai==='caster'||m.ai==='healer')&&sight&&d<=6&&d>1&&(m.ai==='ranged'||m.cd<=0)){
      if(m.def.puddle&&rng.chance(0.5)&&!p.ally){ this.telegraph(m,this.area(p.x,p.y,1),'puddle',1.1); m.cd=3; return; }
      this.proj(m.x,m.y,p.x,p.y,m.el==='decay'?[0.8,0.4,1]:m.el==='poison'?[0.6,1,0.3]:m.el==='fire'?[1,0.5,0.2]:[1,0.9,0.7],m.ai==='ranged'&&!m.el?'arrow':null);
      this.monHit(m,m.ai==='ranged'?0.85:1.15,m.ai!=='ranged'||m.el?m.el||'decay':null,p);
      if(m.ai!=='ranged') m.cd=2;
      if(d<3&&rng.chance(0.5)) this.stepAway(m); return; }
    if(m.ai==='lasher'&&d<=2&&sight&&!(d===2&&!this.monReach(m))){ this.lunge(m,p); this.monHit(m,1,m.el,p); return; }
    if(d<=1&&!(m.x!==p.x&&m.y!==p.y&&!this.passable(p.x,m.y)&&!this.passable(m.x,p.y))){ this.lunge(m,p); this.monHit(m,1,m.el&&rng.chance(0.6)?m.el:null,p); return; }
    if(m.status.root) return;
    if(m.ai==='lasher'&&rng.chance(0.5)) return;
    this.stepToward(m,p.x,p.y);
  }
  monReach(m){ return true; }
  alertPack(m){ for(const o of this.monsters) if(o!==m&&!o.aware&&dist(o.x,o.y,m.x,m.y)<=4) o.aware=true; }
  monHit(m,mult,el,tgt){ const p=this.player; let dm=rng.range(m.dmg[0],m.dmg[1])*mult; if(m.mods.includes('berserk')&&m.hp<m.maxhp*0.5) dm*=1.5; if(m.enraged) dm*=1.25;
    if(tgt&&tgt.ally){ this.hurtMinion(tgt,dm,el); if(m.mods.includes('vampiric')) m.hp=Math.min(m.maxhp,m.hp+dm*0.3); return; }
    const dealt=this.hurtPlayer(dm,el,m,m.name); if(m.addEl&&dealt>=0) this.hurtPlayer(dm*m.addEl,m.mods.includes('fireench')?'fire':'decay',m,m.name,true);
    if(m.el==='poison'&&dealt>0&&rng.chance(0.35)) this.addStatusP('poison',dm*0.25,3);
    if(m.el==='fire'&&dealt>0&&rng.chance(0.25)) this.addStatusP('burn',dm*0.3,2);
    if(m.mods.includes('vampiric')&&dealt>0) m.hp=Math.min(m.maxhp,m.hp+dealt*0.6); }
  area(x,y,r){ const t=[]; for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(this.tile(x+dx,y+dy)===FLOOR) t.push([x+dx,y+dy]); return t; }
  ring(x,y,r0,r1){ const t=[]; for(let dy=-r1;dy<=r1;dy++) for(let dx=-r1;dx<=r1;dx++){ const d=Math.max(Math.abs(dx),Math.abs(dy)); if(d>=r0&&d<=r1&&this.tile(x+dx,y+dy)===FLOOR&&los(x,y,x+dx,y+dy,this.oc)) t.push([x+dx,y+dy]); } return t; }
  telegraph(m,tiles,kind,mult,extra={}){ m.tele={tiles,kind,mult,...extra}; if(tiles.some(([x,y])=>this.isVis(x,y))) this.snd('warn',m.x,m.y); this.face(m,this.player.x); if(this.canSee(m)||tiles.some(([x,y])=>this.isVis(x,y))){ const n={slam:'se napřahuje',charge:'se chystá k výpadu',nova:'nasává výtrusy',spit:'plive',puddle:'kouzlí',mine:'tiká',burst:'nafukuje se'}[kind]; if(n&&(m.boss||m.rarity!=='normal')) this.log(`${m.name} ${n}!`,'warn'); } }
  resolveTele(m){ const p=this.player, t=m.tele; m.tele=null; if(t.kind==='slam'||t.kind==='nova'||t.kind==='charge') this.snd('slam',m.x,m.y); else if(t.kind==='mine'||t.kind==='burst') this.snd('puffbomb',m.x,m.y); const hit=t.tiles.some(([x,y])=>x===p.x&&y===p.y);
    const el=t.kind==='puddle'||t.kind==='spit'?(m.el||'poison'):t.kind==='mine'?'poison':t.kind==='burst'?(m.el||'poison'):m.el;
    this.fx.push({type:'slam',tiles:t.tiles,life:0.4,max:0.4,c:el==='fire'?[1,0.45,0.1]:el==='poison'?[0.6,1,0.3]:el==='decay'?[0.8,0.4,1]:[1,0.4,0.15]});
    if(t.kind==='charge'){ let last=[m.x,m.y]; for(const [x,y] of t.tiles){ if(x===p.x&&y===p.y) break; if(!this.passable(x,y)||this.monAt(x,y)) break; last=[x,y]; } m.x=last[0]; m.y=last[1]; this.shake=Math.max(this.shake,6); }
    if(t.kind==='puddle'||t.kind==='spit'){ this.addHazard(t.tiles[Math.floor(t.tiles.length/2)][0],t.tiles[Math.floor(t.tiles.length/2)][1],1,el,rng.range(m.dmg[0],m.dmg[1])*0.45,0,3,m.name); }
    if(hit) this.monHit(m,t.mult,el);
    for(const mn of this.minions.slice()) if(mn.hp>0&&t.tiles.some(([x,y])=>x===mn.x&&y===mn.y)) this.monHit(m,t.mult,el,mn);
    if(t.kind==='mine'||t.kind==='burst'){ this.flashLight(m.x,m.y,[0.6,1,0.3],3); m.hp=0; this.killMonster(m); }
    if(m.boss) this.shake=Math.max(this.shake,10); }
  nestAct(m,d){ if(d>10) return; m.cd=(m.cd||0)-1; if(m.cd>0) return; m.cd=4; const pool=MONSTERS.filter(x=>this.depth>=x.d[0]&&this.depth<=x.d[1]&&x.ai!=='mine');
    for(let k=0;k<2;k++){ const n=this.freeNear(m.x,m.y); if(n){ const a=this.addMonster(rng.pick(pool),n[0],n[1]); a.aware=true; a.xp*=0.3; this.burst(n[0],n[1],[0.6,1,0.3],8,50); } } }
  addStatusP(k,dmg,turns){ const p=this.player; const ks=p.stats.ks; if((k==='poison'||k==='bleed')&&ks.has('chitin')) return; if(k==='poison'&&ks.has('plaguebody')) return; const res=k==='poison'?p.stats.resPoison:k==='burn'?p.stats.resFire:0; dmg*=1-res/100; const s=p.status[k]; if(s){ s.dmg=Math.max(s.dmg,dmg); s.turns=Math.max(s.turns,turns); } else p.status[k]={dmg,turns}; }
  bossAct(m,d,sight){
    const p=this.player;
    if(!m.enraged&&m.hp<m.maxhp*0.5){ m.enraged=true; m.spd*=1.3; this.snd('roar',m.x,m.y); this.log(`${m.name} zuří! Výtrusy vře krev.`,'warn'); this.ui?.banner?.(m.name+' zuří!','Druhá fáze'); this.shake=14; this.bossSummon(m,3); m.cd=1; return; }
    if(m.cd<=0&&d<=7&&sight){ const pat=m.patterns[m.patI++%m.patterns.length];
      if(pat==='slam'&&d<=3){ this.telegraph(m,this.area(p.x,p.y,1),'slam',2.2); m.cd=2; return; }
      if(pat==='charge'&&d>=2){ const dx=Math.sign(p.x-m.x), dy=Math.sign(p.y-m.y); const tiles=[]; let x=m.x,y=m.y; for(let i=0;i<8;i++){ x+=dx; y+=dy; if(!this.passable(x,y)) break; tiles.push([x,y]); for(const [ox,oy] of [[dy,dx],[-dy,-dx]]) if(this.passable(x+ox,y+oy)&&(dx===0||dy===0)) tiles.push([x+ox,y+oy]); } if(tiles.length){ this.telegraph(m,tiles,'charge',2.0); m.cd=2; return; } }
      if(pat==='nova'){ this.telegraph(m,this.ring(m.x,m.y,1,m.enraged?3:2),'nova',1.7); m.cd=2; return; }
      if(pat==='spit'){ const tiles=[]; for(let k=0;k<(m.enraged?4:3);k++){ const x=p.x+rng.int(-2,2), y=p.y+rng.int(-2,2); tiles.push(...this.area(x,y,1)); } if(!tiles.some(([x,y])=>x===p.x&&y===p.y)) tiles.push(...this.area(p.x,p.y,0)); this.telegraph(m,tiles,'spit',1.3); m.cd=2; return; }
      if(pat==='summon'){ this.bossSummon(m,m.enraged?3:2); m.cd=3; return; } }
    if(d<=1){ this.lunge(m,p); this.monHit(m,1,m.el); return; } this.stepToward(m,p.x,p.y);
  }
  bossSummon(m,n){ const def=MONSTERS.find(x=>x.id===m.def.adds)||MONSTERS[1]; for(let k=0;k<n;k++){ const pos=this.freeNear(m.x,m.y); if(pos){ const a=this.addMonster(def,pos[0],pos[1]); a.aware=true; a.xp*=0.4; this.burst(pos[0],pos[1],[0.6,1,0.3],8,50); } } this.log(`${m.name} povolává posily!`,'warn'); }
  mPass(x,y,m){ return this.passable(x,y)&&!this.monAt(x,y)&&!this.minAt(x,y)&&!(x===this.player.x&&y===this.player.y); }
  stepToward(m,tx,ty){
    let best=null, bd=1e9; const cur=edist(m.x,m.y,tx,ty);
    for(const [dx,dy] of DIRS8){ const nx=m.x+dx, ny=m.y+dy; if(!this.mPass(nx,ny,m)) continue; if(dx&&dy&&(!this.passable(m.x+dx,m.y)||!this.passable(m.x,m.y+dy))) continue; const dd=edist(nx,ny,tx,ty); if(dd<bd){ bd=dd; best=[nx,ny]; } }
    if(!best||bd>=cur){ const path=astar(m.x,m.y,tx,ty,this.map.W,this.map.H,(x,y)=>this.passable(x,y)&&!this.monAt(x,y)&&!this.minAt(x,y),600); if(path&&path.length>1&&this.mPass(path[0][0],path[0][1],m)) best=path[0]; else if(!best||bd>=cur+0.5) return; }
    if(best[0]!==m.x) m.flip=best[0]<m.x; m.x=best[0]; m.y=best[1];
  }
  stepAway(m){ const p=this.player; let best=null,bd=edist(m.x,m.y,p.x,p.y); for(const [dx,dy] of DIRS8){ const nx=m.x+dx, ny=m.y+dy; if(!this.mPass(nx,ny,m)) continue; const dd=edist(nx,ny,p.x,p.y); if(dd>bd){bd=dd;best=[nx,ny];} } if(best){ m.x=best[0]; m.y=best[1]; } }
  stepRandom(m){ const [dx,dy]=rng.pick(DIRS8); if(this.mPass(m.x+dx,m.y+dy,m)&&this.map.room[(m.y+dy)*this.map.W+m.x+dx]===this.map.room[m.y*this.map.W+m.x]){ m.x+=dx; m.y+=dy; } }
  // ================= click handling =================
  clickTile(x,y){
    const p=this.player; if(!this.canAct()) return false; this.face(p,x);
    const m=this.monAt(x,y);
    if(m&&this.canSee(m)){ const dd=dist(m.x,m.y,p.x,p.y);
      if(dd<=1) return this.tryMove(m.x-p.x,m.y-p.y);
      if(dd<=1+(p.stats.reach||0)&&los(p.x,p.y,m.x,m.y,this.oc)){ this.basicAttack(m); return this.endTurn(); }
      if(this.canShoot(m)) return this.rangedAttack(m); }
    if(x===p.x&&y===p.y){ const st=this.map.stairs; if(st.x===x&&st.y===y) return this.descend(); return this.wait(); }
    const pr=this.blockProp(x,y); if(pr&&dist(x,y,p.x,p.y)<=1){ if(this.interact(pr)) return this.endTurn(); return false; }
    if(!this.explored[y*this.map.W+x]) return false;
    const path=astar(p.x,p.y,x,y,this.map.W,this.map.H,(a,b)=>this.passable(a,b)&&this.explored[b*this.map.W+a],5000);
    if(path&&path.length){ if(pr&&path.length) path.pop(); p.path=path; p.pathTarget=pr?[x,y]:null; }
    return false;
  }
  visibleEnemies(){ return this.monsters.filter(m=>m.hp>0&&this.canSee(m)&&m.aware); }
  stepPath(){
    const p=this.player; if(!p.path||!p.path.length){ if(p.pathTarget){ const [x,y]=p.pathTarget; p.pathTarget=null; const pr=this.blockProp(x,y); if(pr&&dist(x,y,p.x,p.y)<=1&&this.interact(pr)) this.endTurn(); } p.path=null; return; }
    const before=this.visibleEnemies().length;
    const [nx,ny]=p.path.shift(); if(this.monAt(nx,ny)){ p.path=null; return; }
    this.tryMove(nx-p.x,ny-p.y);
    if(this.visibleEnemies().length>before||(p.hp<p.stats.life*0.3&&before)||this.hazards.some(h=>h.tiles.some(([a,b])=>a===p.x&&b===p.y))) p.path=null;
  }
}
