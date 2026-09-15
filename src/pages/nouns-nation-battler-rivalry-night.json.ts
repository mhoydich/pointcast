import type { APIRoute } from 'astro';
import { RIVALRY_NIGHT_RECORD, RIVALRY_NIGHT_STANDOUT } from '../lib/battler-rivalry-night';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...RIVALRY_NIGHT_RECORD,
  standout: RIVALRY_NIGHT_STANDOUT,
  links: {
    annual: '/noun-battler-annual#league',
    arena: '/nouns-nation-battler-arena/',
    rematch: RIVALRY_NIGHT_RECORD.metadata.rematchUrl,
    record: RIVALRY_NIGHT_RECORD.metadata.recordUrl,
    page: RIVALRY_NIGHT_RECORD.metadata.path,
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  },
});
