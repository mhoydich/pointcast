// The devnet restart (block 0700): the dated notice on /chain/bots and
// /chain/net, the devnet-1 recording, the "what you can do now" list, the
// single genesis pin for the next chain, and the front-door item.
//
// The point of this suite is that the site cannot claim a reset that has not
// happened, cannot link a recording that is not published, and cannot carry a
// devnet-2 genesis in more than one place. The recording half SKIPS while
// public/chain/yard/devnet-1/ is absent, so this file is green before and
// after the orchestrator fills it in.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import {
  DEVNET,
  DEVNET_1_END,
  DEVNET_2_GENESIS,
  DEVNET_CAN,
  DEVNET_CANNOT,
  RESET,
  devnet1Recording,
} from '../src/data/chain-home.ts';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const has = (p) => existsSync(new URL(p, root));

const notice = read('src/components/chain/ResetNotice.astro');
const bots = read('src/pages/chain/bots.astro');
const net = read('src/pages/chain/net.astro');
const block = JSON.parse(read('src/content/blocks/0700.json'));
const strip = JSON.parse(read('src/data/new-today.json'));
const news = JSON.parse(read('src/data/front-door-news.json'));
const HEX64 = /^[0-9a-f]{64}$/;

test('both devnet pages carry the one restart notice, and it is reachable', () => {
  for (const [name, page] of [['bots', bots], ['net', net]]) {
    assert.match(page, /import ResetNotice from '\.\.\/\.\.\/components\/chain\/ResetNotice\.astro';/, name);
    assert.match(page, /<ResetNotice \/>/, `${name} renders it`);
    assert.match(page, /<a href="#reset">/, `${name} links to it from the jump nav or the copy`);
  }
  // One component, so the two pages cannot drift apart on what a reset means.
  assert.match(notice, /id="reset"/);
  assert.equal((bots.match(/<ResetNotice \/>/g) ?? []).length, 1);
  assert.equal((net.match(/<ResetNotice \/>/g) ?? []).length, 1);
});

test('the next chain has exactly one genesis pin, and it is not devnet-1’s', () => {
  // The pin is a single constant. Everything else reads it.
  assert.match(read('src/data/chain-home.ts'), /export const DEVNET_2_GENESIS: string \| null = /);
  if (DEVNET_2_GENESIS !== null) {
    assert.match(DEVNET_2_GENESIS, HEX64, 'a filled pin is a 64-hex genesis hash');
    assert.notEqual(DEVNET_2_GENESIS, DEVNET.genesis, 'a new chain cannot reuse devnet-1’s genesis');
  }
  assert.equal(RESET.genesisNext, DEVNET_2_GENESIS, 'RESET reads the pin, it does not hold its own copy');
  assert.equal(RESET.chainIdNext, 'pointcast-devnet-2');
  assert.notEqual(RESET.chainIdNext, DEVNET.chainId);

  // No page, component, served file or block may hard-code a devnet-2 genesis:
  // the only 64-hex genesis any of them may carry is devnet-1's own.
  const surfaces = [
    'src/components/chain/ResetNotice.astro',
    'src/pages/chain/bots.astro',
    'src/pages/chain/net.astro',
    'src/content/blocks/0700.json',
    'public/chain/bots/bot.mjs',
    'public/chain/bots/verify.mjs',
  ];
  for (const p of surfaces) {
    // Only hashes written as a genesis: a tx hash or a wasm sha256 in the same
    // file is not a chain pin.
    for (const [, hex] of read(p).matchAll(/genesis[^0-9a-f]{0,24}([0-9a-f]{64})/gi)) {
      assert.ok(
        hex === DEVNET.genesis || hex === DEVNET_2_GENESIS,
        `${p} pins genesis ${hex.slice(0, 12)}…, which is neither devnet-1’s nor the one pin`,
      );
    }
  }
  // And this test must not be the place the old hash is kept alive as if it
  // were the new one: it reads both from the module.
  assert.doesNotMatch(read('tests/chain-devnet-reset.test.mjs'), /\b[0-9a-f]{64}\b/);
});

test('while the restart is planned, nothing on the site says it happened', () => {
  if (RESET.state !== 'planned') return;
  assert.equal(DEVNET_2_GENESIS, null, 'planned means the new genesis is not known');
  assert.equal(DEVNET_1_END, null, 'planned means devnet-1 has not ended');
  assert.equal(DEVNET.chainId, 'pointcast-devnet-1', 'the live chain id is still devnet-1');
  // The notice's two branches: one says "will restart", one says "restarted".
  assert.match(notice, /The devnet will restart as a new chain\./);
  assert.match(notice, /<b>This has not happened yet\.<\/b>/);
  assert.match(notice, /RESET\.state === 'planned'/, 'the branch is driven by the pin, not by hand');
  // The block announces; it does not report.
  assert.match(block.body, /has not restarted yet/);
  assert.match(block.meta.status, /has not happened/i);
  assert.match(String(block.meta.genesis_next), /not known until/);
});

test('the restart notice says what a restart does, and never softens the value line', () => {
  assert.equal(RESET.announced, '2026-10-06');
  assert.ok(RESET.effects.length >= 4);
  const effects = RESET.effects.map(([k]) => k);
  for (const k of ['Heights and hashes', 'Streaks, names, balances', 'Pinned links', 'The old chain']) {
    assert.ok(effects.includes(k), `missing effect: ${k}`);
  }
  const body = RESET.effects.map(([, v]) => v).join(' ');
  assert.match(body, /none of it has value after/i, 'the clearing line says the cleared things had no value');
  assert.match(body, /genesis changed|genesis/i, 'pinned links are named as refusing the new chain');
  // "no value is promised" is the standing claim; the restart does not get to
  // quietly imply the next chain is worth something.
  assert.match(block.body, /No value is promised\./);
  assert.match(String(block.meta.value), /no value is promised/i);
  // A witness is a claim, not proof — on the page that collects witnesses.
  assert.match(block.body, /accountable claim .*not proof|claim rather than an identity/);
  assert.match(block.meta.witness, /not proof that it did/);
});

