// The oracles PointCast plans to build next, and why. Plain data: /oracles renders
// it, /oracles.json serves it. "evidence" cites the 2026-09-24 survey of all
// 16,874 x402 Bazaar listings; nothing here is live until it moves to LIVE_ORACLES.

export interface PlannedOracle {
  id: string;
  name: string;
  question: string;
  kind: 'useful' | 'playful';
  evidence: string;
  yieldLever: string;
  next: string;
}

export const ORACLE_ROADMAP: PlannedOracle[] = [
  {
    id: 'court', name: 'Court Oracle', kind: 'useful',
    question: 'What is this player\'s rec rating, and who did they beat, countersigned?',
    evidence: 'The Bazaar has no pickleball listings and no rec-league results.',
    yieldLever: 'Contributor dividend: the league or player who countersigned the match is the maker on every split that cites it.',
    next: 'Read tez-rally countersigned matches (Shadownet KT1C2EE…) and serve rating + match proofs.',
  },
  {
    id: 'open', name: 'Is It Open?', kind: 'useful',
    question: 'Is this El Segundo shop, court, or beach lot open right now, according to someone who checked today?',
    evidence: 'The one human-verified local listing in the Bazaar has 2 calls; nothing covers the South Bay.',
    yieldLever: 'Contributor dividend to the resident who checked; freshness decides the price.',
    next: 'A resident check-in form on PointCast and a signed "last seen open" record.',
  },
  {
    id: 'provenance', name: 'Provenance Oracle', kind: 'useful',
    question: 'Who made, minted, and has held this Tezos / Nouns / Visit Nouns object?',
    evidence: 'No listing in the Bazaar mentions Tezos; cultural provenance is absent.',
    yieldLever: 'Settlement premium when a marketplace or contract settles on the answer.',
    next: 'TzKT reads for the town\'s FA2 contracts, signed with the treasury key.',
  },
  {
    id: 'noun', name: 'Noun of the Question', kind: 'playful',
    question: 'Which Noun belongs to this string?',
    evidence: 'Fun endpoints are rare (under 30 fortunes and blessings), but the ones that exist draw about 70 real payers a month.',
    yieldLever: 'Volume at a tenth of a cent; a daily share card is the growth loop.',
    next: 'Wrap the NOUN SIGNAL generator (deterministic seed → noun.pics) with a signed card.',
  },
  {
    id: 'omen', name: 'Daily Omen', kind: 'playful',
    question: 'What does the spirit on duty say about today?',
    evidence: '"A Small Blessing" at $0.005 drew 116 calls in 30 days.',
    yieldLever: 'Ritual repeat buyers; one omen per spirit per day keeps it scarce.',
    next: 'Serve The Wild\'s daily line as a signed oracle (with The Wild\'s blessing).',
  },
  {
    id: 'drum', name: 'Drum Oracle', kind: 'playful',
    question: 'What is playing in town right now, and how hard is everyone drumming?',
    evidence: 'Music has 55 listings, almost all generation or scraping; nothing reports live rooms.',
    yieldLever: 'Also listable as a paid MCP tool: PointCast already runs an MCP server.',
    next: 'Wrap drum_now_playing + drum_global_count + station_on_air into one signed answer.',
  },
  {
    id: 'charts', name: 'Chart Room Consensus', kind: 'useful',
    question: 'Is this song rising across the public charts this week?',
    evidence: 'Music reference data is thin in the Bazaar.',
    yieldLever: 'Bulk access for agent platforms under the usage-capped `upto` scheme.',
    next: 'Serve /charts consensus and movement with sources.',
  },
];

export const ORACLE_YIELD_MODEL = [
  { lever: 'Per-call fees', honest: 'Small on their own. The median Bazaar listing got one call in 30 days; a good niche oracle might see a few hundred a month, which is a few dollars.' },
  { lever: 'Data dividends', honest: 'The network half of every cent is recorded against the contributor whose facts answered it (splits.maker). That is the yield for residents, leagues, and observers. Paying it out is a separate, human step.' },
  { lever: 'Settlement premiums', honest: 'Answers a market or contract settles on are worth more than lookups. Comparable resolution endpoints charge $0.05–$0.25. Next: a bonded, final-only tier.' },
  { lever: 'Bulk access', honest: 'The `upto` scheme (764 options in the Bazaar) lets an agent platform pay for usage under a cap: one bundle for every PointCast oracle.' },
  { lever: 'Treasury float', honest: 'USDC held in the town wallet could earn on-chain interest. That is a risk decision for the operator, not something this page recommends.' },
];
