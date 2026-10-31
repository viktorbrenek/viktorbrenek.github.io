# Slice UI sheets into named transparent webp files by pick points (display coords * scale)
import sys, os, json, numpy as np, shutil
from PIL import Image, ImageFilter
from scipy import ndimage
sys.path.insert(0,'tools')
from grid import load
P=1792/1493; F=2048/1932
SHEETS={
 'frames':(F,600,{'panel_big':(480,490),'panel_tooltip':(1450,480),'panel_hud':(480,1440),'panel_modal':(1450,1450)}),
 'bars':(P,500,{'bar_frame':(745,205),'boss_frame':(745,640),'xp_frame':(745,1000),'fill_hp':(745,1270),'fill_mp':(745,1560),'fill_xp':(745,1850)}),
 'slots':(P,170,{'slot':(165,555),'slot_hi':(455,555),'slot_skill':(745,555),'slot_pot':(1025,555),'slot_rune':(1330,555),'eq_weapon':(165,995),'eq_offhand':(455,995),'eq_helm':(745,995),'eq_chest':(1035,995),'eq_gloves':(1325,995),'eq_boots':(165,1385),'eq_amulet':(455,1385),'eq_ring1':(745,1385),'slot_plain':(1035,1385)}),
 'buttons':(P,260,{'btn':(745,205),'btn_hover':(745,590),'btn_pressed':(745,980),'rbtn':(205,1380),'rbtn_hover':(590,1380),'sqbtn':(970,1360),'smallbtn':(1320,1370),'tab_active':(465,1720),'tab_inactive':(1025,1720)}),
 'tree':(P,230,{'node_s':(190,245),'node_n':(535,250),'node_k':(930,240),'node_start':(1310,245),'node_s_on':(190,670),'node_n_on':(535,670),'node_k_on':(930,675),'node_start_on':(1310,675)}),
 'icons':(P,120,{'i_gold':(175,215),'i_dust':(470,215),'i_rpoison':(745,215),'i_rfire':(1035,215),'i_rdecay':(1320,215),'i_essence':(175,620),'i_armor':(410,620),'i_crit':(625,620),'i_dodge':(900,620),'i_inventory':(1125,640),'i_life':(1340,500),'i_character':(1340,680),'i_skills':(160,1010),'i_tree':(410,1000),'i_settings':(625,1000),'i_map':(895,1000),'i_potion':(1110,1010),'i_key':(1340,1000),'i_buff':(185,1325),'i_debuff':(410,1325),'i_poison':(625,1325),'i_burn':(895,1325),'i_bleed':(1110,1325),'i_stun':(1340,1325),'i_root':(165,1650),'i_badge':(410,1650),'i_plaque':(645,1650),'cur_normal':(905,1650),'cur_attack':(1120,1650),'cur_interact':(1340,1650)}),
 'decor':(P,330,{'ribbon':(745,290),'divider':(745,720),'corner':(300,1040)}),
}
os.makedirs('game/assets/ui',exist_ok=True); info={}
for sheet,(sc,R,picks) in SHEETS.items():
    shutil.copy(f'raw3/{sheet}.jpg',f'raw/ui_{sheet}.jpg')
    a,fg=load('ui_'+sheet)
    lab,n=ndimage.label(ndimage.binary_dilation(fg,iterations=2))
    objs=ndimage.find_objects(lab); cents=ndimage.center_of_mass(fg,lab,range(1,n+1))
    pts={k:(x*sc,y*sc) for k,(x,y) in picks.items()}
    owner={}
    for i,(cy,cx) in enumerate(cents):
        if np.isnan(cx): continue
        s=objs[i]; area=(s[0].stop-s[0].start)*(s[1].stop-s[1].start)
        # point-in-box wins, else nearest center within R
        best=None
        for k,(px,py) in pts.items():
            if s[1].start<=px<s[1].stop and s[0].start<=py<s[0].stop: best=k; break
        if not best:
            d=sorted((np.hypot(cx-px,cy-py),k) for k,(px,py) in pts.items())[0]
            if d[0]<R: best=d[1]
        if best: owner.setdefault(best,[]).append(i+1)
    for k,ids in owner.items():
        m=np.isin(lab,ids)&fg; ys,xs=np.where(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        al=Image.fromarray((m[y0:y1,x0:x1]*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
        im=Image.fromarray(np.dstack([a[y0:y1,x0:x1],np.asarray(al)]))
        mx={'frames':720,'bars':1100,'decor':1000}.get(sheet,256 if sheet in('slots','tree','buttons') else 128)
        if sheet=='buttons' and k.startswith('btn'): mx=900
        s2=min(1,mx/max(im.size)); im=im.resize((round(im.width*s2),round(im.height*s2)),Image.LANCZOS)
        if k.startswith('cur_'): im.thumbnail((40,40)); im.save(f'game/assets/ui/{k}.png')
        else: im.save(f'game/assets/ui/{k}.webp',quality=90)
        info[k]=im.size
    missing=[k for k in picks if k not in owner]; print(sheet,'ok',len(owner),'missing',missing)
# bark texture: manual crop
d=Image.open('raw3/decor.jpg').convert('RGB'); x0,y0,x1,y1=[int(v*P) for v in (372,1112,1120,1860)]
bark=d.crop((x0+12,y0+12,x1-12,y1-12)).resize((512,512),Image.LANCZOS)
sys.path.insert(0,'tools'); from seam import mincut_wrap
Image.fromarray(mincut_wrap(np.asarray(bark),0.12)).resize((512,512)).save('game/assets/ui/bark.webp',quality=88); info['bark']=(512,512)
json.dump(info,open('game/assets/ui/ui.json','w'))
# contact preview
ims=[(k,Image.open(f'game/assets/ui/{k}.'+('png' if k.startswith('cur_') else 'webp')).convert('RGBA')) for k in info]
W=2200; x=y=0; rh=0; pos=[]
for k,im in ims:
    t=im.copy(); t.thumbnail((260,200))
    if x+t.width>W: x=0; y+=rh+24; rh=0
    pos.append((k,t,x,y)); x+=t.width+12; rh=max(rh,t.height)
pv=Image.new('RGBA',(W,y+rh+30),(40,30,40,255))
from PIL import ImageDraw; dr=ImageDraw.Draw(pv)
for k,t,x,y in pos: pv.alpha_composite(t,(x,y+14)); dr.text((x,y),k,fill=(255,220,90))
pv.save('cut/ui_prev.png')
