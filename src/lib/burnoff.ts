/**
 * burnoff — the rule for deciding when the sky opened.
 *
 * Page: /marine-layer · JSON: /marine-layer.json
 *
 * This file is the argument. Everything else on /marine-layer is presentation.
 * The record in burnoff-record.json says only what was over KLAX hour by hour;
 * it does not say when the morning ended. That judgement is made here, at read
 * time, every time the page loads, from the date and the observations. Nothing
 * is ever written down as a status, because a status written down at sunrise
 * needs something to write it, and this site has no cron and never will.
 *
 * The argument, in one paragraph:
 *
 *   You are under the layer when there is a broken or overcast deck — or an
 *   indefinite ceiling, which is fog sitting on the ground — below three
 *   thousand feet. Few and scattered do not count; you can see sky through
 *   them and the light is already changing. The sky opened at the first hourly
 *   report after sunrise with no such deck, provided every report in the
 *   following two hours is also free of it. That last clause is the whole
 *   craft: real mornings are not monotonic. June the tenth goes FEW900 to
 *   SCT1200 to FEW1500 to CLR, and a naive first-crossing rule fires and
 *   unfires three times before breakfast.
 *
 * Three honest outcomes, because two would be a lie: it opened at a time, it
 * never opened, or there was nothing over you to begin with. A fourth,
 * 'no-record', exists only for days the station did not report enough hours to
 * judge. We would rather leave a gap in the chart than invent a morning.
 */

import { sunTimes } from './sky';

// ────────────── the constants you are allowed to argue with ──────────────

/** El Segundo, for sunrise. The observations come from KLAX, 4.7 km north. */
export const EL_SEGUNDO = { lat: 33.9192, lon: -118.4165 } as const;

export const LOCAL_TIMEZONE = 'America/Los_Angeles';

/** A deck above this is weather, not the marine layer. Feet above ground. */
export const DECK_CEILING_FT = 3000;

/** How long the sky has to stay open before we believe it. */
export const HOLD_MINUTES = 120;

/** How far either side of sunrise we look to decide there was a layer at all. */
export const DAWN_LOOKBACK_MINUTES = 60;
export const DAWN_LOOKAHEAD_MINUTES = 90;

/** After this we stop watching. Minutes after local midnight. */
export const MORNING_END_MINUTE = 14 * 60;

/** Fewer hourly reports than this in the morning and we decline to judge. */
export const MINIMUM_OBSERVATIONS = 5;

/**
 * One hourly report: minutes after local midnight, and the lowest broken /
 * overcast / indefinite ceiling in feet — or null when the station reported no
 * such layer at any height.
 */
export type Observation = [minute: number, ceilingFt: number | null];

export type BurnOffState = 'opened' | 'never' | 'no-layer' | 'no-record';

export interface BurnOff {
  state: BurnOffState;
  /** Minutes after local midnight, or null unless the state is 'opened'. */
  openedAtMinute: number | null;
  sunriseMinute: number;
  /** The lowest deck seen around dawn — how heavy the morning was. */
  lowestCeilingFt: number | null;
  observationCount: number;
  /** Last hourly report we had inside the morning window. */
  lastObservedMinute: number | null;
}

export interface BurnOffDay extends BurnOff {
  date: string;
}

/** A raw day out of burnoff-record.json. */
export interface RecordDay {
  date: string;
  obs: Observation[];
}

export interface BurnOffRecord {
  station: string;
  stationName: string;
  stationNote: string;
  source: string;
  timezone: string;
  deckCovers: string[];
  windowStartMinute: number;
  windowEndMinute: number;
  units: string;
  fetchedAt: string;
  firstDate: string | null;
  lastDate: string | null;
  dayCount: number;
  days: RecordDay[];
}

// ────────────── the rule ──────────────

/** Broken, overcast, or fog on the ground, low enough to be the marine layer. */
export function isUnderTheLayer(ceilingFt: number | null): boolean {
  return ceilingFt !== null && ceilingFt < DECK_CEILING_FT;
}

/**
 * The whole judgement, from one day of hourly reports and one sunrise.
 *
 * Pure. No clock, no network, no date parsing. Feed it the same numbers and it
 * gives you the same answer in November that it gave you in June.
 */
