import {
  createPrivateKey, createPublicKey, generateKeyPairSync, randomUUID, sign, verify,
} from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function validAddress(value) {
  return typeof value === 'string' && value.length <= 2048 && value.trim() === value && value !== '';
}

function validText(value, max) {
  return typeof value === 'string' && value.length <= max;
}

function payload({ address, sender, time, body, image }, nonce) {
  return JSON.stringify(['noun-line/v1', address, sender, time, body, image, nonce]);
}

function fields({ address, sender, time, body, image = null }) {
  if (!validAddress(address) || !validText(sender, 256) || !sender.trim() ||
      !validText(time, 40) || !Number.isFinite(Date.parse(time)) ||
      !validText(body, 8192) || (image !== null && !validText(image, 4096)) ||
      (!body.trim() && !image)) {
    throw new TypeError('Invalid line fields');
  }
  return { address, sender, time, body, image };
}

function verified(line) {
  const content = fields(line);
  if (!validText(line.sig, 300)) throw new TypeError('Invalid line signature');
  const [key, nonce, signature, extra] = line.sig.split('.');
  if (extra !== undefined || !/^[\w-]{59}$/.test(key) ||
      !/^[\w-]{1,100}$/.test(nonce) || !/^[\w-]{86}$/.test(signature)) {
    throw new TypeError('Invalid line signature');
  }
  try {
    const publicKey = createPublicKey({ key: Buffer.from(key, 'base64url'), format: 'der', type: 'spki' });
    const bytes = Buffer.from(signature, 'base64url');
    if (publicKey.asymmetricKeyType === 'ed25519' &&
        publicKey.export({ type: 'spki', format: 'der' }).toString('base64url') === key &&
        bytes.toString('base64url') === signature &&
        verify(null, Buffer.from(payload(content, nonce)), publicKey, bytes)) {
      return { ...content, sig: line.sig };
    }
  } catch {
    // A malformed public key is an invalid signature.
  }
  throw new TypeError('Invalid line signature');
}

export function openStore(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const keyPath = join(directory, 'device.pem');
  const logPath = join(directory, 'lines.jsonl');
  let privateKey;
  try {
    privateKey = createPrivateKey(readFileSync(keyPath));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    ({ privateKey } = generateKeyPairSync('ed25519'));
    writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), {
      flag: 'wx', mode: 0o600,
    });
  }
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Expected an Ed25519 device key');
  const id = createPublicKey(privateKey).export({ type: 'spki', format: 'der' }).toString('base64url');
  const logs = new Map();
  const seen = new Map();
  function remember(line) {
    if (!logs.has(line.address)) logs.set(line.address, []);
    logs.get(line.address).push(line);
    seen.set(line.sig, line);
  }
  let stored = '';
  try {
    stored = readFileSync(logPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (stored && !stored.endsWith('\n')) throw new Error('Incomplete noun-node log record');
  for (const record of stored.trimEnd().split('\n').filter(Boolean)) {
    const raw = JSON.parse(record);
    const line = verified(raw);
    if (raw.seq !== (logs.get(line.address)?.length ?? 0) + 1 || seen.has(line.sig)) {
      throw new Error('Invalid noun-node log sequence');
    }
    remember({ ...line, seq: raw.seq });
  }

  function ingest(raw) {
    const line = verified(raw);
    if (seen.has(line.sig)) return { line: seen.get(line.sig), added: false };
    line.seq = (logs.get(line.address)?.length ?? 0) + 1;
    appendFileSync(logPath, JSON.stringify(line) + '\n', { mode: 0o600, flush: true });
    remember(line);
    return { line, added: true };
  }

  return {
    id,
    have: () => Object.fromEntries(Array.from(logs, ([address, lines]) => [address, lines.length])),
    lines: (address, since) => (logs.get(address) ?? []).slice(since),
    ingest,
    originate(input, { time = new Date().toISOString(), nonce = randomUUID() } = {}) {
      const line = fields({ ...input, time });
      const signature = sign(null, Buffer.from(payload(line, nonce)), privateKey).toString('base64url');
      return ingest({ ...line, sig: [id, nonce, signature].join('.') });
    },
  };
}
