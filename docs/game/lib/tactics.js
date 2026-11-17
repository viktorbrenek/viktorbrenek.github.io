// S2: taktická monstra a sezónní téma „Padlí z jádra“ (nakažení andělé z jádra mycelia).
// Hooky: addMonster → tacticAssign, monsterAct → tacticAct, damageMonster → tacticDamage,
// killMonster → tacticKill, resolveTele → tacticResolve, endTurn → tickCoreRift.
import {monstersFor} from './data.js';
import {rng,dist,edist,DIRS8,fmt} from './util.js';
import {makeItem} from './items.js';
import {makeCrystal} from './craft.js';
const S2U=['s2_halo','s2_wingblade','s2_corecensor','s2_featherstep','s2_seraphmail','s2_choir'];

// ---------- elitní taktiky (vzácná a jedinečná monstra) ----------
export const TACTICS={
  crush:{name:'Drtitel',tip:'Každé 4 tahy se napřáhne a udeří do čtverce 3×3 kolem tebe. Uhni z vyznačených polí.'},
  ward:{name:'Kořenný štít',tip:'Dokud stojí jeho dvě Kořenné kotvy, nedá se zranit. Znič nejdřív kotvy.'},
  mirror:{name:'Zrcadlící',tip:'Když se rozzáří (každé 2 tahy), odráží 35 % poškození a utrží jen polovinu. Útoč, když nezáří.'},
  shell:{name:'Krunýřník',tip:'Zepředu utrží jen 25 % poškození. Zasáhni ho zezadu, nebo když je omráčený či vyděšený.'},
  link:{name:'Svazek',tip:'Sdílí život se dvěma spojenci – poškození se rozdělí mezi všechny tři.'},
};
const ANCHOR={id:'anchor',name:'Kořenná kotva',spr:'roots',hp:24,dmg:[0,0],arm:2,spd:0,xp:6,ai:'anchor',sc:0.95,tip:'Napájí štít svého pána. Znič ji.',res:{poison:30,fire:-20,decay:20},light:[0.5,0.9,0.4]};

// ---------- Padlí z jádra ----------
export const CORE_ANGELS=[
  {id:'core_cherub',name:'Jádrový cherub',spr:'hero_ranger',wingRig:'ranger',weapon:'dagger_p',hat:'hat_slice12',hp:34,dmg:[8,12],arm:3,spd:125,xp:30,ai:'core',core:'cherub',sc:0.86,el:'decay',res:{decay:40},light:[0.85,0.55,1],tint:[1.12,0.9,1.25],
    tip:'Vyznačí přímku a prolétne jí. Uhni stranou – po náletu je chvíli vyčerpaný a utrží +50 %.'},
  {id:'core_seraph',name:'Výtrusný serafín',spr:'hero_mage',wingRig:'myco',weapon:'staff_crystal',hat:'hat_slice9',hp:48,dmg:[9,14],arm:4,spd:90,xp:38,ai:'caster',core:'seraph',sc:1.05,el:'decay',res:{decay:50,fire:20},light:[0.95,0.7,1],tint:[1.2,1.0,1.3],
    tip:'Posvětí kříž polí kolem tebe. Posvěcená zem pak dva tahy pálí a léčí anděly, kteří v ní stojí.'},
  {id:'core_ophan',name:'Trůn očí',spr:'gazer_big',hp:90,dmg:[11,16],arm:8,spd:70,xp:52,ai:'core',core:'ophan',sc:1.25,el:'decay',res:{decay:60,poison:30},light:[1,0.8,1],tint:[1.25,1.05,1.35],
    tip:'Se zavřenýma očima je nezranitelný a míří paprsky do čtyř směrů. Když oči otevře, střílí – a utrží +50 %. Stůj šikmo.'},
  {id:'core_arch',name:'Archanděl hniloby',spr:'hero_knight',wingRig:'warden',weapon:'sword2',offhand:'shield_leaf',hat:'hat_slice11',hp:240,dmg:[14,22],arm:14,spd:95,xp:240,ai:'core',core:'arch',sc:1.4,el:'decay',res:{decay:60,poison:40,fire:20},light:[1,0.75,1],tint:[1.25,0.95,1.3],
    tip:'Rozsudek: zasáhne vše kolem sebe kromě tří posvěcených polí. Stoupni si na zářící pole. Svolává cheruby.'},
];

