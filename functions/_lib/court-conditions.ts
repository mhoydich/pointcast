// The Pickleball Board (/pickleball), group C, build spec §8 — assembles the
// KLAX conditions strip: wind and heat from the AWC METAR, the marine-layer
// verdict (src/lib/marine-oracle.ts, unchanged), sunset (src/lib/sky.ts),
// and the next three hours from the NWS gridpoint for El Segundo (LOX/148,40
// per §0). GET /api/air/board (group A) calls readConditions() once per
// request and folds the result straight into BoardPayload.conditions.
//
// Honesty rule, same as marine-oracle.ts: every source sits in its own try,
// so an outage anywhere (METAR, NWS, even the marine oracle) never takes the
// others down and never turns into an invented number. The response this
// feeds is still 200 with those fields null.

import { answerMarine, awcUrl, localDateOf, type MarineDeps } from '../../src/lib/marine-oracle.ts';
import { sunTimes } from '../../src/lib/sky.ts';
import { EL_SEGUNDO, LOCAL_TIMEZONE, formatClock } from '../../src/lib/burnoff.ts';
import type { Conditions } from '../../src/lib/courts.ts';
import { heatWords, metarNow, nwsNext3h, windWords, wetWords } from './court-weather.mjs';

/** The strip's station label — every reading on it traces back to KLAX. */
export const STATION_LABEL = 'KLAX';

/** El Segundo's NWS gridpoint (build spec §0): office LOX, grid 148,40. */
export const NWS_GRIDPOINT_URL = 'https://api.weather.gov/gridpoints/LOX/148,40/forecast/hourly';

const NWS_USER_AGENT = 'PointCast/1.0 (pointcast.xyz, wallet@pointcast.xyz)';

export interface ConditionsDeps {
  fetch: typeof fetch;
  /** Cloudflare's `caches.default` in production; omitted (or throwing) just skips the cache. */
  cached?: (url: string, ttlSeconds: number, load: () => Promise<string>) => Promise<string>;
}

/**
 * Cloudflare Cache API when present (production, wrangler dev), a pass-through
 * elsewhere (node tests) — the same shape as functions/_lib/oracles/marine-layer.ts's.
 * Upstream text only (AWC, NWS), under its own key, so the board's 30 s
 * cache miss never re-asks KLAX or NWS inside the TTL (spec §8: 300 s / 600 s).
 */
export async function edgeCached(url: string, ttlSeconds: number, load: () => Promise<string>): Promise<string> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (!cache) return load();
  const key = new Request(`${url}${url.includes('?') ? '&' : '?'}__pointcast_courts=1`);
  try {
    const hit = await cache.match(key);
    if (hit) return await hit.text();
  } catch { /* a cache miss is fine */ }
  const text = await load();
  try {
    await cache.put(key, new Response(text, { headers: { 'Cache-Control': `public, max-age=${ttlSeconds}` } }));
  } catch { /* caching is best effort */ }
  return text;
}

/**
 * Production deps. `fetch` is wrapped rather than passed bare: workerd throws
 * "Illegal invocation" when the global fetch is called as `deps.fetch(…)`.
 * AWC and NWS both ask for a User-Agent; a caller's own headers win.
 */
export function defaultConditionsDeps(): ConditionsDeps {
  return {
    fetch: ((url: RequestInfo | URL, init: RequestInit = {}) => fetch(url, {
      ...init,
      headers: { 'User-Agent': NWS_USER_AGENT, ...(init.headers as Record<string, string> | undefined) },
    })) as typeof fetch,
    cached: edgeCached,
  };
}

