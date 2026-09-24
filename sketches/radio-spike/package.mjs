// node sketches/radio-spike/package.mjs
// Packages the reviewed spike runtime into public/layers-radio/ for the
// standalone HTTPS trial at https://pointcast.xyz/layers-radio/.
//
// Hosting rules it applies (see functions/_middleware.ts):
//  - modules are published as .js (STATIC_ASSET_REGEX has no mjs) and all
//    imports/src are rewritten to root-relative /layers-radio/... so the page
//    resolves the same at /layers-radio and /layers-radio/ (the no-slash
//    middleware rewrite keeps the browser URL without a trailing slash).
//  - vendor ggwave.js + LICENSE + PIN.md and the capture worklet are copied byte-for-byte.
//  - /layers-radio/radio-deck.js is what /js/pc-layers.js imports when a page has ?radio=1.
// The source of truth stays in sketches/radio-spike/; re-run after any change.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(root, 'public', 'layers-radio');
const BASE = '/layers-radio/';

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'vendor', 'ggwave-0.4.0'), { recursive: true });

const rewrite = src => src
  .replace(/from '\.\/(radio-[a-z-]+)\.mjs'/g, `from '${BASE}$1.js'`)
  .replace(/src="vendor\//g, `src="${BASE}vendor/`);

const modules = ['radio-frame', 'radio-controller', 'radio-motifs', 'radio-callsign', 'radio-reblock', 'radio-codec', 'radio-audio', 'radio-panel', 'radio-deck'];
for (const m of modules) writeFileSync(join(out, `${m}.js`), rewrite(readFileSync(join(here, `${m}.mjs`), 'utf8')));
// The AudioWorklet module is plain JS already and is loaded by URL relative to radio-audio.js.
writeFileSync(join(out, 'radio-capture.worklet.js'), readFileSync(join(here, 'radio-capture.worklet.js')));
writeFileSync(join(out, 'index.html'), rewrite(readFileSync(join(here, 'index.html'), 'utf8')));
for (const f of ['ggwave.js', 'LICENSE', 'PIN.md']) writeFileSync(join(out, 'vendor', 'ggwave-0.4.0', f), readFileSync(join(here, 'vendor', 'ggwave-0.4.0', f)));

const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const manifest = {};
const walk = d => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walk(p); else manifest[p.slice(out.length)] = { bytes: statSync(p).size, sha256: sha(p) }; } };
walk(out);
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ base: BASE, source: 'sketches/radio-spike', generated: new Date().toISOString(), files: manifest }, null, 2) + '\n');

const html = readFileSync(join(out, 'index.html'), 'utf8');
const leftovers = [...html.matchAll(/(src|href)="(?!https?:|\/|#|mailto:)([^"]+)"/g)].map(m => m[2]).concat([...html.matchAll(/from '\.\//g)].map(() => 'relative import'));
if (leftovers.length) { console.error('relative references left in index.html:', leftovers); process.exit(1); }
for (const m of modules) { const src = readFileSync(join(out, `${m}.js`), 'utf8'); if (/from '\.\//.test(src) || /import\('\.\//.test(src) || /\.mjs'/.test(src)) { console.error(`relative or .mjs import left in ${m}.js`); process.exit(1); } }
console.log(`packaged ${Object.keys(manifest).length} files into public/layers-radio/`);
for (const [f, v] of Object.entries(manifest)) console.log(`${v.sha256.slice(0, 12)}  ${String(v.bytes).padStart(7)}  ${f}`);
