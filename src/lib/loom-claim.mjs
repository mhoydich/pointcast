// Optional Loom claim desk. Read-only: a public address, a short reply code,
// a Beacon sign-challenge, and a public directory lookup. No secret material,
// no chain writes, no stored credentials. The desk is not a gate for the Loom
// or for an X reply. Flag: LOOM_CLAIM_ENABLED, off unless the value is "true".

import { createPublicKey, verify as verifyEd25519 } from 'node:crypto';
import { b58checkDecode, b58checkEncode, blake2b } from '../../public/chain/sdk/pointcast-chain.js';
import { handleLoom } from './loom/service.mjs';

export const CLAIM_FLAG = 'LOOM_CLAIM_ENABLED';
export const CLAIM_SITE = 'pointcast.xyz/claim';
export const CLAIM_HONESTY = 'Art notes. No cash value. Never priced.';
export const CLAIM_BOUND = 'A matching signature shows the public key controls that address. It does not tie an X account to the wallet.';
export const CLAIM_TTL_MS = 15 * 60 * 1000;
export const TEZ_PROMPT = 'is this you?';
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const TZKT_ORIGIN = 'https://api.tzkt.io';
export const WALLET_BOOK_TO = '#wallet-book';

const LOOM_API = 'https://pointcast.xyz/api/loom';

const CODE_RE = /^NM-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const NOTE_RE = /^[A-Za-z0-9:_-]{1,80}$/;
const TEZ_RE = /^[a-z0-9-]{1,30}\.tez$/;
const NONCE_RE = /^[0-9a-f]{32}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const EDPK = [13, 15, 37, 217];
const EDSIG = [9, 245, 205, 134, 18];
const ACCOUNT_PREFIX = {
  tz1: [6, 161, 159],
  tz2: [6, 161, 161],
  tz3: [6, 161, 164],
  tz4: [6, 161, 166],
};

// Nouns Money note contracts. Addresses only, so collection titles stay out of this module.
export const HOLDER_NOTE_CONTRACTS = Object.freeze([
  'KT1U7ezCFkEbEkhavPzCGYFvxHB7oj14DCNm',
  'KT1Mp6gEa4ENmChWTgkQZbX81qaTTW6EdUbt',
  'KT1Jx6gsKwuDNh99FniyDKHLotwBU9438e6f',
  'KT18fv3GPEjSJnMksDPurM7aZ7asxYP4BrXH',
  'KT1EUJ3trxYoj8jiWcDDzPBoSRi8v4DjSEzu',
  'KT19K7dBa2em8PspJRBAdvaDXmrsFPcxesji',
  'KT1JKHK9WJDjfQGWa4VWGfqyMu5VmvrEeq5n',
  'KT1MJGDPPwUm13zucGLzhip4bL2kzY1Udc5v',
  'KT1R2M8a91QMWogDqzurd7aMqLY2R1CtxG4i',
  'KT1F4h9eojLnSU5jW4QGrzXQdzNxdCQEeAwy',
  'KT1SpN1jdm7FyJHtE8M12KVGPcoeN6YmLYFB',
  'KT1FhyGNvKwSnr5dNVPsC8JWyTVETT1A2oLm',
  'KT1Af5j8x6GyvBeEajyjvSFz2uwksbK4syTJ',
]);

const SECRET_RE = new RegExp(
  [
    '(?:ed|sp|p2)sk',
    ['mnem', 'onic'].join(''),
    ['seed', 'phrase'].join(' '),
    ['private', 'Key'].join(''),
    ['secret', 'Key'].join(''),
  ].join('|'),
  'i',
);

const ED_SPKI = Uint8Array.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00]);

export class ClaimError extends Error {
  constructor(reason, status = 400) {
    super(reason);
    this.name = 'ClaimError';
    this.reason = reason;
    this.status = status;
  }
}

export function claimEnabled(env) {
  return env?.LOOM_CLAIM_ENABLED === 'true';
}

function samePrefix(bytes, prefix) {
  if (!bytes || bytes.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i += 1) if (bytes[i] !== prefix[i]) return false;
  return true;
}

