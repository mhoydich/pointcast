// Checkpoint Blooms: /chain/bloom (src/pages/chain/bloom.astro, src/components/chain/BloomDialog.astro),
// the drawing module public/chain/apps/bloom.js and the browser side public/chain/apps/bloom-view.js.
//
// What this suite holds:
//   - a bloom is a pure function of a block hash: same hash, same bytes; the
//     recipe the page prints is the shipped code (run, and compared for 200
//     hashes); a thousand hashes give a thousand different geometries;
//   - every SVG passes the audit (no text, image, foreignObject, script,
//     external href ...), and the audit rejects each of those when planted;
//   - nothing from the devnet is ever turned into markup: a static scan of the
//     browser code, proven by mutation (put an innerHTML in and the scan trips),
//     and a run against hostile replies in jsdom, proven by a mutated copy
//     that does get injected;
//   - the page is lazy, reads a local devnet only on localhost / 127.0.0.1,
//     fails honestly, pins the genesis, and degrades without JavaScript;
//   - the copy is honest: devnet · no value · may reset, devnet-2, a reset is
//     dated and recorded, and none of the words a fundraising page would use.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS } from '../src/data/chain-home.ts';
import { HONESTY_LINE, HOW_STEPS, NOT_LIST, recipeParts } from '../src/data/chain-app-bloom.ts';
import * as B from '../public/chain/apps/bloom.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const file = (p) => new URL(p, root);

const SRC = {
  bloom: 'public/chain/apps/bloom.js',
  view: 'public/chain/apps/bloom-view.js',
  page: 'src/pages/chain/bloom.astro',
  dialog: 'src/components/chain/BloomDialog.astro',
  data: 'src/data/chain-app-bloom.ts',
};
const src = Object.fromEntries(Object.entries(SRC).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(SRC), 'tests/chain-app-bloom.test.mjs', 'scripts/e2e-chain-app-bloom.mjs'].filter((p) => existsSync(file(p)));

/** Strip comments so rules read code and copy, not the notes about them (the same trick tests/chain-daily-net.test.mjs uses). */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, (_, keep) => keep);

const sha256 = (s) => createHash('sha256').update(s).digest('hex');
const hashFor = (i) => sha256(`bloom-test-${i}`);
const HEX64 = /^[0-9a-f]{64}$/;

// ================================================================ the drawing

const REAL_HASHES = [
  '8557d8305358eb31717985ac301b6d145902b38d0d549ec11f819b928a1352e2', // block 3320 on devnet-2, read 2026-10-20
  '5d9924141188159d14a6f1d6546086bdda477e77e951e183d046c37570068e97', // block 2950
  'a720735b473383057ee11e885b2d32e1565470612364f13c0265c1a1c66f4280', // devnet-2's genesis hash
];

