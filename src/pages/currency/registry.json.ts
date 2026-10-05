import registry from '../../data/currency/registry.json';
export const GET = () => new Response(JSON.stringify(registry), {headers:{'Content-Type':'application/json; charset=utf-8'}});
