import type { APIRoute } from 'astro';
import { UES_PROGRAM_PAYLOAD } from '../lib/ues-program';

const payload = {
  $schema: 'https://pointcast.xyz/for-agents',
  generatedAt: new Date().toISOString(),
  name: 'University of El Segundo Funding and Operating Program',
  status: 'forming — planning estimates published for community review',
  human: 'https://pointcast.xyz/university-of-el-segundo',
  ...UES_PROGRAM_PAYLOAD,
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
