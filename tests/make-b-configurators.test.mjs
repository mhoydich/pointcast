// Tests for the four kit-B art configurators under public/make/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAKE = path.join(ROOT, 'public', 'make');
const SLUGS = ['dither-studio', 'punch-card-loom', 'moon-tide-card', 'court-lines-poster'];

function load(...files) {
  const ctx = { Uint32Array, Uint8Array, Float32Array, Math, Date };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(MAKE, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
const plain = (v) => JSON.parse(JSON.stringify(v));
const read = (p) => fs.readFileSync(path.join(MAKE, p), 'utf8');

// ---- registry ---------------------------------------------------------------------------
test('tools-b.json lists the four tools and every row has its page', () => {
  const rows = JSON.parse(read('kit-b/tools-b.json'));
  assert.ok(Array.isArray(rows));
  assert.deepEqual(rows.map((r) => r.slug), SLUGS);
  for (const r of rows) {
    assert.deepEqual(Object.keys(r).sort(), ['blurb', 'path', 'slug', 'title']);
    assert.equal(r.path, `/make/${r.slug}/`);
    assert.ok(r.title.length > 3 && r.blurb.length > 20);
    assert.ok(fs.existsSync(path.join(MAKE, r.slug, 'index.html')), `${r.slug} page exists`);
  }
});

test('kit B does not create agent A shared files', () => {
  // these belong to the other make pull request
  for (const f of ['make.css', 'make-kit.js', 'tools.json']) {
    for (const s of SLUGS) assert.ok(!read(`${s}/index.html`).includes(f), `${s} does not reference ${f}`);
  }
});

// ---- pages: offline, labelled, honest -------------------------------------------------
for (const slug of SLUGS) {
  test(`${slug}: page is self-contained and has its meta`, () => {
    const html = read(`${slug}/index.html`);
    // no external resources on script, link, img, iframe, source, audio, video
    const refs = [...html.matchAll(/<(script|link|img|iframe|source|audio|video)\b[^>]*\b(?:src|href)="([^"]+)"/gi)].map((m) => m[2]);
    for (const ref of refs) {
      if (/rel="canonical"/.test(html) && ref.startsWith('https://pointcast.xyz/')) continue;
      assert.ok(!/^(https?:)?\/\//i.test(ref), `${slug}: external ref ${ref}`);
    }
    assert.ok(!/@import|url\(\s*['"]?https?:/i.test(html), `${slug}: no remote css`);
    assert.match(html, /<title>[^<]+PointCast Make<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.ok(html.includes(`<link rel="canonical" href="https://pointcast.xyz/make/${slug}/">`));
    assert.ok(html.includes(`<meta property="og:url" content="https://pointcast.xyz/make/${slug}/">`));
    assert.match(html, /<meta property="og:title" content="[^"]+">/);
    assert.ok(fs.existsSync(path.join(MAKE, 'kit-b', `og-${slug}.png`)), 'og image exists');
    assert.match(html, /Generated in your browser by code, written by an AI model\./);
    assert.ok(!html.includes('—'), 'no em dashes in page copy');
    for (const btn of ['shuffle', 'copy', 'png', 'svg']) assert.ok(html.includes(`id="${btn}"`), `${slug} has #${btn}`);
    // every non-radio input/select/textarea with an id has a label
    for (const m of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const attrs = m[2];
      if (/type="radio"/.test(attrs)) continue;
      const id = /id="([^"]+)"/.exec(attrs)?.[1];
      assert.ok(id, `${slug}: control has an id: ${m[0]}`);
      const wrapped = new RegExp(`<label[^>]*>\\s*<${m[1]}[^>]*id="${id}"`).test(html);
      assert.ok(html.includes(`for="${id}"`) || wrapped, `${slug}: #${id} is labelled`);
    }
  });

  test(`${slug}: scripts make no network calls`, () => {
    const dir = path.join(MAKE, slug);
    const js = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + read('kit-b/kit-b.js');
    for (const bad of [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /\bimport\s*\(/, /localStorage/, /document\.cookie/]) {
      assert.ok(!bad.test(js), `${slug}: no ${bad}`);
    }
    const urls = [...js.matchAll(/https?:\/\/[^\s'"]+/g)].map((m) => m[0]);
    for (const u of urls) assert.equal(u, 'http://www.w3.org/2000/svg', `${slug}: only the SVG namespace URL appears`);
  });
}

// ---- kit -------------------------------------------------------------------------------
test('kit: seeded rng is deterministic, hash state round-trips', () => {
  const { KitB } = load('kit-b/kit-b.js');
  const a = KitB.rng('abc'), b = KitB.rng('abc'), c = KitB.rng('abd');
  const sa = [a(), a(), a()], sb = [b(), b(), b()];
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, [c(), c(), c()]);
  const o = { seed: 'x9', t: 'Kitchen Study No. 4', ink: '101010' };
  assert.deepEqual({ ...KitB.parseHash('#' + KitB.buildHash(o)) }, o);
  assert.equal(KitB.hex('zzzzzz', '#000000'), '#000000');
  assert.equal(KitB.hex('C9351A', '#000000'), '#c9351a');
  assert.equal(KitB.num('999', 1, 8, 3), 8);
  assert.equal(KitB.cleanSeed('<b>Hi!</b>'), 'bhib');
});

// ---- dither ----------------------------------------------------------------------------
test('dither: kernels sum correctly and Bayer is a full permutation', () => {
  const { DitherCore: D } = load('kit-b/kit-b.js', 'dither-studio/dither-core.js');
  assert.equal(D.kernelSum('floyd-steinberg'), 1);
  assert.equal(D.kernelSum('atkinson'), 0.75);
  assert.equal(D.KERNELS['floyd-steinberg'].taps.length, 4);
  assert.equal(D.KERNELS.atkinson.taps.length, 6);
  const flat = D.BAYER8.flat();
  assert.equal(flat.length, 64);
  assert.deepEqual([...flat].sort((x, y) => x - y), Array.from({ length: 64 }, (_, i) => i));
});

test('dither: tone is preserved and output is deterministic', () => {
  const { DitherCore: D, KitB } = load('kit-b/kit-b.js', 'dither-studio/dither-core.js');
  const w = 64, h = 64;
  for (const level of [0.2, 0.5, 0.8]) {
    const g = new Float32Array(w * h).fill(level);
    for (const algo of ['floyd-steinberg', 'bayer']) {
      const bits = D.dither(g, w, h, algo);
      const mean = bits.reduce((s, v) => s + v, 0) / bits.length;
      assert.ok(Math.abs(mean - level) < 0.03, `${algo} at ${level} gave ${mean}`);
    }
  }
  const t = D.dither(new Float32Array([0.49, 0.51]), 2, 1, 'threshold');
  assert.deepEqual([...t], [0, 1]);
  const s1 = D.scene(80, 80, KitB.rng('pc0427')), s2 = D.scene(80, 80, KitB.rng('pc0427')), s3 = D.scene(80, 80, KitB.rng('other'));
  assert.deepEqual([...s1], [...s2]);
  assert.notDeepEqual([...s1], [...s3]);
  const svg = D.toSvg(D.dither(s1, 80, 80, 'atkinson'), 80, 80, 3, '#101010', '#f3f1ea');
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="240" height="240"/);
});

// ---- loom ------------------------------------------------------------------------------
test('loom: Hollerith punches and card encoding round-trip', () => {
  const { LoomCore: L } = load('kit-b/kit-b.js', 'punch-card-loom/loom-core.js');
  const rows = (ch) => plain(L.punchesFor(ch).map((i) => L.ROW_NAMES[i]));
  assert.deepEqual(rows('A'), ['12', '1']);
  assert.deepEqual(rows('J'), ['11', '1']);
  assert.deepEqual(rows('S'), ['0', '2']);
  assert.deepEqual(rows('7'), ['7']);
  assert.equal(L.punchesFor('é'), null);
  const { card, used } = L.fromPhrase('Hello, Loom 80!');
  assert.equal(used, 'HELLO, LOOM 80!');
  assert.equal(L.readCard(card), 'HELLO, LOOM 80!');
  assert.deepEqual([...L.decode(L.encode(card))], [...card]);
  const long = L.fromPhrase('X'.repeat(100));
  assert.equal(long.used.length, 80);
  assert.equal(L.encode(L.blank()), '');
});

test('loom: weave follows the card and seeded cards are deterministic', () => {
  const { LoomCore: L, KitB } = load('kit-b/kit-b.js', 'punch-card-loom/loom-core.js');
  const a = L.seeded(KitB.rng('d')), b = L.seeded(KitB.rng('d'));
  assert.equal(L.encode(a.card), L.encode(b.card));
  const card = L.fromPhrase('WARP AND WEFT').card;
  const o = { ground: 'float', repeat: 'straight', picks: 1 };
  for (let e = 0; e < 80; e++) for (let p = 0; p < 12; p++) assert.equal(L.lift(card, e, p, o), card[L.idx(e, p)] === 1);
  // damask on a blank card is the weft-faced satin: one end in five lifted
  let up = 0;
  for (let e = 0; e < 100; e++) for (let p = 0; p < 100; p++) up += L.lift(L.blank(), e, p, { ground: 'damask', repeat: 'straight', picks: 1 }) ? 1 : 0;
  assert.equal(up, 2000);
  assert.deepEqual({ ...L.repeatSize({ repeat: 'straight', picks: 3 }) }, { w: 80, h: 36 });
  assert.deepEqual({ ...L.repeatSize({ repeat: 'mirror', picks: 1 }) }, { w: 158, h: 22 });
  // mirror repeat reflects
  const m = { ground: 'float', repeat: 'mirror', picks: 1 };
  for (let e = 0; e < 80; e++) assert.equal(L.figureAt(card, e, 0, m), L.figureAt(card, 158 - e, 0, m));
});

// ---- moon ------------------------------------------------------------------------------
test('moon: phase hits known new and full moons within a day', () => {
  const { SkyCore: S } = load('moon-tide-card/sky-core.js');
  const at = (iso) => S.moon(Date.parse(iso));
  assert.ok(at('2000-01-06T18:14Z').illumination < 0.01);
  assert.equal(at('2000-01-06T18:14Z').name, 'New moon');
  assert.ok(at('2000-01-21T04:40Z').illumination > 0.99);
  assert.equal(at('2000-01-21T04:40Z').name, 'Full moon');
  function extreme(startIso, days, wantMin) {
    let best = null;
    for (let h = 0; h <= days * 24; h++) {
      const t = Date.parse(startIso) + h * 3600e3, k = S.moon(t).illumination;
      if (!best || (wantMin ? k < best.k : k > best.k)) best = { t, k };
    }
    return best.t;
  }
  const newT = extreme('2000-01-03T00:00Z', 7, true);
  assert.ok(Math.abs(newT - Date.parse('2000-01-06T18:14Z')) < 86400e3, 'new moon within a day');
  const fullT = extreme('2000-01-18T00:00Z', 7, false);
  assert.ok(Math.abs(fullT - Date.parse('2000-01-21T04:40Z')) < 86400e3, 'full moon within a day');
  // a later check far from the epoch: total solar eclipse new moon, 2024-04-08 18:21 UT
  assert.ok(at('2024-04-08T18:21Z').illumination < 0.01);
  const q = at('2000-01-14T13:34Z'); // first quarter
  assert.ok(q.waxing && Math.abs(q.illumination - 0.5) < 0.05);
});

test('moon: sun and tide-like model behave', () => {
  const { SkyCore: S } = load('moon-tide-card/sky-core.js');
  const june = Date.parse('2026-06-21T12:00Z'), dec = Date.parse('2026-12-21T12:00Z');
  assert.ok(Math.abs(S.sunDeclination(june) - 23.44) < 0.5);
  assert.ok(Math.abs(S.sunDeclination(dec) + 23.44) < 0.5);
  assert.ok(Math.abs(S.dayLength(0, S.sunDeclination(june)) - 12) < 0.01);
  assert.equal(S.dayLength(80, 23), 24);
  assert.ok(S.sunAltitude(34, 0, 12) > 55 && S.sunAltitude(34, 0, 0) < -50);
  const spring = S.tideModel(S.moon(Date.parse('2000-01-06T18:14Z')));
  const neap = S.tideModel(S.moon(Date.parse('2000-01-14T13:34Z')));
  assert.ok(spring.spring && spring.amp > neap.amp && neap.neap);
  assert.equal(S.instant('2026-11-11', 21), Date.parse('2026-11-11T21:00Z'));
  assert.ok(Number.isNaN(S.instant('nope', 0)));
});

test('moon: page says plainly it is approximate and not a tide table', () => {
  const html = read('moon-tide-card/index.html');
  assert.match(html, /Approximate, computed in your browser, not a tide table\./);
  assert.ok(!/geolocation/.test(read('moon-tide-card/app.js')), 'no location lookup');
});

// ---- court -----------------------------------------------------------------------------
test('court: proportions are exact', () => {
  const { CourtCore: C } = load('kit-b/kit-b.js', 'court-lines-poster/court-core.js');
  assert.equal(C.COURT.width, 20);
  assert.equal(C.COURT.length, 44);
  assert.equal(C.COURT.nvz, 7);
  const l = C.lines();
  assert.deepEqual(plain(l.perimeter), [[0, 0, 20, 0], [20, 0, 20, 44], [20, 44, 0, 44], [0, 44, 0, 0]]);
  assert.deepEqual(plain(l.nvz), [[0, 15, 20, 15], [0, 29, 20, 29]]);
  assert.equal(22 - l.nvz[0][1], 7);
  assert.equal(l.nvz[1][1] - 22, 7);
  assert.deepEqual(plain(l.centre), [[10, 0, 10, 15], [10, 29, 10, 44]]);
  for (const sc of C.serviceCourts()) { assert.equal(sc.w, 10); assert.equal(sc.h, 15); }
  assert.equal(C.PW / C.PH, 18 / 24);
});

test('court: seeded rally is legal-looking and deterministic', () => {
  const { CourtCore: C, KitB } = load('kit-b/kit-b.js', 'court-lines-poster/court-core.js');
  for (let i = 0; i < 300; i++) {
    const seed = 's' + i;
    const r = C.rally(KitB.rng(seed));
    assert.deepEqual(JSON.parse(JSON.stringify(r)), JSON.parse(JSON.stringify(C.rally(KitB.rng(seed)))));
    const [serve, ret] = r;
    assert.equal(serve.type, 'serve');
    assert.ok(serve.from[1] > 44, 'serve from behind the baseline');
    assert.ok(serve.to[1] > 0 && serve.to[1] < 15, 'serve lands beyond the far kitchen');
    assert.ok((serve.from[0] > 10) !== (serve.to[0] > 10), 'serve goes cross-court');
    assert.ok(ret.to[1] > 29 && ret.to[1] < 44, 'return lands deep');
    for (let k = 2; k < r.length; k++) {
      const hitterNear = k % 2 === 0;
      assert.ok(hitterNear ? r[k].to[1] < 22 : r[k].to[1] > 22, `shot ${k} crosses the net (${seed})`);
      if (r[k].type === 'dink') assert.ok(r[k].to[1] > 15 && r[k].to[1] < 29, 'dinks land in a kitchen');
    }
  }
  const opts = (seed) => ({ ground: '#f3f1ea', ink: '#101010', weightIn: 2, rotation: 12, style: 'lines', title: 'Kitchen Study No. 4', shots: C.rally(KitB.rng(seed)), seed });
  assert.equal(C.poster(opts('court')), C.poster(opts('court')));
  assert.notEqual(C.poster(opts('court')), C.poster(opts('other')));
  assert.ok(C.poster({ ...opts('x'), title: '<script>' }).includes('&lt;script&gt;'));
});
