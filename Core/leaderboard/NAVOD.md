# Sporium – online žebříček (Cloudflare, zdarma)

Žebříček běží jako malý Cloudflare Worker s databází D1. Hráči nepotřebují účet, stačí jim přezdívka ve hře.

## Jednorázové nastavení (asi 5 minut)

1. Založ si zdarma účet na https://dash.cloudflare.com (platební karta není potřeba).
2. V terminálu ve složce `Core/leaderboard` spusť:

```
npx wrangler login
npx wrangler d1 create sporium
```

3. Příkaz vypíše `database_id = "…"`. Zkopíruj hodnotu do `wrangler.toml` místo `SEM_VLOZ_DATABASE_ID`.
4. Vytvoř tabulky a nasaď worker:

```
npx wrangler d1 execute sporium --remote --file schema.sql
npx wrangler deploy
```

5. Příkaz `deploy` vypíše adresu, například `https://sporium-lb.tvuj-ucet.workers.dev`. Vlož ji do `docs/game/lib/config.js`:

```js
export const LB_URL='https://sporium-lb.tvuj-ucet.workers.dev';
```

Po nahrání na GitHub Pages se žebříček ve hře zapne sám.

## Správa

- Smazat podvodníka:
  `npx wrangler d1 execute sporium --remote --command "DELETE FROM runs WHERE nick='Jmeno'"`
- Uvolnit obsazenou přezdívku:
  `npx wrangler d1 execute sporium --remote --command "DELETE FROM nicks WHERE nick_l='jmeno'"`
- **Smazat všechna data hráče na žádost (GDPR):** přezdívka, výsledky sezóny i denní hlubiny, hroby, předměty ve studně a záloha savu najednou:
  `node smazat.mjs "Přezdívka"` nebo podle kódu zálohy `node smazat.mjs --kod K7QXM-3PZ9A`.
  S `--nanecisto` jen vypíše SQL a nic nesmaže. Žádosti vyřiď do 30 dnů a hráči odpověz, že je hotovo.
- Nová sezóna: ve hře zvyš `SEASON.n` v `lib/data.js`. Žebříček se začne plnit znovu a staré sezóny zůstanou v databázi.

## Jak to funguje

- Každý prohlížeč má náhodný tajný klíč, uložený u hráče. Přezdívka patří prvnímu klíči, který ji použil, takže ji nikdo jiný nepřevezme.
- Výsledek (nejhlubší patro, úroveň, zabití, čas hraní) se odešle, když postava s přezdívkou dosáhne nové hloubky.
- Server odmítá nesmyslné výsledky: příliš hluboko na nízké úrovni, příliš rychle, málo zabití. Úplně podvodům zabránit nejde, protože hra běží v prohlížeči.
- Free plán Cloudflare má zhruba 100 000 požadavků denně, což pro žebříček bohatě stačí.

## Aktualizace v2: denní hlubina, hroby, studna

Jednorázově ve složce `Core/leaderboard` spusť nejdřív přidání tabulek:

```
npx wrangler d1 execute sporium --remote --file schema_v2.sql
```

Pak nahraj nový worker:

```
npx wrangler deploy
```

Worker importuje herní data z `docs/game/lib`, takže po změně předmětů ve hře stačí znovu `npx wrangler deploy`.

## Aktualizace v3: záloha savu

Jednorázově ve složce `Core/leaderboard` spusť:

```
npx wrangler d1 execute sporium --remote --file schema_v3.sql
npx wrangler deploy
```

Hráč pak v menu **Záloha** dostane kód (např. `K7QXM-3PZ9A`), kterým si postavy obnoví v jiném prohlížeči nebo po smazání historie. Záloha se po zapnutí sama obnovuje zhruba každých 10 minut hraní.

## Soukromí a úklid dat (v4)

- Ve hře je stránka **Soukromí** (menu Esc a úvodní obrazovka). Popisuje, co se ukládá, jak dlouho a kam psát o smazání. Když změníš, co server ukládá, uprav i ji (`lib/ui.js`, funkce `privacy`).
- Worker má Cron Trigger (`[triggers]` ve `wrangler.toml`), který jednou denně maže stará data podle `RETENTION` ve `worker.js`:
  limity (hash IP) po 3 dnech, zálohy neaktualizované 180 dní, hroby po 180 dnech, denní žebříčky po 90 dnech, předměty ve studně po 365 dnech.
  Výsledky sezóny a přezdívky zůstávají, dokud o smazání někdo nepožádá.
- IP adresa se nikdy neukládá. Pro omezení obnovy zálohy se z ní dělá solený hash, který se mění každý den. Sůl nastavíš jednorázově:
  `npx wrangler secret put IP_SALT` (zadej libovolný dlouhý náhodný text).
- Po změně stačí `npx wrangler deploy`. Cron se nastaví sám a ručně ho spustíš přes Cloudflare dashboard → Workers → sporium-lb → Triggers.
