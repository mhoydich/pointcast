import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {coffeeCost,breadCost,groupCost,matchesPantry} from '../src/lib/pantry.mjs';
test('coffee includes entered bag delivery, tax, equipment and per-brew costs separately',()=>{
 const r=coffeeCost({price:18,weight:360,dose:18,shipping:2,tax:0,equipment:100,lifetime:500,filter:.03,milk:0,waterEnergy:.02});
 assert.equal(r.servings,20);assert.equal(r.wholeServings,20);assert.equal(r.perServing,1);assert.equal(r.totalPerServing,1.25);
});
test('coffee does not divide by zero or accept invalid waste or costs',()=>{
 for(const change of [{weight:0},{dose:0},{waste:100},{waste:-1},{price:-1},{price:NaN},{lifetime:0},{shipping:-1}])assert.equal(coffeeCost({price:18,weight:340,dose:18,...change}),null);
});
test('bread separates cash, active labor and usable yield',()=>{
 const r=breadCost({flourPrice:5,flourWeight:1000,flourGrams:1000,extras:1,energy:2,minutes:60,hourly:20,loaves:4,waste:25});
 assert.equal(r.cash,8);assert.equal(r.labor,20);assert.equal(r.cashPerLoaf,8/3);assert.equal(r.fullPerLoaf,28/3);
});
test('bread rejects invalid yield and fractional loaves',()=>{
 const base={flourPrice:5,flourWeight:1000,flourGrams:1000,extras:1,energy:2,minutes:60,hourly:20,loaves:4,waste:25};
 for(const c of [{loaves:0},{loaves:1.5},{waste:100},{flourWeight:0},{minutes:-1}])assert.equal(breadCost({...base,...c}),null);
});
test('group savings disappear once entered coordination exceeds the discount',()=>{
 const base={units:5,unitPrice:20,shipping:15,coordination:0,retail:19/12*16};
 const a=groupCost(base),b=groupCost({...base,coordination:30});assert.equal(a.perUnit,23);assert.equal(b.perUnit,29);assert(a.savingPerUnit>0);assert(b.savingPerUnit<0);
 for(const units of [0,1.5,NaN])assert.equal(groupCost({...base,units}),null);
});
test('filters combine area, kind and accent-insensitive search',()=>{
 const row={name:'Café Test',area:'El Segundo',kind:'Café'};assert(matchesPantry(row,{query:'cafe',area:'El Segundo'}));assert(!matchesPantry(row,{query:'cafe',kind:'Roaster'}));assert(!matchesPantry(row,{area:'Torrance'}));
});
test('research price rows retain units, observation dates and real source links',()=>{
 for(const slug of ['coffee','bread']){const g=JSON.parse(fs.readFileSync(new URL(`../src/data/pantry/${slug}.json`,import.meta.url)));assert(g.prices.length>10);for(const p of g.prices){assert(p.unit);assert.match(p.observed,/^2026-10-0[35]$/);assert.match(p.url,/^https:\/\//);}assert(g.sources.length>=25);assert(g.feature.sections.length>=9);}
});
test('coffee collector data identifies all five existing tokens without a supply claim',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../src/data/contracts.json',import.meta.url))).coffee_mugs;assert.equal(c.mainnet,'KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt');assert.deepEqual(Object.values(c.edition_caps),[333,144,64,21,8]);assert.equal(Object.keys(c.tokens).length,5);
});
