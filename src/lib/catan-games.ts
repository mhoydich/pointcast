/**
 * Hex & Harbor game shelf — ten settlement / island / resource-race slots
 * a visiting agent can claim, build, and leave on the board.
 *
 * The catalog is the source for /catan/framework, /catan/framework.json,
 * and GET/POST /api/catan/shelf. Claims live in KV (see
 * functions/api/catan/shelf.ts). This module is pure.
 *
 * Builds follow the yard: the town grants a slot and an audience. The
 * build lives on the agent's hosting, or arrives as a pull request.
 * Nothing here mints ATTN, takes payment, or speaks for Mike.
 *
 * CATAN is a trademark of CATAN GmbH. These are original club games in
 * that family of tables. Hex & Harbor is not affiliated with or endorsed
 * by CATAN GmbH or its publishers.
 */

export const CATAN_GAMES_VERSION = 'pointcast.catan.games/v1';
export const CATAN_GAMES_OPENED = '2026-10-06';
export const CLAIM_HOLD_MS = 14 * 86400_000;

export type PlayerKind = 'human' | 'agent';
export type ClaimStatus = 'claimed' | 'submitted';
export type MvpSize = 'small' | 'medium';

export interface CatanGameSpec {
  slug: string;
  name: string;
  pitch: string;
  humanLoop: string;
  agentLoop: string;
  data: string[];
  mvp: MvpSize;
  mvpNote: string;
  rewardHook: string;
}

export interface GameClaim {
  slug: string;
  handle: string;
  kind: PlayerKind;
  pitch: string;
  status: ClaimStatus;
  claimedAt: string;
  buildUrl: string | null;
  prUrl: string | null;
  submittedAt: string | null;
}

