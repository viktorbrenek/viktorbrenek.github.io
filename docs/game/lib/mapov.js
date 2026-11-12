// ARPG-style overlay map (Tab)
import {FLOOR} from './dungeon.js';
import {rarityColor} from './items.js';
const PROP={stairs:['#9df07a','▼'],riftexit:['#c58cff','◎'],rift:['#c58cff','◎'],pillar:['#7dff6a','✦'],merchant:['#f2d36b','$'],altar:['#c58cff','⛧'],shrine:['#8fd0ff','✚'],chest:['#e8c070','■'],cursed:['#ff6a5a','■'],lore:['#8fb8ff','ᚱ'],gate:['#d0b080','#'],obelisk:['#9cf','▲'],bellmaster:['#9ff','♪'],riddle:['#ddd','?'],brazier:['#ff9c4a','•'],lever:['#b0ff80','•'],rune:['#9cf','•'],grave:['#cfd8e6','✝'],well:['#b08cff','◍']};
export function drawMap(g,cv,time){
  const d=devicePixelRatio||1, W=innerWidth*d, H=innerHeight*d; if(cv.width!==W||cv.height!==H){ cv.width=W; cv.height=H; }
  const c=cv.getContext('2d'); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,H); const map=g.map; if(!map) return; const p=g.player;
  const s=Math.max(6,Math.min(15,Math.min(W/d/(map.W+6),H/d/(map.H+6))*1.6))*d; const ox=W/2-(p.rx+0.5)*s, oy=H/2-(p.ry+0.5)*s;
  c.fillStyle='rgba(4,3,2,0.32)'; c.fillRect(0,0,W,H);
  const MW=map.W, ex=g.explored, t=map.t; const isF=(x,y)=>x>=0&&y>=0&&x<MW&&y<map.H&&t[y*MW+x]===FLOOR;
  c.fillStyle='rgba(215,200,160,0.10)';
  for(let y=0;y<map.H;y++) for(let x=0;x<MW;x++){ const i=y*MW+x; if(ex[i]&&t[i]===FLOOR) c.fillRect(ox+x*s,oy+y*s,s+0.5,s+0.5); }
  c.strokeStyle='rgba(235,220,175,0.8)'; c.lineWidth=Math.max(1.2,s*0.14); c.lineCap='round'; c.beginPath();
  for(let y=0;y<map.H;y++) for(let x=0;x<MW;x++){ const i=y*MW+x; if(!ex[i]||t[i]!==FLOOR) continue; const X=ox+x*s, Y=oy+y*s;
    if(!isF(x,y-1)){ c.moveTo(X,Y); c.lineTo(X+s,Y); } if(!isF(x,y+1)){ c.moveTo(X,Y+s); c.lineTo(X+s,Y+s); } if(!isF(x-1,y)){ c.moveTo(X,Y); c.lineTo(X,Y+s); } if(!isF(x+1,y)){ c.moveTo(X+s,Y); c.lineTo(X+s,Y+s); } }
  c.stroke();
  // points of interest
  c.textAlign='center'; c.textBaseline='middle'; c.font=`800 ${Math.round(s*1.05)}px "Alegreya Sans",sans-serif`;
  for(const pr of g.props){ const P=PROP[pr.type]; if(!P||!(ex[pr.y*MW+pr.x]||pr.known)) continue; if(pr.type==='chest'&&pr.opened) continue; if((pr.type==='brazier'&&pr.lit)||(pr.type==='lever'&&pr.on)||(pr.type==='rune'&&pr.on)) continue;
    let col=P[0]; if(pr.type==='stairs'&&pr.locked) col='#ff6a5a'; if(pr.type==='pillar'&&pr.state==='done') col='#667'; if(pr.type==='lore'&&pr.read) col='#556';
    const X=ox+(pr.x+0.5)*s, Y=oy+(pr.y+0.5)*s; if(pr.type==='stairs'||pr.type==='rift'||pr.type==='riftexit'||pr.type==='pillar'){ c.fillStyle=col+'44'; c.beginPath(); c.arc(X,Y,s*(1.1+Math.sin(time*3)*0.15),0,7); c.fill(); }
    c.fillStyle='#000'; c.fillText(P[1],X+1,Y+1); c.fillStyle=col; c.fillText(P[1],X,Y); }
  if(map.stairs&&ex[map.stairs.y*MW+map.stairs.x]&&!g.props.some(q=>q.type==='stairs'||q.type==='riftexit')){ const X=ox+(map.stairs.x+0.5)*s, Y=oy+(map.stairs.y+0.5)*s; c.fillStyle=map.stairs.locked?'#ff6a5a':'#9df07a'; c.fillText('▼',X,Y); }
  // loot
  for(const gr of g.ground){ if(!ex[gr.y*MW+gr.x]||!g.lootOk(gr)) continue; const r=gr.item?.rarity; if(!gr.gold&&!(r==='rare'||r==='legendary'||r==='set'||r==='sporeborn'||gr.item?.type==='support'||gr.item?.type==='tome')) continue;
    c.fillStyle=gr.gold?'#f2d36b':gr.item.type==='support'?'#7fe0c9':gr.item.type==='tome'?'#b9f':rarityColor(r); c.beginPath(); c.arc(ox+(gr.x+0.5)*s,oy+(gr.y+0.5)*s,s*(r==='legendary'||r==='set'||r==='sporeborn'?0.38:0.24),0,7); c.fill(); }
  // creatures
  for(const m of g.monsters){ if(m.hp<=0||!g.canSee(m)) continue; const X=ox+(m.rx+0.5)*s, Y=oy+(m.ry+0.5)*s; const big=m.boss||m.unique;
    c.fillStyle=m.boss||m.unique?'#f08a3c':m.rarity==='rare'?'#f2d36b':m.rarity==='magic'?'#7fa8ff':'#ff4a3a'; c.beginPath(); c.arc(X,Y,s*(big?0.55:0.3),0,7); c.fill(); }
  for(const mn of g.minions||[]){ if(mn.hp<=0) continue; c.fillStyle='#7ee05a'; c.beginPath(); c.arc(ox+(mn.rx+0.5)*s,oy+(mn.ry+0.5)*s,s*0.26,0,7); c.fill(); }
  // player
  const X=ox+(p.rx+0.5)*s, Y=oy+(p.ry+0.5)*s; c.fillStyle='rgba(255,220,140,0.25)'; c.beginPath(); c.arc(X,Y,s*(1+Math.sin(time*4)*0.2),0,7); c.fill();
  c.fillStyle='#fff'; c.strokeStyle='#000'; c.lineWidth=2*d; c.beginPath(); c.arc(X,Y,s*0.42,0,7); c.fill(); c.stroke();
  // header
  c.font=`700 ${Math.round(22*d)}px "Grenze Gotisch",serif`; c.fillStyle='rgba(242,230,200,0.9)'; c.textAlign='center'; c.fillText(`Hloubka ${g.depth} · ${map.biome.name}${g.inRift?' · Zkažená jeskyně':''}${g.mapRun?' · '+(g.floorMods?.name||'Výtrusná mapa'):''}`,W/2,H-150*d);
  c.font=`600 ${Math.round(13*d)}px "Alegreya Sans",sans-serif`; c.fillStyle='rgba(200,190,170,0.75)'; c.fillText('▼ schody   ✝ hrob   ◍ studna   ✦ plodnice   ◎ portál   $ překupník   ⛧ oltář   ■ truhla   ᚱ lore   ● nepřátelé   [Tab] zavřít',W/2,H-126*d);
}
