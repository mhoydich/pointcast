// /chain/mints — the First Mints wall (block 0689): the rehearsal files in
// public/chain/yard/first-mints/, firstMints() in src/data/chain-home.ts, the
// page, the block and the front-door note.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { firstMints } from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const DIR = 'public/chain/yard/first-mints';
const snap = JSON.parse(read(`${DIR}/snapshot.json`));
const rows = JSON.parse(read(`${DIR}/mints.json`));
const page = read('src/pages/chain/mints.astro');
const hub = read('src/pages/chain.astro');
const block = JSON.parse(read('src/content/blocks/0689.json'));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('every First Mint row matches an edition_mint in the recording, and has a card', () => {
  const txs = snap.blocks.flatMap((b) => b.txs.map((t) => ({ h: b.header.height, tx: t.tx })))
    .filter((t) => t.tx.type === 'edition_mint' && t.tx.edition === 'first-mints');
  const fms = rows.filter((r) => r.collection === 'first-mints');
  assert.equal(fms.length, 24);
  assert.equal(txs.length, fms.length);
  assert.deepEqual(fms.map((r) => r.serial), Array.from({ length: 24 }, (_, i) => i + 1));
  fms.forEach((r, i) => {
    assert.equal(r.height, txs[i].h, `serial ${r.serial} height`);
    assert.equal(r.recipe_hex, txs[i].tx.recipe, `serial ${r.serial} recipe`);
    const bytes = Buffer.from(r.recipe_hex, 'hex');
    assert.equal(bytes.readUInt32BE(10), bytes.length - 14, 'u32 text length matches');
    assert.equal(r.words.split(' / ').pop(), bytes.subarray(14).toString('latin1'), 'words are the recipe text');
    assert.ok(existsSync(new URL(`${DIR}/cards/first-mints-${r.serial}.svg`, root)), `card ${r.serial}`);
  });
});

test('cards are inert, abstract SVG: no text, script, style, images or links', () => {
  const allowed = new Set(['svg', 'g', 'rect', 'circle', 'path', 'line', 'polygon', 'title']);
  for (let s = 1; s <= 24; s++) {
    const svg = read(`${DIR}/cards/first-mints-${s}.svg`);
    for (const [, tag] of svg.matchAll(/<([a-zA-Z][\w:-]*)/g)) assert.ok(allowed.has(tag), `card ${s}: <${tag}>`);
    assert.doesNotMatch(svg, /href|url\(|\son\w+=|<script|<text|<style|<image|foreignObject/i, `card ${s}`);
  }
});

test('firstMints() reads the recording, and the Verify link pins its genesis with the Mints lens', () => {
  const fm = firstMints();
  assert.equal(fm.mints.length, 24);
  assert.equal(fm.genesis, snap.status.genesis_hash);
  assert.equal(fm.tip, snap.status.height);
  assert.equal(fm.supply, 1200);
  assert.match(fm.rendererSha256, /^[0-9a-f]{64}$/);
  assert.equal(fm.yardHref, `/chain/yard/?snapshot=./first-mints/snapshot.json&lens=mints&genesis=${snap.status.genesis_hash}`);
  assert.deepEqual(fm.others.map((o) => o.collection), ['art-demo']);
  for (const m of fm.mints) {
    assert.ok(m.words.length > 0 && m.words.length <= 24);
    assert.match(m.code, /^FM1 \d+\.\d+\.\d+\.\d+ /);
    assert.ok(existsSync(new URL(`public${m.card}`, root)));
  }
});

test('the page is static and escaped: no client script, no raw HTML from data', () => {
  const body = code(page);
  assert.doesNotMatch(body, /<script|set:html|innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  assert.match(page, /import \{ firstMints \} from '\.\.\/\.\.\/data\/chain-home'/);
  assert.match(page, /<img\s+src=\{m\.card\}/);
  assert.match(page, /href=\{fm\.yardHref\}>✓ Verify these mints</);
});

test('honest copy: rehearsal, public dev keys, no value, Daily Mint only coming', () => {
  for (const phrase of [/rehearsal/, /public dev keys/, /no value/i, /Daily Mint: one First Mint auctioned a day \(coming\)/, /being designed now/])
    assert.match(page, phrase);
  for (const phrase of [/main\s*net/i, /\binvest/i, /\bprofit/i, /\byield\b/i, /\bworth\b/i, /\bbuy now\b/i, /\blimited time\b/i])
    assert.doesNotMatch(page, phrase);
  assert.match(block.body, /being designed now/);
  assert.doesNotMatch(block.body, /https?:\/\//, 'block body is plain text; links live in companions');
});

test('block 0689, the hub and the front door all point at /chain/mints', () => {
  assert.equal(block.id, '0689');
  assert.equal(block.channel, 'FD');
  const ids = block.companions.map((c) => c.id);
  assert.ok(ids.includes('https://pointcast.xyz/chain/mints/'));
  assert.ok(ids.includes('/chain/yard/?snapshot=./first-mints/snapshot.json&lens=mints'));
  assert.ok(existsSync(new URL(`public${block.media.src}`, root)));
  assert.ok(existsSync(new URL('public/images/og/b/0689.png', root)));
  assert.equal(block.meta.genesis, snap.status.genesis_hash);
  assert.match(hub, /<a href="\/chain\/mints">See all/);
  const news = JSON.parse(read('src/data/front-door-news.json'));
  assert.equal(news[0].label, 'First Mints');
  assert.equal(news[0].link, '/chain/mints');
  assert.match(read('src/data/chain-home.ts'), /\{ key: 'mints', href: '\/chain\/mints', label: 'First Mints' \}/);
});
