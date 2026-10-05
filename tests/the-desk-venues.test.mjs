// The Desk — venue parsing and paper fills, against fixture responses shaped
// like Kalshi's and Alpaca's public docs. The container that wrote these could
// not reach either API; the first deploy runs a live smoke check (workers/the-desk/README.md).
import assert from 'node:assert/strict';
import test from 'node:test';

import { sma } from '../functions/_lib/the-desk/strategies.mjs';
import { canonical, deskDay, nextSettlementMs } from '../functions/_lib/the-desk/util.mjs';
import {
  alpacaData, fillAgainstBook, kalshiData, kalshiFee, kalshiSideBook, parseAlpacaQuote, parseKalshiInstrument, parseKalshiMarket,
} from '../functions/_lib/the-desk/venues.mjs';

test('Kalshi books: bids only; one side’s asks are the other side’s bids at 1 − p', () => {
  const book = { yes: [[40, 100], [42, 50]], no: [[55, 30], [57, 20]] }; // cents, ascending
  const yes = kalshiSideBook(book, 'yes');
  assert.deepEqual(yes.bids, [[0.42, 50], [0.4, 100]]);
  assert.deepEqual(yes.asks, [[0.43, 20], [0.45, 30]]);
  const no = kalshiSideBook(book, 'no');
  assert.deepEqual(no.asks, [[0.58, 50], [0.6, 100]]);
  const dollars = kalshiSideBook({ yes_dollars: [['0.4000', 100]], no_dollars: [['0.5700', 20]] }, 'yes');
  assert.deepEqual(dollars, { bids: [[0.4, 100]], asks: [[0.43, 20]] }, 'the _dollars fields win when present');
  assert.deepEqual(kalshiSideBook({}, 'yes'), { bids: [], asks: [] });
});

test('Kalshi markets: statuses, results, prices in cents or dollars', () => {
  const open = parseKalshiMarket({ ticker: 'KX-1', title: 'Rain?', status: 'active', yes_bid: 4, yes_ask: 5, no_bid: 95, no_ask: 96, close_time: '2026-10-06T00:00:00Z' });
  assert.deepEqual([open.status, open.yesBid, open.yesAsk, open.noAsk, open.closeTime], ['open', 0.04, 0.05, 0.96, Date.parse('2026-10-06T00:00:00Z')]);
  assert.equal(parseKalshiMarket({ ticker: 'KX', status: 'finalized', result: 'no' }).status, 'settled');
  assert.equal(parseKalshiMarket({ ticker: 'KX', status: 'closed', result: '' }).status, 'closed');
  assert.equal(parseKalshiMarket({ ticker: 'KX', status: 'open', yes_ask_dollars: '0.0700', yes_ask: 99 }).yesAsk, 0.07);
});

test('Kalshi instruments and fees', () => {
  assert.deepEqual(parseKalshiInstrument('KXHIGHNY-26OCT05-T75:yes'), { ticker: 'KXHIGHNY-26OCT05-T75', side: 'yes' });
  for (const bad of ['kx:yes', 'KX', 'KX:YES', 'KX:yes:no', '', null]) assert.equal(parseKalshiInstrument(bad), null, String(bad));
  assert.equal(kalshiFee(100, 0.5), 1.75); // the 1.75% peak at 50¢
  assert.equal(kalshiFee(10, 0.5), 0.18);
  assert.equal(kalshiFee(1, 0.99), 0.01);
});

