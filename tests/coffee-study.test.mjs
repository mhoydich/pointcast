import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { COFFEE_CENTER, matchesCoffee, coffeeMapPoint, calculateCafeScenario } from '../src/lib/coffee-study.mjs';
const atlas = JSON.parse(readFileSync(new URL('../src/data/ues-coffee-atlas.json',import.meta.url)));
test('published sample has unique in-radius records and provenance',()=>{
  assert.ok(atlas.records.length>=8);
  assert.equal(new Set(atlas.records.map(record=>record.id)).size,atlas.records.length);
  let previous=-1;
  for(const record of atlas.records){assert.ok(record.distanceMiles>=previous&&record.distanceMiles<=25);previous=record.distanceMiles;assert.ok(record.sources.length);assert.ok(record.assortment.length);assert.ok(record.coordinateNote);assert.equal(record.observedOn,'2026-10-03');assert.ok(Number.isFinite(record.bearingDegrees));for(const source of record.sources)assert.equal(new URL(source.url).protocol,'https:');}
  assert.equal(COFFEE_CENTER.latitude,33.91992025096);
});
test('combined query, offering and radius filters and empty results',()=>{
  const example={name:'Test Roaster',city:'El Segundo',address:'Main St',tags:['whole beans','espresso'],assortment:['Ethiopia washed'],distanceMiles:4};
  assert.equal(matchesCoffee(example,{query:'ETHIOPIA',kind:'whole beans',radius:5}),true);
  assert.equal(matchesCoffee(example,{query:'ETHIOPIA',kind:'subscription',radius:5}),false);
  assert.equal(matchesCoffee(example,{radius:2}),false);
  assert.equal(matchesCoffee(example,{query:'not present'}),false);
  assert.equal(matchesCoffee({...example,type:'café',brewMethods:['drip']},{query:'drip'}),true);
  assert.equal(matchesCoffee({...example,type:'café'},{query:'cafe'}),true);
});
test('map preserves radial scale and cardinal bearing',()=>{
  assert.deepEqual(coffeeMapPoint(0,0),{x:300,y:300});
  assert.equal(coffeeMapPoint(25,0).y,80);
  assert.equal(coffeeMapPoint(25,90).x,520);
  assert.equal(coffeeMapPoint(25,180).y,520);
});
test('teaching calculation handles base, stress and invalid assumptions',()=>{
  const input={ticket:7,orders:180,days:26,variablePercent:30,fixedCosts:19000};
  const result=calculateCafeScenario(input);
  assert.equal(result.sales,32760);assert.equal(result.contribution,22932);assert.equal(result.surplus,3932);assert.equal(Math.ceil(result.breakEvenOrders),150);
  assert.ok(Math.abs(calculateCafeScenario({...input,orders:153}).surplus-492.2)<1e-8);
  assert.equal(calculateCafeScenario({...input,orders:0}).surplus,-19000);
  assert.equal(calculateCafeScenario({...input,ticket:0}),null);
  assert.equal(calculateCafeScenario({...input,variablePercent:100}),null);
  assert.equal(calculateCafeScenario({...input,orders:NaN}),null);
});

test('pending case destinations remain unset',()=>{
  const data=JSON.parse(readFileSync(new URL('../src/data/ues-business-cases.json',import.meta.url)));
  assert.equal(data.cases.find(study=>study.id==='coffee').href,'/ues/coffee');
  for(const id of ['dispensaries','real-estate','business-signals'])assert.equal(data.cases.find(study=>study.id===id).href,null);
});
