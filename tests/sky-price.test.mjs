import assert from 'node:assert/strict';
import test from 'node:test';

import { composeEdition } from '../functions/_lib/morning.mjs';
import {
  applyVerdict, editionCalls, layerFromState, openMorning, placeCall, publicSky, resultOf, settleOutstanding, SKY_DEFINITION,
} from '../functions/_lib/sky-calls.mjs';
import {
  BASKET_NOTE, editionReport, fileReport, formatUsd, holdReason, ITEM_IDS, parsePrice, publicPrices, shouldHold,
} from '../functions/_lib/price-wire.mjs';

async function loadHandler(t, path) {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error', resolve: { preserveSymlinks: true }, cacheDir: '.astro/api-test-cache' });
  t.after(() => server.close());
  return server.ssrLoadModule(path);
}

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(key, type) {
    const value = this.m.get(key);
    if (value === undefined) return null;
    return type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.m.set(key, value); }
}

const post = (url, body, ip = '1.1.1.1') => new Request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(body),
});

const SEVEN_PM = Date.parse('2026-10-06T02:00:00Z'); // 7:00 PM PDT, Oct 5
const NINE_PM = Date.parse('2026-10-06T04:00:00Z'); // 9:00 PM PDT, Oct 5

test('the open morning closes at 9:00 PM Pacific the night before', () => {
  assert.equal(openMorning(SEVEN_PM).date, '2026-10-06');
  assert.equal(openMorning(Date.parse('2026-10-06T03:59:00Z')).date, '2026-10-06', '8:59 PM is still open');
  assert.equal(openMorning(NINE_PM).date, '2026-10-07', '9:00 PM closes tomorrow and opens the morning after');
  assert.equal(SKY_DEFINITION.deckCeilingFt, 3000);
  assert.equal(layerFromState('opened'), true);
  assert.equal(layerFromState('never'), true);
  assert.equal(layerFromState('no-layer'), false);
  assert.equal(layerFromState('no-record'), null);
});

test('one call per handle, scored only when the burn-off rule is final', () => {
  const book = { v: 1, days: {} };
  const first = placeCall(book, { handle: '@Ada', call: 'layer', kind: 'human' }, SEVEN_PM);
  assert.equal(first.ok, true);
  assert.equal(first.date, '2026-10-06');
  assert.equal(placeCall(book, { handle: 'ada', call: 'clear' }, SEVEN_PM).status, 409);
  assert.equal(placeCall(book, { handle: 'bee', call: 'clear', kind: 'agent', date: '2026-10-07' }, SEVEN_PM).status, 409);
  const agent = placeCall(book, { handle: 'bee', call: 'clear', kind: 'agent' }, SEVEN_PM);
  assert.equal(agent.ok, true);
  assert.equal(applyVerdict(book.days['2026-10-06'], { state: 'watching', final: false }, SEVEN_PM), false);
  assert.equal(applyVerdict(book.days['2026-10-06'], { state: 'opened', final: true, sentence: 'the sky opened at 10:53 am.' }, Date.parse('2026-10-06T18:00:00Z')), true);
  assert.deepEqual(resultOf(book.days['2026-10-06'].calls[0], book.days['2026-10-06'].verdict), { result: 'correct', points: 1 });
  assert.deepEqual(resultOf(book.days['2026-10-06'].calls[1], book.days['2026-10-06'].verdict), { result: 'miss', points: 0 });
  const view = publicSky(book, Date.parse('2026-10-06T18:00:00Z'));
  assert.equal(view.averages.human.points, 1);
  assert.equal(view.averages.agent.points, 0);
  assert.equal(view.leaderboard.human[0].handle, 'ada');
  assert.equal(view.leaderboard.agent[0].handle, 'bee');
  assert.equal(view.points, 'never cash');
});

test('a void morning scores nobody, and settlement is applied from the supplied verdict', async () => {
  const book = { v: 1, days: { '2026-10-04': { calls: [{ handle: 'ada', kind: 'human', call: 'layer', t: '2026-10-03T20:00:00Z' }], verdict: null } } };
  const changed = await settleOutstanding(book, Date.parse('2026-10-05T18:00:00Z'), async () => ({ state: 'no-record', final: true }));
  assert.equal(changed, true);
  assert.equal(resultOf(book.days['2026-10-04'].calls[0], book.days['2026-10-04'].verdict).result, 'void');
  assert.equal(resultOf(book.days['2026-10-04'].calls[0], book.days['2026-10-04'].verdict).points, 0);
  const again = await settleOutstanding(book, Date.parse('2026-10-05T18:00:00Z'), async () => { throw new Error('no'); });
  assert.equal(again, false);
});

