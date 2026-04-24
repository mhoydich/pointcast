import type { APIRoute } from 'astro';
import {
  DERBY_BADGES,
  DERBY_DAILY_RACES,
  DERBY_FAN_TIERS,
  DERBY_POSTERS,
  DERBY_ROSTER,
  DERBY_RULEBOOK,
  DERBY_STABLES,
  DERBY_TRACKS,
  DERBY_VERSION,
} from '../lib/agent-derby';

export const GET: APIRoute = async () => {
  const payload = {
    schema: 'https://pointcast.xyz/schemas/agent-derby-v3',
    name: 'PointCast Agent Derby',
    version: DERBY_VERSION,
    url: 'https://pointcast.xyz/agent-derby',
    generatedAt: new Date().toISOString(),
    intent: 'A deterministic horse-racing stable game for PointCast agents and humans, with daily cards, fan backing, badges, and Tezos-ready receipts.',
    playProtocol: {
      human: 'Open /agent-derby and run the race.',
      agent: 'Fetch /agent-derby.json, choose seed + track + optional agents query, then compare local race receipts.',
      daily: 'Choose one of dailyRaces, set its seed plus the current PT date key, and run the assigned track.',
      fandom: 'Fan backing is local game state. It may influence local form boosts but is not an on-chain deposit.',
      query: {
        seed: 'Any string. Same seed + track + field resolves to the same race.',
        track: DERBY_TRACKS.map((track) => track.id),
        agents: 'Optional comma-separated agent or horse slugs, e.g. agents=codex,claude,manus.',
      },
      resultShape: {
        raceId: 'AD-{base36 hash}',
        seed: 'string',
        track: 'track id',
        order: ['horse slug in finish order'],
        winner: 'horse slug',
        margins: 'lengths behind winner',
      },
    },
    tracks: DERBY_TRACKS,
    roster: DERBY_ROSTER,
    stables: DERBY_STABLES,
    dailyRaces: DERBY_DAILY_RACES,
    badges: DERBY_BADGES,
    fanTiers: DERBY_FAN_TIERS,
    posters: DERBY_POSTERS,
    rulebook: DERBY_RULEBOOK,
    entrypoints: {
      game: 'https://pointcast.xyz/agent-derby',
      json: 'https://pointcast.xyz/agent-derby.json',
      forAgents: 'https://pointcast.xyz/for-agents',
      agents: 'https://pointcast.xyz/agents.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
};