/** Today's El Segundo sunset, ISO, from sunTimes() (pure math, no fetch); null if it can't say. */
export function sunsetAt(now: Date): string | null {
  try {
    const todayISO = localDateOf(now);
    const [y, mo, d] = todayISO.split('-').map(Number);
    const { sunset: at } = sunTimes(new Date(Date.UTC(y, mo - 1, d)), EL_SEGUNDO.lat, EL_SEGUNDO.lon, now);
    return at ? at.toISOString() : null;
  } catch {
    // sunTimes() is pure math and should never throw, but a bad `now` is still not our problem to crash on.
    return null;
  }
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch (optionally through `deps.cached`), throwing on anything but a 200. */
async function loadText(deps: ConditionsDeps, url: string, ttlSeconds: number, init: RequestInit = {}): Promise<string> {
  const get = async () => {
    const res = await deps.fetch(url, init);
    if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
    return res.text();
  };
  return deps.cached ? deps.cached(url, ttlSeconds, get) : get();
}

/** Two-pass DST-safe conversion: a wall-clock minute-of-day in `timeZone`, on the LA calendar day `dateISO`, to the UTC instant it names. */
function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset', hour: '2-digit' }).formatToParts(instant);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const m = /GMT([+-]\d+)(?::?(\d+))?/.exec(raw);
  if (!m) return 0;
  const sign = m[1].startsWith('-') ? -1 : 1;
  return sign * (Math.abs(Number(m[1])) * 60 + Number(m[2] ?? 0));
}

export function localInstantAt(dateISO: string, minute: number, timeZone: string = LOCAL_TIMEZONE): Date {
  const [y, mo, d] = dateISO.split('-').map(Number);
  const naiveUtc = Date.UTC(y, mo - 1, d, Math.floor(minute / 60), minute % 60);
  const firstPass = naiveUtc - tzOffsetMinutes(new Date(naiveUtc), timeZone) * 60_000;
  const secondPass = naiveUtc - tzOffsetMinutes(new Date(firstPass), timeZone) * 60_000;
  return new Date(secondPass);
}

/** "burned off 10:53 am" / "did not burn off" / "no marine layer today" / "still under the layer" / "no record yet". */
function marineLabel(verdict: Awaited<ReturnType<typeof answerMarine>>['verdict']): string {
  switch (verdict.state) {
    case 'opened': return `burned off ${formatClock(verdict.openedAtMinute ?? 0)}`;
    case 'never': return 'did not burn off';
    case 'no-layer': return 'no marine layer today';
    case 'watching': return 'still under the layer';
    default: return 'no record yet';
  }
}

/**
 * KLAX + NWS + the marine oracle + sunset, folded into one `Conditions`.
 * Never throws: every source is best-effort, and a total wipeout still
 * returns `EMPTY_CONDITIONS` (a 200 with every field null, per spec §7).
 */
export async function readConditions(now: Date, deps: ConditionsDeps = defaultConditionsDeps()): Promise<Conditions> {
  let observedAt: Conditions['observedAt'] = null;
  let wind: Conditions['wind'] = null;
  let tempF: Conditions['tempF'] = null;
  let heat: Conditions['heat'] = null;
  let wet: Conditions['wet'] = null;

  try {
    const text = await loadText(deps, awcUrl(3), 300);
    const m = metarNow(text);
    if (m) {
      observedAt = m.observedAt;
      // No wind speed in the row is no wind line, never a "WIND 0" the station didn't report.
      wind = m.mph == null ? null : { mph: m.mph, gustMph: m.gustMph, dir: m.dir, words: windWords(m.mph) };
      tempF = m.tempF;
      heat = heatWords(m.tempF);
      wet = wetWords(m.wet);
    }
  } catch {
    // METAR down: wind, temp, heat and wet stay null. Nothing else depends on this try.
  }

  let marine: Conditions['marine'] = null;
  try {
    const marineDeps: MarineDeps = { fetch: deps.fetch, now, cached: deps.cached };
    const { verdict } = await answerMarine({ date: null }, marineDeps);
    const openedAt = verdict.state === 'opened' && verdict.openedAtMinute != null
      ? localInstantAt(localDateOf(now), verdict.openedAtMinute).toISOString()
      : null;
    marine = { label: marineLabel(verdict), openedAt };
  } catch {
    // The marine oracle failed on its own terms (a bad upstream shape, a rate limit): no marine line.
  }

  const sunset: Conditions['sunset'] = sunsetAt(now);

  let next3h: Conditions['next3h'] = null;
  try {
    next3h = await withTimeout(2500, async (signal) => {
      const headers = { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' };
      const text = await loadText(deps, NWS_GRIDPOINT_URL, 600, { headers, signal });
      const periods = JSON.parse(text)?.properties?.periods;
      return nwsNext3h(periods);
    });
  } catch {
    // NWS down, slow, or an unexpected shape: next3h stays null. The response is still 200.
    next3h = null;
  }

  return { observedAt, wind, tempF, heat, wet, marine, sunset, next3h };
}
