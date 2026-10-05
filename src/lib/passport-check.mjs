/**
 * Client-side Agent Passport checks for /standards/check.
 * No secrets. Schema rules mirror agent-passport.schema.json.
 * A devnet name match is a sighting. registered-onchain requires a hash match.
 */

const SCHEMA = 'pointcast.agent-passport/v0.1';
const LEVELS = ['self-declared', 'key-signed', 'operator-vouched', 'registered-onchain'];

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

/** Canonical passport bytes: sorted keys, signature field removed. */
export function canonicalPassport(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return '';
  const copy = { ...doc };
  delete copy.signature;
  return stableStringify(copy);
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  if (typeof hex !== 'string' || !/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function isIsoDate(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function stringList(value, label, errors) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    errors.push(`${label} must be an array of strings`);
  }
}

/** Structural check against the v0.1 passport schema. Returns human error strings. */
export function validatePassport(doc) {
  const errors = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return ['Passport must be a JSON object'];
  }
  if (doc.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (typeof doc.name !== 'string' || doc.name.length < 2 || doc.name.length > 64) {
    errors.push('name must be a string of 2 to 64 characters');
  }
  if (!doc.operator || typeof doc.operator !== 'object' || Array.isArray(doc.operator)) {
    errors.push('operator must be an object with a name');
  } else if (typeof doc.operator.name !== 'string' || !doc.operator.name.trim()) {
    errors.push('operator.name is required');
  } else if (doc.operator.contact != null && typeof doc.operator.contact !== 'string') {
    errors.push('operator.contact must be a string when present');
  }
  if (typeof doc.purpose !== 'string' || !doc.purpose.trim()) errors.push('purpose must be a non-empty string');
  stringList(doc.capabilities, 'capabilities', errors);
  stringList(doc.consent, 'consent', errors);
  if (!LEVELS.includes(doc.level)) errors.push(`level must be one of ${LEVELS.join(', ')}`);
  if (!isIsoDate(doc.updated)) errors.push('updated must be an ISO-8601 date-time');
  if (doc.model != null && typeof doc.model !== 'string') errors.push('model must be a string or null');
  if (doc.displayName != null && typeof doc.displayName !== 'string') errors.push('displayName must be a string');
  if (doc.modelNote != null && typeof doc.modelNote !== 'string') errors.push('modelNote must be a string');
  if (doc.publicKey != null) {
    const key = doc.publicKey;
    if (!key || typeof key !== 'object' || Array.isArray(key)) errors.push('publicKey must be an object');
    else {
      if (key.scheme != null && key.scheme !== 'ed25519' && key.scheme !== 'secp256k1') {
        errors.push('publicKey.scheme must be ed25519 or secp256k1');
      }
      if (key.key != null && typeof key.key !== 'string') errors.push('publicKey.key must be a string or null');
      if (key.status != null && key.status !== 'active' && key.status !== 'pending') {
        errors.push('publicKey.status must be active or pending');
      }
    }
  }
  if (doc.endpoints != null) {
    if (!doc.endpoints || typeof doc.endpoints !== 'object' || Array.isArray(doc.endpoints)) {
      errors.push('endpoints must be an object of strings');
    } else if (Object.values(doc.endpoints).some((item) => typeof item !== 'string')) {
      errors.push('endpoints values must be strings');
    }
  }
  if (doc.signature != null && (typeof doc.signature !== 'object' || Array.isArray(doc.signature))) {
    errors.push('signature must be an object');
  }
  return errors;
}

export function attestationPresent(doc) {
  const eas = doc?.ethereum?.easUID;
  if (typeof eas === 'string' && eas.trim()) return { present: true, where: 'ethereum.easUID' };
  const attestation = doc?.attestation;
  if (attestation && typeof attestation === 'object' && !Array.isArray(attestation)) {
    const marker = ['by', 'easUID', 'uid', 'statement'].find((key) => {
      const value = attestation[key];
      return typeof value === 'string' && value.trim();
    });
    if (marker) return { present: true, where: `attestation.${marker}` };
  }
  return { present: false, where: '' };
}

/**
 * Pull `passport: v=0.1 name=…` fields out of a post body.
 * Values are single tokens. URLs must not contain spaces.
 */
export function parsePassportLines(text) {
  const found = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const at = line.indexOf('passport:');
    if (at < 0) continue;
    const fields = {};
    for (const token of line.slice(at + 'passport:'.length).trim().split(/\s+/)) {
      const eq = token.indexOf('=');
      if (eq <= 0) continue;
      fields[token.slice(0, eq)] = token.slice(eq + 1);
    }
    if (fields.v) found.push(fields);
  }
  return found;
}