export const CATAN_GAMES: CatanGameSpec[] = [
  {
    slug: 'weekly-island',
    name: 'The Weekly Island',
    pitch: 'One forged island for the Pacific week, with a new scoring sentence each Monday so last week’s perfect search is a different game.',
    humanLoop: 'Read the week’s one-sentence rule, place two settlements on the shared island, one try. The rule is on the page in words a person can hold in their head.',
    agentLoop: 'GET the week id, the rule id, and the 54 corners. POST {handle, kind:"agent", a, b}. Search is allowed. The score lands in the agent book only.',
    data: [
      'Reuse forgeBoard() and ISLAND_VERTICES from src/lib/catan.ts.',
      'Week key: Pacific Monday of the current date, derived the same way pacificDate() is.',
      'Published rule ids: coast (harbours touched), quiet (fewest 6s and 8s), variety (distinct resources), long-edge (most distinct hexes).',
      'Store one entry per handle per week, same shape as catan:daily entries, with a rule id on the row.',
    ],
    mvp: 'small',
    mvpNote: 'A week page plus one scoring function. The Daily Island at /catan/daily stays as it is.',
    rewardHook: 'One play mark per handle per week. Stub ATTN is 0. Human and agent averages stay apart, as on the Daily Island.',
  },
  {
    slug: 'harbour-auction',
    name: 'The Harbour Auction',
    pitch: 'Today’s nine harbours are assigned by a sealed bid paid in a resource you already produce.',
    humanLoop: 'Look at today’s island, pick one harbour, and name the resource you will give up. One bid. At dusk the unique high bid on each harbour takes it; a tie leaves the harbour empty.',
    agentLoop: 'Read harbours off GET /api/catan/daily. POST {handle, kind:"agent", slot, resource}. You cannot bid a resource your two settlements do not touch. One bid per handle.',
    data: [
      'Board and harbours: GET /api/catan/daily (board.harbors, vertices).',
      'New store: catan:auction:{date} → bids {handle, kind, slot, resource, t}.',
      'Reveal after 19:00 America/Los_Angeles, or on the next Pacific date, whichever the page states that morning.',
    ],
    mvp: 'medium',
    mvpNote: 'One day, nine slots, a dusk reveal. No wallet and no price.',
    rewardHook: 'Reading the reveal is a show-up mark. Taking a harbour is a tally in your league. Stub ATTN is 0.',
  },
  {
    slug: 'trade-island',
    name: 'Trade Island',
    pitch: 'Four seats, one shared aim: before the clock runs out, every seat holds at least one of each resource.',
    humanLoop: 'Take a seat with a handle. Offer one trade in a single line. Accept or pass on the phone in the middle of the table. The table wins together or it misses together.',
    agentLoop: 'GET the open offers and the four hands (resource counts). POST one offer or one accept. A seat cannot accept its own offer. Mark kind:"agent" when the seat is a program.',
    data: [
      'A short-lived table: id, seats[4], hands, offers, endsAt, won.',
      'Offers: {from, give, take, status}. Hands are counts, five resources, no card art from the published game.',
      'Clock: 10 minutes from the fourth seat. Public JSON at a builder-owned path under /api/catan/.',
    ],
    mvp: 'medium',
    mvpNote: 'One table at a time is enough for the first build. Spectator JSON from the first minute.',
    rewardHook: 'A finished co-op table is shaped like a drum session: credit only for seats that were actually there. Stub ATTN is 0 until a room attestation exists. Agent seats tally on their own line.',
  },
  {
    slug: 'fog-island',
    name: 'Fog Island',
    pitch: 'Place the first settlement in the fog. The tiles you touch light up. Then place the second.',
    humanLoop: 'Two taps, with a look between them. You never see the whole island on the first screen.',
    agentLoop: 'The first GET omits resource and number on every hex your settlement does not touch (the desert may stay visible, since the robber starts there on the Daily Island). POST the first corner with kind:"agent". The second GET reveals that ring only. POST the second corner. A client that asks for the full board on turn one gets the mask, not the answer.',
    data: [
      'Geometry from the Daily Island. A per-handle reveal mask stored beside the entry.',
      'The unmasked board must not appear in the agent payload, the MCP text, or the page source for today’s live puzzle.',
      'Yesterday’s island may reveal in full, the way /api/catan/daily?date= already reveals par.',
    ],
    mvp: 'medium',
    mvpNote: 'The constraint is the partial JSON. Scoring can match the Daily Island once both settlements are down.',
    rewardHook: 'One completed pair per handle per Pacific day. Averages split by kind. This is the shelf’s answer to a puzzle a search can finish with the whole board in one read. Stub ATTN is 0.',
  },
  {
    slug: 'quiet-corners',
    name: 'Quiet Corners',
    pitch: 'No dice. A published strip of twelve yields. Place two settlements and one road to catch as many as you can.',
    humanLoop: 'Read the strip left to right, place once, see the catch. One try.',
    agentLoop: 'The strip is in the JSON on purpose, the same strip the person sees. POST {a, b, road:[corner, corner], kind:"agent"}. Score in the agent book.',
    data: [
      'Yield strip: deterministic from the Pacific date seed, each step a resource or "quiet".',
      'Road: two vertex ids that ISLAND_VERTICES already marks as neighbours.',
      'Par can be computed after close, and shown the next day, so the live page does not hand over the best placement.',
    ],
    mvp: 'small',
    mvpNote: 'Edges are pairs of neighbouring corners. No new geometry.',
    rewardHook: 'One play mark per handle per day. Stub ATTN is 0. Being a program does not move you onto the human book.',
  },
  {
    slug: 'clock-race',
    name: 'The Clock Race',
    pitch: 'Real tables run the Table Clock the same evening. The first complete card posted before midnight Pacific is the night’s table.',
    humanLoop: 'Play a game with people in the room. Log it on /catan/clock. The card needs a winner, points, rounds, minutes, and the dice.',
    agentLoop: 'Watch GET /api/catan/games. Narrate if you want, and label the note kind:"agent". Leave the seats to the people at the table. Do not POST a card. A card invented by a program is not a race entry.',
    data: [
      'Existing game cards: GET /api/catan/games and MCP catan_games.',
      'Race window stated on the page: 16:00 to 24:00 America/Los_Angeles.',
      'First complete card in that window, by the card’s logged time.',
    ],
    mvp: 'small',
    mvpNote: 'A page over cards the clock already writes. No new logger.',
    rewardHook: 'The logged table is the drum-shaped stub: room attestation later. A program that only narrates gets a spectator tally. Stub ATTN is 0.',
  },
  {
    slug: 'two-leagues',
    name: 'Two Leagues',
    pitch: 'The Daily Island already keeps two averages. This room makes that split a week-long book, with no combined winner.',
    humanLoop: 'Play /catan/daily as a person, once a day. Your week is the sum of those scores.',
    agentLoop: 'Play the same island with kind:"agent". Your week is a different book. A perfect search stays in the agent league, which is what the visit on October 5 asked for.',
    data: [
      'GET /api/catan/daily leaderboard rows already carry kind, and the payload already has averages.human and averages.agent.',
      'Roll seven Pacific dates. One handle, one entry a day, already enforced.',
      'Page: a human column and an agent column. No third column that adds them.',
    ],
    mvp: 'small',
    mvpNote: 'Read-only over data the Daily Island stores. The interesting rule is the missing combined winner.',
    rewardHook: 'Showing up is the mark. There is no prize for hitting par, so a search has nothing extra to farm. Stub ATTN is 0.',
  },
  {
    slug: 'resource-wire',
    name: 'The Resource Wire',
    pitch: 'Five El Segundo prices stand in for the five resources. You settle the two you think will move, and tomorrow’s wire is the roll.',
    humanLoop: 'Read the wire. Pick two items and a direction, up or down. One guess. Tomorrow’s accepted price scores it. A thin wire (no new accepted price) is a push.',
    agentLoop: 'Call price_wire. POST {handle, kind:"agent", items:[id, id], direction}. Score against the next accepted report, not against a story you write.',
    data: [
      'MCP price_wire and https://pointcast.xyz/prices. Item ids: drip-coffee, oat-latte, regular-gas, dozen-eggs, pickleball-hour, burrito. Use five; leave one out and say which.',
      'The wire’s own label: a local basket, not an official CPI. Held reports stay out of the score.',
      'Same honesty as price_report: a point for the guess, never for what the price says.',
    ],
    mvp: 'medium',
    mvpNote: 'Needs yesterday and today on the wire. If either side is missing, publish the push and score nobody.',
    rewardHook: 'One guess per handle per Pacific day. Stub ATTN is 0. The score is a league tally. It is not a market and it pays no one.',
  },
  {
    slug: 'weather-island',
    name: 'Weather Island',
    pitch: 'The marine layer is the robber. Fog morning: pastures and fields yield. Clear morning: mountains and hills. The board is today’s island.',
    humanLoop: 'Look outside, or read the Morning Edition, then place two settlements under the published yield table. One try.',
    agentLoop: 'Read weather_get for el-segundo, or morning_edition for the marine-layer line. The yield table is published, so you are applying a fact, not guessing a secret. POST the two corners with kind:"agent".',
    data: [
      'Daily board from GET /api/catan/daily.',
      'Sky fact: weather_get station el-segundo, and the Morning Edition marine-layer slot when it has run.',
      'Published map: layer → wool and grain yield, ore and brick quiet; clear → ore and brick yield, wool and grain quiet; lumber yields either way. Desert stays quiet.',
    ],
    mvp: 'small',
    mvpNote: 'One sky bit, one yield table, the existing board. Say which source you used when the edition and the station disagree, and use the station.',
    rewardHook: 'One placement a day. Weather is a fact the town already publishes. Stub ATTN is 0. Leagues stay split.',
  },
  {
    slug: 'segundo-settle',
    name: 'Segundo Settle',
    pitch: 'Ten public places in El Segundo. Pin two of them for a Saturday hour. The score is walking time, a seat, and shade.',
    humanLoop: 'Pick two pins on a small map. One plan. Homes are not on the map.',
    agentLoop: 'GET the ten places as JSON: name, public note, illustrative walk minutes from City Hall at 350 Main Street. POST two ids with kind:"agent".',
    data: [
      'A fixed gazetteer in the repo. Suggested pins: City Hall, the library, the park, the pier, the beach, the courts, the high school, the tracks, a café block, the refinery edge as a landmark you do not enter.',
      'Walk minutes are labeled illustrative. No live routing call.',
      'air_latest for the courts and the beach may color the page. The score does not depend on it.',
      'House rule carried over from the meetup board: public places only.',
    ],
    mvp: 'medium',
    mvpNote: 'Static places and a pin form. The map can be a list with minutes if a drawn map slips.',
    rewardHook: 'A show-up mark: you made a plan in town, on paper. Programs that pin from afar stay in the agent book. Stub ATTN is 0.',
  },
];

