/** The shared Hearth pixel flame, front-page recap and people-first room view. */

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
export const personHref = (name) => `/loom/hearth/person?name=${encodeURIComponent(name)}`;

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

/** The newest ROOM NOTE accepted by the classic reader. Trimmed logs have lost their opener. */
function roomNote(messages, log) {
  if (log?.kind !== 'topic') return;
  const roots = messages.filter(m => !m.parent && !(m.depth >= 1) && !m.via);
  const name = m => String(m?.from?.name || '').trim().replace(/^@+/, '').replace(/\s+/g, ' ').toLowerCase();
  const opener = !log.trimmedBefore && name(roots.at(-1));
  return roots.find(m => !m.withdrawn && /^room note(?![a-z])/i.test((m.body || '').trim()) &&
    (m.from?.verified || name(m) === "loom desk (mike's agent)" || (opener && name(m) === opener)));
}

/** Read direct posts here. The classic room keeps the complete mirrored and system log. */
/** A work card's chip for the room view: id, token ceiling, and whether the server counts it as signed.
 *  Only the server's signed flag (from a verified PointCast agent key) earns the signed look. */
export function cardChipHtml(m) {
  const card = m && m.card && typeof m.card === 'object' ? m.card : null;
  if (!card || !card.id) return '';
  const signed = m.signed === true;
  const ceiling = Number.isFinite(card.ceiling) ? (card.ceiling >= 1e6 ? `${+(card.ceiling / 1e6).toFixed(1)}M` : `${Math.round(card.ceiling / 1000)}K`) : '';
  const label = `${card.id}${ceiling ? ` · ${ceiling} tokens` : ''} · ${signed ? 'signed' : 'unsigned'}`;
  const tip = signed ? 'A signed work card: posted with a verified PointCast agent key. Runners may pick it up.'
    : 'An unsigned work card. Runners ignore it until a verified desk posts it.';
  return `<span class="hearth-card-chip${signed ? ' signed' : ''}" title="${esc(tip)}">${esc(label)}</span>`;
}

export function roomView(messages = [], { log = {} } = {}) {
  const visible = messages.filter(m => m && !m.hidden && !m.withdrawn)
    .sort((a, b) => (b.seq || 0) - (a.seq || 0) || time(b.at) - time(a.at));
  const posts = visible.filter(m => !m.via && !isCollator(m.from));
  const people = posts.filter(m => isPerson(m.from));
  const bots = posts.filter(m => !isPerson(m.from));
  const note = roomNote(visible, log);
  const summary = note ? note.body.trim().replace(/^room note[\s:.·•\-–—]*/i, '')
    .split('\n').map(line => line.trim()).filter(Boolean).slice(0, 3).map(line => oneLine(line, 140)) : [];
  if (summary.length) summary[0] = (note.from.name || 'Room editor') + ' · ' + summary[0];

  const excerpt = m => m.body?.trim() || m.poll?.question || m.media?.alt;
  const recent = posts.filter(m => m !== note && excerpt(m));
  const lastPerson = recent.find(m => isPerson(m.from));
  const lastBot = recent.find(m => !isPerson(m.from));
  for (const m of new Set([lastPerson, lastBot, ...recent].filter(Boolean))) {
    if (summary.length === 3) break;
    summary.push((m.from?.name || 'Someone') + ' wrote “' + oneLine(excerpt(m).split('\n')[0], 110) + '”');
  }
  if (summary.length < 3) summary.unshift(log.title || 'Around the fire in ' + (log.label || 'this room') + '.');
  if (summary.length < 3) {
    const count = posts.length === 1 ? 'One log was posted here.' : posts.length + ' logs were posted here.';
    summary.push(posts.length ? count : 'No one has posted directly here yet.');
  }
  if (summary.length < 3) summary.push(posts.length ? 'Read the logs below.' : 'Add the first log.');
  return { summary, people, bots, botCount: bots.length };
}
