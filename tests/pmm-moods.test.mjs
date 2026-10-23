// The PMM Mood Atlas module: the eight moods match app.js, glyphs and motifs are well formed,
// the vocabulary map translates every mood every way, and the atmosphere line and world strip
// come out as PMM draws them. Plus the image batch for the atlas plates.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  MOODS, MOOD_IDS, mood, SITE_MOODS, BREAKWATER_LABELS, NOGGLE_COLORS, toSiteMood, fromSiteMood, toNoggle, fromBreakwater,
  atmosphere, worldStrip, ZONES, daylight, mix, contrast, inkOn, freq, schedule, FIELD,
} from '../public/pmm/moods/moods.js';
import { siteMoodFromLabel, dialFromSiteMood } from '../src/lib/breakwater/mood.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');

test('the eight moods and colours are exactly the ones app.js uses, in order', () => {
  const src = /const MOODS = \[([\s\S]*?)\];/.exec(read('public/pmm/app.js'))[1];
  const inApp = [...src.matchAll(/\['(\w+)', '(#[0-9A-Fa-f]{6})'\]/g)].map((m) => [m[1], m[2]]);
  assert.equal(inApp.length, 8);
  assert.deepEqual(MOODS.map((m) => [m.id, m.color]), inApp);
});

test('unknown moods read as calm, as validMood() does in app.js', () => {
  assert.equal(mood('nope').id, 'calm');
  assert.equal(mood(undefined).id, 'calm');
});

