import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';
import utils from '@taquito/utils';
import signerModule from '@taquito/signer';
const { b58Encode, PrefixV2, encodeOpHash, stringToBytes } = utils;
const { InMemorySigner } = signerModule;
let server, api, shared, chainModule;
before(async () => {
  server = await createServer({configFile:false, appType:'custom',logLevel:'error'});
  api = await server.ssrLoadModule('/functions/api/other-worlds/_handlers.ts');
  shared = await server.ssrLoadModule('/functions/api/other-worlds/_shared.ts');
  chainModule = await server.ssrLoadModule('/functions/api/other-worlds/_chain.ts');
});
after(async () => { await server?.close(); });
class SqliteD1 {
  constructor(sql) { this.db = new DatabaseSync(':memory:'); this.db.exec(sql); }
  prepare(sql) {
    let args=[]; const owner=this;
    const execute = mode => {
      if (owner.failOn?.(sql)) throw new Error('database-unavailable');
      const stmt=owner.db.prepare(sql);
      if(mode==='first') return stmt.get(...args) ?? null;
      if(mode==='all') return {results:stmt.all(...args)};
      return {meta:{changes:Number(stmt.run(...args).changes)}};
    };
    const out={bind(...values){args=values;return out;},async first(){return execute('first');},async all(){return execute('all');},async run(){return execute('run');},execute};return out;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try { const result=statements.map(statement=>statement.execute('run'));this.db.exec('COMMIT');return result; }
    catch(error){this.db.exec('ROLLBACK');throw error;}
  }
}
const ORIGIN='https://pointcast.xyz';
const post=(path,value,origin=ORIGIN)=>new Request(`${ORIGIN}/api/other-worlds/${path}`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(value)});
const rows=db=>db.db.prepare('SELECT * FROM other_worlds_claims ORDER BY created_at,id').all();
const locks=db=>db.db.prepare('SELECT * FROM other_worlds_sponsor_locks').all();
async function key(seed) { const signer=await InMemorySigner.fromSecretKey(b58Encode(new Uint8Array(32).fill(seed),PrefixV2.Ed25519Seed));return {signer,address:await signer.publicKeyHash(),publicKey:await signer.publicKey()}; }
function fakeChain() {
  const adapter={prepares:[],broadcasts:[],readies:[],statuses:new Map(),cost:1200,autoConfirm:false,
    async ready(counts){this.readies.push(counts);if(this.readyError)throw this.readyError;},
    async prepare(row,budget){this.prepares.push({row,budget});if(this.prepareError)throw this.prepareError;if(this.preparePause)await this.preparePause;const bytes=String(this.prepares.length).padStart(2,'0').repeat(150);return {bytes,hash:encodeOpHash(bytes),maximumCostMutez:this.cost};},
    async broadcast(bytes){this.broadcasts.push(bytes);if(this.broadcastError)throw this.broadcastError;const hash=encodeOpHash(bytes);if(this.autoConfirm)this.statuses.set(hash,'confirmed');return hash;},
    async status(row){if(this.probeError)throw this.probeError;return this.statuses.get(row.operation_hash)||'pending';},
  };return adapter;
}
async function setup() {
  const db=new SqliteD1(await readFile(new URL('../migrations/auth/0020_other_worlds.sql',import.meta.url),'utf8'));
  const sponsor=await key(99);
  const items=await Promise.all(Array.from({length:9},async(_,i)=>{const metadata=JSON.stringify({name:`Transmission ${i+1}`,artifactUri:`https://pointcast.xyz/art/${i+1}.png`,creators:['Michael Hoydich']});return {id:i+1,slug:`transmission-${i+1}`,artifactUri:`https://pointcast.xyz/art/${i+1}.png`,artifactSha256:'a'.repeat(64),metadataUri:`https://pointcast.xyz/metadata/${i+1}.json`,metadataSha256:await shared.sha256(metadata),metadata};}));
  const env={AUTH_DB:db,OTHER_WORLDS_ENABLED:'true',OTHER_WORLDS_MAINNET_APPROVED:'true',OTHER_WORLDS_FA2_CONTRACT:'KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb',OTHER_WORLDS_SPONSOR_ADDRESS:sponsor.address,OTHER_WORLDS_SPONSOR_SECRET_KEY:'test-only-never-loaded-by-mock',OTHER_WORLDS_RPC_URL:'https://rpc.invalid',OTHER_WORLDS_TOKEN_MAP:JSON.stringify(Object.fromEntries(items.map(item=>[item.id,String(item.id)]))),OTHER_WORLDS_MAX_OPERATION_MUTEZ:'5000',OTHER_WORLDS_TOTAL_BUDGET_MUTEZ:'500000'};
  const adapter=fakeChain();let time=Date.parse('2026-09-15T22:00:00Z');
  const opts={now:()=>time,items,chainFactory:async()=>adapter};
  return {db,env,adapter,opts,items,sponsor,advance(ms){time+=ms;},at(ms){time=ms;},async proof(seed,artworkId=1){const identity=await key(seed);const response=await api.handleChallenge(post('challenge',{address:identity.address,artworkId}),env,opts);const challenge=await response.json();assert.equal(response.status,200,JSON.stringify(challenge));const signature=(await identity.signer.sign(challenge.payload)).prefixSig;return {address:identity.address,publicKey:identity.publicKey,artworkId,nonce:challenge.nonce,signature};}};
}
async function claim(s,proof){let response=await api.handleClaim(post('claim',proof),s.env,s.opts);let data=await response.json();if(data.ok&&data.claim.status==='reserved'){response=await api.handleClaim(post('claim',proof),s.env,s.opts);data=await response.json();}return {status:response.status,...data};}

