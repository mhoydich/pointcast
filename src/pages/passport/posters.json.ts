import type { APIRoute } from 'astro';
import posterSet from '../../data/passport-posters.json';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

export const GET: APIRoute = async () => {
  const payload = {
    ...posterSet,
    home: 'https://pointcast.xyz/passport/posters',
    json: 'https://pointcast.xyz/passport/posters.json',
    posters: posterSet.posters.map((poster) => ({
      ...poster,
      image: absolute(poster.image),
      sourceImage: absolute(poster.sourceImage),
      passportUrl: absolute(`/passport#${poster.stationSlugs[0] ?? ''}`),
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
