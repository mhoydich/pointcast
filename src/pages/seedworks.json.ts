import {
  SEEDWORKS_PIECES,
  SEEDWORKS_SPEC,
  SEEDWORKS_MINT_PATHS,
  SEEDWORKS_UPDATED,
  SEEDWORKS_CANONICAL,
  pieceSrc,
  piecePage,
} from '../lib/seedworks';

export const GET = () =>
  new Response(
    JSON.stringify(
      {
        name: 'Seedworks',
        description: 'Generative art written in code on PointCast. Each piece draws from a seed: same seed, same picture.',
        url: SEEDWORKS_CANONICAL,
        updated: SEEDWORKS_UPDATED,
        howToIterate: 'Load a piece URL with ?seed=<any string>. A new seed is a new iteration.',
        pieces: SEEDWORKS_PIECES.map((p) => ({
          slug: p.slug,
          title: p.title,
          dek: p.dek,
          world: p.world,
          page: `https://pointcast.xyz${piecePage(p.slug)}`,
          piece: `https://pointcast.xyz${pieceSrc(p.slug)}`,
          example: `https://pointcast.xyz${pieceSrc(p.slug)}?seed=${encodeURIComponent(p.exampleSeeds[0])}`,
          params: p.params,
          features: p.features,
          interactive: p.interactive ?? null,
          exampleSeeds: p.exampleSeeds,
        })),
        spec: SEEDWORKS_SPEC,
        minting: { status: 'not minted', paths: SEEDWORKS_MINT_PATHS },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
