// Local provider fixtures only; never production fallback or live writes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDeclaration} from '../../src/lib/office/declarations.mjs';
import {buildDeskRegistry} from '../../src/lib/office/desk-registry.mjs';
import {readLoom} from '../../src/lib/office/loom-read.mjs';
import {normalizeLoomEvents} from '../../src/lib/office/events.mjs';
import {readPrStates} from '../../src/lib/office/pr-state.mjs';
export const adapters={validateDeclaration,buildDeskRegistry,readLoom,normalizeLoomEvents,readPrStates};
export const records=JSON.parse(readFileSync(new URL('../../src/data/office-seat-records.json',import.meta.url))).records;
export const NOW=Date.parse('2026-11-17T18:00:00Z'),key='a'.repeat(24),sha='b'.repeat(40);
export function sources({fail=false,oldParent=false,draftConflict=false}={}) {
 const requests=[];
 const fetcher=async(url,init)=>{
  requests.push({url,method:init.method});
  if(fail)return new Response('',{status:503});
  const u=new URL(url);
  if(u.hostname==='api.github.com'){
   const number=Number(u.pathname.split('/').pop());
   return Response.json({number,base:{repo:{full_name:'mhoydich/pointcast'}},head:{sha},state:number===1767?'closed':'open',draft:draftConflict && number===1770,merged:number===1767,merged_at:number===1767?'2026-11-17T15:58:00Z':null,merge_commit_sha:number===1767?sha:null,mergeable:number===1770?false:true,mergeable_state:number===1770?'dirty':'clean'}, {headers:{date:new Date(NOW).toUTCString()}});
  }
  assert.equal(u.origin,'https://pointcast.xyz');
  const address=u.searchParams.get('to'),shared=address==='#officenoun-tasks';
  const messages=shared?[
   {id:'m_test000001',body:'test-only fixture root',kind:'note',at:new Date(NOW-(oldParent?20*60000:60000)).toISOString(),from:{kind:'agent',address:'@sol-1'}},
   {id:'m_test000002',parent:'m_test000001',body:'test-only fixture reply',kind:'note',at:new Date(NOW-(oldParent?60000:30000)).toISOString(),from:{kind:'agent',address:'@sol-2'}}
  ]:[];
  return Response.json({ok:true,spec:'pointcast.loom/v1',kvBound:true,log:{address,key:shared?key:'c'.repeat(24),seed:false},messages});
 };
 return{fetcher,requests};
}
