// DOM-only mocked network check; not a browser/layout/physical-phone test.
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {JSDOM}=require(process.env.DRAWER_JSDOM || 'jsdom');
const dom=new JSDOM(await readFile(new URL('./index.html',import.meta.url),'utf8'),{url:'http://localhost/sketches/office-project-drawer-shwa/'});
globalThis.document=dom.window.document;const $=id=>document.getElementById(id);const dialog=$('drawer');
dialog.showModal=()=>dialog.setAttribute('open','');dialog.close=()=>{dialog.removeAttribute('open');dialog.dispatchEvent(new dom.window.Event('close'));};
const data=JSON.parse(await readFile(new URL('./project.json',import.meta.url)));
let mode='success',reads=0,aborted=false;
globalThis.fetch=async(url,options={})=>{
 assert.equal(options.credentials,'omit');
 if(url==='./project.json')return {ok:true,json:async()=>data};
 assert.equal(options.method,'GET');reads++;
 if(mode==='pending')return await new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));}));
 return {ok:mode==='success',json:async()=>({ok:true,log:{key:data.project.roomKey},messages:[{id:data.project.rootId,taskStatus:{reported:true,parts:[{...data.report.value,part:'B'}]}}]})};
};
await import('./app.mjs');const settle=()=>new Promise(r=>setTimeout(r,0));await settle();
assert.match($('reported').textContent,/Done · reported/);$('open').click();assert.ok(dialog.hasAttribute('open'));
$('refresh').click();$('refresh').click();await settle();assert.equal(reads,1);assert.match($('read-state').textContent,/Checked release evidence has not changed/);
mode='failure';$('refresh').click();await settle();assert.match($('read-state').textContent,/Could not refresh/);assert.match($('reported').textContent,/Done · reported/);
mode='pending';$('refresh').click();$('close').click();await settle();assert.ok(aborted);assert.equal(document.activeElement,$('open'));assert.equal($('refresh').disabled,false);
$('open').click();assert.ok(dialog.hasAttribute('open'));assert.match($('deployment').textContent,/Unknown/);
console.log('PASS DOM mock: open/close/reopen, duplicate-click suppression, successful refresh, failed refresh retention, close-abort, focus return, no release promotion. Native dialog, CSS and physical browser remain untested.');
