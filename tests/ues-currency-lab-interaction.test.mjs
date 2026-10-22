import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {initialState,STORAGE_KEY} from '../public/assets/ues-currency-lab/lab-core.mjs';
import {seal,DEFAULT,CAST,encodeDesign} from '../public/assets/ues-currency-lab/workshop-model.mjs';
// Reuse the existing repository's small DOM runtime read-only. No installation.
const require=createRequire(process.env.POINTCAST_PACKAGE || new URL('../package.json',import.meta.url));
const {JSDOM}=require('jsdom');
const content=await readFile(new URL('../src/components/ues-currency-lab/lab.html',import.meta.url),'utf8');
async function boot(saved,hash=''){
  const dom=new JSDOM(`<!doctype html><html><body>${content}</body></html>`,{url:'http://localhost/ues/currency-lab/'+hash});
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.localStorage=dom.window.localStorage;
  globalThis.matchMedia=()=>({matches:true});dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  if(saved!==undefined)localStorage.setItem(STORAGE_KEY,saved);
  let prints=0;dom.window.print=()=>prints++;
  await import('../public/assets/ues-currency-lab/lab.mjs?test='+Math.random());
  const $=s=>document.querySelector(s);
  const change=(selector,value)=>{const el=$(selector);if(el.type==='checkbox'||el.type==='radio')el.checked=value;else el.value=value;el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));};
  const input=(selector,value)=>{$(selector).value=value;$(selector).dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  return {dom,$,change,input,prints:()=>prints};
}
test('the complete learner path updates art, duplicates, checks, print, and opt-in local save',async()=>{
  const {dom,$,change,input,prints}=await boot();
  assert.ok($('#note-art svg'));assert.equal(localStorage.getItem(STORAGE_KEY),null);
  $('[data-theme="memory"]').click();assert.match($('#note-art').innerHTML,/sunset.svg/);
  $('[data-face="back"]').click();assert.match($('#note-art').textContent,/Made to be looked at/);
  $('[data-face="front"]').click();
  change('[name="meaning-answer"][value="money"]',true);assert.match($('#meaning-feedback').textContent,/Try again/);
  change('[name="meaning-answer"][value="collectible"]',true);assert.match($('#meaning-feedback').textContent,/Yes/);
  $('[data-next="1"]').click();assert.equal($('#experiment-1').hidden,false);assert.equal(document.activeElement.id,'heading-1');
  $('[data-composition="field"]').click();assert.match($('#note-art').textContent,/FIELD STUDY/);assert.equal(document.activeElement.dataset.composition,'field');
  $('[data-palette="clay"]').click();assert.match($('#note-art').innerHTML,/#612f37/);
  $('[data-next="2"]').click();$('#duplicate-button').click();assert.equal($('#duplicate-tray').hidden,false);assert.equal($('#copy-a-id').textContent,$('#copy-b-id').textContent);
  change('#copies','999');assert.equal($('#copies').value,'24');
  change('[name="copy-answer"][value="no"]',true);
  $('[data-next="3"]').click();assert.equal($('#duplicate-tray').hidden,true);
  input('#project-title','<img src=x onerror=alert(1)>');input('#project-story','Remember the sea air.');
  assert.equal($('#note-art').querySelector('img'),null);
  for(let i=0;i<3;i++)change(`[data-check="${i}"]`,true);
  assert.match($('#brief-status').textContent,/Brief ready/);
  $('#print-brief').click();assert.equal(prints(),1);assert.match($('#print-output').textContent,/SELF-CHECKED/);assert.equal($('#print-output').querySelector('img'),null);
  assert.equal(localStorage.getItem(STORAGE_KEY),null);
  $('#save-progress').click();assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).copies,24);
  input('#project-story','A revised memory.');assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).story,'A revised memory.');
  $('#erase-progress').click();assert.equal(localStorage.getItem(STORAGE_KEY),null);assert.equal($('#project-title').value,'Pacific afternoons');
  dom.window.close();
});
test('teacher path, native disclosure, reload, and clear remain usable',async()=>{
  const saved={...initialState(),theme:'craft',step:2,story:'A saved sketch.'};
  const {dom,$}=await boot(JSON.stringify(saved));
  assert.match($('#note-art').innerHTML,/pencil.svg/);assert.match($('#storage-status').textContent,/restored/);
  $('#teach-path').click();assert.equal($('#learner-path').hidden,true);assert.equal($('#teacher-path').hidden,false);assert.equal(document.activeElement.id,'teacher-title');
  $('#teacher-start').click();assert.equal($('#teacher-path').hidden,true);assert.equal($('#experiment-2').hidden,false);
  $('#detail-toggle').click();assert.equal($('#note-details').hidden,false);assert.equal($('#detail-toggle').getAttribute('aria-expanded'),'true');
  $('#detail-toggle').click();assert.equal($('#note-details').hidden,true);
  dom.window.close();
});
test('corrupted local data falls back to a usable default without injecting markup',async()=>{
  const {dom,$}=await boot('{not-json');
  assert.ok($('#note-art svg'));assert.match($('#storage-status').textContent,/could not restore/);assert.equal($('#project-title').value,'Pacific afternoons');
  dom.window.close();
});
test('storage failure keeps editing and printing available with honest feedback',async()=>{
  const {dom,$,input,prints}=await boot();
  globalThis.localStorage={getItem(){return null},setItem(){throw new Error('unavailable')},removeItem(){throw new Error('unavailable')}};
  $('#save-progress').click();assert.match($('#storage-status').textContent,/unavailable/);
  input('#project-title','Still making');$('#print-brief').click();assert.equal(prints(),1);
  $('#erase-progress').click();assert.match($('#storage-status').textContent,/did not allow removal/);assert.equal($('#project-title').value,'Still making');
  dom.window.close();
});
test('fragment import renders arbitrary original art and preserves local-only editing',async()=>{
  const originalFetch=globalThis.fetch;
  const raw=await readFile(new URL('../public/assets/ues-currency-lab/image-data.json',import.meta.url),'utf8');
  globalThis.fetch=async()=>({ok:true,text:async()=>raw});
  const design=await seal({...DEFAULT,asset:{...DEFAULT.asset,seed:CAST[3].seed}});
  const {dom,$}=await boot(undefined,'#design='+encodeDesign(design));
  assert.match($('#import-status').textContent,/Workshop design loaded/);assert.match($('#note-art').textContent,/Original Nouns crt/);
  assert.match($('#note-art').innerHTML,/data:image\/svg\+xml;base64,/);assert.equal(localStorage.getItem(STORAGE_KEY),null);
  $('[data-theme="place"]').click();assert.match($('#note-art').innerHTML,/sailboat.svg/);
  dom.window.close();globalThis.fetch=originalFetch;
});
test('invalid fragment leaves the default usable and explains the rejected import',async()=>{
  const {dom,$}=await boot(undefined,'#design=invalid');
  assert.ok($('#note-art svg'));assert.match($('#note-art').innerHTML,/sailboat.svg/);assert.ok($('#import-status').textContent.length>0);assert.ok(!$('#import-status').textContent.includes('loaded'));
  dom.window.close();
});
