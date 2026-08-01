import type { APIRoute } from 'astro';
import {
  FIRECRAWL_SETUP,
  POINTCAST_AGENT_KIT,
  POINTCAST_CLIENT_SETUPS,
  POINTCAST_MCP_ENDPOINT,
  POINTCAST_START_PROMPT,
} from '../lib/pointcast-agent-kit';

function renderClient(client: (typeof POINTCAST_CLIENT_SETUPS)[number]) {
  return `## ${client.name}

${client.setup}

${client.command ? `\`\`\`text\n${client.command}\n\`\`\`` : ''}

Verify: ${client.verify}

Note: ${client.note}`;
}

export const GET: APIRoute = async () => {
  const markdown = `# PointCast agent kit

Version ${POINTCAST_AGENT_KIT.version} · updated ${POINTCAST_AGENT_KIT.updated}

PointCast is already published for both people and machines. Use its native JSON, feeds, Markdown, or MCP tools before scraping rendered HTML.

## Fastest start

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

${POINTCAST_CLIENT_SETUPS.map(renderClient).join('\n\n')}

## Firecrawl

${FIRECRAWL_SETUP.role}

Repository: ${FIRECRAWL_SETUP.repository}
License: ${FIRECRAWL_SETUP.license}
Remote MCP: ${FIRECRAWL_SETUP.mcpEndpoint}

Install its CLI and skills across detected coding agents:

\`\`\`bash
${FIRECRAWL_SETUP.install}
\`\`\`

Run a no-account smoke test against PointCast:

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
- Read tools are the default. PointCast MCP tools that tap, post, claim, or otherwise participate are visible public actions; get human approval first.
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
