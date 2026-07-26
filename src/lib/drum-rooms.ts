/**
 * drum-rooms — the hallway rule for /drum.
 *
 * There are ~118 drum-* pages in src/pages. They are not copies of each
 * other; they are ~118 small instruments. What kept going missing was the
 * hallway: /drum's hub strip was twelve hand-typed cards that stopped at
 * v9 while the ladder ran to v18, and DrumNav is eight links frozen in
 * July. Hand-lists die here because the site ships too fast for them.
 *
 * So this file is a rule, not a list of rooms:
 *
 *   1. Every page under src/pages/drum-*.astro is harvested at build time
 *      (via src/lib/explore.ts, which already runs the raw-glob harvester
 *      and the `git log --name-only` mtime attachment in production —
 *      reused here rather than re-run, so the build pays for it once).
 *   2. A slug ending in a version suffix (`-v18`, `-v2`, `-2`) folds into
 *      its base, so eighteen near-identical tiles become one door with a
 *      row of version chips. 118 pages → ~88 doors.
 *   3. Each door lands in a wing by predicate. The last wing matches
 *      everything, so a drum page shipped tomorrow appears on /drum
 *      tomorrow, unfiled but reachable, without anyone editing this file.
 *
 * Rule 3 is the whole point. Filing a new room into a nicer wing is a
 * one-word edit to a `rooms` array below; forgetting to do it costs a
 * label, not a door.
 *
 * Shape mirrors src/lib/explore.ts's CATEGORIES so the two indexes stay
 * legible side by side.
 */

import { FEATURES } from './explore';
import { getVisitorNounId } from './visitor';

/** A wing of the hallway. Same shape as explore.ts's Category. */
export interface Wing {
  key: string;
  label: string;
  blurb: string;
  /** Receives the *base* slug of a family, e.g. "drum-runner", or "drum"
   *  for the drum-v2…v18 ladder (whose base is the hub page itself). */
  match: (base: string) => boolean;
}

/** One sibling version behind a door. `label` is the literal suffix. */
export interface RoomVersion {
  slug: string;   // "drum-runner-v3"
  label: string;  // "v3"
}

export interface Room {
  /** Canonical door URL, e.g. "/drum-runner". */
  slug: string;
  /** Family key, e.g. "drum-runner". "drum" for the v-ladder. */
  base: string;
  /** Short display label, site suffixes and "Drum " prefixes stripped. */
  label: string;
  /** One-line teaser. May be '' — 13 drum pages carry no description. */
  sub: string;
  wing: string;
  /** Deterministic Noun seed, 0–1199 (matches the Visit Nouns FA2 supply). */
  noun: number;
  /** Newest last-commit time across the family, unix seconds. 0 if unknown. */
  mtime: number;
  /** Other pages folded into this door, oldest suffix first. */
  versions: RoomVersion[];
  /** Pages behind this door: 1 + versions.length. */
  count: number;
}

/** The hub page itself. It is the hallway, not a door in it. */
const HUB = 'drum';

/** A door is "fresh" if anything in its family shipped this recently. */
export const FRESH_WINDOW_DAYS = 14;

interface WingDef {
  key: string;
  label: string;
  blurb: string;
  /** Optional pattern, tried before the name list. */
  re?: RegExp;
  /** Bare names — "buttons" means base slug "drum-buttons". */
  rooms?: string[];
  /** The catch-all. Exactly one wing sets this, and it must be last. */
  all?: boolean;
}

/**
 * The taxonomy. Grouped by what a room *is* when you walk into it, not
 * by name. Order matters: first match wins, exactly like explore.ts.
 */
