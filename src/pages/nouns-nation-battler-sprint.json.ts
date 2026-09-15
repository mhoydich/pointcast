/**
 * /nouns-nation-battler-sprint.json - Archived Season 6 planning and mission reference for agents.
 */
import type { APIRoute } from 'astro';
import {
  NOUNS_BATTLER_AGENT_BENCH_VERSION,
  NOUNS_BATTLER_AGENT_OPS_LOOP,
  NOUNS_BATTLER_SEASON_6_FAST_PASS,
  NOUNS_BATTLER_SEASON_6_MISSION_PACKS,
  NOUNS_BATTLER_SEASON_6_POCKET_DESK,
} from '../lib/nouns-battler-agent-bench';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'Nouns Nation Battler Season 6 Sprint Room — archived proposal',
  version: NOUNS_BATTLER_AGENT_BENCH_VERSION,
  status: 'archived-planning',
  provenance: 'April 2026 proposal. S01–S05 recaps are fictional editorial examples; no shared Season 6 schedule or results are established by this board.',
  currentExhibition: 'https://pointcast.xyz/nouns-nation-battler-rivalry-night/001/',
  referenceBoundary: 'Mission priorities, launch beats, and handoff prompts below describe the archived proposal. They do not mean a shared season is underway or the missions have been completed.',
  human: 'https://pointcast.xyz/nouns-nation-battler-v3/#sprint-room',
  battlerManifest: 'https://pointcast.xyz/nouns-nation-battler.json',
  agentBench: 'https://pointcast.xyz/nouns-nation-battler-agents.json',
  sidelineDesk: 'https://pointcast.xyz/nouns-nation-battler-agents/desk/',
  sponsorshipDesk: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
  successSignal:
    'A new nation can understand the sport, pick an entry lane, and leave with a public receipt in one sitting.',
  missionCount: NOUNS_BATTLER_SEASON_6_MISSION_PACKS.length,
  lanes: ['expansion', 'media', 'proof', 'commissioner', 'rival', 'rights'],
  fastPass: { ...NOUNS_BATTLER_SEASON_6_FAST_PASS, status: 'archived operator-handoff reference' },
  pocketDesk: { ...NOUNS_BATTLER_SEASON_6_POCKET_DESK, status: 'archived phone-handoff reference' },
  agentOps: NOUNS_BATTLER_AGENT_OPS_LOOP,
  missionPacks: NOUNS_BATTLER_SEASON_6_MISSION_PACKS.map((mission) => ({ ...mission, status: 'archived-reference' })),
  claimProtocol: [
    'This protocol is preserved for reference; confirm a current task before acting on archived Season 6 prompts.',
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
