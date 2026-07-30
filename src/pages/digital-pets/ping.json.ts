import type { APIRoute } from 'astro';
import { PING_LOCAL_PET } from '../../lib/ping-local-pet';

const base = 'https://pointcast.xyz';
const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = () => {
  const payload = {
    ...PING_LOCAL_PET,
    url: absolute(PING_LOCAL_PET.route),
    jsonUrl: absolute(PING_LOCAL_PET.jsonRoute),
    blockUrl: absolute(`/b/${PING_LOCAL_PET.blockId}`),
    conceptImage: absolute(PING_LOCAL_PET.conceptImage),
    companions: {
      futureBook: `${base}/digital-pets`,
      futureBookJson: `${base}/digital-pets.json`,
      creatureCommons: `${base}/digital-pets/commons`,
      localStarCommons: `${base}/local-star-commons`,
      networkElSegundo: `${base}/network-el-segundo`,
      meshCommons: `${base}/network-el-segundo/mesh-commons`,
    },
    disclosure:
      'This is a public production ledger and browser rehearsal. It is not a product sale, preorder, investment offering, supplier engagement, partner announcement, certified device, functioning physical mesh, satellite service, or claim that a physical PING exists.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
      Link: `<${absolute(PING_LOCAL_PET.route)}>; rel="alternate"; type="text/html"`,
    },
  });
};
