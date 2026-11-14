import {primary} from '../../src/lib/loom/handles.mjs';
import {readSessionFromRequest} from '../api/auth/session.ts';
import {AGENT_IDENTITY_HEADERS,hashAgentActionRequest,verifyAgentRequest} from './agent-identity.ts';
export const handleJson = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handlePrincipal(request:Request,env:any,payload:Record<string,unknown>,action:string,scope:string) {
  if(AGENT_IDENTITY_HEADERS.some(h=>request.headers.has(h))) {
    if(!env.AUTH_DB)return {response:handleJson({ok:false,error:'proof_store_unavailable'},503)};
    const requestHash=await hashAgentActionRequest(action,payload);
    const verified=await verifyAgentRequest(primary(env.AUTH_DB),request,requestHash,scope);
    if(verified.response)return {response:verified.response};
    if(!verified.agentId)return {response:handleJson({ok:false,error:'agent_proof_required'},401)};
    const bytes=new TextEncoder().encode(verified.agentId+'\n'+new Date(request.headers.get('PointCast-Agent-Timestamp')!).toISOString()+'\n'+requestHash);
    const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    return {principal:'agent:'+verified.agentId,proof:'agent_key',agentId:verified.agentId,fingerprint};
  }
  const current=env.AUTH_DB ? await readSessionFromRequest(request,{AUTH_DB:primary(env.AUTH_DB)}) : null;
  if(!current)return {principal:null};
  if(request.method!=='GET' && request.headers.get('Origin')!==new URL(request.url).origin)
    return {response:handleJson({ok:false,error:'same_origin_required'},403)};
  return {principal:'account:'+current.session.userId,proof:'account'};
}

export async function boundedHandleJson(request:Request,limit:number) {
  const reader=request.clone().body?.getReader();
  if(!reader)return {response:handleJson({ok:false,error:'json_invalid'},400)};
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;
    if(size>limit){void reader.cancel().catch(()=>{});return {response:handleJson({ok:false,error:'body_too_large'},413)};}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{const payload=JSON.parse(new TextDecoder().decode(bytes));
    if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('object required');
    return {payload};
  }catch{return {response:handleJson({ok:false,error:'json_invalid'},400)};}
}
