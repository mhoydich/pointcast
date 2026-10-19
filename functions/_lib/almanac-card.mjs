/**
 * Daily Almanac Card. No. 1 is 2026-10-05 in El Segundo.
 *
 * Tide, the marine layer, the price-wire basket, the Morning Edition pick,
 * and the weather are read from the sources the town already has. A missing
 * source stays missing. This module does not write.
 */

import { readBook as readSky } from './sky-calls.mjs';
import { basketOf, readBook as readPrices } from './price-wire.mjs';

export const SCHEMA = 'pointcast.daily-almanac/v0.1';
export const CARD_EPOCH = '2026-10-05';
export const CARD_LAST = '2026-12-31';
export const TIDE_STATION = '9410660';
export const TIDE_STATION_NAME = 'Los Angeles (Outer Harbor)';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOAA = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const EL_SEGUNDO = { lat: 33.9192, lng: -118.4165 };

const WX_CODE = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  80: 'showers',
  81: 'showers',
  82: 'showers',
  95: 'storm',
  96: 'storm',
  99: 'storm',
};

function noon(iso) {
  return Date.parse(`${iso}T12:00:00Z`);
}

export function pacificDay(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
}

export function addIsoDays(iso, days) {
  return new Date(noon(iso) + days * 86400000).toISOString().slice(0, 10);
}

export function cardNumber(iso) {
  if (!DATE_RE.test(iso) || iso < CARD_EPOCH) return null;
  return Math.round((noon(iso) - noon(CARD_EPOCH)) / 86400000) + 1;
}

export function isCardDate(iso) {
  return DATE_RE.test(iso) && iso >= CARD_EPOCH && iso <= CARD_LAST && cardNumber(iso) != null;
}

export function cardDates() {
  const dates = [];
  for (let date = CARD_EPOCH; date <= CARD_LAST; date = addIsoDays(date, 1)) dates.push(date);
  return dates;
}

