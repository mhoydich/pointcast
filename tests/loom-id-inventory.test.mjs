import test from 'node:test';import assert from 'node:assert/strict';
import {inventory} from '../scripts/loom-legacy-inventory.mjs';
const options={account:'a'.repeat(32),namespace:'b'.repeat(32),token:'private-fixture'};
test('inventory follows every cursor for both prefixes, sorts and deduplicates',async()=>{
 const seen=[];const data=await inventory({...options,fetcher:async(url,init)=>{assert(!url.href.includes(options.token));assert.equal(init.headers.Authorization,'Bearer '+options.token);const p=url.searchParams.get('prefix'),c=url.searchParams.get('cursor');seen.push([p,c]);return Response.json({success:true,result:[{name:p+'a'.repeat(24)}],result_info:{cursor:c?'':'page2'}})}});
 assert.equal(seen.length,4);assert.equal(data.keys.length,2);assert.equal(data.list_complete,true);assert(!JSON.stringify(data).includes(options.token));
});
test('failed or ambiguous pagination cannot produce a complete inventory',async()=>{
 for(const response of [()=>new Response('',{status:403}),()=>Response.json({success:true,result:[]}),()=>Response.json({success:true,result:[],result_info:{cursor:'loop'}})])await assert.rejects(inventory({...options,fetcher:async()=>response()}));
});
