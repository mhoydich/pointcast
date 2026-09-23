import type { APIRoute } from 'astro';

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'Ghost Town · Skyward',
  url: 'https://pointcast.xyz/ghost-town/',
  block: 'https://pointcast.xyz/b/0609',
  video: {
    title: 'Kanye West - Ghost Town but it will make you ascend to the fourth dimension',
    creator: 'JonJeffJon Edits',
    creatorUrl: 'https://www.youtube.com/@JonJeffJon_Edits',
    url: 'https://www.youtube.com/watch?v=dQAsaY0pKhI',
    embed: 'https://www.youtube.com/embed/dQAsaY0pKhI?playsinline=1&rel=0',
  },
  game: {
    name: 'Skyward',
    description: 'Guide a little ghost and collect seven lights in each of three skies. No lives or time limit.',
    controls: ['Arrow keys or A/D while the game is focused', 'Touch or pointer', 'On-screen direction buttons'],
    audio: 'Silent; the YouTube player controls the soundtrack.',
    synchronization: 'Independent gameplay, not an audio-derived beat map.',
    persistence: 'Session only',
  },
  related: ['https://pointcast.xyz/b/0236', 'https://pointcast.xyz/yee/0236'],
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
