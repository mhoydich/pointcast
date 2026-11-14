import test from 'node:test';
import assert from 'node:assert/strict';
import { readDirectory, directoryResponse } from '../src/lib/loom/directory.mjs';
const card = {op:'append',id:'c',seq:1,at:'2026-11-13',from:{name:'Tess',kind:'agent',address:'@tess'},body:'CARD Tess\ndoes: <code>',kind:'note'};
const logs = {
  'loom:log:1': {address:'@tess',ops:[card,{op:'edit',id:'c',seq:2,body:'CARD Tess\ndoes: <reviews>'}]},
  'loom:log:2': {address:'#room',ops:[{op:'append',id:'human',seq:1,at:'2026-11-14',from:{name:'Mira',kind:'human'},body:'Hello'}, {op:'append',id:'hidden',seq:2,at:'2026-11-14',from:{name:'Hidden',kind:'human'},body:'Hidden'}, {op:'hide',id:'hidden',seq:3}]},
  'loom:log:3': {address:'@tess',ops:[{...card,id:'forged',from:{name:'Other',kind:'agent',address:'@other'},body:'CARD wrong'}]},
};
let snapshot = null; let scans = 0;
const kv = {list:async()=>{ scans++; return {keys:Object.keys(logs).map(name=>({name})),list_complete:true}; },get:async key=>key==='loom:directory:snapshot:v1' ? snapshot : JSON.stringify(logs[key]),put:async (key,value)=>{snapshot=value}};
test('retained messages, edited self cards and hidden or foreign cards',async()=>{
 const {people,incomplete}=await readDirectory(kv); assert.equal(incomplete,false);
 assert.equal(people.find(p=>p.name==='Tess').card.body,'CARD Tess\ndoes: <reviews>');
 assert.equal(people.find(p=>p.name==='Mira').card,null);
 assert.equal(people.find(p=>p.name==='Other').card,null);
 assert.equal(people.some(p=>p.name==='Hidden'),false);
});
test('search and plain text work without scripts; HTML escapes card content',async()=>{
 let r=await directoryResponse(new Request('https://example.test/loom/directory?q=reviews'),kv); let html=await r.text();
 assert.match(html,/&lt;reviews&gt;/); assert.doesNotMatch(html,/<reviews>/); assert.doesNotMatch(html,/Mira/);
 r=await directoryResponse(new Request('https://example.test/loom/directory.txt?q=mira'),kv,true);
 assert.match(r.headers.get('content-type'),/^text\/plain/); assert.match(await r.text(),/Mira · human/);
});
test('storage failures are visible',async()=>{
 const partial={list:async()=>({keys:[{name:'bad'}],list_complete:true}),get:async()=>{throw Error('fail')}};
 assert.equal((await readDirectory(partial)).incomplete,true);
 assert.equal((await directoryResponse(new Request('https://example.test'),null)).status,503);
});

test('searches and text share a snapshot for three minutes',async()=>{
 snapshot=null; scans=0;
 await directoryResponse(new Request('https://example.test/loom/directory?q=tess'),kv);
 await directoryResponse(new Request('https://example.test/loom/directory.txt?q=mira'),kv,true);
 assert.equal(scans,1);
 const saved=JSON.parse(snapshot); saved.at-=181000; snapshot=JSON.stringify(saved);
 await directoryResponse(new Request('https://example.test/loom/directory'),kv);
 assert.equal(scans,2);
});
