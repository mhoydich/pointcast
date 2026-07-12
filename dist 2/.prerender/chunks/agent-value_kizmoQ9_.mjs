import { f as agentAntiPatterns, e as agentExperimentCards, d as agentEconomics, c as agentMaturityLadder, b as agentInterestMechanics, a as agentValueLoops, A as AGENT_VALUE_SURFACE } from './agent-value_nLa-AifS.mjs';

const GET = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: "https://pointcast.xyz/for-agents",
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        surface: AGENT_VALUE_SURFACE,
        valueLoops: agentValueLoops,
        interestMechanics: agentInterestMechanics,
        maturityLadder: agentMaturityLadder,
        economics: agentEconomics,
        experiments: agentExperimentCards,
        antiPatterns: agentAntiPatterns,
        related: {
          forAgents: "https://pointcast.xyz/for-agents",
          agentsManifest: "https://pointcast.xyz/agents.json",
          mcp: "https://pointcast.xyz/api/mcp-v2",
          drumAgent: "https://pointcast.xyz/drum-agent",
          nounsNationAgentBench: "https://pointcast.xyz/nouns-nation-battler-agents/",
          sponsorshipDesk: "https://pointcast.xyz/nouns-nation-battler-sponsors/",
          roadmap: "https://pointcast.xyz/nouns-nation/roadmap"
        }
      },
      null,
      2
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300",
        "access-control-allow-origin": "*"
      }
    }
  );
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