const DEFS: WingDef[] = [
  {
    key: 'instruments',
    label: 'the instruments',
    blurb: 'touch it and it makes a sound. the oldest habit in the building.',
    // The drum-v2…v18 ladder folds to base "drum" — one door, 17 retunings.
    re: /^drum$/,
    rooms: [
      'buttons', 'echo', 'jam', 'daily', 'quintet', 'table', 'room',
      'bell-jar', 'pendulum', 'holding-back', 'apr26',
    ],
  },
  {
    key: 'cast',
    label: 'the broadcast',
    blurb: 'hands off. these are built for the screen across the room.',
    // Anything with tv in the slug is a projection surface by construction.
    re: /(^|-)tv(-|$)/,
    rooms: ['marquee', 'viz', 'radio', 'radio-room', 'warhol-live', 'tape', 'pulse', 'now'],
  },
  {
    key: 'arcade',
    label: 'the arcade',
    blurb: 'a start, a score, and a way to lose. no quarters.',
    rooms: [
      'games', 'says', 'quickdraw', 'fill', 'steady', 'runner',
      'solo', 'potato', 'duel', 'vs', 'league',
    ],
  },
  {
    key: 'chapel',
    label: 'the chapel',
    blurb: 'rooms that ask you to slow down. bells, sand, tide, one bead at a time.',
    rooms: [
      'altars', 'agent-altar', 'shrine', 'saint', 'rosary', 'vespers',
      'prayer-flag', 'offering', 'station', 'meditate', 'koan', 'mantra',
      'zen', 'lantern', 'threshold', 'bath', 'tide', 'aurora', 'bell-fall',
      'procession', 'confessional',
    ],
  },
  {
    key: 'crowd',
    label: 'the crowd',
    blurb: 'many hands on one page. leave something for whoever comes next.',
    rooms: [
      'applause', 'emoji-mesh', 'shout', 'graffiti', 'bulletin', 'letters',
      'walkie', 'relay', 'birthday', 'cake', 'card', 'pinata',
    ],
  },
  {
    key: 'desk',
    label: 'the front desk',
    blurb: 'who came through, what it counted for, what the wing is doing right now.',
    rooms: ['agent', 'agents', 'agents-board', 'meet', 'scorebook', 'conductor', 'fives'],
  },
  {
    key: 'keepsakes',
    label: 'the keepsakes',
    blurb: 'things you carry back out of the wing.',
    rooms: ['press', 'trophies', 'portrait', 'postcard', 'stickers', 'name-card'],
  },
  {
    key: 'unfiled',
    label: 'unfiled',
    blurb: 'doors that shipped since the last time anyone sorted the wing. they land here on their own.',
    all: true,
  },
];

function makeMatch(def: WingDef): (base: string) => boolean {
  if (def.all) return () => true;
  const set = new Set((def.rooms ?? []).map((n) => `drum-${n}`));
  const re = def.re;
  return (base: string) => (re ? re.test(base) : false) || set.has(base);
}

export const WINGS: Wing[] = DEFS.map((d) => ({
  key: d.key,
  label: d.label,
  blurb: d.blurb,
  match: makeMatch(d),
}));

/**
 * Split a slug into family base + version suffix.
 * "drum-runner-v3" → base drum-runner, v3. "drum-v18" → base drum, v18.
 * "drum-relay-2"   → base drum-relay, 2 (the one family that skipped the v).
 * "drum-apr26"     → no match; "apr26" is a name, not a suffix.
 */
const VERSION_RE = /^(.+)-(v?\d+)$/;

function splitVersion(slug: string): { base: string; label: string | null; n: number } {
  const m = slug.match(VERSION_RE);
  if (!m) return { base: slug, label: null, n: 0 };
  return { base: m[1], label: m[2], n: parseInt(m[2].replace(/^v/, ''), 10) || 0 };
}

/**
 * explore.ts unquotes string literals by slicing the quotes off, which
 * leaves the escapes inside: `Simply Red\'s`. Undo that here rather than
 * in explore.ts, which is not this PR's file.
 */
