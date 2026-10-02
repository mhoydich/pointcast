import catalog from '../data/everyday.json';
export const GET = () => new Response(JSON.stringify(catalog, null, 2), {
  headers: {'Content-Type': 'application/json; charset=utf-8'},
});
