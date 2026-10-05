import test from 'node:test';
import assert from 'node:assert/strict';
import { getSnapshot } from '../src/lib/business-feels.mjs';
import { observationCsv } from '../src/scripts/business-feels.mjs';

test('download preserves original dates, attribution, preliminary flags and numeric negative job changes',()=>{
  const packet=getSnapshot('2026-10-03T18:00:00Z');
  const csv=observationCsv(packet);
  assert.match(csv,/"preliminary","date_meaning"/);
  assert.match(csv,/"latest_signal_status"/);
  assert.doesNotMatch(csv,/"source_url","status"/);
  const rows=csv.split('\r\n');
  assert.ok(rows.some(row=>row.startsWith('"us-payroll-change"')&&row.includes(',"-156",')));
  const latest=rows.find(row=>row.startsWith('"us-payroll-change"')&&row.includes('"2026-09-01"'));
  assert.match(latest,/"29","thousand jobs","bls","https:\/\/www.bls.gov\//);
  assert.match(latest,/,"true","Reference month, represented by its first day"$/);
  assert.ok(rows.some(row=>row.startsWith('"fx-EUR-USD"')&&row.includes('"2026-10-02","1.1225"')));
  assert.equal(rows.filter(row=>row.startsWith('"fx-EUR-USD"')).length,packet.fx.history.length);
  assert.doesNotMatch(csv,/principal|monthlyPayment|watchboard|localStorage/);
});

test('CSV escapes commas, quotes and formula-like text without turning signed numeric values into text',()=>{
  const packet={series:[{id:'unit-test',title:'=TEST("quoted",1)',history:[{date:'2026-09-01',value:-12}],sourceId:'test',sourceUrl:'https://example.com/',unit:'test units',status:'snapshot',lastSuccessAt:'2026-10-03T18:00:00Z'}]};
  const csv=observationCsv(packet);
  assert.match(csv,/"'=TEST\(""quoted"",1\)"/);
  assert.match(csv,/,"-12","test units"/);
  assert.doesNotMatch(csv,/'-12/);
});


test('historical Treasury CSV attribution follows each row across a year boundary',()=>{
  const packet={series:[{id:'treasury-10y',title:'Treasury10y',sourceId:'treasury',unit:'%',sourceUrl:'https://home.treasury.gov/resource-center-data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2027',status:'fresh',observationDate:'2027-01-04',value:5.1,history:[{date:'2026-12-31',value:5},{date:'2027-01-04',value:5.1}]}]};
  const rows=observationCsv(packet).split('\r\n');
  assert.match(rows.find(row=>row.includes('"2026-12-31"')),/field_tdr_date_value=2026/);
  assert.match(rows.find(row=>row.includes('"2027-01-04"')),/field_tdr_date_value=2027/);
});
