import type { APIRoute } from 'astro';
import { AFTER_THE_NOISE } from '../../../lib/pointcast-after-the-noise';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...AFTER_THE_NOISE,
  summary: 'The September 26 result changed what PointCast could responsibly say about Florida and Ole Miss. Board 002 moves Florida from 18 to 3 and Ole Miss from 3 to 12 while retaining Board 001.',
  currentBoard: 'https://pointcast.xyz/25',
  frozenBoard: 'https://pointcast.xyz/25/boards/002.json',
  priorBoard: 'https://pointcast.xyz/25/boards/001.json',
  receipts: 'https://pointcast.xyz/25/receipts.json',
}, null, 2), { headers: {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600',
  'Access-Control-Allow-Origin': '*',
}});
