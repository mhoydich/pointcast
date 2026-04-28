export const PROTOCOL_PACKET_VERSION = 'pcp-1.0';
export const PROTOCOL_PACKET_MEDIA_TYPE = 'pcp-1.0/block-packet+json';
export const PROTOCOL_FRIEND_CARD_VERSION = 'pcp-friend-card-1';
export const PROTOCOL_FRIEND_CARD_PREFIX = 'pcp-friend:';
export const PROTOCOL_CHAIN_REGISTRATION_VERSION = 'pcp-chain-registration-1';
export const PROTOCOL_CHAIN_ENVELOPE_VERSION = 'pcp-chain-envelope-1';

export const PROTOCOL_STORAGE_KEYS = {
  profile: 'pcp:v1:peer-profile',
  inbox: 'pcp:v1:inbox',
  outbox: 'pcp:v1:outbox',
  receipts: 'pcp:v1:receipts',
  trustedPeers: 'pcp:v1:trusted-peers',
  friends: 'pcp:v2:friends',
  chainRegistration: 'pcp:v2:chain-registration',
  chainOutbox: 'pcp:v2:chain-outbox',
  chainInbox: 'pcp:v2:chain-inbox',
};

export const PROTOCOL_RECEIPT_TYPES = [
  'created',
  'imported',
  'delivered',
  'read',
  'accepted',
  'rejected',
  'superseded',
];

export const PROTOCOL_PACKET_VISIBILITIES = ['local', 'public', 'private'];

const VALID_CHANNELS = new Set(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL', 'BDY']);
const VALID_TYPES = new Set(['READ', 'LISTEN', 'WATCH', 'MINT', 'FAUCET', 'NOTE', 'VISIT', 'LINK', 'TALK', 'BIRTHDAY']);
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

export function canonicalJson(value) {
  return JSON.stringify(sortForCanonicalJson(value));
}

export function sortForCanonicalJson(value) {
  if (Array.isArray(value)) return value.map(sortForCanonicalJson);
  if (!value || typeof value !== 'object') return value;

  const out = {};
  for (const key of Object.keys(value).sort()) {
    const next = value[key];
    if (next !== undefined) out[key] = sortForCanonicalJson(next);
  }
  return out;
}

export function packetMaterial(packet, options = {}) {
  const { includeId = false } = options;
  const copy = { ...packet };
  delete copy.signature;
  if (!includeId) delete copy.id;
  return copy;
}

export async function derivePacketId(packet) {
  const material = canonicalJson(packetMaterial(packet));
  const digest = await sha256Bytes(utf8Bytes(material));
  return `pc1:${base32(digest)}`;
}

export async function signPacket(packet, privateKeyBase64url) {
  const id = await derivePacketId(packet);
  const unsigned = { ...packetMaterial(packet, { includeId: true }), id };
  const privateKey = await importPrivateKey(privateKeyBase64url);
  const material = canonicalJson(unsigned);
  const signature = await crypto.subtle.sign('Ed25519', privateKey, utf8Bytes(material));

  return {
    ...unsigned,
    signature: {
      alg: 'Ed25519',
      value: bytesToBase64url(new Uint8Array(signature)),
    },
  };
}

export async function verifyPacketSignature(packet) {
  const structural = validatePacket(packet, { requireSignature: true });
  if (!structural.ok) return structural;

  const expectedId = await derivePacketId(packet);
  const errors = [];
  if (packet.id !== expectedId) errors.push(`id mismatch: expected ${expectedId}`);

  try {
    const publicKey = await importPublicKeyFromPeerId(packet.from);
    const signature = base64urlToBytes(packet.signature.value);
    const material = canonicalJson(packetMaterial(packet, { includeId: true }));
    const ok = await crypto.subtle.verify('Ed25519', publicKey, signature, utf8Bytes(material));
    if (!ok) errors.push('signature verification failed');
  } catch (err) {
    errors.push(`signature verification unavailable: ${err?.message || String(err)}`);
  }

  return { ok: errors.length === 0, errors };
}

export function validatePacket(packet, options = {}) {
  const { requireSignature = false } = options;
  const errors = [];

  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    return { ok: false, errors: ['packet must be an object'] };
  }

  if (packet.version !== PROTOCOL_PACKET_VERSION) errors.push(`version must be ${PROTOCOL_PACKET_VERSION}`);
  if (typeof packet.id !== 'string' || !/^pc1:[a-z2-7]{40,80}$/.test(packet.id)) errors.push('id must match pc1:<base32-sha256>');
  if (typeof packet.from !== 'string' || !packet.from.startsWith('peer:ed25519:')) errors.push('from must be peer:ed25519:<base64url-public-key>');
  if (!Array.isArray(packet.to) || packet.to.some((peer) => typeof peer !== 'string' || !peer.startsWith('peer:'))) errors.push('to must be an array of peer ids');
  if (typeof packet.createdAt !== 'string' || Number.isNaN(Date.parse(packet.createdAt))) errors.push('createdAt must be an ISO timestamp');
  if (!VALID_CHANNELS.has(packet.channel)) errors.push('channel must be a valid PointCast channel code');
  if (!VALID_TYPES.has(packet.type)) errors.push('type must be a valid PointCast block type');
  if (typeof packet.body !== 'string' || packet.body.length < 1 || packet.body.length > 4000) errors.push('body must be 1-4000 characters');

  const visibility = packet.permissions?.visibility;
  if (!PROTOCOL_PACKET_VISIBILITIES.includes(visibility)) errors.push('permissions.visibility must be local, public, or private');
  if (typeof packet.permissions?.agentReadable !== 'boolean') errors.push('permissions.agentReadable must be boolean');

  if (!packet.transport || typeof packet.transport !== 'object') errors.push('transport is required');
  if (packet.transport && typeof packet.transport.topic !== 'string') errors.push('transport.topic must be a string');

  if (!Array.isArray(packet.refs)) errors.push('refs must be an array');

  if (requireSignature || packet.signature) {
    if (packet.signature?.alg !== 'Ed25519') errors.push('signature.alg must be Ed25519');
    if (
      typeof packet.signature?.value !== 'string'
      || !/^[A-Za-z0-9_-]{64,}$/.test(packet.signature.value)
      || !isCanonicalBase64url(packet.signature.value)
    ) {
      errors.push('signature.value must be canonical base64url');
    }
  }

  return { ok: errors.length === 0, errors };
}

