import { basketSnapshot, validateObservation } from '../../src/lib/local-costs.mjs';
import { rateLimit } from '../_rate-limit';
import { readSessionFromRequest, type AuthEnv } from './auth/session';
import { hasDirectorDeskAccess } from '../../src/lib/director-access';
interface Env extends AuthEnv { PC_PING_KV?: KVNamespace; PC_RATES_KV?: KVNamespace; }
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}});
export const onRequest: PagesFunction<Env> = async ctx => {
  const {request,env}=ctx;
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'}});
  if(request.method==='GET') {
    if(new URL(request.url).searchParams.get('action')!=='queue') return json({...basketSnapshot(),intakeAvailable:Boolean(env.PC_PING_KV&&env.PC_RATES_KV)});
    const session=await readSessionFromRequest(request,env);
    if(!hasDirectorDeskAccess(session)) return json({error:'Director sign-in required'},403);
    if(!env.PC_PING_KV) return json({error:'Intake storage unavailable'},503);
    const cursor=new URL(request.url).searchParams.get('cursor');
    if(cursor && cursor.length>2048) return json({error:'Invalid cursor'},400);
    const page=await env.PC_PING_KV.list({prefix:'local-costs:candidate:',limit:100,...(cursor?{cursor}:{})});
    const entries=await Promise.all(page.keys.map(async k=>({key:k.name,observation:await env.PC_PING_KV!.get(k.name,'json')})));
    return json({entries,more:!page.list_complete,cursor:page.list_complete?null:page.cursor,review:'Pending candidates only. Review evidence before adding a reviewed record to the repository through a PR.'});
  }
  if(request.method!=='POST') return json({error:'Method not allowed'},405);
  if(!env.PC_PING_KV||!env.PC_RATES_KV) return json({error:'Contribution intake unavailable. Submit a sourced observation through a repository pull request.'},503);
  const limit=await rateLimit(request,env,{bucket:'local-costs',windowSec:3600,maxRequests:10});
  if(!limit.allowed) return json({error:'Contribution limit reached. Try later.'},429);
  if(limit.degraded) return json({error:'Contribution limit service unavailable'},503);
  try {
    const reader=request.body?.getReader(); if(!reader) return json({error:'JSON body required'},400);
    let length=0; const chunks:Uint8Array[]=[];
    while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();return json({error:'Observation exceeds 8 KB'},413);}chunks.push(value);}
    const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
    const observation=validateObservation(JSON.parse(new TextDecoder().decode(bytes)));
    const receivedAt=new Date().toISOString(),id=crypto.randomUUID();
    const key=`local-costs:candidate:${String(9999999999999-Date.now()).padStart(13,'0')}:${id}`;
    try { await env.PC_PING_KV.put(key,JSON.stringify({...observation,id,receivedAt}),{expirationTtl:90*86400}); }
    catch { return json({error:'Intake storage unavailable. Candidate was not confirmed saved.'},503); }
    return json({ok:true,id,status:'pending-review',receivedAt,message:'Candidate saved for review. It has not changed the public basket.'},201);
  }catch(error){return json({error:error instanceof Error?error.message:'Could not save observation'},400);}
};
