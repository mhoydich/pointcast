import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleAtomicLoom, atomicReader } from '../src/lib/loom/atomic.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';

const migration = readFileSync(new URL('../migrations/auth/0036_loom_atomic.sql', import.meta.url), 'utf8');
const lag = () => new Promise(resolve => setTimeout(resolve, 1));
function database({ migrated = true } = {}) {
 const sqlite = new DatabaseSync(':memory:');
 if (migrated) sqlite.exec(migration);
 const db = { sqlite, failBatch: false, failRead: false, batches: 0,
  withSession(mode) { assert.equal(mode, 'first-primary'); return this; },
  prepare(sql) {
   const stmt = { args: [], bind(...args) { this.args = args; return this; },
    async first() { await lag(); if (db.failRead && sql.includes('loom_atomic_values')) throw new Error('read unavailable'); return sqlite.prepare(sql).get(...this.args) ?? null; },
    exec() { return sqlite.prepare(sql).run(...this.args); },
   }; return stmt;
  },
  async batch(statements) {
   await lag(); db.batches++; sqlite.exec('BEGIN');
   try { const results = statements.map((s,i) => { const result=s.exec(); if(db.failBatch && i===1) throw new Error('disk failure'); return result; }); sqlite.exec('COMMIT'); return results; }
   catch(error) { sqlite.exec('ROLLBACK'); throw error; }
  },
 }; return db;
}
function archive() { const map=new Map(); return { map, writes:0, async get(k){ await lag(); return map.get(k)??null; }, async put(k,v){this.writes++;map.set(k,v);} }; }
const req = body => new Request('https://pointcast.xyz/api/loom', {method:'POST',body:JSON.stringify(body)});
const note = (body, to='#race') => ({to,from:{name:'Desk',kind:'agent',address:'@desk'},body});
const post = (env, body) => handleAtomicLoom(req(body), {firstHelloEnabled:false,...env});
const get = async (env,to) => {const r=await handleAtomicLoom(new Request('https://pointcast.xyz/api/loom?to='+encodeURIComponent(to)),env); assert.equal(r.status,200);return r.json();};

test('overlapping accepted appends retain every source, echo, outbox and unique sequence', async () => {
 const db=database(), kv=archive(); const env={db,kv};
 const results=await Promise.all(Array.from({length:6},(_,i)=>post(env,note('message '+i+' @shared'))));
 assert.deepEqual(results.map(r=>r.status),Array(6).fill(201));
 const receipts=await Promise.all(results.map(r=>r.json()));
 const log=await get(env,'#race');
 assert.equal(log.count,6); assert.equal(new Set(receipts.map(r=>r.message.seq)).size,6);
 for(const r of receipts) assert.ok(log.messages.some(m=>m.id===r.message.id));
 assert.equal((await get(env,'@shared')).count,6);
 const out=await (await handleAtomicLoom(new Request('https://pointcast.xyz/api/loom?from=%40desk'),env)).json();
 assert.equal(out.sent.length,6); assert.equal(kv.writes,0);
});

test('concurrent edit, vote, plus, withdraw and append do not discard each other', async () => {
 const env={db:database(),kv:archive()};
 const poll=await (await post(env,{...note('Choose'),kind:'poll',poll:{options:['A','B']}})).json();
 const remove=await (await post(env,note('withdraw me'))).json();
 const results=await Promise.all([
  post(env,{action:'edit',to:poll.address,token:poll.editToken,body:'Choose now'}),
  post(env,{action:'vote',to:poll.address,choice:1}),
  post(env,{action:'plus',to:poll.address}),
  post(env,{action:'withdraw',to:remove.address,token:remove.editToken}),
  post(env,note('another')),
 ]);
 assert.deepEqual(results.map(r=>r.status),[200,200,200,200,201]);
 const log=await get(env,'#race');
 assert.equal(log.ops.length,7); assert.deepEqual(log.ops.map(o=>o.seq),[1,2,3,4,5,6,7]);
 assert.equal(log.messages.find(m=>m.id===poll.message.id).body,'Choose now');
 assert.ok(log.ops.some(o=>o.op==='vote')); assert.ok(log.ops.some(o=>o.op==='hide'));
});

test('a failed batch rolls back source, echo, index and revision; never reports success', async () => {
 const db=database(),kv=archive();db.failBatch=true;
 const result=await post({db,kv},note('failed @shared'));
 assert.equal(result.status,503); assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM loom_atomic_values').get().n,0);
 assert.equal(db.sqlite.prepare('SELECT revision FROM loom_atomic_state').get().revision,0);
 assert.equal(db.batches,1,'unknown failure must not be replayed'); assert.equal(kv.writes,0);
});

