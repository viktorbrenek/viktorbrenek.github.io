// Sporium – game data v2 (monsters, mods, bosses, items, affixes, supports, passives, uniques, events)
export const BIOMES=[
  {id:'halls', name:'Výtrusné síně', floors:['tex_halls_a','tex_halls_b','tex_halls_c'], wall:'wall_halls', decals:[0,1,2,3,4,5,6,7,8,9,10,12,13,14,21], ambient:[0.05,0.055,0.07], spore:[0.85,0.95,0.55], deco:['deco_shroom1','deco_shroom4','deco_shroom9','deco_grass1','shroom_cluster','rubble','pillar','barrels','crate','sack','bench','roots']},
  {id:'roots', name:'Hnijící kořeny', floors:['tex_roots_a','tex_roots_b','tex_roots_c'], wall:'wall_roots', decals:[2,3,4,11,15,16,17,18,19,20,22,23,24,25,26,27], ambient:[0.06,0.045,0.04], spore:[1.0,0.7,0.45], deco:['deadtree','stump','stump2','roots','vines','shroom_roots','deco_log','deco_shroom6','deco_shroom7','deco_bush','spore_pile']},
  {id:'drowned', name:'Utopené mycelium', floors:['tex_drowned_a','tex_drowned_b','tex_drowned_c'], wall:'wall_drowned', decals:[0,1,2,3,4,7,8,9,12,21,22], ambient:[0.035,0.06,0.07], spore:[0.6,1.0,0.85], deco:['deco_reeds','deco_grass3','deco_shroom12','deco_shroom11','vines','pillars','grave','obelisk','deco_shroom14']},
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
  {id:'cap', name:'Klobouk z muchomůrky', slot:'helm', spr:'helm_red', imp:{armor:4}, min:1},
  {id:'cap2', name:'Hnědá kápě', slot:'helm', spr:'helm_brown', imp:{armor:5,life:5}, min:3},
  {id:'cap3', name:'Fialový šlem', slot:'helm', spr:'helm_purple', imp:{armor:6,mana:8}, min:8},
  {id:'mask', name:'Maska šelmy', slot:'helm', spr:'helm_tan', imp:{armor:4,formLife:6}, min:1},
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
];
export const STAT_NAMES={life:'Život',mana:'Esence',armor:'Zbroj',dmg:'Fyzické poškození',dmgPct:'% poškození',crit:'% šance na kritický zásah',critMult:'% kritický násobič',
  fire:'Ohnivé poškození',poison:'Jedové poškození',decay:'Hnilobné poškození',poisonCh:'% šance otrávit',burnCh:'% šance zapálit',bleed:'% šance na krvácení',
  leech:'% vysátí života',regen:'Regenerace života / tah',manaRegen:'Regenerace esence / tah',res:'% ke všem odolnostem',resPoison:'% odolnost vůči jedu',resFire:'% odolnost vůči ohni',resDecay:'% odolnost vůči hnilobě',
  torch:'Dosah pochodně',mf:'% šance na kouzelné předměty',gf:'% více zlata',cdr:'% zkrácení přebíjení',thorns:'Trny',skill:'+ k úrovni všech dovedností',spell:'% poškození kouzel',
  dodge:'% úhyb',stun:'% šance omráčit',block:'% šance blokovat',might:'Síla',finesse:'Obratnost',wits:'Důvtip',xp:'% zkušeností',potion:'% účinnost lektvarů',reach:'Dosah zbraně',aoe:'+ k plošnému dosahu',
  lifePct:'% maximálního života',armorPct:'% zbroje',dot:'% násobič poškození v čase',pen:'% průraz odolností',lifeKill:'Život za zabití',physPct:'% fyzického poškození',elemPct:'% elementálního poškození',
  maxRes:'% k maximálním odolnostem',crushPct:'% poškození proti omráčeným',execPct:'% poškození proti raněným (<35 %)',
  minionDmg:'% poškození přisluhovačů',minionLife:'% života přisluhovačů',minionMax:'k maximu přisluhovačů',formPct:'% poškození v podobě zvířete',formLife:'% života v podobě zvířete',minionUpkeep:'% daň přisluhovačů (rezervovaný život)'};
