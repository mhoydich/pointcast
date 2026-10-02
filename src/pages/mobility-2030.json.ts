import concept from '../data/mobility-2030.json';
import regulatory from '../data/mobility-2030-regulatory.json';
export const GET = () => new Response(JSON.stringify({concept, regulatory}), {headers:{'Content-Type':'application/json; charset=utf-8'}});
