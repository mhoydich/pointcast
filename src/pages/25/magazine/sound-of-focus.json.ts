import type { APIRoute } from 'astro';
import { POINTCAST_SOUND_OF_FOCUS } from '../../../lib/pointcast-focus';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...POINTCAST_SOUND_OF_FOCUS,
        discovery: {
          human: POINTCAST_SOUND_OF_FOCUS.canonical,
          machine: POINTCAST_SOUND_OF_FOCUS.machineEdition,
          interactiveLab: POINTCAST_SOUND_OF_FOCUS.interactiveLab,
          parentMagazine: POINTCAST_SOUND_OF_FOCUS.parent,
          currentBoard: 'https://pointcast.xyz/25',
          block: `https://pointcast.xyz/b/${POINTCAST_SOUND_OF_FOCUS.block}`,
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
