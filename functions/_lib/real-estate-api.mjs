import { study, queryStudy } from '../../src/lib/real-estate-study.mjs';
import { DEFAULT_INPUTS, INPUT_FIELDS, compareScenarios } from '../../src/lib/real-estate-scenario.mjs';
import { FHFA_URL, USGS_URL, parseFhfaCsv, normalizeUsgs } from '../../src/lib/real-estate-feeds.mjs';
import { STUDY_CENTER, haversineMiles } from '../../src/lib/real-estate-local.mjs';
import snapshots from '../../src/data/real-estate-snapshots.json' with {type:'json'};
const headers={'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers});}
export async function boundedText(response,maxBytes){
  if(!response.ok) throw new Error('Upstream unavailable');
  if(Number(response.headers.get('Content-Length')||0)>maxBytes) throw new Error('Upstream response too large');
  if(!response.body) throw new Error('Upstream body absent');
  const reader=response.body.getReader(),chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes)throw new Error('Upstream response too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
  const data=new Uint8Array(length);let at=0;for(const chunk of chunks){data.set(chunk,at);at+=chunk.byteLength;}return new TextDecoder().decode(data);
}
export async function realEstateRequest(request,fetcher=fetch,cache=globalThis.caches?.default){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','HEAD'].includes(request.method))return json({error:'Read-only endpoint; use GET.'},405);
  const url=new URL(request.url),action=url.pathname.split('/').filter(Boolean).at(-1);
  if(request.method==='HEAD')return new Response(null,{status:200,headers});
  try{
    if(action==='query'){
      const allowed=new Set(['q','type','region']);for(const [key]of url.searchParams)if(!allowed.has(key))return json({error:`Unknown query parameter: ${key}`},400);
      const q=url.searchParams.get('q')||'',type=url.searchParams.get('type')||'all',region=url.searchParams.get('region')||'all';
      if(q.length>120||type.length>40||!['all','local','global'].includes(region))return json({error:'Invalid search/filter.'},400);
      return json(queryStudy({q,type,region}));
    }
    if(action==='scenario'){
      const inputs={};for(const [key,value]of url.searchParams){if(!Object.hasOwn(DEFAULT_INPUTS,key))return json({error:`Unknown input: ${key}`},400);if(Object.hasOwn(inputs,key))return json({error:`Duplicate input: ${key}`},400);if(value.trim()==='')return json({error:`Empty input: ${key}`},400);inputs[key]=Number(value);}
      return json({kind:'hypothetical-model',readOnly:true,results:compareScenarios(inputs),inputSchema:INPUT_FIELDS});
    }
    if(action==='feed'){
      const kind=url.searchParams.get('source');if(!['fhfa','usgs'].includes(kind)||[...url.searchParams.keys()].some(k=>k!=='source'))return json({error:'Choose source=fhfa or source=usgs.'},400);
      const source=kind==='fhfa'?FHFA_URL:USGS_URL;
      const cacheKey=new Request(`${url.origin}/api/real-estate/feed?source=${kind}&schema=1`);
      if(cache)try{const hit=await cache.match(cacheKey);if(hit){const data=await hit.json();return json({...data,status:'cached',servedAt:new Date().toISOString(),cacheTtlSeconds:kind==='fhfa'?3600:60});}}catch{/* Edge cache failure must not remove source access or dated fallback. */}
      try{
        const response=await fetcher(source,{headers:{Accept:kind==='fhfa'?'text/csv':'application/json'},signal:AbortSignal.timeout(12000),redirect:'error'});
        const text=await boundedText(response,kind==='fhfa'?6000000:4000000);
        const data=kind==='fhfa'?parseFhfaCsv(text):normalizeUsgs(JSON.parse(text),STUDY_CENTER,haversineMiles);
        const result={...data,status:'fetched',servedAt:new Date().toISOString(),automaticRefresh:false};
        if(cache)try{await cache.put(cacheKey,new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json','Cache-Control':`public, max-age=${kind==='fhfa'?3600:60}`}}));}catch{/* Derived public response only; no credentials, cookies or upstream bulk file is cached. */}
        return json(result);
      }catch{return json({...snapshots[kind],status:'snapshot-fallback',servedAt:new Date().toISOString(),automaticRefresh:false,error:'Public source unavailable or invalid. Showing the explicitly dated stored snapshot.'});}
    }
    return json({error:'Unknown real-estate endpoint.',manifest:study.endpoints},404);
  }catch(error){return json({error:error instanceof Error?error.message:'Invalid request.'},400);}
}
