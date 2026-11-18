import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { handleAtomicLoom } from '../../src/lib/loom/atomic.mjs';

test('local workerd D1 preserves concurrent accepted posts and rejects absent schema', async () => {
  const mf = new Miniflare({ modules:true, script:'export default { fetch(){return new Response("local only")} }', compatibilityDate:'2026-07-22', d1Databases:['DB'] });
  try {
    const db=await mf.getD1Database('DB');
    const post=body=>new Request('https://pointcast.test/api/loom',{method:'POST',body:JSON.stringify({to:'#local-race',from:{name:'Fixture',kind:'agent',address:'@fixture'},body})});
    const archive={get:async()=>null,put:async()=>assert.fail('legacy writes forbidden')};
    assert.equal((await handleAtomicLoom(post('before schema'),{db,kv:archive})).status,503);
    const sql=readFileSync(new URL('../../migrations/auth/0037_loom_atomic.sql',import.meta.url),'utf8').replace(/--[^\n]*/g,'');
    for(const statement of sql.split(';').filter(s=>s.trim()))await db.prepare(statement).run();
    const responses=await Promise.all(Array.from({length:4},(_,i)=>handleAtomicLoom(post('concurrent '+i+' @shared'),{db,kv:archive})));
    assert.deepEqual(responses.map(r=>r.status),[201,201,201,201]);
    const receipts=await Promise.all(responses.map(r=>r.json()));
    const result=await (await handleAtomicLoom(new Request('https://pointcast.test/api/loom?to=%23local-race'),{db,kv:archive})).json();
    for(const receipt of receipts)assert.ok(result.messages.some(m=>m.id===receipt.message.id),'each accepted receipt persists');
    assert.equal(new Set(receipts.map(r=>r.message.seq)).size,4);
    const read=async query=>(await handleAtomicLoom(new Request('https://pointcast.test/api/loom'+query),{db,kv:archive})).json();
    assert.equal((await read('?to=%40shared')).count,4);
    assert.equal((await read('?from=%40fixture')).sent.length,4);
    const before=(await db.prepare('SELECT revision FROM loom_atomic_state').first()).revision;
    await assert.rejects(db.batch([
      db.prepare('UPDATE loom_atomic_state SET revision=-1 WHERE singleton=1'),
      db.prepare("INSERT INTO loom_atomic_values VALUES ('must-not-exist','x')")
    ]),/loom_revision_matches/);
    assert.equal(await db.prepare("SELECT value FROM loom_atomic_values WHERE key='must-not-exist'").first(),null);
    assert.equal((await db.prepare('SELECT revision FROM loom_atomic_state').first()).revision,before);
  } finally { await mf.dispose(); }
});
