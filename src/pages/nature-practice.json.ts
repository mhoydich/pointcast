import type { APIRoute } from 'astro';
import { ARCHITECTURE_PRINCIPLES, PRINCIPLES, PROPOSAL_FORMAT, TRACK_META, TWELVE_SPECIES, TWELVE_WALKS } from '../lib/naturePractice';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/nature-practice.json',
    name: TRACK_META.title, subtitle: TRACK_META.subtitle, thesis: TRACK_META.thesis,
    paperNumber: TRACK_META.paperNumber, date: TRACK_META.date, authors: TRACK_META.authors,
    principles: PRINCIPLES, twelveSpecies: TWELVE_SPECIES, twelveWalks: TWELVE_WALKS,
    architecturePrinciples: ARCHITECTURE_PRINCIPLES, proposalFormat: PROPOSAL_FORMAT,
    counts: { species: TWELVE_SPECIES.length, walks: TWELVE_WALKS.length, principles: PRINCIPLES.length, archPrinciples: ARCHITECTURE_PRINCIPLES.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/nature-practice', parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { ues: 'https://pointcast.xyz/university-of-el-segundo', marineLayer: 'https://pointcast.xyz/marine-layer', geology: 'https://pointcast.xyz/geology', oceanWing: 'https://pointcast.xyz/ocean-wing', commons: 'https://pointcast.xyz/commons', commonForms: 'https://pointcast.xyz/common-forms', honeyLeague: 'https://pointcast.xyz/honey-league' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
