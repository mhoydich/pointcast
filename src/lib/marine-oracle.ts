// The Marine Layer Oracle — did the sky over El Segundo open, and when?
//
// Same rule as /marine-layer (src/lib/burnoff.ts), applied at request time to
// live KLAX observations: NOAA's Aviation Weather Center for the last few days,
// Iowa State's ASOS archive for anything older. The answer carries the hourly
// reports it was judged from, the rule in words, and the source URLs, so an
// agent can check it or settle on it.
//
// Honesty rules:
//   - An upstream that returns anything but its documented shape is an outage,
//     not an empty morning. (Iowa State answers rate limits with HTTP 200 and a
//     plain-text sentence; parsed naively that reads as "no record".)
//   - `final` is true only when no later report can change the verdict.

import {
  BURN_OFF_DEFINITION,
  DECK_CEILING_FT,
  EL_SEGUNDO,
  formatClock,
  isUnderTheLayer,
  LOCAL_TIMEZONE,
  localMinutesOf,
  MORNING_END_MINUTE,
  mesonetUrl,
  parseMesonetCsv,
  resolveBurnOff,
  sentenceFor,
  STATE_LABEL,
  sunriseMinuteFor,
  type BurnOffState,
  type Observation,
} from './burnoff';

export const MARINE_ROOM = 'https://pointcast.xyz/marine-layer';
export const AWC_WINDOW_DAYS = 6;
/** Reports post a few minutes after :53; wait an hour past the window before calling a day final. */
export const INGEST_LAG_MINUTES = 60;

export interface MarineQuery { date: string | null }

export class MarineSourceError extends Error {}

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export interface MarineDeps {
  fetch: FetchLike;
  now: Date;
  /** Optional cache wrapper (Cloudflare Cache API in production). */
  cached?: (url: string, ttlSeconds: number, load: () => Promise<string>) => Promise<string>;
}