export function cardDateLabel(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function cardMeta(iso) {
  const number = cardNumber(iso);
  return {
    number,
    date: iso,
    label: cardDateLabel(iso),
    title: `Daily Almanac No. ${number}`,
    path: `/almanac/${iso}`,
    json: `/almanac.json?date=${iso}`,
    og: `/og/almanac/${iso}.png`,
  };
}

function missing(line, extra = {}) {
  return { status: 'missing', line, ...extra };
}

function clock(stamp) {
  const match = /(\d{2}):(\d{2})/.exec(String(stamp || ''));
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
}

export async function fetchTide(date, fetchImpl = globalThis.fetch) {
  const stamp = date.replace(/-/g, '');
  const query = new URLSearchParams({
    product: 'predictions',
    application: 'pointcast.xyz',
    begin_date: stamp,
    end_date: stamp,
    datum: 'MLLW',
    station: TIDE_STATION,
    time_zone: 'lst_ldt',
    units: 'english',
    interval: 'hilo',
    format: 'json',
  });
  const response = await fetchImpl(`${NOAA}?${query}`, { headers: { accept: 'application/json' } });
  if (!response?.ok) {
    const error = new Error(`noaa ${response?.status || 'down'}`);
    error.code = 'noaa';
    throw error;
  }
  return response.json();
}

async function tideLine(date, deps) {
  try {
    const body = deps.tide ? await deps.tide(date) : await fetchTide(date, deps.fetch || globalThis.fetch);
    const predictions = Array.isArray(body?.predictions) ? body.predictions : [];
    const rows = [];
    for (const prediction of predictions) {
      const height = Number(prediction.v ?? prediction.heightFt);
      const kind = prediction.type === 'H' || prediction.kind === 'high'
        ? 'high'
        : prediction.type === 'L' || prediction.kind === 'low'
          ? 'low'
          : null;
      const time = clock(prediction.t || prediction.time);
      if (!kind || !time || !Number.isFinite(height)) continue;
      rows.push({ kind, time, heightFt: Math.round(height * 100) / 100 });
    }
    if (!rows.length) {
      return missing('NOAA returned no highs or lows for this date. Tide is not computed here.', {
        station: TIDE_STATION,
        stationName: TIDE_STATION_NAME,
      });
    }
    const line = rows.map((row) => `${row.kind === 'high' ? 'High' : 'Low'} ${row.time}, ${row.heightFt.toFixed(2)} ft`).join('. ');
    return {
      status: 'present',
      source: 'NOAA CO-OPS',
      station: TIDE_STATION,
      stationName: TIDE_STATION_NAME,
      datum: 'MLLW',
      predictions: rows,
      line: `${line}. Station ${TIDE_STATION}, ${TIDE_STATION_NAME}.`,
    };
  } catch {
    return missing('NOAA did not answer. Tide is not computed here.', { station: TIDE_STATION });
  }
}

function skyLine(date, deps) {
  if (!deps.skyBound) return null;
  const day = deps.skyBook?.days?.[date];
  if (!day || (!day.calls?.length && !day.verdict)) return null;
  if (day.verdict?.final) {
    const sentence = typeof day.verdict.sentence === 'string' && day.verdict.sentence.trim()
      ? day.verdict.sentence.trim()
      : String(day.verdict.state || 'settled');
    return {
      status: 'present',
      source: 'sky-calls',
      state: day.verdict.state || null,
      calls: day.calls?.length || 0,
      line: sentence,
    };
  }
  return missing('Sky calls are in. The marine-layer rule has not settled this morning.', {
    source: 'sky-calls',
    calls: day.calls?.length || 0,
  });
}

async function marineLine(date, deps) {
  const sky = skyLine(date, deps);
  if (sky) return sky;
  if (!deps.skyBound) {
    // Still try the marine-layer rule. The sky book being offline is not a verdict.
  }
  if (typeof deps.marine !== 'function') {
    return missing(deps.skyBound
      ? 'No sky-call result is on file for this morning.'
      : 'The sky-calls ledger is offline, and no marine-layer result was supplied.');
  }
  try {
    const answer = await deps.marine(date);
    const verdict = answer?.verdict;
    if (!verdict || typeof verdict.sentence !== 'string' || !verdict.sentence.trim()) {
      return missing('The marine-layer rule did not return a result.');
    }
    const settled = verdict.final === true;
    return {
      status: settled ? 'present' : 'missing',
      source: 'marine-layer',
      state: verdict.state || null,
      final: settled,
      line: verdict.sentence.trim(),
    };
  } catch {
    return missing('The marine-layer rule did not answer.');
  }
}

function basketLine(date, deps) {
  if (!deps.priceBound) return missing('The price wire is offline, so there is no basket to read.', { value: null });
  const reports = (Array.isArray(deps.priceBook?.reports) ? deps.priceBook.reports : [])
    .filter((report) => report && report.status === 'ok' && typeof report.date === 'string' && report.date <= date);
  const basket = basketOf(reports);
  if (basket.value == null) return missing('no reports yet', { value: null, note: basket.note });
  return {
    status: 'present',
    value: basket.value,
    base: basket.base,
    items: basket.items,
    of: basket.of,
    line: `El Segundo basket ${basket.value}. Not an official CPI.`,
    note: 'Equal-weight latest-over-first index of accepted reports dated on or before this card.',
  };
}

function pickLine(date, deps) {
  const pick = deps.picks?.[date];
  if (pick && typeof pick.blockId === 'string' && typeof pick.title === 'string' && pick.blockId && pick.title) {
    return {
      status: 'present',
      blockId: pick.blockId,
      title: pick.title,
      source: 'morning-picks',
      line: `Block ${pick.blockId}: ${pick.title}`,
    };
  }
  return missing('No Morning Edition pick is on file for this date.');
}

async function fetchWeather(fetchImpl) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', EL_SEGUNDO.lat.toFixed(2));
  url.searchParams.set('longitude', EL_SEGUNDO.lng.toFixed(2));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('timezone', 'America/Los_Angeles');
  url.searchParams.set('forecast_days', '1');
  const response = await fetchImpl(url, { headers: { accept: 'application/json', 'user-agent': 'pointcast-almanac/1.0' } });
  if (!response?.ok) throw new Error('weather');
  const body = await response.json();
  const temp = body?.current?.temperature_2m;
  const code = body?.current?.weather_code;
  if (!Number.isFinite(temp)) return null;
  return { tempF: Math.round(temp), condition: WX_CODE[code] || 'unknown' };
}

async function weatherLine(date, deps) {
  const today = pacificDay(deps.now ?? Date.now());
  if (date !== today) {
    return missing("This card keeps today's weather only. There is no archived reading for this date.");
  }
  try {
    const row = deps.weather ? await deps.weather(date) : await fetchWeather(deps.fetch || globalThis.fetch);
    if (!row || !Number.isFinite(row.tempF) || typeof row.condition !== 'string' || !row.condition) {
      return missing('Weather did not answer.');
    }
    return {
      status: 'present',
      tempF: row.tempF,
      condition: row.condition,
      source: 'open-meteo',
      line: `${row.tempF}°F, ${row.condition}.`,
    };
  } catch {
    return missing('Weather did not answer.');
  }
}

export async function composeCard(date, deps = {}) {
  if (!isCardDate(date)) return { ok: false, error: 'not a card date' };
  const [tide, marine, basket, pick, weather] = await Promise.all([
    tideLine(date, deps),
    marineLine(date, deps),
    Promise.resolve(basketLine(date, deps)),
    Promise.resolve(pickLine(date, deps)),
    weatherLine(date, deps),
  ]);
  return {
    ok: true,
    schema: SCHEMA,
    place: 'El Segundo, California',
    ...cardMeta(date),
    tide,
    marine,
    basket,
    pick,
    weather,
    note: 'A missing line was not guessed. Tide is NOAA or nothing. The basket is not an official CPI.',
  };
}

