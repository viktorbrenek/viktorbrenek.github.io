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
