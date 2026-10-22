import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {before,after,test} from 'node:test';
import {build} from 'esbuild';
import {simulateRace,houseEntrants} from '../public/sunset-downs/engine.mjs';
let api,identity,sdk,migration;const databases=[];
const AT=new Date('2026-10-19T18:00:00Z'),POST=new Date('2026-10-19T19:00:00Z'),RACE='sd-2026-10-19-noon';
before(async()=>{
 [api,identity]=await Promise.all(['functions/_lib/sunset-downs.ts','functions/_lib/agent-identity.ts'].map(async entry=>{const r=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',logLevel:'error'});return import(`data:text/javascript;base64,${Buffer.from(r.outputFiles[0].text).toString('base64')}`);}));
 sdk=await import('../public/sunset-downs/agent-sdk.mjs');migration=await readFile(new URL('../migrations/auth/0032_sunset_downs.sql',import.meta.url),'utf8');
});
after(()=>databases.forEach(d=>d.db.close()));
class SqliteD1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.clock=AT;this.db.function('strftime',{varargs:true},(format,value)=>{assert.equal(format,'%Y-%m-%dT%H:%M:%fZ');assert.equal(value,'now');return this.clock.toISOString();});this.db.exec(`PRAGMA foreign_keys=ON;${migration}
 CREATE TABLE agent_keys(key_id TEXT PRIMARY KEY,agent_id TEXT,public_key TEXT,operator TEXT,scopes_json TEXT,expires_at TEXT,status TEXT,replaces_key_id TEXT,created_at TEXT,rotated_at TEXT,revoked_at TEXT);`);databases.push(this);}
 prepare(sql){let values=[];const execute=mode=>{const s=this.db.prepare(sql);if(mode==='first')return s.get(...values)??null;if(mode==='all'||s.columns().length)return{results:s.all(...values),meta:{changes:0}};return{results:[],meta:{changes:Number(s.run(...values).changes)}};};const p={bind(...v){values=v;return p;},async first(){return execute('first');},async all(){return execute('all');},async run(){return execute('run');},execute,sql};return p;}
 async batch(statements){this.db.exec('BEGIN');let results;try{results=statements.map(s=>s.execute('run'));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}if(this.loseResponse&&statements.some(s=>s.sql.includes('INSERT INTO sunset_downs_receipts'))){this.loseResponse=false;throw new Error('lost response after commit');}return results;}
}
let n=0;
async function register(db,scopes=['sunset-downs:play','sunset-downs:profile']){const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);const id=`pci_${(++n).toString(16).padStart(32,'0')}`;db.db.prepare("INSERT INTO agent_keys VALUES(?,?,?,?,?,?,'active',NULL,?,NULL,NULL)").run(`key${n}`,id,Buffer.from(await crypto.subtle.exportKey('raw',keys.publicKey)).toString('base64'),'Test owner',JSON.stringify(scopes),'2027-09-01T00:00:00Z',AT.toISOString());return{id,privateKey:keys.privateKey};}
async function headers(agent,action,body,now){return sdk.signRequest({agentId:agent.id,privateKey:agent.privateKey,action,body,now});}
async function post(db,agent,body,now=AT,override){if(!db.fixedClock)db.clock=now;const r=await api.handleSunsetDownsActions(new Request('https://pointcast.xyz/api/sunset-downs/actions',{method:'POST',headers:{'Content-Type':'application/json',...await headers(agent,'sunset-downs.actions',body,now),...override},body:JSON.stringify(body)}),{AUTH_DB:db},now);return{status:r.status,body:await r.json()};}
async function feed(db,now=AT){const r=await api.handleSunsetDownsManifest(new Request('https://pointcast.xyz/api/sunset-downs'),{AUTH_DB:db},now);return{status:r.status,body:await r.json()};}
async function profile(db,agent,now=AT){const r=await api.handleSunsetDownsProfile(new Request('https://pointcast.xyz/api/sunset-downs/profile',{headers:await headers(agent,'sunset-downs.profile',{},now)}),{AUTH_DB:db},now);return{status:r.status,body:await r.json()};}
const create=(key='create-stable-1')=>({type:'stable.create',idempotencyKey:key,name:'Marquee Stables',horseName:'Second Billing',archetype:'stunt-double',ownerLabel:'An independent agent'});
const enter=(raceId=RACE,key=`enter-${raceId}`)=>({type:'race.enter',idempotencyKey:key,raceId});
test('public six-card feed is bounded, never exposes future seeds, and documents play-only money',async()=>{
 const db=new SqliteD1(),r=await feed(db);assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.races.length,6);assert.equal(r.body.roster.length,6);assert.match(r.body.rules.money,/never redeemable/);assert.match(r.body.rules.settlement,/No background cron/);
 assert.ok(r.body.races.every(r=>r.result===null&&r.entrants.length===6));assert.ok(!JSON.stringify(r.body.races).includes('seed'));
 assert.equal(db.db.prepare("SELECT count(*) AS n FROM sunset_downs_races WHERE post_at>?").get(AT.toISOString()).n,0);
 const noDb=await api.handleSunsetDownsManifest(new Request('https://pointcast.xyz/api/sunset-downs'),{},AT);assert.equal(noDb.status,503);
 assert.equal(api.SUNSET_DOWNS_OPTIONS().headers.get('Access-Control-Allow-Origin'),'*');
});
test('signatures protect writes and profiles, including scopes, tampering, stale and revoked keys',async()=>{
 const db=new SqliteD1(),a=await register(db),body=create();
 let r=await api.handleSunsetDownsActions(new Request('https://pointcast.xyz/api/sunset-downs/actions',{method:'POST',body:JSON.stringify(body)}),{AUTH_DB:db},AT);assert.equal(r.status,401);
 assert.equal((await post(db,a,body,AT,await headers(a,'sunset-downs.actions',{...body,name:'Tampered'},AT))).status,401);
 assert.equal((await post(db,a,body,AT,await headers(a,'sunset-downs.actions',body,new Date(AT.getTime()-360001)))).status,401);
 const limited=await register(db,['sunset-downs:profile']);assert.equal((await post(db,limited,body)).status,403);
 db.db.prepare("UPDATE agent_keys SET status='revoked' WHERE agent_id=?").run(a.id);assert.equal((await post(db,a,body)).status,401);
 assert.equal(db.db.prepare('SELECT count(*) AS n FROM sunset_downs_stables').get().n,0);
});
test('one stable per registered identity, immutable receipts and replay conflicts do not mint extra credits',async()=>{
 const db=new SqliteD1(),a=await register(db);assert.equal((await profile(db,a)).body.profile.stable,null);
 const first=await post(db,a,create());assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.profile.stable.balance,1000);
 const replay=await post(db,a,create());assert.equal(replay.status,200);assert.equal(replay.body.replayed,true);assert.deepEqual(replay.body.receipt,first.body.receipt);
 assert.equal((await post(db,a,{...create(),name:'A different stable'})).status,409);
 assert.equal((await post(db,a,create('another-create-key'))).body.error,'stable-exists');
 assert.equal((await post(db,a,{...create('bad-shape-key'),balance:999999})).status,400);
 assert.equal((await post(db,a,{...create('bad-cast-key'),archetype:'winner'})).status,400);
 assert.equal((await post(db,a,{...create('bad-name-key'),horseName:'x'})).status,400);
 assert.equal(db.db.prepare('SELECT count(*) AS n FROM sunset_downs_receipts').get().n,1);
});
test('entries atomically debit exactly once, respect the post and one-entry rule, and recover lost COMMIT responses',async()=>{
 const db=new SqliteD1(),a=await register(db);await post(db,a,create());db.loseResponse=true;
 const first=await post(db,a,enter());assert.equal(first.status,200,JSON.stringify(first.body));assert.equal(first.body.profile.stable.balance,950);
 const replay=await post(db,a,enter(),POST);assert.equal(replay.status,200);assert.equal(replay.body.receipt.id,first.body.receipt.id);
 assert.equal((await post(db,a,enter(RACE,'different-entry-key'))).body.error,'already-entered');
 assert.equal((await post(db,a,enter('sd-2026-10-21-noon','too-far-ahead'))).body.error,'entry-closed');
 assert.equal((await post(db,a,enter('sd-2026-10-19-matinee','entry-at-post'),new Date('2026-10-19T23:00Z'))).body.error,'entry-closed');
 assert.equal(db.db.prepare('SELECT starts FROM sunset_downs_stables WHERE agent_id=?').get(a.id).starts,1);
});
test('maximum 12 owned horses, stable-required and insufficient credit failures leave neither receipt nor debit',async()=>{
 const db=new SqliteD1(),agents=[];for(let i=0;i<13;i++){const a=await register(db);agents.push(a);await post(db,a,create(`create-stable-${i}`));const r=await post(db,a,enter());assert.equal(r.status,i<12?200:409,JSON.stringify(r.body));}
 assert.equal(db.db.prepare('SELECT count(*) AS n FROM sunset_downs_entries WHERE race_id=?').get(RACE).n,12);
 assert.equal((await profile(db,agents[12])).body.profile.stable.balance,1000);
 const poor=await register(db);await post(db,poor,create('poor-stable'));db.db.prepare('UPDATE sunset_downs_stables SET balance=49 WHERE agent_id=?').run(poor.id);
 assert.equal((await post(db,poor,enter('sd-2026-10-19-matinee'))).body.error,'insufficient-credits');
 const noStable=await register(db);assert.equal((await post(db,noStable,enter('sd-2026-10-19-matinee'))).body.error,'stable-required');
 assert.equal(db.db.prepare('SELECT count(*) AS n FROM sunset_downs_receipts WHERE agent_id=?').get(poor.id).n,1);
});
test('post-time settlement freezes the exact field, persists one seed, and awards positions once across concurrent reads',async()=>{
 const db=new SqliteD1(),a=await register(db);await post(db,a,create());await post(db,a,enter());
 const results=await Promise.all([feed(db,POST),feed(db,POST),profile(db,a,POST)]);
 for(const r of results)assert.equal(r.status,200,JSON.stringify(r.body));
 const race=db.db.prepare('SELECT * FROM sunset_downs_races WHERE id=?').get(RACE);assert.equal(race.state,'settled');
 const result=JSON.parse(race.result_json),snapshot=JSON.parse(race.entrants_json);assert.equal(snapshot.length,7);assert.equal(snapshot.filter(e=>!e.house).length,1);assert.deepEqual(result,simulateRace(race.seed,snapshot));
 const horse=result.finish.find(e=>e.id===a.id),stable=db.db.prepare('SELECT * FROM sunset_downs_stables WHERE agent_id=?').get(a.id);
 assert.equal(stable.balance,950+horse.award);assert.equal(stable.earned,horse.award);assert.equal(stable.wins,horse.position===1?1:0);
 await feed(db,new Date('2026-10-19T19:10Z'));await api.settleSunsetDownsRace(db,RACE,new Date('2026-10-19T19:10Z'));
 assert.deepEqual(db.db.prepare('SELECT * FROM sunset_downs_stables WHERE agent_id=?').get(a.id),stable);
 assert.equal(db.db.prepare('SELECT seed FROM sunset_downs_races WHERE id=?').get(RACE).seed,race.seed);
 const late=await register(db);await post(db,late,create('late-stable-key'),POST);assert.equal((await post(db,late,enter(),POST)).body.error,'entry-closed');
 assert.throws(()=>db.db.prepare("UPDATE sunset_downs_races SET state='settled' WHERE id=?").run(RACE),/immutable/);
});
test('a crash after the locked snapshot resumes from the same field and records the winning award',async()=>{
 const db=new SqliteD1(),a=await register(db);await post(db,a,create());await post(db,a,enter());
 const entrants=[...houseEntrants(),{id:a.id,name:'Second Billing',archetype:'stunt-double',stableName:'Marquee Stables',ownerLabel:'An independent agent',house:false}];
 let seed,result;for(let i=0;i<1000;i++){seed=i.toString(16).padStart(32,'0');result=simulateRace(seed,entrants);if(result.winnerId===a.id)break;}
 assert.equal(result.winnerId,a.id);
 db.db.prepare("UPDATE sunset_downs_races SET state='locked',seed=?,entrants_json=? WHERE id=?").run(seed,JSON.stringify(entrants),RACE);
 const response=await feed(db,POST);assert.equal(response.status,200,JSON.stringify(response.body));
 const stable=(await profile(db,a,POST)).body.profile.stable;assert.equal(stable.balance,1250);assert.equal(stable.earned,300);assert.equal(stable.wins,1);
 assert.equal(JSON.parse(db.db.prepare('SELECT result_json FROM sunset_downs_races WHERE id=?').get(RACE).result_json).seed,seed);
});
test('SDK canonical signatures match the existing identity implementation without exposing private material',async()=>{
 const db=new SqliteD1(),a=await register(db);const body=create();
 assert.equal(sdk.canonicalJson(body),JSON.stringify(Object.fromEntries(Object.entries(body).sort())));
 const headersSigned=await headers(a,'sunset-downs.actions',body,AT),hash=await identity.hashAgentActionRequest('sunset-downs.actions',body);
 const proof=await identity.verifyAgentRequest(db,new Request('https://pointcast.xyz',{headers:headersSigned}),hash,'sunset-downs:play',AT);assert.equal(proof.agentId,a.id);
 const keys=await sdk.generateAgentKeys();assert.equal(keys.privateKey.extractable,false);assert.equal((await crypto.subtle.exportKey('raw',keys.publicKey)).byteLength,32);
});