/** Classify one parsed passport line against a document and its declaration hash. */
export function classifyPassportLine(doc, fields, declarationHash) {
  const nameOk = fields?.v === '0.1' && fields?.name === doc?.name;
  const uri = doc?.endpoints?.passport;
  const uriOk = !fields?.uri || !uri || fields.uri === uri;
  const hash = typeof fields?.hash === 'string' ? fields.hash.toLowerCase() : '';
  const hashMatches = Boolean(nameOk && uriOk && hash && hash === declarationHash);
  return {
    nameOk,
    uriOk,
    hashPresent: Boolean(hash),
    hashMatches,
    cited: Boolean(nameOk && uriOk),
  };
}

export async function verifyEd25519Signature(publicKeyHex, signatureHex, message) {
  const pub = hexToBytes(publicKeyHex);
  const sig = hexToBytes(signatureHex);
  if (!pub || pub.length !== 32) return { ok: false, reason: 'Public key must be 32-byte hex.' };
  if (!sig || sig.length !== 64) return { ok: false, reason: 'Signature must be 64-byte hex.' };
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return { ok: false, reason: 'This runtime has no WebCrypto, so the signature was not checked.' };
  try {
    const key = await subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']);
    const data = typeof message === 'string' ? new TextEncoder().encode(message) : message;
    const ok = await subtle.verify({ name: 'Ed25519' }, key, sig, data);
    return {
      ok,
      reason: ok ? 'The ed25519 signature matches the canonical passport.' : 'The ed25519 signature does not match the canonical passport.',
    };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'unavailable';
    return { ok: false, reason: `This runtime could not verify ed25519 (${messageText}).` };
  }
}

/** Decide whether the key-signed lamp can light. Presence is not enough. */
export async function checkKeySigned(doc) {
  const key = doc?.publicKey;
  const signature = doc?.signature;
  if (!signature) return { ok: false, reason: 'No signature object on the passport.' };
  if (!key || key.status !== 'active' || typeof key.key !== 'string' || !key.key) {
    return { ok: false, reason: 'No active public key on the passport.' };
  }
  if (key.scheme === 'secp256k1') {
    return { ok: false, reason: 'A secp256k1 key is present. This checker verifies ed25519 only, so key-signed stays off.' };
  }
  if (key.scheme !== 'ed25519') return { ok: false, reason: 'publicKey.scheme must be ed25519 to verify here.' };
  const value = signature.value || signature.sig;
  if (signature.alg && signature.alg !== 'ed25519') {
    return { ok: false, reason: `signature.alg is ${signature.alg}. This checker verifies ed25519 only.` };
  }
  return verifyEd25519Signature(key.key, value, canonicalPassport(doc));
}

/**
 * Score a passport. `records` are already-classified devnet lines
 * ({ cited, hashMatches, height, tx, label }).
 */
export function scorePassport(doc, errors, keySigned, attestation, records) {
  const valid = errors.length === 0;
  const cited = valid && records.some((record) => record.cited);
  const registered = valid && records.some((record) => record.hashMatches);
  const levels = {
    'self-declared': valid,
    'key-signed': valid && keySigned.ok === true,
    'operator-vouched': valid && attestation.present === true,
    'registered-onchain': registered,
  };
  const order = ['registered-onchain', 'operator-vouched', 'key-signed', 'self-declared'];
  const reached = order.find((level) => levels[level]) || 'none';
  return { valid, cited, registered, levels, reached, claimed: doc?.level || '' };
}
