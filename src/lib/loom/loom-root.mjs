/**
 * CARD LOOM-ROOT v1 — daily timestamp Merkle root.
 *
 * This module builds and checks roots. It does not append to the Loom, does
 * not write KV, and does not schedule a cron. GET /api/loom/root is the reader.
 *
 * Leaf hash recipe (byte-for-byte)
 * --------------------------------
 * A leaf hash is SHA-256 of this preimage:
 *
 *   0x00 || version || DELIM || day || DELIM || at || DELIM || kind || DELIM || id || DELIM || address
 *
 * Canonical field order is fixed and is the only order that hashes:
 *
 *   version, day, at, kind, id, address
 *
 * Each field is UTF-8. `version` is the decimal string "1" (not a raw integer).
 * `day` is YYYY-MM-DD in UTC. `at` is an RFC 3339 UTC timestamp with millisecond
 * precision, always ending in Z (`Date.toISOString()`). `kind` is "timestamp"
 * or "x-status". `id` and `address` are the canonical strings below.
 *
 * DELIM is the single byte LEAF_DELIMITER (ASCII Unit Separator, 0x1f).
 * It is provisional. v0 root #1 cannot be reproduced until the Nouns Money
 * art desk confirms the exact v0 delimiter. Swap LEAF_DELIMITER, and only
 * that byte, to align this preimage with root #1. Do not reorder the fields.
 * A field that itself contains the delimiter is rejected so the split stays
 * unambiguous. Extra properties on a leaf (a signature, a handle, a body) are
 * not hashed.
 *
 * What a leaf commits
 * -------------------
 * A leaf commits version, day, at, kind, id, and address. It does not commit
 * the message body, a later edit, the sender, or any content hash. The root
 * proves that id was recorded at that time on that address. It does not prove
 * what the message said. A body hash is not a seventh field: the field order
 * stays these six names so a confirmed v0 delimiter can still align with
 * root #1. Until that byte is confirmed, DELIMITER_CONFIRMED is false and a
 * root from this recipe is not for publication as root #1.
 *
 * Mapping a Loom read onto leaves
 * -------------------------------
 * An outsider reproduces a root from one public log as follows.
 *
 *   1. GET /api/loom?to=<address> and take messages[] (the folded public read).
 *   2. For each message, leafFromLoomMessage(message, address) sets:
 *        version  "1"
 *        day      UTC day of message.at
 *        at       Date.parse(message.at) rendered with toISOString()
 *        kind     "timestamp"  (the message's note/question/claim kind is not hashed)
 *        id       message.id
 *        address  the log address passed as `to`, not loom:<key>#<id>
 *   3. Skip a message with no id, no parseable at, hidden: true, or a day
 *      other than the day being rooted. leavesFromLoomRead does those skips.
 *   4. Hash the set with merkleRoot. Input order does not matter. The same id
 *      on two log addresses is two leaves. An edit does not move the leaf:
 *      body and editedAt are not hashed, and at stays the append time.
 *   5. The day's network root is that set unioned across every log in the
 *      snapshot, plus any @officenoun x-status leaves for the same UTC day.
 *      This module does not choose the log set and does not write
 *      loom:root:<YYYY-MM-DD>. GET /api/loom/root only hashes the leaves
 *      already stored there. The root changes when the set changes. It is a
 *      timestamp of a set only after a desk signs deskPayload for that exact
 *      root and leaf count. The reader does not take that snapshot.
 *
 * Domain tags, also fixed in this recipe:
 *   leaf preimage starts with 0x00
 *   an internal node is SHA-256(0x01 || left || right), left and right raw 32-byte hashes
 *   an odd node with no sibling is promoted unchanged (it is not duplicated)
 *   the empty root is SHA-256(UTF-8 "pointcast.loom-root/v1\nempty\n"), which is
 *   neither a leaf hash nor a node hash
 *
 * Leaves are a set: identical preimages count once. The set is sorted by leaf
 * hash, bytewise, before the tree is built, so input order does not matter.
 * A one-leaf tree's root is that leaf hash.
 *
 * Desk attestation
 * ----------------
 * The desk signs this exact UTF-8 payload (trailing newline included):
 *
 *   pointcast.loom-root.desk/v1
 *   day:<YYYY-MM-DD>
 *   root:<64 lowercase hex>
 *   leaves:<decimal>
 *
 * Public keys are the ones /agents.json publishes for signing: an object with
 * `use: "sig"` and a 32-byte Ed25519 public key. Accepted spellings match the
 * keys already on the site: `publicKey` or `public_key` as standard base64
 * (the agent-identity spelling), or a JWK with `use: "sig"`, `crv: "Ed25519"`
 * and `x` as base64url (the x402 treasury spelling). A successful check
 * returns `{ sig, verified: true }`. A key that is not published with
 * `use: "sig"` is an unknown key.
 *
 * @officenoun status leaves
 * -------------------------
 * kind    "x-status"
 * id      the decimal X status id
 * address https://x.com/officenoun/status/<id>
 * at      the UTC timestamp the desk is rooting
 * day     the UTC day of `at`
 *
 * twitter.com and x.com URLs, a bare id, and "@officenoun/<id>" all become
 * that same address. The handle is not part of the hash.
 */

