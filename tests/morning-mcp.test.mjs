/**
 * Morning Edition PR 2, the read-only surfaces around the paper:
 * - MCP air_latest {spot} and morning_edition {date?} (functions/api/mcp.ts),
 *   both reading the public endpoints, both read-only, no submit tool;
 * - the 'morning' round in /api/today (tests/today-rounds.test.mjs has the payload);
 * - the links in from /r and the front-door hero.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import {
  FIRST_EDITION, FOOTER_LINE, SHOP_DISCLOSURE, composeEdition, cutoffMs, freezeEdition, toJsonFeed,
} from '../functions/_lib/morning.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const MIN = 60_000;
const BASE = 'https://pointcast.xyz';

async function loadMcp(t) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  const mcp = await server.ssrLoadModule('/functions/api/mcp.ts');
  const rpc = async (method, params) => (await mcp.onRequestPost({
    env: {},
    request: new Request(`${BASE}/api/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }),
  })).json();
  return { mcp, rpc };
}

/** Swap fetch and the clock for one block; every fetched URL (and its headers) is recorded. */
async function withStubs({ now, respond }, run) {
  const realFetch = globalThis.fetch;
  const realNow = Date.now;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers) });
    return respond(String(url));
  };
  if (now != null) Date.now = () => now;
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = realFetch;
    Date.now = realNow;
  }
}

const jsonResponse = (body, status = 200, type = 'application/json') => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } });
const call = (rpc, name, args = {}) => rpc('tools/call', { name, arguments: args });

/** A frozen edition for `date`: KLAX on the morning, yesterday's 7:41 courts reading with bylines. */
function frozenEdition(date) {
  const cut = cutoffMs(date);
  const e = composeEdition({
    date,
    config,
    sources: {
      sky: { marine: { underTheLayerNow: true, observedAt: new Date(cut - 52 * MIN).toISOString() }, beach: null },
      courts: {
        yesterday: { value: '1-4', at: cut - (23 * 60 + 4) * MIN, support: 5, bylines: ['@mike', 'Guest 4471', '@sam', '@jen', 'Guest 2210'], reportIds: ['ar_00000000000000000001', 'ar_00000000000000000002'] },
        lastWeek: null,
      },
    },
  });
  const frozen = freezeEdition(e, cut + MIN);
  assert.ok(frozen, `fixture ${date} freezes`);
  return frozen;
}

const COURTS_PAYLOAD = {
  spot: { id: 'courts', name: 'The courts', short: 'COURTS', channel: 'CRT', color: '#3B6D11', mhz: 7.5, kind: 'wait', question: 'How many waiting?', options: [], extras: [], decayMin: 45, courtCall: { weekday: 5, time: '07:30' } },
  reading: { value: '1-4', label: '1–4 in the rack', status: 'agree', support: 3, reportId: 'ar_00000000000000000003', observedAt: '2026-10-05T15:48:00Z', ageMin: 12, bars: 4, liveUntil: '2026-10-05T16:33:00Z', bylines: ['@mike', 'Guest 4471', '@sam'], crew: null, last: null },
  today: [{ id: 'ar_00000000000000000003', at: '08:48', byline: '@mike', value: '1-4', label: '1–4 in the rack', onsite: true, agent: false, confirms: 2, live: true }],
  yesterday: { at: '07:41', label: '1–4 in the rack', support: 5, bylines: ['@mike', 'Guest 4471', '@sam'], more: 2 },
  lastWeek: { date: '2026-09-28', at: '07:38', label: '5–8 in the rack', support: 3 },
  typical: null,
  editorGuess: null,
  serverTime: '2026-10-05T16:00:00Z',
  // Never sent without X-PC-Device; here to prove the tool names its fields instead of passing the payload through.
  you: { reportId: 'ar_00000000000000000003', confirmed: [], crewMember: true },
};

test('MCP lists air_latest and morning_edition as read-only tools, next to paddle_lookup, with no submit tool', async (t) => {
  const { rpc } = await loadMcp(t);
  const listed = await rpc('tools/list', {});
  const tools = listed.result.tools;
  const air = tools.find((tool) => tool.name === 'air_latest');
  const morning = tools.find((tool) => tool.name === 'morning_edition');
  assert.ok(air && morning, 'both tools are served');
  assert.equal(air.annotations.readOnlyHint, true);
  assert.equal(morning.annotations.readOnlyHint, true);
  assert.deepEqual(air.inputSchema.properties.spot.enum, config.spots.map((s) => s.id), 'the spot enum is the spots file');
  assert.deepEqual(air.inputSchema.properties.spot.enum, ['courts', 'beach']);
  assert.deepEqual(air.inputSchema.required, ['spot']);
  assert.equal(morning.inputSchema.required, undefined, 'date is optional');
  assert.match(morning.inputSchema.properties.date.description, new RegExp(FIRST_EDITION));
  const names = tools.map((tool) => tool.name);
  assert.ok(!names.some((n) => /^(air|morning)_/.test(n) && !['air_latest', 'morning_edition'].includes(n)), 'no air or morning write tool');
  assert.equal(names.indexOf('air_latest'), names.indexOf('paddle_calendar') + 1, 'defined next to the paddle tools');

  const source = await read('functions/api/mcp.ts');
  assert.match(source, /^ \*   air_latest {12}\(\{spot\}\)/m, 'header doc list');
  assert.match(source, /^ \*   morning_edition {7}\(\{date\?\}\)/m, 'header doc list');
  assert.match(source, /<li><code>air_latest<\/code>/, 'discovery page list');
  assert.match(source, /<li><code>morning_edition<\/code>/, 'discovery page list');
  assert.ok(source.indexOf("case 'air_latest':") > source.indexOf("case 'paddle_calendar':"), 'cases sit next to the paddle cases');
});

