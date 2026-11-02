import cv2, numpy as np, json
from PIL import Image
M=np.array(Image.open('/root/.claude/uploads/8027e506-a533-5d5d-9964-4aa7253aac4b/596885dc-image.png').convert('RGBA'))
bg=np.full(M.shape[:2]+(3,),255,np.uint8); a=M[...,3:4]/255.0; Mi=(M[...,:3]*a+bg*(1-a)).astype(np.uint8)
cols=[]; # find column x ranges by non-white columns
ink=(Mi.min(axis=2)<200).any(axis=0); xs=np.where(ink)[0]
groups=[]; start=xs[0]; prev=xs[0]
for x in xs[1:]:
  if x-prev>25: groups.append((start,prev)); start=x
  prev=x
groups.append((start,prev)); print('groups',groups)
order=[('sermir','noha_vsichni_krom_strazce','ruka_sermir_strazce_plodonos'),('strazce','noha_strazce','ruka_sermir_strazce_plodonos'),('mykomant','noha_vsichni_krom_strazce','ruka_mykomant'),('hunter','noha_vsichni_krom_strazce','ruka_hunter'),('plodonos','noha_vsichni_krom_strazce','ruka_sermir_strazce_plodonos'),('menavec','noha_vsichni_krom_strazce','ruka_menavec')]
def load(n):
  im=np.array(Image.open(n+'.png').convert('RGBA')); return im
res={}
for gi,(cls,leg,arm) in enumerate(order):
  x0,x1=groups[gi]; reg=Mi[:,max(0,x0-40):x1+40]; off=max(0,x0-40)
  out={}
  for part,fn in [('body',cls+'_body'),('head',cls+'_hlava'),('arm',arm),('leg',leg)]:
    P=load(fn); best=(-1,)
    for s in [3.28]:
      w,h=int(P.shape[1]*s),int(P.shape[0]*s)
      if w>=reg.shape[1] or h>=reg.shape[0]: continue
      t=cv2.resize(P,(w,h),interpolation=cv2.INTER_LINEAR); al=t[...,3]
      tbg=np.full((h,w,3),255,np.uint8); aa=al[...,None]/255.0; tr=(t[...,:3]*aa+tbg*(1-aa)).astype(np.uint8)
      mask=(al>128).astype(np.uint8)*255; mask=cv2.merge([mask]*3)
      r=cv2.matchTemplate(reg,tr,cv2.TM_SQDIFF,mask=mask); mn,_,loc,_=cv2.minMaxLoc(r); sc=mn/(mask>0).sum()
      if best[0]<0 or sc<best[0]: best=(sc,s,loc[0]+off,loc[1])
    out[part]=dict(err=round(float(best[0]),1),s=round(float(best[1]),2),x=int(best[2]),y=int(best[3]),w=P.shape[1],h=P.shape[0])
  res[cls]=out; print(cls,out)
json.dump(res,open('fit.json','w'))
