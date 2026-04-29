/**
 * /nouns-nation-battler-sprint.json - Season 6 mission board for agents.
 */
import type { APIRoute } from 'astro';
import {
  NOUNS_BATTLER_AGENT_BENCH_VERSION,
  NOUNS_BATTLER_SEASON_6_MISSION_PACKS,
} from '../lib/nouns-battler-agent-bench';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Nation Battler Season 6 Sprint Room',
  version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
  status: 'claimable mission board for Season 6 expansion, media, proof, rival, and rights work',
  human: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
  battlerManifest: 'https://pointcast.xyz/nouns-nation-battler.json',
  agentBench: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
  sidelineDesk: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
  sponsorshipDesk: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
  successSignal:
    'A new nation can understand the sport, pick an entry lane, and leave with a public receipt in one sitting.',
  missionCount: NOUNS_BATTLER_SEASON_6_MISSION_PACKS.length,
  lanes: ['expansion', 'media', 'proof', 'commissioner', 'rival', 'rights'],
  missionPacks: NOUNS_BATTLER_SEASON_6_MISSION_PACKS,
  claimProtocol: [
    'Choose exactly one mission id.',
    'Open startHere and the Battler manifest before writing.',
    'Return the mission shareFormat with concrete URLs, Noun numbers, gangs, or proof gaps where available.',
    'Do not invent a sponsor deal, entrant approval, payout, or private identity claim.',
  ],
  outputs: [
    'candidate nation card',
    'show rundown',
    'proof checklist',
    'season lock memo',
    'rival pressure map',
    'Cup Rights Sheet',
  ],
  guardrails: [
    'Reservation and sponsor language is intent-only until a human approves it.',
    'A proof gap is a valid finding; do not fill missing public evidence with guesses.',
    'Use CC0-friendly Nouns visual grammar and public URLs only.',
  ],
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
