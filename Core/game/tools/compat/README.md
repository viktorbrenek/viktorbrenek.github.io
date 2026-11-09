# Kontrola savů (compat)

Hru už hrají lidé, takže každá verze musí načíst savy z předchozí verze.

```bash
# 1) servíruj starou a novou verzi docs/game (např. přes git worktree)
git worktree add ../_old HEAD
(cd ../_old/docs/game && python3 -m http.server 8101) &
(cd docs/game && python3 -m http.server 8102) &

# 2) fixtura ze staré verze: 6 tříd, level 41, pasivy, unikáty, sady, runy, odehrané tahy
NODE_PATH=$(npm root -g) node Core/game/tools/compat/compat.mjs make   http://localhost:8101/ fixture.json
# 3) načti ji v nové verzi, zkontroluj ID a odehraj 150 tahů za každou postavu
NODE_PATH=$(npm root -g) node Core/game/tools/compat/compat.mjs verify http://localhost:8102/ fixture.json
# kouřový test bez fixtury
NODE_PATH=$(npm root -g) node Core/game/tools/compat/compat.mjs smoke  http://localhost:8102/
```

Uložené fixtury `fixture_v15.json` a `fixture_v16.json` (stav před v16 a v17) jdou použít pro `verify` i bez kroku 2. Po každém nasazení přidej fixturu z nové verze.
Potřebuje Node a Playwright (`npm i -g playwright && npx playwright install chromium`).
