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
const WEAP={sword:52,sword2:52,axe:50,axe2:54,club:52,club2:52,club3:56,dagger_r:38,dagger_p:40,spear:90,staff_moss:84,staff_green:84,staff_crystal:86,staff_purple:84,staff_shroom:80,staff_red:84,wand_shroom:52,bow:58,crossbow:52,crossbow2:52};
// helm item sprite -> hand-drawn hat; [hat, bottom of hat as fraction of head height]
const HATMAP={helm_red:'hat_slice1',helm_brown:'hat_slice4',helm_purple:'hat_slice9',helm_tan:'hat_slice14',helm_violet:'hat_slice12',helm_rust:'hat_slice5',helm_purple2:'hat_slice13'};
const HATFIT={hat_slice1:0.5,hat_slice2:1.04,hat_slice3:0.42,hat_slice4:0.45,hat_slice5:0.45,hat_slice6:0.98,hat_slice7:0.62,hat_slice8:0.42,hat_slice9:0.45,hat_slice10:0.45,hat_slice11:1.04,hat_slice12:0.98,hat_slice13:0.5,hat_slice14:0.72,hat_slice15:1.0};
const BOWS=new Set(['bow','crossbow','crossbow2']);
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
export function animTick(e,dt){
  const mv=Math.hypot(e.x-e.rx,e.y-e.ry); e._mv=(e._mv||0)+((mv>0.02?1:0)-(e._mv||0))*Math.min(1,dt*12);
  e._wp=(e._wp||0)+dt*15*Math.min(1,e._mv*1.5);
  if(e.anim){ e.anim.t+=dt/(e.anim.dur||0.32); if(e.anim.t>=1) e.anim=null; }
  if(e._hurt>0) e._hurt=Math.max(0,e._hurt-dt*3);
}
// draw the rig. bx,by = world foot point, k = world px per unit, mirror = face right
export function drawRig(R,e,g,bx,by,k,time,tint){
  const rig=RIGS[e.cls]; if(!rig) return false; const size=n=>{ const s=R.meta.s[n]; return s?[s[2]/2,s[3]/2]:[0,0]; };
  const M=!e.flip; // native art faces left; e.flip=true means facing left
  const eq=e.equip||{}; const wspr=eq.weapon?.spr, ospr=eq.offhand?.spr, hspr=eq.helm?.spr, off=eq.offhand?.base;
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
  const body=size(rig.body), head=size(rig.head);
  // ---- part drawing helper (local unmirrored coords; pivot in displayed part coords) ----
  const part=(n,lx,ly,w,h,o={})=>{ if(!R.meta.s[n]) return; const a=o.rot||0, px=o.pv?o.pv[0]:w/2, py=o.pv?o.pv[1]:h/2;
    const Px=lx+px, Py=ly+py, dx=w/2-px, dy=h/2-py, c=Math.cos(a), s=Math.sin(a);
    let cx=Px+dx*c-dy*s, cy=Py+dx*s+dy*c; cx+=lean; cy+=bob*(o.noBob?0:1);
    const fl=!!o.flip!==M; const X=bx+(M?CX-cx:cx-CX)*k, Y=by-(FOOT-cy)*k;
    R.sprite(n,X-w*k/2,Y-h*k/2,w*k,h*k,{rot:M?-a:a,flip:fl,tint:o.tint||tint,sub:o.sub}); };
  const rotP=(px,py,ox,oy,a)=>{ const dx=px-ox, dy=py-oy, c=Math.cos(a), s=Math.sin(a); return [ox+dx*c-dy*s, oy+dx*s+dy*c]; };
  const dark=[tint[0]*0.72,tint[1]*0.72,tint[2]*0.74];
  const [ax,ay]=rig.armAt, [lx,ly]=rig.legAt, [bxx,byy]=rig.bodyAt;
  const farArmX=bxx-11, farLegX=lx-15;
  // far leg
  part(rig.leg,farLegX,ly,LEG.w,LEG.h,{flip:true,pv:[LEG.w-LEG.hip[0],LEG.hip[1]],rot:lFar,tint:dark,noBob:true});
  // quiver on the back
  if(ospr&&off==='quiver'){ const s0=size(ospr); const mx=Math.max(s0[0],s0[1])||1; const sz=34; part(ospr,bxx+30,byy-12,sz*s0[0]/mx,sz*s0[1]/mx,{rot:0.35}); }
  // weapon in far hand, then the far arm over the grip
  const farSh=[farArmX+(ARM.w-ARM.sh[0]),ay+ARM.sh[1]];
  part(rig.arm,farArmX,ay,ARM.w,ARM.h,{flip:true,pv:[ARM.w-ARM.sh[0],ARM.sh[1]],rot:aFar,tint:dark});
  if(wspr){ const [hx,hy]=rotP(farArmX+(ARM.w-ARM.hand[0]),ay+ARM.hand[1],farSh[0],farSh[1],aFar); const s0=size(wspr); const mx=Math.max(s0[0],s0[1])||1; const L=WEAP[wspr]||54; const w=L*s0[0]/mx, h=L*s0[1]/mx;
    const bow=BOWS.has(wspr);
    if(bow){ const gx=w*0.5, gy=h*0.5; part(wspr,hx-gx,hy-gy,w,h,{flip:true,pv:[gx,gy],rot:-0.78+0.45+bowR}); }
    else { const gx=w*0.76, gy=h*0.76; part(wspr,hx-gx,hy-gy,w,h,{flip:true,pv:[gx,gy],rot:phi+0.785}); } }
  // near leg, body, head, helm (only the cap of the helm, so the face stays visible)
  part(rig.leg,lx,ly,LEG.w,LEG.h,{pv:LEG.hip,rot:lNear,noBob:true});
  part(rig.body,bxx,byy,body[0],body[1]);
  part(rig.head,0,0,head[0],head[1],{rot:headR,pv:[head[0]*0.5,head[1]*0.9]});
  const hat=hspr&&(hspr.startsWith('hat_')?hspr:HATMAP[hspr]);
  if(hat&&R.meta.s[hat]){ const [w,h]=size(hat); const fit=HATFIT[hat]??0.5; part(hat,head[0]*0.5-w/2,head[1]*fit-h,w,h,{rot:headR,pv:[w/2,h+head[1]*(0.9-fit)]}); }
  // near arm, offhand item held in front of it
  const sh=[ax+ARM.sh[0],ay+ARM.sh[1]];
  part(rig.arm,ax,ay,ARM.w,ARM.h,{pv:ARM.sh,rot:aNear});
  if(ospr&&off!=='quiver'){ const [hx,hy]=rotP(ax+ARM.hand[0],ay+ARM.hand[1],sh[0],sh[1],aNear); const s0=size(ospr); const mx=Math.max(s0[0],s0[1])||1;
    const sz=off==='shield'||off==='lshield'?34:off==='tome'?24:off==='lantern'?24:24; const w=sz*s0[0]/mx, h=sz*s0[1]/mx; part(ospr,hx-w*0.5,hy-h*(off==='lantern'?0.15:0.5),w,h,{rot:aNear*0.3}); }
  return true;
}
