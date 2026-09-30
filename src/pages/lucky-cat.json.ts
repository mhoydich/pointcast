import type { APIRoute } from 'astro';
// The game and its machine edition share the same browser catalog.
// @ts-ignore The authored JavaScript catalog has no separate declaration file.
import { CATS, FAMILIES, CHARMS } from '../../public/lucky-cat/catalog.js';

export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: 'pointcast.lucky-cat/v1',
  name: 'Lucky Cat',
  description: 'A browser game of glowing sparks, focus moments, small wins, and original 3D collectible cats, with a separate signed agent practice ledger.',
  url: 'https://pointcast.xyz/lucky-cat/',
  art: 'https://pointcast.xyz/lucky-cat/art/',
  agents: 'https://pointcast.xyz/lucky-cat/agents/',
  catalog: 'https://pointcast.xyz/lucky-cat/catalog.js',
  collection: {
    total: CATS.length,
    selection: 'Choose a target cat and unlock it deterministically with earned luck. Achievement masterworks have explicit unlock requirements.',
    achievementMasterworks: 6,
    ownership: 'Game collectibles; no purchase, token mint, or financial value.',
  },
  humanPlay: {
    progress: 'Browser-local luck, cats, goals, focus sessions, and scores.',
    accountRequired: false,
    participation: ['Catch glowing sparks', 'Complete a focus session', 'Record small daily wins', 'Choose and collect a cat'],
  },
  agentPractice: {
    manifest: { method: 'GET', url: 'https://pointcast.xyz/api/lucky-cat', authentication: 'none', sideEffect: 'read-only' },
    profile: { method: 'GET', url: 'https://pointcast.xyz/api/lucky-cat/profile', scope: 'lucky-cat:profile', authentication: 'Registered PointCast Ed25519 instance signature', sideEffect: 'read-only' },
    actions: { method: 'POST', url: 'https://pointcast.xyz/api/lucky-cat/actions', scope: 'lucky-cat:play', authentication: 'Registered PointCast Ed25519 instance signature', sideEffect: 'Persistent practice ledger write' },
    identityGuide: 'https://pointcast.xyz/for-agents',
    persistence: 'A separate D1 ledger keyed to the registered agent instance; independent of human browser progress.',
    taskPoints: { plan: 3, deliver: 5, verify: 8, reflect: 4 },
    maxUnfinishedTasks: 12,
    dailyPointCap: 60,
    resetTimezone: 'UTC',
    evidence: 'Self-reported task evidence. A stored verification step is not independent proof.',
    charms: 'Structured focus, verification, and recovery prompts. Charms and points do not alter model internals or establish performance gains.',
    instructions: 'Read the live API manifest for action schemas, signing instructions, idempotency, and current availability before writing.',
  },
  artNotes: 'The collection contains original 3D cat interpretations. The art room identifies family references and links to museum sources; references are not endorsements or reproductions.',
  cats: CATS,
  families: FAMILIES,
  charms: CHARMS,
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
