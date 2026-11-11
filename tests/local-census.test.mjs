// Local Census (ten towns) and the Ping Kit: data files agree with each other
// and the map helpers behave.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const at = (p) => new URL(`../public/${p}`, import.meta.url);
const json = (p) => JSON.parse(readFileSync(at(p), 'utf8'));
function load(path) {
  const mod = { exports: {} };
  new Function('module', readFileSync(at(path), 'utf8'))(mod);
  return mod.exports;
}
const lc = load('local-census/census.js');
const pk = load('ping-kit/ping-kit.js');
const region = json('local-census/region.json');
const network = json('ping-kit/network.json');

test('the region lists ten towns and its total is their sum', () => {
  assert.equal(region.towns.length, 10);
  assert.equal(region.total, region.towns.reduce((n, t) => n + t.postings, 0));
});

test('every town has a data file, a page and a ping that agree', () => {
  for (const r of region.towns) {
    const t = json(`local-census/towns/${r.slug}.json`);
    assert.ok(existsSync(at(`local-census/${r.slug}/index.html`)), `${r.slug} page`);
    assert.equal(t.postings.total, r.postings, `${r.slug} total`);
    const hh = t.official.find((o) => o.label === 'Households').value;
    assert.equal(lc.per100(t.postings.total, hh), r.per100, `${r.slug} rate`);
    assert.equal(t.postings.families.length, 10);
    for (const o of t.official) {
      assert.ok(lc.GRADES[o.grade], `${r.slug} ${o.label} grade`);
      assert.match(o.url, /^https:\/\//, `${r.slug} ${o.label} source`);
    }
    for (const rd of t.reads) assert.ok(['low', 'medium', 'high'].includes(rd.confidence), `${r.slug} confidence`);
    const p = json(`local-census/${r.slug}/ping.json`);
    assert.equal(p.ping, '0.1');
    assert.equal(p.signals.find((s) => s.kind === 'jobs_posted_30d').value, r.postings);
    assert.equal(p.needs.length, t.reads.length);
    assert.equal(p.neighbors.length, 3);
    for (const n of p.neighbors) assert.ok(region.towns.some((x) => x.slug === n), `${r.slug} neighbor ${n}`);
  }
});

test('the network file lists every town once', () => {
  assert.deepEqual(network.towns.map((t) => t.slug).sort(), region.towns.map((t) => t.slug).sort());
});

test('map helpers: dots stay in the box, links are not doubled', () => {
  const box = pk.bounds(network.towns);
  for (const t of network.towns) {
    const p = pk.project(t.lat, t.lon, box, 360, 400, 46);
    assert.ok(p.x >= 0 && p.x <= 360 && p.y >= 0 && p.y <= 400, t.slug);
  }
  const ls = pk.links([{ slug: 'a', neighbors: ['b'] }, { slug: 'b', neighbors: ['a'] }]);
  assert.equal(ls.length, 1);
  assert.ok(pk.radius(400, 100) > pk.radius(100, 100));
});

test('the brief names the grades and the ping version the files use', () => {
  const brief = readFileSync(at('ping-kit/brief.md'), 'utf8');
  assert.match(brief, /"ping": "0\.1"/);
  for (const g of Object.keys(lc.GRADES)) assert.match(brief, new RegExp(`${g}: `), `grade ${g}`);
});