test('database commit time rejects a request started before post when its entry transaction arrives at post',async()=>{
 const db=new SqliteD1(),a=await register(db);await post(db,a,create());
 db.db.prepare('INSERT INTO sunset_downs_races(id,post_at) VALUES(?,?)').run(RACE,POST.toISOString());
 db.clock=POST;db.fixedClock=true;
 const r=await post(db,a,enter(),new Date(POST.getTime()-1));
 assert.equal(r.status,409,JSON.stringify(r.body));assert.equal(r.body.error,'entry-closed');
 assert.equal(db.db.prepare('SELECT state FROM sunset_downs_races WHERE id=?').get(RACE).state,'open');
 assert.equal(db.db.prepare('SELECT count(*) AS n FROM sunset_downs_entries WHERE race_id=?').get(RACE).n,0);
 assert.equal((await profile(db,a)).body.profile.stable.balance,1000);
});
test('simultaneous same-key and different-key entry attempts produce one debit and one entry',async()=>{
 const db=new SqliteD1(),a=await register(db);await post(db,a,create());
 const same=await Promise.all([post(db,a,enter()),post(db,a,enter())]);
 assert.ok(same.every(r=>r.status===200),JSON.stringify(same));assert.equal(same[0].body.receipt.id,same[1].body.receipt.id);
 const other=await post(db,a,enter(RACE,'competing-entry-key'));assert.equal(other.status,409);
 const p=(await profile(db,a)).body.profile;assert.equal(p.stable.balance,950);assert.equal(p.stable.starts,1);assert.equal(p.entries.length,1);assert.equal(p.receipts.length,2);
});


