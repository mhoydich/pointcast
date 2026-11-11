/**
 * The Hour — pure scene logic, shared by /hour and tests/hour.test.mjs.
 *
 * The page never generates anything. Each hour it *chooses*: one image, one
 * line, one scale and one room, seeded by the El Segundo date and hour, so
 * everyone who visits in the same hour sees the same scene.
 */

export const TIME_ZONE = 'America/Los_Angeles';

/** Clock parts in El Segundo time. */
export function ptParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/** dawn 5–8, day 9–16, dusk 17–19, night 20–4. */
export function bandFor(hour) {
  if (hour >= 5 && hour <= 8) return 'dawn';
  if (hour >= 9 && hour <= 16) return 'day';
  if (hour >= 17 && hour <= 19) return 'dusk';
  return 'night';
}

/** Halloween night: Oct 31, 5 PM to midnight, El Segundo time. */
export function isHalloweenNight({ month, day, hour }) {
  return month === 10 && day === 31 && hour >= 17;
}

/** Small deterministic hash → 32-bit unsigned. */
export function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedFor({ year, month, day, hour }, salt = '') {
  return hashString(`${year}-${month}-${day}-${hour}:${salt}`);
}

/** Pick one item from a list with a seed; stable for the same seed. */
export function pick(list, seed) {
  if (!list.length) return undefined;
  return list[seed % list.length];
}

/**
 * Moon phase as a fraction 0..1 (0 new, 0.5 full) from a known new moon.
 * Accurate to about a day, which is all a front door needs.
 */
export function moonPhase(date = new Date()) {
  const synodic = 29.530588853;
  const knownNew = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNew) / 86400000;
  return (((days % synodic) + synodic) % synodic) / synodic;
}

export function moonName(phase) {
  const names = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent'];
  return names[Math.round(phase * 8) % 8];
}

/** Scales as semitone offsets; each band and Halloween get their own. */
export const SCALES = {
  dawn: { name: 'major pentatonic', root: 62, steps: [0, 2, 4, 7, 9, 12, 14, 16] },
  day: { name: 'lydian', root: 60, steps: [0, 2, 4, 6, 7, 9, 11, 12] },
  dusk: { name: 'dorian', root: 57, steps: [0, 2, 3, 5, 7, 9, 10, 12] },
  night: { name: 'minor pentatonic', root: 55, steps: [0, 3, 5, 7, 10, 12, 15, 17] },
  halloween: { name: 'phrygian dominant', root: 52, steps: [0, 1, 4, 5, 7, 8, 10, 12] },
};

/** WMO weather code → a few plain words. */
export function weatherWords(code) {
  if (code === 0) return 'clear';
  if (code <= 2) return 'mostly clear';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 95) return 'thunder';
  return 'weather';
}

export function hourLabel(hour) {
  if (hour === 0) return 'midnight';
  if (hour === 12) return 'noon';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

/**
 * Choose the whole scene for one hour.
 * pools: { images: {band: [...]}, lines: {band: [...]}, rooms: {band: [...]} }
 */
export function chooseScene(parts, pools, { halloween } = {}) {
  const band = bandFor(parts.hour);
  const mode = halloween ?? isHalloweenNight(parts) ? 'halloween' : band;
  const images = pools.images[mode] ?? pools.images[band];
  const lines = pools.lines[mode] ?? pools.lines[band];
  const rooms = pools.rooms[mode] ?? pools.rooms[band];
  return {
    band,
    mode,
    image: pick(images, seedFor(parts, 'image')),
    line: pick(lines, seedFor(parts, 'line')),
    room: pick(rooms, seedFor(parts, 'room')),
    scale: SCALES[mode],
  };
}
