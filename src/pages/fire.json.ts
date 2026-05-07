import type { APIRoute } from 'astro';
import { FIRE_PRACTICES, FIRE_REALMS, FOUR_ELEMENTS, PRINCIPLES, SAFETY_CHECKLIST, SYNTHESIS_NOTES, TRACK_META } from '../lib/fire';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/fire.json',
    name: TRACK_META.title, subtitle: TRACK_META.subtitle, thesis: TRACK_META.thesis,
    paperNumber: TRACK_META.paperNumber, date: TRACK_META.date, authors: TRACK_META.authors,
    principles: PRINCIPLES, realms: FIRE_REALMS, safety: SAFETY_CHECKLIST,
    practices: FIRE_PRACTICES, fourElements: FOUR_ELEMENTS, synthesis: SYNTHESIS_NOTES,
    counts: { realms: FIRE_REALMS.length, safety: SAFETY_CHECKLIST.length, practices: FIRE_PRACTICES.length, principles: PRINCIPLES.length, elements: FOUR_ELEMENTS.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/fire', parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: { ues: 'https://pointcast.xyz/university-of-el-segundo', geology: 'https://pointcast.xyz/geology', oceanWing: 'https://pointcast.xyz/ocean-wing', marineLayer: 'https://pointcast.xyz/marine-layer', naturePractice: 'https://pointcast.xyz/nature-practice', commons: 'https://pointcast.xyz/commons', commonForms: 'https://pointcast.xyz/common-forms' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