test('air_latest reads the public spot endpoint and returns the reading, yesterday and last week', async (t) => {
  const { rpc } = await loadMcp(t);
  await withStubs({ respond: () => jsonResponse(COURTS_PAYLOAD) }, async (calls) => {
    const res = await call(rpc, 'air_latest', { spot: 'courts' });
    assert.equal(res.result.isError, undefined);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${BASE}/api/air/courts`);
    assert.equal(calls[0].headers.get('X-PC-Device'), null, 'no device id: an agent reads what any visitor reads');
    const [line, body] = res.result.content.map((c) => c.text);
    assert.match(line, /^The courts · 7\.500 · How many waiting\?/);
    assert.match(line, /Now: 1–4 in the rack · 3 agree · 12 min ago · @mike, Guest 4471, @sam/);
    assert.match(line, /Yesterday 07:41: 1–4 in the rack, 5 agree · @mike, Guest 4471, @sam \+2/);
    assert.match(line, /Same day last week \(2026-09-28\) 07:38: 5–8 in the rack/);
    const latest = JSON.parse(body);
    assert.deepEqual(Object.keys(latest).sort(), ['lastWeek', 'reading', 'serverTime', 'spot', 'url', 'yesterday']);
    assert.equal(latest.url, `${BASE}/r/courts`);
    assert.deepEqual(latest.reading, COURTS_PAYLOAD.reading);
    assert.deepEqual(latest.lastWeek, COURTS_PAYLOAD.lastWeek);
    assert.deepEqual(latest.yesterday, COURTS_PAYLOAD.yesterday);
    assert.doesNotMatch(body, /"you"|crewMember|pid_hash|ip_hash/);
  });
  // One report yesterday reads "1 reporter", never "1 agree".
  const single = { ...COURTS_PAYLOAD, yesterday: { at: '07:41', label: '1–4 in the rack', support: 1, bylines: ['@jen'] } };
  await withStubs({ respond: () => jsonResponse(single) }, async () => {
    const line = (await call(rpc, 'air_latest', { spot: 'courts' })).result.content[0].text;
    assert.match(line, /Yesterday 07:41: 1–4 in the rack, 1 reporter · @jen$/m);
    assert.doesNotMatch(line, /1 agree/);
  });
});

test('air_latest: a quiet spot says so; an unknown spot and an outage are tool errors', async (t) => {
  const { rpc } = await loadMcp(t);
  const quiet = {
    ...COURTS_PAYLOAD,
    spot: { ...COURTS_PAYLOAD.spot, id: 'beach', name: 'Grand Ave beach', mhz: 6.1, question: 'Can you see the pier?' },
    reading: { value: null, label: null, status: 'none', support: 0, reportId: null, observedAt: null, ageMin: null, bars: 0, liveUntil: null, bylines: [], crew: null, last: { value: 'none', label: "Can't see the pier", observedAt: '2026-10-05T13:31:00Z', byline: '@jen' } },
    yesterday: null,
    lastWeek: null,
  };
  await withStubs({ respond: () => jsonResponse(quiet) }, async (calls) => {
    const res = await call(rpc, 'air_latest', { spot: 'BEACH' });
    assert.equal(calls[0].url, `${BASE}/api/air/beach`);
    const line = res.result.content[0].text;
    assert.match(line, /^Grand Ave beach · 6\.100/);
    assert.match(line, /Now: quiet, nothing live \(last report: Can't see the pier\)/);
    assert.doesNotMatch(line, /Yesterday|last week/, 'silence stays quiet');
  });
  await withStubs({ respond: () => jsonResponse(COURTS_PAYLOAD) }, async (calls) => {
    for (const spot of ['board', 'confirm', '../me', '', undefined]) {
      const res = await call(rpc, 'air_latest', spot === undefined ? {} : { spot });
      assert.equal(res.result.isError, true, `spot ${spot}`);
      assert.match(res.result.content[0].text, /spot must be one of: courts, beach/);
    }
    assert.equal(calls.length, 0, 'nothing is fetched for a bad spot');
  });
  await withStubs({ respond: () => jsonResponse({ ok: false, error: 'store-unavailable' }, 503) }, async () => {
    const res = await call(rpc, 'air_latest', { spot: 'courts' });
    assert.equal(res.result.isError, true);
    assert.match(res.result.content[0].text, /off the air/);
  });
});

test('morning_edition returns the edition object from /morning.json, current or dated', async (t) => {
  const { rpc } = await loadMcp(t);
  const mon = frozenEdition('2026-10-05');
  const sat = frozenEdition('2026-10-03');
  const feed = toJsonFeed([mon, sat], { site: BASE });
  const now = Date.parse('2026-10-05T16:00:00Z'); // Mon 9:00 AM PDT: the current edition is the 5th

  await withStubs({ now, respond: () => jsonResponse(feed, 200, 'application/feed+json; charset=utf-8') }, async (calls) => {
    const current = await call(rpc, 'morning_edition', {});
    assert.equal(current.result.isError, undefined);
    assert.equal(calls.at(-1).url, `${BASE}/morning.json`, 'no date: the server decides the current edition');
    const [line, body] = current.result.content.map((c) => c.text);
    const edition = JSON.parse(body);
    for (const key of ['date', 'number', 'title', 'masthead', 'provisional', 'missing', 'reporters', 'more', 'reporterLine', 'slots', 'footer', 'disclosure']) {
      assert.deepEqual(edition[key], mon[key], `${key} survives the feed round trip`);
    }
    assert.equal(edition.frozen, true);
    assert.equal(edition.preview, false);
    assert.equal(edition.cutoff, '2026-10-05T13:45:00Z');
    assert.equal(edition.url, `${BASE}/morning?d=2026-10-05`);
    assert.equal(edition.slots.length, 7);
    assert.equal(edition.footer, FOOTER_LINE);
    assert.equal(edition.disclosure, SHOP_DISCLOSURE);
    assert.match(line, /^MORNING EDITION · No\. 3 · MON 5 OCT 2026 · 6:45 AM · frozen/);
    assert.match(line, /On the air yesterday: @mike, Guest 4471, @sam \+2/);
    assert.match(line, /Reporters earn points, never cash, and never for what a report says\.$/);
    assert.doesNotMatch(body, /pid_hash|ip_hash/);

    const dated = await call(rpc, 'morning_edition', { date: '2026-10-03' });
    assert.equal(calls.at(-1).url, `${BASE}/morning.json?d=2026-10-03`);
    assert.equal(JSON.parse(dated.result.content[1].text).number, 1);
    assert.match(dated.result.content[0].text, /^MORNING EDITION · No\. 1 · SAT 3 OCT 2026/);

    const missing = await call(rpc, 'morning_edition', { date: '2026-10-04' });
    assert.equal(missing.result.isError, true, 'a date the feed does not carry is an error, not another day');
  });
});

test('morning_edition refuses dates outside No. 1 through today without fetching, and says why', async (t) => {
  const { rpc } = await loadMcp(t);
  await withStubs({ now: Date.parse('2026-10-05T16:00:00Z'), respond: () => jsonResponse({ items: [] }) }, async (calls) => {
    for (const date of ['2026-10-06', '2026-10-02', '2026-10-5', 'today', '2026-10-05T00:00']) {
      const res = await call(rpc, 'morning_edition', { date });
      assert.equal(res.result.isError, true, date);
      assert.match(res.result.content[0].text, /from 2026-10-03 through 2026-10-05/);
    }
    assert.equal(calls.length, 0);
  });
  await withStubs({ now: Date.parse('2026-09-28T16:00:00Z'), respond: () => jsonResponse({ items: [] }) }, async (calls) => {
    const res = await call(rpc, 'morning_edition', { date: '2026-10-03' });
    assert.equal(res.result.isError, true);
    assert.match(res.result.content[0].text, /No\. 1 is 2026-10-03; until then only the current preview exists/);
    assert.equal(calls.length, 0);
  });
  await withStubs({ now: Date.parse('2026-10-05T16:00:00Z'), respond: () => jsonResponse({ error: 'unavailable' }, 503) }, async () => {
    const res = await call(rpc, 'morning_edition', {});
    assert.equal(res.result.isError, true);
    assert.match(res.result.content[0].text, /not on the press/);
  });
});

test('the Morning Edition is linked from /r and from the front-door hero, one small link each', async () => {
  const [r, hero] = await Promise.all([read('src/pages/r/index.astro'), read('src/components/HomeShortwaveHero.astro')]);
  assert.match(r, /<a href="\/morning">Today's paper: the Morning Edition →<\/a>/);
  assert.equal(r.match(/href="\/morning"/g).length, 1);
  assert.match(hero, /<a href="\/morning" data-swh-morning>/);
  assert.equal(hero.match(/href="\/morning"/g).length, 1);
  assert.ok(hero.indexOf('data-swh-court>') < hero.indexOf('data-swh-morning>'), 'it sits under the Court Call line');
});
