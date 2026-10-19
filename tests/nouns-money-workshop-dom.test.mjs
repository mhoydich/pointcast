// Runtime integration checks in jsdom, reusing an existing installation.
// This does not claim browser layout, focus, download, or print-engine coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {DEFAULT,TRAY_KEY,seal,encodeDesign} from '../public/nouns-money/workshop/model.mjs';
const tooling=process.env.NMW_EXISTING_TOOLING;
if(!tooling)throw new Error('Set NMW_EXISTING_TOOLING to an existing directory containing jsdom. Do not install dependencies for this check.');
const require=createRequire(tooling+'/package.json');
const {JSDOM}=require('jsdom');
const html=await readFile(new URL('../public/nouns-money/workshop/index.html',import.meta.url),'utf8');
const assets=await readFile(new URL('../public/nouns-money/workshop/assets/image-data.json',import.meta.url));
const sample=await seal(DEFAULT);
let serial=0;
async function until(condition){for(let i=0;i<100;i++){if(condition())return;await new Promise(resolve=>setTimeout(resolve,5));}throw new Error('Runtime did not reach expected state.');}
async function boot({hash='',storage=null,blocked=false,corruptAssets=false}={}){
  const dom=new JSDOM(html,{url:'http://localhost/nouns-money/workshop/'+hash,pretendToBeVisual:true});
  const {window}=dom;
  window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  window.scrollTo=()=>{};window.print=()=>{};
  const store=window.localStorage;if(storage!==null)store.setItem(TRAY_KEY,storage);
  const blockedStore={getItem(){throw new Error('Blocked');},setItem(){throw new Error('Blocked');}};
  Object.defineProperties(globalThis,{window:{configurable:true,value:window},document:{configurable:true,value:window.document},location:{configurable:true,value:window.location},localStorage:{configurable:true,value:blocked?blockedStore:store},navigator:{configurable:true,value:window.navigator}});
  const requests=[];
  globalThis.fetch=async url=>{requests.push(url);assert.equal(url,'./assets/image-data.json');const bytes=corruptAssets?Buffer.from('{}'):assets;return{ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  const blobs=[];globalThis.URL.createObjectURL=blob=>{blobs.push(blob);return'blob:test';};globalThis.URL.revokeObjectURL=()=>{};
  window.HTMLAnchorElement.prototype.click=function(){};
  await import('../public/nouns-money/workshop/app.mjs?test='+serial++);
  const $=s=>window.document.querySelector(s);
  await until(()=>corruptAssets?$('#status').textContent.includes('checksum'):!$('#save').disabled);
  return {dom,window,$,store,requests,blobs,click:async selector=>{$(selector).click();await new Promise(resolve=>setTimeout(resolve,25));}};
}
test('first visit, composition, tray, export, and print proof form one usable loop',async()=>{
  const b=await boot();const{$,click,window,store,blobs}=b;
  assert.equal(store.getItem(TRAY_KEY),null,'No storage write before explicit save');
  assert.equal($('#cast').children.length,9);assert.equal($('#note svg').getAttribute('width'),'180mm');
  await click('[data-cast="1"]');assert.match($('#selected-noun').textContent,/sunset/);
  await click('#back');assert.equal($('#back').getAttribute('aria-pressed'),'true');assert.match($('#note').textContent,/REVERSE STUDY/);
  await click('#tab-place');assert.equal($('#panel-place').hidden,false);assert.equal($('#panel-noun').hidden,true);
  await click('[data-theme="workshop"]');assert.equal($('#design-title').textContent,'Factory of Ideas');
  await click('#tab-ink');await click('[data-palette="2"]');
  $('#edition').value='little & local';$('#edition').dispatchEvent(new window.Event('change'));await until(()=>$('#edition').value==='LITTLE & LOCAL');
  await click('#save');assert.equal(JSON.parse(store.getItem(TRAY_KEY)).length,1);await click('#save');assert.equal(JSON.parse(store.getItem(TRAY_KEY)).length,1);
  await click('#open-tray');assert.equal($('#tray-dialog').open,true);assert.equal($('#tray-grid').children.length,1);
  await click('#tray-grid button');assert.equal($('#tray-dialog').open,false);assert.equal($('#front').getAttribute('aria-pressed'),'true');
  await click('#open-export');await click('#download-json');assert.equal(blobs.length,1);assert.equal(JSON.parse(await blobs[0].text()).edition.label,'LITTLE & LOCAL');
  await click('#download-svg');assert.equal(blobs.length,2);assert.ok((await blobs[1].text()).includes('LITTLE &amp; LOCAL'));
  await click('#share');assert.equal($('#share-fallback').hidden,false);assert.ok($('#share-url').value.includes('#design='));
  await click('#print-proof');assert.equal($('#print-view').hidden,false);assert.equal($('#print-front svg').getAttribute('height'),'84mm');assert.ok($('#print-back svg'));await click('#leave-print');assert.equal($('#print-view').hidden,true);
  await click('#open-tray');await click('#tray-grid button:nth-child(2)');assert.equal(JSON.parse(store.getItem(TRAY_KEY)).length,0);assert.match($('#tray-grid').textContent,/Room for something good/);
  assert.deepEqual(b.requests,['./assets/image-data.json']);b.dom.window.close();
});
test('blocked persistence explicitly retains a visit-only tray',async()=>{
  const b=await boot({blocked:true});await b.click('#save');assert.match(b.$('#status').textContent,/visit only/);assert.equal(b.$('#tray-count').textContent,'1');assert.match(b.$('.save-note').textContent,/visit-only/);b.dom.window.close();
});
test('corrupt stored data is preserved while new saves remain visit-only',async()=>{
  const b=await boot({storage:'not json'});await b.click('#save');assert.equal(b.store.getItem(TRAY_KEY),'not json');assert.match(b.$('#status').textContent,/visit only/);b.dom.window.close();
});
test('valid imported links reopen a design without silently saving it',async()=>{
  const recipe=await seal({...DEFAULT,theme:'el-segundo'});
  const b=await boot({hash:'#design='+encodeDesign(recipe)});await until(()=>b.$('#design-title').textContent==='El Segundo Field Notes');assert.equal(b.store.getItem(TRAY_KEY),null);b.dom.window.close();
});
test('invalid imported links preserve a usable default and explain the error',async()=>{
  const bad={...sample,theme:'workshop'};const b=await boot({hash:'#design='+encodeDesign(bad)});await until(()=>b.$('#status').classList.contains('error'));assert.equal(b.$('#design-title').textContent,'Pacific Social Club');assert.match(b.$('#status').textContent,/fingerprint/);assert.equal(b.$('#save').disabled,false);b.dom.window.close();
});
test('asset tampering fails closed with a usable static fallback',async()=>{
  const b=await boot({corruptAssets:true});assert.equal(b.$('#save').disabled,true);assert.ok(b.$('#note img'));assert.match(b.$('#status').textContent,/checksum/);assert.ok(b.$('#status + a[download]'));b.dom.window.close();
});
test('tab arrow navigation follows the selected panel and focus target',async()=>{
  const b=await boot();b.$('#tab-noun').dispatchEvent(new b.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(b.$('#tab-place').getAttribute('aria-selected'),'true');assert.equal(b.$('#panel-place').hidden,false);assert.equal(b.window.document.activeElement.id,'tab-place');b.dom.window.close();
});
test('existing saved designs survive reload and can be inspected individually',async()=>{
  const b=await boot({storage:JSON.stringify([sample])});assert.equal(b.$('#tray-count').textContent,'1');assert.match(b.$('#save').textContent,/In your tray/);await b.click('#inspect');assert.match(b.$('#specs').textContent,new RegExp(sample.specimen.id));assert.match(b.$('#specs').textContent,/globally registered/);b.dom.window.close();
});
