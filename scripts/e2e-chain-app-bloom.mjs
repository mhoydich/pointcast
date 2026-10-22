#!/usr/bin/env node
// End-to-end run of Checkpoint Blooms (/chain/bloom) on real devnets.
//
//   node scripts/e2e-chain-app-bloom.mjs [--local http://127.0.0.1:8799] [--target 52] [--out DIR] [--skip-live] [--skip-local]
//
// Two halves, and a hard line between them:
//
//   LIVE   the public devnet (the pinned devnet-2). GET requests only: /status,
//          /block/N, /raw/block/N, /checkpoints, /checkpoints/N/witnesses. Nothing
//          is ever sent to it, and this script has no code path that could.
//   LOCAL  a throwaway devnet-2 on this machine (localhost or 127.0.0.1 only; any
//          other host is refused before a request is made). This is the only place
//          it writes: keyless bot posts to push the chain past a few checkpoints,
//          and pc-witness.mjs with throwaway keys (made in a temp directory)
//          to put real witness attestations on a checkpoint.
//
// Both halves run the real browser code (public/chain/apps/bloom-view.js) in jsdom
// against the real markup (the .astro sources, with their expressions stripped),
// with Node's own fetch: what the page would draw, read from the chain.
//
// Exit 0: every step held. Exit 1: a step failed. Exit 2: refused (a write
// aimed at something that is not a local address). The last line is a JSON summary.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEVNET } from '../src/data/chain-home.ts';
import { recipeParts } from '../src/data/chain-app-bloom.ts';
import * as B from '../public/chain/apps/bloom.js';

const ROOT = new URL('../', import.meta.url);
const rel = (p) => new URL(p, ROOT);
const readSrc = (p) => readFileSync(rel(p), 'utf8');

const argv = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : dflt;
};
const flag = (name) => argv.includes(`--${name}`);
const LOCAL = opt('local', 'http://127.0.0.1:8799').replace(/\/+$/, '');
const LIVE = DEVNET.url;
const TARGET = Number(opt('target', '52'));
const OUT = opt('out', '');
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

const summary = { live: {}, local: {}, steps: [] };
let failed = 0;

const say = (line) => console.log(line);
async function step(name, fn) {
  try {
    const detail = await fn();
    summary.steps.push({ name, ok: true });
    say(`ok    ${name}${detail ? `  ·  ${detail}` : ''}`);
    return true;
  } catch (e) {
    failed += 1;
    summary.steps.push({ name, ok: false, error: String(e && e.message ? e.message : e) });
    say(`FAIL  ${name}  ·  ${e && e.message ? e.message : e}`);
    return false;
  }
}
const eq = (a, b, what) => {
  if (a !== b) throw new Error(`${what}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
};
const ok = (v, what) => {
  if (!v) throw new Error(what);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- the only way this script talks

/** GET JSON. Used for both halves. */
async function get(base, path) {
  const res = await fetch(`${base}${path}`, { method: 'GET', headers: { accept: 'application/json' } });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, body };
}

/** The one door for writes: it refuses anything that is not a local address, before any request exists. */
function localOrigin(url) {
  const u = new URL(url);
  if (!['http:', 'https:'].includes(u.protocol) || !LOCAL_HOSTS.has(u.hostname) || u.username || u.password) {
    console.error(`REFUSED: ${url} is not localhost or 127.0.0.1. This script writes only to a local devnet.`);
    process.exit(2);
  }
  return u.origin;
}
async function postLocal(path, json) {
  const origin = localOrigin(LOCAL);
  const res = await fetch(`${origin}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(json) });
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body };
}

// ---------------------------------------------------------------- the real page, in jsdom

