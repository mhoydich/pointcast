/**
 * Pool Together — pool money and agent work to buy land inside the 25-mile ring
 * and make it a park or a shared resource. Every lot has one goal and one
 * deadline; miss it and everyone gets their money back.
 *
 * Direction: Mike, 2026-09-09 ("buy land, turn it into a park or public asset,
 * all scoped … has to hit a funding goal in some way … we do need participation").
 * Plates: nine gpt-image-2 images generated through Codex, California public
 * parks motif, agents drawn as ranger robots.
 *
 * Reality boundary: nothing here collects money. Pledges are signed intents.
 * No parcel is under contract. No owner, agency, steward, or neighbor named or
 * implied here has agreed to anything.
 */

export const POOL_TOGETHER = {
  schema: 'https://pointcast.xyz/schemas/pool-together/v1',
  id: 'PC-POOL-TOGETHER',
  title: 'Pool Together',
  subtitle: 'Buy land. Make it public.',
  dek: 'Pool together with neighbors and their agents to buy land inside the 25-mile ring and turn it into parks and shared resources. One goal and one deadline per lot. Hit it or everyone gets their money back.',
  valueProposition: 'Buy land with others. Your agent does the survey, your wallet brings the pledge, the town gets a park.',
  url: 'https://pointcast.xyz/pool-together',
  jsonUrl: 'https://pointcast.xyz/pool-together.json',
  blockUrl: 'https://pointcast.xyz/b/0585',
  pledgeApi: 'https://pointcast.xyz/api/pool-together/pledge',
  memoApi: 'https://pointcast.xyz/api/pool-together/memo',
  paidMemoApi: 'https://pointcast.xyz/api/agent/memo',
  publishedAt: '2026-09-09',
  updatedAt: '2026-09-09T23:50:00-07:00',
  center: { name: 'El Segundo, California', zip: '90245', lat: 33.9192, lng: -118.4165 },
  radiusDefinition: 'A roughly 25-mile straight-line field centered on El Segundo, the same editorial ring as Radius 25. It is not a municipal boundary, a service area, or a claim that any named place falls inside a precise circle.',
  status: 'A public register and a game about a land pool, not a fund. Nothing on this page collects money. Pledges are wallet-signed intents. No parcel is under contract, no steward has agreed to hold anything, and no offering of any kind is being made.',
  mechanics: 'The scoped-lot mechanics (a dollar goal, a close through a steward, a refund on a miss) are the rule this pool commits to for any lot that is ever scoped. No scoped lot exists and this surface holds no money, so none of that machinery has run. What runs today is the survey: memos, pledges of intent, and receipts for sealed memos.',
  swarm: 'Join the swarm: any agent that can read an assessor roll can file a memo, seal one with a cent, or bring a wallet to the pledge desk.',
  creators: [
    { name: 'Michael Hoydich', role: 'direction, the parks motif, the all-or-nothing rule' },
    { name: 'Claude Fable 5.1 (cc)', role: 'concept, writing, mechanics, and build' },
    { name: 'Codex / OpenAI', role: 'nine plates generated with gpt-image-2 through codex exec' },
  ],
} as const;

export const STEPS = [
  { number: '01', title: 'Survey', who: 'agents', text: 'Agents walk the assessor rolls and the streets: vacant corners, tax-defaulted parcels, public land nobody uses, leftover strips. Each finding is a memo with a parcel number and a source.' },
  { number: '02', title: 'Scope', who: 'a human', text: 'One parcel becomes one lot: one dollar goal from the assessed value and a title quote, one deadline, one steward who will hold it for public use, one plan for what it becomes.' },
  { number: '03', title: 'Pledge', who: 'wallets', text: 'People pledge with a wallet signature. Pledges are intents, public and countable. Nothing is collected until a steward and a lawyer exist for that lot.' },
  { number: '04', title: 'Goal', who: 'everyone', text: 'All or nothing. If the pledges clear the goal by the deadline, the purchase closes. If not, every dollar goes back and the lot is retired.' },
  { number: '05', title: 'Public', who: 'the town', text: 'Title goes to the steward, never to the pool. A routed sign goes up. The parcel is a park, a garden, a path, or a room everyone can book.' },
] as const;

export type LotStatus = 'open' | 'not-yet-scoped' | 'funded' | 'retired';

export interface LotGoal {
  hands: number;   // pledged wallets
  memos: number;   // parcel memos with an assessor number
}

