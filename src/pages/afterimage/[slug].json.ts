import type { APIRoute } from 'astro';
import examples from '../../data/afterimage-examples.json';

export function getStaticPaths() {
  return examples.map((example) => ({ params: { slug: example.slug }, props: { example } }));
}

export const GET: APIRoute = ({ props }) => {
  const example = props.example as (typeof examples)[number];
  const body = {
    ...example,
    pointcastUrl: `https://pointcast.xyz/afterimage/${example.slug}`,
    catalogUrl: 'https://pointcast.xyz/afterimage.json',
    requestUrl: 'https://passportz.xyz/afterimage?from=pointcast',
    passportUrl: `https://passportz.xyz/afterimage/room/${example.slug}`,
    imageUrl: `https://passportz.xyz/api/afterimage/room/${example.slug}/image`,
    audioUrl: `https://passportz.xyz/api/afterimage/room/${example.slug}/audio`,
    durationSeconds: 30,
    generatedWith: 'Lyria 3 clip preview through Tezos Passport',
    mintPolicy: 'Nothing is minted automatically. Minting is an optional Kukai-reviewed Tezos Mainnet handoff.',
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
  });
};
