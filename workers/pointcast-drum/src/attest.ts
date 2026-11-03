/**
 * Room attestations for pointcast-chain `drum_session` transactions.
 *
 * Byte-for-byte port of chain-core `SessionClaim::digest` / `room_digest`
 * (crates/chain-core/src/attest.rs). The room server signs `room_digest`
 * with Ed25519; pointcast-chain verifies it against `State.drum_attestors`.
 *
 *   enc = str(chain_id) ‖ genesis[32] ‖ str(sender) ‖ u64(nonce) ‖ str(room)
 *       ‖ u32(n) ‖ str(player_i)… ‖ beat_hash[32] ‖ u32(duration) ‖ u64(ended_at_ms)
 *   session = blake2b_256("pointcast-chain/drum-attest/v2" ‖ enc)
 *   room    = blake2b_256("pointcast-chain/drum-room/v1" ‖ session)
 *
 * str = big-endian u32 byte length + UTF-8. All integers big-endian.
 */
import { base58check } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { blake2b } from '@noble/hashes/blake2.js';

export const SESSION_TAG = 'pointcast-chain/drum-attest/v2';
export const ROOM_TAG = 'pointcast-chain/drum-room/v1';

export interface SessionClaim {
  chain_id: string;
  genesis: string; // 32-byte hex
  sender: string;
  nonce: bigint;
  room: string;
  players: string[]; // strictly ascending
  beat_hash: string; // 32-byte hex
  duration: number; // seconds, u32
  ended_at_ms: bigint;
}

const te = new TextEncoder();

export function hexToBytes(hex: string, len?: number): Uint8Array {
  if (!/^([0-9a-fA-F]{2})*$/.test(hex)) throw new Error('bad hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  if (len !== undefined && out.length !== len) throw new Error(`expected ${len} bytes`);
  return out;
}

export function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

class Encoder {
  parts: Uint8Array[] = [];
  u32(v: number) {
    if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) throw new Error('u32 out of range');
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v, false);
    this.parts.push(b);
    return this;
  }
  u64(v: bigint) {
    if (v < 0n || v > 0xffffffffffffffffn) throw new Error('u64 out of range');
    const b = new Uint8Array(8);
    new DataView(b.buffer).setBigUint64(0, v, false);
    this.parts.push(b);
    return this;
  }
  fixed(v: Uint8Array) {
    this.parts.push(v);
    return this;
  }
  str(s: string) {
    const b = te.encode(s);
    this.u32(b.length);
    this.parts.push(b);
    return this;
  }
  finish(): Uint8Array {
    const n = this.parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of this.parts) { out.set(p, o); o += p.length; }
    return out;
  }
}

function blake2b256(...parts: Uint8Array[]): Uint8Array {
  const h = blake2b.create({ dkLen: 32 });
  for (const p of parts) h.update(p);
  return h.digest();
}

export function sessionDigest(c: SessionClaim): Uint8Array {
  const e = new Encoder();
  e.str(c.chain_id).fixed(hexToBytes(c.genesis, 32)).str(c.sender).u64(c.nonce).str(c.room).u32(c.players.length);
  for (const p of c.players) e.str(p);
  e.fixed(hexToBytes(c.beat_hash, 32)).u32(c.duration).u64(c.ended_at_ms);
  return blake2b256(te.encode(SESSION_TAG), e.finish());
}

export function roomDigest(c: SessionClaim): Uint8Array {
  return blake2b256(te.encode(ROOM_TAG), sessionDigest(c));
}

/** Byte-wise strictly ascending, matching the chain's `Address` ordering for ASCII addresses. */
export function strictlyAscending(xs: string[]): boolean {
  for (let i = 1; i < xs.length; i++) if (!(xs[i - 1]! < xs[i]!)) return false;
  return true;
}

// PKCS#8 wrapper for a raw 32-byte Ed25519 seed (RFC 8410).
const PKCS8_ED25519_PREFIX = hexToBytes('302e020100300506032b657004220420');

