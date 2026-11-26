// PointCast Make, batch C: harmonograph, line-printer banner, island chart, race card.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..', 'public', 'make');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const manifest = JSON.parse(read('tools.json'));
const MINE = ['harmonograph', 'line-printer-banner', 'island-chart', 'race-card'];

function load(slugs) {
  const ctx = {};
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('make-kit.js'), ctx, { filename: 'make-kit.js' });
  for (const s of slugs) vm.runInContext(read(`${s}/${s}.js`), ctx, { filename: `${s}.js` });
  return ctx;
}
const ctx = load(MINE);
const K = ctx.MakeKit;
const pngSize = (p) => { const b = fs.readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 1, 4), 'PNG', p); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('batch C rows are listed with real pages, thumbs and cards', () => {
  for (const s of MINE) {
    const row = manifest.tools.find((t) => t.slug === s);
    assert.ok(row, `${s} not in tools.json`);
    for (const k of ['slug', 'path', 'title', 'line', 'thumb', 'by', 'added']) assert.equal(typeof row[k], 'string', `${s}.${k}`);
    assert.ok(Array.isArray(row.exports) && row.exports.includes('png') && row.exports.includes('svg'));
    assert.equal(row.path, `/make/${s}/`);
    assert.equal(row.thumb, `/make/${s}/thumb.png`);
    assert.ok(fs.existsSync(path.join(ROOT, s, 'index.html')));
    assert.deepEqual(pngSize(`${s}/thumb.png`), [400, 400]);
    assert.deepEqual(pngSize(`${s}/card.png`), [1200, 630]);
    assert.ok(!row.line.includes('—'));
  }
  assert.equal(new Set(manifest.tools.map((t) => t.slug)).size, manifest.tools.length, 'duplicate slugs');
});

test('pages are self-contained, carry meta and the plain notes, no em dashes', () => {
  for (const s of MINE) {
    const html = read(`${s}/index.html`);
    const refs = [...html.matchAll(/<(?:script|link|img|iframe|source)\b[^>]*?\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    for (const r of refs) if (!r.startsWith('https://pointcast.xyz/make/')) assert.ok(!/^(https?:)?\/\//.test(r), `${s} loads ${r}`);
    assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'self'/);
    assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    assert.ok(html.includes(`<link rel="canonical" href="https://pointcast.xyz/make/${s}/">`));
    for (const og of ['og:title', 'og:description', 'og:url', 'og:image']) assert.ok(html.includes(`property="${og}"`), `${s} ${og}`);
    assert.ok(!html.includes('—'), `${s} em dash`);
    assert.match(html, /generated in your browser by code/);
    assert.match(html, /built by an AI model/);
    const src = read(`${s}/${s}.js`);
    assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|importScripts|https?:\/\/(?!www\.w3\.org)/.test(src), `${s} js reaches out`);
    assert.ok(!src.includes('—'), `${s} js em dash`);
  }
  assert.match(read('island-chart/index.html'), /not for navigation/i);
  assert.match(read('race-card/index.html'), /for fun, not betting/i);
  assert.match(read('line-printer-banner/index.html'), /data-act="txt"/);
});

test('schemas are labelled, defaults survive cleaning, exports are 300 dpi', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    assert.equal(T.slug, s);
    assert.equal(T.schema[0].key, 'seed');
    const keys = T.schema.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const f of T.schema) {
      assert.ok(f.label && f.label.length > 1, `${s}.${f.key} label`);
      assert.deepEqual(K.clean(f, f.def), f.def, `${s}.${f.key}`);
    }
    const sz = T.size(K.defaults(T.schema));
    assert.ok(sz.w >= 600 && sz.h >= 600 && sz.dpi === 300, `${s} size`);
  }
});