/** The page's and the dialog's .astro source with frontmatter, scripts, styles, components and {expressions} stripped. */
function skeleton() {
  const strip = (s) => {
    if (s.startsWith('---')) s = s.slice(s.indexOf('---', 3) + 3);
    s = s.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (s[i] !== '{') { out += s[i]; continue; }
      let depth = 0;
      let quote = '';
      let j = i;
      for (; j < s.length; j++) {
        const c = s[j];
        if (quote) { if (c === quote && s[j - 1] !== '\\') quote = ''; continue; }
        if (c === '"' || c === "'" || c === '`') quote = c;
        else if (c === '{') depth += 1;
        else if (c === '}') { depth -= 1; if (depth === 0) break; }
      }
      out += out.endsWith('=') ? '""' : '';
      i = j;
    }
    return out;
  };
  const dialog = strip(readSrc('src/components/chain/BloomDialog.astro'));
  const page = strip(readSrc('src/pages/chain/bloom.astro')).replace(/<BloomDialog\s*\/>/, dialog).replace(/<(?:ChainHeader|ResetNotice)[^>]*\/>/g, '');
  const start = page.indexOf('<div\n      class="chn bl"');
  const end = page.lastIndexOf('</BlockLayout>');
  return `<!doctype html><html><body>${page.slice(start, end).replace(/<\/div>\s*<\/div>\s*$/, '</div>')}</div></body></html>`;
}

const viewUrl = pathToFileURL(new URL('public/chain/apps/bloom-view.js', ROOT).pathname).href;
const openWindows = [];

async function page({ pageUrl, api = LIVE, genesis = DEVNET.genesis }) {
  const dom = new JSDOM(skeleton(), { url: pageUrl, pretendToBeVisual: true });
  const w = dom.window;
  openWindows.push(w);
  const app = w.document.querySelector('[data-bloom="app"]');
  app.dataset.api = api;
  app.dataset.genesis = genesis;
  app.dataset.chain = DEVNET.chainId;
  app.querySelector('[data-bl="recipe-code"]').textContent = recipeParts().text;
  // jsdom has no layout: say the grid's sentinel is far below the screen, as it is in a browser.
  app.querySelector('[data-bl="sentinel"]').getBoundingClientRect = () => ({ top: 99999 });
  const blobs = new Map();
  let n = 0;
  const requests = [];
  const view = await import(`${viewUrl}?e2e=${Math.random()}`);
  view.start(app, {
    fetch: (url, init) => { requests.push(String(url)); return fetch(url, init); },
    createObjectURL: (blob) => { const u = `blob:e2e/${++n}`; blobs.set(u, blob); return u; },
    idle: (fn) => Promise.resolve().then(fn),
  });
  if (w.document.readyState !== 'complete') await new Promise((r) => w.addEventListener('load', r, { once: true }));
  const q = (name) => app.querySelector(`[data-bl="${name}"]`);
  const text = (name) => q(name).textContent;
  const blobText = (u) => new Promise((res, rej) => { const fr = new w.FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsText(blobs.get(u)); });
  const until = async (pred, label, ms = 30000) => {
    const t = Date.now();
    while (!pred()) {
      if (Date.now() - t > ms) throw new Error(`timed out waiting for ${label}`);
      await sleep(20);
    }
  };
  return { w, app, q, text, blobText, until, requests, close: () => w.close() };
}

const ringCount = (svg) => (svg.match(/<circle cx="500" cy="500" r="\d+" fill="none" stroke="#f2d48a"/g) ?? []).length;

/** What the page should show for the chain at `base`, checked against direct reads. */
async function checkPage({ label, base, pageUrl, genesis, expectHeroHeight }) {
  const p = await page({ pageUrl, api: base, genesis });
  try {
    await p.until(() => p.app.dataset.hero === 'live', `${label}: the hero`);
    eq(p.app.dataset.state, 'live', `${label}: state`);
    eq(p.text('hero-height'), `№${expectHeroHeight.toLocaleString('en-US')}`, `${label}: hero height`);
    const direct = (await get(base, `/block/${expectHeroHeight}`)).body;
    eq(p.text('hero-hash'), direct.hash, `${label}: hero hash is the devnet's hash`);
    const heroSvg = await p.blobText(p.q('hero-img').src);
    ok(heroSvg.startsWith(B.bloom(direct.hash).slice(0, 300)), `${label}: the hero is the bloom of that hash`);
    eq(B.auditSvg(heroSvg).length, 0, `${label}: hero SVG audit`);
    const want = Math.min(24, B.checkpointHeights(expectHeroHeight).length);
    await p.until(() => p.app.querySelectorAll('.bl-tile').length >= want || /could not be read|unreachable/.test(p.text('grid-status')), `${label}: the first ${want} tiles`);
    const tiles = [...p.app.querySelectorAll('.bl-tile')];
    return { p, tiles, direct };
  } catch (e) {
    p.close();
    throw e;
  }
}

