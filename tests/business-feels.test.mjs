import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEcbXml, parseTreasuryXml, parseBls, getSnapshot, signalStatus, refreshSignals, handleBusinessFeels, readBoundedResponse, convertFx, rateScenario, isSignalSet, SCHEMA_VERSION } from '../src/lib/business-feels.mjs';

const now = '2026-10-06T18:00:00.000Z';
const fxXml = (date = '2026-10-05', usd = 1.2) => `<gesmes:Envelope><Cube><Cube time='${date}'><Cube currency='USD' rate='${usd}'/><Cube currency='GBP' rate='0.8'/><Cube currency='JPY' rate='160'/></Cube></Cube></gesmes:Envelope>`;
const treasuryXml = (date = '2026-10-05', extra = '') => `<feed><entry><content><m:properties><d:NEW_DATE m:type="Edm.DateTime">${date}T00:00:00</d:NEW_DATE><d:BC_2YEAR>4.5</d:BC_2YEAR><d:BC_10YEAR>5.2</d:BC_10YEAR><d:BC_30YEAR>5.7</d:BC_30YEAR>${extra}</m:properties></content></entry></feed>`;
const fetchSuccess = async (url) => new Response(url.includes('treasury') ? treasuryXml() : fxXml(), { headers: { 'Content-Type': 'application/xml' } });
const fakeCache = () => { const map = new Map(); return { async match(key) { return map.get(key.url)?.clone(); }, async put(key, response) { map.set(key.url, response.clone()); } }; };

test('ECB references keep dated tables and missing days, with EUR as the sole base', () => {
  const rows = parseEcbXml(`<Cube>${fxXml('2026-10-05')}${fxXml('2026-10-02',1.1)}</Cube>`);
  assert.deepEqual(rows.map(row=>row.date), ['2026-10-02','2026-10-05']);
  assert.equal(rows[0].rates.EUR,1);
  assert.equal(rows[1].rates.USD,1.2);
  assert.throws(()=>parseEcbXml(fxXml('2026-02-30')), /date/);
  assert.throws(()=>parseEcbXml(fxXml().replace("rate='1.2'","rate='0'")), /rate/);
  assert.throws(()=>parseEcbXml(`<!DOCTYPE Cube [<!ENTITY rate '1.2'>]>${fxXml()}`), /XML/);
  assert.throws(()=>parseEcbXml(fxXml()+fxXml()), /Duplicate/);
});

test('Treasury curves never zero-fill missing maturities or combine distinct dates', () => {
  const rows = parseTreasuryXml(treasuryXml('2026-10-02')+treasuryXml('2026-10-05','<d:BC_3MONTH m:null="true"></d:BC_3MONTH>'));
  assert.equal(rows[1].date,'2026-10-05');
  assert.deepEqual(rows[1].points.map(p=>p.tenor),['2y','10y','30y']);
  assert.equal(rows[1].points.find(p=>p.tenor==='10y').value,5.2);
  assert.throws(()=>parseTreasuryXml('<feed />'), /observations/);
  assert.throws(()=>parseTreasuryXml(treasuryXml()+treasuryXml()), /Duplicate/);
});

const blsResponse = () => ({ status: 'REQUEST_SUCCEEDED', Results: { series: [
  { seriesID:'CUUR0000SA0', data:[{year:'2026',period:'M08',value:'334.98'},{year:'2025',period:'M08',value:'323.974'},{year:'2025',period:'M13',value:'999'}] },
  { seriesID:'LNS14000000', data:[{year:'2026',period:'M09',value:'4.2'},{year:'2026',period:'M08',value:'4.1'}] },
  { seriesID:'CES0000000001', data:[{year:'2026',period:'M09',value:'159044',footnotes:[{code:'P',text:'preliminary'}]},{year:'2026',period:'M08',value:'159015'},{year:'2026',period:'M06',value:'158000'}] },
] } });

test('BLS derived changes require actual matching periods and retain revision notes', () => {
  const parsed = parseBls(blsResponse());
  assert.deepEqual(parsed['us-cpi-yoy'],[{date:'2026-08-01',value:3.397}]);
  assert.deepEqual(parsed['us-payroll-change'],[{date:'2026-09-01',value:29,preliminary:true}]);
  assert.deepEqual(parsed['us-unemployment'].map(p=>p.value),[4.1,4.2]);
  assert.throws(()=>parseBls({status:'REQUEST_NOT_PROCESSED'}),/succeed/);
  const missing=blsResponse();missing.Results.series.pop();assert.throws(()=>parseBls(missing),/required/);
});

