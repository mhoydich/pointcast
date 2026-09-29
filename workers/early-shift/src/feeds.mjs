// Early Shift feed parsers — one upstream body → one filed reading, or a gap.
// Build spec: docs/plans/2026-09-28-early-shift-desk-spec.md §4 (Worker).
//
// Pure, and deliberately import nothing runtime-specific: `ceilingOf`
// (src/lib/marine-oracle.ts) and `sunTimes` (src/lib/sky.ts) are injected by
// shift.ts, the one file that owns those imports, so this module runs the
// same under `node --test` as it does bundled into the Worker. Bucket math
// and staleness (STALE_MIN) are shared with the rest of the Desk via
// functions/_lib/air-desk.mjs (F's module) — never re-derived here.
//
// Honesty rule (house rule, spec §8): a 200 response carrying the wrong
// shape — an Iowa-Mesonet-style rate-limit sentence, a truncated file, a
// buoy's "MM" missing-data marker on the one field a bucket needs — is a
// `shape` gap, never an invented reading. `isStale()` runs inside each
// parser, against the reading's own `observedAt`, so a feed too old to
// trust (STALE_MIN) never files either.

import { aqiBucket, isStale, nextTides, skyBucket, swellBucket, tideValue } from '../../../functions/_lib/air-desk.mjs';
import { isoSec } from '../../../functions/_lib/air-reading.mjs';

/** El Segundo, same coordinates as src/lib/burnoff.ts's EL_SEGUNDO (duplicated here so this module stays import-free of that TS file). */
export const EL_SEGUNDO_COORDS = Object.freeze({ lat: 33.9192, lon: -118.4165 });

