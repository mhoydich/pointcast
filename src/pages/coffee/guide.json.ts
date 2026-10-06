import guide from '../../data/pantry/coffee.json';
export const GET = () => new Response(JSON.stringify(guide), {headers:{'Content-Type':'application/json; charset=utf-8'}});
