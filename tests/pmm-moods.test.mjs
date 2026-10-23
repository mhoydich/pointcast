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
  for (const id of ['calm', 'hyped', 'soft', 'salty', 'curious', 'tired']) assert.equal(fromSiteMood(toSiteMood(id)), id);
  // Every site slug comes back to a PMM mood that goes out to the same slug.
  for (const slug of SITE_MOODS) assert.equal(toSiteMood(fromSiteMood(slug)), slug);
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
  // The AudioContext is made inside play(), and only a click handler calls play().
  const body = /function play\([^)]*\) \{([\s\S]*?)\n\}/.exec(html)?.[1] || '';
  assert.match(body, /new A\(\)/, 'play() makes the AudioContext');
  assert.ok(!/new A\(\)|AudioContext/.test(html.replace(body, '')), 'nothing outside play() touches AudioContext');
  assert.equal([...html.matchAll(/(?<!function )\bplay\(m, /g)].length, 1, 'play() is called from one place');
  assert.match(html, /addEventListener\('click', \(\) => \(btn\.getAttribute\('aria-pressed'\) === 'true' && playing \? playing\.stop\(\) : play\(m, btn, svg\)\)\)/);
  // The minute redraw must not re-announce the chat: only the change handler writes the status line.
  assert.ok(!/id="chat"[^>]*aria-live/.test(html));
  assert.equal([...html.matchAll(/\$\('chat-status'\)\.textContent =/g)].length, 1);
});

test('the no-server claim names the one exception the app has: the SI line posts mood to /api/ping', () => {
  const app = read('public/pmm/app.js');
  assert.match(app, /const PING = '\/api\/ping'/);
  assert.ok(app.includes('mood: ${m.mood}\\nlocal time: ${m.lt} (${m.tz})\\nplace:'), 'the SI SEND body carries mood, hour, zone and place');
  const note = /<p class="note"><b>No one else([\s\S]*?)<\/p>/.exec(read('public/pmm/moods/index.html'))[1];
  assert.match(note, /^ is on this strip/);
  assert.match(note, /SI line is the one exception/);
  assert.match(note, /\/api\/ping/);
  assert.ok(!/nothing counts or stores/.test(note));
});

test('image batch: one plate per mood, and an atlas hero with its OG crop', () => {
  const batch = JSON.parse(read('scripts/plates/batch/pmm-moods.json'));
  assert.ok(Array.isArray(batch));
  const outs = batch.map((b) => b.out);
  for (const id of MOOD_IDS) assert.ok(outs.includes(`public/images/pmm/moods/${id}.png`), id);
  const hero = batch.find((b) => b.out === 'public/images/pmm/moods/atlas-hero.png');
  assert.ok(hero);
  assert.equal(hero.og, 'public/images/pmm/moods/atlas-og.png');
  assert.equal(batch.length, 9);
  for (const b of batch) {
    const keys = Object.keys(b).filter((k) => k !== 'og').sort();
    assert.deepEqual(keys, ['aspect', 'out', 'prompt', 'quality']);
    assert.equal(b.quality, 'high');
    assert.ok(['square', 'landscape'].includes(b.aspect));
    assert.ok(b.prompt.length > 200, b.out);
    // The prompt describes the shape the runner renders.
    assert.ok(b.prompt.includes(`flat ${b.aspect} plate`), `${b.out} says ${b.aspect}`);
    assert.ok(!existsSync(resolve(ROOT, b.out)) || b.out.endsWith('.png'));
  }
  for (const m of MOODS) assert.ok(batch.find((b) => b.out.endsWith(`/${m.id}.png`)).prompt.includes(m.color), `${m.id} prompt names its colour`);
});
