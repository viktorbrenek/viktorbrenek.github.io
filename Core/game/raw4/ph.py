import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
m=json.load(open('/home/claude/sp/game/assets/atlas.json'))['s']; A=Image.open('/home/claude/sp/game/assets/atlas.webp').convert('RGBA')
S=96
P={'lunge':('sword',(230,240,255),-0.8),'snipe':('crossbow',(255,220,120),0),'arrowrain':('quiver',(200,220,255),0.4),
 'entcall':('ent',(140,220,90),0),'jellycall':('jelly',(170,120,255),0),'detonate':('spore_cloud',(200,255,90),0),'command':('capling_b',(255,200,90),0),
 'bearform':('bear',(240,160,70),0),'boarform':('boar',(120,230,120),0),'maul':('gauntlet',(255,90,60),0.5),'gore':('boar',(255,70,60),0),
 'thornroot':('roots',(150,240,110),0),'regrow':('vines',(110,255,170),0)}
for n,(spr,col,rot) in P.items():
  im=Image.new('RGBA',(S*4,S*4),(0,0,0,0)); W=S*4
  bg=Image.new('RGBA',(W,W),(22,18,16,255)); g=Image.new('L',(W,W),0); ImageDraw.Draw(g).ellipse((W*0.12,W*0.12,W*0.88,W*0.88),fill=200); g=g.filter(ImageFilter.GaussianBlur(W*0.12))
  glow=Image.new('RGBA',(W,W),col+(255,)); bg=Image.composite(glow,bg,g.point(lambda v:int(v*0.55)))
  x,y,w,h=m[spr]; s=A.crop((x,y,x+w,y+h)); sc=min(W*0.7/w,W*0.7/h); s=s.resize((int(w*sc),int(h*sc)),Image.LANCZOS)
  if rot: s=s.rotate(rot*57.3,expand=True,resample=Image.BICUBIC)
  sh=Image.new('RGBA',s.size,col+(0,)); al=s.split()[3].filter(ImageFilter.GaussianBlur(10)); sh.putalpha(al)
  for k in range(2): bg.alpha_composite(sh,((W-s.width)//2,(W-s.height)//2))
  bg.alpha_composite(s,((W-s.width)//2,(W-s.height)//2))
  # vignette + rounded frame
  v=Image.new('L',(W,W),0); ImageDraw.Draw(v).rectangle((0,0,W,W),fill=170); ImageDraw.Draw(v).rounded_rectangle((W*0.08,W*0.08,W*0.92,W*0.92),W*0.1,fill=0); v=v.filter(ImageFilter.GaussianBlur(W*0.06))
  bg=Image.composite(Image.new('RGBA',(W,W),(10,8,8,255)),bg,v)
  mask=Image.new('L',(W,W),0); ImageDraw.Draw(mask).rounded_rectangle((2,2,W-3,W-3),W*0.07,fill=255); bg.putalpha(mask)
  d=ImageDraw.Draw(bg); d.rounded_rectangle((2,2,W-3,W-3),W*0.07,outline=(40,28,26,255),width=10)
  bg.resize((S,S),Image.LANCZOS).save(f'sk_{n}.png')
print('ok')
