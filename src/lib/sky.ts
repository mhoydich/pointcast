/**
 * sky — pure astronomical math for the Collab Clock planetary drawer.
 *
 * Everything in this module is deterministic from (date, lat, lon) + tz
 * for the planetary hour. No network calls, no APIs. Safe to run on the
 * server during prerender OR in the browser each tick.
 *
 * Algorithms distilled from Jean Meeus "Astronomical Algorithms" (Ch. 15
 * sun times, Ch. 48 moon phase) and NOAA's Solar Calculator spreadsheet
 * formulas. Accuracy goal: ±1 minute on sunrise/sunset for mid-latitude
 * cities, ±1% on moon illumination. Verified against suncalc.net and
 * timeanddate.com for El Segundo + Istanbul + Tokyo on multiple dates.
 */

// ────────────── helpers ──────────────

const MS_PER_DAY = 86_400_000;
const J2000 = 2451545.0;

function rad(deg: number): number { return deg * Math.PI / 180; }
function deg(rad: number): number { return rad * 180 / Math.PI; }

/** Julian Day number for a given Date (UTC). */
function julianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + 2440587.5;
}

/** UTC midnight of the calendar day containing `date`. */
function utcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// ────────────── moon phase ──────────────

export type MoonPhaseName =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export interface MoonPhase {
  /** Days since the most recent new moon (0 to ~29.53). */
  age: number;
  /** 0 at new, 1 at full. */
  illumination: number;
  /** Named phase bucket. */
  phase: MoonPhaseName;
  /** Single emoji glyph. */
  glyph: string;
  /** Human label. */
  label: string;
  /** Date of the next full moon. */
  nextFullAt: Date;
  /** Date of the next new moon. */
  nextNewAt: Date;
}

/** Synodic month — mean length of one lunar phase cycle. */
const MOON_SYNODIC = 29.530588853;
/** Reference new moon: 2000-01-06 18:14 UTC ≈ JD 2451549.26 */
const MOON_REF_NEW = 2451549.26;

export function moonPhase(now: Date = new Date()): MoonPhase {
  const jd = julianDay(now);
  // Positive modulo to handle dates before the reference new moon.
  const rawAge = (jd - MOON_REF_NEW) % MOON_SYNODIC;
  const age = (rawAge + MOON_SYNODIC) % MOON_SYNODIC;
  // Cosine illumination model — 0 at new, 1 at full.
  const illumination = (1 - Math.cos((2 * Math.PI * age) / MOON_SYNODIC)) / 2;

  // 8 phase buckets of equal duration, centered on the key moments.
  // new → waxing crescent → first quarter → waxing gibbous → full → ...
  const seg = MOON_SYNODIC / 8;
  let phase: MoonPhaseName;
  let glyph: string;
  let label: string;
  if (age < seg * 0.5 || age >= MOON_SYNODIC - seg * 0.5) { phase = 'new';              glyph = '🌑'; label = 'new moon'; }
  else if (age < seg * 1.5)                                { phase = 'waxing-crescent';  glyph = '🌒'; label = 'waxing crescent'; }
  else if (age < seg * 2.5)                                { phase = 'first-quarter';    glyph = '🌓'; label = 'first quarter'; }
  else if (age < seg * 3.5)                                { phase = 'waxing-gibbous';   glyph = '🌔'; label = 'waxing gibbous'; }
  else if (age < seg * 4.5)                                { phase = 'full';             glyph = '🌕'; label = 'full moon'; }
  else if (age < seg * 5.5)                                { phase = 'waning-gibbous';   glyph = '🌖'; label = 'waning gibbous'; }
  else if (age < seg * 6.5)                                { phase = 'last-quarter';     glyph = '🌗'; label = 'last quarter'; }
  else                                                     { phase = 'waning-crescent';  glyph = '🌘'; label = 'waning crescent'; }

  const daysToFull = ((MOON_SYNODIC / 2) - age + MOON_SYNODIC) % MOON_SYNODIC;
  const daysToNew = (MOON_SYNODIC - age) % MOON_SYNODIC;
  const nextFullAt = new Date(now.getTime() + daysToFull * MS_PER_DAY);
  const nextNewAt = new Date(now.getTime() + daysToNew * MS_PER_DAY);

  return { age, illumination, phase, glyph, label, nextFullAt, nextNewAt };
}

// ────────────── sun times ──────────────

export interface SunTimes {
  /** Local sunrise moment in UTC. null at polar night. */
  sunrise: Date | null;
  /** Local sunset moment in UTC. null at polar night. */
  sunset: Date | null;
  /** Solar noon for the location. */
  solarNoon: Date;
  /** Sunrise-to-sunset length in ms (0 at polar night, 86_400_000 at polar day). */
  dayLengthMs: number;
  /** Sun altitude right now, degrees above horizon (negative = below). */
  altitudeDeg: number;
  /** True if the sun is currently above the horizon. */
  isDay: boolean;
}

