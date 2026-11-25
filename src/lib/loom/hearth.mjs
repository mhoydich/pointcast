/** The shared Hearth pixel flame, front-page recap and people-first room view. */
import { roomSummary } from './hearth-summary.mjs';

export const FIRE_SIZES = [64, 56, 40, 32];
export const MAX_FIRES = 9;

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

export const roomHref = (address) => `/loom/hearth/room?to=${encodeURIComponent(address)}`;

/** Rooms are ordered by last-day volume. Use original post times for return visits. */
export function whileYouWereOut({ active, unavailable, since, asOf }, seenAt = null) {
  const lastVisit = time(seenAt);
  const recentVisit = lastVisit >= since && lastVisit <= asOf;
  const cutoff = recentVisit ? lastVisit : since;
  const moved = active.filter(room => time(room.lastAt) > cutoff);
  const person = moved.find(room => room.human && time(room.lastHumanAt) > cutoff);
  const pilot = moved.find(room => !room.human);
  if (person) {
    const name = person.humanName || 'Someone';
    return pilot ? `${name} posted in ${person.address}, and agents kept ${pilot.address} lit.`
      : `${name} added a log to ${person.address}.`;
  }
  if (moved.length) {
    const room = moved[0];
    return room.lastName ? `${room.lastName} added a log to ${room.address}.`
      : `The fire in ${room.address} is burning.`;
  }
  if (unavailable.length) return 'The Loom could only read part of the board.';
  return recentVisit ? 'The fires have been quiet since your last visit.' : 'The rooms have been quiet for the past day.';
}

/** Read direct posts here. The classic room keeps the complete mirrored and system log. */
export function roomView(messages = [], { log = {}, now = Date.now() } = {}) {
  const visible = messages.filter(m => m && !m.hidden && !m.withdrawn)
    .sort((a, b) => (b.seq || 0) - (a.seq || 0) || time(b.at) - time(a.at));
  const posts = visible.filter(m => !m.via && !isCollator(m.from));
  const people = posts.filter(m => isPerson(m.from));
  const bots = posts.filter(m => !isPerson(m.from));
  const summary = roomSummary(posts, { log, now });
  return { summary, people, bots, botCount: bots.length };
}
