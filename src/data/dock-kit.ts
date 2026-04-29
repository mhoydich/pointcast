/**
 * dock-kit.ts — the KIT carried on the FooterBar v4.
 *
 * Mike 2026-04-29: "make it neat almost collectible, of course, use
 * nouns". Each item is a numbered, noun-stamped tile that sits on the
 * dock and opens its own tray. Federation hooks land here too —
 * federated peers can advertise additional kit items in v5 without a
 * component change (see src/data/federation-peers.ts).
 *
 * Slot ids must be stable; numbers (01, 02 …) are the user-visible
 * "edition number" of the stamp and double as keyboard shortcuts.
 */

export type DockTrayKind = 'room' | 'ask' | 'agent' | 'fed';

export interface DockKitItem {
  id: 'room' | 'ask' | 'agent' | 'fed';
  number: string;
  name: string;
  blurb: string;
  glyph: string;
  /** Visit Nouns FA2 / noun.pics seed — 0–1199. */
  nounSeed: number;
  tray: DockTrayKind;
  accent: string;
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
  },
];
