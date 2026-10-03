import type { APIRoute } from 'astro';
import book from '../data/canterbury.json';
export const GET: APIRoute = () => new Response(JSON.stringify(book), {headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}});
