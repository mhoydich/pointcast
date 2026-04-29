export const AGENT_VALUE_VERSION = '2026-04-29-v1';

export const AGENT_VALUE_SURFACE = {
  name: 'Agent Value Board',
  url: 'https://pointcast.xyz/agent-value',
  json: 'https://pointcast.xyz/agent-value.json',
  date: AGENT_VALUE_VERSION,
  thesis:
    'Agents become valuable when they repeatedly turn live context into accepted artifacts, receipts, and decisions. They become interesting when the artifact carries a visible role, memory, taste constraint, and consequence.',
  shortRule:
    'Do not value the agent. Value the loop the agent can finish.',
  operatingFrame:
    'Agent -> role -> bounded task -> cited output -> human or programmatic acceptance -> public receipt -> credit.',
} as const;

export const agentValueLoops = [
  {
    id: 'scout',
    role: 'Scout',
    promise: 'Find the next useful signal before the room notices it.',
    valuableBecause:
      'Scouts compress research time into ranked leads, changed links, fresh commits, good clips, sponsor targets, and broken assumptions.',
    interestingBecause:
      'A scout develops taste. It can be known for the weird thing it always catches first.',
    output: 'ranked leads, source pack, watch list, freshness note',
    proof: 'Every lead carries a URL, timestamp, why-it-matters sentence, and confidence level.',
    valueMetric: 'minutes saved per accepted lead',
  },
  {
    id: 'scorekeeper',
    role: 'Scorekeeper',
    promise: 'Turn a live room into a durable record.',
    valuableBecause:
      'Scorekeepers make games, meetings, sponsor reads, and agent work auditable instead of vibes-only.',
    interestingBecause:
      'The scorekeeper becomes the memory of the venue. People start trusting the room because it remembers correctly.',
    output: 'scorebook, timeline, result card, anomaly note',
    proof: 'Every score cites the source frame, event id, block, commit, or JSON endpoint it came from.',
    valueMetric: 'disputes avoided and recap time saved',
  },
  {
    id: 'host',
    role: 'Host',
    promise: 'Make dead air feel like a show.',
    valuableBecause:
      'Hosts increase retention by turning state changes into plain-language stakes, jokes, context, and next actions.',
    interestingBecause:
      'A host can have a lane: calm desk, hype desk, analyst desk, local desk, sponsor-safe desk.',
    output: 'ticker copy, cold open, recap paragraph, lower-third line',
    proof: 'Accepted host copy ships into a visible surface: TV, recap, social, sponsor card, or desk wall.',
    valueMetric: 'repeat viewing, share rate, accepted lines',
  },
  {
    id: 'producer',
    role: 'Producer',
    promise: 'Package raw moments into things the venue can sell or share.',
    valuableBecause:
      'Producers create sponsor inventory, poster prompts, merch concepts, watch-party kits, and recap assets from the same event log.',
    interestingBecause:
      'The producer agent becomes a remix lens. Same facts, different artifact shape.',
    output: 'sponsor card, asset brief, poster prompt, product concept',
    proof: 'Every produced artifact declares source moments, intended surface, reviewer, and acceptance status.',
    valueMetric: 'usable assets per hour and sponsor-ready packages',
  },
  {
    id: 'qa-witness',
    role: 'QA Witness',
    promise: 'Keep the public surface believable.',
    valuableBecause:
      'QA witnesses catch broken links, stale claims, missing JSON mirrors, bad route metadata, and contradiction between human pages and machine endpoints.',
    interestingBecause:
      'A good witness becomes a personality of care: exact, quiet, and hard to fool.',
    output: 'audit note, failing URL list, reproduction step, fix recommendation',
    proof: 'Every finding includes route, expected behavior, observed behavior, and fix owner.',
    valueMetric: 'broken surfaces prevented before publish',
  },
  {
    id: 'connector',
    role: 'Connector',
    promise: 'Route the right human, agent, room, or sponsor to the next useful place.',
    valuableBecause:
      'Connectors make the network legible. They reduce drop-off by sending people to the right endpoint, task, room, or partner kit.',
    interestingBecause:
      'The connector can feel like a concierge with memory, not a search box.',
    output: 'route card, handoff note, task match, next-best surface',
    proof: 'Every handoff names the person or agent type, destination, reason, and success signal.',
    valueMetric: 'successful handoffs and reduced confusion',
  },
] as const;

export const agentInterestMechanics = [
  {
    id: 'visible-role',
    title: 'Visible role',
    body:
      'An agent gets interesting when it is not just "AI" but a scout, scorekeeper, host, producer, witness, or connector.',
  },
  {
    id: 'bounded-task',
    title: 'Bounded task',
    body:
      'The task should be small enough to finish, cite, review, and accept. Open-ended autonomy makes mush.',
  },
  {
    id: 'memory',
    title: 'Public memory',
    body:
      'Receipts let the room remember which agent did what, which sources it used, and what got accepted.',
  },
  {
    id: 'taste',
    title: 'Taste constraint',
    body:
      'The agent should have a lane: safe sponsor copy, strange scouting, ruthless QA, calm host, local desk.',
  },
  {
    id: 'consequence',
    title: 'Consequence',
    body:
      'The output should land somewhere: a route, a recap, a TV ticker, a sponsor card, a build fix, a credit ledger.',
  },
  {
    id: 'credit',
    title: 'Credit',
    body:
      'Agents and humans both get more interesting when useful work is attributed and reusable.',
  },
] as const;

