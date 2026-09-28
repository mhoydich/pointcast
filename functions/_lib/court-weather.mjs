// The Pickleball Board (/pickleball), group C, build spec §8 — pure weather
// math. Everything here is deterministic from the numbers it is handed: no
// fetch, no cache, no clock. Network calls and caching live in
// court-conditions.ts, which is the only caller.
//
// Source shape: the same AWC METAR JSON marine-oracle.ts reads for KLAX
// (readAwc's AwcMetar), except this module also reads the fields the marine
// layer rule ignores — wspd/wgst/wdir/temp/wxString/rawOb — because the
// board cares about wind and heat, not just the cloud deck.
//
// Build spec §0 (what changed today): wind is in knots, temperature is in
// °C, and `wdir` can be the string "VRB" (variable direction, too light or
// shifting to name one).

const KNOTS_TO_MPH = 1.15078;
const CELSIUS_TO_F = (c) => (c * 9) / 5 + 32;

/**
 * One present-weather group that is drizzle or rain: optional intensity,
 * optional vicinity, optional descriptor, then DZ or RA (possibly followed by
 * more precipitation codes: "-RA", "SHRA", "FZDZ", "+TSRA", "RASN"). Matched
 * against whole tokens only, never the remarks, so "CONTRAILS", "FZRANO" (the
 * freezing-rain sensor is down) and "RAB20"/"RAE20" (rain began or ended)
 * never read as a wet court.
 */
const WET_GROUP = /(^|\s)[-+]?(VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?(DZ|RA)[A-Z]*(?=\s|$)/;
/** A METAR's body, before its remarks (" RMK ..."). */
const bodyOf = (raw) => (typeof raw === 'string' ? raw.split(/\sRMK(\s|$)/)[0] : '');

/**
 * The newest routine-or-special METAR row in an AWC JSON response (raw text,
 * same endpoint `awcUrl()` builds) → the board's wind/temp/wet reading.
 *
 * `mph` is `null` only when the row itself carries no wind speed (`wspd`).
 * `gustMph` is `null` whenever the row has no gust (most of the time).
 * `dir` is degrees true, the literal string `"VRB"`, or `null`.
 * `wet` is true when the row's present-weather groups show drizzle or rain
 * (WET_GROUP): AWC's `wxString`, and the raw report's body up to " RMK" —
 * never the remarks. Anything else (snow, fog, haze) reads as not wet here;
 * the board only ever says "wet paint, no traction".
 *
 * Returns `null` when the text does not parse, is not the AWC array shape,
 * or holds no row with a real `obsTime`.
 */
export function metarNow(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  const rows = data.filter((m) => m && typeof m.obsTime === 'number');
  if (!rows.length) return null;
  const latest = rows.slice().sort((a, b) => b.obsTime - a.obsTime)[0];

  const wspd = typeof latest.wspd === 'number' ? latest.wspd : null;
  const wgst = typeof latest.wgst === 'number' ? latest.wgst : null;
  const dir = latest.wdir === 'VRB' ? 'VRB' : typeof latest.wdir === 'number' ? latest.wdir : null;
  const temp = typeof latest.temp === 'number' ? latest.temp : null;
  const wxText = `${typeof latest.wxString === 'string' ? latest.wxString : ''} ${bodyOf(latest.rawOb)}`;

  return {
    mph: wspd === null ? null : wspd * KNOTS_TO_MPH,
    gustMph: wgst === null ? null : wgst * KNOTS_TO_MPH,
    dir,
    tempF: temp === null ? null : CELSIUS_TO_F(temp),
    wet: WET_GROUP.test(wxText),
    observedAt: new Date(latest.obsTime * 1000).toISOString(),
  };
}

/**
 * Plain words under the wind number, or `null` under 15 mph (nothing to say).
 * `null` mph (no reading) also says nothing.
 */
export function windWords(mph) {
  if (mph == null) return null;
  if (mph < 15) return null;
  if (mph < 20) return 'lobs are a gamble';
  if (mph < 25) return 'dinks only';
  return 'the ball is in Hawthorne';
}

/** Over 85°F, the court runs hotter than the air says. `null` otherwise or without a reading. */
export function heatWords(tempF) {
  if (tempF == null) return null;
  return tempF > 85 ? 'court runs 10–20° hotter than the air' : null;
}

/** `wet` is metarNow()'s boolean; the words are the same regardless of which report showed it. */
export function wetWords(wet) {
  return wet ? 'wet paint, no traction' : null;
}

/** "10 mph" / "10 to 15 mph" (NWS forecastHourly's windSpeed) → the higher number, or null. */
function parseWindSpeed(text) {
  if (typeof text !== 'string') return null;
  const nums = [...text.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : null;
}

/**
 * NWS `forecastHourly` periods (already sliced to "upcoming", newest first)
 * → the worst of the next three hours: the highest wind, the highest chance
 * of rain, and the first period's short forecast as the one-line summary.
 *
 * `null` for anything that isn't a non-empty array — an NWS failure never
 * reaches this function with a periods list, it just never calls it.
 */
export function nwsNext3h(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null;
  const next3 = periods.slice(0, 3);
  let maxWindMph = null;
  let maxPop = null;
  for (const p of next3) {
    const wind = parseWindSpeed(p?.windSpeed);
    if (wind != null) maxWindMph = maxWindMph == null ? wind : Math.max(maxWindMph, wind);
    const pop = p?.probabilityOfPrecipitation?.value;
    if (typeof pop === 'number') maxPop = maxPop == null ? pop : Math.max(maxPop, pop);
  }
  const short = typeof next3[0]?.shortForecast === 'string' ? next3[0].shortForecast : null;
  return { maxWindMph, maxPop, short };
}
