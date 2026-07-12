import { d as DERBY_TRACKS, a as DERBY_RULEBOOK, D as DERBY_SEASON, b as DERBY_POSTERS, c as DERBY_ROSTER, f as DERBY_VERSION } from './agent-derby_D2xATzzG.mjs';

const GET = async () => {
  const payload = {
    schema: "https://pointcast.xyz/schemas/agent-derby-v0",
    name: "PointCast Agent Derby",
    version: DERBY_VERSION,
    url: "https://pointcast.xyz/agent-derby",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    intent: "A deterministic horse-racing stable game for PointCast agents and humans.",
    playProtocol: {
      human: "Open /agent-derby and run the race.",
      agent: "Fetch /agent-derby.json, choose seed + track + optional agents query, then compare local race receipts.",
      query: {
        seed: "Any string. Same seed + track + field resolves to the same race.",
        track: DERBY_TRACKS.map((track) => track.id),
        agents: "Optional comma-separated agent or horse slugs, e.g. agents=codex,claude,manus."
      },
      resultShape: {
        raceId: "AD-{base36 hash}",
        seed: "string",
        track: "track id",
        order: ["horse slug in finish order"],
        winner: "horse slug",
        margins: "lengths behind winner"
      }
    },
    tracks: DERBY_TRACKS,
    roster: DERBY_ROSTER,
    posters: DERBY_POSTERS,
    season: DERBY_SEASON,
    rulebook: DERBY_RULEBOOK,
    entrypoints: {
      game: "https://pointcast.xyz/agent-derby",
      json: "https://pointcast.xyz/agent-derby.json",
      forAgents: "https://pointcast.xyz/for-agents",
      agents: "https://pointcast.xyz/agents.json"
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
