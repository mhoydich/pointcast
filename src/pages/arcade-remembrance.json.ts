import type { APIRoute } from 'astro';
import content from '../content/guides/arcade-remembrance.md?raw';
export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: 'pointcast.arcade-remembrance/v1', title: 'The other half of the game',
  url: 'https://pointcast.xyz/arcade-remembrance', published: '2026-09-29',
  author: 'Michael Hoydich', block: 'https://pointcast.xyz/b/0648',
  contentFormat: 'text/markdown', content,
  interaction: 'Original canvas homage with wheel, trackball, action button and shared-screen player positions; optional sound. Player positions use the same local controls.',
  sources: [
    { title: 'Atari Super Sprint operator manual', url: 'https://manualzz.com/doc/8207521/atari-super-sprint-arcade-game-operators-manual' },
    { title: 'Atari Gauntlet operator manual', url: 'https://manualzz.com/doc/13044003/atari-games-gauntlet-user-manual' },
    { title: 'Leland Super Off Road owner manual', url: 'https://manualzz.com/doc/13935093/leland-corporation-super-off-road-family-user-manual' },
    { title: 'Super Off Road museum record', url: 'https://www.arcade-museum.com/Videogame/ironman-ivan-stewarts-super-off-road' },
  ],
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
