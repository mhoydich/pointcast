import type { APIRoute } from 'astro';
import { machineEdition } from '../../lib/launchpad/exhibits.mjs';

/** /case-studies/launchpad.json — machine twin of the launchpad case study (simulation only, demo credits). */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(machineEdition(), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
