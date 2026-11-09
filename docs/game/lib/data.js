// Sporium – game data v2 (monsters, mods, bosses, items, affixes, supports, passives, uniques, events)
export const BIOMES=[
  {id:'halls', name:'Výtrusné síně', floors:['tex_halls_a','tex_halls_b','tex_halls_c'], wall:'wall_halls', decals:[0,1,2,3,4,5,6,7,8,9,10,12,13,14,21], ambient:[0.05,0.055,0.07], spore:[0.85,0.95,0.55], deco:['deco_shroom1','deco_shroom4','deco_shroom9','deco_grass1','shroom_cluster','rubble','pillar','barrels','crate','sack','bench','roots']},
  {id:'roots', name:'Hnijící kořeny', floors:['tex_roots_a','tex_roots_b','tex_roots_c'], wall:'wall_roots', decals:[2,3,4,11,15,16,17,18,19,20,22,23,24,25,26,27], ambient:[0.06,0.045,0.04], spore:[1.0,0.7,0.45], deco:['deadtree','stump','stump2','roots','vines','shroom_roots','deco_log','deco_shroom6','deco_shroom7','deco_bush','spore_pile']},
  {id:'cathedral', name:'Zhnilá katedrála', floors:['tex_cath_a','tex_cath_b','tex_cath_c'], wall:'wall_cath', decals:[28,29,30,31,32,33,35,36,37,38,39,40,41,42,43,2,4], ambient:[0.055,0.048,0.072], spore:[0.85,0.75,1.0], deco:['cath_pew','cath_pew','cath_pew_broken','cath_candelabra','cath_pillar','cath_statue','cath_lectern','cath_sarcophagus','cath_chandelier','cath_organ','cath_reliquary','cath_banner','cath_bell','deco_shroom10'], shafts:true},
  {id:'drowned', name:'Utopené mycelium', floors:['tex_drowned_a','tex_drowned_b','tex_drowned_c'], wall:'wall_drowned', decals:[0,1,2,3,4,7,8,9,12,21,22], ambient:[0.035,0.06,0.07], spore:[0.6,1.0,0.85], deco:['deco_reeds','deco_grass3','deco_shroom12','deco_shroom11','vines','pillars','deco_shroom10','deco_shroom13','deco_shroom14']},
];
export const biomeFor=d=>BIOMES[Math.floor((d-1)/5)%BIOMES.length];
// resist penalty like PoE acts: every 5 floors −12 %, max −60 %
export const resPenalty=d=>-Math.min(60,Math.floor((d-1)/5)*12);

// ai: melee | ranged | caster | burster | swarm | charger | healer | lasher | mine | boss
// res: base monster resistances (%), el: hit element
export const MONSTERS=[
  {id:'rat', name:'Sklepní krysa', spr:'rat', hp:10, dmg:[2,4], arm:0, spd:120, xp:4, ai:'swarm', d:[1,8], sc:0.8},
  {id:'capling', name:'Kloboučník', spr:'capling_r', hp:16, dmg:[2,5], arm:2, spd:100, xp:6, ai:'melee', d:[1,9], el:'poison', res:{poison:30}},
  {id:'blob', name:'Výtrusný chuchvalec', spr:'spore_blob', hp:12, dmg:[3,6], arm:0, spd:90, xp:6, ai:'burster', d:[1,14], el:'poison', res:{poison:50}},
  {id:'gob', name:'Houbový skřet', spr:'gob_shroom', hp:20, dmg:[3,6], arm:4, spd:100, xp:8, ai:'melee', d:[2,14]},
  {id:'fly', name:'Hnilobná moucha', spr:'fly', hp:8, dmg:[2,4], arm:0, spd:140, xp:5, ai:'swarm', d:[2,12], sc:0.75, el:'decay'},
  {id:'archer', name:'Kořenový lučištník', spr:'gob3', hp:16, dmg:[3,6], arm:2, spd:100, xp:10, ai:'ranged', d:[2,99]},
  {id:'shaman', name:'Skřetí šaman', spr:'shaman1', hp:18, dmg:[3,6], arm:1, spd:100, xp:13, ai:'healer', d:[3,99], el:'poison', res:{poison:25}},
  {id:'mine', name:'Výtrusná mina', spr:'spore_mine', hp:6, dmg:[6,10], arm:0, spd:100, xp:3, ai:'mine', d:[3,99], el:'poison', sc:0.8},
  {id:'crawler', name:'Mycelový lezoun', spr:'crawler', hp:22, dmg:[4,8], arm:4, spd:110, xp:11, ai:'melee', d:[4,99], res:{poison:20}},
  {id:'stalker', name:'Stopař', spr:'stalker', hp:28, dmg:[5,9], arm:4, spd:100, xp:14, ai:'melee', d:[5,99], el:'poison', res:{poison:40}},
  {id:'witch', name:'Popelavá čarodějka', spr:'witch1', hp:22, dmg:[5,9], arm:1, spd:100, xp:16, ai:'caster', d:[5,99], el:'fire', res:{fire:50}, light:[1,0.5,0.2]},
  {id:'hog', name:'Hnilobný kanec', spr:'boar', hp:36, dmg:[6,11], arm:6, spd:100, xp:18, ai:'charger', d:[6,99]},
  {id:'moth', name:'Zhoubná můra', spr:'moth', hp:14, dmg:[4,7], arm:0, spd:130, xp:10, ai:'swarm', d:[6,99], el:'decay', light:[0.5,0.45,0.9], res:{decay:40}},
  {id:'tentacle', name:'Hlubinné chapadlo', spr:'tentacle', hp:40, dmg:[6,10], arm:3, spd:100, xp:16, ai:'lasher', d:[7,99], el:'decay', res:{decay:30}},
  {id:'octo', name:'Sporonožec', spr:'spore_octo', hp:30, dmg:[5,9], arm:2, spd:90, xp:16, ai:'caster', d:[7,99], el:'decay', light:[0.8,0.3,0.6], res:{decay:40}, puddle:true},
  {id:'burster', name:'Praskavec', spr:'burster', hp:22, dmg:[8,14], arm:0, spd:100, xp:14, ai:'burster', d:[7,99], el:'fire', light:[1,0.4,0.2], res:{fire:60}},
  {id:'maw', name:'Chřtán', spr:'maw', hp:48, dmg:[7,13], arm:10, spd:90, xp:22, ai:'melee', d:[9,99], res:{poison:20,fire:20}},
  {id:'bear', name:'Plesnivý medvěd', spr:'bear', hp:70, dmg:[9,15], arm:8, spd:95, xp:30, ai:'charger', d:[10,99], sc:1.2},
  {id:'troll', name:'Mechový troll', spr:'moss_troll', hp:80, dmg:[9,16], arm:9, spd:90, xp:34, ai:'melee', d:[10,99], sc:1.35, regen:0.03, res:{poison:30}},
  {id:'eyes', name:'Mnohooký', spr:'spore_eyes', hp:38, dmg:[7,12], arm:3, spd:100, xp:24, ai:'caster', d:[11,99], el:'decay', light:[0.6,0.9,0.4], res:{decay:50}, puddle:true},
  {id:'jelly', name:'Utopený medúzák', spr:'shroom_jelly', hp:42, dmg:[7,12], arm:4, spd:100, xp:24, ai:'melee', d:[11,99], el:'poison', light:[0.4,0.8,1], res:{fire:40,poison:40}},
  {id:'warlock', name:'Mykotický warlock', spr:'warlock', hp:34, dmg:[7,11], arm:2, spd:100, xp:26, ai:'healer', d:[12,99], el:'decay', res:{decay:40}},
  {id:'void', name:'Prázdnoústý', spr:'void_maw', hp:54, dmg:[9,15], arm:5, spd:100, xp:30, ai:'ranged', d:[13,99], el:'decay', light:[0.7,0.3,1], res:{decay:50,poison:30}},
  {id:'gazer', name:'Pozorovatel', spr:'gazer_big', hp:62, dmg:[10,16], arm:5, spd:90, xp:36, ai:'caster', d:[15,99], el:'decay', res:{decay:40,fire:30}, puddle:true},
];
// boss patterns: slam, charge, nova, spit, summon
export const BOSSES=[
  {id:'b_moss', name:'Zarostlý Gor', spr:'boss_moss', hp:380, dmg:[11,19], arm:12, spd:90, xp:220, ai:'boss', sc:1.7, el:null, pat:['slam','charge','summon'], res:{poison:30}, adds:'gob'},
  {id:'b_carrier', name:'Nosič Výtrusů', spr:'boss_carrier', hp:420, dmg:[11,19], arm:10, spd:90, xp:260, ai:'boss', sc:1.7, el:'poison', pat:['spit','slam','summon'], res:{poison:60}, adds:'blob'},
  {id:'b_giant', name:'Houbový obr Murg', spr:'boss_giant', hp:520, dmg:[13,22], arm:14, spd:85, xp:300, ai:'boss', sc:1.85, el:null, pat:['slam','nova','charge'], res:{fire:30,decay:30}, adds:'stalker'},
  {id:'b_treant', name:'Hnilokorý', spr:'treant', hp:480, dmg:[12,20], arm:13, spd:85, xp:290, ai:'boss', sc:1.85, el:'decay', pat:['nova','spit','summon'], res:{decay:60,fire:-25}, adds:'tentacle'},
  {id:'b_mother', name:'Matka Plodnic', spr:'shroom_house3', hp:450, dmg:[12,20], arm:10, spd:80, xp:300, ai:'boss', sc:1.6, el:'poison', pat:['summon','spit','nova'], res:{poison:75}, adds:'capling'},
  {id:'b_giant2', name:'Tichý Kolos', spr:'boss_giant2', hp:600, dmg:[14,24], arm:16, spd:85, xp:340, ai:'boss', sc:1.9, el:'fire', pat:['charge','slam','nova'], res:{fire:50}, adds:'witch'},
];
// unique mini-bosses (named rares that can appear on any floor)
export const MINIBOSSES=[
  {name:'Skřetí náčelník Brug', base:'gob', spr:'gob_rag', mods:['huge','berserk']},
  {name:'Slepá Ochmýřenka', base:'moth', spr:'moth', mods:['swift','vampiric']},
  {name:'Krčící Trn', base:'stalker', spr:'root_horror', mods:['reflect','regen']},
  {name:'Šaman Hnisopád', base:'shaman', spr:'shaman2', mods:['summoner','shielded']},
  {name:'Chřtán Bezedný', base:'maw', spr:'void_maw', mods:['huge','vampiric','armored']},
  {name:'Kořenná Babizna', base:'witch', spr:'witch2', mods:['blinker','fireench']},
];
export const MON_MODS=[
  {id:'venom', name:'Jedovatý', tint:[0.75,1.05,0.65]},
  {id:'swift', name:'Rychlý', tint:[0.95,0.95,1.1]},
  {id:'armored', name:'Obrněný', tint:[0.8,0.85,0.95]},
  {id:'vampiric', name:'Upíří', tint:[1.15,0.7,0.7]},
  {id:'explosive', name:'Výbušný', tint:[1.15,0.85,0.6]},
  {id:'huge', name:'Obří', tint:[1,1,1]},
  {id:'berserk', name:'Zuřivý', tint:[1.2,0.8,0.7]},
  {id:'regen', name:'Regenerující', tint:[0.8,1.1,0.8]},
  {id:'reflect', name:'Zrcadlový', tint:[0.9,1,1.2], desc:'odráží 20 % poškození'},
  {id:'shielded', name:'Štítonosný', tint:[0.85,0.95,1.15], desc:'výtrusný štít'},
  {id:'summoner', name:'Plodící', tint:[0.9,1.1,0.8]},
  {id:'blinker', name:'Mihotavý', tint:[0.9,0.8,1.15]},
  {id:'resist', name:'Odolný', tint:[0.95,0.95,0.95], desc:'+40 % odolnosti'},
  {id:'fireench', name:'Žhnoucí', tint:[1.2,0.85,0.6]},
  {id:'decayench', name:'Hnijící', tint:[0.95,0.75,1.15]},
];
export const MON_RARE_A=['Hnilobný','Bledý','Krvavý','Popelavý','Šeptavý','Prastarý','Mlžný','Zkažený'];
export const MON_RARE_B=['Zub','Pařát','Svit','Chřtán','Spár','Šepot','Kořen','Trn'];