const line=(g,x0,y0,dx,dy,n)=>{ const t=[]; let x=x0,y=y0; for(let i=0;i<n;i++){ x+=dx; y+=dy; if(!g.passable(x,y)) break; t.push([x,y]); } return t; };

export const GameTactics={
  tacticAssign(m,{boss}={}){
    if(m.def.core){ m.core=m.def.core; m.tint=m.def.tint; m.phase=rng.int(0,2); m.tcd=rng.int(1,3); return; }
    if(boss||m.def.ai==='anchor'||m.thief||m.nest||m.anchorOf) return;
    if(!(m.rarity==='rare'||m.unique)||(this.depth||1)<5) return;
    if(!rng.chance(this.mapRun?1:0.55)) return;
    const t=rng.pick(Object.keys(TACTICS)); m.tactic=t; m.tcd=rng.int(1,3);
    if(t==='ward') m.pendingAnchors=2;
    if(t==='link') m.pendingLinks=2;
  },
  // spawn anchors / links lazily (addMonster už vrátil monstrum a pozice jsou známé)
  tacticSpawn(m){
    if(m.pendingAnchors){ const n=m.pendingAnchors; m.pendingAnchors=0; m.anchors=[];
      for(let i=0;i<n;i++){ const pos=this.freeNear(m.x+rng.int(-2,2),m.y+rng.int(-2,2))||this.freeNear(m.x,m.y); if(!pos) continue; const a=this.addMonster(ANCHOR,pos[0],pos[1]); a.anchorOf=m; a.aware=true; m.anchors.push(a); } }
    if(m.pendingLinks){ const n=m.pendingLinks; m.pendingLinks=0; m.links=[]; const pool=monstersFor(this.depth).filter(x=>x.ai!=='mine');
      for(let i=0;i<n;i++){ const pos=this.freeNear(m.x,m.y); if(!pos) continue; const o=this.addMonster(rng.pick(pool),pos[0],pos[1],{rarity:'magic',mods:['huge']}); o.links=[m]; o.linkTint=true; m.links.push(o); }
      for(const o of m.links) o.links=[m,...m.links.filter(x=>x!==o)]; }
  },
  tacticAct(m){
    const p=this.player, d=dist(m.x,m.y,p.x,p.y);
    if(m.pendingAnchors||m.pendingLinks) this.tacticSpawn(m);
    if(m.def.ai==='anchor') return true;
    if(m.exhaust>this.turn){ if(this.canSee(m)&&rng.chance(0.4)) this.float(m.x,m.y,'vyčerpaný','#c9a0ff',0.7); return true; }
    if(m.tactic==='mirror'){ const on=(this.turn%4)<2; if(on&&!m.mirrorOn&&this.canSee(m)) this.float(m.x,m.y,'zrcadlí!','#c9a0ff',0.9); m.mirrorOn=on; }
    if(!m.aware) return false;
    m.tcd=(m.tcd||0)-1;
    if(m.tactic==='crush'&&d<=2&&m.tcd<=0){ this.telegraph(m,this.area(p.x,p.y,1),'crush',2.0); m.tcd=4; return true; }
    if(!m.core) return false;
    const sight=this.canSee(m);
    if(m.core==='cherub'&&m.tcd<=0&&d>=2&&d<=5&&(m.x===p.x||m.y===p.y||Math.abs(m.x-p.x)===Math.abs(m.y-p.y))){
      const dx=Math.sign(p.x-m.x), dy=Math.sign(p.y-m.y); const path=line(this,m.x,m.y,dx,dy,6); if(path.length>=2){ this.telegraph(m,path,'dive',1.7,{path}); m.tcd=4; return true; } }
    if(m.core==='seraph'&&m.tcd<=0&&d<=5&&sight){ const tiles=this.cross(p.x,p.y,1).concat(this.area(p.x,p.y,0)); this.telegraph(m,tiles,'sanct',1.2,{cx:p.x,cy:p.y}); m.tcd=5; return true; }
    if(m.core==='ophan'){ m.phase=((m.phase||0)+1)%3; m.closed=m.phase!==2;
      if(m.phase===1&&d<=7){ const tiles=[]; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) tiles.push(...line(this,m.x,m.y,dx,dy,7)); if(tiles.length) this.telegraph(m,tiles,'gaze',1.6); return true; }
      if(m.closed){ if(rng.chance(0.3)) this.stepToward(m,p.x,p.y); return true; }
      return true; }
    if(m.core==='arch'){
      if(m.tcd<=0&&d<=3){ const area=this.area(m.x,m.y,3).filter(([x,y])=>this.passable(x,y)||(x===p.x&&y===p.y)); const near=area.filter(([x,y])=>dist(x,y,p.x,p.y)<=2&&!(x===p.x&&y===p.y)); const safe=rng.shuffle(near.slice()).slice(0,3);
        const tiles=area.filter(([x,y])=>!safe.some(([sx,sy])=>sx===x&&sy===y)); m.safe=safe; this.telegraph(m,tiles,'judge',2.4); for(const [x,y] of safe) this.fx.push({type:'ring',x,y,r:0.45,life:1.2,max:1.2,c:[1,0.95,0.6]}); m.tcd=5; return true; }
      if((m.scd=(m.scd||0)-1)<=0&&sight){ m.scd=8; for(let i=0;i<2;i++){ const pos=this.freeNear(m.x,m.y); if(pos){ const c=this.addMonster(CORE_ANGELS[0],pos[0],pos[1]); c.aware=true; this.burst(pos[0],pos[1],[0.9,0.6,1],10,60); } } this.log(`${m.name} svolává cheruby!`,'warn'); return true; } }
    return false;
  },
  tacticDamage(m,dmg){
    if(dmg<=0) return dmg; const p=this.player;
    if(m.anchors?.some(a=>a.hp>0)){ if(this.canSee(m)&&rng.chance(0.35)) this.float(m.x,m.y,'štít','#9df07a',0.8); return 0; }
    if(m.core==='ophan'){ if(m.closed){ if(rng.chance(0.4)) this.float(m.x,m.y,'oči zavřené','#c9a0ff',0.8); return 0; } dmg*=1.5; }
    if(m.exhaust>this.turn) dmg*=1.5;
    if(m.tactic==='shell'&&!(m.status.stun||m.status.fear)){ const face=m.flip?-1:1; const behind=(p.x-m.x)*face<0; if(!behind){ if(rng.chance(0.3)) this.float(m.x,m.y,'krunýř','#d9c38c',0.8); dmg*=0.25; } }
    if(m.tactic==='mirror'&&m.mirrorOn){ dmg*=0.5; this.reflectToPlayer(dmg*0.7,m.name+' (zrcadlo)'); }
    if(m.links){ const alive=m.links.filter(o=>o.hp>0&&o!==m); if(alive.length){ const share=dmg/(alive.length+1); for(const o of alive){ o.hp-=share; o.flash=0.12; if(o.hp<=0) this._linkDead=(this._linkDead||[]).concat(o); } dmg=share; } }
    return dmg;
  },
  reflectToPlayer(v,src){ const p=this.player, L=p.stats.life; if(this._reflT!==this.turn){ this._reflT=this.turn; this._refl=0; } let d=Math.min(v,Math.max(0,L*0.2-this._refl)); d=Math.min(d,Math.max(0,p.hp+(p.es||0)-1)); if(d>0){ this._refl+=d; this.hurtPlayer(d,null,null,src,true); } },
  tacticAfterHit(){ const dead=this._linkDead; if(!dead) return; this._linkDead=null; for(const o of dead) if(this.monsters.includes(o)&&o.hp<=0) this.killMonster(o); },
  tacticKill(m){
    this.egKill?.(m);
    if(m.fallen){ const p=this.player; p.feathers=(p.feathers||0)+2; const gr=Math.min(5,Math.max(2,Math.ceil(this.scalingDepth()/15)+1)); for(let i=0;i<2;i++){ const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:makeCrystal(rng.pick(['life','war','mind']),gr)}); } this.log('Padlý serafín dotlel. Zůstala po něm 2 andělská pírka a krystaly.','loot:set'); }
    if(m.anchorOf){ const M=m.anchorOf; if(M.hp>0&&!M.anchors?.some(a=>a!==m&&a.hp>0)){ this.log(`${M.name}: Kořenný štít padl!`,'good'); this.float(M.x,M.y,'štít padl','#9df07a',1.1); this.burst(M.x,M.y,[0.5,1,0.4],18,90); } }
    if(m.core==='arch'){ if(this.coreRun) this.coreRun.archDown=true; if(rng.chance(0.2)){ const ids=['s2_halo','s2_wingblade','s2_corecensor','s2_featherstep','s2_seraphmail','s2_choir']; const it=makeItem(Math.min(this.scalingDepth(),60),{uniqueId:rng.pick(ids)}); const pos=this.scatter(m.x,m.y); this.ground.push({x:pos[0],y:pos[1],item:it}); this.log('✦ '+it.name+' leží na zemi!','loot:legendary'); } }
  },
  tacticResolve(m,t){
    if(t.kind==='dive') m.anim={k:'dive',t:0,dur:0.32};
    if(t.kind==='sanct'||t.kind==='judge') m.anim={k:'cast',t:0,dur:0.5};
    if(t.kind==='dive'){ let last=[m.x,m.y]; for(const [x,y] of t.path||t.tiles){ if(!this.passable(x,y)||this.monAt(x,y)) break; if(x===this.player.x&&y===this.player.y) continue; last=[x,y]; } m.x=last[0]; m.y=last[1]; m.exhaust=this.turn+2; this.burst(m.x,m.y,[0.9,0.6,1],12,80); }
    if(t.kind==='sanct') this.addHazard(t.cx,t.cy,1,'decay',0,0,2,m.name+' (posvěcená zem)',{shape:'cross',look:'storm',pct:0.07,sanct:true});
    if(t.kind==='gaze'){ m.phase=2; m.closed=false; if(this.canSee(m)) this.float(m.x,m.y,'oči otevřené!','#ffd27a',1); }
  },
  // posvěcená zem léčí anděly
  tickSanct(){ for(const h of this.hazards){ if(!h.sanct||h.warn>0) continue; for(const m of this.monsters) if(m.core&&m.hp>0&&m.hp<m.maxhp&&h.tiles.some(([x,y])=>x===m.x&&y===m.y)){ const v=m.maxhp*0.06; m.hp=Math.min(m.maxhp,m.hp+v); if(this.canSee(m)) this.float(m.x,m.y,'+'+fmt(v),'#d9b0ff',0.7); } } },
  tacticTip(m){ const t=m.tactic&&TACTICS[m.tactic]; return t?`<div class="tt-line" style="color:#ffd27a">⚔ ${t.name}: ${t.tip}</div>`:m.anchorOf?'<div class="tt-line" style="color:#9df07a">Napájí štít svého pána.</div>':''; },
  // ---------- sezónní událost: Trhlina jádra ----------
  // ---- Padlý anděl (událost S2) ----
  fallenChoice(pr,c){ const p=this.player; if(pr.state!=='idle') return false; pr.state='done'; delete pr.light; this.invalidateLight();
    if(c==='heal'){ const cost=Math.round(p.hp*0.3); p.hp=Math.max(1,p.hp-cost); this.float(p.x,p.y,'-'+cost,'#ff8a8a',1); p.feathers=(p.feathers||0)+1;
      this.addBuff({id:'grace',name:'Andělská milost',dmgPct:0.2,regenPct:0.01,turns:60});
      p.s2heal=(p.s2heal||0)+1; this.burst(pr.x,pr.y,[1,0.95,0.7],30,120); this.snd('shrine',pr.x,pr.y);
      if(p.s2heal===3){ const it=makeItem(Math.min(this.scalingDepth(),60),{uniqueId:rng.pick(S2U)}); const pos=this.scatter(pr.x,pr.y); this.ground.push({x:pos[0],y:pos[1],item:it}); this.snd('loot_leg');
        this.ui?.loreModal?.('Kronikář Ashvel','„Třikrát jsi podal ruku tomu, co padlo z jádra. Zapíšu tvé jméno vedle královnina.“ Z popela se zvedá dar, který andělé nesli pro Mirun.'); }
      else this.log(`Očistil jsi padlého anděla (${p.s2heal}/3). Andělská milost: +20 % poškození, regenerace, 60 tahů.`,'good');
      this.save(); return true; }
    if(c==='kill'){ const d=CORE_ANGELS[1]; const pos=this.freeNear(pr.x,pr.y); if(!pos) return false; const m=this.addMonster(d,pos[0],pos[1],{rarity:'rare'}); m.name='Padlý serafín'; m.fallen=true; m.unique=true; m.aware=true; m.hp=m.maxhp=m.maxhp*1.5;
      this.log('Anděl se zvedá s očima plnýma hniloby!','warn'); this.burst(pr.x,pr.y,[0.85,0.4,1],24,100); return true; }
    return false; },
  startCoreRift(pr){ pr.state='active'; this.coreRun={pr,wave:0,timer:0,mons:[],waves:3}; this.snd('curse'); this.log('Trhlina jádra se otevírá! Sestupují andělé. Přežij 3 vlny a poraz Archanděla.','warn'); this.ui?.banner?.('Trhlina jádra','Vlna 1 / 3'); this.nextCoreWave(); },
  nextCoreWave(){ const r=this.coreRun; r.wave++; r.timer=0; r.mons=[]; const n=2+r.wave*2;
    const pick=()=>r.wave===1?rng.pick([CORE_ANGELS[0],CORE_ANGELS[0],CORE_ANGELS[1]]):r.wave===2?rng.pick([CORE_ANGELS[0],CORE_ANGELS[1],CORE_ANGELS[1],CORE_ANGELS[2]]):rng.pick(CORE_ANGELS.slice(0,3));
    const spawn=(def,opt={})=>{ const ang=rng.next()*6.28, rr=rng.int(2,4); const pos=this.freeNear(Math.round(r.pr.x+Math.cos(ang)*rr),Math.round(r.pr.y+Math.sin(ang)*rr))||this.freeNear(r.pr.x,r.pr.y); if(!pos) return null; const m=this.addMonster(def,pos[0],pos[1],opt); m.aware=true; m.energy=0; r.mons.push(m); this.burst(pos[0],pos[1],[0.9,0.65,1],12,80); return m; };
    for(let k=0;k<n;k++) spawn(pick(),rng.chance(0.12*r.wave)?{rarity:'magic',mods:['swift']}:{});
    if(r.wave===r.waves){ const a=spawn(CORE_ANGELS[3]); if(a){ a.unique=true; a.name='Archanděl hniloby'; } }
    this.flashLight(r.pr.x,r.pr.y,[0.9,0.6,1],7,0.9); if(r.wave>1){ this.ui?.banner?.('Trhlina jádra',`Vlna ${r.wave} / ${r.waves}`); this.snd('ambush'); } },
  tickCoreRift(){ this.tickSanct(); const r=this.coreRun; if(!r||r.done) return; r.timer++; const alive=r.mons.filter(m=>m.hp>0).length;
    if(alive===0||r.timer>14&&r.wave<r.waves){ if(r.wave<r.waves) this.nextCoreWave(); else if(alive===0){ r.done=true; r.pr.state='done'; r.pr.light=[0.35,0.3,0.4]; this.invalidateLight();
      const p=this.player, f=1+(this.depth>=30?1:0)+(this.mapRun?1:0); p.feathers=(p.feathers||0)+f; this.snd('loot_leg'); this.ui?.banner?.('Trhlina zavřena',`+${f} andělské pero`);
      this.log(`Trhlina jádra zavřena. +${f} andělské pero (vyměníš je u Oltáře v Receptech).`,'loot:set');
      for(let i=0;i<2;i++) this.dropItem(r.pr.x,r.pr.y,{boost:1.2,rarity:i===0?'rare':undefined}); for(let i=0;i<2;i++) this.craftDrops?.({x:r.pr.x,y:r.pr.y,boss:true}); } } },
  // za pera: sezónní unikát
  featherCost(){ return 6; },
  buyFeatherUnique(){ const p=this.player; if((p.feathers||0)<this.featherCost()) return null; if(p.inv.length>=30){ this.log('Inventář je plný!','warn'); return null; } p.feathers-=this.featherCost();
    const ids=['s2_halo','s2_wingblade','s2_corecensor','s2_featherstep','s2_seraphmail','s2_choir']; const it=makeItem(Math.min(this.scalingDepth(),60),{uniqueId:rng.pick(ids)}); p.inv.push(it); this.snd('loot_leg'); this.save(); return it; },
};
