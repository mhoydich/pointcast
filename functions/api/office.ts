/** Bounded, public read-only snapshot. No bindings, credentials, writes or polling. */
import seats from '../../src/data/office-seat-records.json';
import { projectFreshness } from '../../public/office/freshness.mjs';
import { readOfficeSnapshot, OFFICE_END } from '../../src/lib/office-page.mjs';
import { validateDeclaration } from '../../src/lib/office/declarations.mjs';
import { buildDeskRegistry } from '../../src/lib/office/desk-registry.mjs';
import { readLoom } from '../../src/lib/office/loom-read.mjs';
import { normalizeLoomEvents } from '../../src/lib/office/events.mjs';
import { readPrStates } from '../../src/lib/office/pr-state.mjs';
export const onRequest: PagesFunction = async ({request}) => {
  const cacheHeaders=()=>{const remaining=Math.max(0,Math.floor((OFFICE_END-Date.now())/1000));return {'Cache-Control':`public, max-age=${Math.min(60,remaining)}, s-maxage=${Math.min(120,remaining)}`};};
  const headers = {'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff',...cacheHeaders(),'X-Robots-Tag':'noindex'};
  if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  if (new URL(request.url).search) return new Response(JSON.stringify({error:'query_not_supported'}),{status:400,headers});
  if (request.method==='HEAD') return new Response(null,{headers});
  try {
    const snapshot = await readOfficeSnapshot({records:seats.records,adapters:{validateDeclaration,buildDeskRegistry,readLoom,normalizeLoomEvents,readPrStates}});
    return new Response(JSON.stringify(projectFreshness(snapshot,Date.now())),{headers:{...headers,...cacheHeaders()}});
  } catch {
    return new Response(JSON.stringify({schema:'pointcast.office-view/v1',state:'error',errors:['snapshot_unavailable']}),{status:503,headers:{...headers,'Cache-Control':'no-store'}});
  }
};
