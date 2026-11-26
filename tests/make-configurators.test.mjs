// PointCast Make: static art configurators under public/make/.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';

const ROOT = path.resolve(import.meta.dirname, '..', 'public', 'make');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const manifest = JSON.parse(read('tools.json'));
const MINE = ['guilloche', 'sticker', 'signal', 'drum-wheel'];

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

test('tools.json is valid and every row points at a real page', () => {
  assert.ok(Array.isArray(manifest.tools) && manifest.tools.length >= 4);
  const slugs = new Set();
  for (const t of manifest.tools) {
    for (const k of ['slug', 'path', 'title', 'line']) assert.equal(typeof t[k], 'string', `${t.slug}: ${k}`);
    assert.match(t.slug, /^[a-z0-9-]+$/);
    assert.ok(!slugs.has(t.slug), `duplicate slug ${t.slug}`);
    slugs.add(t.slug);
    assert.equal(t.path, `/make/${t.slug}/`);
    assert.ok(fs.existsSync(path.join(ROOT, t.slug, 'index.html')), `${t.slug}/index.html missing`);
    if (t.thumb) assert.ok(fs.existsSync(path.join(ROOT, t.thumb.replace(/^\/make\//, ''))), `${t.slug} thumb missing`);
  }
  for (const s of MINE) assert.ok(slugs.has(s), `${s} not listed`);
});

const pages = ['index.html', ...MINE.map((s) => `${s}/index.html`)];

test('pages load nothing from other hosts', () => {
  for (const p of pages) {
    const html = read(p);
    const refs = [...html.matchAll(/<(?:script|link|img|iframe|source|audio|video)\b[^>]*?\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.length > 0, p);
    for (const r of refs) {
      const isCanonical = /rel="canonical"/.test(html.slice(html.indexOf(r) - 60, html.indexOf(r)));
      if (isCanonical) continue;
      assert.ok(!/^(https?:)?\/\//.test(r), `${p} loads external ${r}`);
    }
    assert.ok(!/@import|url\(\s*['"]?https?:/.test(read('make.css')), 'css pulls a remote resource');
    assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'self'/);
  }
  for (const f of ['make-kit.js', 'index.js', ...MINE.map((s) => `${s}/${s}.js`)]) {
    const src = read(f);
    assert.ok(!/fetch\(\s*['"`]https?:|XMLHttpRequest|sendBeacon|new WebSocket|importScripts/.test(src), `${f} makes a network call`);
  }
});

test('pages carry the meta, the plain-language notes and no em dashes', () => {
  for (const p of pages) {
    const html = read(p);
    const slug = p === 'index.html' ? '' : p.split('/')[0] + '/';
    assert.match(html, /<title>[^<]+<\/title>/, p);
    assert.match(html, /<meta name="description" content="[^"]{40,}">/, p);
    assert.ok(html.includes(`<link rel="canonical" href="https://pointcast.xyz/make/${slug}">`), `${p} canonical`);
    for (const og of ['og:title', 'og:description', 'og:url', 'og:image']) assert.ok(html.includes(`property="${og}"`), `${p} ${og}`);
    assert.ok(fs.existsSync(path.join(ROOT, slug, 'card.png')), `${p} og card`);
    assert.ok(!html.includes('\u2014'), `${p} has an em dash`);
    assert.match(html, /generated in your browser by code|draws with code in your browser/, p);
    assert.match(html, /built by (an )?AI model/, p);
  }
  assert.match(read('guilloche/index.html'), /specimen, not money/i);
});

test('every tool has a full schema, labels and sane defaults', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    assert.ok(T, s);
    assert.equal(T.slug, s);
    const keys = T.schema.map((f) => f.key);
    assert.equal(new Set(keys).size, keys.length, `${s} duplicate keys`);
    assert.equal(keys[0], 'seed');
    for (const f of T.schema) {
      assert.ok(f.label && f.label.length > 1, `${s}.${f.key} label`);
      assert.deepEqual(K.clean(f, f.def), f.def, `${s}.${f.key} default survives cleaning`);
    }
    const sz = T.size(K.defaults(T.schema));
    assert.ok(sz.w >= 600 && sz.h >= 600 && sz.dpi === 300, `${s} export size`);
  }
});

test('hash round-trips through encode and decode', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    const r = K.rng('roundtrip|' + s);
    for (let i = 0; i < 25; i++) {
      const st = Object.assign(K.defaults(T.schema), T.shuffle(r, K.defaults(T.schema)), { seed: K.seedWord(r) });
      const clean = K.decode('#' + K.encode(st, T.schema), T.schema);
      const again = K.decode('#' + K.encode(clean, T.schema), T.schema);
      assert.deepEqual({ ...again }, { ...clean }, `${s} round trip ${i}`);
      for (const f of T.schema) assert.deepEqual(clean[f.key], K.clean(f, st[f.key]), `${s}.${f.key}`);
    }
  }
});

test('decode rejects junk and falls back to defaults', () => {
  const T = ctx.MakeTools.sticker;
  const st = K.decode('#shape=hexagon&scale=99&cut=maybe&line1=%3Cscript%3Ex&size=7&%E0%A4%A=1', T.schema);
  assert.equal(st.shape, 'burst');
  assert.equal(st.scale, 6);
  assert.equal(st.cut, true);
  assert.equal(st.size, '3');
  assert.equal(st.line1, '<SCRIPT>X');
  const svg = T.render(st);
  assert.ok(!svg.includes('<SCRIPT>'), 'text is escaped in the SVG');
  assert.ok(svg.includes('&lt;SCRIPT&gt;X'));
  const sig = K.decode('#call=ab%20c!d&date=2026-13-45&utc=12:3x', ctx.MakeTools.signal.schema);
  assert.equal(sig.call, 'ABCD');
  assert.equal(sig.date, '2026-11-11');
  assert.equal(sig.utc, '12:3');
});

test('generators are deterministic from the seed and differ across seeds', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    const a = K.defaults(T.schema);
    const svg1 = T.render(a);
    const svg2 = load([s]).MakeTools[s].render({ ...a });
    assert.equal(svg1, svg2, `${s} same seed, same art in a fresh context`);
    assert.notEqual(T.render({ ...a, seed: a.seed + 'x' }), svg1, `${s} seed changes the art`);
    assert.match(svg1, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
    assert.ok(!/NaN|undefined|Infinity/.test(svg1), `${s} svg has NaN/undefined`);
    assert.ok(!/https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(svg1), `${s} svg links out`);
  }
});

test('shuffled states always render clean SVG', () => {
  for (const s of MINE) {
    const T = ctx.MakeTools[s];
    const r = K.rng('fuzz|' + s);
    for (let i = 0; i < 30; i++) {
      const st = K.decode('#' + K.encode(Object.assign(K.defaults(T.schema), T.shuffle(r, {}), { seed: K.seedWord(r) }), T.schema), T.schema);
      const svg = T.render(st, { export: true, physical: T.size(st).physical });
      assert.ok(!/NaN|undefined/.test(svg), `${s} shuffle ${i}`);
      assert.ok(svg.length < 1500000, `${s} svg too large (${svg.length})`);
    }
  }
});

test('rng is stable and well spread', () => {
  const r1 = K.rng('abc'), r2 = K.rng('abc');
  const seq = Array.from({ length: 5 }, () => r1());
  assert.deepEqual(seq, Array.from({ length: 5 }, () => r2()));
  const r = K.rng(42);
  let sum = 0;
  for (let i = 0; i < 10000; i++) { const v = r(); assert.ok(v >= 0 && v < 1); sum += v; }
  assert.ok(Math.abs(sum / 10000 - 0.5) < 0.02);
});

test('pngSetDpi writes a valid 300 dpi pHYs chunk', () => {
  // Build a 1x1 PNG by hand.
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(K.crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.from([0, 0, 0, 0, 0]))), chunk('IEND', Buffer.alloc(0))]);
  assert.equal(K.crc32(Buffer.from('IEND')), 0xae426082);
  const out = Buffer.from(K.pngSetDpi(png, 300));
  const at = out.indexOf('pHYs');
  assert.equal(at, 8 + 25 + 4, 'pHYs right after IHDR');
  assert.equal(out.readUInt32BE(at + 4), 11811);
  assert.equal(out.readUInt32BE(at + 8), 11811);
  assert.equal(out[at + 12], 1);
  assert.equal(out.readUInt32BE(at + 13), K.crc32(out.subarray(at, at + 13)));
  const twice = Buffer.from(K.pngSetDpi(out, 300));
  assert.equal(twice.length, out.length, 'existing pHYs is replaced, not duplicated');
});

test('drum wheel spreads hits evenly (Euclidean rhythm)', () => {
  const T = ctx.MakeTools['drum-wheel'];
  assert.equal(T.euclid(3, 8, 0).join(''), '10010010');
  assert.equal(T.euclid(4, 16, 0).join(''), '1000100010001000');
  for (const n of [8, 12, 16, 24, 32]) for (let k = 1; k < n; k++) {
    const hits = T.euclid(k, n, 0);
    assert.equal(hits.reduce((a, b) => a + b, 0), k);
    const pos = hits.flatMap((h, i) => (h ? [i] : []));
    const gaps = pos.map((p, i) => ((pos[(i + 1) % pos.length] - p + n) % n) || n);
    assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 1, `E(${k},${n}) uneven`);
  }
  const pat = T.pattern(K.decode('#voices=5&steps=16', T.schema));
  assert.deepEqual(Array.from(pat, (v) => v.id), ['kick', 'snare', 'clap', 'bell', 'hat']);
  assert.equal(T.pattern(K.decode('#voices=2', T.schema)).length, 2);
});

test('signal card keys the call sign in Morse and places the needle in band', () => {
  const T = ctx.MakeTools.signal;
  const sos = T.morse('SOS').map((q) => q.join(':')).join(' ');
  assert.equal(sos, '1:1 0:1 1:1 0:1 1:1 0:3 1:3 0:1 1:3 0:1 1:3 0:3 1:1 0:1 1:1 0:1 1:1');
  const st = K.decode('#band=fm&tune=0', T.schema);
  assert.equal(T.freq(st), 88);
  assert.equal(T.freq({ ...st, tune: 1000 }), 108);
});
