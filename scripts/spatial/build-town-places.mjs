#!/usr/bin/env node
// Build public/vr/places.json (spatial.places/v1) from PointCast's town source. No dependencies.
//
//   node scripts/spatial/build-town-places.mjs [path/to/town.json.ts] [--out places.json] [--check]
//
// Reads the TOWN array (12 buildings: gx, gy, name, href, glyph, category, note) and the offGrid
// entries (name, href, note) as written. The source file is only read, never changed.
// Portals already in the output file are kept as they are (they are set by hand).
// --check: exit 1 if the output file differs from what this script would write.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const check = args.includes('--check');
const outIdx = args.indexOf('--out');
const out = resolve(outIdx >= 0 ? args[outIdx + 1] : resolve(here, '..', '..', 'public', 'vr', 'places.json'));
const src = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') || resolve(here, '..', '..', 'src', 'pages', 'town.json.ts'));

const text = readFileSync(src, 'utf8');
const str = (body, key) => {
  const m = body.match(new RegExp(`${key}\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return m ? m[1].replace(/\\'/g, "'") : null;
};
const num = (body, key) => { const m = body.match(new RegExp(`${key}\\s*:\\s*(\\d+)`)); return m ? Number(m[1]) : null; };

// TOWN = [ { gx: 0, gy: 0, name: '…', href: '…', glyph: '…', category: '…', note: '…' }, … ];
const townBlock = text.match(/const TOWN\s*=\s*\[([\s\S]*?)\];/);
if (!townBlock) { console.error('build-places: TOWN array not found in', src); process.exit(2); }
const buildings = [...townBlock[1].matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).map((b) => ({
  gx: num(b, 'gx'), gy: num(b, 'gy'), name: str(b, 'name'), href: str(b, 'href'),
  glyph: str(b, 'glyph'), category: str(b, 'category'), note: str(b, 'note'),
}));
const offBlock = text.match(/offGrid\s*:\s*\[([\s\S]*?)\]\s*,/);
const offGrid = offBlock ? [...offBlock[1].matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).map((b) => ({
  name: str(b, 'name'), href: str(b, 'href'), note: str(b, 'note'),
})) : [];

for (const b of buildings) for (const k of ['gx', 'gy', 'name', 'href', 'glyph', 'category', 'note']) {
  if (b[k] === null) { console.error(`build-places: building missing ${k}:`, JSON.stringify(b)); process.exit(2); }
}
if (buildings.length !== 12) { console.error(`build-places: expected 12 buildings, found ${buildings.length}`); process.exit(2); }

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const places = buildings.map((b) => ({
  id: slug(b.name), title: b.name, blurb: b.note, url: b.href, kind: b.category, glyph: b.glyph,
  cell: { col: b.gx, row: b.gy }, spatial: false,
}));
// Off-grid entries: two small markers east of the grid (positions are this hub's choice).
const offPos = [{ x: 14.2, z: -1.8 }, { x: 14.2, z: 1.8 }, { x: 14.2, z: 5.4 }, { x: 14.2, z: -5.4 }];
offGrid.forEach((o, i) => {
  places.push({ id: slug(o.name), title: o.name, blurb: o.note, url: o.href, kind: 'marker', offGrid: true,
    position: offPos[i] || { x: 14.2, z: -1.8 + i * 3.6 }, spatial: false });
});

// The one 3D neighbour that exists: the Baby Bonfire room. (The El Segundo ring is not a page yet, so it is not listed.)
const defaultPortals = [
  { id: 'hearth-room', title: 'Hearth room', url: '/baby-bonfire/room/', spatial: true,
    blurb: 'Another 3D page on this site. In a headset you stay in VR where the browser allows it.', position: { x: -14, z: 0 } },
];
let existing = null;
if (existsSync(out)) { try { existing = JSON.parse(readFileSync(out, 'utf8')); } catch (e) { existing = null; } }

const manifest = {
  $schema: 'spatial.places/v1',
  id: 'pointcast-town',
  title: 'PointCast Town',
  summary: 'Twelve buildings, each a real PointCast page, plus two off-grid markers.',
  layout: { type: 'grid', cols: 4, rows: 3, spacing: { x: 7, z: 6.5 } },
  start: { x: 0, z: 17, yaw: 0 },
  places,
  portals: existing && Array.isArray(existing.portals) ? existing.portals : defaultPortals,
  source: [{ url: 'https://pointcast.xyz/town.json', label: 'Buildings and off-grid entries, from src/pages/town.json.ts', checked: '2026-11-11' }],
  credits: 'Places from PointCast /town.json. Built with the spatial kit and three.js (MIT).',
};
const json = JSON.stringify(manifest, null, 2) + '\n';

if (check) {
  const cur = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (cur !== json) { console.error(`build-places: ${out} is out of step with ${src}`); process.exit(1); }
  console.log(`build-places: ${out} is up to date (${places.length} places)`);
} else {
  writeFileSync(out, json);
  console.log(`build-places: wrote ${out} (${buildings.length} buildings, ${offGrid.length} off-grid)`);
}
