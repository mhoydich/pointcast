import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {setupInternFilters} from '../src/lib/intern-filters.mjs';
import {normalizeRoleLibrary} from '../src/lib/intern-role-library.mjs';
const source=JSON.parse(fs.readFileSync('src/data/intern-role-library.json','utf8'));
const catalog=normalizeRoleLibrary(source);
const built=p=>fs.readFileSync('dist/'+p,'utf8');
test('archive and JSON preserve every role and never advertise an open application',()=>{
  assert.ok(catalog.roles.length>0,'source catalog required before release');
  const json=JSON.parse(built('intern.json'));
  assert.equal(json.applicationsOpen,false);assert.deepEqual(json.opportunities,[]);
  assert.equal(json.roles.length,86);assert.equal(catalog.counts.full,8);assert.equal(catalog.counts.partial,2);
  assert.doesNotMatch(JSON.stringify(json),/mail\.google\.com|mailto:|@gmail\.com|read_attachment_supported|editorial_notes|historical_application_instructions/);
  assert.equal(json.roles.length,catalog.roles.length);
  assert.equal(new Set(catalog.roles.map(r=>r.slug)).size,catalog.roles.length);
  for(const role of catalog.roles){
    const html=built(`intern/roles/${role.slug}/index.html`);
    const twin=JSON.parse(built(`intern/roles/${role.slug}.json`));
    assert.equal(twin.organization,role.organization);assert.deepEqual(twin.sections,role.sections);
    assert.equal(twin.applicationsOpen,false);assert.equal(twin.current_opening_verified,false);assert.equal(twin.status,'archived');assert.equal(twin.description_status,role.description_status);assert.match(html,/Historical description/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/<main\b/g)||[]).length,1);
    assert.doesNotMatch(html,/<form\b|JobPosting|mailto:|api\/market-applications|PageviewBeacon/i);
    const doc=new JSDOM(html).window.document;
    for(const section of role.sections)for(const text of [...(section.paragraphs||[]),...(section.items||[])])assert.ok(doc.body.textContent.includes(text),role.slug+' source text retained');
  }
});
test('filters compose, no-result notice announces, reset restores all cards',()=>{
  const dom=new JSDOM(built('intern/index.html'));
  const doc=dom.window.document;
  setupInternFilters(doc);
  assert.equal(doc.querySelector('[data-intern-filters]').hidden,false);
  const cards=[...doc.querySelectorAll('[data-role-card]')];
  const search=doc.querySelector('#ic-search'),org=doc.querySelector('#ic-organization');
  org.value=catalog.roles[0].organization;org.dispatchEvent(new dom.window.Event('change'));
  assert.equal(cards.filter(c=>!c.hidden).length,catalog.roles.filter(r=>r.organization===org.value).length);
  search.value='zxqmissingterm';search.dispatchEvent(new dom.window.Event('input'));
  assert.equal(cards.filter(c=>!c.hidden).length,0);assert.equal(doc.querySelector('#ic-empty').hidden,false);
  assert.match(doc.querySelector('#ic-count').textContent,/Showing 0 of/);
  doc.querySelector('#ic-reset').click();assert.equal(cards.filter(c=>!c.hidden).length,catalog.roles.length);
});
test('all twelve lab pathways and console source links resolve',()=>{
  const doc=new JSDOM(built('intern/index.html')).window.document;
  const labs=new Set([...doc.querySelectorAll('a')].map(a=>a.getAttribute('href')).filter(x=>x?.startsWith('/communications-lab/projects/')));
  assert.equal(labs.size,12);
  for(const a of doc.querySelectorAll('a')){
    const href=a.getAttribute('href');if(!href?.startsWith('/')||href==='/')continue;
    const u=new URL(href,'https://pointcast.xyz');
    if(!u.pathname.startsWith('/intern')&&!u.pathname.startsWith('/communications-lab'))continue;
    const path='dist'+u.pathname+(u.pathname.endsWith('/')?'index.html':'');assert.ok(fs.existsSync(path),path);
  }
  assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(doc.querySelectorAll('main').length,1);
  assert.match(doc.body.textContent,/applications closed/);assert.doesNotMatch(doc.body.textContent,/Apply now/);
  assert.ok(fs.statSync('dist/intern/assets/social-card.png').size>1000);
});
