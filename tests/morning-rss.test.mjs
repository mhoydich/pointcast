import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

import config from '../src/data/air-spots.json' with { type: 'json' };
import { addDays, composeEdition, cutoffMs, editionText, editionTitle, freezeEdition, toRss } from '../functions/_lib/morning.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const ROUTE = 'functions/morning.xml.ts';
const SOURCES = 'functions/_lib/morning-sources.ts';
const route = await read(ROUTE);
const sources = await read(SOURCES);

const MIN = 60_000;
const D1 = '2026-10-03'; // No. 1
const klax = (date) => ({ underTheLayerNow: true, observedAt: new Date(cutoffMs(date) - 52 * MIN).toISOString() });
const composed = (date, over = {}) => ({ ...composeEdition({ date, config, sources: { sky: { marine: klax(date) }, courts: {} } }), ...over });
const frozen = (date) => freezeEdition(composed(date), cutoffMs(date) + MIN);
const items = (xml) => [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m) => m[0]);
const tag = (xml, name) => (new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml) ?? [])[1];

/** Not a parser, but enough to catch what breaks a reader: a bare & or <, an unbalanced tag, a control character. */
function wellFormed(xml) {
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'));
  assert.ok(xml.trimEnd().endsWith('</channel>\n</rss>'));
  assert.doesNotMatch(xml, /[\x00-\x08\x0B\x0C\x0E-\x1F]/, 'no control characters XML 1.0 cannot carry');
  assert.doesNotMatch(xml, /&(?!(?:amp|lt|gt|quot|apos);)/, 'every & is an entity');
  const text = xml.replace(/<\?xml[^>]*\?>/, '').replace(/<[A-Za-z/][^<>]*>/g, '');
  assert.doesNotMatch(text, /[<>]/, 'no raw angle bracket outside a tag');
  for (const name of ['item', 'title', 'link', 'guid', 'pubDate', 'description']) {
    assert.equal((xml.match(new RegExp(`<${name}[ >]`, 'g')) ?? []).length, (xml.match(new RegExp(`</${name}>`, 'g')) ?? []).length, `<${name}> is balanced`);
  }
}

test('toRss: the channel, then one item per frozen edition', () => {
  const xml = toRss([frozen(D1)]);
  wellFormed(xml);
  assert.equal(tag(xml.split('<item>')[0], 'title'), 'PointCast Morning Edition');
  assert.match(xml, /<link>https:\/\/pointcast\.xyz\/morning<\/link>/);
  assert.match(xml, /<description>One screen at 6:45 AM in El Segundo: seven fixed slots, with bylines from Field Reports\.<\/description>/);
  assert.match(xml, /<language>en-us<\/language>/);
  assert.match(xml, /<atom:link href="https:\/\/pointcast\.xyz\/morning\.xml" rel="self" type="application\/rss\+xml"\/>/);
  const [item] = items(xml);
  assert.equal(items(xml).length, 1);
  assert.equal(tag(item, 'title'), 'Morning Edition No. 1 · Sat 3 Oct 2026');
  assert.equal(tag(item, 'title'), editionTitle(D1));
  assert.equal(tag(item, 'link'), 'https://pointcast.xyz/morning?d=2026-10-03&amp;src=rss', 'src=rss, the & escaped');
  assert.match(item, /<guid isPermaLink="false">morning:2026-10-03<\/guid>/);
  assert.equal(tag(item, 'pubDate'), 'Sat, 03 Oct 2026 13:45:00 GMT', '6:45 AM PDT');
  assert.equal(tag(xml, 'lastBuildDate'), 'Sat, 03 Oct 2026 13:45:00 GMT', 'the newest item\'s pubDate');
  const lines = tag(item, 'description').split('\n');
  assert.equal(lines.length, 7, 'the seven slots as plain lines');
  assert.equal(tag(item, 'description'), editionText(frozen(D1)).replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  // 6:45 AM follows the clocks: PST after Nov 1.
  assert.equal(tag(items(toRss([frozen('2026-11-01')]))[0], 'pubDate'), 'Sun, 01 Nov 2026 14:45:00 GMT');
});

test('toRss: ampersands, angle brackets, quotes and control characters cannot break the feed', () => {
  const e = frozen(D1);
  const nasty = { ...e, slots: e.slots.map((s) => (s.id === 'town' ? { ...s, line: `Tom & Jerry <b>"quoted"</b> it's \x07here\x00 \x0B\x1Fok ]]> &amp; \uFFFE.` } : s)) };
  const xml = toRss([nasty], { site: 'https://example.org/a&b' });
  wellFormed(xml);
  assert.match(xml, /Tom &amp; Jerry &lt;b&gt;&quot;quoted&quot;&lt;\/b&gt; it&apos;s here ok \]\]&gt; &amp;amp; \./, 'escaped, and the bell, NUL, VT, US and U+FFFE dropped');
  assert.ok(!xml.includes('\x07'));
  assert.match(xml, /<link>https:\/\/example\.org\/a&amp;b\/morning<\/link>/, 'the site is escaped too');
  assert.match(xml, /<atom:link href="https:\/\/example\.org\/a&amp;b\/morning\.xml"/);
  // Tab, newline and carriage return are legal XML and stay.
  const tabbed = { ...e, slots: e.slots.map((s) => (s.id === 'town' ? { ...s, line: 'a\tb\r\nc' } : s)) };
  assert.match(toRss([tabbed]), /a\tb\r\nc/);
});