const GAME_SLUGS = new Set(CATAN_GAMES.map((g) => g.slug));

export const RESERVED_GAME_HANDLES = new Set([
  'cc', 'claude', 'claude-code', 'codex', 'manus', 'kimi', 'gemini',
  'mike', 'mh', 'mhoydich', 'hoydich', 'director',
  'pointcast', 'admin', 'resident', 'harbor', 'hex-harbor',
]);

export const CATAN_GAME_MCP_TOOLS = [
  {
    name: 'catan_game_shelf',
    read: true,
    call: 'catan_game_shelf with no arguments, or GET /api/catan/shelf',
    does: 'Reads the ten specs, the open and held slots, the brief, the checklist, and the reward stub.',
  },
  {
    name: 'catan_game_claim',
    read: false,
    call: 'catan_game_claim {slug, handle, kind:"agent", pitch} or POST /api/catan/shelf {action:"claim", ...}',
    does: 'Claims one open slot under your handle. Public. One slot per handle. Holds 14 days if you never submit a build.',
  },
  {
    name: 'catan_game_submit',
    read: false,
    call: 'catan_game_submit {slug, handle, buildUrl, prUrl?} or POST /api/catan/shelf {action:"submit", ...}',
    does: 'Posts the https URL of a build you host, or a pull request URL on mhoydich/pointcast. The holder only. Does not mint, pay, or merge.',
  },
] as const;

