// Offline-only client example. Deliberately has no fetch/http/socket imports.
import { generateKeyPairSync, sign } from 'node:crypto';
import { canonicalJSON, sha256, participantKeyId, attemptMessage, validateChallenge, validateSignedAttempt } from '../protocol/protocol.mjs';

export class KitError extends Error {
  constructor(code) { super(code); this.name = 'KitError'; this.code = code; }
}
export function createEphemeralSigner() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const public_key = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64url');
  return Object.freeze({
    public_key,
    participant_key_id: participantKeyId(public_key),
    sign(message) {
      if (typeof message !== 'string' || Buffer.byteLength(message) > 8192) throw new KitError('signing-message-too-large-or-invalid');
      return sign(null, Buffer.from(message), privateKey).toString('base64url');
    },
  });
}
export function bindFixtureChallenge(template, dataset, terms, signer) {
  if (template?.schema !== 'signal-atlas.builder-challenge-template/v1'
    || template.challenge?.data_mode !== 'fixture'
    || template.challenge.dataset_hash !== '{{DATASET_HASH}}'
    || template.challenge.terms_hash !== '{{TERMS_HASH}}'
    || template.challenge.participant_key_id !== '{{EPHEMERAL_PUBLIC_KEY_HASH}}'
    || terms?.schema !== 'signal-atlas.builder-practice-terms/v1'
    || terms?.fictional_sources !== true || terms?.persistent_private_keys !== false
    || terms?.quotas?.submissions_per_participant_site_utc_day !== 3 || terms?.quotas?.submissions_global_utc_day !== 100
    || terms?.live_points !== false || terms?.network_allowed !== false || terms?.enrollment !== false) throw new KitError('not-an-offline-fixture-template');
  const challenge = {
    ...template.challenge,
    dataset_hash: sha256(canonicalJSON(dataset)),
    terms_hash: sha256(canonicalJSON(terms)),
    participant_key_id: signer.participant_key_id,
  };
  if (!validateChallenge(challenge) || !Number.isFinite(Date.parse(template.fixture_clock))) throw new KitError('invalid-fixture-challenge');
  return challenge;
}
export function buildSignedFixtureAttempt({ challenge, answer, signer, attemptId }) {
  if (challenge?.data_mode !== 'fixture') throw new KitError('fixture-client-refuses-live-mode');
  const canonicalAnswer = canonicalJSON(answer);
  if (Buffer.byteLength(canonicalAnswer) > 8192) throw new KitError('answer-too-large');
  const attempt = { ...challenge, attempt_id: attemptId, public_key: signer.public_key, result_hash: sha256(canonicalAnswer), opt_in: true, signature: '' };
  attempt.signature = signer.sign(attemptMessage(attempt));
  return attempt;
}
export function verifyFixtureAnswer(attempt, answer, expectedChallenge, fixtureClock) {
  if (expectedChallenge?.data_mode !== 'fixture' || attempt?.data_mode !== 'fixture') return { ok: false, code: 'fixture-verifier-refuses-live-mode' };
  let hash;
  try {
    const text = canonicalJSON(answer);
    if (Buffer.byteLength(text) > 8192) return { ok: false, code: 'answer-too-large' };
    hash = sha256(text);
  } catch { return { ok: false, code: 'invalid-answer-json' }; }
  if (hash !== attempt.result_hash) return { ok: false, code: 'result-digest-mismatch' };
  return validateSignedAttempt(attempt, expectedChallenge, fixtureClock);
}
