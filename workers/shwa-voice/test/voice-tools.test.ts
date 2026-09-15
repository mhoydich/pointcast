import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceToolBridge, explicitToolRequest, voiceToolSummary } from '../src/voice-tools.ts';

function fixture() {
  let active=true, now=100000;
  const sent=[];
  const bridge=new VoiceToolBridge({send:event=>sent.push(event),active:()=>active,now:()=>now});
  const event=(type,extra={},delegation_id='item_delegation')=>bridge.observe({type:'response.event',delegation_id,event:{type,...extra}});
  const begin=(id='resp_1')=>event('response.created',{response:{id}});
  const transcript=(text,interval={})=>bridge.observe({type:'session.input_transcript.delta',delta:text,...interval});
  const call=(id='call_1',name='search_web',quote='Look up Honolulu pickleball paddle prices',extra={})=>event('response.output_item.done',{item:{type:'function_call',call_id:id,name,arguments:JSON.stringify({[name==='generate_image'?'prompt':'question']:'Honolulu pickleball paddle prices',request_quote:quote,...extra})}});
  const done=(id='resp_1',type='response.completed')=>event(type,{response:{id,output:[]}});
  const result=call=>Promise.resolve({callId:call.callId,name:call.name,status:'completed',result:{parts:[{text:'Price is $100.',citations:[{url:'https://example.test/paddle',title:'Paddle'}]}],estimatedCost:.012}});
  return {bridge,sent,event,begin,transcript,call,done,result,stop:()=>active=false,advance:ms=>now+=ms};
}