/** AWC `visib`: a number (statute miles), the string "10+" (10 or more), or a plain numeric string. Anything else is unreadable. */
function visMiOf(visib) {
  if (typeof visib === 'number') return Number.isFinite(visib) ? visib : null;
  if (typeof visib === 'string') {
    const n = parseFloat(visib.endsWith('+') ? visib.slice(0, -1) : visib);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * The newest METAR or SPECI in an AWC `format=json` body (same shape
 * court-weather.mjs's `metarNow` and marine-oracle.ts's `readAwc` read) →
 * the Sky feed's reading. `ceilingOf` is injected: it does the cloud-deck
 * math (BKN/OVC/OVX/VV), including the vertical-visibility case ("VV" —
 * sky obscured, ceiling from `vertVis`). A 200 body that isn't the
 * documented array, or has no readable visibility, is a shape gap.
 */
export function parseAwcNewest(text, nowMs, ceilingOf) {
  let data;
  try { data = JSON.parse(text); } catch { return { gap: 'shape' }; }
  if (!Array.isArray(data)) return { gap: 'shape' };
  const rows = data.filter((m) => m && typeof m.obsTime === 'number');
  if (!rows.length) return { gap: 'shape' };
  const newest = rows.reduce((a, b) => (b.obsTime > a.obsTime ? b : a));
  const observedAt = newest.obsTime * 1000;
  const visMi = visMiOf(newest.visib);
  if (visMi === null) return { gap: 'shape' };
  if (isStale('sky', observedAt, nowMs)) return { gap: 'stale' };
  const ceil = ceilingOf(newest);
  const ceilFt = Number.isFinite(ceil) ? Math.round(ceil) : null;
  const wx = typeof newest.wxString === 'string' && newest.wxString.trim() ? newest.wxString.trim().toUpperCase() : null;
  const detail = { obsAt: isoSec(observedAt), visMi, ceilFt, wx };
  const value = skyBucket(detail);
  if (value === null) return { gap: 'shape' };
  return { value, detail, observedAt };
}

/**
 * CO-OPS `datagetter` predictions (`interval=hilo`, `time_zone=gmt`,
 * station 9410660) → the Tides feed's reading: the events still ahead of
 * `nowMs`, oldest first (`nextTides`, F's module). `t` comes back as a GMT
 * wall-clock string with no offset marker ("2026-09-28 14:12"); read as UTC.
 * Predictions have no upstream staleness window (STALE_MIN has none for
 * tides) — they're a forward schedule, not an observation.
 */
export function parseTides(text, nowMs) {
  let data;
  try { data = JSON.parse(text); } catch { return { gap: 'shape' }; }
  const rows = Array.isArray(data?.predictions) ? data.predictions : null;
  if (!rows) return { gap: 'shape' };
  const events = [];
  for (const row of rows) {
    if (!row || typeof row.t !== 'string' || (row.type !== 'H' && row.type !== 'L')) continue;
    const at = Date.parse(`${row.t.replace(' ', 'T')}:00Z`);
    const ft = typeof row.v === 'string' ? parseFloat(row.v) : row.v;
    if (!Number.isFinite(at) || !Number.isFinite(ft)) continue;
    events.push({ type: row.type, at, ft });
  }
  if (!events.length) return { gap: 'shape' };
  const next = nextTides(events, nowMs, 4);
  if (!next.length) return { gap: 'shape' };
  const value = tideValue(events, nowMs);
  if (!value) return { gap: 'shape' };
  return { value, detail: { next }, observedAt: nowMs };
}

const MM = (s) => (s === undefined || s === 'MM' ? null : Number(s));

/**
 * NDBC `realtime2/<station>.txt` (two `#` header lines, standard meteorological
 * columns, newest reading first) → the Swell feed's reading. `WVHT` is
 * meters and becomes feet; `WTMP` is °C and becomes °F; NDBC's own "MM"
 * missing-data marker becomes `null` for everything but `WVHT`, which a
 * bucket needs — missing there is a shape gap, not a guessed height.
 */
export function parseNdbc(text, nowMs) {
  const lines = String(text).split('\n').map((l) => l.trim()).filter(Boolean);
  const data = lines.filter((l) => !l.startsWith('#'));
  if (!data.length) return { gap: 'shape' };
  const cols = data[0].split(/\s+/);
  if (cols.length < 15) return { gap: 'shape' };
  const [yy, mo, dd, hh, mi, , , , wvht, dpd, , mwd, , , wtmp] = cols;
  const observedAt = Date.UTC(Number(yy), Number(mo) - 1, Number(dd), Number(hh), Number(mi));
  if (!Number.isFinite(observedAt)) return { gap: 'shape' };
  const wvhtM = MM(wvht);
  if (wvhtM === null || !Number.isFinite(wvhtM)) return { gap: 'shape' };
  if (isStale('swell', observedAt, nowMs)) return { gap: 'stale' };
  const periodS = MM(dpd);
  const dirDeg = MM(mwd);
  const waterC = MM(wtmp);
  const detail = {
    ft: Math.round(wvhtM * 3.28084 * 100) / 100,
    periodS: Number.isFinite(periodS) ? Math.round(periodS * 10) / 10 : null,
    dirDeg: Number.isFinite(dirDeg) ? Math.round(dirDeg) : null,
    waterF: Number.isFinite(waterC) ? Math.round((waterC * 9 / 5 + 32) * 10) / 10 : null,
    obsAt: isoSec(observedAt),
  };
  const value = swellBucket(detail.ft);
  if (value === null) return { gap: 'shape' };
  return { value, detail, observedAt };
}

/**
 * AirNow `observation/latLong/current` JSON → the Air feed's reading: the
 * worst (highest AQI) pollutant among those returned, at its own local hour
 * (`laWallToMs` — AirNow reports in the monitor's local standard time).
 * Never called without a key; that gate lives in shift.ts (`blocked`).
 */
export function parseAirNow(text, nowMs, laWallToMs) {
  let data;
  try { data = JSON.parse(text); } catch { return { gap: 'shape' }; }
  if (!Array.isArray(data) || !data.length) return { gap: 'shape' };
  let worst = null;
  for (const row of data) {
    const aqi = Number(row?.AQI);
    const param = typeof row?.ParameterName === 'string' ? row.ParameterName : null;
    const day = typeof row?.DateObserved === 'string' ? row.DateObserved.trim() : null;
    const hour = Number(row?.HourObserved);
    if (!Number.isInteger(aqi) || aqi < 0 || !param || !day || !Number.isInteger(hour)) continue;
    if (!worst || aqi > worst.aqi) worst = { aqi, param, day, hour };
  }
  if (!worst) return { gap: 'shape' };
  const observedAt = laWallToMs(worst.day, `${String(worst.hour).padStart(2, '0')}:00`);
  if (!Number.isFinite(observedAt)) return { gap: 'shape' };
  if (isStale('air', observedAt, nowMs)) return { gap: 'stale' };
  const detail = { aqi: worst.aqi, param: worst.param, obsAt: isoSec(observedAt) };
  const value = aqiBucket(worst.aqi);
  if (value === null) return { gap: 'shape' };
  return { value, detail, observedAt };
}

/**
 * El Segundo sunrise/sunset for `nowMs`, computed (`sunTimes`, injected —
 * src/lib/sky.ts). No upstream, so never a gap in practice; `shape` is a
 * defensive fallback for the polar-night case `sunTimes` documents (never
 * reachable at this latitude).
 */
export function sunDetail(nowMs, sunTimes, coords = EL_SEGUNDO_COORDS) {
  const at = sunTimes(new Date(nowMs), coords.lat, coords.lon);
  if (!(at.sunrise instanceof Date) || !(at.sunset instanceof Date)) return { gap: 'shape' };
  const detail = { sunrise: isoSec(at.sunrise.getTime()), sunset: isoSec(at.sunset.getTime()) };
  return { value: 'times', detail, observedAt: nowMs };
}