// ================================================================ LIVE (GET only)

async function runLive() {
  say(`\n== LIVE ${LIVE}  (GET only)`);
  let status;
  await step('live: /status is the pinned devnet-2', async () => {
    const r = await get(LIVE, '/status');
    eq(r.status, 200, 'status code');
    status = B.readStatus(r.body);
    eq(status.chainId, 'pointcast-devnet-2', 'chain id');
    eq(status.genesis, DEVNET.genesis, 'genesis pin');
    summary.live = { height: status.height, latestCheckpoint: B.latestCheckpoint(status.height) };
    return `height ${status.height}, latest checkpoint ${summary.live.latestCheckpoint}`;
  });
  if (!status) return;
  const latest = B.latestCheckpoint(status.height);

  const SAMPLE = 16;
  const blooms = [];
  await step(`live: the last ${SAMPLE} checkpoints: block hash, parent link, bloom, audit`, async () => {
    const hs = B.checkpointHeights(latest, SAMPLE);
    let linked = 0;
    let noNext = 0;
    for (const h of hs) {
      const blk = B.readBlock((await get(LIVE, `/block/${h}`)).body, h);
      const raw = await get(LIVE, `/raw/block/${h + 1}`);
      if (raw.status === 200) {
        ok(B.linkHolds(blk, B.readRawHeader(raw.body, h + 1)), `block ${h + 1} names a different parent than block ${h}'s hash`);
        linked += 1;
      } else noNext += 1;
      const svg = B.bloomSvg(blk.hash);
      eq(B.bloomSvg(blk.hash), svg, `bloom ${h} is deterministic`);
      eq(B.auditSvg(svg).length, 0, `audit ${h}`);
      eq(B.auditSvg(B.bloomOgSvg(blk.hash, { witnesses: 3 })).length, 0, `OG audit ${h}`);
      blooms.push({ h, hash: blk.hash, svg, time: blk.timestamp });
    }
    const prints = new Set(blooms.map((b) => B.geometryFingerprint(b.svg)));
    eq(prints.size, blooms.length, 'geometry fingerprints are all different');
    summary.live.checkpointsRead = blooms.length;
    summary.live.parentLinksHeld = linked;
    summary.live.distinctFingerprints = prints.size;
    return `${blooms.length} blooms, ${linked} parent links held (${noNext} had no next block yet), ${prints.size} distinct geometries`;
  });

  let witnessed = [];
  await step('live: which checkpoints keys signed (/checkpoints), and their witness lists', async () => {
    const hs = B.checkpointHeights(latest, B.GRID_COUNT);
    const map = new Map();
    for (const w of B.rangeWindows(hs)) {
      const r = await get(LIVE, `/checkpoints?from=${w.from}&to=${w.to}`);
      eq(r.status, 200, `/checkpoints?from=${w.from}&to=${w.to}`);
      for (const [h, c] of B.readCheckpointRange(r.body)) map.set(h, c);
    }
    witnessed = [...map.entries()].filter(([, c]) => c.distinct > 0).sort((a, b) => b[0] - a[0]);
    for (const [h, c] of witnessed) {
      const w = B.readWitnesses((await get(LIVE, `/checkpoints/${h}/witnesses`)).body, h);
      eq(w.distinct, c.distinct, `distinct keys at ${h}: list vs range`);
      const blk = B.readBlock((await get(LIVE, `/block/${h}`)).body, h);
      eq(w.blockHash, blk.hash, `the witness reply and /block name the same hash at ${h}`);
    }
    summary.live.witnessedCheckpoints = witnessed.map(([h, c]) => ({ height: h, keys: c.distinct }));
    return witnessed.length ? witnessed.map(([h, c]) => `№${h}: ${c.distinct} key${c.distinct === 1 ? '' : 's'}`).join(', ') : 'none in the last 120';
  });

  await step('live: the page (real code, real markup, real network): hero, 24 tiles, day groups, rings', async () => {
    const { p, tiles } = await checkPage({ label: 'live', base: LIVE, pageUrl: 'http://127.0.0.1:4399/chain/bloom', genesis: DEVNET.genesis, expectHeroHeight: latest });
    try {
      eq(tiles.length >= 24, true, 'at least 24 tiles');
      eq(tiles[0].dataset.h, String(latest), 'the newest tile is the latest checkpoint');
      eq(p.app.querySelectorAll('.bl-tile.is-missing').length, 0, 'no tile failed to read');
      // every tile's picture is the bloom of the hash the devnet gave, with the right number of rings
      let checked = 0;
      for (const t of tiles.slice(0, 24)) {
        const h = Number(t.dataset.h);
        const mine = blooms.find((b) => b.h === h);
        const svg = await p.blobText(t.querySelector('img').src);
        eq(B.auditSvg(svg).length, 0, `tile ${h} audit`);
        const w = witnessed.find(([wh]) => wh === h);
        eq(ringCount(svg), w ? Math.min(w[1].distinct, B.MAX_WITNESS_RINGS) : 0, `tile ${h} rings`);
        if (mine) { eq(svg, B.bloomSvg(mine.hash, { witnesses: w ? w[1].distinct : 0 }), `tile ${h} equals bloomSvg(hash)`); checked += 1; }
      }
      const heads = [...p.app.querySelectorAll('.bl-day__h')].map((h) => h.textContent.replace(/\s+/g, ' ').trim());
      ok(heads.length >= 1 && heads.every((h) => /^\d{4}-\d\d-\d\d UTC · \d+ checkpoints?$/.test(h)), `day headings look right: ${heads.join(' | ')}`);
      const days = heads.map((h) => h.slice(0, 10));
      eq(JSON.stringify(days), JSON.stringify([...days].sort().reverse()), 'days run newest to oldest');
      ok(p.requests.every((u) => u.startsWith(LIVE)), 'only the devnet was asked');
      ok(p.requests.every((u) => !/\/(?:bot|tx|admin|mcp)\b/.test(u)), 'no write route was asked');
      summary.live.pageTiles = tiles.length;
      summary.live.pageRequests = p.requests.length;
      return `${tiles.length} tiles in ${heads.length} day group(s) [${heads.join('; ')}], ${checked} compared to bloomSvg(hash), ${p.requests.length} GETs`;
    } finally {
      p.close();
    }
  });

  if (witnessed.length) {
    await step('live: the large view of a witnessed checkpoint: rings, key list, parent link, downloads', async () => {
      const [h, c] = witnessed[0];
      const p = await page({ pageUrl: `http://127.0.0.1:4399/chain/bloom#cp-${h}`, api: LIVE, genesis: DEVNET.genesis });
      try {
        await p.until(() => p.text('d-hash').length === 64 && /parent|No next block/.test(p.text('d-link')), 'the large view');
        const blk = B.readBlock((await get(LIVE, `/block/${h}`)).body, h);
        eq(p.text('d-hash'), blk.hash, 'hash');
        eq(p.text('d-time'), B.utcStamp(blk.timestamp), 'time');
        const svg = await p.blobText(p.q('d-img').src);
        eq(ringCount(svg), Math.min(c.distinct, B.MAX_WITNESS_RINGS), 'rings in the large view');
        ok(/signed this checkpoint/.test(p.text('d-witness')), 'the witness sentence');
        ok(p.q('d-keys').children.length >= 1, 'a key is listed');
        ok(/names this hash as its parent/.test(p.text('d-link')), `parent link: ${p.text('d-link')}`);
        eq(p.q('d-bare').hidden, false, 'the bare-bloom button shows when there are rings');
        return `№${h}: ${c.distinct} key(s), ${ringCount(svg)} ring(s), keys: ${[...p.q('d-keys').children].map((li) => li.children[0].textContent).join(', ')}`;
      } finally {
        p.close();
      }
    });
  }

  await step('live: a wrong pin is refused (GENESIS CHANGED) and not one checkpoint is read', async () => {
    const p = await page({ pageUrl: 'http://127.0.0.1:4399/chain/bloom', api: LIVE, genesis: 'ab'.repeat(32) });
    try {
      await p.until(() => p.app.dataset.state === 'pin', 'the pin state');
      ok(/^GENESIS CHANGED\./.test(p.text('status')), 'status text');
      ok(p.requests.every((u) => u.endsWith('/status')), `only /status was read: ${p.requests.join(', ')}`);
      return 'refused';
    } finally {
      p.close();
    }
  });

  await step('live: an unreachable devnet is said to be unreachable, and the page stays up', async () => {
    const p = await page({ pageUrl: 'http://127.0.0.1:4399/chain/bloom', api: 'https://pointcast-devnet-e2e-missing.invalid', genesis: DEVNET.genesis });
    try {
      await p.until(() => p.app.dataset.state === 'down', 'the down state', 20000);
      ok(/^devnet unreachable\./.test(p.text('status')), p.text('status'));
      eq(p.q('hero-open').disabled, true, 'hero button stays off');
      return p.text('status');
    } finally {
      p.close();
    }
  });

  if (OUT && blooms.length) {
    mkdirSync(OUT, { recursive: true });
    for (const b of blooms.slice(0, 3)) {
      writeFileSync(join(OUT, `live-bloom-${b.h}.svg`), B.bloomSvg(b.hash));
      writeFileSync(join(OUT, `live-bloom-${b.h}-og.svg`), B.bloomOgSvg(b.hash));
    }
    say(`      samples written to ${OUT}`);
  }
}

