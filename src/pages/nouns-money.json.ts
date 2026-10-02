import type { APIRoute } from 'astro';
import HUNDRED from '../data/nouns-money-hundred.json';
import { MONEY, NOTE_DESIGNS, NORDIC_STUDIES, CAMPAIGN_POSTERS } from '../lib/nouns-money';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...MONEY,
  nordic100Catalog: {...HUNDRED, specs:{trimMm:[150,75],rasterPx:[1800,900],bleedSvgMm:[156,81],colorSpace:'RGB; no printer-specific CMYK or physical proof verified'}, status:'Read-only art catalog; proposed Tezos mint, no tokens issued by this page', catalog:HUNDRED.catalog.map(note=>({...note,image:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.webp`,png:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.png`,svg:`https://pointcast.xyz/images/nouns-money/nordic-100/${note.file}.svg`}))},
  designs: NOTE_DESIGNS.map(note => ({...note, image: `https://pointcast.xyz/images/nouns-money/${note.file}.webp`, svg: `https://pointcast.xyz/images/nouns-money/${note.file}.svg`})),
  nordic2027Studies: { status: 'Generated visual interpretations from authentic Nouns references; not exact-source print masters or production-ready files', effects: 'Engraved, iridescent and translucent details are proposed visual effects, not verified material, authentication or security functionality', studies: NORDIC_STUDIES.map(note=>({...note,image:`https://pointcast.xyz/images/nouns-money/nordic-2027/${note.file}.webp`})) },
  campaignArt: { status: 'Generated concept posters; not evidence of physical production', posters: CAMPAIGN_POSTERS.map(poster=>({...poster,image:`https://pointcast.xyz/images/nouns-money/campaign/${poster.file}.webp`})) },
  journey: { status: 'Fictional read-only example; no submissions or transfer verification', serial: 'NM-001-DEMO', stops: ['First proof · imagined', 'Art table · imagined', 'A friend’s pocket · imagined'] },
  agentAccess: { method: 'GET', authentication: 'none', sideEffects: 'none', writeApi: false },
}, null, 2), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300'}});
