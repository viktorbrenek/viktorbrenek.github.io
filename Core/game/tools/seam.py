import numpy as np
from PIL import Image, ImageFilter

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

