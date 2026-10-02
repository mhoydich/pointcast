import type {APIRoute} from 'astro';
import source from '../../data/communications-lab.json';
import {normalizeLab} from '../../lib/communications-lab-normalize.mjs';
export const GET: APIRoute = () => new Response(JSON.stringify({...normalizeLab(source),url:'https://pointcast.xyz/communications-lab/',projects:normalizeLab(source).projects.map(p=>({...p,url:'https://pointcast.xyz/communications-lab/projects/'+p.slug+'/'}))},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
