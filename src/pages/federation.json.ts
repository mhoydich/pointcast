import type { APIRoute } from 'astro';
import {
  FEDERATION_JOIN_PATHS,
  FEDERATION_META,
  FEDERATION_NODE_TEMPLATE,
  FEDERATION_PERSON_TEMPLATE,
  FEDERATION_RECEIPT_STATES,
  FEDERATION_STEPS,
} from '../lib/federation';

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://pointcast.xyz/federation.json',
    ...FEDERATION_META,
    generatedAt: new Date().toISOString(),
    promise: 'Communities keep private destinations. The network exchanges public route cards, reviewed message intents, and precise receipts.',
    currentBoundary: {
      registry: 'live',
      joinReview: 'manual',
      messageDrafting: 'human-approved',
      crossNodeDelivery: 'not-live',
      relationshipGraph: 'not-live',
    },
    joinPaths: FEDERATION_JOIN_PATHS,
    steps: FEDERATION_STEPS,
    receiptStates: FEDERATION_RECEIPT_STATES,
    privacyRules: [
      'Do not publish email addresses, phone numbers, Slack handles, or access tokens in a public card or pull request.',
      'A person chooses a home node and may revoke or change consent.',
      'A home node resolves a public person ID to a private destination; requesting nodes do not receive that destination.',
      'Relationship edges require a named source or real event and are never inferred from directory proximity.',
    ],
    templates: {
      node: FEDERATION_NODE_TEMPLATE,
      person: FEDERATION_PERSON_TEMPLATE,
    },
    joining: {
      privateDetails: `mailto:${FEDERATION_META.contact}?subject=PointCast%20Federation%20join%20request`,
      publicContribution: `${FEDERATION_META.repository}/pulls`,
      instructions: FEDERATION_META.markdown,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};

