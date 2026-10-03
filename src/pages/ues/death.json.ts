import type { APIRoute } from 'astro';
import study from '../../data/ues-living-studies/death.json';
import models from '../../data/ues-living-studies/death-models.json';
import sourceRights from '../../data/ues-living-studies/death-source-rights.json';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...study,
  edition: '2026-10-03', author: 'Michael Hoydich',
  assistance: 'Research, drafting, and original vector art: Codex; two independent OpenAI model contributions individually attributed',
  human: 'https://pointcast.xyz/ues/death/',
  educationalBoundary: 'Comparative education; empirical findings, philosophical arguments, traditions, and uncertainty are distinguished. No personal beliefs or experiences are asserted for the named author.',
  privacy: {reflection: 'browser-local only; explicit save; text export and scoped clear',account:false,entryAnalytics:false,serverSync:false,healthDataCollection:false},
  artwork: {url:'/images/ues-living-studies/death.svg',creator:'Codex',created:'2026-10-03',method:'original code-authored SVG; no third-party art',role:'conceptual illustration, not clinical evidence'},
  models, sourceRights,
  editionConcept: '/editions/death-2026-10-03/concept.json',
}, null, 2), {headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Cache-Control':'public, max-age=300'}});
