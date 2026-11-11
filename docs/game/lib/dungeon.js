import {DIRS8,RNG} from './util.js';
import {ANGEL_CITY,biomeFor,RIDDLES} from './data.js';
import {communityEncounter,communityRoom} from './community.js';
export const WALL=0, FLOOR=1;
const RUNES=['ᚱ','ᚦ','ᛟ','ᛉ','ᚨ','ᛃ'];
export function generate(depth, seed, opt={}){
  const R=new RNG(seed); const W=58, H=42;
  const city=opt.city!==false&&!opt.rift&&depth>=21&&depth<=25;
  const biome=city?ANGEL_CITY:biomeFor(depth);
  const t=new Uint8Array(W*H); const fv=new Uint8Array(W*H); const room=new Int16Array(W*H).fill(-1);
  const I=(x,y)=>y*W+x; const inb=(x,y)=>x>0&&y>0&&x<W-1&&y<H-1;
  const rooms=[]; let tries=0;
  const target=R.int(11,15);
  if(city){
    for(let row=0;row<3;row++) for(let col=0;col<4;col++){
      const x=3+col*13+R.int(0,2), y=3+row*12+R.int(0,2);
      const w=R.int(7,10), h=R.int(6,8);
      rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1),id:rooms.length,cave:false});
    }
  }
  while(!city&&rooms.length<target&&tries++<600){
    const w=R.int(5,11), h=R.int(4,8), x=R.int(2,W-w-3), y=R.int(2,H-h-3);
    if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y)) continue;
    rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1),id:rooms.length,cave:opt.cave||(biome.id!=='halls'&&R.chance(0.45))});
  }
  for(const r of rooms){
    for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++){
      if(r.cave){ const dx=(x-r.x-(r.w-1)/2)/(r.w/2), dy=(y-r.y-(r.h-1)/2)/(r.h/2); if(dx*dx+dy*dy>1.05+R.range(-0.25,0.15)) continue; }
      t[I(x,y)]=FLOOR; room[I(x,y)]=r.id; }
    t[I(r.cx,r.cy)]=FLOOR;
  }
  // connect: MST by distance + extra loops
  const conn=new Set([0]), edges=[];
  while(conn.size<rooms.length){ let best=null;
    for(const a of conn) for(const b of rooms) if(!conn.has(b.id)){ const d=Math.abs(rooms[a].cx-b.cx)+Math.abs(rooms[a].cy-b.cy); if(!best||d<best[2]) best=[a,b.id,d]; }
    conn.add(best[1]); edges.push(best); }
  for(let k=0;k<3;k++){ const a=R.int(0,rooms.length-1), b=R.int(0,rooms.length-1); if(a!==b) edges.push([a,b,0]); }
  for(const [a,b] of edges){ let {cx:x,cy:y}=rooms[a]; const {cx:tx,cy:ty}=rooms[b]; const hf=R.chance(0.5); const wide=R.chance(0.2);
    const carve=(x,y)=>{ if(inb(x,y)) t[I(x,y)]=FLOOR; if(wide&&inb(x+1,y+1)) t[I(x+1,y+1)]=FLOOR; };
    if(hf){ while(x!==tx){ carve(x,y); x+=Math.sign(tx-x);} while(y!==ty){ carve(x,y); y+=Math.sign(ty-y);} }
    else { while(y!==ty){ carve(x,y); y+=Math.sign(ty-y);} while(x!==tx){ carve(x,y); x+=Math.sign(tx-x);} }
    carve(x,y); }
  // floor variation: per-room base + scatter
  // one texture per room (a or c), corridors use b → no per-tile texture switching
  const roomTex=rooms.map(()=>R.chance(0.62)?0:2);
  for(let i=0;i<W*H;i++) if(t[i]){ const r=room[i]; fv[i]=r>=0&&r<rooms.length?roomTex[r]:r===999?2:1; }
  // BFS distances from start
  const start=rooms[0];
  const bfs=(sx,sy)=>{ const d=new Int32Array(W*H).fill(-1); const q=[[sx,sy]]; d[I(sx,sy)]=0; for(let qi=0;qi<q.length;qi++){ const [x,y]=q[qi]; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx,ny=y+dy; if(t[I(nx,ny)]&&d[I(nx,ny)]<0){ d[I(nx,ny)]=d[I(x,y)]+1; q.push([nx,ny]); } } } return d; };
  const dist=bfs(start.cx,start.cy);
  let far=rooms[1]; for(const r of rooms) if(dist[I(r.cx,r.cy)]>dist[I(far.cx,far.cy)]) far=r;
  const props=[]; const occ=new Set(); const put=(p)=>{ props.push(p); if(p.block) occ.add(I(p.x,p.y)); return p; };
  const free=(x,y)=>t[I(x,y)]===FLOOR&&!occ.has(I(x,y))&&!(x===start.cx&&y===start.cy)&&Math.max(Math.abs(x-far.cx),Math.abs(y-far.cy))>1;
  const interior=(x,y)=>{ for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(!t[I(x+dx,y+dy)]) return false; return true; };
  const randIn=(r,f=()=>true)=>{ for(let k=0;k<60;k++){ const x=R.int(r.x,r.x+r.w-1), y=R.int(r.y,r.y+r.h-1); if(free(x,y)&&f(x,y)) return [x,y]; } return null; };
  const boss=depth%5===0&&!opt.rift;
  const stairs=put({type:'stairs',x:far.cx,y:far.cy,spr:'stairs',block:false,locked:boss});
  occ.add(I(far.cx,far.cy));
  // vault
  let vault=null;
  for(let k=0;k<80&&!vault&&!opt.rift;k++){
    const r=R.pick(rooms.slice(1)); const side=R.int(0,3); const vw=R.int(4,6), vh=R.int(3,4);
    let dx,dy,vx,vy;
    if(side===0){ dx=R.int(r.x+1,r.x+r.w-2); dy=r.y-1; vx=dx-(vw>>1); vy=dy-vh; }
    else if(side===1){ dx=R.int(r.x+1,r.x+r.w-2); dy=r.y+r.h; vx=dx-(vw>>1); vy=dy+1; }
    else if(side===2){ dy=R.int(r.y+1,r.y+r.h-2); dx=r.x-1; vx=dx-vw; vy=dy-(vh>>1); }
    else { dy=R.int(r.y+1,r.y+r.h-2); dx=r.x+r.w; vx=dx+1; vy=dy-(vh>>1); }
    if(vx<2||vy<2||vx+vw>W-2||vy+vh>H-2) continue;
    if(t[I(dx,dy)]||!t[I(side<2?dx:dx+(side===2?1:-1), side<2?dy+(side===0?1:-1):dy)]) continue;
    let ok=true; for(let y=vy-1;y<=vy+vh&&ok;y++) for(let x=vx-1;x<=vx+vw&&ok;x++) if(t[I(x,y)]) ok=false;
    // door neighbors besides inward/outward must be wall
    if(!ok) continue;
    for(let y=vy;y<vy+vh;y++) for(let x=vx;x<vx+vw;x++){ t[I(x,y)]=FLOOR; fv[I(x,y)]=0; room[I(x,y)]=999; }
    t[I(dx,dy)]=FLOOR; vault={x:vx,y:vy,w:vw,h:vh,door:[dx,dy],from:r.id};
  }
  let puzzle=null;
  if(vault){
    put({type:'gate',x:vault.door[0],y:vault.door[1],spr:'gate',block:true,opaque:true});
    const cx=vault.x+(vault.w>>1), cy=vault.y+(vault.h>>1);
    put({type:'chest',x:cx,y:cy,spr:'chest',block:true,vault:true});
    put({type:'torch',x:vault.x,y:vault.y,spr:'glowshroom_big',block:false,light:[0.9,0.85,0.5],lr:5,deco:true});
    const kinds=['levers','braziers','runes','plates','bells','riddle']; const kind=R.pick(kinds);
    const others=R.shuffle(rooms.slice(1).filter(r=>r.id!==vault.from));
    puzzle={kind,done:false,vault};
    if(kind==='levers'){ const n=R.int(2,3); puzzle.need=n; puzzle.count=0;
      for(let k=0;k<n&&k<others.length;k++){ const p=randIn(others[k],interior); if(p) put({type:'lever',x:p[0],y:p[1],spr:'sack2',block:true,on:false}); else puzzle.need--; } }
    else if(kind==='braziers'){ const n=R.int(3,4); puzzle.need=n; puzzle.count=0;
      for(let k=0;k<n&&k<others.length;k++){ const p=randIn(others[k],interior); if(p) put({type:'brazier',x:p[0],y:p[1],spr:'brazier',block:true,lit:false}); else puzzle.need--; } }
    else { const r=others[0]; const n=R.int(3,4); const syms=R.shuffle(RUNES.slice()).slice(0,n); const order=R.shuffle(syms.slice());
      puzzle.order=order; puzzle.step=0;
      for(const s of syms){ const p=randIn(r,interior); if(p) put({type:'rune',x:p[0],y:p[1],spr:R.chance(0.5)?'rune_a':'rune_b',block:true,sym:s,on:false}); }
      const o=randIn(others[1]||r,interior); if(o) put({type:'obelisk',x:o[0],y:o[1],spr:'obelisk',block:true,text:order.join(' → ')});
      puzzle.need=order.length; }
    if(kind==='plates'){ const r=others.slice().sort((a,b)=>b.w*b.h-a.w*a.h)[0]; const n=R.int(3,4); puzzle.need=n; puzzle.window=n+3; puzzle.plates=[];
      for(let k=0;k<n;k++){ const p=randIn(r); if(p){ const pl=put({type:'plate',x:p[0],y:p[1],spr:'decal_14',flat:true,lit:0}); puzzle.plates.push(pl); occ.add(I(p[0],p[1])); } }
      puzzle.need=puzzle.plates.length; }
    else if(kind==='bells'){ const r=others[0]; const n=4; puzzle.crystals=[];
      for(let k=0;k<n;k++){ const p=randIn(r,interior); if(p) puzzle.crystals.push(put({type:'crystal',x:p[0],y:p[1],spr:k%2?'crystal_violet':'crystal_green',block:true,idx:k,light:null})); }
      const m=randIn(r,interior)||randIn(others[1]||r,interior); if(m) put({type:'bellmaster',x:m[0],y:m[1],spr:'obelisk',block:true});
      puzzle.order=Array.from({length:R.int(4,5)},()=>R.int(0,puzzle.crystals.length-1)); puzzle.step=0; puzzle.need=puzzle.order.length; }
    else if(kind==='riddle'){ const r=others[0]; const rd=R.pick(RIDDLES); puzzle.riddle=rd; const answers=R.shuffle([rd.a,...rd.w]);
      const g=randIn(r,interior); if(g) put({type:'riddle',x:g[0],y:g[1],spr:'grave',block:true,q:rd.q});
      for(const a of answers){ const p=randIn(r,interior); if(p) put({type:'answer',x:p[0],y:p[1],spr:'rune_b',block:true,ans:a,correct:a===rd.a}); }
      puzzle.need=1; }
  }
  // extras: lore inscription, season pillar, rift portal, merchant
  const extraRoom=()=>R.pick(rooms.slice(1).filter(r=>r!==far));
  if(!opt.rift&&R.chance(0.6)){ for(let k=0;k<(R.chance(0.3)?2:1);k++){ const p=randIn(extraRoom(),interior); if(p) put({type:'lore',x:p[0],y:p[1],spr:'tomb',block:true,read:false,light:[0.55,0.7,0.9],lr:2}); } }
  if(!opt.rift&&depth>=2&&R.chance(0.42)){ const p=randIn(extraRoom(),interior); if(p) put({type:'pillar',x:p[0],y:p[1],spr:'glowshroom_big',block:true,state:'idle',light:[0.5,1,0.45],lr:4}); }
  if(!opt.rift&&depth>=3&&!boss&&R.chance(0.35)){ const p=randIn(extraRoom(),interior); if(p) put({type:'rift',x:p[0],y:p[1],spr:'arch',block:true,light:[0.75,0.3,1],lr:5}); }
  if(opt.event==='merchant'){ const p=randIn(rooms[0],interior)||randIn(extraRoom(),interior); if(p) put({type:'merchant',x:p[0],y:p[1],spr:'npc_sage',block:true,light:[1,0.8,0.5],lr:3}); }
  if(opt.rift){ stairs.type='riftexit'; stairs.spr='arch_broken'; stairs.locked=true; stairs.light=[0.75,0.3,1]; stairs.lr=4; }
  // wall torches: wall tile with floor below
  const lights=[];
  for(const r of rooms){ if(!R.chance(r.id===0?1:0.7)) continue;
    for(let k=0;k<20;k++){ const x=R.int(r.x,r.x+r.w-1), y=r.y-1; if(!t[I(x,y)]&&t[I(x,y+1)]&&!t[I(x,y-1)]){ put({type:'walltorch',x,y,spr:'torch1',block:false,light:[1.0,0.55,0.22],lr:6,wall:true}); break; } } }
  // glow shrooms + decor
  for(const r of rooms){ const n=Math.floor(r.w*r.h/14)+R.int(0,2);
    for(let k=0;k<n;k++){ const p=randIn(r); if(!p) continue; const glow=R.chance(0.22);
      if(glow&&biome.shafts&&R.chance(0.6)){ const cand=R.chance(0.7); put({type:'glow',x:p[0],y:p[1],spr:cand?'cath_candelabra':'cath_reliquary',block:interior(p[0],p[1]),light:cand?[1,0.7,0.38]:[1,0.78,0.35],lr:cand?4:3,deco:true}); }
      else if(glow){ put({type:'glow',x:p[0],y:p[1],spr:R.pick(['glowshroom','deco_shroom12','deco_shroom10']),block:false,light:R.pick([[0.55,0.9,0.4],[0.5,0.7,1.0],[0.85,0.5,1.0]]),lr:3,deco:true}); }
      else { const blocky=interior(p[0],p[1])&&R.chance(0.35); const spr=R.pick(biome.deco); put({type:'deco',x:p[0],y:p[1],spr,block:blocky&&['pillar','pillars','barrels','crate','deadtree','stump','stump2','grave','obelisk','bench','cath_pew','cath_pew_broken','cath_candelabra','cath_pillar','cath_statue','cath_lectern','cath_sarcophagus','cath_organ','cath_reliquary','cath_bell'].includes(spr),deco:true}); } } }
  // pools
  for(let k=0;k<R.int(1,4);k++){ const r=R.pick(rooms.slice(1)); const p=randIn(r); if(p) put({type:'pool',x:p[0],y:p[1],spr:biome.id==='drowned'?'pool_water':'pool_poison',block:false,hazard:biome.id!=='drowned',flat:true}); }
  // chests, altar, shrine
  for(let k=0;k<R.int(1,3);k++){ const r=R.pick(rooms.slice(1)); const p=randIn(r,interior); if(p) put({type:'chest',x:p[0],y:p[1],spr:R.chance(0.7)?'crate':'barrels',block:true,small:true}); }
  if(boss||R.chance(0.45)){ const r=R.pick(rooms.slice(1)); const p=randIn(r,interior); if(p) put({type:'altar',x:p[0],y:p[1],spr:'altar',block:true,light:[0.6,1,0.5],lr:3}); }
  if(R.chance(0.5)){ const r=R.pick(rooms.slice(1)); const p=randIn(r,interior); if(p) put({type:'shrine',x:p[0],y:p[1],spr:'shrine',block:true,used:false,light:[0.7,0.5,1],lr:3}); }
  // cathedral: coloured light falling through unseen stained-glass windows
  if(biome.shafts) for(const r of rooms){ if(r.w*r.h<16||!R.chance(0.75)) continue; for(let k=0;k<(r.w*r.h>40?2:1);k++){ const p=randIn(r); if(!p||props.some(q=>q.x===p[0]&&q.y===p[1])) continue;
    const col=R.pick([[0.95,0.3,0.32],[0.35,0.5,1.0],[1.0,0.78,0.3],[0.45,0.95,0.55],[0.75,0.4,1.0]]); props.push({type:'shaft',x:p[0],y:p[1],spr:R.chance(0.5)?'decal_28':'decal_32',flat:true,decal:true,rot:R.range(0,6.28),sc:0.85,ox:0,oy:0,flip:false,shaft:true,light:col.map(v=>v*1.6),lr:4,ph:R.range(0,6.28)}); } }
  // floor decals (flat, non-blocking) to break texture repetition
  const ROT=new Set([0,1,2,3,4,7,9,12,14,20,21,22,25,28,31,32,36,38,39,41,42]);
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){ const i=I(x,y); if(!t[i]) continue; const inRoom=room[i]>=0;
    if(R.chance((inRoom?0.085:0.04)*(biome.shafts?1.25:1))&&!props.some(p=>p.x===x&&p.y===y)){ const di=R.pick(biome.decals); props.push({type:'decal',x,y,spr:'decal_'+di,flat:true,decal:true,rot:ROT.has(di)?R.range(0,6.28):0,sc:R.range(0.55,0.9),ox:R.range(-0.18,0.18),oy:R.range(-0.18,0.18),flip:R.chance(0.5)}); } }
  // monster spawn points
  const spawns=[];
  const dens=depth<=1?24:depth<=3?20:17;
  const ambP=depth<2?0:(opt.ambush??0.22);
  for(const r of rooms){ if(r.id===0) continue; const area=r.w*r.h; let n=Math.round(area/dens+R.range(0,1.4)); if(boss&&r===far) n=Math.max(1,n-1);
    const amb=!(boss&&r===far)&&R.chance(ambP);
    const pts=[]; for(let k=0;k<n;k++){ const p=randIn(r,(x,y)=>!(x===far.cx&&y===far.cy)); if(p){ pts.push(p); occ.add(I(p[0],p[1])); } }
    spawns.push({room:r.id,pts,boss:boss&&r===far,ambush:amb,n:Math.max(3,n+1)}); }
  // events
  const ev=opt.event; let evData=null;
  if(ev==='nest'||ev==='cursed'){ const cand=rooms.slice(1).filter(r=>r!==far); const r=R.pick(cand); const p=randIn(r,interior);
    if(p){ put(ev==='nest'?{type:'nest',x:p[0],y:p[1],spr:'shroom_house2',block:true,hp:1,light:[0.6,1,0.3],lr:4,timer:0}:{type:'cursed',x:p[0],y:p[1],spr:'chest',block:true,light:[0.9,0.2,0.3],lr:4}); evData={x:p[0],y:p[1],room:r.id}; } }
  if(ev==='blackout') for(const p of props) if(p.type==='walltorch'){ p.dead=true; delete p.light; }
  // safety: stairs must always be reachable from the start (blocking props must never wall them in)
  const reach=(encounter)=>{ const blk=new Set(props.filter(p=>p.block&&p.type!=='gate').map(p=>I(p.x,p.y))); const seen=new Uint8Array(W*H), q=[I(start.cx,start.cy)]; seen[q[0]]=1;
    while(q.length){ const c=q.pop(), x=c%W, y=(c/W)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const n=I(x+dx,y+dy); if(!seen[n]&&t[n]===FLOOR&&!blk.has(n)){ seen[n]=1; q.push(n); } } }
    return seen[I(stairs.x,stairs.y)]===1&&(!encounter||DIRS8.some(([dx,dy])=>seen[I(encounter.x+dx,encounter.y+dy)])); };
  if(!reach()){ for(const p of props) if(p.block&&(p.deco||p.type==='deco')) p.block=false; }
  if(!reach()){ for(const p of props) if(p.block&&p.type!=='gate'&&Math.max(Math.abs(p.x-stairs.x),Math.abs(p.y-stairs.y))<=2){ const n=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[0,2],[-2,0],[0,-2]].map(([dx,dy])=>[p.x+dx*2,p.y+dy*2]).find(([x,y])=>t[I(x,y)]===FLOOR&&!props.some(o=>o.x===x&&o.y===y)&&Math.max(Math.abs(x-stairs.x),Math.abs(y-stairs.y))>2); if(n){ p.x=n[0]; p.y=n[1]; } else p.block=false; } }
  if(!reach()){ for(const p of props) if(p.block&&p.type!=='gate') p.block=false; }
  const map={W,H,t,fv,room,rooms,start:[start.cx,start.cy],stairs,props,spawns,puzzle,biome,depth,boss,vault,event:ev,evData};
  if(opt.community&&!opt.rift){
    const npc=communityEncounter(opt.characterSeed??seed,depth,opt.completedEncounters);
    if(npc){
      const cells=[];
      for(let y=2;y<H-2;y++) for(let x=2;x<W-2;x++){
        const id=room[I(x,y)];
        if(id<=0||id>=rooms.length||id===far.id||dist[I(x,y)]<15||Math.max(Math.abs(x-start.cx),Math.abs(y-start.cy))<9||!free(x,y)||!interior(x,y)) continue;
        if(!props.some(p=>p.x===x&&p.y===y&&!p.decal)) cells.push([x,y]);
      }
      for(const [x,y] of R.shuffle(cells)){
        const prop=put({type:'communityNpc',x,y,block:true,light:[0.75,0.85,1],lr:2,...npc});
        if(!reach(prop)){ props.pop(); occ.delete(I(x,y)); continue; }
        if(npc.area){
          const top=H+2, side=communityRoom(npc.area,Math.floor(W/2),top);
          map.H=Math.max(...side.tiles.map(([,sy])=>sy))+2;
          map.t=new Uint8Array(W*map.H); map.t.set(t);
          map.fv=new Uint8Array(W*map.H); map.fv.set(fv);
          map.room=new Int16Array(W*map.H).fill(-1); map.room.set(room);
          for(const [sx,sy] of side.tiles){ map.t[I(sx,sy)]=FLOOR; map.fv[I(sx,sy)]=Math.abs(sx+sy)%3; }
          map.community={...side,top,entry:prop};
          props.push(...side.props);
        }
        break;
      }
    }
    if(city){
      for(const [dx,dy] of DIRS8){
        const x=stairs.x+dx, y=stairs.y+dy;
        if(t[I(x,y)]!==FLOOR||props.some(p=>p.x===x&&p.y===y&&!p.decal)) continue;
        props.push({type:'communityNpc',action:'cityBell',name:'Poslední městský zvon',x,y,block:true,spr:'cath_bell',light:[0.74,0.66,1],lr:3});
        if(reach()) break;
        props.pop();
      }
    }
  }
  return map;
}