test('GET is an empty ledger with no store, POST files one call and refuses a second', async (t) => {
  const { onRequestGet: skyGet, onRequestPost: skyPost } = await loadHandler(t, '/functions/api/sky-calls.ts');
  const env = { VISITS: new FakeKV() };
  const empty = await (await skyGet({ request: new Request('https://pointcast.xyz/api/sky-calls'), env: {} })).json();
  assert.equal(empty.empty, true);
  assert.equal(empty.definition.question.includes('marine layer'), true);
  const offline = await skyPost({ request: post('https://pointcast.xyz/api/sky-calls', { handle: 'ada', call: 'layer' }), env: {} });
  assert.equal(offline.status, 503);
  const filed = await skyPost({ request: post('https://pointcast.xyz/api/sky-calls', { handle: 'ada', call: 'layer' }), env });
  assert.equal(filed.status, 201);
  const body = await filed.json();
  assert.equal(body.points, 0);
  assert.match(body.pointsNote, /Never cash/);
  const again = await skyPost({ request: post('https://pointcast.xyz/api/sky-calls', { handle: 'Ada', call: 'clear' }), env });
  assert.equal(again.status, 409);
  const ledger = await (await skyGet({ request: new Request('https://pointcast.xyz/api/sky-calls'), env })).json();
  const open = ledger.days.find((day) => day.date === body.date);
  assert.equal(open.calls.length, 1);
  assert.equal(open.counts.human, 1);
});

test('a price is cents, a wild one is held, and points ignore the amount', () => {
  assert.equal(parsePrice(4.25), 425);
  assert.equal(parsePrice('$4'), 400);
  assert.equal(parsePrice('4.259'), null);
  assert.equal(parsePrice(0), null);
  const book = { v: 1, reports: [] };
  const now = Date.parse('2026-10-05T20:00:00Z');
  const a = fileReport(book, { handle: 'ada', item: 'drip-coffee', price: 4.25, place: 'Main St coffee', date: '2026-10-05' }, now);
  const b = fileReport(book, { handle: 'bee', item: 'drip-coffee', price: 6, place: 'Main St coffee', date: '2026-10-05', kind: 'agent' }, now);
  const c = fileReport(book, { handle: 'cam', item: 'drip-coffee', price: 4.5, place: 'Main St coffee', date: '2026-10-05' }, now);
  assert.equal(a.report.points, 2);
  assert.equal(b.report.points, 2, 'a higher price does not pay more');
  assert.equal(c.report.status, 'ok');
  assert.equal(shouldHold(1000, [425, 600, 450]), true);
  assert.match(holdReason(1000, [425, 600, 450]), /double/);
  assert.match(holdReason(100, [425, 600, 450]), /half/);
  const held = fileReport(book, { handle: 'dee', item: 'drip-coffee', price: 20, place: 'Main St coffee', date: '2026-10-05' }, now);
  assert.equal(held.report.status, 'held');
  assert.equal(held.report.points, 0);
  const view = publicPrices(book, now);
  assert.equal(view.notOfficialCpi, true);
  assert.equal(view.latest.find((row) => row.id === 'drip-coffee').price, '$4.50');
  assert.equal(view.latest.find((row) => row.id === 'burrito').price, null);
  assert.equal(view.basket.value, 105.9, 'latest $4.50 over the first accepted $4.25');
  assert.match(view.basket.note, /not an official CPI/i);
  assert.equal(BASKET_NOTE.includes('not an official CPI'), true);
  assert.equal(view.held.length, 1);
  assert.equal(view.reporters.human.find((row) => row.handle === 'ada').points, 2);
  assert.equal(fileReport(book, { handle: 'ada', item: 'drip-coffee', price: 4, place: 'Main St coffee', date: '2026-10-05' }, now).status, 409);
  assert.equal(fileReport(book, { handle: 'ada', item: 'dozen-eggs', price: 5.99, place: 'https://spam', date: '2026-10-05' }, now).ok, false);
});

test('the basket moves off the first accepted price and skips held reports', () => {
  const book = { v: 1, reports: [] };
  const first = Date.parse('2026-10-03T18:00:00Z');
  const second = Date.parse('2026-10-05T18:00:00Z');
  fileReport(book, { handle: 'ada', item: 'dozen-eggs', price: 5, place: 'Market', date: '2026-10-03' }, first);
  fileReport(book, { handle: 'bee', item: 'dozen-eggs', price: 4, place: 'Market', date: '2026-10-04' }, second);
  fileReport(book, { handle: 'cam', item: 'dozen-eggs', price: 6, place: 'Market', date: '2026-10-05' }, second);
  const view = publicPrices(book, second);
  const eggs = view.latest.find((row) => row.id === 'dozen-eggs');
  assert.equal(eggs.price, '$6.00');
  assert.equal(eggs.trend.direction, 'up');
  assert.equal(view.basket.value, 120);
  assert.equal(view.basket.missing.includes('drip-coffee'), true);
  assert.deepEqual(ITEM_IDS, ['drip-coffee', 'oat-latte', 'regular-gas', 'dozen-eggs', 'pickleball-hour', 'burrito']);
});

