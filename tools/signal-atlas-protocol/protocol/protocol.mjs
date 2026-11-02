// Offline protocol core. No network, storage, timers, environment or account access.
// These reducers require a trusted server adapter before any live use.
import { createHash, createPublicKey, verify } from 'node:crypto';

export const SPEC = 'pointcast.league-attempt/v1';
export const SITE_REGISTRY = Object.freeze({
  pointcast: Object.freeze({ label: 'PointCast', origin: 'https://pointcast.xyz', path: '/', measurementOrigin: 'pointcast' }),
  'el-segundo': Object.freeze({ label: 'El Segundo', origin: 'https://elsegundo.xyz', path: '/', measurementOrigin: 'el-segundo' }),
  'industry-next': Object.freeze({ label: 'Industry Next', origin: 'https://www.industrynext.xyz', path: '/', measurementOrigin: 'industry-next' }),
  ues: Object.freeze({ label: 'UES', origin: 'https://pointcast.xyz', path: '/ues/', measurementOrigin: 'pointcast' }),
});
export const SITE_IDS = Object.freeze(Object.keys(SITE_REGISTRY));
export const EVIDENCE_TIERS = Object.freeze(['demo', 'claimed_ua', 'network_verified', 'signed_opt_in', 'provider_signed']);
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const B64 = /^[A-Za-z0-9_-]+$/;
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
const CHALLENGE_FIELDS = Object.freeze(['challenge_id', 'site_id', 'season_id', 'task_id', 'task_version', 'dataset_hash', 'nonce', 'issued_at', 'expires_at', 'terms_hash', 'participant_key_id', 'data_mode']);
const ATTEMPT_FIELDS = Object.freeze([...CHALLENGE_FIELDS, 'attempt_id', 'public_key', 'result_hash', 'opt_in', 'signature']);

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function exact(value, fields) {
  return plain(value) && Object.keys(value).length === fields.length
    && fields.every(key => Object.hasOwn(value, key));
}
function validISO(value) { return typeof value === 'string' && ISO.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function bytes(value, size) {
  if (typeof value !== 'string' || !B64.test(value)) throw new TypeError('invalid-base64url');
  const out = Buffer.from(value, 'base64url');
  if (out.length !== size || out.toString('base64url') !== value) throw new TypeError('invalid-base64url');
  return out;
}

// Deliberately constrained canonical JSON, not a claim of full RFC 8785 support.
// Protocol numbers must be safe integers. Signed records contain no floats.
export function canonicalJSON(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.length !== value.length + 1 || !ownKeys.includes('length')) throw new TypeError('sparse-or-decorated-array');
    for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, String(i))) throw new TypeError('sparse-or-decorated-array');
    return '[' + value.map(canonicalJSON).join(',') + ']';
  }
  if (plain(value)) {
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError('symbol-key');
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
  }
  throw new TypeError('unsupported-canonical-value');
}
export function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
export function canonicalSiteId(value) {
  if (typeof value !== 'string' || !Object.hasOwn(SITE_REGISTRY, value)) throw new TypeError('unknown-site-id');
  return value;
}
export function observationState({ availability, count, completeWindow = false }) {
  if (typeof completeWindow !== 'boolean') return { state: 'unknown', count: null };
  if (availability !== 'available') return { state: 'unknown', count: null };
  if (!Number.isSafeInteger(count) || count < 0) return { state: 'unknown', count: null };
  if (count > 0) return { state: 'observed', count, completeness: completeWindow ? 'complete' : 'partial' };
  if (!completeWindow) return { state: 'unknown', count: null };
  return { state: 'not_observed_in_window', count: 0 };
}
export function evidenceMeaning(tier) {
  const meanings = {
    demo: { label: 'Demo example', providerIdentityVerified: false, leagueParticipation: false },
    claimed_ua: { label: 'Claims this user-agent', providerIdentityVerified: false, leagueParticipation: false },
    network_verified: { label: 'Verified provider network', providerIdentityVerified: false, providerNetworkVerified: true, leagueParticipation: false },
    signed_opt_in: { label: 'Signed opt-in participant', providerIdentityVerified: false, leagueParticipation: true },
    provider_signed: { label: 'Provider-key-signed request', providerIdentityVerified: true, leagueParticipation: false },
  };
  if (!Object.hasOwn(meanings, tier)) throw new TypeError('unknown-evidence-tier');
  return meanings[tier];
}