function concat(prefix, bytes) {
  const out = new Uint8Array(prefix.length + bytes.length);
  out.set(prefix, 0);
  out.set(bytes, prefix.length);
  return out;
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new ClaimError('bad-payload');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

function randomBytes(n) {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function rejectSecrets(value, seen = new Set()) {
  if (value == null) return;
  if (typeof value === 'string') {
    if (SECRET_RE.test(value)) throw new ClaimError('secret-refused');
    return;
  }
  if (typeof value !== 'object') return;
  if (seen.has(value) || value instanceof Uint8Array) return;
  seen.add(value);
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_RE.test(key)) throw new ClaimError('secret-refused');
    rejectSecrets(item, seen);
  }
}

export function isPublicAddress(value) {
  if (typeof value !== 'string' || value.length !== 36) return false;
  const raw = b58checkDecode(value);
  if (!raw || raw.length !== 23) return false;
  return Object.values(ACCOUNT_PREFIX).some((prefix) => samePrefix(raw, prefix));
}

export function assertPublicAddress(value) {
  if (!isPublicAddress(value)) throw new ClaimError('bad-address');
  return value;
}

export function assertClaimCode(value) {
  if (typeof value !== 'string' || !CODE_RE.test(value)) throw new ClaimError('bad-code');
  return value;
}

export function assertTezName(value) {
  const name = String(value || '').trim().toLowerCase();
  if (!TEZ_RE.test(name)) throw new ClaimError('bad-name');
  return name;
}

function assertNoteId(value) {
  if (value == null || value === '') return null;
  const note = String(value).trim();
  if (!NOTE_RE.test(note)) throw new ClaimError('bad-note');
  return note;
}

function assertIso(value) {
  if (typeof value !== 'string' || !ISO_RE.test(value) || new Date(value).toISOString() !== value) {
    throw new ClaimError('bad-time');
  }
  return value;
}

export function createClaimCode(bytes) {
  const raw = bytes instanceof Uint8Array ? bytes : randomBytes(6);
  if (raw.length < 6) throw new ClaimError('bad-code');
  let body = '';
  for (let i = 0; i < 6; i += 1) body += CODE_ALPHABET[raw[i] & 31];
  return assertClaimCode(`NM-${body}`);
}

export function formatXReply(code) {
  return assertClaimCode(code);
}

export function encodeEdpk(raw) {
  if (!(raw instanceof Uint8Array) || raw.length !== 32) throw new ClaimError('bad-public-key');
  return b58checkEncode(concat(EDPK, raw));
}

export function tz1FromPublicKeyBytes(raw) {
  if (!(raw instanceof Uint8Array) || raw.length !== 32) throw new ClaimError('bad-public-key');
  return b58checkEncode(concat(ACCOUNT_PREFIX.tz1, blake2b(raw, 20)));
}

export function encodeEdsig(raw) {
  if (!(raw instanceof Uint8Array) || raw.length !== 64) throw new ClaimError('bad-signature');
  return b58checkEncode(concat(EDSIG, raw));
}

function decodePrefixed(value, prefix, payloadLength, reason) {
  if (typeof value !== 'string') throw new ClaimError(reason);
  const raw = b58checkDecode(value);
  if (!raw || raw.length !== prefix.length + payloadLength || !samePrefix(raw, prefix)) throw new ClaimError(reason);
  return raw.subarray(prefix.length);
}

export function michelineStringPayload(text) {
  const bytes = new TextEncoder().encode(String(text));
  const len = bytes.length.toString(16).padStart(8, '0');
  return `0501${len}${bytesToHex(bytes)}`;
}

export function challengeMessage(fields) {
  const lines = [
    'PointCast Loom claim v1',
    `site ${CLAIM_SITE}`,
    `address ${fields.address}`,
    `code ${fields.code}`,
  ];
  if (fields.noteId) lines.push(`note ${fields.noteId}`);
  lines.push(
    `nonce ${fields.nonce}`,
    `issued ${fields.issuedAt}`,
    `expires ${fields.expiresAt}`,
    'Read-only check. It does not move an art note and it does not submit a transaction.',
    CLAIM_BOUND,
  );
  return lines.join('\n');
}