test('hash round-trips and seeds are deterministic', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    const r = K.rng('rt|' + s);
    for (let i = 0; i < 20; i++) {
      const st = Object.assign(K.defaults(T.schema), T.shuffle(r, K.defaults(T.schema)), { seed: K.seedWord(r) });
      const a = K.decode('#' + K.encode(st, T.schema), T.schema);
      assert.deepEqual({ ...K.decode('#' + K.encode(a, T.schema), T.schema) }, { ...a });
      const svg = T.render(a, { export: true, physical: T.size(a).physical });
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${s} shuffle ${i}`);
      assert.ok(svg.length < 2500000, `${s} svg size ${svg.length}`);
    }
    const d = K.defaults(T.schema);
    const svg1 = T.render(d);
    assert.equal(load([s]).MakeTools[s].render({ ...d }), svg1, `${s} fresh context differs`);
    assert.notEqual(T.render({ ...d, seed: d.seed + 'x' }), svg1, `${s} seed ignored`);
    assert.match(svg1, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 [\d.]+ [\d.]+"/);
  }
});

test('harmonograph traces stay on the plate and damping shrinks the swing', () => {
  const T = ctx.MakeTools.harmonograph, { CX, CY, R } = T.geom;
  const st = K.defaults(T.schema);
  for (let k = 0; k < st.traces; k++) {
    const pts = T.trace(st, k);
    for (const [x, y] of pts) assert.ok(Math.abs(x - CX) <= R + 0.01 && Math.abs(y - CY) <= R + 0.01);
    const rad = (p) => Math.hypot(p[0] - CX, p[1] - CY);
    const head = Math.max(...pts.slice(0, 200).map(rad)), tail = Math.max(...pts.slice(-200).map(rad));
    assert.ok(tail < head * 0.5, `trace ${k} does not decay (${head} -> ${tail})`);
  }
  const free = T.trace({ ...st, damp: 0 }, 0);
  const rad = (p) => Math.hypot(p[0] - CX, p[1] - CY);
  assert.ok(Math.max(...free.slice(-300).map(rad)) > R * 0.6, 'zero damping keeps swinging');
});

test('banner text reads back from the printed grid, across and sideways', () => {
  const T = ctx.MakeTools['line-printer-banner'];
  const glyphs = Object.entries(T.FONT);
  assert.equal(new Set(glyphs.map(([, g]) => g.join('|'))).size, glyphs.length, 'two glyphs look the same');
  const match = (grid) => { const k = grid.join('|'); const hit = glyphs.find(([, g]) => g.join('|') === k); return hit ? hit[0] : '?'; };
  for (const scale of ['1', '2', '3']) for (const chars of ['self', 'hash', 'over']) {
    const text = 'GO 42!';
    const st = K.decode(`#text=${encodeURIComponent(text)}&dir=sideways&scale=${scale}&chars=${chars}`, T.schema);
    const rows = T.bannerRows(st), s = Number(scale), pc = 6 * s, pl = rows.length / text.length / 6;
    assert.ok(Number.isInteger(pl));
    for (const row of rows) assert.equal(row.length, T.COLS);
    const left = Math.floor((T.COLS - 7 * pc) / 2);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const grid = Array.from({ length: 7 }, (_, gy) => Array.from({ length: 5 }, (_, gx) => (rows[(i * 6 + gx) * pl][left + (6 - gy) * pc] !== ' ' ? '#' : '.')).join(''));
      out += match(grid);
    }
    assert.equal(out, text, `sideways ${scale} ${chars}`);
  }
  // across: one line of letters at scale 1
  const st = K.decode('#text=HELLO&dir=across&scale=1', T.schema);
  const rows = T.bannerRows(st);
  assert.equal(rows.length, 7);
  const width = 5 * 12 - 2, left = Math.floor((T.COLS - width) / 2);
  let out = '';
  for (let c = 0; c < 5; c++) out += match(Array.from({ length: 7 }, (_, gy) => Array.from({ length: 5 }, (_, gx) => (rows[gy][left + c * 12 + gx * 2] !== ' ' ? '#' : '.')).join('')));
  assert.equal(out, 'HELLO');
  const txt = T.txt(K.defaults(T.schema));
  assert.ok(txt.includes('HHHH') && txt.endsWith('\n') && !/[^\x20-\x7e\n]/.test(txt), 'txt is plain ascii');
});

test('island contours close or run to the edge of the grid', () => {
  const T = ctx.MakeTools['island-chart'], { NX, NY } = T.grid;
  const onEdge = ([x, y]) => x <= 1e-9 || y <= 1e-9 || x >= NX - 1e-9 || y >= NY - 1e-9;
  for (const seed of ['chart-0031', 'abc', 'reef-9', 'k']) for (const isles of [1, 3, 5]) {
    const st = K.decode(`#seed=${seed}&isles=${isles}`, T.schema);
    const f = T.field(st);
    for (const L of T.levelsOf(st)) {
      for (const c of T.contour(f, L.v)) {
        if (c.closed) assert.deepEqual(c.pts[0], c.pts[c.pts.length - 1]);
        else assert.ok(onEdge(c.pts[0]) && onEdge(c.pts[c.pts.length - 1]), `${seed}/${isles} open contour inside the frame`);
      }
    }
  }
  const svg = T.render(K.defaults(T.schema));
  assert.ok(svg.includes('IMAGINARY CHART, NOT FOR NAVIGATION'));
  assert.ok(T.islandName(K.defaults(T.schema)).length > 2);
  assert.equal(T.islandName(K.decode('#name=Gull%20Rock', T.schema)), 'Gull Rock');
});

test('race card has unique names, numbers 1 to N and labelled made-up odds', () => {
  const T = ctx.MakeTools['race-card'];
  for (const kind of ['horses', 'runners']) for (let n = 4; n <= 12; n++) {
    const st = K.decode(`#kind=${kind}&field=${n}&seed=day-${n}`, T.schema);
    const f = T.field(st);
    assert.equal(f.length, n);
    assert.deepEqual([...f.map((h) => h.no)], Array.from({ length: n }, (_, i) => i + 1));
    assert.equal(new Set(f.map((h) => h.name)).size, n, 'duplicate names');
    for (const h of f) { assert.match(h.odds, /^\d+-\d+$/); assert.notEqual(h.body, h.alt); }
    assert.ok(T.render(st).includes('FOR FUN, NOT BETTING'));
  }
  assert.equal(T.oddsText(0.5), '1-1');
  assert.equal(T.oddsText(0.2), '4-1');
});
