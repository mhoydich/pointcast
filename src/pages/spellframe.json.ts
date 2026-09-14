import type { APIRoute } from 'astro';
import set from '../data/spellframe-first-light.json';
export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Spellframe',
  url: 'https://pointcast.xyz/spellframe',
  status: 'prototype-private-testing',
  description: 'Original PointCast arena fighter in private testing, illustrated First Light card set, and a separate public browser co-op card practice.',
  availability: { publicArtPreview: true, publicPlayableBuild: false, connectedModelFighters: false, onlineTournaments: false, purchases: false },
  availabilityScope: 'The availability object describes the Unity arena prototype. Public browser card practice is described separately in coGames.',
  coGames: {
    name: 'Co-games: Two against the rift',
    url: 'https://pointcast.xyz/co-games',
    json: 'https://pointcast.xyz/co-games.json',
    status: 'public-browser-card-practice',
    rounds: 4,
    practicePartner: true,
    pairedNativeSupport: true,
    description: 'A separate four-round co-op card practice with a built-in partner or a paired native Codex or Claude companion. Consult its machine twin for participation requirements.',
  },
  set,
}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