test('the Morning Edition takes a recent price and a settled sky call, and falls back otherwise', () => {
  const quiet = composeEdition({ date: '2026-10-05', sources: {} });
  assert.match(quiet.slots.find((slot) => slot.id === 'price').line, /register at pointcast\.xyz\/paddles/);
  assert.equal(quiet.slots.find((slot) => slot.id === 'price').source, 'template');
  assert.doesNotMatch(quiet.slots.find((slot) => slot.id === 'sky').line, /Sky Calls/);

  const priced = composeEdition({
    date: '2026-10-05',
    sources: {
      localPrice: { label: 'Drip coffee', priceCents: 425, place: 'Main St coffee', date: '2026-10-04', handle: 'ada', kind: 'human', sample: 1 },
      price: { kind: 'release', id: 'x', name: 'Paddle', msrp: 100, date: '2026-10-04', precision: 'day' },
    },
  });
  const price = priced.slots.find((slot) => slot.id === 'price');
  assert.equal(price.source, 'price-wire');
  assert.equal(price.fallback, false);
  assert.equal(price.line, 'Drip coffee at Main St coffee: $4.25 on Oct 4, reported by @ada (person). One local report on the price wire. Not an official index.');

  const sky = composeEdition({
    date: '2026-10-05',
    sources: {
      sky: {
        calls: {
          yesterday: { date: '2026-10-04', state: 'opened', layer: true, correct: 2, of: 3 },
          today: { date: '2026-10-05', layer: 4, clear: 1 },
        },
      },
    },
  });
  const line = sky.slots.find((slot) => slot.id === 'sky').line;
  assert.match(line, /KLAX has not reported yet/);
  assert.match(line, /Sky Calls for Oct 4: the marine-layer rule found a marine layer \(opened\)\. 2 of 3 were right\./);
  assert.match(line, /closed at 9:00 PM with 4 for a layer and 1 for clear/);
  assert.equal(sky.slots.find((slot) => slot.id === 'sky').source, 'template+sky-calls');
  assert.equal(sky.provisional, true, 'Sky Calls does not stand in for KLAX');
});

test('edition readers ignore a price filed after 6:45 and a morning with no calls', () => {
  const raw = {
    reports: [
      { id: 'pw_1', item: 'burrito', priceCents: 1200, place: 'The stand', date: '2026-10-05', handle: 'ada', kind: 'human', status: 'ok', t: '2026-10-05T14:30:00Z' },
      { id: 'pw_2', item: 'burrito', priceCents: 1100, place: 'The stand', date: '2026-10-04', handle: 'bee', kind: 'agent', status: 'ok', t: '2026-10-04T20:00:00Z' },
    ],
  };
  const picked = editionReport(raw, '2026-10-05');
  assert.equal(picked.priceCents, 1100, 'the 7:30 AM report is after the cutoff');
  assert.equal(picked.kind, 'agent');
  assert.equal(editionCalls({ days: {} }, '2026-10-05'), null);
  const calls = editionCalls({
    days: {
      '2026-10-04': {
        calls: [{ handle: 'ada', kind: 'human', call: 'clear', t: '2026-10-03T20:00:00Z' }],
        verdict: { state: 'no-layer', layer: false, final: true, settledAt: '2026-10-04T20:00:00Z', sentence: '' },
      },
    },
  }, '2026-10-05');
  assert.equal(calls.yesterday.state, 'no-layer');
  assert.equal(calls.yesterday.correct, 1);
});

test('POST /api/prices files, holds, and reads back with an honest empty basket item', async (t) => {
  const { onRequestGet: priceGet, onRequestPost: pricePost } = await loadHandler(t, '/functions/api/prices.ts');
  const env = { VISITS: new FakeKV() };
  const offline = await pricePost({ request: post('https://pointcast.xyz/api/prices', { handle: 'ada', item: 'burrito', price: 12, place: 'The stand' }), env: {} });
  assert.equal(offline.status, 503);
  const filed = await pricePost({ request: post('https://pointcast.xyz/api/prices', { handle: 'ada', item: 'burrito', price: 12, place: 'The stand', source: 'menu board, no photo' }), env });
  assert.equal(filed.status, 201);
  const body = await filed.json();
  assert.equal(body.points, 2);
  assert.equal(body.report.price, '$12.00');
  assert.equal(formatUsd(1200), '$12.00');
  const wire = await (await priceGet({ request: new Request('https://pointcast.xyz/api/prices'), env })).json();
  assert.equal(wire.latest.find((row) => row.id === 'burrito').place, 'The stand');
  assert.equal(wire.latest.find((row) => row.id === 'regular-gas').price, null);
  assert.match(wire.moderation, /held/i);
});

test('MCP lists sky and price tools with write tools not marked read-only', async (t) => {
  const { onRequestPost } = await loadHandler(t, '/functions/api/mcp.ts');
  const res = await onRequestPost({
    env: {},
    request: new Request('https://pointcast.xyz/api/mcp-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    }),
  });
  const list = await res.json();
  const tools = list.result.tools;
  const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
  for (const name of ['sky_calls', 'price_wire']) {
    assert.equal(byName[name].annotations.readOnlyHint, true, name);
  }
  for (const name of ['sky_call', 'price_report']) {
    assert.equal(byName[name].annotations.readOnlyHint, false, name);
    assert.equal(byName[name].annotations.destructiveHint, false, name);
  }
  assert.deepEqual(byName.sky_call.inputSchema.properties.call.enum, ['layer', 'clear']);
  assert.deepEqual(byName.price_report.inputSchema.properties.item.enum, ITEM_IDS);
});