function unslash(text: string): string {
  return text.replace(/\\(['"`])/g, '$1');
}

/** First sentence, trimmed to `max` chars on a word boundary. */
function shorten(text: string, max = 66): string {
  if (!text) return '';
  const stop = text.indexOf('. ');
  let s = (stop > 8 ? text.slice(0, stop) : text).replace(/\.$/, '').trim();
  if (s.length <= max) return s;
  s = s.slice(0, max);
  const cut = s.lastIndexOf(' ');
  return `${(cut > 24 ? s.slice(0, cut) : s).trim()}…`;
}

/**
 * Titles in this wing come in three dialects:
 *   "/drum-v18 — Rhodes (electric piano)"
 *   "Bath · Twelve-Minute Daylight Cycle · PointCast"
 *   "DRUM VS — 1v1 tug-of-war for friends"
 * and 13 pages have no `const title` at all, in which case explore.ts has
 * already derived one from the slug ("Drum v2"). Reduce all of them to a
 * short label plus, when the title carried one, a free teaser for the
 * pages that have no description.
 */
function readTitle(rawTitle: string, slug: string): { label: string; tail: string } {
  let t = unslash((rawTitle || '').trim());
  t = t.replace(/\s*[·|—–-]\s*PointCast\s*$/i, '');
  t = t.replace(new RegExp(`^/${slug}\\s*[—–·-]?\\s*`, 'i'), '');
  t = t.replace(/^\/[a-z0-9-]+\s+[—–·]\s+/i, '');

  let tail = '';
  const parts = t.split(/\s+[·—–]\s+/);
  if (parts.length > 1) {
    t = parts[0];
    tail = parts.slice(1).join(' · ');
  }
  const stripped = t.replace(/^drum\s+/i, '').trim();
  const label = (stripped || t || slug).trim();
  return { label, tail: tail.trim() };
}

interface Member {
  slug: string;
  label: string | null;
  n: number;
  title: string;
  description: string;
  mtime: number;
}

function buildRooms(): Room[] {
  const families = new Map<string, Member[]>();

  for (const f of FEATURES) {
    const slug = f.slug.replace(/^\//, '');
    if (slug === HUB) continue;            // the hallway is not a door
    if (!slug.startsWith('drum-')) continue;
    const { base, label, n } = splitVersion(slug);
    const list = families.get(base) ?? [];
    list.push({ slug, label, n, title: f.title, description: f.description, mtime: f.mtime });
    families.set(base, list);
  }

  const takenNouns = new Set<number>();
  const takenLabels = new Set<string>();
  const rooms: Room[] = [];

  // Shortest base first, so "/drum-tv" claims the label "tv" before
  // "/drum-tv-meet" can. Deterministic regardless of harvest order.
  const ordered = [...families.entries()].sort(
    (a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]),
  );

  for (const [base, members] of ordered) {
    // Canonical door: the un-suffixed page if it exists (that is always the
    // current one — /drum-runner is v7), otherwise the highest suffix.
    const plain = members.find((m) => m.label === null);
    const canonical =
      plain ?? members.slice().sort((a, b) => b.n - a.n)[0];
    const versions = members
      .filter((m) => m.slug !== canonical.slug)
      .sort((a, b) => a.n - b.n)
      .map((m) => ({ slug: m.slug, label: m.label ?? m.slug }));

    const { label: titled, tail } = readTitle(canonical.title, canonical.slug);
    let label = titled;
    let sub = shorten(unslash(canonical.description)) || tail;

    // The one family whose base *is* the hub: drum-v2…v18 are seventeen
    // retunings of the room directly below this hallway. Naming that door
    // after its newest member ("Rhodes") hides what it is.
    if (base === HUB) {
      label = 'the ladder';
      sub = `${members.length} retunings of the room below · newest is ${titled.toLowerCase()}`;
    }

    // Two rooms can derive the same short label ("/drum-tv" and
    // "/drum-tv-meet" both reduce to "tv"). The base room keeps it; the
    // loser falls back to its own slug, which is unique by definition.
    if (takenLabels.has(label.toLowerCase())) {
      label = base.replace(/^drum-/, '').replace(/-/g, ' ');
    }
    takenLabels.add(label.toLowerCase());

    const wing = WINGS.find((w) => w.match(base)) ?? WINGS[WINGS.length - 1];

    let noun = getVisitorNounId(base);
    while (takenNouns.has(noun)) noun = (noun + 1) % 1200;
    takenNouns.add(noun);

    rooms.push({
      slug: `/${canonical.slug}`,
      base,
      label,
      sub,
      wing: wing.key,
      noun,
      mtime: members.reduce((max, m) => Math.max(max, m.mtime), 0),
      versions,
      count: members.length,
    });
  }

  return rooms.sort((a, b) => b.mtime - a.mtime || a.label.localeCompare(b.label));
}

export const ROOMS: Room[] = buildRooms();

/** Doors grouped by wing, newest door first, empty wings dropped. */
export function roomsByWing(): { wing: Wing; rooms: Room[] }[] {
  return WINGS.map((wing) => ({
    wing,
    rooms: ROOMS.filter((r) => r.wing === wing.key),
  })).filter((group) => group.rooms.length > 0);
}

/** Headline numbers: doors on the wall, pages behind them. */
export function hallwayCount(): { doors: number; pages: number } {
  return {
    doors: ROOMS.length,
    pages: ROOMS.reduce((sum, r) => sum + r.count, 0),
  };
}

/** True if this door's family was touched in the last FRESH_WINDOW_DAYS. */
export function isFresh(mtime: number): boolean {
  if (!mtime) return false;
  return mtime > Math.floor(Date.now() / 1000) - FRESH_WINDOW_DAYS * 86400;
}
