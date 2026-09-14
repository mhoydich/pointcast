import test from 'node:test';
import assert from 'node:assert/strict';
import gateway, { VoiceSupervisor } from '../src/index.ts';

const origin='https://example.test';
const sdp='v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n';
class Storage {
  data=new Map(); alarmAt=null; tail=Promise.resolve();
  async get(key){return structuredClone(this.data.get(key));}
  async put(key,value){this.data.set(key,structuredClone(value));}
  async setAlarm(at){this.alarmAt=at;}
  async deleteAlarm(){this.alarmAt=null;}
  async transaction(fn){let unlock;const old=this.tail;this.tail=new Promise(resolve=>unlock=resolve);await old;try{return await fn(this);}finally{unlock();}}
}
class Socket extends EventTarget {
  readyState=0; sent=[]; shouldClose=true;
  accept(){this.readyState=1;}
  send(data){this.sent.push(JSON.parse(data)); if(JSON.parse(data).type==='session.thinking.append')queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.thinking.appended',client_event_id:JSON.parse(data).event_id})})));  if(this.shouldClose&&JSON.parse(data).type==='session.close')queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.closed'})})));}
  close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
}
async function fixture(overrides={}) {
  const storage=new Storage();let ready=Promise.resolve();const pending=[];
  const ctx={storage,blockConcurrencyWhile(fn){ready=fn();return ready;},waitUntil(promise){pending.push(promise);}};
  const env={VOICE_ENABLED:'true',OPENAI_API_KEY:'fixture-value-do-not-reflect',SITE_ORIGIN:origin,ENVIRONMENT:'production',MAX_SESSIONS:'10',EXPERIMENT_END:'2099-01-01T00:00:00Z',...overrides};
  const supervisor=new VoiceSupervisor(ctx,env);await ready;
  env.VOICE_SUPERVISOR={getByName(name){assert.equal(name,'public-voice-v1');return supervisor;}};
  const request=(path,body,other={})=>new Request('https://gateway.test'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.1',...(other.headers??{})},...(body===undefined?{}:{body:JSON.stringify(body)}),...other});
  return {storage,supervisor,env,request,pending};
}
function mockAPI(t,behavior={}) {
  const sockets=[];const calls=[];
  t.mock.method(globalThis,'fetch',async (url,init)=>{
    assert.equal(init.redirect,'manual','Workers only supports follow/manual; authorization must never follow redirects');
    calls.push({url,init});
    if(String(url).endsWith('/attach')){
      if(behavior.attachFails)return new Response('',{status:503});
      const socket=new Socket();if(behavior.dropClose)socket.shouldClose=false;sockets.push(socket);
      return {status:101,webSocket:socket};
    }
    if(String(url).endsWith('/responses')&&JSON.parse(init.body).tools?.[0]?.type==='web_search')return Response.json({status:'completed',output:[{type:'web_search_call',status:'completed',action:{type:'search'}},{type:'message',content:[{type:'output_text',text:'A sourced fact [1]',annotations:[{type:'url_citation',start_index:15,end_index:18,url:'https://example.org/research',title:'Primary source'}]}]}],usage:{input_tokens:100,output_tokens:20}});
    if(String(url).endsWith('/responses'))return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'Garden idea',topics:['Garden'],questions:[],imageIdea:'Garden in space'})}]}],usage:{input_tokens:10,output_tokens:20}});
    if(String(url).endsWith('/images/generations'))return Response.json({data:[{b64_json:'UklGRg=='}],usage:{input_tokens:10}});
    if(behavior.createThrows)throw Error('upstream transport failed with confidential data');
    if(behavior.status)return new Response('secret provider error',{status:behavior.status});
    return Response.json({session:{id:'live_'+calls.length,private:'do not forward'},transport:{type:'webrtc',sdp}});
  });
  return {sockets,calls};
}
test('disabled public status and create make no paid requests and reveal no credentials', async t=>{
  const f=await fixture({OPENAI_API_KEY:undefined,VOICE_ENABLED:'false'});const api=mockAPI(t);
  const status=await gateway.fetch(f.request('/status'),f.env);assert.equal((await status.json()).configured,false);
  const create=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(create.status,503);assert.equal(api.calls.length,0);
  assert.equal(JSON.stringify([...f.storage.data.values()]).includes('fixture-value'),false);
});
test('CORS denies untrusted requests before DO or upstream; preflight exact',async t=>{
  const f=await fixture();const api=mockAPI(t);
  const evil=await gateway.fetch(f.request('/session',{sdp},{headers:{Origin:'https://evil.test'}}),f.env);assert.equal(evil.status,403);assert.equal(evil.headers.has('Access-Control-Allow-Origin'),false);
  const good=await gateway.fetch(f.request('/session',undefined,{method:'OPTIONS'}),f.env);assert.equal(good.status,204);assert.equal(good.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(api.calls.length,0);
});
test('PointCast and Sites share admission state without cookie forwarding or credentialed CORS',async t=>{
  const pointcast='https://pointcast.xyz';
  const f=await fixture({POINTCAST_ORIGIN:pointcast});const api=mockAPI(t);
  for(const allowed of [origin,pointcast]){
    const preflight=await gateway.fetch(f.request('/session',undefined,{method:'OPTIONS',headers:{Origin:allowed}}),f.env);
    assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),allowed);
    assert.equal(preflight.headers.has('Access-Control-Allow-Credentials'),false);
  }
  for(const blocked of ['https://www.pointcast.xyz','https://preview.pointcast.pages.dev','https://pointcast.xyz.evil.test']){
    const denied=await gateway.fetch(f.request('/session',{sdp},{headers:{Origin:blocked}}),f.env);
    assert.equal(denied.status,403);assert.equal(denied.headers.has('Access-Control-Allow-Origin'),false);
  }
  assert.equal(api.calls.length,0);
  const create=await gateway.fetch(f.request('/session',{sdp},{headers:{Origin:pointcast,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.1',Cookie:'pc_session=fixture-private',Authorization:'Bearer fixture-pointcast'}}),f.env);
  assert.equal(create.status,201);assert.equal(create.headers.get('Access-Control-Allow-Origin'),pointcast);
  assert.equal(create.headers.has('Access-Control-Allow-Credentials'),false);
  for(const {init} of api.calls){const headers=new Headers(init.headers);assert.equal(headers.get('Cookie'),null);assert.equal(headers.get('Authorization'),'Bearer fixture-value-do-not-reflect');}
  const status=await gateway.fetch(f.request('/status'),f.env);
  assert.equal((await status.json()).remainingCalls,9);
  assert.equal((await f.storage.get('voice-ledger-v1')).attempts,1);
  const control=(await create.json()).control;
  await gateway.fetch(f.request('/session/close',control,{headers:{Origin:pointcast,'Content-Type':'application/json'}}),f.env);
});
test('invalid prompt override cannot create upstream session',async t=>{
  const f=await fixture();const api=mockAPI(t);const response=await gateway.fetch(f.request('/session',{sdp,instructions:'evil'}),f.env);assert.equal(response.status,400);assert.equal(api.calls.length,0);
});
test('sideband connected before SDP returns; control token is opaque and stored hashed',async t=>{
  const f=await fixture();const api=mockAPI(t);const response=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(response.status,201);const result=await response.json();
  assert.equal(api.calls.length,2);assert.ok(api.calls[1].url.endsWith('/attach'));assert.equal(api.sockets[0].readyState,1);
  assert.equal(result.transport.sdp,sdp);assert.equal(result.session,undefined);assert.equal(result.maxSessionSeconds,120);
  assert.equal(JSON.stringify(result).includes('fixture-value'),false);assert.equal(JSON.stringify(result).includes('private'),false);
  const state=await f.storage.get('voice-ledger-v1');assert.equal(state.attempts,1);assert.equal(state.sessions[result.control.id].status,'open');assert.equal(JSON.stringify(state).includes(result.control.token),false);assert.equal(JSON.stringify(state).includes('203.0.113.1'),false);
  assert.ok(f.storage.alarmAt<=Date.now()+120000);
});
test('opaque token closes only its session and supports unload text/plain body',async t=>{
  const f=await fixture();const api=mockAPI(t);const result=await (await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
  const wrong=await gateway.fetch(f.request('/session/close',{...result.control,token:`${crypto.randomUUID()}-${crypto.randomUUID()}`}),f.env);assert.equal(wrong.status,403);assert.equal(api.sockets[0].sent.length,0);
  const request=new Request('https://gateway.test/session/close',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:JSON.stringify(result.control)});
  const closed=await gateway.fetch(request,f.env);assert.deepEqual(await closed.json(),{closed:true});assert.equal(api.sockets[0].sent[0].type,'session.close');
});
test('durable alarm closes expired session even with no browser close request',async t=>{
  const f=await fixture();const api=mockAPI(t);const result=await (await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
  const state=await f.storage.get('voice-ledger-v1');state.sessions[result.control.id].deadline=Date.now()-1;await f.storage.put('voice-ledger-v1',state);
  await f.supervisor.alarm();assert.equal(api.sockets[0].sent[0].type,'session.close');assert.equal((await f.storage.get('voice-ledger-v1')).sessions[result.control.id].status,'closed');
});
test('Durable Object restart reattaches by stored upstream id before closing',async t=>{
  const f=await fixture();const api=mockAPI(t);const result=await (await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
  const state=await f.storage.get('voice-ledger-v1');state.sessions[result.control.id].deadline=Date.now()-1;await f.storage.put('voice-ledger-v1',state);
  const restored=new VoiceSupervisor({storage:f.storage,blockConcurrencyWhile:fn=>fn(),waitUntil:p=>f.pending.push(p)},f.env);
  await restored.alarm();assert.equal(api.calls.filter(c=>c.url.endsWith('/attach')).length,2);assert.equal((await f.storage.get('voice-ledger-v1')).sessions[result.control.id].status,'closed');
});
test('sideband failure returns no SDP and blocks further intake with durable retry',async t=>{
  const f=await fixture();const api=mockAPI(t,{attachFails:true});const response=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(response.status,503);assert.equal((await response.json()).transport,undefined);
  const state=await f.storage.get('voice-ledger-v1');assert.equal(state.attempts,1);assert.equal(Object.values(state.sessions)[0].status,'uncertain');assert.ok(f.storage.alarmAt>Date.now());
  const next=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(next.status,503);assert.equal(api.calls.filter(c=>c.url.endsWith('/sessions')).length,1);
});
test('ambiguous create blocks retry and preserves counted reservation',async t=>{
  const f=await fixture();const api=mockAPI(t,{createThrows:true});const response=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(response.status,503);assert.equal((await f.storage.get('voice-ledger-v1')).attempts,1);
  const next=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(next.status,503);assert.equal(api.calls.length,1);
});
test('authentication failure counts once, halts, and redacts provider body',async t=>{
  const f=await fixture();const api=mockAPI(t,{status:401});const response=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(response.status,503);assert.equal((await response.text()).includes('secret provider'),false);
  assert.equal((await f.storage.get('voice-ledger-v1')).haltReason,'credential_unavailable');await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(api.calls.length,1);
});
test('simultaneous create requests atomically obey two-session concurrency',async t=>{
  const f=await fixture();const api=mockAPI(t);const results=await Promise.all([1,2,3,4,5].map(()=>gateway.fetch(f.request('/session',{sdp}),f.env)));
  assert.equal(results.filter(r=>r.status===201).length,2);assert.equal(results.filter(r=>r.status===429).length,3);assert.equal(api.calls.filter(c=>c.url.endsWith('/sessions')).length,2);assert.equal((await f.storage.get('voice-ledger-v1')).attempts,2);
});

test('socket close alone never releases reservation or reports session finalized',async t=>{
  const f=await fixture();const api=mockAPI(t);const result=await (await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
  const state=await f.storage.get('voice-ledger-v1');const deadline=Date.now()+2000;state.sessions[result.control.id].deadline=deadline;await f.storage.put('voice-ledger-v1',state);
  api.sockets[0].close();await Promise.all(f.pending);
  assert.equal((await f.storage.get('voice-ledger-v1')).sessions[result.control.id].status,'uncertain');
  assert.ok(f.storage.alarmAt<=deadline);assert.equal((await (await gateway.fetch(f.request('/status'),f.env)).json()).reason,'needs_attention');
});
test('unacknowledged session.close retains capacity and schedules durable retry',async t=>{
  const f=await fixture();mockAPI(t,{dropClose:true});const result=await (await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
  const response=await gateway.fetch(f.request('/session/close',result.control),f.env);assert.equal(response.status,202);assert.deepEqual(await response.json(),{closed:false});
  const state=await f.storage.get('voice-ledger-v1');assert.equal(state.sessions[result.control.id].status,'uncertain');assert.equal(state.attempts,1);assert.ok(f.storage.alarmAt>Date.now());
});

test('studio requires call control and never saves transcripts, prompts, or generated content',async t=>{
 const f=await fixture();const api=mockAPI(t);const call=await(await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
 const invalid=await gateway.fetch(f.request('/notes',{...call.control,token:`${crypto.randomUUID()}-${crypto.randomUUID()}`,transcript:'private note sentinel'}),f.env);assert.equal(invalid.status,403);
 const response=await gateway.fetch(f.request('/notes',{...call.control,transcript:'private note sentinel'}),f.env);assert.equal(response.status,200);assert.equal((await response.json()).notes.summary,'Garden idea');
 const tooSoon=await gateway.fetch(f.request('/notes',{...call.control,transcript:'more text'}),f.env);assert.equal(tooSoon.status,429);
 const images=await Promise.all([1,2,3].map(()=>gateway.fetch(f.request('/image',{...call.control,prompt:'private image sentinel'}),f.env)));
 assert.equal(images.filter(r=>r.status===200).length,2);assert.equal(images.filter(r=>r.status===429).length,1);
 const saved=JSON.stringify(await f.storage.get('voice-ledger-v1'));assert.equal(saved.includes('sentinel'),false);assert.equal(saved.includes('Garden idea'),false);assert.equal(saved.includes('UklGRg'),false);
 assert.equal(api.calls.filter(c=>String(c.url).endsWith('/responses')).length,1);assert.equal(api.calls.filter(c=>String(c.url).endsWith('/images/generations')).length,2);
});
test('status checks the same client allowance as admission',async t=>{
 const f=await fixture();const api=mockAPI(t);const call=await(await gateway.fetch(f.request('/session',{sdp}),f.env)).json();await gateway.fetch(f.request('/session/close',call.control),f.env);
 const state=await f.storage.get('voice-ledger-v1');const hash=Object.keys(state.ipAttempts)[0];state.ipAttempts[hash]=Array(10).fill(Date.now());await f.storage.put('voice-ledger-v1',state);
 const status=await(await gateway.fetch(f.request('/status'),f.env)).json();assert.equal(status.available,false);assert.equal(status.reason,'rate_limited');assert.ok(status.retryAt>Date.now());assert.equal(status.remainingCalls,9);
});

test('expanded configuration reuses persisted ledger after restart and exposes forty additional calls',async t=>{
 const f=await fixture();const api=mockAPI(t);
 const state=await f.storage.get('voice-ledger-v1');state.attempts=10;
 state.sessions.prior={id:'prior',tokenHash:'old-hash',createdAt:1,deadline:2,status:'closed',imageAttempts:2,researchAttempts:1};
 await f.storage.put('voice-ledger-v1',state);
 const before=await(await gateway.fetch(f.request('/status'),f.env)).json();
 assert.equal(before.available,false);assert.equal(before.remainingCalls,0);
 f.env.MAX_SESSIONS='50';let ready;
 const restored=new VoiceSupervisor({storage:f.storage,blockConcurrencyWhile:fn=>(ready=fn()),waitUntil:p=>f.pending.push(p)},f.env);await ready;
 f.env.VOICE_SUPERVISOR={getByName:()=>restored};
 const after=await(await gateway.fetch(f.request('/status'),f.env)).json();
 assert.equal(after.available,true);assert.equal(after.remainingCalls,40);assert.equal(after.maxSessionSeconds,120);
 assert.equal(api.calls.length,0);assert.deepEqual(await f.storage.get('voice-ledger-v1'),state);
 const call=await gateway.fetch(f.request('/session',{sdp}),f.env);assert.equal(call.status,201);
 assert.equal((await f.storage.get('voice-ledger-v1')).attempts,11);
 assert.deepEqual((await f.storage.get('voice-ledger-v1')).sessions.prior,state.sessions.prior);
 await gateway.fetch(f.request('/session/close',(await call.json()).control),f.env);
 assert.equal((await(await gateway.fetch(f.request('/status'),f.env)).json()).remainingCalls,39);
});

test('simultaneous requests cannot overspend the last expanded call unit',async t=>{
 const f=await fixture({MAX_SESSIONS:'50'});const api=mockAPI(t);
 const state=await f.storage.get('voice-ledger-v1');state.attempts=49;await f.storage.put('voice-ledger-v1',state);
 const responses=await Promise.all([1,2,3,4,5].map(()=>gateway.fetch(f.request('/session',{sdp}),f.env)));
 assert.equal(responses.filter(r=>r.status===201).length,1);assert.equal(responses.filter(r=>r.status===429).length,4);
 assert.equal(api.calls.filter(c=>c.url.endsWith('/sessions')).length,1);
 assert.equal((await f.storage.get('voice-ledger-v1')).attempts,50);
 for(const response of responses){const body=await response.json();if(response.status===201)await gateway.fetch(f.request('/session/close',body.control),f.env);else assert.equal(body.reason,'limit_reached');}
 const status=await(await gateway.fetch(f.request('/status'),f.env)).json();
 assert.equal(status.available,false);assert.equal(status.remainingCalls,0);assert.equal(status.reason,'limit_reached');
 assert.equal(status.message,'This voice trial has used its call allowance.');
});

test('context is authenticated, size/rate/count bounded, acknowledged, and never persisted',async t=>{
 const f=await fixture();const api=mockAPI(t);const call=await(await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
 const tooBig=await gateway.fetch(f.request('/context',{...call.control,context:'a'.repeat(481)}),f.env);assert.equal(tooBig.status,400);
 const bad=await gateway.fetch(f.request('/context',{...call.control,token:`${crypto.randomUUID()}-${crypto.randomUUID()}`,context:'private context sentinel'}),f.env);assert.equal(bad.status,403);
 const ok=await gateway.fetch(f.request('/context',{...call.control,context:'private context sentinel'}),f.env);assert.deepEqual(await ok.json(),{accepted:true});
 const update=api.sockets[0].sent.find(x=>x.type==='session.thinking.append');assert.equal(update.delegation_id,null);assert.equal(update.content,'private context sentinel');
 const fast=await gateway.fetch(f.request('/context',{...call.control,context:'new context'}),f.env);assert.equal(fast.status,429);
 const ledger=await f.storage.get('voice-ledger-v1');assert.equal(JSON.stringify(ledger).includes('sentinel'),false);ledger.sessions[call.control.id].contextAttempts=30;ledger.sessions[call.control.id].contextAt=0;await f.storage.put('voice-ledger-v1',ledger);
 const full=await gateway.fetch(f.request('/context',{...call.control,context:'new context'}),f.env);assert.equal(full.status,429);
 await gateway.fetch(f.request('/session/close',call.control),f.env);const closed=await gateway.fetch(f.request('/context',{...call.control,context:'closed context'}),f.env);assert.equal(closed.status,403);
});
test('research has separate atomic quotas and does not persist question or results',async t=>{
 const f=await fixture();mockAPI(t);const call=await(await gateway.fetch(f.request('/session',{sdp}),f.env)).json();
 const responses=await Promise.all([1,2,3].map(()=>gateway.fetch(f.request('/research',{...call.control,question:'private research sentinel'}),f.env)));
 assert.equal(responses.filter(r=>r.status===200).length,2);assert.equal(responses.filter(r=>r.status===429).length,1);
 assert.equal(JSON.stringify(await f.storage.get('voice-ledger-v1')).includes('sentinel'),false);
});
