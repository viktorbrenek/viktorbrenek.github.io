// Paper-doll hero rig: hand-drawn body parts (head, body, arms, legs) + equipped weapon / offhand / helm,
// animated procedurally (idle, walk, swing, shoot, cast, hurt). Units = original part pixels.
const P=(cls,leg,arm,body,armAt,legAt)=>({head:`rig_${cls}_hlava`,body:`rig_${cls}_body`,arm:`rig_${arm}`,leg:`rig_${leg}`,bodyAt:body,armAt,legAt});
const NL='noha_vsichni_krom_strazce';
export const RIGS={
  blade:   P('sermir',NL,'ruka_sermir_strazce_plodonos',[0,30.8],[32.3,30.8],[23,64]),
  warden:  P('strazce','noha_strazce','ruka_sermir_strazce_plodonos',[-0.3,31.1],[31.7,30.8],[22.9,64.5]),
  myco:    P('mykomant',NL,'ruka_mykomant',[-3,31.1],[31.7,31.1],[21,64]),
  ranger:  P('hunter',NL,'ruka_hunter',[-0.6,12.2],[32,30.8],[22.9,64.5]),
  summoner:P('plodonos',NL,'ruka_sermir_strazce_plodonos',[-3.4,31.1],[31.7,31.1],[21,64]),
  shifter: P('menavec',NL,'ruka_menavec',[-2.7,30.8],[32.3,30.8],[21,64]),
};
const FOOT=99, CX=25;
const ARM={w:29,h:49,sh:[10,9],hand:[19,42]}, LEG={w:28,h:35,hip:[14,5]};
const WEAP={sword:52,sword2:52,axe:50,axe2:54,club:52,club2:52,club3:56,dagger_r:38,dagger_p:40,spear:90,staff_moss:84,staff_green:84,staff_crystal:86,staff_purple:84,staff_shroom:80,staff_red:84,wand_shroom:52,bow:58,crossbow:52,crossbow2:52,q_blade:46,q_blade_held:46,q_scepter:86,q_scepter_held:86};
// helm item sprite -> hand-drawn hat; [hat, bottom of hat as fraction of head height]
const HATMAP={helm_red:'hat_slice1',helm_brown:'hat_slice4',helm_purple:'hat_slice9',helm_tan:'hat_slice14',helm_violet:'hat_slice12',helm_rust:'hat_slice5',helm_purple2:'hat_slice13',q_crown:'q_crown',eg_seedcrown:'eg_seedcrown'};
const HATFIT={hat_slice1:0.5,hat_slice2:1.04,hat_slice3:0.42,hat_slice4:0.45,hat_slice5:0.45,hat_slice6:0.98,hat_slice7:0.8,hat_slice8:0.42,hat_slice9:0.45,hat_slice10:0.45,hat_slice11:1.04,hat_slice12:0.98,hat_slice13:0.5,hat_slice14:0.72,hat_slice15:1.0,q_crown_worn:0.5,eg_seedcrown_worn:0.55,q_crown:0.66,eg_seedcrown:0.42};
const BOWS=new Set(['bow','crossbow','crossbow2']);
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
export function animTick(e,dt){
  const mv=Math.hypot(e.x-e.rx,e.y-e.ry); e._mv=(e._mv||0)+((mv>0.02?1:0)-(e._mv||0))*Math.min(1,dt*12);
  e._wp=(e._wp||0)+dt*15*Math.min(1,e._mv*1.5);
  if(e.anim){ e.anim.t+=dt/(e.anim.dur||0.32); if(e.anim.t>=1) e.anim=null; }
  if(e._hurt>0) e._hurt=Math.max(0,e._hurt-dt*3);
}
// draw the rig. bx,by = world foot point, k = world px per unit, mirror = face right
export function drawRig(R,e,g,bx,by,k,time,tint,rigId=e.cls,eq=e.equip||{}){
  const rig=RIGS[rigId]; if(!rig) return false; const size=n=>{ const s=R.meta.s[n]; return s?[s[2]/2,s[3]/2]:[0,0]; };
  const M=!e.flip; // native art faces left; e.flip=true means facing left
  const alt=(n,suf)=>n&&R.meta.s[n+suf]?n+suf:n;
  const art=(part)=>{ const n=`rig_art_${rigId}_${part}`; return rigId===e.cls&&R.meta.s[n]?n:rig[part]; };
  const headName=art('head'), bodyName=art('body'), armName=art('arm'), legName=art('leg');
  const worn=(slot)=>{ const spr=eq[slot]?.spr; return spr&&R.meta.s[spr+'_worn']?spr+'_worn':null; };
  const chest=worn('chest')||bodyName, leg=worn('boots')||legName, gloves=worn('gloves');
  const glovedArm=gloves&&`${armName}_${gloves}`;
  const arm=R.meta.s[glovedArm]?glovedArm:armName;
  const wspr=alt(eq.weapon?.spr,'_held'), ospr=alt(eq.offhand?.spr,'_held'), off=eq.offhand?.base;
  const hspr=eq.helm?.spr;
  // ---- animation parameters ----
  const wp=e._wp||0, mv=e._mv||0, sw=Math.sin(wp);
  let bob=-Math.abs(sw)*2.6*mv + Math.sin(time*3)*0.5*(1-mv), lean=0;
  // weapon held in the FAR (forward) hand, pointing forward and slightly up – never across the face
  let aNear=-sw*0.32*mv+Math.sin(time*2.1)*0.04, aFar=sw*0.28*mv-Math.sin(time*2.1)*0.04+0.25, lNear=sw*0.45*mv, lFar=-sw*0.45*mv, phi=-1.2+sw*0.06*mv+Math.sin(time*2.1)*0.03, headR=0, bowR=0;
  const an=e.anim||(e.lunge?{k:'swing',t:e.lunge.t}:null);
  if(an){ const t=an.t;
    if(an.k==='swing'){ if(t<0.3){ const u=ease(t/0.3); aFar=0.25-0.9*u; phi=-1.2+1.5*u; } else if(t<0.65){ const u=ease((t-0.3)/0.35); aFar=-0.65+2.05*u; phi=0.3-2.6*u; } else { const u=ease((t-0.65)/0.35); aFar=1.4-1.15*u; phi=-2.3+1.1*u; } lean=-3*Math.sin(Math.PI*t); }
    else if(an.k==='shoot'){ const u=Math.sin(Math.PI*Math.min(1,t*1.4)); aFar=0.25+1.25*u; aNear=0.9*u; bowR=-1.1*u; lean=2*Math.sin(Math.PI*t); }
    else if(an.k==='cast'){ const u=Math.sin(Math.PI*t); aNear=-2.1*u; aFar=0.25+1.9*u; phi=-1.2+0.9*u; headR=-0.1*u; bob-=3*u; }
    else if(an.k==='summon'){ const u=Math.sin(Math.PI*t); aNear=-2.5*u; aFar=0.25+2.3*u; phi=-1.2+1.0*u; bob-=5*u; }
  }
  const hurt=e._hurt||0; lean+=hurt*4;
  const body=size(bodyName), head=size(headName);
  // ---- part drawing helper (local unmirrored coords; pivot in displayed part coords) ----
  const part=(n,lx,ly,w,h,o={})=>{ if(!R.meta.s[n]) return; const a=o.rot||0, px=o.pv?o.pv[0]:w/2, py=o.pv?o.pv[1]:h/2;
    const Px=lx+px, Py=ly+py, dx=w/2-px, dy=h/2-py, c=Math.cos(a), s=Math.sin(a);
    let cx=Px+dx*c-dy*s, cy=Py+dx*s+dy*c; cx+=lean; cy+=bob*(o.noBob?0:1);
    const fl=!!o.flip!==M; const X=bx+(M?CX-cx:cx-CX)*k, Y=by-(FOOT-cy)*k;
    R.sprite(n,X-w*k/2,Y-h*k/2,w*k,h*k,{rot:M?-a:a,flip:fl,tint:o.tint||tint,sub:o.sub}); };
  const rotP=(px,py,ox,oy,a)=>{ const dx=px-ox, dy=py-oy, c=Math.cos(a), s=Math.sin(a); return [ox+dx*c-dy*s, oy+dx*s+dy*c]; };
  const fitted=(n,x,y,length,o={})=>{
    const [iw,ih]=size(n), edge=Math.max(iw,ih); if(!edge) return;
    const w=length*iw/edge, h=length*ih/edge;
    part(n,x-w/2,y-h/2,w,h,o);
  };
  const dark=[tint[0]*0.72,tint[1]*0.72,tint[2]*0.74];
  const [ax,ay]=rig.armAt, [lx,ly]=rig.legAt, [bxx,byy]=rig.bodyAt;
  const farArmX=bxx-11, farLegX=lx-15;
  const legLayer=(x,angle,far)=>{
    const legacy=leg===rig.leg;
    const [w,h]=legacy?[LEG.w,LEG.h]:size(leg);
    // Both new legs use the same facing. Their atlas midpoint is the hip.
    const hipX=w/2;
    part(leg,x+LEG.hip[0]-hipX,ly,w,h,{
      flip:far||!legacy,pv:[hipX,LEG.hip[1]],rot:angle,tint:far?dark:tint,noBob:true,
    });
  };
  const armLayer=(x,angle,flip,shade,ring)=>{
    const shoulder=flip?ARM.w-ARM.sh[0]:ARM.sh[0];
    const hand=flip?ARM.w-ARM.hand[0]:ARM.hand[0];
    part(arm,x,ay,ARM.w,ARM.h,{flip,pv:[shoulder,ARM.sh[1]],rot:angle,tint:shade});
    const [hx,hy]=rotP(x+hand,ay+ARM.hand[1],x+shoulder,ay+ARM.sh[1],angle);
    fitted(eq[ring]?.spr,hx,hy,6,{flip,rot:angle,tint:shade});
    return [hx,hy];
  };
  // far leg
  legLayer(farLegX,lFar,true);
  // quiver on the back
  if(ospr&&off==='quiver'){ const s0=size(ospr); const mx=Math.max(s0[0],s0[1])||1; const sz=34; part(ospr,bxx+30,byy-12,sz*s0[0]/mx,sz*s0[1]/mx,{rot:0.35}); }
  // weapon shares the animated pivot of the far hand
  const [hx,hy]=armLayer(farArmX,aFar,true,dark,'ring2');
  if(wspr){ const s0=size(wspr); const mx=Math.max(s0[0],s0[1])||1; const L=WEAP[wspr]||WEAP[eq.weapon.spr]||54; const w=L*s0[0]/mx, h=L*s0[1]/mx;
    const bow=BOWS.has(eq.weapon.spr);
    if(bow){ const gx=w*0.5, gy=h*0.5; part(wspr,hx-gx,hy-gy,w,h,{flip:true,pv:[gx,gy],rot:-0.78+0.45+bowR}); }
    else { const gx=w*0.76, gy=h*0.76; part(wspr,hx-gx,hy-gy,w,h,{flip:true,pv:[gx,gy],rot:phi+0.785}); } }
  // near leg, body, head, helm (only the cap of the helm, so the face stays visible)
  legLayer(lx,lNear,false);
  part(chest,bxx,byy,body[0],body[1]);
  fitted(eq.amulet?.spr,bxx+body[0]*0.54,Math.max(byy+body[1]*0.49,head[1]+6),12);
  part(headName,0,0,head[0],head[1],{rot:headR,pv:[head[0]*0.5,head[1]*0.9]});
  const baseHat=hspr&&(hspr.startsWith('hat_')||hspr.endsWith('_worn')?hspr:HATMAP[hspr]);
  const hat=rigId===e.cls?alt(baseHat||hspr,'_worn'):baseHat;
  if(hat&&R.meta.s[hat]){
    const [w,h]=size(hat), fit=HATFIT[hat]??HATFIT[baseHat]??0.5;
    part(hat,head[0]*0.5-w/2,head[1]*fit-h,w,h,{rot:headR,pv:[w/2,h+head[1]*(0.9-fit)]});
  }
  // near arm, offhand item held in front of it
  const [nearX,nearY]=armLayer(ax,aNear,false,tint,'ring1');
  if(ospr&&off!=='quiver'){
    const [iw,ih]=size(ospr), edge=Math.max(iw,ih)||1;
    const shield=eq.offhand.spr.startsWith('shield_'), hanging=eq.offhand.spr.startsWith('lantern');
    const length=shield?34:24, w=length*iw/edge, h=length*ih/edge;
    part(ospr,nearX-w/2,nearY-h*(hanging?0.15:0.5),w,h,{rot:aNear*0.3});
  }
  return true;
}

