/**
 * Chime v0.1 experimental discovery packet. Multi-byte fields are big endian.
 * 0..1 "CH" | 2 version 1 | 3 type | 4..11 session tag | 12..15 sender tag
 * 16..17 capabilities | 18..19 CRC16-CCITT-FALSE of bytes 0..17.
 * CRC detects corruption. Session echo correlates a reply; neither authenticates it.
 */
export const PACKET_BYTES = 20;
export const VERSION = 1;
export const TYPES = Object.freeze({ HELLO: 1, ACK: 2 });
export const CAPABILITIES = Object.freeze({ SPEAKER: 1, MICROPHONE: 2, DISPLAY: 4, CONTROLS: 8 });

export function crc16(bytes) {
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
    }
  }
  return crc;
}

function tagBytes(value, length, name) {
  if (typeof value !== 'string' || !new RegExp(`^[0-9a-fA-F]{${length * 2}}$`).test(value)) {
    throw new TypeError(`${name} must contain exactly ${length * 2} hexadecimal characters`);
  }
  return Uint8Array.from(value.match(/../g), pair => Number.parseInt(pair, 16));
}

function hex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function encodePacket({ type, sessionTag, senderTag, capabilities }) {
  if (type !== TYPES.HELLO && type !== TYPES.ACK) throw new RangeError('Unsupported packet type');
  if (!Number.isInteger(capabilities) || capabilities < 0 || capabilities > 0xffff) {
    throw new RangeError('Capabilities must be an unsigned 16-bit integer');
  }
  const bytes = new Uint8Array(PACKET_BYTES);
  bytes.set([0x43, 0x48, VERSION, type]);
  bytes.set(tagBytes(sessionTag, 8, 'sessionTag'), 4);
  bytes.set(tagBytes(senderTag, 4, 'senderTag'), 12);
  const view = new DataView(bytes.buffer);
  view.setUint16(16, capabilities, false);
  view.setUint16(18, crc16(bytes.subarray(0, 18)), false);
  return bytes;
}

export function decodePacket(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== PACKET_BYTES) {
    throw new RangeError('Packet must be a Uint8Array of exactly 20 bytes');
  }
  if (bytes[0] !== 0x43 || bytes[1] !== 0x48) throw new Error('Invalid Chime magic');
  if (bytes[2] !== VERSION) throw new Error('Unsupported packet version');
  if (bytes[3] !== TYPES.HELLO && bytes[3] !== TYPES.ACK) throw new Error('Unsupported packet type');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(18, false) !== crc16(bytes.subarray(0, 18))) throw new Error('Packet CRC mismatch');
  return Object.freeze({
    type: bytes[3],
    sessionTag: hex(bytes.subarray(4, 12)),
    senderTag: hex(bytes.subarray(12, 16)),
    capabilities: view.getUint16(16, false),
  });
}

/** Validate correspondence only; caller must enforce its own pending-session timeout. */
export function validateAck(helloBytes, ackBytes) {
  const hello = decodePacket(helloBytes);
  const ack = decodePacket(ackBytes);
  if (hello.type !== TYPES.HELLO || ack.type !== TYPES.ACK) throw new Error('Expected HELLO then ACK');
  if (hello.sessionTag !== ack.sessionTag) throw new Error('ACK session mismatch');
  return ack;
}

function randomTag(length) {
  if (!globalThis.crypto?.getRandomValues) throw new Error('A secure random source is required');
  return hex(globalThis.crypto.getRandomValues(new Uint8Array(length)));
}

export const createSessionTag = () => randomTag(8);
export const createSenderTag = () => randomTag(4);

/** Public, deterministic demonstration values; never reuse for live sessions. */
export const FIXTURES = Object.freeze({
  hello: Object.freeze({ type: TYPES.HELLO, sessionTag: '3A71C94B2056D8E2', senderTag: '01020304', capabilities: 7 }),
  ack: Object.freeze({ type: TYPES.ACK, sessionTag: '3A71C94B2056D8E2', senderTag: '05060708', capabilities: 7 }),
});