export const SPEC = 'pointcast.loom-root/v1';
export const DESK_SPEC = 'pointcast.loom-root.desk/v1';
export const LEAF_VERSION = '1';
export const LEAF_FIELDS = Object.freeze(['version', 'day', 'at', 'kind', 'id', 'address']);
/** Provisional. Confirm against v0 root #1 before treating a root as that root. */
export const LEAF_DELIMITER = 0x1f;
export const LEAF_DOMAIN = 0x00;
export const NODE_DOMAIN = 0x01;
export const EMPTY_TAG = 'pointcast.loom-root/v1\nempty\n';
export const ROOT_KV_PREFIX = 'loom:root:';
export const NOTE_ADDRESS = '#loom-root';
export const OFFICENOUN_STATUS_ORIGIN = 'https://x.com/officenoun/status/';

export const DELIMITER_NOTE = 'LEAF_DELIMITER is ASCII 0x1f until the Nouns Money art desk confirms the v0 root #1 delimiter. Field order stays version, day, at, kind, id, address. Swap that one byte to align the leaf preimage with root #1.';

/** False until the art desk confirms LEAF_DELIMITER. Roots are readable and not for publication as v0 root #1. */
export const DELIMITER_CONFIRMED = false;

export const COMMITMENT = 'A leaf commits version, day, at, kind, id, and address. It does not commit the message body, a later edit, the sender, or any content hash. The root proves that id was recorded at that time on that address. It does not prove what the message said.';

export const PUBLISHABLE_REASON = 'Delimiter 0x1f is provisional. Do not announce this root as v0 root #1, and do not treat a desk signature over it as final, until the Nouns Money art desk confirms LEAF_DELIMITER.';

export const RECIPE = Object.freeze({
  hash: 'SHA-256',
  spec: SPEC,
  leafFields: LEAF_FIELDS,
  leafDomain: '0x00',
  nodeDomain: '0x01',
  delimiter: '0x1f',
  delimiterStatus: 'provisional',
  delimiterNote: DELIMITER_NOTE,
  oddNode: 'promoted unchanged',
  order: 'unique leaves sorted by leaf hash',
  empty: 'SHA-256(utf8("pointcast.loom-root/v1\\nempty\\n"))',
  commitment: COMMITMENT,
  publishable: DELIMITER_CONFIRMED,
  publishableReason: PUBLISHABLE_REASON,
  mapping: 'leafFromLoomMessage(message, logAddress) from GET /api/loom?to=<address> messages[]',
});

const encoder = new TextEncoder();
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS_ID_RE = /^\d{1,22}$/;
const STATUS_URL_RE = /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/officenoun\/status\/(\d{1,22})\/?(?:\?.*)?$/i;
const STATUS_SHORT_RE = /^@officenoun(?:\/status\/|\/|\s+)(\d{1,22})$/i;

