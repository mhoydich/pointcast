/**
 * Staging doorbell pilot.
 *
 * Aligns with docs/loom/wake-on-events.md: a wake is a reason to read the
 * board, never permission to execute the card, post, or call a webhook.
 * Webhook delivery and live writes are hard-off. Nothing here touches KV,
 * D1, the network, or the atomic-append rehearsal.
 *
 * The Ed25519 signature covers only the canonical task fields. An assignee
 * and any @mention in the body are untrusted text. The only desk that can
 * receive a wake is the explicitly opted-in staging desk, and a replay of
 * the same event id does not create another wake or read. A claim is a
 * separate operator action.
 */

import { createHash, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';

export const CANONICAL_FIELDS = Object.freeze([
  'cardId',
  'title',
  'room',
  'scope',
  'issuerId',
  'issuedAt',
  'bodySha256',
]);

/** Synthetic staging issuer. This key authorizes nothing outside the pilot. */
export const PINNED_PUBLIC_KEY = 'G6vXXsMUXmnDmbCpJXjKFcpB+HM2nmV804XFJ63egfA=';

export const PILOT_FLAGS = Object.freeze({
  webhookDeliveryEnabled: false,
  liveWritesEnabled: false,
});

export const OPTED_IN_DESK = '@staging-pilot-desk';
export const PILOT_ROOM = '#staging-pilot';
export const PILOT_SCOPE = 'loom-doorbell-pilot:read';
export const PILOT_ISSUER_ID = 'issuer-staging-pilot';
export const PILOT_CLOCK = '2026-11-27T13:00:00.000Z';

const CANONICAL_PREFIX = 'pointcast.loom-doorbell-pilot/v1';
const MENTION_RE = /@([a-z0-9]+(?:-[a-z0-9]+)*)/g;
const ISSUED_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const FORBIDDEN_INPUTS = ['fetch', 'kv', 'write', 'webhook', 'webhookUrl', 'liveWrite'];

function assertPilotClosed(input) {
  if (PILOT_FLAGS.webhookDeliveryEnabled !== false || PILOT_FLAGS.liveWritesEnabled !== false) {
    throw new Error('doorbell_pilot_flags_locked');
  }
  if (!input || typeof input !== 'object') return;
  if (input.webhookDeliveryEnabled === true || input.liveWritesEnabled === true) {
    throw new Error('doorbell_pilot_flags_locked');
  }
  for (const key of FORBIDDEN_INPUTS) {
    if (input[key] != null) throw new Error('live_writes_disabled');
  }
}

function rawKey(value, label) {
  const bytes = Buffer.from(String(value ?? ''), 'base64');
  if (bytes.length !== 32) throw new Error(`${label}_invalid`);
  return bytes;
}

function publicKeyFromRaw(value) {
  return createPublicKey({
    key: Buffer.concat([SPKI_PREFIX, rawKey(value, 'public_key')]),
    format: 'der',
    type: 'spki',
  });
}

function privateKeyFromRaw(value) {
  return createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, rawKey(value, 'secret_key')]),
    format: 'der',
    type: 'pkcs8',
  });
}

export function bodySha256(body) {
  return createHash('sha256').update(String(body ?? ''), 'utf8').digest('hex');
}

