/**
 * Hearth (Loom v2, cards H-2 to H-4): the Loom read as a fireplace instead of a dashboard.
 *
 * Pure: no I/O, no DOM. The /loom/hearth pages fetch /api/loom and hand the JSON here.
 *
 * Choices, written down:
 * - A room is a fire. Its size comes from how recently it moved (the directory only carries
 *   updatedAt, not a per-day count): under 3 hours 64px, under 12 hours 56, under a day 40,
 *   under 3 days 32. Older than that it is an ember: named in one line, no fire.
 * - Warm when the last speaker was a person, pilot blue when it was a bot. The Collator
 *   (the house robot) never lights a fire on its own: a room whose last line is the
 *   Collator's keeps whatever palette the sender before it earned, which the directory
 *   does not carry, so it shows pilot.
 * - Nothing ever prints a zero. An empty pile is left out, not shown as "0".
 * - The front-page sentence is built from the data, not written by a model, so it can
 *   be wrong only where the data is.
 */

export const FIRE_SIZES = [64, 56, 40, 32];
const H = 3600000;
const LIT_STEPS = [[3 * H, 64], [12 * H, 56], [24 * H, 40], [72 * H, 32]];
export const EMBER_MS = 14 * 24 * H;
export const MAX_FIRES = 9;
export const MAX_EMBERS = 4;
const ROOM_KINDS = new Set(['topic', 'handle']);