test('a bloom is a pure function of the block hash: same hash, same bytes, different hash, different bytes', () => {
  for (const h of REAL_HASHES) {
    const a = B.bloomSvg(h);
    assert.equal(B.bloomSvg(h), a);
    assert.equal(B.bloom(h), a, 'with no options bloomSvg is exactly the recipe');
    assert.match(a, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1000 1000" width="1000" height="1000">/);
    assert.ok(a.endsWith('</svg>'));
  }
  assert.notEqual(B.bloomSvg(REAL_HASHES[0]), B.bloomSvg(REAL_HASHES[1]));
  // One flipped nibble must redraw everything that depends on it.
  const h = REAL_HASHES[0];
  assert.notEqual(B.bloomSvg(h), B.bloomSvg(`${h.slice(0, 63)}${h[63] === '0' ? '1' : '0'}`));
});

test('known answers: the SVG of three real hashes is pinned, so the drawing cannot change by accident', () => {
  // If you change the recipe on purpose, every bloom already shown or downloaded changes: say so in the release, then update these.
  const got = REAL_HASHES.map((h) => sha256(B.bloomSvg(h)));
  assert.deepEqual(got, KNOWN_SHA256);
});

test('the hash has to be 64 lowercase hex characters, and nothing else is drawn', () => {
  for (const bad of ['', 'abc', 'G'.repeat(64), REAL_HASHES[0].toUpperCase(), `${REAL_HASHES[0]}0`, REAL_HASHES[0].slice(1), null, undefined, 42, {}, ['a'], '<svg onload=1>'.padEnd(64, 'a')]) {
    assert.throws(() => B.bloomSvg(bad), TypeError, String(bad));
  }
});

test('the recipe the page prints is the shipped code, and it draws the same bytes as the module for 200 hashes', async () => {
  const r = recipeParts();
  assert.ok(r.lines.length <= 20, `the recipe is ${r.lines.length} lines; the page says twenty`);
  assert.equal(r.lines.length, 20);
  assert.match(r.lines[0], /^export function bloom\(hash\) \{$/);
  assert.equal(r.lines.at(-1), '}');
  // The printed text is the file's lines, byte for byte, plus the import and one usage comment.
  const shipped = src.bloom.slice(src.bloom.indexOf('// <recipe>') + 12, src.bloom.indexOf('// </recipe>')).replace(/\n$/, '');
  assert.ok(r.text.includes(shipped));
  assert.equal(r.importLine, "import { blake2b, hexToBytes } from 'https://pointcast.xyz/chain/sdk/pointcast-chain.js';");
  // Run what the page prints: the same text with the import pointed at the local SDK.
  const dir = mkdtempSync(join(tmpdir(), 'bloom-recipe-'));
  try {
    const sdk = pathToFileURL(new URL('public/chain/sdk/pointcast-chain.js', root).pathname).href;
    writeFileSync(join(dir, 'recipe.mjs'), r.text.replace('https://pointcast.xyz/chain/sdk/pointcast-chain.js', sdk));
    const printed = await import(pathToFileURL(join(dir, 'recipe.mjs')).href);
    for (let i = 0; i < 200; i++) assert.equal(printed.bloom(hashFor(i)), B.bloomSvg(hashFor(i)), `hash ${i}`);
    for (const h of REAL_HASHES) assert.equal(printed.bloom(h), B.bloomSvg(h));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // And the page and the dialog print it from the file at build time rather than carrying a copy.
  assert.match(src.dialog, /recipeParts\(\)/);
  assert.match(src.dialog, /<code data-bl="recipe-code">\{recipe\}<\/code>/);
  assert.match(src.dialog, /data-bl="d-copy-recipe"/);
});

test('seeds come from the chain’s own blake2b over the hash bytes and a counter, and nothing else', () => {
  const body = code(src.bloom.slice(src.bloom.indexOf('// <recipe>'), src.bloom.indexOf('// </recipe>')));
  assert.match(body, /blake2b\(\[hexToBytes\(hash\), \[c\]\], 64\)/);
  assert.match(src.bloom, /^import \{ blake2b, hexToBytes \} from '\.\.\/sdk\/pointcast-chain\.js';$/m);
  assert.doesNotMatch(body, /Math\.random|Date\.now|new Date|performance\.|crypto\.|fetch\(|localStorage|document|window|navigator/);
  assert.doesNotMatch(code(src.bloom), /\bdocument\b|\bwindow\b|\bnavigator\b|\bfetch\s*\(|XMLHttpRequest|localStorage|Math\.random|Date\.now/, 'bloom.js has no DOM, no network and no clock');
});

test('a thousand different hashes give a thousand different geometries, a calm palette and a clean audit', () => {
  const prints = new Set();
  const petals = new Set();
  const lens = [];
  let minDistance = Infinity;
  let prev = null;
  for (let i = 0; i < 1000; i++) {
    const h = hashFor(i);
    const svg = B.bloomSvg(h);
    assert.deepEqual(B.auditSvg(svg), [], `audit ${i}`);
    prints.add(B.geometryFingerprint(svg));
    petals.add((svg.match(/fill-opacity="0\.8"/g) ?? []).length);
    lens.push(svg.length);
    if (prev) minDistance = Math.min(minDistance, B.geometryDistance(prev, svg));
    prev = svg;
    // colours: 6-digit hex only, and the petals stand off the ground (WCAG contrast >= 3)
    const pal = B.paletteOf(svg);
    assert.ok(pal.length >= 5 && pal.every((c) => /^#[0-9a-f]{6}$/.test(c)), `palette ${i}`);
    assert.ok(contrast(pal[0], pal[2]) >= 3, `petals against the ground in ${i}: ${pal.join(' ')}`);
  }
  assert.equal(prints.size, 1000, 'every geometry fingerprint is different');
  assert.deepEqual([...petals].sort((a, b) => a - b), [5, 6, 7, 8, 9, 10, 11, 12, 13], 'every petal count from 5 to 13 turns up');
  assert.ok(minDistance >= 20, `neighbouring blooms differ in at least 20 rounded geometry numbers (min ${minDistance})`);
  assert.ok(Math.max(...lens) < 30_000, 'a bloom stays small enough to inline 120 of them');
});

test('options: witness rings, the OG variant and the drift are additions you can see, not different blooms', () => {
  const h = REAL_HASHES[0];
  const bare = B.bloomSvg(h);
  const ringsOf = (s) => (s.match(/<circle cx="500" cy="500" r="\d+" fill="none" stroke="#f2d48a"/g) ?? []).length;
  assert.equal(ringsOf(bare), 0);
  for (const n of [1, 2, 5, 14]) {
    const s = B.bloomSvg(h, { witnesses: n });
    assert.equal(ringsOf(s), n);
    assert.ok(s.startsWith(bare.slice(0, -'</svg>'.length)), 'the bloom itself is unchanged under the rings');
    assert.deepEqual(B.auditSvg(s), []);
  }
  assert.equal(ringsOf(B.bloomSvg(h, { witnesses: 99 })), B.MAX_WITNESS_RINGS, 'at most 14 rings are drawn');
  assert.equal(ringsOf(B.bloomSvg(h, { witnesses: -3 })), 0);
  assert.equal(ringsOf(B.bloomSvg(h, { witnesses: 2.9 })), 2);
  assert.equal(ringsOf(B.bloomSvg(h, { witnesses: 'x' })), 0);
  // The outermost ring still sits inside the 1000-unit square.
  assert.ok(390 + 7 * (B.MAX_WITNESS_RINGS - 1) + 2 <= 500);

  const og = B.bloomOgSvg(h);
  assert.match(og, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="-452\.4 0 1904\.8 1000" width="1200" height="630">/);
  assert.deepEqual(B.OG_SIZE, { width: 1200, height: 630 });
  assert.deepEqual(B.auditSvg(og), []);
  assert.equal(og.includes('<g class="p">'), true);
  assert.ok(og.length > bare.length, 'the OG variant adds halo rings');
  assert.deepEqual(B.auditSvg(B.bloomOgSvg(h, { witnesses: 14, drift: true })), []);
  // 1904.8 / 1000 is 1200 / 630: the aspect ratio is the OG card's.
  assert.ok(Math.abs(1904.8 / 1000 - 1200 / 630) < 0.001);

  const drift = B.bloomSvg(h, { drift: true });
  assert.equal((drift.match(/<animateTransform /g) ?? []).length, 1);
  assert.deepEqual(B.auditSvg(drift), []);
  assert.equal(B.geometryFingerprint(drift), B.geometryFingerprint(bare), 'the drift moves petals; it draws no new geometry');
  assert.doesNotMatch(bare, /animate/, 'the still bloom, the only thing offered for download, has no animation');
});

test('no letters or numerals are drawn: no text, no title, no glyphs, no data between tags', () => {
  for (let i = 0; i < 50; i++) {
    const s = B.bloomSvg(hashFor(i), { witnesses: i % 15 });
    assert.doesNotMatch(s, /<(text|tspan|textPath|title|desc|metadata|font|glyph|image|foreignObject|script|style|use|a|symbol|filter|pattern)[\s>/]/i);
    assert.doesNotMatch(s, /<\/svg>.|>\s*[^<\s][^<]*</s, 'only tags between tags');
    assert.deepEqual([...new Set((s.match(/<([a-zA-Z]+)/g) ?? []).map((x) => x.slice(1)))].sort(), ['circle', 'g', 'path', 'rect', 'svg']);
  }
});

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// The three known answers, recorded from this recipe on 2026-10-20.
const KNOWN_SHA256 = [
  '5587abdcab0c90fc7c792e8673a92ccc3df3a3a74f14f44366d04ad16020fb82',
  '01fc37747092484ceb39623d6f87c9656d787924d1d59237551c8f40da789944',
  '3136f67621e978b3a2d7f44992c63b691eeac3c4c98ec125fe7830ff9c98a23b',
];

// ================================================================ the audit

test('the audit rejects each thing a bloom must never hold, planted in a real bloom', () => {
  const h = REAL_HASHES[1];
  const clean = B.bloomSvg(h, { witnesses: 2 });
  assert.deepEqual(B.auditSvg(clean), []);
  const plant = (inner) => clean.replace('<g class="p">', `<g class="p">${inner}`);
  const cases = {
    text: '<text x="10" y="10">7</text>',
    tspan: '<tspan>x</tspan>',
    title: '<title>a</title>',
    desc: '<desc>a</desc>',
    image: '<image href="#a" width="1" height="1"/>',
    'external image': '<image href="https://example.com/a.png" width="1" height="1"/>',
    foreignObject: '<foreignObject width="1" height="1"><div>hi</div></foreignObject>',
    script: '<script>alert(1)</script>',
    'self-closed script': '<script/>',
    'svg-namespaced script': '<svg:script>alert(1)</svg:script>',
    style: '<style>circle{fill:red}</style>',
    'external href': '<use href="https://example.com/x.svg#a"/>',
    'xlink href': '<a xlink:href="https://example.com"><circle r="1"/></a>',
    'fragment use': '<use href="#a"/>',
    'event handler': '<circle r="1" onload="alert(1)"/>',
    'style attribute': '<circle r="1" style="fill:red"/>',
    'href on a path': '<path d="M0 0" href="#a"/>',
    'javascript url': '<circle r="1" fill="javascript:alert(1)"/>',
    'data uri': '<circle r="1" fill="data:text/html,x"/>',
    'network url in a value': '<circle r="1" stroke="//example.com/a"/>',
    'url() to the network': '<circle r="1" fill="url(https://example.com/a#b)"/>',
    'url() that is not a fragment': '<circle r="1" fill="url(a.svg#b)"/>',
    'text node': 'hello',
    'a numeral as text': '7',
    comment: '<!-- hi -->',
    cdata: '<![CDATA[x]]>',
    'processing instruction': '<?xml version="1.0"?>',
    doctype: '<!DOCTYPE svg>',
    'unknown element': '<marquee/>',
    'animate that could rewrite a link': '<animate attributeName="href" to="https://example.com"/>',
    'set': '<set attributeName="href" to="https://example.com"/>',
    'animateTransform on something else': '<animateTransform attributeName="fill" type="rotate"/>',
    'another namespace': '<circle xmlns:x="http://www.w3.org/1999/xlink" r="1"/>',
    'repeated attribute': '<circle r="1" r="2"/>',
    'unquoted attribute': '<circle r=1/>',
    'unclosed element': '<g>',
    'second root': '</g></svg><svg xmlns="http://www.w3.org/2000/svg"><g>',
  };
  for (const [name, inner] of Object.entries(cases)) {
    const problems = B.auditSvg(plant(inner));
    assert.ok(problems.length > 0, `the audit let through: ${name}`);
    assert.throws(() => B.assertCleanSvg(plant(inner)), /failed its audit/, name);
  }
  // Wrapping shapes the audit also owns: a text node outside the root, a wrong root, a wrong namespace, no input.
  assert.ok(B.auditSvg(`${clean}7`).length > 0);
  assert.ok(B.auditSvg(`<!-- x -->${clean}`).length > 0);
  assert.ok(B.auditSvg(clean.replace('xmlns="http://www.w3.org/2000/svg"', 'xmlns="http://example.com/svg"')).length > 0);
  assert.ok(B.auditSvg(clean.replace('xmlns="http://www.w3.org/2000/svg" ', '')).length > 0);
  assert.ok(B.auditSvg(clean.replace(/^<svg/, '<g').replace(/<\/svg>$/, '</g>')).length > 0);
  assert.ok(B.auditSvg('').length > 0);
  assert.ok(B.auditSvg(null).length > 0);
  assert.ok(B.auditSvg(clean + clean).length > 0);
  // Whitespace between tags is fine; that is what a pretty-printed file has.
  assert.deepEqual(B.auditSvg(clean.replace(/></g, '>\n  <')), []);
});

test('the audit also covers every option combination the page can draw', () => {
  for (let i = 0; i < 40; i++) {
    for (const opts of [{}, { witnesses: i % 15 }, { drift: true }, { og: true }, { og: true, drift: true, witnesses: 14 }]) {
      assert.deepEqual(B.auditSvg(B.bloomSvg(hashFor(i), opts)), [], JSON.stringify(opts));
    }
  }
});

// ================================================================ reading the devnet

test('readers refuse anything that is not the shape and alphabet of the real replies', () => {
  const H = hashFor(1);
  const status = { network: 'devnet', chain_id: 'pointcast-devnet-2', genesis_hash: H, height: 3321, tip_timestamp: Date.UTC(2026, 9, 20) };
  assert.deepEqual(B.readStatus(status), { chainId: 'pointcast-devnet-2', genesis: H, height: 3321, tipTimestamp: Date.UTC(2026, 9, 20) });
  for (const bad of [null, [], 'x', 1, {}, { ...status, network: 'mainnet' }, { ...status, height: -1 }, { ...status, height: 1.5 }, { ...status, height: '3321' }, { ...status, genesis_hash: 'nope' }, { ...status, chain_id: 'a"><img src=x>' }, { ...status, chain_id: '' }]) {
    assert.throws(() => B.readStatus(bad), Error, JSON.stringify(bad));
  }
  assert.equal(B.readStatus({ ...status, tip_timestamp: 5 }).tipTimestamp, null, 'a time outside 2026..2100 is not shown');

  const blk = { network: 'devnet', hash: H, height: 3320, prev_hash: hashFor(2), state_root: hashFor(3), timestamp: Date.UTC(2026, 9, 20, 6), txs: [{}, {}] };
  assert.deepEqual(B.readBlock(blk, 3320), { height: 3320, hash: H, prevHash: hashFor(2), stateRoot: hashFor(3), timestamp: Date.UTC(2026, 9, 20, 6), txs: 2 });
  for (const bad of [null, [], {}, { ...blk, height: 3310 }, { ...blk, height: '3320' }, { ...blk, hash: H.toUpperCase() }, { ...blk, hash: `<svg onload=alert(1)>${H.slice(20)}` }, { ...blk, hash: H.slice(1) }, { ...blk, network: 'x' }]) {
    assert.throws(() => B.readBlock(bad, 3320), Error, JSON.stringify(bad));
  }
  assert.equal(B.readBlock({ ...blk, timestamp: 'now' }, 3320).timestamp, null);
  assert.equal(B.readBlock({ ...blk, timestamp: Date.UTC(2200, 0, 1) }, 3320).timestamp, null);
  assert.equal(B.readBlock({ ...blk, prev_hash: 'x', state_root: 5, txs: 'many' }, 3320).prevHash, '');

  assert.deepEqual(B.readRawHeader({ header: { height: 3321, prev_hash: H } }, 3321), { height: 3321, prevHash: H });
  for (const bad of [null, {}, { header: null }, { header: { height: 3322, prev_hash: H } }, { header: { height: 3321, prev_hash: 'x' } }]) assert.throws(() => B.readRawHeader(bad, 3321), Error);
  assert.equal(B.linkHolds({ height: 3320, hash: H }, { height: 3321, prevHash: H }), true);
  assert.equal(B.linkHolds({ height: 3320, hash: H }, { height: 3321, prevHash: hashFor(9) }), false);
  assert.equal(B.linkHolds({ height: 3320, hash: H }, { height: 3322, prevHash: H }), false);
  assert.equal(B.linkHolds(null, null), false);

  const wit = {
    network: 'devnet', height: 3320, block_hash: H, sealed: true, distinct: 2, correct: 1, strikes: 1, more: 0,
    witnesses: [
      { addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1', result: 'correct' },
      { addr: '<script>x</script>', name: '<img src=x onerror=alert(1)>', result: 'mismatch<b>' },
      'junk', null, 5,
    ],
  };
  const w = B.readWitnesses(wit, 3320);
  assert.equal(w.distinct, 2);
  assert.deepEqual(w.keys, [{ name: 'house-runner-1', addr: 'tz1YKK…5No2', result: 'correct' }, { name: '', addr: '', result: 'other' }]);
  for (const bad of [null, [], { ...wit, height: 3310 }]) assert.throws(() => B.readWitnesses(bad, 3320), Error);
  assert.equal(B.readWitnesses({ ...wit, distinct: -5 }, 3320).distinct, 0);
  assert.equal(B.readWitnesses({ ...wit, block_hash: 'x' }, 3320).blockHash, '');

  const range = B.readCheckpointRange({ checkpoints: [{ height: 2370, distinct: 1, correct: 1, strikes: 0 }, { height: 2375, distinct: 1 }, { height: 'a', distinct: 1 }, { height: 2380, distinct: -1 }, 'x'] });
  assert.deepEqual([...range.keys()], [2370], 'only multiples of ten with a real count');
  assert.throws(() => B.readCheckpointRange({}), Error);
  assert.throws(() => B.readCheckpointRange(null), Error);
});

test('checkpoint arithmetic: the latest checkpoint, the last 120, and read windows the devnet accepts', () => {
  assert.equal(B.latestCheckpoint(3321), 3320);
  assert.equal(B.latestCheckpoint(3320), 3320);
  assert.equal(B.latestCheckpoint(10), 10);
  assert.equal(B.latestCheckpoint(9), null);
  assert.equal(B.latestCheckpoint(0), null);
  assert.equal(B.latestCheckpoint(-1), null);
  assert.equal(B.latestCheckpoint(2.5), null);
  assert.equal(B.latestCheckpoint('3320'), null);
  const hs = B.checkpointHeights(3320);
  assert.equal(hs.length, 120);
  assert.equal(hs[0], 3320);
  assert.equal(hs.at(-1), 3320 - 1190);
  assert.ok(hs.every((h, i) => h % 10 === 0 && (i === 0 || h === hs[i - 1] - 10)));
  assert.deepEqual(B.checkpointHeights(40), [40, 30, 20, 10], 'never below the first checkpoint');
  assert.deepEqual(B.checkpointHeights(null), []);
  assert.deepEqual(B.rangeWindows([]), []);
  const wins = B.rangeWindows(hs);
  assert.ok(wins.length >= 2);
  for (const w of wins) assert.ok(w.to - w.from <= 1000 && w.from >= 1, JSON.stringify(w));
  for (const h of hs) assert.ok(wins.some((w) => h >= w.from && h <= w.to), `height ${h} is covered`);
  assert.equal(B.rangeWindows([50, 40, 30]).length, 1);
});

test('time and days: UTC throughout, and an unreadable time is never made up', () => {
  const t = Date.UTC(2026, 9, 20, 5, 20, 14, 109);
  assert.equal(B.utcDay(t), '2026-10-20');
  assert.equal(B.utcClock(t), '05:20');
  assert.equal(B.utcStamp(t), '2026-10-20 05:20:14 UTC');
  for (const bad of [null, undefined, 'x', 0, -1, 1.5, Date.UTC(2100, 0, 1), NaN, {}]) {
    assert.equal(B.utcDay(bad), '');
    assert.equal(B.utcClock(bad), '');
    assert.equal(B.utcStamp(bad), 'time unknown');
  }
  const items = [{ h: 3, timestamp: Date.UTC(2026, 9, 20, 23, 59) }, { h: 2, timestamp: Date.UTC(2026, 9, 20, 0, 0) }, { h: 1, timestamp: Date.UTC(2026, 9, 19, 23, 59) }, { h: 0, timestamp: null }];
  assert.deepEqual(B.groupByDay(items).map((g) => [g.day, g.items.map((i) => i.h)]), [['2026-10-20', [3, 2]], ['2026-10-19', [1]], ['unknown', [0]]]);
  assert.equal(B.fileName('pointcast-devnet-2', 3320), 'pointcast-devnet-2-bloom-3320.svg');
  assert.equal(B.fileName('a/../b', 3320), 'devnet-bloom-3320.svg', 'a file name is never built from an unchecked string');
});

test('the witness sentence says what the rings are, with the real count', () => {
  assert.match(B.witnessSentence(null), /not read, so no outer rings/);
  assert.match(B.witnessSentence({ distinct: 0, correct: 0, strikes: 0 }), /No witness key has signed this checkpoint, so the bloom has no outer rings\./);
  assert.match(B.witnessSentence({ distinct: 1, correct: 1, strikes: 0 }), /^1 distinct witness key signed this checkpoint; 1 agreed with this server’s hash\. 1 thin ring outside the bloom, one per key\.$/);
  assert.match(B.witnessSentence({ distinct: 3, correct: 2, strikes: 1 }), /3 distinct witness keys signed this checkpoint; 2 agreed with this server’s hash and 1 did not\. 3 thin rings outside the bloom, one per key\./);
  assert.match(B.witnessSentence({ distinct: 20, correct: 20, strikes: 0 }), /20 distinct witness keys signed.*14 thin rings are drawn outside the bloom, one per key \(the first 14\)/);
  assert.doesNotMatch(B.witnessSentence({ distinct: 2, correct: 2, strikes: 0 }), /verified|proof of|proved|confirmed/i);
});

test('?devnet= is honoured only for localhost and 127.0.0.1, and a link cannot aim the page at another chain', () => {
  const LIVE = DEVNET.url;
  const same = (r) => r.base === LIVE && !r.local;
  assert.deepEqual(B.resolveApi('', LIVE), { base: LIVE, local: false, rejected: false });
  assert.deepEqual(B.resolveApi('?x=1', `${LIVE}/`), { base: LIVE, local: false, rejected: false });
  assert.deepEqual(B.resolveApi('?devnet=', LIVE), { base: LIVE, local: false, rejected: false });
  for (const [q, base] of [
    ['?devnet=http://127.0.0.1:8799', 'http://127.0.0.1:8799'],
    ['?devnet=http://127.0.0.1:8799/some/path?x=1#y', 'http://127.0.0.1:8799'],
    ['?devnet=http://localhost:8787', 'http://localhost:8787'],
    ['?devnet=https://localhost', 'https://localhost'],
    ['?devnet=http%3A%2F%2F127.0.0.1%3A8799', 'http://127.0.0.1:8799'],
    ['?a=1&devnet=http://LOCALHOST:1', 'http://localhost:1'],
  ]) {
    assert.deepEqual(B.resolveApi(q, LIVE), { base, local: true, rejected: false }, q);
  }
  for (const q of [
    '?devnet=https://pointcast-devnet.mhoydich.workers.dev',
    '?devnet=https://evil.example',
    '?devnet=http://127.0.0.1.evil.example',
    '?devnet=http://localhost.evil.example:8799',
    '?devnet=http://localhost@evil.example',
    '?devnet=http://user:pw@127.0.0.1:8799',
    '?devnet=http://evil.example/127.0.0.1',
    '?devnet=http://evil.example?x=127.0.0.1',
    '?devnet=//127.0.0.1:8799',
    '?devnet=127.0.0.1:8799',
    '?devnet=javascript:alert(1)',
    '?devnet=file:///etc/passwd',
    '?devnet=http://0.0.0.0:8799',
    '?devnet=http://[::1]:8799',
    '?devnet=http://10.0.0.1',
    '?devnet=http://192.168.1.5:8799',
    '?devnet=ftp://127.0.0.1',
    '?devnet=not a url',
  ]) {
    const r = B.resolveApi(q, LIVE);
    assert.ok(same(r) && r.rejected === true, `${q} must be ignored and flagged: ${JSON.stringify(r)}`);
  }
});

// ================================================================ the rules the code lives by

/** Every way browser code could turn a string into markup, a link, a source or a style. Returns what it found. */
function unsafeSinks(source) {
  const body = code(source);
  const rules = {
    innerHTML: /\.\s*(?:innerHTML|outerHTML)\b/,
    insertAdjacentHTML: /insertAdjacentHTML/,
    'document.write': /\.\s*write(?:ln)?\s*\(/,
    contextualFragment: /createContextualFragment/,
    DOMParser: /\bDOMParser\b/,
    eval: /\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(/,
    'set:html': /set:html|dangerouslySetInnerHTML/,
    srcdoc: /\bsrcdoc\b/,
    setAttribute: /\.\s*setAttribute(?:NS|Node)?\s*\(/,
    style: /\.\s*style\b|\.\s*cssText\b|setProperty\s*\(/,
    'href assignment': /\.\s*(?:href|action|formAction|data|poster)\s*=(?!=)(?!\s*blobUrl\b)/,
    'src assignment': /\.\s*src(?:set)?\s*=(?!=)(?!\s*blobUrl\b)/,
    navigation: /\blocation\s*=(?!=)|\blocation\s*\.\s*(?:href|assign|replace)\b|window\s*\.\s*open\s*\(|\bimportScripts\b|\bimport\s*\(/,
    'event attribute': /\bon[a-z]+\s*=\s*["'`]/,
  };
  return Object.entries(rules).filter(([, re]) => re.test(body)).map(([name]) => name);
}

test('the browser code never turns devnet data into markup, an href, a src, an attribute or a style', () => {
  for (const [name, s] of [['bloom-view.js', src.view], ['bloom.js', src.bloom], ['page script', src.page.slice(src.page.indexOf('<script'), src.page.indexOf('</script>'))], ['dialog', src.dialog]]) {
    assert.deepEqual(unsafeSinks(s), [], name);
  }
  assert.match(src.view, /\.textContent = /);
  // The only src and the only href the view sets are blob: URLs it made from an SVG that passed the audit.
  assert.deepEqual([...code(src.view).matchAll(/\.src = (\w+);/g)].map((m) => m[1]), ['blobUrl']);
  assert.deepEqual([...code(src.view).matchAll(/\.href = (\w+);/g)].map((m) => m[1]), ['blobUrl']);
  const view = code(src.view);
  assert.deepEqual([...view.matchAll(/const blobUrl = ([^;]+);/g)].map((m) => m[1]), ['svgUrl(entry, opts)', 'svgUrl(entry, { bare })']);
  assert.match(view, /makeUrl\(new win\.Blob\(\[svgText\(entry, opts\)\], \{ type: 'image\/svg\+xml' \}\)\)/);
  assert.match(view, /return assertCleanSvg\(bloomSvg\(entry\.block\.hash, \{ witnesses, drift \}\)\);/, 'an SVG is shown only after the audit');
  // Hooks and class names are literals; the only attribute-ish assignments are properties on elements the view made.
  assert.doesNotMatch(view, /\.className = (?!cls\b)/);
});

test('the unsafe-sink scan trips when one escape is removed (mutation check)', () => {
  assert.deepEqual(unsafeSinks(src.view), [], 'the real view is clean');
  const mutations = {
    'say() writes innerHTML': [/n\.textContent = msg;/, 'n.innerHTML = msg;', 'innerHTML'],
    'a witness name goes through innerHTML': [/li\.append\(el\('span', 'bl-key__n', k\.name \|\| 'unnamed key'\)\);/, "const t = el('span', 'bl-key__n'); t.innerHTML = k.name; li.append(t);", 'innerHTML'],
    'insertAdjacentHTML on the hash': [/say\('hero-hash', b\.hash\);/, "hero.insertAdjacentHTML('beforeend', b.hash);", 'insertAdjacentHTML'],
    'the hash becomes an image source': [/img\.src = blobUrl;/, 'img.src = entry.block.hash;', 'src assignment'],
    'a link built from a block field': [/a\.href = blobUrl;/, 'a.href = entry.block.hash;', 'href assignment'],
    'an attribute set from data': [/img\.alt = `Abstract bloom/, "img.setAttribute('title', entry.block.hash); img.alt = `Abstract bloom", 'setAttribute'],
    'a style from data': [/say\('hero-time', utcStamp\(b\.timestamp\)\);/, "heroImg.style.background = b.hash;", 'style'],
    'the hash is parsed as a document': [/say\('hero-hash', b\.hash\);/, "new DOMParser().parseFromString(b.hash, 'text/html');", 'DOMParser'],
    'a hash is evaluated': [/say\('hero-hash', b\.hash\);/, 'eval(b.hash);', 'eval'],
    'document.write': [/say\('hero-hash', b\.hash\);/, 'doc.write(b.hash);', 'document.write'],
    'writeln': [/say\('hero-hash', b\.hash\);/, 'doc.writeln(b.hash);', 'document.write'],
  };
  for (const [what, [from, to, rule]] of Object.entries(mutations)) {
    assert.match(src.view, from, `the mutation "${what}" has something to replace`);
    const found = unsafeSinks(src.view.replace(from, to));
    assert.ok(found.length > 0, `the scan missed: ${what}`);
    assert.ok(found.includes(rule), `${what} should trip ${rule}, tripped ${found}`);
  }
  assert.ok(unsafeSinks('document.write(x)').includes('document.write'));
  // The scan does not cry wolf at the clipboard or at notes about the rules.
  assert.deepEqual(unsafeSinks("await win.navigator.clipboard.writeText(text); // never innerHTML\n/* setAttribute */"), []);
});

test('lazy: importing either module touches no network; reads wait for load, an idle callback and a visible tab', async () => {
  const realFetch = globalThis.fetch;
  let fetched = 0;
  globalThis.fetch = () => { fetched += 1; throw new Error('no fetch at import'); };
  try {
    await import(`../public/chain/apps/bloom.js?lazy=${Date.now()}`);
    await import(`../public/chain/apps/bloom-view.js?lazy=${Date.now()}`);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched, 0);
  // The page script is one inline module that only calls start(); no fetch of its own.
  const pageScript = src.page.slice(src.page.indexOf('<script'), src.page.indexOf('</script>'));
  assert.doesNotMatch(pageScript, /fetch\s*\(/);
  assert.match(pageScript, /import \{ start \} from '\/chain\/apps\/bloom-view\.js';/);
  const view = code(src.view);
  for (const needle of ["visibilityState !== 'hidden'", "addEventListener('load'", 'requestIdleCallback', 'IntersectionObserver', 'REFRESH_MS = 60_000', 'POOL = 6', 'CHUNK = 24', "credentials: 'omit'", "referrerPolicy: 'no-referrer'", "cache: 'no-store'", 'MAX_BODY_CHARS']) {
    assert.ok(view.includes(needle), needle);
  }
  // fetch is only ever called from inside a function, never at module level.
  for (const m of view.matchAll(/\bfetch(?:Impl)?\s*\(/g)) {
    const before = view.slice(0, m.index);
    assert.ok((before.match(/\{/g) ?? []).length - (before.match(/\}/g) ?? []).length > 0, `a fetch at ${m.index} is at top level`);
  }
  // Only GET reads of five routes; never a POST, a PUT, a body, a header of ours.
  assert.doesNotMatch(view, /method\s*:|body\s*:|headers\s*:|XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
  const routes = [...view.matchAll(/getJson\(([`'])([^`']+)\1\)/g)].map((m) => m[2]).sort();
  assert.deepEqual(routes, ['/checkpoints?from=${w.from}&to=${w.to}', '/checkpoints/${h}/witnesses', '/raw/block/${next}', '/block/${h}', '/status'].sort());
});

// ================================================================ the browser side, run in jsdom

const T0 = Date.UTC(2026, 9, 18, 0, 0, 0);
const GEN = DEVNET.genesis;
const hashOf = (h) => sha256(`devnet-block-${h}`);
const tsOf = (h) => T0 + h * 300_000;

function fakeDevnet({ tip = 1507, genesis = GEN, chainId = 'pointcast-devnet-2', witnesses = {}, staleRange = [], hostile = null, down = false, slow = 0, control = {} } = {}) {
  const log = [];
  let inflight = 0;
  let maxInflight = 0;
  const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)) });
  const route = (u) => {
    const p = u.pathname;
    if (down) throw new TypeError('network down');
    // a witness list that cannot be read (control.witnessDown) while everything else answers
    if (control.witnessDown && /^\/checkpoints\/\d+\/witnesses$/.test(p)) return reply(500, { error: 'boom' });
    if (p === '/status') return reply(200, { network: 'devnet', chain_id: hostile?.chainId ?? chainId, genesis_hash: genesis, height: tip, tip_timestamp: tsOf(tip), terms: hostile ? '<b>x</b>' : 'x' });
    let m;
    if ((m = /^\/block\/(\d+)$/.exec(p))) {
      const h = Number(m[1]);
      if (h < 1 || h > tip) return reply(404, { error: 'no such block' });
      const hs = hostile?.badHashAt?.includes(h) ? '<img src=x onerror="window.__pwned=1">' : hashOf(h);
      return reply(200, { network: 'devnet', hash: hs, height: h, prev_hash: hashOf(h - 1), state_root: hashOf(h + 1000), timestamp: tsOf(h), txs: [] });
    }
    if ((m = /^\/raw\/block\/(\d+)$/.exec(p))) {
      const h = Number(m[1]);
      if (h < 1 || h > tip) return reply(404, { error: 'no such block' });
      return reply(200, { header: { height: h, prev_hash: hostile?.badParent ? hashOf(9) : hashOf(h - 1), timestamp: tsOf(h) }, txs: [] });
    }
    if ((m = /^\/checkpoints\/(\d+)\/witnesses$/.exec(p))) {
      const h = Number(m[1]);
      if (h > tip) return reply(404, { error: 'no' });
      const list = witnesses[h] ?? [];
      return reply(200, { network: 'devnet', height: h, block_hash: hashOf(h), sealed: true, distinct: list.length, correct: list.filter((w) => w.result === 'correct').length, strikes: list.filter((w) => w.result === 'mismatch').length, witnesses: list, more: 0 });
    }
    if (p === '/checkpoints') {
      const from = Number(u.searchParams.get('from'));
      const to = Number(u.searchParams.get('to'));
      if (!(to - from <= 1000)) return reply(400, { error: 'span at most 1000 heights' });
      const cps = Object.keys(witnesses).map(Number).filter((h) => h >= from && h <= to && !staleRange.includes(h)).sort((a, b) => a - b).map((h) => ({ height: h, distinct: witnesses[h].length, correct: witnesses[h].filter((w) => w.result === 'correct').length, strikes: witnesses[h].filter((w) => w.result === 'mismatch').length }));
      return reply(200, { network: 'devnet', interval: 10, from, to, checkpoints: cps });
    }
    return reply(404, { error: 'no such route' });
  };
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    log.push({ path: `${u.pathname}${u.search}`, origin: u.origin, init });
    inflight += 1;
    maxInflight = Math.max(maxInflight, inflight);
    try {
      await new Promise((r) => setTimeout(r, slow));
      return route(u);
    } finally {
      inflight -= 1;
    }
  };
  return { fetch, log, maxInflight: () => maxInflight, setDown: (v) => { down = v; }, control };
}

/** The real markup: the page's and the dialog's .astro source with frontmatter, scripts, styles, components and {expressions} stripped. */
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
  const dialog = strip(src.dialog);
  const page = strip(src.page).replace(/<BloomDialog\s*\/>/, dialog).replace(/<(?:ChainHeader|ResetNotice)[^>]*\/>/g, '');
  const start = page.indexOf('<div\n      class="chn bl"');
  const end = page.lastIndexOf('</BlockLayout>');
  return `<!doctype html><html><body>${page.slice(start, end).replace(/<\/div>\s*<\/div>\s*$/, '</div>')}</div></body></html>`;
}

// Every jsdom window a test opens is closed when the file ends, so a failed test cannot leave a refresh timer running.
const windows = new Set();
after(() => { for (const w of windows) w.close(); });

const ringCount = (svg) => (svg.match(/<circle cx="500" cy="500" r="\d+" fill="none" stroke="#f2d48a"/g) ?? []).length;

const until = async (pred, label = 'condition', ms = 4000) => {
  const t = Date.now();
  while (!pred()) {
    if (Date.now() - t > ms) throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 4));
  }
};

async function boot({ url = 'http://127.0.0.1:4399/chain/bloom', viewUrl, observer = false, hidden = false, loadLater = false, ...devnetOpts } = {}) {
  const dev = fakeDevnet(devnetOpts);
  const dom = new JSDOM(skeleton(), { url, pretendToBeVisual: true });
  const w = dom.window;
  windows.add(w);
  const app = w.document.querySelector('[data-bloom="app"]');
  assert.ok(app, 'the page has its app root');
  app.dataset.api = DEVNET.url;
  app.dataset.genesis = GEN;
  app.dataset.chain = DEVNET.chainId;
  const blobs = new Map();
  let n = 0;
  const createObjectURL = (blob) => { const u = `blob:test/${++n}`; blobs.set(u, blob); return u; };
  if (hidden) Object.defineProperty(w.document, 'visibilityState', { value: 'hidden', configurable: true });
  const observers = [];
  if (observer) {
    w.IntersectionObserver = class { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} disconnect() {} };
  }
  // jsdom has no layout, so everything is at the top: put the grid's sentinel far below the screen, as it is in a browser.
  app.querySelector('[data-bl="sentinel"]').getBoundingClientRect = () => ({ top: 9999 });
  app.querySelector('[data-bl="recipe-code"]').textContent = recipeParts().text;
  const view = await import(viewUrl ?? `../public/chain/apps/bloom-view.js?boot=${Math.random()}`);
  const idle = (fn) => Promise.resolve().then(fn);
  // A page that is still loading: the document says so until the test lets the load event happen.
  if (loadLater) Object.defineProperty(w.document, 'readyState', { value: 'loading', configurable: true });
  const handle = view.start(app, { fetch: dev.fetch, createObjectURL, idle });
  if (!loadLater && w.document.readyState !== 'complete') await new Promise((r) => w.addEventListener('load', r, { once: true }));
  const finishLoading = () => {
    Object.defineProperty(w.document, 'readyState', { value: 'complete', configurable: true });
    w.dispatchEvent(new w.Event('load'));
  };
  const q = (name) => app.querySelector(`[data-bl="${name}"]`);
  const text = (name) => q(name).textContent;
  const blobText = (u) => new Promise((res, rej) => { const fr = new w.FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsText(blobs.get(u)); });
  return { dom, w, app, dev, handle, q, text, blobs, blobText, observers, finishLoading, close: () => w.close() };
}

test('the real markup carries every hook the view uses, and every hook in the markup is used', () => {
  const html = skeleton();
  const dom = new JSDOM(html);
  const have = new Set([...dom.window.document.querySelectorAll('[data-bl]')].map((n) => n.dataset.bl));
  const acts = new Set([...dom.window.document.querySelectorAll('[data-bl-act]')].map((n) => n.getAttribute('data-bl-act')));
  const view = code(src.view);
  const used = new Set([...view.matchAll(/(?:hook|hooks|say)\(\s*'([a-z-]+)'/g)].map((m) => m[1]));
  for (const k of ['d-hash', 'd-time', 'd-local', 'd-chain', 'd-link', 'd-witness', 'd-palette', 'd-ring-note', 'd-call', 'd-get']) used.add(k);
  for (const m of view.matchAll(/hooks?\(['"]([a-z-]+)['"]\)/g)) used.add(m[1]);
  for (const k of used) assert.ok(have.has(k), `the view uses data-bl="${k}" and the markup has none`);
  for (const k of have) assert.ok(used.has(k) || ['dialog', 'recipe-code'].includes(k), `data-bl="${k}" is in the markup and nothing uses it`);
  assert.deepEqual([...acts].sort(), ['d', 'hero']);
  for (const g of acts) assert.match(view, new RegExp(`acts\\('${g}'\\)`));
  // Unique where the view uses hook(), repeated only where it uses hooks() (the two drift switches).
  const counts = new Map();
  for (const n of dom.window.document.querySelectorAll('[data-bl]')) counts.set(n.dataset.bl, (counts.get(n.dataset.bl) ?? 0) + 1);
  const many = new Set([...view.matchAll(/hooks\('([a-z-]+)'\)/g)].map((m) => m[1]));
  for (const [k, c] of counts) if (c > 1) assert.ok(many.has(k), `${k} is repeated in the markup but the view reads it with hook(), not hooks()`);
  assert.deepEqual([...many].sort(), ['drift', 'rm-note']);
  assert.ok(dom.window.document.querySelector('dialog[aria-labelledby="bl-d-title"]'));
  assert.ok(dom.window.document.getElementById('bl-d-title'));
});

test('nothing is read before the load event, an idle callback and a visible tab', async () => {
  const early = await boot({ loadLater: true });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(early.dev.log.length, 0, 'no request while the page is still loading');
  early.finishLoading();
  await until(() => early.dev.log.length > 0, 'the first read after the load event');
  assert.equal(early.dev.log[0].path, '/status');
  early.close();

  const hiddenTab = await boot({ hidden: true });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(hiddenTab.dev.log.length, 0, 'no request from a hidden tab');
  hiddenTab.close();

  const live = await boot({ observer: true });
  await until(() => live.app.dataset.hero === 'live', 'the hero');
  assert.ok(live.dev.log.length > 0);
  assert.deepEqual([...new Set(live.dev.log.map((r) => r.origin))], [DEVNET.url], 'only the devnet is ever asked');
  for (const r of live.dev.log) {
    assert.equal(r.init.method, undefined, 'GET only');
    assert.equal(r.init.credentials, 'omit');
    assert.equal(r.init.referrerPolicy, 'no-referrer');
    assert.equal(r.init.cache, 'no-store');
    assert.equal(r.init.body, undefined);
  }
  assert.deepEqual(live.dev.log.map((r) => r.path).filter((p) => !p.startsWith('/block/') && !p.startsWith('/checkpoints/') && p !== '/status'), [], 'before any scrolling: status, the latest block and its witnesses');
  live.close();
});

test('the hero shows the latest checkpoint from the devnet: height, hash, time, witnesses, and a bloom drawn from that hash', async () => {
  const keys = [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1', result: 'correct' }, { addr: 'tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd', name: 'claude-code', result: 'correct' }];
  const t = await boot({ tip: 1507, witnesses: { 1500: keys } });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  assert.equal(t.app.dataset.state, 'live');
  assert.equal(t.text('hero-height'), '№1,500');
  assert.equal(t.text('hero-hash'), hashOf(1500));
  assert.equal(t.text('hero-time'), B.utcStamp(tsOf(1500)));
  assert.match(t.text('hero-witness'), /^2 distinct witness keys signed this checkpoint; 2 agreed with this server’s hash\. 2 thin rings outside the bloom, one per key\.$/);
  assert.match(t.text('hero-kicker'), /^LATEST CHECKPOINT · BLOCK 1,500$/);
  assert.match(t.text('status'), /^Live from pointcast-devnet-2: the latest checkpoint is block 1,500\.$/);
  const img = t.q('hero-img');
  assert.match(img.src, /^blob:test\//);
  const svg = await t.blobText(img.src);
  assert.equal(svg, B.bloomSvg(hashOf(1500), { witnesses: 2 }), 'the picture is the bloom of that exact hash, with two rings');
  assert.deepEqual(B.auditSvg(svg), []);
  assert.equal(t.q('hero-open').disabled, false);
  for (const b of t.app.querySelectorAll('[data-bl-act="hero"]')) assert.equal(b.disabled, false);
  assert.match(t.q('hero-img').alt, /^Abstract bloom drawn from the hash of block 1,500$/);
  t.close();
});

test('the grid reads 24 checkpoints at a time, six requests at a time, grouped by UTC day, newest first', async () => {
  const t = await boot({ tip: 1507, slow: 2, witnesses: { 1490: [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1', result: 'correct' }] } });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  await until(() => /^24 of 120 checkpoints read/.test(t.text('grid-status')), 'the first chunk');
  assert.ok(t.dev.maxInflight() <= 6, `at most six requests at a time (saw ${t.dev.maxInflight()})`);
  const tiles = [...t.app.querySelectorAll('.bl-tile')];
  assert.deepEqual(tiles.slice(0, 3).map((b) => b.dataset.h), ['1500', '1490', '1480']);
  assert.equal(tiles.at(-1).dataset.h, String(1500 - 230));
  // 300 blocks a day (5 minutes each): 1500 -> day 5, and the day changes at 1200.
  const heads = [...t.app.querySelectorAll('.bl-day__h')].map((h) => h.textContent.replace(/\s+/g, ' ').trim());
  // 288 blocks a day: block 1500 is on day 5 of the run (2026-10-23), which began at block 1440.
  assert.deepEqual(heads, ['2026-10-23 UTC · 7 checkpoints', '2026-10-22 UTC · 17 checkpoints']);
  assert.match(t.text('grid-status'), /^24 of 120 checkpoints read, newest first\./);
  assert.equal(t.q('more').hidden, false);
  // witness count from the range read shows on the tile and in the bloom
  const w = t.app.querySelector('.bl-tile[data-h="1490"]');
  assert.match(w.textContent, /1 key/);
  assert.match(t.app.querySelector('.bl-tile[data-h="1500"]').textContent, /№1,500\s*\d\d:\d\d/);
  const first = await t.blobText(tiles[0].querySelector('img').src);
  assert.equal(first, B.bloomSvg(hashOf(1500)));
  assert.equal(await t.blobText(w.querySelector('img').src), B.bloomSvg(hashOf(1490), { witnesses: 1 }));
  // "Load older" reads the next 24, and the grid stops at 120.
  for (let i = 0; i < 6; i++) { t.q('more').click(); await new Promise((r) => setTimeout(r, 60)); }
  await until(() => t.app.querySelectorAll('.bl-tile').length === 120, 'all 120');
  assert.equal(t.app.querySelectorAll('.bl-tile').length, 120);
  assert.equal(t.q('more').hidden, true);
  assert.ok(t.dev.maxInflight() <= 6);
  const days = [...t.app.querySelectorAll('.bl-day__h')].map((h) => h.textContent.replace(/\s+/g, ' ').trim().slice(0, 10));
  assert.deepEqual(days, [...days].sort().reverse(), 'days run newest to oldest');
  assert.equal(new Set(days).size, days.length, 'each day appears once');
  // a read window for /checkpoints never spans more than the devnet allows
  for (const r of t.dev.log.filter((x) => x.path.startsWith('/checkpoints?'))) {
    const u = new URL(r.path, 'http://x');
    assert.ok(Number(u.searchParams.get('to')) - Number(u.searchParams.get('from')) <= 1000);
  }
  t.close();
});

test('lazy grid: with an IntersectionObserver nothing past the hero is read until the grid nears the screen', async () => {
  const t = await boot({ tip: 1507, observer: true });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(t.app.querySelectorAll('.bl-tile').length, 0);
  assert.equal(t.dev.log.filter((r) => /^\/block\//.test(r.path)).length, 1, 'only the hero block');
  assert.equal(t.observers.length, 1);
  t.observers[0].cb([{ isIntersecting: false }]);
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(t.app.querySelectorAll('.bl-tile').length, 0, 'not intersecting: still nothing');
  t.observers[0].cb([{ isIntersecting: true }]);
  await until(() => t.app.querySelectorAll('.bl-tile').length === 24, 'the first chunk');
  t.close();
});

test('the large view: height, hash, UTC and local time, the parent link, the witness list, the recipe, and a download of the bloom as drawn', async () => {
  const keys = [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1', result: 'correct' }, { addr: 'tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd', name: '', result: 'mismatch' }];
  const t = await boot({ tip: 1507, witnesses: { 1490: keys } });
  await until(() => t.app.querySelectorAll('.bl-tile').length === 24, 'the first chunk');
  const dialog = t.q('dialog');
  assert.equal(dialog.open, false);
  const tile = t.app.querySelector('.bl-tile[data-h="1490"]');
  tile.focus();
  tile.click();
  await until(() => t.text('d-hash') === hashOf(1490), 'the large view');
  await until(() => /names this hash as its parent/.test(t.text('d-link')), 'the parent link check');
  assert.equal(dialog.open, true);
  assert.equal(t.text('d-title'), 'Checkpoint №1,490');
  assert.equal(t.text('d-height'), '1,490');
  assert.equal(t.text('d-time'), B.utcStamp(tsOf(1490)));
  assert.notEqual(t.text('d-local'), '…');
  assert.match(t.text('d-chain'), /^pointcast-devnet-2 · genesis a720735b…$/);
  assert.match(t.text('d-link'), /^The next block \(№1,491\) names this hash as its parent: the devnet’s own chain agrees with itself\.$/);
  assert.match(t.text('d-witness'), /^2 distinct witness keys signed this checkpoint; 1 agreed with this server’s hash and 1 did not\./);
  const names = [...t.q('d-keys').querySelectorAll('li')].map((li) => [...li.children].map((c) => c.textContent));
  assert.deepEqual(names, [['house-runner-1', 'tz1YKK…5No2', 'agreed with this server’s hash'], ['unnamed key', B.shortAddr('tz1W5HN6PoFW8YvDCcrPtQmQwYLWYTWf8Rkd'), 'did not match this server’s hash']]);
  assert.equal(t.text('d-call'), `bloom('${hashOf(1490)}')`);
  assert.equal(t.text('d-get'), `GET ${DEVNET.url}/block/1490`);
  assert.equal(t.text('d-palette'), B.paletteOf(B.bloom(hashOf(1490))).join('  '));
  assert.match(t.text('d-ring-note'), /draws 2 extra circles for the witness keys, at radius 390 \+ 7 × k\. “Bare bloom” leaves them out: that file is byte for byte what the recipe prints\./);
  assert.equal(t.q('d-bare').hidden, false);
  assert.equal(t.q('d-img').src.startsWith('blob:test/'), true);
  assert.equal(await t.blobText(t.q('d-img').src), B.bloomSvg(hashOf(1490), { witnesses: 2 }));
  assert.equal(t.w.location.hash, '#cp-1490', 'the large view has a link');
  assert.equal(t.q('d-yard').hidden, false);
  assert.match(t.app.querySelector('[data-bl="recipe-code"]').textContent, /export function bloom\(hash\) \{/);
  // the next and previous checkpoints, by button and by arrow key
  assert.equal(t.q('d-newer').disabled, false);
  t.q('d-newer').click();
  await until(() => t.text('d-hash') === hashOf(1500), 'the newer checkpoint');
  assert.equal(t.q('d-newer').disabled, true, 'no checkpoint is newer than the latest');
  dialog.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await until(() => t.text('d-hash') === hashOf(1490), 'ArrowLeft goes back one checkpoint');
  dialog.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, ctrlKey: true }));
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(t.text('d-hash'), hashOf(1490), 'a modified arrow key is left alone');
  // downloads: the bloom as drawn, then the bare recipe output
  const saved = [];
  const realClick = t.w.HTMLAnchorElement.prototype.click;
  t.w.HTMLAnchorElement.prototype.click = function () { saved.push({ href: this.href, name: this.download }); };
  t.q('d-save').click();
  t.q('d-bare').click();
  t.w.HTMLAnchorElement.prototype.click = realClick;
  assert.equal(saved.length, 2);
  assert.deepEqual(saved.map((s) => s.name), ['pointcast-devnet-2-bloom-1490.svg', 'pointcast-devnet-2-bloom-1490.svg']);
  assert.equal(await t.blobText(saved[0].href), B.bloomSvg(hashOf(1490), { witnesses: 2 }));
  assert.equal(await t.blobText(saved[1].href), B.bloom(hashOf(1490)), 'the bare download is exactly the recipe output');
  assert.match(t.text('d-status'), /Bare bloom for block 1,490 saved\. It is a drawing of a devnet checkpoint: free, no price, not a token\./);
  // close: focus goes back, the link goes away
  t.q('d-close').click();
  assert.equal(dialog.open, false);
  assert.equal(t.w.location.hash, '');
  t.close();
});

test('copy buttons copy the hash, the recipe and the call, and say so; they say so when copying is refused', async () => {
  const t = await boot({ tip: 1507 });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  const copied = [];
  Object.defineProperty(t.w.navigator, 'clipboard', { value: { writeText: async (s) => { copied.push(s); } }, configurable: true });
  t.q('hero-copy').click();
  await until(() => copied.length === 1, 'a copy');
  assert.equal(copied[0], hashOf(1500));
  assert.equal(t.text('hero-status'), 'Copied the block hash.');
  t.q('hero-large').click();
  await until(() => t.text('d-hash') === hashOf(1500), 'the large view');
  t.q('d-copy-recipe').click();
  t.q('d-copy-call').click();
  t.q('d-copy-hash').click();
  await until(() => copied.length === 4, 'three more copies');
  assert.equal(copied[1], recipeParts().text, 'the copy button copies exactly the printed recipe');
  assert.equal(copied[2], `bloom('${hashOf(1500)}')`);
  assert.equal(copied[3], hashOf(1500));
  assert.equal(t.text('d-status'), 'Copied the block hash.');
  Object.defineProperty(t.w.navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } }, configurable: true });
  t.q('d-copy-hash').click();
  await until(() => /Could not copy the block hash/.test(t.text('d-status')), 'a refusal');
  t.close();
});

test('the drift is off by default, also under reduced motion, and only the visitor turns it on', async () => {
  const t = await boot({ tip: 1507 });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  const boxes = [...t.app.querySelectorAll('[data-bl="drift"]')];
  assert.equal(boxes.length, 2);
  for (const b of boxes) { assert.equal(b.checked, false); assert.equal(b.type, 'checkbox'); }
  assert.doesNotMatch(await t.blobText(t.q('hero-img').src), /animate/);
  boxes[0].checked = true;
  boxes[0].dispatchEvent(new t.w.Event('change'));
  assert.equal(boxes[1].checked, true, 'the two switches stay together');
  assert.match(await t.blobText(t.q('hero-img').src), /<animateTransform attributeName="transform" type="rotate" from="0 500 500" to="360 500 500" dur="240s" repeatCount="indefinite"\/>/);
  assert.deepEqual(B.auditSvg(await t.blobText(t.q('hero-img').src)), []);
  boxes[0].checked = false;
  boxes[0].dispatchEvent(new t.w.Event('change'));
  assert.doesNotMatch(await t.blobText(t.q('hero-img').src), /animate/);
  // the page never animates anything of its own
  assert.doesNotMatch(src.page, /@keyframes|animation\s*:\s*(?!none)|animation-name|transition\s*:\s*(?!none)/);
  assert.doesNotMatch(src.view, /requestAnimationFrame|\.animate\(|setInterval/);
  assert.match(src.page, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(src.page, /scroll-behavior:auto !important;transition:none !important;animation:none !important/);
  t.close();
});

test('the hero keeps the witness count it read in detail when the grid’s range read is older', async () => {
  const key = [{ addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: 'house-runner-1', result: 'correct' }];
  const t = await boot({ tip: 1507, witnesses: { 1500: key }, staleRange: [1500] });
  await until(() => t.app.dataset.hero === 'live' && /^24 of 120/.test(t.text('grid-status')), 'the hero and the first chunk');
  assert.equal(ringCount(await t.blobText(t.q('hero-img').src)), 1, 'the hero has its ring');
  assert.match(t.app.querySelector('.bl-tile[data-h="1500"]').textContent, /1 key/, 'the hero’s tile agrees with the hero, not with the older range read');
  assert.equal(ringCount(await t.blobText(t.app.querySelector('.bl-tile[data-h="1500"] img').src)), 1);
  const box = t.app.querySelector('[data-bl="drift"]');
  box.checked = true;
  box.dispatchEvent(new t.w.Event('change'));
  const drifting = await t.blobText(t.q('hero-img').src);
  assert.match(drifting, /animateTransform/);
  assert.equal(ringCount(drifting), 1, 'turning the drift on does not lose the ring');
  t.close();
});

test('the polite status line is written only when its words change: a refresh that says the same thing says nothing', async () => {
  const t = await boot({ tip: 1507 });
  await until(() => t.app.dataset.state === 'live', 'the live state');
  const status = t.q('status');
  assert.equal(status.getAttribute('aria-live'), 'polite');
  const first = status.textContent;
  assert.match(first, /^Live from pointcast-devnet-2: the latest checkpoint is block 1,500\.$/);
  const seen = [];
  const mo = new t.w.MutationObserver((list) => { for (const m of list) seen.push(m.target.textContent); });
  mo.observe(status, { childList: true, characterData: true, subtree: true });
  for (let i = 0; i < 3; i++) await t.handle.refresh();
  await new Promise((r) => setTimeout(r, 10));
  assert.deepEqual(seen, [], 'three refreshes of an unchanged chain wrote nothing to the live region: ' + JSON.stringify(seen));
  assert.equal(status.textContent, first);
  // a real change is announced: the devnet goes away, and the same failure again is not announced twice
  t.dev.setDown(true);
  await t.handle.refresh();
  await new Promise((r) => setTimeout(r, 10));
  assert.match(status.textContent, /^devnet unreachable/);
  const afterDown = seen.length;
  assert.ok(afterDown > 0, 'going down is announced');
  await t.handle.refresh();
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(seen.length, afterDown, 'the same failure on the next try is not announced again');
  t.dev.setDown(false);
  await t.handle.refresh();
  await new Promise((r) => setTimeout(r, 10));
  assert.match(status.textContent, /^Live from /);
  assert.ok(seen.length > afterDown, 'coming back is announced');
  mo.disconnect();
  t.close();
});

test('the reduced-motion note appears only when the system asks for reduced motion', async () => {
  const dev = fakeDevnet();
  for (const [matches, hidden] of [[true, false], [false, true]]) {
    const dom = new JSDOM(skeleton(), { url: 'http://127.0.0.1:4399/chain/bloom' });
    windows.add(dom.window);
    const app = dom.window.document.querySelector('[data-bloom="app"]');
    app.dataset.api = DEVNET.url;
    app.dataset.genesis = GEN;
    dom.window.matchMedia = (q) => ({ matches: matches && /reduce/.test(q) });
    const view = await import(`../public/chain/apps/bloom-view.js?rm=${Math.random()}`);
    view.start(app, { fetch: dev.fetch, createObjectURL: () => 'blob:x', idle: (f) => Promise.resolve().then(f) });
    await new Promise((r) => dom.window.addEventListener('load', r, { once: true }));
    for (const n of app.querySelectorAll('[data-bl="rm-note"]')) assert.equal(n.hidden, hidden);
    dom.window.close();
  }
});

test('a hash route opens the large view for that checkpoint, and only for a real one', async () => {
  const t = await boot({ tip: 1507, url: 'http://127.0.0.1:4399/chain/bloom#cp-1450' });
  await until(() => t.text('d-hash') === hashOf(1450), 'the routed checkpoint');
  assert.equal(t.q('dialog').open, true);
  t.close();
  for (const bad of ['#cp-1455', '#cp-0', '#cp-1600', '#cp-abc', '#cp-1450<img>', '#cp-99999999999']) {
    const u = await boot({ tip: 1507, url: `http://127.0.0.1:4399/chain/bloom${bad}` });
    await until(() => u.app.dataset.hero === 'live', 'the hero');
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(u.q('dialog').open, false, bad);
    u.close();
  }
});

test('honest failure: an unreachable devnet says so and keeps the last read; a bad reply says it was not accepted', async () => {
  const t = await boot({ down: true });
  await until(() => t.app.dataset.state === 'down', 'the down state');
  assert.match(t.text('status'), /^devnet unreachable\. It may be restarting or paused; this tries again soon\.$/);
  assert.equal(t.text('clock'), 'devnet unreachable');
  assert.equal(t.q('hero-open').disabled, true);
  assert.doesNotMatch(t.q('hero-img').getAttribute('src') ?? '', /^blob:/, 'the printed placeholder stays; no bloom of an unread hash is drawn');
  t.close();

  const odd = await boot({ hostile: { chainId: 'x"><img src=x onerror=1>' } });
  await until(() => odd.app.dataset.state === 'odd', 'the odd state');
  assert.match(odd.text('status'), /^The devnet answered, but not with what a checkpoint looks like/);
  assert.equal(odd.app.querySelectorAll('.bl-tile').length, 0);
  assert.equal(odd.app.querySelector('[src="x"]'), null);
  odd.close();

  const none = await boot({ tip: 7 });
  await until(() => none.app.dataset.state === 'none', 'the none state');
  assert.match(none.text('status'), /^The devnet is at height 7\. The first checkpoint is block 10, so there is nothing to draw yet\./);
  none.close();
});

test('after a failed read the page looks again sooner: 8 s, 16 s, 32 s, then once a minute', async () => {
  const view = await import(`../public/chain/apps/bloom-view.js?delay=${Math.random()}`);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 20].map(view.retryDelay), [60_000, 8_000, 16_000, 32_000, 60_000, 60_000, 60_000]);
  assert.equal(view.REFRESH_MS, 60_000);
  assert.equal(view.TIMEOUT_MS, 8_000);
});

test('a tile that cannot be read says so, can be retried, and never takes the grid down', async () => {
  const t = await boot({ tip: 1507, hostile: { badHashAt: [1480, 1470] } });
  await until(() => t.app.querySelectorAll('.bl-tile').length === 24, 'the first chunk');
  const missing = [...t.app.querySelectorAll('.bl-tile.is-missing')];
  assert.deepEqual(missing.map((m) => m.dataset.h), ['1480', '1470']);
  assert.match(missing[0].textContent, /not read/);
  assert.equal(t.q('retry').hidden, false);
  assert.match(t.text('grid-status'), /2 could not be read\./);
  assert.equal(t.app.querySelector('[src="x"]'), null);
  assert.equal(t.w.__pwned, undefined);
  t.close();
});

test('the genesis pin: a chain with another genesis is named, and nothing is drawn from it', async () => {
  const other = sha256('another chain');
  const t = await boot({ genesis: other });
  await until(() => t.app.dataset.state === 'pin', 'the pin state');
  assert.match(t.text('status'), new RegExp(`^GENESIS CHANGED\\. This page pins genesis ${GEN.slice(0, 8)}… and the chain at the devnet URL answers with ${other.slice(0, 8)}…\\.`));
  assert.match(t.text('status'), /A reset is dated and recorded, never silent/);
  assert.match(t.text('status'), /\/chain\/yard\/devnet-1\//);
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(t.app.querySelectorAll('.bl-tile').length, 0);
  assert.equal(t.dev.log.filter((r) => /^\/(block|checkpoints)/.test(r.path)).length, 0, 'not one checkpoint is read from a chain this page has not pinned');
  assert.equal(t.q('hero-open').disabled, true);
  t.close();
});

test('?devnet= on 127.0.0.1 reads that devnet without the pin and says it is local; elsewhere it is ignored and said', async () => {
  const local = 'http://127.0.0.1:8799';
  const t = await boot({ url: `http://127.0.0.1:4399/chain/bloom?devnet=${encodeURIComponent(local)}`, genesis: sha256('a local genesis') });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  assert.deepEqual([...new Set(t.dev.log.map((r) => r.origin))], [local]);
  assert.match(t.text('status'), /^LOCAL devnet at http:\/\/127\.0\.0\.1:8799, not the public chain\. Live from pointcast-devnet-2:/);
  assert.equal(t.q('d-yard').hidden, true, 'no link to the public Block Yard for a local chain');
  t.close();

  const e = await boot({ url: `http://127.0.0.1:4399/chain/bloom?devnet=${encodeURIComponent('https://evil.example')}` });
  await until(() => e.app.dataset.hero === 'live', 'the hero');
  assert.deepEqual([...new Set(e.dev.log.map((r) => r.origin))], [DEVNET.url], 'the public devnet is read, never the address in the URL');
  e.close();
});

/** Hostile replies: every string a devnet could send, written to hit markup, links and scripts. */
const HOSTILE = '<img src=x onerror="window.__pwned=1">';
const hostileKeys = [
  { addr: HOSTILE, name: HOSTILE, result: HOSTILE },
  { addr: 'tz1YKK6yoBTVgyrttF9HaA6yfkeRkbgB5No2', name: '<script>window.__pwned=1</script>', result: 'correct' },
  { addr: 'javascript:alert(1)', name: 'a"><svg onload=window.__pwned=1>', result: 'other' },
];

async function hostileRun(viewUrl) {
  const t = await boot({ tip: 1507, viewUrl, witnesses: { 1500: hostileKeys, 1490: hostileKeys }, hostile: { badHashAt: [1480] } });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  await until(() => t.app.querySelectorAll('.bl-tile').length === 24, 'the first chunk');
  t.q('hero-large').click();
  await until(() => !/^…$/.test(t.text('d-witness')) && t.q('d-keys').children.length > 0, 'the keys');
  const injected = () => t.app.querySelectorAll('[src="x"], [onerror], [onload], script, svg').length > 0 || t.w.__pwned !== undefined;
  const result = { injected: injected(), keys: [...t.q('d-keys').querySelectorAll('li')].map((li) => li.textContent), imgs: [...t.app.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '').filter((s) => !/^(?:blob:test\/\d+|data:image\/svg\+xml,.*)$/.test(s)) };
  t.close();
  return result;
}

test('hostile devnet replies stay text: nothing becomes an element, a script or a source', async () => {
  const r = await hostileRun();
  assert.equal(r.injected, false);
  assert.deepEqual(r.imgs, [], 'every image source is a blob: URL made from an audited SVG, or the printed placeholder');
  // Names and addresses that do not look like names and addresses are not shown at all.
  assert.deepEqual(r.keys.map((k) => k.replace(/\s+/g, ' ')), ['unnamed key', 'unnamed keytz1YKK…5No2agreed with this server’s hash', 'unnamed key'].map((k) => k.replace(/\s+/g, ' ')));
  for (const k of r.keys) assert.doesNotMatch(k, /[<>"]|onerror|script|javascript/);
});

test('the hostile run is able to catch an injection: with the checks removed from a copy, the same data does get in (mutation check)', async () => {
  const dirs = [];
  /** A copy of the browser code (and the SDK it imports) in its own directory, so each variant is its own module graph. */
  const variant = (reader, view) => {
    const dir = mkdtempSync(join(tmpdir(), 'bloom-mut-'));
    dirs.push(dir);
    mkdirSync(join(dir, 'apps'), { recursive: true });
    mkdirSync(join(dir, 'sdk'), { recursive: true });
    cpSync(file('public/chain/sdk/pointcast-chain.js'), join(dir, 'sdk/pointcast-chain.js'));
    writeFileSync(join(dir, 'apps/bloom.js'), reader);
    writeFileSync(join(dir, 'apps/bloom-view.js'), view);
    return pathToFileURL(join(dir, 'apps/bloom-view.js')).href;
  };
  try {
    // the name check is dropped, and the key name is written with innerHTML
    const reader = src.bloom.replace('const NAME_RE = /^[a-z0-9-]{2,24}$/;', 'const NAME_RE = /^[\\s\\S]*$/;');
    const view = src.view.replace("li.append(el('span', 'bl-key__n', k.name || 'unnamed key'));", "const t = el('span', 'bl-key__n'); t.innerHTML = k.name || 'unnamed key'; li.append(t);");
    assert.notEqual(reader, src.bloom);
    assert.notEqual(view, src.view);
    const both = await hostileRun(variant(reader, view));
    assert.equal(both.injected, true, 'with the name check and textContent gone, the hostile name becomes an element, and this test sees it');
    assert.ok(unsafeSinks(view).includes('innerHTML'), 'and the static scan sees that mutation too');
    // only the name check dropped: still text, because the sink is textContent
    assert.equal((await hostileRun(variant(reader, src.view))).injected, false, 'textContent alone also holds: the check and the sink are two separate walls');
    // only the sink mutated: still not injected, because the reader refuses the name first
    assert.equal((await hostileRun(variant(src.bloom, view))).injected, false, 'the reader alone also holds');
    // the untouched copy behaves like the real thing
    assert.equal((await hostileRun(variant(src.bloom, src.view))).injected, false);
  } finally {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
  }
});

test('a parent hash that does not match is said, not smoothed over', async () => {
  const t = await boot({ tip: 1507, hostile: { badParent: true } });
  await until(() => t.app.querySelectorAll('.bl-tile').length === 24, 'the first chunk');
  t.app.querySelector('.bl-tile[data-h="1490"]').click();
  await until(() => /names a different parent hash/.test(t.text('d-link')), 'the mismatch');
  assert.match(t.text('d-link'), /Do not trust this bloom until the devnet explains it\.$/);
  t.close();
});

test('the newest checkpoint has no next block to check yet, and the page says that', async () => {
  const t = await boot({ tip: 1500 });
  await until(() => t.app.dataset.hero === 'live', 'the hero');
  t.q('hero-large').click();
  await until(() => /No next block yet/.test(t.text('d-link')), 'the no-next-block line');
  t.close();
});

// ================================================================ the page: structure, copy, design law

const pageText = (s) => s.replace(/^---[\s\S]*?---/, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
const W = (...p) => p.join('');
// The words a fundraising page would use, spelled in pieces so this file does not carry them itself.
const BANNED = [W('u', 'sd'), W('ca', 'sh'), W('inv', 'est'), W('pro', 'fit'), W('ea', 'rn'), W('air', 'drop'), W('real', ' ', 'money'), W('yie', 'ld'), W('sta', 'ke'), W('rede', 'em'), W('back', 'ed')];

test('honest copy: devnet · no value · may reset, devnet-2, a reset is dated and recorded, and the devnet-1 recording as precedent', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  for (const [name, s] of [['page', src.page], ['dialog', src.dialog]]) assert.ok(s.includes('{HONESTY_LINE}'), `${name} prints the honesty line`);
  assert.equal((src.page.match(/data-honesty/g) ?? []).length, 2, 'the line is at the top of the page and again before the footer');
  assert.match(src.page, /<b>\{HONESTY_LINE\}\.<\/b>\s+This is <code>\{DEVNET\.chainId\}<\/code>\. One server runs it and it can reset; a reset is dated and recorded, never silent\./);
  assert.match(src.page, /devnet-1 is kept as a recording you can replay at\s+<a href=\{DEVNET_PREVIOUS\.path\}>/);
  assert.equal(DEVNET.chainId, 'pointcast-devnet-2');
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.match(src.page, /CHAIN · CHECKPOINT BLOOMS · PUBLIC DEVNET-2 · NO VALUE · MAY RESET, NEVER SILENTLY/);
  assert.match(src.page, /ResetNotice/);
  const notYetBlock = NOT_LIST.join(' ');
  assert.match(notYetBlock, /Free to look at, free to download\. There is no price and no sale\./);
  assert.match(notYetBlock, /Not tokens\./);
  assert.match(notYetBlock, /A reset is dated and recorded: devnet-1 is kept as a recording you can replay at \/chain\/yard\/devnet-1\//);
  assert.match(notYetBlock, /Not proof\. A witness ring is one more accountable claim/);
  // A witness or a stamp is an accountable claim, never proof of truth
  assert.match(src.dialog, /A witness is an accountable claim, not proof of truth/);
  assert.doesNotMatch(src.page + src.dialog + src.data + src.view, /\b(?:proves?|proven|verified by|guarantee[sd]?|certif(?:y|ies|ied))\b/i);
  // Nothing is sold, bid on or minted here: the only price word is "no price".
  const copy = pageText(src.page + src.dialog) + HOW_STEPS.map((s) => s.v).join(' ') + NOT_LIST.join(' ');
  assert.doesNotMatch(copy, /\bauction|\bbid\b|\bmint(?:ed|ing)?\b|\bsold\b|\bbuy\b|\bprices?\b(?! and)/i);
  assert.ok((copy.match(/\bno price\b/gi) ?? []).length >= 2);
});

test('no banned words anywhere in these files, and no currency sign', () => {
  assert.equal(BANNED.length, 11);
  for (const p of MY_FILES) {
    const text = read(p);
    for (const w of BANNED) assert.doesNotMatch(text, new RegExp(`\\b${w}`, 'i'), `${p} contains a banned word`);
    assert.doesNotMatch(text, /\$\s?\d|\$[A-Za-z]/, `${p} has a currency sign`);
  }
  // The copy that reaches the page, once more, from the data module's constants.
  for (const w of BANNED) {
    assert.doesNotMatch([...HOW_STEPS.map((s) => `${s.k} ${s.v}`), ...NOT_LIST].join(' '), new RegExp(`\\b${w}`, 'i'));
  }
  assert.equal(String.fromCharCode(36).length, 1);
});

test('the printed copy cannot carry a banned word in from the devnet either: names are the only free text and they pass a strict alphabet', () => {
  for (const hostile of BANNED.filter((w) => /^[a-z]+$/.test(w)).map((w) => `${w}-bot`)) {
    // A name that is allowed by the alphabet is shown as text exactly as the devnet wrote it; the page copy never repeats it.
    assert.equal(B.readWitnesses({ height: 10, distinct: 1, witnesses: [{ name: hostile, result: 'correct' }] }, 10).keys[0].name, hostile);
  }
  assert.doesNotMatch(src.view, /name\s*\+|`[^`]*\$\{k\.name\}/, 'names are never built into a sentence');
});

test('design law: tokens, square corners, 1.5px borders, weights 400 and 500, 16px gutters, dark mode, visible focus, no sideways scroll', () => {
  const css = src.page.slice(src.page.indexOf('<style is:global>'));
  assert.ok(css.includes('var(--pc-ink'));
  assert.ok(css.includes('var(--pc-bg)'));
  assert.ok(css.includes('var(--c600)') && css.includes('var(--c800)') && css.includes('var(--c50)'));
  assert.match(css, /@media \(prefers-color-scheme: dark\)\{\s*\.bl-page\{--pc-bg:/, 'dark mode re-states the tokens');
  assert.doesNotMatch(css, /border-radius|border-radius:\s*[1-9]/, 'square corners');
  assert.doesNotMatch(css, /font-weight:\s*[^45]\d\d|font:\s*[6-9]00\b|font:\s*[1-3]00\b/, 'weights 400 and 500 only');
  assert.doesNotMatch(css, /font:\s*(?:6|7|8|9)\d\d/);
  assert.match(css, /border:1\.5px solid var\(--c600\)/);
  assert.match(css, /outline:2px solid var\(--c600\)/, 'a visible focus ring on buttons, tiles and the code block');
  assert.match(css, /\.bl \[hidden\]\{display:none !important\}/, 'hidden means hidden, even for .btn, which sets its own display');
  assert.match(css, /@media \(max-width:640px\)/);
  assert.match(css, /\.bl \.bl-tiles\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/, 'two columns at phone width');
  assert.match(css, /\.bl \.bl-pre\{[^}]*overflow:auto/, 'the code block scrolls inside itself, not the page');
  assert.match(css, /\.bl \.hash\{word-break:break-all/, 'a 64-character hash wraps');
  assert.match(src.page, /import '\.\.\/\.\.\/styles\/chain\.css';/, 'chain.css gives the 16px gutter at phone width');
  assert.match(read('src/styles/chain.css'), /@media \(max-width:640px\)\{\s*\.chn\{padding:16px 16px 96px\}/);
  // Hard-coded colours only where the art or the code block needs them (a dark picture ground, the dark code block), never for text.
  const colours = [...css.matchAll(/(?<![\w-])(#[0-9a-fA-F]{3,8})\b/g)].map((m) => m[1].toLowerCase());
  const allowed = new Set(['#fff', '#12110e', '#38373a', '#5f5e5a', '#c4c2bc', '#e5e3de', '#185fa5', '#0e1116', '#ece9e2', '#c8c5be', '#a09d95', '#444850', '#2a2e36', '#7db4ec', '#14202e', '#5da3e6', '#a9d0f5', '#1a1420', '#0b1b2e', '#e8eef5']);
  for (const c of colours) assert.ok(allowed.has(c), `unexpected colour ${c}`);
});

test('accessibility: labelled controls, polite live regions, a labelled dialog, keyboard-reachable code, real headings in order', () => {
  const dom = new JSDOM(skeleton());
  const d = dom.window.document;
  for (const b of d.querySelectorAll('button')) assert.ok(b.textContent.trim().length > 0 || b.querySelector('.bl-sr'), `a button with no name: ${b.outerHTML.slice(0, 80)}`);
  for (const cb of d.querySelectorAll('input[type="checkbox"]')) assert.ok(cb.closest('label'), 'a checkbox inside its label');
  for (const cb of d.querySelectorAll('input[type="checkbox"]')) assert.equal(cb.hasAttribute('checked'), false, 'drift is off in the markup');
  const live = [...d.querySelectorAll('[aria-live]')].map((n) => `${n.dataset.bl}:${n.getAttribute('aria-live')}`).sort();
  assert.deepEqual(live, ['d-status:polite', 'grid-status:polite', 'hero-status:polite', 'status:polite']);
  assert.equal(d.querySelector('[data-bl="clock"]').hasAttribute('aria-live'), false, 'the once-a-minute clock is not announced');
  const pre = d.querySelector('pre');
  assert.equal(pre.getAttribute('tabindex'), '0');
  assert.ok(pre.getAttribute('aria-label'));
  for (const img of d.querySelectorAll('img')) assert.ok(img.hasAttribute('alt'));
  assert.equal(d.querySelectorAll('h1').length, 1);
  const level = (h) => Number(h.tagName[1]);
  const hs = [...d.querySelectorAll('h1,h2,h3')].map(level);
  for (let i = 1; i < hs.length; i++) assert.ok(hs[i] - hs[i - 1] <= 1, `heading levels skip: ${hs.join('')}`);
  for (const id of ['today', 'grid', 'how', 'not', 'dev']) {
    const s = d.getElementById(id);
    assert.ok(s, id);
    assert.ok(s.getAttribute('aria-labelledby'), `${id} is labelled`);
    assert.ok(d.getElementById(s.getAttribute('aria-labelledby')));
  }
  assert.ok(d.querySelector('noscript'), 'a no-JavaScript line');
  // The hero has a real picture without JavaScript only when the genesis bloom was printed at build time.
  assert.match(src.page, /src=\{genesisBloom \|\| undefined\}/);
  assert.match(src.data, /export async function genesisBloomDataUri/);
});

test('the page touches only its own files: the integrator’s shared files are not edited here', () => {
  for (const shared of ['src/data/chain-home.ts', 'src/pages/chain.astro', 'src/data/front-door-news.json', 'public/llms.txt', 'src/pages/for-agents.astro']) {
    assert.ok(!MY_FILES.includes(shared), shared);
  }
  assert.match(src.page, /import \{ DEVNET, DEVNET_PREVIOUS, RESET, assertDevnetLaunchPinned, notYet \} from '\.\.\/\.\.\/data\/chain-home';/, 'devnet facts come from chain-home, read-only');
  assert.doesNotMatch(src.page + src.dialog + src.data, /workers\.dev|\b[0-9a-f]{64}\b/, 'no devnet address or genesis is retyped here');
  assert.doesNotMatch(src.view + src.bloom, /workers\.dev/, 'no devnet address is retyped in the browser code either');
  assert.match(src.data, /export const BLOOM_BLOCK = '\d{4}'/);
});
