import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test, { after } from 'node:test';
import { createServer } from 'vite';
import { encodeBase64Json, X402_DEFAULT_ASSET, X402_DEFAULT_PAY_TO, X402_PROXY } from '../src/lib/x402.ts';
import { decodeBase64Json } from '../src/lib/x402.ts';
import { benchDayKey } from '../src/lib/bench-questions.ts';

const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
after(() => server.close());
const { handleAiPurchases } = await server.ssrLoadModule('/functions/api/me/ai-purchases.ts');
const { observePurchaseTransfer } = await server.ssrLoadModule('/functions/_lib/x402-chain-proof.ts');
const PAYER = '0x1111111111111111111111111111111111111111';
const TX = '0x' + 'ab'.repeat(32), BLOCK = '0x' + 'cd'.repeat(32);
const topic = address => '0x' + address.slice(2).toLowerCase().padStart(64, '0');
function chainReceipt() { return { status:'0x1',transactionHash:TX,blockHash:BLOCK,blockNumber:'0x1234',logs:[{
  transactionHash:TX,blockHash:BLOCK,address:X402_DEFAULT_ASSET,
  topics:['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',topic(PAYER),topic(X402_DEFAULT_PAY_TO)],
  data:'0x'+(10000n).toString(16).padStart(64,'0'),removed:false,
}] }; }
function fixture(t) {
  const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys=ON');
  for (const migration of ['0001_init','0007_post_office_aliases','0008_paid_town_splits','0012_paid_action_intents','0014_agent_contract','0017_ai_runtimes','0018_ai_purchases']) {
    db.exec(readFileSync(new URL(`../migrations/auth/${migration}.sql`,import.meta.url),'utf8'));
  }
  const now=Date.now();
  for (const owner of ['alice','bob']) {
    db.prepare('INSERT INTO users VALUES (?,?,?)').run(owner,JSON.stringify({userId:owner,identities:[]}),new Date(now).toISOString());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('session-'+owner,owner,now+600_000);
  }
  const providers=JSON.stringify([{provider:'claude',available:true,authenticated:true,authMode:'subscription',models:[{id:'claude-fable-5-1',label:'Fable'}],modelDiscovery:'configured'}]);
  db.prepare(`INSERT INTO ai_runtimes (id,user_id,label,token_hash,token_expires_at,providers_json,created_at,last_seen_at,last_success_at)
    VALUES ('native','alice','My computer','hash',?,?,?,?,?)`).run(now+600_000,providers,now,now,now);
  db.prepare(`INSERT INTO ai_runtime_jobs (id,runtime_id,user_id,kind,request_id,request_hash,provider,status,result_json,created_at,expires_at,finished_at)
    VALUES ('job','native','alice','prompt','job-request','hash','claude','succeeded',?,?,?,?)`)
    .run(JSON.stringify({text:'A thought.',actualModels:['claude-fable-5-1']}),now,now+600_000,now);
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  const kv=new Map();
  const env={AI_PURCHASES_ENABLED:'true',X402_MODE:'test',X402_RECEIPT_SK:privateKey.export({type:'pkcs8',format:'der'}).toString('base64'),
    AUTH_DB:{prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)??null;},
      async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){const r=db.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}};}};}},
    VISITS:{async get(key,type){const value=kv.get(key)??null;return type==='json'&&value!==null?JSON.parse(value):value;},async put(key,value){kv.set(key,value);}},
  };
  const options={expectedPublicKey:publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64')};
  const calls=[]; let settle=async()=>Response.json({success:true,transaction:TX,network:'eip155:42793',payer:PAYER});
  let receipt=()=>chainReceipt();
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async (input,init)=>{
    const url=String(input);calls.push(url);
    if(url==='https://exp-faci.bubbletez.com/settle') { assert.equal(init.redirect,'error');assert.ok(init.signal);return settle(init); }
    assert.equal(url,'https://node.mainnet.etherlink.com','no arbitrary outbound endpoints');
    const body=JSON.parse(init.body); assert.ok(['eth_chainId','eth_getTransactionReceipt'].includes(body.method));
    return Response.json({jsonrpc:'2.0',id:1,result:body.method==='eth_chainId'?'0xa729':receipt()});
  };
  t.after(()=>{globalThis.fetch=oldFetch;db.close();});
  return {env,db,kv,options,calls,setSettlement(fn){settle=fn;},setReceipt(fn){receipt=fn;},
    settlements(){return calls.filter(url=>url.endsWith('/settle')).length;}};
}
function request(body,user='alice',origin='https://pointcast.xyz') {return new Request('https://pointcast.xyz/api/me/ai-purchases',{
  method:body?'POST':'GET',headers:{cookie:'pc_session=session-'+user,origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),
});}
async function call(f,body,user,origin){return handleAiPurchases(request(body,user,origin),f.env,f.options);}
async function data(f,body,user){const response=await call(f,body,user);const json=await response.json();assert.ok(response.ok,JSON.stringify(json));return json;}
async function quote(f,overrides={}) {return (await data(f,{operation:'quote',requestId:crypto.randomUUID(),runtimeId:'native',question:'What should we make next?',...overrides})).purchase;}
function signature(p,nonce='1') {
  const now=Math.floor(Date.now()/1000);
  return encodeBase64Json({x402Version:2,scheme:'exact',network:p.network,accepted:p.quote.accepts[0],resource:p.quote.resource,
    payload:{signature:'0x'+'11'.repeat(65),permit2Authorization:{from:PAYER,permitted:{token:p.asset,amount:p.amount},spender:X402_PROXY,
      nonce,deadline:String(Math.min(now+30,Math.floor(p.expiresAt/1000))),witness:{to:p.payTo,validAfter:String(now),extra:'0x'}}}});
}
function submit(p,extra={}) {return {operation:'submit',purchaseId:p.id,quoteHash:p.quoteHash,paymentSignature:signature(p),confirmPublic:true,...extra};}

