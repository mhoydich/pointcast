import Buffer from 'vite-plugin-node-polyfills/shims/buffer';
import { createPublicKey, verify } from 'node:crypto';

const SIGNING_ALG = 'ed25519';
const SPEC_VERSION = 'pointcast.agent-payments/v1';

// Fields included in the canonical manifest. Order is fixed; output is
// alphabetically sorted JSON which makes order moot but the *set* is fixed.
const MANIFEST_FIELDS = [
  'agent',
  'agent_id',
  'amount_usd',
  'currency',
  'link_session_id',
  'loop',
  'merchant',
  'merchant_url',
  'mode',
  'payee_agent',
  'payee_agent_id',
  'status',
];

/**
 * Build the canonical manifest bytes for a Block's spend payload.
 * Returns a UTF-8 Buffer. Deterministic given the same inputs.
 */
function buildManifest(spend, blockId, timestamp) {
  const m = {};
  for (const f of MANIFEST_FIELDS) {
    if (spend[f] !== undefined && spend[f] !== null) m[f] = spend[f];
  }
  // Bind the manifest to its block context. block_id + timestamp prevent
  // a verifier from being tricked by a copy of one block's spend pasted
  // into another block.
  m.block_id = blockId;
  m.block_timestamp = timestamp;
  m.spec = SPEC_VERSION;

  // Canonical JSON: keys sorted alphabetically, no whitespace beyond what
  // JSON.stringify produces with sorted keys.
  const sortedKeys = Object.keys(m).sort();
  const canonical = JSON.stringify(m, sortedKeys);
  return Buffer.from(canonical + '\n', 'utf8');
}

/**
 * Verify a base64 signature over manifestBytes using the resident's
 * raw 32-byte Ed25519 public key (base64). Returns boolean.
 */
function verifyManifest(manifestBytes, signatureB64, publicKeyB64) {
  // Reconstruct an Ed25519 SubjectPublicKeyInfo from the raw 32-byte key.
  // SPKI prefix for Ed25519: 30 2a 30 05 06 03 2b 65 70 03 21 00 (12 bytes)
  // followed by the 32-byte raw key. Total 44 bytes DER.
  const rawPub = Buffer.from(publicKeyB64, 'base64');
  if (rawPub.length !== 32) return false;
  const spkiPrefix = Buffer.from('302a300506032b6570032100', 'hex');
  const spki = Buffer.concat([spkiPrefix, rawPub]);
  const key = createPublicKey({ key: spki, format: 'der', type: 'spki' });
  try {
    return verify(null, manifestBytes, key, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}

/**
 * Verify a Block's spend signature against the resident's public key from
 * agent-identities.json. Returns { ok, reason } where ok is boolean and
 * reason is a short string for non-ok results.
 */
function verifySpend(block, identitiesJson) {
  const spend = block.spend;
  if (!spend) return { ok: false, reason: 'no spend field' };
  if (!spend.signature) return { ok: false, reason: 'unsigned (no signature field)' };
  if (spend.signing_alg && spend.signing_alg !== SIGNING_ALG) return { ok: false, reason: `unsupported alg: ${spend.signing_alg}` };
  if (!spend.agent_id) return { ok: false, reason: 'no agent_id; cannot resolve public key' };

  // Look up the public key by agent_id (not name), so renames don't break.
  let inst = null;
  for (const v of Object.values(identitiesJson.instances ?? {})) {
    if (v.agent_id === spend.agent_id) { inst = v; break; }
  }
  if (!inst) return { ok: false, reason: `no identity registered for ${spend.agent_id}` };
  if (!inst.public_key) return { ok: false, reason: `identity ${spend.agent_id} has no public_key` };

  // Build manifest from the same fields that were signed. Use timestamp from
  // the block (the signer used block.timestamp). Block id likewise.
  const manifest = buildManifest(spend, block.id, block.timestamp);
  const ok = verifyManifest(manifest, spend.signature, inst.public_key);
  return ok ? { ok: true, reason: 'signature valid' } : { ok: false, reason: 'signature does not validate' };
}

export { MANIFEST_FIELDS as M, SIGNING_ALG as S, SPEC_VERSION as a, verifySpend as v };
