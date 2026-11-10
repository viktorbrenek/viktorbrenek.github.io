import {Renderer} from './gl.js';
import {Game,T} from './game.js';
import {UI} from './ui.js';
import {SceneRenderer} from './render.js';
import {tooltipHTML} from './items.js';
import {audio} from './audio.js';
import {drawMap} from './mapov.js';

const loadImg=src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; });
async function boot(){
  const [img,meta]=await Promise.all([loadImg('assets/atlas.webp'),fetch('assets/atlas.json').then(r=>r.json())]);
  const canvas=document.getElementById('gl'), over=document.getElementById('over');
  let R; try{ R=new Renderer(canvas,img,meta); }catch(e){ document.getElementById('loading').textContent='Tvůj prohlížeč nepodporuje WebGL2: '+e.message; return; }
  const scene=new SceneRenderer(R,over); const ui=new UI(img,meta); const g=new Game(null);
  window.SPORIUM={g,ui,scene};
  const mapCv=document.createElement('canvas'); mapCv.id='mapov'; document.body.appendChild(mapCv);
  document.getElementById('loading').remove();
  let started=false;
  const unlock=()=>audio.init(); addEventListener('pointerdown',unlock); addEventListener('keydown',unlock);
  const start=o=>{ if(o.cls){ g.newCharacter(o.cls,{daily:o.daily}); if(o.nick){ g.player.nick=o.nick; g.save(); g.lbSync(true); } } else if(!g.load(o.id)) g.newCharacter('blade'); ui.bind(g); started=true; if(!o.cls&&!g.daily) ui.askNickOnce(); if(o.cls&&!g.daily) ui.introModal(g.player.cls); };
  ui.toTitleFn=()=>toTitle();
  const toTitle=()=>{ document.body.classList.remove('mapon'); started=false; g.map=null; ui.title(start); };
  ui.title(start);
  // ---- input: layout-independent (e.code), held keys for smooth movement ----
  const MOVE={KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],
    Numpad8:[0,-1],Numpad2:[0,1],Numpad4:[-1,0],Numpad6:[1,0],Numpad7:[-1,-1],Numpad9:[1,-1],Numpad1:[-1,1],Numpad3:[1,1]};
  const held=new Set(); let moveT=0, firstStep=false;
  const heldDir=()=>{ let dx=0,dy=0; for(const c of held){ const d=MOVE[c]; if(d){ dx+=d[0]; dy+=d[1]; } } return [Math.sign(dx),Math.sign(dy)]; };
  const doMove=()=>{ const [dx,dy]=heldDir(); if(!dx&&!dy) return false; if(!g.canAct()) return false;
    g.player.path=null; g.targeting=null; if(dx) g.player.flip=dx<0; if(g.tryMove(dx,dy)) return true;
    // slide along walls when diagonal blocked
    if(dx&&dy){ if(g.tryMove(dx,0)) return true; if(g.tryMove(0,dy)) return true; } return false; };
  addEventListener('keydown',e=>{ if(e.key==='Alt'){ g.altHeld=true; e.preventDefault(); }
    if(!started) return; const c=e.code;
    if(c==='Escape'&&document.body.classList.contains('mapon')){ document.body.classList.remove('mapon'); return; }
    if(c==='Escape'){ if(ui.modal&&document.querySelector('#pm-c')){ ui.hideModal(); return; } if(ui.modal) return; if(g.targeting){ g.targeting=null; ui.refresh(); } else if(ui.panel) ui.close(); else if(g.player.hp>0) ui.pauseMenu(toTitle); return; }
    if(ui.modal) return;
    if(c==='Tab'){ e.preventDefault(); document.body.classList.toggle('mapon'); return; }
    if(c==='KeyM'){ const mu=audio.toggleMute(); g.log(mu?'Zvuk vypnut [M].':'Zvuk zapnut [M].','sys'); ui.refresh(); return; }
    if(c==='KeyI'){ ui.toggle('inv'); return; } if(c==='KeyC'){ ui.toggle('char'); return; } if(c==='KeyK'){ ui.toggle('skills'); return; } if(c==='KeyP'){ ui.toggle('tree'); return; } if(c==='KeyJ'){ ui.toggle('lore'); return; }
    if(!g.canAct()) return;
    if(MOVE[c]){ e.preventDefault(); if(!held.has(c)){ held.add(c); moveT=0; firstStep=true; } return; }
    if(e.repeat) return;
    if(/^Digit[1-4]$/.test(c)){ ui.onSkillKey(+c.slice(5)-1); return; }
    if(c==='KeyQ'){ g.quaff(); return; }
    if(c==='Enter'||c==='NumpadEnter'){ g.descend(); return; }
    if(c==='Space'||c==='KeyE'){ e.preventDefault(); interactKey(); return; }
    if(c==='KeyZ'||c==='Period'||c==='Numpad5'){ g.wait(); return; }
  });
  function interactKey(){ const p=g.player; const pr=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].map(([dx,dy])=>g.propAt(p.x+dx,p.y+dy,q=>['chest','cursed','lever','brazier','rune','obelisk','altar','shrine','gate','lore','pillar','rift','merchant','bellmaster','crystal','riddle','answer','grave','well'].includes(q.type))).find(Boolean);
      if(pr){ if(g.interact(pr)) g.endTurn(); } else { const st=g.map.stairs; if(st.x===p.x&&st.y===p.y) g.descend(); else g.wait(); } }
  addEventListener('keyup',e=>{ held.delete(e.code); });
  addEventListener('blur',()=>held.clear());
  const toTile=e=>{ const r=canvas.getBoundingClientRect(); const x=(e.clientX-r.left-r.width/2)/R.cam.z+R.cam.x, y=(e.clientY-r.top-r.height/2)/R.cam.z+R.cam.y; return [Math.floor(x/T),Math.floor(y/T)]; };
  addEventListener('keyup',e=>{ if(e.key==='Alt') g.altHeld=false; }); addEventListener('blur',()=>{ g.altHeld=false; });
  canvas.addEventListener('mousemove',e=>{ if(!started) return; const [x,y]=toTile(e); scene.hover=[x,y];
    { const mm=g.monAt(x,y); const pp=g.propAt(x,y,q=>!q.decal&&!q.deco&&q.type!=='pool'&&q.type!=='walltorch'); canvas.classList.toggle('attack',!!(mm&&g.canSee(mm))); canvas.classList.toggle('interact',!(mm&&g.canSee(mm))&&!!(pp&&g.explored[y*g.map.W+x]||g.ground.some(q=>q.x===x&&q.y===y&&g.isVis(x,y)&&g.lootOk(q)))); }
    const gr=g.ground.find(q=>q.x===x&&q.y===y&&g.isVis(x,y)&&g.lootOk(q)); const m=g.monAt(x,y);
    if(gr&&gr.item){ const it=gr.item; ui.tip(ui.itemTip(it),e); }
    else if(m&&g.canSee(m)) ui.tip(ui.monTip(m),e);
    else { const pr=g.propAt(x,y,q=>q.type!=='deco'&&q.type!=='decal'&&q.type!=='glow'&&q.type!=='pool'&&q.type!=='walltorch'); if(pr&&g.explored[y*g.map.W+x]){ const n={chest:'Truhla',cursed:'Prokletá truhla (spustí vlny)',lever:'Pulzující kokon',brazier:pr.lit?'Hořící žároviště':'Vyhaslé žároviště',rune:'Runový kámen '+pr.sym,obelisk:'Obelisk',altar:'Oltář hniloby (výroba)',shrine:pr.used?'Vyčerpaná svatyně':'Svatyně',gate:'Mříž trezoru',stairs:pr.locked?'Zapečetěné schodiště':'Schodiště dolů',riftexit:pr.locked?'Zapečetěný portál (zabij Srdce jeskyně)':'Portál zpět',lore:pr.read?'Přečtená runová deska':'Runová deska (lore)',pillar:pr.state==='idle'?'Plodnice pradávných – aktivuj pro vlny a zkažená jádra':pr.state==='active'?'Probuzená plodnice':'Vyčerpaná plodnice',rift:'Zkažená jeskyně (dobrovolný vstup)',merchant:'Hnilobný překupník',bellmaster:'Matka krystalů (zahraje melodii)',crystal:'Zpívající krystal',riddle:'Hrob mudrce (hádanka)',well:pr.used?'Vyschlá studna':'Hnilobná studna – hoď předmět, vylov cizí',answer:'Kámen s odpovědí: „'+pr.ans+'“',plate:'Dýchající plotna'}[pr.type]; if(pr.type==='grave'){ const gt=g.graveText(pr); ui.tip(`<div class="tt-name" style="color:#cfd8e6">✝ ${gt.t}</div><div class="tt-sub">${gt.s}</div>${gt.m?`<div class="tt-line">„${gt.m}“</div>`:''}<div class="tt-hint">${pr.respected?'Vzdal jsi čest.':'E = vzdát čest'}</div>`,e); } else if(n) ui.tip(`<div class="tt-name">${n}</div>`,e); else ui.tip(null); } else ui.tip(null); }
  });
  canvas.addEventListener('mouseleave',()=>{ scene.hover=null; ui.tip(null); });
  canvas.addEventListener('mousedown',e=>{ if(!started||ui.modal||performance.now()-lastTouch<900) return; if(ui.panel&&innerWidth<900) ui.close(); const [x,y]=toTile(e);
    if(e.button===2){ g.targeting=null; ui.refresh(); return; }
    if(g.targeting){ const id=g.targeting; if(scene.targetValid(g,id,x,y)){ g.targeting=null; g.useSkill(id,x,y); } else g.log('Neplatný cíl.','warn'); ui.refresh(); return; }
    g.clickTile(x,y); if(g.player.path) stepT=STEP; });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('wheel',e=>{ scene.zoom=Math.max(0.6,Math.min(1.8,scene.zoom*(e.deltaY>0?0.9:1.1))); e.preventDefault(); },{passive:false});
  addEventListener('mousemove',e=>ui.moveTip(e));
  // ================= touch / phone controls =================
  const TOUCH=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
  let lastTouch=0;
  if(TOUCH){ document.body.classList.add('touch');
    const ptrs=new Map(); let pinch=null, tap=null, lpT=null;
    const tileTip=(x,y,e)=>{ const gr=g.ground.find(q=>q.x===x&&q.y===y&&g.isVis(x,y)&&g.lootOk(q)); const m=g.monAt(x,y);
      if(gr&&gr.item) ui.tip(ui.itemTip(gr.item),e); else if(m&&g.canSee(m)) ui.tip(ui.monTip(m),e); else return false; return true; };
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse') return; e.preventDefault(); lastTouch=performance.now(); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:scene.zoom}; tap=null; clearTimeout(lpT); return; }
      if(!started||ui.modal) return; ui.tip(null);
      tap={x:e.clientX,y:e.clientY,t:performance.now(),long:false};
      clearTimeout(lpT); lpT=setTimeout(()=>{ if(!tap) return; const [x,y]=toTile({clientX:tap.x,clientY:tap.y}); if(tileTip(x,y,{clientX:tap.x,clientY:tap.y-40})){ tap.long=true; if(navigator.vibrate) navigator.vibrate(12); } },420); },{passive:false});
    canvas.addEventListener('pointermove',e=>{ if(e.pointerType==='mouse'||!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch&&ptrs.size>=2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); scene.zoom=Math.max(0.55,Math.min(2.2,pinch.z*d/pinch.d)); return; }
      if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>14){ tap=null; clearTimeout(lpT); } });
    const end=e=>{ if(e.pointerType==='mouse') return; ptrs.delete(e.pointerId); lastTouch=performance.now(); clearTimeout(lpT);
      if(pinch){ if(ptrs.size<2) pinch=null; tap=null; return; }
      if(!tap||e.type==='pointercancel'){ tap=null; return; } const t=tap; tap=null; if(t.long){ setTimeout(()=>ui.tip(null),2200); return; }
      if(!started||ui.modal) return; if(ui.panel) ui.close(); const [x,y]=toTile({clientX:t.x,clientY:t.y});
      if(g.targeting){ const id=g.targeting; if(scene.targetValid(g,id,x,y)){ g.targeting=null; g.useSkill(id,x,y); } else { g.targeting=null; g.log('Neplatný cíl – dovednost zrušena.','warn'); } ui.refresh(); return; }
      g.clickTile(x,y); if(g.player.path) stepT=STEP; };
    canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end);
    // on-screen pad + buttons
    const tui=document.createElement('div'); tui.id='touchui';
    tui.innerHTML=`<div class="dpad">${[[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]].map(([dx,dy])=>`<button data-d="${dx},${dy}" class="${dx||dy?'dir':'mid'}">${dx||dy?['↖','↑','↗','←','','→','↙','↓','↘'][(dy+1)*3+dx+1]:'E'}</button>`).join('')}</div>
      <div class="tbtns"><button data-t="menu" title="Menu">☰</button><button data-t="map" title="Mapa">⌖</button><button data-t="down" title="Sestoupit">⇣</button><button data-t="wait" title="Čekat">⧗</button></div>`;
    document.body.appendChild(tui);
    tui.querySelectorAll('.dir').forEach(b=>{ const code='T'+b.dataset.d; const [dx,dy]=b.dataset.d.split(',').map(Number); MOVE[code]=[dx,dy];
      const on=e=>{ e.preventDefault(); if(!started||ui.modal) return; if(ui.panel) ui.close(); if(!held.has(code)){ held.add(code); if(doMove()){ moveT=STEP*2.2; firstStep=false; } else { moveT=0; firstStep=true; } } b.classList.add('on'); };
      const off=e=>{ held.delete(code); b.classList.remove('on'); };
      b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointerleave',off); b.addEventListener('pointercancel',off); });
    tui.querySelector('.mid').addEventListener('click',()=>{ if(started&&!ui.modal&&g.canAct()) interactKey(); });
    tui.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{ if(!started) return; const t=b.dataset.t;
      if(t==='menu'){ if(document.body.classList.contains('mapon')){ document.body.classList.remove('mapon'); return; } if(ui.modal) return; if(ui.panel){ ui.close(); return; } if(g.targeting){ g.targeting=null; ui.refresh(); return; } if(g.player.hp>0) ui.pauseMenu(toTitle); }
      else if(ui.modal) return;
      else if(t==='map') document.body.classList.toggle('mapon');
      else if(t==='down'){ if(g.canAct()) g.descend(); }
      else if(t==='wait'){ if(g.canAct()) g.wait(); } }));
    // portrait hint
    const ori=document.createElement('div'); ori.id='rotate'; ori.innerHTML=`<div><b>⟲</b><p>Sporium se nejlépe hraje na šířku.<br>Otoč telefon.</p><button>Hrát i tak</button></div>`; document.body.appendChild(ori);
    ori.querySelector('button').onclick=()=>document.body.classList.add('portrait-ok');
  }
  ui.isTouch=TOUCH;
  // ---- loop ----
  const STEP=0.1; let last=performance.now(), stepT=0;
  function frame(now){ const dt=Math.min(0.05,(now-last)/1000); last=now; const t=now/1000;
    if(started&&g.map&&!ui.modal&&g.player) g.player.playSec=(g.player.playSec||0)+dt;
    if(started&&g.map){
      if(held.size&&!ui.modal){ moveT-=dt; if(firstStep||moveT<=0){ if(doMove()) moveT=Math.max(0,moveT)+STEP; else moveT=0.05; firstStep=false; } }
      else { stepT+=dt; if(g.player.path&&stepT>=STEP&&g.canAct()){ stepT-=STEP; if(stepT>STEP) stepT=0; g.stepPath(); } }
      if(audio.ctx&&(stepT>0||true)){ const bs=g.bossRef&&g.bossRef.hp>0&&g.bossRef.aware; const cb=g.monsters.some(m=>m.hp>0&&m.aware&&Math.max(Math.abs(m.x-g.player.x),Math.abs(m.y-g.player.y))<=9); audio.setState(bs?'boss':cb?'combat':'explore',g.map.biome.id); }
      scene.tick(g,dt); scene.draw(g,dt,t); if(document.body.classList.contains('mapon')) drawMap(g,mapCv,t); }
    requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  addEventListener('beforeunload',()=>{ if(started) g.save(); });
}
boot().catch(e=>{ console.error(e); const l=document.getElementById('loading'); if(l) l.textContent='Chyba: '+e.message; });