export const PCT=new Set(['dmgPct','crit','critMult','poisonCh','burnCh','bleed','leech','res','resPoison','resFire','resDecay','mf','gf','cdr','spell','dodge','stun','block','xp','potion','lifePct','armorPct','dot','pen','physPct','elemPct','maxRes','crushPct','execPct','minionDmg','minionLife','formPct','formLife','minionUpkeep']);
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
  {id:'mycel_crown', name:'Koruna Mycelia', base:'cap3', spr:'helm_violet', fixed:{poisonCh:20,dot:20}, power:'Otrávení nepřátelé při smrti přenesou všechny své stacky jedu na sousedy.'},
  {id:'spore_grip', name:'Hrst Výtrusníka', base:'gloves', spr:'gauntlet', fixed:{spell:20,mana:15}, power:'Výtrusná střela vystřelí 2 další střely na blízké cíle.'},
  {id:'rotheart', name:'Srdce Hniloby', base:'barkarmor', spr:'armor_moss2', fixed:{life:40,regen:4}, power:'Regenerace života je trojnásobná, ale lektvary neléčí.'},
  {id:'rootblade', name:'Kořenová Čepel', base:'sword', spr:'sword2', fixed:{physPct:40,bleed:15}, power:'25% šance, že zásah nablízko zakoření cíl na 2 tahy.'},
  {id:'thistle', name:'Bodlák', base:'lshield', spr:'shield_wood2', fixed:{thorns:8,block:10}, power:'Trny vrací 40 % utrženého poškození.'},
  {id:'echo_ring', name:'Prsten Ozvěny', base:'ring', spr:'ring_violet', fixed:{cdr:10,mana:10}, power:'Dovednosti mají 25% šanci nespustit přebíjení.'},
  {id:'silent_step', name:'Boty Tichého kroku', base:'boots2', spr:'boots_tan', fixed:{dodge:10,crit:4}, power:'Po 3 krocích bez útoku je další útok kritický.'},
  {id:'puff_staff', name:'Prášnice', base:'staff', spr:'staff_green', fixed:{spell:40,poison:6}, power:'Výtrusná bomba má o 1 větší dosah a zanechává jedový mrak.'},
  {id:'hunger', name:'Hlad Chřtánu', base:'fang', spr:'dagger_p', fixed:{leech:4,crit:8}, power:'Zabití obnoví 8 % života a esence.'},
  {id:'fruiting', name:'Plodnice', base:'amulet', spr:'shrooms_red2', fixed:{poison:5,dot:15}, power:'Každý jed, který způsobíš, se aplikuje dvakrát.'},
  {id:'ash_crown', name:'Popelavá koruna', base:'cap', spr:'helm_rust', fixed:{fire:5,burnCh:20}, power:'Hořící nepřátelé při smrti zapálí všechny sousedy.'},
  {id:'sprouting', name:'Klíčící čepel', base:'axe', spr:'axe2', fixed:{dmgPct:30,lifeKill:6}, power:'Každé zabití zanechá výtrusnou minu, která příští tah vybuchne (60 % zbraně, plocha 1).'},
  {id:'storm_eye', name:'Oko bouře', base:'ring2', spr:'ring_gold', fixed:{elemPct:25,pen:8}, power:'Všechny tvé zásahy dovedností se odrazí na 1 další cíl.'},
  {id:'mycel_cloak', name:'Myceliový plášť', base:'cloak', spr:'cloak_dark', fixed:{mana:40,manaRegen:2}, power:'30 % utrženého poškození jde nejdřív z esence.'},
  {id:'devour_root', name:'Žravý kořen', base:'gauntlet', spr:'gloves', fixed:{dot:25,leech:2}, power:'Vysátí života funguje i z poškození v čase (jed, oheň, krvácení).'},
  {id:'centipede', name:'Tisícinožky', base:'boots', spr:'boots_leather', fixed:{dodge:6,finesse:10}, power:'Zabití má 30% šanci ti dát tah navíc.'},
  {id:'bone_bow', name:'Kostěný luk', base:'xbow', spr:'crossbow2', fixed:{crit:6,critMult:40}, power:'Tvé šípy se rozštěpí: každý útok luku zasáhne i 2 další cíle za 60 %.'},
  {id:'twin_tome', name:'Dvojitý grimoár', base:'tome', spr:'scroll', fixed:{spell:25,cdr:8}, power:'Kouzla se zopakují za 50 % poškození.'},
  {id:'hive_crown', name:'Koruna úlu', base:'cap3', spr:'helm_purple2', fixed:{minionMax:1,minionDmg:25}, power:'Přisluhovači při smrti vybuchnou za 50 % svého max. života (jed, plocha 1).'},
  {id:'mother_staff', name:'Hůl Matky plodnic', base:'sstaff', spr:'staff_shroom', fixed:{spell:20,minionDmg:40}, power:'Výtrusníci se vyvolávají po 3 místo po 2.'},
  {id:'rot_totem', name:'Hnijící totem', base:'mortar', spr:'mortar', fixed:{minionLife:35,minionUpkeep:-15}, power:'Přisluhovači regenerují 4 % života za tah a jejich zásahy vždy otráví.'},
  {id:'pact_ring', name:'Prsten paktu', base:'ring', spr:'ring_violet', fixed:{minionDmg:15,mana:10}, power:'Za každého živého přisluhovače máš +6 % více poškození a +2 % úhyb.'},
  {id:'bear_pelt', name:'Kůže Starého medvěda', base:'furarmor', spr:'armor_leaf2', fixed:{formLife:25,armor:20}, power:'V medvědí podobě +15 % šance blokovat a trny ve výši 10 % tvé zbroje.'},
  {id:'boar_tusk', name:'Kančí kel', base:'fetish', spr:'bag_shroom2', fixed:{formPct:30,crit:5}, power:'Náraz se nezastaví – probodne všechny nepřátele v linii.'},
  {id:'moon_mask', name:'Maska úplňku', base:'mask', spr:'helm_tan', fixed:{formPct:20,crit:4}, power:'Každá proměna ti dá na 3 tahy +50 % poškození.'},
  {id:'root_spear', name:'Kořenové kopí', base:'spear', spr:'spear', fixed:{physPct:30,formLife:10}, power:'Spoutání kořeny přeskočí na 2 sousední nepřátele a Drtivý úder zakoření cíl.'},
  {id:'blood_idol', name:'Krvavý idol', base:'amulet2', spr:'amulet_heart', fixed:{lifePct:15,leech:2}, power:'Dovednosti stojí život místo esence; +40 % poškození dovedností.'},
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
  plague:{name:'Mor', type:'spell', tags:['spell','aoe','dot'], cost:14, cd:5, desc:'Nakazí nepřátele v dosahu 3: silný jed na 6 tahů (200 % kouzla celkem).', target:'tile', range:6, cls:'myco'},
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
};
for(const [id,s] of Object.entries(SKILLS)) s.icon='sk_'+id;
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
};
for(const [id,s] of Object.entries(SUPPORTS)) s.spr='rune_'+id;
// minion archetypes (scaled by player level, skill level and minion stats)
export const MINIONS={
  sprout:{name:'Výtrusník', spr:['capling_o','capling_b'], hp:16, dmg:[2,5], arm:3, upkeep:0.05, ai:'melee', sc:0.72, max:3, n:2},
  jelly:{name:'Medúzka', spr:['jelly'], hp:12, dmg:[2,4], arm:1, upkeep:0.06, ai:'ranged', el:'poison', range:5, sc:0.75, max:2, n:1},
  ent:{name:'Ent', spr:['ent'], hp:70, dmg:[5,9], arm:12, upkeep:0.14, ai:'melee', sc:1.2, max:1, n:1, taunt:true},
};
export const CLASSES=[
  {id:'blade', name:'Výtrusný šermíř', spr:'hero_blade', desc:'Zuřivý bojovník zblízka. Krvácení, kritické zásahy, plošné seky.', stats:{might:8,finesse:6,wits:3}, skills:['cleave','rotstrike'], gear:['sword','cap','mossarmor'], rune:'crit',
    trait:{name:'Krvavý tanec', desc:'+15 % šance na krvácení, +2 % kritická šance.', s:{bleed:15,crit:2}}},
  {id:'warden', name:'Kořenový strážce', spr:'hero_knight', desc:'Obrněný ochránce se štítem. Omráčení, trny, odolnost.', stats:{might:9,finesse:3,wits:4}, skills:['bash','barkskin'], gear:['club','shield','mossarmor'], rune:'stun',
    trait:{name:'Hluboké kořeny', desc:'+6 % blok, +20 % zbroje, +3 trny.', s:{block:6,armorPct:20,thorns:3}}},
  {id:'myco', name:'Mykomant', spr:'hero_mage', desc:'Mág výtrusů a hniloby. Jed na dálku, plošná kouzla, vysávání.', stats:{might:3,finesse:4,wits:10}, skills:['sporebolt','puffbomb'], gear:['staff','tome','cap'], rune:'venom',
    trait:{name:'Nositel spor', desc:'+15 % šance otrávit, +15 % násobič poškození v čase.', s:{poisonCh:15,dot:15}}},
  {id:'ranger', name:'Hnilobný lovec', spr:'hero_ranger', desc:'Lukostřelec ze stínů. Rychlé střely, úhyb, salvy.', stats:{might:4,finesse:10,wits:3}, skills:['volley','blink'], gear:['bow','quiver','cloak'], rune:'multi',
    trait:{name:'Stínochod', desc:'+6 % úhyb, +20 % kritický násobič.', s:{dodge:6,critMult:20}}},
  {id:'summoner', name:'Plodonoš', spr:'myconid', desc:'Pěstitel živé armády. Každý přisluhovač si ale bere kus jeho života.', stats:{might:4,finesse:4,wits:9}, skills:['sproutlings','command'], gear:['sstaff','mortar','cap'], rune:'venom',
    trait:{name:'Matka podhoubí', desc:'+15 % života přisluhovačů, daň přisluhovačů −15 %.', s:{minionLife:15,minionUpkeep:-15}}},
  {id:'shifter', name:'Měňavec', spr:'druid', desc:'Druid dvojí krve. Mění se v medvěda nebo kance, mezi proměnami spoutává kořeny.', stats:{might:8,finesse:6,wits:4}, skills:['bearform','maul'], gear:['spear','mask','leafarmor'], rune:'brutal',
    trait:{name:'Dvojí krev', desc:'+15 % poškození v podobě zvířete, +10 % života v podobě.', s:{formPct:15,formLife:10}}},
];
export const FORMS={bear:{name:'Medvědí podoba',acc:'medvědí podobu',spr:'bear',sc:1.05}, boar:{name:'Kančí podoba',acc:'kančí podobu',spr:'boar',sc:0.95}};
// passive tree: n=name, s=stats, k=keystone id, notable flag, x/y in tree space, l=links
// ---------- passive tree (procedural, 6 sectors x 5 rings + 12 keystones) ----------
const TREE_THEMES=[
  {id:'w',name:'Důvtip',small:[{spell:6},{mana:8},{manaRegen:0.3},{cdr:2},{wits:4},{spell:4,mana:4}],small_n:['Mysl','Esence','Proud','Spěch','Důvtip','Šepot'],
   notable:[['Proud esence',{mana:30,manaRegen:1,spell:10}],['Arcimág',{spell:22,skill:1}]],keys:['eldritch','pact']},
  {id:'wf',name:'Rozklad',small:[{dot:6},{poisonCh:5},{poison:2},{wits:2,finesse:2},{pen:2},{decay:2}],small_n:['Hniloba','Nákaza','Jed','Bystrost','Průraz','Rozpad'],
   notable:[['Toxikolog',{dot:25,poisonCh:12}],['Šířící se mor',{dot:15,poison:5,pen:6}]],keys:['rotsoul','plaguebody']},
  {id:'f',name:'Obratnost',small:[{crit:1.5},{critMult:8},{dodge:2},{finesse:4},{dmgPct:5},{crit:1,dodge:1}],small_n:['Ostříž','Zkáza','Stín','Mrštnost','Hbitost','Lest'],
   notable:[['Zabiják',{crit:4,critMult:30}],['Stínochod',{dodge:8,crit:2,lifeKill:4}]],keys:['resonance','darkhunter']},
  {id:'fm',name:'Krveprolití',small:[{physPct:6},{bleed:5},{lifeKill:2},{execPct:6},{dmgPct:5},{stun:3}],small_n:['Ostří','Krvácení','Hodokvas','Poprava','Zuřivost','Otřes'],
   notable:[['Řezník',{physPct:20,execPct:20,bleed:10}],['Krvežíznivost',{leech:2,physPct:10,lifeKill:5}]],keys:['berserk','bloodmagic']},
  {id:'m',name:'Síla',small:[{life:8},{lifePct:3},{armorPct:8},{regen:0.4},{might:4},{block:2}],small_n:['Houževnatost','Míza','Kůra','Obnova','Síla','Štít'],
   notable:[['Bastion',{armorPct:30,block:6,lifePct:5}],['Nezlomný',{lifePct:10,res:8,regen:2}]],keys:['rootwill','iron']},
  {id:'mw',name:'Živly',small:[{elemPct:6},{fire:2},{burnCh:5},{res:3},{might:2,wits:2},{resFire:6}],small_n:['Živel','Žár','Spáleniště','Odolnost','Rovnováha','Popel'],
   notable:[['Pyromant',{elemPct:22,fire:4,burnCh:10}],['Elementální štít',{res:10,maxRes:1,elemPct:8}]],keys:['glass','chitin']},
  {id:'mn',name:'Roj',small:[{minionDmg:6},{minionLife:6},{wits:3},{minionDmg:4,minionLife:4},{mana:6},{cdr:2}],small_n:['Vůdce','Plodnost','Důvtip','Hnízdo','Esence','Spěch'],
   notable:[['Matka roje',{minionDmg:22,minionLife:15,minionUpkeep:-10}],['Nekonečné hnízdo',{minionMax:1,minionUpkeep:-20}]],keys:['swarm','symbiosis']},
  {id:'sh',name:'Divočina',small:[{formPct:6},{formLife:4},{might:3},{physPct:5},{life:8},{bleed:4}],small_n:['Tesák','Srst','Síla','Drápy','Houževnatost','Krvavá stopa'],
   notable:[['Vůdce smečky',{formPct:22,crit:3}],['Kůže pradávných',{formLife:15,armorPct:20}]],keys:['wildheart','apex']},
];
const TREE_ORDER=['w','mn','wf','f','fm','sh','m','mw']; TREE_THEMES.forEach((t,i)=>t.oi=i); TREE_THEMES.sort((a,b)=>TREE_ORDER.indexOf(a.id)-TREE_ORDER.indexOf(b.id));
const KEY_NAMES={eldritch:'Mykotická zkáza',pact:'Pakt s hlubinou',rotsoul:'Hnilobná duše',plaguebody:'Mor v krvi',resonance:'Rezonance výtrusů',darkhunter:'Lovec ve tmě',berserk:'Zuřivost',bloodmagic:'Krvavá magie',rootwill:'Kořenová vůle',iron:'Železné výtrusy',glass:'Skleněné dělo',chitin:'Chitinová schránka',swarm:'Roj',symbiosis:'Symbióza',wildheart:'Divoké srdce',apex:'Vrcholový predátor'};
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
  const by=Object.fromEntries(N.map(n=>[n.id,n])); const link=(a,b)=>{ if(by[a]&&by[b]&&a!==b) by[a].l.push(b); };
  TREE_THEMES.forEach((th,s)=>{ const ns=(s+1)%NS; link('c',id(s,0,'M'));
    for(let k=0;k<RINGS;k++){ const ps=slots(k).map(x=>x[0]); for(let i=0;i<ps.length-1;i++) link(id(s,k,ps[i]),id(s,k,ps[i+1]));
      link(id(s,k,ps[ps.length-1]),id(ns,k,ps[0]));
      if(k<RINGS-1){ link(id(s,k,'M'),id(s,k+1,'M'));
        if(k===1){ link(id(s,1,'L'),id(s,2,'L')); link(id(s,1,'R'),id(s,2,'R')); }
        else if(k===0){ if(true) link(id(s,0,'L'),id(s,1,'L')); }
        else { if(k%2) { link(id(s,k,'L'),id(s,k+1,'L')); link(id(s,k,'RR'),id(s,k+1,'RR')); } else { link(id(s,k,'R'),id(s,k+1,'R')); link(id(s,k,'LL'),id(s,k+1,'LL')); } } } }
    link(id(s,RINGS-1,'LL'),`${th.id}K0`); link(id(s,RINGS-1,'RR'),`${th.id}K1`); });
  return N; })();
