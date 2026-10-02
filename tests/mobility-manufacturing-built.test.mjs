import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import path from 'node:path';
const root=new URL('../dist/',import.meta.url);
for(const route of ['manufacturing','mobility-2030']) test(`${route} built links, landmark and media remain valid`,{skip:!existsSync(new URL(`${route}/index.html`,root))},()=>{
 const doc=new JSDOM(readFileSync(new URL(`${route}/index.html`,root),'utf8')).window.document;
 assert.equal(doc.querySelectorAll('main').length,1);
 assert.equal(doc.querySelectorAll('h1').length,1);
 for(const link of doc.querySelectorAll('.blueprint a[href]')){
  const href=link.getAttribute('href');
  if(href.startsWith('#'))assert.ok(doc.getElementById(href.slice(1)),href);
  else if(href.startsWith('/manufacturing')||href.startsWith('/mobility-2030')){
   const url=new URL(href,'https://pointcast.xyz');
   const file=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
   assert.ok(existsSync(new URL(file.slice(1),root)),href);
   if(url.hash){const target=new JSDOM(readFileSync(new URL(file.slice(1),root),'utf8')).window.document;assert.ok(target.getElementById(url.hash.slice(1)),href);}
  }
 }
 for(const img of doc.querySelectorAll('.blueprint img')){assert.ok(img.getAttribute('alt'));assert.ok(existsSync(new URL(img.getAttribute('src').slice(1),root)));}
});
test('built JSON twins parse and preserve content', {skip:!existsSync(new URL('manufacturing.json',root))},()=>{const atlas=JSON.parse(readFileSync(new URL('manufacturing.json',root)));const mobility=JSON.parse(readFileSync(new URL('mobility-2030.json',root)));assert.equal(atlas.companies.length,23);assert.equal(mobility.regulatory.sources.length,20);assert.equal(mobility.concept.status,'design-fiction');});
