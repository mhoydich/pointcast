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
    cartographyArchive: {
      human: 'https://pointcast.xyz/cartography',
      json: 'https://pointcast.xyz/cartography.json',
      demo: 'https://pointcast.xyz/cartography/demo',
      demoJson: 'https://pointcast.xyz/cartography/demo.json',
      home: 'https://pointcast.xyz/cartography/home',
      homeJson: 'https://pointcast.xyz/cartography/home.json',
      homeDemo: 'https://pointcast.xyz/cartography/home/demo',
      homeDemoJson: 'https://pointcast.xyz/cartography/home/demo.json',
      homeFieldKit: 'https://pointcast.xyz/cartography/home/field-kit',
      homeFieldKitJson: 'https://pointcast.xyz/cartography/home/field-kit.json',
      announcementBlock: 'https://pointcast.xyz/b/0442',
      purpose: 'Archived Digital Identity Cartography concept with a fictional demo and preserved Home Cartography references.',
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