export const SLOTS=['weapon','offhand','helm','chest','gloves','boots','amulet','ring1','ring2'];
export const SLOT_NAMES={weapon:'Zbraň',offhand:'Druhá ruka',helm:'Helma',chest:'Zbroj',gloves:'Rukavice',boots:'Boty',amulet:'Amulet',ring1:'Prsten',ring2:'Prsten'};
export const BASES=[
  {id:'sword', name:'Meč', slot:'weapon', spr:'sword', kind:'melee', dmg:[4,8], min:1},
  {id:'dagger', name:'Dýka', slot:'weapon', spr:'dagger_r', kind:'melee', dmg:[3,6], imp:{crit:5}, min:1},
  {id:'axe', name:'Sekera', slot:'weapon', spr:'axe', kind:'melee', dmg:[5,10], min:2},
  {id:'club', name:'Kyj', slot:'weapon', spr:'club', kind:'melee', dmg:[6,11], imp:{stun:5}, min:3},
  {id:'waraxe', name:'Výtrusná sekera', slot:'weapon', spr:'axe2', kind:'melee', dmg:[8,14], min:8},
  {id:'spikeclub', name:'Ostnatý palcát', slot:'weapon', spr:'club3', kind:'melee', dmg:[9,15], imp:{bleed:8}, min:10},
  {id:'fang', name:'Houbový tesák', slot:'weapon', spr:'dagger_p', kind:'melee', dmg:[6,10], imp:{crit:8}, min:12},
  {id:'spear', name:'Kopí', slot:'weapon', spr:'spear', kind:'melee', dmg:[5,9], imp:{reach:1}, min:4},
  {id:'bow', name:'Luk', slot:'weapon', spr:'bow', kind:'bow', dmg:[3,7], min:1},
  {id:'xbow', name:'Kuše', slot:'weapon', spr:'crossbow', kind:'bow', dmg:[6,11], min:6},
  {id:'staff', name:'Mycelová hůl', slot:'weapon', spr:'staff_moss', kind:'staff', dmg:[3,6], imp:{spell:20}, min:1},
  {id:'wand', name:'Houbová hůlka', slot:'weapon', spr:'wand_shroom', kind:'staff', dmg:[2,5], imp:{spell:30,mana:10}, min:3},
  {id:'cstaff', name:'Krystalová hůl', slot:'weapon', spr:'staff_crystal', kind:'staff', dmg:[5,9], imp:{spell:35}, min:9},
  {id:'sstaff', name:'Hůl vyvolávače', slot:'weapon', spr:'staff_purple', kind:'staff', dmg:[3,5], imp:{minionDmg:15}, min:1},
  {id:'shield', name:'Dřevěný štít', slot:'offhand', spr:'shield_wood', imp:{armor:6,block:10}, min:1},
  {id:'lshield', name:'Listový štít', slot:'offhand', spr:'shield_leaf', imp:{armor:10,block:14}, min:7},
  {id:'quiver', name:'Toulec', slot:'offhand', spr:'quiver', imp:{dmgPct:8}, min:2},
  {id:'tome', name:'Grimoár', slot:'offhand', spr:'tome', imp:{mana:15,spell:10}, min:2},
  {id:'mortar', name:'Hmoždíř výtrusů', slot:'offhand', spr:'mortar', imp:{minionLife:12}, min:1},
  {id:'fetish', name:'Fetiš divočiny', slot:'offhand', spr:'bag_shroom2', imp:{formPct:10}, min:2},
  {id:'lantern', name:'Lucerna', slot:'offhand', spr:'lantern', imp:{torch:1}, min:1},
  {id:'cap', name:'Klobouk z muchomůrky', slot:'helm', spr:'hat_slice1', imp:{armor:4}, min:1},
  {id:'cap2', name:'Hnědá kápě', slot:'helm', spr:'hat_slice4', imp:{armor:5,life:5}, min:3},
  {id:'cap3', name:'Fialový šlem', slot:'helm', spr:'hat_slice9', imp:{armor:6,mana:8}, min:8},
  {id:'browncap', name:'Ryzcová čepice', slot:'helm', spr:'hat_slice8', imp:{armor:3,mf:5}, min:1},
  {id:'hood', name:'Lovecká kápě', slot:'helm', spr:'hat_slice6', imp:{armor:3,dodge:4}, min:2},
  {id:'wizhat', name:'Čarodějný klobouk', slot:'helm', spr:'hat_slice3', imp:{spell:10,mana:6}, min:2},
  {id:'knighthelm', name:'Železný šlem', slot:'helm', spr:'hat_slice2', imp:{armor:9}, min:4},
  {id:'witchhat', name:'Klobouk bylinkářky', slot:'helm', spr:'hat_slice10', imp:{spell:6,mana:12}, min:5},
  {id:'shroomhelm', name:'Muchomůrkový šlem', slot:'helm', spr:'hat_slice7', imp:{armor:7,life:8}, min:6},
  {id:'wingedhelm', name:'Okřídlený šlem', slot:'helm', spr:'hat_slice11', imp:{armor:14,life:10}, min:12},
  {id:'mask', name:'Maska šelmy', slot:'helm', spr:'hat_slice14', imp:{armor:4,formLife:6}, min:1},
  {id:'mossarmor', name:'Mechová zbroj', slot:'chest', spr:'armor_moss', imp:{armor:10}, min:1},
  {id:'leafarmor', name:'Listová zbroj', slot:'chest', spr:'armor_leaf', imp:{armor:8,dodge:4}, min:4},
  {id:'barkarmor', name:'Kůrový krunýř', slot:'chest', spr:'armor_bark', imp:{armor:16}, min:9},
  {id:'cloak', name:'Mechový plášť', slot:'chest', spr:'cloak_moss', imp:{armor:6,dodge:6}, min:3},
  {id:'furarmor', name:'Kožich', slot:'chest', spr:'armor_leaf2', imp:{armor:9,formLife:8}, min:3},
  {id:'gloves', name:'Kožené rukavice', slot:'gloves', spr:'gloves', imp:{armor:3}, min:1},
  {id:'gauntlet', name:'Kořenová rukavice', slot:'gloves', spr:'gauntlet', imp:{armor:6}, min:6},
  {id:'boots', name:'Kožené boty', slot:'boots', spr:'boots_leather', imp:{armor:3}, min:1},
  {id:'boots2', name:'Cestovní boty', slot:'boots', spr:'boots_tan', imp:{armor:4,dodge:3}, min:5},
  {id:'amulet', name:'Amulet', slot:'amulet', spr:'amulet_green', imp:{}, min:1},
  {id:'amulet2', name:'Srdeční přívěšek', slot:'amulet', spr:'amulet_heart', imp:{life:8}, min:5},
  {id:'ring', name:'Prsten', slot:'ring', spr:'ring_gold', imp:{}, min:1},
  {id:'ring2', name:'Ametystový prsten', slot:'ring', spr:'ring_violet', imp:{mana:6}, min:4},
  // ---- v12 ----
  {id:'rotclub', name:'Hnilobný kyj', slot:'weapon', spr:'club2', kind:'melee', dmg:[7,13], imp:{meleePct:10}, min:6},
  {id:'firestaff', name:'Plamenná hůl', slot:'weapon', spr:'staff_red', kind:'staff', dmg:[4,8], imp:{spell:20,firePct:15}, min:6},
  {id:'venomstaff', name:'Hůl jedu', slot:'weapon', spr:'staff_green', kind:'staff', dmg:[3,7], imp:{spell:20,poisonPct:15}, min:5},
  {id:'hxbow', name:'Těžká kuše', slot:'weapon', spr:'crossbow2', kind:'bow', dmg:[8,14], imp:{projPct:10}, min:12},
  {id:'charm', name:'Houbový talisman', slot:'amulet', spr:'shrooms_purple', imp:{dot:8}, min:6},
  {id:'scroll', name:'Svitek hniloby', slot:'offhand', spr:'scroll', imp:{spell:8,ailDur:10}, min:6},
  {id:'barkshield', name:'Štít z kůry', slot:'offhand', spr:'shield_wood2', imp:{armor:14,block:12,dr:2}, min:12},
];
export const STAT_NAMES={life:'Život',mana:'Esence',armor:'Zbroj',dmg:'Fyzické poškození',dmgPct:'% poškození',crit:'% šance na kritický zásah',critMult:'% kritický násobič',
  fire:'Ohnivé poškození',poison:'Jedové poškození',decay:'Hnilobné poškození',poisonCh:'% šance otrávit',burnCh:'% šance zapálit',bleed:'% šance na krvácení',
  leech:'% vysátí života',regen:'Regenerace života / tah',manaRegen:'Regenerace esence / tah',res:'% ke všem odolnostem',resPoison:'% odolnost vůči jedu',resFire:'% odolnost vůči ohni',resDecay:'% odolnost vůči hnilobě',
  torch:'Dosah pochodně',mf:'% šance na kouzelné předměty',gf:'% více zlata',cdr:'% zkrácení přebíjení',thorns:'Trny',skill:'+ k úrovni všech dovedností',spell:'% poškození kouzel',
  dodge:'% úhyb',stun:'% šance omráčit',block:'% šance blokovat',might:'Síla',finesse:'Obratnost',wits:'Důvtip',xp:'% zkušeností',potion:'% účinnost lektvarů',reach:'Dosah zbraně',aoe:'+ k plošnému dosahu',
  lifePct:'% maximálního života',armorPct:'% zbroje',dot:'% násobič poškození v čase',pen:'% průraz odolností',lifeKill:'Život za zabití',physPct:'% fyzického poškození',elemPct:'% elementálního poškození',
  maxRes:'% k maximálním odolnostem',crushPct:'% poškození proti omráčeným',execPct:'% poškození proti raněným (<35 %)',
  minionDmg:'% poškození přisluhovačů',minionLife:'% života přisluhovačů',minionMax:'k maximu přisluhovačů',formPct:'% poškození v podobě zvířete',formLife:'% života v podobě zvířete',minionUpkeep:'% daň přisluhovačů (rezervovaný život)',
  firePct:'% ohnivého poškození',poisonPct:'% jedového poškození',decayPct:'% hnilobného poškození',meleePct:'% poškození zblízka',projPct:'% poškození projektilů',aoePct:'% plošného poškození',
  ailDur:'% délka neduhů',costRed:'% nižší cena dovedností',doubleDmg:'% šance na dvojnásobné poškození',regenPct:'% max. života regenerace / tah',manaKill:'Esence za zabití',
  weakCh:'% šance oslabit (−30 % poškození nepřítele)',fearCh:'% šance vyděsit',buffDur:'% délka posílení',dr:'% snížení utrženého poškození'};
export const PCT=new Set(['dmgPct','crit','critMult','poisonCh','burnCh','bleed','leech','res','resPoison','resFire','resDecay','mf','gf','cdr','spell','dodge','stun','block','xp','potion','lifePct','armorPct','dot','pen','physPct','elemPct','maxRes','crushPct','execPct','minionDmg','minionLife','formPct','formLife','minionUpkeep','firePct','poisonPct','decayPct','meleePct','projPct','aoePct','ailDur','costRed','doubleDmg','regenPct','weakCh','fearCh','buffDur','dr']);
export const AFFIXES=[
  {id:'life', s:'life', v:[6,12], sc:'exp', slots:'*', p:'P', name:['Houževnatý','Životný']},
  {id:'lifePct', s:'lifePct', v:[4,8], sc:'lin', slots:'chest,helm,amulet,offhand', p:'P', name:['Mízný'], cap:20},
  {id:'mana', s:'mana', v:[5,10], sc:'exp', slots:'helm,amulet,ring,offhand,weapon,chest', p:'P', name:['Esenciální']},
  {id:'armor', s:'armor', v:[4,9], sc:'exp', slots:'helm,chest,gloves,boots,offhand', p:'P', name:['Kůrový','Pancéřový']},
  {id:'armorPct', s:'armorPct', v:[15,35], sc:'lin', slots:'chest,helm,offhand,boots,gloves', p:'P', name:['Zatvrzelý']},
  {id:'dmg', s:'dmg', v:[2,5], sc:'exp', slots:'weapon,gloves,ring,amulet,offhand', p:'P', name:['Ostrý','Krutý']},
  {id:'dmgPct', s:'dmgPct', v:[8,18], sc:'lin', slots:'weapon,amulet,gloves,offhand', p:'P', name:['Zuřivý','Drtivý']},
  {id:'physPct', s:'physPct', v:[12,28], sc:'lin', slots:'weapon,gloves,amulet', p:'P', name:['Brutální']},
  {id:'elemPct', s:'elemPct', v:[12,28], sc:'lin', slots:'weapon,amulet,ring,offhand', p:'P', name:['Živelný']},
  {id:'fire', s:'fire', v:[2,5], sc:'exp', slots:'weapon,gloves,ring,amulet', p:'P', name:['Doutnající','Žhnoucí']},
  {id:'poison', s:'poison', v:[2,5], sc:'exp', slots:'weapon,gloves,ring,amulet', p:'P', name:['Jedovatý','Výtrusný']},
  {id:'decay', s:'decay', v:[2,5], sc:'exp', slots:'weapon,ring,amulet', p:'P', name:['Hnijící']},
  {id:'spell', s:'spell', v:[8,18], sc:'lin', slots:'weapon,offhand,helm,amulet', p:'P', name:['Mystický','Šeptající']},
  {id:'dot', s:'dot', v:[8,18], sc:'lin', slots:'weapon,amulet,gloves,offhand', p:'P', name:['Rozkladný'], cap:60},
  {id:'crit', s:'crit', v:[2,4], sc:'lin', slots:'weapon,gloves,ring,amulet,helm', p:'S', name:['Přesnosti'], cap:20},
  {id:'critMult', s:'critMult', v:[10,25], sc:'lin', slots:'weapon,amulet,gloves', p:'S', name:['Zkázy']},
  {id:'poisonCh', s:'poisonCh', v:[6,14], sc:'lin', slots:'weapon,gloves,ring', p:'S', name:['Nákazy'], cap:60},
  {id:'burnCh', s:'burnCh', v:[6,14], sc:'lin', slots:'weapon,gloves,ring', p:'S', name:['Spáleniště'], cap:60},
  {id:'bleed', s:'bleed', v:[6,14], sc:'lin', slots:'weapon,gloves', p:'S', name:['Krveprolití'], cap:60},
  {id:'pen', s:'pen', v:[4,9], sc:'lin', slots:'weapon,amulet,gloves', p:'S', name:['Průrazu'], cap:30},
  {id:'leech', s:'leech', v:[1,2], sc:'lin', slots:'weapon,ring,amulet,gloves', p:'S', name:['Pijavice'], cap:8},
  {id:'lifeKill', s:'lifeKill', v:[2,5], sc:'exp', slots:'weapon,gloves,ring', p:'S', name:['Hodokvasu']},
  {id:'regen', s:'regen', v:[0.5,1.2], sc:'exp', slots:'chest,helm,amulet,ring,boots', p:'S', name:['Obnovy']},
  {id:'manaRegen', s:'manaRegen', v:[0.6,1.2], sc:'exp', slots:'helm,amulet,ring,offhand,weapon', p:'S', name:['Rozjímání']},
  {id:'res', s:'res', v:[3,7], sc:'lin', slots:'chest,helm,boots,offhand,amulet,ring', p:'S', name:['Odolnosti'], cap:20},
  {id:'resPoison', s:'resPoison', v:[10,22], sc:'lin', slots:'chest,helm,boots,gloves,ring,offhand,amulet', p:'S', name:['Protijedu'], cap:48},
  {id:'resFire', s:'resFire', v:[10,22], sc:'lin', slots:'chest,helm,boots,gloves,ring,offhand,amulet', p:'S', name:['Popela'], cap:48},
  {id:'resDecay', s:'resDecay', v:[10,22], sc:'lin', slots:'chest,helm,boots,gloves,ring,offhand,amulet', p:'S', name:['Věčnosti'], cap:48},
  {id:'maxRes', s:'maxRes', v:[1,2], sc:'none', slots:'chest,offhand', p:'S', name:['Nezdolnosti'], rare:0.2, cap:3},
  {id:'torch', s:'torch', v:[1,1], sc:'none', slots:'helm,offhand,amulet', p:'S', name:['Plamene'], cap:3},
  {id:'mf', s:'mf', v:[6,14], sc:'lin', slots:'helm,amulet,ring,boots', p:'S', name:['Štěstí']},
  {id:'gf', s:'gf', v:[10,25], sc:'lin', slots:'gloves,amulet,ring', p:'S', name:['Lakoty']},
  {id:'cdr', s:'cdr', v:[4,8], sc:'lin', slots:'helm,amulet,gloves,offhand', p:'S', name:['Spěchu'], cap:30},
  {id:'thorns', s:'thorns', v:[2,5], sc:'exp', slots:'chest,offhand,helm', p:'S', name:['Bodláku']},
  {id:'skill', s:'skill', v:[1,1], sc:'none', slots:'amulet,weapon,helm', p:'S', name:['Mistrovství'], rare:0.3, cap:3},
  {id:'dodge', s:'dodge', v:[2,5], sc:'lin', slots:'boots,chest,gloves', p:'S', name:['Stínu'], cap:20},
  {id:'stun', s:'stun', v:[4,9], sc:'lin', slots:'weapon,offhand', p:'S', name:['Otřesu'], cap:40},
  {id:'execPct', s:'execPct', v:[15,35], sc:'lin', slots:'weapon,gloves,ring', p:'S', name:['Popravy']},
  {id:'might', s:'might', v:[2,5], sc:'exp', slots:'*', p:'S', name:['Síly']},
  {id:'finesse', s:'finesse', v:[2,5], sc:'exp', slots:'*', p:'S', name:['Mrštnosti']},
  {id:'wits', s:'wits', v:[2,5], sc:'exp', slots:'*', p:'S', name:['Důvtipu']},
  {id:'xp', s:'xp', v:[4,9], sc:'lin', slots:'helm,amulet,ring', p:'S', name:['Moudrosti']},
  {id:'potion', s:'potion', v:[10,25], sc:'lin', slots:'chest,amulet,gloves', p:'S', name:['Alchymie']},
  {id:'minionDmg', s:'minionDmg', v:[10,22], sc:'lin', slots:'weapon,offhand,helm,amulet,ring,gloves', p:'P', name:['Vůdčí','Hnízdní']},
  {id:'minionLife', s:'minionLife', v:[10,22], sc:'lin', slots:'offhand,helm,chest,amulet,boots', p:'P', name:['Plodný']},
  {id:'minionMax', s:'minionMax', v:[1,1], sc:'none', slots:'amulet,helm', p:'S', name:['Roje'], rare:0.15, cap:2},
  {id:'formPct', s:'formPct', v:[10,22], sc:'lin', slots:'weapon,gloves,amulet,helm,offhand', p:'P', name:['Divoký','Zvířecí']},
  {id:'formLife', s:'formLife', v:[6,14], sc:'lin', slots:'chest,helm,boots,amulet', p:'S', name:['Šelmy'], cap:40},
  {id:'aoe', s:'aoe', v:[1,1], sc:'none', slots:'weapon,amulet', p:'S', name:['Rozpínání'], rare:0.2, cap:2},
  // ---- v12 ----
  {id:'firePct', s:'firePct', v:[10,22], sc:'lin', slots:'weapon,amulet,ring,gloves,offhand', p:'P', name:['Planoucí']},
  {id:'poisonPct', s:'poisonPct', v:[10,22], sc:'lin', slots:'weapon,amulet,ring,gloves,offhand', p:'P', name:['Morový']},
  {id:'decayPct', s:'decayPct', v:[10,22], sc:'lin', slots:'weapon,amulet,ring,gloves,offhand', p:'P', name:['Tlející']},
  {id:'meleePct', s:'meleePct', v:[10,22], sc:'lin', slots:'weapon,gloves,amulet,ring', p:'P', name:['Rváčský']},
  {id:'projPct', s:'projPct', v:[10,22], sc:'lin', slots:'weapon,gloves,amulet,ring,offhand', p:'P', name:['Střelecký']},
  {id:'aoePct', s:'aoePct', v:[10,22], sc:'lin', slots:'weapon,amulet,gloves,helm', p:'P', name:['Rozlehlý']},
  {id:'ailDur', s:'ailDur', v:[8,16], sc:'lin', slots:'weapon,gloves,amulet,ring,boots', p:'S', name:['Vleklosti'], cap:40},
  {id:'costRed', s:'costRed', v:[4,8], sc:'lin', slots:'helm,amulet,ring,gloves', p:'S', name:['Úspory'], cap:25},
  {id:'doubleDmg', s:'doubleDmg', v:[2,4], sc:'lin', slots:'weapon,gloves,ring', p:'S', name:['Dvojrány'], cap:12},
  {id:'regenPct', s:'regenPct', v:[1,1], sc:'none', slots:'chest,amulet,ring,boots,helm', p:'S', name:['Hojení'], rare:0.4, cap:2},
  {id:'manaKill', s:'manaKill', v:[2,4], sc:'exp', slots:'weapon,ring,amulet', p:'S', name:['Sběru']},
  {id:'weakCh', s:'weakCh', v:[5,10], sc:'lin', slots:'weapon,gloves,offhand', p:'S', name:['Únavy'], cap:30},
  {id:'fearCh', s:'fearCh', v:[4,8], sc:'lin', slots:'weapon,helm,offhand', p:'S', name:['Hrůzy'], cap:25},
  {id:'buffDur', s:'buffDur', v:[8,16], sc:'lin', slots:'helm,amulet,chest,offhand', p:'S', name:['Vytrvalosti'], cap:50},
  {id:'dr', s:'dr', v:[2,4], sc:'lin', slots:'chest,offhand,helm,boots', p:'S', name:['Pevnosti'], rare:0.5, cap:10},
];
export const RARITY=[
  {id:'common', name:'Obyčejný', color:'#c9c2b4', aff:[0,0]},
  {id:'magic', name:'Kouzelný', color:'#7fa8ff', aff:[1,2]},
  {id:'rare', name:'Vzácný', color:'#f2d36b', aff:[3,5]},
  {id:'legendary', name:'Legendární', color:'#f08a3c', aff:[2,3]},
  {id:'sporeborn', name:'Výtrusorozený', color:'#9df07a', aff:[5,6]},
  {id:'set', name:'Sadový', color:'#cf7cff', aff:[1,2]},
];
export const RARE_A=['Hnilobný','Tichý','Mrazivý','Bledý','Zarostlý','Prastarý','Zkažený','Šeptavý','Krvavý','Popelavý','Dutý','Mlžný'];
export const RARE_B=['Spár','Kořen','Výtrus','Trn','Stín','Chřtán','Klobouk','Zub','Svit','Šepot','Hrob','Pařez'];

