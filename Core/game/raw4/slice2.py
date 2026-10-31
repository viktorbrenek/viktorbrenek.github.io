from PIL import Image, ImageDraw
import numpy as np, scipy.ndimage as nd, json, os
src='/root/.claude/uploads/8027e506-a533-5d5d-9964-4aa7253aac4b/0f20f9bd-image.jpg'
N=['lunge','snipe','arrowrain','entcall','jellycall','detonate','command','bearform','boarform','maul','gore','thornroot','regrow','sporeswarm','totem','spiritwolf']
b=np.array(Image.open(src).convert('RGB')).astype(np.float32); H=b.shape[0]; c=H//4; S=96
mag=(b[...,0]>170)&(b[...,1]<90)&(b[...,2]>170)
for i,n in enumerate(N):
  r,q=divmod(i,4); m=~mag[r*c:(r+1)*c,q*c:(q+1)*c]; cell=b[r*c:(r+1)*c,q*c:(q+1)*c]
  m=nd.binary_opening(m,iterations=2); lab,nl=nd.label(m); sz=nd.sum(m,lab,range(1,nl+1)); m=lab==(np.argmax(sz)+1)
  ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1; W=x1-x0; Hh=y1-y0
  if i<2: box=(x0,y0,x1,y1)
  else: k=0.74; s=int(Hh*k); cx=(x0+x1)//2; box=(cx-s//2,y0,cx+s//2,y0+s)
  im=Image.fromarray(cell.astype(np.uint8)).crop(box).resize((S*4,S*4),Image.LANCZOS).convert('RGBA')
  Wd=S*4; mask=Image.new('L',(Wd,Wd),0); ImageDraw.Draw(mask).rounded_rectangle((3,3,Wd-4,Wd-4),Wd*0.07,fill=255)
  if i>=2: ImageDraw.Draw(im).rounded_rectangle((3,3,Wd-4,Wd-4),Wd*0.07,outline=(30,22,20,255),width=12)
  im.putalpha(mask); im.resize((S,S),Image.LANCZOS).save(f'sk_{n}.png')
# atlas update
J='/home/claude/sp/game/assets/atlas.json'; m=json.load(open(J)); A=Image.open('/home/claude/sp/game/assets/atlas.webp').convert('RGBA')
Wa,Ha=m['w'],m['h']; occ=np.zeros((Ha,Wa),bool)
for k,(x,y,w,h) in m['s'].items(): occ[max(0,y-2):y+h+2,max(0,x-2):x+w+2]=True
occ|=np.array(A)[...,3]>0
ii=np.cumsum(np.cumsum(occ.astype(np.int32),0),1); P=S+4
def free(x,y):
  x1,y1=x+P-1,y+P-1
  if x1>=Wa or y1>=Ha: return False
  return ii[y1,x1]-(ii[y-1,x1] if y else 0)-(ii[y1,x-1] if x else 0)+(ii[y-1,x-1] if x and y else 0)==0
new=[n for n in N if 'sk_'+n not in m['s']]; spots=[]
for y in range(0,Ha-P,4):
  x=0
  while x<Wa-P and len(spots)<len(new):
    if free(x,y) and not any(abs(x-a)<P and abs(y-bb)<P for a,bb in spots): spots.append((x,y)); x+=P
    else: x+=4
  if len(spots)>=len(new): break
for n,(x,y) in zip(new,spots): m['s']['sk_'+n]=[x+2,y+2,S,S]
for n in N:
  x,y,w,h=m['s']['sk_'+n]; A.paste((0,0,0,0),(x,y,x+w,y+h)); A.alpha_composite(Image.open(f'sk_{n}.png').convert('RGBA'),(x,y))
A.save('/home/claude/sp/game/assets/atlas.webp',quality=90,method=6); json.dump(m,open(J,'w'),separators=(',',':'))
C=Image.new('RGBA',(96*8,96*2),(70,60,50,255))
for i,n in enumerate(N): C.alpha_composite(Image.open(f'sk_{n}.png'),((i%8)*96,(i//8)*96))
C.save('/tmp/claude-0/-home-claude/8027e506-a533-5d5d-9964-4aa7253aac4b/scratchpad/icons2.png'); print('ok',len(new))