test('toRss: only frozen, non-provisional editions are items', () => {
  const good = frozen(D1);
  const unfrozen = composed('2026-10-04');
  const provisional = { ...frozen('2026-10-05'), provisional: true };
  const flaggedFrozen = { ...composed('2026-10-06'), frozen: true, provisional: true, missing: ['klax'] };
  const noSlots = { date: '2026-10-07', frozen: true };
  const badDate = { ...good, date: '2026-10-3' };
  const xml = toRss([unfrozen, provisional, flaggedFrozen, noSlots, badDate, null, 'x', 7, good]);
  wellFormed(xml);
  assert.deepEqual(items(xml).map((i) => tag(i, 'guid')), ['morning:2026-10-03']);
  assert.equal(items(toRss([unfrozen, provisional])).length, 0);
});

test('toRss: one item per date, the frozen copy wins, newest first', () => {
  const dates = [D1, addDays(D1, 1), addDays(D1, 2), addDays(D1, 3)];
  const input = [frozen(dates[1]), composed(dates[3]), frozen(dates[0]), composed(dates[1]), frozen(dates[3]), frozen(dates[2]), frozen(dates[0])];
  const xml = toRss(input);
  wellFormed(xml);
  assert.deepEqual(items(xml).map((i) => tag(i, 'guid')), [...dates].reverse().map((d) => `morning:${d}`), 'newest first, each date once');
  assert.equal(tag(xml, 'lastBuildDate'), tag(items(xml)[0], 'pubDate'));
  // Two frozen copies of one date: still one item (the archive holds one, but a caller may pass both).
  assert.equal(items(toRss([frozen(D1), frozen(D1)])).length, 1);
});

test('toRss: thirty items at most, the oldest dropped', () => {
  const dates = Array.from({ length: 31 }, (_, i) => addDays(D1, i));
  const xml = toRss(dates.map(frozen));
  const guids = items(xml).map((i) => tag(i, 'guid'));
  assert.equal(guids.length, 30);
  assert.equal(guids[0], `morning:${dates[30]}`);
  assert.equal(guids.at(-1), `morning:${dates[1]}`, 'the first edition fell off the end');
  assert.ok(!guids.includes(`morning:${dates[0]}`));
  assert.equal(items(toRss(dates.map(frozen), { limit: 3 })).length, 3);
  assert.equal(items(toRss(dates.map(frozen), { limit: 0 })).length, 30, 'a bad limit is the default, not zero');
  assert.equal(items(toRss(dates.slice(0, 5).map(frozen))).length, 5);
});

test('toRss: nothing frozen is a valid channel with no items and no lastBuildDate', () => {
  for (const input of [[], undefined, null, 'x', [composed(D1)]]) {
    const xml = toRss(input);
    wellFormed(xml);
    assert.equal(items(xml).length, 0);
    assert.doesNotMatch(xml, /lastBuildDate|<item>/);
    assert.equal(tag(xml, 'title'), 'PointCast Morning Edition');
  }
});

/* ---------- the route ---------- */