test('snapshot contract contains credited real observations, chronological histories and disabled setup cards', () => {
  const snapshot = getSnapshot('2026-10-03T20:00:00Z');
  assert.equal(snapshot.schemaVersion,SCHEMA_VERSION);
  assert.equal(snapshot.fx.date,'2026-10-02');
  assert.equal(snapshot.fx.rates.USD,1.1225);
  assert.equal(snapshot.fx.history.length,65);
  assert.equal(snapshot.yieldCurve.date,'2026-10-02');
  assert.equal(snapshot.yieldCurve.points.find(p=>p.tenor==='10y').value,5.28);
  const ids = new Set(snapshot.sourceHealth.map(source=>source.id));
  for(const series of snapshot.series) {
    assert.ok(ids.has(series.sourceId));
    for(const field of ['title','category','unit','frequency','sourceUrl','context','drivers','matters']) assert.equal(typeof series[field],'string');
    assert.ok(series.value===null||Number.isFinite(series.value));
    assert.deepEqual(series.history.map(p=>p.date),series.history.map(p=>p.date).sort());
    if(series.status==='setup-required') assert.equal(series.value,null);
  }
  assert.equal(snapshot.sourceHealth.find(s=>s.id==='bls').runtimeEnabled,false);
  assert.equal(snapshot.sourceHealth.find(s=>s.id==='fred').status,'setup-required');
  assert.equal(snapshot.series.find(s=>s.id==='mortgage-30y').value,null);
  snapshot.series[0].value=99;assert.equal(getSnapshot().series[0].value,3.75);
});

test('policy freshness follows manual verification, while monthly and daily observations age separately', () => {
  const policy={value:3.75,observationDate:'2025-12-18',lastSuccessAt:'2026-10-03T00:00:00Z',category:'policy',staleAfterDays:14,delivery:'snapshot'};
  assert.equal(signalStatus(policy,'2026-10-04'),'snapshot');
  assert.equal(signalStatus(policy,'2026-10-20'),'stale');
  assert.equal(signalStatus({...policy,category:'yields',staleAfterDays:5},'2026-10-04'),'stale');
  assert.equal(getSnapshot('2026-10-20').fx.status,'stale');
});

test('successful bounded refresh only uses three fixed keyless public GETs', async () => {
  const calls=[];
  const snapshot=getSnapshot(now);
  const updated=await refreshSignals(snapshot,{now,fetch:async (url,init)=>{calls.push({url,init});return fetchSuccess(url);}});
  assert.equal(calls.length,3);
  assert.ok(calls.every(call=>call.init.method==='GET'&&call.init.redirect==='error'));
  assert.ok(calls.every(call=>!call.url.includes('bls')&&!call.url.includes('fred')));
  assert.ok(calls.some(call=>call.url==='https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=2026'));
  assert.equal(updated.fx.date,'2026-10-05');
  assert.equal(updated.fx.status,'fresh');
  assert.equal(updated.yieldCurve.date,'2026-10-05');
  assert.equal(updated.series.find(s=>s.id==='treasury-10y').value,5.2);
  assert.equal(updated.sourceHealth.find(s=>s.id==='ecb-fx').lastSuccessAt,now);
  assert.equal(updated.sourceHealth.find(s=>s.id==='ecb-fx').lastError,null);
  assert.equal(snapshot.fx.date,'2026-10-02');
});

test('fetch failures retain good values and success times, separately record the failed attempt', async () => {
  const baseline=getSnapshot(now);
  const failed=await refreshSignals(baseline,{now,fetch:async()=>new Response('upstream unavailable',{status:503})});
  assert.deepEqual(failed.fx.rates,baseline.fx.rates);
  assert.equal(failed.fx.date,baseline.fx.date);
  const source=failed.sourceHealth.find(s=>s.id==='ecb-fx');
  assert.equal(source.lastSuccessAt,baseline.sourceHealth.find(s=>s.id==='ecb-fx').lastSuccessAt);
  assert.equal(source.lastAttemptAt,now);
  assert.match(source.lastError.message,/503/);
  assert.equal(source.status,'stale');
  assert.equal(failed.series.find(s=>s.id==='treasury-10y').value,5.28);
});

test('older/future upstream data cannot regress a good dated table or fabricate today', async () => {
  const baseline=getSnapshot(now);
  const old=await refreshSignals(baseline,{now,fetch:async url=>new Response(url.includes('treasury')?treasuryXml('2026-10-01'):fxXml('2026-10-01'))});
  assert.equal(old.fx.date,'2026-10-02');assert.equal(old.yieldCurve.date,'2026-10-02');
  assert.match(old.sourceHealth.find(s=>s.id==='ecb-fx').lastError.message,/older/);
  const future=await refreshSignals(baseline,{now,fetch:async url=>new Response(url.includes('treasury')?treasuryXml('2026-10-07'):fxXml('2026-10-07'))});
  assert.equal(future.fx.date,'2026-10-02');
  assert.match(future.sourceHealth.find(s=>s.id==='ecb-fx').lastError.message,/today/);
});

