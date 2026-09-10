import type { APIRoute } from 'astro';
import set from '../data/spellframe-first-light.json';
export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Spellframe',
  url: 'https://pointcast.xyz/spellframe',
  status: 'prototype-private-testing',
  description: 'Original PointCast arena fighter and illustrated practice card set.',
  availability: { publicArtPreview: true, publicPlayableBuild: false, connectedModelFighters: false, onlineTournaments: false, purchases: false },
  set,
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