export function participantKeyId(publicKey) { return sha256(bytes(publicKey, 32)); }
export function attemptMessage(attempt) {
  if (!plain(attempt)) throw new TypeError('invalid-attempt');
  return `${SPEC}\n${canonicalJSON(Object.fromEntries(ATTEMPT_FIELDS.filter(key => key !== 'signature').map(key => [key, attempt[key]])))}\n`;
}
export function validateChallenge(challenge) {
  if (!exact(challenge, CHALLENGE_FIELDS)) return false;
  try { canonicalSiteId(challenge.site_id); } catch { return false; }
  if (!['fixture', 'live'].includes(challenge.data_mode)) return false;
  if (!['challenge_id', 'season_id', 'task_id', 'task_version'].every(key => typeof challenge[key] === 'string' && ID.test(challenge[key]))) return false;
  if (!['dataset_hash', 'terms_hash', 'participant_key_id'].every(key => typeof challenge[key] === 'string' && HASH.test(challenge[key]))) return false;
  try { bytes(challenge.nonce, 16); } catch { return false; }
  if (!validISO(challenge.issued_at) || !validISO(challenge.expires_at)) return false;
  const duration = Date.parse(challenge.expires_at) - Date.parse(challenge.issued_at);
  return duration > 0 && duration <= 120_000;
}
export function validateSignedAttempt(attempt, challenge, now) {
  const fail = code => ({ ok: false, code });
  if (!exact(attempt, ATTEMPT_FIELDS) || !validateChallenge(challenge)) return fail('malformed-protocol');
  if (!Number.isSafeInteger(now)) return fail('invalid-clock');
  if (!CHALLENGE_FIELDS.every(key => attempt[key] === challenge[key])) return fail('challenge-context-mismatch');
  if (attempt.opt_in !== true) return fail('explicit-opt-in-required');
  if (typeof attempt.attempt_id !== 'string' || !ID.test(attempt.attempt_id) || typeof attempt.result_hash !== 'string' || !HASH.test(attempt.result_hash)) return fail('malformed-protocol');
  if (now < Date.parse(challenge.issued_at) || now >= Date.parse(challenge.expires_at)) return fail('challenge-expired-or-not-yet-valid');
  try {
    if (participantKeyId(attempt.public_key) !== challenge.participant_key_id) return fail('participant-key-mismatch');
    const key = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), bytes(attempt.public_key, 32)]), format: 'der', type: 'spki' });
    if (!verify(null, Buffer.from(attemptMessage(attempt)), key, bytes(attempt.signature, 64))) return fail('invalid-signature');
  } catch { return fail('invalid-key-or-signature'); }
  return { ok: true, participant_key_id: challenge.participant_key_id, assertion: 'key-possession-and-explicit-opt-in', providerIdentityVerified: false };
}

export function emptyState() { return { attempts: {}, challenges: {}, nonces: {}, participantDays: {}, globalDays: {} }; }
function recordKey(...parts) { return canonicalJSON(parts); }
// Immutable decision only. Production MUST atomically persist nextState/receipt and
// challenge consumption with uniqueness constraints. An in-memory Map is not a DB.
export function decideSubmission(state, attempt, challenge, now, limits = {}) {
  const cap = limits.participantDaily ?? 3, globalCap = limits.globalDaily ?? 100;
  if (![cap, globalCap].every(n => Number.isSafeInteger(n) && n > 0 && n <= 1000)) throw new TypeError('invalid-caps');
  let requestHash;
  if (!exact(attempt, ATTEMPT_FIELDS)) return { status: 400, code: 'malformed-protocol' };
  try {
    const body = canonicalJSON(attempt);
    if (Buffer.byteLength(body) > 8192) return { status: 413, code: 'request-too-large' };
    requestHash = sha256(body);
  } catch { return { status: 400, code: 'malformed-protocol' }; }
  const id = typeof attempt?.attempt_id === 'string' && ID.test(attempt.attempt_id) ? attempt.attempt_id : null;
  const scopedId = recordKey(attempt.data_mode, attempt.site_id, attempt.participant_key_id, id);
  const prior = Object.hasOwn(state.attempts, scopedId) && state.attempts[scopedId];
  if (prior) return prior.request_hash === requestHash
    ? { status: 200, code: 'idempotent-retry', receipt: prior.receipt }
    : { status: 409, code: 'idempotency-conflict' };
  const proof = validateSignedAttempt(attempt, challenge, now);
  if (!proof.ok) return { status: 400, code: proof.code };
  const challengeKey = recordKey(challenge.data_mode, challenge.site_id, challenge.challenge_id);
  const nonceKey = recordKey(challenge.data_mode, challenge.site_id, challenge.nonce);
  if (Object.hasOwn(state.challenges, challengeKey)) return { status: 409, code: 'challenge-already-consumed' };
  if (Object.hasOwn(state.nonces, nonceKey)) return { status: 409, code: 'nonce-already-consumed' };
  const day = new Date(now).toISOString().slice(0, 10); // league window is UTC, intentionally not local civic day
  const participantDay = recordKey(challenge.data_mode, challenge.site_id, day, proof.participant_key_id);
  const globalDay = recordKey(challenge.data_mode, day);
  if ((state.participantDays[participantDay] ?? 0) >= cap || (state.globalDays[globalDay] ?? 0) >= globalCap) return { status: 429, code: 'daily-cap', retry_after_day: day };
  const receiptId = `lsr_${sha256(recordKey(challenge.data_mode, challenge.site_id, proof.participant_key_id, id, challenge.challenge_id))}`;
  const receipt = Object.freeze({ schema: 'pointcast.league-submission/v1', receipt_id: receiptId, submission_id: id, site_id: challenge.site_id, task_id: challenge.task_id, data_mode: challenge.data_mode, status: 'received_unreviewed', ranked: false });
  const nextState = {
    attempts: { ...state.attempts, [scopedId]: { request_hash: requestHash, receipt } },
    challenges: { ...state.challenges, [challengeKey]: id },
    nonces: { ...state.nonces, [nonceKey]: id },
    participantDays: { ...state.participantDays, [participantDay]: (state.participantDays[participantDay] ?? 0) + 1 },
    globalDays: { ...state.globalDays, [globalDay]: (state.globalDays[globalDay] ?? 0) + 1 },
  };
  return { status: 201, code: 'received-unreviewed', receipt, nextState };
}

