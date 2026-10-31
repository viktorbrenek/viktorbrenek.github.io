import sys, json, numpy as np
sys.path.insert(0,'tools')
from grid import load, grid, crop
from PIL import Image
M={
'chars':{
 # heroes
 'hero_blade':(0,1),'hero_knight':(2,1),'hero_mage':(2,3),'hero_ranger':(2,0),'hero_axe':(2,4),'hero_spear':(1,5),
 'npc_sage':(14,2),'npc_hermit':(15,0),'npc_merchant':(0,3),
 # monsters
 'rat':(3,4),'spore_blob':(4,1),'puffball':(4,2),'rot_hog':(4,3),'root_shroom':(4,4),'mole':(4,5),
 'crawler':(5,0),'burster':(5,1),'eye_blob':(5,2),'spore_octo':(5,3),'stalker':(5,4),'moth':(5,5),
 'slug':(6,0),'capling_o':(6,1),'capling_r':(6,2),'capling_b':(6,3),'fly':(6,4),'wasp':(6,5),
 'maw':(7,0),'octo_grey':(7,1),'octo_purple':(7,2),'spore_star':(7,3),'spore_mine':(7,4),'spore_eyes':(7,5),
 'shroom_jelly':(8,0),'jelly':(8,1),'tentacle':(8,2),'void_maw':(8,3),'gazer':(8,4),'gazer_big':(8,5),
 'troll_shield':(9,0),'troll_club':(9,1),'moss_troll':(9,2),'moss_troll2':(9,3),'spore_troll':(9,4),'spore_troll2':(9,5),
 'boss_moss':(10,0),'boss_moss2':(10,1),'boss_carrier':(10,2),'boss_carrier2':(10,3),'boss_giant':(10,4),'boss_giant2':(10,5),
 'treant':(11,1),'ent':(11,0),'myconid':(11,2),'root_horror':(11,3),
 'mole_big':(12,0),'goblin':(12,1),'shroom_brute':(12,2),
 'shroom_gob':(13,0),'imp':(13,1),'gob2':(13,2),'gob3':(13,3),'gob_rag':(13,4),'shroom_imp':(13,5),'gob_shroom':(13,6),
 'gob_red':(14,0),'boar':(14,1),'shaman1':(14,3),'shaman2':(14,4),'bear':(14,5),'grub':(14,6),
 'druid':(15,1),'warlock':(15,2),'witch1':(15,3),'witch2':(15,4),'toad':(15,5),'leech':(15,6),
 'deco_shroom1':(16,0),'deco_shroom2':(16,1),'deco_shroom3':(16,2),'deco_log':(16,3),'deco_shroom4':(16,4),'deco_grass1':(16,5),'deco_shroom5':(16,6),
 'deco_shroom6':(17,0),'deco_sack':(17,1),'deco_shroom7':(17,2),'deco_shroom8':(17,3),'deco_bush':(17,4),'deco_fence':(17,5),'shroom_house':(17,6),
 'deco_shroom9':(18,0),'deco_shroom10':(18,1),'shroom_house2':(18,2),'shroom_house3':(18,3),'deco_fence2':(18,4),'deco_drying':(18,5),'deco_grass2':(18,6),
 'deco_shroom11':(19,0),'deco_shroom12':(19,1),'deco_shroom13':(19,2),'deco_reeds':(19,3),'deco_shroom14':(19,4),'deco_grass3':(19,5)},
'env':{
 'floor_tiles':(0,0),'floor_stone':(0,1),'floor_cobble':(0,2),'floor_roots':(0,3),'floor_dirtmoss':(0,4),
 'floor_mosstiles':(1,0),'floor_mossstone':(1,1),'floor_dirt':(1,2),'floor_mossring':(1,3),'floor_grass':(1,4),
 'wall_f1':(2,0),'wall_f2':(2,1),'wall_f3':(2,2),'wall_f4':(2,3),
 'wall_d1':(3,1),'wall_d2':(3,2),'wall_d3':(3,3),'wall_d4':(3,0),
 'wall_s1':(4,0),'wall_s2':(4,1),'wall_s3':(4,2),'wall_s4':(4,3),
 'door':(5,0),'gate':(5,1),'stairs':(5,2),'arch_broken':(5,3),'arch':(5,4),'fence':(5,5),'lowwall':(5,6),
 'glowshroom':(6,0),'shroom_cluster':(6,1),'sack':(6,2),'deadtree':(6,3),'shroom_roots':(6,4),'stump':(6,5),'spore_pile':(7,0),
 'glowshroom_big':(8,0),'shroom_cluster2':(8,1),'sack2':(8,2),'spore_cloud':(8,4),'roots':(8,5),'vines':(8,6),'stump2':(8,7),
 'pillar':(9,0),'pillars':(9,1),'rubble':(9,2),'chest':(9,3),'crate':(9,4),'barrels':(9,5),'torch_wall':(9,6),
 'bench':(10,0),'pillars2':(10,1),'sofa':(10,2),'desk':(10,3),'torch1':(10,4),'torch2':(10,5),'altar':(10,6),'spikes':(10,7),
 'pool_poison':(11,0),'pool_poison2':(11,1),'grave':(11,3),'spikes2':(11,4),'obelisk':(11,5),
 'pool_water':(12,0),'pool_water2':(12,1)},
'items':{},'ui':{}}
names_items=[['sword','sword2','axe','axe2','club','staff_purple','spear'],
 ['dagger_r','dagger_p','club2','club3','wand_shroom','bow','crossbow'],
 ['staff_shroom','staff_moss','staff_green','staff_red','staff_crystal','crossbow2','quiver'],
 ['helm_red','helm_brown','helm_rust','helm_purple','helm_violet','helm_tan','helm_purple2'],
 ['shield_wood','shield_wood2','shield_leaf','armor_moss','armor_moss2','gauntlet','cloak_moss'],
 ['boots_leather','armor_leaf','armor_leaf2','armor_bark','boots_tan','gloves','cloak_dark'],
 ['pot_green','pot_green2','pot_violet','pot_violet2','pot_moss','pot_red','pot_red2'],
 ['pot_purple','pot_lime','pot_moss2','mortar','bag_shroom','bag_shroom2','shrooms_red'],
 ['crystal_green','rune_a','bag1','bag2','bag3','shrooms_purple','shrooms_red2'],
 ['crystal_violet','rune_b','skull','ring_gold','ring_violet','amulet_green','amulet_heart'],
 ['keys','scroll','scroll_shroom','tome','lantern','lantern2','coins'],
 ['coins2','coins3','shrine','tomb','brazier']]
