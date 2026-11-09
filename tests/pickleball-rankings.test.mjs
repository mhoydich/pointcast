// PointCast pickleball rankings: the recipe, the data rules and the rollup, as tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as R from '../src/lib/pickleball-rankings/rating.js';
import { buildTiers, pool, rank, divisionLevel, recency, byLevel, LEVEL_BANDS } from '../src/lib/pickleball-rankings/tiers.mjs';
import { checkRow, isLinkOnly, nameHash, LINK_ONLY_HOSTS, ROW_FIELDS } from '../src/lib/pickleball-rankings/rules.mjs';
import { isNoindexPath } from '../src/lib/seo-rules.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const FEED = read('../src/data/pickleball-rankings/feeds/el-segundo-25.json');
const NO = { identities: { merges: [], claims: {} }, doNotList: { entries: [] } };

test('recipe constants match the El Segundo ladder', () => {
  assert.deepEqual(R.PLACE_ADJ, { 1: 0.25, 2: 0.10, 3: 0, 4: -0.10 });
  assert.equal(R.SMALL_DRAW_TEAMS, 3);
  assert.equal(R.SMALL_DRAW_WEIGHT, 0.5);
  assert.equal(R.DECLARED_WEIGHT, 3);
  assert.equal(R.BAND_AT_ZERO, 0.5);
  assert.equal(R.MIN, 2.0);
  assert.equal(R.MAX, 8.0);
  assert.equal(LEVEL_BANDS.length, 13);
  assert.equal(R.levelName(3.74), '3.5');
  assert.equal(R.levelName(3.76), '4.0');
});

test('band, half-weight draws, declared weight and tags', () => {
  const one = R.fromResults([{ level: 4.0, place: 1, teams: 8, recency: 1 }]);
  assert.equal(one.est, 4.25);
  assert.equal(R.blend(one).plusMinus, Number((0.5 / Math.sqrt(2)).toFixed(2)));
  assert.equal(R.fromResults([{ level: 4.0, place: 1, teams: 3, recency: 1 }]).weight, 0.5);
  const b = R.blend({ est: 4.25, weight: 1, declared: 3.5 });
  assert.equal(b.value, Number(((4.25 + 3.5 * 3) / 4).toFixed(2)));
  assert.equal(b.gap, -0.75);
  assert.equal(R.tagFor({ results: 0, declared: true }), 'Self-declared');
  assert.equal(R.tagFor({ results: 2 }), 'Provisional');
  assert.equal(R.tagFor({ results: 3 }), 'Settled');
});

test('division level and recency read like elsegundo.xyz', () => {
  assert.equal(divisionLevel('Open'), 5.5);
  assert.equal(divisionLevel('4.5'), 4.5);
  assert.equal(divisionLevel(''), 3.5);
  assert.equal(recency('2025-11-08', '2026-11-08'), 0.5);
  assert.equal(recency('2024-01-01', '2026-11-08'), 0);
});

test('regional ladder lists every feed player; ratings match across tiers', () => {
  const es = read('../src/data/pickleball-rankings/feeds/el-segundo-25.json');
  const t = buildTiers([es], NO);
  const reg = t.regional[0];
  assert.equal(reg.players.length, Object.keys(es.players).length);
  // Same rows, same recipe: the rating is identical on every tier.
  const nat = new Map(t.national.players.map((p) => [p.id, p]));
  for (const p of reg.players) assert.equal(nat.get(p.id).court_rating, p.court_rating);
  // Ordered by rating, then band, then name.
  for (let i = 1; i < reg.players.length; i++) {
    const a = reg.players[i - 1], b = reg.players[i];
    assert.ok(a.court_rating > b.court_rating || (a.court_rating === b.court_rating && (a.band < b.band || (a.band === b.band && a.name.localeCompare(b.name) <= 0))));
  }
});

test('level view is a filter in the same order', () => {
  const t = buildTiers([FEED], NO);
  const four = byLevel(t.national.players, '4.0');
  assert.ok(four.length > 0);
  assert.ok(four.every((p) => p.level === '4.0'));
  assert.deepEqual(four.map((p) => p.id), t.national.players.filter((p) => p.level === '4.0').map((p) => p.id));
});

