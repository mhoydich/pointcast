import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest as route} from '../functions/api/loom/id/[action].ts';
import {onRequest as loom} from '../functions/api/loom.ts';
import {createLink,redeemLink,checkHolder,saveHandoff,setCard,hashToken} from '../src/lib/loom/id-layer.mjs';
import {hashAgentActionRequest,buildAgentRequestPayload} from '../functions/_lib/agent-identity.ts';
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const f of ['0001_init.sql','0007_post_office_aliases.sql','0012_paid_action_intents.sql','0014_agent_contract.sql','0035_loom_handles.sql','0036_loom_id_layer.sql'])sql.exec(readFileSync(new URL('../migrations/auth/'+f,import.meta.url),'utf8'));
 const db={prepare(q){let a=[];return {bind(...v){a=v;return this},async first(){return sql.prepare(q).get(...a)??null},exec(){const r=sql.prepare(q).run(...a);return {meta:{changes:Number(r.changes)}}},async run(){return this.exec()}}},async batch(ss){sql.exec('BEGIN');try{const r=ss.map(s=>s.exec());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 for(const name of ['a','b']){const user={userId:'user-'+name,preferredName:name,identities:[],roles:[],createdAt:new Date().toISOString()};sql.prepare('INSERT INTO users(id,payload,created_at) VALUES (?,?,?)').run(user.userId,JSON.stringify(user),user.createdAt);}
 for(const [token,user] of [['session-a','user-a'],['second-a','user-a'],['session-b','user-b']])sql.prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES (?,?,?)').run(token,user,Date.now()+3600000);
 sql.prepare('INSERT INTO loom_handles VALUES (?,?,?,?)').run('seat','account:user-a','account',new Date().toISOString());
 const values=new Map(),kv={get:async k=>values.get(k)??null,put:async(k,v)=>values.set(k,v)};
 return {sql,db,values,env:{AUTH_DB:db,PC_LOOM_KV:kv,LOOM_ID_ENABLED:'1'}};
}
function request(path,body,session='session-a',headers={}) {return new Request('https://pointcast.xyz'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(session?{cookie:'pc_session='+session,Origin:'https://pointcast.xyz'}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});}
const call=(x,action,body,session='session-a',headers={})=>route({env:x.env,params:{action},request:request('/api/loom/id/'+action,body,session,headers)});
const append=(x,session='session-a',extra={},headers={})=>loom({env:x.env,request:request('/api/loom',{to:'#test',from:{name:'Seat',kind:'agent',address:'@seat',...extra},body:'I am an AI agent.'},session,headers)});
async function take(x,session='session-a'){const link=await (await call(x,'link',{handle:'seat',kind:'claim'})).json();return call(x,'redeem',{token:link.token},session);}
test('feature gate precedes body/storage; methods, JSON size, forged context and CSRF refused',async()=>{
 const x=setup();x.env.LOOM_ID_ENABLED='0';x.env.AUTH_DB={prepare(){throw Error('must not read')}};
 assert.equal((await call(x,'seat')).status,503);assert.equal((await call(x,'redeem',{token:'bad'})).status,503);
 const y=setup();assert.equal((await call(y,'link',{handle:'seat',kind:'claim'},null)).status,401);
 assert.equal((await call(y,'link',{handle:'seat',kind:'claim'},'session-a',{Origin:'https://evil.test'})).status,403);
 assert.equal((await call(y,'link',{handle:'seat',kind:'claim',principal:'account:user-a'})).status,400);
 assert.equal((await call(y,'redeem',{token:'x',session:'session-a'})).status,400);
 assert.equal((await call(y,'save',{note:'x'.repeat(9000)})).status,413);
 assert.equal((await call(y,'link',{handle:'seat',kind:'claim'},'session-a',{'Content-Type':'text/plain'})).status,415);
 assert.equal((await route({env:y.env,params:{action:'redeem'},request:request('/api/loom/id/redeem?token=secret',{},'session-a')})).status,400);
});
test('only owner creates links; public reads never leak owner, holder or transfer credentials',async()=>{
 const x=setup();assert.equal((await call(x,'link',{handle:'seat',kind:'claim'},'session-b')).status,403);
 const r=await call(x,'link',{handle:'seat',kind:'claim'});assert.equal(r.headers.get('cache-control'),'no-store');const link=await r.json();assert.match(link.token,/^[a-f0-9]{48}$/);
 assert.equal((await call(x,'redeem',{token:link.token},'session-b')).status,200);
 const publicCard=await call(x,'seat',undefined,null),body=await publicCard.text();assert.equal(publicCard.status,200);
 for(const secret of ['session-b','user-a',link.token,'holder'])assert(!body.includes(secret));
 assert.equal((await call(x,'unknown',undefined,null)).status,404);
 assert.equal((await call(x,'link',{handle:'seat',kind:'fork'})).status,400);
});
test('redeemed session can post, original owner cannot; handover revokes old holder even with flag off',async()=>{
 const x=setup();assert.equal((await append(x)).status,403);assert.equal((await take(x,'session-b')).status,200);
 await setCard(x.db,{handle:'seat',principal:'account:user-a',never:'merge <script>',approver:'Mike'});
 const good=await append(x,'session-b',{card:{never:'forged'}});assert.equal(good.status,201);const msg=await good.json();assert.equal(msg.message.from.card.never,'merge <script>');assert.equal(msg.message.from.claimed.epoch,1);
 assert.equal((await append(x,'session-a')).status,409);
 const next=await (await call(x,'link',{handle:'seat',kind:'continue'})).json();assert.equal((await call(x,'redeem',{token:next.token},'second-a')).status,200);
 assert.equal((await append(x,'session-b')).status,409);assert.equal((await append(x,'second-a')).status,201);
 x.env.LOOM_ID_ENABLED='0';assert.equal((await append(x,'session-b')).status,409);assert.equal((await append(x,'second-a')).status,201);
 const edit={action:'edit',to:msg.address,token:msg.editToken,body:'update'};
 assert.equal((await loom({env:x.env,request:request('/api/loom',edit,'session-b')})).status,409);
 assert.equal((await loom({env:x.env,request:request('/api/loom',edit,'second-a')})).status,200);
});
test('expired credentials, missing schema, and unauthenticated spoofing fail closed',async()=>{
 const x=setup();await take(x);x.sql.exec("UPDATE sessions SET expires_at=0 WHERE token='session-a'");assert.equal((await append(x)).status,403);
 const y=setup();y.sql.exec('DROP TABLE loom_id_holders');assert.equal((await append(y)).status,503);
 const guest=await loom({env:setup().env,request:request('/api/loom',{to:'#t',from:{name:'Guest',claimed:{handle:'@seat'},card:{never:'fake'}},body:'hello'},null)});
 assert.equal(guest.status,201);const data=await guest.json();assert.equal(data.message.from.claimed,undefined);assert.equal(data.message.from.card,undefined);
});
test('single-use redemption is atomic and rolls back if holder write fails',async()=>{
 const x=setup(),l=await createLink(x.db,{handle:'seat',kind:'claim',principal:'account:user-a'});
 x.sql.exec("CREATE TRIGGER fail_holder BEFORE INSERT ON loom_id_holders BEGIN SELECT RAISE(ABORT,'fixture'); END");
 await assert.rejects(redeemLink(x.db,{token:l.token,session:'holder'}));assert.equal(x.sql.prepare('SELECT used_at FROM loom_id_links').get().used_at,null);
 x.sql.exec('DROP TRIGGER fail_holder');const result=await Promise.all([redeemLink(x.db,{token:l.token,session:'a'}),redeemLink(x.db,{token:l.token,session:'b'})]);
 assert.equal(result.filter(r=>r.holder).length,1);assert.equal(result.filter(r=>r.status===410).length,1);
});
test('handover invalidates other unused links; saves validate fields and reject old epochs',async()=>{
 const x=setup();await take(x);
 for(const fields of [{note:'sk-private'},{note:'ok',memoryRef:{}},{note:'ok',branch:'x'.repeat(121)},{note:'pcs_secret'},{note:'ok',memoryRef:'https://x/?token='+'a'.repeat(48)}])assert.equal((await call(x,'save',{handle:'seat',...fields})).status,400);
 const save=await call(x,'save',{handle:'seat',note:'left off here',branch:'ada/id'});assert.equal(save.status,200);
 const l1=await createLink(x.db,{handle:'seat',kind:'continue',principal:'account:user-a'}),l2=await createLink(x.db,{handle:'seat',kind:'continue',principal:'account:user-a'});
 await redeemLink(x.db,{token:l2.token,session:'new'});assert.equal((await redeemLink(x.db,{token:l1.token,session:'old'})).status,410);
 assert.equal((await call(x,'save',{handle:'seat',note:'stale'})).status,409);
 const pub=await (await call(x,'seat',undefined,null)).json();assert.equal(pub.save.note,'left off here');
});
test('save INSERT rechecks holder and epoch after initial authorization',async()=>{
 const x=setup();await take(x);const holder='session:'+await hashToken('session-a');const original=x.db.prepare;
 x.db.prepare=q=>{if(q.startsWith('INSERT INTO loom_id_saves'))x.sql.exec("UPDATE loom_id_holders SET holder='new',epoch=epoch+1");return original(q)};
 assert.equal((await saveHandoff(x.db,{handle:'seat',session:holder,note:'stale'})).status,409);assert.equal(x.sql.prepare('SELECT count(*) n FROM loom_id_saves').get().n,0);
});
async function agent(x){
 const keys=await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']),id='pci_'+'a'.repeat(32),pub=Buffer.from(await crypto.subtle.exportKey('raw',keys.publicKey)).toString('base64');
 x.sql.prepare("INSERT INTO agent_challenges(id,purpose,proposal_json,payload,created_at,expires_at) VALUES ('c','register','{}','fixture',?,?)").run(new Date().toISOString(),new Date(Date.now()+3600000).toISOString());
 x.sql.prepare('INSERT INTO agent_keys(key_id,agent_id,public_key,operator,scopes_json,expires_at,status,created_at,registered_challenge_id) VALUES (?,?,?,?,?,?,?,?,?)').run('key-a',id,pub,'fixture',JSON.stringify(['loom:id:redeem','loom:id:save','loom:append']),new Date(Date.now()+3600000).toISOString(),'active',new Date().toISOString(),'c');
 return async(body,action)=>{const t=new Date().toISOString(),hash=await hashAgentActionRequest(action,body);return {'PointCast-Agent-Id':id,'PointCast-Agent-Timestamp':t,'PointCast-Agent-Signature':Buffer.from(await crypto.subtle.sign('Ed25519',keys.privateKey,new TextEncoder().encode(buildAgentRequestPayload(id,t,hash)))).toString('base64')}};
}
test('runner key authenticates holder; signatures bind action/body, reject replay and revocation',async()=>{
 const x=setup(),sign=await agent(x),link=await (await call(x,'link',{handle:'seat',kind:'claim'})).json(),body={token:link.token},headers=await sign(body,'loom.id.redeem');
 assert.equal((await call(x,'redeem',{token:'a'.repeat(48)},null,headers)).status,401);
 assert.equal((await call(x,'redeem',body,null,headers)).status,200);
 assert.equal((await call(x,'redeem',body,null,headers)).status,409);
 const post={to:'#test',from:{name:'Bot',kind:'agent',address:'@seat'},body:'AI agent test.'};
 const r=await loom({env:x.env,request:request('/api/loom',post,null,await sign(post,'loom.append'))});assert.equal(r.status,201);assert.equal((await r.json()).message.from.claimed.proof,'agent_key');
 // A new key version for the same agent does not inherit the old holder.
 x.sql.exec("UPDATE agent_keys SET key_id='rotated-key'");
 const rotated=await loom({env:x.env,request:request('/api/loom',post,null,await sign(post,'loom.append'))});assert.equal(rotated.status,409);
 const transfer=await (await call(x,'link',{handle:'seat',kind:'continue'})).json(),redeem={token:transfer.token};
 assert.equal((await call(x,'redeem',redeem,null,await sign(redeem,'loom.id.redeem'))).status,200);
 const newPost={...post,body:'New key holder.'};assert.equal((await loom({env:x.env,request:request('/api/loom',newPost,null,await sign(newPost,'loom.append'))})).status,201);
 x.sql.exec("UPDATE agent_keys SET status='revoked'");assert.equal((await call(x,'save',{handle:'seat',note:'test'},null,await sign({handle:'seat',note:'test'},'loom.id.save'))).status,401);
});
