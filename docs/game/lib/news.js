// Novinky – nejnovější nahoře. Při každém nasazení přidej záznam (v = rostoucí číslo verze).
export const NEWS=[
  {v:24, d:'12. 11. 2026', t:'Hlubiny a bossové', i:[
    'Po varování před útokem bosse máš tah na reakci a místo k úhybu. Ve větší hloubce roste poškození pomaleji a postih k odolnostem je menší.',
    'Hra dál generuje patra za hloubkou 100. Od hloubky 60 má základní síla monster a úroveň nové výbavy strop, zatímco patra, bossové a korupce se dál střídají.',
    'Po smrti můžeš ustoupit na dřívější kontrolní bod a doplnit výbavu. Dosažený rekord ti zůstane.']},
  {v:23, d:'11. 11. 2026', t:'Město bez svítání', i:[
    'V hloubkách 21–25 najdeš podzemní město obývané padlými anděly. Hlídej si kříže, prstence a švihy křídel.',
    'Až při průzkumu potkáš Jandira, může ti dát úkol s posledním městským zvonem. Průběh najdeš v Kronice [J].']},
  {v:22, d:'11. 11. 2026', t:'První postavy podporovatelů', i:[
    'Při průzkumu můžeš vzácně narazit na Jandira, Feckeho, Dandýsův váček s runou nebo na skrytou odbočku.',
    'V Doupěti Psa z Brna můžeš vyšetřit zmizení zvonu. Za Gothmogovou branou čekají rozpadlé ruiny, pasti a odměna u trůnu.',
    'Na úvodní obrazovce najdeš <b>Síň slávy</b> s poděkováním podporovatelům.']},
  {v:21, d:'10. 11. 2026', t:'Hraní na telefonu', i:[
    'Sporium jde hrát na telefonu a tabletu, nejlépe <b>na šířku</b> (na výšku tě hra upozorní).',
    'Ťukni na pole = pohyb a útok, <b>podrž prst</b> = popis nepřítele nebo předmětu, <b>dva prsty</b> = zoom.',
    'Vlevo dole jsou šipky pro chůzi a <b>E</b> pro interakci, vpravo nahoře menu, mapa, sestup a čekání.',
    'V oknech první ťuknutí na předmět nebo uzel stromu ukáže popis, druhé ho použije. Strom má tlačítka + a − pro zoom.',
    'Na úvodní obrazovce je na telefonu tlačítko Celá obrazovka.']},
  {v:20, d:'10. 11. 2026', t:'Soukromí', i:[
    'V menu i na úvodní obrazovce je nová stránka <b>Soukromí</b>: co hra ukládá, kde a jak dlouho.',
    'Tlačítkem <b>Smazat moje online data</b> si sám smažeš přezdívku, výsledky, hroby, předměty ve studně i zálohu na serveru.',
    'Stará online data se teď mažou automaticky (zálohy po 180 dnech bez aktualizace, hroby po 180 dnech, denní žebříčky po 90 dnech).',
    'Písma hra načítá ze svého webu, ne od Googlu.']},
  {v:19, d:'10. 11. 2026', t:'Záloha postav, potvrzování a nápověda', i:[
    '<b>Záloha</b> (úvodní obrazovka i menu Esc): stáhni si postavy do souboru, nebo si vytvoř <b>kód zálohy</b> a obnov je v jiném prohlížeči či po smazání historie. Záloha se pak sama obnovuje.',
    'Body atributů a pasivního stromu se ukládají až tlačítkem <b>Potvrdit</b> – překliknutí jde vrátit tlačítkem Zrušit.',
    'Najeď myší na řádky v okně postavy a na ukazatele vlevo nahoře – dozvíš se, co znamenají (úhyb, blok, zbroj, odolnosti…). Zkažená jádra mají vlastní ikonu.',
    'Nové postavy uvítá krátký <b>příběh Ul-Myru</b> (znovu si ho přečteš v menu Esc → Příběh).',
    'Při prvním levelu, první runě, knize a první smrti ti hra ukáže krátký tip.']},
  {v:18, d:'9. 11. 2026', t:'Nový biom: Zhnilá katedrála', i:[
    'Hloubky 11–15 tě zavedou do <b>Zhnilé katedrály</b>: mozaikové a šachovnicové podlahy, gotické oblouky, lavice, svícny, sochy světců, sarkofágy, varhany a padlé zvony.',
    'Ze stropu dopadá barevné světlo neviditelných vitráží a svícny s relikviáři hřejí teplým světlem.',
    'Utopené mycelium se posunulo na hloubky 16–20.']},
  {v:17, d:'9. 11. 2026', t:'Rychlá hniloba', i:[
    '<b>Jed</b> působí rychleji: trvá poloviční dobu, celkově dává o 15 % víc a první tik zasáhne hned při zásahu. Už nemusíš kličkovat, než nepřítel vytiká.',
    '<b>Hniloba oslabuje</b>: každý stack jedu sníží poškození monstra o 6 % (nejvýš −30 %). Uvidíš to nad jeho životem.',
    '<b>Krvácení</b>: silnější (55 % fyzického zásahu za tah), trvá 2 tahy a první tik je taky hned.',
    'Nová univerzální dovednost <b>Sklizeň</b>: spotřebuje jed a krvácení na cíli a zbytek způsobí hned za 120 %. Krvácení přeruší chystaný útok, a pokud cíl s jedem padne, nakazí sousedy.',
    '<b>Přeroubování</b> na Oltáři hniloby: vyber jednu vlastnost a vyměň ji za novou. Nová se zamkne a přežije i Přeměnu vlastností.',
    'Mor trvá 3 tahy místo 6 (stejné celkové poškození). Hnilobná duše prodlužuje jed o 1 tah.']},
  {v:16, d:'9. 11. 2026', t:'Klidnější zem a poctivější kořist', i:[
    '<b>Zóny na zemi</b> mají nový vzhled: jedové kaluže, výtrusná mlha a žhavé uhlíky místo barevných čtverců. Varování před zónou zhoustne, než začne pálit.',
    '<b>Výtrusná bouře</b> je mírnější: méně mraků, nikdy přímo pod tebou a s delším varováním. Kouzelníci plivou kaluže do kříže, kratší dobu a každý jen jednu najednou. Stojíš-li ve více zónách, zraní tě jen ta nejsilnější.',
    '<b>Poslední výtrusy</b>: po smrti uvidíš, co tě v posledních tazích zranilo, a krátkou radu, co příště změnit.',
    '<b>Vzácnost předmětů</b> má klesající výnosy (nejvýš 2,5×) a unikáty se sadami mají vlastní strop. Hromady unikátů z hlubokých jeskyní jsou pryč.',
    '<b>Zkažená jeskyně</b>: modifikátory už nenafukují kořist z každého monstra. Všechno, co jeskyně nasbírá, vydá na konci Srdce jeskyně, a to vždy aspoň jeden vzácný předmět, často unikát nebo kus sady.',
    'Mykotická kůže dává Výtrusorozené předměty vzácněji.']},
  {v:15, d:'9. 11. 2026', t:'Filtr kořisti a opravy', i:[
    '<b>Filtr kořisti</b> (menu Esc): vyber, od jaké vzácnosti se ti předměty ukazují a zvedají. Skryté uvidíš a sebereš s podrženým <b>Alt</b>.',
    'Odměny z Plodnice, truhel a skřítků už nikdy nepadnou pod překážku – vždy na volné místo.',
    'Špatné pořadí run nebo tónů krystalů vyvolá nepřátele jen první 3×, pak už jen zraní hnilobou (žádné farmení zkušeností).',
    'Utopené mycelium už nemá falešné náhrobky a obelisky jako dekoraci – co vypadá jako nápověda, je nápověda.',
    'Hodnoty atributů se zaokrouhlují a nepřetékají z okna.',
    '<b>Avatar ohně</b>: nově nemůžeš způsobit jed ani krvácení (přisluhovači ano).',
    '<b>Divoké srdce</b>: každá proměna do nové podoby dá na 3 tahy +40 % poškození – vyplatí se střídat podoby. Postih v lidské podobě snížen na −25 %.',
    '<b>Vrcholový predátor</b>: druhá ruka teď nedává bonusy nikdy a v inventáři je to vidět.']},
  {v:14, d:'6. 11. 2026', t:'Porovnání předmětů a novinky', i:[
    'Při najetí na předmět vidíš vedle i ten, který máš na sobě (u prstenů oba), a souhrn, jak se změní tvá postava: život, poškození, odolnosti, krit…',
    'Novinky jsou teď vždy po ruce v menu a na úvodní obrazovce.']},
  {v:13, d:'5. 11. 2026', t:'Živí tvorové a muší podoba', i:[
    'Medvědi, kanci a mouchy jsou nově animovaní – chodí, kousají, mávají křídly.',
    'Měňavec se mění v nové postavy na dvou nohách: medvěd, kanec a nově <b>moucha</b>.',
    '<b>Muší podoba</b>: jediná podoba, ve které smíš kouzlit. +25 % kouzla a projektily, plivanec na dálku. Dovednosti Hnilobný plivanec a Bzučící mračno.']},
  {v:12, d:'4. 11. 2026', t:'Mnohem víc buildů', i:[
    '21 nových dovedností napříč všemi třídami (Výtrusný vír, Otřes země, Výtrusná bouře, Pasti, Krok stínem, Houbový totem, Duch vlka, Vytí…).',
    '11 nových run (Soustředění, Rozklad, Přetížení, Výtrusné šíření, Hrůza…).',
    'Pasivní strom se zvětšil na 505 uzlů: 4 nové prstence, 48 velkých uzlů a 16 nových keystonů. Strom jde prohledávat.',
    '26 nových unikátů, 8 nových sad a 15 nových vlastností předmětů.',
    'Nepřátelé můžou být oslabení, vyděšení nebo zpomalení.',
    'Tvoje postavy a předměty zůstaly beze změny.']},
  {v:11, d:'3. 11. 2026', t:'Animovaný hrdina', i:[
    'Hrdinové jsou animovaní a vidíš na nich zbraně, štíty a čepice, které mají nasazené.',
    'Nové helmy a klobouky.']},
  {v:10, d:'2. 11. 2026', t:'Online svět', i:[
    '<b>Denní hlubina</b>: stejné patro pro všechny, jeden život, denní žebříček.',
    '<b>Hroby padlých</b>: najdeš hroby jiných hráčů i s jejich vzkazem.',
    '<b>Hnilobná studna</b>: hoď do ní předmět a vylov předmět jiného hráče.',
    'Online žebříček sezóny s přezdívkou, mapa na Tab, větší zavírací křížky.']},
];
export const NEWS_LATEST=NEWS[0].v;
