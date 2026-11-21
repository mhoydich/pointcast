import { Miniflare } from 'miniflare';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
for (const patched of [false,true]) {
 const modules=['loom-read.mjs','pr-state.mjs'].map(name=>({type:'ESModule',path:new URL(name,import.meta.url).pathname,contents:readFileSync(new URL('../../src/lib/office/'+name,import.meta.url),'utf8').replaceAll("redirect: 'error'",patched?"redirect: 'manual'":"redirect: 'error'")}));
 const script=`import {readLoom} from './loom-read.mjs';import {readPrStates} from './pr-state.mjs';export default {async fetch(){let calls=0; const fake=async(url,init)=>{new Request(url,init);calls++; return new Response('{}',{status:302,headers:{location:'https://untrusted.test/'}})}; const loom=await readLoom({to:'#loom',fetcher:fake});const prs=await readPrStates({prs:[1767],fetcher:fake});return Response.json({calls,loom:loom.errors,prs:prs.errors});}}`;
 const mf=new Miniflare({modules:[{type:'ESModule',path:new URL('worker.mjs',import.meta.url).pathname,contents:script},...modules],compatibilityDate:'2026-07-22'});
 try {const result=await (await mf.dispatchFetch('http://probe.test')).json(); console.log({patched,...result}); assert.equal(result.calls,patched?2:0);assert.deepEqual(result.loom,[patched?'http_error':'fetch_failed']);assert.deepEqual(result.prs,[patched?'pr_1767:http_error':'pr_1767:request_failed']);} finally {await mf.dispose()}
}
