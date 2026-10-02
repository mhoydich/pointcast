import type { APIRoute } from 'astro';
import { MONEY, NOTE_DESIGNS, NORDIC_STUDIES } from '../lib/nouns-money';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...MONEY,
  designs: NOTE_DESIGNS.map(note => ({...note, image: `https://pointcast.xyz/images/nouns-money/${note.file}.webp`, svg: `https://pointcast.xyz/images/nouns-money/${note.file}.svg`})),
  nordic2027Studies: { status: 'Generated visual interpretations from authentic Nouns references; not exact-source print masters or production-ready files', effects: 'Engraved, iridescent and translucent details are proposed visual effects, not verified material, authentication or security functionality', studies: NORDIC_STUDIES.map(note=>({...note,image:`https://pointcast.xyz/images/nouns-money/nordic-2027/${note.file}.webp`})) },
  journey: { status: 'Fictional read-only example; no submissions or transfer verification', serial: 'NM-001-DEMO', stops: ['First proof · imagined', 'Art table · imagined', 'A friend’s pocket · imagined'] },
  agentAccess: { method: 'GET', authentication: 'none', sideEffects: 'none', writeApi: false },
}, null, 2), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300'}});