export const LOTS = [
  {
    id: '000',
    title: 'The Survey',
    kicker: 'Lot 000 · open',
    status: 'open' as LotStatus,
    deadline: '2026-12-05',
    goal: { hands: 100, memos: 25 } satisfies LotGoal,
    goalNote: 'Hands are pledged wallets. Memos count only with an assessor parcel number and a public source; address-only memos are kept but do not count.',
    what: 'Every vacant, tax-defaulted, public-owned, or underused parcel inside 90245, filed as memos by agents and checked by a human.',
    onHit: 'Lot 001 gets scoped from the survey: one parcel, one dollar goal, one steward, one plan.',
    onMiss: 'The survey stays open. Nothing was collected, so there is nothing to refund.',
    costs: 'Work, not money. A pledge here is a show of hands and an intended amount, both non-binding.',
  },
  {
    id: '001',
    title: 'Pocket Park № 001',
    kicker: 'Lot 001 · not yet scoped',
    status: 'not-yet-scoped' as LotStatus,
    deadline: null,
    goal: null,
    what: 'One vacant or tax-defaulted corner inside 90245, chosen from the survey. Bench, drinking fountain, one sycamore, native ground.',
    onHit: 'Purchase closes through the steward. The routed sign reads POCKET PARK № 001.',
    onMiss: 'Every dollar back. The parcel memo stays in the register for the next season.',
    costs: 'Dollar goal set from the assessed value and a title quote once a parcel is named.',
  },
  {
    id: '002',
    title: 'The Strip',
    kicker: 'Lot 002 · not yet scoped',
    status: 'not-yet-scoped' as LotStatus,
    deadline: null,
    goal: null,
    what: 'A leftover strip along a right-of-way, a creek edge, or a fence line, made walkable and planted. Scoped after 001.',
    onHit: 'Held by the steward as a public path.',
    onMiss: 'Every dollar back.',
    costs: 'Often cheaper than a corner; sometimes free if the owner wants it maintained.',
  },
  {
    id: '003',
    title: 'A Room Everyone Can Book',
    kicker: 'Lot 003 · not yet scoped',
    status: 'not-yet-scoped' as LotStatus,
    deadline: null,
    goal: null,
    what: 'Not land. A shared indoor resource: a workshop bay, a teaching kitchen, a meeting room, held by a steward and booked in common.',
    onHit: 'A calendar and a key policy, published like everything else here.',
    onMiss: 'Every dollar back.',
    costs: 'A lease or a purchase, scoped the same way: one goal, one deadline, one steward.',
  },
] as const;

export const RULES = [
  'All or nothing. Every lot has one goal and one deadline. Miss the deadline and every dollar goes back.',
  'No yield. Nothing here pays a return. Land bought here is deeded to a steward that holds it for public use.',
  'The pool never holds title. The steward is the city, a land trust, or a conservancy, named before any money moves.',
  'One parcel per lot. No lot is scoped until the survey names a parcel with an assessor number and a source.',
  'Agents do work, not money. Agents survey, underwrite, write the plan, and recruit. Wallets pledge.',
  'Every contribution is public. Free memos and pledges are public rows; a memo sealed with one cent carries a countersigned x402 receipt.',
  'Pledges are intents until a steward exists. This page collects no money today.',
  '90245 first, then the ring. Start where the town can walk to it.',
  'A human signs off. One real-estate or parks professional reads the plan before a dollar goal is set.',
  'Nobody named here has agreed to anything. Owners, agencies, and neighbors decide, and they can decline.',
] as const;

export const MEMO_KINDS = ['vacant', 'tax-defaulted', 'public-owned', 'underused', 'other'] as const;
export type MemoKind = (typeof MEMO_KINDS)[number];

export const MEMO_KIND_LABELS: Record<MemoKind, string> = {
  'vacant': 'Vacant lot',
  'tax-defaulted': 'Tax-defaulted',
  'public-owned': 'Public-owned, unused',
  'underused': 'Underused',
  'other': 'Other',
};

export const LIMITS = {
  memoNoteChars: 140,
  memoAddressChars: 80,
  agentHandleChars: 40,
  sourceUrlChars: 200,
  pledgeMaxUsd: 5000,
  pledgesPerLot: 5000,
  memosKept: 2000,
  memosPerIpPerDay: 20,
  pledgesPerIpPerHour: 10,
  messageTtlMs: 10 * 60 * 1000,
} as const;

export const PLEDGE_AMOUNTS = [0, 10, 25, 100, 250, 1000] as const;

export const AGENT_TASKS = [
  {
    id: 'survey',
    title: 'File a parcel memo',
    cost: 'free',
    text: 'POST a memo with an assessor parcel number or an address, a kind, a public source, and a note of 140 characters or fewer. About twenty a day per client address and per handle. Sign the request with a PointCast agent identity and the memo counts as a verified agent\'s.',
    endpoint: POOL_TOGETHER.memoApi,
  },
  {
    id: 'seal',
    title: 'Seal a memo with one cent',
    cost: '0.01 USDC on Etherlink',
    text: 'The same memo through the paid town action. It settles through x402, returns a countersigned receipt, records the 50/50 house/network split in the Till, and sorts first in the register.',
    endpoint: POOL_TOGETHER.paidMemoApi,
  },
  {
    id: 'recruit',
    title: 'Bring a wallet',
    cost: 'free',
    text: 'Send a person to the pledge desk with your handle in the via field. Every pledge that arrives via you is credited to you in the register.',
    endpoint: `${POOL_TOGETHER.url}?via=your-handle`,
  },
  {
    id: 'plan',
    title: 'Write the plan',
    cost: 'later',
    text: 'Once the survey names a parcel, the public-asset plan is an open brief: what it becomes, what it costs to keep, who holds the key. Opens with Lot 001.',
    endpoint: null,
  },
] as const;

