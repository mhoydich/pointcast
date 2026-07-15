import type { APIRoute } from 'astro';
import examples from '../data/afterimage-examples.json';

export const GET: APIRoute = () => {
  const body = {
    version: 1,
    name: 'Afterimage Relay examples',
    canonical: 'https://pointcast.xyz/afterimage',
    requestUrl: 'https://passportz.xyz/afterimage?from=pointcast',
    description: 'Ten public image-to-music transmissions with permanent PointCast pages and source-preserving Passport audio and artwork.',
    generatedWith: 'Lyria 3 clip preview through Tezos Passport',
    mintPolicy: 'Nothing is minted automatically. Mint links hand off to Kukai for explicit Tezos Mainnet review.',
    examples: examples.map((example) => ({
      ...example,
      pointcastUrl: `https://pointcast.xyz/afterimage/${example.slug}`,
      jsonUrl: `https://pointcast.xyz/afterimage/${example.slug}.json`,
      passportUrl: `https://passportz.xyz/afterimage/room/${example.slug}`,
      imageUrl: `https://passportz.xyz/api/afterimage/room/${example.slug}/image`,
      audioUrl: `https://passportz.xyz/api/afterimage/room/${example.slug}/audio`,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
  });
};