export const UNIQUES=[
  {id:'drowned_lantern', name:'Lucerna Utopených', base:'lantern', spr:'lantern2', fixed:{torch:3,res:10}, power:'Nepřátelé v blízkosti pochodně (60 % dosahu) mají každý tah 25 % + tvá šance zapálit, že vzplanou. Oheň sílí s ohnivým poškozením, silou kouzel, elementálním poškozením a násobičem v čase.'},
  {id:'mycel_crown', name:'Koruna Mycelia', base:'cap3', spr:'hat_slice12', fixed:{poisonCh:20,dot:20}, power:'Otrávení nepřátelé při smrti přenesou všechny své stacky jedu na sousedy.'},
  {id:'spore_grip', name:'Hrst Výtrusníka', base:'gloves', spr:'gauntlet', fixed:{spell:20,mana:15}, power:'Výtrusná střela vystřelí 2 další střely na blízké cíle.'},
  {id:'rotheart', name:'Srdce Hniloby', base:'barkarmor', spr:'armor_moss2', fixed:{life:40,regen:4}, power:'Regenerace života je trojnásobná, ale lektvary neléčí.'},
  {id:'rootblade', name:'Kořenová Čepel', base:'sword', spr:'sword2', fixed:{physPct:40,bleed:15}, power:'25% šance, že zásah nablízko zakoření cíl na 2 tahy.'},
  {id:'thistle', name:'Bodlák', base:'lshield', spr:'shield_wood2', fixed:{thorns:8,block:10}, power:'Trny vrací 40 % utrženého poškození.'},
  {id:'echo_ring', name:'Prsten Ozvěny', base:'ring', spr:'ring_violet', fixed:{cdr:10,mana:10}, power:'Dovednosti mají 25% šanci nespustit přebíjení.'},
  {id:'silent_step', name:'Boty Tichého kroku', base:'boots2', spr:'boots_tan', fixed:{dodge:10,crit:4}, power:'Po 3 krocích bez útoku je další útok kritický.'},
  {id:'puff_staff', name:'Prášnice', base:'staff', spr:'staff_green', fixed:{spell:40,poison:6}, power:'Výtrusná bomba má o 1 větší dosah a zanechává jedový mrak.'},
  {id:'hunger', name:'Hlad Chřtánu', base:'fang', spr:'dagger_p', fixed:{leech:4,crit:8}, power:'Zabití obnoví 8 % života a esence.'},
  {id:'fruiting', name:'Plodnice', base:'amulet', spr:'shrooms_red2', fixed:{poison:5,dot:15}, power:'Každý jed, který způsobíš, se aplikuje dvakrát.'},
  {id:'ash_crown', name:'Popelavá koruna', base:'cap', spr:'hat_slice5', fixed:{fire:5,burnCh:20}, power:'Hořící nepřátelé při smrti zapálí všechny sousedy.'},
  {id:'sprouting', name:'Klíčící čepel', base:'axe', spr:'axe2', fixed:{dmgPct:30,lifeKill:6}, power:'Každé zabití zanechá výtrusnou minu, která příští tah vybuchne (60 % zbraně, plocha 1).'},
  {id:'storm_eye', name:'Oko bouře', base:'ring2', spr:'ring_gold', fixed:{elemPct:25,pen:8}, power:'Všechny tvé zásahy dovedností se odrazí na 1 další cíl.'},
  {id:'mycel_cloak', name:'Myceliový plášť', base:'cloak', spr:'cloak_dark', fixed:{mana:40,manaRegen:2}, power:'30 % utrženého poškození jde nejdřív z esence.'},
  {id:'devour_root', name:'Žravý kořen', base:'gauntlet', spr:'gloves', fixed:{dot:25,leech:2}, power:'Vysátí života funguje i z poškození v čase (jed, oheň, krvácení).'},
  {id:'centipede', name:'Tisícinožky', base:'boots', spr:'boots_leather', fixed:{dodge:6,finesse:10}, power:'Zabití má 30% šanci ti dát tah navíc.'},
  {id:'bone_bow', name:'Kostěný luk', base:'xbow', spr:'crossbow2', fixed:{crit:6,critMult:40}, power:'Tvé šípy se rozštěpí: každý útok luku zasáhne i 2 další cíle za 60 %.'},
  {id:'twin_tome', name:'Dvojitý grimoár', base:'tome', spr:'scroll', fixed:{spell:25,cdr:8}, power:'Kouzla se zopakují za 50 % poškození.'},
  {id:'hive_crown', name:'Koruna úlu', base:'cap3', spr:'hat_slice13', fixed:{minionMax:1,minionDmg:25}, power:'Přisluhovači při smrti vybuchnou za 50 % svého max. života (jed, plocha 1).'},
  {id:'mother_staff', name:'Hůl Matky plodnic', base:'sstaff', spr:'staff_shroom', fixed:{spell:20,minionDmg:40}, power:'Výtrusníci se vyvolávají po 3 místo po 2.'},
  {id:'rot_totem', name:'Hnijící totem', base:'mortar', spr:'mortar', fixed:{minionLife:35,minionUpkeep:-15}, power:'Přisluhovači regenerují 4 % života za tah a jejich zásahy vždy otráví.'},
  {id:'pact_ring', name:'Prsten paktu', base:'ring', spr:'ring_violet', fixed:{minionDmg:15,mana:10}, power:'Za každého živého přisluhovače máš +6 % více poškození a +2 % úhyb.'},
  {id:'bear_pelt', name:'Kůže Starého medvěda', base:'furarmor', spr:'armor_leaf2', fixed:{formLife:25,armor:20}, power:'V medvědí podobě +15 % šance blokovat a trny ve výši 10 % tvé zbroje.'},
  {id:'boar_tusk', name:'Kančí kel', base:'fetish', spr:'bag_shroom2', fixed:{formPct:30,crit:5}, power:'Náraz se nezastaví – probodne všechny nepřátele v linii.'},
  {id:'moon_mask', name:'Maska úplňku', base:'mask', spr:'hat_slice15', fixed:{formPct:20,crit:4}, power:'Každá proměna ti dá na 3 tahy +50 % poškození.'},
  {id:'root_spear', name:'Kořenové kopí', base:'spear', spr:'spear', fixed:{physPct:30,formLife:10}, power:'Spoutání kořeny přeskočí na 2 sousední nepřátele a Drtivý úder zakoření cíl.'},
  {id:'blood_idol', name:'Krvavý idol', base:'amulet2', spr:'amulet_heart', fixed:{lifePct:15,leech:2}, power:'Dovednosti stojí život místo esence; +40 % poškození dovedností.'},
  // ---- v12 ----
  {id:'gutripper', name:'Střevorvač', base:'waraxe', spr:'axe2', fixed:{meleePct:30,bleed:20}, power:'Krvácení se nepřepisuje, ale roste: každé další krvácení přidá 50 % svého poškození k tomu, co už na cíli je.'},
  {id:'sporemother', name:'Luk Sporomatky', base:'bow', spr:'bow', fixed:{projPct:30,poisonCh:20}, power:'Tvé šípy zanechají v místě zásahu jedový obláček na 2 tahy.'},
  {id:'kingsbane', name:'Zhouba králů', base:'fang', spr:'dagger_p', fixed:{doubleDmg:8,crit:5}, power:'Proti bossům, vzácným a jedinečným nepřátelům způsobuješ o 40 % více poškození.'},
  {id:'chorus_staff', name:'Hůl sboru', base:'cstaff', spr:'staff_crystal', fixed:{spell:40,aoePct:20}, power:'Plošná kouzla mají o 1 větší dosah.'},
  {id:'emberheart', name:'Uhlíkové srdce', base:'amulet', spr:'amulet_green', fixed:{firePct:30,burnCh:15}, power:'Hořící nepřátelé utrží o 25 % více poškození ode všeho (i od přisluhovačů).'},
  {id:'witherhand', name:'Uvadlá ruka', base:'gloves', spr:'gloves', fixed:{decayPct:30,weakCh:15}, power:'Oslabení nepřátelé utrží o 20 % více poškození a nemohou regenerovat.'},
  {id:'grave_shroud', name:'Rubáš z hrobu', base:'cloak', spr:'cloak_moss', fixed:{dodge:8,dr:5}, power:'Zásah za víc než 20 % tvého života tě na 2 tahy učiní nehmotným: +40 % úhyb (max 75 %).'},
  {id:'mirelegs', name:'Bahenní holínky', base:'boots', spr:'boots_leather', fixed:{dodge:4,ailDur:15}, power:'Nepřátelé, kteří tě zasáhnou zblízka, jsou na 2 tahy zpomaleni.'},
  {id:'hollow_crown', name:'Dutá koruna', base:'witchhat', spr:'hat_slice10', fixed:{spell:25,costRed:15}, power:'Když máš víc než 90 % esence, kouzla způsobují o 30 % více poškození.'},
  {id:'twin_fang', name:'Dvojzub', base:'dagger', spr:'dagger_r', fixed:{doubleDmg:6,finesse:8}, power:'Základní útok zasáhne dvakrát (druhý zásah za 50 %).'},
  {id:'oakheart', name:'Dubové srdce', base:'barkarmor', spr:'armor_bark', fixed:{lifePct:15,regenPct:1}, power:'Za každých 10 % chybějícího života utrpíš o 3 % méně poškození.'},
  {id:'bulwark', name:'Kořenný val', base:'barkshield', spr:'shield_wood2', fixed:{block:10,dr:3}, power:'Každý blok ti dá na 3 tahy +15 % více poškození.'},
  {id:'swarmcaller', name:'Volání roje', base:'sstaff', spr:'staff_purple', fixed:{minionDmg:30,minionMax:1}, power:'Výtrusný roj vyvolá 5 mušek a žijí o 5 tahů déle.'},
  {id:'nursery', name:'Školka', base:'mortar', spr:'mortar', fixed:{minionLife:30,regen:2}, power:'Když přisluhovač zabije nepřítele, vyléčí se o 20 % a tobě obnoví 3 % esence.'},
  {id:'alpha_pelt', name:'Kožich alfy', base:'furarmor', spr:'armor_leaf2', fixed:{formPct:20,formLife:20}, power:'Duch vlka nezmizí a v podobě zvířete způsobuje o 50 % více poškození.'},
  {id:'tusked_helm', name:'Klektavý šlem', base:'shroomhelm', spr:'hat_slice7', fixed:{formPct:15,fearCh:10}, power:'Vytí má dvojnásobný dosah a vyděšení nepřátelé utrží o 25 % více poškození.'},
  {id:'cinder_quiver', name:'Popelavý toulec', base:'quiver', spr:'quiver', fixed:{firePct:25,burnCh:15}, power:'50 % fyzického poškození šípů se mění na oheň.'},
  {id:'void_ring', name:'Prsten prázdnoty', base:'ring2', spr:'ring_violet', fixed:{pen:10,decayPct:20}, power:'Hnilobné poškození ignoruje navíc 20 % odolnosti.'},
  {id:'spore_lungs', name:'Výtrusné plíce', base:'amulet2', spr:'amulet_heart', fixed:{poisonPct:25,resPoison:30}, power:'Jed na tebe nepůsobí jako neduh a jedová jezírka ti neublíží. Nepřátelé vedle tebe jsou každý tah otráveni (30 % kouzla).'},
  {id:'rotting_tome', name:'Hnijící kodex', base:'scroll', spr:'scroll', fixed:{ailDur:30,dot:20}, power:'Když zemře nepřítel s neduhy, přeskočí jeho jed, oheň i krvácení na nejbližšího nepřítele do vzdálenosti 3.'},
  {id:'headsman', name:'Katova sekera', base:'axe', spr:'axe', fixed:{physPct:35,execPct:40}, power:'Zabití sníží přebíjení všech dovedností o 1 (jednou za tah).'},
  {id:'firefly_lantern', name:'Lucerna světlušek', base:'lantern', spr:'lantern', fixed:{torch:2,projPct:20}, power:'Každý 3. tah vyletí světluška a zasáhne nejbližšího viditelného nepřítele za 80 % kouzla (oheň).'},
  {id:'heartwood', name:'Hůl jádrového dřeva', base:'venomstaff', spr:'staff_green', fixed:{poisonPct:40,spell:20}, power:'Tvá kouzla vždy otráví.'},
  {id:'oathring', name:'Prsten přísahy', base:'ring', spr:'ring_gold', fixed:{dr:4,life:20}, power:'Dokud máš plný život, způsobuješ o 25 % více poškození.'},
  {id:'moth_wings', name:'Můří křídla', base:'leafarmor', spr:'armor_leaf', fixed:{dodge:10,buffDur:20}, power:'Výtrusný skok a Krok stínem nemají přebíjení, ale stojí dvojnásobek.'},
  {id:'bonebreaker', name:'Kostolam', base:'spikeclub', spr:'club3', fixed:{stun:15,physPct:25}, power:'Omráčení nepřátelé utrží o 40 % více poškození a tvé omráčení trvá o 1 tah déle.'},
];
// ---------- sets ----------
export const SETS=[
  {id:'ulmyr', name:'Odkaz Ul-Myru', pieces:[{base:'cap3',name:'Diadém zvonaře',fixed:{spell:15,mana:20}},{base:'amulet',name:'Pečeť královny Mirun',fixed:{wits:8,manaRegen:1}},{base:'ring2',name:'Prsten Velkého Zakořenění',fixed:{spell:10,cdr:5}},{base:'tome',name:'Kronika Ul-Myru',fixed:{spell:15,mana:15}}],
    bonus:{2:{spell:25,mana:20},3:{skill:1,manaRegen:1.5}}, power:'Kouzla mají 25% šanci nestát esenci a +20 % více poškození.'},
  {id:'bladeset', name:'Krev šermíře', pieces:[{base:'sword',name:'Čepel rudé mízy',fixed:{physPct:25,bleed:10}},{base:'gauntlet',name:'Krvavé rukavice',fixed:{crit:3,dmgPct:15}},{base:'boots2',name:'Tanečníkovy boty',fixed:{dodge:5,finesse:6}},{base:'cap2',name:'Šermířská kápě',fixed:{life:20,critMult:15}}],
    bonus:{2:{physPct:25,bleed:10},3:{crit:5,critMult:30}}, power:'Krvácející nepřátelé utrží o 35 % více poškození.'},
  {id:'wardset', name:'Kořenová hradba', pieces:[{base:'lshield',name:'Štít Prastarého dubu',fixed:{armorPct:30,block:5}},{base:'barkarmor',name:'Kůra hradby',fixed:{life:30,armorPct:20}},{base:'gloves',name:'Kořenové dlaně',fixed:{stun:8,armor:10}},{base:'cap',name:'Klobouk strážce',fixed:{res:6,life:15}}],
    bonus:{2:{armorPct:40,life:30},3:{block:8,thorns:6}}, power:'Každý blok tě vyléčí o 4 % života a omráčí útočníka.'},
  {id:'hunterset', name:'Stín lovce', pieces:[{base:'bow',name:'Luk tichého stínu',fixed:{crit:4,critMult:20}},{base:'quiver',name:'Toulec z pavučin',fixed:{dmgPct:20,pen:5}},{base:'cloak',name:'Plášť bez hvězd',fixed:{dodge:6,finesse:6}},{base:'boots2',name:'Kroky ve tmě',fixed:{dodge:4,crit:2}}],
    bonus:{2:{crit:4,dmgPct:20},3:{dodge:8,critMult:25}}, power:'Salva vystřelí o 2 šípy víc a kritické zásahy zkrátí přebíjení dovedností o 1 (max 1× za akci).'},
  {id:'hiveset', name:'Hnízdo Matky', pieces:[{base:'sstaff',name:'Žezlo Matky plodnic',fixed:{minionDmg:25,spell:10}},{base:'mortar',name:'Hmoždíř hnízda',fixed:{minionLife:25,mana:10}},{base:'cap3',name:'Klobouk úlu',fixed:{minionDmg:15,life:15}},{base:'amulet2',name:'Srdce hnízda',fixed:{minionLife:15,wits:6}}],
    bonus:{2:{minionLife:30,minionDmg:20},3:{minionMax:1,minionUpkeep:-25}}, power:'Přisluhovači mají +40 % více poškození a jejich zabití tě vyléčí o 3 % života.'},
  {id:'shiftset', name:'Šat Měňavce', pieces:[{base:'spear',name:'Kopí dvojí krve',fixed:{formPct:20,physPct:15}},{base:'furarmor',name:'Kožich měňavce',fixed:{formLife:15,armor:15}},{base:'mask',name:'Maska bez tváře',fixed:{formPct:15,crit:3}},{base:'ring',name:'Prsten úplňku',fixed:{lifeKill:4,might:6}}],
    bonus:{2:{formPct:25,lifePct:8},3:{formLife:20,regen:2}}, power:'Proměna tě vyléčí o 20 % života a podoby nemají přebíjení.'},
  // ---- v12 ----
  {id:'plagueset', name:'Mor ze Šedých bažin', pieces:[{base:'venomstaff',name:'Hůl morového doktora',fixed:{poisonPct:20,spell:10}},{base:'wizhat',name:'Klobouk morového doktora',fixed:{dot:15,mana:15}},{base:'cloak',name:'Voskovaný plášť',fixed:{resPoison:20,dodge:4}},{base:'gloves',name:'Rukavice z žabí kůže',fixed:{poisonCh:10,ailDur:10}}],
    bonus:{2:{poisonPct:20,ailDur:15},3:{dot:25,pen:5}}, power:'Jed na nepřátelích se každý tah rozšíří na jednoho souseda (50 % nejsilnějšího stacku).'},
  {id:'emberset', name:'Žhavé uhlí', pieces:[{base:'firestaff',name:'Hůl věčného ohně',fixed:{firePct:20,spell:10}},{base:'amulet',name:'Uhlík v řetízku',fixed:{fire:4,burnCh:10}},{base:'ring',name:'Prsten z popela',fixed:{firePct:15,resFire:15}},{base:'boots',name:'Spálené boty',fixed:{dodge:4,burnCh:8}}],
    bonus:{2:{firePct:25,burnCh:10},3:{elemPct:20,pen:6}}, power:'Hořící nepřátelé při smrti vybuchnou za 25 % svého života (oheň, plocha 1).'},
  {id:'bloodset', name:'Krvavý přívrženec', pieces:[{base:'fang',name:'Tesák rudého přívržence',fixed:{leech:2,doubleDmg:4}},{base:'amulet2',name:'Srdce oběti',fixed:{lifePct:10,regen:2}},{base:'gauntlet',name:'Krvavé pěsti',fixed:{meleePct:20,bleed:10}},{base:'cap2',name:'Kápě přívržence',fixed:{life:25,lifeKill:4}}],
    bonus:{2:{lifePct:10,leech:2},3:{meleePct:25,doubleDmg:5}}, power:'Pod 50 % života způsobuješ o 40 % více poškození a vysáváš dvojnásobně.'},
  {id:'thornset', name:'Trnová koruna', pieces:[{base:'barkshield',name:'Trnitá stěna',fixed:{thorns:8,block:6}},{base:'shroomhelm',name:'Koruna z trní',fixed:{thorns:6,armorPct:20}},{base:'barkarmor',name:'Krunýř z trní',fixed:{armorPct:25,dr:3}},{base:'boots',name:'Kořenné boty',fixed:{armor:12,life:20}}],
    bonus:{2:{thorns:10,armorPct:30},3:{dr:5,block:6}}, power:'Trny zasáhnou všechny sousední nepřátele a s 25% šancí je omráčí.'},
  {id:'swarmset', name:'Šepot roje', pieces:[{base:'sstaff',name:'Hůl šeptajícího roje',fixed:{minionDmg:25,spell:10}},{base:'browncap',name:'Čepice včelaře',fixed:{minionLife:20,mf:10}},{base:'amulet',name:'Plástev',fixed:{minionDmg:15,minionUpkeep:-10}},{base:'ring2',name:'Prsten královny',fixed:{minionDmg:10,wits:6}}],
    bonus:{2:{minionDmg:25,minionLife:20},3:{minionMax:1,aoePct:15}}, power:'Útok přisluhovače zasáhne i jednoho dalšího nepřítele vedle cíle za 50 %.'},
  {id:'moonset', name:'Měsíční lov', pieces:[{base:'spear',name:'Kopí stříbrné luny',fixed:{formPct:20,crit:3}},{base:'hood',name:'Kápě měsíčního svitu',fixed:{dodge:5,formLife:10}},{base:'furarmor',name:'Kožich nočního lovce',fixed:{formLife:15,dr:3}},{base:'ring',name:'Prsten noci',fixed:{formPct:15,fearCh:6}}],
    bonus:{2:{formPct:25,crit:3},3:{formLife:20,fearCh:10}}, power:'V podobě zvířete má každý tvůj zásah 15% šanci přivolat ducha vlka na 6 tahů (max 2).'},
  {id:'trapset', name:'Zálesák', pieces:[{base:'hxbow',name:'Kuše zálesáka',fixed:{projPct:20,crit:3}},{base:'quiver',name:'Toulec z kůry',fixed:{projPct:15,dmgPct:10}},{base:'leafarmor',name:'Zálesácký kabát',fixed:{dodge:6,ailDur:10}},{base:'gloves',name:'Rukavice lapače',fixed:{poisonCh:10,costRed:8}}],
    bonus:{2:{projPct:25,poisonCh:10},3:{doubleDmg:5,cdr:10}}, power:'Výtrusná past se pokládá po dvou, vybuchuje v dosahu 2 a maximum pastí je 6.'},
  {id:'sageset', name:'Myšlenky mudrce', pieces:[{base:'witchhat',name:'Klobouk poustevnice',fixed:{spell:15,costRed:8}},{base:'scroll',name:'Mudrcův svitek',fixed:{spell:15,buffDur:15}},{base:'ring',name:'Prsten jasné mysli',fixed:{mana:20,cdr:5}},{base:'boots2',name:'Poutnické boty',fixed:{dodge:4,manaRegen:1}}],
    bonus:{2:{spell:25,costRed:8},3:{cdr:10,skill:1}}, power:'Každé 4. kouzlo je zdarma a způsobí dvojnásobné poškození.'},
];
// skills; tags drive which supports apply. cls = owning class ('*' = universal)
export const SKILLS={
  attack:{name:'Útok', type:'attack', tags:['attack','single'], cost:0, cd:0, desc:'Základní útok zbraní (nablízko nebo na dálku). I ten jde vylepšit runami.', target:'enemy', base:true, cls:'*'},
  // --- Výtrusný šermíř
  cleave:{name:'Rozťal', type:'attack', tags:['attack','aoe','melee'], cost:6, cd:2, desc:'Zasáhne všechny sousední nepřátele za 110 % zbraně.', target:'self', cls:'blade'},
  rotstrike:{name:'Hnilobný úder', type:'attack', tags:['attack','single','melee'], cost:7, cd:3, desc:'Úder za 190 % zbraně, který vždy otráví.', target:'adjacent', cls:'blade'},
  rend:{name:'Rozpárání', type:'attack', tags:['attack','single','melee'], cost:6, cd:2, desc:'Úder za 80 % zbraně, vždy způsobí silné krvácení (150 %).', target:'adjacent', cls:'blade'},
  lunge:{name:'Výpad', type:'attack', tags:['attack','single','melee','move'], cost:7, cd:3, desc:'Skok k nepříteli do vzdálenosti 4 a úder za 160 % zbraně se 40% šancí na krvácení.', target:'enemy', range:4, cls:'blade'},
  // --- Kořenový strážce
  bash:{name:'Úder štítem', type:'attack', tags:['attack','single','melee'], cost:8, cd:4, desc:'130 % zbraně + zbroj ze štítu, omráčí na 2 tahy a odhodí cíl.', target:'adjacent', cls:'warden'},
  barkskin:{name:'Kůrová kůže', type:'buff', tags:['buff'], cost:12, cd:12, desc:'Na 6 tahů +60 % zbroje a regenerace.', target:'self', cls:'warden'},
  warcry:{name:'Válečný řev', type:'buff', tags:['buff','aoe'], cost:10, cd:10, desc:'Omráčí sousední nepřátele a dá +40 % poškození na 5 tahů.', target:'self', cls:'warden'},
  spikes:{name:'Kořenové ostny', type:'attack', tags:['attack','aoe','melee'], cost:9, cd:4, desc:'Ostny kolem tebe (dosah 1) za 110 % zbraně + 30 % zbroje. Zasažené zakoření na 2 tahy.', target:'self', cls:'warden'},
  // --- Mykomant
  sporebolt:{name:'Výtrusná střela', type:'spell', tags:['spell','proj','single'], cost:5, cd:0, desc:'Střela na dálku za 120 % kouzla, 40% šance otrávit.', target:'enemy', range:7, cls:'myco'},
  puffbomb:{name:'Výtrusná bomba', type:'spell', tags:['spell','aoe'], cost:12, cd:3, desc:'Exploze 3×3 za 140 % kouzla, otráví vše.', target:'tile', range:6, cls:'myco'},
  drain:{name:'Mycelové vysátí', type:'spell', tags:['spell','single'], cost:10, cd:4, desc:'Za 150 % kouzla a vyléčí 50 % způsobeného poškození.', target:'enemy', range:5, cls:'myco'},
  plague:{name:'Mor', type:'spell', tags:['spell','aoe','dot'], cost:14, cd:5, desc:'Nakazí nepřátele v dosahu 3: silný jed na 3 tahy (200 % kouzla celkem).', target:'tile', range:6, cls:'myco'},
  // --- Hnilobný lovec
  volley:{name:'Salva', type:'attack', tags:['attack','proj','bowonly'], cost:9, cd:3, desc:'Vystřelí na 3 nejbližší viditelné nepřátele za 90 % zbraně. Vyžaduje luk.', target:'self', cls:'ranger'},
  snipe:{name:'Mířená rána', type:'attack', tags:['attack','single','proj','bowonly'], cost:8, cd:3, desc:'Výstřel za 260 % zbraně s +40 % šancí na kritický zásah. Vyžaduje luk.', target:'enemy', range:9, cls:'ranger'},
  arrowrain:{name:'Šípový déšť', type:'attack', tags:['attack','aoe','bowonly'], cost:12, cd:5, desc:'Déšť šípů na oblast 3×3 za 90 % zbraně, další 2 tahy dopadá za 45 %. Vyžaduje luk.', target:'tile', range:7, cls:'ranger'},
  // --- Plodonoš (vyvolávač)
  sproutlings:{name:'Výtrusníci', type:'summon', tags:['minion','summon'], cost:10, cd:2, desc:'Vyvolá 2 výtrusníky, kteří bojují zblízka. Maximum 3. Každý si rezervuje 5 % tvého života.', target:'self', cls:'summoner', minion:'sprout'},
  jellycall:{name:'Jedová medúzka', type:'summon', tags:['minion','summon','proj'], cost:12, cd:3, desc:'Vyvolá medúzku, která na dálku plive jed. Maximum 2. Rezervuje 6 % tvého života.', target:'self', cls:'summoner', minion:'jelly'},
  entcall:{name:'Probuzení enta', type:'summon', tags:['minion','summon'], cost:22, cd:14, desc:'Probudí enta s obrovským životem, který drtí nepřátele a strhává na sebe jejich pozornost. Maximum 1. Rezervuje 14 % tvého života.', target:'self', cls:'summoner', minion:'ent'},
  command:{name:'Mycelový rozkaz', type:'buff', tags:['minion','buff'], cost:10, cd:9, desc:'Přisluhovači se vyléčí o 35 % a na 5 tahů mají +50 % poškození a jednají dvakrát rychleji.', target:'self', cls:'summoner'},
  detonate:{name:'Hniloplodí', type:'spell', tags:['spell','aoe','minion'], cost:8, cd:4, desc:'Nejvíc zraněný přisluhovač exploduje: jed za 90 % jeho maximálního života na oblast (dosah 1).', target:'self', cls:'summoner'},
  // --- Měňavec (shapeshifter)
  bearform:{name:'Medvědí podoba', type:'form', tags:['form','buff'], cost:8, cd:3, desc:'Proměna v medvěda: +50 % života, +60 % zbroje, +25 % poškození zbraní. V podobě nesesíláš kouzla. Znovu = lidská podoba.', target:'self', cls:'shifter', form:'bear'},
  boarform:{name:'Kančí podoba', type:'form', tags:['form','buff'], cost:8, cd:3, desc:'Proměna v kance: +15 % úhyb, +8 % kritická šance, +30 % šance na krvácení, +10 % poškození. V podobě nesesíláš kouzla.', target:'self', cls:'shifter', form:'boar'},
  maul:{name:'Drtivý úder', type:'attack', tags:['attack','single','melee'], cost:6, cd:2, desc:'Jen v medvědí podobě: úder za 230 % zbraně, omráčí na 1 tah.', target:'adjacent', cls:'shifter', needForm:'bear'},
  gore:{name:'Náraz', type:'attack', tags:['attack','single','melee','move'], cost:8, cd:3, desc:'Jen v kančí podobě: řítíš se až 4 pole k cíli a prvního nepřítele zasáhneš za 180 % zbraně, odhodíš ho a rozkrvácíš.', target:'enemy', range:4, cls:'shifter', needForm:'boar'},
  thornroot:{name:'Spoutání kořeny', type:'spell', tags:['spell','single'], cost:9, cd:3, desc:'Jen v lidské podobě: kořeny zasáhnou cíl za 130 % kouzla (hniloba) a zakoření ho na 3 tahy.', target:'enemy', range:6, cls:'shifter'},
  regrow:{name:'Obrůstání', type:'buff', tags:['buff'], cost:10, cd:10, desc:'Na 5 tahů regeneruješ 5 % života za tah. V podobě zvířete navíc 3 % esence.', target:'self', cls:'shifter'},
  // --- univerzální
  firebrand:{name:'Pochodňový vír', type:'spell', tags:['spell','aoe'], cost:10, cd:5, desc:'Zapálí okolí (dosah 2) za 100 % kouzla a rozzáří pochodeň.', target:'self', cls:'*'},
  blink:{name:'Výtrusný skok', type:'utility', tags:['move'], cost:8, cd:6, desc:'Teleport na viditelné místo do vzdálenosti 5.', target:'tile', range:5, cls:'*'},
  // ================= v12 =================
  whirl:{name:'Výtrusný vír', type:'attack', tags:['attack','aoe','melee'], cost:9, cd:4, desc:'Dvakrát se roztočíš: všechny nepřátele v dosahu 1 zasáhneš dvakrát za 75 % zbraně, každý zásah má +20 % šanci na krvácení.', target:'self', cls:'blade'},
  bloodrage:{name:'Krvavé opojení', type:'buff', tags:['buff'], cost:0, cd:12, desc:'Obětuješ 10 % aktuálního života: na 6 tahů +35 % více poškození, +3 % vysátí života a +10 % kritická šance.', target:'self', cls:'blade'},
  riposte:{name:'Odvetný střeh', type:'buff', tags:['buff','melee'], cost:7, cd:7, desc:'Na 3 tahy utrpíš o 30 % méně poškození od útoků zblízka a každý takový útok oplatíš protiútokem za 120 % zbraně.', target:'self', cls:'blade'},
  quake:{name:'Otřes země', type:'attack', tags:['attack','aoe','melee'], cost:11, cd:5, desc:'Úder do země: nepřátelé v dosahu 2 utrží 90 % zbraně + 25 % tvé zbroje, polovina z nich je omráčena na 1 tah.', target:'self', cls:'warden'},
  shieldwall:{name:'Hradba', type:'buff', tags:['buff'], cost:10, cd:10, desc:'Na 4 tahy +25 % šance blokovat (max 75 %) a každý blok vrátí útočníkovi 60 % poškození.', target:'self', cls:'warden'},
  shieldcharge:{name:'Beraní náraz', type:'attack', tags:['attack','single','melee','move'], cost:9, cd:4, desc:'Vyrazíš až 4 pole k cíli, zasáhneš ho za 140 % zbraně + zbroj ze štítu a omráčíš ho na 1 tah.', target:'enemy', range:4, cls:'warden'},
  sporestorm:{name:'Výtrusná bouře', type:'spell', tags:['spell','aoe','dot'], cost:14, cd:6, desc:'Vytvoří výtrusný mrak (dosah 2) na 4 tahy. Každý tah otráví všechny nepřátele uvnitř za 45 % kouzla.', target:'tile', range:6, cls:'myco'},
  rotnova:{name:'Hnilobná nova', type:'spell', tags:['spell','aoe'], cost:11, cd:4, desc:'Vlna hniloby kolem tebe (dosah 2) za 130 % kouzla. Zasažení jsou na 3 tahy oslabení (−30 % poškození).', target:'self', cls:'myco'},
  burstrot:{name:'Prasknutí vředu', type:'spell', tags:['spell','aoe'], cost:8, cd:3, desc:'Spotřebuje všechen jed na otráveném cíli a okamžitě způsobí 70 % jeho zbývajícího poškození jako hnilobu cíli i nepřátelům v dosahu 1.', target:'enemy', range:6, cls:'myco'},
  toxicarrow:{name:'Jedový šíp', type:'attack', tags:['attack','single','proj','bowonly'], cost:6, cd:2, desc:'Výstřel za 150 % zbraně: polovina fyzického poškození se mění na jed, vždy otráví a zpomalí cíl na 2 tahy. Vyžaduje luk.', target:'enemy', range:8, cls:'ranger'},
  trap:{name:'Výtrusná past', type:'attack', tags:['attack','aoe','trap'], cost:7, cd:3, desc:'Položí past (dosah 4, max 3). Když na ni nebo vedle ní vstoupí nepřítel, vybuchne (dosah 1) za 200 % zbraně jako jed a zakoření zasažené na 2 tahy.', target:'tile', range:4, cls:'ranger'},
  shadowstep:{name:'Krok stínem', type:'utility', tags:['move'], cost:6, cd:5, desc:'Přeskočíš za záda nepřítele do vzdálenosti 6. Tvůj další útok do 2 tahů je kritický.', target:'enemy', range:6, cls:'ranger'},
  barrage:{name:'Palba', type:'attack', tags:['attack','single','proj','bowonly'], cost:8, cd:3, desc:'Čtyři rychlé šípy do jednoho cíle, každý za 55 % zbraně a každý může zvlášť kriticky zasáhnout. Vyžaduje luk.', target:'enemy', range:8, cls:'ranger'},
  sporeswarm:{name:'Výtrusný roj', type:'summon', tags:['minion','summon'], cost:9, cd:3, desc:'Vyvolá 3 výtrusné mušky na 10 tahů. Jsou rychlé a křehké, koušou a otravují. Maximum 6. Každá rezervuje 2 % života.', target:'self', cls:'summoner', minion:'fly'},
  fungaltotem:{name:'Houbový totem', type:'summon', tags:['minion','summon','proj'], cost:12, cd:8, desc:'Zasadí totem, který 14 tahů plive výtrusné střely (dosah 6) na nejbližší nepřátele. Nehýbe se. Maximum 1 (+1 za 2 body maxima přisluhovačů). Rezervuje 4 % života.', target:'self', cls:'summoner', minion:'totem'},
  mycelnet:{name:'Mycelová síť', type:'buff', tags:['buff','minion'], cost:12, cd:12, desc:'Na 8 tahů tvoji přisluhovači šíří hnilobu: nepřátelé vedle přisluhovače utrží každý tah 35 % kouzla jako hnilobu a jsou oslabení.', target:'self', cls:'summoner'},
  howl:{name:'Vytí', type:'buff', tags:['buff','aoe'], cost:8, cd:9, desc:'Nepřátelé v dosahu 2 na 2 tahy prchají (bossové ne). Ty i tvoji přisluhovači máte na 5 tahů +25 % více poškození. Funguje i v podobě zvířete.', target:'self', cls:'shifter'},
  rampage:{name:'Řádění', type:'attack', tags:['attack','aoe','melee'], cost:7, cd:3, desc:'Jen v medvědí podobě: zasáhneš všechny sousední nepřátele za 150 % zbraně a za každý zásah se vyléčíš o 2 % života.', target:'self', cls:'shifter', needForm:'bear'},
  spiritwolf:{name:'Duch vlka', type:'summon', tags:['minion','summon'], cost:12, cd:10, desc:'Přivolá ducha vlka na 15 tahů: rychlý lovec, který trhá nepřátele a způsobuje krvácení. Funguje i v podobě zvířete. Maximum 1. Rezervuje 8 % života.', target:'self', cls:'shifter', minion:'wolf'},
  flyform:{name:'Muší podoba', type:'form', tags:['form','buff'], cost:8, cd:3, desc:'Proměna v hnilobnou mouchu: v této podobě smíš sesílat kouzla, máš +25 % poškození kouzel a projektilů a +10 % úhyb, ale −10 % života. Základní útok je plivanec na dálku. Znovu = lidská podoba.', target:'self', cls:'shifter', form:'fly'},
  spit:{name:'Hnilobný plivanec', type:'spell', tags:['spell','proj','single'], cost:4, cd:0, desc:'Jen v muší podobě: plivneš hnilobu na dálku za 110 % kouzla a cíl je na 2 tahy oslabený.', target:'enemy', range:7, cls:'shifter', needForm:'fly'},
  buzz:{name:'Bzučící mračno', type:'spell', tags:['spell','aoe','dot'], cost:10, cd:4, desc:'Jen v muší podobě: vypustíš mračno much (dosah 1) na 3 tahy. Každý tah způsobí 55 % kouzla jako hnilobu a zpomalí nepřátele uvnitř.', target:'tile', range:6, cls:'shifter', needForm:'fly'},
  decoy:{name:'Houbová návnada', type:'summon', tags:['minion','summon'], cost:8, cd:10, desc:'Na místo do vzdálenosti 4 postaví nafouklou houbu, která 8 tahů přitahuje pozornost nepřátel. Když praskne, otráví okolí.', target:'tile', range:4, cls:'*', minion:'decoy'},
  sporeshield:{name:'Výtrusná zbroj', type:'buff', tags:['buff'], cost:10, cd:12, desc:'Na 5 tahů tě obalí výtrusný štít, který pohltí poškození až do 25 % tvého maximálního života.', target:'self', cls:'*'},
};
SKILLS.harvest={name:'Sklizeň', type:'utility', tags:['dot'], cost:6, cd:3, desc:'Spotřebuje všechen jed a krvácení na cíli (dosah 5) a zbývající poškození způsobí okamžitě za 120 %. Krvácení přeruší chystaný útok a omráčí (ne bosse). Pokud cíl s jedem zemře, výtrusy se rozletí: sousedé dostanou jed za 40 % spotřebovaného.', target:'enemy', range:5, cls:'*'};
for(const [id,s] of Object.entries(SKILLS)) s.icon='sk_'+id; SKILLS.fungaltotem.icon='sk_totem'; SKILLS.harvest.icon='sk_burstrot'; // TODO: vlastní ikona sk_harvest
export const skillsFor=cls=>Object.keys(SKILLS).filter(id=>id!=='attack'&&(SKILLS[id].cls===cls||SKILLS[id].cls==='*'));
// support runes – modifiers linked to a skill (max 3 per skill). 'minion' tag = works on minions of a summon skill
export const SUPPORTS={
  multi:{name:'Rozštěp', desc:'+2 další cíle pro jednocílové a projektilové dovednosti, −30 % poškození.', tags:['single','proj']},
  chain:{name:'Řetězení', desc:'Zásah přeskočí na 2 další nepřátele do vzdálenosti 4 (−20 % za skok).', tags:['single','proj']},
  area:{name:'Rozpínání', desc:'+1 k plošnému dosahu, +15 % plošného poškození.', tags:['aoe']},
  venom:{name:'Nákaza', desc:'40 % fyzického poškození se mění na jed, +50 % šance otrávit.', tags:['attack','spell','minion']},
  pyre:{name:'Spáleniště', desc:'50 % poškození se mění na oheň, +40 % šance zapálit.', tags:['attack','spell','minion']},
  brutal:{name:'Brutalita', desc:'+45 % více fyzického poškození, žádné elementální poškození.', tags:['attack','minion']},
  crit:{name:'Přesnost', desc:'+10 % šance na kritický zásah, +40 % kritický násobič.', tags:['attack','spell','minion']},
  echo:{name:'Ozvěna', desc:'Dovednost se zopakuje za 60 %. Cena +50 %.', tags:['spell','attack']},
  corpse:{name:'Výbuch mrtvol', desc:'Nepřátelé zabití touto dovedností explodují za 20 % svého života (oheň, plocha 1).', tags:['attack','spell','minion']},
  leech:{name:'Pijavice', desc:'Tato dovednost vysává 5 % poškození jako život (přisluhovači léčí sebe).', tags:['attack','spell','minion']},
  haste:{name:'Zrychlení', desc:'Přebíjení −50 %, cena +30 %.', tags:['attack','spell','buff','move','minion']},
  dot:{name:'Hniloba', desc:'+50 % násobič poškození v čase pro neduhy z této dovednosti.', tags:['attack','spell','minion']},
  execute:{name:'Poprava', desc:'+60 % poškození proti nepřátelům pod 35 % života.', tags:['attack','spell','minion']},
  stun:{name:'Otřes', desc:'+30 % šance omráčit, +25 % poškození proti omráčeným.', tags:['attack','minion']},
  fertile:{name:'Plodnost', desc:'+1 k maximu přisluhovačů této dovednosti, přisluhovači −15 % poškození.', tags:['summon']},
  hex:{name:'Kletba', desc:'Zasažení nepřátelé mají na 3 tahy −20 % ke všem odolnostem a −20 % zbroje.', tags:['attack','spell','minion']},
  // ---- v12 ----
  conc:{name:'Soustředění', desc:'+40 % více plošného poškození, ale −1 k plošnému dosahu (minimum 1).', tags:['aoe']},
  rotconv:{name:'Rozklad', desc:'50 % fyzického poškození se mění na hnilobu a to je o 20 % silnější.', tags:['attack','spell','minion']},
  weaken:{name:'Oslabení', desc:'Zasažení nepřátelé jsou na 3 tahy oslabení (−30 % poškození).', tags:['attack','spell','minion']},
  overload:{name:'Přetížení', desc:'+60 % více poškození, ale cena +80 % a přebíjení +1 tah.', tags:['attack','spell']},
  thrift:{name:'Šetrnost', desc:'Cena −40 %, poškození −10 %.', tags:['attack','spell','buff','move','summon']},
  spread:{name:'Výtrusné šíření', desc:'Neduhy z této dovednosti (jed, oheň, krvácení) přeskočí i na jednoho souseda cíle za 50 %.', tags:['attack','spell','minion']},
  firststrike:{name:'První krev', desc:'+80 % poškození proti nepřátelům s plným životem.', tags:['attack','spell','minion']},
  fortify:{name:'Opevnění', desc:'Použití dovednosti ti na 3 tahy dá −20 % utrženého poškození.', tags:['attack','spell']},
  fear:{name:'Hrůza', desc:'25% šance, že zasažený nepřítel na 2 tahy prchá (bossové ne).', tags:['attack','spell','minion']},
  lasting:{name:'Vytrvalost', desc:'Neduhy z této dovednosti trvají o 50 % déle; posílení z ní také.', tags:['attack','spell','minion','buff']},
  frenzy:{name:'Šílenství roje', desc:'Přisluhovači této dovednosti mají +30 % více poškození, ale −20 % života.', tags:['summon']},
};
for(const [id,s] of Object.entries(SUPPORTS)) s.spr='rune_'+id;
// minion archetypes (scaled by player level, skill level and minion stats)
export const MINIONS={
  sprout:{name:'Výtrusník', spr:['capling_o','capling_b'], hp:16, dmg:[2,5], arm:3, upkeep:0.05, ai:'melee', sc:0.72, max:3, n:2},
  jelly:{name:'Medúzka', spr:['jelly'], hp:12, dmg:[2,4], arm:1, upkeep:0.06, ai:'ranged', el:'poison', range:5, sc:0.75, max:2, n:1},
  ent:{name:'Ent', spr:['ent'], hp:70, dmg:[5,9], arm:12, upkeep:0.14, ai:'melee', sc:1.2, max:1, n:1, taunt:true},
  fly:{name:'Výtrusná muška', spr:['fly'], hp:6, dmg:[1,3], arm:0, upkeep:0.02, ai:'melee', el:'poison', sc:0.55, max:6, n:3, ttl:10, fast:true},
  totem:{name:'Houbový totem', spr:['glowshroom_big'], hp:30, dmg:[3,6], arm:6, upkeep:0.04, ai:'turret', el:'poison', range:6, sc:0.9, max:1, n:1, ttl:14},
  wolf:{name:'Duch vlka', spr:['spirit_wolf'], hp:28, dmg:[4,8], arm:4, upkeep:0.08, ai:'melee', sc:0.9, max:1, n:1, ttl:15, fast:true, bleed:true, spirit:true},
  flyform:{name:'Muší podoba', type:'form', tags:['form','buff'], cost:8, cd:3, desc:'Proměna v hnilobnou mouchu: v této podobě smíš sesílat kouzla, máš +25 % poškození kouzel a projektilů a +10 % úhyb, ale −10 % života. Základní útok je plivanec na dálku. Znovu = lidská podoba.', target:'self', cls:'shifter', form:'fly'},
  spit:{name:'Hnilobný plivanec', type:'spell', tags:['spell','proj','single'], cost:4, cd:0, desc:'Jen v muší podobě: plivneš hnilobu na dálku za 110 % kouzla a cíl je na 2 tahy oslabený.', target:'enemy', range:7, cls:'shifter', needForm:'fly'},
  buzz:{name:'Bzučící mračno', type:'spell', tags:['spell','aoe','dot'], cost:10, cd:4, desc:'Jen v muší podobě: vypustíš mračno much (dosah 1) na 3 tahy. Každý tah způsobí 55 % kouzla jako hnilobu a zpomalí nepřátele uvnitř.', target:'tile', range:6, cls:'shifter', needForm:'fly'},
  decoy:{name:'Houbová návnada', spr:['puffball'], hp:30, dmg:[0,0], arm:8, upkeep:0, ai:'still', sc:0.9, max:1, n:1, ttl:8, taunt:true, fixedMax:true},
};
export const CLASSES=[
  {id:'blade', name:'Výtrusný šermíř', spr:'hero2_blade', desc:'Zuřivý bojovník zblízka. Krvácení, kritické zásahy, plošné seky.', stats:{might:8,finesse:6,wits:3}, skills:['cleave','rotstrike'], gear:['sword','cap','mossarmor'], rune:'crit',
    trait:{name:'Krvavý tanec', desc:'+15 % šance na krvácení, +2 % kritická šance.', s:{bleed:15,crit:2}}},
  {id:'warden', name:'Kořenový strážce', spr:'hero2_warden', desc:'Obrněný ochránce se štítem. Omráčení, trny, odolnost.', stats:{might:9,finesse:3,wits:4}, skills:['bash','barkskin'], gear:['club','shield','mossarmor','knighthelm'], rune:'stun',
    trait:{name:'Hluboké kořeny', desc:'+6 % blok, +20 % zbroje, +3 trny.', s:{block:6,armorPct:20,thorns:3}}},
  {id:'myco', name:'Mykomant', spr:'hero2_myco', desc:'Mág výtrusů a hniloby. Jed na dálku, plošná kouzla, vysávání.', stats:{might:3,finesse:4,wits:10}, skills:['sporebolt','puffbomb'], gear:['staff','tome','wizhat'], rune:'venom',
    trait:{name:'Nositel spor', desc:'+15 % šance otrávit, +15 % násobič poškození v čase.', s:{poisonCh:15,dot:15}}},
  {id:'ranger', name:'Hnilobný lovec', spr:'hero2_ranger', desc:'Lukostřelec ze stínů. Rychlé střely, úhyb, salvy.', stats:{might:4,finesse:10,wits:3}, skills:['volley','blink'], gear:['bow','quiver','cloak','hood'], rune:'multi',
    trait:{name:'Stínochod', desc:'+6 % úhyb, +20 % kritický násobič.', s:{dodge:6,critMult:20}}},
  {id:'summoner', name:'Plodonoš', spr:'hero2_summoner', desc:'Pěstitel živé armády. Každý přisluhovač si ale bere kus jeho života.', stats:{might:4,finesse:4,wits:9}, skills:['sproutlings','command'], gear:['sstaff','mortar','browncap'], rune:'venom',
    trait:{name:'Matka podhoubí', desc:'+15 % života přisluhovačů, daň přisluhovačů −15 %.', s:{minionLife:15,minionUpkeep:-15}}},
  {id:'shifter', name:'Měňavec', spr:'hero2_shifter', desc:'Druid dvojí krve. Mění se v medvěda nebo kance, mezi proměnami spoutává kořeny.', stats:{might:8,finesse:6,wits:4}, skills:['bearform','maul'], gear:['spear','mask','leafarmor'], rune:'brutal',
    trait:{name:'Dvojí krev', desc:'+15 % poškození v podobě zvířete, +10 % života v podobě.', s:{formPct:15,formLife:10}}},
];
export const FORMS={bear:{name:'Medvědí podoba',acc:'medvědí podobu',spr:'bear',sc:1.05}, boar:{name:'Kančí podoba',acc:'kančí podobu',spr:'boar',sc:0.95}, fly:{name:'Muší podoba',acc:'muší podobu',spr:'fly',sc:0.9}};
// passive tree: n=name, s=stats, k=keystone id, notable flag, x/y in tree space, l=links
// ---------- passive tree (procedural, 6 sectors x 5 rings + 12 keystones) ----------
const TREE_THEMES=[
  {id:'w',name:'Důvtip',small:[{spell:6},{mana:8},{manaRegen:0.3},{cdr:2},{wits:4},{spell:4,mana:4}],small_n:['Mysl','Esence','Proud','Spěch','Důvtip','Šepot'],
   notable:[['Proud esence',{mana:30,manaRegen:1,spell:10}],['Arcimág',{spell:22,skill:1}]],keys:['eldritch','pact'],
   small2:[{spell:5},{costRed:2},{buffDur:5},{manaRegen:0.3},{wits:4},{spell:3,cdr:1}],small2_n:['Šepot','Úspora','Vytrvalost','Proud','Důvtip','Rytmus'],
   notable2:[['Hlubinná studna',{mana:40,costRed:6}],['Ozvěna mysli',{spell:20,doubleDmg:3}],['Dlouhý dech',{buffDur:25,manaRegen:1.5}],['Mistr přebíjení',{cdr:8,spell:10}],['Výtrusné proroctví',{skill:1,mana:20}],['Pradávná moudrost',{spell:25,wits:10,costRed:5}]],keys2:['mindover','spellecho']},
  {id:'wf',name:'Rozklad',small:[{dot:6},{poisonCh:5},{poison:2},{wits:2,finesse:2},{pen:2},{decay:2}],small_n:['Hniloba','Nákaza','Jed','Bystrost','Průraz','Rozpad'],
   notable:[['Toxikolog',{dot:25,poisonCh:12}],['Šířící se mor',{dot:15,poison:5,pen:6}]],keys:['rotsoul','plaguebody'],
   small2:[{poisonPct:6},{ailDur:5},{decayPct:6},{dot:5},{poisonCh:4},{weakCh:3}],small2_n:['Jedovina','Vleklost','Tlení','Hniloba','Nákaza','Slabost'],
   notable2:[['Vleklá nemoc',{ailDur:25,dot:10}],['Černá míza',{decayPct:25,decay:4}],['Morový dech',{poisonPct:25,poisonCh:10}],['Oslabující výpar',{weakCh:15,dot:10}],['Žravá plíseň',{dot:25,pen:6}],['Pán hniloby',{dot:20,ailDur:20,poisonPct:15}]],keys2:['virulence','necrosis']},
  {id:'f',name:'Obratnost',small:[{crit:1.5},{critMult:8},{dodge:2},{finesse:4},{dmgPct:5},{crit:1,dodge:1}],small_n:['Ostříž','Zkáza','Stín','Mrštnost','Hbitost','Lest'],
   notable:[['Zabiják',{crit:4,critMult:30}],['Stínochod',{dodge:8,crit:2,lifeKill:4}]],keys:['resonance','darkhunter'],
   small2:[{projPct:6},{crit:1.5},{critMult:8},{dodge:2},{doubleDmg:1},{finesse:4}],small2_n:['Let','Ostříž','Zkáza','Stín','Dvojrána','Mrštnost'],
   notable2:[['Orlí oko',{projPct:25,crit:3}],['Dvojitý zásah',{doubleDmg:6,critMult:15}],['Tanec ve stínu',{dodge:8,finesse:10}],['Smrtonoš',{critMult:40}],['Stopař',{projPct:15,fearCh:8,crit:2}],['Tisíc šípů',{projPct:20,doubleDmg:4,crit:3}]],keys2:['pointblank','ghost']},
  {id:'fm',name:'Krveprolití',small:[{physPct:6},{bleed:5},{lifeKill:2},{execPct:6},{dmgPct:5},{stun:3}],small_n:['Ostří','Krvácení','Hodokvas','Poprava','Zuřivost','Otřes'],
   notable:[['Řezník',{physPct:20,execPct:20,bleed:10}],['Krvežíznivost',{leech:2,physPct:10,lifeKill:5}]],keys:['berserk','bloodmagic'],
   small2:[{meleePct:6},{bleed:4},{physPct:5},{doubleDmg:1},{lifeKill:2},{execPct:6}],small2_n:['Čepel','Krvácení','Ostří','Dvojrána','Hodokvas','Poprava'],
   notable2:[['Mistr čepele',{meleePct:25,physPct:10}],['Krvavá řeka',{bleed:15,ailDur:15}],['Řeznický hák',{doubleDmg:6,execPct:20}],['Krvežíznivec',{leech:2,lifeKill:6}],['Strach z čepele',{fearCh:10,meleePct:15}],['Válečník hniloby',{meleePct:20,physPct:15,crit:2}]],keys2:['bloodfrenzy','executioner']},
  {id:'m',name:'Síla',small:[{life:8},{lifePct:3},{armorPct:8},{regen:0.4},{might:4},{block:2}],small_n:['Houževnatost','Míza','Kůra','Obnova','Síla','Štít'],
   notable:[['Bastion',{armorPct:30,block:6,lifePct:5}],['Nezlomný',{lifePct:10,res:8,regen:2}]],keys:['rootwill','iron'],
   small2:[{life:10},{dr:1},{armorPct:8},{regenPct:0.2},{might:4},{block:2}],small2_n:['Houževnatost','Pevnost','Kůra','Míza','Síla','Štít'],
   notable2:[['Kamenná kůže',{dr:5,armorPct:25}],['Věčný kořen',{regenPct:1,life:30}],['Štítonoš',{block:8,armorPct:20}],['Horská síla',{might:15,lifePct:6}],['Nezdolný kmen',{dr:4,lifePct:8}],['Strážce prahu',{block:6,dr:4,thorns:8}]],keys2:['unbreak','juggernaut']},
  {id:'mw',name:'Živly',small:[{elemPct:6},{fire:2},{burnCh:5},{res:3},{might:2,wits:2},{resFire:6}],small_n:['Živel','Žár','Spáleniště','Odolnost','Rovnováha','Popel'],
   notable:[['Pyromant',{elemPct:22,fire:4,burnCh:10}],['Elementální štít',{res:10,maxRes:1,elemPct:8}]],keys:['glass','chitin'],
   small2:[{firePct:6},{burnCh:4},{elemPct:5},{res:3},{fire:2},{resFire:6}],small2_n:['Žár','Spáleniště','Živel','Odolnost','Plamen','Popel'],
   notable2:[['Spalující dotek',{firePct:25,burnCh:10}],['Živelná harmonie',{elemPct:20,res:6}],['Popelavá kůže',{resFire:20,maxRes:1,dr:2}],['Pekelná výheň',{firePct:20,fire:5}],['Ohnivá bouře',{aoePct:20,firePct:10}],['Pán živlů',{elemPct:20,pen:8,ailDur:10}]],keys2:['avatar','cinder']},
  {id:'mn',name:'Roj',small:[{minionDmg:6},{minionLife:6},{wits:3},{minionDmg:4,minionLife:4},{mana:6},{cdr:2}],small_n:['Vůdce','Plodnost','Důvtip','Hnízdo','Esence','Spěch'],
   notable:[['Matka roje',{minionDmg:22,minionLife:15,minionUpkeep:-10}],['Nekonečné hnízdo',{minionMax:1,minionUpkeep:-20}]],keys:['swarm','symbiosis'],
   small2:[{minionDmg:6},{minionLife:6},{wits:3},{minionUpkeep:-2},{aoePct:4},{buffDur:4}],small2_n:['Vůdce','Plodnost','Důvtip','Lehké pouto','Šíření','Vytrvalost'],
   notable2:[['Pradávný pakt',{minionUpkeep:-10,minionLife:20}],['Zuřivý roj',{minionDmg:30}],['Houbová armáda',{minionMax:1,minionDmg:10}],['Kořenová obrana',{minionLife:30,dr:2}],['Spojené mycelium',{minionDmg:15,minionLife:15,lifePct:5}],['Královna hnízda',{minionDmg:25,minionMax:1}]],keys2:['hivemind','sacrament']},
  {id:'sh',name:'Divočina',small:[{formPct:6},{formLife:4},{might:3},{physPct:5},{life:8},{bleed:4}],small_n:['Tesák','Srst','Síla','Drápy','Houževnatost','Krvavá stopa'],
   notable:[['Vůdce smečky',{formPct:22,crit:3}],['Kůže pradávných',{formLife:15,armorPct:20}]],keys:['wildheart','apex'],
   small2:[{formPct:6},{formLife:4},{meleePct:5},{bleed:4},{life:10},{regenPct:0.2}],small2_n:['Tesák','Srst','Drápy','Krvavá stopa','Houževnatost','Hojení'],
   notable2:[['Lovecká smečka',{formPct:25,meleePct:10}],['Hustá srst',{formLife:20,dr:3}],['Krvavé drápy',{bleed:15,meleePct:15}],['Srdce šelmy',{regenPct:1,formLife:10}],['Děsivý řev',{fearCh:10,formPct:15}],['Pán proměn',{formPct:20,formLife:15,crit:2}]],keys2:['primal','twinblood']},
];
const TREE_ORDER=['w','mn','wf','f','fm','sh','m','mw']; TREE_THEMES.forEach((t,i)=>t.oi=i); TREE_THEMES.sort((a,b)=>TREE_ORDER.indexOf(a.id)-TREE_ORDER.indexOf(b.id));
const KEY_NAMES={eldritch:'Mykotická zkáza',pact:'Pakt s hlubinou',rotsoul:'Hnilobná duše',plaguebody:'Mor v krvi',resonance:'Rezonance výtrusů',darkhunter:'Lovec ve tmě',berserk:'Zuřivost',bloodmagic:'Krvavá magie',rootwill:'Kořenová vůle',iron:'Železné výtrusy',glass:'Skleněné dělo',chitin:'Chitinová schránka',swarm:'Roj',symbiosis:'Symbióza',wildheart:'Divoké srdce',apex:'Vrcholový predátor',
  mindover:'Mysl nad hmotou',spellecho:'Rezonance kouzel',virulence:'Virulence',necrosis:'Nekróza',pointblank:'Na dostřel',ghost:'Přízrak',bloodfrenzy:'Krvavé šílenství',executioner:'Kat',unbreak:'Neotřesitelný',juggernaut:'Kolos',avatar:'Avatar ohně',cinder:'Žhavé uhlíky',hivemind:'Úlová mysl',sacrament:'Obětní hnízdo',primal:'Prastarý instinkt',twinblood:'Dvojí krev'};