export function canonicalTaskBytes(card) {
  const lines = [CANONICAL_PREFIX];
  for (const field of CANONICAL_FIELDS) {
    const value = card?.[field];
    if (typeof value !== 'string' || value.length === 0 || /[\r\n]/.test(value)) {
      throw new Error('canonical_field_invalid');
    }
    lines.push(`${field}=${value}`);
  }
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

export function untrustedMentions(body) {
  const found = new Set();
  for (const match of String(body ?? '').matchAll(MENTION_RE)) found.add(`@${match[1]}`);
  return [...found];
}

export function signCard(card, secretKey) {
  assertPilotClosed();
  const signed = {};
  for (const field of CANONICAL_FIELDS) signed[field] = card?.[field];
  if (signed.bodySha256 == null && typeof card?.body === 'string') signed.bodySha256 = bodySha256(card.body);
  return sign(null, canonicalTaskBytes(signed), privateKeyFromRaw(secretKey)).toString('base64');
}

export function verifyCard(card, material = {}) {
  assertPilotClosed(material);
  const refused = (reason, signatureOk = false, scopeOk = false) => ({
    ok: false,
    reason,
    signatureOk,
    scopeOk,
  });
  if (!card || typeof card !== 'object' || Array.isArray(card)) return refused('card_invalid');
  if (typeof card.body !== 'string' || bodySha256(card.body) !== card.bodySha256) return refused('signature_invalid');
  if (material.publicKey !== PINNED_PUBLIC_KEY) return refused('signature_invalid');
  if (typeof material.signature !== 'string' || material.signature.length === 0) return refused('signature_invalid');

  let signatureOk = false;
  try {
    const message = canonicalTaskBytes(card);
    const sig = Buffer.from(material.signature, 'base64');
    signatureOk = sig.length === 64 && verify(null, message, publicKeyFromRaw(material.publicKey), sig);
  } catch {
    signatureOk = false;
  }
  if (!signatureOk) return refused('signature_invalid');
  if (card.issuerId !== PILOT_ISSUER_ID || !ISSUED_AT_RE.test(card.issuedAt)) return refused('signature_invalid', true, false);
  if (card.scope !== PILOT_SCOPE || card.room !== PILOT_ROOM) return refused('out_of_scope', true, false);
  return { ok: true, reason: 'verified', signatureOk: true, scopeOk: true, alg: 'Ed25519' };
}

function countsOf(state) {
  return {
    deliveries: state.deliveries.length,
    wakes: state.wakes.size,
    reads: state.reads.size,
    claims: state.claims.size,
  };
}

function wakesFor(state, desk) {
  let n = 0;
  for (const wake of state.wakes.values()) if (wake.desk === desk) n += 1;
  return n;
}

/**
 * In-memory pilot. `delivered`, `read`, and `claimed` are separate records.
 * A delivery never claims, a read never claims, and a replay never adds a wake.
 */
export function createDoorbellPilot(options = {}) {
  assertPilotClosed(options);
  const clock = typeof options.clock === 'function' ? options.clock : () => PILOT_CLOCK;
  const state = {
    deliveries: [],
    wakes: new Map(),
    reads: new Map(),
    claims: new Map(),
    blocked: [],
  };

  function deliver(envelope = {}) {
    assertPilotClosed(envelope);
    const mentions = untrustedMentions(envelope.card?.body);
    const mentionWakes = 0;
    if (envelope.desk !== OPTED_IN_DESK) {
      state.blocked.push(Object.freeze({
        desk: typeof envelope.desk === 'string' ? envelope.desk : null,
        reason: 'desk_not_opted_in',
        mentions: Object.freeze([...mentions]),
      }));
      return {
        ok: false,
        reason: 'desk_not_opted_in',
        mentionWakes,
        wakesForDesk: wakesFor(state, envelope.desk),
        ...countsOf(state),
      };
    }

    const verdict = verifyCard(envelope.card, envelope);
    if (!verdict.ok) {
      return {
        ok: false,
        reason: verdict.reason,
        mentionWakes,
        wakesForUnopted: wakesFor(state, '@unopted-desk'),
        ...countsOf(state),
      };
    }

    const eventId = envelope.eventId;
    if (typeof eventId !== 'string' || eventId.length === 0) {
      return { ok: false, reason: 'event_id_required', mentionWakes, ...countsOf(state) };
    }

    const prior = state.reads.get(eventId);
    if (prior && (prior.cardId !== envelope.card.cardId || prior.bodySha256 !== envelope.card.bodySha256)) {
      return { ok: false, reason: 'event_mismatch', mentionWakes, ...countsOf(state) };
    }

    state.deliveries.push(Object.freeze({
      state: 'delivered',
      eventId,
      desk: OPTED_IN_DESK,
      cardId: envelope.card.cardId,
      at: clock(),
    }));

    if (!state.wakes.has(eventId)) {
      state.wakes.set(eventId, Object.freeze({
        eventId,
        desk: OPTED_IN_DESK,
        cardId: envelope.card.cardId,
        at: clock(),
      }));
    }

    if (!state.reads.has(eventId)) {
      state.reads.set(eventId, Object.freeze({
        state: 'read',
        eventId,
        desk: OPTED_IN_DESK,
        cardId: envelope.card.cardId,
        bodySha256: envelope.card.bodySha256,
        alg: 'Ed25519',
        scope: envelope.card.scope,
        scopeVerified: true,
        at: clock(),
      }));
    }

    return {
      ok: true,
      reason: prior ? 'replay' : 'accepted',
      duplicate: Boolean(prior),
      mentionWakes,
      ignoredMentions: mentions,
      readCheck: 'ed25519+scope',
      wakesForUnopted: wakesFor(state, '@unopted-desk'),
      ...countsOf(state),
    };
  }

  function operatorClaim(request = {}) {
    assertPilotClosed(request);
    const verdict = verifyCard(request.card, request);
    if (!verdict.ok) {
      const reason = verdict.reason === 'out_of_scope' ? 'out_of_scope' : 'signature_invalid';
      return { ok: false, reason, idempotent: false, ...countsOf(state) };
    }
    const eventId = request.eventId;
    const read = typeof eventId === 'string' ? state.reads.get(eventId) : undefined;
    if (!read || read.cardId !== request.card.cardId || read.bodySha256 !== request.card.bodySha256 || read.scopeVerified !== true) {
      return { ok: false, reason: 'not_read', idempotent: false, ...countsOf(state) };
    }
    if (typeof request.operatorId !== 'string' || request.operatorId.length === 0) {
      return { ok: false, reason: 'operator_required', idempotent: false, ...countsOf(state) };
    }

    const existing = state.claims.get(eventId);
    if (existing) {
      return {
        ok: true,
        reason: 'idempotent',
        idempotent: true,
        claim: { ...existing },
        ...countsOf(state),
      };
    }

    const claim = Object.freeze({
      state: 'claimed',
      eventId,
      cardId: request.card.cardId,
      operatorId: request.operatorId,
      at: clock(),
    });
    state.claims.set(eventId, claim);
    return {
      ok: true,
      reason: 'claimed',
      idempotent: false,
      claim: { ...claim },
      ...countsOf(state),
    };
  }

  function snapshot() {
    assertPilotClosed();
    return {
      webhookDeliveryEnabled: false,
      liveWritesEnabled: false,
      optedInDesk: OPTED_IN_DESK,
      deliveries: state.deliveries.map((row) => ({ ...row })),
      wakes: [...state.wakes.values()].map((row) => ({ ...row })),
      reads: [...state.reads.values()].map((row) => ({ ...row })),
      claims: [...state.claims.values()].map((row) => ({ ...row })),
      blocked: state.blocked.map((row) => ({ ...row, mentions: [...row.mentions] })),
      counts: countsOf(state),
    };
  }

  return Object.freeze({
    flags: PILOT_FLAGS,
    deliver,
    operatorClaim,
    snapshot,
  });
}
