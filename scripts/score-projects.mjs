#!/usr/bin/env node
/**
 * score-projects.mjs — first-pass PointCast project scoreboard.
 * Signals per project (all measured, none invented):
 *  use        live public counter where the room keeps one (log-scaled)
 *  craft      source size (LOC, log-scaled) + tests naming it — git cadence is NOT used:
 *             history was flattened 2026-07-30 so every file shows one commit
 *  reach      inbound internal links + wire blocks pointing at it + on the home page
 * Run scripts/score-live.mjs first to refresh .score-live.json.
 * Usage: node scripts/score-projects.mjs [out.json]  → out.json + out.md
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const sh = (cmd) => { try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

// ---- project registry: apps registry ∪ rooms ∪ hand list of evergreen rooms
const projects = new Map(); // path -> {name, kind}
const add = (path, name, kind) => { if (!projects.has(path)) projects.set(path, { path, name, kind }); };

const appsSrc = readFileSync('src/lib/pointcast-apps.ts', 'utf8');
for (const m of appsSrc.matchAll(/slug: '([^']+)'[\s\S]*?title: '([^']+)'[\s\S]*?path: '([^']+)'/g)) add(m[3], m[2], 'app');
const roomsSrc = readFileSync('src/pages/rooms.astro', 'utf8');
for (const m of roomsSrc.matchAll(/href: '([^']+)'[\s\S]*?name: '([^']+)'/g)) add(m[1], m[2], 'room');
const hand = [
  ['/coffee','Coffee Mugs'],['/window','The Window'],['/race','Daily Race'],['/residents','Residents'],['/mythos','Mythos'],['/wire','The Wire'],['/briefs','Briefs'],
  ['/prayer-altars','Prayer Altars'],['/prayer-bells','Prayer Bells'],['/prayer-candles','Prayer Candles'],['/prayer-labyrinth','Prayer Labyrinth'],['/prayer-altars-evening','Prayer Altars Evening'],
  ['/bell-choir','Bell Choir'],['/bell-post','Bell Post'],['/win95-games','Win95 Arcade'],['/drum-hero','Drum Hero'],['/drum-says','Drum Says'],['/drum-house','Drum House'],['/drum-v8','Drum Room v8'],
  ['/almanac','Almanac'],['/el-segundo','El Segundo'],['/yard','The Yard'],['/bench','The Bench'],['/tug','Tug'],['/thursday','Thursday'],['/marine-layer','Marine Layer'],['/potters-field','Potters Field'],
  ['/spells','Spells'],['/grey-hour','Grey Hour'],['/bell-and-signal','Bell & Signal'],['/reviews/tone-bloom','Tone Bloom review'],['/showcast/bells-bloom','Bells / Bloom'],['/beach-commons','Beach Commons'],
  ['/digital-pets','Digital Pets'],['/network-el-segundo','Network El Segundo'],['/local-star-commons','Local Star Commons'],['/sunset-switchboard','Sunset Switchboard'],['/gallery/today','Today’s Art'],
  ['/25','PointCast 25 / CFB'],['/noun-battler','Nouns Nation Battler'],['/mascot-battler','Mascot Battler'],['/haptic-dreams','Haptic Dreams'],['/second-shift','Second Shift'],['/worklife','Work/Life'],['/wednesday','Wednesday 9:34'],
  ['/cake','Cake'],['/graffiti','Graffiti'],['/letters','Letters'],['/bulletin','Bulletin'],['/meadow','Meadow'],['/bath','The Bath'],['/anytime','Anytime'],['/taproom','Taproom'],['/zen-cats','Zen Cats'],['/field','PointCast Field'],
];
for (const [p, n] of hand) add(p, n, 'room');

// ---- live counters (fetched once, best effort)
let live = {};
try { live = JSON.parse(readFileSync('.score-live.json', 'utf8')); } catch { console.error('no .score-live.json — run scripts/score-live.mjs first; scoring without USE'); }

// ---- helpers
const blocks = readdirSync('src/content/blocks').filter(f => f.endsWith('.json')).map(f => { try { return JSON.parse(readFileSync(join('src/content/blocks', f), 'utf8')); } catch { return null; } }).filter(Boolean);
const homeSrc = readFileSync('src/pages/index.astro', 'utf8') + readdirSync('src/components').filter(f => f.startsWith('Home')).map(f => readFileSync(join('src/components', f), 'utf8')).join('\n');
const pageFiles = sh('git ls-files src/pages src/components src/lib functions tests').split('\n').filter(Boolean);
const allFiles = sh('git ls-files src public functions').split('\n').filter(Boolean);
const fileText = new Map();
const text = (f) => { if (!fileText.has(f)) { try { fileText.set(f, readFileSync(f, 'utf8')); } catch { fileText.set(f, ''); } } return fileText.get(f); };

const slugOf = (p) => p.replace(/^\//, '').replace(/\//g, '-');
const filesFor = (p) => {
  const slug = p.replace(/^\//, '');
  const first = slug.split('/')[0];
  const cands = new Set();
  const globs = [`src/pages/${slug}.astro`, `src/pages/${slug}/`, `src/pages/${slug}.json.ts`, `functions/api/${first}.ts`, `functions/api/${first}/`, `src/lib/${first}.ts`, `src/lib/pointcast-${first}.ts`];
  for (const g of globs) if (existsSync(g)) cands.add(g);
  const camel = first.split('-').map(s => s[0]?.toUpperCase() + s.slice(1)).join('');
  const FAMILIES = { '/drum-house': /^src\/pages\/drum-.*\.astro$/, '/prayer-altars': /^src\/pages\/prayer-.*\.astro$/, '/25': /^src\/pages\/25\//, '/win95-games': /^public\/games\// };
  if (FAMILIES[p]) for (const f of allFiles) if (FAMILIES[p].test(f)) cands.add(f);
  for (const f of pageFiles) if (f.startsWith('src/components/') && f.includes(camel)) cands.add(f);
  return [...cands];
};

const now = Date.now();
const rows = [];
for (const proj of projects.values()) {
  const files = filesFor(proj.path);
  if (!files.length) continue;
  const log = sh(`git log --format=%an%x09%ad --date=short -- ${files.map(f => `'${f}'`).join(' ')}`).trim().split('\n').filter(Boolean);
  const commits = log.length;
  const expand = (f) => { try { return statSync(f).isDirectory() ? sh(`git ls-files '${f}'`).split('\n').filter(Boolean) : [f]; } catch { return []; } };
  const srcFiles = files.flatMap(expand).filter(f => /\.(astro|ts|tsx|mjs|js|css|html)$/.test(f));
  const loc = srcFiles.reduce((n, f) => n + (text(f).split('\n').length), 0);
  const authors = new Set(log.map(l => l.split('\t')[0])).size;
  const dates = log.map(l => l.split('\t')[1]).sort();
  const first = dates[0] ?? '', last = dates[dates.length - 1] ?? '';
  const ageDays = last ? Math.round((now - Date.parse(last)) / 864e5) : 999;
  const lifeDays = first && last ? Math.max(1, Math.round((Date.parse(last) - Date.parse(first)) / 864e5)) : 0;
  const slug = proj.path.replace(/^\//, '').split('/')[0];
  const tests = readdirSync('tests').filter(f => f.includes(slug)).length;
  const hrefRe = new RegExp(`href=["'\`]${proj.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'\`/?#])`);
  let inbound = 0;
  for (const f of pageFiles) { if (files.some(o => f.startsWith(o))) continue; if (hrefRe.test(text(f))) inbound++; }
  const blockRefs = blocks.filter(b => JSON.stringify(b).includes(`pointcast.xyz${proj.path}`) || JSON.stringify(b).includes(`"${proj.path}`)).length;
  const onHome = hrefRe.test(homeSrc);
  const use = live[proj.path] ?? null;

  const craft = Math.min(1, Math.log10(1 + loc) / 4.3) * 0.7 + Math.min(1, tests / 3) * 0.3;              // 20k LOC ≈ 1 (git history was flattened 2026-07-30, so commits are not a signal)
  const reach = Math.min(1, Math.log10(1 + inbound) / 1.6) * 0.5 + Math.min(1, blockRefs / 6) * 0.3 + (onHome ? 0.2 : 0);
  const fresh = Math.max(0, 1 - ageDays / 180);
  const useScore = use == null ? null : Math.min(1, Math.log10(1 + use) / 4.5);                            // ~30k ≈ 1
  const total = Math.round(100 * (useScore == null
    ? (craft * 0.5 + reach * 0.5)
    : (useScore * 0.45 + craft * 0.275 + reach * 0.275)));
  rows.push({ ...proj, files: srcFiles.length, loc, commits, authors, first, last, ageDays, lifeDays, tests, inbound, blockRefs, onHome, use, craft: +craft.toFixed(2), reach: +reach.toFixed(2), fresh: +fresh.toFixed(2), useScore: useScore == null ? null : +useScore.toFixed(2), total });
}
rows.sort((a, b) => b.total - a.total);
const out = process.argv[2] || '.score-projects.json';
writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
const md = ['| # | project | path | score | use | LOC | files | tests | inbound | blocks | home |', '|--|--|--|--|--|--|--|--|--|--|--|'];
rows.forEach((r, i) => md.push(`| ${i + 1} | ${r.name} | ${r.path} | **${r.total}** | ${r.use ?? '—'} | ${r.loc} | ${r.files} | ${r.tests} | ${r.inbound} | ${r.blockRefs} | ${r.onHome ? '●' : ''} |`));
writeFileSync(out.replace(/\.json$/, '.md'), md.join('\n'));
console.log(`${rows.length} projects scored → ${out}`);
