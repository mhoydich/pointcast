import type { APIRoute } from 'astro';
import {
  SUPER_FOLLOW_BOUNDARIES,
  SUPER_FOLLOW_LENSES,
  SUPER_FOLLOW_OUTPUTS,
  SUPER_FOLLOW_RELATIONSHIPS,
  SUPER_FOLLOW_SIGNALS,
  SUPER_FOLLOW_SOURCES,
} from '../data/super-follow';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({
  $schema: 'https://pointcast.xyz/schemas/super-follow-v1.json',
  name: 'Super Follow',
  subject: {
    name: 'Sony',
    canonical: 'https://www.sony.com/',
    relationship: 'independent field prototype',
  },
  canonical: 'https://pointcast.xyz/super-follow',
  version: 1,
  status: 'directional-static-prototype',
  principle: 'A follow should create a personal broadcaster with attributable sources, an explicit lens, portable outputs, and legible relationship states.',
  pipeline: ['sources', 'canon', 'lens', 'broadcast', 'relationship', 'market'],
  sources: SUPER_FOLLOW_SOURCES,
  lenses: SUPER_FOLLOW_LENSES,
  sampleSignals: SUPER_FOLLOW_SIGNALS,
  outputs: SUPER_FOLLOW_OUTPUTS.map((output) => ({
    ...output,
    url: new URL(output.href, 'https://pointcast.xyz').toString(),
  })),
  relationships: SUPER_FOLLOW_RELATIONSHIPS,
  want: {
    schema: 'pointcast.want/v1',
    initialState: 'local-draft',
    visibility: ['private', 'invited', 'public'],
    futureResponse: 'structured offers',
    sent: false,
    automaticCheckout: false,
    automaticPayment: false,
    paymentInitiated: false,
    networkTransmissionInPrototype: false,
  },
  securityDirection: {
    active: false,
    proofOfPossession: 'directional only',
    concepts: ['narrow grants', 'DPoP sender-constrained tokens', 'signed webhooks', 'replay protection', 'human-readable receipts'],
  },
  storage: {
    lens: 'browser localStorage',
    wants: 'browser localStorage',
    serverProfile: false,
    sourceHistory: false,
  },
  crawl: {
    continuousCrawl: false,
    currentContent: 'static editorial sample',
  },
  boundaries: SUPER_FOLLOW_BOUNDARIES,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
  },
});