test('all podium positions pay the fixed award while fourth place pays zero and the house keeps no credits',async()=>{
 for(const [position,award] of [[1,300],[2,150],[3,75],[4,0]]) {
  const db=new SqliteD1(),a=await register(db);await post(db,a,create());await post(db,a,enter());
  const entrants=[...houseEntrants(),{id:a.id,name:'Second Billing',archetype:'stunt-double',stableName:'Marquee Stables',ownerLabel:'An independent agent',house:false}];
  let seed,result;for(let i=0;i<1000;i++){seed=i.toString(16).padStart(32,'0');result=simulateRace(seed,entrants);if(result.finish.find(e=>e.id===a.id).position===position)break;}
  assert.equal(result.finish.find(e=>e.id===a.id).position,position);
  db.db.prepare("UPDATE sunset_downs_races SET state='locked',seed=?,entrants_json=? WHERE id=?").run(seed,JSON.stringify(entrants),RACE);
  await api.settleSunsetDownsRace(db,RACE,POST);
  const p=(await profile(db,a,POST)).body.profile;assert.equal(p.stable.balance,950+award);assert.equal(p.stable.earned,award);assert.equal(p.entries[0].position,position);assert.equal(p.entries[0].award,award);
  assert.ok(JSON.parse(db.db.prepare('SELECT result_json FROM sunset_downs_races WHERE id=?').get(RACE).result_json).finish.filter(e=>e.house).every(e=>e.award===0));
 }
});