/**
 * Compute sunrise/sunset/solar-noon for a given UTC date at (lat, lon).
 * `now` is the "current moment" for altitude; defaults to `date`.
 *
 * Uses the NOAA spreadsheet formulas — good to ~1 min for latitudes < 65°.
 */
export function sunTimes(
  date: Date,
  lat: number,
  lon: number,
  now: Date = date,
): SunTimes {
  // Julian century since J2000, anchored to local noon of the target UTC date.
  // Anchoring to a stable point within the day (not `date.getTime()`) means
  // repeated calls on the same date return identical sunrise/sunset values.
  const utc0Ms = utcMidnight(date);
  const jdLocalNoon = utc0Ms / MS_PER_DAY + 2440587.5 + 0.5 - lon / 360;
  const T = (jdLocalNoon - J2000) / 36525;

  const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const C =
    Math.sin(rad(M)) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * T) +
    Math.sin(rad(3 * M)) * 0.000289;

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));

  const seconds = 21.448 - T * (46.8150 + T * (0.00059 - T * 0.001813));
  const mEpsilon = 23 + (26 + seconds / 60) / 60;
  const epsilon = mEpsilon + 0.00256 * Math.cos(rad(omega));

  const decl = deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(appLong))));

  const y = Math.tan(rad(epsilon / 2)) ** 2;
  const eqTime =
    4 *
    deg(
      y * Math.sin(2 * rad(L0)) -
        2 * e * Math.sin(rad(M)) +
        4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) -
        0.5 * y * y * Math.sin(4 * rad(L0)) -
        1.25 * e * e * Math.sin(2 * rad(M)),
    );

  // Hour angle at sunrise/sunset using -0.833° (refraction + half disk).
  const cosHA =
    (Math.cos(rad(90.833)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) /
    (Math.cos(rad(lat)) * Math.cos(rad(decl)));

  const solarNoonMin = 720 - 4 * lon - eqTime;
  const solarNoon = new Date(utc0Ms + solarNoonMin * 60_000);

  let sunrise: Date | null = null;
  let sunset: Date | null = null;
  let dayLengthMs: number;
  if (cosHA > 1) {
    // Sun never rises (polar night).
    dayLengthMs = 0;
  } else if (cosHA < -1) {
    // Sun never sets (polar day).
    dayLengthMs = MS_PER_DAY;
  } else {
    const haMin = 4 * deg(Math.acos(cosHA));
    sunrise = new Date(utc0Ms + (solarNoonMin - haMin) * 60_000);
    sunset = new Date(utc0Ms + (solarNoonMin + haMin) * 60_000);
    dayLengthMs = sunset.getTime() - sunrise.getTime();
  }

  // Sun altitude at `now`. Hour angle in degrees from solar noon.
  const nowMin = (now.getTime() - utc0Ms) / 60_000;
  const haNow = (nowMin - solarNoonMin) / 4;
  const altitudeDeg = deg(
    Math.asin(
      Math.sin(rad(lat)) * Math.sin(rad(decl)) +
        Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(haNow)),
    ),
  );

  const isDay = altitudeDeg > -0.833;

  return { sunrise, sunset, solarNoon, dayLengthMs, altitudeDeg, isDay };
}

// ────────────── planetary hour ──────────────

export type Planet = 'Saturn' | 'Jupiter' | 'Mars' | 'Sun' | 'Venus' | 'Mercury' | 'Moon';

export interface PlanetaryHour {
  planet: Planet;
  glyph: string;
  /** 1–12 within its half (day or night). */
  index: number;
  phase: 'day' | 'night';
  /** Length of this hour in ms (daylight-hours ≠ 60min; they scale with day length). */
  hourLengthMs: number;
  /** Moment this hour began and ends. */
  startsAt: Date;
  endsAt: Date;
}

/** Chaldean order, slowest to fastest — the traditional planetary sequence. */
const CHALDEAN: Planet[] = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
/** Day-of-week ruler. Index 0 = Sunday. */
const DAY_RULER: Planet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
export const PLANET_GLYPH: Record<Planet, string> = {
  Saturn: '♄',
  Jupiter: '♃',
  Mars: '♂',
  Sun: '☉',
  Venus: '♀',
  Mercury: '☿',
  Moon: '☽',
};

/** Day-of-week (0=Sun…6=Sat) evaluated in the given IANA timezone. */
function localDayOfWeek(date: Date, tz: string): number {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(date);
  // "Sun" / "Mon" / ...
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[name] ?? 0;
}