test('explicit voice requests exclude incidental, negated and hypothetical mentions',()=>{
  for(const text of ['look up paddle prices','Can you compare Honolulu and CRBN paddles?','How much does that paddle cost?']) assert.equal(explicitToolRequest('search_web',text),true);
  for(const text of ['Paddle prices are interesting','Do not look up paddle prices','For example I could say look up paddle prices','Imagine I said search for paddle prices']) assert.equal(explicitToolRequest('search_web',text),false);
  assert.equal(explicitToolRequest('generate_image','Please make an image of a pickleball paddle'),true);
  assert.equal(explicitToolRequest('generate_image','I like images of paddles'),false);
  assert.equal(explicitToolRequest('generate_image','Do not generate an image'),false);
});
test('only nested finished function items from a known response can authorize a request',async()=>{
  const f=fixture(); f.transcript('Look up Honolulu pickleball paddle prices');
  f.call(); assert.equal(await f.bridge.waitForCall('call_1',1),undefined);
  f.begin(); f.event('response.function_call_arguments.done',{call_id:'call_1',arguments:'{}'});
  assert.equal(await f.bridge.waitForCall('call_1',1),undefined);
  f.bridge.observe({type:'response.output_item.done',item:{type:'function_call',call_id:'call_1'}});
  assert.equal(await f.bridge.waitForCall('call_1',1),undefined);
  f.call(); assert.equal((await f.bridge.waitForCall('call_1')).name,'search_web');
});
test('duplicate request joins exactly one operation; finished output waits for terminal event before continue',async()=>{
  const f=fixture(); f.begin(); f.transcript('Look up Honolulu pickleball paddle prices'); f.call();
  let calls=0, release; const pending=new Promise(resolve=>release=resolve);
  const execute=async call=>{calls++;await pending;return f.result(call);};
  const a=f.bridge.run('call_1',execute), b=f.bridge.run('call_1',execute);
  assert.equal(a,b);await Promise.resolve();assert.equal(calls,1);release();
  const receipt=await a; assert.equal(receipt.status,'completed');assert.equal(receipt.voiceDelivery,'queued');
  assert.equal(f.sent.length,1); assert.equal(f.sent[0].type,'response.item.create');assert.equal(f.sent[0].item.type,'function_call_output');assert.equal(f.sent[0].item.call_id,'call_1');
  f.done();f.done(); assert.equal(f.sent.filter(e=>e.type==='response.create').length,1);
  await f.bridge.run('call_1',execute); assert.equal(calls,1);
  assert.equal('delegation_id' in f.sent[1],false);assert.equal('response' in f.sent[1],false);
});
test('empty terminal output does not erase pending calls and continuation waits for every result',async()=>{
  const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call('call_1');f.call('call_2');f.done();
  await f.bridge.run('call_1',f.result);assert.equal(f.sent.some(e=>e.type==='response.create'),false);
  await f.bridge.run('call_2',f.result);assert.equal(f.sent.filter(e=>e.type==='response.create').length,1);
});
test('fabricated quote and assistant-only words fail without executing or billing tools',async()=>{
  const f=fixture();f.begin();f.bridge.observe({type:'session.output_transcript.delta',delta:'Look up Honolulu pickleball paddle prices'});f.call();f.done();
  let ran=false;const receipt=await f.bridge.run('call_1',async()=>{ran=true;throw Error();});
  assert.equal(ran,false);assert.equal(receipt.reason,'needs_confirmation');
  assert.equal(JSON.parse(f.sent[0].item.output).status,'failed');assert.equal(f.sent[1].type,'response.create');
});
test('stale user request and malformed declared arguments never execute',async()=>{
  const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.advance(90001);f.call();
  const receipt=await f.bridge.run('call_1',async()=>{throw Error('must not run');});assert.equal(receipt.reason,'needs_confirmation');
  f.call('call_2','search_web','Look up Honolulu pickleball paddle prices',{model:'injected'});
  const malformed=await f.bridge.run('call_2',async()=>{throw Error('must not run');});assert.equal(malformed.reason,'invalid_tool_arguments');
});
test('unknown functions are failed and cannot call a service',async()=>{
  const f=fixture();f.begin();f.call('call_send','send_email');f.done();
  const receipt=await f.bridge.run('call_send',async()=>{throw Error('must not run');});assert.equal(receipt.reason,'unsupported_tool');
  assert.equal(f.sent.filter(e=>e.type==='response.create').length,1);
});
test('failed backend responses cannot initiate tools or a continuation',async()=>{
  const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call();f.done('resp_1','response.failed');
  let count=0;const receipt=await f.bridge.run('call_1',async call=>{count++;return f.result(call);});
  assert.equal(count,0);assert.equal(receipt.status,'failed');assert.equal(f.sent.some(e=>e.type==='response.create'),false);
});
test('disposing call preserves authorized in-flight board result without speaking or retrying',async()=>{
  const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call();f.done();
  let release,signal;const pending=new Promise(resolve=>release=resolve);
  const work=f.bridge.run('call_1',async(call,s)=>{signal=s;await pending;return f.result(call);});
  await Promise.resolve();f.bridge.dispose();assert.equal(signal.aborted,false);release();
  const receipt=await work;assert.equal(receipt.status,'completed');assert.equal(receipt.voiceDelivery,'unavailable');assert.equal(receipt.result.parts[0].text,'Price is $100.');assert.equal(f.sent.length,0);
});
test('server sideband may lag browser delivery briefly without accepting unverified arguments',async()=>{
  const f=fixture();f.begin();const pending=f.bridge.waitForCall('call_1',100);
  f.call();assert.equal((await pending).callId,'call_1');f.bridge.dispose();
});
test('uncertain paid outcome is returned as failure once and never automatically retried',async()=>{
  const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call();f.done();let count=0;
  const execute=async()=>{count++;throw Error('private API failure');};
  const first=await f.bridge.run('call_1',execute),second=await f.bridge.run('call_1',execute);
  assert.equal(count,1);assert.equal(first,second);assert.equal(first.reason,'generation_unconfirmed');assert.equal(JSON.stringify(first).includes('private'),false);
});
test('voice summaries exclude image bytes and bound cited text',()=>{
  const image=voiceToolSummary({callId:'x',name:'generate_image',status:'completed',result:{image:'secretbytes'}});
  assert.equal(JSON.stringify(image).includes('secretbytes'),false);
  assert.match(image.message,/not its pixels/);
  const research=voiceToolSummary({callId:'x',name:'search_web',status:'completed',result:{parts:[{text:'x'.repeat(20000),citations:[]} ]}});
  assert.equal(research.findings.length,6500);
});

