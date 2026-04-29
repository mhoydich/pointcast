import type { APIRoute } from 'astro';
import {
  AGENT_VALUE_SURFACE,
  agentAntiPatterns,
  agentEconomics,
  agentExperimentCards,
  agentInterestMechanics,
  agentMaturityLadder,
  agentValueLoops,
} from '../lib/agent-value';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/for-agents',
        generatedAt: new Date().toISOString(),
        surface: AGENT_VALUE_SURFACE,
        valueLoops: agentValueLoops,
        interestMechanics: agentInterestMechanics,
        maturityLadder: agentMaturityLadder,
        economics: agentEconomics,
        experiments: agentExperimentCards,
        antiPatterns: agentAntiPatterns,
        related: {
          forAgents: 'https://pointcast.xyz/for-agents',
          agentsManifest: 'https://pointcast.xyz/agents.json',
          mcp: 'https://pointcast.xyz/api/mcp-v2',
          drumAgent: 'https://pointcast.xyz/drum-agent',
          nounsNationAgentBench: 'https://pointcast.xyz/nouns-nation-battler-agents/',
          sponsorshipDesk: 'https://pointcast.xyz/nouns-nation-battler-sponsors/',
          roadmap: 'https://pointcast.xyz/nouns-nation/roadmap',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'access-control-allow-origin': '*',
      },
    },
  );
};
