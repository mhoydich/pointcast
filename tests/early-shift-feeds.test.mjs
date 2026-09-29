import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

import { laWallToMs } from '../functions/_lib/air-assign.mjs';
import { parseAirNow, parseAwcNewest, parseNdbc, parseTides, sunDetail } from '../workers/early-shift/src/feeds.mjs';

// Early Shift feed parsers (docs/plans/2026-09-28-early-shift-desk-spec.md §4,
// group W): each upstream body → a filed reading or a gap, never an invented
// number. ceilingOf/sunTimes are the real src/lib/marine-oracle.ts and
// src/lib/sky.ts implementations (loaded once through vite, the same pattern
// tests/marine-oracle.test.mjs uses — those files import extensionless
// siblings plain node can't resolve), injected exactly as shift.ts injects
// them, so this file exercises the production math, not a stand-in.

async function withDeps(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const marine = await server.ssrLoadModule('/src/lib/marine-oracle.ts');
    const sky = await server.ssrLoadModule('/src/lib/sky.ts');
    return await run({ ceilingOf: marine.ceilingOf, sunTimes: sky.sunTimes });
  } finally {
    await server.close();
  }
}

const NOW = Date.parse('2026-09-28T13:20:00Z'); // 6:20 AM PDT

test('parseAwcNewest: "10+" visibility reads as the number 10, and files clear', () => withDeps(({ ceilingOf }) => {
  const text = JSON.stringify([
    { metarType: 'METAR', obsTime: NOW / 1000 - 300, visib: '10+', wxString: null, clouds: [] },
  ]);
  const out = parseAwcNewest(text, NOW, ceilingOf);
  assert.equal(out.gap, undefined);
  assert.equal(out.detail.visMi, 10);
  assert.equal(typeof out.detail.visMi, 'number');
  assert.equal(out.value, 'clear');
}));

test('parseAwcNewest: a plain numeric visib string parses, and VV (obscured sky) sets the ceiling from vertVis', () => withDeps(({ ceilingOf }) => {
  const text = JSON.stringify([
    { metarType: 'METAR', obsTime: NOW / 1000 - 300, visib: '0.25', wxString: 'FG', vertVis: 2, clouds: [{ cover: 'VV', base: null }] },
  ]);
  const out = parseAwcNewest(text, NOW, ceilingOf);
  assert.equal(out.detail.visMi, 0.25);
  assert.equal(out.detail.ceilFt, 200); // vertVis (hundreds of ft) * 100
  assert.equal(out.value, 'none'); // under 1 mi visibility
}));

test('parseAwcNewest: an unreadable visib (neither a number nor "N+") is a shape gap, not a guess', () => withDeps(({ ceilingOf }) => {
  const text = JSON.stringify([{ metarType: 'METAR', obsTime: NOW / 1000 - 300, visib: null, clouds: [] }]);
  assert.deepEqual(parseAwcNewest(text, NOW, ceilingOf), { gap: 'shape' });
}));

test('parseAwcNewest: a body over STALE_MIN.sky (90 min) old is a stale gap, never filed', () => withDeps(({ ceilingOf }) => {
  const text = JSON.stringify([{ metarType: 'METAR', obsTime: (NOW - 100 * 60_000) / 1000, visib: 10, clouds: [] }]);
  assert.deepEqual(parseAwcNewest(text, NOW, ceilingOf), { gap: 'stale' });
}));

test('parseAwcNewest: a 200 response that is not the AWC array (an Iowa-Mesonet-style rate-limit sentence) is a shape gap', () => withDeps(({ ceilingOf }) => {
  const text = 'ERROR: too many requests, try again in one minute';
  assert.deepEqual(parseAwcNewest(text, NOW, ceilingOf), { gap: 'shape' });
}));

test('parseTides: reads the CO-OPS hilo predictions and points at the next event ahead of now', () => {
  const text = JSON.stringify({
    predictions: [
      { t: '2026-09-28 05:10', v: '1.2', type: 'L' },
      { t: '2026-09-28 14:12', v: '5.1', type: 'H' }, // ahead of NOW (13:20Z)
      { t: '2026-09-28 21:40', v: '0.4', type: 'L' },
    ],
  });
  const out = parseTides(text, NOW);
  assert.equal(out.gap, undefined);
  assert.equal(out.value, 'rising');
  assert.equal(out.detail.next.length, 2); // only events still ahead
  assert.equal(out.detail.next[0].type, 'H');
  assert.equal(out.detail.next[0].ft, 5.1);
});

test('parseTides: no predictions body at all is a shape gap', () => {
  assert.deepEqual(parseTides(JSON.stringify({ predictions: [] }), NOW), { gap: 'shape' });
  assert.deepEqual(parseTides('not json', NOW), { gap: 'shape' });
});

