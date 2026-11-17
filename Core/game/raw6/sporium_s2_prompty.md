# Sporium S2 „Padlí z jádra“ – prompty na art

Soubory pojmenuj přesně podle názvů níže a dej je do `Core/game/raw6/s2/`. Formát PNG s průhledností. Pokud generátor neumí alfu, použij plné pozadí `#00FF00`.

Do té doby hra používá zástupné sprity: andělé mají rig hrdinů s křídly strážce, Trhlina má rozbitý oblouk a Padlý anděl hrob.

## Společný styl (vlož na začátek KAŽDÉHO promptu)

```
2D game asset for a dark-fantasy mushroom dungeon crawler. Hand-drawn cartoon style, thick dark brown outlines (#1a1410), flat muted earthy colors with soft cel shading, slightly chibi proportions, gloomy but cute. Recurring motifs: moss, pale mycelium threads, gnarled roots, faint green and violet spore glow. Single subject, centered, fully visible, isolated on a transparent background. No text, no letters, no frame, no cast shadow, no background scenery.
```

Téma sezóny: andělé, kteří sestoupili do jádra podhoubí a vrátili se nakažení. Původně zlatí a bílí, teď je prorůstá šedofialové mycelium. Peří mají olezlé a zplesnivělé, svatozáře popraskané a porostlé houbami. Barvy: špinavá slonovina, matné zlato, šedofialová, bledě zelená záře spor. Mají působit **smutně a posvátně, ne krvavě**.

---

## 1. Andělé (monstra)

Každého anděla dej jako **rig sheet**: postava rozložená na samostatné díly na jednom plátně 1024×1024, díly se nepřekrývají a mezi nimi je volné místo. Díly: hlava, trup, horní a dolní paže (L/P), nohy (L/P), **levé a pravé křídlo zvlášť** a případně zbraň. Pohled ve 3/4 doprava. Proporce jako naši hrdinové v `ingame_good_example.png`.

Navíc ke každému jeden **náhled celé postavy** (`*_full.png`, 1024×1024), podle kterého díly poskládám.

**`angel_cherub_rig.png` + `angel_cherub_full.png`** – Jádrový cherub (rychlý, nálet v linii)
```
[STYL] Small fallen cherub monster, child-sized, round chubby body, tiny cracked golden halo overgrown by pale mushrooms, short stubby wings with molting grey feathers and violet mycelium threads between them, blank glowing violet eyes, small spear made from a sharpened bone. Hovering pose leaning forward as if about to dive.
```

**`angel_seraph_rig.png` + `angel_seraph_full.png`** – Výtrusný serafín (kouzelník, kříž světla, léčí anděly)
```
[STYL] Fallen seraph monster, tall and slender, robe of ivory cloth stained grey with spores, six wings (two cover the face, two spread, two at the feet) with feathers turning into fungal gills, a cracked halo with small violet glowing mushrooms, hands raised casting a cross of pale green light. Serene, eerie.
```

**`angel_ophan_full.png`** – Trůn očí / Ofan (nehybný, zranitelný jen otevřený)
Dvě verze stejné postavy, 1024×1024, bez rigu:
```
[STYL] Fallen ophanim monster: two interlocking wheels of tarnished gold covered in moss, eyes all around the rims, center made of a pulsing fungal core with a large eye, small wings of mouldy feathers on the rims. Version A (closed): every eye shut, wheels tilted, dim. Version B (open): every eye wide open and glowing violet, wheels spinning, spores bursting out.
```
Soubory: `angel_ophan_closed.png`, `angel_ophan_open.png`.

**`angel_arch_rig.png` + `angel_arch_full.png`** – Archanděl hniloby (boss Trhliny)
```
[STYL] Fallen archangel boss, 1.5x taller than other characters, heavy ornate armor of tarnished gold with pale mycelium bursting through the joints, huge ragged wings half feathers half grey bracket fungi, helmet with a broken halo and a crown of small mushrooms, long sword whose blade is fused with violet crystal, a torn banner on the back. Proud, tragic, imposing.
```

**`angel_fallen_wounded.png`** – 768×768, rekvizita pro událost Padlý anděl
```
[STYL] Prop: a wounded fallen angel lying on the ground, wings broken and spread on the floor, mycelium growing out of the wounds into the ground, cracked halo lying beside the head, looking up with tired eyes. Sad, quiet, not gory. Slight top-down 3/4 view.
```
**`angel_fallen_ash.png`** – stejná pozice, po události: jen popel, pár pírek a vyhaslá svatozář.

---

## 2. Trhlina jádra (sezónní událost)

**`core_rift.png`** – 768×768, rekvizita
```
[STYL] Prop: a vertical tear in the ground and air framed by thick roots and grey bracket fungi, inside a swirling core of violet and pale gold light, a few falling feathers, glowing spores rising. Front view, upright.
```
**`core_rift_closed.png`** – stejný rám, trhlina zacelená, jen svítící jizva a pár zplesnivělých pírek.

---

## 3. Řemeslo – krystaly a pírka (ikony 512×512)

Tři rodiny krystalů. Stupeň (I–V) hra ukazuje tónováním a číslem, stačí tedy **jedna ikona na rodinu**. Pokud budeš chtít, přidej i varianty `_5` pro bezvadný krystal (větší a zářivější).

**`crystal_life.png`**
```
[STYL] Item icon: a rough organic crystal cluster of warm red-pink color with tiny green moss at the base and a heartbeat-like glow inside.
```
**`crystal_war.png`**
```
[STYL] Item icon: a sharp jagged crystal shard of amber-orange color, edges like blades, small rusty iron fragments embedded in it, fiery glow.
```
**`crystal_mind.png`**
```
[STYL] Item icon: a smooth elongated crystal of pale blue-violet color with a swirling mist inside and tiny glowing spores orbiting it.
```
**`feather_angel.png`**
```
[STYL] Item icon: a single long angelic feather, ivory with a gold tip, the lower half turning grey and fungal with violet mycelium threads, faint holy glow.
```

---

## 4. Sezónní unikáty (ikony 512×512)

| Soubor | Název | Prompt (za `[STYL] Item icon:`) |
|---|---|---|
| `s2_halo.png` | Svatozář z jádra | cracked golden halo-crown helmet overgrown with pale mushrooms, faint violet glow |
| `s2_wingblade.png` | Čepel padlého křídla | longsword whose blade is a single giant stiff feather of tarnished gold, mycelium-wrapped grip |
| `s2_corecensor.png` | Kadidelnice jádra | ornate golden censer lantern on a chain, violet and pale green smoke with spores pouring out |
| `s2_featherstep.png` | Pírkové kroky | light ivory boots with small feathered wings at the ankles, grey fungal stains |
| `s2_seraphmail.png` | Serafínská zbroj | chest armor of overlapping golden feather-shaped plates, mycelium growing between them |
| `s2_choir.png` | Amulet chóru | amulet of six tiny feathers arranged in a circle around a singing fungal mouth, violet glow |

Nasazené verze (`s2_halo_worn.png`, `s2_wingblade_held.png`) dělej podle pravidel v `PROMPT_nasazene_predmety.md`: zbraň 45°, úchop na 24 % / 76 %, helma jen přední polovina.

---

### Priorita
1. Čtyři andělé (rig sheet a náhled). Bez nich vypadají jako přebarvení hrdinové.
2. `core_rift`, `angel_fallen_wounded` a `_ash`.
3. Tři krystaly a pírko. V inventáři je potkáváš nejčastěji.
4. Šest sezónních unikátů a jejich nasazené verze.
