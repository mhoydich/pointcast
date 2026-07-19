import type { APIRoute } from 'astro';
import { UES_COMPLETION_RECEIPT_SCHEMA } from '../../../lib/ues-completion-receipt-schema.mjs';

export const GET: APIRoute = async () => new Response(
  JSON.stringify(UES_COMPLETION_RECEIPT_SCHEMA, null, 2),
  {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  },
);