// ================================================================ LOCAL (the only place anything is written)

async function pushLocalPast(target) {
  const origin = localOrigin(LOCAL);
  let status = B.readStatus((await get(origin, '/status')).body);
  let posts = 0;
  const names = 'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `bloom-e2e-${c}`);
  while (status.height < target && posts < 200) {
    const bot = names[Math.floor(posts / 8) % names.length];
    const r = await postLocal('/bot/post', { bot, title: `bloom e2e ${Date.now() % 100000}-${posts}`, body: 'a local post that seals a block for the Checkpoint Blooms end-to-end run' });
    posts += 1;
    if (r.status >= 400 && r.status !== 429) throw new Error(`local /bot/post answered ${r.status}: ${JSON.stringify(r.body).slice(0, 160)}`);
    const before = status.height;
    for (let i = 0; i < 60 && status.height <= before; i++) {
      await sleep(500);
      status = B.readStatus((await get(origin, '/status')).body);
    }
  }
  return { posts, status };
}

function runWitness({ name, dir, height, genesis }) {
  return new Promise((resolve, reject) => {
    const args = [
      new URL('public/chain/net/pc-witness.mjs', ROOT).pathname,
      '--name', name, '--devnet', localOrigin(LOCAL), '--genesis', genesis,
      '--verifier', new URL('public/chain/yard/verifier', ROOT).pathname,
      '--dir', dir, '--height', String(height), '--wait', '60',
    ];
    const child = spawn(process.execPath, args, { cwd: new URL('public/chain/net/', ROOT).pathname, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`pc-witness exit ${code}: ${out.slice(-300)}`))));
  });
}