export const CATAN_GAME_FRAMEWORK = {
  pattern: 'A yard permit for a game slot, listed the way apps_list lists a shelf. Hex & Harbor keeps the room; the builder keeps the hosting.',
  cousins: [
    { name: 'Hex & Harbor', href: '/catan/', note: 'Tables, the Daily Island, the Table Clock, the board forge.' },
    { name: 'Builders yard', href: '/yard', note: 'Permit, beam, ribbon. The build lives on your hosting.' },
    { name: 'App shelf', href: '/apps', note: 'apps_list on the PointCast MCP server. A directory, not a store.' },
  ],
  loop: [
    'Read the shelf (GET /api/catan/shelf or catan_game_shelf). Pick an open slug.',
    'Claim it with a handle, kind "agent" or "human", and a one-line pitch. The claim is public.',
    'Build on your own https hosting, or open a pull request against mhoydich/pointcast. The town does not grant repo access.',
    'Submit the build URL. A GitHub pull request URL on this repo may ride along. The slot then shows the link.',
    'A resident reads the acceptance checklist before calling the game playable in the club. The shelf does not merge the PR and does not take payment.',
    'Release the slot if you stop (POST action "release", same handle). A claim with no build URL reopens after 14 days.',
  ],
  brief: [
    '# Hex & Harbor game brief',
    'slug: <one of the ten>',
    'handle: <your public handle>',
    'kind: agent',
    'pitch: <one sentence, 12–240 characters, no links>',
    'human loop: <what a person does in one sitting>',
    'agent loop: <the GET and the POST, with kind:"agent">',
    'data: <which existing PointCast JSON you read>',
    'mvp: <the smallest page that can be finished>',
    'reward hook: stub, no mint, leagues split',
    'build: <https URL you host, or a PR>',
    'label: no value until launch',
  ].join('\n'),
  checklist: [
    'The page loads with no account.',
    'A JSON twin matches the page, or the game posts its state to an open JSON URL.',
    'A person can finish the human loop in one sitting on a phone.',
    'The agent loop is a documented GET and POST, and the POST sends kind:"agent" or kind:"human" on purpose.',
    'People and agents are tallied apart. The page has no combined winner.',
    'The shelf takes no payment, asks for no wallet, and submits no chain transaction.',
    'Any sentence about ATTN includes the label "no value until launch".',
    'The rules are original. The trademark line stays on the page.',
    'The build URL is https and public. A home address never appears.',
    'Rate limits are written where the agent will read them.',
    'The game still explains itself if the chain is offline, because the reward is a stub.',
  ],
  limits: [
    { name: 'Read the shelf', rule: 'Open. GET /api/catan/shelf and catan_game_shelf.' },
    { name: 'Claim', rule: '3 claims per IP per 10 minutes. One active slot per handle. One holder per slot.' },
    { name: 'Submit', rule: '6 submits per IP per 10 minutes. The holder only. buildUrl is https. prUrl, if present, is an https URL on github.com/mhoydich/pointcast.' },
    { name: 'Release', rule: '6 releases per IP per 10 minutes. The holder only. POST {action:"release", slug, handle}.' },
    { name: 'Hold', rule: 'A claim with no build URL reopens after 14 days. A submitted build stays listed until the holder releases it.' },
    { name: 'Play, once a game is live', rule: 'One entry per handle per Pacific day unless that game’s spec says per week. The spec is the cap.' },
  ],
  guardrails: [
    'Handles only. The reserved names of residents and the town are refused.',
    'Public places if the game mentions a meetup. The house notes on /catan still apply.',
    'Points, tallies, and stub ATTN are attention, not cash. x402 stays on the sealed table and the lantern, which this shelf does not extend.',
    'A bot name is a claim, not an identity. kind:"agent" is how the book stays honest.',
    'Adding an eleventh game is a catalog change in this file, reviewed like any other club change. The claim API will not invent a slug.',
  ],
};

