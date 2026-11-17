import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readOfficeSnapshot,OFFICE_END} from '../../src/lib/office-page.mjs';
import {validateDeclaration} from '../../src/lib/office/declarations.mjs';
import {buildDeskRegistry} from '../../src/lib/office/desk-registry.mjs';
import {readLoom} from '../../src/lib/office/loom-read.mjs';
import {normalizeLoomEvents} from '../../src/lib/office/events.mjs';
import {readPrStates} from '../../src/lib/office/pr-state.mjs';
const adapters={validateDeclaration,buildDeskRegistry,readLoom,normalizeLoomEvents,readPrStates};
const records=JSON.parse(readFileSync(new URL('../../src/data/office-seat-records.json',import.meta.url))).records;
const NOW=Date.parse('2026-11-17T18:00:00Z'),key='a'.repeat(24),sha='b'.repeat(40);
function sources({fail=false}={}) {
 const requests=[];
 const fetcher=async(url,init)=>{
  requests.push({url,method:init.method});
  if(fail)return new Response('',{status:503});
  const u=new URL(url);
  if(u.hostname==='api.github.com'){
   const number=Number(u.pathname.split('/').pop());
   return Response.json({number,base:{repo:{full_name:'mhoydich/pointcast'}},head:{sha},state:number===1767?'closed':'open',draft:false,merged:number===1767,merged_at:number===1767?'2026-11-17T15:58:00Z':null,merge_commit_sha:number===1767?sha:null,mergeable:number===1770?false:true,mergeable_state:number===1770?'dirty':'clean'}, {headers:{date:new Date(NOW).toUTCString()}});
  }
  assert.equal(u.origin,'https://pointcast.xyz');
  const address=u.searchParams.get('to'),shared=address==='#officenoun-tasks';
  const messages=shared?[
   {id:'m_test000001',body:'test-only fixture root',kind:'note',at:new Date(NOW-60000).toISOString(),from:{kind:'agent',address:'@sol-1'}},
   {id:'m_test000002',parent:'m_test000001',body:'test-only fixture reply',kind:'note',at:new Date(NOW-30000).toISOString(),from:{kind:'agent',address:'@sol-2'}}
  ]:[];
  return Response.json({ok:true,spec:'pointcast.loom/v1',kvBound:true,log:{address,key:shared?key:'c'.repeat(24),seed:false},messages});
 };
 return{fetcher,requests};
}
// Real parent-attested Sid records; HTTP bodies below are test-only fixtures.
const fixtureRecords=structuredClone(records);
function clock(){const started=performance.now();return()=>NOW+Math.ceil(performance.now()-started);}
test('actual adapters compose verified parent records, sourced reply edges, merge and conflict facts',async()=>{
 const {fetcher,requests}=sources();
 const result=await readOfficeSnapshot({records:fixtureRecords,adapters,fetcher,clock:clock()});
 assert.equal(result.desks.length,6);assert.ok(result.desks.every(d=>d.eligible));
 assert.equal(result.events.length,2);assert.ok(result.events.every(event => event.roomAddress === "#officenoun-tasks"));assert.equal(result.edges.length,1);
 assert.equal(result.edges[0].fromHandle,'@sol-2');assert.equal(result.edges[0].toHandle,'@sol-1');
 assert.deepEqual(result.merges.map(p=>p.number),[1767]);assert.deepEqual(result.blocked.map(p=>p.number),[1770]);
 assert.equal(result.desks[0].nounUrl,'/images/ufogp/sid.svg');
 assert.match(result.desks[0].lifecycle,/Last report/);
 assert.equal(requests.length,13);assert.ok(requests.every(r=>r.method==='GET'));
 assert.ok(!Object.hasOwn(result,'runningCount'));
});
test('source failure stays dark and does not substitute fixtures or invented activity',async()=>{
 const {fetcher}=sources({fail:true});const r=await readOfficeSnapshot({records,adapters,fetcher,clock:clock()});
 assert.equal(r.state,'degraded');assert.deepEqual(r.events,[]);assert.deepEqual(r.edges,[]);assert.deepEqual(r.merges,[]);assert.deepEqual(r.blocked,[]);
 assert.ok(r.desks.every(d=>d.facts.stale));assert.ok(r.errors.length>0);
});
test('public declaration data without separate runtime attestation cannot light an eligible desk',async()=>{
 const untrusted=structuredClone(fixtureRecords);untrusted[0].attestation=null;
 const {fetcher}=sources();const r=await readOfficeSnapshot({records:untrusted,adapters,fetcher,clock:clock()});
 assert.equal(r.desks[0].eligible,false);assert.equal(r.desks[0].facts.lastPostAt,null);
 assert.equal(r.edges.length,0);
});
test('hard experiment end makes zero requests and offers no desks or lights',async()=>{
 let calls=0;const r=await readOfficeSnapshot({records,adapters,fetcher:()=>{calls++;throw Error();},clock:()=>OFFICE_END});
 assert.equal(r.state,'ended');assert.equal(calls,0);assert.deepEqual(r.desks,[]);
});

