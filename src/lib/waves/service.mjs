import {boundedText} from '../observatory/data.mjs';
import {SCHEMA_VERSION,STATION} from '../../../public/waves/model.mjs';
import {MAX_FEED_BYTES,parseNdbc,makePacket,validPacket,atRequestTime} from './data.mjs';
const cacheRequest=kind=>new Request(`https://pointcast.xyz/api/waves-cache/${SCHEMA_VERSION}/${kind}`);
const headers={'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=60'};
async function readCache(cache,kind,now){
  if(!cache)return null;
  try{const hit=await cache.match(cacheRequest(kind));if(!hit)return null;const packet=JSON.parse(await boundedText(hit,256*1024));return validPacket(packet,now)?packet:null;}catch{return null;}
}
async function save(cache,kind,packet,ttl){
  if(!cache)return;
  try{await cache.put(cacheRequest(kind),new Response(JSON.stringify(packet),{headers:{'Content-Type':'application/json','Cache-Control':`public, max-age=${ttl}`}}));}catch{/* Cache eviction/failure never changes the observed source data. */}
}
function errorCode(error){
  const code=String(error?.message??'');
  return /^(?:upstream_http_\d{3}|upstream_(?:content_type|too_large|empty|regressed)|feed_(?:too_large|too_many_rows|header_invalid|units_invalid|frequency_invalid|no_waves))$/.test(code)?code:error?.name==='TimeoutError'||error?.name==='AbortError'?'upstream_timeout':'upstream_unavailable';
}
export async function handleWaves(request,{fetcher=fetch,cache=null,clock=()=>new Date()}={}){
  if(!['GET','HEAD','OPTIONS'].includes(request.method))return new Response(JSON.stringify({error:'method_not_allowed'}),{status:405,headers:{...headers,'Cache-Control':'no-store',Allow:'GET, HEAD, OPTIONS'}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{Allow:'GET, HEAD, OPTIONS'}});
  const now=clock();
  let packet=await readCache(cache,'fresh',now),origin='fresh';
  // Cached fallback packets may have failed upstream. Their shorter TTL permits another bounded attempt.
  if(!packet){
    try{
      const response=await fetcher(STATION.feedUrl,{headers:{Accept:'text/plain','User-Agent':'PointCastMorningWaves/1.0 (https://pointcast.xyz/waves/)'},signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error(`upstream_http_${response.status}`);
      if(!/^text\/plain\b/i.test(response.headers.get('content-type')??''))throw new Error('upstream_content_type');
      const text=await boundedText(response,MAX_FEED_BYTES),retrieved=clock();
      const parsed=parseNdbc(text,retrieved);if(!parsed.observation)throw new Error('feed_no_waves');
      const previous=await readCache(cache,'last-good',retrieved);
      if(previous?.observation && Date.parse(previous.observation.observedAt)>Date.parse(parsed.observation.observedAt))throw new Error('upstream_regressed');
      packet=makePacket(parsed,retrieved.toISOString());origin='refreshed';
      // The longer, versioned last-good entry is retained across fresh-cache expiry (best effort edge cache).
      await save(cache,'last-good',packet,86400);await save(cache,'fresh',packet,600);
    }catch(error){
      const code=errorCode(error);packet=await readCache(cache,'last-good',clock());origin=packet?'last-good':'none';
      packet=packet?atRequestTime(packet,clock(),code):{schemaVersion:SCHEMA_VERSION,station:STATION,retrievedAt:null,assembledAt:clock().toISOString(),observation:null,history:[],historyWindow:{from:new Date(clock().getTime()-86400000).toISOString(),to:clock().toISOString()},upstream:{status:'failed',code}};
      if(packet.observation)await save(cache,'fresh',packet,30);
    }
  }
  packet=atRequestTime(packet,clock());
  const body=JSON.stringify(packet),responseHeaders={...headers,'X-Waves-Cache':origin,'Content-Length':String(new TextEncoder().encode(body).byteLength)};
  if(!packet.observation)responseHeaders['Cache-Control']='no-store';
  return new Response(request.method==='HEAD'?null:body,{status:packet.observation?200:503,headers:responseHeaders});
}