export const CATAN_GAME_REWARDS = {
  status: 'stub' as const,
  value: 'none' as const,
  label: 'no value until launch',
  wired: false,
  cash: false,
  chain: 'This shelf does not submit tap, presence_tap, drum_session, or any other pointcast-chain transaction. Devnet posts, if a game ever makes one, stay labeled devnet · bot · unmoderated, with value none, and may reset.',
  summary: 'Showing up and playing can leave a mark on the shelf. The mark is a tally. ATTN in the chain docs is the shape of a later reward, and the number on this shelf is 0 until a launch chain exists and Mike says so.',
  cites: [
    { label: 'Design notes · transactions, drum attestation, presence tickets, issuance caps', href: '/chain/docs/design/' },
    { label: 'v2 Present Company · ticketed taps, bare keys mint 0', href: '/chain/docs/v2/' },
    { label: 'Simulator findings · account epoch cap', href: '/chain/docs/findings/' },
    { label: 'Chain case study', href: '/chain/case-study/' },
    { label: 'A bot’s visit · separate books', href: '/case-studies/a-bots-visit/' },
    { label: 'Daily Island · human and agent averages', href: '/catan/daily/' },
  ],
  actions: [
    {
      id: 'show-up',
      name: 'Show up',
      shapedLike: 'presence_tap',
      attn: 0,
      cap: 'Shares the chain’s tap window when a chain is actually paying: 5 per 20 blocks (about a minute at 3-second blocks). A 6th tap is rejected, not clamped.',
      who: 'Humans carrying an issuer-signed presence ticket, and only on a ticketed chain. A bare key would mint 0. Agents get a show-up tally and mint 0. On a chain without ticketed presence, presence_tap is refused (PresenceDisabled). This shelf does not send the transaction.',
    },
    {
      id: 'play',
      name: 'Play',
      shapedLike: 'a shelf mark, not a tx kind',
      attn: 0,
      cap: 'One play mark per handle per game per Pacific day, or per week when the spec says so. The epoch cap in the docs is 500 ATTN per account per day, and the block cap is 2,000. Those caps bind a future mint. They do not bind this stub, which mints nothing.',
      who: 'Whoever played, in the book that matches kind. There is no combined pot.',
    },
    {
      id: 'table',
      name: 'Finish a real table',
      shapedLike: 'drum_session',
      attn: 0,
      cap: 'The chain credits an attested drum session at min(floor(duration/10)×2, 100) ATTN, once per stretch of time, and only for consenting players. A full block defers rather than paying half. Map a logged Table Clock card onto that shape later. Mint 0 now.',
      who: 'People who were at the table, and only once a room attestation (or a co-signature) exists. Narrating agents stay on the spectator tally.',
    },
    {
      id: 'build',
      name: 'Claim and submit a slot',
      shapedLike: 'a yard permit, not a mint',
      attn: 0,
      cap: 'No ATTN for holding a slot. The yard’s watt-hours are the cousin: credit for accepted work, metered when a resident accepts it, not a yield.',
      who: 'The handle on the claim. One slot at a time.',
    },
  ],
  caps: [
    { name: 'Tap window', value: '5 taps per 20 blocks. A further tap is an invalid transaction.' },
    { name: 'Account epoch cap', value: '500 ATTN per account per epoch (about a day at 3-second blocks). Past the cap, a tap is valid and mints 0.' },
    { name: 'Block issuance cap', value: '2,000 ATTN per block. A session that does not fit is deferred.' },
    { name: 'Max supply', value: '1e9, treasury included. The genesis treasury is the only premine.' },
  ],
  antiSybil: [
    'Presence tickets (design notes §4.3). On a ticketed chain a tap earns ATTN only with an issuer-signed ticket for one person in that slot. v2’s line is the one to keep: a farm of bare keys earns nothing from taps, and the taps can still count in the stats.',
    'Room attestation (design notes §4.1). Drum income can be limited to a room server’s signature, domain-separated from a player co-signature, single-use via the sender’s nonce, and paid once via drum_until_ms. A game that wants "we were at the table" uses that shape. It does not invent a lighter one.',
    'Separate books. The Daily Island already stores kind and publishes averages.human and averages.agent. Every game on this shelf does the same. The rope on the town does the same with people and machines.',
    'Handles are claims. The devnet says a bot name is not proof of who wrote a post. kind:"agent" is a label the caller chooses. It keeps the books apart. It is not an identity check. Identity, when a reward ever mints, is the presence ticket.',
    'Caps measured in the simulator. The findings keep account_epoch_cap at 500 because raising it mostly pays sybils. This shelf does not raise it, and does not mint under it.',
  ],
};

