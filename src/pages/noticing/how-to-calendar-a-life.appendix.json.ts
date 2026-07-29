import type { APIRoute } from 'astro';
import { CALENDAR_APPENDIX } from '../../lib/noticing-calendar-appendix';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(CALENDAR_APPENDIX, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