export function bytesToHex(bytes) {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function base64UrlToBytes(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  return base64ToBytes(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

function containsDelimiter(text, delimiter) {
  const bytes = encoder.encode(text);
  for (const byte of bytes) if (byte === delimiter) return true;
  return false;
}

export function normalizeAt(value) {
  if (value == null || value === '') return '';
  const time = Date.parse(value);
  if (Number.isNaN(time)) throw new Error('leaf_at');
  return new Date(time).toISOString();
}

/**
 * The six canonical strings, in LEAF_FIELDS order.
 * `delimiter` is checked here so a future confirmed v0 byte still rejects
 * fields that would split the preimage.
 */
export function canonicalLeafFields(leaf, delimiter = LEAF_DELIMITER) {
  if (!leaf || typeof leaf !== 'object') throw new Error('leaf_required');
  const at = normalizeAt(leaf.at);
  const version = leaf.version == null || leaf.version === '' ? LEAF_VERSION : String(leaf.version);
  const day = leaf.day == null || leaf.day === '' ? at.slice(0, 10) : String(leaf.day);
  const kind = leaf.kind == null || leaf.kind === '' ? 'timestamp' : String(leaf.kind);
  const id = leaf.id == null ? '' : String(leaf.id);
  const address = leaf.address == null ? '' : String(leaf.address);
  if (!/^[0-9]+$/.test(version)) throw new Error('leaf_version');
  if (day && !DAY_RE.test(day)) throw new Error('leaf_day');
  if (at && day !== at.slice(0, 10)) throw new Error('leaf_day_mismatch');
  if (kind !== 'timestamp' && kind !== 'x-status') throw new Error('leaf_kind');
  if (!id || id.length > 80) throw new Error('leaf_id');
  if (!address || address.length > 400) throw new Error('leaf_address');
  const fields = { version, day, at, kind, id, address };
  for (const name of LEAF_FIELDS) {
    if (containsDelimiter(fields[name], delimiter)) throw new Error(`leaf_${name}_delimiter`);
  }
  return fields;
}

/** Raw leaf preimage. Pass another delimiter only to compare with a confirmed v0 byte. */
export function leafPreimage(leaf, delimiter = LEAF_DELIMITER) {
  const fields = canonicalLeafFields(leaf, delimiter);
  const parts = [Uint8Array.of(LEAF_DOMAIN)];
  LEAF_FIELDS.forEach((name, index) => {
    if (index) parts.push(Uint8Array.of(delimiter));
    parts.push(encoder.encode(fields[name]));
  });
  return concat(parts);
}

export async function hashLeaf(leaf, delimiter = LEAF_DELIMITER) {
  return sha256(leafPreimage(leaf, delimiter));
}

export async function merkleNode(leftHex, rightHex) {
  const left = hexToBytes(leftHex);
  const right = hexToBytes(rightHex);
  if (!left || !right || left.length !== 32 || right.length !== 32) throw new Error('merkle_node');
  return bytesToHex(await hashNode(left, right));
}

async function hashNode(left, right) {
  return sha256(concat([Uint8Array.of(NODE_DOMAIN), left, right]));
}

export async function emptyRoot() {
  return bytesToHex(await sha256(encoder.encode(EMPTY_TAG)));
}

async function buildLevels(leaves) {
  const levels = [leaves];
  let level = leaves;
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) next.push(await hashNode(level[i], level[i + 1]));
      else next.push(level[i]);
    }
    levels.push(next);
    level = next;
  }
  return levels;
}

function siblingsFor(levels, index) {
  const siblings = [];
  let cursor = index;
  for (let level = 0; level < levels.length - 1; level += 1) {
    const nodes = levels[level];
    const siblingIndex = cursor % 2 === 1 ? cursor - 1 : cursor + 1;
    if (siblingIndex < nodes.length) {
      siblings.push({
        hash: bytesToHex(nodes[siblingIndex]),
        position: cursor % 2 === 1 ? 'left' : 'right',
      });
    }
    cursor = Math.floor(cursor / 2);
  }
  return siblings;
}

