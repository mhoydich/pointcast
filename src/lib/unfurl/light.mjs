/**
 * El Segundo light — the time-of-day palette every generated unfurl wears.
 *
 * The same link shared at 6 AM and at 7 PM should not look identical: the
 * town is a broadcast, and the card is the broadcast's weather report. The
 * period name also rides in the card URL (`b=2026-09-23.blue`) so unfurl
 * caches, which key on the image URL, pick up the new light when it changes.
 */

const TZ = 'America/Los_Angeles';

/** Local El Segundo clock parts for a Date (defaults to now). */
export function laClock(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute,
    /** "7:42 AM" */
    label: `${((hour + 11) % 12) + 1}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
  };
}

/**
 * Eight lights a day. `sky` is the page field around the card, `sun` the disc,
 * `ink` the text that sits directly on the sky, `glow` a second sky stop.
 */
export const PERIODS = [
  { id: 'night',     from: 0,  name: 'Night shift',   sky: '#0E1430', glow: '#1D2656', sun: '#E9E4C9', ink: '#E9E4C9', moon: true },
  { id: 'dawn',      from: 5,  name: 'First light',   sky: '#3B3F6E', glow: '#E59A8B', sun: '#FFD9A8', ink: '#FFF4E8' },
  { id: 'morning',   from: 7,  name: 'Morning',       sky: '#BFD9EA', glow: '#F4F1E6', sun: '#FFE08A', ink: '#12110E' },
  { id: 'noon',      from: 11, name: 'High noon',     sky: '#5DA9E9', glow: '#CFE8F7', sun: '#FFF3B0', ink: '#12110E' },
  { id: 'afternoon', from: 14, name: 'Afternoon',     sky: '#8EC5E8', glow: '#F6E7C8', sun: '#FFD36E', ink: '#12110E' },
  { id: 'golden',    from: 17, name: 'Golden hour',   sky: '#F2A65A', glow: '#FFE1A8', sun: '#FFF1C7', ink: '#12110E' },
  { id: 'blue',      from: 19, name: 'Blue hour',     sky: '#24356E', glow: '#6E5BA8', sun: '#F7C9A3', ink: '#F4F1FA' },
  { id: 'night',     from: 21, name: 'Night shift',   sky: '#0E1430', glow: '#1D2656', sun: '#E9E4C9', ink: '#E9E4C9', moon: true },
];

/** The marine layer overrides the sky when the weather says so, mornings only. */
export const MARINE_LAYER = { id: 'marine', name: 'Marine layer', sky: '#AEB6BD', glow: '#E3E6E8', sun: '#F4F1E6', ink: '#12110E' };

export function periodAt(hour) {
  let found = PERIODS[0];
  for (const p of PERIODS) if (hour >= p.from) found = p;
  return found;
}

/**
 * The light for a moment, optionally fogged. `condition` is the /api/weather
 * condition string; fog/overcast before 1 PM reads as the marine layer.
 */
export function lightAt(date = new Date(), condition = '') {
  const clock = laClock(date);
  const base = periodAt(clock.hour);
  const foggy = /fog|mist|overcast|drizzle/i.test(String(condition)) && clock.hour >= 5 && clock.hour < 13;
  const light = foggy ? { ...base, ...MARINE_LAYER } : base;
  // Sun travels a half-circle from 6 AM to 7 PM; the moon takes the night.
  const dayT = Math.min(1, Math.max(0, (clock.hour + clock.minute / 60 - 6) / 13));
  const nightHours = ((clock.hour + 24 - 19) % 24) + clock.minute / 60;
  const nightT = Math.min(1, Math.max(0, nightHours / 11));
  return { ...light, clock, arc: base.moon ? nightT : dayT };
}

/** The cache bucket for generated cards: day + period, e.g. "2026-09-23.golden". */
export function lightBucket(date = new Date()) {
  const clock = laClock(date);
  return `${clock.date}.${periodAt(clock.hour).id}`;
}

/** Five-minute bucket for live cards, e.g. "2026-09-23T14:35". */
export function liveBucket(date = new Date(), minutes = 5) {
  const clock = laClock(date);
  const m = Math.floor(clock.minute / minutes) * minutes;
  return `${clock.date}T${String(clock.hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** A representative El Segundo hour for each period — the wall's "see it at" dial. */
export const PERIOD_HOURS = { dawn: 6, morning: 9, noon: 12, afternoon: 15, golden: 18, blue: 20, night: 23, marine: 8 };

/**
 * The light for a named period instead of the clock, e.g. `light=golden` on
 * a card URL. Returns null for anything that isn't a period id.
 */
export function lightForPeriod(id) {
  const hour = PERIOD_HOURS[id];
  if (hour === undefined) return null;
  // Build a Date at that hour today, in El Segundo, by walking from now.
  const now = new Date();
  const { hour: h, minute: m } = laClock(now);
  const at = new Date(now.getTime() + ((hour - h) * 60 - m) * 60_000);
  return lightAt(at, id === 'marine' ? 'fog' : '');
}
