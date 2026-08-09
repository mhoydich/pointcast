import type { APIRoute } from 'astro';

import {
  BLOOM_PARTY,
  HEAT_THRESHOLD,
  HOW_TO_PLAY,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PACES,
  POINTS,
  ROUNDS_PER_GAME,
  SHORTLIST_SIZE,
  VOICES,
  buildMs,
  playbackMs,
  voteMs,
} from '../lib/bloom-party';

/**
 * /bloom-party.json — the machine twin of the game.
 *
 * Everything here is derived from `src/lib/bloom-party.ts`, the same module
 * the page and the Durable Object import, so this endpoint cannot drift from
 * what actually runs.
 */
const payload = {
  schema: 'pointcast.game/v1',
  name: BLOOM_PARTY.name,
  tagline: BLOOM_PARTY.tagline,
  canonical: 'https://pointcast.xyz/bloom-party',
  inviteShape: 'https://pointcast.xyz/bloom-party?room={SIX-LETTER-CODE}',
  stageShape: 'https://pointcast.xyz/bloom-party?room={SIX-LETTER-CODE}&view=stage',
  soloShape: 'https://pointcast.xyz/bloom-party?solo=1',
  websocket: 'wss://pointcast.xyz/api/bloom/room?room={CODE}&sid={client-uuid}&role=player|stage',
  stats: 'https://pointcast.xyz/api/bloom/room?room={CODE}&stats=1',
  protocolVersion: BLOOM_PARTY.protocolVersion,

  players: { min: MIN_PLAYERS, max: MAX_PLAYERS, recommended: '4 to 15, all in the same room' },
  rounds: ROUNDS_PER_GAME,
  roomCode: 'six uppercase base32 characters; O, I, L and U are excluded so a code read aloud types correctly',

  loop: 'Match the vibe — a prompt card appears, everyone builds a short bloom on their own phone, all blooms play back anonymously, the room votes on the best match.',
  howToPlay: HOW_TO_PLAY,

  vocabulary: {
    voices: VOICES.map((voice) => voice.label),
    paces: PACES.map((pace) => pace.label),
    knobs: ['brightness', 'drift', 'density', 'key', 'seed'],
    inspiredBy: BLOOM_PARTY.inspiredBy,
    review: BLOOM_PARTY.review,
  },

  scaling: {
    note: 'Phase lengths are a function of how many phones are connected, and every phase also ends early the moment everyone has acted. That is what makes the same game work at four players and at fifteen.',
    buildMs: { at4: buildMs(4), at15: buildMs(15) },
    playbackMsPerBloom: { at4: playbackMs(4), at15: playbackMs(15) },
    voteMs: { at4: voteMs(4), at15: voteMs(SHORTLIST_SIZE) },
    heatThreshold: HEAT_THRESHOLD,
    shortlistSize: SHORTLIST_SIZE,
    ballotRule: `At ${HEAT_THRESHOLD} players or more, listeners tap "that one" during playback and only the top ${SHORTLIST_SIZE} reach the ballot, so the vote never grows past ${SHORTLIST_SIZE} options.`,
  },

  scoring: {
    perVoteReceived: POINTS.perVote,
    votedWithThePlurality: POINTS.plurality,
    unanimousRead: POINTS.unanimousRead,
    submitted: POINTS.submitted,
    firstToSubmit: POINTS.firstSubmit,
    selfVotes: 'rejected at the wire and dropped again at tally time',
  },

  clientRendering: [
    'Web Audio synthesis from a ten-field bloom spec',
    'seeded PRNG so every phone renders an identical bloom',
    'canvas petals drawn off the scheduled note list, not an analyser',
    'prefers-reduced-motion support',
    'iOS AudioContext unlock on first gesture',
  ],
  server: [
    'Cloudflare Durable Object per room code',
    'WebSocket Hibernation API',
    'phase deadlines on storage alarms, not timers',
    'SQLite roster, submissions, votes and scores',
    'bounded 1024-byte client frames, 10 messages per second per connection',
    'no audio ever crosses the wire — only the spec',
  ],

  privacy: 'No accounts. Room identity is derived from a browser-local UUID and lives only in that room. Nothing is published anywhere.',
  agentAccess: 'Read-only. The MCP tool bloom_party_state reports phase and standings; there is deliberately no write path, because an agent voting in a co-located party game is not a feature.',
  license: 'CC0-flavored PointCast surface',
};

export const GET: APIRoute = () => new Response(JSON.stringify(payload, null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