export const KEYSTONES={
  rootwill:'Kořenová vůle: nemůžeš uhýbat, šance na blok ×2 (max 75 %).',
  bloodmagic:'Krvavá magie: dovednosti stojí život místo esence, +30 % života.',
  resonance:'Rezonance výtrusů: kritické zásahy vždy otráví a zapálí, −30 % kritického násobiče.',
  darkhunter:'Lovec ve tmě: pochodeň −2, +50 % poškození proti nepřátelům mimo světlo pochodně, +5 % kritické šance.',
  rotsoul:'Hnilobná duše: jed se stackuje bez limitu a trvá o 2 tahy déle; nemůžeš kriticky zasáhnout.',
  glass:'Skleněné dělo: +40 % více poškození, −30 % maximálního života.',
  eldritch:'Mykotická zkáza: +60 % násobič poškození v čase, přímé zásahy −30 %.',
  iron:'Železné výtrusy: zbroj snižuje i elementální poškození (50 %), úhyb je 0.',
  pact:'Pakt s hlubinou: +2 ke všem dovednostem, ale přebíjení trvá o 50 % déle a esence se sama neobnovuje.',
  plaguebody:'Mor v krvi: každý tvůj jed přeskočí i na sousedy cíle. Jsi trvale nakažený (−1 % života za tah, nezabije tě), ale cizí jed na tebe nepůsobí.',
  berserk:'Zuřivost: +1 % poškození za každé 1 % chybějícího života. Tvoje zbroj je 0.',
  swarm:'Roj: +2 k maximu přisluhovačů každého druhu a daň přisluhovačů −30 %, ale přisluhovači mají −35 % života a poškození.',
  symbiosis:'Symbióza: 35 % poškození, které utrpíš, převezme tvůj nejbližší přisluhovač. Sám ale způsobuješ o 40 % méně poškození.',
  wildheart:'Divoké srdce: proměny nic nestojí a nemají přebíjení. V lidské podobě ale způsobuješ o 40 % méně poškození.',
  apex:'Vrcholový predátor: v podobě zvířete +30 % více poškození a regenerace 2 % života za tah. Nemůžeš používat druhou ruku a lektvary léčí o 50 % méně.',
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
  {id:'res', name:'Mykotická kůže', desc:'Nepřátelé +30 % odolnosti', reward:'Šance na Výtrusorozené předměty', mon:{res:30}, loot:{spore:0.12}},
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
