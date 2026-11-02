import json, math
from PIL import Image
A=Image.open('/home/claude/sp/game/assets/atlas.webp').convert('RGBA'); S=json.load(open('/home/claude/sp/game/assets/atlas.json'))['s']
def spr(n): x,y,w,h=S[n]; return A.crop((x,y,x+w,y+h))
NL='noha_vsichni_krom_strazce'
RIG={'blade':('sermir',NL,'ruka_sermir_strazce_plodonos',(0,30.8),(32.3,30.8),(23,64)),'warden':('strazce','noha_strazce','ruka_sermir_strazce_plodonos',(-0.3,31.1),(31.7,30.8),(22.9,64.5)),
 'myco':('mykomant',NL,'ruka_mykomant',(-3,31.1),(31.7,31.1),(21,64)),'ranger':('hunter',NL,'ruka_hunter',(-0.6,12.2),(32,30.8),(22.9,64.5)),
 'summoner':('plodonos',NL,'ruka_sermir_strazce_plodonos',(-3.4,31.1),(31.7,31.1),(21,64)),'shifter':('menavec',NL,'ruka_menavec',(-2.7,30.8),(32.3,30.8),(21,64))}
GEAR={'blade':('sword','hat_slice1',None),'warden':('club','hat_slice2','shield_wood'),'myco':('staff_moss','hat_slice3','tome'),'ranger':('bow','hat_slice6','quiver'),'summoner':('staff_purple','hat_slice8','mortar'),'shifter':('spear','hat_slice14',None)}
FIT={'hat_slice1':0.5,'hat_slice2':1.04,'hat_slice3':0.42,'hat_slice6':0.98,'hat_slice8':0.42,'hat_slice14':0.72}
WEAP={'sword':52,'club':52,'staff_moss':84,'bow':58,'staff_purple':84,'spear':90}
K=5; OX,OY=60,40; W,H=int(160*K),int(170*K)
ARM=dict(w=29,h=49,sh=(10,9),hand=(19,42)); LEG=dict(w=28,h=35,hip=(14,5))
def part(C,img,lx,ly,w,h,rot=0,pv=None,flip=False,tint=1.0,cut=None):
  if flip: img=img.transpose(Image.FLIP_LEFT_RIGHT)
  if cut: img=img.crop((0,0,img.width,int(img.height*cut)))
  px,py=pv if pv else (w/2,h/2); Px,Py=lx+px,ly+py; dx,dy=w/2-px,h/2-py; c,s=math.cos(rot),math.sin(rot)
  cx,cy=Px+dx*c-dy*s, Py+dx*s+dy*c
  im=img.resize((max(1,int(w*K)),max(1,int(h*K))),Image.LANCZOS)
  if tint!=1.0:
    r,g,b,a=im.split(); im=Image.merge('RGBA',[ch.point(lambda v:int(v*tint)) for ch in (r,g,b)]+[a])
  im=im.rotate(-math.degrees(rot),resample=Image.BICUBIC,expand=True)
  C.alpha_composite(im,(int((cx+OX)*K-im.width/2),int((cy+OY)*K-im.height/2)))
def rotP(px,py,ox,oy,a): dx,dy=px-ox,py-oy; c,s=math.cos(a),math.sin(a); return ox+dx*c-dy*s, oy+dx*s+dy*c
for cls,(nm,leg,arm,bodyAt,armAt,legAt) in RIG.items():
  C=Image.new('RGBA',(W,H),(0,0,0,0)); head=spr(f'rig_{nm}_hlava'); body=spr(f'rig_{nm}_body'); A_=spr('rig_'+arm); L_=spr('rig_'+leg)
  hw,hh=head.width/2,head.height/2; bw,bh=body.width/2,body.height/2
  wsp,hsp,osp=GEAR[cls]; ax,ay=armAt; lx,ly=legAt; bx,by=bodyAt; farArmX=bx-11; farLegX=lx-15; aFar=0.25; phi=-1.2
  part(C,L_,farLegX,ly,28,35,0,(28-14,5),True,0.72)
  if osp=='quiver': q=spr(osp); mx=max(q.size); part(C,q,bx+30,by-12,34*q.width/mx,34*q.height/mx,0.35)
  farSh=(farArmX+29-10,ay+9)
  part(C,A_,farArmX,ay,29,49,aFar,(29-10,9),True,0.72)
  if wsp:
    hx,hy=rotP(farArmX+29-19,ay+42,farSh[0],farSh[1],aFar); w_=spr(wsp); mx=max(w_.size); L=WEAP[wsp]; w,h=L*w_.width/mx,L*w_.height/mx
    if wsp=='bow': part(C,w_,hx-w*0.5,hy-h*0.5,w,h,-0.33,(w*0.5,h*0.5),True)
    else: gx,gy=w*0.76,h*0.76; part(C,w_,hx-gx,hy-gy,w,h,phi+0.785,(gx,gy),True)
  part(C,L_,lx,ly,28,35,0,(14,5))
  part(C,body,bx,by,bw,bh); part(C,head,0,0,hw,hh)
  if hsp:
    hm=spr(hsp); w,h=hm.width/2,hm.height/2; part(C,hm,hw*0.5-w/2,hh*FIT[hsp]-h,w,h)
  part(C,A_,ax,ay,29,49,0,(10,9))
  if osp and osp!='quiver':
    hx,hy=ax+19,ay+42; o=spr(osp); mx=max(o.size); sz=34 if 'shield' in osp else 24; w,h=sz*o.width/mx,sz*o.height/mx; part(C,o,hx-w*0.5,hy-h*0.5,w,h)
  bb=C.getbbox(); C=C.crop(bb); C.thumbnail((150,150),Image.LANCZOS); C.save(f'hero2_{cls}.png'); print(cls,C.size)