const EXTRA_NOT={w:['Tichá mysl','Pramen','Krystalový rozum','Šeptající pohled','Hlubinné vědění'],wf:['Plíseň v ráně','Zkažená míza','Hnilobný dech','Výtrusná pec','Tlení'],
  f:['Oko dravce','Tanec čepelí','Neviditelný','Smrtící klid','Lovecký instinkt'],fm:['Rozsekané maso','Kostolam','Hostina','Rudá mlha','Řezná rána'],
  m:['Kořenová kůže','Mohyla','Starý dub','Nepohnutelný','Srdce lesa'],mn:['Šepot hnízda','Mycelové pouto','Tisíc klobouků','Plodná půda','Hlas Matky'],sh:['Měsíční vytí','Krev šelmy','Lovecký běh','Prastará srst','Divoký instinkt'],mw:['Výheň','Popelavý závoj','Bouřná krev','Živelný řád','Rozpálené kosti']};
export const PASSIVES=(()=>{
  const N=[{id:'c',x:0,y:0,n:'Srdce mycelia',s:{life:5},start:true,l:[]}]; const NS=TREE_THEMES.length, SW=360/NS, DS=SW/60; const R=k=>105+k*100; const rad=d=>d*Math.PI/180; const id=(s,k,p)=>`${TREE_THEMES[s].id}${k}${p}`;
  const scale=(o,f)=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,Math.round(v*f*10)/10]));
  const merge=(a,b)=>{ const o={...a}; for(const [k,v] of Object.entries(b)) o[k]=(o[k]||0)+v; return o; };
  const RINGS=7; const slots=k=>(k<2?[['L',-14],['M',0],['R',14]]:[['LL',-24],['L',-12],['M',0],['R',12],['RR',24]]).map(([p,a])=>[p,a*DS,a]);
  const isNot=(k,p)=>(p==='M'&&(k===2||k===4||k===6))||(k===3&&(p==='LL'||p==='RR'))||(k===5&&(p==='L'||p==='R'));
  TREE_THEMES.forEach((th,s)=>{ const a0=-90+s*SW; let ni=0, ei=0;
    for(let k=0;k<RINGS;k++) for(const [p,da,da0] of slots(k)){ const a=rad(a0+da); const si=(th.oi*7+k*3+p.length*5+da0)%th.small.length; const si2=(si<0?si+th.small.length:si);
      const node={id:id(s,k,p),x:Math.round(Math.cos(a)*R(k)),y:Math.round(Math.sin(a)*R(k)),l:[]};
      if(isNot(k,p)){ if(p==='M'&&ni<2&&k!==6){ const [nm,st]=th.notable[ni++]; Object.assign(node,{n:nm,s:st,notable:true}); }
        else { const i1=(ei*2)%th.small.length, i2=(ei*2+1)%th.small.length; Object.assign(node,{n:EXTRA_NOT[th.id][ei%5],s:scale(merge(th.small[i1],th.small[i2]),2.4+k*0.2),notable:true}); ei++; } }
      else Object.assign(node,{n:th.small_n[si2],s:scale(th.small[si2],1+k*0.12)});
      N.push(node); }
    th.keys.forEach((kk,j)=>{ const a=rad(a0+(j?16:-16)*DS); N.push({id:`${th.id}K${j}`,x:Math.round(Math.cos(a)*R(7.15)),y:Math.round(Math.sin(a)*R(7.15)),n:KEY_NAMES[kk],s:{},k:kk,l:[]}); });
  });
  // ---- v12: outer rings 7–10 (7 nodes each) + 2 more keystones per sector; inner ids/stats untouched ----
  const RO=k=>225+k*100, O=['L3','L2','L1','M','R1','R2','R3'], OA=[-27,-18,-9,0,9,18,27], NOTPOS={7:['M'],8:['L2','R2'],9:['M'],10:['L3','R3']};
  TREE_THEMES.forEach((th,s)=>{ const a0=-90+s*SW; let ni=0;
    for(let k=7;k<=10;k++) O.forEach((pp,pi)=>{ const a=rad(a0+OA[pi]*DS); const node={id:id(s,k,pp),x:Math.round(Math.cos(a)*RO(k)),y:Math.round(Math.sin(a)*RO(k)),l:[]};
      if(NOTPOS[k].includes(pp)){ const [nm,st]=th.notable2[ni++]; Object.assign(node,{n:nm,s:st,notable:true}); }
      else { const si=(th.oi*5+k*3+pi*5)%th.small2.length; Object.assign(node,{n:th.small2_n[si],s:scale(th.small2[si],1+k*0.12)}); }
      N.push(node); });
    th.keys2.forEach((kk,j)=>{ const a=rad(a0+(j?12:-12)*DS); N.push({id:`${th.id}K${j+2}`,x:Math.round(Math.cos(a)*1340),y:Math.round(Math.sin(a)*1340),n:KEY_NAMES[kk],s:{},k:kk,l:[]}); });
  });
  const by=Object.fromEntries(N.map(n=>[n.id,n])); const link=(a,b)=>{ if(by[a]&&by[b]&&a!==b) by[a].l.push(b); };
  TREE_THEMES.forEach((th,s)=>{ const ns=(s+1)%NS; link('c',id(s,0,'M'));
    for(let k=0;k<RINGS;k++){ const ps=slots(k).map(x=>x[0]); for(let i=0;i<ps.length-1;i++) link(id(s,k,ps[i]),id(s,k,ps[i+1]));
      link(id(s,k,ps[ps.length-1]),id(ns,k,ps[0]));
      if(k<RINGS-1){ link(id(s,k,'M'),id(s,k+1,'M'));
        if(k===1){ link(id(s,1,'L'),id(s,2,'L')); link(id(s,1,'R'),id(s,2,'R')); }
        else if(k===0){ if(true) link(id(s,0,'L'),id(s,1,'L')); }
        else { if(k%2) { link(id(s,k,'L'),id(s,k+1,'L')); link(id(s,k,'RR'),id(s,k+1,'RR')); } else { link(id(s,k,'R'),id(s,k+1,'R')); link(id(s,k,'LL'),id(s,k+1,'LL')); } } } }
    link(id(s,RINGS-1,'LL'),`${th.id}K0`); link(id(s,RINGS-1,'RR'),`${th.id}K1`); });
  TREE_THEMES.forEach((th,s)=>{ const ns=(s+1)%NS; link(id(s,6,'M'),id(s,7,'M')); link(id(s,6,'L'),id(s,7,'L2')); link(id(s,6,'R'),id(s,7,'R2'));
    for(let k=7;k<=10;k++){ for(let i=0;i<O.length-1;i++) link(id(s,k,O[i]),id(s,k,O[i+1])); link(id(s,k,'R3'),id(ns,k,'L3'));
      if(k<10){ link(id(s,k,'M'),id(s,k+1,'M')); for(const e of {7:['L3','R3'],8:['L1','R2'],9:['L2','R1']}[k]) link(id(s,k,e),id(s,k+1,e)); } }
    link(id(s,10,'L1'),`${th.id}K2`); link(id(s,10,'R1'),`${th.id}K3`); });
  return N; })();
