import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
async function route(path) {
 const file=new URL(`../${path}`,import.meta.url);let source=stripTypeScriptTypes(readFileSync(file,'utf8'));
 source=source.replace(/from '([^']+)'/g,(_,relative)=>`from '${new URL(relative,file).href}'`);
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('actual Pages event catch-all and feed routes allow anonymous reads and deny writes',async()=>{
 for(const [path,param] of [['functions/api/agents/v1/[[path]].ts','events'],['functions/agents/feed.json.ts',null],['functions/agents/rss.xml.ts',null]]){
 const module=await route(path);for(const method of ['GET','HEAD','POST','PUT','PATCH','DELETE']){const r=await module.onRequest({request:new Request('https://pointcast.xyz/api/agents/v1/events',{method}),params:{path:param}});assert.equal(r.status,['GET','HEAD'].includes(method)?200:503);}
 }
 const api=await route('functions/api/agents/v1/[[path]].ts');for(const path of ['import','publish','mcp','unknown']){const r=await api.onRequest({request:new Request('https://pointcast.xyz/api/agents/v1/'+path,{method:'POST'}),params:{path:[path]}});assert.equal(r.status,503);assert.equal((await r.json()).error,'publishing_not_configured');}
 const r=await api.onRequest({request:new Request('https://pointcast.xyz/api/agents/v1/events'),params:{path:['events']}});assert.equal(r.status,200);
});
// Run the current complete middleware with local imported-service stand-ins.
// No stand-in performs I/O; fetch records its use and returns an in-memory response.
const state={};
const middlewareSource=readFileSync(new URL('../functions/_middleware.ts',import.meta.url),'utf8');
const stripped=stripTypeScriptTypes(middlewareSource).replace(/^import .*;\n/gm,'');
const standins=`
const state=globalThis[Symbol.for('pointcast.noticeboard.middleware-test')];
const classifyUA=ua=>{state.classify++;return ua.includes('GPTBot')?'ai:openai':'human'};
const recordVisit=async()=>{state.records++};const NOUN_ID_RANGE=1200;
const readSessionFromRequest=async()=>{state.sessions++;return null};
const hasDirectorDeskAccess=()=>false;const POINTCAST_TEZOS_SESSION_BRIDGE_SCRIPT='fixture';
const withStaticAudioRange=async(_request,response)=>{state.audio++;return response};
const HOME_SHARE_EDITIONS=[],HOME_SHARE_CANONICAL='',HOME_SHARE_TITLE='',HOME_SHARE_DESCRIPTION='',HOME_SHARE_WIDTH=0,HOME_SHARE_HEIGHT=0;
const homeShareEditionForDate=()=>({id:'fixture',imageUrl:'',alt:''});
const planUnfurl=()=>({}),unfurlWords=()=>null,isQuietUesStudyPath=()=>false;
class HTMLRewriter{on(selector){state.selectors.push(selector);return this}transform(response){state.transforms++;return response}}
const fetch=async()=>{state.fetch++;return new Response('resident',{headers:{'Content-Type':'text/html'}})};
`;
globalThis[Symbol.for('pointcast.noticeboard.middleware-test')]=state;
const middleware=await import('data:text/javascript;base64,'+Buffer.from(standins+stripped).toString('base64'));
function reset(){Object.assign(state,{next:0,classify:0,records:0,sessions:0,audio:0,transforms:0,fetch:0,assets:0,wait:0,selectors:[]})}
async function request(url,method='GET'){
 reset();const response=new Response('asset',{headers:{'Content-Type':'text/html'}});
 const result=await middleware.onRequest({request:new Request(url,{method,headers:{'User-Agent':'GPTBot'}}),env:{VISITS:{},ASSETS:{fetch:async()=>{state.assets++;return response}}},next:async()=>{state.next++;return response},waitUntil:()=>{state.wait++}});
 return {result,response};
}
function noSideEffects(){for(const key of ['classify','records','sessions','audio','transforms','fetch','wait'])assert.equal(state[key],0,key)}
test('noticeboard bare and exact index aliases canonicalize GET/HEAD with queries before generic rewrites',async()=>{
 for(const method of ['GET','HEAD'])for(const [from,to] of [['/agents','/agents/'],['/agents/index.html','/agents/'],['/agents/spec','/agents/spec/'],['/agents/spec/index.html','/agents/spec/']]){
  const {result}=await request('https://pointcast.xyz'+from+'?topic=art',method);assert.equal(result.status,301);assert.equal(result.headers.get('location'),'https://pointcast.xyz'+to+'?topic=art');assert.equal(state.next,0);noSideEffects();
 }
});
test('exact slash noticeboard/spec routes return next response without account probes, logging or transforms',async()=>{
 for(const path of ['/agents/','/agents/spec/'])for(const method of ['GET','HEAD','POST']){
  const {result,response}=await request('https://pointcast.xyz'+path,method);assert.equal(result,response);assert.equal(state.next,1);noSideEffects();
 }
});
test('host canonical redirects retain priority over noticeboard quiet routes',async()=>{
 for(const [host,path,target] of [['www.pointcast.xyz','/agents/','https://pointcast.xyz/agents/?topic=art'],['shop.pointcast.xyz','/agents/','https://pointcast.xyz/agents/?topic=art'],['catan.pointcast.xyz','/agents/spec/','https://pointcast.xyz/agents/spec/?topic=art']]){
  const {result}=await request('https://'+host+path+'?topic=art');assert.equal(result.status,301);assert.equal(result.headers.get('location'),target);assert.equal(state.next,0);noSideEffects();
 }
});
test('existing shop and catan front doors retain their asset dispatch',async()=>{
 for(const host of ['shop.pointcast.xyz','catan.pointcast.xyz']){const {result,response}=await request('https://'+host+'/');assert.equal(result,response);assert.equal(state.assets,1);assert.equal(state.next,0);noSideEffects()}
});
test('resident slash routes and similarly named routes retain current visit and transform behavior',async()=>{
 for(const path of ['/agents/mike/','/agents/specimen/','/agents/spec/extra/']){
  const {result}=await request('https://pointcast.xyz'+path);assert.equal(result.status,200);assert.equal(state.next,1);assert.equal(state.records,1);assert.equal(state.wait,1);assert.ok(state.transforms>0);assert.ok(state.classify>0);
 }
});
test('unrelated resident bare routes retain the existing generic directory fetch',async()=>{
 const {result}=await request('https://pointcast.xyz/agents/mike');assert.equal(result.status,200);assert.equal(state.fetch,1);assert.equal(state.next,0);assert.ok(state.classify>0);
});
test('quiet route source guard stays exact and follows existing canonical routing',()=>{
 const position=middlewareSource.indexOf("if (['/agents/', '/agents/spec/'].includes(url.pathname)) return next();");assert.ok(position>middlewareSource.indexOf("url.hostname === 'catan.pointcast.xyz'"));assert.ok(position<middlewareSource.indexOf('const looksLikeDirectoryPath'));assert.ok(!middlewareSource.includes("url.pathname.startsWith('/agents')"));
});
