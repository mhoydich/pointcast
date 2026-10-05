import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {geodesicMiles,filterStores,filterProducts,readFilters} from '../src/lib/dispensary-atlas.mjs';
const data=JSON.parse(readFileSync(new URL('../src/data/dispensary-atlas.json',import.meta.url)));
const sources=new Map(data.sources.map(s=>[s.id,s]));
test('snapshot record counts have precise license units and Active is the default',()=>{
 assert.equal(data.stores.length,485);assert.equal(data.stores.filter(s=>s.licenseStatus==='Active').length,341);
 assert.equal(new Set(data.stores.map(s=>s.licenseNumber)).size,485);
 assert.equal(filterStores(data.stores,readFilters(new URLSearchParams(),data),data.center).length,341);
 assert.equal(filterStores(data.stores,{status:'all'},data.center).length,485);
 assert.equal(data.excludedMicrobusinessCount,46);
});
test('every included coordinate independently reproduces the declared radius and distance',()=>{
 for(const s of data.stores){let n=geodesicMiles(data.center,s);assert.ok(n<=25+1e-8);assert.ok(Math.abs(n-s.distanceMiles)<1e-6,s.licenseNumber);}
 assert.equal(data.center.lat,33.91992025096);assert.equal(data.center.lon,-118.415864992665);
});
test('researched operator profiles match an exact active DCC license rather than a postal inference',()=>{
 for(const p of data.profiles){const s=data.stores.find(s=>s.licenseNumber===p.licenseNumber);assert.ok(s);assert.equal(s.licenseStatus,'Active');assert.equal(s.jurisdiction,p.municipalJurisdiction);assert.equal(s.lat,p.latitude);assert.equal(s.lon,p.longitude);}
 assert.equal(data.profiles.find(p=>p.id==='erba-venice').municipalJurisdiction,'Los Angeles');
 assert.equal(data.profiles.find(p=>p.id==='original-green-cross').municipalJurisdiction,'Los Angeles');
});
test('product search is a bounded observed sample with provenance and no stock guarantee',()=>{
 assert.equal(data.products.length,14);assert.equal(data.products.filter(p=>p.evidenceType==='public_menu_listing').length,12);
 assert.equal(data.products.filter(p=>p.evidenceType==='retailer_featured_mention').length,2);
 for(const p of data.products){assert.equal(p.availabilityVerified,false);assert.ok(sources.has(p.sourceId));assert.ok(data.profiles.some(s=>s.id===p.storeId));assert.equal(p.observedOn,'2026-10-03');}
 assert.equal(filterProducts(data.products,{brand:'WYLD',category:'Edibles / gummies',store:'erba-venice'}).length,1);
});
test('all linked sources are public HTTPS references and used source identifiers resolve',()=>{
 assert.equal(sources.size,data.sources.length);
 const visit=v=>{if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(k==='sourceIds')for(const id of x)assert.ok(sources.has(id),id);else if(k==='sourceId')assert.ok(sources.has(x),x);else if(/Url$|^url$/.test(k)&&typeof x==='string')assert.equal(new URL(x).protocol,'https:');else visit(x);}};visit(data);
});
test('published snapshot has no owner/contact credential fields',()=>{
 const visit=v=>{if(!v||typeof v!=='object')return;for(const[k,x]of Object.entries(v)){assert.ok(!/owner|email|phone|password|token|secret/i.test(k),k);visit(x);}};visit(data);
});
test('quarterly official values retain reporting basis and annual/H1 sums are reproducible',()=>{
 const q=data.economics.californiaQuarterly;assert.equal(q.length,14);assert.equal(q.at(-1).period,'2026-Q2');
 for(const y of data.economics.californiaAnnual){assert.equal(y.cannabisSalesUsd,q.filter(p=>p.year===y.year).reduce((n,p)=>n+p.cannabisSalesUsd,0));}
 for(const h of data.economics.californiaHalfYear){assert.equal(h.cannabisSalesUsd,q.filter(p=>p.year===h.year&&p.quarter<=2).reduce((n,p)=>n+p.cannabisSalesUsd,0));}
 assert.equal(q.at(-1).cannabisSalesUsd,1013222668);assert.equal(q.at(-1).taxableSalesUsd,1208030263);assert.notEqual(q.at(-1).cannabisSalesUsd,q.at(-1).totalTaxUsd);
});
test('visible chart is nominal excise sales and fiscal forecasts remain explicitly separate',()=>{
 assert.equal(data.economics.sales.points.length,6);for(let i=0;i<6;i++)assert.equal(data.economics.sales.points[i].value,data.economics.californiaQuarterly.at(-6+i).cannabisSalesUsd/1e9);
 assert.match(data.economics.publishedOutlook.find(x=>x.period==='FY2026–27').evidenceType,/forecast_not_actual/);
 assert.equal(data.economics.industryEstimates[0].evidenceType,'industry_estimate_not_government_census');
});
