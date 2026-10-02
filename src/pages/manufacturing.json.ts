import atlas from '../data/manufacturing-atlas.json';
export const GET = () => new Response(JSON.stringify(atlas), {headers:{'Content-Type':'application/json; charset=utf-8'}});