async function runLocal() {
  const origin = localOrigin(LOCAL);
  say(`\n== LOCAL ${origin}  (throwaway devnet-2; the only place this script writes)`);
  let st;
  await step('local: the local devnet answers and is a devnet-2', async () => {
    const r = await get(origin, '/status');
    eq(r.status, 200, 'status code');
    st = B.readStatus(r.body);
    eq(st.chainId, 'pointcast-devnet-2', 'chain id');
    summary.local = { startHeight: st.height, genesis: st.genesis.slice(0, 12) };
    return `height ${st.height}, genesis ${st.genesis.slice(0, 12)}…`;
  });
  if (!st) return;

  await step(`local: push the chain past block ${TARGET} with keyless bot posts (local only)`, async () => {
    const r = await pushLocalPast(TARGET);
    st = r.status;
    summary.local.posts = r.posts;
    summary.local.height = st.height;
    ok(st.height >= TARGET, `the chain is at ${st.height}, short of ${TARGET}`);
    return `${r.posts} post(s), height now ${st.height}`;
  });
  const latest = B.latestCheckpoint(st.height);

  const tmp = mkdtempSync(join(tmpdir(), 'bloom-e2e-witness-'));
  try {
    await step('local: two throwaway witness keys sign one checkpoint with pc-witness.mjs (real attestations)', async () => {
      const cp = Math.max(20, latest - 10);
      const have = B.readWitnesses((await get(origin, `/checkpoints/${cp}/witnesses`)).body, cp);
      const suffix = Date.now().toString(36).slice(-5);
      const names = [`bloom-w1-${suffix}`, `bloom-w2-${suffix}`];
      if (have.distinct < 2) {
        for (const name of names) {
          await runWitness({ name, dir: join(tmp, name), height: cp, genesis: st.genesis });
        }
      }
      let w;
      for (let i = 0; i < 30; i++) {
        w = B.readWitnesses((await get(origin, `/checkpoints/${cp}/witnesses`)).body, cp);
        if (w.distinct >= 2) break;
        await sleep(1000);
      }
      ok(w.distinct >= 2, `only ${w.distinct} distinct witness key(s) at ${cp}`);
      summary.local.witnessedCheckpoint = cp;
      summary.local.witnessKeys = w.distinct;
      return `№${cp}: ${w.distinct} distinct keys (${w.keys.map((k) => k.name || 'unnamed').join(', ')}), ${w.correct} agreed`;
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  // The attestations sealed blocks of their own: read where the chain is now.
  st = B.readStatus((await get(origin, '/status')).body);
  const latestNow = B.latestCheckpoint(st.height);
  summary.local.finalHeight = st.height;
  const cp = summary.local.witnessedCheckpoint;
  await step('local: the page with ?devnet= reads the local chain: hero, every checkpoint tile, rings', async () => {
    const pageUrl = `http://127.0.0.1:4399/chain/bloom?devnet=${encodeURIComponent(origin)}`;
    const { p, tiles } = await checkPage({ label: 'local', base: origin, pageUrl, genesis: DEVNET.genesis, expectHeroHeight: latestNow });
    try {
      eq(p.app.dataset.state, 'live', 'state');
      ok(/^LOCAL devnet at /.test(p.text('status')), `the page says it is local: ${p.text('status')}`);
      ok(p.requests.every((u) => u.startsWith(origin)), 'the page asked only the local devnet');
      const want = B.checkpointHeights(latestNow).length;
      await p.until(() => p.app.querySelectorAll('.bl-tile').length >= Math.min(24, want), 'tiles');
      const all = [...p.app.querySelectorAll('.bl-tile')];
      eq(all.length, Math.min(24, want), 'tile count');
      const witnessedTile = all.find((t) => t.dataset.h === String(cp));
      ok(witnessedTile, `the tile for the witnessed checkpoint ${cp}`);
      ok(/[2-9] keys/.test(witnessedTile.textContent), `the tile says how many keys: ${witnessedTile.textContent}`);
      const svg = await p.blobText(witnessedTile.querySelector('img').src);
      ok(ringCount(svg) >= 2, `the tile bloom has ${ringCount(svg)} rings`);
      eq(p.q('d-yard').hidden, true, 'no public Block Yard link for a local chain');
      summary.local.pageTiles = all.length;
      return `${all.length} tiles for ${want} checkpoints, №${cp} tile shows ${ringCount(svg)} rings`;
    } finally {
      p.close();
    }
  });

  await step('local: the large view of the witnessed checkpoint: rings = keys, key names listed, downloads, parent link', async () => {
    const pageUrl = `http://127.0.0.1:4399/chain/bloom?devnet=${encodeURIComponent(origin)}#cp-${cp}`;
    const p = await page({ pageUrl, api: LIVE, genesis: DEVNET.genesis });
    try {
      await p.until(() => p.text('d-hash').length === 64 && /parent|No next block/.test(p.text('d-link')), 'the large view');
      const blk = B.readBlock((await get(origin, `/block/${cp}`)).body, cp);
      const w = B.readWitnesses((await get(origin, `/checkpoints/${cp}/witnesses`)).body, cp);
      eq(p.text('d-hash'), blk.hash, 'hash');
      eq(p.text('d-time'), B.utcStamp(blk.timestamp), 'sealed time');
      const svg = await p.blobText(p.q('d-img').src);
      eq(svg, B.bloomSvg(blk.hash, { witnesses: w.distinct }), 'the large bloom is bloomSvg(hash, witnesses)');
      eq(ringCount(svg), w.distinct, 'rings = distinct keys');
      ok(new RegExp(`${w.distinct} distinct witness keys signed this checkpoint`).test(p.text('d-witness')), p.text('d-witness'));
      const listed = [...p.q('d-keys').children].map((li) => li.children[0].textContent);
      for (const k of w.keys) ok(listed.includes(k.name || 'unnamed key'), `key ${k.name} is listed: ${listed.join(', ')}`);
      ok(/names this hash as its parent/.test(p.text('d-link')), `parent link: ${p.text('d-link')}`);
      // the downloads: as drawn, and the bare recipe output
      const saved = [];
      p.w.HTMLAnchorElement.prototype.click = function click() { saved.push({ href: this.href, name: this.download }); };
      p.q('d-save').click();
      p.q('d-bare').click();
      eq(await p.blobText(saved[0].href), B.bloomSvg(blk.hash, { witnesses: w.distinct }), 'download as drawn');
      eq(await p.blobText(saved[1].href), B.bloom(blk.hash), 'bare download equals the recipe output');
      ok(/-bloom-\d+\.svg$/.test(saved[0].name), saved[0].name);
      // the recipe the page prints, run, gives the same bytes as the bare download
      const dir = mkdtempSync(join(tmpdir(), 'bloom-e2e-recipe-'));
      try {
        const sdk = pathToFileURL(new URL('public/chain/sdk/pointcast-chain.js', ROOT).pathname).href;
        writeFileSync(join(dir, 'recipe.mjs'), recipeParts().text.replace('https://pointcast.xyz/chain/sdk/pointcast-chain.js', sdk));
        const printed = await import(pathToFileURL(join(dir, 'recipe.mjs')).href);
        eq(printed.bloom(blk.hash), await p.blobText(saved[1].href), 'the printed recipe, run, reproduces the bare download byte for byte');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
      if (OUT) {
        mkdirSync(OUT, { recursive: true });
        writeFileSync(join(OUT, `local-bloom-${cp}-witnessed.svg`), svg);
        writeFileSync(join(OUT, `local-bloom-${cp}-og.svg`), B.bloomOgSvg(blk.hash, { witnesses: w.distinct }));
      }
      return `№${cp}: ${w.distinct} keys → ${ringCount(svg)} rings; keys ${listed.join(', ')}; both downloads and the printed recipe match`;
    } finally {
      p.close();
    }
  });

  await step('local: a ?devnet= that is not local is ignored: the page reads only its own devnet', async () => {
    const p = await page({ pageUrl: `http://127.0.0.1:4399/chain/bloom?devnet=${encodeURIComponent('https://evil.example')}`, api: LIVE, genesis: DEVNET.genesis });
    try {
      await p.until(() => p.app.dataset.hero === 'live', `the hero (state ${p.app.dataset.state}; status "${p.text('status').slice(0, 90)}")`, 30000);
      ok(p.requests.every((u) => u.startsWith(LIVE)), `requests: ${[...new Set(p.requests.map((u) => new URL(u).origin))].join(', ')}`);
      ok(p.requests.length > 0, 'it did read');
      return 'the evil address was never asked';
    } finally {
      p.close();
    }
  });
}

// ================================================================ main

const t0 = Date.now();
if (!flag('skip-live')) await runLive();
if (!flag('skip-local')) await runLocal();
for (const w of openWindows) w.close();
summary.ok = failed === 0;
summary.seconds = Math.round((Date.now() - t0) / 1000);
say(`\n${failed === 0 ? 'ALL STEPS HELD' : `${failed} STEP(S) FAILED`} · ${summary.steps.length} steps · ${summary.seconds}s`);
say(JSON.stringify(summary));
process.exit(failed === 0 ? 0 : 1);