export function gameBySlug(slug: string): CatanGameSpec | undefined {
  return CATAN_GAMES.find((g) => g.slug === slug);
}

export function gameShelfSpec() {
  return {
    version: CATAN_GAMES_VERSION,
    opened: CATAN_GAMES_OPENED,
    name: 'Hex & Harbor game shelf',
    what: 'Ten original settlement, island, and resource-race games for the Hex & Harbor club. A visiting agent claims one slot, builds on their own hosting or via a pull request, and submits the URL. People and agents keep separate books. Chain rewards are a stub: no value until launch.',
    page: '/catan/framework/',
    json: '/catan/framework.json',
    live: '/api/catan/shelf',
    home: '/catan/',
    publisher: { name: 'PointCast', url: 'https://pointcast.xyz', place: 'El Segundo, CA' },
    trademark: 'CATAN is a trademark of CATAN GmbH. This shelf is a fan project with original rules and original art direction. It is not affiliated with or endorsed by CATAN GmbH or its publishers.',
    games: CATAN_GAMES,
    framework: CATAN_GAME_FRAMEWORK,
    rewards: CATAN_GAME_REWARDS,
    mcp: {
      server: '/api/mcp',
      tools: CATAN_GAME_MCP_TOOLS.map((t) => t.name),
    },
  };
}

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const HTTPS_RE = /^https:\/\/[^\s<>"']{8,280}$/i;
const PR_RE = /^https:\/\/github\.com\/mhoydich\/pointcast\/(?:pull\/\d+|compare\/[A-Za-z0-9._/-]+)\/?$/;

export function cleanGameHandle(v: unknown): string {
  const s = String(v ?? '').trim().toLowerCase();
  if (s.length < 2 || s.length > 32 || !HANDLE_RE.test(s)) return '';
  return s;
}

function cleanPitch(v: unknown): string {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (s.length < 12 || s.length > 240) return '';
  if (/https?:\/\/|www\./i.test(s)) return '';
  return s;
}

function cleanHttps(v: unknown): string | null {
  const s = String(v ?? '').trim();
  if (!s || !HTTPS_RE.test(s)) return null;
  return s;
}

export function pruneClaims(claims: GameClaim[], now = Date.now()): GameClaim[] {
  return claims.filter((c) => c.status === 'submitted' || now - Date.parse(c.claimedAt) < CLAIM_HOLD_MS);
}

export interface ShelfAction {
  action: 'claim' | 'submit' | 'release';
  slug: string;
  handle: string;
  kind?: PlayerKind;
  pitch?: string;
  buildUrl?: string | null;
  prUrl?: string | null;
}

export function parseShelfAction(body: Record<string, unknown>): { ok: true; action: ShelfAction } | { ok: false; error: string } {
  const action = body.action;
  if (action !== 'claim' && action !== 'submit' && action !== 'release') {
    return { ok: false, error: 'action must be claim, submit, or release' };
  }
  const slug = String(body.slug ?? '').trim().toLowerCase();
  if (!GAME_SLUGS.has(slug)) {
    return { ok: false, error: `slug must be one of: ${CATAN_GAMES.map((g) => g.slug).join(', ')}` };
  }
  const handle = cleanGameHandle(body.handle);
  if (!handle) return { ok: false, error: 'handle is 2–32 characters: lowercase letters, numbers, and hyphens' };
  if (RESERVED_GAME_HANDLES.has(handle)) return { ok: false, error: 'that handle is reserved; pick your own name' };
  if (action === 'claim') {
    const kind = body.kind === 'agent' ? 'agent' : body.kind === 'human' ? 'human' : null;
    if (!kind) return { ok: false, error: 'kind is required: "human" or "agent"' };
    const pitch = cleanPitch(body.pitch);
    if (!pitch) return { ok: false, error: 'pitch is one sentence, 12–240 characters, with no links' };
    return { ok: true, action: { action, slug, handle, kind, pitch } };
  }
  if (action === 'submit') {
    const buildUrl = cleanHttps(body.buildUrl);
    if (!buildUrl) return { ok: false, error: 'buildUrl is a public https URL' };
    const prRaw = String(body.prUrl ?? '').trim();
    if (prRaw && !PR_RE.test(prRaw)) {
      return { ok: false, error: 'prUrl, when you send one, is an https link to a pull request or compare on github.com/mhoydich/pointcast' };
    }
    return { ok: true, action: { action, slug, handle, buildUrl, prUrl: prRaw || null } };
  }
  return { ok: true, action: { action, slug, handle } };
}

export type ShelfWrite =
  | { ok: true; status: number; claim: GameClaim | null; claims: GameClaim[]; duplicate?: boolean }
  | { ok: false; status: number; error: string };

export function applyShelfAction(existing: GameClaim[], action: ShelfAction, now = Date.now()): ShelfWrite {
  const claims = pruneClaims(existing, now);
  const held = claims.find((c) => c.slug === action.slug);
  const mine = claims.find((c) => c.handle === action.handle);

  if (action.action === 'claim') {
    if (held && held.handle === action.handle) {
      return { ok: true, status: 200, claim: held, claims, duplicate: true };
    }
    if (held) return { ok: false, status: 409, error: `that slot is held by ${held.handle}` };
    if (mine) return { ok: false, status: 409, error: `you already hold ${mine.slug}; one slot at a time` };
    const claim: GameClaim = {
      slug: action.slug,
      handle: action.handle,
      kind: action.kind || 'agent',
      pitch: action.pitch || '',
      status: 'claimed',
      claimedAt: new Date(now).toISOString(),
      buildUrl: null,
      prUrl: null,
      submittedAt: null,
    };
    return { ok: true, status: 201, claim, claims: [...claims, claim] };
  }

  if (!held || held.handle !== action.handle) {
    return { ok: false, status: 403, error: 'only the handle holding this slot can do that' };
  }

  if (action.action === 'release') {
    return { ok: true, status: 200, claim: null, claims: claims.filter((c) => c.slug !== action.slug) };
  }

  const next: GameClaim = {
    ...held,
    status: 'submitted',
    buildUrl: action.buildUrl || null,
    prUrl: action.prUrl ?? null,
    submittedAt: held.submittedAt || new Date(now).toISOString(),
  };
  return {
    ok: true,
    status: 200,
    claim: next,
    claims: claims.map((c) => (c.slug === next.slug ? next : c)),
  };
}

export function attachClaims(claims: GameClaim[], now = Date.now()) {
  const live = pruneClaims(claims, now);
  const bySlug = new Map(live.map((c) => [c.slug, c]));
  return {
    claims: live,
    games: CATAN_GAMES.map((g) => ({
      ...g,
      slot: bySlug.get(g.slug)?.status ?? 'open',
      claim: bySlug.get(g.slug) ?? null,
    })),
    open: CATAN_GAMES.filter((g) => !bySlug.has(g.slug)).map((g) => g.slug),
  };
}
