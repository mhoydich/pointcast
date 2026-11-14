import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {claimHandle,authorizeHandle,primary} from '../src/lib/loom/handles.mjs';
import {addressKey} from '../src/lib/loom/address.mjs';
import {handleLoom} from '../src/lib/loom/service.mjs';
import {onRequest as endpoint} from '../functions/api/loom/handles.ts';
import {onRequest as loom} from '../functions/api/loom.ts';
import {handlePrincipal} from '../functions/_lib/loom-handle-auth.ts';
import {hashAgentActionRequest,buildAgentRequestPayload} from '../functions/_lib/agent-identity.ts';
function setup({ready=true}={}) {
 const sql=new DatabaseSync(':memory:');
 for(const f of ['0001_init.sql','0007_post_office_aliases.sql','0012_paid_action_intents.sql','0014_agent_contract.sql','0035_loom_handles.sql'])sql.exec(readFileSync(new URL('../migrations/auth/'+f,import.meta.url),'utf8'));
 if(ready)sql.exec('UPDATE loom_handle_policy SET legacy_ready=1');
 const db={prepare(query){
   let args=[];
   return {
     bind(...a){args=a;return this;},
     async first(){return sql.prepare(query).get(...args)??null;},
     async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:Number(r.changes)}};}
   };
 }};
 const values=new Map();const kv={get:async k=>values.get(k)??null,put:async(k,v)=>values.set(k,v)};
 const user={userId:'user-a',preferredName:'Example',identities:[],roles:[],createdAt:new Date().toISOString()};
 sql.prepare('INSERT INTO users(id,payload,created_at) VALUES (?,?,?)').run(user.userId,JSON.stringify(user),user.createdAt);
 sql.prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES (?,?,?)').run('session-a',user.userId,Date.now()+60000);
 return {db,sql,kv,values,env:{AUTH_DB:db,PC_LOOM_KV:kv,LOOM_HANDLES_ENABLED:'1'}};
}
const request=(body,headers={},url='https://pointcast.xyz/api/loom')=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const signedIn={cookie:'pc_session=session-a',origin:'https://pointcast.xyz'};
const sender={name:'Newname',kind:'human',verified:false};
test('normalization, atomic competing owners and one handle per principal',async()=>{
 const {db,kv}=setup();const results=await Promise.all([claimHandle(db,kv,'@Newname','account:a','account'),claimHandle(db,kv,'NEWNAME','account:b','account')]);
 assert.equal(results.filter(x=>x.claim).length,1);const winner=results[0].claim?'account:a':'account:b';
 assert.equal((await claimHandle(db,kv,'newname',winner,'account')).claim.handle,'@newname');
 assert.ok((await claimHandle(db,kv,'another',winner,'account')).error);
 assert.equal((await claimHandle(db,kv,'../bad','account:c','account')).status,400);
});
test('legacy policy, reserved names, imported hashes and retained history block adoption',async()=>{
 let {db,kv}=setup({ready:false});assert.equal((await claimHandle(db,kv,'unused','account:a','account')).status,503);
 const x=setup();assert.equal((await claimHandle(x.db,x.kv,'mike','account:a','account')).status,409);
 const key=await addressKey('@historical');x.sql.prepare('INSERT INTO loom_handle_legacy_keys VALUES (?)').run(key);
 assert.equal((await claimHandle(x.db,x.kv,'historical','account:a','account')).status,409);
 x.values.set('loom:out:'+await addressKey('@older'),'[]');assert.equal((await claimHandle(x.db,x.kv,'older','account:a','account')).status,409);
});
test('guest use and claim serialize; explicit and implicit impersonation refused',async()=>{
 const {db,kv}=setup();await authorizeHandle(db,sender,undefined,null);
 assert.equal((await claimHandle(db,kv,'newname','account:a','account')).status,409);
 await claimHandle(db,kv,'claimed','account:a','account');
 for(const raw of ['@claimed',' @Claimed ',undefined]){
  const from={...sender,name:'claimed'};assert.equal((await authorizeHandle(db,from,raw,null)).status,403);
 }
 const good=await authorizeHandle(db,sender,'@claimed','account:a');assert.equal(good.from.claimed.proof,'account');assert.equal(good.from.address,'@claimed');
 assert.equal(JSON.stringify(good.from).includes('account:a'),false);
});
test('claim endpoint requires account proof and same-origin; no forged badge or principal',async()=>{
 const {env}=setup();const path='https://pointcast.xyz/api/loom/handles';
 for(const headers of [{},{cookie:'pc_session=wrong'},{cookie:'pc_session=session-a',origin:'https://evil.test'}]){
  const r=await endpoint({env,request:request({handle:'safe',principal:'account:user-a'},headers,path)});assert.ok([401,403].includes(r.status));
 }
 const r=await endpoint({env,request:request({handle:'safe'},signedIn,path)});assert.equal(r.status,200);assert.equal((await r.json()).claim.handle,'@safe');
 const get=await endpoint({env,request:new Request(path,{headers:signedIn})});assert.equal((await get.json()).claim.handle,'@safe');
});
test('wrapper enforces claims, strips forged marks, and does not authenticate old posts',async()=>{
 const {env,db,kv}=setup();await claimHandle(db,kv,'claimed','account:user-a','account');
 const body={to:'#test',from:{name:'Person',address:'@claimed',kind:'human',claimed:{handle:'@fake'}},body:'hello'};
 assert.equal((await loom({env,request:request(body)})).status,403);
 const good=await loom({env,request:request(body,signedIn)});assert.equal(good.status,201);const d=await good.json();assert.equal(d.message.from.claimed.handle,'@claimed');
 const edit={action:'edit',to:d.address,token:d.editToken,body:'updated'};
 assert.equal((await loom({env,request:request(edit)})).status,403);
 assert.equal((await loom({env,request:request(edit,signedIn)})).status,200);
 const guest=await loom({env,request:request({...body,from:{name:'Guest',claimed:{handle:'@claimed',proof:'account'},verified:true}})});
 assert.equal(guest.status,201);assert.equal((await guest.json()).message.from.claimed,undefined);
 env.LOOM_HANDLES_ENABLED='0';assert.equal((await loom({env,request:request(body)})).status,403);
});
test('missing database/schema fail closed; partial signatures never become guest posts',async()=>{
 const x=setup(),body={to:'#test',from:{name:'Guest'},body:'hello'};
 assert.equal((await loom({env:{PC_LOOM_KV:x.kv},request:request(body)})).status,503);
 x.sql.exec('DROP TABLE loom_handles');assert.equal((await loom({env:x.env,request:request(body)})).status,503);
 assert.equal((await loom({env:x.env,request:request(body,{'PointCast-Agent-Timestamp':new Date().toISOString()})})).status,401);
});
async function agentFixture(x){
 const keys=await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);const id='pci_'+'a'.repeat(32);const pub=Buffer.from(await crypto.subtle.exportKey('raw',keys.publicKey)).toString('base64');
 x.sql.prepare("INSERT INTO agent_challenges(id,purpose,proposal_json,payload,created_at,expires_at) VALUES ('challenge-a','register','{}','fixture',?,?)").run(new Date().toISOString(),new Date(Date.now()+60000).toISOString());
 x.sql.prepare("INSERT INTO agent_keys(key_id,agent_id,public_key,operator,scopes_json,expires_at,status,created_at,registered_challenge_id) VALUES (?,?,?,?,?,?,?,?,?)").run('key-a',id,pub,'self-declared',JSON.stringify(['loom:claim','loom:append']),new Date(Date.now()+3600000).toISOString(),'active',new Date().toISOString(),'challenge-a');
 const signed=async(body,action='loom.append',timestamp=new Date().toISOString())=>{
  const hash=await hashAgentActionRequest(action,body);const sig=Buffer.from(await crypto.subtle.sign('Ed25519',keys.privateKey,new TextEncoder().encode(buildAgentRequestPayload(id,timestamp,hash)))).toString('base64');
  return {'PointCast-Agent-Id':id,'PointCast-Agent-Timestamp':timestamp,'PointCast-Agent-Signature':sig};};return {id,signed};
}
test('agent claim/signature, body substitution, canonical replay and revocation',async()=>{
 const x=setup();const {id,signed}=await agentFixture(x);const claimBody={handle:'agent-one'};
 const r=await endpoint({env:x.env,request:request(claimBody,await signed(claimBody,'loom.claim'),'https://pointcast.xyz/api/loom/handles')});assert.equal(r.status,200);
 const body={to:'#test',from:{name:'Bot',kind:'agent',address:'@agent-one'},body:'I am an AI agent.'};const headers=await signed(body);
 assert.equal((await loom({env:x.env,request:request({...body,body:'tampered'},headers)})).status,401);
 const first=await loom({env:x.env,request:request(body,headers)});assert.equal(first.status,201);const msg=await first.json();assert.equal(msg.message.from.address,'@agent-one');assert.equal(msg.message.from.claimed.proof,'agent_key');
 assert.equal((await loom({env:x.env,request:request(body,headers)})).status,409);
 const alternate={...headers,'PointCast-Agent-Timestamp':headers['PointCast-Agent-Timestamp'].replace('Z','+00:00')};assert.equal((await loom({env:x.env,request:request(body,alternate)})).status,409);
 x.sql.exec("UPDATE agent_keys SET status='revoked'");assert.equal((await loom({env:x.env,request:request(body,await signed(body))})).status,401);
});
test('expired sessions do not prove ownership',async()=>{
 const x=setup();x.sql.exec('UPDATE sessions SET expires_at=0');assert.equal((await endpoint({env:x.env,request:request({handle:'safe'},signedIn,'https://pointcast.xyz/api/loom/handles')})).status,401);
});
test('incoming inboxes and ripple destinations reserve before their first write',async()=>{
 const x=setup();const r=await loom({env:x.env,request:request({to:'@incoming',from:{name:'Visitor'},body:'hello @mentioned'})});assert.equal(r.status,201);
 for(const name of ['incoming','mentioned'])assert.equal((await claimHandle(x.db,x.kv,name,'account:other','account')).status,409);
});
test('a destination reservation winning during a claim history read defeats the claim',async()=>{
 const x=setup();const {reserveDestinations}=await import('../src/lib/loom/handles.mjs');let once=false;
 const kv={get:async()=>{if(!once){once=true;await reserveDestinations(x.db,['@racing']);}return null;}};
 assert.equal((await claimHandle(x.db,kv,'racing','account:a','account')).status,409);
 assert.equal(x.sql.prepare("SELECT principal FROM loom_handles WHERE handle='racing'").get().principal,null);
});
test('oversized and malformed bodies are refused before authentication or storage',async()=>{
 const x=setup();for(const handler of [loom,endpoint]){
  const large=new Request('https://pointcast.xyz/api/loom',{method:'POST',body:JSON.stringify({body:'x'.repeat(17000)})});assert.equal((await handler({env:x.env,request:large})).status,413);
  assert.equal((await handler({env:x.env,request:request([])})).status,400);
 }
});
test('claimed withdrawal requires owner, and historical unsigned text never gains proof',async()=>{
 const x=setup();const old=await handleLoom(request({to:'#old',from:{name:'Old',address:'@old'},body:'unsigned'}),{kv:x.kv});assert.equal(old.status,201);
 assert.equal((await claimHandle(x.db,x.kv,'old','account:user-a','account')).status,409);
 const read=await handleLoom(new Request('https://pointcast.xyz/api/loom?to=%23old'),{kv:x.kv});assert.equal((await read.json()).messages[0].from.claimed,undefined);
 await claimHandle(x.db,x.kv,'owned','account:user-a','account');const made=await loom({env:x.env,request:request({to:'#test',from:{name:'Owner',address:'@owned'},body:'note'},signedIn)});const d=await made.json();
 const withdraw={action:'withdraw',to:d.address,token:d.editToken};assert.equal((await loom({env:x.env,request:request(withdraw)})).status,403);assert.equal((await loom({env:x.env,request:request(withdraw,signedIn)})).status,200);
});
test('claim creation pause does not block an owner read or disable ownership enforcement',async()=>{
 const x=setup();await claimHandle(x.db,x.kv,'owned','account:user-a','account');x.env.LOOM_HANDLES_ENABLED='0';
 const r=await endpoint({env:x.env,request:new Request('https://pointcast.xyz/api/loom/handles',{headers:signedIn})});const d=await r.json();assert.equal(d.claim.handle,'@owned');assert.equal(d.claimsOpen,false);
 assert.equal((await endpoint({env:x.env,request:request({handle:'new'},signedIn)})).status,503);
});
