import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { generateKeyPairSync } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { encodeBase64Json, decodeBase64Json, X402_TREASURY_AGENT_ID } from '../src/lib/x402.ts';

class DB {
  constructor(sql) { this.db = new DatabaseSync(':memory:'); this.db.exec(sql); this.failArtifact = false; }
  prepare(sql) {
    const db = this;
    const make = args => ({ bind: (...values) => make(values),
      first: async () => db.db.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: db.db.prepare(sql).all(...args) }),
      run: async () => {
        if (sql.includes('UPDATE nouns_battler_records SET') && args[0] === 'succeeded' && db.beforeArtifact) await db.beforeArtifact();
        if (db.failArtifact && sql.includes('UPDATE nouns_battler_records SET') && args[0] === 'succeeded') { db.failArtifact = false; throw new Error('injected storage failure'); }
        return { meta: { changes: Number(db.db.prepare(sql).run(...args).changes) } };
      },
    });
    return make([]);
  }
}
class KV { values = new Map(); async get(k, type) { const v = this.values.get(k) ?? null; return type === 'json' && v ? JSON.parse(v) : v; } async put(k,v) { if(this.values.has(k)) throw new Error('KV same-key write rate exceeded'); this.values.set(k,v); } }
const req = (body, payment, key='battler-test-0001') => new Request('https://pointcast.xyz/api/agent/battler', { method:'POST', headers:{'Content-Type':'application/json', ...(payment ? {'Payment-Signature':payment,'Idempotency-Key':key} : {})},body:JSON.stringify(body)});
function pay(terms, nonce='17') {
  const now=Math.floor(Date.now()/1000);
  return encodeBase64Json({x402Version:2,scheme:'exact',network:terms.network,accepted:terms,payload:{signature:'0x'+'11'.repeat(65),permit2Authorization:{from:'0x'+'12'.repeat(20),permitted:{token:terms.asset,amount:terms.amount},spender:'0xB6FD384A0626BfeF85f3dBaf5223Dd964684B09E',nonce,deadline:String(now+30),witness:{to:terms.payTo,validAfter:String(now),extra:'0x'}}}});
}