/** Return a Date N days earlier than `d`. */
function daysBefore(d: Date, n: number): Date {
  return new Date(d.getTime() - n * MS_PER_DAY);
}

/**
 * Current planetary hour for (lat, lon, tz) at `now`.
 * Handles the day/night boundary: after sunset, hours run off yesterday's
 * day-ruler until the next sunrise.
 */
export function planetaryHour(
  now: Date,
  lat: number,
  lon: number,
  tz: string,
): PlanetaryHour | null {
  const today = sunTimes(now, lat, lon, now);
  const t = now.getTime();

  // Determine which daylight window we're tracking:
  //  - if now is between today's sunrise and today's sunset → daytime
  //  - if now is after today's sunset but before tomorrow's sunrise → tonight (day-ruler = today)
  //  - if now is before today's sunrise → early this morning (day-ruler = yesterday)
  let phase: 'day' | 'night';
  let blockStart: Date;
  let blockEnd: Date;
  let rulerDay: Date; // the civil date whose day-ruler starts this cycle

  if (today.sunrise && today.sunset && t >= today.sunrise.getTime() && t < today.sunset.getTime()) {
    phase = 'day';
    blockStart = today.sunrise;
    blockEnd = today.sunset;
    rulerDay = today.sunrise;
  } else if (today.sunset && t >= today.sunset.getTime()) {
    phase = 'night';
    blockStart = today.sunset;
    const tomorrow = sunTimes(new Date(now.getTime() + MS_PER_DAY), lat, lon);
    if (!tomorrow.sunrise) return null;
    blockEnd = tomorrow.sunrise;
    rulerDay = today.sunset;
  } else {
    // Before today's sunrise — part of last night
    phase = 'night';
    const yesterday = sunTimes(new Date(now.getTime() - MS_PER_DAY), lat, lon);
    if (!yesterday.sunset || !today.sunrise) return null;
    blockStart = yesterday.sunset;
    blockEnd = today.sunrise;
    rulerDay = yesterday.sunset;
  }

  const totalMs = blockEnd.getTime() - blockStart.getTime();
  if (totalMs <= 0) return null;
  const hourLengthMs = totalMs / 12;
  const index = Math.min(12, Math.floor((t - blockStart.getTime()) / hourLengthMs) + 1);

  // Which day-of-week is this block's "owner"? Use LOCAL civil day of rulerDay.
  const dow = localDayOfWeek(rulerDay, tz);
  const rulerPlanet = DAY_RULER[dow];

  // Day hour 1 = rulerPlanet. Each subsequent hour advances one step in Chaldean.
  // Night hour 1 continues the sequence (12 steps past day hour 1).
  const rulerIdx = CHALDEAN.indexOf(rulerPlanet);
  const advance = phase === 'day' ? index - 1 : index - 1 + 12;
  const planet = CHALDEAN[(rulerIdx + advance) % 7];

  const startsAt = new Date(blockStart.getTime() + (index - 1) * hourLengthMs);
  const endsAt = new Date(blockStart.getTime() + index * hourLengthMs);

  return {
    planet,
    glyph: PLANET_GLYPH[planet],
    index,
    phase,
    hourLengthMs,
    startsAt,
    endsAt,
  };
}

// ────────────── season ──────────────

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Season {
  name: SeasonName;
  glyph: string;
  dayOfSeason: number;        // 1-indexed
  lengthDays: number;
  hemisphere: 'N' | 'S';
}

const SEASON_GLYPH: Record<SeasonName, string> = {
  spring: '🌱',
  summer: '🌻',
  autumn: '🍂',
  winter: '❄️',
};

/** Approximate northern-hemisphere season boundaries (same every year
 *  within ±1 day — good enough for the day-of-season counter). */
function seasonBoundaries(year: number): Array<{ at: Date; nameN: SeasonName }> {
  return [
    { at: new Date(Date.UTC(year - 1, 11, 21)), nameN: 'winter' },
    { at: new Date(Date.UTC(year,     2, 20)),  nameN: 'spring' },
    { at: new Date(Date.UTC(year,     5, 21)),  nameN: 'summer' },
    { at: new Date(Date.UTC(year,     8, 22)),  nameN: 'autumn' },
    { at: new Date(Date.UTC(year,    11, 21)),  nameN: 'winter' },
    { at: new Date(Date.UTC(year + 1, 2, 20)),  nameN: 'spring' },
  ];
}

const SOUTH_FLIP: Record<SeasonName, SeasonName> = {
  spring: 'autumn',
  summer: 'winter',
  autumn: 'spring',
  winter: 'summer',
};

