import {study} from '../lib/real-estate-study.mjs';
export const GET=()=>new Response(JSON.stringify(study,null,2),{headers:{'Content-Type':'application/json; charset=utf-8'}});
