// Independent fixed-invariant tests; keys remain in process memory only.
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalJSON,sha256,participantKeyId,attemptMessage,decideSubmission,emptyState,scoreTasks} from '../protocol/protocol.mjs';
const now=Date.parse('2026-11-01T15:00:00.000Z');
const keys=generateKeyPairSync('ed25519');
const pub=keys.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url');
function challenge(mode,id){return {challenge_id:id,site_id:'pointcast',season_id:'s1',task_id:'t1',task_version:'v1',dataset_hash:sha256('data'),nonce:Buffer.alloc(16,7).toString('base64url'),issued_at:new Date(now-1000).toISOString(),expires_at:new Date(now+60000).toISOString(),terms_hash:sha256('terms'),participant_key_id:participantKeyId(pub),data_mode:mode};}
function attempt(c,id='a1'){const a={...c,attempt_id:id,public_key:pub,result_hash:sha256('answer'),opt_in:true,signature:''};a.signature=sign(null,Buffer.from(attemptMessage(a)),keys.privateKey).toString('base64url');return a;}
const fixture=challenge('fixture','fixture-c1');
const initial=decideSubmission(emptyState(),attempt(fixture),fixture,now);assert.equal(initial.status,201);
const live=challenge('live','live-c1');
assert.equal(decideSubmission(initial.nextState,attempt(live),live,now).status,201);
console.log('FIX VERIFIED: fixture/live namespace isolation');
const c2=challenge('live','live-c2');
const r1=decideSubmission(emptyState(),attempt(live),live,now);
assert.equal(decideSubmission(r1.nextState,attempt(c2,'a2'),c2,now).code,'nonce-already-consumed');
console.log('FIX VERIFIED: independent nonce consumption');
const a=[];a.length=1;a.decoration=7;
assert.throws(()=>canonicalJSON(a));
console.log('FIX VERIFIED: sparse/decorated array rejection');