test('parseNdbc: WVHT meters becomes feet, WTMP °C becomes °F, DPD/MWD pass through as numbers', () => {
  const header1 = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE';
  const header2 = '#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi    hPa    ft';
  const row = '2026 09 28 13 05 999 99.0 99.0    0.6  13.0   6.8 160 9999.0  99.0  23.1  99.0 99.0 99.00 99.00';
  const text = [header1, header2, row].join('\n');
  const out = parseNdbc(text, NOW);
  assert.equal(out.gap, undefined);
  assert.equal(out.detail.ft, Math.round(0.6 * 3.28084 * 100) / 100);
  assert.equal(typeof out.detail.ft, 'number');
  assert.equal(out.detail.periodS, 13);
  assert.equal(out.detail.dirDeg, 160);
  assert.equal(out.detail.waterF, Math.round((23.1 * 9 / 5 + 32) * 10) / 10);
  assert.equal(out.value, '1-2');
});

test('parseNdbc: NDBC\'s "MM" missing-data marker on WVHT is a shape gap, never a guessed height', () => {
  const header = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE';
  const row = '2026 09 28 06 00 999 99.0 99.0     MM  13.0   6.8 160 9999.0  99.0  23.1  99.0 99.0 99.00 99.00';
  const out = parseNdbc([header, row].join('\n'), NOW);
  assert.deepEqual(out, { gap: 'shape' });
});

test('parseNdbc: "MM" on a secondary field (period/direction/water temp) reads as null, not a shape gap', () => {
  const header = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE';
  const row = '2026 09 28 13 05 999 99.0 99.0    0.6    MM   6.8  MM 9999.0  99.0    MM  99.0 99.0 99.00 99.00';
  const out = parseNdbc([header, row].join('\n'), NOW);
  assert.equal(out.gap, undefined);
  assert.equal(out.detail.periodS, null);
  assert.equal(out.detail.dirDeg, null);
  assert.equal(out.detail.waterF, null);
});

test('parseNdbc: a reading over STALE_MIN.swell (180 min) old is a stale gap', () => {
  const header = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE';
  const old = new Date(NOW - 200 * 60_000);
  const stamp = `${old.getUTCFullYear()} ${String(old.getUTCMonth() + 1).padStart(2, '0')} ${String(old.getUTCDate()).padStart(2, '0')} ${String(old.getUTCHours()).padStart(2, '0')} ${String(old.getUTCMinutes()).padStart(2, '0')}`;
  const row = `${stamp} 999 99.0 99.0    0.6  13.0   6.8 160 9999.0  99.0  23.1  99.0 99.0 99.00 99.00`;
  assert.deepEqual(parseNdbc([header, row].join('\n'), NOW), { gap: 'stale' });
});

test('parseNdbc: a 200-with-text response (no data rows under the header) is a shape gap', () => {
  const text = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE\n';
  assert.deepEqual(parseNdbc(text, NOW), { gap: 'shape' });
  assert.deepEqual(parseNdbc('service unavailable, try again later', NOW), { gap: 'shape' });
});

test('parseAirNow: takes the worst (highest AQI) pollutant among those returned', () => {
  const text = JSON.stringify([
    { DateObserved: '2026-09-28', HourObserved: 6, ParameterName: 'O3', AQI: 32, Category: { Number: 1, Name: 'Good' } },
    { DateObserved: '2026-09-28', HourObserved: 6, ParameterName: 'PM2.5', AQI: 58, Category: { Number: 2, Name: 'Moderate' } },
  ]);
  const out = parseAirNow(text, NOW, laWallToMs);
  assert.equal(out.gap, undefined);
  assert.equal(out.detail.aqi, 58);
  assert.equal(out.detail.param, 'PM2.5');
  assert.equal(out.value, 'moderate');
});

test('parseAirNow: an empty array (nothing near the point) is a shape gap', () => {
  assert.deepEqual(parseAirNow('[]', NOW, laWallToMs), { gap: 'shape' });
  assert.deepEqual(parseAirNow('<html>rate limited</html>', NOW, laWallToMs), { gap: 'shape' });
});

test('parseAirNow: a reading over STALE_MIN.air (180 min) old at its own local hour is a stale gap', () => {
  // NOW is 6:20 AM PDT on 2026-09-28. An observation at 2:00 AM local is over 3h old.
  const text = JSON.stringify([{ DateObserved: '2026-09-28', HourObserved: 2, ParameterName: 'PM2.5', AQI: 40 }]);
  assert.deepEqual(parseAirNow(text, NOW, laWallToMs), { gap: 'stale' });
});

test('sunDetail: computes sunrise before sunset for El Segundo, and is never a gap', () => withDeps(({ sunTimes }) => {
  const out = sunDetail(NOW, sunTimes);
  assert.equal(out.gap, undefined);
  assert.equal(out.value, 'times');
  assert.ok(Date.parse(out.detail.sunrise) < Date.parse(out.detail.sunset));
}));
