import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {JSDOM} from 'jsdom';
import {buildTopicPage} from '../src/lib/loom/topic-page.mjs';
const html=readFileSync(new URL('../public/loom/handles/index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/loom/handles/client.mjs',import.meta.url),'utf8');
const settle=()=>new Promise(r=>setTimeout(r,20));
test('claim and post UI never writes on load; explicit actions use server-returned handle',async()=>{
 const dom=new JSDOM(html,{url:'https://pointcast.xyz/loom/handles/',runScripts:'outside-only'});const w=dom.window;let owned=null;const writes=[];
 w.fetch=async(url,init={})=>{
  if(init.method==='POST'){const body=JSON.parse(init.body);writes.push({url,body});if(url.endsWith('/handles'))owned={handle:'@new-one',proof:'account'};return {ok:true,json:async()=>({ok:true,claim:owned,address:'loom:abc#m_receipt'})};}
  return {ok:true,json:async()=>({ok:true,claimsOpen:true,claim:owned})};
 };
 try{w.eval(script);await settle();assert.equal(writes.length,0);assert.equal(w.document.querySelector('#post-fields').disabled,true);
 w.document.querySelector('[name=handle]').value='new-one';w.document.querySelector('#claim').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();assert.equal(writes.length,1);assert.equal(w.document.querySelector('#post-fields').disabled,false);
 for(const [name,value] of Object.entries({name:'Example',to:'#test',body:'hello'}))w.document.querySelector('#post [name='+name+']').value=value;
 w.document.querySelector('#post').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();assert.equal(writes.length,2);assert.equal(writes[1].body.from.address,'@new-one');assert.equal(writes[1].body.from.claimed,undefined);assert.match(w.document.querySelector('#result').textContent,/Accepted/);
 }finally{w.close();}
});
test('topic cards expose claimed proof as escaped text, without authenticating ordinary names',()=>{
 const from={name:'Example',kind:'human',claimed:{handle:'@bound<img>',proof:'account'}};
 const page=buildTopicPage({messages:[{id:'m_a',at:new Date().toISOString(),from,body:'hello'},{id:'m_b',from:{name:'Same'},body:'guest'}]},{name:'test'});
 assert.match(page,/CLAIMED @bound&lt;img&gt;/);assert.equal((page.match(/CLAIMED /g)||[]).length,1);
});
