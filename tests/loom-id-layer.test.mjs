import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {createLink,redeemLink,checkHolder,saveHandoff,latestSave,setCard,getCard,checkSpend,LINK_TTL_MS} from '../src/lib/loom/id-layer.mjs';
function setup(){
  const sql=new DatabaseSync(':memory:');
  for(const f of ['0035_loom_handles.sql','0036_loom_id_layer.sql'])sql.exec(readFileSync(new URL('../migrations/auth/'+f,import.meta.url),'utf8'));
  sql.prepare("INSERT INTO loom_handles VALUES ('ada','user-m','account','2026-11-16T00:00:00Z')").run();
  const db={prepare(q){let a=[];return{bind(...x){a=x;return this},async first(){return sql.prepare(q).get(...a)??null},async run(){const r=sql.prepare(q).run(...a);return{meta:{changes:Number(r.changes)}}}}}};
  return {db,sql};
}
test('only the owner makes links; links are single use and hashed',async()=>{
  const {db,sql}=setup();
  assert.equal((await createLink(db,{handle:'@ada',kind:'claim',principal:'someone-else'})).status,403);
  const l=await createLink(db,{handle:'@ada',kind:'claim',principal:'user-m'});
  assert.ok(l.token);assert.equal(sql.prepare('SELECT count(*) n FROM loom_id_links WHERE token_hash=?').get(l.token).n,0);
  const a=await redeemLink(db,{token:l.token,session:'s1'});assert.equal(a.holder.epoch,1);
  assert.equal((await redeemLink(db,{token:l.token,session:'s2'})).status,410);
});
test('links expire after ten minutes',async()=>{
  const {db}=setup();const now=1e12;
  const l=await createLink(db,{handle:'ada',kind:'claim',principal:'user-m',now});
  assert.equal((await redeemLink(db,{token:l.token,session:'s1',now:now+LINK_TTL_MS+1})).status,410);
});
test('continue moves the handle and ends the old holder; save resumes',async()=>{
  const {db}=setup();
  await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'claim',principal:'user-m'})).token,session:'s1'});
  assert.ok((await saveHandoff(db,{handle:'ada',session:'s1',note:'left off: PR 1724 tests green',branch:'ada/off60'})).saved);
  const c=await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'continue',principal:'user-m'})).token,session:'s2'});
  assert.equal(c.holder.epoch,2);assert.match(c.resume.note,/left off/);
  assert.equal((await checkHolder(db,'ada','s1')).error,'holder_moved');
  assert.equal((await saveHandoff(db,{handle:'ada',session:'s1',note:'stale'})).status,409);
  assert.ok((await checkHolder(db,'ada','s2')).ok);
});
test('saves refuse things that look like secrets',async()=>{
  const {db}=setup();
  await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'claim',principal:'user-m'})).token,session:'s1'});
  assert.equal((await saveHandoff(db,{handle:'ada',session:'s1',note:'key is sk-abc123'})).error,'looks_like_a_secret');
});
test('fork starts from the latest save and the original keeps working',async()=>{
  const {db}=setup();
  await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'claim',principal:'user-m'})).token,session:'s1'});
  await saveHandoff(db,{handle:'ada',session:'s1',note:'handles step one done'});
  const f=await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'fork',forkName:'ada-ids',principal:'user-m'})).token,session:'s9'});
  assert.equal(f.forkedFrom,'@ada');assert.match((await latestSave(db,'ada-ids')).note,/Forked from @ada/);
  assert.ok((await checkHolder(db,'ada','s1')).ok);assert.ok((await checkHolder(db,'ada-ids','s9')).ok);
  assert.equal((await createLink(db,{handle:'ada',kind:'fork',forkName:'ada-ids',principal:'user-m'})).status,409);
});
test('desk card is owner-set and shows fork lineage',async()=>{
  const {db}=setup();
  assert.equal((await setCard(db,{handle:'ada',principal:'x',never:'merge'})).status,403);
  await setCard(db,{handle:'ada',principal:'user-m',never:'merges, deploys, mints, spends',approver:'Mike, in his own chat'});
  await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'claim',principal:'user-m'})).token,session:'s1'});
  await redeemLink(db,{token:(await createLink(db,{handle:'ada',kind:'fork',forkName:'ada-2',principal:'user-m'})).token,session:'s2'});
  assert.ok((await setCard(db,{handle:'ada-2',principal:'user-m',never:'same as ada'})).card);
  assert.equal((await getCard(db,'ada-2')).forkedFrom,'@ada');
  assert.equal((await getCard(db,'ada')).approver,'Mike, in his own chat');
});

test('card carries goal, lessons, spend line and a public wallet address; spend checks the ceiling',async()=>{
  const {db}=setup();
  assert.equal((await setCard(db,{handle:'ada',principal:'user-m',never:'x',spendLimitUsd:20})).error,'spend_limit_needs_period');
  assert.equal((await setCard(db,{handle:'ada',principal:'user-m',never:'x',walletAddress:'edskSecretKeyHere'})).error,'wallet_address_only');
  const {card}=await setCard(db,{handle:'ada',principal:'user-m',never:'mainnet mints',approver:'Mike',goal:'keep After Hours shipping',lessons:'stamp last; answer first',spendLimitUsd:20,spendPeriodDays:30,walletAddress:'tz1ExamplePublicAddress'});
  assert.equal(card.goal,'keep After Hours shipping');assert.deepEqual(card.spend,{limitUsd:20,periodDays:30});
  assert.ok(checkSpend(card,{amountUsd:5,spentThisPeriodUsd:10}).ok);
  assert.equal(checkSpend(card,{amountUsd:15,spentThisPeriodUsd:10}).needs,'approver');
  assert.equal(checkSpend({spend:null},{amountUsd:1}).reason,'no_spend_line');
});
