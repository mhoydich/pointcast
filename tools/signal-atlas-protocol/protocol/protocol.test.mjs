import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { SPEC, SITE_IDS, SITE_REGISTRY, EVIDENCE_TIERS, canonicalJSON, canonicalSiteId, observationState, evidenceMeaning, sha256, participantKeyId, attemptMessage, validateChallenge, validateSignedAttempt, emptyState, decideSubmission, scoreTasks } from './protocol.mjs';

// Test-only ephemeral keys live in process memory. Never written to a file/account.
const keys = generateKeyPairSync('ed25519');
const rawKey = keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64url');
const now = Date.parse('2026-11-01T15:00:00.000Z');
function challenge(overrides = {}) {
  const c = { challenge_id: 'challenge-001', site_id: 'pointcast', season_id: 'season-001', task_id: 'citation-relay', task_version: 'v1', dataset_hash: sha256('fixture dataset'), issued_at: new Date(now - 1000).toISOString(), expires_at: new Date(now + 60000).toISOString(), terms_hash: sha256('fixture terms'), participant_key_id: participantKeyId(rawKey), data_mode: 'fixture', ...overrides };
  c.nonce = overrides.nonce ?? Buffer.from(sha256('fixture nonce:'+c.challenge_id),'hex').subarray(0,16).toString('base64url');
  return c;
}
function attempt(c = challenge(), overrides = {}) {
  const a = { ...c, attempt_id: 'attempt-001', public_key: rawKey, result_hash: sha256('fixture answer'), opt_in: true, signature: '', ...overrides };
  a.signature = sign(null, Buffer.from(attemptMessage(a)), keys.privateKey).toString('base64url');
  return a;
}
function event(overrides = {}) {
  // Hypothetical internal adjudications for reducer tests; never exported as traffic.
  return { site_id: 'pointcast', season_id: 'season-001', rubric_version: 'v1', participant_key_id: participantKeyId(rawKey), task_id: 'citation-relay', task_version: 'v1', receipt_id: 'receipt-001', accepted_at: new Date(now).toISOString(), data_mode: 'live', fixture: false, provenance: 'server_adjudicated', participation: 'signed_opt_in', outcome: 'accepted', judgment_verified: true, ...overrides };
}
const options = { seasonId: 'season-001', allowedTasks: [ {site_id: 'pointcast', task_id: 'citation-relay', task_version: 'v1'}, {site_id: 'pointcast', task_id: 'citation-relay', task_version: 'v2'}, ...['task-2', 'task-3', 'task-4'].map(task_id => ({site_id: 'pointcast', task_id, task_version: 'v1'})) ] };