test('every glyph is an 8 by 8 cell with something drawn in it, and no two are the same', () => {
  for (const m of MOODS) {
    assert.equal(m.glyph.length, 8, m.id);
    for (const row of m.glyph) assert.match(row, /^[#.]{8}$/, `${m.id}: ${row}`);
    assert.ok(m.glyph.join('').includes('#'), m.id);
  }
  assert.equal(new Set(MOODS.map((m) => m.glyph.join(''))).size, 8);
});

test('every motif is short, playable and distinct', () => {
  for (const m of MOODS) {
    const ev = schedule(m.id);
    assert.ok(ev.length >= 3 && ev.length <= 8, m.id);
    const end = ev.at(-1).at + ev.at(-1).dur;
    assert.ok(end > 0.5 && end < 3, `${m.id} lasts ${end}s`);
    for (const e of ev) assert.ok(e.hz > 150 && e.hz < 2100, `${m.id} ${e.hz}`);
    assert.ok(['square', 'triangle', 'sine', 'sawtooth'].includes(m.motif.wave));
  }
  assert.equal(new Set(MOODS.map((m) => JSON.stringify(m.motif))).size, 8);
  assert.equal(Math.round(freq('A4')), 440);
  assert.equal(Math.round(freq('C4')), 262);
  assert.throws(() => freq('H2'));
});

test('every mood has a one-line signal for a friend', () => {
  for (const m of MOODS) {
    assert.ok(m.signal.length > 10 && m.signal.length <= 64, m.id);
    assert.ok(!m.signal.includes('\n'));
  }
});

test('the site slugs here are the ones MoodChip offers', () => {
  const chip = read('src/components/MoodChip.astro');
  const ids = [...chip.matchAll(/\{ id: '(\w+)',/g)].map((m) => m[1]);
  assert.deepEqual([...SITE_MOODS], ids);
});

test('vocabulary: every PMM mood maps to a site slug and a noggle, and every slug maps back', () => {
  for (const id of MOOD_IDS) {
    assert.ok(SITE_MOODS.includes(toSiteMood(id)), id);
    assert.ok(NOGGLE_COLORS.includes(toNoggle(id)), id);
  }
  for (const slug of SITE_MOODS) assert.ok(MOOD_IDS.includes(fromSiteMood(slug)), slug);
  assert.equal(fromSiteMood('not-a-slug'), 'calm');
  // A mood that owns its slug survives the round trip.
  for (const id of ['calm', 'hyped', 'soft', 'curious', 'tired']) assert.equal(fromSiteMood(toSiteMood(id)), id);
  // Every site slug that comes back to PMM goes out to the same slug, except focus, which PMM has no twin for.
  for (const slug of SITE_MOODS.filter((s) => s !== 'focus')) assert.equal(toSiteMood(fromSiteMood(slug)), slug);
});

test('vocabulary: the noggles named here are the ones Nouns Messenger has', () => {
  const src = /const COLORS = \{([^}]*)\}/.exec(read('public/nouns-messenger/app.js'))[1];
  assert.deepEqual([...NOGGLE_COLORS].sort(), [...src.matchAll(/(\w+):/g)].map((m) => m[1]).sort());
  assert.equal(new Set(MOOD_IDS.map(toNoggle)).size, 8, 'one noggle per mood');
});

test('vocabulary: Breakwater labels go through the same slug Breakwater hands the town', () => {
  for (const label of BREAKWATER_LABELS) assert.equal(fromBreakwater(label), fromSiteMood(siteMoodFromLabel(label)));
  // And a PMM mood, sent to the town, starts Breakwater on a dial it knows.
  for (const id of MOOD_IDS) assert.ok(['calm', 'play', 'rush'].includes(dialFromSiteMood(toSiteMood(id))));
});

test('atmosphere: both moods and both local hours on one line, gradient from yours to theirs', () => {
  const at = new Date('2026-10-23T16:30:00Z');
  const a = atmosphere({ mood: 'sunny', tz: 'America/Los_Angeles', place: 'El Segundo' }, { name: 'ANA', mood: 'tired', tz: 'Europe/Lisbon' }, at);
  assert.equal(a.line, 'YOU: sunny · 9:30 AM El Segundo   ·   ANA: tired · 5:30 PM Lisbon');
  assert.equal(a.line_gradient, `linear-gradient(90deg, ${mix('#F5D142', FIELD, 0.4)}, ${mix('#8A86A8', FIELD, 0.4)})`);
  assert.match(a.pane_gradient, /^linear-gradient\(180deg, #[0-9A-F]{6}, #40318D 40%, #[0-9A-F]{6}\)$/);
  const b = atmosphere({ mood: 'x' }, { name: 'B', mood: 'low' }, at);
  assert.equal(b.line, 'YOU: calm · somewhere   ·   B: low · somewhere');
});

test('world strip: 24 zones, the right hours, bright at noon and dark at night', () => {
  assert.equal(ZONES.length, 24);
  assert.deepEqual([ZONES[0], ZONES.at(-1)], [-11, 12]);
  const at = new Date('2026-10-23T12:00:00Z');
  const s = worldStrip('hyped', at);
  assert.equal(s.length, 24);
  assert.deepEqual(s.map((c) => c.hour), ZONES.map((o) => (12 + o + 24) % 24));
  const noon = s.find((c) => c.offset === 0), midnight = s.find((c) => c.offset === 12);
  assert.equal(noon.color, '#E8453C');
  assert.equal(midnight.light, 0);
  assert.ok(contrast(noon.color, '#1A1440') > contrast(midnight.color, '#1A1440'));
  assert.equal(daylight(12), 1); assert.equal(daylight(3), 0); assert.equal(daylight(23), 0);
  assert.ok(daylight(8) > 0 && daylight(8) < daylight(11));
});

test('contrast: the page text pairs pass AA, and every mood fill has readable ink', () => {
  for (const [fg, bg] of [['#F2F0FF', '#40318D'], ['#BDB4F0', '#40318D'], ['#BDB4F0', '#352577'], ['#F5D142', '#40318D']]) {
    assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg}: ${contrast(fg, bg).toFixed(2)}`);
  }
  for (const m of MOODS) assert.ok(contrast(inkOn(m.color), m.color) >= 4.5, `${m.id}: ${contrast(inkOn(m.color), m.color).toFixed(2)}`);
});

test('the atlas page is linked from PMM settings and the brand page, and loads the module', () => {
  assert.match(read('public/pmm/index.html'), /<a href="moods\/">moods<\/a>/);
  assert.match(read('public/pmm/brand/index.html'), /href="\.\.\/moods\/"/);
  const html = read('public/pmm/moods/index.html');
  assert.match(html, /from '\.\/moods\.js'/);
  assert.match(html, /prefers-reduced-motion/);
  assert.ok(!/autoplay/i.test(html), 'no autoplay');
  // The AudioContext is made inside play(), which only a click calls.
  assert.equal([...html.matchAll(/new A\(\)/g)].length, 1);
  assert.match(html, /function play\(/);
  assert.match(html, /No one else is on this strip/);
});

test('image batch: one plate per mood, an atlas hero and an OG card', () => {
  const batch = JSON.parse(read('scripts/plates/batch/pmm-moods.json'));
  assert.ok(Array.isArray(batch));
  const outs = batch.map((b) => b.out);
  for (const id of MOOD_IDS) assert.ok(outs.includes(`public/images/pmm/moods/${id}.png`), id);
  assert.ok(outs.includes('public/images/pmm/moods/atlas-hero.png'));
  assert.ok(outs.includes('public/images/pmm/moods/og.png'));
  assert.equal(batch.length, 10);
  for (const b of batch) {
    assert.deepEqual(Object.keys(b).sort(), ['aspect', 'out', 'prompt', 'quality']);
    assert.equal(b.quality, 'high');
    assert.ok(['square', 'landscape'].includes(b.aspect));
    assert.ok(b.prompt.length > 200, b.out);
    assert.ok(!existsSync(resolve(ROOT, b.out)) || b.out.endsWith('.png'));
  }
  for (const m of MOODS) assert.ok(batch.find((b) => b.out.endsWith(`/${m.id}.png`)).prompt.includes(m.color), `${m.id} prompt names its colour`);
});
