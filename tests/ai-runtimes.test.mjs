import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestGet, onRequestPost, onRequestDelete } from '../functions/api/me/ai-runtimes.ts';
import { onRequestPost as nativePost } from '../functions/api/ai-runtime.ts';

function environment(t) {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  for (const migration of ['0001_init', '0017_ai_runtimes']) db.exec(readFileSync(new URL(`../migrations/auth/${migration}.sql`, import.meta.url), 'utf8'));
  for (const id of ['alice', 'bob']) {
    db.prepare('INSERT INTO users VALUES (?,?,?)').run(id, JSON.stringify({ userId:id, identities:[] }), new Date().toISOString());
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('session-'+id, id, Date.now()+600_000);
  }
  t.after(()=>db.close());
  return { db, AUTH_DB:{ prepare(sql) { return {
    args:[], bind(...args){ this.args=args; return this; },
    async first(){ return db.prepare(sql).get(...this.args)??null; },
    async all(){return {results:db.prepare(sql).all(...this.args)};},
    async run(){ const r=db.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}};},
  }; } } };
}
function browser(method='GET', body, user='alice', origin='https://pointcast.xyz') {
  return new Request('https://pointcast.xyz/api/me/ai-runtimes',{method,
    headers:{cookie:'pc_session=session-'+user,origin,'content-type':'application/json'},
    ...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function web(env, body, user='alice') { return onRequestPost({env,request:browser('POST',body,user)}); }
async function native(env, body, token, headers={}) {
  return nativePost({env,request:new Request('https://pointcast.xyz/api/ai-runtime',{method:'POST',headers:{
    'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{}),...headers},body:JSON.stringify(body)})});
}
async function list(env,user='alice') {return (await onRequestGet({env,request:browser('GET',undefined,user)})).json();}
async function pair(env,user='alice') {
  const invite=await (await web(env,{operation:'invite',label:'My computer'},user)).json();
  const connected=await (await native(env,{operation:'pair',code:invite.code,label:'Companion'})).json();
  assert.equal(connected.ok,true); return {...invite,...connected};
}
const provider={provider:'codex',available:true,authenticated:true,authMode:'subscription',models:[{id:'test-model',label:'Test model'}],modelDiscovery:'native'};
async function ready(env,user='alice') {
  const connection=await pair(env,user);
  assert.equal((await native(env,{operation:'heartbeat',providers:[provider]},connection.token)).status,200);
  return connection;
}
async function enqueue(env,connection,body={}) {
  return web(env,{operation:'job',requestId:crypto.randomUUID(),runtimeId:connection.runtimeId,kind:'prompt',provider:'codex',model:'test-model',prompt:'Suggest one small thing from this note.',...body});
}
async function claim(env,connection) {return (await (await native(env,{operation:'claim'},connection.token)).json()).job;}
async function complete(env,connection,job,extra={}) {return native(env,{operation:'complete',jobId:job.id,leaseToken:job.leaseToken,status:'succeeded',result:{text:'A small suggestion.',actualModels:['test-model']},...extra},connection.token);}

test('pairing is owner-bound, one-use and hash-only; pairing does not prove provider or task',async t=>{
  const env=environment(t);
  const invitation=await (await web(env,{operation:'invite',label:'Laptop'})).json();
  const initial=(await list(env)).runtimes[0];
  assert.equal(initial.status,'waiting');assert.equal(initial.lastSuccessAt,null);
  const requests=await Promise.all([1,2].map(()=>native(env,{operation:'pair',code:invitation.code,label:'Laptop'})));
  assert.deepEqual(requests.map(x=>x.status).sort(),[200,401]);
  const paired=await requests.find(x=>x.status===200).json();
  const row=env.db.prepare('SELECT * FROM ai_runtimes').get();
  assert.equal(row.pair_hash,null);assert.notEqual(row.token_hash,paired.token);
  const data=await list(env);assert.equal(data.runtimes[0].lastSuccessAt,null);assert.deepEqual(data.runtimes[0].providers,[]);
  assert.ok(!JSON.stringify(data).includes(paired.token));assert.ok(!JSON.stringify(data).includes(row.token_hash));
  assert.deepEqual((await list(env,'bob')).runtimes,[]);
  assert.equal((await native(env,{operation:'claim'},undefined,{cookie:'pc_session=session-alice'})).status,401);
});

test('one active job and single atomic claim; successful real model result alone marks first task verified',async t=>{
  const env=environment(t);const connection=await ready(env);
  const starts=await Promise.all([enqueue(env,connection),enqueue(env,connection)]);
  assert.deepEqual(starts.map(x=>x.status).sort(),[201,429]);
  assert.equal((await list(env)).runtimes[0].lastSuccessAt,null);
  const claims=await Promise.all([claim(env,connection),claim(env,connection)]);
  assert.equal(claims.filter(Boolean).length,1);const job=claims.find(Boolean);
  assert.match(job.prompt,/No tools/);assert.equal(job.kind,'prompt');
  assert.equal((await complete(env,connection,job,{result:{text:'Unproven response',actualModels:[]}})).status,400);
  assert.equal((await complete(env,connection,job)).status,200);
  assert.equal((await complete(env,connection,job)).status,409);
  const data=await list(env);assert.ok(data.runtimes[0].lastSuccessAt);
  assert.deepEqual(data.jobs[0].result.actualModels,['test-model']);
  assert.equal(data.jobs[0].status,'succeeded');
  assert.ok(!JSON.stringify(data).includes(job.leaseToken));assert.ok(!('prompt' in data.jobs[0]));
});

test('pairing preserves the profile name unless overridden and expired invitations free capacity',async t=>{
  const env=environment(t);
  const invite=await (await web(env,{operation:'invite',label:'My chosen name'})).json();
  assert.equal((await native(env,{operation:'pair',code:invite.code})).status,200);
  assert.equal((await list(env)).runtimes[0].label,'My chosen name');
  const override=await (await web(env,{operation:'invite',label:'Original name'})).json();
  assert.equal((await native(env,{operation:'pair',code:override.code,label:'Explicit override'})).status,200);
  assert.equal(env.db.prepare('SELECT label FROM ai_runtimes WHERE id=?').get(override.runtimeId).label,'Explicit override');
  for(let i=0;i<3;i++) assert.equal((await web(env,{operation:'invite',label:'Waiting'})).status,201);
  assert.equal((await web(env,{operation:'invite',label:'At limit'})).status,429);
  const other=await (await web(env,{operation:'invite',label:'Other owner'},'bob')).json();
  env.db.prepare('UPDATE ai_runtimes SET pair_expires_at=? WHERE token_hash IS NULL').run(Date.now()-1);
  assert.equal((await web(env,{operation:'invite',label:'Fresh invitation'})).status,201);
  assert.equal((await list(env)).runtimes.length,3);
  assert.ok(env.db.prepare('SELECT id FROM ai_runtimes WHERE id=?').get(other.runtimeId));
  assert.equal((await native(env,{operation:'pair',code:other.code})).status,401);
});

test('cross-owner enqueues/completions, forged leases and revoked runtimes cannot execute or publish results',async t=>{
  const env=environment(t);const a=await ready(env),b=await ready(env,'bob');
  assert.equal((await enqueue(env,b)).status,404);
  await enqueue(env,a);const job=await claim(env,a);
  assert.equal((await complete(env,b,job)).status,409);
  assert.equal((await complete(env,a,{...job,leaseToken:'x'.repeat(43)})).status,409);
  await onRequestDelete({env,request:browser('DELETE',{runtimeId:a.runtimeId},'bob')});
  assert.equal((await list(env)).runtimes.length,1);
  await onRequestDelete({env,request:browser('DELETE',{runtimeId:a.runtimeId})});
  assert.equal((await complete(env,a,job)).status,401);
  assert.equal((await native(env,{operation:'claim'},a.token)).status,401);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM ai_runtime_jobs WHERE runtime_id=?').get(a.runtimeId).n,0);
});

test('a lost creation response can be retried after completion without a second inference',async t=>{
  const env=environment(t);const connection=await ready(env);const requestId=crypto.randomUUID();
  const responses=await Promise.all([enqueue(env,connection,{requestId}),enqueue(env,connection,{requestId})]);
  const ids=await Promise.all(responses.map(async r=>{assert.equal(r.status,201);return (await r.json()).jobId;}));
  assert.equal(ids[0],ids[1]);
  const job=await claim(env,connection);await complete(env,connection,job);
  const replay=await (await enqueue(env,connection,{requestId})).json();
  assert.equal(replay.jobId,job.id);assert.equal(replay.replayed,true);assert.equal(await claim(env,connection),null);
  assert.equal((await enqueue(env,connection,{requestId,prompt:'Different task'})).status,409);
  assert.equal(env.db.prepare('SELECT COUNT(*) AS n FROM ai_runtime_jobs').get().n,1);
});

test('cancel and expiry end leases permanently without requeuing; heartbeat tells runner to abort',async t=>{
  const env=environment(t);const connection=await ready(env);
  await enqueue(env,connection);const job=await claim(env,connection);
  await web(env,{operation:'cancel',jobId:job.id});
  const beat=await (await native(env,{operation:'heartbeat',providers:[provider]},connection.token)).json();
  assert.ok(beat.cancelledJobIds.includes(job.id));assert.equal((await complete(env,connection,job)).status,409);
  assert.equal(await claim(env,connection),null);
  await enqueue(env,connection);const expiring=await claim(env,connection);
  env.db.prepare('UPDATE ai_runtime_jobs SET expires_at=? WHERE id=?').run(Date.now()-1,expiring.id);
  assert.equal((await complete(env,connection,expiring)).status,409);
  assert.equal(await claim(env,connection),null);
  assert.equal((await list(env)).jobs.find(x=>x.id===expiring.id).error,'job-expired');
});

test('login exposes only validated provider URL/code and never implies a completed task',async t=>{
  const env=environment(t);const connection=await ready(env);
  await enqueue(env,connection,{kind:'login'});const job=await claim(env,connection);
  const progress=login=>native(env,{operation:'progress',jobId:job.id,leaseToken:job.leaseToken,login},connection.token);
  for(const verificationUrl of ['https://auth.openai.com.evil.test/login','http://auth.openai.com/login','https://u:p@auth.openai.com/login','https://claude.ai/oauth'])
    assert.equal((await progress({verificationUrl,userCode:'ABCD-1234'})).status,400);
  assert.equal((await progress({verificationUrl:'https://auth.openai.com/codex/device',userCode:'ABCD-1234',accessToken:'never-store'})).status,200);
  const view=(await list(env)).jobs[0];assert.equal(view.login.userCode,'ABCD-1234');assert.ok(!JSON.stringify(view).includes('never-store'));
  assert.equal((await complete(env,connection,job,{result:{text:'Native sign-in completed.',actualModels:[]}})).status,200);
  const after=await list(env);assert.equal(after.runtimes[0].lastSuccessAt,null);assert.equal(after.jobs[0].login,undefined);
});

test('auth state, subscription mode, model choice, online freshness and prompt bounds gate jobs',async t=>{
  const env=environment(t);const connection=await ready(env);
  for(const [change,reason] of [[{authenticated:false},'provider-not-ready'],[{authMode:'api'},'subscription-required'],[{available:false},'provider-unavailable']]) {
    await native(env,{operation:'heartbeat',providers:[{...provider,...change}]},connection.token);
    assert.equal((await (await enqueue(env,connection)).json()).reason,reason);
  }
  await native(env,{operation:'heartbeat',providers:[provider]},connection.token);
  assert.equal((await enqueue(env,connection,{model:'not-listed'})).status,400);
  assert.equal((await enqueue(env,connection,{prompt:'x'.repeat(4001)})).status,400);
  env.db.prepare('UPDATE ai_runtimes SET last_seen_at=?').run(Date.now()-46_000);
  assert.equal((await (await enqueue(env,connection)).json()).reason,'runtime-offline');
  assert.equal((await list(env)).runtimes[0].status,'offline');
});

test('request validation rejects cross-origin, malformed, oversized and browser-to-native operations',async t=>{
  const env=environment(t);const body={operation:'invite',label:'My computer'};
  assert.equal((await onRequestPost({env,request:browser('POST',body,'alice','https://evil.example')})).status,403);
  assert.equal((await web(env,body,'missing')).status,401);
  assert.equal((await web(env,{...body,huge:'x'.repeat(25_000)})).status,413);
  for(const value of [null,[],{operation:'anything'}]) assert.equal((await web(env,value)).status,400);
  assert.equal((await native(env,{operation:'pair',code:'x'.repeat(43),label:'x'},undefined,{origin:'https://pointcast.xyz'})).status,403);
  assert.equal((await native(env,{operation:'pair',code:'x'.repeat(43),label:'x'})).status,401);
  assert.equal((await web({},body)).status,503);
});

test('pair and runtime tokens expire, and retained task context is purged after thirty days',async t=>{
  const env=environment(t);
  const invite=await (await web(env,{operation:'invite',label:'Laptop'})).json();
  env.db.prepare('UPDATE ai_runtimes SET pair_expires_at=?').run(Date.now()-1);
  assert.equal((await native(env,{operation:'pair',code:invite.code,label:'Laptop'})).status,401);
  const connection=await ready(env);await enqueue(env,connection);
  env.db.prepare('UPDATE ai_runtime_jobs SET created_at=?').run(Date.now()-31*24*60*60_000);
  assert.deepEqual((await list(env)).jobs,[]);
  env.db.prepare('UPDATE ai_runtimes SET token_expires_at=? WHERE id=?').run(Date.now()-1,connection.runtimeId);
  assert.equal((await native(env,{operation:'claim'},connection.token)).status,401);
});
