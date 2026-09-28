import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// The Pickleball Board (/pickleball), group C (build spec §8, §11): KLAX
// conditions math, the NWS next-3h lookahead, and the OG card's pure logic.
//
// court-conditions.ts imports src/lib/marine-oracle.ts, which (like
// src/lib/burnoff.ts and src/lib/sky.ts underneath it) uses extensionless
// relative imports that plain Node's ESM loader cannot resolve — the same
// reason tests/marine-oracle.test.mjs loads it through Vite's SSR module
// loader instead of a plain `import`. court-weather.mjs and
// src/lib/og-pickleball-card.mjs have no such import and load directly.
//
// functions/og/pickleball.png.ts is never imported here (it pulls in
// resvg-wasm) — its pure card-building logic lives in
// src/lib/og-pickleball-card.mjs instead, same split as og-kennel-card.mjs.
import { heatWords, metarNow, nwsNext3h, windWords, wetWords } from '../functions/_lib/court-weather.mjs';
import { bestBetLine, NO_LIVE_LINE, pickleballCard } from '../src/lib/og-pickleball-card.mjs';
import { lightAt } from '../src/lib/unfurl/light.mjs';

async function loadConditions() {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const mod = await server.ssrLoadModule('/functions/_lib/court-conditions.ts');
  return { ...mod, close: () => server.close() };
}

const KNOTS_TO_MPH = 1.15078;

/** One AWC METAR row, same shape marine-oracle.ts and court-weather.mjs both read. */
function metarRow(over = {}) {
  return {
    metarType: 'METAR',
    obsTime: Math.floor(Date.parse('2026-09-28T20:00:00Z') / 1000),
    rawOb: 'KLAX 282000Z 25010KT 10SM FEW250 22/12 A2996',
    wspd: 10,
    wgst: null,
    wdir: 250,
    temp: 22,
    clouds: [{ cover: 'FEW', base: 25000 }],
    wxString: '',
    ...over,
  };
}
const awcText = (over = {}) => JSON.stringify([metarRow(over)]);

test('metarNow: knots convert to mph (the exact §8 formula) and °C to °F', () => {
  const r = metarNow(awcText({ wspd: 10, temp: 20 }));
  assert.equal(r.mph, 10 * KNOTS_TO_MPH);
  assert.equal(r.tempF, 68);
  assert.equal(r.observedAt, new Date(metarRow().obsTime * 1000).toISOString());
});

test('metarNow: a fractional knot value still converts exactly', () => {
  const r = metarNow(awcText({ wspd: 18.5 }));
  assert.equal(r.mph, 18.5 * KNOTS_TO_MPH);
});

test('metarNow: VRB wind direction and a null gust are handled', () => {
  const r = metarNow(awcText({ wdir: 'VRB', wgst: null }));
  assert.equal(r.dir, 'VRB');
  assert.equal(r.gustMph, null);
});

test('metarNow: a real gust converts the same way wind speed does', () => {
  const r = metarNow(awcText({ wgst: 22 }));
  assert.equal(r.gustMph, 22 * KNOTS_TO_MPH);
});

test('metarNow: no wind field on the row reads as no reading, not zero', () => {
  const r = metarNow(awcText({ wspd: null, wdir: null }));
  assert.equal(r.mph, null);
  assert.equal(r.dir, null);
});

test('metarNow: DZ counts as wet; RA counts as wet; a clear report does not', () => {
  assert.equal(metarNow(awcText({ wxString: '-DZ' })).wet, true);
  assert.equal(metarNow(awcText({ wxString: '', rawOb: 'KLAX 282000Z 25010KT 10SM -RA BKN008 18/17 A2996' })).wet, true);
  assert.equal(metarNow(awcText({ wxString: '', rawOb: 'KLAX 282000Z 25010KT 10SM FEW250 22/12 A2996' })).wet, false);
  assert.equal(metarNow(awcText({ wxString: 'FG' })).wet, false, 'fog is not the wet-court rule');
});

