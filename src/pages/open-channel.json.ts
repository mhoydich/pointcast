import type { APIRoute } from 'astro';
import { SCENES } from '../../public/open-channel/scenes.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({
  name: 'Open Channel', canonical: 'https://pointcast.xyz/open-channel/',
  edition: 1, mode: 'authored branching story prototype',
  description: 'Three original characters and twelve endings. Optional browser narration and numbered voice commands.',
  scenes: SCENES.map(({ id, title, character, role, nodes }) => ({ id, title, character, role, endings: Object.values(nodes).filter(node => node.ending).map(node => node.ending) })),
  controls: ['Choose a scene', 'Tune in', 'Tap reply one or two', 'Toggle browser narration', 'Stop or repeat narration', 'Optional microphone: say one or two', 'Restart a scene', 'Download transcript and note'],
  provider: { current: 'Browser speech synthesis with authored dialogue', dessaConnected: false, generatedReplies: false, emotionRecognition: false, fullDuplex: false },
  dessa: { source: 'https://block.xyz/dessa', checked: '2026-10-25', status: 'Research preview. Public model download and developer API not verified.', futureIntegration: 'Pending authorized access, published protocol, supported capabilities, and license review.' },
  privacy: { accountRequired: false, serverStorage: false, persistentBrowserStorage: false, sessionStorage: 'In-memory for this tab only. Download to keep.', microphone: 'Only on explicit click. Browser speech recognition may send audio to its speech service. PointCast does not record audio.' },
  limitations: ['Browser voices vary by device.', 'Speech recognition may be unavailable or require permission/network access.', 'Only numbered voice choices are recognized; this is not a free-form conversation.'],
  block: 'https://pointcast.xyz/b/0766', source: 'https://github.com/mhoydich/pointcast',
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