/**
 * Build the day's tree. Returns the root, the sorted unique leaves, and the
 * levels used to cut proofs. Levels stay on the object for the prover; the
 * HTTP response never sends them.
 */
export async function buildMerkle(leaves, { delimiter = LEAF_DELIMITER } = {}) {
  const list = Array.isArray(leaves) ? leaves : [];
  const prepared = [];
  const seen = new Set();
  for (const leaf of list) {
    const fields = canonicalLeafFields(leaf, delimiter);
    const hash = await sha256(leafPreimage(fields, delimiter));
    const hex = bytesToHex(hash);
    if (seen.has(hex)) continue;
    seen.add(hex);
    prepared.push({ fields, hash, hex });
  }
  prepared.sort((a, b) => (a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0));
  if (!prepared.length) {
    return { root: await emptyRoot(), leafCount: 0, empty: true, leaves: [], levels: [] };
  }
  const levels = await buildLevels(prepared.map((item) => item.hash));
  return {
    root: bytesToHex(levels[levels.length - 1][0]),
    leafCount: prepared.length,
    empty: false,
    leaves: prepared.map((item, index) => ({ ...item.fields, index, leafHash: item.hex })),
    levels,
  };
}

export async function merkleRoot(leaves, options) {
  const tree = await buildMerkle(leaves, options);
  return {
    root: tree.root,
    leafCount: tree.leafCount,
    empty: tree.empty,
    leaves: tree.leaves,
    recipe: RECIPE,
  };
}

export async function inclusionProof(leaves, id, { kind, delimiter = LEAF_DELIMITER } = {}) {
  const tree = await buildMerkle(leaves, { delimiter });
  const wanted = String(id ?? '');
  const matches = tree.leaves.filter((leaf) => leaf.id === wanted && (kind == null || leaf.kind === kind));
  if (matches.length !== 1) {
    return {
      found: false,
      id: wanted,
      root: tree.root,
      leafCount: tree.leafCount,
      reason: matches.length > 1 ? 'ambiguous id' : 'not found',
    };
  }
  const leaf = matches[0];
  const proof = {
    found: true,
    id: leaf.id,
    kind: leaf.kind,
    index: leaf.index,
    leafHash: leaf.leafHash,
    leafCount: tree.leafCount,
    leaf: {
      version: leaf.version,
      day: leaf.day,
      at: leaf.at,
      kind: leaf.kind,
      id: leaf.id,
      address: leaf.address,
    },
    siblings: siblingsFor(tree.levels, leaf.index),
    root: tree.root,
  };
  proof.valid = await verifyInclusion(proof);
  return proof;
}

/** True when `proof` reaches `root` (defaults to the proof's own root). */
export async function verifyInclusion(proof, root = proof?.root) {
  if (!proof || typeof proof !== 'object' || !Array.isArray(proof.siblings)) return false;
  let current = hexToBytes(proof.leafHash);
  if (!current || current.length !== 32) return false;
  for (const sibling of proof.siblings) {
    const bytes = hexToBytes(sibling?.hash);
    if (!bytes || bytes.length !== 32) return false;
    if (sibling.position === 'left') current = await hashNode(bytes, current);
    else if (sibling.position === 'right') current = await hashNode(current, bytes);
    else return false;
  }
  return bytesToHex(current) === String(root ?? '').toLowerCase();
}

export function parseOfficenounStatusId(input) {
  const raw = String(input ?? '').trim();
  if (STATUS_ID_RE.test(raw)) return raw;
  const url = raw.match(STATUS_URL_RE);
  if (url) return url[1];
  const short = raw.match(STATUS_SHORT_RE);
  if (short) return short[1];
  throw new Error('x_status_id');
}

/**
 * One folded Loom message on a public log, as returned in messages[] by
 * GET /api/loom?to=<address>. The message body is ignored on purpose.
 */
