# Sporium – nasazené verze nových předmětů (pro paper-doll postavy)

## Kontext pro AI

Postavy ve hře Sporium jsou paper-doll: hlava, tělo, ruce a nohy jsou samostatné díly a hra na ně kreslí sprite nasazené **zbraně**, **druhé ruky** a **helmy**. Ikony předmětů z endgamu (`q_*`, `eg_*`) jsou nakreslené jako ikony do inventáře, ne jako nasazené. Proto meč postava drží za ostří a koruna jí plave nad hlavou i s průhledem na zadní stranu (viz `ingame_problem_crown.png`). Jak to má vypadat správně, ukazuje `ingame_good_example.png`.

Úkol: dodat **nasazené verze** níže uvedených předmětů tak, aby přesně seděly na postavu. Ikony v inventáři zůstávají, jak jsou.

Výstup: PNG s průhledností, ořezané těsně na obsah (bez prázdných okrajů), ve stylu Sporia. Styl: tlusté tmavě hnědé obrysy, ploché tlumené barvy, cel shading. Soubory pojmenuj přesně podle seznamu a dej je do `Core/game/raw6/endgame/worn/`.

Referenční sprity jsou v této složce:
- zbraně: `ref_sword.png`, `ref_sword2.png`, `ref_staff_crystal.png`, `ref_bow.png`
- nasazené helmy: `ref_hat_slice12.png`, `ref_hat_slice1.png`, `ref_hat_slice2.png`, `ref_hat_slice9.png`
- současné problémové sprity: `ref_q_blade.png`, `ref_q_scepter.png`, `ref_q_crown.png`, `ref_eg_seedcrown.png`

---

## Pravidla pro ZBRANĚ (jednoruční i hole)

Hra sprite zrcadlí, otočí ho a „chytne“ v jednom pevném bodě. Proto musí každá zbraň dodržet tohle:

1. **Úhlopříčka 45°**: hlavice/jílec vlevo dole, hrot/hlavice hole vpravo nahoře. Přesně jako `ref_sword.png` a `ref_staff_crystal.png`.
2. **Bod úchopu** je na **24 % šířky zleva a 76 % výšky shora** (po ořezu). Na tomhle místě musí být **střed rukojeti**, ne záštita ani ostří. Pod ním smí být už jen hlavice (pommel), zhruba 10–15 % délky.
3. Plátno přibližně čtvercové (poměr stran 0,9–1,1). Cílová velikost cca **256×256**, hra si to zmenší.
4. Zbraň jako celek, bez ruky, bez stínu, bez efektů daleko od zbraně (malé jiskry u čepele jsou OK).
5. Luky a kuše: jako `ref_bow.png`, střed úchopu je **uprostřed** obrázku.

## Pravidla pro HELMY a KORUNY (nasazené)

1. Pohled **zepředu**, tak jak sedí na hlavě postavy. Hlava je kulatá, na šířku zhruba 1,1× výška.
2. **Kreslí se jen to, co je před hlavou a nad ní.** Žádný vnitřek, žádná zadní strana obroučky, žádný průhled skrz kruh. U koruny je vidět jen přední polovina obroučky a hroty nahoře. Spodní okraj je čistý, jako by koruna dosedla na čelo.
3. Spodní okraj (místo dosednutí) má být **rovný nebo jemně prohnutý** a tvoří **spodních ~10 % obrázku**. Hra ho posadí na hlavu.
4. Šířka korun a čepic je **1,1–1,3× šířka hlavy**. Proporce jako `ref_hat_slice12.png` (kápě), `ref_hat_slice1.png` (klobouk) nebo `ref_hat_slice2.png` (helma přes celou hlavu s průzorem).
5. Obličej nechej volný. Koruny jen na temeni a čele, uzavřená helma smí zakrýt hlavu jako `ref_hat_slice2.png` s průzorem pro oči.
6. Velikost cca **256 px na šířku**, ořez těsně na obsah.

---

## Seznam souborů

### Zbraně
**`q_blade_held.png`** – Mirunin trn
```
Sporium game sprite, hand-drawn cartoon, thick dark brown outlines, flat muted colors, cel shading. Elegant thorn-shaped dagger grown from dark violet wood with pale mycelium-wrapped hilt and a tiny bronze bell on the pommel, glowing violet sap on the edge. Oriented exactly 45 degrees: pommel and hilt at the bottom-left, blade tip at the top-right. Clear straight grip. Transparent background, tightly cropped, no hand, no shadow.
```

**`q_scepter_held.png`** – Žezlo poslední písně
```
Sporium game sprite, hand-drawn cartoon, thick dark brown outlines, flat muted colors. Long staff: pale bone-white mushroom stalk topped with a cracked bronze bell and small fungal ornaments, faint violet glow around the bell. Oriented exactly 45 degrees: butt end at the bottom-left, bell at the top-right. Grip area wrapped in mycelium about one quarter from the bottom. Transparent background, tightly cropped.
```

### Helmy a koruny
**`q_crown_worn.png`** – Koruna Šedé královny (nasazená)
```
Sporium game sprite, hand-drawn cartoon, thick dark brown outlines, flat muted colors. FRONT VIEW of a worn crown as it sits on a round cartoon head: only the front half of a circlet of pale fruiting-body mushrooms and grey gills, rising points on top, a tiny cracked bronze bell hanging at the front center, faint violet spores. NO back side of the ring, NO visible interior, no gap showing through the crown. Flat clean bottom edge where it rests on the forehead. Wider than tall (about 1.6:1). Transparent background, tightly cropped.
```

**`eg_seedcrown_worn.png`** – Koruna klíčení (nasazená)
```
Sporium game sprite, hand-drawn cartoon, thick dark brown outlines, flat muted colors. FRONT VIEW of a worn helmet as it sits on a round cartoon head: woven from sprouting roots with many tiny green sprouts on top and a glowing seed at the forehead. Covers the top of the head and the forehead only, leaves the face (eyes and nose) uncovered, no visible interior or back side. Smooth curved bottom edge resting on the brow. About 1.3:1 width to height. Transparent background, tightly cropped.
```

### Volitelně, až budou hlubinné základy (stejná pravidla)
| Soubor | Pravidlo | Popis |
|---|---|---|
| `eg_blade_held` | zbraň | mycelium-veined longsword |
| `eg_maul_held` | zbraň | bell-ringer's war hammer, head top-right |
| `eg_bow_held` | luk | bow carved from a throne root, grip in the center |
| `eg_staff_held` | zbraň | grey court scepter |
| `eg_crown_worn` | helma | spore crown helm |
| `eg_shield_held` | – | tower shield with small bells, front view, upright |
| `eg_censer_held` | – | spore censer lantern on a short chain, hanging down |

---

## Kontrola před odevzdáním
- U každé zbraně: vlož ji vedle `ref_sword.png`. Rukojeť musí být na stejném místě (vlevo dole) a ve stejném úhlu.
- U každé helmy: vlož ji nad kulatou hlavu (např. podle `ingame_good_example.png`). Spodní okraj sedí na čele, není vidět zadní strana ani vnitřek a obličej zůstává volný.
- Všechno PNG s alfou a ořezané na obsah.