test('a model cannot select an affirmative substring out of negative, hypothetical, or cancelled user context',async()=>{
 for(const spoken of [
  'Do not look up Honolulu pickleball paddle prices.',
  'For example, I could say look up Honolulu pickleball paddle prices.',
  'Look up Honolulu pickleball paddle prices. Actually cancel that search.',
  'Look up Honolulu pickleball paddle prices. Never mind.',
  'He said look up Honolulu pickleball paddle prices.',
 ]){
  const f=fixture();f.begin();f.transcript(spoken);f.call();f.done();let count=0;
  const receipt=await f.bridge.run('call_1',async call=>{count++;return f.result(call);});
  assert.equal(count,0,spoken);assert.equal(receipt.reason,'needs_confirmation',spoken);
 }
});
test('negative image verbs and later cancellation veto even when omitted from request_quote',async()=>{
 for(const verb of ['generate','create','make','draw','paint','render','show','illustrate']){
  const f=fixture();const quote=verb+' an image of a pickleball paddle';f.begin();f.transcript('Please do not '+quote);f.call('call_image','generate_image',quote);f.done();
  let count=0;const result=await f.bridge.run('call_image',async call=>{count++;return f.result(call);});assert.equal(count,0,verb);assert.equal(result.reason,'needs_confirmation',verb);
 }
 const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices',{start_ms:0,end_ms:2000});f.call();
 f.transcript('Actually cancel that search.',{start_ms:4500,end_ms:5500});f.done();
 const result=await f.bridge.run('call_1',()=>{throw Error('must not execute');});assert.equal(result.reason,'needs_confirmation');
});
test('distinct provider call IDs share one pending paid operation and each receives its own function result',async()=>{
 const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call('call_a');f.call('call_b');f.done();
 let count=0,release;const pending=new Promise(resolve=>release=resolve);const execute=async call=>{count++;await pending;return f.result(call);};
 const a=f.bridge.run('call_a',execute),b=f.bridge.run('call_b',execute);await Promise.resolve();assert.equal(count,1);release();
 const [first,second]=await Promise.all([a,b]);assert.equal(first.callId,'call_a');assert.equal(second.callId,'call_b');assert.equal(second.operationId,'call_a');assert.equal(second.reused,true);assert.equal(second.result.estimatedCost,0);
 const outputs=f.sent.filter(e=>e.type==='response.item.create');assert.deepEqual(outputs.map(e=>e.item.call_id),['call_a','call_b']);assert.equal(f.sent.filter(e=>e.type==='response.create').length,1);
});
test('completed operation is reused across later provider responses without fresh spoken authorization',async()=>{
 const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call();f.done();let count=0;
 const execute=async call=>{count++;return f.result(call);};await f.bridge.run('call_1',execute);
 f.begin('resp_2');f.call('call_2');f.done('resp_2');const reused=await f.bridge.run('call_2',execute);
 assert.equal(count,1);assert.equal(reused.reused,true);assert.equal(reused.result.estimatedCost,0);
});
test('same spoken request cannot be split into duplicate tools by paraphrasing arguments',async()=>{
 const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call('call_a');f.call('call_b','search_web','Look up Honolulu pickleball paddle prices',{question:'Find the current prices for Honolulu pickleball paddles'});f.done();let count=0;
 const execute=async call=>{count++;return f.result(call);};await f.bridge.run('call_a',execute);const second=await f.bridge.run('call_b',execute);assert.equal(count,1);assert.equal(second.reused,true);
});
test('a fresh explicit repeat after completion can start a new operation; same-turn again cannot',async()=>{
 const f=fixture();f.begin();f.transcript('Look up Honolulu pickleball paddle prices');f.call();f.done();let count=0;
 const execute=async call=>{count++;return f.result(call);};await f.bridge.run('call_1',execute);
 f.transcript('. Look up Honolulu pickleball paddle prices again.');f.begin('resp_2');f.call('call_2','search_web','Look up Honolulu pickleball paddle prices again');f.done('resp_2');await f.bridge.run('call_2',execute);assert.equal(count,1);
 f.advance(5000);f.transcript('Look up Honolulu pickleball paddle prices again.');f.begin('resp_3');f.call('call_3','search_web','Look up Honolulu pickleball paddle prices again');f.done('resp_3');const fresh=await f.bridge.run('call_3',execute);
 assert.equal(count,2);assert.equal(fresh.reused,undefined);assert.equal(fresh.operationId,'call_3');
});
test('an old veto does not block a later fresh explicit affirmative turn',async()=>{
 const f=fixture();f.transcript('Do not look up Honolulu pickleball paddle prices');f.advance(5000);f.transcript('Look up Honolulu pickleball paddle prices');f.begin();f.call();f.done();
 let count=0;const result=await f.bridge.run('call_1',async call=>{count++;return f.result(call);});assert.equal(count,1);assert.equal(result.status,'completed');
});
