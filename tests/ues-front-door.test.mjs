import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterStudies,renderFrontDoor,validatePortal,escapeHtml} from '../src/lib/ues-front-door.mjs';
const data=JSON.parse(await readFile(new URL('../src/data/ues-front-door.json',import.meta.url),'utf8'));
test('publication guard rejects missing live evidence and any proposed public link',()=>{
 assert.deepEqual(validatePortal(data),[]);
 for(const mutation of [s=>{s.sourceUrl=null},s=>{s.checkedAt=null},s=>{s.status='proposed'}]) {const d=structuredClone(data);mutation(d.studies[0]);assert.ok(validatePortal(d).length);}
});
test('all search words, category and publication combine, case-insensitively',()=>{
 assert.deepEqual(filterStudies(data.studies,{query:'COFFEE illustrative',school:'business',status:'live'}).map(s=>s.id),['coffee']);
 assert.deepEqual(filterStudies(data.studies,{query:'coffee',school:'care'}),[]);
 assert.ok(filterStudies(data.studies,{status:'proposed'}).every(s=>s.publicHref===null));
 assert.equal(filterStudies(data.studies,{query:'   '}).length,data.studies.length);
});
test('portable homepage keeps existing course origin and proposed entries unlinked',()=>{
 const html=renderFrontDoor(data,{standalone:true});
 for(const c of data.classes) assert.ok(html.includes(`href="https://pointcast.xyz${c.path}"`));
 for(const s of data.studies.filter(s=>s.status==='proposed')) assert.ok(!html.includes(`href="${s.publicHref}"`));
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1); assert.equal((html.match(/<main[ >]/g)||[]).length,0);
 assert.ok(html.includes('local') && html.includes('self-attested'));
});
test('renderer escapes editorial data and exposes all cards without script',()=>{
 const d=structuredClone(data);d.studies[0].title='<img src=x onerror=alert(1)>';
 const html=renderFrontDoor(d);assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
 assert.equal((html.match(/data-study="/g)||[]).length,data.studies.length);
 assert.equal((html.match(/data-study="[^>]* hidden/g)||[]).length,0);
 assert.equal(escapeHtml(`&<>"'`),'&amp;&lt;&gt;&quot;&#39;');
});
test('PointCast edit preserves the current ten-course catalog and progress implementation',async()=>{
 const page=await readFile(new URL('../src/pages/ues/index.astro',import.meta.url),'utf8');
 assert.ok(page.includes('id="current-term"'));assert.ok(page.includes('UES_SEASON_ONE_COURSES.map'));
 assert.ok(page.includes('/ues/track-05'));assert.ok(page.includes('/ues/classes.json'));
 assert.ok(page.includes('<UesFrontDoor />'));assert.equal((page.match(/<h1[ >]/g)||[]).length,0);
 assert.equal(data.classes.length,10); assert.equal(data.participation.progress.storage,'local-browser-only');
});
