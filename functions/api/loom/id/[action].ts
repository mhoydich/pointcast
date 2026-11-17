/** OFF-66 step three. Public read, authenticated explicit POST only. No key provision. */
import {createLink,redeemLink,saveHandoff,getCard,latestSave} from '../../../../src/lib/loom/id-layer.mjs';
import {normalizeHandle,primary} from '../../../../src/lib/loom/handles.mjs';
import {handleJson,handlePrincipal,boundedHandleJson} from '../../../_lib/loom-handle-auth.ts';
import {rateLimit} from '../../../_rate-limit.ts';
const fields:Record<string,string[]> = {
  link:['handle','kind'], redeem:['token'], save:['handle','note','memoryRef','branch']
};
export const onRequest:PagesFunction<any> = async ({request,env,params}) => {
  if(env.LOOM_ID_ENABLED!=='1')return handleJson({ok:false,error:'id_disabled'},503);
  const url=new URL(request.url);
  // Secrets and handoff tokens belong in private request bodies, never URLs.
  if(url.search)return handleJson({ok:false,error:'query_parameters_not_allowed'},400);
  if(!['GET','POST'].includes(request.method))return handleJson({ok:false,error:'method_not_allowed'},405);
  if(!env.AUTH_DB)return handleJson({ok:false,error:'id_store_unavailable'},503);
  const action=String(params.action??'');
  try {
    const db=primary(env.AUTH_DB);
    if(request.method==='GET') {
      const handle=normalizeHandle(action);
      if(!handle)return handleJson({ok:false,error:'invalid_handle'},400);
      const claim=await db.prepare('SELECT principal FROM loom_handles WHERE handle=?').bind(handle).first();
      if(!claim?.principal)return handleJson({ok:false,error:'claimed_handle_not_found'},404);
      return handleJson({ok:true,handle:'@'+handle,card:await getCard(db,handle),save:await latestSave(db,handle)});
    }
    if(!fields[action])return handleJson({ok:false,error:'method_not_allowed'},405);
    if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')??''))return handleJson({ok:false,error:'json_required'},415);
    const parsed=await boundedHandleJson(request,8192);if(parsed.response)return parsed.response;
    const payload=parsed.payload;
    if(Object.keys(payload).some(k=>!fields[action].includes(k)))return handleJson({ok:false,error:'unexpected_field'},400);
    const auth=await handlePrincipal(request,env,payload,'loom.id.'+action,'loom:id:'+action);
    if(auth.response)return auth.response;
    if(!auth.principal || !auth.holder)return handleJson({ok:false,error:'authenticated_holder_required'},401);
    const limit=await rateLimit(request,env,{bucket:'loom:id:'+action,clientId:auth.principal,windowSec:600,maxRequests:action==='save'?30:10});
    if(!limit.allowed)return handleJson({ok:false,error:'rate_limited',retryAfter:limit.retryAfter},429);
    if(auth.fingerprint) {
      const now=Date.now();
      await db.prepare('DELETE FROM loom_handle_requests WHERE expires_at < ?').bind(now).run();
      const used=await db.prepare('INSERT OR IGNORE INTO loom_handle_requests (fingerprint,expires_at) VALUES (?,?)').bind(auth.fingerprint,now+11*60*1000).run();
      if(used.meta?.changes!==1)return handleJson({ok:false,error:'id_request_replayed'},409);
    }
    let result;
    if(action==='link') {
      if(!['claim','continue'].includes(String(payload.kind)))return handleJson({ok:false,error:'invalid_kind'},400);
      result=await createLink(db,{handle:payload.handle,kind:payload.kind,principal:auth.principal});
    } else if(action==='redeem') {
      result=await redeemLink(db,{token:payload.token,session:auth.holder,allowFork:false});
    } else {
      result=await saveHandoff(db,{handle:payload.handle,session:auth.holder,note:payload.note,memoryRef:payload.memoryRef??null,branch:payload.branch??null});
    }
    return result.error ? handleJson({ok:false,error:result.error},result.status) : handleJson({ok:true,...result});
  } catch {return handleJson({ok:false,error:'id_store_unavailable'},503);}
};