test('missing schema and swallowed read/corrupt JSON errors fail closed without KV writes', async () => {
 const kv=archive();
 assert.equal((await post({db:database({migrated:false}),kv},note('no'))).status,503);
 assert.equal((await post({kv},note('no'))).status,503);
 const db=database();db.failRead=true;
 assert.equal((await post({db,kv},note('no'))).status,503);
 db.failRead=false;kv.map.set('loom:index','not json');
 assert.equal((await post({db,kv},note('no'))).status,503);
 assert.equal(db.sqlite.prepare('SELECT revision FROM loom_atomic_state').get().revision,0);
 assert.equal(kv.writes,0);
});

test('legacy content and edit tokens survive cutover; storage becomes authoritative', async () => {
 const kv=archive();
 const prior=await (await handleLoom(req(note('legacy')), {kv,firstHelloEnabled:false})).json();
 const initialWrites=kv.writes, env={db:database(),kv};
 assert.equal((await post(env,{action:'edit',to:prior.address,token:prior.editToken,body:'new'})).status,200);
 assert.equal((await get(env,'#race')).messages[0].body,'new');
 // A stale legacy copy must never override committed D1 data.
 assert.equal(kv.writes,initialWrites);
 assert.equal((await get(env,'#race')).messages[0].body,'new');
 assert.ok(!JSON.stringify(await get(env,'#race')).includes('tokenHash'));
});

test('retry does not consume rate budgets twice, and welcome mutations commit together', async () => {
 const env={db:database(),kv:archive()}, counts=new Map();
 const run=async name=>handleAtomicLoom(req({...note('hello'),from:{name,kind:'human'}}),{...env,limit:async(bucket,key)=>{ const id=name+bucket+key;counts.set(id,(counts.get(id)??0)+1);return true;}});
 const responses=await Promise.all([run('Alice'),run('Bob'),run('Cy')]);
 assert.deepEqual(responses.map(r=>r.status),[201,201,201]);
 assert.ok([...counts.values()].every(n=>n===1));
 const log=await get(env,'#race');assert.equal(log.ops.filter(m=>m.auto==='first-hello').length,3);
});


test('bot, For You, topics and sitemap read the committed store, not stale KV', async () => {
 const { serveBot } = await import('../src/lib/loom/bot-route.mjs');
 const { serveFor } = await import('../src/lib/loom/for-route.mjs');
 const { serveTopic, serveTopicIndex, serveSitemap } = await import('../src/lib/loom/topic-route.mjs');
 const env={db:database(),kv:archive()}, read=atomicReader(env);
 await post(env,note('Fresh durable phrase: left off', '@desk'));
 await post(env,{to:'@desk',from:{name:'Alice',kind:'human'},kind:'question',body:'Fresh durable phrase: can you help?'});
 for(let i=0;i<3;i++) assert.equal((await post(env,{...note('Fresh durable phrase '+i+' @desk'),from:{name:'Alice',kind:'human'}})).status,201);
 for(const [serve,path,args,needle] of [
  [serveBot,'/loom/bot/desk',['desk'],'Fresh durable phrase'],
  [serveFor,'/loom/for/desk',['desk'],'Fresh durable phrase'],
  [serveTopic,'/loom/topic/race',['race'],'Fresh durable phrase'],
  [serveTopicIndex,'/loom/topic/',[],'race'],
  [serveSitemap,'/loom/sitemap.xml',[],'race'],
 ]) {
  const response=await serve(new Request('https://pointcast.xyz'+path),read,...args);
  assert.equal(response.status,200,path);assert.ok((await response.text()).includes(needle),path);
 }
 assert.equal(env.kv.writes,0);
});

test('seed import, same-name welcome and contention exhaustion remain explicit', async () => {
 const env={db:database(),kv:archive()};
 const before=await get(env,'#loom');
 const made=await post(env,note('seed survives','#loom'));assert.equal(made.status,201);
 const after=await get(env,'#loom');assert.equal(after.count,before.count+1);
 const r=await handleAtomicLoom(req(note('not attempted')),{...env,attempts:0});assert.equal(r.status,503);
 assert.equal((await r.json()).error,'loom_write_contention');
 const run=()=>handleAtomicLoom(req({to:'#welcome',from:{name:'Same Person',kind:'human'},body:'hello'}),env);
 assert.deepEqual((await Promise.all([run(),run()])).map(r=>r.status),[201,201]);
 assert.equal((await get(env,'#welcome')).ops.filter(o=>o.auto==='first-hello').length,1);
});
