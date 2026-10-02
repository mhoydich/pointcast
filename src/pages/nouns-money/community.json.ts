import type { APIRoute } from 'astro';
import DATA from '../../data/nouns-money-community.json';
import ACTIVITY from '../../data/nouns-money-public-activity.json';
export const GET: APIRoute = () => new Response(JSON.stringify({...DATA,canonical:'https://pointcast.xyz/nouns-money/community/',machine:'https://pointcast.xyz/nouns-money/community.json', activitySnapshot: ACTIVITY},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'}});