async function readJson(url, fetchImpl) {
  try {
    const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    if (!response?.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function loadPicks(origin, fetchImpl, assets) {
  const read = async (path) => {
    if (assets?.fetch) {
      try {
        const response = await assets.fetch(new URL(path, origin));
        if (response?.ok) return response.json();
      } catch { /* static fetch below */ }
    }
    return readJson(new URL(path, origin), fetchImpl);
  };
  const file = await read('/morning-picks.json');
  if (file?.picks && typeof file.picks === 'object') return file.picks;
  const today = await read('/today.json');
  const picks = {};
  const entries = [today?.today, today?.tomorrow, ...(Array.isArray(today?.past) ? today.past : [])];
  for (const entry of entries) {
    if (entry?.date && entry.blockId && entry.title) picks[entry.date] = { blockId: entry.blockId, title: entry.title };
  }
  return picks;
}

export async function loadDeps(env, origin, overrides = {}) {
  const skyBound = Boolean(env?.VISITS);
  const priceBound = skyBound;
  return {
    now: overrides.now ?? Date.now(),
    fetch: overrides.fetch || globalThis.fetch,
    skyBound,
    priceBound,
    skyBook: overrides.skyBook ?? (skyBound ? await readSky(env.VISITS) : null),
    priceBook: overrides.priceBook ?? (priceBound ? await readPrices(env.VISITS) : null),
    picks: overrides.picks ?? await loadPicks(origin, overrides.fetch || globalThis.fetch, env?.ASSETS),
    tide: overrides.tide,
    weather: overrides.weather,
    marine: overrides.marine,
  };
}

export function catalog(now = Date.now()) {
  const today = pacificDay(now);
  return {
    schema: SCHEMA,
    epoch: CARD_EPOCH,
    last: CARD_LAST,
    numberOne: CARD_EPOCH,
    today: isCardDate(today) ? today : null,
    place: 'El Segundo, California',
    cards: cardDates().map((date) => cardMeta(date)),
    note: 'No. 1 is 2026-10-05. Live lines are on ?date=. A missing line was not guessed.',
  };
}

/** GET /almanac.json. Reads sky and price books. Does not write. */
export async function almanacResponse(env, requestUrl, overrides = {}) {
  const url = new URL(requestUrl);
  const asked = url.searchParams.get('date');
  if (asked && !isCardDate(asked)) {
    return {
      status: 400,
      body: { ok: false, error: `date must be a card from ${CARD_EPOCH} through ${CARD_LAST}` },
    };
  }
  const deps = await loadDeps(env, url.origin, overrides);
  if (!asked) {
    const today = pacificDay(deps.now);
    const shown = isCardDate(today) ? today : CARD_EPOCH;
    const card = await composeCard(shown, deps);
    return { status: 200, body: { ok: true, ...catalog(deps.now), card } };
  }
  const card = await composeCard(asked, deps);
  return { status: 200, body: { ok: true, schema: SCHEMA, card } };
}

function xml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clip(value, max) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** 1200×630 social card. The lines are the card's own lines, including misses. */
export function cardSvg(card) {
  const rows = [
    ['Tide', card?.tide?.line],
    ['Sky', card?.marine?.line],
    ['Basket', card?.basket?.line],
    ['Pick', card?.pick?.line],
    ['Weather', card?.weather?.line],
  ];
  const stats = rows.map((row, index) => {
    const y = 214 + index * 72;
    return `<text x="78" y="${y}" fill="#9b2335" font-family="JetBrains Mono Variable, monospace" font-size="18" font-weight="700" letter-spacing="1.5">${xml(row[0].toUpperCase())}</text>
    <text x="230" y="${y}" fill="#1c2430" font-family="Inter, sans-serif" font-size="24">${xml(clip(row[1], 68))}</text>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4e7c8"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#1d3557" stroke-width="10"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#9b2335" stroke-width="3"/>
  <text x="78" y="118" fill="#1d3557" font-family="Inter, sans-serif" font-size="28" font-weight="700" letter-spacing="3">EL SEGUNDO</text>
  <text x="78" y="168" fill="#1c2430" font-family="Inter, sans-serif" font-size="54" font-weight="700">${xml(card?.title || 'Daily Almanac')}</text>
  <text x="1040" y="128" fill="#9b2335" font-family="JetBrains Mono Variable, monospace" font-size="42" font-weight="700" text-anchor="end">No. ${xml(card?.number ?? '')}</text>
  <text x="78" y="198" fill="#5c5346" font-family="Inter, sans-serif" font-size="22">${xml(card?.label || '')}</text>
  ${stats}
</svg>`;
}