test('metarNow: only present-weather groups count as wet — never the remarks (CONTRAILS, FZRANO, RAB/RAE times)', () => {
  const clear = 'METAR KLAX 282053Z 25008KT 10SM CLR 21/13 A2994';
  assert.equal(metarNow(awcText({ wxString: null, rawOb: `${clear} RMK AO2 CONTRAILS SLP138` })).wet, false, 'a contrail remark on a clear day');
  assert.equal(metarNow(awcText({ wxString: null, rawOb: `${clear} RMK AO2 RAB05E20 SLP138` })).wet, false, 'rain began and ended earlier: not raining now');
  assert.equal(metarNow(awcText({ wxString: null, rawOb: `${clear} RMK AO2 FZRANO` })).wet, false, 'the freezing-rain sensor is down');
  assert.equal(metarNow(awcText({ wxString: null, rawOb: 'METAR KLAX 282053Z 25008KT 3SM SHRA BR OVC008 16/15 A2994 RMK AO2' })).wet, true, 'showers in the body');
  assert.equal(metarNow(awcText({ wxString: '+TSRA' })).wet, true);
  assert.equal(metarNow(awcText({ wxString: 'FZDZ' })).wet, true);
  assert.equal(metarNow(awcText({ wxString: 'VCSH' })).wet, false, 'showers in the vicinity are not a wet court');
});

test('metarNow: not JSON, not an array, or no obsTime at all → null, never a crash', () => {
  assert.equal(metarNow('not json'), null);
  assert.equal(metarNow('{"not":"an array"}'), null);
  assert.equal(metarNow(JSON.stringify([{ metarType: 'METAR' }])), null);
});

test('windWords/heatWords/wetWords: the plain-language thresholds from §8', () => {
  assert.equal(windWords(null), null);
  assert.equal(windWords(14.9), null);
  assert.equal(windWords(15), 'lobs are a gamble');
  assert.equal(windWords(19.9), 'lobs are a gamble');
  assert.equal(windWords(20), 'dinks only');
  assert.equal(windWords(24.9), 'dinks only');
  assert.equal(windWords(25), 'the ball is in Hawthorne');

  assert.equal(heatWords(null), null);
  assert.equal(heatWords(85), null);
  assert.match(heatWords(85.1), /hotter than the air/);

  assert.equal(wetWords(false), null);
  assert.equal(wetWords(true), 'wet paint, no traction');
});

test('nwsNext3h: the worst of the next three hours, or null without a real forecast', () => {
  assert.equal(nwsNext3h(null), null);
  assert.equal(nwsNext3h([]), null);
  assert.equal(nwsNext3h('nope'), null);

  const periods = [
    { windSpeed: '10 mph', probabilityOfPrecipitation: { value: 20 }, shortForecast: 'Mostly Clear' },
    { windSpeed: '15 to 20 mph', probabilityOfPrecipitation: { value: 40 }, shortForecast: 'Windy' },
    { windSpeed: '5 mph', probabilityOfPrecipitation: { value: null }, shortForecast: 'Clear' },
    { windSpeed: '99 mph', probabilityOfPrecipitation: { value: 99 }, shortForecast: 'Storm — never reached' },
  ];
  const r = nwsNext3h(periods);
  assert.equal(r.maxWindMph, 20, 'the 4th hour is outside the window');
  assert.equal(r.maxPop, 40);
  assert.equal(r.short, 'Mostly Clear', 'the first of the three hours');
});

/** A fetch mock that answers AWC by URL substring and NWS by another, and nothing else. */
function fakeFetch({ awc, nws }) {
  return async (url) => {
    const u = String(url);
    if (u.includes('aviationweather.gov')) return awc();
    if (u.includes('api.weather.gov')) return nws();
    throw new Error(`readConditions: unexpected fetch ${u}`);
  };
}

const ok = (text) => ({ ok: true, status: 200, text: async () => text });
const down = (status = 503) => ({ ok: false, status, text: async () => 'down' });

test('readConditions: an NWS failure returns next3h null, without taking the rest of the strip down', async (t) => {
  const { readConditions, close } = await loadConditions(); t.after(close);
  const now = new Date('2026-09-28T20:00:00Z'); // 1pm in El Segundo
  const conditions = await readConditions(now, {
    fetch: fakeFetch({ awc: () => ok(awcText({ wspd: 8, temp: 18 })), nws: () => down(503) }),
  });
  assert.equal(conditions.next3h, null);
  assert.ok(conditions.wind, 'the METAR still reads even though NWS is down');
  assert.equal(conditions.wind.mph, 8 * KNOTS_TO_MPH);
  assert.equal(conditions.tempF, 18 * 9 / 5 + 32);
});