test('full claim path: real wallet proof, chosen artwork, durable signed bytes, zero-price receipt, independent confirmation',async()=>{
  const s=await setup();const proof=await s.proof(1,7);
  const result=await claim(s,proof);assert.equal(result.status,202);assert.equal(result.claim.artworkId,7);assert.equal(result.claim.status,'submitted');assert.equal(result.claim.collectorCostMutez,0);
  assert.equal(s.adapter.prepares.length,1);assert.equal(rows(s.db)[0].signed_bytes,s.adapter.broadcasts[0]);assert.equal(locks(s.db).length,1);
  s.adapter.statuses.set(result.claim.operationHash,'confirmed');
  const response=await api.handleReceipt(new Request(`${ORIGIN}${result.claim.receiptUrl}`),s.env,s.opts);const receipt=await response.json();
  assert.equal(receipt.claim.status,'confirmed');assert.equal(locks(s.db).length,0);assert.equal(s.adapter.broadcasts.length,1,'GET never broadcasts');
  assert.equal(rows(s.db)[0].maximum_cost_mutez,1200,'confirmed cost remains reserved');
  const repeat=await claim(s,proof);assert.equal(repeat.claim.id,result.claim.id);assert.equal(s.adapter.prepares.length,1);
});
test('launch gates and incomplete provenance fail closed without chain signing',async()=>{
  const s=await setup();s.env.OTHER_WORLDS_MAINNET_APPROVED='false';
  let response=await api.handleStatus(new Request(`${ORIGIN}/api/other-worlds`),s.env,s.opts);assert.equal((await response.json()).phase,'preview');
  response=await api.handleChallenge(post('challenge',{address:(await key(1)).address,artworkId:1}),s.env,s.opts);assert.equal(response.status,503);
  s.env.OTHER_WORLDS_MAINNET_APPROVED='true';s.opts.items=[];assert.equal(await shared.configuration(s.env,s.opts.items),null);assert.equal(s.adapter.prepares.length,0);
  s.opts.items=s.items;s.env.OTHER_WORLDS_TOKEN_MAP=JSON.stringify({'1':'0'});assert.equal(await shared.configuration(s.env,s.opts.items),null);
});
test('startup readiness failure does not open claims or issue a proof',async()=>{
  const s=await setup();s.adapter.readyError=new Error('wrong-inventory');
  const response=await api.handleStatus(new Request(`${ORIGIN}/api/other-worlds`),s.env,s.opts);assert.equal((await response.json()).phase,'unavailable');
  const attempt=await api.handleChallenge(post('challenge',{address:(await key(1)).address,artworkId:1}),s.env,s.opts);assert.equal(attempt.status,503);assert.equal(rows(s.db).length,0);
});
test('wallet substitution, artwork substitution, cross-origin and forged signature all rejected',async()=>{
  const s=await setup();const proof=await s.proof(1,2);const other=await key(2);
  assert.equal((await claim(s,{...proof,address:other.address})).status,401);
  assert.equal((await claim(s,{...proof,artworkId:3})).status,401);
  assert.equal((await claim(s,{...proof,publicKey:other.publicKey})).status,401);
  assert.equal((await claim(s,{...proof,signature:'edsiginvalid'})).status,401);
  assert.equal((await api.handleClaim(post('claim',proof,'https://evil.invalid'),s.env,s.opts)).status,403);
  assert.equal(rows(s.db).length,0);assert.equal(s.adapter.prepares.length,0);
});
test('no closing date keeps new claims open after the original deadline and years later, with five-minute signatures',async()=>{
  assert.equal(shared.CLOSES_AT,null);assert.equal(shared.CLOSES_MS,null);
  for (const instant of ['2026-09-14T07:00:00.000Z','2036-09-14T07:00:00.000Z']) {
    const s=await setup();s.at(Date.parse(instant));const proof=await s.proof(1,7);
    const challenge=s.db.db.prepare('SELECT * FROM other_worlds_challenges WHERE nonce=?').get(proof.nonce);
    assert.equal(challenge.expires_at-challenge.created_at,300_000);
    assert.match(challenge.message,/Claims Close: No closing date/);
    const response=await api.handleStatus(new Request(`${ORIGIN}/api/other-worlds`),s.env,s.opts);const status=await response.json();
    assert.equal(status.closesAt,null);assert.equal(status.phase,'open');
    assert.equal((await claim(s,proof)).claim.artworkId,7);assert.equal(rows(s.db).length,1);
    const expired=await s.proof(2);s.advance(300_000);
    assert.equal((await claim(s,expired)).reason,'challenge-expired');assert.equal(rows(s.db).length,1);
  }
});
test('one wallet across all nine artworks survives simultaneous different-art claims',async()=>{
  const s=await setup();const first=await s.proof(1,1),second=await s.proof(1,2);
  const results=await Promise.all([claim(s,first),claim(s,second)]);
  assert.equal(rows(s.db).length,1);assert.equal(results.filter(result=>result.ok).length,1);assert.equal(results.find(result=>!result.ok).reason,'already-claimed');
});
test('concurrent demand caps one artwork at exactly 27 and collection at 243',async()=>{
  const s=await setup();const proofs=await Promise.all(Array.from({length:32},(_,i)=>s.proof(i+1,1)));
  const results=await Promise.all(proofs.map(proof=>claim(s,proof)));
  assert.equal(rows(s.db).length,27);assert.equal(results.filter(result=>result.ok).length,27);assert.equal(results.filter(result=>result.reason==='artwork-sold-out').length,5);
  const status=await api.handleStatus(new Request(`${ORIGIN}/api/other-worlds`),s.env,s.opts);const data=await status.json();assert.equal(data.artworks[0].remaining,0);assert.equal(data.totalEditions,243);assert.equal(data.artworks[1].remaining,27);
});
test('same proof concurrent replay prepares one operation and does not duplicate inventory',async()=>{
  const s=await setup();const proof=await s.proof(1);const results=await Promise.all(Array.from({length:5},()=>claim(s,proof)));
  assert.equal(rows(s.db).length,1);assert.equal(s.adapter.prepares.length,1);assert.ok(results.every(result=>result.ok));
});
test('uncertain broadcast keeps exact operation, inventory, wallet, budget and global counter lock',async()=>{
  const s=await setup();s.adapter.broadcastError=new Error('timeout');const proof=await s.proof(1);
  const first=await claim(s,proof);assert.equal(first.claim.status,'signed');const original=rows(s.db)[0];
  s.advance(600_000);const retry=await claim(s,proof);assert.equal(retry.claim.id,first.claim.id);assert.equal(s.adapter.prepares.length,1);assert.equal(s.adapter.broadcasts.length,2);assert.equal(s.adapter.broadcasts[0],s.adapter.broadcasts[1]);
  assert.equal(rows(s.db)[0].maximum_cost_mutez,1200);assert.equal(locks(s.db).length,1);
  const second=await claim(s,await s.proof(2,2));assert.equal(second.claim.status,'reserved');assert.equal(s.adapter.prepares.length,1);
  s.adapter.statuses.set(original.operation_hash,'confirmed');s.adapter.broadcastError=null;
  await claim(s,await s.proof(2,2));assert.equal(s.adapter.prepares.length,2,'new collector reconciles departed collector');
});
test('fresh wallet signature resumes original reservation after a long delay and browser refresh',async()=>{
  const s=await setup();s.adapter.prepareError=new Error('sponsor-low');const first=await claim(s,await s.proof(1,5));assert.equal(first.claim.status,'reserved');
  s.at(Date.parse('2027-09-14T07:00:00.000Z'));s.adapter.prepareError=null;const fresh=await s.proof(1,5);const resumed=await claim(s,fresh);assert.equal(resumed.claim.id,first.claim.id);assert.equal(rows(s.db).length,1);assert.equal(resumed.claim.status,'submitted');
});
test('persistence failure after signing never broadcasts and never releases counter lock',async()=>{
  const s=await setup();const proof=await s.proof(1);s.db.failOn=sql=>sql.includes("SET status='signed'");
  const result=await claim(s,proof);assert.equal(result.status,503);assert.equal(s.adapter.broadcasts.length,0);assert.equal(locks(s.db).length,1);assert.equal(rows(s.db)[0].status,'preparing');
  s.db.failOn=null;await claim(s,proof);assert.equal(s.adapter.prepares.length,1,'no speculative signing retry');
});
test('per-operation and campaign maximum costs fail closed; confirmed and failed costs remain charged',async()=>{
  const s=await setup();s.adapter.cost=5001;const first=await claim(s,await s.proof(1));assert.equal(first.claim.status,'reserved');assert.equal(s.adapter.broadcasts.length,0);assert.equal(locks(s.db).length,0);
  const another=await setup();another.env.OTHER_WORLDS_MAX_OPERATION_MUTEZ='1200';another.env.OTHER_WORLDS_TOTAL_BUDGET_MUTEZ='1200';another.adapter.autoConfirm=true;
  assert.equal((await claim(another,await another.proof(1))).claim.status,'confirmed');
  const result=await claim(another,await another.proof(2,2));assert.equal(result.claim.status,'reserved');assert.equal(another.adapter.broadcasts.length,1);assert.equal(rows(another.db).reduce((sum,row)=>sum+row.maximum_cost_mutez,0),1200);
});
test('definitive failed chain receipt releases signer while retaining edition, wallet and spent budget',async()=>{
  const s=await setup();const proof=await s.proof(1);const first=await claim(s,proof);s.adapter.statuses.set(first.claim.operationHash,'failed');const result=await claim(s,proof);
  assert.equal(result.claim.status,'failed');assert.equal(locks(s.db).length,0);assert.equal(rows(s.db)[0].maximum_cost_mutez,1200);assert.equal(s.adapter.prepares.length,1);
});
test('oversize bodies, malformed input and challenge flood are bounded',async()=>{
  const s=await setup();const response=await api.handleChallenge(post('challenge',{junk:'a'.repeat(9000)}),s.env,s.opts);assert.equal(response.status,413);
  const address=(await key(1)).address;const requests=await Promise.all(Array.from({length:14},()=>api.handleChallenge(post('challenge',{address,artworkId:1}),s.env,s.opts)));
  assert.equal(requests.filter(response=>response.status===200).length,10);assert.equal(requests.filter(response=>response.status===429).length,4);
});

