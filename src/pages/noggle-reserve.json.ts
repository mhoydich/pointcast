import type { APIRoute } from 'astro';
import { RESERVE, NOTE_STUDIES } from '../lib/noggle-reserve';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...RESERVE,
  noteStudies: NOTE_STUDIES.map(note => ({...note, image: `https://pointcast.xyz/images/noggle-reserve/${note.file}.webp`})),
  journeyLedger: { status: 'Fictional read-only demonstration; no submitted records or transfer verification', serial: 'NR-10-DEMO', stops: ['Printer proof · imagined', 'Gallery table · imagined', 'A friend’s pocket · imagined'] },
  agentAccess: { method: 'GET', authentication: 'none', sideEffects: 'none', writeApi: false },
}, null, 2), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300'}});
