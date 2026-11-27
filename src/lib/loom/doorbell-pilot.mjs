// Offline, single-writer staging harness. No production adapter or network transport.
import { createHash, createPublicKey, verify } from 'node:crypto';
const PINNED_KEY = "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA2vlBIQP0QyM27WvLQnZi0xFOT+laQKqNplI0tfe4/hQ=\n-----END PUBLIC KEY-----\n";
export const DESK = '@staging-pilot-desk';
export const ISSUER = 'synthetic-staging-issuer';
export const OPERATOR = 'staging-operator';
const SCOPE = 'loom:staging-pilot-read';
const FIELDS = ['cardId', 'title', 'room', 'scope', 'issuerId', 'issuedAt', 'bodySha256'];
const COUNTS = Object.freeze({ delivered: 0, wake: 0, read: 0, claimed: 0 });
const ID = /^[a-zA-Z0-9_:@-]{1,96}$/;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const deny = (error, counts = COUNTS) => ({ ok: false, error, counts: { ...counts } });
const own = (object, key) => Object.hasOwn(object, key);

export function canonicalTask(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields) ||
      Reflect.ownKeys(fields).length !== FIELDS.length ||
      FIELDS.some(k => !own(fields, k) || typeof fields[k] !== 'string' ||
        fields[k].length === 0 || fields[k].length > 256)) throw new Error('signed_fields_invalid');
  return Buffer.from(JSON.stringify(Object.fromEntries(FIELDS.map(k => [k, fields[k]]))));
}

// The card's embedded key is informational only. Trust comes from the fixture pin
// or explicitly supplied synthetic pins, never from the card or notification.
function checkCard(card, ref, charter, trustedIssuers) {
  if (!card) return 'card_unavailable';
  try {
    const fields = card.signedFields;
    const payload = canonicalTask(fields);
    const trusted = trustedIssuers.get(fields.issuerId);
    if (!trusted || card.publicKeyPem !== trusted) return 'issuer_untrusted';
    if (typeof card.body !== 'string' || sha256(card.body) !== fields.bodySha256) return 'body_hash_invalid';
    const sig = typeof card.signature === 'string' ? Buffer.from(card.signature, 'base64') : Buffer.alloc(0);
    const key = createPublicKey(trusted);
    if (sig.length !== 64 || sig.toString('base64') !== card.signature ||
        key.asymmetricKeyType !== 'ed25519' || !verify(null, payload, key, sig)) return 'signature_invalid';
    if (fields.cardId !== ref) return 'card_ref_mismatch';
    if (!charter.scopes.includes(fields.scope)) return 'scope_not_allowed';
    return null;
  } catch (cause) {
    return cause.message === 'signed_fields_invalid' ? cause.message : 'signature_invalid';
  }
}