export function season(now: Date, lat: number): Season {
  const hemisphere: 'N' | 'S' = lat >= 0 ? 'N' : 'S';
  const y = now.getUTCFullYear();
  const t = now.getTime();
  const bounds = seasonBoundaries(y);

  let current = bounds[0];
  let next = bounds[1];
  for (let i = 0; i < bounds.length - 1; i++) {
    if (t >= bounds[i].at.getTime() && t < bounds[i + 1].at.getTime()) {
      current = bounds[i];
      next = bounds[i + 1];
      break;
    }
  }

  const nameN = current.nameN;
  const name = hemisphere === 'N' ? nameN : SOUTH_FLIP[nameN];
  const lengthDays = Math.round((next.at.getTime() - current.at.getTime()) / MS_PER_DAY);
  const dayOfSeason = Math.floor((t - current.at.getTime()) / MS_PER_DAY) + 1;

  return { name, glyph: SEASON_GLYPH[name], dayOfSeason, lengthDays, hemisphere };
}

// ────────────── next equinox / solstice ──────────────

export type MarkerName =
  | 'vernal-equinox'
  | 'summer-solstice'
  | 'autumnal-equinox'
  | 'winter-solstice';

export interface NextMarker {
  name: MarkerName;
  at: Date;
  daysUntil: number;
  /** Human label ("summer solstice"). */
  label: string;
}

const MARKER_LABEL: Record<MarkerName, string> = {
  'vernal-equinox': 'vernal equinox',
  'summer-solstice': 'summer solstice',
  'autumnal-equinox': 'autumnal equinox',
  'winter-solstice': 'winter solstice',
};

export function nextEquinoxOrSolstice(now: Date = new Date()): NextMarker {
  const y = now.getUTCFullYear();
  const t = now.getTime();
  const markers: Array<{ name: MarkerName; at: Date }> = [
    { name: 'vernal-equinox',   at: new Date(Date.UTC(y,     2, 20)) },
    { name: 'summer-solstice',  at: new Date(Date.UTC(y,     5, 21)) },
    { name: 'autumnal-equinox', at: new Date(Date.UTC(y,     8, 22)) },
    { name: 'winter-solstice',  at: new Date(Date.UTC(y,    11, 21)) },
    { name: 'vernal-equinox',   at: new Date(Date.UTC(y + 1, 2, 20)) },
  ];
  const next = markers.find((m) => m.at.getTime() > t) ?? markers[markers.length - 1];
  const daysUntil = Math.ceil((next.at.getTime() - t) / MS_PER_DAY);
  return { name: next.name, at: next.at, daysUntil, label: MARKER_LABEL[next.name] };
}

// ────────────── zodiac (tropical) ──────────────

export interface ZodiacSign {
  name: string;
  glyph: string;
  dayInSign: number;      // 1-indexed
}

const ZODIAC: Array<{ name: string; glyph: string; startMonth: number; startDay: number }> = [
  { name: 'Capricorn',   glyph: '♑', startMonth: 12, startDay: 22 },
  { name: 'Aquarius',    glyph: '♒', startMonth: 1,  startDay: 20 },
  { name: 'Pisces',      glyph: '♓', startMonth: 2,  startDay: 19 },
  { name: 'Aries',       glyph: '♈', startMonth: 3,  startDay: 21 },
  { name: 'Taurus',      glyph: '♉', startMonth: 4,  startDay: 20 },
  { name: 'Gemini',      glyph: '♊', startMonth: 5,  startDay: 21 },
  { name: 'Cancer',      glyph: '♋', startMonth: 6,  startDay: 21 },
  { name: 'Leo',         glyph: '♌', startMonth: 7,  startDay: 23 },
  { name: 'Virgo',       glyph: '♍', startMonth: 8,  startDay: 23 },
  { name: 'Libra',       glyph: '♎', startMonth: 9,  startDay: 23 },
  { name: 'Scorpio',     glyph: '♏', startMonth: 10, startDay: 23 },
  { name: 'Sagittarius', glyph: '♐', startMonth: 11, startDay: 22 },
];

export function zodiacOfDate(now: Date = new Date()): ZodiacSign {
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  // Find the sign whose start is the most-recent ≤ (m, d)
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const s = ZODIAC[i];
    if (s.startMonth < m || (s.startMonth === m && s.startDay <= d)) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), s.startMonth - 1, s.startDay));
      const dayInSign = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY) + 1;
      return { name: s.name, glyph: s.glyph, dayInSign };
    }
  }
  // Before Jan 20 → Capricorn from last year's Dec 22
  const cap = ZODIAC[0];
  const start = new Date(Date.UTC(now.getUTCFullYear() - 1, cap.startMonth - 1, cap.startDay));
  const dayInSign = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return { name: cap.name, glyph: cap.glyph, dayInSign };
}
