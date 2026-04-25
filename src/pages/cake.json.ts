/**
 * /cake.json — agent-readable index of every birthday block on PointCast.
 *
 * Twin of /cake. Stable schema so agents can list celebrants, count blocks
 * per person, and follow links to per-recipient timelines.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allBlocks = await getCollection('blocks', ({ data }) => !data.draft);
  const birthdayBlocks = allBlocks
    .filter((b) => b.data.channel === 'BDY' || b.data.type === 'BIRTHDAY')
    .sort((a, b) => +new Date(b.data.timestamp) - +new Date(a.data.timestamp));

  const family = await getCollection('family', ({ data }) => data.listed);

  const recipientMap = new Map<string, typeof birthdayBlocks>();
  for (const b of birthdayBlocks) {
    const slug = (b.data.meta?.for as string | undefined) || 'unknown';
    if (!recipientMap.has(slug)) recipientMap.set(slug, []);
    recipientMap.get(slug)!.push(b);
  }

  const recipients = Array.from(recipientMap.entries())
    .map(([slug, blocks]) => {
      const fam = family.find((f) => f.data.slug === slug);
      return {
        slug,
        name: fam?.data.name ?? slug,
        permanentNoun: fam?.data.permanentNoun ?? blocks[0]?.data.noun ?? null,
        birthday: fam?.data.birthday ?? null,
        blockCount: blocks.length,
        blocks: blocks.map((b) => ({
          id: b.data.id,
          year: new Date(b.data.timestamp).getUTCFullYear(),
          url: `https://pointcast.xyz/b/${b.data.id}`,
          title: b.data.title,
          mintedCount: b.data.edition?.minted ?? 0,
        })),
      };
    })
    .sort((a, b) => b.blockCount - a.blockCount);

  const upcoming = family
    .filter((f) => f.data.birthday)
    .map((f) => ({
      slug: f.data.slug,
      name: f.data.name,
      birthday: f.data.birthday!,
      permanentNoun: f.data.permanentNoun ?? null,
      relationship: f.data.relationship ?? null,
      cakeUrl: `https://pointcast.xyz/cake/${f.data.slug}`,
    }));

  const payload = {
    '@context': 'https://pointcast.xyz/agents.json',
    name: '/cake',
    alternateName: 'the place where birthdays are celebrated online',
    url: 'https://pointcast.xyz/cake',
    channel: 'BDY',
    blockType: 'BIRTHDAY',
    since: '2026-04-25',
    counts: {
      birthdays: birthdayBlocks.length,
      recipients: recipients.length,
      upcomingInRegistry: upcoming.length,
    },
    contract: {
      status: 'pending',
      plannedAddress: null,
      kind: 'FA2',
      mintMechanic: 'free open edition, gas-only, claim-once-per-wallet',
      tokenIdConvention: 'derived from PointCast block ID (e.g. block 0366 → token 366)',
      brief: 'https://github.com/mhoydich/pointcast/blob/main/docs/briefs/2026-04-25-cake-room-bdy-channel.md',
    },
    upcoming,
    recipients,
    blocks: birthdayBlocks.map((b) => ({
      id: b.data.id,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      title: b.data.title,
      dek: b.data.dek ?? null,
      noun: b.data.noun ?? null,
      timestamp: b.data.timestamp,
      year: new Date(b.data.timestamp).getUTCFullYear(),
      recipientSlug: (b.data.meta?.for as string | undefined) ?? null,
      mintedCount: b.data.edition?.minted ?? 0,
    })),
    entrypoints: ['/cake', '/cake.json', '/c/birthday', '/c/birthday.json'],
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
