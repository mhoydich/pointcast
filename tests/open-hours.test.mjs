// Open Hours (/open-hours) and Local Census (/local-census): the pure helpers
// behind both pages, plus the data files the census pages draw from.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function load(path) {
  const mod = { exports: {} };
  new Function('module', readFileSync(new URL(path, import.meta.url), 'utf8'))(mod);
  return mod.exports;
}
const oh = load('../public/open-hours/open-hours.js');
const lc = load('../public/local-census/census.js');

test('the working day maps each hour to a station', () => {
  const at = (h) => oh.STATIONS[oh.stationIndexForHour(h)].id;
  assert.equal(at(6), 'open-bell');
  assert.equal(at(9), 'open-coin');
  assert.equal(at(13), 'open-noon');
  assert.equal(at(14), 'open-deal');
  assert.equal(at(19), 'open-count');
  assert.equal(at(20), 'open-shelf');
  assert.equal(at(2), 'open-shelf', 'before opening is still after hours');
});

test('a tap is one coin and a full hold is nine', () => {
  assert.equal(oh.coinsFor(oh.offering(0)), 1);
  assert.equal(oh.coinsFor(oh.offering(99999)), 9);
  assert.ok(oh.tickGap(1) < oh.tickGap(0), 'ticks speed up as the offering gathers');
});

test('the chime bed gets busier with more prayers and never runs away', () => {
  assert.ok(oh.chimeGap(40) < oh.chimeGap(0));
  assert.ok(oh.chimeGap(100000) >= 1.1);
});

test('a vibration pattern becomes tick times for the iPhone path', () => {
  assert.deepEqual(oh.tickTimes([28, 70, 28]), [0, 98]);
});

test('every open-hours station is accepted by the prayer ledger', () => {
  const api = readFileSync(new URL('../functions/api/prayer.ts', import.meta.url), 'utf8');
  for (const st of oh.STATIONS) assert.ok(api.includes(`'${st.id}'`), st.id);
});

test('census formatting and the postings rate', () => {
  assert.equal(lc.fmt(149149, '$'), '$149,149');
  assert.equal(lc.fmt(70000, 'n~'), 'about 70,000');
  assert.equal(lc.per100(2728, 7125), 38.3);
  assert.equal(lc.per100(10, 0), null);
});

test('town files carry a grade and a source on every official figure', () => {
  for (const slug of ['el-segundo', 'torrance']) {
    const t = JSON.parse(readFileSync(new URL(`../public/local-census/towns/${slug}.json`, import.meta.url), 'utf8'));
    assert.equal(t.slug, slug);
    for (const o of t.official) {
      assert.ok(lc.GRADES[o.grade], `${slug} ${o.label} grade`);
      assert.match(o.url, /^https:\/\//, `${slug} ${o.label} source`);
    }
    assert.equal(t.postings.families.length, 10);
    for (const r of t.reads) assert.ok(['low', 'medium', 'high'].includes(r.confidence));
  }
  const region = JSON.parse(readFileSync(new URL('../public/local-census/region.json', import.meta.url), 'utf8'));
  assert.equal(region.total, region.towns.reduce((n, t) => n + t.postings, 0));
});