test('protocol has a domain-separated version', () => assert.equal(SPEC, 'pointcast.league-attempt/v1'));
test('canonical site IDs are explicit and stable', () => assert.deepEqual(SITE_IDS, ['pointcast', 'el-segundo', 'industry-next', 'ues']));
test('UES is an edition sharing PointCast measurement origin, not a new unique host', () => assert.equal(SITE_REGISTRY.ues.measurementOrigin, SITE_REGISTRY.pointcast.measurementOrigin));
test('unknown and display-name site IDs do not silently create sites', () => { for (const s of ['elsegundo', 'El Segundo', 'https://pointcast.xyz', '__proto__', 'constructor']) assert.throws(() => canonicalSiteId(s)); });
test('canonical object ordering is deterministic', () => assert.equal(canonicalJSON({ b: 2, a: { y: true, x: null } }), '{"a":{"x":null,"y":true},"b":2}'));
test('canonical serialization rejects ambiguity and unsupported values', () => { for (const v of [undefined, NaN, Infinity, 1.5, -0, 1n, new Date(), [undefined], {a: undefined}, Array(2)]) assert.throws(() => canonicalJSON(v)); });
test('array holes plus decorations cannot collide with an empty array',()=>{const a=[];a.length=1;a.decoration=7;assert.throws(()=>canonicalJSON(a));});
test('array symbols and hidden decorations are rejected',()=>{const a=[1];a[Symbol('hidden')]=2;assert.throws(()=>canonicalJSON(a));const b=[1];Object.defineProperty(b,'hidden',{value:2});assert.throws(()=>canonicalJSON(b));});
test('unknown data is null, never inferred zero', () => assert.deepEqual(observationState({availability: 'unavailable', count: 0, completeWindow: true}), {state: 'unknown', count: null}));
test('partial empty observations are unknown', () => assert.equal(observationState({availability: 'available', count: 0}).state, 'unknown'));
test('only a complete observed window can report no sightings in that window', () => assert.deepEqual(observationState({availability: 'available', count: 0, completeWindow: true}), {state: 'not_observed_in_window', count: 0}));
test('partial nonzero observations retain partial coverage', () => assert.equal(observationState({availability: 'available', count: 2}).completeness, 'partial'));
test('negative, non-finite and string counts are unknown', () => { for (const count of [-1, Infinity, NaN, '0']) assert.equal(observationState({availability: 'available', count, completeWindow: true}).state, 'unknown'); });
test('string complete flags cannot establish a complete observation window', () => assert.equal(observationState({availability:'available',count:0,completeWindow:'true'}).state,'unknown'));
test('evidence tiers never enroll ordinary crawlers in a league', () => { for (const t of ['claimed_ua','network_verified','provider_signed']) assert.equal(evidenceMeaning(t).leagueParticipation, false); });
test('a claimed UA and self-issued signature do not verify provider identity', () => { for (const t of ['claimed_ua','signed_opt_in','network_verified']) assert.equal(evidenceMeaning(t).providerIdentityVerified, false); });
test('all documented tiers have labels; unknown tiers fail closed', () => { for (const t of EVIDENCE_TIERS) assert.ok(evidenceMeaning(t).label); assert.throws(() => evidenceMeaning('verified-because-googlebot')); });
test('well-formed fixture challenge validates', () => assert.equal(validateChallenge(challenge()), true));
test('challenge lifetime is capped at two minutes', () => assert.equal(validateChallenge(challenge({expires_at: new Date(now + 180000).toISOString()})), false));
test('canonical base64url is required for nonces', () => assert.equal(validateChallenge(challenge({nonce: 'AAAA='})), false));
test('invalid real calendar dates are rejected', () => assert.equal(validateChallenge(challenge({issued_at: '2026-02-31T00:00:00.000Z'})), false));
test('unknown fields cannot be smuggled into a challenge', () => assert.equal(validateChallenge(challenge({provider: 'OpenAI'})), false));
test('valid Ed25519 proof verifies key possession, not provider identity', () => { const c = challenge(); const p = validateSignedAttempt(attempt(c), c, now); assert.equal(p.ok, true); assert.equal(p.providerIdentityVerified, false); });
test('explicit signed opt-in is mandatory', () => { const c = challenge(); assert.equal(validateSignedAttempt(attempt(c, {opt_in: false}), c, now).code, 'explicit-opt-in-required'); });
for (const field of ['site_id','season_id','task_id','task_version','dataset_hash','terms_hash','nonce','participant_key_id','data_mode']) {
  test(`signature cannot cross an authoritative ${field} boundary`, () => { const c = challenge(); const a = attempt(c, {[field]: field.endsWith('hash') || field === 'participant_key_id' ? 'a'.repeat(64) : 'changed'}); assert.equal(validateSignedAttempt(a, c, now).code, 'challenge-context-mismatch'); });
}
test('altering a result hash breaks the signature', () => { const c = challenge(), a = attempt(c); a.result_hash = sha256('tampered'); assert.equal(validateSignedAttempt(a, c, now).code, 'invalid-signature'); });
test('a different public key is rejected', () => { const c = challenge(), a = attempt(c); a.public_key = Buffer.alloc(32, 1).toString('base64url'); assert.equal(validateSignedAttempt(a, c, now).code, 'participant-key-mismatch'); });
test('expired and not-yet-valid challenges fail closed', () => { const c = challenge(), a = attempt(c); assert.equal(validateSignedAttempt(a, c, now + 60000).ok, false); assert.equal(validateSignedAttempt(a, c, now - 2000).ok, false); });
test('malformed and truncated signatures fail closed', () => { const c = challenge(), a = attempt(c); a.signature = 'bad'; assert.equal(validateSignedAttempt(a, c, now).ok, false); });
test('extra attempt fields fail closed', () => { const c = challenge(); assert.equal(validateSignedAttempt({...attempt(c), forged: true}, c, now).ok, false); });
test('initial receipt is unreviewed and unranked even when signed', () => { const c = challenge(), r = decideSubmission(emptyState(), attempt(c), c, now); assert.equal(r.status, 201); assert.equal(r.receipt.status, 'received_unreviewed'); assert.equal(r.receipt.ranked, false); });
test('submission decisions do not mutate their input state', () => { const s = emptyState(), c = challenge(); decideSubmission(s, attempt(c), c, now); assert.deepEqual(s, emptyState()); });
test('returned receipt cannot be mutated into a ranked award', () => {const c=challenge(),r=decideSubmission(emptyState(),attempt(c),c,now);assert.throws(()=>{r.receipt.ranked=true;});assert.equal(r.receipt.ranked,false);});
test('identical retry returns the original receipt, including after expiry', () => { const c = challenge(), a = attempt(c), r = decideSubmission(emptyState(), a, c, now); const retry = decideSubmission(r.nextState, a, c, now + 100000); assert.equal(retry.code, 'idempotent-retry'); assert.deepEqual(retry.receipt, r.receipt); assert.equal(retry.nextState, undefined); });
test('same idempotency identity with a different body is a conflict', () => { const c = challenge(), a = attempt(c), r = decideSubmission(emptyState(), a, c, now); assert.equal(decideSubmission(r.nextState, attempt(c, {result_hash: sha256('different')}), c, now).code, 'idempotency-conflict'); });
test('fresh attempt ID cannot reuse a consumed challenge', () => { const c = challenge(), r = decideSubmission(emptyState(), attempt(c), c, now); assert.equal(decideSubmission(r.nextState, attempt(c, {attempt_id: 'attempt-002'}), c, now).code, 'challenge-already-consumed'); });
test('same nonce under a different challenge ID is rejected',()=>{const c=challenge(),r=decideSubmission(emptyState(),attempt(c),c,now);const c2=challenge({challenge_id:'challenge-002',nonce:c.nonce});assert.equal(decideSubmission(r.nextState,attempt(c2,{attempt_id:'attempt-002'}),c2,now).code,'nonce-already-consumed');});
test('fixture and live challenges/idempotency/nonces are separate namespaces',()=>{const fixture=challenge(),r=decideSubmission(emptyState(),attempt(fixture),fixture,now);const live=challenge({data_mode:'live'});const l=decideSubmission(r.nextState,attempt(live),live,now);assert.equal(l.status,201);assert.notEqual(l.receipt.receipt_id,r.receipt.receipt_id);});
test('two participants choosing the same client attempt ID receive distinct receipt IDs',()=>{const c=challenge(),r=decideSubmission(emptyState(),attempt(c),c,now);const pair=generateKeyPairSync('ed25519'),pub=pair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url');const c2=challenge({challenge_id:'challenge-002',participant_key_id:participantKeyId(pub)});const a=attempt(c2,{public_key:pub});a.signature=sign(null,Buffer.from(attemptMessage(a)),pair.privateKey).toString('base64url');const r2=decideSubmission(r.nextState,a,c2,now);assert.equal(r2.status,201);assert.equal(r2.receipt.submission_id,r.receipt.submission_id);assert.notEqual(r2.receipt.receipt_id,r.receipt.receipt_id);});
test('inherited object names are not mistaken for used challenges or attempts', () => { const c = challenge({challenge_id:'constructor'}); assert.equal(decideSubmission(emptyState(), attempt(c,{attempt_id:'constructor'}), c, now).status, 201); });
test('participant cap is bounded and retry does not spend another slot', () => { let s=emptyState(); for (let n=1;n<=4;n++) {const c=challenge({challenge_id:`challenge-${n}`}), a=attempt(c,{attempt_id:`attempt-${n}`}), r=decideSubmission(s,a,c,now); if(n<=3) {assert.equal(r.status,201);s=r.nextState;assert.equal(decideSubmission(s,a,c,now).status,200);} else assert.equal(r.status,429);} });
test('global cap applies before adding another attempt', () => { const c=challenge(), r=decideSubmission(emptyState(),attempt(c),c,now,{globalDaily:1}); const c2=challenge({challenge_id:'challenge-002'}); assert.equal(decideSubmission(r.nextState,attempt(c2,{attempt_id:'attempt-002'}),c2,now,{globalDaily:1}).status,429); });
test('invalid quota configuration fails closed', () => assert.throws(() => decideSubmission(emptyState(),attempt(),challenge(),now,{globalDaily:Infinity})));
test('request-size cap rejects oversized values before verification', () => { const c=challenge(), a=attempt(c);a.public_key='a'.repeat(9000);assert.equal(decideSubmission(emptyState(),a,c,now).status,413); });
test('no manifest means no score', () => assert.equal(scoreTasks([event()],{seasonId:'season-001'}).total,0));
test('one accepted unique useful task earns one point', () => assert.equal(scoreTasks([event()],options).total,1));
test('demo and fixture records never enter live scoring', () => assert.equal(scoreTasks([event({data_mode:'fixture'}), event({fixture:true,receipt_id:'r2'})],options).total,0));
test('missing or malformed fixture provenance fails closed', () => {for(const fixture of [undefined,'false',null])assert.equal(scoreTasks([event({fixture})],options).total,0);});
test('malformed manifest entries do not crash or admit unlisted tasks', () => assert.equal(scoreTasks([event()],{...options,allowedTasks:[{site_id:'pointcast'},null,{site_id:'pointcast',task_id:1,task_version:'v1'}]}).total,0));
test('UA, network and provider-signed crawler observations earn zero points', () => { for(const participation of ['claimed_ua','network_verified','provider_signed']) assert.equal(scoreTasks([event({participation})],options).total,0); });
test('unreviewed and self-asserted outcomes do not score', () => { for(const patch of [{outcome:'received_unreviewed'},{judgment_verified:false},{provenance:'client_claimed'}]) assert.equal(scoreTasks([event(patch)],options).total,0); });
test('wrong season, rubric, site and task versions do not score', () => { for(const patch of [{season_id:'other'},{rubric_version:'v2'},{site_id:'elsegundo'},{task_version:'v999'}]) assert.equal(scoreTasks([event(patch)],options).total,0); });
test('duplicate receipts and repeated tasks do not inflate points', () => assert.equal(scoreTasks([event(),event(),event({receipt_id:'receipt-002'})],options).total,1));
test('task version changes cannot farm another point in one season', () => assert.equal(scoreTasks([event(),event({task_version:'v2',receipt_id:'receipt-002'})],options).total,1));
test('large request volume cannot increase score', () => assert.equal(scoreTasks(Array.from({length:1000},(_,i)=>event({receipt_id:`r-${i}`})),options).total,1));
test('daily scored tasks are capped deterministically', () => { const events=[event(),...['task-2','task-3','task-4'].map((task_id,i)=>event({task_id,receipt_id:`r-${i}`}))];assert.equal(scoreTasks(events,options).total,3);assert.deepEqual(scoreTasks(events,options),scoreTasks([...events].reverse(),options)); });
test('no raw IP, geo, user-agent or legacy presence ID is in a submission receipt', () => { const c=challenge(),r=decideSubmission(emptyState(),attempt(c),c,now);for(const field of ['ip','ipHash','pid','city','region','userAgent'])assert.equal(Object.hasOwn(r.receipt,field),false); });
