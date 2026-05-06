import type { APIRoute } from 'astro';
import { COMMISSIONS, FORM_VOCABULARY, INFLUENCES, PLAN_META, PRINCIPLES, SEQUENCE, STEWARDSHIP_NOTES } from '../lib/commonForms';

export const GET: APIRoute = async () => {
  const totalLow = COMMISSIONS.reduce((s, c) => s + c.costLow, 0);
  const totalHigh = COMMISSIONS.reduce((s, c) => s + c.costHigh, 0);
  const payload = {
    $schema: 'https://pointcast.xyz/common-forms.json',
    name: PLAN_META.title,
    subtitle: PLAN_META.subtitle,
    tagline: PLAN_META.tagline,
    publication: PLAN_META.publication,
    paperNumber: PLAN_META.paperNumber,
    authors: PLAN_META.authors,
    affiliation: PLAN_META.affiliation,
    date: PLAN_META.date,
    thesis: PLAN_META.thesis,
    principles: PRINCIPLES,
    formVocabulary: FORM_VOCABULARY,
    commissions: COMMISSIONS,
    influences: INFLUENCES,
    sequence: SEQUENCE,
    stewardshipNotes: STEWARDSHIP_NOTES,
    counts: {
      total: COMMISSIONS.length,
      tierA: COMMISSIONS.filter((c) => c.tier === 'A').length,
      tierB: COMMISSIONS.filter((c) => c.tier === 'B').length,
      tierC: COMMISSIONS.filter((c) => c.tier === 'C').length,
      totalCostLow: totalLow,
      totalCostHigh: totalHigh,
    },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/common-forms',
    parent: 'https://pointcast.xyz/university-of-el-segundo',
    related: {
      ues: 'https://pointcast.xyz/university-of-el-segundo',
      commons: 'https://pointcast.xyz/commons',
      sponsorBench: 'https://pointcast.xyz/sponsor-a-bench',
      marineLayer: 'https://pointcast.xyz/marine-layer',
      civicLayer: 'https://pointcast.xyz/civic-layer',
      geology: 'https://pointcast.xyz/geology',
      labs: 'https://pointcast.xyz/labs',
    },
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
  });
};
