import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleAtomicLoom, atomicReader } from '../src/lib/loom/atomic.mjs';
import { BODY_MAX, MAX_OPS, handleLoom } from '../src/lib/loom/service.mjs';

const migration = readFileSync(new URL('../migrations/auth/0037_loom_atomic.sql', import.meta.url), 'utf8');
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

test('an oversized append is rejected before any storage mutation', async () => {
 const db = database(), kv = archive();
 const result = await post({ db, kv }, note('x'.repeat(BODY_MAX + 1)));
 assert.equal(result.status, 400);
 assert.equal((await result.json()).error, 'body_too_long');
 assert.equal(db.batches, 0);
 assert.equal(db.sqlite.prepare('SELECT revision FROM loom_atomic_state').get().revision, 0);
 assert.equal(kv.writes, 0);
});

test('missing schema or archive and read errors fail closed without KV writes', async () => {
 const kv=archive();
 assert.equal((await post({db:database({migrated:false}),kv},note('no'))).status,503);
 assert.equal((await post({kv},note('no'))).status,503);
 const db=database();db.failRead=true;
 assert.equal((await post({db},note('missing archive'))).status,503);
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

test('commit succeeds but transport fails: return unknown outcome without duplicating the write', async () => {
 const db=database(), kv=archive(), env={db,kv};
 const batch=db.batch.bind(db);
 db.batch=async statements=>{ await batch(statements); throw new Error('connection lost after commit'); };
 const result=await post(env,note('durable but receipt lost @shared'));
 assert.equal(result.status,503);
 assert.equal((await result.json()).error,'loom_storage_unavailable');
 assert.equal(result.headers.get('Retry-After'), null);
 assert.equal(db.batches,1,'unknown outcome must not replay an already committed append');
 assert.equal((await get(env,'#race')).count,1);
 assert.equal((await get(env,'@shared')).count,1);
 const sent=await (await handleAtomicLoom(new Request('https://pointcast.xyz/api/loom?from=%40desk'),env)).json();
 assert.equal(sent.sent.length,1);
 assert.equal(db.sqlite.prepare('SELECT revision FROM loom_atomic_state').get().revision,1);
 assert.equal(kv.writes,0);
});

test('real revision conflicts exhaust retry budget without writing partial state', async () => {
 const db=database(),kv=archive(),env={db,kv};
 const batch=db.batch.bind(db);
 db.batch=async statements=>{
  // A competing writer moves the revision after each read, before our batch.
  db.sqlite.exec('UPDATE loom_atomic_state SET revision = revision + 1');
  return batch(statements);
 };
 let limits=0;
 const result=await handleAtomicLoom(req(note('must not commit @shared')),{
  ...env,attempts:3,firstHelloEnabled:false,limit:async()=>{limits++;return true;}
 });
 assert.equal(result.status,503);
 assert.equal((await result.json()).error,'loom_write_contention');
 assert.equal(db.batches,3);
 assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM loom_atomic_values').get().n,0);
 assert.equal(db.sqlite.prepare('SELECT revision FROM loom_atomic_state').get().revision,3);
 assert.ok(limits>0 && limits<3,'rate limit callbacks must be memoized across attempts');
 assert.equal(kv.writes,0);
});

const archiveRoom = '#archive-contract';

async function roomAtRetentionLimit(t) {
  const env = { db: database(), kv: archive() };
  t.after(() => env.db.sqlite.close());
  const created = await post(env, note('fixture marker', archiveRoom));
  assert.equal(created.status, 201);
  const receipt = await created.json();
  const room = await get(env, archiveRoom);

  // Start with one full synthetic room in the test database. All subsequent
  // operations go through the atomic handler and its real SQLite transaction.
  const key = `loom:log:${room.log.key}`;
  const stored = JSON.parse(env.db.sqlite.prepare(
    'SELECT value FROM loom_atomic_values WHERE key = ?'
  ).get(key).value);
  const first = stored.ops[0];
  for (let seq = first.seq + 1; seq <= MAX_OPS; seq++) {
    stored.ops.push({
      op: 'append', id: `m_fixture_${seq}`, seq, at: first.at,
      from: first.from, kind: 'note', body: `public fixture ${seq}`,
    });
  }
  stored.seq = MAX_OPS;
  env.db.sqlite.prepare('UPDATE loom_atomic_values SET value = ? WHERE key = ?')
    .run(JSON.stringify(stored), key);
  return { env, receipt };
}

async function advanceArchive(env) {
  const response = await post(env, note('retained public fixture', archiveRoom));
  assert.equal(response.status, 201);
}

function archiveRead(env, before) {
  const url = new URL('https://loom.invalid/api/loom');
  url.searchParams.set('to', archiveRoom);
  url.searchParams.set('before', String(before));
  return handleAtomicLoom(new Request(url), env);
}

async function readArchiveMessages(env, before) {
  const response = await archiveRead(env, before);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(Array.isArray(body.archive?.messages), 'expected an archive page');
  return body.archive.messages;
}

test('atomic archive and withdrawal preserve committed history', async (t) => {
  await t.test('a withdrawal overlaps archiving of older public notes', async (t) => {
    const { env } = await roomAtRetentionLimit(t);
    const recent = await post(env, note('another public fixture', archiveRoom));
    assert.equal(recent.status, 201);
    const receipt = await recent.json();

    const [withdrawal, append] = await Promise.all([
      post(env, { action: 'withdraw', to: receipt.address, token: receipt.editToken }),
      post(env, note('public receipt marker', archiveRoom)),
    ]);
    assert.equal(withdrawal.status, 200);
    assert.equal(append.status, 201);
    const accepted = await append.json();
    const live = await get(env, archiveRoom);
    assert.ok(live.messages.some(m => m.id === accepted.message.id));
    assert.ok(!live.messages.some(m => m.id === receipt.message.id));
    const archived = await readArchiveMessages(env, live.log.trimmedBefore);
    assert.deepEqual(archived.map(m => m.seq), [1, 2, 3]);
  });


  for (const order of ['withdraw first', 'trim first']) {
    await t.test(order, async (t) => {
      const { env, receipt } = await roomAtRetentionLimit(t);
      if (order === 'trim first') await advanceArchive(env);
      const withdrawn = await post(env, {
        action: 'withdraw', to: receipt.address, token: receipt.editToken,
      });
      assert.equal(withdrawn.status, 200);
      await advanceArchive(env);
      await advanceArchive(env);

      const live = await get(env, archiveRoom);
      assert.ok(live.log.trimmedBefore > 2, 'withdrew across a real retention boundary');
      const messages = await readArchiveMessages(env, live.log.trimmedBefore);
      assert.ok(messages.some(m => m.id === 'm_fixture_2'), 'neighbor remains readable');
      assert.ok(!messages.some(m => m.id === receipt.message.id), 'withdrawal survives archiving');
      assert.ok(!live.messages.some(m => m.id === receipt.message.id));
    });
  }
});

test('a missing expected archive row stops paging until the same cursor can be retried', async (t) => {
  const { env } = await roomAtRetentionLimit(t);
  await advanceArchive(env);
  await advanceArchive(env);
  await advanceArchive(env);
  const room = await get(env, archiveRoom);
  const before = room.log.trimmedBefore;
  const healthy = await readArchiveMessages(env, before);
  assert.deepEqual(healthy.map(m => m.seq), [1, 2, 3]);

  // A previously readable append is known to exist. Unlike an edit-only
  // sequence or a tombstone, its disappearance makes the page incomplete.
  const key = `loom:arch:${room.log.key}:2`;
  const removed = env.db.sqlite.prepare(
    'DELETE FROM loom_atomic_values WHERE key = ? RETURNING value'
  ).get(key);
  assert.ok(removed, 'fixture removed an actual archived record');
  const unavailable = await archiveRead(env, before);
  const body = await unavailable.json();

  env.db.sqlite.prepare('INSERT INTO loom_atomic_values(key, value) VALUES (?, ?)')
    .run(key, removed.value);
  assert.deepEqual(await readArchiveMessages(env, before), healthy);
  assert.equal(unavailable.status, 503);
  assert.equal(body.archive, undefined, 'no partial page or continuation');
  assert.equal(body.nextBefore, undefined);
});
