import type { APIRoute } from 'astro';
import blocksDoc from '../../BLOCKS.md?raw';

export const GET: APIRoute = () => {
  return new Response(blocksDoc, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
