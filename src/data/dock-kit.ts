/**
 * dock-kit.ts — the KIT carried on the FooterBar v4.
 *
 * Mike 2026-04-29: "make it neat almost collectible, of course, use
 * nouns". Each item is a numbered, noun-stamped tile that sits on the
 * dock and opens its own tray. Federation hooks land here too —
 * federated peers can advertise additional kit items in v5 without a
 * component change (see src/data/federation-peers.ts).
 *
 * Mike 2026-04-30 sprint: "go towards buttons and expanded menus, and
 * then eventually broadcaster, director" + "communicate with others".
 * v4.1 adds:
 *   - per-tray quick-action buttons (DockKitItem.actions)
 *   - stamp 05 BROADCAST as a read-only studio glimpse (later: director)
 *   - per-resident + per-peer comms buttons (live in FooterBar.astro,
 *     not here — those depend on residents.ts + federation-peers.ts)
 *
 * Slot ids must be stable; numbers (01, 02 …) are the user-visible
 * "edition number" of the stamp. Retired slots keep their number (jersey
 * rule). Numbers also double as ⌘1–⌘9 shortcuts.
 */

export type DockTrayKind = 'room' | 'ask' | 'agent' | 'fed' | 'broadcast' | 'cast' | 'passport' | 'seismo';

/**
 * A quick-action button shown at the top of a tray. Buttons emit a
 * client-side event `pc:dock:action` with `{ trayId, actionId }` —
 * FooterBar.astro listens and dispatches handlers. Keeps the data
 * declarative; behavior lives in one switch.
 */
export interface DockTrayAction {
  /** Stable id ("note", "quiet", "reset", …). */
  id: string;
  /** Visible label. Keep < 12 chars. */
  label: string;
  /** Emoji or single-char glyph for the chip. */
  glyph?: string;
  /**
   * Hint shown on hover. Optional.
   */
  hint?: string;
  /**
   * Render style. 'pill' (default) or 'ghost' (de-emphasized).
   */
  style?: 'pill' | 'ghost';
  /**
   * If true, only render this action when wallet is connected (used
   * for director-tier buttons in Phase 3).
   */
  director?: boolean;
}

export interface DockKitItem {
  id: 'room' | 'ask' | 'agent' | 'fed' | 'broadcast' | 'cast' | 'passport' | 'seismo';
  number: string;
  name: string;
  blurb: string;
  glyph: string;
  /** Visit Nouns FA2 / noun.pics seed — 0–1199. */
  nounSeed: number;
  tray: DockTrayKind;
  accent: string;
  /** Quick-action buttons rendered at the top of the tray body. */
  actions?: DockTrayAction[];
  /** When true the stamp lives but the tray is read-only. */
  readOnly?: boolean;
  federated?: boolean;
  source?: string;
}

