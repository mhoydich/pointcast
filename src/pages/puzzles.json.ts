import type { APIRoute } from 'astro';
import concepts from '../data/puzzle-concepts.json';
import research from '../data/puzzle-research.json';
import business from '../data/puzzle-business.json';
import provenance from '../data/puzzle-art-provenance.json';
export const GET:APIRoute=()=>new Response(JSON.stringify({version:'puzzles-v1-2026-10-03',title:'PointCast Puzzles',asOf:'2026-10-03',conceptHorizon:'2027',researchObservationDate:'2026-10-03',status:'Original artwork concepts; no physical inventory or orders',routes:{world:'/puzzles/',make:'/puzzles/make/',business:'/puzzles/business/',studio:'/puzzles/studio/',shop:'/shop/puzzles/'},concepts:concepts.map(c=>({...c,image:`https://pointcast.xyz/images/puzzles/${c.art}`,commercialStatus:'concept-not-for-sale',productionReady:false})),research,business,artProvenance:provenance,playlist:{url:'https://open.spotify.com/playlist/0AegDPw3ddtdk31PHRB1Og?si=7d8cba49633940a6',title:'veridis quo surfer dreams',creator:'mhoydich',audioReviewed:false}},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'}});