test('owner isolation, disabled pilot, missing successful task and offline subscription fail closed',async t=>{
  const f=fixture(t);
  assert.equal((await call(f,undefined,'outsider')).status,401);
  assert.equal((await call(f,{operation:'quote'},'alice','https://evil.test')).status,403);
  f.env.AI_PURCHASES_ENABLED='false'; assert.equal((await data(f)).available,false);
  assert.equal((await call(f,{operation:'quote'})).status,503);f.env.AI_PURCHASES_ENABLED='true';
  f.db.prepare("UPDATE ai_runtime_jobs SET status='failed'").run();
  assert.deepEqual((await data(f)).runtimes,[]);
  assert.equal((await call(f,{operation:'quote',requestId:crypto.randomUUID(),runtimeId:'native',question:'Hi'})).status,409);
  f.db.prepare("UPDATE ai_runtime_jobs SET status='succeeded'").run();
  f.db.prepare('UPDATE ai_runtimes SET last_seen_at=0').run();assert.deepEqual((await data(f)).runtimes,[]);
  assert.equal(f.calls.length,0);
});
test('quote shows canonical public text, exact price and no secret; replay is unique and cancellable',async t=>{
  const f=fixture(t),id=crypto.randomUUID();
  const first=await quote(f,{requestId:id,question:'  <Hi>\r\n\r\n\r\nthere  '});
  assert.equal(first.question,'Hi\n\nthere');assert.equal(first.amount,'10000');
  const again=await quote(f,{requestId:id,question:'Hi\n\nthere'});assert.equal(again.id,first.id);
  const row=f.db.prepare('SELECT * FROM ai_purchases').get();assert.ok(row.action_key);assert.ok(!JSON.stringify(await data(f)).includes(row.action_key));
  assert.equal(f.calls.length,0);
  assert.equal((await call(f,{operation:'quote',requestId:crypto.randomUUID(),runtimeId:'native',question:'Another'})).status,409);
  assert.equal((await call(f,{operation:'reconcile',purchaseId:first.id},'bob')).status,404);
  assert.deepEqual((await data(f,undefined,'bob')).purchases,[]);
  assert.equal((await data(f,{operation:'cancel',purchaseId:first.id})).purchase.status,'expired');
  assert.notEqual((await quote(f)).id,first.id);
});
test('complete local seller flow returns signed receipt, exact stored result, independent transfer proof; repeat never pays again',async t=>{
  const f=fixture(t),p=await quote(f);
  const result=(await data(f,submit(p))).purchase;
  assert.equal(result.status,'delivered',JSON.stringify(result));
  assert.equal(result.receiptVerified,true);assert.equal(result.chainVerified,true);assert.equal(result.deliveryVerified,true);
  assert.equal(result.result.sit.answer,p.question);assert.equal(result.transactionHash,TX);
  assert.equal(f.settlements(),1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM splits').get().n,1);
  const persisted=JSON.stringify(f.db.prepare('SELECT * FROM ai_purchases').get());
  assert.ok(!persisted.includes(signature(p)));assert.ok(!persisted.includes('11'.repeat(65)));
  f.db.prepare("DELETE FROM ai_runtimes WHERE id='native'").run();f.env.AI_PURCHASES_ENABLED='false';
  assert.equal((await data(f,submit(p))).purchase.id,p.id);
  assert.equal((await data(f,{operation:'reconcile',purchaseId:p.id})).purchase.status,'delivered');
  assert.equal((await data(f)).purchases[0].receiptVerified,true);assert.equal(f.settlements(),1);
});
test('public consent, changed terms, expired review and disconnected runtime prevent settlement',async t=>{
  const f=fixture(t),p=await quote(f);
  assert.equal((await call(f,submit(p,{confirmPublic:false}))).status,400);
  assert.equal((await call(f,submit(p,{quoteHash:'different'}))).status,409);
  f.env.X402_PAY_TO=PAYER;assert.equal((await call(f,submit(p))).status,503);delete f.env.X402_PAY_TO;
  f.db.prepare('UPDATE ai_runtimes SET last_seen_at=0').run();assert.equal((await call(f,submit(p))).status,409);
  f.db.prepare('UPDATE ai_runtimes SET last_seen_at=?').run(Date.now());
  f.db.prepare('UPDATE ai_purchases SET expires_at=0').run();assert.equal((await call(f,submit(p))).status,409);
  assert.equal(f.settlements(),0);
});
test('concurrent submit, lost response and read-only checks submit the facilitator at most once',async t=>{
  const f=fixture(t),p=await quote(f);let release;let reached;
  const entered=new Promise(resolve=>{reached=resolve;});
  f.setSettlement(async()=>{reached();await new Promise(resolve=>{release=resolve;});return Response.json({success:true,transaction:TX});});
  const first=call(f,submit(p));await entered;
  const second=await call(f,submit(p));assert.ok([200,409].includes(second.status));
  const pending=(await data(f,{operation:'reconcile',purchaseId:p.id})).purchase;
  assert.equal(pending.status,'unresolved');assert.equal(f.settlements(),1);
  release();await first; // Pretend the browser never received the response.
  const recovered=(await data(f,{operation:'reconcile',purchaseId:p.id})).purchase;
  assert.equal(recovered.status,'delivered',JSON.stringify(recovered));assert.equal(f.settlements(),1);
});
test('ambiguous facilitator outcome holds original purchase and blocks a second authorization',async t=>{
  const f=fixture(t),p=await quote(f);f.setSettlement(async()=>{throw new Error('network lost');});
  const result=(await data(f,submit(p))).purchase;assert.equal(result.status,'unresolved');
  assert.equal((await data(f,{operation:'reconcile',purchaseId:p.id})).purchase.status,'unresolved');
  assert.equal((await data(f,submit(p))).purchase.status,'unresolved');
  assert.equal((await call(f,{operation:'quote',requestId:crypto.randomUUID(),runtimeId:'native',question:'Second'})).status,409);
  assert.equal(f.settlements(),1);
});
test('a bounded facilitator timeout stays ambiguous and never automatically retries',async t=>{
  const f=fixture(t),p=await quote(f);
  t.mock.method(AbortSignal,'timeout',ms=>{assert.equal(ms,15_000);return AbortSignal.abort(new DOMException('fixture timeout','TimeoutError'));});
  f.setSettlement(async init=>{init.signal.throwIfAborted();throw new Error('unreachable');});
  assert.equal((await data(f,submit(p))).purchase.status,'unresolved');
  await data(f,{operation:'reconcile',purchaseId:p.id});assert.equal(f.settlements(),1);
});
test('known invalid signature rejection does not claim settlement or delivery',async t=>{
  const f=fixture(t),p=await quote(f);
  f.setSettlement(async()=>Response.json({success:false,errorReason:'invalid_signature',transaction:'',network:p.network}));
  const result=(await data(f,submit(p))).purchase;
  assert.equal(result.status,'failed');assert.equal(result.receiptVerified,false);assert.equal(result.chainVerified,false);assert.equal(result.deliveryVerified,false);
  await data(f,submit(p));assert.equal(f.settlements(),1);
});
test('full Bench and short authorization window stop before a payment reservation or facilitator call',async t=>{
  const f=fixture(t),p=await quote(f);
  const payload=decodeBase64Json(signature(p));payload.payload.permit2Authorization.deadline=String(Math.floor(Date.now()/1000)+10);
  assert.equal((await call(f,submit(p,{paymentSignature:encodeBase64Json(payload)}))).status,409);
  assert.equal(f.db.prepare('SELECT payment_hash FROM ai_purchases').get().payment_hash,null);
  f.kv.set('bench:index:'+benchDayKey(Date.now()),JSON.stringify(Array.from({length:200},(_,i)=>'existing-'+i)));
  assert.equal((await call(f,submit(p))).status,409);
  assert.equal(f.db.prepare('SELECT payment_hash FROM ai_purchases').get().payment_hash,null);
  await data(f,{operation:'cancel',purchaseId:p.id});
  const response=await call(f,{operation:'quote',requestId:crypto.randomUUID(),runtimeId:'native',question:'One more'});
  assert.equal(response.status,409);assert.equal((await response.json()).reason,'bench-full-before-payment');assert.equal(f.settlements(),0);
});
test('a replayed facilitator transaction cannot prove two different purchases',async t=>{
  const f=fixture(t),first=await quote(f);await data(f,submit(first));
  const second=await quote(f,{question:'A distinct question'});
  const result=(await data(f,submit(second,{paymentSignature:signature(second,'2')}))).purchase;
  assert.equal(result.status,'unresolved');assert.equal(result.deliveryVerified,false);assert.equal(result.receiptVerified,false);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM paid_action_intents WHERE tx_hash=?").get(TX).n,1);
  assert.equal(f.db.prepare("SELECT COUNT(*) n FROM ai_purchases WHERE transaction_hash=?").get(TX).n,1);
});
test('chain check failure preserves public delivery and receipt without false settlement proof or another payment',async t=>{
  const f=fixture(t),p=await quote(f);f.setReceipt(()=>null);
  const result=(await data(f,submit(p))).purchase;assert.equal(result.status,'delivered');assert.equal(result.receiptVerified,true);
  assert.equal(result.chainVerified,false);assert.match(result.error,/chain.*pending/);
  f.setReceipt(()=>chainReceipt());assert.equal((await data(f,{operation:'reconcile',purchaseId:p.id})).purchase.chainVerified,true);
  assert.equal(f.settlements(),1);
});
test('lost Bench index write does not masquerade as delivery; read-only recovery verifies a later repaired index',async t=>{
  const f=fixture(t),p=await quote(f);const put=f.env.VISITS.put;
  f.env.VISITS.put=async(key,value)=>{if(key.startsWith('bench:index:'))throw new Error('index down');return put(key,value);};
  const result=(await data(f,submit(p))).purchase;
  assert.equal(result.status,'unresolved');assert.equal(result.receiptVerified,true);assert.equal(result.deliveryVerified,false);
  const sit=JSON.parse([...f.kv.entries()].find(([key])=>key.startsWith('bench:sit:'))[1]);
  f.kv.set('bench:index:'+sit.day,JSON.stringify([sit.id]));
  assert.equal((await data(f,{operation:'reconcile',purchaseId:p.id})).purchase.status,'delivered');assert.equal(f.settlements(),1);
});
test('paid action failure holds purchase, receipt tampering and changed public text invalidate completion',async t=>{
  const f=fixture(t),p=await quote(f);await data(f,submit(p));
  const intent=f.db.prepare('SELECT * FROM paid_action_intents').get(),settlement=JSON.parse(intent.settlement_json);
  settlement.receipt.action_result.bench.sit.answer='A different question';
  f.db.prepare('UPDATE paid_action_intents SET settlement_json=? WHERE id=?').run(JSON.stringify(settlement),intent.id);
  const tampered=(await data(f,{operation:'reconcile',purchaseId:p.id})).purchase;
  assert.equal(tampered.status,'unresolved');assert.equal(tampered.receiptVerified,false);assert.equal(tampered.deliveryVerified,false);
  f.db.prepare("UPDATE paid_action_intents SET status='action_failed'").run();
  assert.equal((await data(f,{operation:'reconcile',purchaseId:p.id})).purchase.status,'unresolved');assert.equal(f.settlements(),1);
});
test('chain proof rejects wrong network, failed/reorged/wrong-asset/wrong-amount/wrong-payee receipts',async()=>{
  const cases=[r=>({...r,status:'0x0'}),r=>({...r,transactionHash:BLOCK}),r=>({...r,logs:[]}),r=>({...r,logs:[{...r.logs[0],removed:true}]}),
    r=>({...r,logs:[{...r.logs[0],address:PAYER}]}),r=>({...r,logs:[{...r.logs[0],data:'0x'+'0'.repeat(64)}]}),
    r=>({...r,logs:[{...r.logs[0],topics:[...r.logs[0].topics.slice(0,2),topic(PAYER)]}]})];
  for(const transform of cases){assert.equal(await observePurchaseTransfer(TX,PAYER,async(_,init)=>Response.json({jsonrpc:'2.0',id:1,
    result:JSON.parse(init.body).method==='eth_chainId'?'0xa729':transform(chainReceipt())})),false);}
  assert.equal(await observePurchaseTransfer(TX,PAYER,async(_,init)=>Response.json({jsonrpc:'2.0',id:1,result:JSON.parse(init.body).method==='eth_chainId'?'0x1':chainReceipt()})),false);
});
