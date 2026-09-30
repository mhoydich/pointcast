import type { APIRoute } from 'astro';
import { clubArt } from '../data/atari-club-art';
import { atariBbs } from '../data/atari-bbs';

export const GET: APIRoute = () => new Response(JSON.stringify({ ...atariBbs, clubArt }, null, 2), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
