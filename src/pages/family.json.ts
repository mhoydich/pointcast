/**
 * /family.json — machine-readable Fukunaga Hoydich family + circle roster.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const members = (await getCollection('family', ({ data }) => data.listed))
    .sort((a, b) => a.data.name.localeCompare(b.data.name));

  const payload = {
    $schema: 'https://pointcast.xyz/family.json',
    name: 'Fukunaga Hoydich Family + Circle',
    description: 'Mike-curated, consent-required roster. Tezos addresses opt-in per person. See /family for the human view.',
    generatedAt: new Date().toISOString(),
    count: members.length,
    home: 'https://pointcast.xyz/family',
    members: members.map((m) => ({
      slug: m.data.slug,
      name: m.data.name,
      role: m.data.role,
      relationship: m.data.relationship ?? null,
      tezosAddress: m.data.tezosAddress ?? null,
      avatar: m.data.avatar ?? null,
      since: m.data.since ? m.data.since.toISOString() : null,
      author: m.data.author,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
