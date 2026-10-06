import test from 'node:test';
import assert from 'node:assert/strict';
import { noticeResponse, validateLedger, validateEvent, publicEvents, publishNotice, MAX_BYTES } from '../src/lib/agent-notices.mjs';
import {noticeboardMarkup,noticeboardScript} from '../src/lib/agent-noticeboard.mjs';
const make = (sequence,extra={}) => ({ sequence,schema_version:'pointcast.agents.event/v1',event_id:`test:${sequence}`,resource_id:`https://pointcast.xyz/b/${sequence}`,revision:1,kind:'update',published_at:'2026-10-05T00:00:00Z',source_url:`https://pointcast.xyz/b/${sequence}`,content_text:'A public source record.',publisher:{claimed_name:'Some Bot',operator_status:'unverified'},topics:['art'],origin_event_id:`source:${sequence}`,...extra });
const data = events => validateLedger({epoch:'test',floor_sequence:0,events});
const get = (query='',format='json',ledger,headers={}) => noticeResponse(new Request(`https://pointcast.xyz/${format==='json'?'api/agents/v1/events':format==='feed'?'agents/feed.json':'agents/rss.xml'}${query}`,{headers}),format,ledger);
test('anonymous reads all formats and retain identical stable IDs',async()=>{
 const fixture=data([make(1)]);const j=await (await get('','json',fixture)).json(); const f=await(await get('','feed',fixture)).json(); const r=await(await get('','rss',fixture)).text();
 assert.equal(j.events[0].event_id,f.items[0].id);assert.deepEqual(f.items[0]._pointcast,j.events[0]);assert.ok(r.includes(j.events[0].event_id));assert.equal(j.events[0].sequence,undefined);assert.equal(f.version,'https://jsonfeed.org/version/1.1');
});
test('stable validators, weak/list/star matches and HEAD',async()=>{
 for(const format of ['json','feed','rss']){const a=await get('',format);const b=await get('',format);assert.equal(a.headers.get('etag'),b.headers.get('etag'));assert.equal(await a.text(),await b.text());
 for(const header of [a.headers.get('etag'),`W/${a.headers.get('etag')}`,`"other", W/${a.headers.get('etag')}`,'*']){const c=await get('',format,undefined,{'If-None-Match':header});assert.equal(c.status,304);assert.equal(await c.text(),'');assert.equal(c.headers.get('etag'),a.headers.get('etag'));assert.match(c.headers.get('cache-control'),/must-revalidate/);}
 const h=await noticeResponse(new Request('https://pointcast.xyz/api/agents/v1/events',{method:'HEAD'}));assert.equal(h.status,200);assert.equal(await h.text(),'');}
});
test('all new publication surfaces deny without ingesting payload or accepting credentials',async()=>{
 for(const surface of ['ui','mcp','rest','import'])assert.deepEqual(publishNotice({publisher:{operator_status:'authenticated'}},surface),{ok:false,error:'publishing_not_configured'});
 for(const format of ['json','feed','rss'])for(const method of ['POST','PUT','PATCH','DELETE']){const r=await noticeResponse(new Request('https://pointcast.xyz/api/agents/v1/events',{method,headers:{Authorization:'Bearer invented','PointCast-Agent-Id':'claimed'},body:'malformed'}),format);assert.equal(r.status,503);assert.equal((await r.json()).error,'publishing_not_configured');assert.equal(r.headers.get('retry-after'),'3600');}
});
test('lossless exclusive pagination despite identical/backdated timestamps; no duplicated IDs',async()=>{
 const ledger=data(Array.from({length:123},(_,i)=>make(i+1,{published_at:i%2?'2020-01-01T00:00:00Z':'2026-10-05T00:00:00Z'})));let after='';const received=[];
 do{const r=await get(`?limit=7${after?`&after=${after}`:''}`,'json',ledger);assert.equal(r.status,200);const page=await r.json();received.push(...page.events);assert.notEqual(page.next_cursor,after);after=page.next_cursor;if(!page.has_more)break;}while(true);
 assert.equal(received.length,123);assert.equal(new Set(received.map(e=>e.event_id)).size,123);assert.deepEqual(received.map(e=>e.event_id),ledger.events.map(e=>e.event_id));const drained=await(await get(`?after=${after}`,'json',ledger)).json();assert.equal(drained.next_cursor,after);assert.equal(drained.events.length,0);
});
test('filtered cursor progresses across unrelated records, new events and correction delivery',async()=>{
 const events=[make(1),make(2,{topics:['garden']})];let ledger=data(events);const first=await(await get('?topic=art','json',ledger)).json();assert.equal(first.events.length,1);
 ledger=data([...events,make(3,{resource_id:events[0].resource_id,revision:2,kind:'correction',supersedes_event_id:'test:1'})]);const page=await(await get(`?topic=art&after=${first.next_cursor}`,'json',ledger)).json();assert.equal(page.events[0].kind,'correction');assert.equal(page.events[0].supersedes_event_id,'test:1');
 assert.throws(()=>data([...events,make(3,{resource_id:events[0].resource_id,revision:2,kind:'retraction',supersedes_event_id:'test:1',topics:['garden']})]),/retain_topics/);
});
test('expired, epoch-reset, future, malformed and topic-mismatch cursors',async()=>{
 const initial=await(await get('?limit=1','json',data([make(1),make(2)]))).json();const pruned=validateLedger({epoch:'test',floor_sequence:2,events:[make(3)]});
 let r=await get(`?after=${initial.next_cursor}`,'json',pruned);assert.equal(r.status,410);assert.equal((await r.json()).reset_required,true);
 r=await get(`?after=${initial.next_cursor}`,'json',{epoch:'replacement',floor_sequence:0,events:[]});assert.equal(r.status,410);
 for(const q of ['?after=bad','?after='+btoa(JSON.stringify(['test',999,''])),'?topic=garden&after='+initial.next_cursor,'?limit=51','?limit=0','?topic=art&topic=garden','?limit=2&limit=3','?x=1'])assert.equal((await get(q,'json',data([make(1),make(2)]))).status,400);
});
test('origin dedup, revision ordering, retractions and unverified claimed identity',()=>{
 assert.throws(()=>data([make(1),make(2,{origin_event_id:'source:1'})]),/duplicate_origin/);
 assert.throws(()=>validateEvent(make(1,{publisher:{claimed_name:'OpenAI',operator_status:'authenticated'}})),/invalid_publisher/);
 assert.throws(()=>validateEvent(make(1,{publisher:{claimed_name:'Claude',operator_status:'unverified',verified:true}})),/invalid_publisher/);
 const e=make(1,{publisher:{claimed_name:'OpenAI',operator_status:'unverified'}});assert.equal(validateEvent(e).publisher.operator_status,'unverified');
 assert.throws(()=>data([make(1),make(2,{revision:1,resource_id:make(1).resource_id})]),/invalid_revision/);
 assert.throws(()=>data([make(1),make(2,{kind:'correction'})]),/supersedes_required/);
 assert.equal(data([make(1),make(2,{kind:'retraction',revision:2,resource_id:make(1).resource_id,supersedes_event_id:'test:1'})]).events.length,2);
});
test('escaping and bounds include UTF-8 and RSS XML expansion',async()=>{
 const ledger=data(Array.from({length:50},(_,i)=>make(i+1,{content_text:'<&"\'>'.repeat(700)})));
 for(const format of ['json','feed','rss']){let after='';let seen=0;do{const start=btoa(JSON.stringify(['test',0,''])).replace(/=/g,'');const response=await get(`?limit=50&after=${after||start}`,format,ledger);const text=await response.text();assert.equal(response.status,200);assert.ok(Buffer.byteLength(text)<=MAX_BYTES);if(format==='rss'){assert.ok(!text.includes('<&'));assert.match(text,/&lt;/);const ids=[...text.matchAll(/<guid isPermaLink="false">([^<]+)<\/guid>/g)];seen+=ids.length;const next=text.match(/<pc:next_cursor>([^<]+)<\/pc:next_cursor>/)[1];assert.notEqual(next,after);after=next;if(text.includes('<pc:has_more>false'))break;}else{const page=JSON.parse(text);seen+=(page.events??page.items).length;const meta=page._pointcast??page;assert.notEqual(meta.next_cursor,after);after=meta.next_cursor;if(!meta.has_more)break;}}while(true);assert.equal(seen,50);}
 assert.throws(()=>validateEvent(make(1,{content_text:'💥'.repeat(1025)})),/invalid_content/);
 assert.throws(()=>validateEvent(make(1,{source_url:'javascript:alert(1)'})),/invalid_source_url/);
});
test('expiry does not silently erase history and HTML escapes data',async()=>{
 const event=make(1,{expires_at:'2026-10-06T00:00:00Z'});assert.equal((await(await get('','json',data([event]))).json()).events.length,1);
 const html=noticeboardMarkup();assert.match(html,/Publishing not configured/);assert.match(html,/unverified/i);assert.ok(html.includes('/.well-known/whereeveryone.json'));assert.ok(html.includes('/grok/'));assert.ok(!html.includes('verified badge'));assert.ok(!noticeboardScript.includes('fetch('));
 for(const e of publicEvents())assert.equal(e.publisher.operator_status,'unverified');
});

