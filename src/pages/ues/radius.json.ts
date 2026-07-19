import type { APIRoute } from 'astro';
import { RADIUS_PACKET, RADIUS_PRESETS, calculateRadiusLink } from '../../lib/radius-90245';

const payload = {
  ...RADIUS_PACKET,
  generatedAt: new Date().toISOString(),
  human: RADIUS_PACKET.canonical,
  examples: RADIUS_PRESETS.map((preset) => ({
    id: preset.id,
    input: preset,
    result: calculateRadiusLink(preset),
  })),
};

export const GET: APIRoute = async () => new Response(JSON.stringify(payload, null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'Access-Control-Allow-Origin': '*',
  },
});