export function createSignChallenge({ address, noteId, code, now = new Date(), ttlMs = CLAIM_TTL_MS, nonce, bytes } = {}) {
  const account = assertPublicAddress(address);
  if (!account.startsWith('tz1')) throw new ClaimError('ed25519-only');
  const claimCode = code ? assertClaimCode(code) : createClaimCode(bytes);
  const note = assertNoteId(noteId);
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new ClaimError('bad-time');
  if (!Number.isInteger(ttlMs) || ttlMs < 60_000 || ttlMs > 1_800_000) throw new ClaimError('bad-ttl');
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
  const nonceHex = nonce ?? bytesToHex(randomBytes(16));
  if (!NONCE_RE.test(nonceHex)) throw new ClaimError('bad-nonce');
  const message = challengeMessage({ address: account, code: claimCode, noteId: note, nonce: nonceHex, issuedAt, expiresAt });
  const payload = michelineStringPayload(message);
  const challenge = {
    v: 1,
    purpose: 'loom-claim',
    signingType: 'micheline',
    readOnly: true,
    address: account,
    code: claimCode,
    noteId: note,
    nonce: nonceHex,
    issuedAt,
    expiresAt,
    message,
    payload,
  };
  rejectSecrets(challenge);
  return challenge;
}

export async function verifySignChallenge(challenge, proof, now = new Date()) {
  rejectSecrets(challenge);
  rejectSecrets(proof);
  if (!challenge || challenge.v !== 1 || challenge.purpose !== 'loom-claim' || challenge.signingType !== 'micheline') {
    throw new ClaimError('bad-challenge');
  }
  const account = assertPublicAddress(challenge.address);
  if (!account.startsWith('tz1')) throw new ClaimError('ed25519-only');
  const claimCode = assertClaimCode(challenge.code);
  const note = assertNoteId(challenge.noteId);
  const issuedAt = assertIso(challenge.issuedAt);
  const expiresAt = assertIso(challenge.expiresAt);
  if (!NONCE_RE.test(challenge.nonce || '')) throw new ClaimError('bad-nonce');
  const message = challengeMessage({
    address: account,
    code: claimCode,
    noteId: note,
    nonce: challenge.nonce,
    issuedAt,
    expiresAt,
  });
  if (message !== challenge.message || michelineStringPayload(message) !== challenge.payload) {
    throw new ClaimError('tampered');
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new ClaimError('bad-time');
  if (now.getTime() >= Date.parse(expiresAt)) throw new ClaimError('expired');
  const rawPub = decodePrefixed(proof?.publicKey, EDPK, 32, 'bad-public-key');
  if (tz1FromPublicKeyBytes(rawPub) !== account) throw new ClaimError('address-mismatch');
  const sig = decodePrefixed(proof?.signature, EDSIG, 64, 'bad-signature');
  const hash = blake2b(hexToBytes(challenge.payload), 32);
  const spki = concat(ED_SPKI, rawPub);
  const key = createPublicKey({ key: Buffer.from(spki), format: 'der', type: 'spki' });
  const ok = verifyEd25519(null, Buffer.from(hash), key, Buffer.from(sig));
  if (!ok) throw new ClaimError('bad-signature');
  const record = { address: account, code: claimCode, noteId: note, issuedAt };
  return {
    ok: true,
    readOnly: true,
    address: account,
    code: claimCode,
    reply: formatXReply(claimCode),
    walletBook: formatWalletBook(record),
  };
}

export function formatWalletBook(record) {
  rejectSecrets(record);
  const address = assertPublicAddress(record?.address);
  const code = assertClaimCode(record?.code);
  const issuedAt = assertIso(record?.issuedAt);
  const domain = record?.domain ? assertTezName(record.domain) : null;
  const note = assertNoteId(record?.noteId ?? record?.note);
  const lines = ['#wallet-book v1', `address ${address}`, `code ${code}`];
  if (domain) lines.push(`domain ${domain}`);
  if (note) lines.push(`note ${note}`);
  lines.push(`issued ${issuedAt}`);
  const text = `${lines.join('\n')}\n`;
  rejectSecrets(text);
  return text;
}

export function parseWalletBook(text) {
  rejectSecrets(text);
  const lines = String(text || '').trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines[0] !== '#wallet-book v1') throw new ClaimError('bad-record');
  const allowed = ['address', 'code', 'domain', 'note', 'issued'];
  const map = {};
  for (const line of lines.slice(1)) {
    const gap = line.indexOf(' ');
    if (gap < 1) throw new ClaimError('bad-record');
    const key = line.slice(0, gap);
    const val = line.slice(gap + 1);
    if (!allowed.includes(key) || Object.hasOwn(map, key) || /\s/.test(val)) throw new ClaimError('bad-record');
    map[key] = val;
  }
  if (!map.address || !map.code || !map.issued) throw new ClaimError('bad-record');
  const record = {
    address: assertPublicAddress(map.address),
    code: assertClaimCode(map.code),
    domain: map.domain ? assertTezName(map.domain) : null,
    noteId: assertNoteId(map.note),
    issuedAt: assertIso(map.issued),
  };
  const canonical = formatWalletBook(record);
  if (canonical !== `${lines.join('\n')}\n`) throw new ClaimError('bad-record');
  return record;
}

