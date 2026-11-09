#!/usr/bin/env node
// Build this site's atlas.json (and, when the site config asks for it, the merged index) from the
// layer adapters in scripts/atlas/layers/*.mjs.
//
//   node scripts/atlas/build.mjs            write the atlas (and index) from committed data
//   node scripts/atlas/build.mjs --check    exit 1 if the committed files are stale or invalid
//   node scripts/atlas/build.mjs --fetch    also refresh sister-site snapshots from their live atlas.json
//   node scripts/atlas/build.mjs --quiet    print only problems
//
// Identical in mhoydich/pointcast and mhoydich/hello-token-reserve; only site.mjs and layers/ differ.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assembleAtlas, atlasProblems, mergeAtlases, sameAtlas } from './lib.mjs';
import * as helpers from './lib.mjs';
import { site } from './site.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const args = new Set(process.argv.slice(2));
const quiet = args.has('--quiet');
const say = (...m) => { if (!quiet) console.log(...m); };
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p, data) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`); };

export async function loadLayers() {
  const dir = resolve(here, 'layers');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  const out = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(resolve(dir, f)).href);
    if (!mod.layer || typeof mod.records !== 'function') throw new Error(`${f} must export \`layer\` and \`records()\``);
    out.push({ file: f, layer: mod.layer, records: mod.records });
  }
  return out;
}

export async function buildSiteAtlas({ generated = new Date().toISOString() } = {}) {
  const layers = await loadLayers();
  const ctx = { site, root, readJson, helpers, resolve: (p) => resolve(root, p) };
  const all = [];
  const meta = [];
  const problems = [];
  for (const { file, layer, records } of layers) {
    let rows;
    try { rows = await records(ctx); } catch (error) { problems.push(`${file}: adapter threw: ${error.message}`); continue; }
    if (!Array.isArray(rows)) { problems.push(`${file}: records() must return an array`); continue; }
    for (const r of rows) if (r.layer == null) r.layer = layer.id;
    const wrong = rows.filter((r) => r.layer !== layer.id);
    if (wrong.length) problems.push(`${file}: ${wrong.length} record(s) carry a layer other than ${layer.id}`);
    meta.push({ ...layer, count: layer.count ?? rows.length });
    all.push(...rows);
    say(`  ${layer.id.padEnd(22)} ${String(rows.length).padStart(5)} records${layer.inline === false ? ` (reference layer, ${layer.count ?? '?'} rows upstream)` : ''}`);
  }
  const atlas = assembleAtlas(site, meta, all, generated);
  problems.push(...atlasProblems(atlas));
  // PointCast adapters may hold a Vite loader open for TypeScript data; close it so the process can exit.
  if (existsSync(resolve(here, '_ts.mjs'))) { const ts = await import(pathToFileURL(resolve(here, '_ts.mjs')).href); if (typeof ts.closeTs === 'function') await ts.closeTs(); }
  return { atlas, problems };
}

async function loadSnapshots({ fetchLive }) {
  const list = [];
  for (const sister of site.index?.sisters || []) {
    const snapPath = resolve(root, sister.snapshot);
    let atlas = null; let snapshot = null; let ok = true; let note;
    if (fetchLive) {
      try {
        const res = await fetch(sister.atlas, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const live = await res.json();
        const p = atlasProblems(live);
        if (p.length) throw new Error(`live atlas invalid: ${p[0]}`);
        writeJson(snapPath, live);
        say(`  fetched ${sister.atlas} (${live.records.length} records) -> ${sister.snapshot}`);
      } catch (error) { note = `fetch failed: ${error.message}; using committed snapshot`; say(`  ${note}`); }
    }
    if (existsSync(snapPath)) {
      atlas = readJson(snapPath);
      snapshot = (atlas.generated || '').slice(0, 10) || null;
      const p = atlasProblems(atlas);
      if (p.length) { ok = false; note = `${note ? `${note}; ` : ''}snapshot has ${p.length} schema problem(s): ${p[0]}`; }
      else if (!fetchLive) note = `${note ? `${note}; ` : ''}committed snapshot (${sister.snapshot}), not fetched from the live URL in this build; refresh with --fetch`;
    } else { ok = false; note = `${note ? `${note}; ` : ''}no snapshot at ${sister.snapshot}`; }
    list.push({ atlas, url: sister.atlas, snapshot, ok, note });
  }
  return list;
}

export async function buildIndex(ownAtlas, { generated = ownAtlas.generated, fetchLive = false } = {}) {
  const sisters = await loadSnapshots({ fetchLive });
  const index = mergeAtlases({ ...site, ...site.index }, [{ atlas: ownAtlas, url: `https://${site.host}${site.atlasPath}`, snapshot: null, ok: true }, ...sisters], generated);
  const problems = atlasProblems(index, { requireSameSiteLinks: true }).filter((p) => !/unresolved in the merged index/.test(p) || !/-> (in|ues):/.test(p));
  return { index, problems };
}

async function main() {
  const check = args.has('--check');
  const fetchLive = args.has('--fetch');
  say(`Atlas build for ${site.host}`);
  const { atlas, problems } = await buildSiteAtlas();
  const outPath = resolve(root, site.output);
  let failed = false;
  if (problems.length) {
    failed = true;
    console.error(`\n${problems.length} problem(s) in ${site.host} atlas:`);
    for (const p of problems.slice(0, 60)) console.error(`  - ${p}`);
    if (problems.length > 60) console.error(`  … and ${problems.length - 60} more`);
  }
  if (check) {
    if (!existsSync(outPath)) { console.error(`  - ${site.output} does not exist; run node scripts/atlas/build.mjs`); failed = true; }
    else if (!sameAtlas(readJson(outPath), atlas)) { console.error(`  - ${site.output} is stale; run node scripts/atlas/build.mjs`); failed = true; }
  } else if (!problems.length) {
    writeJson(outPath, atlas);
    say(`\nwrote ${site.output}: ${atlas.counts.total} records, ${atlas.counts.located} located, ${atlas.layers.length} layers`);
  }
  if (site.index) {
    const { index, problems: ip } = await buildIndex(atlas, { fetchLive });
    const idxPath = resolve(root, site.index.output);
    if (ip.length) { failed = true; console.error(`\n${ip.length} problem(s) in the merged index:`); for (const p of ip.slice(0, 40)) console.error(`  - ${p}`); }
    if (check) {
      if (!existsSync(idxPath)) { console.error(`  - ${site.index.output} does not exist`); failed = true; }
      else if (!sameAtlas(readJson(idxPath), index)) { console.error(`  - ${site.index.output} is stale; run node scripts/atlas/build.mjs`); failed = true; }
    } else if (!ip.length) {
      writeJson(idxPath, index);
      say(`wrote ${site.index.output}: ${index.counts.total} records from ${index.sites.filter((s) => s.ok).length}/${index.sites.length} sites, ${index.crossLinks.length} cross-site links`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exit(1); });