test('the same finish from two feeds counts once nationally; slugs do not merge by name', () => {
  const twin = { ...FEED, feed_id: 'twin', name: 'Twin ladder' };
  const t = buildTiers([FEED, twin], NO);
  // Different feeds keep separate ids without an explicit merge, so nothing collapses by name.
  assert.equal(t.national.players.length, 2 * t.regional[0].players.length);
  const merges = Object.keys(FEED.players).map((s) => ({ ids: [`twin/${s}`], into: `el-segundo-25/${s}` }));
  const m = buildTiers([FEED, twin], { ...NO, identities: { merges, claims: {} } });
  assert.equal(m.national.players.length, t.regional[0].players.length);
  const one = m.national.players[0], solo = t.regional[0].players.find((p) => p.id === one.id);
  assert.equal(one.court_rating, solo.court_rating);
});

test('national keeps only US venues; global opens with a second country', () => {
  const ca = { ...FEED, feed_id: 'ca', country: 'CA', events: FEED.events.map((e) => ({ ...e, country: 'CA' })) };
  const t = buildTiers([FEED, ca], NO);
  assert.equal(t.national.feeds.length, 1);
  assert.equal(t.global.feeds.length, 2);
});

test('do-not-list removes a player from every tier, partners show as left out', () => {
  const victim = Object.entries(FEED.players).find(([s]) => FEED.results.some((r) => r.team.length === 2 && r.team.includes(s)));
  const [slug, { name }] = victim;
  const t = buildTiers([FEED], { ...NO, doNotList: { entries: [{ sha256: nameHash(name) }] } });
  for (const tier of [t.national, t.global, ...t.regional]) assert.ok(!tier.players.some((p) => p.id.endsWith(`/${slug}`)));
  const partnerRow = t.national.players.flatMap((p) => p.results).find((r) => r.row.team.includes(null));
  assert.ok(partnerRow, 'partner of a removed player keeps the finish with a blank teammate');
});

test('rows: link-only hosts, junior divisions and extra fields are refused', () => {
  const ok = { event_id: 'x', division: "Men's 4.0", category: 'men', skill_level: '4.0', age_bracket: '', place: 1, draw_size: 8, team: ['a', 'b'], source_url: 'https://www.playcapa.com/x' };
  assert.equal(checkRow(ok), null);
  for (const h of LINK_ONLY_HOSTS) {
    assert.ok(isLinkOnly(`https://${h}/t/1`));
    assert.ok(isLinkOnly(`https://www.${h}/t/1`));
    assert.match(checkRow({ ...ok, source_url: `https://www.${h}/r` }), /link-only/);
  }
  assert.match(checkRow({ ...ok, division: 'Junior 14U Boys' }), /junior/);
  assert.match(checkRow({ ...ok, email: 'x@y.z' }), /not allowed/);
  assert.match(checkRow({ ...ok, source_url: 'http://example.com' }), /https/);
});

test('the committed feed holds only allowed fields and sources', () => {
  for (const r of FEED.results) {
    assert.equal(checkRow(r), null, JSON.stringify(r));
    assert.deepEqual(Object.keys(r).sort(), [...ROW_FIELDS].sort());
  }
  for (const p of Object.values(FEED.players)) assert.deepEqual(Object.keys(p), ['name']);
  for (const e of FEED.events) for (const s of e.sources) assert.ok(!isLinkOnly(s), s);
  const blob = JSON.stringify(FEED);
  assert.doesNotMatch(blob, /@[a-z0-9-]+\.[a-z]{2,}/i, 'no email addresses');
  assert.doesNotMatch(blob, /\b(?:instagram|facebook|twitter|tiktok)\.com\b/i, 'no social links');
});

test('the rankings section stays out of search while it is a preview', () => {
  assert.equal(isNoindexPath('/pickleball/rankings/'), true);
  assert.equal(isNoindexPath('/pickleball/rankings/national/'), true);
  assert.equal(isNoindexPath('/pickleball/rankings/player/el-segundo-25--x/'), true);
  assert.equal(isNoindexPath('/pickleball'), false);
});

test('do-not-list file names no one', () => {
  const d = read('../src/data/pickleball-rankings/do-not-list.json');
  for (const e of d.entries) assert.match(e.sha256, /^[0-9a-f]{64}$/);
});
