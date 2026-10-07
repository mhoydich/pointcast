import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNdbc,makePacket,validPacket} from '../src/lib/waves/data.mjs';
import {handleWaves} from '../src/lib/waves/service.mjs';
import {metresToFeet,compassPoint,statusAt,formatLocalTime,waveModel,trendSegments} from '../public/waves/model.mjs';
const now=new Date('2026-10-07T15:00:00Z');
const header='#YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE\n#yr mo dy hr mn degT m/s m/s m sec sec degT hPa degC degC degC nmi hPa ft';
const row=(date='2026 10 07 14 26',wave='1.3 12 8.2 176',wind='MM MM MM')=>`${date} ${wind} ${wave} MM MM 23.1 MM MM MM MM`;
const feed=(...rows)=>`${header}\n${rows.join('\n')}\n`;
const parse=(...rows)=>parseNdbc(feed(...rows),now);
class MemoryCache{store=new Map();async match(r){return this.store.get(r.url)?.clone()??null;}async put(r,response){this.store.set(r.url,response.clone());}}
const upstream=text=>async()=>new Response(text,{headers:{'Content-Type':'text/plain'}});
const request=method=>new Request('https://pointcast.xyz/api/waves?ignored=1',{method});
test('verified fixture keeps missing wind distinct from zero and respects units',()=>{
 const p=parse(row());assert.equal(p.observation.heightM,1.3);assert.equal(p.observation.dominantPeriodS,12);assert.equal(p.observation.directionFromDeg,176);assert.equal(p.observation.windSpeedMS,null);assert.ok(Math.abs(metresToFeet(1.3)-4.265092)<1e-6);
 const z=parse(row(undefined,'0 12 8.2 0','0 0 0')).observation;assert.equal(z.heightM,0);assert.equal(z.directionFromDeg,0);assert.equal(z.windSpeedMS,0);
});
test('rows sorted, duplicate dates choose complete row, newest all-null wave skipped',()=>{
 const p=parse(row('2026 10 07 14 56','MM MM MM MM'),row('2026 10 07 14 26','1.3 MM MM MM'),row('2026 10 07 13 56'),row());
 assert.equal(p.observation.observedAt,'2026-10-07T14:26:00.000Z');assert.equal(p.observation.dominantPeriodS,12);assert.equal(p.history.length,3);assert.equal(p.history[0].observedAt,'2026-10-07T13:56:00.000Z');assert.equal(p.history[2].heightM,null);
});
test('strict UTC calendar, future, field counts and scalar ranges are rejected',()=>{
 for(const d of ['2026 02 31 14 26','2026 10 07 24 26','2026 13 07 14 26','2026 10 07 15 06'])assert.equal(parse(row(d)).observation,null,d);
 const p=parse(row(undefined,'-2 0 -1 361'));assert.equal(p.observation,null);
 assert.equal(parse(row()+' EXTRA').observation,null);assert.equal(parse(row(undefined,'MM MM MM MM')).observation,null);
});
test('header-driven reordering works and wrong units/HTML/oversize are refused',()=>{
 const lines=feed(row()).trim().split('\n').map(l=>l.split(/\s+/));
 for(const l of lines)[l[8],l[9]]=[l[9],l[8]];
 assert.equal(parseNdbc(lines.map(l=>l.join(' ')).join('\n'),now).observation.heightM,1.3);
 assert.throws(()=>parseNdbc(feed(row()).replace(' m sec',' ft sec'),now),/units/);
 assert.throws(()=>parseNdbc('<html>outage</html>',now),/header/);
 assert.throws(()=>parseNdbc('x'.repeat(1024*1024+1),now),/large/);
});
test('wall-clock history is bounded and missing intervals stay separate',()=>{
 const p=parse(row('2026 10 06 14 26'),row('2026 10 06 15 26'),row('2026 10 07 13 26'),row());
 assert.equal(p.history.length,3);assert.equal(trendSegments(p.history).length,3);
 const q=parse(row('2026 10 07 13 26'),row('2026 10 07 13 56','MM MM MM MM'),row());assert.equal(trendSegments(q.history).length,2);
});
test('status uses observation not retrieval, stale and expired are explicit',()=>{
 for(const [minutes,state] of [[0,'fresh'],[90,'fresh'],[91,'delayed'],[180,'delayed'],[181,'stale'],[360,'stale'],[361,'expired']])assert.equal(statusAt({observedAt:new Date(now.getTime()-minutes*60000).toISOString()},now).state,state);
 assert.equal(statusAt(null,now).state,'unavailable');assert.equal(statusAt({observedAt:'2099-01-01T00:00:00Z'},now).state,'unavailable');
});
test('direction comes FROM and model travels opposite; deepwater model is measurable',()=>{
 assert.equal(compassPoint(0),'N');assert.equal(compassPoint(359),'N');assert.equal(compassPoint(1),'N');assert.equal(compassPoint(null),null);
 const m=waveModel({dominantPeriodS:12,directionFromDeg:176});assert.equal(m.travelDeg,356);assert.ok(m.wavelengthM>224&&m.wavelengthM<225);assert.ok(m.phaseSpeedMS>18.7&&m.phaseSpeedMS<18.8);
 assert.equal(waveModel({dominantPeriodS:null,directionFromDeg:null}).wavelengthM,null);
});
test('Pacific timezone uses actual daylight-saving calendar',()=>{
 assert.match(formatLocalTime('2026-10-07T14:26:00Z'),/7:26.*PDT/);assert.match(formatLocalTime('2026-12-07T15:26:00Z'),/7:26.*PST/);
});
test('GET fills versioned cache and HEAD reuses bytes without upstream work',async()=>{
 const cache=new MemoryCache();let count=0;const fetcher=async(...args)=>{count++;assert.equal(args[0],'https://www.ndbc.noaa.gov/data/realtime2/46221.txt');return upstream(feed(row()))();};
 const get=await handleWaves(request('GET'),{cache,fetcher,clock:()=>now});const bytes=await get.text();assert.equal(get.status,200);assert.equal(count,1);assert.equal(cache.store.size,2);
 const head=await handleWaves(request('HEAD'),{cache,fetcher,clock:()=>now});assert.equal(await head.text(),'');assert.equal(Number(head.headers.get('content-length')),new TextEncoder().encode(bytes).byteLength);assert.equal(count,1);
});
test('failed refresh retains exact last-good observation/retrieval but marks failure',async()=>{
 const cache=new MemoryCache();await handleWaves(request('GET'),{cache,fetcher:upstream(feed(row())),clock:()=>now});
 for(const key of cache.store.keys())if(key.endsWith('/fresh'))cache.store.delete(key);
 const later=new Date('2026-10-07T20:00:00Z');const result=await handleWaves(request('GET'),{cache,fetcher:async()=>{throw new Error('offline');},clock:()=>later});
 const p=await result.json();assert.equal(result.status,200);assert.equal(p.retrievedAt,now.toISOString());assert.equal(p.observation.observedAt,'2026-10-07T14:26:00.000Z');assert.equal(p.upstream.status,'failed');assert.equal(statusAt(p.observation,later).state,'stale');
});
test('uncached outage or HTML yields explicit unavailable; POST/OPTIONS never fetch',async()=>{
 let count=0;const fetcher=async()=>{count++;return new Response('<html>oops</html>',{headers:{'Content-Type':'text/html'}});};
 const r=await handleWaves(request('GET'),{fetcher,clock:()=>now});assert.equal(r.status,503);assert.equal((await r.json()).observation,null);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal((await handleWaves(request('POST'),{fetcher})).status,405);assert.equal((await handleWaves(request('OPTIONS'),{fetcher})).status,204);assert.equal(count,1);
});
test('packet cache refuses previous schema, invalid values and future retrieval',()=>{
 const p=makePacket(parse(row()),now.toISOString());assert.equal(validPacket(p,now),true);assert.equal(validPacket({...p,schemaVersion:'old'},now),false);assert.equal(validPacket({...p,retrievedAt:'2099-01-01T00:00:00Z'},now),false);assert.equal(validPacket({...p,observation:{...p.observation,heightM:-1}},now),false);
});

test('duplicate completeness favors wave measurements over unrelated wind values',()=>{
 const p=parse(row(),row(undefined,'MM MM MM 176','180 8 10'));assert.equal(p.observation.heightM,1.3);assert.equal(p.observation.dominantPeriodS,12);
});
test('regressed 200 upstream cannot replace newer last-good observation',async()=>{
 const cache=new MemoryCache();await handleWaves(request('GET'),{cache,fetcher:upstream(feed(row())),clock:()=>now});
 for(const key of cache.store.keys())if(key.endsWith('/fresh'))cache.store.delete(key);
 const later=new Date('2026-10-07T16:00:00Z');const response=await handleWaves(request('GET'),{cache,fetcher:upstream(feed(row('2026 10 07 13 56'))),clock:()=>later});const p=await response.json();
 assert.equal(p.observation.observedAt,'2026-10-07T14:26:00.000Z');assert.equal(p.retrievedAt,now.toISOString());assert.equal(p.upstream.code,'upstream_regressed');
});