export const KEYSTONES={
  rootwill:'Kořenová vůle: nemůžeš uhýbat, šance na blok ×2 (max 75 %).',
  bloodmagic:'Krvavá magie: dovednosti stojí život místo esence, +30 % života.',
  resonance:'Rezonance výtrusů: kritické zásahy vždy otráví a zapálí, −30 % kritického násobiče.',
  darkhunter:'Lovec ve tmě: pochodeň −2, +50 % poškození proti nepřátelům mimo světlo pochodně, +5 % kritické šance.',
  rotsoul:'Hnilobná duše: jed se stackuje bez limitu a trvá o 1 tah déle; nemůžeš kriticky zasáhnout.',
  glass:'Skleněné dělo: +40 % více poškození, −30 % maximálního života.',
  eldritch:'Mykotická zkáza: +60 % násobič poškození v čase, přímé zásahy −30 %.',
  iron:'Železné výtrusy: zbroj snižuje i elementální poškození (50 %), úhyb je 0.',
  pact:'Pakt s hlubinou: +2 ke všem dovednostem, ale přebíjení trvá o 50 % déle a esence se sama neobnovuje.',
  plaguebody:'Mor v krvi: každý tvůj jed přeskočí i na sousedy cíle. Jsi trvale nakažený (−1 % života za tah, nezabije tě), ale cizí jed na tebe nepůsobí.',
  berserk:'Zuřivost: +1 % poškození za každé 1 % chybějícího života. Tvoje zbroj je 0.',
  swarm:'Roj: +2 k maximu přisluhovačů každého druhu a daň přisluhovačů −30 %, ale přisluhovači mají −35 % života a poškození.',
  symbiosis:'Symbióza: 35 % poškození, které utrpíš, převezme tvůj nejbližší přisluhovač. Sám ale způsobuješ o 40 % méně poškození.',
  wildheart:'Divoké srdce: proměny nic nestojí a nemají přebíjení. Každá proměna do nové podoby ti na 3 tahy dá +40 % více poškození – střídej medvěda, kance a mouchu. V lidské podobě způsobuješ o 25 % méně.',
  apex:'Vrcholový predátor: v podobě zvířete +30 % více poškození a regenerace 2 % života za tah. Předmět ve druhé ruce nedává žádné bonusy (ani v lidské podobě) a lektvary léčí o 50 % méně.',
  mindover:'Mysl nad hmotou: 40 % utrženého poškození jde nejdřív z esence. +30 % maximální esence, ale −20 % maximálního života.',
  spellecho:'Rezonance kouzel: kouzla se vždy zopakují za 40 %, ale stojí o 50 % víc a přebíjejí se o 1 tah déle.',
  virulence:'Virulence: tvé neduhy trvají dvakrát déle, ale působí o 25 % méně za tah.',
  necrosis:'Nekróza: otrávení nepřátelé při smrti vybuchnou hnilobou za 15 % svého života (dosah 1). Přímé zásahy −20 %.',
  pointblank:'Na dostřel: projektily způsobují blízkým cílům až o 40 % víc (−8 % za každé pole navíc, minimum −20 %).',
  ghost:'Přízrak: +10 % úhyb a úhyb může dosáhnout 75 %, ale máš −25 % maximálního života.',
  bloodfrenzy:'Krvavé šílenství: každé zabití ti na 4 tahy přidá +8 % více poškození (max 5×). Mimo boj se neléčíš.',
  executioner:'Kat: tvé zásahy okamžitě zabijí nepřítele (ne bosse) pod 12 % života. Nemůžeš vysávat život.',
  unbreak:'Neotřesitelný: utrpíš o 15 % méně poškození a nemůžeš být zakořeněn ani zpomalen. Nemůžeš uhýbat.',
  juggernaut:'Kolos: +1 % více poškození za každých 15 zbroje (max +80 %). Úhyb a blok jsou 0.',
  avatar:'Avatar ohně: všechno tvé poškození se mění na oheň a je o 25 % silnější, +20 % šance zapálit. Nemůžeš ale způsobit žádné jiné poškození: tvůj jed ani krvácení nepůsobí (přisluhovači ano).',
  cinder:'Žhavé uhlíky: zapálení trvá o 3 tahy déle a každý tah hoření zesílí o 15 %.',
  hivemind:'Úlová mysl: přisluhovači dostávají i tvé zvýšené % poškození, ale tvé vlastní zásahy jsou o 50 % slabší.',
  sacrament:'Obětní hnízdo: smrt přisluhovače tě vyléčí o 6 % života a dá ti na 4 tahy +15 % více poškození. Přisluhovači mají −20 % života.',
  primal:'Prastarý instinkt: každý tah v podobě zvířete +3 % více poškození (max +45 %), změna podoby to vynuluje.',
  twinblood:'Dvojí krev: v jakékoli podobě zvířete máš bonusy medvěda i kance zároveň, ale každá proměna stojí 20 % aktuálního života.',
  chitin:'Chitinová schránka: máš jen 1 život, ale výtrusný štít ve výši 150 % života a 50 % esence. Štít se obnovuje, když 2 tahy nedostaneš zásah. Imunita vůči jedu a krvácení, oheň ti dává +50 % poškození.',
};
// link graph both ways
export const PASSIVE_MAP=(()=>{ const m={}; for(const n of PASSIVES) m[n.id]={...n,adj:new Set(n.l)}; for(const n of PASSIVES) for(const l of n.l) m[l]?.adj.add(n.id); return m; })();

