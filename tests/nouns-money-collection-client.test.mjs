import test from 'node:test';
import assert from 'node:assert/strict';
import { NounsMoneyCollection, DEVICE_COLLECTION_KEY } from '../src/lib/nouns-money/collection.ts';
const account = (userId, noteIds) => Response.json({ ok:true, userId, noteIds, storage:'account' });
function environment(t, handler, values = new Map()) {
 const priorFetch=globalThis.fetch;const priorStorage=globalThis.localStorage;
 globalThis.fetch=handler;globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 t.after(()=>{globalThis.fetch=priorFetch;if(priorStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=priorStorage;});return values;
}
test('anonymous collection removes, recollects and survives reload with known IDs only',async t=>{
 const values=environment(t,async()=>new Response('',{status:401}),new Map([[DEVICE_COLLECTION_KEY,JSON.stringify(['nm100-000','nm100-099','nm100-000','nm-01','bad'])]]));
 const first=new NounsMoneyCollection();await first.refresh();assert.deepEqual(first.view.noteIds,['nm100-000','nm100-099']);assert.equal(first.view.storage,'device');
 await first.toggle('nm100-000');await first.toggle('nm100-000');assert.deepEqual(JSON.parse(values.get(DEVICE_COLLECTION_KEY)),['nm100-000','nm100-099']);
 const reloaded=new NounsMoneyCollection();await reloaded.refresh();assert.deepEqual(reloaded.view.noteIds,first.view.noteIds);
});
test('signed-in account never imports device collection and stale account reads are discarded',async t=>{
 let resolveA;let calls=0;environment(t,()=>++calls===1?new Promise(resolve=>{resolveA=resolve;}):Promise.resolve(account('userB',['nm100-002'])),new Map([[DEVICE_COLLECTION_KEY,'["nm100-099"]']]));
 const collection=new NounsMoneyCollection();const a=collection.refresh();const b=collection.refresh();await b;resolveA(account('userA',['nm100-001']));await a;
 assert.equal(collection.view.userId,'userB');assert.deepEqual(collection.view.noteIds,['nm100-002']);
});
test('refresh clears old account immediately and stale mutations cannot paint new account',async t=>{
 let resolveWrite;let reads=0;environment(t,(_url,init)=>init?.method?new Promise(resolve=>{resolveWrite=resolve;}):Promise.resolve(account(++reads===1?'A':'B',reads===1?['nm100-000']:['nm100-001'])));
 const collection=new NounsMoneyCollection();await collection.refresh();const writing=collection.toggle('nm100-002');const refresh=collection.refresh();assert.deepEqual(collection.view.noteIds,[]);await refresh;resolveWrite(account('A',['nm100-000','nm100-002']));await writing;
 assert.equal(collection.view.userId,'B');assert.deepEqual(collection.view.noteIds,['nm100-001']);
});
test('failed account mutation does not claim saved and prevents repeated concurrent clicks',async t=>{
 let writes=0;let resolveWrite;environment(t,(_url,init)=>{if(init?.method){assert.equal(init.headers['X-PointCast-User'],'A');writes++;return new Promise(resolve=>{resolveWrite=resolve;});}return Promise.resolve(account('A',[]));});
 const collection=new NounsMoneyCollection();await collection.refresh();const first=collection.toggle('nm100-005');await collection.toggle('nm100-005');assert.equal(writes,1);resolveWrite(Response.json({ok:false,reason:'unavailable'},{status:503}));await first;
 assert.deepEqual(collection.view.noteIds,[]);assert.match(collection.view.message,/not confirmed/);assert.equal(collection.view.busy,false);
});
test('unavailable account read never silently falls back to a device list',async t=>{
 environment(t,async()=>Response.json({ok:false},{status:503}),new Map([[DEVICE_COLLECTION_KEY,'["nm100-099"]']]));const collection=new NounsMoneyCollection();await collection.refresh();assert.equal(collection.view.storage,'unavailable');assert.deepEqual(collection.view.noteIds,[]);
});
test('storage denial is honestly visit-only; logout reload selects separate device shelf',async t=>{
 let signedIn=true;environment(t,async()=>signedIn?account('A',['nm100-000']):new Response('',{status:401}));const collection=new NounsMoneyCollection();await collection.refresh();signedIn=false;globalThis.localStorage={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};await collection.refresh();await collection.toggle('nm100-099');assert.equal(collection.view.storage,'memory');assert.deepEqual(collection.view.noteIds,['nm100-099']);assert.match(collection.view.message,/this visit only/);
});

test('account-changed write response refreshes without confirming wrong-account mutation',async t=>{
 let reads=0;environment(t,(_url,init)=>init?.method?Promise.resolve(Response.json({ok:false,reason:'account-changed'},{status:409})):Promise.resolve(account(++reads===1?'A':'B',[])));const collection=new NounsMoneyCollection();await collection.refresh();await collection.toggle('nm100-000');assert.equal(collection.view.userId,'B');assert.deepEqual(collection.view.noteIds,[]);
});

test('write-denied device storage retains temporary notes on same-visit refresh',async t=>{
 environment(t,async()=>new Response('',{status:401}));globalThis.localStorage={getItem:()=>null,setItem(){throw new Error('quota');}};const collection=new NounsMoneyCollection();await collection.refresh();await collection.toggle('nm100-007');await collection.refresh();assert.equal(collection.view.storage,'memory');assert.deepEqual(collection.view.noteIds,['nm100-007']);
});