test('real Tezos chain adapter audits all nine approved token metadata URIs, hashes, supply and sponsor inventory',async()=>{
  const s=await setup();const config=await shared.configuration(s.env,s.items);const adapter=await chainModule.createTezosChain(s.env,config);
  const oldFetch=globalThis.fetch;let changed=null;
  globalThis.fetch=async input=>{const url=new URL(String(input));let result;
    if(url.pathname==='/chains/main/chain_id')result=shared.CHAIN_ID;
    else if(url.pathname.endsWith('/bigmaps'))result=[{ptr:1,path:'assets.token_metadata'}];
    else if(url.pathname.startsWith('/v1/bigmaps/')){const item=s.items[Number(url.pathname.split('/').at(-1))-1];result={active:true,value:{token_info:{'':stringToBytes(changed==='uri'?'https://evil.invalid/metadata.json':item.metadataUri)}}};}
    else if(url.pathname==='/v1/tokens'){const item=s.items[Number(url.searchParams.get('tokenId'))-1];result=[{standard:'fa2',totalSupply:changed==='supply'?'28':'27',metadata:JSON.parse(item.metadata)}];}
    else if(url.pathname==='/v1/tokens/balances')result=[{balance:changed==='balance'?'26':'27'}];
    else if(url.pathname.startsWith('/metadata/'))return new Response(changed==='hash'?'{}':s.items[Number(url.pathname.split('/').at(-1).split('.')[0])-1].metadata);
    else throw new Error(`Unexpected outbound call ${url}`);
    return new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}});
  };
  try {await adapter.ready({});for(const kind of ['uri','supply','balance','hash']){changed=kind;await assert.rejects(()=>adapter.ready({}));}}
  finally{globalThis.fetch=oldFetch;}
});
test('real receipt adapter requires exact FA2 movement plus confirmations; ignores merely applied unrelated operations',async()=>{
  const s=await setup();const first=await claim(s,await s.proof(1,2));const row=rows(s.db)[0];const config=await shared.configuration(s.env,s.items);const adapter=await chainModule.createTezosChain(s.env,config);
  const oldFetch=globalThis.fetch;let mutation=null;
  globalThis.fetch=async input=>{const url=new URL(String(input));let result;
    if(url.pathname==='/v1/head')result={level:mutation==='missing-head'?undefined:mutation==='unconfirmed'?101:103};
    else if(url.pathname.startsWith('/v1/operations/transactions/'))result=[{id:mutation==='missing-id'?undefined:90,hash:row.operation_hash,level:mutation==='missing-level'?null:100,status:mutation==='failed'?'failed':'applied',sender:{address:row.sponsor},target:{address:row.contract},amount:mutation==='paid'?1:0,parameter:{entrypoint:'transfer',value:[{from_:row.sponsor,txs:[{to_:mutation==='recipient'?s.sponsor.address:row.address,token_id:row.token_id,amount:'1'}]}]}}];
    else if(url.pathname==='/v1/tokens/transfers')result=mutation==='no-transfer'?[]:[{from:{address:row.sponsor},to:{address:row.address},amount:'1'}];
    else throw new Error(`Unexpected outbound call ${url}`);
    return new Response(JSON.stringify(result));
  };
  try {assert.equal(await adapter.status(row),'confirmed');for(const kind of ['unconfirmed','recipient','paid','no-transfer','missing-head','missing-level','missing-id']){mutation=kind;assert.equal(await adapter.status(row),'pending',kind);}mutation='failed';assert.equal(await adapter.status(row),'failed');}
  finally{globalThis.fetch=oldFetch;}
});
test('real broadcast adapter re-injects exact stored bytes and rejects any returned hash substitution',async()=>{
  const s=await setup();const config=await shared.configuration(s.env,s.items);const adapter=await chainModule.createTezosChain(s.env,config);const bytes='ab'.repeat(160);const hash=encodeOpHash(bytes);const oldFetch=globalThis.fetch;let wrong=false,calls=0;
  globalThis.fetch=async(input,init)=>{calls++;assert.equal(init.method,'POST');assert.equal(JSON.parse(init.body),bytes);return new Response(JSON.stringify(wrong?encodeOpHash('cd'.repeat(160)):hash));};
  try{assert.equal(await adapter.broadcast(bytes),hash);wrong=true;await assert.rejects(()=>adapter.broadcast(bytes));assert.equal(calls,2);}finally{globalThis.fetch=oldFetch;}
});

