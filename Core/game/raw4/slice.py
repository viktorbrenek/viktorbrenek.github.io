from PIL import Image, ImageFilter
import numpy as np, scipy.ndimage as nd
U='/root/.claude/uploads/8027e506-a533-5d5d-9964-4aa7253aac4b/'
RUNES=['multi','chain','area','venom','pyre','brutal','crit','echo','corpse','leech','haste','dot','execute','stun','fertile','hex']
SPELLS=['attack','cleave','rotstrike','bash','barkskin','sporebolt','puffbomb','firebrand','blink','drain','volley','plague','rend','warcry','spikes','sproutlings']
S=96
# runes: dark bg, soft glow -> alpha by distance from bg
a=np.array(Image.open(U+'7e6a89f6-image.jpg').convert('RGB')).astype(np.float32)
bg=np.array([29,27,27],np.float32)
H=a.shape[0]; c=H//4
for i,n in enumerate(RUNES):
  r,q=divmod(i,4); cell=a[r*c:(r+1)*c,q*c:(q+1)*c]
  d=np.abs(cell-bg).max(axis=2)
  alpha=np.clip((d-6)/38,0,1)
  # solid core: stone region (large connected strong area) fully opaque
  core=nd.binary_fill_holes(d>22); core=nd.binary_opening(core,iterations=3)
  lab,nl=nd.label(core); 
  if nl: sizes=nd.sum(core,lab,range(1,nl+1)); core=lab==(np.argmax(sizes)+1); core=nd.binary_fill_holes(core)
  alpha=np.maximum(alpha,core.astype(np.float32))
  # unpremultiply glow colour against bg
  rgb=np.where(alpha[...,None]>0.01,(cell-bg*(1-alpha[...,None]))/np.maximum(alpha[...,None],0.01),0)
  rgb=np.clip(rgb,0,255)
  ys,xs=np.where(alpha>0.08); y0,y1,x0,x1=ys.min(),ys.max(),xs.min(),xs.max()
  side=max(y1-y0,x1-x0)+8; cy,cx=(y0+y1)//2,(x0+x1)//2
  im=Image.fromarray(np.dstack([rgb,alpha*255]).astype(np.uint8),'RGBA')
  im=im.crop((cx-side//2,cy-side//2,cx+side//2,cy+side//2)).resize((S,S),Image.LANCZOS)
  im.save(f'rune_{n}.png')
# spells: magenta bg
b=np.array(Image.open(U+'e741856a-image.jpg').convert('RGB')).astype(np.float32)
mag=(b[...,0]>170)&(b[...,1]<90)&(b[...,2]>170)
for i,n in enumerate(SPELLS):
  r,q=divmod(i,4); m=~mag[r*c:(r+1)*c,q*c:(q+1)*c]; cell=b[r*c:(r+1)*c,q*c:(q+1)*c]
  m=nd.binary_opening(m,iterations=2); lab,nl=nd.label(m); sizes=nd.sum(m,lab,range(1,nl+1)); m=lab==(np.argmax(sizes)+1); m=nd.binary_fill_holes(m)
  ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
  al=nd.binary_erosion(m,iterations=2).astype(np.float32); al=nd.gaussian_filter(al,1.2)
  im=Image.fromarray(np.dstack([cell,al*255]).astype(np.uint8),'RGBA').crop((x0,y0,x1,y1)).resize((S,S),Image.LANCZOS)
  im.save(f'sk_{n}.png')
print('ok')