export const CORRUPTIONS=[
  {id:'hp', name:'Zatvrdlé maso', desc:'Nepřátelé +50 % života', reward:'+30 % kvantity předmětů', mon:{hp:1.5}, loot:{qty:0.3}},
  {id:'dmg', name:'Rozzuřené výtrusy', desc:'Nepřátelé +35 % poškození', reward:'+40 % vzácnosti', mon:{dmg:1.35}, loot:{mf:40}},
  {id:'dark', name:'Dusivá tma', desc:'Pochodeň −2 dosah', reward:'+50 % zkušeností', torch:-2, loot:{xp:0.5}},
  {id:'swarm', name:'Hejno', desc:'+60 % nepřátel', reward:'+25 % zkušeností a kvantity', mon:{count:1.6}, loot:{xp:0.25,qty:0.25}},
  {id:'elite', name:'Champióni', desc:'Mnohem více vzácných monster', reward:'+1 úroveň předmětů, +20 % vzácnosti', mon:{elite:0.35}, loot:{ilvl:1,mf:20}},
  {id:'explode', name:'Mrtvé výtrusy', desc:'Nepřátelé při smrti vybuchují', reward:'+50 % zlata a +20 % kvantity', mon:{explode:true}, loot:{gf:50,qty:0.2}},
  {id:'fast', name:'Neklid', desc:'Nepřátelé +25 % rychlosti', reward:'+35 % vzácnosti', mon:{spd:1.25}, loot:{mf:35}},
  {id:'res', name:'Mykotická kůže', desc:'Nepřátelé +30 % odolnosti', reward:'Šance na Výtrusorozené předměty', mon:{res:30}, loot:{spore:0.07}},
  {id:'ambush', name:'Pasti tmy', desc:'Většina místností je přepadení', reward:'+40 % zkušeností, +20 % vzácnosti', mon:{ambush:0.7}, loot:{xp:0.4,mf:20}},
  {id:'hunted', name:'Štvanice', desc:'Patrem tě loví unikátní lovec', reward:'Lovec vždy upustí legendární předmět', mon:{hunter:true}, loot:{}},
];
export const EVENTS={
  storm:{name:'Výtrusná bouře', desc:'Každých pár tahů se kolem tebe snesou jedové mraky. Pochodeň −1.'},
  nest:{name:'Hnízdo', desc:'Někde v patře pulzuje hnízdo, které neustále plodí nepřátele. Znič ho pro odměnu.'},
  cursed:{name:'Prokletá truhla', desc:'V patře stojí prokletá truhla. Otevři ji a přežij tři vlny.'},
  hunter:{name:'Lovec', desc:'Něco tě v tomhle patře cítí a jde si pro tebe.'},
  blackout:{name:'Zatmění', desc:'Pochodně v patře vyhasly. Monstra jsou silnější, ale kořist bohatší.'},
  merchant:{name:'Hnilobný překupník', desc:'V patře tábořící překupník nabízí hazard s předměty za zlato – a hlídá sdílenou truhlu tvých postav.'},
};