// ---- v13: animated beasts (monsters bear/boar/fly) + standing shapeshift forms. Units = original part px, y relative to foot (0), x relative to centre ----
export const BEASTS={"bear4":{"H":118,"parts":[{"n":"bst_bear_nohy","x":5.0,"y":-59,"w":28,"h":55,"r":"leg","pv":[14,5],"a0":0.2094,"far":1,"ph":0},{"n":"bst_bear_nohy","x":-47.0,"y":-57,"w":28,"h":55,"r":"leg","pv":[14,5],"a0":0.2094,"far":1,"ph":3.14},{"n":"bst_bear_body","x":-44.0,"y":-105,"w":103,"h":89,"r":"body","pv":[51.5,44.5]},{"n":"bst_bear_nohy","x":-25.0,"y":-55,"w":28,"h":55,"r":"leg","pv":[14,5],"a0":0.2094,"ph":0},{"n":"bst_bear_nohy","x":27.0,"y":-59,"w":28,"h":55,"r":"leg","pv":[14,5],"ph":3.14},{"n":"bst_bear_ocas","x":45.0,"y":-73,"w":39,"h":36,"r":"tail","pv":[3,5]},{"n":"bst_bear_hlava","x":-84.0,"y":-118,"w":86,"h":68,"r":"head","pv":[43.0,54.400000000000006]}]},"boar4":{"H":97,"parts":[{"n":"bst_kanec_predni_noha","x":-33.0,"y":-41,"w":21,"h":38,"r":"leg","pv":[10,4],"far":1,"ph":3.14},{"n":"bst_kanec_zadni_noha","x":0.0,"y":-56,"w":28,"h":51,"r":"leg","pv":[14,5],"far":1,"ph":0},{"n":"bst_kanec_body","x":-42.0,"y":-97,"w":89,"h":76,"r":"body","pv":[44.5,38.0]},{"n":"bst_kanec_predni_noha","x":-13.0,"y":-38,"w":21,"h":38,"r":"leg","pv":[10,4],"ph":0},{"n":"bst_kanec_zadni_noha","x":19.0,"y":-52,"w":28,"h":51,"r":"leg","pv":[14,5],"ph":3.14},{"n":"bst_kanec_ocas","x":33.0,"y":-67,"w":32,"h":42,"r":"tail","pv":[3,5]},{"n":"bst_kanec_hlava","x":-65.0,"y":-71,"w":54,"h":59,"r":"head","pv":[27.0,47.2]}]},"fly4":{"H":98,"parts":[{"n":"bst_mucha_velke_kridlo","x":-54.5,"y":-92,"w":53,"h":42,"r":"wing","pv":[4,32],"f":1},{"n":"bst_mucha_velke_kridlo","x":1.5,"y":-90,"w":53,"h":42,"r":"wing","pv":[4,32]},{"n":"bst_mucha_male_kridlo","x":-48.5,"y":-58,"w":38,"h":23,"r":"wing2","pv":[3,12],"f":1},{"n":"bst_mucha_male_kridlo","x":14.5,"y":-54,"w":38,"h":23,"r":"wing2","pv":[3,12]},{"n":"bst_mucha_nohy","x":-15.5,"y":-34,"w":24,"h":34,"r":"leg","pv":[6,2],"ph":0},{"n":"bst_mucha_nohy","x":2.5,"y":-35,"w":24,"h":34,"r":"leg","pv":[6,2],"a0":0.2094,"ph":3.14},{"n":"bst_mucha_nohy","x":14.5,"y":-36,"w":24,"h":34,"r":"leg","pv":[6,2],"ph":3.14},{"n":"bst_mucha_body","x":-12.5,"y":-62,"w":43,"h":43,"r":"body","pv":[21.5,21.5]},{"n":"bst_mucha_nohy","x":6.5,"y":-35,"w":24,"h":34,"r":"leg","pv":[6,2],"ph":3.14},{"n":"bst_mucha_hlava","x":-29.5,"y":-98,"w":53,"h":73,"r":"head","pv":[26.5,58.400000000000006]}]},"bearS":{"H":128,"parts":[{"n":"bst_bear_shapeshifting_noha","x":-24.0,"y":-37,"w":35,"h":37,"r":"leg","pv":[17,4],"ph":0},{"n":"bst_bear_shapeshifting_noha","x":1.0,"y":-37,"w":35,"h":37,"r":"leg","pv":[17,4],"f":1,"ph":3.14},{"n":"bst_bear_shapeshifting_ruka","x":-36.0,"y":-68,"w":28,"h":54,"r":"arm","pv":[14,6],"f":1,"far":1,"ph":3.14},{"n":"bst_bear_shapeshifting_body_standing","x":-27.0,"y":-87,"w":72,"h":70,"r":"body","pv":[36.0,35.0]},{"n":"bst_bear_hlava","x":-45.0,"y":-128,"w":86,"h":68,"r":"head","pv":[43.0,54.400000000000006]},{"n":"bst_bear_shapeshifting_ruka","x":14.0,"y":-71,"w":28,"h":54,"r":"arm","pv":[14,6],"ph":0.0}]},"boarS":{"H":122,"parts":[{"n":"bst_kanec_shapeshifting_leg","x":-30.0,"y":-36,"w":36,"h":36,"r":"leg","pv":[18,4],"ph":0},{"n":"bst_kanec_shapeshifting_leg","x":-4.0,"y":-36,"w":36,"h":36,"r":"leg","pv":[18,4],"f":1,"ph":0},{"n":"bst_kanec_shapeshifting_ruce","x":-40.0,"y":-68,"w":28,"h":54,"r":"arm","pv":[14,6],"f":1,"far":1,"ph":3.14},{"n":"bst_kanec_shapeshifting_body_standing","x":-28.0,"y":-97,"w":68,"h":78,"r":"body","pv":[34.0,39.0]},{"n":"bst_kanec_shapeshifting_ruce","x":9.0,"y":-70,"w":28,"h":54,"r":"arm","pv":[14,6],"ph":0.0},{"n":"bst_kanec_hlava","x":-39.0,"y":-122,"w":54,"h":59,"r":"head","pv":[27.0,47.2]}]},"flyS":{"H":149,"parts":[{"n":"bst_mucha_nohy","x":-22.0,"y":-34,"w":24,"h":34,"r":"leg","pv":[6,2],"a0":0.2094,"ph":0},{"n":"bst_mucha_nohy","x":-4.0,"y":-35,"w":24,"h":34,"r":"leg","pv":[6,2],"f":1,"a0":-0.3142,"ph":0},{"n":"bst_mucha_velke_kridlo","x":-59.0,"y":-109,"w":53,"h":42,"r":"wing","pv":[4,32],"f":1},{"n":"bst_mucha_velke_kridlo","x":6.0,"y":-108,"w":53,"h":42,"r":"wing","pv":[4,32]},{"n":"bst_mucha_male_kridlo","x":-48.0,"y":-79,"w":38,"h":23,"r":"wing2","pv":[3,12],"f":1,"a0":0.1047},{"n":"bst_mucha_male_kridlo","x":12.0,"y":-79,"w":38,"h":23,"r":"wing2","pv":[3,12],"a0":-0.1047},{"n":"bst_mucha_shapeshifting_body_standing","x":-29.0,"y":-83,"w":51,"h":57,"r":"body","pv":[25.5,28.5]},{"n":"bst_mucha_hlava","x":-32.0,"y":-149,"w":53,"h":73,"r":"head","pv":[26.5,58.400000000000006]}]}};
const BEAST_OF={bear:'bear4',boar:'boar4',fly:'fly4'}, FORM_RIG={bear:'bearS',boar:'boarS',fly:'flyS'}, FORM_MUL={bear:1.25,boar:1.12,fly:1.35};
export const beastKey=spr=>BEAST_OF[spr];
export function drawBeast(R,key,e,bx,by,targetH,time,tint,form){
  const B=BEASTS[key]; if(!B) return false; const k=targetH/B.H; const M=!e.flip;
  const wp=e._wp||0, mv=e._mv||0, sw=Math.sin(wp); const seed=((e.x||0)*7+(e.y||0)*13)%10;
  const fly=key.startsWith('fly'), stand=key.endsWith('S');
  const lt=e.lunge?Math.sin(Math.PI*e.lunge.t):0; const an=e.anim; const at=an?Math.sin(Math.PI*Math.min(1,an.t)):0;
  let bob=fly?Math.sin(time*5+seed)*2.5-5:(-Math.abs(sw)*2.2*mv+Math.sin(time*2.6+seed)*0.6*(1-mv)); let lean=lt*4;
  if(an&&(an.k==='cast'||an.k==='summon')) bob-=3*at;
  const hurt=e._hurt||0; lean+=hurt*3;
  const dark=[tint[0]*0.72,tint[1]*0.72,tint[2]*0.74];
  for(const p of B.parts){ const artName='form_art_'+p.n; const sprite=form&&R.meta.s[artName]?artName:p.n; if(!R.meta.s[sprite]) continue;
    let a=0, ox=0, oy=0; const r=p.r;
    if(r==='leg'){ a=stand? (fly?Math.sin(time*3+p.ph)*0.12:Math.sin(wp+p.ph)*0.3*mv) : fly? Math.sin(time*3+p.ph+seed)*0.18 : Math.sin(wp+p.ph)*0.28*mv+(p.far?0:lt*-0.2); oy=fly||stand?0:0; }
    else if(r==='arm'){ a=Math.sin(wp+p.ph)*0.35*mv+Math.sin(time*2.1+p.ph)*0.04; if(!p.far){ if(an&&an.k==='swing') a-=1.3*at*(p.f?-1:1); else if(e.lunge) a-=1.0*lt*(p.f?-1:1); } if(an&&(an.k==='cast'||an.k==='shoot')) a-=0.9*at*(p.f?-1:1); }
    else if(r==='wing'||r==='wing2'){ const sp=fly?38:30; a=Math.sin(time*sp+(r==='wing2'?1:0))*(r==='wing'?0.35:0.28)*(p.f?-1:1); if(an&&an.k==='cast') a*=1.6; }
    else if(r==='tail'){ a=Math.sin(time*3.2+seed)*0.16+sw*mv*0.2; }
    else if(r==='head'){ a=Math.sin(time*2+seed)*0.03+(stand?0:-0.14*lt); oy=stand?Math.sin(time*2.4+seed)*0.6:0; ox=stand?0:-lt*3; }
    const fl=!!p.f, a0=p.a0||0; const pvx=fl?p.w-p.pv[0]:p.pv[0], pvy=p.pv[1];
    const C0x=p.x+p.w/2, C0y=p.y+p.h/2, c0=Math.cos(a0), s0=Math.sin(a0), qx=pvx-p.w/2, qy=pvy-p.h/2;
    const Px=C0x+qx*c0-qy*s0, Py=C0y+qx*s0+qy*c0, dx=C0x-Px, dy=C0y-Py, c=Math.cos(a), s=Math.sin(a);
    let cx=Px+dx*c-dy*s+ox, cy=Py+dx*s+dy*c+oy; cx-=lean; if(!(r==='leg'&&!fly)) cy+=bob;
    const X=bx+(M?-cx:cx)*k, Y=by+cy*k;
    const facingFlip=form&&!fly&&r==='leg'?false:fl;
    R.sprite(sprite,X-p.w*k/2,Y-p.h*k/2,p.w*k,p.h*k,{rot:M?-(a0+a):a0+a,flip:facingFlip!==M,tint:p.far?dark:tint}); }
  return true; }
export function drawForm(R,e,bx,by,k99,time,tint){ const key=FORM_RIG[e.form]; if(!key) return false; return drawBeast(R,key,e,bx,by,k99*99*FORM_MUL[e.form],time,tint,true); }
