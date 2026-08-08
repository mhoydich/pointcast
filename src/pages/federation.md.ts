import type { APIRoute } from 'astro';
import {
  FEDERATION_META,
  FEDERATION_NODE_TEMPLATE,
  FEDERATION_RECEIPT_STATES,
  FEDERATION_STEPS,
} from '../lib/federation';

export const GET: APIRoute = () => {
  const steps = FEDERATION_STEPS.map((step) => `${step.n}. **${step.name}.** ${step.detail}`).join('\n');
  const template = JSON.stringify(FEDERATION_NODE_TEMPLATE, null, 2);
  const body = `# PointCast Federation — joining instructions

Protocol: \`${FEDERATION_META.protocol}\`  
Status: open draft; registry and manual review are live, cross-node delivery is not live.

PointCast Federation is an open, community-maintained reachability network. Each community keeps private contact destinations. The shared network contains public route cards, reviewed message intents, and precise receipts.

## Join

${steps}

Private contact details belong in an email to ${FEDERATION_META.contact}, never in a public pull request.

## Public node card

Host this JSON at \`/.well-known/pointcast-federation.json\` on your domain and replace the example values:

\`\`\`json
${template}
\`\`\`

Then open a pull request at ${FEDERATION_META.repository}/pulls adding the public node URL to the PointCast registry. PointCast maintainers will review it before listing it.

## Receipt vocabulary

${FEDERATION_RECEIPT_STATES.map((state) => `- \`${state}\``).join('\n')}

These states are not interchangeable. In particular, submitted does not mean delivered, and delivered does not mean personally confirmed.

## Privacy boundary

- Never publish email addresses, phone numbers, private handles, or access tokens in a node card.
- The home node resolves a public person ID to a private destination.
- The requesting node does not receive that destination.
- Every first route is human-approved.
- Relationship edges require a real, cited introduction or collaboration.

Human guide: ${FEDERATION_META.canonical}  
Machine guide: ${FEDERATION_META.json}  
Registry: ${FEDERATION_META.registry}
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