test('source response byte bounds apply both to declared length and streamed chunks', async () => {
  await assert.rejects(readBoundedResponse(new Response('123',{headers:{'Content-Length':'30'}}),10),/byte limit/);
  await assert.rejects(readBoundedResponse(new Response('12345678901'),10),/byte limit/);
  assert.equal(await readBoundedResponse(new Response('1234567890'),10),'1234567890');
});

test('timeouts are surfaced without replacing last successful observations', async () => {
  const failed=await refreshSignals(getSnapshot(now),{now,timeoutMs:10,fetch:async (url,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new DOMException('abort','AbortError')),{once:true}))});
  assert.match(failed.sourceHealth.find(s=>s.id==='treasury').lastError.message,/timed out/);
  assert.equal(failed.fx.date,'2026-10-02');
});

test('read-only methods and query isolation do not accept orders, URLs or refresh bypasses', async () => {
  let calls=0;
  const options={now,fetch:async url=>{calls++;return fetchSuccess(url);},cache:fakeCache()};
  const post=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels',{method:'POST'}),options);
  assert.equal(post.status,405);assert.equal(calls,0);assert.equal(post.headers.get('Allow'),'GET, HEAD, OPTIONS');
  const cors=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels',{method:'OPTIONS'}),options);
  assert.equal(cors.status,204);assert.equal(calls,0);
  const response=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels?url=https://evil.example/&refresh=1'),options);
  assert.equal(response.status,200);assert.equal(calls,3);
  const head=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels?refresh=2',{method:'HEAD'}),options);
  assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(calls,3);
});

test('cache retries respect source intervals and keep last good readings after a failed later attempt', async () => {
  const cache=fakeCache();let calls=0;
  const request=new Request('https://pointcast.xyz/api/business-feels');
  const initial=await handleBusinessFeels(request,{cache,now,fetch:async url=>{calls++;return fetchSuccess(url);}});
  const first=await initial.json();assert.equal(calls,3);
  const cached=await handleBusinessFeels(request,{cache,now:'2026-10-06T18:05:00Z',fetch:async()=>{throw new Error('should not fetch');}});
  assert.equal((await cached.json()).fx.date,'2026-10-05');
  const failed=await handleBusinessFeels(request,{cache,now:'2026-10-07T18:00:00Z',fetch:async()=>new Response('',{status:502})});
  const retained=await failed.json();assert.equal(retained.fx.date,first.fx.date);assert.equal(retained.fx.lastSuccessAt,first.fx.lastSuccessAt);
  assert.match(retained.sourceHealth.find(s=>s.id==='treasury').lastError.message,/502/);
});

test('corrupt/failed local cache remains a bounded snapshot fallback', async () => {
  const cache={async match(){return new Response('invalid JSON');},async put(){throw new Error('no cache');}};
  const response=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels'),{cache,now,fetch:async()=>new Response('',{status:503})});
  const data=await response.json();assert.equal(data.fx.date,'2026-10-02');assert.match(data.cache.error,/could not retain/);
});

test('FX converter cross-rates come from one actual dated table and exclude unavailable currencies', () => {
  const fx={date:'2026-10-02',base:'EUR',rates:{EUR:1,USD:1.12,JPY:168},sourceId:'ecb-fx'};
  const result=convertFx(fx,100,'USD','JPY');assert.ok(Math.abs(result.rate-150)<1e-10);assert.ok(Math.abs(result.convertedAmount-15000)<1e-8);assert.equal(result.observationDate,'2026-10-02');
  assert.throws(()=>convertFx(fx,1,'USD','RUB'),RangeError);
  assert.throws(()=>convertFx(fx,-1,'USD','EUR'),RangeError);
});

test('fixed-rate educational scenario handles zero interest and finite inputs', () => {
  const zero=rateScenario({principal:12000,annualRatePercent:0,years:1});assert.equal(zero.monthlyPayment,1000);assert.equal(zero.totalInterest,0);
  const result=rateScenario({principal:300000,annualRatePercent:6,years:30});assert.ok(Math.abs(result.monthlyPayment-1798.65)<0.01);assert.ok(result.assumptions.some(s=>s.includes('Taxes')));
  assert.throws(()=>rateScenario({principal:Infinity,annualRatePercent:6,years:30}),RangeError);
  assert.throws(()=>rateScenario({principal:100,annualRatePercent:-1,years:30}),RangeError);
});


