/**
 * /collabs.json — machine-readable collaborators + federation spec.
 */
import type { APIRoute } from 'astro';
import { COLLABORATORS, ROLE_LABEL } from '../lib/collaborators';
import { FEDERATION_META, FEDERATION_RECEIPT_STATES, FEDERATION_STEPS } from '../lib/federation';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/collabs.json',
    name: 'PointCast collaborators registry',
    description: 'Humans, AI systems, and federated sites contributing to PointCast. Joining rules live in the PointCast Federation guide.',
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
      protocol: FEDERATION_META.protocol,
      status: FEDERATION_META.status,
      human: FEDERATION_META.canonical,
      json: FEDERATION_META.json,
      markdown: FEDERATION_META.markdown,
      steps: FEDERATION_STEPS,
      receiptStates: FEDERATION_RECEIPT_STATES,
      contact: FEDERATION_META.contact,
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
      home: 'https://pointcast.xyz/cartography/home',
      homeJson: 'https://pointcast.xyz/cartography/home.json',
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