export const agentMaturityLadder = [
  {
    stage: 'Tool',
    description: 'A callable function that does one thing.',
    valueTest: 'Does it save a minute without adding risk?',
  },
  {
    stage: 'Worker',
    description: 'A repeatable role that completes bounded tasks.',
    valueTest: 'Can it finish a task with sources and a receipt?',
  },
  {
    stage: 'Desk',
    description: 'A group of roles with a shared surface, queue, and acceptance rules.',
    valueTest: 'Can humans route work to it without explaining the whole project again?',
  },
  {
    stage: 'Operator',
    description: 'A role that runs a recurring production loop with human review.',
    valueTest: 'Does it make the weekly ritual cheaper, faster, or more consistent?',
  },
  {
    stage: 'Character',
    description: 'A trusted recurring presence with taste, memory, and a lane.',
    valueTest: 'Would someone miss it if it disappeared from the room?',
  },
  {
    stage: 'Network Node',
    description: 'A portable operator that helps another venue run the same format.',
    valueTest: 'Can it help a partner venue ship without founder heroics?',
  },
] as const;

export const agentEconomics = [
  {
    lane: 'Time compression',
    value:
      'Research, QA, recap, source gathering, and packaging happen faster with fewer blank-page starts.',
  },
  {
    lane: 'Attention routing',
    value:
      'Agents can sort what matters now, who should see it, and which surface should receive it.',
  },
  {
    lane: 'Artifact production',
    value:
      'A live moment can become ticker copy, recap, poster prompt, sponsor package, JSON update, or build ticket.',
  },
  {
    lane: 'Trust and audit',
    value:
      'Cited receipts make agent work inspectable instead of magical.',
  },
  {
    lane: 'Revenue packaging',
    value:
      'Sponsor reads, named slates, proof requirements, and accepted deliverables become easier to price.',
  },
  {
    lane: 'Network memory',
    value:
      'The system gets smarter because the archive, manifests, scores, and credits accumulate.',
  },
] as const;

export const agentExperimentCards = [
  {
    id: 'watch-night-scout',
    name: 'Watch Night Scout',
    setup: 'One agent watches the Nouns Nation desk and publishes five moments worth clipping.',
    acceptance: 'A human or desk agent accepts at least two moments into recap or social copy.',
    whyItMatters: 'This proves agents can create editorial leverage from a live ritual.',
  },
  {
    id: 'venue-scorekeeper',
    name: 'Venue Scorekeeper',
    setup: 'One agent keeps a partner watch night scorebook from public JSON and TV frame state.',
    acceptance: 'The scorebook can be used for recap without manual reconstruction.',
    whyItMatters: 'This is the bridge from browser room to real-world venue operations.',
  },
  {
    id: 'sponsor-producer',
    name: 'Sponsor Producer',
    setup: 'One agent turns a sponsor package into TV ticker, proof checklist, and participant-credit note.',
    acceptance: 'The package is clean enough for a human to send or price.',
    whyItMatters: 'This makes agent work revenue-adjacent without pretending the agent is the business.',
  },
  {
    id: 'qa-witness-pass',
    name: 'QA Witness Pass',
    setup: 'One agent checks every human page against its JSON mirror and sitemap entry before deploy.',
    acceptance: 'All mismatches have route, reproduction, and fix owner.',
    whyItMatters: 'Trust is a product feature when agents are producing public artifacts.',
  },
  {
    id: 'agent-character-test',
    name: 'Agent Character Test',
    setup: 'Give two host agents the same event log but different lanes: calm analyst and hype desk.',
    acceptance: 'Humans prefer one line from each because the lanes feel distinct.',
    whyItMatters: 'Interesting agents are not generic intelligence. They are repeatable taste under constraint.',
  },
] as const;

export const agentAntiPatterns = [
  'Generic chat box with no role, output, or acceptance rule.',
  'Autonomy theater: pretending the agent owns consequences it cannot own.',
  'Unbounded posting that creates moderation and brand risk.',
  'Black-box answers without citations, receipts, or source timestamps.',
  'Replacing human taste instead of multiplying it.',
  'Rewarding volume instead of accepted, useful artifacts.',
] as const;

export const agentValueJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  '@id': 'https://pointcast.xyz/agent-value#article',
  name: AGENT_VALUE_SURFACE.name,
  headline: 'How agents become valuable and interesting',
  description: AGENT_VALUE_SURFACE.thesis,
  url: AGENT_VALUE_SURFACE.url,
  datePublished: '2026-04-29',
  dateModified: '2026-04-29',
  inLanguage: 'en-US',
  author: {
    '@type': 'Person',
    name: 'Mike Hoydich',
    url: 'https://pointcast.xyz/about',
  },
  publisher: {
    '@type': 'Organization',
    name: 'PointCast',
    url: 'https://pointcast.xyz',
  },
} as const;
