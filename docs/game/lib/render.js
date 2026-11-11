// Scene drawing: tiles, props, entities, fx, spores, overlay text
import {T} from './game.js';
import {WALL,FLOOR} from './dungeon.js';
import {rng,edist,dist} from './util.js';
import {rarityColor} from './items.js';
import {SKILLS,biomeFor} from './data.js';
import {drawRig,animTick,RIGS,drawBeast,drawForm,beastKey} from './rig.js';
import {royalTrapActive} from './community.js';

const hex=h=>[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];
export class SceneRenderer{
  constructor(r,overlay){ this.r=r; this.o=overlay; this.ctx=overlay.getContext('2d'); this.spores=[]; this.zoom=1; this.hover=null; }
  uiImg(n){ this._ui=this._ui||{}; if(!this._ui[n]){ const i=new Image(); i.src=`assets/ui/${n}.webp`; this._ui[n]=i; } return this._ui[n]; }
  spritesize(n,targetH){ const [w,h]=this.r.size(n); return [w*targetH/h,targetH]; }
  fitSprite(n,maxW,maxH){ const [w,h]=this.r.size(n); const s=Math.min(maxW/w,maxH/h); return [w*s,h*s]; }
  draw(g,dt,time){
    const R=this.r, map=g.map, p=g.player; if(!map) return;
    // anim positions
    const k=1-Math.pow(0.0005,dt);
    const animE=e=>{ e.rx+=(e.x-e.rx)*k; e.ry+=(e.y-e.ry)*k; if(Math.abs(e.x-e.rx)<0.01) e.rx=e.x; if(Math.abs(e.y-e.ry)<0.01) e.ry=e.y; if(e.lunge){ e.lunge.t+=dt*5; if(e.lunge.t>=1) e.lunge=null; } if(e.flash) e.flash=Math.max(0,e.flash-dt); animTick(e,dt); };
    animE(p); g.monsters.forEach(animE); g.minions.forEach(animE);
    // camera
    const vw=R.c.clientWidth, vh=R.c.clientHeight; const tilePx=Math.max(46,Math.min(92,Math.min(vw/15,vh/10)))*this.zoom;
    R.cam.z=tilePx/T; g.shake*=Math.pow(0.02,dt); const sh=g.shake;
    R.cam.x=p.rx*T+T/2+(rng.next()-0.5)*sh; R.cam.y=p.ry*T+T/2+(rng.next()-0.5)*sh;
    const hw=vw/2/R.cam.z/T+2, hh=vh/2/R.cam.z/T+2; const x0=Math.max(0,Math.floor(p.rx-hw)), x1=Math.min(map.W-1,Math.ceil(p.rx+hw)), y0=Math.max(0,Math.floor(p.ry-hh)), y1=Math.min(map.H-1,Math.ceil(p.ry+hh));
    // light
    R.setLight(g.computeLight(time),map.W,map.H);
    const flick=1+Math.sin(time*8.3)*0.05+Math.sin(time*19.7)*0.03+(rng.next()-0.5)*0.03;
    R.torch=[p.rx*T+T/2,p.ry*T+T/2-10,p.stats.torch*T*1.1,1.15*flick]; R.ambient=map.biome.ambient; g.renderHurt=(g.renderHurt||0)*Math.pow(0.15,dt); R.hurt=Math.max(g.renderHurt,p.hp/p.stats.life<0.3?0.25+Math.sin(time*4)*0.1:0);
    const court=map.community?.area==='king'&&biomeFor(11);
    const W=map.W; const tiles=R.meta.tiles||{};
    R.layer('base');
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=y*W+x; if(!g.explored[i]) continue;
      const biome=court&&y>=map.community.top-1?court:map.biome;
      if(map.t[i]===FLOOR){ const fl=biome.floors, n=fl[map.fv[i]%fl.length], cv=tiles[n]||[1,1]; const tw=cv[0], th=cv[1]; const qx=x%tw, qy=y%th;
        R.sprite(n,x*T,y*T,T+0.6,T+0.6,{sub:[qx/tw,qy/th,(qx+1)/tw,(qy+1)/th],tint:[0.8,0.78,0.76]}); }
      else { const below=y+1<map.H&&map.t[i+W]===FLOOR;
        const q=4, ux=x%q, uy=y%q; R.sprite('tex_walltop',x*T,y*T,T+0.6,T+0.6,{sub:[ux/q,uy/q,(ux+1)/q,(uy+1)/q]});
        if(below){ const n=biome.wall, cw=(tiles[n]||[8])[0], ux2=x%cw; const h=T*1.25; R.sprite(n,x*T,(y+1)*T-h,T+0.6,h,{sub:[ux2/cw,0,(ux2+1)/cw,1]}); } } }
    // ambient occlusion along walls
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){ const i=y*W+x; if(map.t[i]!==FLOOR||!g.explored[i]) continue;
      if(y>0&&map.t[i-W]!==FLOOR){ R.rect(x*T,y*T,T+0.5,T*0.12,[0,0,0],0.32); R.rect(x*T,y*T,T+0.5,T*0.28,[0,0,0],0.16); R.rect(x*T,y*T,T+0.5,T*0.5,[0,0,0],0.07); }
      if(x>0&&map.t[i-1]!==FLOOR){ R.rect(x*T,y*T,T*0.1,T+0.5,[0,0,0],0.28); R.rect(x*T,y*T,T*0.24,T+0.5,[0,0,0],0.12); }
      if(x<map.W-1&&map.t[i+1]!==FLOOR){ R.rect((x+1)*T-T*0.1,y*T,T*0.1,T+0.5,[0,0,0],0.28); R.rect((x+1)*T-T*0.24,y*T,T*0.24,T+0.5,[0,0,0],0.12); }
      if(y<map.H-1&&map.t[i+W]!==FLOOR){ R.rect(x*T,(y+1)*T-T*0.08,T+0.5,T*0.08,[0,0,0],0.25); } }
    // flat props
    for(const pr of g.props) if(pr.flat&&this.onScreen(pr,x0,x1,y0,y1)&&g.explored[pr.y*W+pr.x]){ if(pr.decal){ const [w,h]=this.fitSprite(pr.spr,T*pr.sc,T*pr.sc); R.sprite(pr.spr,(pr.x+0.5+pr.ox)*T-w/2,(pr.y+0.5+pr.oy)*T-h/2,w,h,{rot:pr.rot,flip:pr.flip,tint:[0.82,0.8,0.78]}); continue; } const [w,h]=this.fitSprite(pr.spr,T*1.1,T*0.9); R.sprite(pr.spr,pr.x*T+T/2-w/2,pr.y*T+T/2-h/2,w,h); }
    // telegraphs (on floor, base layer, tinted)
    for(const m of g.monsters) if(m.tele&&(g.canSee(m)||m.tele.tiles.some(([x,y])=>g.isVis(x,y)))) for(const [x,y] of m.tele.tiles){
      const color=m.ai==='winged'?[0.8,0.42,0.95]:[0.95,0.12,0.05];
      R.rect(x*T+3,y*T+3,T-6,T-6,color,0.3+Math.sin(time*12)*0.12);
    }
    for(const h of g.hazards){ const st=h.look==='storm', col=st?[0.55,0.62,0.3]:h.el==='fire'?[0.62,0.2,0.04]:h.el==='decay'?[0.38,0.15,0.48]:[0.26,0.46,0.1]; const warn=h.warn>0, fade=!warn&&h.turns<=1?0.55:1;
      const S=h._set||(h._set=new Set(h.tiles.map(([x,y])=>x+','+y))); const a=warn?0.16+Math.sin(time*6)*0.06:(st?0.34:0.62)*fade;
      for(const [x,y] of h.tiles){ if(!g.explored[y*W+x]) continue; R.fill(x*T,y*T,T,[S.has((x-1)+','+y),S.has(x+','+(y-1)),S.has((x+1)+','+y),S.has(x+','+(y+1))],col,a); } }
    // drawables sorted by y
    const list=[];
    for(const pr of g.props){ if(pr.flat||!this.onScreen(pr,x0,x1,y0,y1)||!g.explored[pr.y*W+pr.x]) continue; list.push({y:pr.y+(pr.wall?-0.5:0),f:()=>this.drawProp(g,pr,time)}); }
    for(const gr of g.ground){ if(!g.isVis(gr.x,gr.y)&&!g.explored[gr.y*W+gr.x]) continue; if(!g.lootOk(gr)) continue; list.push({y:gr.y-0.2,f:()=>this.drawGround(g,gr,time)}); }
    for(const m of g.monsters){ if(m.hp<=0||!g.canSee(m)) continue; list.push({y:m.ry,f:()=>this.drawActor(g,m,m.spr,time)}); }
    for(const f of g.fx) if(f.type==='corpse') list.push({y:f.y-0.1,f:()=>{ const a=f.life/f.max; const [w,h]=this.spritesize(f.spr,T*0.95*f.sc); R.sprite(f.spr,f.x*T+T/2-w/2,f.y*T+T-h*a,w,h*a,{a,tint:[0.5,0.5,0.5],flip:f.flip}); }});
    for(const mn of g.minions){ if(mn.hp<=0||!g.explored[mn.y*W+mn.x]) continue; list.push({y:mn.ry,f:()=>this.drawActor(g,mn,mn.spr,time)}); }
    if(p.hp>0) list.push({y:p.ry+0.01,f:()=>this.drawActor(g,p,p.drawSpr||p.spr,time,true)});
    list.sort((a,b)=>a.y-b.y); for(const d of list) d.f();
    // additive fx
    R.layer('add');
    for(const pr of g.props){ if(!g.isVis(pr.x,pr.y)) continue;
      if(pr.shaft){ const c=pr.light.map(v=>v/1.6), fl=0.85+Math.sin(time*0.7+pr.ph)*0.15; const fx=pr.x*T+T/2, fy=pr.y*T+T/2;
        R.glow(fx,fy,T*1.1,c,0.26*fl); R.q(fx-T*0.2,fy-T*4.0,T*1.3,T*4.4,0,0,1,1,c[0],c[1],c[2],0.2*fl,2,-0.2); R.q(fx-T*0.05,fy-T*3.5,T*0.7,T*3.8,0,0,1,1,1,0.95,0.9,0.09*fl,2,-0.2);
        if(rng.chance(dt*3)) g.fx.push({type:'p',x:fx+rng.range(-T*0.4,T*0.4),y:fy-rng.range(0,T*2),vx:rng.range(-4,4),vy:rng.range(4,12),c:[c[0]*0.9+0.1,c[1]*0.9+0.1,c[2]*0.9+0.1],s:rng.range(2,4),life:2.2,max:2.2}); continue; }
      if(pr.type==='walltorch'||(pr.type==='brazier'&&pr.lit)){ const fx=pr.x*T+T/2, fy=pr.wall?pr.y*T+T*0.55:pr.y*T+T*0.25; R.glow(fx,fy,T*0.55*(1+Math.sin(time*11+pr.x)*0.08),[1,0.55,0.2],0.65); R.glow(fx,fy,T*1.6,[1,0.45,0.15],0.18);
        if(rng.chance(dt*14)) g.fx.push({type:'p',x:fx+rng.range(-5,5),y:fy,vx:rng.range(-8,8),vy:-rng.range(30,60),c:[1,0.6,0.2],s:rng.range(3,6),life:0.7,max:0.7}); }
      if(pr.type==='pillar'&&pr.state!=='done'){ R.glow(pr.x*T+T/2,pr.y*T+T*0.3,T*(pr.state==='active'?1.6:1.0)*(1+Math.sin(time*(pr.state==='active'?6:2))*0.12),[0.5,1,0.4],pr.state==='active'?0.45:0.25); }
      if(pr.type==='rift'||(pr.type==='riftexit'&&!pr.locked)){ for(let i=0;i<3;i++) R.glow(pr.x*T+T/2+Math.cos(time*1.5+i*2.1)*T*0.25,pr.y*T+T*0.45+Math.sin(time*1.5+i*2.1)*T*0.25,T*0.6,[0.75,0.3,1],0.35); }
      if(pr.type==='lore'&&!pr.read) R.glow(pr.x*T+T/2,pr.y*T+T*0.4,T*0.7,[0.55,0.7,1],0.22+Math.sin(time*2.5)*0.08);
      if(pr.type==='plate'&&pr.lit) R.glow(pr.x*T+T/2,pr.y*T+T/2,T*0.8,[0.5,1,0.6],0.4);
      if(pr.type==='well'&&!pr.used){ R.glow(pr.x*T+T/2,pr.y*T+T/2,T*0.9*(1+Math.sin(time*2.2)*0.1),[0.6,0.4,1],0.35); if(rng.chance(dt*6)) g.fx.push({type:'p',x:pr.x*T+T/2+rng.range(-14,14),y:pr.y*T+T/2,vx:rng.range(-4,4),vy:-rng.range(15,35),c:[0.7,0.5,1],s:rng.range(3,6),life:1,max:1}); }
      if(pr.type==='grave'&&!pr.respected) R.glow(pr.x*T+T/2,pr.y*T+T*0.5,T*0.5,[0.75,0.82,0.95],0.12);
      if(pr.type==='merchant') R.glow(pr.x*T+T/2,pr.y*T+T*0.5,T*0.9,[1,0.8,0.5],0.18);
      if(pr.type==='glow'||pr.type==='altar'||pr.type==='shrine'&&!pr.used||(pr.type==='rune'&&pr.on)){ const c=pr.light||[0.6,0.9,0.5]; R.glow(pr.x*T+T/2,pr.y*T+T*0.45,T*0.9,c,0.22+Math.sin(time*2+pr.x)*0.06); } }
    for(const gr of g.ground){ if(!g.isVis(gr.x,gr.y)||!g.lootOk(gr)) continue; const c=gr.gold?[1,0.85,0.3]:gr.item.type?[1,0.4,0.4]:hex(rarityColor(gr.item.rarity)); const leg=gr.item&&(gr.item.rarity==='legendary'||gr.item.rarity==='sporeborn'||gr.item.rarity==='set');
      R.glow(gr.x*T+T/2,gr.y*T+T*0.6,T*(leg?0.9:0.5),c,leg?0.5:0.28); if(leg) R.rect(gr.x*T+T/2-3,gr.y*T-T*2.2,6,T*2.6,c,0.12+Math.sin(time*3)*0.04); }
    for(const f of g.fx){ const a=f.life/f.max;
      if(f.type==='p'){ R.glow(f.x,f.y,f.s,f.c,a*0.9); }
      else if(f.type==='ring'){ const rr=(f.r+0.5)*T*(1-a*0.6); for(let i=0;i<24;i++){ const an=i/24*Math.PI*2; R.glow(f.x*T+T/2+Math.cos(an)*rr,f.y*T+T/2+Math.sin(an)*rr,T*0.35,f.c,a*0.7); } }
      else if(f.type==='arc'){ for(let i=0;i<16;i++){ const an=i/16*Math.PI*2+time*10; R.glow(f.x*T+T/2+Math.cos(an)*T*(f.r+0.2),f.y*T+T/2+Math.sin(an)*T*(f.r+0.2),T*0.3,[1,0.9,0.7],a*0.7); } }
      else if(f.type==='cloud'){ for(let i=0;i<14;i++){ const an=i*2.4, rr=(i%5)/5*f.r*T+T*0.3; R.glow(f.x*T+T/2+Math.cos(an)*rr,f.y*T+T/2+Math.sin(an)*rr,T*0.8*(1.4-a),[0.6,0.95,0.3],a*0.35); } }
      else if(f.type==='arrowzone'){ for(let i=0;i<8;i++){ const ax=f.x*T+T/2+Math.sin(time*7+i*2.3)*f.r*T*0.8, ay=f.y*T+T/2+((time*3+i*0.37)%1-0.5)*f.r*T*1.6; R.glow(ax,ay,5,[1,0.9,0.7],0.7); } R.glow(f.x*T+T/2,f.y*T+T/2,T*(f.r+0.5),[1,0.85,0.6],0.08); }
      else if(f.type==='trap'){ if(g.explored[f.y*g.map.W+f.x]){ const pl=0.5+Math.sin(time*5+f.x)*0.15; R.glow(f.x*T+T/2,f.y*T+T*0.6,T*0.55,[0.6,1,0.3],pl*0.5); R.sprite('spore_pile',f.x*T+T*0.2,f.y*T+T*0.4,T*0.6,T*0.42,{a:0.95}); } }
      else if(f.type==='flyzone'){ for(let i=0;i<14;i++){ const an=time*(3+i%4)+i*1.7, rr=(0.3+(i%5)/5)*(f.r+0.4)*T; R.sprite('fly',f.x*T+T/2+Math.cos(an)*rr-7,f.y*T+T/2+Math.sin(an*1.3)*rr*0.7-6,14,12,{flip:Math.cos(an)>0}); } R.glow(f.x*T+T/2,f.y*T+T/2,T*(f.r+0.6),[0.55,0.35,0.7],0.1); }
      else if(f.type==='pmine'){ R.glow(f.x*T+T/2,f.y*T+T*0.6,T*0.4*(1+Math.sin(time*14)*0.2),[0.6,1,0.3],0.6); }
      else if(f.type==='poisonzone'){ for(let i=0;i<6;i++){ const an=i+time*0.6; R.glow(f.x*T+T/2+Math.cos(an)*f.r*T*0.6,f.y*T+T/2+Math.sin(an*1.3)*f.r*T*0.6,T*0.9,[0.5,0.9,0.25],0.12); } }
      else if(f.type==='slam'){ for(const [x,y] of f.tiles) R.glow(x*T+T/2,y*T+T/2,T*0.8,f.c||[1,0.4,0.15],a*0.6); } }
    for(const h of g.hazards){ const st=h.look==='storm', fire=h.el==='fire', c=st?[0.75,0.95,0.4]:fire?[1,0.55,0.15]:h.el==='decay'?[0.8,0.45,1]:[0.55,0.95,0.3];
      for(const [x,y] of h.tiles){ if(!g.isVis(x,y)) continue; const k=((x*7+y*13+(h.seed||0))%17), cx=x*T+T/2, cy=y*T+T/2;
        if(h.warn>0){ R.glow(cx,cy,T*0.45,c,0.08+Math.sin(time*6+k)*0.04); continue; }
        R.glow(cx,cy,T*0.7,c,st?0.07:0.1);
        if(st){ for(let i=0;i<3;i++){ const ph=(time*0.22+i*0.33+k*0.05)%1; R.glow(cx+Math.sin(time*1.3+i*2+k)*T*0.35,cy+T*0.3-ph*T*0.8,2.5+ph*1.5,c,0.55*Math.sin(ph*Math.PI)); } }
        else if(fire){ for(let i=0;i<3;i++){ const ph=(time*0.9+i*0.33+k*0.07)%1; R.glow(cx+Math.sin(i*2.1+k+time*3)*T*0.25,cy+T*0.2-ph*T*0.7,2+ (1-ph)*2,c,0.8*(1-ph)); } R.glow(cx,cy,T*0.45,[1,0.4,0.1],0.12+Math.sin(time*11+k)*0.05); }
        else { for(let i=0;i<2;i++){ const ph=(time*0.55+i*0.5+k*0.13)%1; R.glow(cx+Math.sin(k*3.1+i*1.9)*T*0.25,cy+Math.cos(k*2.3+i*2.7)*T*0.22,T*0.04+ph*T*0.07,c,0.55*(1-ph)); } } } }
    for(const pj of g.projs){ const t=Math.min(1,pj.t/pj.dur); const x=pj.fx+(pj.tx-pj.fx)*t, y=pj.fy+(pj.ty-pj.fy)*t-Math.sin(t*Math.PI)*T*0.25;
      if(pj.spr==='arrow'){ for(let i=0;i<5;i++){ const tt=Math.max(0,t-i*0.03); R.glow(pj.fx+(pj.tx-pj.fx)*tt,pj.fy+(pj.ty-pj.fy)*tt-Math.sin(tt*Math.PI)*T*0.25,6-i,[1,0.9,0.7],0.8-i*0.15); } }
      else { R.glow(x,y,T*0.32,pj.c,0.9); R.glow(x,y,T*0.8,pj.c,0.25); } }
    // spores
    this.spores_(g,dt,time,x0,x1,y0,y1);
    // ui overlay layer: hover, path, targeting
    R.layer('ui');
    if(this.hover&&g.inb(this.hover[0],this.hover[1])&&g.explored[this.hover[1]*W+this.hover[0]]){ const [hx,hy]=this.hover; const tgt=g.targeting;
      const ok=tgt?this.targetValid(g,tgt,hx,hy):true; const c=tgt?(ok?[0.5,1,0.5]:[1,0.3,0.2]):[1,0.9,0.6];
      this.outline(hx*T,hy*T,T,T,c,0.55);
      if(tgt==='puffbomb'){ const r=1+(p.stats.uniques.has('puff_staff')?1:0)+p.stats.aoe; this.outline((hx-r)*T,(hy-r)*T,T*(2*r+1),T*(2*r+1),[0.6,1,0.4],0.35); } }
    if(p.path) for(const [x,y] of p.path) R.rect(x*T+T/2-3,y*T+T/2-3,6,6,[1,0.85,0.5],0.35);
    R.render(time);
    this.overlay(g,dt,time);
  }
  outline(x,y,w,h,c,a){ const R=this.r, t=3; R.rect(x,y,w,t,c,a); R.rect(x,y+h-t,w,t,c,a); R.rect(x,y,t,h,c,a); R.rect(x+w-t,y,t,h,c,a); }
  targetValid(g,id,x,y){ const p=g.player, s=SKILLS[id]; if(s.target==='enemy'){ const m=g.monAt(x,y); return !!m&&g.canSee(m)&&edist(p.x,p.y,x,y)<=s.range+0.5; } if(s.target==='adjacent'){ const m=g.monAt(x,y); return !!m&&dist(p.x,p.y,x,y)<=1+p.stats.reach; } if(s.target==='tile') return g.isVis(x,y)&&edist(p.x,p.y,x,y)<=s.range+0.5&&g.tile(x,y)===FLOOR; return true; }
  onScreen(o,x0,x1,y0,y1){ return o.x>=x0-1&&o.x<=x1+1&&o.y>=y0-1&&o.y<=y1+2; }
  drawProp(g,pr,time){ const R=this.r;
    if(pr.type==='walltorch'){ const [w,h]=this.fitSprite('torch_wall',T*0.5,T*0.75); R.sprite('torch_wall',pr.x*T+T/2-w/2,pr.y*T+T*0.35,w,h); return; }
    if(pr.type==='stairs'){ const [w,h]=this.fitSprite('stairs',T*1.0,T*1.0); R.sprite('stairs',pr.x*T+T/2-w/2,pr.y*T+T-h,w,h,{tint:pr.locked?[0.5,0.45,0.5]:[1,1,1]}); return; }
    const big=['gate','arch','arch_broken','altar','shrine','obelisk','chest','pillar','pillars','deadtree','glowshroom_big','brazier','grave','tomb','npc_sage'].includes(pr.spr)||pr.type==='gate';
    const maxH=pr.type==='gate'?T*1.25:big?T*1.15:pr.deco?T*0.8:T*0.9; const maxW=pr.type==='gate'?T*1.05:T*(big?1.0:0.85);
    const [w,h]=this.fitSprite(pr.spr,maxW,maxH); const bob=pr.type==='lever'?Math.sin(time*3+pr.x)*2:0;
    let tint=[1,1,1]; if(pr.type==='brazier'&&!pr.lit) tint=[0.55,0.55,0.6]; if(pr.type==='rune') tint=pr.on?[0.8,1,1.3]:[0.75,0.75,0.8]; if(pr.type==='shrine'&&pr.used) tint=[0.5,0.5,0.55]; if(pr.type==='pillar') tint=pr.state==='done'?[0.45,0.45,0.45]:pr.state==='active'?[1.2+Math.sin(time*6)*0.2,1.3,1.1]:[1,1,1]; if(pr.type==='riftexit'&&pr.locked) tint=[0.55,0.5,0.6]; if(pr.type==='lore'&&pr.read) tint=[0.7,0.7,0.75]; if(pr.type==='grave') tint=pr.respected?[0.55,0.55,0.6]:[0.85,0.88,0.95]; if(pr.type==='lever') tint=[1.05+Math.sin(time*4)*0.08,0.95,0.85];
    R.sprite(pr.spr,pr.x*T+T/2-w/2,pr.y*T+T-h-2+bob,w,h,{tint});
    if(pr.type==='rune'){ /* symbol drawn in overlay */ } }
  drawGround(g,gr,time){ const R=this.r; const n=gr.gold?'coins':gr.item.spr; const [w,h]=this.fitSprite(n,T*0.55,T*0.55); const b=Math.sin(time*2.5+gr.x*1.3)*2;
    R.sprite(n,gr.x*T+T/2-w/2,gr.y*T+T*0.85-h+b,w,h,{rot:gr.gold?0:-0.25}); }
  drawActor(g,e,spr,time,isP){ const R=this.r; const sc=e.sc||1; const [w,h]=this.spritesize(spr,T*0.92*sc);
    let ox=0,oy=0; if(e.lunge){ const k=Math.sin(e.lunge.t*Math.PI)*0.32; ox=e.lunge.dx*k*T; oy=e.lunge.dy*k*T; }
    const breathe=1+Math.sin(time*3+(e.x||0)*1.7)*0.018; const bx=e.rx*T+T/2+ox, by=e.ry*T+T*0.96+oy;
    R.q(bx-w*0.38,by-8,w*0.76,14,0,0,1,1,0,0,0,0.45,2);
    let tint=e.tint||[1,1,1]; if(e.ally) tint=e.spirit?[1,1.05,1.15]:[0.85,1.08,0.9]; if(e.flash>0) tint=[2.2,2.2,2.2]; if(e.status?.poison) tint=[tint[0]*0.75,tint[1]*1.1,tint[2]*0.7]; if(e.status?.stun) tint=[tint[0]*0.8,tint[1]*0.8,tint[2]*1.1]; if(e.status?.fear) tint=[tint[0]*0.95,tint[1]*0.8,tint[2]*1.15]; if(e.status?.weak) tint=[tint[0]*0.82,tint[1]*0.78,tint[2]*0.9];
    if(e.def?.wingRig){ this.drawAngel(g,e,bx,by,T*0.96*sc/99,time,tint); return; }
    if(isP&&e.form){ if(e._hurt>0) tint=[tint[0]*(1+e._hurt),tint[1]*(1-e._hurt*0.4),tint[2]*(1-e._hurt*0.4)]; if(drawForm(R,e,bx,by,T*0.92*1.1/99,time,tint)) return; }
    { const bk=!isP&&beastKey(spr); if(bk&&drawBeast(R,bk,e,bx,by,T*0.92*sc,time,tint)){ if(e.ally){ R.layer('add'); R.glow(bx,by-4,w*0.55,[0.5,1,0.45],0.16); R.layer('base'); } return; } }
    if(isP&&!e.form&&RIGS[e.cls]){ if(e._hurt>0) tint=[tint[0]*(1+e._hurt),tint[1]*(1-e._hurt*0.4),tint[2]*(1-e._hurt*0.4)]; drawRig(R,e,g,bx,by,T*0.92*sc*1.1/99,time,tint); return; }
    const hop=Math.abs(Math.sin(e._wp||0))*(e._mv||0), sway=Math.sin(e._wp||0)*(e._mv||0)*0.07;
    R.sprite(spr,bx-w/2,by-h*breathe-hop*T*0.07,w,h*breathe,{flip:!e.flip,tint,rot:sway}); if(e.ally){ R.layer('add'); R.glow(bx,by-4,w*0.55,[0.5,1,0.45],0.16); R.layer('base'); } }
  drawAngel(g,e,bx,by,k,time,tint){
    const R=this.r, mv=e._mv||0;
    const pose=e.tele?1:e.anim?Math.sin(e.anim.t*Math.PI)*0.9:0;
    const flap=Math.sin(time*(3+mv*4)+e.x)*(0.12+mv*0.22);
    const variant=e.def.wingAttack==='wingSweep'?[0.82,0.85,0.71]:e.def.wingAttack==='wingRing'?[0.89,0.72,1]:[0.92,0.83,0.64];
    const bodyTint=tint.map((v,i)=>v*variant[i]);
    for(const side of [-1,1]){
      const near=(side===1)===!!e.flip;
      const w=(near?89:72)*(0.84+pose*0.22)*k, h=w*2/3;
      const rot=side*(0.34-pose*0.7+flap+(near?0:0.12));
      const dx=side*w*0.43, dy=-h*0.13;
      const x=bx+side*6*k+dx*Math.cos(rot)-dy*Math.sin(rot);
      const y=by-(64+pose*4)*k+dx*Math.sin(rot)+dy*Math.cos(rot);
      R.sprite('angel_wing',x-w/2,y-h/2,w,h,{flip:side===1,rot,tint:bodyTint.map(v=>v*(near?1.36:1.03))});
    }
    const hat={wingSweep:'hat_slice8',wingRing:'hat_slice9',wingCross:'hat_slice14'}[e.def.wingAttack];
    const equip={weapon:{spr:e.def.weapon},offhand:e.def.offhand&&{spr:e.def.offhand},helm:{spr:hat}};
    drawRig(R,e,g,bx,by,k,time,bodyTint,e.def.wingRig,equip);
  }
  spores_(g,dt,time,x0,x1,y0,y1){ const R=this.r, S=this.spores, c=g.map.biome.spore; const N=Math.round((x1-x0)*(y1-y0)*0.9);
    while(S.length<N) S.push(this.newSpore(x0,x1,y0,y1,true));
    for(let i=S.length-1;i>=0;i--){ const s=S[i]; s.life+=dt; s.x+=(s.vx+Math.sin(time*0.7+s.ph)*7)*dt; s.y+=(s.vy+Math.cos(time*0.5+s.ph)*4)*dt;
      if(s.life>s.max||s.x<x0*T-T||s.x>(x1+1)*T+T||s.y<y0*T-T||s.y>(y1+1)*T+T){ S[i]=this.newSpore(x0,x1,y0,y1,false); continue; }
      const a=Math.sin(Math.PI*s.life/s.max)*s.a*(0.75+Math.sin(time*3+s.ph)*0.25);
      R.glow(s.x,s.y,s.r,c,a); if(s.r>5) R.glow(s.x,s.y,s.r*3,c,a*0.12); } if(S.length>N+40) S.length=N; }
  newSpore(x0,x1,y0,y1,init){ return {x:rng.range(x0*T,(x1+1)*T),y:rng.range(y0*T,(y1+1)*T),vx:rng.range(-6,6),vy:-rng.range(3,14),r:rng.chance(0.1)?rng.range(5,9):rng.range(2,4.2),a:rng.range(0.5,1),life:init?rng.range(0,6):0,max:rng.range(4,9),ph:rng.range(0,9)}; }
  overlay(g,dt,time){
    const c=this.ctx, cv=this.o, R=this.r; const d=R.dpr; if(cv.width!==R.W||cv.height!==R.H){ cv.width=R.W; cv.height=R.H; }
    c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,cv.width,cv.height);
    const z=R.cam.z*d; const sx=x=>(x-R.cam.x)*z+cv.width/2, sy=y=>(y-R.cam.y)*z+cv.height/2;
    c.textAlign='center'; c.textBaseline='middle';
    const traps=g.map.community?.traps;
    if(traps){
      c.font=`700 ${22*d}px sans-serif`; c.lineWidth=3*d; c.strokeStyle='#1a1418';
      for(const trap of traps){
        if(!g.isVis(trap.x,trap.y)) continue;
        const active=royalTrapActive(trap,g.turn), symbol=trap.kind==='crack'?'ϟ':active?'✦':'◇';
        const px=sx((trap.x+0.5)*T), py=sy((trap.y+0.5)*T);
        c.fillStyle=active?'#f77b70':'#f9e4ad'; c.strokeText(symbol,px,py); c.fillText(symbol,px,py);
      }
    }
    // monster bars
    for(const m of g.monsters){ if(m.hp<=0||!g.canSee(m)) continue; const special=m.rarity!=='normal'||m.boss||m.nest; if(m.hp>=m.maxhp&&!special) continue;
      const w=T*0.8*z*(m.boss?1.6:1), x=sx(m.rx*T+T/2)-w/2, y=sy(m.ry*T+T-T*0.95*(m.sc||1))-10*d;
      c.fillStyle='rgba(0,0,0,0.7)'; c.fillRect(x-1,y-1,w+2,6*d); const col=m.boss||m.unique?'#f08a3c':m.rarity==='rare'?'#f2d36b':m.rarity==='magic'?'#7fa8ff':'#c73b2f'; c.fillStyle=col; c.fillRect(x,y,w*Math.max(0,m.hp/m.maxhp),4*d); if(m.shield>0){ c.fillStyle='#9cf'; c.fillRect(x,y-3*d,w*Math.min(1,m.shield/m.maxhp/0.35),2*d); }
      if(special&&!m.boss){ c.font=`600 ${11*d}px "Alegreya Sans",sans-serif`; c.fillStyle=col; c.fillText(m.name,x+w/2,y-8*d); }
      const ics=[m.status.poison&&'i_poison',m.status.burn&&'i_burn',m.status.bleed&&'i_bleed',m.status.stun&&'i_stun',m.status.root&&'i_root'].filter(Boolean); const isz=14*d; let ix=x+w/2-ics.length*isz/2;
      for(const n of ics){ const im=this.uiImg(n); if(im.complete&&im.naturalWidth) c.drawImage(im,ix,y+4*d,isz,isz); ix+=isz; }
      { const ps=m.status.poison?.length||0; const tg=[ps&&['−'+Math.min(30,ps*6)+'% dmg','#a6e86a'],m.status.weak&&['oslab','#c9a0ff'],m.status.fear&&['strach','#e0c0ff'],m.status.slow&&['pomalý','#9cc8ff']].filter(Boolean); if(tg.length){ c.font=`600 ${9*d}px sans-serif`; let tx2=x+w/2-(tg.length-1)*22*d; for(const [t,col] of tg){ c.fillStyle=col; c.fillText(t,tx2,y+(ics.length?28:14)*d); tx2+=44*d; } } }
      if(m.status.poison&&m.status.poison.length>1){ c.font=`700 ${10*d}px sans-serif`; c.fillStyle='#b8f08a'; c.fillText(m.status.poison.length,x+w/2-ics.length*isz/2+isz*0.9,y+18*d); } }
    for(const mn of g.minions){ if(mn.hp<=0||!g.isVis(mn.x,mn.y)) continue; const w=T*0.6*z, x=sx(mn.rx*T+T/2)-w/2, y=sy(mn.ry*T+T-T*0.95*(mn.sc||1))-6*d; c.fillStyle='rgba(0,0,0,0.7)'; c.fillRect(x-1,y-1,w+2,5*d); c.fillStyle='#7ee05a'; c.fillRect(x,y,w*Math.max(0,mn.hp/mn.maxhp),3*d); }
    // rune symbols
    for(const pr of g.props) if(pr.type==='rune'&&g.isVis(pr.x,pr.y)){ c.font=`700 ${20*d}px serif`; c.fillStyle=pr.on?'#bfe8ff':'rgba(200,210,230,0.55)'; c.fillText(pr.sym,sx(pr.x*T+T/2),sy(pr.y*T+T*0.45)); }
    for(const pr of g.props) if(pr.type==='communityNpc'&&!pr.deco&&g.isVis(pr.x,pr.y)){
      const x=sx((pr.x+0.5)*T), y=sy(pr.y*T)-9*d;
      c.font=`700 ${13*d}px "Alegreya Sans",sans-serif`;
      c.lineWidth=3*d; c.strokeStyle='#170f12'; c.fillStyle='#f2dcb0';
      c.strokeText(pr.label||pr.name,x,y); c.fillText(pr.label||pr.name,x,y);
    }
    // floating texts
    for(const t of g.texts){ const a=Math.min(1,t.life/t.max*1.6); const yy=t.y-(1-t.life/t.max)*T*0.9; c.globalAlpha=a; c.font=`800 ${Math.round(15*t.size*d)}px "Alegreya Sans",sans-serif`; c.lineWidth=3*d; c.strokeStyle='rgba(10,6,8,0.85)'; c.strokeText(t.text,sx(t.x),sy(yy)); c.fillStyle=t.color; c.fillText(t.text,sx(t.x),sy(yy)); }
    c.globalAlpha=1;
  }
  tick(g,dt){
    for(const f of g.fx){ f.life-=dt; if(f.type==='p'){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=40*dt; f.vx*=0.96; } }
    g.fx=g.fx.filter(f=>f.life>0);
    for(const t of g.texts) t.life-=dt; g.texts=g.texts.filter(t=>t.life>0);
    for(const p of g.projs) p.t+=dt; g.projs=g.projs.filter(p=>p.t<p.dur);
  }
}
