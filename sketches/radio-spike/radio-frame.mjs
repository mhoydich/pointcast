/**
 * Layers Radio v1 frame codec — spike build (not shipped).
 *
 * Byte layout (multi-byte fields big endian), per the Layers Radio PRD:
 *   0..1   magic "LR" (0x4C 0x52)
 *   2      version = 1
 *   3      type: 1 = mood only (L must be 0), 2 = mood + text (1 <= L <= 32)
 *   4..7   alias: 4 random bytes, per browser, unverified
 *   8..9   message id: uint16, wraps 65535 -> 0
 *   10     mood: 1..7
 *   11     flags: bit0 = noun id present; bits 1..7 reserved, must be 0
 *   12     L: text length in bytes
 *   13..14 noun id (only when flags bit0): uint16, 0..NOUN_MAX, cosmetic
 *   then   exactly L bytes of strict UTF-8 (no overlong forms, no surrogates)
 *
 * Minimum 13 bytes (mood only), maximum 47 (noun + 32 text). ggwave carries
 * its own error correction; nothing here authenticates a sender.
 *
 * Runs in Node and the browser (no imports).
 */
export const MAGIC = Object.freeze([0x4c, 0x52]);
export const VERSION = 1;
export const TYPES = Object.freeze({ MOOD: 1, TEXT: 2 });
export const HEADER_BYTES = 13;
export const TEXT_MAX_BYTES = 32;
export const FRAME_MAX_BYTES = HEADER_BYTES + 2 + TEXT_MAX_BYTES; // 47
export const FLAG_NOUN = 0x01;
export const FLAGS_RESERVED_MASK = 0xfe;
/** Spike constant: Visit Nouns seeds run 0..1199 (noun.pics). Freeze for real at schema freeze. */
export const NOUN_MAX = 1199;

export const MOODS = Object.freeze([
  Object.freeze({ id: 1, name: 'Calm',      key: 'c', motif: 'Slow falling 3-note sine',        overlay: 'Sky blue wash, slow ripple' }),
  Object.freeze({ id: 2, name: 'Hype',      key: 'h', motif: 'Fast rising arpeggio',            overlay: 'Warm wash, bright ripples' }),
  Object.freeze({ id: 3, name: 'Love',      key: 'l', motif: 'Two-note chime, repeated',        overlay: 'Pink wash, soft ripples' }),
  Object.freeze({ id: 4, name: 'Silly',     key: 's', motif: 'Pitch-bend wobble',               overlay: 'Hue cycle, ripple burst' }),
  Object.freeze({ id: 5, name: 'Focus',     key: 'f', motif: 'Single low tone',                 overlay: 'Dim wash, light scanlines' }),
  Object.freeze({ id: 6, name: 'Storm',     key: 't', motif: 'Noise swell, capped at 0.5',      overlay: 'Dark wash, grain, fast ripples' }),
  Object.freeze({ id: 7, name: 'Goodnight', key: 'g', motif: 'Descending 4-note lullaby',       overlay: 'Deep indigo, visuals fade out over 10 s' }),
]);
export const moodById = id => MOODS.find(m => m.id === id) || null;

export class FrameError extends Error {
  constructor(code, message) { super(message); this.name = 'FrameError'; this.code = code; }
}
const fail = (code, message) => { throw new FrameError(code, message); };

const encoder = new TextEncoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/** Byte length of a string in UTF-8, without truncating. */
export const utf8Length = text => encoder.encode(text).length;

/** Explain remaining capacity for a composer: {bytes, remaining, over}. */
export function textBudget(text) {
  const bytes = utf8Length(text || '');
  return { bytes, remaining: Math.max(0, TEXT_MAX_BYTES - bytes), over: Math.max(0, bytes - TEXT_MAX_BYTES) };
}

function checkAlias(alias) {
  if (!(alias instanceof Uint8Array) || alias.length !== 4) fail('alias', 'alias must be 4 bytes');
}

/**
 * encodeFrame({ alias: Uint8Array(4), messageId: 0..65535, mood: 1..7, text?: string, noun?: 0..NOUN_MAX })
 * Returns a Uint8Array of 13..47 bytes. Rejects instead of truncating.
 */
export function encodeFrame({ alias, messageId, mood, text = '', noun } = {}) {
  checkAlias(alias);
  if (!Number.isInteger(messageId) || messageId < 0 || messageId > 0xffff) fail('messageId', 'messageId must be uint16');
  if (!Number.isInteger(mood) || mood < 1 || mood > 7) fail('mood', 'mood must be 1..7');
  if (typeof text !== 'string') fail('text', 'text must be a string');
  const textBytes = encoder.encode(text);
  if (textBytes.length > TEXT_MAX_BYTES) fail('text_too_long', `text is ${textBytes.length} bytes; the limit is ${TEXT_MAX_BYTES}`);
  // Strings with lone surrogates encode to U+FFFD; treat that as a caller bug rather than shipping garbage.
  if (/[\ud800-\udfff]/.test(text) && !/[\ud800-\udbff][\udc00-\udfff]/.test(text)) fail('text', 'text contains a lone surrogate');
  const hasNoun = noun !== undefined && noun !== null;
  if (hasNoun && (!Number.isInteger(noun) || noun < 0 || noun > NOUN_MAX)) fail('noun', `noun must be 0..${NOUN_MAX}`);
  const type = textBytes.length ? TYPES.TEXT : TYPES.MOOD;
  const out = new Uint8Array(HEADER_BYTES + (hasNoun ? 2 : 0) + textBytes.length);
  out[0] = MAGIC[0]; out[1] = MAGIC[1]; out[2] = VERSION; out[3] = type;
  out.set(alias, 4);
  out[8] = messageId >>> 8; out[9] = messageId & 0xff;
  out[10] = mood;
  out[11] = hasNoun ? FLAG_NOUN : 0;
  out[12] = textBytes.length;
  let p = HEADER_BYTES;
  if (hasNoun) { out[p] = noun >>> 8; out[p + 1] = noun & 0xff; p += 2; }
  out.set(textBytes, p);
  return out;
}