export function resolveBurnOff(observations: Observation[], sunriseMinute: number): BurnOff {
  const morning = observations
    .filter(([minute]) => minute >= sunriseMinute - DAWN_LOOKBACK_MINUTES && minute <= MORNING_END_MINUTE)
    .slice()
    .sort((a, b) => a[0] - b[0]);

  const lastObservedMinute = morning.length ? morning[morning.length - 1][0] : null;

  const dawn = morning.filter(([minute]) => minute <= sunriseMinute + DAWN_LOOKAHEAD_MINUTES);
  const lowestCeilingFt = dawn.reduce<number | null>((lowest, [, ceiling]) => {
    if (ceiling === null) return lowest;
    return lowest === null || ceiling < lowest ? ceiling : lowest;
  }, null);

  const base: BurnOff = {
    state: 'no-record',
    openedAtMinute: null,
    sunriseMinute,
    lowestCeilingFt,
    observationCount: morning.length,
    lastObservedMinute,
  };

  // The station went quiet. Say so; do not guess.
  if (morning.length < MINIMUM_OBSERVATIONS) return base;

  // Nothing over you at dawn. Not every morning is a fog morning, and pretending
  // otherwise is how a chart starts flattering itself.
  if (!dawn.some(([, ceiling]) => isUnderTheLayer(ceiling))) {
    return { ...base, state: 'no-layer' };
  }

  const afterSunrise = morning.filter(([minute]) => minute >= sunriseMinute);

  for (let i = 0; i < afterSunrise.length; i += 1) {
    const [minute, ceiling] = afterSunrise[i];
    if (isUnderTheLayer(ceiling)) continue;

    // A candidate opening. Now make it hold.
    const held = afterSunrise.slice(i + 1).filter(([later]) => later <= minute + HOLD_MINUTES);
    if (held.length === 0) break; // Cleared with nothing left to watch it with.
    if (held.every(([, laterCeiling]) => !isUnderTheLayer(laterCeiling))) {
      return { ...base, state: 'opened', openedAtMinute: minute };
    }
  }

  return { ...base, state: 'never' };
}

// ────────────── sunrise ──────────────

/** Minutes after local midnight in El Segundo for a UTC instant. */
export function localMinutesOf(instant: Date, timeZone: string = LOCAL_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '6');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return (hour % 24) * 60 + minute;
}

/**
 * Sunrise for a local calendar date, as minutes after local midnight.
 *
 * sunTimes() anchors to the UTC midnight of the date it is handed. At 118° west
 * the local morning and the UTC date agree, so passing UTC midnight of the local
 * date returns that local date's sunrise.
 */
export function sunriseMinuteFor(dateISO: string): number {
  const [year, month, day] = dateISO.split('-').map(Number);
  const { sunrise } = sunTimes(new Date(Date.UTC(year, month - 1, day)), EL_SEGUNDO.lat, EL_SEGUNDO.lon);
  if (!sunrise) return 6 * 60;
  return localMinutesOf(sunrise);
}

/** Resolve one recorded day end to end. */
export function resolveDay(day: RecordDay): BurnOffDay {
  return { date: day.date, ...resolveBurnOff(day.obs, sunriseMinuteFor(day.date)) };
}

/** Resolve a whole season, oldest first. */
export function resolveSeason(days: RecordDay[]): BurnOffDay[] {
  return days.map(resolveDay);
}

// ────────────── reading the result out loud ──────────────