test('Kalshi client: builds the documented URLs and parses the responses', async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(url);
    const body = url.includes('/orderbook')
      ? { orderbook: { yes: [[4, 10]], no: [[95, 10]] } }
      : url.includes('/markets?')
        ? { markets: [{ ticker: 'KX-A', status: 'active', yes_ask: 5 }] }
        : { market: { ticker: 'KX-A', title: 'A', status: 'active' } };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const k = kalshiData(fetchImpl, 'https://k.test/v2');
  const list = await k.listOpen({ minCloseMs: 1_000_000, maxCloseMs: 2_000_000 });
  assert.equal(list[0].ticker, 'KX-A');
  assert.match(seen[0], /^https:\/\/k\.test\/v2\/markets\?status=open&limit=500&min_close_ts=1000&max_close_ts=2000$/);
  const q = await k.quote('KX-A:no', 42);
  assert.deepEqual([q.status, q.bid, q.ask, q.at], ['open', 0.95, 0.96, 42]);
  assert.ok(seen.includes('https://k.test/v2/markets/KX-A/orderbook'));
  await assert.rejects(kalshiData(async () => new Response('', { status: 429 }), 'https://k.test/v2').listOpen({}), /429/);
});

test('Alpaca: no keys means no venue; quotes parse; closes come from bars', async () => {
  assert.equal(alpacaData({}).configured, false);
  assert.equal(await alpacaData({}).quote('SPY'), null);
  const q = parseAlpacaQuote('SPY', { quote: { ap: 600.1, bp: 600, t: '2026-10-05T16:59:00Z' } }, 0);
  assert.deepEqual([q.bid, q.ask, q.at], [600, 600.1, Date.parse('2026-10-05T16:59:00Z')]);
  assert.deepEqual(parseAlpacaQuote('SPY', { quote: { ap: 0, bp: 0 } }, 5).asks, []);
  let headers;
  const a = alpacaData({ keyId: 'k', secret: 's', base: 'https://a.test/v2', fetchImpl: async (url, init) => {
    headers = init.headers;
    return new Response(JSON.stringify({ bars: [{ c: 1 }, { c: 2 }, { c: 0 }, { c: 3 }] }), { status: 200 });
  } });
  assert.deepEqual(await a.dailyCloses('SPY', 30, Date.parse('2026-10-05T17:00:00Z')), [1, 2, 3]);
  assert.equal(headers['APCA-API-KEY-ID'], 'k');
});

test('paper fills walk the book to the limit and never past it', () => {
  const quote = { asks: [[0.5, 3], [0.52, 4], [0.6, 100]], bids: [[0.48, 2], [0.4, 10]] };
  assert.deepEqual(fillAgainstBook({ action: 'buy', qty: 5, limitPrice: 0.52, quote, wholeUnits: true }), { filledQty: 5, avgPrice: (3 * 0.5 + 2 * 0.52) / 5 });
  assert.deepEqual(fillAgainstBook({ action: 'buy', qty: 10, limitPrice: 0.52, quote, wholeUnits: true }).filledQty, 7, 'partial: nothing above the limit');
  assert.deepEqual(fillAgainstBook({ action: 'buy', qty: 5, limitPrice: 0.49, quote, wholeUnits: true }), { filledQty: 0, avgPrice: null });
  assert.equal(fillAgainstBook({ action: 'sell', qty: 5, limitPrice: 0.45, quote, wholeUnits: true }).filledQty, 2);
  assert.equal(fillAgainstBook({ action: 'buy', qty: 0.0166, limitPrice: 1, quote: { asks: [[0.9, Infinity]] }, wholeUnits: false }).filledQty, 0.0166);
});

test('helpers: desk day is LA time; T+1 skips weekends; canonical JSON is key-sorted; sma', () => {
  assert.equal(deskDay(Date.parse('2026-10-06T06:30:00Z')), '2026-10-05', '11:30 PM in LA is still the 5th');
  const fri = Date.parse('2026-10-09T18:00:00Z');
  assert.equal(new Date(nextSettlementMs(fri)).toISOString(), '2026-10-12T21:00:00.000Z');
  assert.equal(canonical({ b: 1, a: [2, { d: 1, c: null }], z: undefined }), '{"a":[2,{"c":null,"d":1}],"b":1}');
  assert.equal(sma([1, 2, 3, 4], 2), 3.5);
  assert.equal(sma([1], 2), null);
});
