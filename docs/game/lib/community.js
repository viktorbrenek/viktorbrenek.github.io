import {RNG} from './util.js';

const jandir={communityId:'jandir',name:'Jandir Shindrel', action:'cityQuest', spr:'npc_sage', text:'Když před sebou uvidíš zavřenou mříž, rozhlédni se po okolních komnatách. Trezory Ul-Myru mají klíče, které se do zámku nevejdou.'};
const encounters=[
  [jandir,4],
  [{communityId:'dandys',name:'Váček se vzkazem od Dandýse', action:'dandys', spr:'sack'},2],
  [{communityId:'dogInvestigation',name:'Doupě Psa z Brna', action:'enter', area:'dog', spr:'arch_broken'},2],
  [{communityId:'fecke',name:'Fecke', spr:'hero_ranger', text:'Vlaštovka by se tudy protáhla, ale ty radši sleduj zem. Když se pod nohama zvednou výtrusy, ustup, než mrak zhoustne.'},4],
  [{communityId:'kingRuins',name:'Brána do Gothmogova města', action:'enter', area:'king', spr:'arch'},1],
];

export const HALL_OF_FAME=['Daniel Hejret','Tomáš Hořice','Marek Dolák','Jandir Shindrel','Jiří Laštovička'];

export function communityEncounter(seed,depth,completed={}){
  const available=npc=>!completed[npc.communityId]||completed[npc.communityId]===depth;
  if(depth===21) return available(jandir)?jandir:null;
  const roll=d=>new RNG((seed^Math.imul(d,0x9e3779b9)^0xa53a9d59)>>>0);
  const current=roll(depth);
  if(depth<2||depth===20||depth===22||current.next()>=0.5||(depth>2&&roll(depth-1).next()<0.5)) return null;
  const eligible=encounters.filter(([npc])=>npc.area==='king'?depth>=8:npc.area==='dog'?depth>=3:true);
  const pool=eligible.flatMap(([npc,weight])=>Array(weight).fill(npc));
  const npc=current.pick(pool);
  return available(npc)?npc:null;
}

export const DOG_CASE={
  answers:['Šelma vylezla z vodní stoky.','Někdo odvezl zvon servisním vozíkem severní branou.','Někdo ho vynesl pěšky západním průchodem.'],
  solution:1,
};

export function royalTrapActive(trap,turn){
  return trap.kind==='crack'||(turn+trap.offset)%3<2;
}

export function communityRoom(area,x,y){
  const props=[], tiles=[];
  const add=(dx,dy,pr)=>props.push({type:'communityNpc',x:x+dx,y:y+dy,block:true,...pr});
  const carve=(left,top,w,h)=>{
    for(let dy=top;dy<top+h;dy++) for(let dx=left;dx<left+w;dx++) tiles.push([x+dx,y+dy]);
  };
  const exit=dy=>add(0,dy,{name:'Zpět do hlubin',action:'leave',spr:'arch_broken',light:[0.9,0.8,0.6],lr:4});
  const inspect=(dx,dy,clue,name,spr,text)=>add(dx,dy,{action:'clue',clue,name,spr,text,light:[0.64,0.68,0.56],lr:3});
  const scenery=(dx,dy,spr,flat=false)=>add(dx,dy,{type:'deco',spr,flat,deco:true,block:false});
  if(area==='dog'){
    carve(-3,14,7,7); carve(-2,7,5,8); carve(-3,0,7,6); carve(0,6,1,1);
    carve(-12,7,7,7); carve(-5,10,3,1); carve(6,7,7,7); carve(3,10,3,1);
    exit(20);
    add(0,15,{name:'Pes z Brna',action:'dog',spr:'npc_hermit',light:[0.75,1,0.55],lr:4});
    inspect(-9,8,'ledger','Zápis strážného','cath_lectern','Noční směna. Západní vrata jsou zapečetěná. Servisní vozík si před půlnocí vypůjčil správce severní brány.');
    inspect(9,8,'grate','Mříž nad stokou','rune_a','Rez mezi mříží a rámem je souvislá. Od poslední záplavy mříží nikdo nepohnul. Šelma se tudy nedostala.');
    inspect(1,1,'tracks','Koleje u severní brány','shroom_roots','Dvě hluboké rovnoběžné koleje vedou ven. Na prahu je kus provazu z úvazu zvonu.');
    scenery(-11,8,'crate'); scenery(-11,9,'barrels'); scenery(-7,12,'bench');
    scenery(11,9,'pool_water',true); scenery(11,10,'pool_water',true); scenery(11,11,'pool_water2',true);
    scenery(-2,1,'arch_broken'); scenery(2,1,'rubble');
    return {area,props,tiles,start:[x,y+19],clues:new Set()};
  }

  carve(-4,25,9,6); carve(-1,10,3,15); carve(-5,0,11,10);
  carve(-12,15,8,9); carve(-4,22,3,1); carve(5,15,8,9); carve(2,22,3,1);
  exit(30);
  add(-3,27,{name:'Prasklá deska u vstupu',action:'read',spr:'cath_lectern',text:'Dvě pečeti střeží cestu k trůnu. Jedna zůstala v západní cisterně, druhá ve východní zvonici. Ověř si každý krok. Praskliny se propadají a výtrusné pasti v pravidelném rytmu zhasínají.'});
  add(-9,16,{name:'Pečeť cisterny',action:'royalWard',ward:'cistern',spr:'cath_reliquary',light:[0.4,0.7,1],lr:4});
  add(9,16,{name:'Pečeť zvonice',action:'royalWard',ward:'belfry',spr:'cath_bell',light:[1,0.63,0.32],lr:4});
  for(const dx of [-1,0,1]) add(dx,14,{name:'Zapečetěná brána',action:'royalGate',spr:'gate',opaque:true});
  add(0,1,{name:'Gothmog - Nejvyšší Kapitán Angbandu',label:'Gothmog',action:'king',spr:'hero_knight',light:[1,0.7,0.4],lr:5});
  for(const side of [-1,1]){
    scenery(side*4,1,'cath_banner'); scenery(side*4,4,'cath_pew_broken');
    scenery(side*4,25,'cath_pillar'); scenery(side*4,28,'rubble');
    add(side*4,7,{type:'glow',spr:'cath_candelabra',light:[1,0.65,0.3],lr:4,deco:true,block:false});
    scenery(side*10,21,side<0?'cath_sarcophagus':'cath_pew_broken');
  }
  scenery(-11,17,'pool_water2',true); scenery(-10,17,'pool_water',true);
  scenery(7,16,'cath_bell'); scenery(11,17,'rubble');
  const traps=[];
  const trapRow=(kind,dy,cols)=>cols.forEach((dx,i)=>traps.push({kind,x:x+dx,y:y+dy,offset:i%3}));
  trapRow('crack',20,[-12,-11,-9,-8,-7,-5]);
  trapRow('crack',18,[-12,-10,-9,-8,-6,-5]);
  trapRow('pulse',20,[5,6,7,8,9,10,11,12]);
  trapRow('pulse',18,[5,6,7,8,9,10,11,12]);
  trapRow('pulse',12,[-1,0,1]);
  trapRow('crack',10,[-1,1]);
  return {area,props,tiles,traps,start:[x,y+29],wards:new Set()};
}