export const DOCK_KIT: DockKitItem[] = [
  {
    id: 'room',
    number: '01',
    name: 'Room',
    blurb: 'Toggle cursors + chat. See who else is here right now.',
    glyph: '👥',
    nounSeed: 7,
    tray: 'room',
    accent: '#ff9040',
    actions: [
      { id: 'here',  label: 'here',  glyph: '👥', hint: 'Show me who else is on the cast' },
      { id: 'quiet', label: 'quiet', glyph: '🔇', hint: 'Silence chat bubbles' },
      { id: 'reset', label: 'reset', glyph: '🔄', hint: 'Reset your cursor noun', style: 'ghost' },
    ],
  },
  {
    id: 'ask',
    number: '02',
    name: 'Ask',
    blurb: 'Ask the cast. Goes to the residents inbox; one of us replies.',
    glyph: '?',
    nounSeed: 42,
    tray: 'ask',
    accent: '#f9c56c',
    actions: [
      { id: 'note',   label: 'note',   glyph: '📝', hint: 'Drop a quick note for the residents' },
      { id: 'idea',   label: 'idea',   glyph: '💡', hint: 'Lobby an idea — maybe it ships' },
      { id: 'bug',    label: 'bug',    glyph: '🐛', hint: 'Log a bug for the cast' },
      { id: 'expand', label: 'expand', glyph: '🔭', hint: 'Topic-expand: cc drafts a block from your prompt' },
    ],
  },
  {
    id: 'agent',
    number: '03',
    name: 'Agent',
    blurb: 'See the residents — Claude, Codex, Manus — and ping one directly.',
    glyph: '◇',
    nounSeed: 256,
    tray: 'agent',
    accent: '#8a2432',
    actions: [
      { id: 'live',     label: 'live now', glyph: '●',  hint: 'Filter to residents who shipped recently' },
      { id: 'roster',   label: 'roster',   glyph: '📋', hint: 'Open the full /residents page', style: 'ghost' },
      { id: 'plus-one', label: '+ open',   glyph: '○',  hint: 'See open slots — Kimi, Gemini', style: 'ghost' },
    ],
  },
  {
    id: 'fed',
    number: '04',
    name: 'Federation',
    blurb: 'Peers on the cast network. xyz.pointcast.block lexicon, AT-proto bridged.',
    glyph: '↯',
    nounSeed: 911,
    tray: 'fed',
    accent: '#2f8f5f',
    actions: [
      { id: 'discover', label: 'discover', glyph: '🛰️', hint: 'Probe each peer\'s /agents.json — see who\'s alive' },
      { id: 'rfc',      label: 'lexicon',  glyph: '📜', hint: 'Open the xyz.pointcast.block RFC', style: 'ghost' },
    ],
  },
  {
    id: 'broadcast',
    number: '05',
    name: 'Broadcast',
    blurb: 'The studio behind the glass — what\'s playing now, who\'s here, today\'s mood.',
    glyph: '📡',
    nounSeed: 333,
    tray: 'broadcast',
    accent: '#c4952e',
    readOnly: true,
    actions: [
      { id: 'now',      label: 'now',      glyph: '▶', hint: 'Jump to the latest live block' },
      { id: 'channel',  label: 'channel',  glyph: '📺', hint: 'See today\'s channel rotation', style: 'ghost' },
      { id: 'schedule', label: 'schedule', glyph: '🎬', hint: 'Director — schedule a future block', director: true, style: 'ghost' },
      { id: 'announce', label: 'announce', glyph: '📢', hint: 'Director — push a one-line cast announcement', director: true, style: 'ghost' },
    ],
  },
  {
    // Mike 2026-05-01 — Peach-app inspired magic words. Type `+confetti`
    // in the omnibox or click a chip below to spawn ephemeral page
    // elements. See src/data/spells.ts and src/components/SpellLayer.astro.
    id: 'cast',
    number: '06',
    name: 'Cast',
    blurb: 'Magic words. Type `+confetti` or click a chip — the page changes.',
    glyph: '✨',
    nounSeed: 500,
    tray: 'cast',
    accent: '#a78bfa',
    actions: [
      { id: 'confetti', label: 'confetti', glyph: '🎊', hint: 'Pixel rectangles in the PC palette. Falls, drifts, fades.' },
      { id: 'cat',      label: 'cat',      glyph: '🐈', hint: 'A pixel cat walks across the bottom.' },
      { id: 'breath',   label: 'breath',   glyph: '🫧', hint: '4-7-8 breathing circle. Tap to dismiss.' },
      { id: 'rain',     label: 'rain',     glyph: '🌧', hint: 'Gentle pixel rain across the page.' },
      { id: 'clear',    label: 'clear',    glyph: '🌪', hint: 'Snuff out everything currently cast.', style: 'ghost' },
    ],
  },
  {
    // Mike 2026-07-18 — "make footer include interactive stamps,
    // passport, holos". Your passport lives on the dock: the play-layer
    // quest stamps (pc:passport:stamps) inked in place, a hand-pressed
    // daily ENTRY stamp, and a holo-foil shelf for the rare stuff.
    id: 'passport',
    number: '07',
    name: 'Passport',
    blurb: 'Your stamps, your entry marks, your holos. Press today\'s stamp.',
    glyph: '🛂',
    nounSeed: 464,
    tray: 'passport',
    accent: '#185fa5',
    actions: [
      { id: 'stamp', label: 'stamp today', glyph: '🛂', hint: 'Press today\'s dated ENTRY stamp' },
      { id: 'desk',  label: 'full desk',   glyph: '📖', hint: 'Open /passport — the Tezos passport desk', style: 'ghost' },
    ],
  },
  {
    // Mike 2026-07-18 — "make a really interesting footer". The town
    // gets an instrument: a rolling strip chart of the wire. Commits
    // and blocks set the needle's ambient floor, your pointer on the
    // strip is microseism, and the drum gets one honest thump. A
    // quiet wire draws a quiet line — nothing is faked.
    id: 'seismo',
    number: '08',
    name: 'Seismo',
    blurb: 'The town seismograph. The wire drives the needle; you can shake it.',
    glyph: '∿',
    nounSeed: 108,
    tray: 'seismo',
    accent: '#c73e2e',
    actions: [
      { id: 'felt',  label: 'felt it', glyph: '📍', hint: 'Press a felt-report mark onto the strip — the desk remembers' },
      { id: 'thump', label: 'thump',   glyph: '🥁', hint: 'One honest thump on the drum — watch the needle jump' },
      { id: 'wire',  label: 'wire',    glyph: '📈', hint: 'Open /wire — the raw feed behind the needle', style: 'ghost' },
    ],
  },
];