/** Local calendar date in El Segundo for an instant. */
export function localDateOf(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function parseMarineQuery(input: unknown, now: Date = new Date()): MarineQuery | string {
  if (input === undefined || input === null) return { date: null };
  if (typeof input !== 'object' || Array.isArray(input)) return 'body must be a JSON object';
  const b = input as Record<string, unknown>;
  const extra = Object.keys(b).filter((k) => k !== 'date');
  if (extra.length) return `unknown field: ${extra[0]} (this oracle takes only "date")`;
  if (b.date === undefined || b.date === null || b.date === '' || b.date === 'today') return { date: null };
  if (typeof b.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return 'date must be YYYY-MM-DD (El Segundo local), or omitted for today';
  const t = Date.parse(`${b.date}T12:00:00Z`);
  if (!Number.isFinite(t) || new Date(t).toISOString().slice(0, 10) !== b.date) return 'date is not a real calendar day';
  if (b.date < '2000-01-01') return 'date must be 2000-01-01 or later';
  if (b.date > localDateOf(now)) return 'that morning has not happened yet in El Segundo';
  return { date: b.date };
}

export const marineBodyFromParams = (p: URLSearchParams): Record<string, unknown> =>
  (p.has('date') ? { date: p.get('date') } : {});

const addDays = (dateISO: string, days: number) => new Date(Date.parse(`${dateISO}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export const awcUrl = (hours: number) => `https://aviationweather.gov/api/data/metar?ids=KLAX&format=json&hours=${hours}`;

interface AwcMetar { metarType?: string; obsTime?: number; rawOb?: string; clouds?: { cover?: string; base?: number | null }[]; vertVis?: number | null }

/** Lowest broken / overcast / obscured ceiling in feet, or null. VV/OVX use vertical visibility. */
export function ceilingOf(m: AwcMetar): number | null {
  let lowest: number | null = null;
  for (const c of m.clouds ?? []) {
    const cover = String(c.cover ?? '').toUpperCase();
    if (!['BKN', 'OVC', 'OVX', 'VV'].includes(cover)) continue;
    const base = cover === 'OVX' || cover === 'VV' ? (m.vertVis != null ? m.vertVis * 100 : c.base) : c.base;
    if (typeof base !== 'number') continue;
    if (lowest === null || base < lowest) lowest = base;
  }
  return lowest;
}

function readAwc(text: string): AwcMetar[] {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new MarineSourceError('NOAA Aviation Weather returned something other than JSON'); }
  if (!Array.isArray(data)) throw new MarineSourceError('NOAA Aviation Weather returned an unexpected shape');
  return data as AwcMetar[];
}

/** AWC JSON → one routine report per local hour for `dateISO`, same window as the archive parser. */
export function parseAwc(text: string, dateISO: string): { obs: Observation[]; raw: Map<number, string> } {
  const obs: Observation[] = [];
  const raw = new Map<number, string>();
  for (const m of readAwc(text)) {
    if (m.metarType !== 'METAR' || typeof m.obsTime !== 'number') continue;
    const at = new Date(m.obsTime * 1000);
    if (localDateOf(at) !== dateISO) continue;
    const minute = localMinutesOf(at);
    if (minute < 4 * 60 || minute > MORNING_END_MINUTE) continue;
    if (obs.some(([mm]) => Math.floor(mm / 60) === Math.floor(minute / 60))) continue;
    obs.push([minute, ceilingOf(m)]);
    if (m.rawOb) raw.set(minute, m.rawOb);
  }
  obs.sort((a, b) => a[0] - b[0]);
  return { obs, raw };
}

/** Fetch, validate, and only then cache: a rate-limit page must never be cached as data. */
async function load(deps: MarineDeps, url: string, ttl: number, validate: (text: string) => void): Promise<string> {
  const get = async () => {
    const res = await deps.fetch(url);
    if (!res.ok) throw new MarineSourceError(`upstream answered HTTP ${res.status}`);
    const text = await res.text();
    validate(text);
    return text;
  };
  return deps.cached ? deps.cached(url, ttl, get) : get();
}

/** Latest report of any kind (routine or special), for "is the layer in right now". */
function latestFromAwc(text: string) {
  const latest = readAwc(text).filter((m) => typeof m.obsTime === 'number').sort((a, b) => b.obsTime! - a.obsTime!)[0];
  if (!latest) return null;
  const at = new Date(latest.obsTime! * 1000);
  const ceilingFt = ceilingOf(latest);
  return { observedAt: at.toISOString(), localTime: formatClock(localMinutesOf(at)), ceilingFt, underTheLayer: isUnderTheLayer(ceilingFt), raw: latest.rawOb ?? null };
}

export async function answerMarine(query: MarineQuery, deps: MarineDeps) {
  const today = localDateOf(deps.now);
  const date = query.date ?? today;
  const nowMinute = localMinutesOf(deps.now);
  const ageDays = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86_400_000);
  const isToday = date === today;

  let obs: Observation[];
  let raw = new Map<number, string>();
  let source: { name: string; url: string };
  let latest = null as ReturnType<typeof latestFromAwc>;
  if (ageDays <= AWC_WINDOW_DAYS) {
    const url = awcUrl(Math.min(24 * (ageDays + 2), 168));
    const text = await load(deps, url, isToday ? 300 : 3600, readAwc);
    ({ obs, raw } = parseAwc(text, date));
    if (isToday) latest = latestFromAwc(text);
    source = { name: 'NOAA Aviation Weather Center METAR API, station KLAX', url };
  } else {
    const url = mesonetUrl(date, addDays(date, 1));
    const text = await load(deps, url, 30 * 86_400, (t) => {
      if (!t.trimStart().startsWith('station,valid')) {
        throw new MarineSourceError(/too many requests/i.test(t) ? 'the Iowa State archive is rate-limiting; try again in a minute' : 'the Iowa State archive returned something other than its CSV');
      }
    });
    obs = parseMesonetCsv(text).find((d) => d.date === date)?.obs ?? [];
    source = { name: 'Iowa Environmental Mesonet ASOS archive, station LAX', url };
  }

  const sunrise = sunriseMinuteFor(date);
  const verdict = resolveBurnOff(obs, sunrise);
  const pastDawn = nowMinute >= sunrise + 90 + INGEST_LAG_MINUTES;
  const final = !isToday
    || verdict.state === 'opened'
    || (verdict.state === 'no-layer' && pastDawn)
    || nowMinute >= MORNING_END_MINUTE + INGEST_LAG_MINUTES;
  const state: BurnOffState | 'watching' = final ? verdict.state : 'watching';
  const sentence = final
    ? sentenceFor({ date, ...verdict })
    : latest?.underTheLayer
      ? `still under the layer at ${latest.localTime} (${latest.ceilingFt} ft). the morning is not over.`
      : 'the morning is not over; no verdict yet.';

  return {
    question: `Did the marine layer burn off over El Segundo on ${date}, and when?`,
    place: { name: 'El Segundo, California', ...EL_SEGUNDO },
    station: { id: 'KLAX', note: 'Los Angeles International ASOS, 4.7 km north of El Segundo. Routine hourly reports at :53.' },
    date,
    verdict: {
      state,
      final,
      label: state === 'watching' ? 'watching' : STATE_LABEL[state],
      sentence,
      openedAt: verdict.openedAtMinute != null ? formatClock(verdict.openedAtMinute) : null,
      openedAtMinute: verdict.openedAtMinute,
      lowestCeilingFt: verdict.lowestCeilingFt,
      sunrise: formatClock(sunrise),
      observationCount: verdict.observationCount,
    },
    now: latest,
    observations: obs.map(([minute, ceilingFt]) => ({
      localTime: formatClock(minute), minute, ceilingFt, underTheLayer: isUnderTheLayer(ceilingFt), raw: raw.get(minute) ?? null,
    })),
    rule: { deckCeilingFt: DECK_CEILING_FT, words: BURN_OFF_DEFINITION, code: 'https://github.com/mhoydich/pointcast/blob/main/src/lib/burnoff.ts' },
    sources: [source, { name: 'PointCast /marine-layer (same rule, a year of mornings)', url: MARINE_ROOM }],
  };
}

/** Free preview: is the layer in right now. Never the verdict or the reports. */
export async function previewMarine(deps: MarineDeps) {
  const latest = latestFromAwc(await load(deps, awcUrl(3), 300, readAwc));
  return { underTheLayerNow: latest?.underTheLayer ?? null, observedAt: latest?.observedAt ?? null };
}
