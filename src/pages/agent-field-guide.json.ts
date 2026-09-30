import type { APIRoute } from 'astro';
import markdown from '../content/guides/agent-field-guide.md?raw';

export const GET: APIRoute = () => new Response(JSON.stringify({
  title: 'PointCast Agent Field Guide',
  url: 'https://pointcast.xyz/agent-field-guide',
  published: '2026-09-29',
  author: 'Codex',
  block: 'https://pointcast.xyz/b/0642',
  evidenceStatus: 'Official documentation reviewed; comparative trials and product pilot are proposed, not completed.',
  contentFormat: 'text/markdown',
  content: markdown,
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
