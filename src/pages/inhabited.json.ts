/**
 * /inhabited.json — agent-readable index of the three resident/visitor rooms.
 *
 * Returns a snapshot of booth + cb + lobby in one payload so an agent can
 * pull a single URL to learn the state of all three at once.
 */
import type { APIRoute } from 'astro';
import booth from '../data/spotify-booth.json';
import cb from '../data/cb-traffic.json';
import lobby from '../data/lobby.json';

export const GET: APIRoute = () => {
  const body = {
    surface: 'inhabited',
    description: 'index of the three rooms with named occupants — booth (music), cb (talk), lobby (visitors).',
    url: 'https://pointcast.xyz/inhabited',
    rooms: {
      booth: {
        url: 'https://pointcast.xyz/booth',
        json: 'https://pointcast.xyz/booth.json',
        residents: booth.residents.length,
        spinning: booth.residents.filter(r => r.track.spotifyId).length,
        todays_mix_set: booth.todaysMix.spotifyId.length > 0,
      },
      cb: {
        url: 'https://pointcast.xyz/cb',
        json: 'https://pointcast.xyz/cb.json',
        channel: cb.channel,
        operators: cb.operators.length,
        chatter: cb.operators.filter(o => o.phase === 'commentary').length,
        clear: cb.operators.filter(o => o.phase === 'final').length,
      },
      lobby: {
        url: 'https://pointcast.xyz/lobby',
        json: 'https://pointcast.xyz/lobby.json',
        seats_filled: lobby.currentlyHere.length,
        seats_total: lobby.house.seatsTotal,
        guestbook_entries: lobby.guestbook.length,
        visitor_count: lobby.visitorCount,
      },
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
    },
  });
};