export function leafFromLoomMessage(message, address) {
  if (!message || typeof message !== 'object') throw new Error('leaf_required');
  if (message.hidden === true) throw new Error('leaf_hidden');
  const logAddress = String(address ?? '').trim();
  if (!logAddress) throw new Error('leaf_address');
  return canonicalLeafFields({
    version: LEAF_VERSION,
    at: message.at,
    kind: 'timestamp',
    id: message.id,
    address: logAddress,
  });
}

/**
 * Map a public Loom read to the leaves for one UTC day.
 * `messages` is the folded messages[] array. Hidden, undated, and other-day
 * messages are counted in `skipped` and left out of the set.
 */
export function leavesFromLoomRead({ address, messages, day } = {}) {
  const leaves = [];
  let skipped = 0;
  for (const message of Array.isArray(messages) ? messages : []) {
    try {
      const leaf = leafFromLoomMessage(message, address);
      if (day && leaf.day !== day) {
        skipped += 1;
        continue;
      }
      leaves.push(leaf);
    } catch {
      skipped += 1;
    }
  }
  return { address: address == null ? null : String(address), day: day ?? null, leaves, skipped };
}

/** Canonical @officenoun X status leaf. `at` is required so the leaf has a UTC day. */
export function officenounStatusLeaf(statusId, { at } = {}) {
  const id = parseOfficenounStatusId(statusId);
  const when = normalizeAt(at);
  if (!when) throw new Error('leaf_at');
  return {
    version: LEAF_VERSION,
    day: when.slice(0, 10),
    at: when,
    kind: 'x-status',
    id,
    address: `${OFFICENOUN_STATUS_ORIGIN}${id}`,
    handle: '@officenoun',
  };
}

export function deskPayload({ day, root, leafCount }) {
  if (!DAY_RE.test(String(day ?? ''))) throw new Error('desk_day');
  if (!/^[0-9a-f]{64}$/.test(String(root ?? ''))) throw new Error('desk_root');
  if (!Number.isInteger(leafCount) || leafCount < 0) throw new Error('desk_leaves');
  return `${DESK_SPEC}\nday:${day}\nroot:${root}\nleaves:${leafCount}\n`;
}

export async function generateDeskKeyPair() {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return { publicKey: bytesToBase64(raw), privateKey: bytesToBase64(pkcs8) };
}

async function importPrivateKey(privateKey) {
  if (privateKey && typeof privateKey === 'object' && privateKey.type === 'private') return privateKey;
  const bytes = base64ToBytes(privateKey);
  if (!bytes) throw new Error('desk_private_key');
  return crypto.subtle.importKey('pkcs8', bytes, { name: 'Ed25519' }, false, ['sign']);
}

async function importPublicKey(raw) {
  if (!raw || raw.length !== 32) return null;
  try {
    return await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
  } catch {
    return null;
  }
}

export async function signDeskMessage(privateKey, fields) {
  const payload = deskPayload(fields);
  const key = await importPrivateKey(privateKey);
  const signature = new Uint8Array(await crypto.subtle.sign('Ed25519', key, encoder.encode(payload)));
  return { payload, sig: bytesToBase64(signature), alg: 'ed25519' };
}

function publicKeyBytes(node) {
  if (typeof node.x === 'string' && (node.kty === 'OKP' || node.crv === 'Ed25519')) return base64UrlToBytes(node.x);
  if (typeof node.publicKey === 'string') return base64ToBytes(node.publicKey);
  if (typeof node.public_key === 'string') return base64ToBytes(node.public_key);
  if (typeof node.public_key_base64 === 'string') return base64ToBytes(node.public_key_base64);
  return null;
}

/**
 * Signing keys published the way /agents.json publishes them: `use: "sig"`
 * plus a 32-byte Ed25519 public key. Encryption keys and unsigned identity
 * blobs are ignored. A plain `{ id: "<base64>" }` map is accepted as an
 * already-filtered directory.
 */