test('malformed normalized cache is rejected before source evaluation', async () => {
  const valid=getSnapshot(now);assert.equal(isSignalSet(valid),true);
  for (const state of [{schemaVersion:SCHEMA_VERSION,series:[],sourceHealth:[]}, {...valid,sourceHealth:[null]}, {...valid,fx:{}}, {...valid,yieldCurve:{date:'2026-10-02',points:[null]}}, {...valid,series:valid.series.map((series,index)=>index?series:{...series,history:null})}]) {
    assert.equal(isSignalSet(state),false);
    const cache={async match(){return new Response(JSON.stringify(state));},async put(){}};
    const response=await handleBusinessFeels(new Request('https://pointcast.xyz/api/business-feels'),{cache,now,fetch:async()=>new Response('',{status:503})});
    assert.equal(response.status,200);const data=await response.json();assert.equal(data.fx.date,'2026-10-02');assert.match(data.cache.error,/unavailable/);
  }
});

test('nearly zero educational interest stays finite instead of losing its denominator', () => {
  for (const annualRatePercent of [Number.MIN_VALUE,1e-30,1e-12,0.0001]) {
    const result=rateScenario({principal:12000,annualRatePercent,years:1});
    assert.ok(Number.isFinite(result.monthlyPayment));assert.ok(result.monthlyPayment>=1000-1e-10);assert.ok(result.totalInterest>=0);
  }
  assert.ok(Math.abs(rateScenario({principal:12000,annualRatePercent:1e-30,years:1}).monthlyPayment-1000)<1e-8);
});


test('new-year Treasury source attribution follows the observation year while missing tenors retain their old links', async () => {
  const now2027='2027-01-05T12:00:00.000Z';
  const baseline=getSnapshot(now2027);
  const currentYear=treasuryXml('2027-01-04').replace('<d:BC_30YEAR>5.7</d:BC_30YEAR>','');
  const calls=[];
  const updated=await refreshSignals(baseline,{now:now2027,fetch:async (url)=>{calls.push(url);return new Response(url.includes('treasury')?currentYear:fxXml('2027-01-04'));}});
  assert.ok(calls.some(url=>url.endsWith('field_tdr_date_value=2027')));
  assert.equal(updated.yieldCurve.date,'2027-01-04');
  assert.ok(updated.yieldCurve.sourceUrl.endsWith('field_tdr_date_value=2027'));
  assert.ok(updated.sourceHealth.find(source=>source.id==='treasury').sourceUrl.endsWith('field_tdr_date_value=2027'));
  for(const id of ['treasury-2y','treasury-10y']) {
    const series=updated.series.find(series=>series.id===id);
    assert.equal(series.observationDate,'2027-01-04');
    assert.ok(series.sourceUrl.endsWith('field_tdr_date_value=2027'));
  }
  for(const id of ['treasury-3m','treasury-5y','treasury-30y']) {
    const prior=baseline.series.find(series=>series.id===id);
    const retained=updated.series.find(series=>series.id===id);
    assert.equal(retained.observationDate,prior.observationDate);
    assert.equal(retained.sourceUrl,prior.sourceUrl);
    assert.equal(retained.lastSuccessAt,prior.lastSuccessAt);
  }
});

test('January previous-year Treasury fallback attributes the actual previous-year observation', async () => {
  const now2027='2027-01-05T12:00:00.000Z';
  const calls=[];
  const updated=await refreshSignals(getSnapshot(now2027),{now:now2027,fetch:async (url)=>{
    calls.push(url);
    if(!url.includes('treasury')) return new Response(fxXml('2027-01-04'));
    return new Response(url.endsWith('field_tdr_date_value=2027')?'<feed />':treasuryXml('2026-12-31'));
  }});
  assert.deepEqual(calls.filter(url=>url.includes('treasury')).map(url=>url.slice(-4)),['2027','2026']);
  assert.equal(updated.yieldCurve.date,'2026-12-31');
  assert.ok(updated.yieldCurve.sourceUrl.endsWith('field_tdr_date_value=2026'));
  assert.ok(updated.sourceHealth.find(source=>source.id==='treasury').sourceUrl.endsWith('field_tdr_date_value=2026'));
  for(const id of ['treasury-2y','treasury-10y','treasury-30y']) {
    const series=updated.series.find(series=>series.id===id);
    assert.equal(series.observationDate,'2026-12-31');
    assert.ok(series.sourceUrl.endsWith('field_tdr_date_value=2026'));
  }
});