export const PALETTES = {
  warm: { outer: 'var(--hearth-ember)', middle: 'var(--hearth-flame)', core: 'var(--hearth-core)' },
  pilot: { outer: 'var(--hearth-pilot-edge)', middle: 'var(--hearth-pilot)', core: 'var(--hearth-pilot-core)' },
};
const PATHS = {
  outer: 'M3 0h1v1H3zM3 1h2v1H3zM2 2h3v1H2zM2 3h4v1H2zM1 4h5v1H1zM1 5h6v2H1zM0 7h8v3H0zM1 10h6v1H1zM2 11h4v1H2z',
  middle: 'M3 4h1v1H3zM3 5h2v1H3zM2 6h3v1H2zM2 7h4v2H2zM1 9h6v1H1zM2 10h4v1H2zM3 11h2v1H3z',
  core: 'M3 7h1v1H3zM3 8h2v3H3z',
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const time = (t) => { const n = Date.parse(t); return Number.isFinite(n) ? n : 0; };
const oneLine = (s, n = 140) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
export const isCollator = (from) => !!from && (from.kind === 'robot' || String(from.name ?? '').toLowerCase() === 'collator' || from.address === '@collator');
export const isPerson = (from) => !!from && from.kind === 'human';

/** The 8x12 pixel flame. size is its width in px (height is 1.5x); palette "warm" or "pilot". */
export function flameSvg(size = 40, palette = 'warm', { still = false } = {}) {
  const w = FIRE_SIZES.includes(size) ? size : 40;
  const p = PALETTES[palette] ?? PALETTES.warm;
  const cls = still ? 'hearth-flame' : 'hearth-flame hearth-flicker';
  return `<svg class="${cls}" viewBox="0 0 8 12" width="${w}" height="${w * 1.5}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<path fill="${p.outer}" d="${PATHS.outer}"/><path fill="${p.middle}" d="${PATHS.middle}"/><path fill="${p.core}" d="${PATHS.core}"/></svg>`;
}

/** Fire width for a room that last moved at updatedAt, or null when it is only an ember. */
export function fireSize(updatedAt, now = Date.now()) {
  const age = now - time(updatedAt);
  if (age < 0) return FIRE_SIZES[0];
  for (const [limit, size] of LIT_STEPS) if (age < limit) return size;
  return null;
}

export const paletteFor = (last) => (isPerson(last) ? 'warm' : 'pilot');

/** "just now", "12 minutes ago", "3 hours ago", "yesterday", "4 days ago". Never "0 ...". */
export function ago(at, now = Date.now()) {
  const m = Math.floor((now - time(at)) / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? 'an hour ago' : `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

const roomName = (e) => e.label || e.address;
export const roomHref = (address) => `/loom/hearth/room?to=${encodeURIComponent(address)}`;

/**
 * The directory (GET /api/loom) as a hearth: lit fires, newest first, and embers.
 * Only rooms (topics and handles) count; page threads and replies stay on the classic Loom.
 */
export function hearthFromDirectory(logs = [], now = Date.now()) {
  const rooms = logs.filter((e) => e && ROOM_KINDS.has(e.kind) && e.updatedAt)
    .sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
  const fires = [], embers = [];
  for (const e of rooms) {
    const size = fireSize(e.updatedAt, now);
    if (size) {
      if (fires.length < MAX_FIRES) {
        fires.push({ address: e.address, name: roomName(e), title: e.title ?? null, size, palette: paletteFor(e.last),
          lastName: isCollator(e.last) ? null : (e.last?.name ?? null), updatedAt: e.updatedAt, href: roomHref(e.address) });
      }
    } else if (now - time(e.updatedAt) < EMBER_MS && embers.length < MAX_EMBERS) {
      embers.push({ address: e.address, name: roomName(e), href: roomHref(e.address) });
    }
  }
  return { fires, embers };
}

const listOf = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`);

/**
 * The "while you were out" sentence. seenAt is when this browser last looked (null on a first look,
 * which reads the last 24 hours). Returns { lead, line } and never mentions a zero.
 */
export function whileYouWereOut(fires, { seenAt = null, now = Date.now() } = {}) {
  const since = seenAt ? time(seenAt) : now - 24 * H;
  const moved = fires.filter((f) => time(f.updatedAt) > since);
  const lead = seenAt ? 'WHILE YOU WERE OUT' : 'TODAY ON THE LOOM';
  if (!fires.length) return { lead, line: 'The fires are banked. Add a log to light the first one.' };
  if (!moved.length) {
    const f = fires[0];
    return { lead, line: `Quiet since you last looked. The last fire to move was ${f.name}, ${ago(f.updatedAt, now)}.` };
  }
  const people = [...new Set(moved.filter((f) => f.palette === 'warm' && f.lastName).map((f) => f.lastName))].slice(0, 3);
  const top = moved[0];
  const count = moved.length === 1 ? 'One fire moved' : `${moved.length} fires moved`;
  const who = top.lastName ? `, ${top.lastName} spoke last` : '';
  const peopleLine = people.length ? ` ${listOf(people)} ${people.length === 1 ? 'was' : 'were'} at the fire.` : ' Only bots spoke.';
  return { lead, line: `${count}. ${top.name} is the brightest${who}.${peopleLine}` };
}

/**
 * One room, people first. messages are the folded thread (GET /api/loom?to=...).
 * Returns the three summary lines, the people's posts newest first, and the bots folded.
 */
export function roomView(messages = [], { title = null, now = Date.now(), cap = 20 } = {}) {
  // Echoes (copies rippled in from elsewhere, m.via) are the same message as their original: left out.
  const own = messages.filter((m) => m && !m.hidden && !m.via && !isCollator(m.from));
  const people = own.filter((m) => isPerson(m.from));
  const bots = own.filter((m) => !isPerson(m.from));
  const day = own.filter((m) => now - time(m.at) < 24 * H);
  const summary = [];
  if (title) summary.push(oneLine(title, 120));
  if (day.length) {
    const dayPeople = day.filter((m) => isPerson(m.from)).length;
    const voices = new Set(day.map((m) => m.from?.name)).size;
    summary.push(`${day.length === 1 ? 'One post' : `${day.length} posts`} in the last day from ${voices === 1 ? 'one voice' : `${voices} voices`}${dayPeople ? '' : ', all bots'}.`);
  } else if (own.length) {
    summary.push(`Last moved ${ago(own.at(-1).at, now)}.`);
  }
  const lastPerson = people.at(-1);
  if (lastPerson) summary.push(`${lastPerson.from.name} said: ${oneLine(lastPerson.body, 110)}`);
  else if (bots.length) summary.push(`No person has spoken here yet. Latest from ${bots.at(-1).from?.name ?? 'a bot'}: ${oneLine(bots.at(-1).body, 90)}`);
  const toPost = (m) => ({ id: m.id, name: m.from?.name ?? 'anonymous', person: isPerson(m.from), when: ago(m.at, now), body: String(m.body ?? '') });
  return {
    summary: summary.slice(0, 3),
    people: people.slice(-cap).reverse().map(toPost),
    bots: bots.slice(-cap).reverse().map(toPost),
    botCount: bots.length,
  };
}
