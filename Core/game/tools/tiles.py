# Build seamless floor / wall / walltop textures + decals and merge into a 4096x2048 atlas
import json, sys, numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0,'tools')
from grid import load, grid, crop

def mincut_wrap_h(img, frac=0.14):
    """Make image horizontally tileable: overlap right band onto left band with min-error vertical cut."""
    a=img.astype(np.float32); H,W,_=a.shape; b=int(W*frac)
    L=a[:,:b]; R=a[:,W-b:]
    err=((L-R)**2).sum(2)
    # DP for vertical path (one column per row)
    cost=err.copy(); back=np.zeros((H,b),np.int32)
    for y in range(1,H):
        prev=cost[y-1]
        left=np.r_[np.inf,prev[:-1]]; right=np.r_[prev[1:],np.inf]
        stack=np.stack([left,prev,right]); k=stack.argmin(0)
        cost[y]+=stack[k,np.arange(b)]; back[y]=np.arange(b)+k-1
    path=np.zeros(H,np.int32); path[-1]=int(cost[-1].argmin())
    for y in range(H-1,0,-1): path[y-1]=back[y,path[y]]
    # mask: 1 -> take from R (left of cut), 0 -> from L
    cols=np.arange(b)[None,:]; m=(cols<path[:,None]).astype(np.float32)
    m=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32)/255
    band=R*m[...,None]+L*(1-m[...,None])
    out=np.concatenate([band,a[:,b:W-b]],axis=1)
    return out.clip(0,255).astype(np.uint8)
def mincut_wrap(img,frac=0.14):
    t=mincut_wrap_h(img,frac)
    t=mincut_wrap_h(t.transpose(1,0,2),frac).transpose(1,0,2)
    return t
def pad_wrap(im,p):
    a=np.asarray(im); return Image.fromarray(np.pad(a,((p,p),(p,p),(0,0)),mode='wrap'))

PX=128  # source px per game tile
out={}
fl=Image.open('raw2/floors.jpg').convert('RGB'); A=np.asarray(fl)
ins=10
cells={'halls_a':(0,0,1024,512),'halls_b':(1024,0,2048,512),'halls_c':(0,512,1024,1024),'roots_a':(1024,512,2048,1024),
       'roots_b':(0,1024,1024,1536),'roots_c':(1024,1024,2048,1536),'drowned_a':(0,1536,767,2048),'drowned_b':(767,1536,1283,2048),'drowned_c':(1283,1536,2048,2048)}
for n,(x0,y0,x1,y1) in cells.items():
    c=A[y0+ins:y1-ins,x0+ins:x1-ins]
    s=mincut_wrap(c,0.12)
    h,w=s.shape[:2]; th=2; tw=max(1,round(w/h*th))
    im=Image.fromarray(s).resize((tw*PX,th*PX),Image.LANCZOS)
    out['tex_'+n]=(im,(tw,th))
# wall top
wt=np.asarray(Image.open('raw2/walltop.jpg').convert('RGB'))[8:-8,8:-8]
im=Image.fromarray(mincut_wrap(wt,0.1)).resize((4*PX,4*PX),Image.LANCZOS); out['tex_walltop']=(im,(4,4))
# walls: horizontal strips
W_=np.asarray(Image.open('raw2/walls.jpg').convert('RGB'))
for n,(y0,y1) in {'halls':(43,240),'roots':(287,482),'drowned':(528,720)}.items():
    s=mincut_wrap_h(W_[y0:y1,4:-4],0.12); h,w=s.shape[:2]
    th=1.25; tw=max(1,round(w/h*th)); im=Image.fromarray(s).resize((tw*PX,int(th*PX)),Image.LANCZOS)
    out['wall_'+n]=(im,(tw,th))
# decals via the existing slicer (light bg)
import shutil; shutil.copy('raw2/decals.jpg','raw/decals.jpg')
a,fg=load('decals'); g=grid(fg,28); k=0; dec=[]
for r in g:
    for b in r:
        im=crop(a,fg,b); sc=96/max(im.size); im=im.resize((max(1,round(im.width*sc)),max(1,round(im.height*sc))),Image.LANCZOS)
        out['decal_%d'%k]=(im,None); dec.append('decal_%d'%k); k+=1
print('decals',k,[len(r) for r in g])
# compose: keep old atlas left half, pack new into right half
old=Image.open('game/assets/atlas.webp').convert('RGBA'); meta=json.load(open('game/assets/atlas.json'))
atlas=Image.new('RGBA',(4096,2048),(0,0,0,0)); atlas.paste(old,(0,0))
P=8; x=2048; y=0; sh=0; tiles={}
items=sorted(out.items(),key=lambda kv:-kv[1][0].height)
for n,(im,cov) in items:
    tex=cov is not None
    pim=pad_wrap(im.convert('RGB'),P).convert('RGBA') if tex else im
    pw,ph=pim.size
    if x+pw>4096: x=2048; y+=sh+2; sh=0
    atlas.paste(pim,(x,y))
    if tex: meta['s'][n]=[x+P,y+P,im.width,im.height]; tiles[n]=cov
    else: meta['s'][n]=[x,y,im.width,im.height]
    x+=pw+2; sh=max(sh,ph)
assert y+sh<=2048, y+sh
meta['w']=4096; meta['h']=2048; meta['tiles']=tiles; meta['decals']=dec
atlas.save('game/assets/atlas2.webp',quality=90,method=6)
json.dump(meta,open('game/assets/atlas2.json','w'),separators=(',',':'))
print('used height',y+sh)
# preview: tile each texture 2x2
pv=Image.new('RGB',(2400,1500),(0,0,0)); px=py=0; rowh=0
for n,(im,cov) in out.items():
    if cov is None: continue
    t=Image.new('RGB',(im.width*2,im.height*2))
    for i in range(2):
        for j in range(2): t.paste(im.convert('RGB'),(i*im.width,j*im.height))
    t.thumbnail((560,400))
    if px+t.width>2400: px=0; py+=rowh+6; rowh=0
    pv.paste(t,(px,py)); px+=t.width+6; rowh=max(rowh,t.height)
pv.save('cut/tiles_prev.png')