export function buildPacketDraft({
  from,
  to = [],
  body,
  channel = 'FD',
  type = 'NOTE',
  visibility = 'local',
  reply = 'mutuals',
  retention = 'local',
  agentReadable = true,
  topic = 'pcp/pointcast/messages',
  refs = [{ rel: 'protocol', href: 'https://pointcast.xyz/protocol' }],
  createdAt = new Date().toISOString(),
}) {
  return {
    version: PROTOCOL_PACKET_VERSION,
    from,
    to: Array.isArray(to) ? to.filter(Boolean) : [],
    createdAt,
    channel,
    type,
    body,
    refs,
    permissions: {
      visibility,
      reply,
      retention,
      agentReadable,
    },
    transport: {
      preferred: ['local-log', 'jsonl-export', 'relay-when-encrypted'],
      topic,
    },
  };
}

export function serializePacketsJsonl(packets) {
  return packets.map((packet) => JSON.stringify(sortForCanonicalJson(packet))).join('\n') + (packets.length ? '\n' : '');
}

export function parsePacketsJsonl(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function buildFriendCard(identity, options = {}) {
  const {
    label = identity?.displayName || 'PointCast friend',
    relay = 'https://pointcast.xyz/api/pcp/relay',
    topic = 'pcp/pointcast/friends',
    capabilities = ['signed-packets', 'jsonl-handoff', 'encrypted-relay-ready'],
    createdAt = new Date().toISOString(),
  } = options;

  return {
    version: PROTOCOL_FRIEND_CARD_VERSION,
    peerId: identity?.peerId || '',
    label,
    kind: identity?.kind || 'human',
    relay,
    topic,
    capabilities,
    createdAt,
  };
}

export function validateFriendCard(card) {
  const errors = [];
  if (!card || typeof card !== 'object' || Array.isArray(card)) return { ok: false, errors: ['friend card must be an object'] };
  if (card.version !== PROTOCOL_FRIEND_CARD_VERSION) errors.push(`version must be ${PROTOCOL_FRIEND_CARD_VERSION}`);
  if (typeof card.peerId !== 'string' || !card.peerId.startsWith('peer:ed25519:')) errors.push('peerId must be peer:ed25519:<base64url-public-key>');
  if (typeof card.label !== 'string' || card.label.length < 1 || card.label.length > 80) errors.push('label must be 1-80 characters');
  if (!['human', 'agent', 'device'].includes(card.kind)) errors.push('kind must be human, agent, or device');
  if (typeof card.relay !== 'string' || !/^https:\/\//.test(card.relay)) errors.push('relay must be an https URL');
  if (typeof card.topic !== 'string' || card.topic.length < 1 || card.topic.length > 180) errors.push('topic must be 1-180 characters');
  if (!Array.isArray(card.capabilities) || card.capabilities.some((cap) => typeof cap !== 'string')) errors.push('capabilities must be an array of strings');
  if (typeof card.createdAt !== 'string' || Number.isNaN(Date.parse(card.createdAt))) errors.push('createdAt must be an ISO timestamp');
  return { ok: errors.length === 0, errors };
}

export function encodeFriendCard(card) {
  const validation = validateFriendCard(card);
  if (!validation.ok) throw new Error(validation.errors.join('; '));
  return `${PROTOCOL_FRIEND_CARD_PREFIX}${bytesToBase64url(utf8Bytes(canonicalJson(card)))}`;
}

export function parseFriendCard(value) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error('friend card is empty');
  const json = raw.startsWith(PROTOCOL_FRIEND_CARD_PREFIX)
    ? new TextDecoder().decode(base64urlToBytes(raw.slice(PROTOCOL_FRIEND_CARD_PREFIX.length)))
    : raw;
  const card = JSON.parse(json);
  const validation = validateFriendCard(card);
  if (!validation.ok) throw new Error(validation.errors.join('; '));
  return card;
}

export async function buildChainRegistration(identity, options = {}) {
  const {
    chain = 'tezos:mainnet',
    walletAddress = '',
    relay = 'https://pointcast.xyz/api/pcp/relay',
    createdAt = new Date().toISOString(),
  } = options;

  const registration = {
    version: PROTOCOL_CHAIN_REGISTRATION_VERSION,
    chain,
    peerId: identity?.peerId || '',
    label: identity?.displayName || 'PointCast peer',
    kind: identity?.kind || 'human',
    walletAddress,
    relay,
    createdAt,
  };

  return {
    ...registration,
    id: `pcr:${await sha256Hex(canonicalJson(registration))}`,
  };
}

export function validateChainRegistration(registration) {
  const errors = [];
  if (!registration || typeof registration !== 'object' || Array.isArray(registration)) {
    return { ok: false, errors: ['registration must be an object'] };
  }
  if (registration.version !== PROTOCOL_CHAIN_REGISTRATION_VERSION) errors.push(`version must be ${PROTOCOL_CHAIN_REGISTRATION_VERSION}`);
  if (typeof registration.id !== 'string' || !/^pcr:[a-f0-9]{64}$/.test(registration.id)) errors.push('id must match pcr:<sha256-hex>');
  if (typeof registration.chain !== 'string' || registration.chain.length < 3) errors.push('chain is required');
  if (typeof registration.peerId !== 'string' || !registration.peerId.startsWith('peer:ed25519:')) errors.push('peerId must be peer:ed25519:<base64url-public-key>');
  if (typeof registration.label !== 'string' || registration.label.length < 1 || registration.label.length > 80) errors.push('label must be 1-80 characters');
  if (!['human', 'agent', 'device'].includes(registration.kind)) errors.push('kind must be human, agent, or device');
  if (typeof registration.walletAddress !== 'string' || !/^(tz1|tz2|tz3|KT1)[A-Za-z0-9]{30,40}$/.test(registration.walletAddress)) errors.push('walletAddress must be a Tezos address');
  if (typeof registration.relay !== 'string' || !/^https:\/\//.test(registration.relay)) errors.push('relay must be an https URL');
  if (typeof registration.createdAt !== 'string' || Number.isNaN(Date.parse(registration.createdAt))) errors.push('createdAt must be an ISO timestamp');
  return { ok: errors.length === 0, errors };
}

export async function buildChainEnvelope(packet, options = {}) {
  const {
    chain = 'tezos:mainnet',
    registrationId = '',
    mode = 'private-hash',
    createdAt = new Date().toISOString(),
    relay = 'https://pointcast.xyz/api/pcp/relay',
  } = options;

  const bodyHash = await sha256Hex(packet?.body || '');
  const packetHash = await sha256Hex(canonicalJson(packet || {}));
  const envelope = {
    version: PROTOCOL_CHAIN_ENVELOPE_VERSION,
    chain,
    mode,
    packetId: packet?.id || '',
    packetHash,
    bodyHash,
    from: packet?.from || '',
    to: Array.isArray(packet?.to) ? packet.to : [],
    topic: packet?.transport?.topic || 'pcp/pointcast/messages',
    createdAt,
    registrationId,
    relay,
    packetSignature: packet?.signature || null,
    ...(mode === 'public-body' ? { body: packet?.body || '' } : {}),
  };

  return {
    ...envelope,
    id: `pce:${await sha256Hex(canonicalJson(envelope))}`,
  };
}

export function validateChainEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { ok: false, errors: ['envelope must be an object'] };
  }
  if (envelope.version !== PROTOCOL_CHAIN_ENVELOPE_VERSION) errors.push(`version must be ${PROTOCOL_CHAIN_ENVELOPE_VERSION}`);
  if (typeof envelope.id !== 'string' || !/^pce:[a-f0-9]{64}$/.test(envelope.id)) errors.push('id must match pce:<sha256-hex>');
  if (typeof envelope.chain !== 'string' || envelope.chain.length < 3) errors.push('chain is required');
  if (!['private-hash', 'public-body'].includes(envelope.mode)) errors.push('mode must be private-hash or public-body');
  if (typeof envelope.packetId !== 'string' || !/^pc1:[a-z2-7]{40,80}$/.test(envelope.packetId)) errors.push('packetId must match pc1:<base32-sha256>');
  if (typeof envelope.packetHash !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.packetHash)) errors.push('packetHash must be sha256 hex');
  if (typeof envelope.bodyHash !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.bodyHash)) errors.push('bodyHash must be sha256 hex');
  if (typeof envelope.from !== 'string' || !envelope.from.startsWith('peer:ed25519:')) errors.push('from must be peer:ed25519:<base64url-public-key>');
  if (!Array.isArray(envelope.to) || envelope.to.some((peer) => typeof peer !== 'string' || !peer.startsWith('peer:'))) errors.push('to must be an array of peer ids');
  if (typeof envelope.topic !== 'string' || envelope.topic.length < 1 || envelope.topic.length > 180) errors.push('topic must be 1-180 characters');
  if (typeof envelope.createdAt !== 'string' || Number.isNaN(Date.parse(envelope.createdAt))) errors.push('createdAt must be an ISO timestamp');
  if (envelope.registrationId && !/^pcr:[a-f0-9]{64}$/.test(envelope.registrationId)) errors.push('registrationId must match pcr:<sha256-hex>');
  if (typeof envelope.relay !== 'string' || !/^https:\/\//.test(envelope.relay)) errors.push('relay must be an https URL');
  if (!envelope.packetSignature || envelope.packetSignature.alg !== 'Ed25519' || typeof envelope.packetSignature.value !== 'string') errors.push('packetSignature must be an Ed25519 signature object');
  if (envelope.mode === 'private-hash' && typeof envelope.body === 'string' && envelope.body.trim()) errors.push('private-hash envelopes must not include body');
  return { ok: errors.length === 0, errors };
}

