import type { APIRoute } from 'astro';
import {
  SECOND_SHIFT,
  SECOND_SHIFT_EVENTS,
  SECOND_SHIFT_ORDERS,
  SECOND_SHIFT_UPGRADES,
} from '../lib/second-shift';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        $schema: 'https://pointcast.xyz/schemas/second-shift-v1.json',
        ...SECOND_SHIFT,
        status: 'published',
        access: 'public',
        counts: {
          localOrders: SECOND_SHIFT_ORDERS.length,
          capabilities: SECOND_SHIFT_UPGRADES.length,
          decisionEvents: SECOND_SHIFT_EVENTS.length,
        },
        orders: SECOND_SHIFT_ORDERS,
        upgrades: SECOND_SHIFT_UPGRADES,
        events: SECOND_SHIFT_EVENTS,
        discovery: {
          human: SECOND_SHIFT.canonical,
          game: SECOND_SHIFT.game,
          machine: SECOND_SHIFT.machine,
          block: SECOND_SHIFT.block,
          apps: 'https://pointcast.xyz/apps.json',
          play: 'https://pointcast.xyz/play.json',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
