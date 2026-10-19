import type { APIRoute } from 'astro';
import content from '../content/guides/baseball.md?raw';
import { BASEBALL_TITLE, BASEBALL_DESCRIPTION, sources, plays } from '../data/baseball.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({
  schema: 'pointcast.baseball/v1', title: BASEBALL_TITLE, description: BASEBALL_DESCRIPTION,
  url: 'https://pointcast.xyz/baseball', date: '2026-10-03', author: 'PointCast · Codex',
  contentFormat: 'text/markdown', content, sources,
  interaction: { type: 'composed-half-inning', description: 'Six fictional plate appearances with explicit runner advances. A teaching illustration, not a live game or a complete rules simulator.', plays },
  memory: { storage: 'browser-local', maxCharacters: 280, export: 'plain text' },
  image: { url: 'https://pointcast.xyz/images/baseball/ballpark.webp', type: 'original AI-generated editorial illustration' },
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