export const SPECIAL={
  goblin:{id:'goblin_t', name:'Hrabivý skřítek', spr:'npc_merchant', hp:70, dmg:[0,0], arm:5, spd:125, xp:60, ai:'thief', sc:0.95, res:{poison:20,fire:20,decay:20}},
  guardian:{id:'rift_g', name:'Srdce jeskyně', spr:'gazer_big', hp:180, dmg:[10,17], arm:8, spd:90, xp:120, ai:'caster', sc:1.4, el:'decay', res:{decay:40,poison:40}, puddle:true, light:[0.8,0.3,1]},
};
export const RIFT_MODS=[
  {id:'magic', name:'Probuzené maso', desc:'Všechna monstra jsou minimálně kouzelná', mon:{allMagic:true}, loot:{qty:0.25}},
  {id:'extra', name:'Bujení', desc:'Vzácná monstra mají o 1 schopnost víc', mon:{extraMod:true,elite:0.15}, loot:{mf:30}},
  {id:'blood', name:'Krvavý měsíc', desc:'Monstra +40 % poškození', mon:{dmg:1.4}, loot:{mf:35,xp:0.2}},
  {id:'thick', name:'Kůra a maso', desc:'Monstra +60 % života', mon:{hp:1.6}, loot:{qty:0.3}},
  {id:'swarm', name:'Roj', desc:'+70 % monster', mon:{count:1.7}, loot:{xp:0.3,qty:0.2}},
  {id:'dark', name:'Bezedná tma', desc:'Pochodeň −2', torch:-2, loot:{mf:40}},
  {id:'noregen', name:'Vysychání', desc:'Neregeneruješ život ani esenci', noRegen:true, loot:{qty:0.25,corrupt:0.05}},
  {id:'resdown', name:'Rozežraná kůže', desc:'−25 % ke všem odolnostem', resDown:25, loot:{mf:30,corrupt:0.04}},
  {id:'explode', name:'Puchýře', desc:'Monstra po smrti vybuchují', mon:{explode:true}, loot:{qty:0.2,gf:60}},
  {id:'fast', name:'Neklid', desc:'Monstra +25 % rychlosti', mon:{spd:1.25}, loot:{mf:30}},
  {id:'reflect', name:'Zrcadla', desc:'Monstra odráží 10 % poškození', mon:{reflectAll:true}, loot:{corrupt:0.06,mf:20}},
  {id:'resist', name:'Chitin', desc:'Monstra +30 % odolností', mon:{res:30}, loot:{corrupt:0.05}},
];
// corruption implicits / curses
export const CORRUPT_IMPL=[{skill:1},{maxRes:2},{lifePct:12},{crit:5},{cdr:10},{dmgPct:25},{pen:10},{dot:25},{torch:2},{aoe:1},{lifeKill:12},{leech:3}];
export const CORRUPT_GOOD=[{dmgPct:45},{lifePct:20},{critMult:50},{dot:40},{res:18},{spell:45},{physPct:50},{elemPct:50},{skill:1},{cdr:15},{mf:60},{armorPct:80}];
export const CORRUPT_BAD=[{lifePct:-15},{res:-20},{torch:-2},{dodge:-10},{armorPct:-40},{mf:-50},{crit:-5},{manaRegen:-2},{block:-10},{mana:-30}];
export const CONVERT_GROUPS=[['might','finesse','wits'],['resFire','resPoison','resDecay'],['fire','poison','decay'],['physPct','elemPct','spell'],['dodge','block'],['poisonCh','burnCh','bleed'],['life','mana'],['crit','critMult']];
export const RIDDLES=[
  {q:'Nemám ústa, a přesto jím celé lesy. Nemám nohy, a přesto pod zemí putuji míle. Co jsem?', a:'Mycelium', w:['Kořen','Řeka']},
  {q:'Čím víc mě bereš, tím víc mě za sebou necháváš.', a:'Kroky', w:['Stíny','Roky']},
  {q:'Rodím se z hniloby, umírám ve světle, a přesto dávám život. Co jsem?', a:'Výtrus', w:['Červ','Mlha']},
  {q:'Královna Ul-Myru nosila korunu, která nebyla ze zlata ani kamene. Z čeho byla?', a:'Z houby', w:['Z kostí','Ze skla']},
  {q:'Kolik zvonů zvonilo, když hlubina umlkla?', a:'Žádný', w:['Sedm','Jeden']},
  {q:'Co svítí ve tmě, ale nehřeje, a čím déle žije, tím tišeji mluví?', a:'Plodnice', w:['Svíce','Oko']},
  {q:'Spím pod tvýma nohama, jím tvé mrtvé a jednou sním i tebe.', a:'Půda', w:['Strach','Čas']},
  {q:'Co měli Pradávní místo krve?', a:'Mízu', w:['Víno','Popel']},
];
// lore fragments of the ancient civilization Ul-Myr (shown in order)
export const LORE=[
  {t:'Nápis u vchodu',x:'„Kdo sestoupí, ať nese oheň. Kdo nese oheň, ať se nebojí tmy. Kdo se nebojí tmy, ať se bojí ticha.“ — první zákon Ul-Myru'},
  {t:'Kronikář Ashvel I.',x:'Postavili jsme Ul-Myr pod kořeny světa, kde houba nehnije, ale pamatuje. Každá síň je zapsána do mycelia; každé slovo, které tu vyslovíš, zůstane v podhoubí navždy.'},
  {t:'Kamenná deska',x:'Naše krev byla míza a naše myšlenky výtrusy. Kdo zemřel, nebyl pohřben — byl zasazen. Tak jsme nikdy neztratili nikoho.'},
  {t:'Nápis na sloupu',x:'Šedá královna Mirun nosila korunu z živé plodnice. Říkalo se, že koruna myslí za ni, když spí. Později se říkalo, že královna už nikdy nespí.'},
  {t:'Kronikář Ashvel II.',x:'Velké Zakořenění začalo tiše. Zahradníci hlásili, že podhoubí roste i tam, kde jsme mu nedali světlo. Rostlo k nám. Rostlo do nás.'},
  {t:'Škrábance na zdi',x:'NEPOSLOUCHEJ ZVONY. NEPOSLOUCHEJ ZVONY. NEPOSLOUCHEJ'},
  {t:'Deska zahradníků',x:'Pilíře plodnic zasadili Pradávní jako kotvy. Dokud stojí, hlubina nemůže vystoupat. Když se probudí, volají vše, co v hlubině žije.'},
  {t:'Rozpraskaný reliéf',x:'Reliéf ukazuje průvod postav s kloboučky místo hlav. Ten první nese pochodeň. Ten poslední už ne.'},
  {t:'Kronikář Ashvel III.',x:'Mirun nařídila, aby se zvony ve všech síních rozezněly zároveň. Řekla, že hlubina se uklidní, když uslyší naši píseň. Hlubina neodpověděla. Hlubina se naučila zpívat s námi.'},
  {t:'Nápis nad prahem',x:'Zde končí Ul-Myr a začíná Ul-Myr. Neplač pro ty, kdo zůstali dole. Oni pro tebe plakat nebudou — už nemají oči.'},
  {t:'Dětská kresba',x:'Na kameni je vyryta postavička s velkým kloboukem a nápis: „maminka už je houba. říká že to nebolí.“'},
  {t:'Deska strážců',x:'Hrabivci nejsou zloději. Sbírají, co v hlubině zůstalo po mrtvých, a nosí to Matce plodnic. Kdo je chytí, ať si vezme — Matka si vezme zpět.'},
  {t:'Kronikář Ashvel IV.',x:'Ti z nás, kdo přijali výtrusy, se stali Kloboučníky. Smějí se. Pořád se smějí. Já ještě píšu, tedy ještě nejsem jejich.'},
  {t:'Runy u jeskyně',x:'Zkažené jeskyně jsou místa, kde podhoubí sní. Jeho sny jsou hladové a mění vše, co se jich dotkne — i zbraně, i ty, kdo je drží.'},
  {t:'Zbytky oltáře',x:'Oltáře hniloby nebyly svatyně. Byly to kovárny. Pradávní tu „zkazili“ železo, aby se mohlo dorozumět s houbou. Některé zbraně pak začaly šeptat.'},
  {t:'Nápis na kosti',x:'Pochodeň není světlo. Pochodeň je slib, že ještě nejsi jejich.'},
  {t:'Kronikář Ashvel V.',x:'Mirun sestoupila do nejhlubší síně a zavřela za sebou bránu. Od té doby roste Ul-Myr dolů. Nekonečně dolů. Myslím, že ji hledá. Myslím, že ji najde každý, kdo sestoupí dost hluboko.'},
  {t:'Poslední deska',x:'Kdo čteš tyto řádky: nejsi první. Mycelium si pamatuje všechny, kdo sem sestoupili. Pamatuje si i tebe. Vítej doma.'},
];

export const GRAVE_MSGS=['Dál nechoď.','Bylo jich moc.','Měl jsem pít lektvary.','Truhla byla past.','Boss po půlce zuří.','Tady je poklad… nebo ne.','Světlo pochodně nestačí.','Pomsti mě.','Zkažené jádro mě zradilo.','Utíkej.'];
// daily depth: deterministic seed + one daily curse from the corruption list
export const dailySeed=day=>{ let h=2166136261; for(const c of 'sporium:'+day){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
export const dailyMod=day=>{ const pool=CORRUPTIONS.filter(c=>c.id!=='hunted'); return pool[dailySeed(day+':mod')%pool.length]; };
export const SEASON={n:1,name:'Obchod se štěstím',desc:'Probuď Plodnice pradávných, sbírej zkažená jádra a zkoušej štěstí na Oltáři hniloby. Štěstí přeje odvážným – a chamtivé rozdrtí na prach.'};
