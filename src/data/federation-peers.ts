/**
 * federation-peers.ts — known peers on the PointCast federation.
 *
 * Companion to:
 *   docs/rfcs/0004-pointcast-block-lexicon.md
 *   src/lib/lexicon/block-to-lexicon.ts
 *   src/pages/federation/preview.astro
 *
 * Today this is a static list rendered in the FooterBar's FED tray.
 * Tomorrow each peer is fetched live (peer.baseUrl + '/agents.json'
 * or an AT-proto PDS resolver), and a peer's `kit` array can extend
 * the dock with its own collectible kit items. The shape is designed
 * so that flip is data-only.
 *
 * status:
 *   live    — reachable, federation handshake working
 *   beta    — partial (lexicon agreed but no live fetch yet)
 *   dream   — placeholder, "we'd federate with this if they shipped"
 */

export interface FederationPeer {
  handle: string;
  did?: string;
  baseUrl: string;
  kicker: string;
  /** Visit Nouns FA2 / noun.pics seed — 0–1199. */
  nounSeed: number;
  accent: string;
  status: 'live' | 'beta' | 'dream';
}

export const FEDERATION_PEERS: FederationPeer[] = [
  {
    handle: 'pointcast.xyz',
    baseUrl: 'https://pointcast.xyz',
    kicker: 'home cast — el segundo, marine layer, 1 noun a day',
    nounSeed: 1,
    accent: '#c4952e',
    status: 'live',
  },
  {
    handle: 'pointcast.xyz/nouns-nation',
    baseUrl: 'https://pointcast.xyz/nouns-nation/',
    kicker: 'Battle Desk V3 — federation league, bring-your-own nations, teams, crews',
    nounSeed: 911,
    accent: '#2f8f5f',
    status: 'live',
  },
  {
    handle: 'pointcast.xyz/sparrow',
    baseUrl: 'https://pointcast.xyz/sparrow',
    kicker: 'sibling reader — blue-hour OKLCH, syndicated cast feed',
    nounSeed: 88,
    accent: '#4A9EFF',
    status: 'beta',
  },
  {
    handle: 'bsky.app',
    baseUrl: 'https://bsky.app',
    kicker: 'AT-proto neighbor — Lexicon bridge in flight at /federation/preview',
    nounSeed: 333,
    accent: '#1185fe',
    status: 'beta',
  },
  {
    handle: 'farcaster',
    baseUrl: 'https://warpcast.com',
    kicker: 'cast-shaped social — channel echoes, frame embeds',
    nounSeed: 569,
    accent: '#8a63d2',
    status: 'dream',
  },
];