export interface Attestor {
  publicKeyHex: string;
  sign(msg: Uint8Array): Promise<Uint8Array>;
}

/** Import a 32-byte hex seed as an Ed25519 signer via WebCrypto (works in Workers and Node ≥ 20). */
export async function importAttestor(seedHex: string): Promise<Attestor> {
  const seed = hexToBytes(seedHex.trim(), 32);
  const pkcs8 = new Uint8Array(PKCS8_ED25519_PREFIX.length + 32);
  pkcs8.set(PKCS8_ED25519_PREFIX);
  pkcs8.set(seed, PKCS8_ED25519_PREFIX.length);
  const key = (await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign'])) as CryptoKey;
  const jwk = (await crypto.subtle.exportKey('jwk', key)) as JsonWebKey;
  const pub = Uint8Array.from(atob(jwk.x!.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
  const signingKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
  return {
    publicKeyHex: bytesToHex(pub),
    async sign(msg: Uint8Array) {
      return new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, signingKey, msg));
    },
  };
}

/** Parse and validate an /attest request body. Throws with a readable reason. */
export function parseClaim(body: unknown): SessionClaim {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('body must be a JSON object');
  const b = body as Record<string, unknown>;
  const str = (k: string, max = 128) => {
    const v = b[k];
    if (typeof v !== 'string' || v.length === 0 || v.length > max) throw new Error(`${k} must be a non-empty string`);
    return v;
  };
  const big = (k: string) => {
    const v = b[k];
    if (typeof v !== 'string' && typeof v !== 'number') throw new Error(`${k} must be an integer`);
    if (typeof v === 'number' && !Number.isSafeInteger(v)) throw new Error(`${k} must be a safe integer or a decimal string`);
    if (typeof v === 'string' && !/^\d{1,20}$/.test(v)) throw new Error(`${k} must be a decimal string`);
    const n = BigInt(v);
    if (n < 0n || n > 0xffffffffffffffffn) throw new Error(`${k} must fit u64`);
    return n;
  };
  const players = b.players;
  if (!Array.isArray(players) || players.length === 0 || players.length > 32) throw new Error('players must be 1–32 addresses');
  for (const p of players) if (typeof p !== 'string' || p.length === 0 || p.length > 64) throw new Error('bad player address');
  if (!strictlyAscending(players as string[])) throw new Error('players must be sorted strictly ascending');
  const duration = b.duration;
  if (typeof duration !== 'number' || !Number.isInteger(duration) || duration <= 0 || duration > 3600) throw new Error('duration must be 1–3600 seconds');
  const claim: SessionClaim = {
    chain_id: str('chain_id', 64),
    genesis: str('genesis', 64),
    sender: str('sender', 64),
    nonce: big('nonce'),
    room: str('room', 64),
    players: players as string[],
    beat_hash: str('beat_hash', 64),
    duration,
    ended_at_ms: big('ended_at_ms'),
  };
  hexToBytes(claim.genesis, 32);
  hexToBytes(claim.beat_hash, 32);
  return claim;
}

/** Only direct tz1 Ed25519 identities are supported: no asserted address is trusted. */
export function playerForKey(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) throw new Error('bad public key');
  const bytes = new Uint8Array(23);
  bytes.set([6, 161, 159]); // Tezos tz1 prefix + blake2b-160(public key)
  bytes.set(blake2b(publicKey, { dkLen: 20 }), 3);
  return base58check(sha256).encode(bytes);
}

export function joinDigest(chainId: string, genesis: string, room: string, challenge: string): Uint8Array {
  const e = new Encoder().str(chainId).fixed(hexToBytes(genesis, 32)).str(room).str(challenge);
  return blake2b256(te.encode('pointcast-chain/drum-join/v1'), e.finish());
}

/** HTTP authorization is separate from the room signature and the join challenge. */
export function requestDigest(claim: SessionClaim): Uint8Array {
  return blake2b256(te.encode('pointcast-chain/drum-request/v1'), roomDigest(claim));
}