test('"what you can do on the devnet now" is a list the page actually renders', () => {
  assert.ok(DEVNET_CAN.length >= 8, 'the inventory is the answer to "everything on the devnet"');
  assert.ok(DEVNET_CANNOT.length >= 4, 'and it is paired with the limits');
  for (const c of DEVNET_CAN) {
    assert.ok(c.what.length > 0 && c.how.length > 20, c.what);
    assert.match(c.href, /^[#/]/, `${c.what}: href is a same-page anchor or a site path`);
    if (c.href.startsWith('#')) assert.ok(bots.includes(`id="${c.href.slice(1)}"`), `${c.what}: ${c.href} exists on /chain/bots`);
  }
  assert.match(bots, /<section id="now"/);
  assert.match(bots, /DEVNET_CAN\.map/);
  assert.match(bots, /DEVNET_CANNOT\.map/);
  assert.match(bots, /<a href="#now">what you can do<\/a>/);
  const cannot = DEVNET_CANNOT.join(' ');
  assert.match(cannot, /no value is promised/i);
  assert.match(cannot, /claim, not an identity/);
});

test('the stale "may reset" wording is gone from the devnet surfaces it misdescribed', () => {
  // "may reset" reads as a thing that might quietly happen. The restart is
  // dated, so these surfaces say so instead. (Published blocks keep their own
  // words: a block is a record, not a page.)
  for (const p of [
    'src/pages/chain/bots.astro',
    'src/pages/chain/net.astro',
    'src/pages/chain/dev.astro',
    'src/components/HomeChainStrip.astro',
    'src/components/chain/DailyNetPanel.astro',
  ]) {
    assert.doesNotMatch(read(p), /may reset/i, p);
  }
  assert.doesNotMatch(read('src/data/chain-home.ts').split('// ---')[0], /may reset/i, 'STATUS_LINE');
  for (const item of news) assert.doesNotMatch(item.line, /may reset/i, item.label);
});

test('the devnet-1 recording is linked only when it is really published', () => {
  const rec = devnet1Recording();
  assert.match(notice, /devnet1Recording\(\)/);
  assert.match(notice, /rec \?/, 'the recording block is conditional on the files being there');

  if (!has('public/chain/yard/devnet-1/snapshot.json')) {
    assert.equal(rec, null, 'no files, no recording');
    assert.match(notice, /is not published yet/, 'the page says so plainly instead of linking nothing');
    test.skip?.('devnet-1 recording not published yet');
    return;
  }

  assert.ok(rec, 'the snapshot is there, so it must parse as devnet-1’s own');
  assert.equal(rec.genesis, DEVNET.genesis, 'the recording is devnet-1, pinned to devnet-1’s genesis');
  assert.ok(rec.height >= 1 && rec.blocks >= 1);
  assert.match(rec.tipHash, HEX64);
  // The link must pin the OLD genesis, or it stops verifying the moment the
  // live URL serves a different chain.
  assert.ok(rec.yardHref.includes(`genesis=${DEVNET.genesis}`), rec.yardHref);
  assert.ok(rec.yardHref.includes('snapshot=./devnet-1/snapshot.json'), rec.yardHref);
  assert.ok(!rec.yardHref.includes('api='), 'a recording is replayed from the file, never from the live node');
  assert.ok(has('public/chain/yard/devnet-1/snapshot.json'));
});

test('the restart is on the front door: a wire block, the strip and the news list', () => {
  assert.equal(block.id, '0700');
  assert.equal(block.channel, 'FD');
  assert.equal(block.author, 'cc');
  assert.ok(block.source.length > 40, 'the block says where its facts came from');
  assert.equal(block.media.src, '/images/chain/devnet-reset.svg');
  assert.ok(has('public/images/chain/devnet-reset.svg'));
  assert.ok(has('public/images/og/b/0700.png'));
  assert.ok(has('scripts/generate-chain-reset-art.py'), 'the art is generated, not hand-drawn');

  const item = strip.find((i) => i.block === '0700');
  assert.ok(item, 'the strip carries the announcement');
  assert.equal(item.date, RESET.announced);
  assert.equal(item.link, '/chain/bots');
  assert.ok(item.kicker.length <= 21 && item.title.length <= 28, 'one line in a 375 px cell');
  // The Morning Edition reads front-door-news.json unfiltered, so a fresh
  // strip link must not also sit there.
  for (const n of news) assert.notEqual(n.link, item.link, `${n.label} duplicates the fresh strip item`);
});

test('the block’s art is abstract: no text, no script, no links, no people or places', () => {
  const svg = read('public/images/chain/devnet-reset.svg');
  const allowed = new Set(['svg', 'g', 'rect', 'circle', 'path', 'line', 'style']);
  for (const [, tag] of svg.matchAll(/<([a-zA-Z][\w:-]*)/g)) assert.ok(allowed.has(tag), `<${tag}>`);
  assert.doesNotMatch(svg, /href|url\(|\son\w+=|<script|<text|<image|foreignObject/i);
  // The <style> holds animation only, so a rasterizer gets a clean still.
  const style = svg.slice(svg.indexOf('<style>'), svg.indexOf('</style>'));
  assert.doesNotMatch(style, /fill:|stroke:/, 'colour stays on the elements');
  assert.match(style, /prefers-reduced-motion/);
});
