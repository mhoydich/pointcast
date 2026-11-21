import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/deskmate.ts';
const endpoint='https://pointcast.xyz/api/deskmate';
function context(method,origin='https://officenoun.xyz', body) {
  // Any access to provider/config bindings fails the test, not just a model call.
  return { request:new Request(endpoint,{method,headers:origin?{Origin:origin}:{},
    ...(body===undefined?{}:{body:JSON.stringify(body)})}),
    env:new Proxy({}, {get(){throw new Error('contained route touched environment');}}) };
}
test('GET reports closed even when env access would throw',async()=>{
 const r=await onRequest(context('GET'));const b=await r.json();
 assert.equal(r.status,200);assert.equal(b.open,false);assert.equal(b.backend,null);
});
for(const origin of ['https://officenoun.xyz',null]){
 test('POST contained before body parsing or provider for '+origin,async()=>{
  const c=context('POST',origin,{noun:'toast',plan:'fulltime',messages:[{role:'user',content:'eggs'}]});
  c.request.text=()=>{throw new Error('contained request read body');};
  const r=await onRequest(c);assert.equal(r.status,503);assert.equal((await r.json()).error,'not_configured');
 });
}
test('allowed preflight retained',async()=>{
 const r=await onRequest(context('OPTIONS'));assert.equal(r.status,204);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://officenoun.xyz');
});
test('disallowed browser origin still denied',async()=>{
 const r=await onRequest(context('POST','https://evil.example',{}));assert.equal(r.status,403);
});
test('other methods fail without provider',async()=>{
 const r=await onRequest(context('DELETE'));assert.equal(r.status,405);
});
