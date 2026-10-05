import type { APIRoute } from 'astro';
import { ADD_LINE, REGISTRY, REGISTRY_META } from '../../data/standards-registry';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...REGISTRY_META,
        add: ADD_LINE,
        agents: REGISTRY,
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
