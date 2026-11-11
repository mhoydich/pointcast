import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROW, SITE_TO_LABEL, WHY, litSlugs, readSave, rowMood, suggest, ribbon } from '../src/lib/breakwater/row.mjs';
import { LABELS, createMood, moodEvent, moodStep, serializeMood, siteMoodFromLabel } from '../src/lib/breakwater/mood.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/game-catalog.json'), 'utf8'));

test('row: every cabinet is well formed and unique', () => {
  assert.ok(ROW.length >= 6);
  assert.equal(new Set(ROW.map((c) => c.slug)).size, ROW.length);
  for (const c of ROW) {
    assert.match(c.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(c.route, `/${c.slug}`);
    assert.equal(c.storeKey, `${c.slug}:v1`);
    assert.ok(c.name && c.after && c.tagline);
    assert.ok(Number.isInteger(c.year) && c.year >= 1970 && c.year <= 1989, `${c.slug} year`);
    assert.ok(c.moods.length >= 1 && c.moods.every((m) => LABELS.includes(m)));
  }
  for (const label of LABELS) assert.ok(ROW.some((c) => c.moods.includes(label)), `someone suits ${label}`);
  for (const label of LABELS) assert.ok(WHY[label]);
});

test('row: a lit cabinet is a real game in the catalog with a page and cover art', () => {
  const lit = litSlugs(catalog.map((g) => g.slug));
  assert.ok(lit.includes('breakwater'));
  for (const slug of lit) {
    assert.ok(fs.existsSync(path.join(root, 'src/pages', `${slug}.astro`)), `${slug} page`);
    assert.ok(fs.existsSync(path.join(root, 'public/images', slug, 'og.png')), `${slug} cover`);
  }
});

test('row: the town mood and the lobby agree in both directions', () => {
  for (const label of LABELS) assert.equal(SITE_TO_LABEL[siteMoodFromLabel(label)], label);
});

test('readSave: tolerant of anything the browser hands back', () => {
  for (const raw of [null, undefined, '', 'not json', '[]', '{"mood":[]}', 42, { mood: 'x' }]) {
    const s = readSave(raw);
    assert.equal(s.played, false);
    assert.equal(s.best, 0);
    assert.deepEqual(s.tape, []);
    assert.equal(s.label, null);
  }
  const tide = readSave(JSON.stringify({ bestRally: 17, wins: 2, machine: 'c64', mood: { label: 'FLOW', peak: 'RUSH', energy: 1.7, calm: -1, tape: [0, 1, 9, 'x', 2.5, 3] } }));
  assert.equal(tide.best, 17);
  assert.equal(tide.played, true);
  assert.equal(tide.machine, 'c64');
  assert.deepEqual(tide.tape, [0, 1, 3]);
  assert.equal(tide.energy, 1);
  assert.equal(tide.calm, 0);
  const real = createMood('play');
  for (let i = 0; i < 20; i += 1) { moodStep(real, 2.5); moodEvent(real, 'paddle'); moodEvent(real, 'brick'); }
  const s = readSave({ best: 470.9, mood: serializeMood(real) });
  assert.equal(s.best, 470);
  assert.ok(s.tape.length > 0);
  assert.ok(LABELS.includes(s.label));
});

test('rowMood: the last game handed the town its mood; otherwise the tapes vote; otherwise DAWN', () => {
  assert.deepEqual(rowMood('hype', {}), { label: 'RUSH', source: 'town' });
  assert.deepEqual(rowMood('focus', {}), { label: 'DAWN', source: 'default' });
  const saves = { kelp: readSave({ mood: { tape: [3, 3, 3, 3, 1] } }), breakwater: readSave({ mood: { tape: [1, 1] } }) };
  assert.deepEqual(rowMood(null, saves), { label: 'DRIFT', source: 'tapes' });
});

test('suggest: lit only, affinity first, unplayed preferred, sensible fallbacks', () => {
  assert.equal(suggest('FLOW', [], {}), null);
  assert.equal(suggest('RUSH', ['breakwater'], {}).slug, 'breakwater', 'only one lit cabinet');
  const lit = ['breakwater', 'tideline', 'kelp', 'soft-landing', 'crosswalk', 'driftwood'];
  assert.equal(suggest('FLOW', lit, {}).slug, 'breakwater');
  assert.equal(suggest('FLOW', lit, { breakwater: { played: true } }).slug, 'tideline');
  assert.equal(suggest('RUSH', lit, {}).slug, 'crosswalk');
  assert.equal(suggest('DRIFT', lit, {}).slug, 'kelp');
  const allPlayed = Object.fromEntries(lit.map((s) => [s, { played: true }]));
  assert.equal(suggest('DRIFT', lit, allPlayed).slug, 'kelp', 'everything played: strongest affinity');
  for (const label of LABELS) for (let n = 1; n <= ROW.length; n += 1) {
    const someLit = ROW.slice(0, n).map((c) => c.slug);
    assert.ok(someLit.includes(suggest(label, someLit, {}).slug), 'never suggests a dark cabinet');
  }
});

test('ribbon: lit and played cabinets only, in row order, trimmed', () => {
  const saves = { driftwood: { tape: [2, 2, 2] }, breakwater: { tape: Array.from({ length: 50 }, (_, i) => i % 4) }, lighthouse: { tape: [3] } };
  const r = ribbon(['breakwater', 'driftwood'], saves, 20);
  assert.deepEqual(r.map((x) => x.slug), ['breakwater', 'driftwood']);
  assert.equal(r[0].values.length, 20);
});