for r,row in enumerate(names_items):
    for c,n in enumerate(row): M['items'][n]=(r,c)
M['ui']={'slot':(11,1),'slot_light':(11,2),'slot_oct':(11,3),'slot_moss':(13,2),'slot_glow':(12,3),
 'ico_str':(14,0),'ico_life':(14,1),'ico_mana':(14,2),'ico_armor':(14,3),'ico_speed':(14,4),'ico_dash':(14,5),'ico_shroom':(14,6),
 'ico_str2':(15,0),'ico_heart':(15,1),'ico_pot':(15,2),'ico_wits':(15,3),'ico_shroom2':(15,4),'ico_luck':(15,5),'ico_shroom3':(15,6),
 'btn_play':(1,2),'btn_gear':(1,3),'panel_parch':(10,3),'panel_bark':(10,1)}
SIZE={'chars':128,'env':128,'items':96,'ui':96}
BIG={'boss_moss','boss_moss2','boss_carrier','boss_carrier2','boss_giant','boss_giant2','treant','ent','shroom_house','shroom_house2','shroom_house3','troll_shield','troll_club','moss_troll','moss_troll2','spore_troll','spore_troll2','glowshroom_big'}
TILE=lambda n:n.startswith('floor') or n.startswith('wall')
sprites={}
for sheet,mp in M.items():
    a,fg=load(sheet); g=grid(fg)
    for n,(r,c) in mp.items():
        box=g[r][c]
        if TILE(n):
            x0,y0,x1,y1=box; w=x1-x0; h=y1-y0
            ins=int(min(w,h)*0.06)
            im=Image.fromarray(a[y0+ins:y1-ins,x0+ins:x1-ins]).convert('RGBA')
            im=im.resize((128,int(128*im.height/im.width)),Image.LANCZOS)
        else:
            im=crop(a,fg,box)
            S=200 if n in BIG else SIZE[sheet]
            sc=S/max(im.size); im=im.resize((max(1,round(im.width*sc)),max(1,round(im.height*sc))),Image.LANCZOS)
        sprites[n]=im
# shelf pack
items=sorted(sprites.items(),key=lambda kv:-kv[1].height)
W=2048; x=y=0; sh=0; pos={}; P=2
for n,im in items:
    if x+im.width+P>W: x=0; y+=sh+P; sh=0
    pos[n]=[x,y,im.width,im.height]; x+=im.width+P; sh=max(sh,im.height)
H=1
while H<y+sh: H*=2
atlas=Image.new('RGBA',(W,H),(0,0,0,0))
for n,im in items: atlas.paste(im,(pos[n][0],pos[n][1]))
import os; os.makedirs('game/assets',exist_ok=True)
atlas.save('game/assets/atlas.png',optimize=True)
json.dump({'w':W,'h':H,'s':pos},open('game/assets/atlas.json','w'),separators=(',',':'))
print(len(pos),W,H,os.path.getsize('game/assets/atlas.png')//1024,'KB')
