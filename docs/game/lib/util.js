// RNG, FOV (recursive shadowcasting), A* pathfinding, helpers
export class RNG{
  constructor(seed){ this.s=(seed>>>0)||0x9e3779b9; }
  next(){ let t=this.s+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }
  int(a,b){ return a+Math.floor(this.next()*(b-a+1)); }
  range(a,b){ return a+this.next()*(b-a); }
  pick(arr){ return arr[Math.floor(this.next()*arr.length)]; }
  chance(p){ return this.next()<p; }
  weighted(arr,wf){ let tot=0; for(const a of arr) tot+=wf(a); let r=this.next()*tot; for(const a of arr){ r-=wf(a); if(r<=0) return a; } return arr[arr.length-1]; }
  shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(this.next()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
}
export const rng=new RNG(Date.now());
export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const dist=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d)); // chebyshev
export const edist=(a,b,c,d)=>Math.hypot(a-c,b-d);

// shadowcasting: opaque(x,y)->bool, cb(x,y,dist)
const OCT=[[1,0,0,1],[0,1,1,0],[0,-1,1,0],[-1,0,0,1],[-1,0,0,-1],[0,-1,-1,0],[0,1,-1,0],[1,0,0,-1]];
export function fov(ox,oy,r,opaque,cb){
  cb(ox,oy,0);
  for(const m of OCT) castOct(ox,oy,r,opaque,cb,1,1.0,0.0,m);
}
function castOct(ox,oy,r,opaque,cb,row,start,end,[xx,xy,yx,yy]){
  if(start<end) return; let newStart=0; const r2=r*r;
  for(let j=row;j<=r;j++){
    let dx=-j-1, dy=-j, blocked=false;
    while(dx<=0){ dx++;
      const X=ox+dx*xx+dy*xy, Y=oy+dx*yx+dy*yy;
      const lS=(dx-0.5)/(dy+0.5), rS=(dx+0.5)/(dy-0.5);
      if(start<rS) continue; else if(end>lS) break;
      if(dx*dx+dy*dy<=r2) cb(X,Y,Math.sqrt(dx*dx+dy*dy));
      if(blocked){ if(opaque(X,Y)){ newStart=rS; continue; } else { blocked=false; start=newStart; } }
      else if(opaque(X,Y)&&j<r){ blocked=true; castOct(ox,oy,r,opaque,cb,j+1,start,lS,[xx,xy,yx,yy]); newStart=rS; }
    }
    if(blocked) break;
  }
}
export function los(x0,y0,x1,y1,opaque){
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, x=x0, y=y0;
  while(!(x===x1&&y===y1)){ const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} if(x===x1&&y===y1) break; if(opaque(x,y)) return false; }
  return true;
}
export function line(x0,y0,x1,y1){ const pts=[]; let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1, err=dx-dy, x=x0, y=y0;
  while(true){ pts.push([x,y]); if(x===x1&&y===y1) break; const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} } return pts; }
export const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
// A* 8-dir; passable(x,y), w,h ; returns [[x,y]...] excluding start
export function astar(sx,sy,tx,ty,w,h,passable,maxN=4000){
  const key=(x,y)=>y*w+x; const g=new Map(), from=new Map(); const open=[[0,sx,sy]]; g.set(key(sx,sy),0); let n=0;
  while(open.length&&n++<maxN){
    let bi=0; for(let i=1;i<open.length;i++) if(open[i][0]<open[bi][0]) bi=i; const [,x,y]=open.splice(bi,1)[0];
    if(x===tx&&y===ty){ const p=[]; let k=key(x,y); while(from.has(k)){ p.push([k%w,Math.floor(k/w)]); k=from.get(k);} return p.reverse(); }
    for(const [dx,dy] of DIRS8){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=w||ny>=h) continue;
      if(!(nx===tx&&ny===ty)&&!passable(nx,ny)) continue;
      if(dx&&dy&&(!passable(x+dx,y)||!passable(x,y+dy))) continue;
      const ng=g.get(key(x,y))+(dx&&dy?1.41:1); const k=key(nx,ny);
      if(!g.has(k)||ng<g.get(k)){ g.set(k,ng); from.set(k,key(x,y)); open.push([ng+Math.max(Math.abs(tx-nx),Math.abs(ty-ny)),nx,ny]); } }
  }
  return null;
}
export const fmt=n=>{ n=Math.round(n); if(Math.abs(n)<10000) return ''+n; const u=['k','M','B','T','Qa','Qi']; let i=-1; while(Math.abs(n)>=1000&&i<u.length-1){n/=1000;i++;} return n.toFixed(n<10?2:n<100?1:0)+u[i]; };
