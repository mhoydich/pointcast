import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {normalizePower,collectSignals,CENTER,miles} from '../src/lib/local-signals.mjs';
import {basketSnapshot,validateObservation,COST_DATA} from '../src/lib/local-costs.mjs';
const now=Date.parse('2026-10-05T03:30:00Z');
const valid={itemId:'coffee-drip',price:3.5,unit:'cup',observedAt:'2026-10-05T03:20:00Z',sourceUrl:'https://example.com/menu',seller:'Cafe',location:'El Segundo, CA',lat:CENTER.lat,lng:CENTER.lng,product:'12 oz drip coffee',conditions:'Regular menu',tax:'excluded',contributor:'visiting-agent'};
test('radius and utility filtering exclude far, restored, invalid and duplicate incidents',()=>{
 const incident=(id,lat,lng,status='ACTIVE')=>({attributes:{IncidentId:id,Status:status,CityName:'EL SEGUNDO',ZipcodeName:'90245',NoOfAffectedCust_Inci:10,OutageStartDateTime:now},geometry:{x:lng,y:lat}});
 assert.equal(miles(CENTER.lat,CENTER.lng),0);
 const d=normalizePower({features:[incident(1,CENTER.lat,CENTER.lng),incident(1,CENTER.lat,CENTER.lng),incident(2,35,-118),incident(3,CENTER.lat,CENTER.lng,'RESTORED'),incident(4,NaN,CENTER.lng)]});
 assert.equal(d.length,1);assert.equal(d[0].customers,10);assert.equal(d[0].restoration,'No estimate supplied');
 assert.throws(()=>normalizePower({features:[],exceededTransferLimit:true}));
});
test('partial source failure remains unknown and earthquake is context',async()=>{
 const fetcher=async url=>{if(url.includes('weather.gov'))throw Error('down');if(url.includes('usgs.gov'))return Response.json({features:[{id:'q',geometry:{coordinates:[CENTER.lng,CENTER.lat]},properties:{mag:2,place:'nearby',time:now,url:'javascript:alert(1)'}}]});return Response.json({features:[]});};
 const d=await collectSignals(fetcher,new Date(now));assert.equal(d.feeds[0].status,'available');assert.equal(d.feeds[1].status,'unavailable');assert.equal(d.feeds[3].status,'manual');assert.match(d.feeds[2].items[0].detail,/not confirmed/);assert.match(d.feeds[2].items[0].url,/^https:/);
});
test('candidate requires exact unit, dated evidence, local seller and nonnegative price',()=>{
 assert.equal(validateObservation(valid,now).status,'pending-review');
 for(const update of [{price:-1},{price:'3.50'},{unit:'gallon'},{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:password@example.com'},{lat:35},{observedAt:'2026-10-06T00:00:00Z'},{observedAt:'2026-01-01T00:00:00Z'},{observedAt:'2026-10-04'},{tax:'guessed'},{product:''}])assert.throws(()=>validateObservation({...valid,...update},now));
});
test('missing and regional prices never enter a completed basket; changes require comparable evidence',()=>{
 const original=[...COST_DATA.observations];try{
 COST_DATA.observations=[];let s=basketSnapshot(now);assert.equal(s.items.length,36);assert.equal(s.basket.complete,false);assert.equal(s.basket.priced,0);assert.equal(s.basket.subtotal,0);
 const accepted={...valid,status:'reviewed'};
 COST_DATA.observations=[{...accepted,price:3,observedAt:'2026-10-04T03:20:00Z'},{...accepted,price:3.5},{...accepted,price:2,observedAt:'2026-10-03T03:20:00Z',seller:'Different seller'}];
 s=basketSnapshot(now);assert.equal(s.items.find(i=>i.id==='coffee-drip').delta,.5);assert.equal(s.basket.priced,1);assert.equal(s.basket.subtotal,14);
 s=basketSnapshot(now+8*86400000);assert.equal(s.basket.priced,0);assert.equal(s.items.find(i=>i.id==='coffee-drip').stale,true);
 COST_DATA.observations.push({...accepted,price:1,status:'pending-review',observedAt:'2026-10-05T03:25:00Z'});assert.equal(basketSnapshot(now).items.find(i=>i.id==='coffee-drip').latest.price,3.5);
 }finally{COST_DATA.observations=original;}
});
const compiled=await build({entryPoints:['functions/api/local-costs.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('contribution intake persists pending candidates, fails closed without storage/rate limits, and protects review queue',async()=>{
 const make=(method='GET',body)=>new Request('https://pointcast.xyz/api/local-costs',{method,...(body?{body:JSON.stringify(body),headers:{'content-type':'application/json','CF-Connecting-IP':'127.0.0.1'}}:{})});
 let r=await onRequest({request:make('POST',valid),env:{}});assert.equal(r.status,503);
 r=await onRequest({request:new Request('https://pointcast.xyz/api/local-costs?action=queue'),env:{}});assert.equal(r.status,403);
 const writes=[];const kv={get:async()=>null,put:async(...args)=>writes.push(args)};
 r=await onRequest({request:make('POST',{...valid,observedAt:new Date().toISOString()}),env:{PC_PING_KV:kv,PC_RATES_KV:kv}});assert.equal(r.status,201);assert.equal((await r.json()).status,'pending-review');assert.match(writes[1][0],/^local-costs:candidate:/);assert.equal(JSON.parse(writes[1][1]).contributorIdentity,'self-reported');
 r=await onRequest({request:make('POST',{...valid,seller:'x'.repeat(9000)}),env:{PC_PING_KV:kv,PC_RATES_KV:kv}});assert.equal(r.status,413);
 r=await onRequest({request:make('POST',valid),env:{PC_PING_KV:kv,PC_RATES_KV:{get:async()=>10}}});assert.equal(r.status,429);
});