/**
 * decodeFrame(bytes) -> { type, alias(hex), aliasBytes, messageId, mood, moodName, noun|null, text }
 * Validates exact length, magic, version, type, mood range, reserved bits, noun range,
 * and strict UTF-8 BEFORE returning anything. Throws FrameError with a code.
 */
export function decodeFrame(bytes) {
  if (!(bytes instanceof Uint8Array)) fail('input', 'frame must be a Uint8Array');
  if (bytes.length < HEADER_BYTES) fail('length', `frame is ${bytes.length} bytes; the header alone is ${HEADER_BYTES}`);
  if (bytes.length > FRAME_MAX_BYTES) fail('length', `frame is ${bytes.length} bytes; the limit is ${FRAME_MAX_BYTES}`);
  if (bytes[0] !== MAGIC[0] || bytes[1] !== MAGIC[1]) fail('magic', 'not a Layers Radio frame');
  if (bytes[2] !== VERSION) fail('version', `unsupported version ${bytes[2]}`);
  const type = bytes[3];
  if (type !== TYPES.MOOD && type !== TYPES.TEXT) fail('type', `unsupported type ${type}`);
  const mood = bytes[10];
  if (mood < 1 || mood > 7) fail('mood', `mood ${mood} out of range`);
  const flags = bytes[11];
  if (flags & FLAGS_RESERVED_MASK) fail('flags', 'reserved flag bits set');
  const hasNoun = (flags & FLAG_NOUN) === FLAG_NOUN;
  const L = bytes[12];
  if (type === TYPES.MOOD && L !== 0) fail('length', 'mood-only frame must carry no text');
  if (type === TYPES.TEXT && (L < 1 || L > TEXT_MAX_BYTES)) fail('length', `text length ${L} out of range`);
  const expected = HEADER_BYTES + (hasNoun ? 2 : 0) + L;
  if (bytes.length !== expected) fail('length', `frame is ${bytes.length} bytes but declares ${expected}`);
  let p = HEADER_BYTES;
  let noun = null;
  if (hasNoun) {
    noun = (bytes[p] << 8) | bytes[p + 1]; p += 2;
    if (noun > NOUN_MAX) fail('noun', `noun ${noun} above ${NOUN_MAX}`);
  }
  const textBytes = bytes.subarray(p, p + L);
  let text = '';
  if (L) {
    try { text = strictDecoder.decode(textBytes); }
    catch { fail('utf8', 'text is not strict UTF-8'); }
    // TextDecoder(fatal) already rejects overlong forms and encoded surrogates (RFC 3629).
  }
  const aliasBytes = bytes.slice(4, 8);
  return Object.freeze({
    type, alias: hex(aliasBytes), aliasBytes, messageId: (bytes[8] << 8) | bytes[9],
    mood, moodName: moodById(mood).name, noun, text,
  });
}

export const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const fromHex = s => Uint8Array.from(s.match(/../g) || [], h => parseInt(h, 16));

/** Random 4-byte alias, browser-local and unverified. */
export function randomAlias() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('secure random required');
  return globalThis.crypto.getRandomValues(new Uint8Array(4));
}

/**
 * Sender-side sequence keeper. Persists {alias, next} through `store` (get/set of a string).
 * When the counter wraps, the alias rotates so (alias, id) pairs never repeat within a receiver's memory.
 */
export function createSequence(store) {
  let state = null;
  try { state = JSON.parse(store.get() || 'null'); } catch { state = null; }
  if (!state || typeof state.alias !== 'string' || state.alias.length !== 8 || !Number.isInteger(state.next)) {
    state = { alias: hex(randomAlias()), next: 0 };
  }
  const persist = () => { try { store.set(JSON.stringify(state)); } catch {} };
  persist();
  return {
    get alias() { return fromHex(state.alias); },
    get aliasHex() { return state.alias; },
    /** Take the next message id; rotates the alias on wrap. */
    take() {
      const id = state.next;
      if (id >= 0xffff) { state.alias = hex(randomAlias()); state.next = 0; }
      else state.next = id + 1;
      persist();
      return id;
    },
    reset() { state = { alias: hex(randomAlias()), next: 0 }; persist(); },
  };
}

/**
 * Bounded receiver dedup on (alias, messageId). Keeps the newest `capacity` keys;
 * eviction is insertion order. Repeated intentional sends have new ids and pass;
 * the same frame heard twice (echo, retransmit) is suppressed.
 */
export function createDedup(capacity = 256) {
  const seen = new Set();
  return {
    /** true if this (alias,id) is new and was recorded. */
    accept(alias, messageId) {
      const key = `${typeof alias === 'string' ? alias : hex(alias)}:${messageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (seen.size > capacity) { const first = seen.values().next().value; seen.delete(first); }
      return true;
    },
    get size() { return seen.size; },
  };
}

/**
 * Token-bucket limiter used per alias and globally by the receiver.
 * `rate` tokens per second, `burst` max bucket. `allow(now)` returns true if a token was spent.
 */
export function createLimiter({ rate = 0.5, burst = 3 } = {}) {
  let tokens = burst, last = null;
  return {
    allow(now = Date.now()) {
      if (last !== null) tokens = Math.min(burst, tokens + (Math.max(0, now - last) / 1000) * rate);
      last = now;
      if (tokens >= 1) { tokens -= 1; return true; }
      return false;
    },
  };
}
