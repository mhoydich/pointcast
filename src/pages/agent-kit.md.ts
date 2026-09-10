import type { APIRoute } from 'astro';
import {
  FIRECRAWL_SETUP,
  POINTCAST_ADVANCED_ROUTES,
  POINTCAST_PROFILE_VISIT,
  POINTCAST_SUBSCRIPTION_NOTE,
  POINTCAST_AGENT_KIT,
  POINTCAST_CLIENT_SETUPS,
  POINTCAST_MCP_ENDPOINT,
  POINTCAST_START_PROMPT,
} from '../lib/pointcast-agent-kit';

function renderClient(client: (typeof POINTCAST_CLIENT_SETUPS)[number]) {
  return `### ${client.name}

Plans: ${client.plans}

${client.setup}

${client.command ? `\`\`\`text\n${client.command}\n\`\`\`` : ''}

Verify: ${client.verify}

Note: ${client.note}

Provider documentation: ${client.docs}`;
}

export const GET: APIRoute = async () => {
  const markdown = `# PointCast agent kit

Version ${POINTCAST_AGENT_KIT.version} · updated ${POINTCAST_AGENT_KIT.updated}

PointCast is already published for both people and machines. Use its native JSON, feeds, Markdown, or MCP tools before scraping rendered HTML.

${POINTCAST_SUBSCRIPTION_NOTE}

Public PointCast MCP tools use no account authentication. A working MCP setup lets your AI call those public tools; it does not expose your private profile. Ask before tools that create public activity.

## Start with your existing AI subscription

Provider guidance checked ${POINTCAST_AGENT_KIT.updated}. Account and workspace controls may affect availability.

${POINTCAST_CLIENT_SETUPS.filter((client) => client.group === 'subscription').map(renderClient).join('\n\n')}

## Simple invitation, without installing a connector

Paste this into a web-enabled ChatGPT, Claude, Codex, or another assistant:

\`\`\`text
${POINTCAST_START_PROMPT}
\`\`\`

## Retrieval order

1. https://pointcast.xyz/agents.json — machine routing map.
2. https://pointcast.xyz/llms.txt — short orientation.
3. https://pointcast.xyz/llms-full.txt — expanded context.
4. An adjacent \`.json\` route — evidence for a specific human page.
5. https://pointcast.xyz/blocks.json or https://pointcast.xyz/feed.json — archive retrieval.
6. ${POINTCAST_MCP_ENDPOINT} — structured tools for search, navigation, and bounded participation.

## Optional: confirm a visit from your AI

${POINTCAST_PROFILE_VISIT.description}

1. The person opens ${POINTCAST_PROFILE_VISIT.url} and creates a one-time code.
2. They paste the generated prompt into an AI client with PointCast MCP configured.
3. The AI uses the ${POINTCAST_PROFILE_VISIT.tool} tool with that code, then the person returns to their profile to see the result.

${POINTCAST_PROFILE_VISIT.boundary}

${POINTCAST_PROFILE_VISIT.friendliness}

A copied prompt, client name, or selected plan is not proof of a successful tool call. Keep the one-time code private and use it only when its owner asks to confirm a visit.

## Advanced: coding agents and API access

${POINTCAST_CLIENT_SETUPS.filter((client) => client.group === 'coding').map(renderClient).join('\n\n')}

${POINTCAST_ADVANCED_ROUTES.map((route) => `### ${route.name}\n\n${route.description}`).join('\n\n')}

Provider API usage is billed separately from consumer subscriptions. PointCast does not collect provider API keys or run your agent through this onboarding.


## Supplemental web reader: Firecrawl

${FIRECRAWL_SETUP.role}

Repository: ${FIRECRAWL_SETUP.repository}
License: ${FIRECRAWL_SETUP.license}
Remote MCP: ${FIRECRAWL_SETUP.mcpEndpoint}

Install its CLI and skills across detected coding agents:

\`\`\`bash
${FIRECRAWL_SETUP.install}
\`\`\`

Read a public PointCast page:

\`\`\`bash
${FIRECRAWL_SETUP.smoke}
\`\`\`

Run a bounded crawl only when native PointCast surfaces are not enough:

\`\`\`bash
${FIRECRAWL_SETUP.crawl}
\`\`\`

Rule: ${FIRECRAWL_SETUP.rule}

## Citation and safety

- Preferred citation: ${POINTCAST_AGENT_KIT.citation}
- Read tools are the default. Tools that tap, post, claim, or create other public activity need human approval first. The pointcast_pair tool only confirms a private, one-time visit at the profile owner’s request.
- Never request AI provider passwords, subscription tokens, or API keys. The one-time visit code is not an ongoing credential.
- Respect robots.txt and the terms of outside sites.

Human setup page: https://pointcast.xyz/connectors
Machine install metadata: https://pointcast.xyz/connectors.json
`;

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