// Store contract: synchronous load/save of a dedicated pilot journal, with one
// writer and atomic replacement. The replay script supplies a disk adapter.
// readCard resolves refs only against local staging fixtures.
export function createPilot({
  store, readCard, webhookDeliveryEnabled = false, liveWritesEnabled = false,
  desks = [{ desk: DESK, holderGeneration: 1, scopes: [SCOPE], operators: [OPERATOR] }],
  issuerPins = [[ISSUER, PINNED_KEY]],
} = {}) {
  if (webhookDeliveryEnabled !== false || liveWritesEnabled !== false) throw new Error('offline_flags_required');
  if (typeof store?.load !== 'function' || typeof store.save !== 'function' ||
      typeof readCard !== 'function') throw new Error('offline_adapters_required');
  const charter = new Map(desks.map(d => {
    if (!ID.test(d.desk) || !Number.isSafeInteger(d.holderGeneration) || d.holderGeneration < 1) {
      throw new Error('desk_config_invalid');
    }
    return [d.desk, structuredClone(d)];
  }));
  const trusted = new Map(issuerPins);
  function context(desk, generation, eventId) {
    const config = charter.get(desk);
    if (!config) return { rejected: deny('desk_not_opted_in') };
    if (generation !== config.holderGeneration) return { rejected: deny('holder_generation_stale') };
    const journal = store.load() ?? { subscriptions: {}, events: {} };
    const subKey = JSON.stringify([desk, generation]);
    const eventKey = JSON.stringify([desk, eventId]);
    const sub = journal.subscriptions[subKey] ?? { status: 'ACTIVE', empty: 0, cursor: 0, inFlight: null };
    const row = journal.events[eventKey];
    if (row && row.pointer.holderGeneration !== generation) return { rejected: deny('holder_generation_stale') };
    return { config, journal, sub, subKey, eventKey, row };
  }
  function commit(c) {
    c.journal.subscriptions[c.subKey] = c.sub;
    if (c.row) c.journal.events[c.eventKey] = c.row;
    store.save(c.journal);
  }
  const count = c => ({ ...(c.row?.counts ?? COUNTS) });
  const fingerprint = card => sha256(JSON.stringify([canonicalTask(card.signedFields).toString(), card.signature]));
  function deliver({ desk, eventId, cardRef, holderGeneration, cursor, createdAt }) {
    if (typeof eventId !== 'string' || !ID.test(eventId) || typeof cardRef !== 'string' ||
        !ID.test(cardRef) || !Number.isSafeInteger(cursor) || cursor < 1 ||
        typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt))) return deny('pointer_invalid');
    const c = context(desk, holderGeneration, eventId);
    if (c.rejected) return c.rejected;
    const pointer = {
      version: 1, subscriptionId: 'sub_' + sha256(c.subKey).slice(0, 24), eventId,
      wakeId: 'wake_' + sha256(JSON.stringify([c.subKey, eventId])).slice(0, 32),
      holderGeneration, inbox: desk, cursor, cardRef, createdAt,
    };
    if (c.row) {
      if (JSON.stringify(c.row.pointer) !== JSON.stringify(pointer)) return deny('event_id_conflict', count(c));
      c.row.counts.delivered++;
      commit(c);
      return { ok: true, duplicate: true, payload: null, counts: count(c) };
    }
    if (c.sub.status !== 'ACTIVE') return deny('subscription_sleeping');
    if (c.sub.inFlight) return deny('wake_in_flight');
    if (cursor <= c.sub.cursor) return deny('cursor_stale');
    c.row = { pointer, counts: { ...COUNTS, delivered: 1, wake: 1 }, scanned: false, ack: null, readError: null };
    c.sub.inFlight = eventId;
    commit(c);
    return { ok: true, duplicate: false, payload: { ...pointer }, counts: count(c) };
  }
  function read({ desk, eventId, holderGeneration }) {
    const c = context(desk, holderGeneration, eventId);
    if (c.rejected) return c.rejected;
    if (!c.row) return deny('event_unknown');
    if (c.row.scanned) return c.row.readError ? deny(c.row.readError, count(c)) : { ok: true, counts: count(c) };
    if (c.sub.status !== 'ACTIVE' || c.sub.inFlight !== eventId) return deny('wake_not_active', count(c));
    const ref = c.row.pointer.cardRef;
    const card = readCard(ref);
    const error = checkCard(card, ref, c.config, trusted);
    if (error === 'card_unavailable') return deny(error, count(c));
    c.row.scanned = true;
    c.row.readError = error;
    if (!error) {
      c.row.counts.read = 1;
      c.row.readFingerprint = fingerprint(card);
    }
    commit(c);
    return error ? deny(error, count(c)) : { ok: true, counts: count(c) };
  }
  function operatorClaim({ desk, eventId, operatorId, reason }) {
    const c = context(desk, charter.get(desk)?.holderGeneration, eventId);
    if (c.rejected) return c.rejected;
    if (!c.config.operators.includes(operatorId) || typeof reason !== 'string' ||
        !reason.trim() || reason.length > 280) return deny('operator_required', count(c));
    if (!c.row) return deny('event_unknown');
    const ref = c.row.pointer.cardRef;
    const card = readCard(ref);
    const error = checkCard(card, ref, c.config, trusted);
    if (error) return deny(error, count(c));
    if (c.row.counts.read !== 1) return deny('verified_read_required', count(c));
    if (c.row.readFingerprint !== fingerprint(card)) return deny('card_changed_since_read', count(c));
    if (c.row.counts.claimed) return { ok: true, duplicate: true, counts: count(c) };
    if (c.sub.status !== 'ACTIVE') return deny('subscription_sleeping', count(c));
    c.row.counts.claimed = 1;
    c.row.operator = { operatorId, reason: reason.trim() };
    commit(c);
    return { ok: true, duplicate: false, counts: count(c) };
  }
  function acknowledge({ desk, eventId, holderGeneration, wakeId, cursor, outcome }) {
    const c = context(desk, holderGeneration, eventId);
    if (c.rejected) return c.rejected;
    if (!c.row || c.row.pointer.wakeId !== wakeId || c.row.pointer.cursor !== cursor ||
        !['empty', 'work'].includes(outcome)) return deny('ack_invalid', count(c));
    if (c.row.ack) return c.row.ack === outcome ? { ok: true, duplicate: true, status: c.sub.status } : deny('ack_conflict', count(c));
    if (c.sub.inFlight !== eventId || !c.row.scanned ||
        (outcome === 'work') !== (c.row.counts.read === 1)) return deny('scan_incomplete_or_outcome_mismatch', count(c));
    c.row.ack = outcome;
    c.sub.inFlight = null;
    c.sub.cursor = cursor;
    c.sub.empty = outcome === 'empty' ? c.sub.empty + 1 : 0;
    if (c.sub.empty === 3) c.sub.status = 'SLEEPING';
    commit(c);
    return { ok: true, status: c.sub.status, empty: c.sub.empty };
  }
  function operatorResume({ desk, holderGeneration, operatorId }) {
    const c = context(desk, holderGeneration);
    if (c.rejected) return c.rejected;
    if (!c.config.operators.includes(operatorId)) return deny('operator_required');
    if (c.sub.status !== 'SLEEPING') return { ok: true, status: c.sub.status, changed: false };
    c.sub.status = 'ACTIVE';
    c.sub.empty = 0;
    commit(c);
    return { ok: true, status: c.sub.status, changed: true };
  }
  return Object.freeze({ deliver, read, operatorClaim, acknowledge, operatorResume,
    webhookDeliveryEnabled: false, liveWritesEnabled: false });
}
