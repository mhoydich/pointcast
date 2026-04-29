export const NOC_VERSION = '0.2.0';

export const NOC_STORAGE_KEYS = {
  packet: 'pc:noc:last-agent-packet',
  receipt: 'pc:noc:last-fixture-receipt',
  club: 'pc:noc:selected-club',
  liveState: 'pc:noc:live-match-state',
  dispatch: 'pc:noc:last-agent-dispatch',
};

export const NOC_ENDPOINTS = {
  human: 'https://pointcast.xyz/nouns-open-circuit',
  json: 'https://pointcast.xyz/nouns-open-circuit.json',
  incumbent: 'https://pointcast.xyz/nouns-nation-battler',
  battlerJson: 'https://pointcast.xyz/nouns-nation-battler.json',
  spriteManifest: 'https://pointcast.xyz/games/nouns-nation-battler/assets/manifest.json',
  agents: 'https://pointcast.xyz/agents.json',
  forAgents: 'https://pointcast.xyz/for-agents',
};

export const NOC_PRINCIPLES = [
  'Same Nouns player pool; different league constitution.',
  'Agents can coach, scout, cast, audit, and archive without owning the result.',
  'Every fixture produces a tactics packet and a receipt-shaped match record.',
  'Agent shifts are explicit: proposal, action, receipt, citation.',
  'No betting, no wagering, no financial game loop in v0.',
  'Human fans follow clubs; machine readers follow endpoints and receipts.',
] as const;

export const NOC_V2_RELEASE = {
  label: 'v2 agent circuit desk',
  posture: 'playable local prototype, publishable protocol surface',
  capabilities: [
    'live agent shift simulator',
    'shareable fixture receipt pages',
    'agent handoff protocol',
    'v2 tactics and receipt schemas',
    'machine-readable match-page routes',
  ],
} as const;

export const NOC_CLUBS = [
  {
    slug: 'beach-protocol',
    name: 'Beach Protocol Club',
    code: 'BPC',
    color: '#185fa5',
    accent: '#f5c84b',
    operator: 'Codex Coach',
    home: 'El Segundo Pier',
    doctrine: 'Center press, fast runners, auditable receipts.',
    record: '3-1',
    heat: 76,
    nounIds: [0, 7, 14, 21, 28, 35],
    image: '/games/nouns-nation-battler/assets/noun-0.svg',
  },
  {
    slug: 'fork-garden',
    name: 'Fork Garden Athletic',
    code: 'FGA',
    color: '#2f8f5f',
    accent: '#d7ff3f',
    operator: 'Garden Scout',
    home: 'Greenhouse Lane',
    doctrine: 'Slow pressure, healer locks, morale farming.',
    record: '2-2',
    heat: 63,
    nounIds: [1, 8, 15, 22, 29, 36],
    image: '/games/nouns-nation-battler/assets/noun-8.svg',
  },
  {
    slug: 'auction-night',
    name: 'Auction Night FC',
    code: 'ANF',
    color: '#2f3a4f',
    accent: '#9bc7ff',
    operator: 'Claude Desk',
    home: 'Midnight House',
    doctrine: 'Late-game captains, dense scouting, one clean surge.',
    record: '2-1',
    heat: 71,
    nounIds: [2, 9, 16, 23, 30, 37],
    image: '/games/nouns-nation-battler/assets/noun-16.svg',
  },
  {
    slug: 'mint-works',
    name: 'Mint Works Union',
    code: 'MWU',
    color: '#13a6a1',
    accent: '#fffdf5',
    operator: 'Manus Ops',
    home: 'Fresh Mint Yard',
    doctrine: 'Revive windows, roster repair, clean logs.',
    record: '1-2',
    heat: 58,
    nounIds: [3, 10, 17, 24, 31, 38],
    image: '/games/nouns-nation-battler/assets/noun-24.svg',
  },
  {
    slug: 'pixel-standard',
    name: 'Pixel Standard',
    code: 'PXS',
    color: '#8b5cf6',
    accent: '#ffe987',
    operator: 'Sparrow Model',
    home: 'Block Nine',
    doctrine: 'High-variance volleys, compact packets, strange wins.',
    record: '2-3',
    heat: 66,
    nounIds: [4, 11, 18, 25, 32, 39],
    image: '/games/nouns-nation-battler/assets/noun-32.svg',
  },
  {
    slug: 'prop-house-city',
    name: 'Prop House City',
    code: 'PHC',
    color: '#ef7d2d',
    accent: '#ffd2a8',
    operator: 'Grant Writer',
    home: 'Sunset Board',
    doctrine: 'Fund the flank, reward the assist, publish the proof.',
    record: '4-0',
    heat: 88,
    nounIds: [5, 12, 19, 26, 33, 40],
    image: '/games/nouns-nation-battler/assets/noun-40.svg',
  },
] as const;

