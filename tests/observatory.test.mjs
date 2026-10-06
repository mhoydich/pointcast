import test from 'node:test';
import assert from 'node:assert/strict';
import {localDay,pacificOffset,numeric,metric,usnoMetrics,swpcMetrics,buoyMetrics,tideMetrics,airMetrics} from '../src/lib/observatory/data.mjs';
import {buildReport,handle} from '../src/lib/observatory/service.mjs';
const now=new Date('2026-10-06T18:00:00Z');
test('Pacific calendar and offsets stay correct around UTC midnight and seasonal changes',()=>{
 assert.equal(localDay(new Date('2026-10-06T02:00:00Z')),'2026-10-05');
 assert.equal(pacificOffset('2026-01-15'),'-08:00');assert.equal(pacificOffset('2026-07-15'),'-07:00');
 assert.equal(pacificOffset('2026-03-08'),'-07:00');assert.equal(pacificOffset('2026-11-01'),'-08:00');
});
test('missing measurements remain null; actual zero remains zero',()=>{
 for(const n of [null,undefined,'','MM','NaN'])assert.equal(numeric(n),null);
 assert.equal(numeric('0'),0);
 assert.equal(metric({id:'x',value:null,kind:'observation'},now).status,'unavailable');
 assert.equal(metric({id:'x',value:0,kind:'observation',valid_at:now.toISOString()},now).status,'available');
});
test('stale and future observations are visibly rejected or labeled',()=>{
 assert.equal(metric({value:350,kind:'observation',valid_at:'2026-10-05T18:00:00Z',max_age_seconds:1200},now).status,'stale');
 assert.equal(metric({value:350,kind:'observation',valid_at:'2026-10-07T18:00:00Z'},now).status,'unavailable');
});
test('USNO daily illumination is at local noon, rise times carry Pacific civil date',()=>{
 const input={properties:{data:{year:2026,month:10,day:6,tz:-8,isdst:true,fracillum:'25%',curphase:'Waning Crescent',moondata:[{phen:'Rise',time:'02:12  DT'},{phen:'Set',time:'15:48  DT'}]}}};
 const data=usnoMetrics(input,'moon','2026-10-06',now);
 assert.equal(data[0].value,25);assert.equal(data[0].valid_at,'2026-10-06T19:00:00.000Z');assert.equal(data[0].status,'available');
 assert.equal(data.find(m=>m.id==='rise').value,'2026-10-06T09:12:00.000Z');
 assert.throws(()=>usnoMetrics(input,'moon','2026-10-05',now));
 input.properties.data.fracillum=.25;assert.equal(usnoMetrics(input,'moon','2026-10-06',now)[0].value,25);
});
test('SWPC keyed rows select active source and most recent timestamp instead of row order',()=>{
 const wind=[{time_tag:'2026-10-06T17:55:00',active:true,source:'DSCOVR',proton_speed:450},{time_tag:'2026-10-06T17:59:00',active:false,source:'ACE',proton_speed:600},{time_tag:'2026-10-05T17:00:00',active:true,source:'DSCOVR',proton_speed:400}];
 const kp=[{time_tag:'2026-10-06T17:59:00',estimated_kp:2},{time_tag:'2026-10-05T17:00:00',estimated_kp:4}];
 const result=swpcMetrics(wind,kp,now);assert.equal(result[0].value,450);assert.match(result[0].location,/DSCOVR/);assert.equal(result[1].value,2);
 assert.equal(swpcMetrics([wind[2]],[],now)[0].status,'stale');assert.equal(swpcMetrics([],[],now)[1].value,null);
});
test('NDBC parses header names and UTC time; missing water temperature is not zero',()=>{
 const text='#YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE\n#yr mo dy hr mn degT m/s m/s m sec sec degT hPa degC degC degC nmi hPa ft\n2026 10 06 17 30 MM MM MM 1.4 12 8 250 MM MM MM MM MM MM MM';
 const result=buoyMetrics(text,now);assert.equal(result[0].value,1.4);assert.equal(result[1].value,null);assert.equal(result[2].value,12);assert.equal(result[0].valid_at,'2026-10-06T17:30:00.000Z');assert.match(result[1].location,/Offshore/);
});
test('CO-OPS newest row is selected; datum and location remain explicit',()=>{
 const result=tideMetrics({data:[{t:'2026-10-06 17:54',v:'0.00'},{t:'2026-10-06 17:48',v:'1.2'}]},now);
 assert.equal(result[0].value,0);assert.equal(result[0].unit,'m above MLLW');assert.match(result[0].location,/9410840/);
});
test('airport weather nulls remain missing and never produce AQI',()=>{
 const result=airMetrics({properties:{timestamp:'2026-10-06T17:50:00Z',temperature:{value:20,unitCode:'wmoUnit:degC'},windSpeed:{value:null,unitCode:'wmoUnit:km_h-1'},relativeHumidity:{value:0,unitCode:'wmoUnit:percent'}}},now);
 assert.equal(result[1].value,null);assert.equal(result[2].value,0);assert.ok(result.every(m=>m.id!=='aqi'));assert.match(result[0].location,/not an air-quality/);
});
test('source failures yield an explicit report with no inferred values',async()=>{
 const report=await buildReport('sun',async()=>{throw new Error('network failure');},now);
 assert.equal(report.status,'unavailable');assert.equal(report.errors.length,3);assert.ok(report.metrics.every(m=>m.value===null));
});
test('service permits partial availability and keeps AQI unavailable',async()=>{
 const report=await buildReport('air',async()=>new Response(JSON.stringify({properties:{timestamp:now.toISOString(),temperature:{value:21,unitCode:'wmoUnit:degC'},windSpeed:{value:7,unitCode:'wmoUnit:km_h-1'},relativeHumidity:{value:50,unitCode:'wmoUnit:percent'}}})),now);
 assert.equal(report.status,'partial');assert.equal(report.metrics.find(m=>m.id==='aqi').value,null);assert.equal(report.sources.airnow.status,'not_integrated');
});
test('unknown routes and unsafe methods never make upstream requests',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw new Error();};
 assert.equal((await handle(new Request('https://example.test',{method:'POST'}),'moon',fetcher,now)).status,405);
 assert.equal((await handle(new Request('https://example.test'),'venus',fetcher,now)).status,404);assert.equal(calls,0);
});
test('published schema kinds, required fields and null constraints match the real report objects',async()=>{
 const {readFile}=await import('node:fs/promises');const schema=JSON.parse(await readFile(new URL('../public/observatory/report.schema.json',import.meta.url)));
 const report=await buildReport('air',async()=>{throw new Error('offline');},now);
 for(const key of schema.required)assert.ok(Object.hasOwn(report,key),key);
 for(const m of report.metrics){for(const key of schema.$defs.metric.required)assert.ok(Object.hasOwn(m,key),`${m.id}.${key}`);assert.ok(schema.$defs.metric.properties.kind.enum.includes(m.kind));assert.ok(schema.$defs.metric.properties.status.enum.includes(m.status));if(m.status==='unavailable')assert.equal(m.value,null);assert.ok(report.sources[m.source]);}
});
test('unit mismatch and bad quality cannot become weather measurements',()=>{
 const result=airMetrics({properties:{timestamp:now.toISOString(),temperature:{unitCode:'wmoUnit:degF',value:70},windSpeed:{unitCode:'wmoUnit:km_h-1',qualityControl:'X',value:15},relativeHumidity:{unitCode:'wmoUnit:percent',value:null}}},now);
 assert.ok(result.every(m=>m.value===null));
});
test('absent horizon events remain distinct from failed transport',()=>{
 const result=usnoMetrics({properties:{data:{year:2026,month:10,day:6,tz:-8,isdst:true,fracillum:'120%',curphase:'Waning Crescent',moondata:[]}}},'moon','2026-10-06',now);
 assert.equal(result.find(m=>m.id==='rise').status,'not_applicable');assert.equal(result.find(m=>m.id==='illumination').value,null);
});
test('motion reduction, keyboard controls and no external page embeds remain in the shared surface',async()=>{
 const {readFile}=await import('node:fs/promises');const css=await readFile(new URL('../public/observatory/observatory.css',import.meta.url),'utf8');const js=await readFile(new URL('../public/observatory/observatory.js',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/:focus-visible/);assert.doesNotMatch(css,/animation\s*:[^n]/);assert.doesNotMatch(js,/setInterval|requestAnimationFrame|geolocation|ethereum|requestAccounts/);
 for(const topic of ['moon','sun','pacific','air']){const page=await readFile(new URL(`../public/${topic}/index.html`,import.meta.url),'utf8');assert.match(page,/<input id="lab-range" type="range"/);assert.match(page,/class="skip"/);assert.match(page,/role="status"/);assert.doesNotMatch(page,/<iframe|<img|src="https:\/\//);}
});
test('upstream body limits apply even without Content-Length',async()=>{
 const {boundedText}=await import('../src/lib/observatory/data.mjs');
 assert.equal(await boundedText(new Response('abc'),3),'abc');
 await assert.rejects(()=>boundedText(new Response('abcd'),3),/upstream_too_large/);
 await assert.rejects(()=>boundedText(new Response('abc',{headers:{'Content-Length':'100'}}),3),/upstream_too_large/);
});
