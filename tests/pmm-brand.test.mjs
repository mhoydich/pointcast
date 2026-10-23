// PMM brand v2 guards: the sigil generator is deterministic and agrees with app.js, every
// documented text/background pair really clears WCAG AA, the tokens the brand page documents
// are the ones style.css ships, and the generated artwork and plate prompts are where the page
// says they are. Regenerate the artwork with `node scripts/pmm-brand.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { EXAMPLES, GLYPHS, SIGIL_COLORS, bytesOf, sigil, sigilSVG } from '../public/pmm/brand/sigil.js';

const ROOT = resolve(import.meta.dirname, '..');
const PUB = join(ROOT, 'public');
const BRAND = join(PUB, 'pmm/brand');
const read = (p) => readFileSync(p, 'utf8');

const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const FIELD = '#40318D', FIELD2 = '#352577';

test('sigil: deterministic golden values', () => {
  const s = sigil('572e3abb');
  assert.equal(s.hex, '572E3ABB');
  assert.equal(s.glyphs, '▘●▞░');
  assert.equal(s.colorName, 'red');
  assert.equal(s.sprite.map((r) => r.join('')).join('/'), '01011010/01111110/00100100/11100111/00111100/10100101/10111101/10111101');
  assert.deepEqual(sigil('572E3ABB'), s, 'case does not matter');
  assert.deepEqual(sigil('572e3abb9999'), s, 'only the first 8 hex count');
});

test('sigil: sprite is 8 x 8, mirrored, and encodes all 32 bits', () => {
  for (const hex of [...EXAMPLES, '00000000', 'ffffffff', '0f0f0f0f']) {
    const { sprite } = sigil(hex);
    assert.equal(sprite.length, 8);
    let bits = 0;
    sprite.forEach((row) => {
      assert.equal(row.length, 8);
      for (let c = 0; c < 4; c++) assert.equal(row[c], row[7 - c], `${hex} mirrored`);
      for (let c = 0; c < 4; c++) bits = bits * 2 + row[c];
    });
    assert.equal(bits >>> 0, parseInt(hex, 16), `${hex} round-trips through the sprite`);
  }
});