async function readJson(fetchImpl, url) {
  let res;
  try {
    res = await fetchImpl(url, { method: 'GET', headers: { accept: 'application/json' } });
  } catch {
    throw new ClaimError('lookup-unavailable', 503);
  }
  if (!res?.ok) throw new ClaimError('lookup-unavailable', 503);
  try {
    return await res.json();
  } catch {
    throw new ClaimError('lookup-unavailable', 503);
  }
}

function accountOf(row) {
  const address = typeof row?.address === 'string' ? row.address : row?.address?.address;
  return isPublicAddress(address) ? address : null;
}

export async function lookupTezName(name, { fetchImpl = fetch } = {}) {
  const domain = assertTezName(name);
  const url = `${TZKT_ORIGIN}/v1/domains?name=${encodeURIComponent(domain)}&limit=1`;
  const rows = await readJson(fetchImpl, url);
  const row = Array.isArray(rows) ? rows[0] : null;
  const address = row ? accountOf(row) : null;
  const expiration = typeof row?.expiration === 'string' ? row.expiration : null;
  return {
    readOnly: true,
    kind: 'tez-fallback',
    prompt: TEZ_PROMPT,
    domain,
    address,
    found: Boolean(address),
    expired: Boolean(expiration && Date.parse(expiration) < Date.now()),
  };
}

export function addressPrompt(address) {
  const account = assertPublicAddress(address);
  return {
    readOnly: true,
    kind: 'address-check',
    prompt: TEZ_PROMPT,
    domain: null,
    address: account,
    found: true,
    expired: false,
  };
}

function noteFromRow(row) {
  const token = row?.token && typeof row.token === 'object' ? row.token : row;
  const contract = token?.contract?.address || token?.contract || row?.contract;
  const tokenId = token?.tokenId ?? token?.id ?? row?.tokenId;
  const name = token?.metadata?.name ?? token?.name ?? row?.name ?? null;
  if (typeof contract !== 'string' || !/^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(contract)) return null;
  if (tokenId == null || !/^\d{1,12}$/.test(String(tokenId))) return null;
  return {
    contract,
    tokenId: String(tokenId),
    name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 80) : null,
  };
}

export async function readHolderNotes(address, { fetchImpl = fetch, contracts = HOLDER_NOTE_CONTRACTS, limit = 20 } = {}) {
  const account = assertPublicAddress(address);
  const params = new URLSearchParams();
  params.set('account', account);
  params.set('limit', String(Math.max(1, Math.min(50, limit))));
  params.set('select', 'token.contract.address,token.tokenId,token.metadata.name');
  params.set(['bal', 'ance.gt'].join(''), '0');
  const list = Array.isArray(contracts) ? contracts.filter((item) => /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/.test(item)) : [];
  if (list.length) params.set('token.contract.in', list.join(','));
  const url = `${TZKT_ORIGIN}/v1/tokens/${['bal', 'ances'].join('')}?${params}`;
  const rows = await readJson(fetchImpl, url);
  const notes = [];
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const note = noteFromRow(row);
      if (note) notes.push(note);
    }
  }
  return { readOnly: true, address: account, notes };
}

