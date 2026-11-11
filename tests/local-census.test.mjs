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
    assert.equal(t.review.state, 'unread', `${r.slug} has not been read by a resident`);
    assert.equal(p.backing, `https://pointcast.xyz/api/poll?slug=${lc.backSlug(r.slug)}`);
    const ids = t.reads.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `${r.slug} step ids are unique`);
    for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]{0,30}$/, `${r.slug} step id ${id}`);
    assert.deepEqual(p.needs.map((x) => x.id), ids);
    assert.equal(p.neighbors.length, 3);
    for (const n of p.neighbors) assert.ok(region.towns.some((x) => x.slug === n), `${r.slug} neighbor ${n}`);
  }
});

test('the network maps the home region and lists far towns apart', () => {
  const { home, far } = pk.split(network);
  assert.deepEqual(home.map((t) => t.slug).sort(), region.towns.map((t) => t.slug).sort());
  assert.deepEqual(far.map((t) => t.slug), region.elsewhere.map((t) => t.slug));
  assert.equal(new Set(network.towns.map((t) => t.slug)).size, network.towns.length);
});

test('Medway is a draft: marked, unread, kept out of the South Bay totals and out of search', () => {
  const t = json('local-census/towns/medway.json');
  const p = json('local-census/medway/ping.json');
  assert.equal(t.status, 'draft');
  assert.equal(p.status, 'draft');
  assert.equal(p.review, 'unread');
  assert.deepEqual(p.neighbors, []);
  assert.ok(!region.towns.some((x) => x.slug === 'medway'));
  assert.ok(t.postings.note.includes('no filter for state'));
  assert.equal(lc.per100(t.postings.total, t.official.find((o) => o.label === 'Households').value), region.elsewhere[0].per100);
  for (const rd of t.reads) assert.equal(rd.confidence, 'low');
  assert.match(readFileSync(at('local-census/medway/index.html'), 'utf8'), /name="robots" content="noindex"/);
  assert.doesNotMatch(readFileSync(at('local-census/carson/index.html'), 'utf8'), /noindex/);
});

test('backing and ping-back helpers build what the server accepts', () => {
  for (const s of [lc.backSlug('manhattan-beach'), lc.hereSlug('manhattan-beach')]) assert.match(s, /^[a-z0-9][a-z0-9-]{0,60}$/);
  assert.deepEqual(lc.vote('census-carson', 'town-of-owners', 'now'), { type: 'pc-poll-v1', slug: 'census-carson', optionId: 'town-of-owners', timestamp: 'now' });
  for (const [id] of lc.HERE) assert.match(id, /^[a-z0-9][a-z0-9-]{0,30}$/);
  assert.equal(lc.count({ a: 3 }, 'a'), 3);
  assert.equal(lc.count({ a: 'x' }, 'a'), 0);
  assert.equal(lc.count(undefined, 'a'), 0);
  assert.equal(lc.backLine(0), 'No one has backed this step yet');
  assert.equal(lc.backLine(1), '1 person would start here');
  assert.equal(lc.backLine(12), '12 people would start here');
  assert.equal(lc.note('Medway', '   ', '', '/x/'), null);
  const n = lc.note('Medway', 'x'.repeat(3000), 'c'.repeat(300), '/local-census/medway/');
  assert.equal(n.message.length, 2000);
  assert.ok(n.message.startsWith('Census note, Medway: '));
  assert.equal(n.contact.length, 200);
  assert.equal(lc.fmt(5.3, '+%'), '+5.3%');
  assert.equal(lc.fmt(-5.1, '+%'), '-5.1%');
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