// TRUSTED INTERNAL records only: do not call this on browser-submitted judgments.
// All source families (including signed crawlers) earn zero request-volume points.
export function scoreTasks(events, { seasonId, rubricVersion = 'v1', dailyCap = 3, allowedTasks = [] } = {}) {
  if (typeof seasonId !== 'string' || !ID.test(seasonId) || typeof rubricVersion !== 'string' || !ID.test(rubricVersion) || !Number.isSafeInteger(dailyCap) || dailyCap < 1 || dailyCap > 100 || !Array.isArray(allowedTasks)) throw new TypeError('invalid-scoring-options');
  const taskManifest = new Set(allowedTasks.filter(e => plain(e) && SITE_IDS.includes(e.site_id) && typeof e.task_id === 'string' && ID.test(e.task_id) && typeof e.task_version === 'string' && ID.test(e.task_version)).map(e => recordKey(e.site_id, e.task_id, e.task_version)));
  const eligible = events.filter(e => plain(e) && e.data_mode === 'live' && e.fixture === false
    && e.provenance === 'server_adjudicated' && e.participation === 'signed_opt_in'
    && e.outcome === 'accepted' && e.judgment_verified === true && e.season_id === seasonId
    && e.rubric_version === rubricVersion && SITE_IDS.includes(e.site_id)
    && typeof e.participant_key_id === 'string' && HASH.test(e.participant_key_id)
    && typeof e.task_id === 'string' && ID.test(e.task_id) && typeof e.task_version === 'string' && ID.test(e.task_version)
    && typeof e.receipt_id === 'string' && ID.test(e.receipt_id) && validISO(e.accepted_at)
    && taskManifest.has(recordKey(e.site_id, e.task_id, e.task_version)));
  eligible.sort((a, b) => a.accepted_at.localeCompare(b.accepted_at) || a.receipt_id.localeCompare(b.receipt_id));
  const tasks = new Set(), receipts = new Set(), perDay = new Map(), bySite = new Map();
  for (const e of eligible) {
    const task = recordKey(e.site_id, e.participant_key_id, e.task_id);
    const day = recordKey(e.site_id, e.participant_key_id, e.accepted_at.slice(0, 10));
    const receipt = recordKey(e.site_id, e.receipt_id);
    if (receipts.has(receipt) || tasks.has(task) || (perDay.get(day) ?? 0) >= dailyCap) continue;
    receipts.add(receipt); tasks.add(task); perDay.set(day, (perDay.get(day) ?? 0) + 1);
    bySite.set(e.site_id, (bySite.get(e.site_id) ?? 0) + 1);
  }
  return { schema: 'pointcast.league-score/v1', season_id: seasonId, rubric_version: rubricVersion, metric: 'verified_unique_tasks', by_site: Object.fromEntries([...bySite].sort()), total: tasks.size };
}
