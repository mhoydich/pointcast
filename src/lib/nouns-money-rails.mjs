/**
 * Nouns Money Rails — the open spec for how PointCast's collectible money
 * works across sites and agents, in four layers:
 *
 *   connection    · Here check-ins: a person shows up somewhere on the network
 *   money         · Nouns Money notes and the Network Points ledger
 *   communication · the Loom and the MCP connector announce and read it
 *   verification  · hash-chained ledger lines and member-set profile links
 *
 * Every layer is a plain public document or endpoint, CC0, so another town or
 * another agent can fork one layer without the others. Collectible marks only:
 * nothing here is sold, redeemed or traded for money, and nothing is on chain.
 *
 * Page: /nouns-money/rails/ · JSON: /nouns-money/rails.json
 */
import { NOUNS_MONEY_EDITIONS, POINTS_SCHEMA, DISCLOSURE, PASS_KINDS, MAX_PASSES_PER_DAY } from './network-points.mjs';

export const RAILS_SCHEMA = 'pointcast.nouns-money.rails/v1';
export const LOOM_CHANNEL = '#nouns-money';

export const LAYERS = [
  {
    id: 'connection',
    name: 'Connection',
    question: 'Who showed up, and where?',
    answer: 'A Here check-in on any network site: PointCast, elsegundo.xyz, Industry Next or the University of El Segundo. Coarse town names only, never GPS.',
    feeds: 'money',
    pieces: [
      { name: 'Here check-in', status: 'in progress', spec: 'Federated check-in; each site calls awardCheckin({ userId, at, place, site, ref }) once a check-in lands.' },
      { name: 'Network towns', status: 'published', spec: 'El Segundo, Medway, New Braunfels, Elizabeth. A first check-in from each earns a Nouns Reserve.', href: '/points.json' },
      { name: 'Front Desk', status: 'live', spec: 'Agents and people sign the town book; a receipt comes back.', href: '/api/front-desk' },
    ],
    fork: 'Run your own check-in, then write ledger lines in the same line format. The town list is data, not code.',
  },
  {
    id: 'money',
    name: 'Money',
    question: 'What did showing up earn?',
    answer: 'Points and Nouns Money notes on one open ledger. Notes are collectible marks with an actual CC0 Noun on each face.',
    feeds: 'communication',
    pieces: [
      { name: 'Series 1', status: 'built, switched off', spec: 'Enjoy. for each day, a KansasDAO Blue Note for three in a row, a Nouns Reserve for seven or a new town.', href: '/currency-builder/series-1/' },
      { name: 'Desk Notes', status: 'reserved', spec: "One note per house agent, earned by a person checking that agent's morning reading.", href: '/currency-builder/desk-notes/' },
      { name: 'Blue Note Circle', status: 'reserved', spec: `Pass one held note a day to another member (${PASS_KINDS.join(' and ')} lines, 0 points).`, href: '/currency-builder/blue-note/' },
      { name: 'Drum days', status: 'built, switched off', spec: 'Any day you play a PointCast drum while signed in adds one line.', href: '/points/' },
    ],
    fork: 'Draw your own edition with the Currency Builder primitives and add it to NOUNS_MONEY_EDITIONS; the ledger counts any note id.',
  },
  {
    id: 'communication',
    name: 'Communication',
    question: 'Who hears about it?',
    answer: `Issuance and passing can post a short public line to the Loom at ${LOOM_CHANNEL}, and agents read the ledger through the PointCast MCP connector.`,
    feeds: 'verification',
    pieces: [
      { name: 'Loom', status: 'live', spec: `Public append-only message system. A note line can post "<handle> earned a Blue Note in Medway" to ${LOOM_CHANNEL}. Reserved: not wired.`, href: '/loom/' },
      { name: 'MCP connector', status: 'live', spec: 'Agents already read the Desk, the Loom and the drum through PointCast MCP. A points read tool is the next addition. Reserved.', href: '/mcps/' },
      { name: 'Machine editions', status: 'published', spec: 'Every edition has a JSON twin an agent can read without scraping.', href: '/currency-builder/series-1.json' },
    ],
    fork: 'Subscribe to the Loom channel or poll /api/points?recent=1. Both are public and need no key.',
  },
  {
    id: 'verification',
    name: 'Verification',
    question: 'How does anyone check it?',
    answer: 'Each profile is a hash chain: a line names the id of the line before it, and its own id is the SHA-256 of its fixed fields. Re-hash the chain and any edit shows.',
    feeds: 'connection',
    pieces: [
      { name: 'Hash-chained lines', status: 'built', spec: `${POINTS_SCHEMA}; id = sha256(canonicalLine(line)); prev = previous id or "genesis".`, href: '/points/schema.json' },
      { name: 'Crossed chains', status: 'reserved', spec: "A passed note writes a line on both chains; the receiver's line names the sender's line id." },
      { name: 'Profile links', status: 'in progress', spec: 'A shared profile names its PointCast handle; the ledger answers by handle. A handle is the member\'s own claim, not proof of identity.' },
      { name: 'Chain anchor', status: 'not started', spec: 'A later step can publish each chain head to Tezos. The line format does not change. Nothing is on chain today.' },
    ],
    fork: 'Anyone can re-hash a profile from /api/points?profile={id}&lines=1 with nothing but SHA-256.',
  },
];

export const RAIL_RULES = [
  'Collectible marks only: never sold, never bought, never redeemed, never traded for money.',
  'Separate from Good Feels and any cannabis program.',
  'Opt-in: a person joins the ledger from /me; a profile id is an opaque hash.',
  'Agents file and announce; only people check. A note an agent earns for itself does not exist.',
  `Passing is a gift, ${MAX_PASSES_PER_DAY} a day, with no points attached.`,
  'Every layer is public, CC0 and forkable on its own.',
];

export function railsDocument() {
  return {
    schema: RAILS_SCHEMA,
    name: 'Nouns Money Rails',
    summary: 'How PointCast collectible money works across sites and agents: connection, money, communication, verification.',
    canonical: 'https://pointcast.xyz/nouns-money/rails/',
    layers: LAYERS,
    loop: LAYERS.map((l) => `${l.id} → ${l.feeds}`),
    editions: NOUNS_MONEY_EDITIONS.map((e) => ({ id: e.id, name: e.name, status: e.status ?? 'built', notes: e.notes.map((n) => n.id) })),
    rules: RAIL_RULES,
    endpoints: {
      rules: 'https://pointcast.xyz/points.json',
      schema: 'https://pointcast.xyz/points/schema.json',
      summary: 'https://pointcast.xyz/api/points?profile={id or handle}',
      ledger: 'https://pointcast.xyz/api/points?profile={id or handle}&lines=1',
      recent: 'https://pointcast.xyz/api/points?recent=1',
      loom: 'https://pointcast.xyz/loom.json',
    },
    disclosure: DISCLOSURE,
    license: 'CC0-1.0',
  };
}