export function keysFromAgentsManifest(manifest) {
  const keys = new Map();
  if (!manifest || typeof manifest !== 'object') return keys;
  if (!Array.isArray(manifest)) {
    const values = Object.values(manifest);
    if (values.length && values.every((value) => typeof value === 'string')) {
      for (const [id, publicKey] of Object.entries(manifest)) {
        const raw = base64ToBytes(publicKey);
        if (raw?.length === 32) keys.set(id, { id, alg: 'ed25519', use: 'sig', publicKey: raw });
      }
      return keys;
    }
  }
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const alg = String(node.alg || node.public_key_alg || '').toLowerCase();
    const crv = String(node.crv || '');
    const ed25519 = alg === 'ed25519' || alg === 'eddsa' || crv === 'Ed25519' || (!alg && crv === '');
    const id = node.id || node.kid || node.agent_id || node.keyId;
    const raw = publicKeyBytes(node);
    if (node.use === 'sig' && ed25519 && id && raw?.length === 32) {
      keys.set(String(id), { id: String(id), alg: 'ed25519', use: 'sig', publicKey: raw });
    }
    for (const value of Object.values(node)) if (value && typeof value === 'object') visit(value);
  };
  visit(manifest);
  return keys;
}

export async function verifyDeskMessage({ payload, sig, keyId } = {}, manifest) {
  const signature = typeof sig === 'string' ? sig : '';
  const directory = manifest instanceof Map ? manifest : keysFromAgentsManifest(manifest);
  const key = keyId == null || keyId === '' ? null : directory.get(String(keyId));
  if (!key) {
    return { sig: signature, verified: false, keyId: keyId ?? null, alg: 'ed25519', reason: 'unknown key' };
  }
  const rawSig = base64ToBytes(signature);
  const cryptoKey = await importPublicKey(key.publicKey);
  let ok = false;
  if (rawSig?.length === 64 && cryptoKey && typeof payload === 'string') {
    try {
      ok = await crypto.subtle.verify('Ed25519', cryptoKey, rawSig, encoder.encode(payload));
    } catch {
      ok = false;
    }
  }
  if (!ok) return { sig: signature, verified: false, keyId: key.id, alg: 'ed25519', reason: 'signature mismatch' };
  return { sig: signature, verified: true, keyId: key.id, alg: 'ed25519' };
}

/** Text of a #loom-root summary. Returns a string and writes nothing. */
export function formatLoomRootNote(summary = {}) {
  const verification = summary.verification ?? {};
  const lines = [
    NOTE_ADDRESS,
    String(summary.day ?? ''),
    `root: ${summary.root ?? ''}`,
    `leaves: ${summary.leafCount ?? 0}`,
    `verified: ${verification.verified === true ? 'yes' : 'no'}`,
  ];
  if (typeof verification.sig === 'string' && verification.sig) lines.push(`sig: ${verification.sig}`);
  lines.push(
    '',
    'Network root for this UTC day.',
    `Leaf preimage is SHA-256 of 0x00, then ${LEAF_FIELDS.join(', ')}, separated by 0x${LEAF_DELIMITER.toString(16)}.`,
    DELIMITER_NOTE,
    'An inclusion proof checks one leaf against this root.',
    'Commits id, time, and address. Does not commit the message body.',
    PUBLISHABLE_REASON,
    'Summary only. This note is not appended to the Loom.',
  );
  return lines.join('\n');
}

export function loomRootNote(summary) {
  return { to: NOTE_ADDRESS, kind: 'note', body: formatLoomRootNote(summary), writes: false };
}

export function rootKvKey(day) {
  return `${ROOT_KV_PREFIX}${day}`;
}

export function utcDay(now = new Date()) {
  return new Date(now).toISOString().slice(0, 10);
}

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Allow': 'GET, HEAD, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
};

function respond(body, status, cache) {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, 'Cache-Control': cache } });
}

function classifyRecord(raw) {
  if (raw == null) return { state: 'missing', record: null };
  let record = raw;
  if (typeof raw === 'string') {
    try {
      record = JSON.parse(raw);
    } catch {
      return { state: 'empty', record: null };
    }
  }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { state: 'empty', record: null };
  if (!Array.isArray(record.leaves) || record.leaves.length === 0) return { state: 'empty', record };
  return { state: 'ok', record };
}

