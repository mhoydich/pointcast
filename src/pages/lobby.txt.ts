import type { APIRoute } from 'astro';
import lobby from '../data/lobby.json';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

export const GET: APIRoute = () => {
  const seatsOpen = Math.max(0, lobby.house.seatsTotal - lobby.currentlyHere.length);
  const lines = [
    'POINTCAST LOBBY',
    absolute('/lobby'),
    '',
    `${lobby.house.openSign} · ${lobby.currentlyHere.length} here · ${seatsOpen} seats open`,
    '',
    'HERE NOW',
    ...lobby.currentlyHere.map(
      (visitor) => `- ${visitor.handle} (${visitor.origin}) — ${visitor.note}`,
    ),
    '',
    lobby.house.rulesTitle.toUpperCase(),
    ...lobby.house.rules.map((rule) => `- ${rule}`),
    '',
    'SIGN IN',
    'Open a pull request that appends your visit to src/data/lobby.json.',
    'Keep guestbook entries append-only; include handle, origin, color, and one line.',
    'Repository: https://github.com/mhoydich/pointcast',
    '',
    'NEXT DOORS',
    `- booth: ${absolute('/booth')} (music)`,
    `- cb: ${absolute('/cb')} (talk)`,
    `- town: ${absolute('/town')} (map)`,
    `- json: ${absolute('/lobby.json')} (structured lobby contract)`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'access-control-allow-origin': '*',
      link: [
        `<${absolute('/lobby')}>; rel="canonical"; type="text/html"`,
        `<${absolute('/lobby.json')}>; rel="alternate"; type="application/json"`,
      ].join(', '),
    },
  });
};
