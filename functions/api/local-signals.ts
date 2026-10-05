import { collectSignals } from '../../src/lib/local-signals.mjs';
export const onRequest: PagesFunction = async ctx => {
  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const key = new Request(new URL('/api/local-signals',ctx.request.url));
  const cached = await caches.default.match(key);
  if(cached) return ctx.request.method === 'HEAD' ? new Response(null,{headers:cached.headers}) : cached;
  const payload = await collectSignals();
  const response = new Response(JSON.stringify(payload),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60','Access-Control-Allow-Origin':'*'}});
  ctx.waitUntil(caches.default.put(key,response.clone()));
  return ctx.request.method === 'HEAD' ? new Response(null,{headers:response.headers}) : response;
};