test('a false cross-family parent claim cannot activate desks',async()=>{
 const {fetcher}=sources(); const falseParent=structuredClone(records);falseParent.forEach(r=>r.declaration.parentSeat='@ada');
 const r=await readOfficeSnapshot({records:falseParent,adapters,fetcher,clock:clock()});
 assert.equal(r.desks.length,6); assert.ok(r.desks.every(d=>!d.eligible));
 assert.equal(r.events.length,0);assert.equal(r.edges.length,0);
 assert.ok(r.errors.includes('invalid_parentage'));
 assert.ok(records.every(r=>r.declaration.parentSeat==='@sid'));
});

test('fresh reads of aged posts remain stale, not a successful empty activity claim',async()=>{
 const source=sources();
 const fetcher=async(url,init)=>{
  const res=await source.fetcher(url,init);
  if(!url.startsWith('https://pointcast.xyz/'))return res;
  const payload=await res.json();payload.messages.forEach(m=>m.at=new Date(NOW-3600000).toISOString());
  return Response.json(payload);
 };
 const r=await readOfficeSnapshot({records:fixtureRecords,adapters,fetcher,clock:clock()});
 assert.equal(r.state,'stale');assert.deepEqual(r.events,[]);assert.ok(r.desks.every(d=>d.facts.stale));
});

test('a Loom read crossing cutoff returns ended before PR reads begin',async()=>{
 let now=OFFICE_END-60_000,release,entered;
 const gate=new Promise(r=>release=r),started=new Promise(r=>entered=r);let prReads=0;
 const delayed={...adapters,readLoom:async()=>{entered();await gate;return {schema:'pointcast.office-data/v1',state:'idle',observedAt:new Date(now).toISOString(),data:{room:{},messages:[]},errors:[]};},readPrStates:async()=>{prReads++;throw Error('must not start');}};
 const pending=readOfficeSnapshot({records,adapters:delayed,clock:()=>now});
 await started;now=OFFICE_END+1;release();const r=await pending;
 assert.equal(r.state,'ended');assert.deepEqual(r.desks,[]);assert.equal(prReads,0);
});
test('PR completion crossing cutoff cannot return old eligible desks or merge lights',async()=>{
 let now=OFFICE_END-60_000,release,entered;
 const gate=new Promise(r=>release=r),started=new Promise(r=>entered=r);
 const delayed={...adapters,readPrStates:async()=>{entered();await gate;return {schema:'pointcast.office-data/v1',state:'ok',observedAt:new Date(now).toISOString(),data:{pullRequests:[{number:1767,url:'https://github.com/mhoydich/pointcast/pull/1767',state:'merged',mergeSha:'b'.repeat(40),mergedAt:new Date(OFFICE_END-1000).toISOString()}]},errors:[]};}};
 const pending=readOfficeSnapshot({records,adapters:delayed,fetcher:sources().fetcher,clock:()=>now});
 await started;now=OFFICE_END+1;release();const r=await pending;
 assert.equal(r.state,'ended');assert.deepEqual(r.desks,[]);assert.deepEqual(r.merges,[]);assert.deepEqual(r.events,[]);
});