export const NOC_AGENTS = [
  {
    slug: 'scout',
    label: 'Scout',
    callSign: 'SCOUT-01',
    owner: 'open agent slot',
    input: 'sprites, fixture history, club doctrine',
    output: 'player notes, matchup edges, role warnings',
    trigger: 'before lineups and every third shift',
    autonomy: 'recommends only',
    status: 'queued',
  },
  {
    slug: 'coach',
    label: 'Coach',
    callSign: 'COACH-02',
    owner: 'club operator',
    input: 'scout sheet, opponent packet, risk budget',
    output: 'formation, target policy, special timing',
    trigger: 'kickoff, halftime, or after a two-point swing',
    autonomy: 'can alter tactics packet',
    status: 'live',
  },
  {
    slug: 'caster',
    label: 'Caster',
    callSign: 'CAST-03',
    owner: 'PointCast desk',
    input: 'match events, standings, rivalry tags',
    output: 'lower thirds, recap, quote sheet',
    trigger: 'every scored shift and final whistle',
    autonomy: 'publishes commentary artifacts',
    status: 'live',
  },
  {
    slug: 'auditor',
    label: 'Auditor',
    callSign: 'AUDIT-04',
    owner: 'neutral agent',
    input: 'seed, tactics packet, event log',
    output: 'receipt hash, reproducibility note',
    trigger: 'after receipt issue',
    autonomy: 'can flag a receipt',
    status: 'design',
  },
  {
    slug: 'archivist',
    label: 'Archivist',
    callSign: 'ARCH-05',
    owner: 'federated node',
    input: 'receipt, recap, sprite refs',
    output: 'json mirror, feed item, citation',
    trigger: 'after audit pass',
    autonomy: 'can mirror public artifacts',
    status: 'design',
  },
] as const;

export const NOC_AGENT_SHIFT_PROTOCOL = [
  {
    phase: 'scout',
    agent: 'SCOUT-01',
    action: 'identify matchup edge',
    artifact: 'edge-note',
    scoreboardEffect: 'momentum',
  },
  {
    phase: 'coach',
    agent: 'COACH-02',
    action: 'commit formation adjustment',
    artifact: 'packet-delta',
    scoreboardEffect: 'pressure',
  },
  {
    phase: 'caster',
    agent: 'CAST-03',
    action: 'publish live lower third',
    artifact: 'broadcast-note',
    scoreboardEffect: 'heat',
  },
  {
    phase: 'auditor',
    agent: 'AUDIT-04',
    action: 'hash event fragment',
    artifact: 'audit-fragment',
    scoreboardEffect: 'trust',
  },
  {
    phase: 'archivist',
    agent: 'ARCH-05',
    action: 'mirror receipt pointer',
    artifact: 'archive-pointer',
    scoreboardEffect: 'memory',
  },
] as const;

export const NOC_AGENT_HANDOFFS = [
  {
    from: 'Scout',
    to: 'Coach',
    trigger: 'weak-side Noun exposed',
    artifact: 'matchup edge note',
  },
  {
    from: 'Coach',
    to: 'Caster',
    trigger: 'formation changes the match tempo',
    artifact: 'public tactics delta',
  },
  {
    from: 'Caster',
    to: 'Auditor',
    trigger: 'score changes or final whistle',
    artifact: 'event transcript slice',
  },
  {
    from: 'Auditor',
    to: 'Archivist',
    trigger: 'receipt hash is reproducible',
    artifact: 'receipt citation bundle',
  },
] as const;

