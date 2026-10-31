# Sporium – zdroje assetů

Hra samotná je statická v `docs/game/` (žádný build krok, ES moduly + WebGL2).

## Přegenerování atlasu
1. Zdrojové sheety leží v `raw/` (chars, env, items, ui).
2. `cd Core/game && python tools/pack.py` (vyžaduje `pip install pillow numpy scipy`).
   Skript vyřízne sprity, odstraní pozadí a zabalí `game/assets/atlas.png` + `atlas.json`.
3. Převeď na webp a zkopíruj do `docs/game/assets/` (atlas.webp, atlas.json).
   Jména spritů a jejich pozice v mřížce (řádek, sloupec) jsou v `pack.py`.

## Struktura hry (`docs/game/lib`)
- `gl.js` – WebGL2 renderer: sprite batch, světelná mapa, pochodeň per-pixel, spory, post FX
- `dungeon.js` – generátor pater, trezory, hádanky, světla
- `game.js` – tahy, boj, AI, loot, korupce, uložení
- `items.js` – generování předmětů, affixy, crafting
- `data.js` – monstra, předměty, affixy, dovednosti, unikáty, korupce (tady se ladí balanc)
- `render.js` – kreslení scény, částice, overlay texty
- `ui.js` – HUD, panely, tooltipy
