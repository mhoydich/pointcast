/**
 * /federation.json — machine-readable federation registry.
 *
 * Companion to /federated (human page). Agents, crawlers, and partner
 * ops tools hit this to discover every site federated with PointCast
 * in one JSON call.
 *
 * Also mirrored at /.well-known/federation via public/_redirects (set
 * alongside /.well-known/agents.json). Agents following the well-known
 * discovery pattern find it without reading /federated first.
 */
import type { APIRoute } from 'astro';
import { FEDERATED_SITES, liveFederationCount } from '../lib/federation';

export const GET: APIRoute = async () => {
  const payload = {
    schema: 'federation-registry-v0',
    host: 'pointcast.xyz',
    url: 'https://pointcast.xyz/federation.json',
    human_page: 'https://pointcast.xyz/federated',
    join_page: 'https://pointcast.xyz/federate',
    spec: 'https://github.com/MikeHoydich/pointcast/blob/main/docs/rfc/compute-ledger-v0.md',
    namespace: 'https://pointcast.xyz/ns/2026',
    operator: {
      name: 'Mike Hoydich',
      email: 'hello@pointcast.xyz',
      url: 'https://pointcast.xyz/contributor/mike-hoydich',
    },
    summary: {
      total: FEDERATED_SITES.length,
      live: liveFederationCount(),
      by_role: FEDERATED_SITES.reduce<Record<string, number>>((acc, s) => {
        acc[s.role] = (acc[s.role] ?? 0) + 1;
        return acc;
      }, {}),
    },
    registration: {
      steps: [
        '1. Publish a feed at any path on your domain — RSS 2.0 or JSON Feed 1.1.',
        '2. Link back to pointcast.xyz from your site (footer badge is fine).',
        '3. Email hello@pointcast.xyz with your site URL and a one-line description.',
        '4. (Optional) Publish /compute.json per the compute-ledger-v0 RFC for ship mirroring.',
      ],
      sla: 'PointCast reviews new registrations within 24h on weekdays. Entries appear on /federated and /federation.json within that window.',
    },
    sites: FEDERATED_SITES.map((s) => ({
      slug: s.slug,
      name: s.name,
      url: s.url,
      description: s.description,
      topics: s.topics,
      role: s.role,
      operator: s.operator,
      since: s.since,
      feed: s.feed ?? null,
      compute_json: s.computeJson ?? null,
      blocks_json: s.blocksJson ?? null,
      agents_json: s.agentsJson ?? null,
      llms_txt: s.llmsTxt ?? null,
      contact: s.contact ?? null,
      twitter: s.twitter ?? null,
      farcaster: s.farcaster ?? null,
      github: s.github ?? null,
      logo: s.logo ?? null,
      reciprocates: s.reciprocates ?? false,
      notes: s.notes ?? null,
    })),
    badge: {
      html: '<a href="https://pointcast.xyz/federated" rel="noopener" style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#185FA5;">↔ Federated with PointCast</a>',
      markdown: '[↔ Federated with PointCast](https://pointcast.xyz/federated)',
      image: 'https://pointcast.xyz/images/og-home-v3.png',
    },
    generated_at: new Date().toISOString(),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=600',
      'X-Federation-Count': String(liveFederationCount()),
    },
  });
};
