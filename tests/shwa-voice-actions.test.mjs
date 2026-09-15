import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
const compiled = await build({ entryPoints:[fileURLToPath(new URL('../src/components/shwa/lib/voice-actions.ts',import.meta.url))],bundle:true,write:false,platform:'node',format:'cjs',packages:'external' });
const module={exports:{}};
new Function('require','module','exports',compiled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {createVoiceActions}=module.exports;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const tool=(id='call_one',name='search_web',args={question:'Look up current pickleball paddle prices',request_quote:'look up paddle prices'})=>({type:'response.event',delegation_id:'delegation_one',event:{type:'response.output_item.done',item:{type:'function_call',call_id:id,name,arguments:JSON.stringify(args)}}});
const research={parts:[{text:'The source lists a paddle. [1]',citations:[{start:27,end:30,url:'https://example.org/paddle',title:'Paddle maker'}]}],estimatedCost:.0101};
research.parts[0].citations[0].start=research.parts[0].text.indexOf('[1]');research.parts[0].citations[0].end=research.parts[0].text.length;
function fixture(){
 let active=true,current=true;const requests=[],starts=[],results=[],errors=[],costs=[],reasoning=[];
 const actions=createVoiceActions({canStart:()=>active,isCurrent:()=>current,execute:id=>new Promise((resolve,reject)=>requests.push({id,resolve,reject})),onStart:v=>starts.push(v),onResult:(a,r)=>results.push({a,r}),onError:(a,e)=>errors.push({a,e}),onCost:(kind,value)=>costs.push({kind,value}),onReasoning:v=>reasoning.push(v)});
 return {actions,requests,starts,results,errors,costs,reasoning,end(){active=false;},newCall(){active=false;current=false;},resolve(index=0,result=research,name='search_web'){requests[index].resolve({callId:requests[index].id,name,status:'completed',voiceDelivery:'queued',result});return tick();}};
}
test('one completed provider tool call creates a pending piece then cited result, duplicates run once',async()=>{
 const f=fixture();f.actions.handle(tool());f.actions.handle(tool());
 assert.equal(f.requests.length,1);assert.equal(f.starts[0].card.workState,'pending');
 await f.resolve();assert.equal(f.results.length,1);assert.deepEqual(f.results[0].r.research,research);assert.deepEqual(f.costs,[{kind:'research',value:.0101}]);
});
test('captions, partial arguments, unknown tools and malformed calls cannot launch work',()=>{
 const f=fixture();for(const event of [{type:'session.input_transcript.delta',delta:'look up prices'},{type:'response.event',event:{type:'response.function_call_arguments.done',arguments:'{}'}},tool('x','send_money'),tool('x','search_web',{question:3}),tool('../x')])f.actions.handle(event);
 assert.equal(f.requests.length,0);
});
test('image request resolves into a bounded local image URL',async()=>{
 const f=fixture();f.actions.handle(tool('image_one','generate_image',{prompt:'A colorful pickleball paddle',request_quote:'generate an image'}));
 await f.resolve(0,{image:'UklGRg==',mimeType:'image/webp',estimatedCost:.005},'generate_image');
 assert.equal(f.results[0].r.imageUrl,'data:image/webp;base64,UklGRg==');assert.equal(f.costs[0].kind,'images');
});
test('provider denial and uncertain network outcomes are visible and never automatically retried',async()=>{
 const f=fixture();f.actions.handle(tool());f.requests[0].resolve({callId:'call_one',name:'search_web',status:'failed',message:'Please confirm a lookup.'});await tick();
 assert.equal(f.errors[0].e,'Please confirm a lookup.');f.actions.handle(tool());assert.equal(f.requests.length,1);
 const second=fixture();second.actions.handle(tool());second.requests[0].reject(Error('Connection lost. No automatic retry.'));await tick();assert.match(second.errors[0].e,/No automatic retry/);assert.equal(second.requests.length,1);
});
test('unmatched receipts and unsafe or uncited sources are never published',async()=>{
 for(const result of [{...research,parts:[{text:'Uncited',citations:[]}]},{...research,parts:[{text:'Bad [1]',citations:[{start:4,end:7,url:'javascript:alert(1)',title:'Unsafe'}]}]},{...research,parts:[{text:'Bad [1]',citations:[{start:4,end:800,url:'https://example.org',title:'Overrun'}]}]}]){
  const f=fixture();f.actions.handle(tool());await f.resolve(0,result);assert.equal(f.results.length,0);assert.equal(f.errors.length,1);
 }
 const f=fixture();f.actions.handle(tool());f.requests[0].resolve({callId:'other',name:'search_web',status:'completed',result:research});await tick();assert.equal(f.results.length,0);assert.match(f.errors[0].e,/matched/);
});
test('requested work may finish on the ended call board, but never leaks into a new call',async()=>{
 const f=fixture();f.actions.handle(tool());f.end();f.actions.handle(tool('new'));await f.resolve();assert.equal(f.requests.length,1);assert.equal(f.results.length,1);
 const g=fixture();g.actions.handle(tool());g.newCall();await g.resolve();assert.equal(g.results.length,0);assert.equal(g.errors.length,0);assert.equal(g.costs.length,1,'A completed paid result still counts toward the visit');
});
test('Astra usage is billed once per response, including cached input and reasoning output',()=>{
 const f=fixture();const event={type:'response.event',event:{type:'response.completed',response:{id:'resp_one',output:[],usage:{input_tokens:1000,input_tokens_details:{cached_tokens:200},output_tokens:50}}}};
 f.actions.handle(event);f.actions.handle(event);assert.equal(f.costs.length,1);assert.equal(f.costs[0].kind,'reasoning');assert.equal(f.costs[0].value,.0107);
 f.actions.handle({type:'response.event',event:{type:'response.failed',response:{id:'resp_two',usage:{input_tokens:100,output_tokens:0}}}});assert.equal(f.costs[1].value,.001);
});

test('board success preserves unconfirmed voice delivery instead of claiming spoken completion',async()=>{
 const f=fixture();f.actions.handle(tool());f.requests[0].resolve({callId:'call_one',name:'search_web',status:'completed',result:research,voiceDelivery:'unavailable'});await tick();assert.equal(f.results[0].r.voiceDelivery,'unavailable');
});

 test('reused operations retain a shared board identity and zero duplicate cost',async()=>{
 const f=fixture();f.actions.handle(tool('alias'));f.requests[0].resolve({callId:'alias',name:'search_web',operationId:'original',reused:true,status:'completed',voiceDelivery:'queued',result:{...research,estimatedCost:0}});await tick();assert.equal(f.results[0].r.operationId,'original');assert.equal(f.results[0].r.reused,true);assert.equal(f.costs[0].value,0);
});
