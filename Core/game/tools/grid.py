import numpy as np, json
from PIL import Image, ImageFilter
from scipy import ndimage
def load(name):
    im=Image.open(f'raw/{name}.jpg').convert('RGB'); a=np.asarray(im).astype(int)
    bg=np.median(np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]),axis=0)
    d=np.abs(a-bg).sum(2); sat=a.max(2)-a.min(2)
    near=(d<40)&(sat<22)
    lab,n=ndimage.label(near)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bgm=np.isin(lab,list(border))
    tight=(d<26)&(sat<14); tl,tn=ndimage.label(tight)
    sz=ndimage.sum(np.ones_like(tl),tl,range(tn+1)); bgm|=(sz[tl]>80)&(tl>0)
    band=ndimage.binary_dilation(bgm,iterations=4)&~bgm
    bgm|=band&(a.mean(2)>150)&(sat<40)
    bgm=ndimage.binary_dilation(bgm,iterations=1)
    fg=ndimage.binary_opening(~bgm,iterations=1)
    return a.astype(np.uint8),fg
def grid(fg,it=5):
    lab,n=ndimage.label(ndimage.binary_dilation(fg,iterations=it))
    big=[]
    for i,s in enumerate(ndimage.find_objects(lab)):
        h=s[0].stop-s[0].start; w=s[1].stop-s[1].start
        if w*h<3500: continue
        big.append([s[1].start,s[0].start,s[1].stop,s[0].stop])
    big.sort(key=lambda b:(b[1]+b[3])/2)
    rows=[]
    for b in big:
        cy=(b[1]+b[3])/2
        if rows and abs(cy-rows[-1][0])<50: rows[-1][1].append(b)
        else: rows.append([cy,[b]])
    return [sorted(r[1],key=lambda b:b[0]) for r in rows]
def crop(a,fg,box,pad=18):
    x0,y0,x1,y1=box; H,W=fg.shape
    x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(W,x1+pad);y1=min(H,y1+pad)
    m=fg[y0:y1,x0:x1]
    al=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    rgba=np.dstack([a[y0:y1,x0:x1],np.asarray(al)])
    im=Image.fromarray(rgba); bb=im.getbbox(); return im.crop(bb)
if __name__=='__main__':
    for n in ['chars','env','items','ui']:
        a,fg=load(n); g=grid(fg); print(n,[len(r) for r in g])