/** In-memory claim bindings. Not the Loom log. Optional stand-in when no store is injected. */
export function memoryClaimStore() {
  const map = new Map();
  return {
    async get(code) {
      return map.get(code) ?? null;
    },
    async set(code, record) {
      map.set(code, { ...record });
    },
  };
}

export function issueBinding(challenge, { handle = null } = {}) {
  rejectSecrets(challenge);
  const handleText = handle == null || handle === '' ? null : String(handle).trim().slice(0, 80);
  if (handleText && !/^[A-Za-z0-9_.@:-]{1,80}$/.test(handleText)) throw new ClaimError('bad-handle');
  return {
    code: challenge.code,
    nonce: challenge.nonce,
    address: challenge.address,
    handle: handleText,
    noteId: challenge.noteId ?? null,
    issuedAt: challenge.issuedAt,
    expiresAt: challenge.expiresAt,
  };
}

export function matchBinding(binding, challenge, now = new Date()) {
  if (!binding) throw new ClaimError('code-unknown');
  const expiresAt = assertIso(binding.expiresAt);
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new ClaimError('bad-time');
  if (now.getTime() >= Date.parse(expiresAt)) throw new ClaimError('expired');
  if (binding.code !== challenge?.code) throw new ClaimError('mismatch');
  if (binding.nonce !== challenge?.nonce) throw new ClaimError('mismatch');
  if (binding.address !== challenge?.address) throw new ClaimError('mismatch');
  if ((binding.noteId ?? null) !== (challenge?.noteId ?? null)) throw new ClaimError('mismatch');
  if (expiresAt !== challenge?.expiresAt) throw new ClaimError('mismatch');
  return binding;
}

/** Sliding window. One clock, separate buckets for an IP and a handle. */
export function createSlidingLimiter({ windowMs = 60_000, max = 30, now = () => Date.now() } = {}) {
  const buckets = new Map();
  return function limit({ ip, handle }) {
    const keys = [`ip:${String(ip || 'anon').slice(0, 80)}`];
    if (handle) keys.push(`handle:${String(handle).slice(0, 80)}`);
    const at = now();
    const cutoff = at - windowMs;
    const open = [];
    for (const key of keys) {
      const hits = (buckets.get(key) || []).filter((stamp) => stamp > cutoff);
      if (hits.length >= max) {
        buckets.set(key, hits);
        return { allowed: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - at) / 1000)) };
      }
      open.push([key, hits]);
    }
    for (const [key, hits] of open) {
      hits.push(at);
      buckets.set(key, hits);
    }
    return { allowed: true, retryAfter: Math.max(1, Math.ceil(windowMs / 1000)) };
  };
}

export const claimLimiter = createSlidingLimiter();

export function clientIp(request) {
  const direct = request?.headers?.get?.('cf-connecting-ip');
  if (direct) return direct.slice(0, 80);
  const forwarded = request?.headers?.get?.('x-forwarded-for') || '';
  const first = forwarded.split(',')[0].trim();
  return (first || 'anon').slice(0, 80);
}

/**
 * Read posted #wallet-book records through handleLoom.
 * Same shape as the Loom route readers: an internal GET, then the kv
 * namespace is handed to handleLoom. This module does not open log keys.
 */
export async function readWalletBooks({ kv = null, readLoom = handleLoom, to = WALLET_BOOK_TO } = {}) {
  let res;
  try {
    res = await readLoom(new Request(`${LOOM_API}?to=${encodeURIComponent(to)}`), { kv });
  } catch {
    return { ok: false, via: 'handleLoom', records: [] };
  }
  let data = null;
  try {
    data = res && typeof res.json === 'function' ? await res.json() : null;
  } catch {
    data = null;
  }
  if (!data?.ok) return { ok: false, via: 'handleLoom', records: [] };
  const records = [];
  for (const message of Array.isArray(data.messages) ? data.messages : []) {
    if (!message || message.hidden || typeof message.body !== 'string') continue;
    if (!message.body.includes('#wallet-book v1')) continue;
    try {
      records.push({ ...parseWalletBook(message.body), id: message.id ?? null, at: message.at ?? null });
    } catch {
      /* a nearby post that is not a clean record */
    }
  }
  return { ok: true, via: 'handleLoom', to, records };
}