test('offline owner review rejects edits/deletes/renumbering and permits immutable correction append',async()=>{
 const {checkAppendOnly}=await import('../scripts/audit-agent-notice-ledger.mjs');const old=data([make(1)]);assert.equal(checkAppendOnly(old,data([make(1),make(2,{kind:'correction',revision:2,resource_id:make(1).resource_id,supersedes_event_id:'test:1'})])),true);assert.throws(()=>checkAppendOnly(old,data([make(1,{content_text:'Silent rewrite'})])),/immutable_event_changed/);assert.throws(()=>checkAppendOnly(old,data([])),/history_deleted/);
});

test('standard feed snapshots show newest records while explicit after preserves incremental history',async()=>{
 const ledger=data(Array.from({length:70},(_,i)=>make(i+1)));const feed=await(await get('','feed',ledger)).json();assert.equal(feed.items[0].id,'test:70');assert.equal(feed.items.length,20);assert.equal(feed._pointcast.mode,'latest');assert.equal(feed._pointcast.older_records_omitted,true);assert.equal(feed._pointcast.has_more,false);const rss=await(await get('','rss',ledger)).text();assert.ok(rss.indexOf('test:70')<rss.indexOf('test:69'));const page=await(await get('?after='+feed._pointcast.next_cursor,'feed',data([...ledger.events,make(71)]))).json();assert.equal(page.items[0].id,'test:71');
});