test('readConditions: a malformed NWS body (no periods) also reads as next3h null, not a throw', async (t) => {
  const { readConditions, close } = await loadConditions(); t.after(close);
  const now = new Date('2026-09-28T20:00:00Z');
  const conditions = await readConditions(now, {
    fetch: fakeFetch({ awc: () => ok(awcText()), nws: () => ok('{"properties":{}}') }),
  });
  assert.equal(conditions.next3h, null);
});

test('readConditions: every source down still returns a Conditions object, not a throw', async (t) => {
  const { readConditions, close } = await loadConditions(); t.after(close);
  const now = new Date('2026-09-28T20:00:00Z');
  const conditions = await readConditions(now, { fetch: fakeFetch({ awc: () => down(503), nws: () => down(503) }) });
  assert.equal(conditions.wind, null);
  assert.equal(conditions.tempF, null);
  assert.equal(conditions.heat, null);
  assert.equal(conditions.wet, null);
  assert.equal(conditions.next3h, null);
  // sunset is pure math off `now` and never depends on a fetch succeeding.
  assert.equal(typeof conditions.sunset, 'string');
});

test('readConditions: a METAR row with no wind speed is no wind line, never a "WIND 0"', async (t) => {
  const { readConditions, close } = await loadConditions(); t.after(close);
  const now = new Date('2026-09-28T20:00:00Z');
  const conditions = await readConditions(now, {
    fetch: fakeFetch({ awc: () => ok(awcText({ wspd: null, wdir: null })), nws: () => down(503) }),
  });
  assert.equal(conditions.wind, null);
  assert.equal(conditions.tempF, 22 * 9 / 5 + 32, 'the rest of the row still reads');
});

test('defaultConditionsDeps: wraps the global fetch (workerd rejects a detached one) and caches upstream text', async (t) => {
  const { defaultConditionsDeps, edgeCached, close } = await loadConditions(); t.after(close);
  const deps = defaultConditionsDeps();
  assert.notEqual(deps.fetch, globalThis.fetch, 'never the bare global: deps.fetch(url) would call it with this = deps');
  assert.equal(deps.cached, edgeCached);
  // Under node there is no caches.default, so edgeCached is a pass-through.
  assert.equal(await edgeCached('https://example.test/x', 60, async () => 'text'), 'text');
});

test('NWS_GRIDPOINT_URL is the El Segundo gridpoint from spec §0: office LOX, grid 148,40', async (t) => {
  const { NWS_GRIDPOINT_URL, close } = await loadConditions(); t.after(close);
  assert.match(NWS_GRIDPOINT_URL, /\/gridpoints\/LOX\/148,40\//);
});

test('bestBetLine: an empty board says so, never inventing a bet', () => {
  assert.equal(bestBetLine(undefined), NO_LIVE_LINE);
  assert.equal(bestBetLine(null), NO_LIVE_LINE);
  assert.equal(bestBetLine({}), NO_LIVE_LINE);
  assert.equal(bestBetLine({ best: null }), NO_LIVE_LINE);
  assert.equal(bestBetLine({ best: { line: '   ' } }), NO_LIVE_LINE);
  assert.equal(bestBetLine({ best: { line: 'Advanced drop-in now until 7 PM' } }), 'Advanced drop-in now until 7 PM');
});

test('the OG card renders from an empty board: a valid SVG, no crash, no invented line', () => {
  const light = lightAt(new Date('2026-09-28T20:00:00Z'), '');
  const svg = pickleballCard({ board: null, light });
  assert.match(svg, /^<svg/);
  assert.match(svg, /PICKLEBALL/);
  assert.match(svg, /No live reports yet/);
  assert.doesNotMatch(svg, /undefined|null/);
});

test('the OG card prints the board\'s own best-bet line when there is one', () => {
  const light = lightAt(new Date('2026-09-28T20:00:00Z'), '');
  const svg = pickleballCard({ board: { best: { line: 'Manhattan Middle · 1-4 in the rack' } }, light });
  assert.match(svg, /Manhattan Middle/);
});
