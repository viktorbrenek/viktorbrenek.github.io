# Sporium – zdroje assetů

Hra samotná je statická v `docs/game/` (žádný build krok, ES moduly + WebGL2).

## Přegenerování atlasu
1. Zdrojové sheety leží v `raw/` (chars, env, items, ui).
2. `cd Core/game && python tools/pack.py` (vyžaduje `pip install pillow numpy scipy`).
   Skript vyřízne sprity, odstraní pozadí a zabalí `game/assets/atlas.png` + `atlas.json`.
3. Převeď na webp a zkopíruj do `docs/game/assets/` (atlas.webp, atlas.json).
   Jména spritů a jejich pozice v mřížce (řádek, sloupec) jsou v `pack.py`.

## Paper-doll hráčských postav

Samostatné díly hrdinů, zvířecích podob a výbavy jsou v `raw6/rig_art/`. Nasazené
verze výbavy z endgamu jsou v `raw6/endgame/worn/`. Po jejich úpravě spusť
`python Core/game/tools/pack_rig_art.py` z kořene repozitáře. Skript vytvoří
`docs/game/assets/rig-art.webp` a `rig-art.json`, které hra načítá se základním atlasem.
Při balení zarovná nohy podle kyčle a kotníku a sestaví varianty paží s nasazenými rukavicemi.

## Struktura hry (`docs/game/lib`)
- `gl.js` – WebGL2 renderer: sprite batch, světelná mapa, pochodeň per-pixel, spory, post FX
- `dungeon.js` – generátor pater, trezory, hádanky, světla
- `game.js` – tahy, boj, AI, loot, korupce, uložení
- `items.js` – generování předmětů, affixy, crafting
- `data.js` – monstra, předměty, affixy, dovednosti, unikáty, korupce (tady se ladí balanc)
- `render.js` – kreslení scény, částice, overlay texty
- `ui.js` – HUD, panely, tooltipy