test('actual Taquito prepare uses real local forging and sponsor cryptography with entirely mocked HTTP',async()=>{
  const s=await setup();s.env.OTHER_WORLDS_MAX_OPERATION_MUTEZ='20000';s.env.OTHER_WORLDS_SPONSOR_SECRET_KEY=b58Encode(new Uint8Array(32).fill(99),PrefixV2.Ed25519Seed);
  const config=await shared.configuration(s.env,s.items);const first=await claim(s,await s.proof(1,3));const row=rows(s.db)[0];
  const adapter=await chainModule.createTezosChain(s.env,config);
  const code=JSON.parse(await readFile(new URL('../contracts/generated/el-segundo-school-tokens.code.json',import.meta.url),'utf8'));
  const storage=JSON.parse(await readFile(new URL('../contracts/generated/el-segundo-school-tokens.storage.json',import.meta.url),'utf8'));
  const branch=b58Encode(new Uint8Array(32).fill(7),PrefixV2.BlockHash);
  const protocol=b58Encode(new Uint8Array(32).fill(8),PrefixV2.ProtocolHash);
  const constants={cost_per_byte:'250',hard_gas_limit_per_operation:'1040000',hard_gas_limit_per_block:'5200000',hard_storage_limit_per_operation:'60000',max_operation_data_length:32768,minimal_block_delay:'6',max_operations_time_to_live:120,origination_size:257};
  const oldFetch=globalThis.fetch;const requested=[];
  globalThis.fetch=async(input,init)=>{const url=new URL(String(input));requested.push(url.pathname);let result;
    if(url.pathname.endsWith('/chain_id'))result=shared.CHAIN_ID;
    else if(url.pathname.endsWith('/manager_key'))result=s.sponsor.publicKey;
    else if(url.pathname==='/v1/tokens')result=[{standard:'fa2',totalSupply:'27',metadata:JSON.parse(s.items[2].metadata)}];
    else if(url.pathname==='/v1/tokens/balances')result=[{balance:'27'}];
    else if(url.pathname==='/metadata/3.json')return new Response(s.items[2].metadata);
    else if(url.pathname.endsWith(`/context/contracts/${config.sponsor}`))result={counter:'8',balance:'1000000'};
    else if(url.pathname.endsWith(`/context/contracts/${config.contract}`))result={script:{code,storage},balance:'0'};
    else if(url.pathname.endsWith('/script')||url.pathname.endsWith('/script/normalized'))result={code,storage};
    else if(url.pathname.endsWith('/entrypoints')) { const findTransfer=value=>Array.isArray(value)?value.map(findTransfer).find(Boolean):value&&typeof value==='object'?(value.annots?.includes('%transfer')?value:findTransfer(value.args)):null;result={entrypoints:{transfer:findTransfer(code)}};}
    else if(url.pathname.endsWith('/constants'))result=constants;
    else if(url.pathname.endsWith('/balance'))result='1000000';
    else if(url.pathname.endsWith('/counter'))result='8';
    else if(url.pathname.endsWith('/hash'))result=branch;
    else if((url.pathname.endsWith('/metadata')||url.pathname.endsWith('/protocols')))result={next_protocol:protocol,protocol};
    else if(url.pathname.endsWith('/header'))result={hash:branch,level:100,proto:1,predecessor:branch,timestamp:'2026-09-13T22:00:00Z',validation_pass:4,operations_hash:b58Encode(new Uint8Array(32).fill(9),PrefixV2.OperationListListHash),fitness:[],context:b58Encode(new Uint8Array(32).fill(10),PrefixV2.ContextHash),protocol};
    else if(url.pathname.endsWith('/filter'))result={minimal_fees:'100',minimal_nanotez_per_gas_unit:['100','1'],minimal_nanotez_per_byte:['1000','1']};
    else if(url.pathname.endsWith('/helpers/scripts/run_operation')||url.pathname.endsWith('/helpers/scripts/simulate_operation')){
      const sent=JSON.parse(init.body);result={contents:sent.operation.contents.map(operation=>({...operation,metadata:{operation_result:{status:'applied',consumed_milligas:'1000000',paid_storage_size_diff:'2',storage:[],balance_updates:[]}}}))};
    } else return new Response(JSON.stringify({unhandled:url.pathname}),{status:400});
    return new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}});
  };
  try {
    let signed;
    try {signed=await adapter.prepare(row,20000);}catch(error){throw new Error(`${error.message}\nHTTP routes: ${JSON.stringify(requested)}`);}
    assert.equal(signed.hash,encodeOpHash(signed.bytes));assert.ok(signed.maximumCostMutez>0);assert.ok(signed.maximumCostMutez<=20000);
    const {LocalForger}=await import('@taquito/local-forging');const forged=signed.bytes.slice(0,-128);const operation=await new LocalForger().parse(forged);
    assert.equal(operation.contents.length,1);assert.equal(operation.contents[0].source,s.sponsor.address);assert.equal(operation.contents[0].destination,row.contract);assert.equal(operation.contents[0].amount,'0');
    assert.ok(!requested.some(route=>route.includes('/injection/')),'prepare never broadcasts');
    assert.ok(requested.length < 50,`prepare uses ${requested.length} external requests`);
    const signature=b58Encode(Buffer.from(signed.bytes.slice(-128),'hex'),PrefixV2.Ed25519Signature);
    assert.equal(utils.verifySignature(forged,s.sponsor.publicKey,signature,new Uint8Array([3])),true);
  } finally {globalThis.fetch=oldFetch;}
});


test('all nine artworks enforce 243 total reservations under simultaneous demand',async()=>{
  const s=await setup();const proofs=await Promise.all(Array.from({length:252},(_,i)=>s.proof(i+1,Math.floor(i/28)+1)));
  const results=await Promise.all(proofs.map(proof=>claim(s,proof)));
  assert.equal(results.filter(result=>result.ok).length,243);
  assert.equal(results.filter(result=>result.reason==='artwork-sold-out').length,9);
  const counts=s.db.db.prepare('SELECT artwork_id,COUNT(*) AS count FROM other_worlds_claims GROUP BY artwork_id').all();
  assert.equal(counts.length,9);assert.ok(counts.every(row=>row.count===27));assert.equal(s.adapter.prepares.length,1);
});