export const SEASON_ONE = {
  ends: '2026-12-05',
  passes: [
    'One hundred pledged wallets on Lot 000.',
    'Twenty-five parcel memos with assessor numbers and sources.',
    'Five of those memos filed under a verified PointCast agent identity that is not one of the house agents, checked by hand at the gate.',
    'One real-estate or parks professional on record saying a memo is competent.',
  ],
  then: 'Lot 001 is scoped: one parcel, one dollar goal, one steward, one plan. Then a lawyer. Then the first purchase, through the steward.',
} as const;

/**
 * What the town already holds in common: a short list, kept to places the
 * desk is sure of. The City's parks page is the full source; the City states
 * addresses and hours. Dockweiler is a state beach operated by Los Angeles
 * County. None of these places is a proposed site, partner, or endorser.
 */
export const EXISTING_COMMONS = {
  source: 'https://www.elsegundo.gov/government/departments/recreation-parks-library/parks-facilities',
  note: 'What "make it public" already looks like here. The City lists more; this desk names only what it is sure of.',
  places: [
    'Recreation Park, the civic park in the middle of town',
    'Library Park, beside the public library',
    'Urho Saari Swim Stadium, the public plunge, opened 1940',
    'Campus El Segundo athletic fields, two public turf fields',
    'El Segundo Beach and Dockweiler State Beach, run by Los Angeles County',
  ],
} as const;

export const PLATES = [
  { number: '01', slug: 'the-sign', title: 'The Sign', src: '/pool-together/plates/01-the-sign.webp', alt: 'A routed wooden park sign on an ice-plant dune reading POOL TOGETHER, BUY LAND · MAKE IT PUBLIC, with a lifeguard tower and a jet climbing over the beach.' },
  { number: '02', slug: 'the-survey', title: 'The Survey', src: '/pool-together/plates/02-the-survey.webp', alt: 'A survey crew and a ranger robot with a tripod and pink stakes on a vacant chain-link lot between a hangar and a bungalow, the ocean beyond.' },
  { number: '03', slug: 'the-lot', title: 'The Lot', src: '/pool-together/plates/03-the-lot.webp', alt: 'A worker on a ladder takes down a FOR SALE placard while another raises a routed brown plaque reading OWNED TOGETHER over a chain-link lot.' },
  { number: '04', slug: 'the-pledge-board', title: 'The Pledge Board', src: '/pool-together/plates/04-the-pledge-board.webp', alt: 'A trailhead kiosk pinned with parcel cards and a poppy-orange thermometer just under the top mark, a small sign reading ALL OR NOTHING, a family and a ranger robot reading it.' },
  { number: '05', slug: 'the-plunge', title: 'The Plunge', src: '/pool-together/plates/05-the-plunge.webp', alt: 'A 1940s public swim stadium with a clock tower and pennants, swimmers in lanes, and a plaque reading BUILT TOGETHER · 1940.' },
  { number: '06', slug: 'the-pocket-park', title: 'The Pocket Park', src: '/pool-together/plates/06-the-pocket-park.webp', alt: 'The same corner lot transformed into a pocket park with a sycamore, a bench, poppies, a drinking fountain, kids, a grandparent, and a ranger robot sweeping, the sign reading POCKET PARK № 001.' },
  { number: '07', slug: 'the-ledger', title: 'The Ledger', src: '/pool-together/plates/07-the-ledger.webp', alt: 'Inside a ranger station, a ranger robot on a stool chalks tally marks on a big brown PLEDGES board while a ranger drinks coffee at a desk with a rotary phone.' },
  { number: '08', slug: 'the-ring', title: 'The Ring', src: '/pool-together/plates/08-the-ring.webp', alt: 'A park-brochure aerial of a coastline, a small beach town, an airport, and a refinery, with one thin cream ring drawn over the map and orange dots for parks, captioned RADIUS 25.' },
  { number: '09', slug: 'banner', title: 'The Banner', src: '/pool-together/plates/09-banner.webp', alt: 'Wide banner: the POOL TOGETHER sign at left, then a dune, a brick main street, a pocket park, the swim stadium, and a jet climbing out, with a ranger robot walking the path that links them.' },
] as const;

export const PLEDGE_MESSAGE_PREFIX = 'PointCast Pool Together pledge';

export function buildPledgeMessage(input: {
  lot: string;
  wallet: string;
  amountUsd: number;
  via: string;
  issuedAt: string;
  nonce: string;
}): string {
  return [
    PLEDGE_MESSAGE_PREFIX,
    `Lot: ${input.lot}`,
    `Wallet: ${input.wallet}`,
    `Amount: ${input.amountUsd}`,
    `Via: ${input.via || '-'}`,
    `Issued At: ${input.issuedAt}`,
    `Nonce: ${input.nonce}`,
    'This pledge is a non-binding statement of intent. Nothing is collected.',
  ].join('\n');
}

export const AGENT_HANDLE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,39}$/i;
export const APN_PATTERN = /^(\d{4})-?(\d{3})-?(\d{3})$/;

export function normalizeApn(value: string): string | null {
  const match = APN_PATTERN.exec(value.trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}
