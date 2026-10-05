import type {APIRoute} from 'astro';
import portal from '../../data/ues-front-door.json';
export const GET: APIRoute = () => new Response(JSON.stringify(portal, null, 2), {headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'public, max-age=300, s-maxage=3600',
  'Access-Control-Allow-Origin':'*',
}});