export async function generatePeerIdentity({ displayName = 'PointCast peer', kind = 'human' } = {}) {
  const keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const publicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  const privatePkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
  const publicKey = bytesToBase64url(publicRaw);

  return {
    peerId: `peer:ed25519:${publicKey}`,
    displayName,
    kind,
    publicKey,
    privateKey: bytesToBase64url(privatePkcs8),
    createdAt: new Date().toISOString(),
    implementation: 'WebCrypto Ed25519',
  };
}

export async function importPrivateKey(privateKeyBase64url) {
  return crypto.subtle.importKey(
    'pkcs8',
    base64urlToBytes(privateKeyBase64url),
    'Ed25519',
    false,
    ['sign'],
  );
}

export async function importPublicKeyFromPeerId(peerId) {
  const raw = String(peerId || '').replace(/^peer:ed25519:/, '');
  if (!raw || raw === peerId) throw new Error('unsupported peer id');
  return crypto.subtle.importKey('raw', base64urlToBytes(raw), 'Ed25519', false, ['verify']);
}

export function shortPeerId(peerId) {
  const s = String(peerId || '');
  if (s.length <= 28) return s;
  return `${s.slice(0, 18)}...${s.slice(-8)}`;
}

export function utf8Bytes(value) {
  return new TextEncoder().encode(String(value));
}

export async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function sha256Hex(value) {
  return bytesToHex(await sha256Bytes(utf8Bytes(value)));
}

export function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function base32(bytes) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function bytesToBase64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function base64urlToBytes(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

function isCanonicalBase64url(value) {
  try {
    return bytesToBase64url(base64urlToBytes(value)) === value;
  } catch {
    return false;
  }
}