test('sigil: glyphs match app.js sigilOf exactly', () => {
  const app = read(join(PUB, 'pmm/app.js'));
  const m = /const GLYPHS = (\[[^\]]+\]);/.exec(app);
  assert.ok(m, 'app.js declares GLYPHS');
  assert.deepEqual(JSON.parse(m[1].replace(/'/g, '"')), GLYPHS);
  assert.match(app, /GLYPHS\[b\[0\] & 15\] \+ GLYPHS\[b\[1\] & 15\] \+ GLYPHS\[b\[2\] & 15\] \+ GLYPHS\[b\[3\] & 15\]/, 'app.js still maps the low nibble of each byte');
  for (const hex of EXAMPLES) assert.equal(sigil(hex).glyphs, bytesOf(hex).map((b) => GLYPHS[b & 15]).join(''));
});

test('sigil: bad input is refused, and every colour is reachable and accessible', () => {
  assert.throws(() => sigil('xyz'), TypeError);
  assert.throws(() => sigil(''), TypeError);
  assert.equal(EXAMPLES.length, 12);
  assert.equal(new Set(EXAMPLES.map((h) => sigil(h).colorName)).size, 8, 'the examples show all eight colours');
  assert.equal(SIGIL_COLORS.length, 8);
  for (const [name, c] of SIGIL_COLORS) {
    assert.ok(contrast(c, FIELD) >= 3, `${name} ${c} vs --field ${contrast(c, FIELD).toFixed(2)}`);
    assert.ok(contrast(c, FIELD2) >= 4.5, `${name} ${c} vs --field-2 ${contrast(c, FIELD2).toFixed(2)}`);
  }
  const svg = sigilSVG('572e3abb');
  assert.match(svg, /^<svg [^>]*viewBox="0 0 10 10"/);
  assert.equal((svg.match(/<rect /g) || []).length, 1 + sigil('572e3abb').sprite.flat().filter(Boolean).length);
});

test('brand page: every documented contrast pair clears its WCAG AA minimum', () => {
  const html = read(join(BRAND, 'index.html'));
  const rows = [...html.matchAll(/<tr data-fg="(#[0-9A-F]{6})" data-bg="(#[0-9A-F]{6})" data-min="([\d.]+)" data-ratio="([\d.]+)">/g)];
  assert.ok(rows.length >= 12, `found ${rows.length} contrast rows`);
  for (const [, fg, bg, min, shown] of rows) {
    const r = contrast(fg, bg);
    assert.ok(r >= Number(min), `${fg} on ${bg} is ${r.toFixed(2)}, needs ${min}`);
    assert.equal(shown, (Math.floor(r * 100) / 100).toFixed(2), `${fg} on ${bg}: the page shows ${shown}`);
  }
});

test('style.css: :root tokens match tokens.json, and text colours stay off the Fuji red', () => {
  const css = read(join(PUB, 'pmm/style.css'));
  const root = /:root\s*{([\s\S]*?)}/.exec(css)[1];
  const vars = Object.fromEntries([...root.matchAll(/(--[\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]));
  const tokens = JSON.parse(read(join(BRAND, 'tokens.json')));
  for (const [k, v] of Object.entries(tokens.color)) assert.equal(vars[k], v.toUpperCase(), `${k} in style.css`);
  // Red and green Fuji stripes are graphics; as text on the field they fail AA.
  assert.doesNotMatch(css, /(?:^|[;{\s])color:\s*var\(--r1\)/m, 'no text in --r1; use --err');
  assert.doesNotMatch(css, /(?:^|[;{\s])color:\s*var\(--r4\)/m, 'no text in --r4; use --ok');
  // Mood washes stay at or under 30% so ink over the brightest mood keeps 4.5:1.
  for (const m of css.matchAll(/color-mix\(in srgb, var\(--(?:m|mood-me|mood-them)\) (\d+)%/g)) assert.ok(Number(m[1]) <= 30, `mood wash ${m[1]}%`);
});

test('artwork: logos, icons, sticker sheet and sigils exist and are what the page links', () => {
  const html = read(join(BRAND, 'index.html'));
  const refs = new Set([...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('..') && !u.startsWith('/')));
  for (const u of refs) assert.ok(existsSync(join(BRAND, u)), `brand page links ${u}`);
  for (const f of ['wordmark.svg', 'logo/pmm-wordmark.svg', 'logo/pmm-wordmark-mono.svg', 'logo/pmm-lockup-horizontal.svg', 'logo/pmm-lockup-stacked.svg', 'logo/pmm-mark.svg', 'logo/pmm-mark-16.svg', 'sigils.svg', 'sticker-sheet.svg']) {
    const svg = read(join(BRAND, f));
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="[\d. ]+"/, `${f} is an svg`);
    assert.match(svg, /shape-rendering="crispEdges"/, `${f} stays pixel-crisp`);
    assert.doesNotMatch(svg, /<text|<image|href=/, `${f} is self-contained rects, no fonts or embeds`);
  }
  const pngSize = (p) => { const b = readFileSync(p); assert.equal(b.toString('hex', 0, 8), '89504e470d0a1a0a', `${p} is a PNG`); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  for (const v of ['classic', 'ready', 'fuji', 'paper']) {
    assert.ok(existsSync(join(BRAND, `icons/pmm-icon-${v}.svg`)));
    for (const s of [180, 192, 512]) assert.deepEqual(pngSize(join(BRAND, `icons/pmm-icon-${v}-${s}.png`)), [s, s]);
  }
  const [w, h] = pngSize(join(BRAND, 'sticker-sheet.png'));
  assert.ok(w >= 1200 && h >= 900, `sticker sheet ${w}x${h}`);
});

test('manifest icons still resolve and were left alone', () => {
  const manifest = JSON.parse(read(join(PUB, 'pmm/manifest.webmanifest')));
  for (const i of manifest.icons) assert.ok(existsSync(join(PUB, i.src)), i.src);
});

test('plate prompts: scripts/plates/batch/pmm-brand.json is well-formed', () => {
  const plates = JSON.parse(read(join(ROOT, 'scripts/plates/batch/pmm-brand.json')));
  assert.ok(Array.isArray(plates) && plates.length >= 8 && plates.length <= 10, `${plates.length} plates`);
  const outs = new Set();
  for (const p of plates) {
    assert.match(p.out, /^public\/images\/pmm\/brand\/[a-z0-9-]+\.png$/);
    assert.ok(!outs.has(p.out), `duplicate ${p.out}`); outs.add(p.out);
    assert.ok(['portrait', 'square', 'landscape'].includes(p.aspect), p.aspect);
    assert.equal(p.quality, 'high');
    assert.ok(typeof p.prompt === 'string' && p.prompt.length > 200, `${p.out} prompt has substance`);
    assert.match(p.prompt, /no (brand )?logos|no real-world logos/i, `${p.out} asks for no logos`);
    if (p.og) assert.match(p.og, /^public\/images\/pmm\/brand\/[a-z0-9-]+-og\.png$/);
  }
});
