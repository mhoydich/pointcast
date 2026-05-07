/**
 * /collabs.json — machine-readable collaborators + federation spec.
 */
import type { APIRoute } from 'astro';
import { COLLABORATORS, ROLE_LABEL } from '../lib/collaborators';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/collabs.json',
    name: 'PointCast collaborators registry',
    description: 'Humans, AI systems, and federated sites contributing to PointCast. Three-step federation spec to plug in a compatible site.',
    generatedAt: new Date().toISOString(),
    homepage: 'https://pointcast.xyz',
    collaborators: COLLABORATORS.map((c) => ({
      slug: c.slug,
      name: c.name,
      role: c.role,
      roleLabel: ROLE_LABEL[c.role],
      location: c.location ?? null,
      vendor: c.vendor ?? null,
      url: c.url ?? null,
      feed: c.feed ?? null,
      blocksMd: c.blocksMd ?? null,
      twitter: c.twitter ?? null,
      farcaster: c.farcaster ?? null,
      github: c.github ?? null,
      since: c.since ?? null,
      intro: c.intro,
      anchor: `https://pointcast.xyz/collabs#${c.slug}`,
    })),
    federationSpec: {
      steps: [
        {
          n: 1,
          name: 'Expose a feed',
          detail: 'RSS 2.0 at /feed.xml, JSON Feed at /feed.json, or both. Optionally mirror the Block primitive at /b/{id}.json. See pointcast.xyz/for-agents for the BLOCKS.md shape.',
        },
        {
          n: 2,
          name: 'Publish an agent manifest',
          detail: 'A JSON file at /agents.json on your domain listing your feeds, contracts, citation format. Copy pointcast.xyz/agents.json as a template.',
        },
        {
          n: 3,
          name: 'PR the registry',
          detail: 'Add an entry to src/lib/collaborators.ts in the github.com/mhoydich/pointcast repo. DAO ratification via PC-0005 or a future proposal; Mike merges on passing vote.',
        },
      ],
      contact: 'hello@pointcast.xyz',
      ping: 'https://pointcast.xyz/ping',
    },
    joinSystem: {
      human: 'https://pointcast.xyz/join',
      json: 'https://pointcast.xyz/join.json',
      announcementBlock: 'https://pointcast.xyz/b/0435',
      purpose: 'Turn startup and product ideas into claimable people tasks, agent tasks, sales tasks, fulfillment tasks, receipt tasks, and reviewable artifacts.',
    },
    cartographyBusiness: {
      human: 'https://pointcast.xyz/cartography',
      json: 'https://pointcast.xyz/cartography.json',
      pilot: 'https://pointcast.xyz/cartography/pilot',
      pilotJson: 'https://pointcast.xyz/cartography/pilot.json',
      sprint: 'https://pointcast.xyz/cartography/sprint',
      sprintJson: 'https://pointcast.xyz/cartography/sprint.json',
      demo: 'https://pointcast.xyz/cartography/demo',
      demoJson: 'https://pointcast.xyz/cartography/demo.json',
      announcementBlock: 'https://pointcast.xyz/b/0442',
      sprintBlock: 'https://pointcast.xyz/b/0443',
      purpose: 'Turn Digital Identity Cartography into a brand-first service-to-SaaS product board, $50k paid pilot offer, and May 7-15 pilot close sprint with non-financial yield artifacts.',
    },
    governance: {
      proposal: 'PC-0005',
      url: 'https://pointcast.xyz/dao#pc-0005',
      status: 'staged',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
