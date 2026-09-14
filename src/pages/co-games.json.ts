import type { APIRoute } from 'astro';
import { initial, observe, human, partner, threats } from '../lib/co-games-engine.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Co-games: Two against the rift',
  url: 'https://pointcast.xyz/co-games',
  status: 'free-browser-practice',
  description: 'A four-round Spellframe card encounter: a human chooses a spell, a partner proposes support, and the human confirms the pair.',
  availability: {
    practicePartner: true,
    pairedNativeSupport: true,
    providers: ['codex', 'claude'],
    requiresForNativeSupport: ['signed-in PointCast profile', 'paired awake computer', 'running companion', 'native subscription sign-in'],
    liveModelVerification: 'Each support response must report actualModels and a valid move before it is used.',
    publicMultiplayer: false,
    prizes: false,
    purchases: false,
  },
  state: { storage: 'browser memory; resets on reload', rulesAuthority: 'local deterministic engine', hiddenInformation: false },
  rules: {
    rounds: 4, teamHealth: 14, riftStrength: 18, incomingAttacks: threats,
    human, partner,
    humanStock: { ember: 3, root: 'unlimited', focus: 1 },
    supportStock: { echo: 2, ward: 2, mend: 1 },
    resolution: 'Heal first up to 14. Both attacks land simultaneously; block expires each round. Focus doubles only the next human damaging spell. Win with rift at 0 and team above 0; mutual destruction or a surviving rift after four rounds is a loss.',
  },
  agent: {
    protocol: 'pointcast.co-games.v1',
    observationExample: observe(initial(), 'ember', 'example-game'),
    responseExample: { gameId: 'example-game', revision: 0, selectedHuman: 'ember', support: 'ward', reason: 'Protect the team while your spell damages the rift.' },
    constraints: 'Echo gameId, revision, and selectedHuman exactly. Choose only from legalSupports. Do not provide changed stats. The human confirms the pair. Each round is an explicitly requested native text task; no automatic next-round inference.',
    transport: 'The signed-in game uses /api/me/ai-runtimes. There is no public game mutation endpoint.',
    setup: 'https://pointcast.xyz/me#my-ai',
  },
  links: { spellframe: 'https://pointcast.xyz/spellframe', play: 'https://pointcast.xyz/play' },
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