export function formatClock(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = Math.round(minutes % 60);
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/**
 * "saturday 25 july" — anchored at noon UTC and formatted in UTC so the server
 * and the browser always agree on which day they are naming.
 */
export function longDate(dateISO: string): string {
  const at = new Date(`${dateISO}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(at)
    .toLowerCase()
    .replace(',', '');
}

/** "the sky opened at 10:53 am." — one sentence, no hedging, no marketing. */
export function sentenceFor(day: BurnOffDay): string {
  switch (day.state) {
    case 'opened':
      return `the sky opened at ${formatClock(day.openedAtMinute as number)}.`;
    case 'never':
      return 'the sky did not open. it was grey past two in the afternoon.';
    case 'no-layer':
      return 'there was no layer. the morning started open and stayed that way.';
    default:
      return 'the station did not report enough of the morning to say.';
  }
}

export const STATE_LABEL: Record<BurnOffState, string> = {
  opened: 'opened',
  never: 'never opened',
  'no-layer': 'no layer',
  'no-record': 'no record',
};

// ────────────── the season, summarised ──────────────

export interface MonthSummary {
  /** "2026-06" */
  month: string;
  label: string;
  days: number;
  opened: number;
  never: number;
  noLayer: number;
  /** Median opening time in minutes, across days that opened. */
  medianOpenMinute: number | null;
  /** Share of days that started under a deck. */
  layerShare: number;
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function summariseByMonth(season: BurnOffDay[]): MonthSummary[] {
  const buckets = new Map<string, BurnOffDay[]>();
  for (const day of season) {
    const key = day.date.slice(0, 7);
    const list = buckets.get(key) ?? [];
    list.push(day);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, days]) => {
      const judged = days.filter((d) => d.state !== 'no-record');
      const opened = judged.filter((d) => d.state === 'opened');
      const never = judged.filter((d) => d.state === 'never');
      const noLayer = judged.filter((d) => d.state === 'no-layer');
      const monthIndex = Number(month.slice(5, 7)) - 1;
      return {
        month,
        label: `${MONTH_NAMES[monthIndex]} ${month.slice(0, 4)}`,
        days: judged.length,
        opened: opened.length,
        never: never.length,
        noLayer: noLayer.length,
        medianOpenMinute: median(opened.map((d) => d.openedAtMinute as number)),
        layerShare: judged.length ? (opened.length + never.length) / judged.length : 0,
      };
    });
}

/** The most recent day the record can actually judge. */
export function latestJudged(season: BurnOffDay[]): BurnOffDay | null {
  for (let i = season.length - 1; i >= 0; i -= 1) {
    if (season[i].state !== 'no-record') return season[i];
  }
  return null;
}

// ────────────── the live edge ──────────────

/**
 * The URL the browser hits on load for the last few days, so the number at the
 * top of the page stays true between manual deploys. Same archive, same
 * station, same columns as scripts/fetch-burnoff.mjs. Mesonet serves
 * Access-Control-Allow-Origin: *, which is why this needs no endpoint of ours.
 */
export function mesonetUrl(startISO: string, endISO: string, station = 'LAX'): string {
  const [y1, m1, d1] = startISO.split('-');
  const [y2, m2, d2] = endISO.split('-');
  const data = ['skyc1', 'skyc2', 'skyc3', 'skyc4', 'skyl1', 'skyl2', 'skyl3', 'skyl4']
    .map((d) => `data=${d}`)
    .join('&');
  const params = new URLSearchParams({
    station,
    year1: String(Number(y1)), month1: String(Number(m1)), day1: String(Number(d1)),
    year2: String(Number(y2)), month2: String(Number(m2)), day2: String(Number(d2)),
    tz: LOCAL_TIMEZONE,
    format: 'onlycomma',
    latlon: 'no',
    report_type: '3',
  });
  return `https://mesonet.agron.iastate.edu/cgi-bin/request/asos.py?${data}&${params.toString()}`;
}

/** Covers that make a ceiling. Mirrors scripts/fetch-burnoff.mjs exactly. */
export const DECK_COVERS = ['BKN', 'OVC', 'VV'];

/**
 * Parse the archive's CSV into the same day shape the committed record uses,
 * so the live edge and the backfill are read by identical code.
 */
export function parseMesonetCsv(csv: string): RecordDay[] {
  const lines = csv.trim().split('\n');
  const header = lines.shift();
  if (!header || !header.startsWith('station,valid')) return [];

  const byDate = new Map<string, Observation[]>();
  for (const line of lines) {
    const cols = line.split(',');
    if (cols.length < 10) continue;
    const [datePart, timePart] = (cols[1] ?? '').trim().split(' ');
    if (!datePart || !timePart) continue;
    const [hh, mm] = timePart.split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue;
    const minute = hh * 60 + mm;
    if (minute < 4 * 60 || minute > MORNING_END_MINUTE) continue;

    let lowest: number | null = null;
    for (let i = 0; i < 4; i += 1) {
      const cover = (cols[2 + i] ?? '').trim().toUpperCase();
      if (!DECK_COVERS.includes(cover)) continue;
      const feet = Number.parseFloat(cols[6 + i] ?? '');
      if (!Number.isFinite(feet)) continue;
      if (lowest === null || feet < lowest) lowest = feet;
    }

    const list = byDate.get(datePart) ?? [];
    if (!list.some(([m]) => Math.floor(m / 60) === hh)) {
      list.push([minute, lowest === null ? null : Math.round(lowest)]);
    }
    byDate.set(datePart, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, obs]) => ({ date, obs: obs.sort((a, b) => a[0] - b[0]) }));
}

/** The definition, in words, printed next to the chart so you can argue with it. */
export const BURN_OFF_DEFINITION = [
  `Under the layer means a broken or overcast deck — or an indefinite ceiling, which is fog on the ground — below ${DECK_CEILING_FT.toLocaleString()} feet. Few and scattered do not count. You can see sky through them.`,
  'The lowest deck is often reported in the second or third layer, not the first, so each cover is paired with its own height by index and the lowest one wins.',
  `The sky opened at the first hourly report after sunrise with no such deck, where every report in the following ${HOLD_MINUTES / 60} hours is also free of it.`,
  'A day with no deck anywhere around sunrise has no layer to burn off. It is not a fast morning. It is a different kind of morning.',
  'If the sky clears in the last hour we watch and nothing follows to confirm it, the day reads as never opened. We do not claim what we could not watch.',
];