test('morning.xml route: source contract', () => {
  assert.match(route, /'application\/rss\+xml; charset=utf-8'/);
  assert.match(route, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(route, /'X-Content-Type-Options': 'nosniff'/);
  assert.match(route, /export const onRequestGet/);
  assert.match(route, /export const onRequestOptions/);
  assert.match(route, /caches\?\.default/);
  assert.match(route, /new Request\(`\$\{url\.origin\}\/morning\.xml`\)/, 'one cache key; query strings share it');
  assert.match(route, /readRecentFrozen\(env\.AUTH_DB, RSS_LIMIT\)/);
  assert.match(route, /toRss\(editions\)/);
  assert.match(route, /public, max-age=\$\{ttlFor\(now\)\}/);
  assert.match(route, /Math\.max\(1, Math\.min\(MAX_TTL,/);
  assert.match(route, /cutoffMs\(addDays\(editionDate\(now\), 1\)\)/, 'never past the next 6:45 AM');
  assert.doesNotMatch(route, /\.prepare\(|\.batch\(|\.exec\(/, 'the route has no SQL of its own');
  assert.doesNotMatch(route, /editionFor|composeEdition|freezeEdition|saveFrozen|gatherSources/, 'it never composes or freezes');
  assert.doesNotMatch(route, /pid_hash|ip_hash|pidHash|ipHash/);
  assert.deepEqual([...route.matchAll(/(\w+)\.put\(/g)].map((m) => m[1]), ['cache'], 'writes only its edge cache');
});

test('morning-sources: readRecentFrozen is one bound SELECT, and nothing here rewrites a frozen edition', () => {
  const from = sources.indexOf('export async function readRecentFrozen');
  const fn = sources.slice(from, sources.indexOf('\n}\n', from) + 3);
  assert.match(fn, /\.prepare\('SELECT date, json FROM morning_editions ORDER BY date DESC LIMIT \?'\)\s*\.bind\(n\)/);
  assert.doesNotMatch(fn, /INSERT|UPDATE|DELETE|REPLACE/);
  assert.match(fn, /catch \{\s*return null;/, 'a failing store is null, not an empty archive');
  assert.match(fn, /if \(!db\) return \[\];/, 'no binding is an empty archive');
});

const server = await createServer({ root: fileURLToPath(root), configFile: false, appType: 'custom', logLevel: 'error' });
after(() => server.close());
const [lib, xmlRoute] = await Promise.all([server.ssrLoadModule('/functions/_lib/morning-sources.ts'), server.ssrLoadModule('/functions/morning.xml.ts')]);

/** A D1 stand-in that answers the one archive statement the route may run. */
function archive(rows, { fail = false } = {}) {
  const calls = [];
  const db = {
    prepare(sql) {
      calls.push(sql);
      return { bind(...args) { calls.push(args); return { async all() { if (fail) throw new Error('no such table: morning_editions'); return { results: rows.slice(0, args[0]) }; } }; } };
    },
  };
  return { db, calls };
}
const stored = (date) => ({ date, json: JSON.stringify(frozen(date)) });

async function get(env, now, path = '/morning.xml') {
  const realNow = Date.now;
  Date.now = () => now;
  try {
    const waits = [];
    const res = await xmlRoute.onRequestGet({ request: new Request(`https://pointcast.xyz${path}`), env, waitUntil: (p) => waits.push(p), params: {} });
    await Promise.all(waits);
    return { res, body: await res.text() };
  } finally {
    Date.now = realNow;
  }
}

test('GET /morning.xml: RSS from the archive, newest first, with the feed headers', async () => {
  const rows = ['2026-10-05', '2026-10-04', '2026-10-03'].map(stored);
  const { db, calls } = archive(rows);
  const { res, body } = await get({ AUTH_DB: db }, Date.parse('2026-10-05T16:00:00Z'), '/morning.xml?utm_source=x');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'application/rss+xml; charset=utf-8');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(res.headers.get('Cache-Control'), 'public, max-age=300');
  wellFormed(body);
  assert.deepEqual(items(body).map((i) => tag(i, 'guid')), ['morning:2026-10-05', 'morning:2026-10-04', 'morning:2026-10-03']);
  assert.deepEqual(calls, ['SELECT date, json FROM morning_editions ORDER BY date DESC LIMIT ?', [30]], 'one read, 30 rows at most');
  assert.doesNotMatch(body, /pid_hash|ip_hash|dev:|user:/);
});

test('GET /morning.xml: an archive row that is not an edition is skipped, and a missing or empty store is an empty channel', async () => {
  const rows = [stored('2026-10-04'), { date: '2026-10-03', json: 'not json' }, { date: '2026-10-02', json: JSON.stringify({ date: '2026-10-01', slots: [] }) }];
  const some = await get({ AUTH_DB: archive(rows).db }, Date.parse('2026-10-05T16:00:00Z'));
  assert.deepEqual(items(some.body).map((i) => tag(i, 'guid')), ['morning:2026-10-04']);
  for (const env of [{}, { AUTH_DB: archive([]).db }]) {
    const empty = await get(env, Date.parse('2026-10-05T16:00:00Z'));
    assert.equal(empty.res.status, 200);
    wellFormed(empty.body);
    assert.equal(items(empty.body).length, 0);
  }
  assert.deepEqual(await lib.readRecentFrozen(undefined), []);
  assert.equal(await lib.readRecentFrozen(archive([], { fail: true }).db), null, 'a failing read is not an empty archive');
  assert.equal((await lib.readRecentFrozen(archive([stored('2026-10-04'), stored('2026-10-03')]).db, 1)).length, 1, 'the limit is bound');
});

test('GET /morning.xml: cached no longer than 300 s, and never past the next 6:45 AM', async () => {
  const env = { AUTH_DB: archive([stored(D1)]).db };
  assert.equal((await get(env, Date.parse('2026-10-05T16:00:00Z'))).res.headers.get('Cache-Control'), 'public, max-age=300');
  // 6:44:30 AM PDT: the current edition is still yesterday's, and a new one is 30 s away.
  assert.equal((await get(env, Date.parse('2026-10-05T13:44:30Z'))).res.headers.get('Cache-Control'), 'public, max-age=30');
  // The same minute after DST ends (PST): 6:44:30 AM is 14:44:30Z.
  assert.equal((await get(env, Date.parse('2026-11-01T14:44:30Z'))).res.headers.get('Cache-Control'), 'public, max-age=30');
  assert.equal((await get(env, Date.parse('2026-10-05T13:45:00Z'))).res.headers.get('Cache-Control'), 'public, max-age=300', 'at 6:45 the next one is a day away');
  // One second out is still a positive max-age.
  assert.equal((await get(env, Date.parse('2026-10-05T13:44:59Z'))).res.headers.get('Cache-Control'), 'public, max-age=1');
});

test('OPTIONS /morning.xml: 204 with CORS', async () => {
  const res = await xmlRoute.onRequestOptions({});
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  assert.match(res.headers.get('Access-Control-Allow-Methods'), /GET/);
});

test('GET /morning.xml: a hit in caches.default is served as is, and a miss is stored once', async () => {
  const realCaches = globalThis.caches;
  const store = new Map();
  const puts = [];
  globalThis.caches = { default: {
    async match(req) { return store.get(req.url); },
    async put(req, res) { puts.push(req.url); store.set(req.url, res); },
  } };
  try {
    const { db, calls } = archive([stored(D1)]);
    const first = await get({ AUTH_DB: db }, Date.parse('2026-10-05T16:00:00Z'), '/morning.xml?a=1');
    assert.deepEqual(puts, ['https://pointcast.xyz/morning.xml'], 'the key has no query string');
    const second = await get({ AUTH_DB: db }, Date.parse('2026-10-05T16:00:00Z'), '/morning.xml?b=2');
    assert.equal(calls.filter((c) => typeof c === 'string').length, 1, 'the second read never touched the archive');
    assert.equal(second.body, first.body);
    assert.equal(puts.length, 1);
  } finally {
    globalThis.caches = realCaches;
  }
});

test('GET /morning.xml: a failing archive read is a 503 with no-store, and nothing is cached', async () => {
  const realCaches = globalThis.caches;
  const puts = [];
  globalThis.caches = { default: { async match() { return undefined; }, async put(req) { puts.push(req.url); } } };
  try {
    const { res, body } = await get({ AUTH_DB: archive([], { fail: true }).db }, Date.parse('2026-10-05T16:00:00Z'));
    assert.equal(res.status, 503);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    assert.doesNotMatch(body, /<rss|<channel/, 'never an empty channel standing in for the archive');
    assert.deepEqual(puts, [], 'the edge cache is not written');
  } finally {
    globalThis.caches = realCaches;
  }
});
