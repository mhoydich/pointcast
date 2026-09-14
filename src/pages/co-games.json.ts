import type { APIRoute } from 'astro';
import { initial, observe, human, partner, encounters, combos } from '../lib/co-games-engine.mjs';

export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Co-games: Noun battles',
  url: 'https://pointcast.xyz/co-games',
  status: 'free-browser-practice',
  description: 'Quick co-op Noun battles with changing rival crews, visible attacks, armor and spell combos. Choose a spell; your partner adds support and one click resolves the turn.',
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
  state: { storage: 'browser memory; resets on reload', rulesAuthority: 'local deterministic engine', hiddenInformation: false,
    sessionWins: 'local completed wins only; resets on reload; no leaderboard', defaultEncounter: 'garden',
    encounterCycle: ['garden', 'rush', 'shell', 'storm'],
    restart: 'A loss retries the same encounter; a win advances. New battle chooses the next different encounter. Each restart resets cards, health and move history with a new game ID.' },
  rules: {
    rounds: 4, teamHealth: 14, defaultRivalHealth: encounters.garden.enemy, incomingAttacks: encounters.garden.threats,
    encounters, combos,
    compatibility: 'Classic retains the original no-combo rules for existing engine callers; the browser starts in Garden.',
    human, partner,
    humanStock: { ember: 3, root: 'unlimited', focus: 1 },
    supportStock: { echo: 2, ward: 2, mend: 1 },
    resolution: 'Heal first up to 14, including any active combo healing. Focus doubles only the next human damaging spell; then add support damage and active combo damage. Subtract this encounter’s current-turn armor once from combined damage, minimum zero. Both attacks land simultaneously; block expires each round. Win with rivals at 0 and team above 0; mutual destruction or surviving rivals after four rounds is a loss.',
  },
  agent: {
    protocol: 'pointcast.co-games.v1',
    observationExample: observe(initial('garden'), 'ember', 'example-game'),
    responseExample: { gameId: 'example-game', revision: 0, selectedHuman: 'ember', support: 'ward', reason: 'Protect the team while your spell damages the rift.' },
    constraints: 'Echo gameId, revision, and selectedHuman exactly. Choose only from legalSupports. Use the observation’s encounter, armor, attacks and enabled combos. Do not provide changed stats. Clicking Play with AI authorizes one support request and automatic resolution of that single validated turn. Each following round requires another explicit click; no automatic next-round inference.',
    transport: 'The signed-in game uses /api/me/ai-runtimes. There is no public game mutation endpoint.',
    setup: 'https://pointcast.xyz/me#my-ai',
  },
  links: { spellframe: 'https://pointcast.xyz/spellframe', play: 'https://pointcast.xyz/play' },
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