export const NOC_FIXTURES = [
  {
    id: 'noc-001',
    label: 'Opening Desk Match',
    day: 1,
    slot: 1,
    home: 'beach-protocol',
    away: 'prop-house-city',
    tag: 'Rivalry seed',
    seed: 'noc-open-001',
    tempo: 'high press',
    route: '/nouns-open-circuit/match/noc-001',
  },
  {
    id: 'noc-002',
    label: 'Agent Bench Special',
    day: 1,
    slot: 2,
    home: 'auction-night',
    away: 'fork-garden',
    tag: 'Control test',
    seed: 'noc-open-002',
    tempo: 'slow pressure',
    route: '/nouns-open-circuit/match/noc-002',
  },
  {
    id: 'noc-003',
    label: 'Receipt Derby',
    day: 2,
    slot: 1,
    home: 'mint-works',
    away: 'pixel-standard',
    tag: 'Audit lane',
    seed: 'noc-open-003',
    tempo: 'receipt race',
    route: '/nouns-open-circuit/match/noc-003',
  },
] as const;

export const NOC_PACKET_SHAPE = {
  schema: 'pointcast-nouns-open-circuit-tactics-v2',
  fixtureId: 'string',
  club: 'club slug',
  operatorAgent: 'agent name or call sign',
  nounPool: ['integer noun sprite ids'],
  formation: 'center-press | split-lanes | healer-lock | late-captain',
  aggression: '0..100',
  riskBudget: '0..100',
  targetPolicy: 'nearest | weakest | healer-first | captain-first',
  agentHandoffs: ['Scout -> Coach -> Caster -> Auditor -> Archivist'],
  watchlist: ['noun sprite ids and matchup notes'],
  proofRefs: ['sprite manifest URL', 'club JSON URL', 'opponent packet URL'],
};

export const NOC_RECEIPT_SHAPE = {
  schema: 'pointcast-nouns-open-circuit-receipt-v2',
  fixtureId: 'string',
  seed: 'public deterministic seed',
  winner: 'club slug',
  score: 'surviving-nouns proxy',
  packetHash: 'short hash of tactics packet',
  eventHash: 'short hash of event transcript',
  agentTrail: ['agent phase receipts'],
  timeline: ['deterministic event transcript'],
  agents: ['coach', 'caster', 'auditor'],
  citation: 'stable route or block URL',
};

export const NOC_FORMATIONS = ['center-press', 'split-lanes', 'healer-lock', 'late-captain'] as const;
export const NOC_TARGET_POLICIES = ['nearest', 'weakest', 'healer-first', 'captain-first'] as const;

export type NocClub = (typeof NOC_CLUBS)[number];
export type NocFixture = (typeof NOC_FIXTURES)[number];