test('agent arena validates, quotes without charging, settles once, recovers and holds ambiguous payments', async t => {
  const server=await createServer({configFile:false,appType:'custom',logLevel:'error',resolve:{preserveSymlinks:true},cacheDir:'.astro/api-test-cache'});
  t.after(()=>server.close());
  const arena=await server.ssrLoadModule('/functions/_lib/nouns-battler-arena.ts');
  const paid=await server.ssrLoadModule('/functions/api/agent/battler.ts');
  const mcp=await server.ssrLoadModule('/functions/api/mcp.ts');
  const actions=await server.ssrLoadModule('/functions/api/actions/[id].ts');
  const receipts=await server.ssrLoadModule('/functions/api/x402/receipt/[txHash].ts');
  const buyers=await server.ssrLoadModule('/src/lib/x402-buyer.ts');
  const sql=await readFile(new URL('../migrations/auth/0019_nouns_battler_records.sql',import.meta.url),'utf8');
  const db=new DB(sql+`CREATE TABLE splits(receipt_hash TEXT PRIMARY KEY,action TEXT,amount_units INTEGER,house_units INTEGER,network_units INTEGER,maker TEXT,maker_address TEXT,settled_at TEXT); CREATE TABLE paid_action_intents AS SELECT * FROM nouns_battler_records WHERE 0;`);
  t.after(()=>db.db.close());
  const pair=generateKeyPairSync('ed25519');
  const publicKey=pair.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64');
  const env={AUTH_DB:db,VISITS:new KV(),X402_RECEIPT_SK:pair.privateKey.export({type:'pkcs8',format:'der'}).toString('base64'),X402_RECEIPT_AGENT_ID:X402_TREASURY_AGENT_ID,X402_FACILITATOR_URL:'https://fixture.invalid'};
  const options={expectedPublicKey:publicKey};
  const body={match:{seed:0},rulesVersion:arena.rulesVersion,maxSpendUnits:'10000'};
  let calls=0, mode='success', block, unblock;
  const original=globalThis.fetch;
  t.after(()=>{globalThis.fetch=original;});
  globalThis.fetch=async url=>{
    assert.equal(String(url),'https://fixture.invalid/settle');calls++;
    if(mode==='wait') await new Promise(resolve=>{unblock=resolve; block?.();});
    if(mode==='ambiguous') throw new Error('fixture timeout after possible broadcast');
    return new Response(JSON.stringify({success:true,transaction:'0x'+String(calls).padStart(64,'0')}),{headers:{'content-type':'application/json'}});
  };
  await t.test('free seed zero is reproducible and input/CPU are bounded',async()=>{
    const free=()=>arena.runArena(new Request('https://pointcast.xyz/api/nouns-battler/arena',{method:'POST',body:JSON.stringify({seed:0})}));
    const a=await (await free()).json(),b=await (await free()).json();
    assert.equal(a.matchHash,b.matchHash); assert.equal(a.saved,false); assert.equal(a.match.input.seed,0);
    const invalid=await arena.runArena(new Request('https://pointcast.xyz/api/nouns-battler/arena',{method:'POST',body:JSON.stringify({seed:-1})}));assert.equal(invalid.status,400);
    assert.equal(calls,0);
  });
  await t.test('MCP discovers and runs the same free exhibition without network or payment calls',async()=>{
    const rpc=async(method,params)=> (await mcp.onRequestPost({env:{},request:new Request('https://pointcast.xyz/api/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})})).json();
    const listed=await rpc('tools/list');
    for(const name of ['nouns_battler_arena','nouns_battler_play','nouns_battler_record'])assert.ok(listed.result.tools.some(tool=>tool.name===name));
    const played=await rpc('tools/call',{name:'nouns_battler_play',arguments:{seed:0}});
    const result=JSON.parse(played.result.content[0].text);assert.equal(result.match.input.seed,0);assert.equal(result.matchHash,await arena.matchHash(result.match));assert.equal(calls,0);
    const invalid=await rpc('tools/call',{name:'nouns_battler_play',arguments:{seed:-1}});assert.equal(invalid.result.isError,true);
  });
  let terms;
  await t.test('budget and rules fail before settlement; quote costs nothing',async()=>{
    assert.equal((await paid.handleAgentBattler(req({...body,maxSpendUnits:'9999'}),env,options)).status,400);
    assert.equal((await paid.handleAgentBattler(req({...body,rulesVersion:'unknown'}),env,options)).status,400);
    assert.equal((await paid.handleAgentBattler(req(body),{},options)).status,503);
    const quote=await paid.handleAgentBattler(req(body),env,options);assert.equal(quote.status,402);
    const q=decodeBase64Json(quote.headers.get('Payment-Required'));terms=q.accepts[0];
    assert.equal(terms.amount,'10000'); assert.equal(calls,0);
    assert.equal(buyers.validateBuyerQuote(q,{endpoint:'https://pointcast.xyz/api/agent/battler'}).amountUnits,'10000');
  });
  let completed;
  await t.test('one settlement creates a durable, signed and replayable record',async()=>{
    const response=await paid.handleAgentBattler(req(body,pay(terms)),env,options);assert.equal(response.status,200);
    completed=await response.json();assert.equal(calls,1);assert.equal(completed.saved,true);
    assert.equal(completed.matchHash,await arena.matchHash(completed.match));
    const signed=completed.receipt.action_result;assert.equal(signed.matchHash,completed.matchHash);
    const status=await actions.onRequestGet({env,params:{id:completed.actionId}});const value=await status.json();assert.equal(value.status,'succeeded');assert.equal(value.result.matchHash,completed.matchHash);
    const receiptLookup=await receipts.handleReceiptByTransaction(env,completed.receipt.settlement.tx);assert.equal((await receiptLookup.json()).receipt.action_result.matchHash,completed.matchHash);
    env.VISITS.values.delete('x402:receipt:'+completed.receipt.settlement.tx.toLowerCase());
    const withoutKV=await receipts.handleReceiptByTransaction(env,completed.receipt.settlement.tx);assert.equal((await withoutKV.json()).receipt.action_result.matchHash,completed.matchHash);
    const replay=await paid.handleAgentBattler(req(body,pay(terms)),env,options);assert.equal(replay.status,200);assert.equal((await replay.json()).actionId,completed.actionId);assert.equal(calls,1);
    assert.equal((await paid.handleAgentBattler(req({...body,match:{seed:1}},pay(terms)),env,options)).status,409);assert.equal(calls,1);
  });
  await t.test('concurrent same-key requests have one settlement owner',async()=>{
    mode='wait';const started=new Promise(resolve=>{block=resolve;});
    const first=paid.handleAgentBattler(req(body,pay(terms,'18'),'concurrent-001'),env,options);
    await started;
    const malformed=await paid.handleAgentBattler(req(body,'malformed','concurrent-001'),env,options);assert.equal(malformed.status,202);assert.equal(calls,2);
    const second=await paid.handleAgentBattler(req(body,pay(terms,'18'),'concurrent-001'),env,options);assert.equal(second.status,202);assert.equal(calls,2);
    mode='success';unblock();assert.equal((await first).status,200);
  });
  await t.test('artifact failure resumes from stored settlement without paying twice',async()=>{
    db.failArtifact=true;
    const a=await paid.handleAgentBattler(req(body,pay(terms,'19'),'artifact-retry-001'),env,options);assert.equal(a.status,503);assert.equal(calls,3);
    const failed=await a.json();
    const state=await (await actions.onRequestGet({env,params:{id:failed.actionId}})).json();assert.equal(state.status,'action_failed');assert.equal(state.result,undefined);
    const proof=await (await receipts.handleReceiptByTransaction(env,state.transactionHash)).json();assert.deepEqual(proof.receipt.action_result,{status:'pending'});
    const b=await paid.handleAgentBattler(req(body,pay(terms,'19'),'artifact-retry-001'),env,options);assert.equal(b.status,200);assert.equal(calls,3);
  });
  await t.test('concurrent recovery has one artifact owner and a stale failed worker cannot overwrite completion',async()=>{
    const key='recovery-lease-001';db.failArtifact=true;
    assert.equal((await paid.handleAgentBattler(req(body,pay(terms,'21'),key),env,options)).status,503);assert.equal(calls,4);
    let entered,release;
    const waiting=new Promise(resolve=>{entered=resolve;});
    db.beforeArtifact=async()=>{db.beforeArtifact=null;entered();await new Promise(resolve=>{release=resolve;});throw new Error('late worker storage failure');};
    const first=paid.handleAgentBattler(req(body,pay(terms,'21'),key),env,options);
    await waiting;
    assert.equal((await paid.handleAgentBattler(req(body,pay(terms,'21'),key),env,options)).status,202);
    // Advance this worker's lease past its expiry without delaying the test.
    db.db.prepare("UPDATE nouns_battler_records SET updated_at='2000-01-01T00:00:00.000Z' WHERE idempotency_key=?").run(key);
    const recovered=await paid.handleAgentBattler(req(body,pay(terms,'21'),key),env,options);assert.equal(recovered.status,200);
    const record=await recovered.json();release();assert.equal((await first).status,200);
    const state=await (await actions.onRequestGet({env,params:{id:record.actionId}})).json();assert.equal(state.status,'succeeded');assert.equal(state.result.matchHash,record.matchHash);assert.equal(calls,4);
  });
  await t.test('unknown broadcast outcome stays held on retry' ,async()=>{
    mode='ambiguous';const a=await paid.handleAgentBattler(req(body,pay(terms,'20'),'unknown-001'),env,options);assert.equal(a.status,502);assert.equal(calls,5);
    const b=await paid.handleAgentBattler(req(body,pay(terms,'20'),'unknown-001'),env,options);assert.equal(b.status,202);assert.equal(calls,5);
  });
});
