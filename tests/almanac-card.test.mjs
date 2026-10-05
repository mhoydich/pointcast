import assert from 'node:assert/strict';
import test from 'node:test';

import { basketOf } from '../functions/_lib/price-wire.mjs';
import {
  CARD_EPOCH,
  almanacResponse,
  cardNumber,
  cardSvg,
  composeCard,
  isCardDate,
  pacificDay,
} from '../functions/_lib/almanac-card.mjs';

const NOW = Date.parse('2026-10-05T20:00:00Z');

function report(item, date, cents) {
  return { status: 'ok', item, date, priceCents: cents, t: `${date}T18:00:00Z` };
}

function deps(extra = {}) {
  return {
    now: NOW,
    skyBound: true,
    priceBound: true,
    skyBook: { v: 1, days: {} },
    priceBook: { v: 1, reports: [] },
    picks: {},
    tide: async () => ({ predictions: [] }),
    weather: async () => null,
    marine: async () => { throw new Error('marine should not be required'); },
    ...extra,
  };
}

test('No. 1 is 2026-10-05 and the day before is not a card', () => {
  assert.equal(CARD_EPOCH, '2026-10-05');
  assert.equal(pacificDay(NOW), '2026-10-05');
  assert.equal(cardNumber('2026-10-05'), 1);
  assert.equal(cardNumber('2026-10-06'), 2);
  assert.equal(cardNumber('2026-10-04'), null);
  assert.equal(isCardDate('2026-10-04'), false);
  assert.equal(isCardDate('2027-01-01'), false);
  assert.equal(isCardDate('2026-12-31'), true);
});

test('an empty price book says no reports yet', async () => {
  const card = await composeCard('2026-10-05', deps());
  assert.equal(card.basket.status, 'missing');
  assert.equal(card.basket.line, 'no reports yet');
  assert.equal(card.basket.value, null);
});

test('a report after the card date is left out of the basket', async () => {
  const kept = [
    report('drip-coffee', '2026-10-04', 300),
    report('drip-coffee', '2026-10-05', 350),
  ];
  const card = await composeCard('2026-10-05', deps({
    priceBook: { reports: [...kept, report('drip-coffee', '2026-10-06', 900)] },
  }));
  assert.equal(card.basket.value, basketOf(kept).value);
  assert.match(card.basket.line, /El Segundo basket/);
  const onlyLater = await composeCard('2026-10-05', deps({
    priceBook: { reports: [report('drip-coffee', '2026-10-06', 400)] },
  }));
  assert.equal(onlyLater.basket.line, 'no reports yet');
  assert.equal(onlyLater.basket.value, null);
});

test('a settled sky call uses its sentence and does not invent a marine state', async () => {
  let marineCalls = 0;
  const card = await composeCard('2026-10-05', deps({
    skyBook: {
      days: {
        '2026-10-05': {
          calls: [{ handle: 'ada' }],
          verdict: { final: true, state: 'burned', sentence: 'The layer burned off at 9:12 AM.' },
        },
      },
    },
    picks: { '2026-10-05': { blockId: '0669', title: 'Daily Almanac' } },
    tide: async () => ({
      predictions: [
        { t: '2026-10-05 06:12', v: '1.2', type: 'L' },
        { t: '2026-10-05 13:04', v: '5.6', type: 'H' },
      ],
    }),
    weather: async () => ({ tempF: 64, condition: 'fog' }),
    marine: async () => { marineCalls += 1; throw new Error('oracle'); },
  }));
  assert.equal(marineCalls, 0);
  assert.equal(card.marine.status, 'present');
  assert.equal(card.marine.line, 'The layer burned off at 9:12 AM.');
  assert.equal(card.pick.line, 'Block 0669: Daily Almanac');
  assert.match(card.tide.line, /Low 6:12 AM, 1\.20 ft/);
  assert.match(card.tide.line, /High 1:04 PM, 5\.60 ft/);
  assert.equal(card.weather.line, '64°F, fog.');
  assert.equal(card.weather.tempF, 64);
});

test('an unsettled sky call stays missing and is not replaced', async () => {
  let marineCalls = 0;
  const card = await composeCard('2026-10-05', deps({
    skyBook: { days: { '2026-10-05': { calls: [{ handle: 'ada' }], verdict: null } } },
    marine: async () => { marineCalls += 1; return { verdict: { final: true, state: 'guessed', sentence: 'invented' } }; },
  }));
  assert.equal(marineCalls, 0);
  assert.equal(card.marine.status, 'missing');
  assert.equal(card.marine.state, undefined);
  assert.match(card.marine.line, /has not settled/);
});

test('a failed marine read and a failed tide stay missing', async () => {
  const card = await composeCard('2026-10-05', deps({
    skyBound: false,
    tide: async () => { throw new Error('noaa down'); },
    marine: async () => { throw new Error('oracle down'); },
    weather: async () => ({ tempF: 70, condition: 'clear' }),
  }));
  assert.equal(card.marine.status, 'missing');
  assert.equal(card.marine.state, undefined);
  assert.match(card.marine.line, /did not answer/);
  assert.equal(card.tide.status, 'missing');
  assert.equal(card.tide.predictions, undefined);
  assert.doesNotMatch(card.tide.line, /\d+\.\d+ ft/);
  assert.equal(card.weather.tempF, 70);
});

test('weather for another day is the archive sentence and does not invent a temperature', async () => {
  let weatherCalls = 0;
  const card = await composeCard('2026-10-06', deps({
    priceBound: false,
    weather: async () => { weatherCalls += 1; return { tempF: 0, condition: 'clear' }; },
  }));
  assert.equal(weatherCalls, 0);
  assert.equal(card.weather.status, 'missing');
  assert.equal(card.weather.tempF, undefined);
  assert.match(card.weather.line, /today's weather only/);
  assert.match(card.basket.line, /offline/);
  assert.equal(card.basket.value, null);
});

test('a weather miss today does not become zero degrees', async () => {
  const card = await composeCard('2026-10-05', deps({
    weather: async () => null,
  }));
  assert.equal(card.weather.status, 'missing');
  assert.equal(card.weather.tempF, undefined);
  assert.equal(card.weather.line, 'Weather did not answer.');
});

test('GET reads the books and does not write', async () => {
  let puts = 0;
  let gets = 0;
  const kv = {
    async get() { gets += 1; return null; },
    async put() { puts += 1; },
  };
  const result = await almanacResponse({ VISITS: kv }, 'https://pointcast.xyz/almanac.json?date=2026-10-05', {
    now: NOW,
    picks: {},
    tide: async () => ({ predictions: [] }),
    weather: async () => null,
    marine: async () => { throw new Error('oracle down'); },
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.card.number, 1);
  assert.equal(result.body.card.basket.line, 'no reports yet');
  assert.equal(puts, 0);
  assert.ok(gets >= 1);
  const bad = await almanacResponse({ VISITS: kv }, 'https://pointcast.xyz/almanac.json?date=2026-10-04', { now: NOW, picks: {} });
  assert.equal(bad.status, 400);
  assert.equal(puts, 0);
});

test('the share card prints the number and the miss, not a fake tide', async () => {
  const card = await composeCard('2026-10-05', deps());
  const svg = cardSvg(card);
  assert.match(svg, /No\. 1/);
  assert.match(svg, /no reports yet/);
  assert.doesNotMatch(svg, /0\.00 ft/);
  assert.doesNotMatch(svg, /<script/i);
});