test('production ledger starts empty without an unverifiable source seed',async()=>{
 assert.deepEqual(publicEvents(),[]);assert.equal((await(await get()).json()).events.length,0);assert.equal((await(await get('','feed')).json()).items.length,0);assert.match(noticeboardMarkup(),/No published source events yet/);
});

test('actor kind and agent name remain claims; absent historical kinds normalize to unknown',async()=>{
 const fixture=data([make(1),make(2,{publisher:{claimed_name:'Example person',actor_kind:'person',claimed_agent_name:'Example bot',operator_status:'unverified'}})]);const page=await(await get('','json',fixture)).json();assert.equal(page.events[0].publisher.actor_kind,'unknown');assert.equal(page.events[1].publisher.actor_kind,'person');assert.equal(page.events[1].publisher.claimed_agent_name,'Example bot');assert.equal(page.events[1].publisher.operator_status,'unverified');assert.equal(page.events[1].source_url,'https://pointcast.xyz/b/2');assert.throws(()=>validateEvent(make(1,{publisher:{claimed_name:'OpenAI',actor_kind:'verified-provider',operator_status:'unverified'}})),/invalid_actor_kind/);assert.match(noticeboardMarkup(),/Each external assistant needs its own subscription or polling setup/);assert.match(noticeboardMarkup(),/no automatic access to other chats/);
});
