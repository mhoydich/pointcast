import {claimHandle,ownClaim,primary} from '../../../src/lib/loom/handles.mjs';
import {handleJson,handlePrincipal,boundedHandleJson} from '../../_lib/loom-handle-auth.ts';
import {rateLimit} from '../../_rate-limit.ts';
export const onRequest: PagesFunction<any> = async ({request,env}) => {
  if(!['GET','POST'].includes(request.method))return handleJson({ok:false,error:'method_not_allowed'},405);
  if(request.method==='POST' && env.LOOM_HANDLES_ENABLED!=='1')return handleJson({ok:false,error:'handles_disabled'},503);
  if(!env.AUTH_DB)return handleJson({ok:false,error:'claim_store_unavailable'},503);
  try {
    let payload:Record<string,unknown>={};
    if(request.method==='POST') {
      const parsed=await boundedHandleJson(request,2048);if(parsed.response)return parsed.response;payload=parsed.payload;
    }
    const auth=await handlePrincipal(request,env,payload,'loom.claim','loom:claim');
    if(auth.response)return auth.response;
    if(!auth.principal)return handleJson({ok:false,error:'sign_in_or_agent_proof_required'},401);
    const db=primary(env.AUTH_DB);
    if(request.method==='GET')return handleJson({ok:true,claimsOpen:env.LOOM_HANDLES_ENABLED==='1',claim:await ownClaim(db,auth.principal)});
    const gate=await rateLimit(request,env,{bucket:'loom:claim',clientId:auth.principal,windowSec:600,maxRequests:5});
    if(!gate.allowed)return handleJson({ok:false,error:'rate_limited',retryAfter:gate.retryAfter},429);
    const result=await claimHandle(db,env.PC_LOOM_KV??env.VISITS,payload.handle,auth.principal,auth.proof);
    return result.error ? handleJson({ok:false,error:result.error},result.status) : handleJson({ok:true,...result});
  } catch {return handleJson({ok:false,error:'claim_store_unavailable'},503);}
};
