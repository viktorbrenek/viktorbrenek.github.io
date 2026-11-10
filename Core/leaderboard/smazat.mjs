// Smazání všech dat jednoho hráče na žádost (GDPR – právo na výmaz).
//   node smazat.mjs "Přezdívka"           → podle přezdívky
//   node smazat.mjs --kod K7QXM-3PZ9A     → podle kódu zálohy (když hráč přezdívku nemá)
//   přidej --nanecisto pro výpis SQL bez spuštění
// Smaže: zálohu savu, výsledky sezóny i denní hlubiny, hroby, předměty ve studně a rezervaci přezdívky.
import { execFileSync } from 'child_process';
const args = process.argv.slice(2), dry = args.includes('--nanecisto'), rest = args.filter(a => a !== '--nanecisto');
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
let who;
if (rest[0] === '--kod' && rest[1]) {
  const c = rest[1].toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length !== 10) { console.error('Kód má mít 10 znaků, např. K7QXM-3PZ9A.'); process.exit(1); }
  who = `SELECT keyhash FROM backups WHERE code=${q(c.slice(0, 5) + '-' + c.slice(5))}`;
} else if (rest[0]) {
  const nl = rest[0].trim().replace(/\s+/g, ' ').toLowerCase();
  who = `SELECT keyhash FROM nicks WHERE nick_l=${q(nl)} UNION SELECT keyhash FROM runs WHERE nick=${q(rest[0].trim())} UNION SELECT keyhash FROM daily WHERE nick=${q(rest[0].trim())}`;
} else { console.error('Použití: node smazat.mjs "Přezdívka"  nebo  node smazat.mjs --kod XXXXX-XXXXX  [--nanecisto]'); process.exit(1); }
// Pořadí: tabulka, ze které se hráč dohledává, se maže jako poslední (D1 nepodporuje dočasné tabulky).
const byCode = rest[0] === '--kod';
const order = byCode ? ['graves', 'well', 'daily', 'runs', 'nicks', 'backups'] : ['backups', 'graves', 'well', 'runs', 'daily', 'nicks'];
const sql = [`SELECT COUNT(*) AS nalezeno_klicu FROM (${who})`, ...order.map(t => `DELETE FROM ${t} WHERE keyhash IN (${who})`)].join('; ');
if (dry) { console.log(sql); process.exit(0); }
execFileSync('npx', ['wrangler', 'd1', 'execute', 'sporium', '--remote', '--command', sql], { stdio: 'inherit', shell: process.platform === 'win32' });
console.log('\nHotovo. Pokud je nalezeno_klicu 0, hráč s touto přezdívkou/kódem v databázi nebyl.');