export function nocHashText(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function nocShortHash(value: unknown) {
  return nocHashText(JSON.stringify(value)).toString(36).padStart(7, '0').slice(0, 9);
}

export function nocClubBySlug(slug: string) {
  return NOC_CLUBS.find((club) => club.slug === slug) ?? NOC_CLUBS[0];
}

export function nocFixtureById(id: string) {
  return NOC_FIXTURES.find((fixture) => fixture.id === id) ?? NOC_FIXTURES[0];
}

export function nocFixtureForClub(clubSlug: string) {
  return NOC_FIXTURES.find((fixture) => fixture.home === clubSlug || fixture.away === clubSlug) ?? NOC_FIXTURES[0];
}

export function nocOpponentFor(clubSlug: string, fixtureId?: string) {
  const fixture = fixtureId ? nocFixtureById(fixtureId) : nocFixtureForClub(clubSlug);
  const opponentSlug = fixture.home === clubSlug ? fixture.away : fixture.home;
  return nocClubBySlug(opponentSlug);
}

export function buildNocTacticsPacket({
  clubSlug,
  fixtureId,
  nonce = 0,
}: {
  clubSlug: string;
  fixtureId?: string;
  nonce?: number;
}) {
  const club = nocClubBySlug(clubSlug);
  const fixture = fixtureId ? nocFixtureById(fixtureId) : nocFixtureForClub(club.slug);
  const base = nocHashText(`${fixture.seed}:${club.slug}:${nonce}`);
  const watchlist = club.nounIds.slice(0, 3).map((nounId, index) => ({
    nounId,
    note: `${NOC_AGENT_SHIFT_PROTOCOL[index]?.phase ?? 'scout'} lane watch`,
  }));

  return {
    schema: NOC_PACKET_SHAPE.schema,
    fixtureId: fixture.id,
    club: club.slug,
    operatorAgent: club.operator,
    nounPool: club.nounIds,
    formation: NOC_FORMATIONS[base % NOC_FORMATIONS.length],
    aggression: 42 + (base % 49),
    riskBudget: 35 + ((base >> 4) % 46),
    targetPolicy: NOC_TARGET_POLICIES[(base >> 3) % NOC_TARGET_POLICIES.length],
    agentHandoffs: NOC_AGENT_HANDOFFS,
    watchlist,
    proofRefs: [
      NOC_ENDPOINTS.spriteManifest,
      NOC_ENDPOINTS.json,
      NOC_ENDPOINTS.incumbent,
      `${NOC_ENDPOINTS.human}/match/${fixture.id}`,
    ],
  };
}

export function buildNocAgentTimeline({
  fixtureId,
  packet,
  shifts = 5,
}: {
  fixtureId: string;
  packet: ReturnType<typeof buildNocTacticsPacket>;
  shifts?: number;
}) {
  const fixture = nocFixtureById(fixtureId);
  const home = nocClubBySlug(fixture.home);
  const away = nocClubBySlug(fixture.away);

  return Array.from({ length: shifts }, (_, index) => {
    const protocol = NOC_AGENT_SHIFT_PROTOCOL[index % NOC_AGENT_SHIFT_PROTOCOL.length];
    const minute = 8 + index * 11;
    const base = nocHashText(`${fixture.seed}:${packet.club}:${packet.formation}:${protocol.agent}:${index}`);
    const actor = base % 2 === 0 ? home : away;
    const target = actor.slug === home.slug ? away : home;
    const delta = base % 5 === 0 ? 2 : base % 3 === 0 ? 1 : 0;
    return {
      minute,
      phase: protocol.phase,
      agent: protocol.agent,
      action: protocol.action,
      artifact: protocol.artifact,
      actor: actor.slug,
      target: target.slug,
      delta,
      note: `${protocol.agent} turns ${protocol.artifact} into ${protocol.scoreboardEffect} for ${actor.code}`,
    };
  });
}

export function buildNocFixtureReceipt(packet: ReturnType<typeof buildNocTacticsPacket>) {
  const fixture = nocFixtureById(packet.fixtureId);
  const home = nocClubBySlug(fixture.home);
  const away = nocClubBySlug(fixture.away);
  const timeline = buildNocAgentTimeline({ fixtureId: fixture.id, packet, shifts: 6 });
  const homeScore = timeline
    .filter((event) => event.actor === home.slug)
    .reduce((total, event) => total + event.delta, 12 + (home.heat % 5));
  const awayScore = timeline
    .filter((event) => event.actor === away.slug)
    .reduce((total, event) => total + event.delta, 12 + (away.heat % 5));
  const winner = homeScore >= awayScore ? home : away;
  const eventHash = nocShortHash({ fixture, timeline, homeScore, awayScore });

  return {
    schema: NOC_RECEIPT_SHAPE.schema,
    fixtureId: fixture.id,
    seed: fixture.seed,
    winner: winner.slug,
    score: `${homeScore}-${awayScore}`,
    packetHash: nocShortHash(packet),
    eventHash,
    agentTrail: timeline.map((event) => ({
      minute: event.minute,
      agent: event.agent,
      artifact: event.artifact,
      hash: nocShortHash(event),
    })),
    timeline,
    agents: ['scout', 'coach', 'caster', 'auditor', 'archivist'],
    citation: `${NOC_ENDPOINTS.human}/match/${fixture.id}`,
  };
}
