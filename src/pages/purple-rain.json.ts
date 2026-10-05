import data from '../data/purple-rain.json';
export function GET() {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {'Content-Type':'application/json; charset=utf-8'}
  });
}