/**
 * Read-only GET /api/loom/root.
 * `kv` is PC_LOOM_KV or VISITS. A missing binding, a missing key, an empty
 * day, and a corrupt value all return 200 with the empty root.
 * `keys` is an /agents.json signing directory. Without it a stored signature
 * is reported and left unverified.
 */
export async function serveLoomRoot(request, kv, { now = new Date(), keys = null } = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: HEADERS });
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return respond({ ok: false, spec: SPEC, error: 'method_not_allowed', readOnly: true }, 405, 'no-store');
  }
  const url = new URL(request.url);
  const dayParam = url.searchParams.get('day');
  const day = dayParam == null || dayParam === '' ? utcDay(now) : dayParam;
  if (!DAY_RE.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00.000Z`))) {
    return respond({ ok: false, spec: SPEC, error: 'bad_day' }, 400, 'no-store');
  }
  const leafQuery = url.searchParams.get('leaf');
  const statusQuery = url.searchParams.get('status');
  if (leafQuery != null && statusQuery != null) {
    return respond({ ok: false, spec: SPEC, error: 'leaf_or_status' }, 400, 'no-store');
  }
  if (leafQuery != null && !leafQuery.trim()) return respond({ ok: false, spec: SPEC, error: 'bad_leaf' }, 400, 'no-store');
  let statusId = null;
  if (statusQuery != null) {
    try {
      statusId = parseOfficenounStatusId(statusQuery);
    } catch {
      return respond({ ok: false, spec: SPEC, error: 'bad_status' }, 400, 'no-store');
    }
  }

  let state = 'unbound';
  let record = null;
  if (kv && typeof kv.get === 'function') {
    try {
      const classified = classifyRecord(await kv.get(rootKvKey(day), 'json'));
      state = classified.state;
      record = classified.record;
    } catch {
      state = 'unavailable';
      record = null;
    }
  }
  return serveFromRecord({ state, record, day, leafQuery, statusId, keys });
}

async function serveFromRecord({ state, record, day, leafQuery, statusId, keys }) {
  const leaves = [];
  let skipped = 0;
  if (record && Array.isArray(record.leaves)) {
    for (const stored of record.leaves) {
      try {
        const fields = canonicalLeafFields(stored);
        if (fields.day !== day) {
          skipped += 1;
          continue;
        }
        leaves.push(fields);
      } catch {
        skipped += 1;
      }
    }
  }
  const tree = await merkleRoot(leaves);
  let proof = null;
  if (leafQuery != null) proof = await inclusionProof(leaves, leafQuery.trim());
  if (statusId != null) proof = await inclusionProof(leaves, statusId, { kind: 'x-status' });

  const desk = record && record.desk && typeof record.desk === 'object' ? record.desk : null;
  let verification;
  if (desk && typeof desk.sig === 'string' && desk.sig) {
    const payload = deskPayload({ day, root: tree.root, leafCount: tree.leafCount });
    if (keys) verification = await verifyDeskMessage({ payload, sig: desk.sig, keyId: desk.keyId }, keys);
    else verification = { sig: desk.sig, verified: false, keyId: desk.keyId ?? null, alg: 'ed25519', reason: 'no published keys' };
  } else {
    verification = { sig: null, verified: false, keyId: null, alg: 'ed25519', reason: 'no desk signature' };
  }

  const body = {
    ok: true,
    spec: SPEC,
    readOnly: true,
    day,
    root: tree.root,
    leafCount: tree.leafCount,
    empty: tree.leafCount === 0,
    kv: state,
    skipped,
    recipe: RECIPE,
    commitment: COMMITMENT,
    publishable: DELIMITER_CONFIRMED,
    publishableReason: PUBLISHABLE_REASON,
    verification,
    proof,
    note: formatLoomRootNote({ day, root: tree.root, leafCount: tree.leafCount, verification }),
  };
  const cache = state === 'ok' && tree.leafCount > 0 ? 'public, max-age=15' : 'no-store';
  return respond(body, 200, cache);
}
