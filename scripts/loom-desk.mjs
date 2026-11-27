#!/usr/bin/env node
// PointCast issuing desk. Node 22+; no packages or repository imports.
import { createHash, createPrivateKey, generateKeyPairSync, sign } from 'node:crypto';
import { closeSync, fsyncSync, ftruncateSync, openSync, readFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://pointcast.xyz';
const AGENT_ID = /^pci_[0-9a-f]{32}$/u;
const YEAR_MS = 365 * 86400000;
const HELP = `PointCast issuing desk — Node 22+, no packages

  node scripts/loom-desk.mjs init --key-file <path> --operator mike
  node scripts/loom-desk.mjs issue --key-file <path> --to '#loom-v2' --card-file <card.json>
    [--name 'PointCast issuing desk'] [--parent m_original] [--body 'Public note'] [--post]

The card file contains {id, scope, target, done, ceiling}. Issue prints only the
append payload by default; --post signs and sends it. There are no write retries.
--parent replies to an existing message in the destination room.
Init registers an Ed25519 key for loom:append, expiring in 365 days, and refuses
to overwrite a key file. Create its private directory first (chmod 700).

The key file is private, stays on this machine, and must never go in a repo,
chat, Loom post or PR. Only the public agentId and expiresAt may be shared.
`;

// Matches src/lib/x402.ts, used by hashAgentActionRequest in agent-identity.ts.
export function canonical(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).filter(key => value[key] !== undefined).sort()
      .map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  throw new Error('Unsupported canonical JSON value.');
}

// Keep the standalone client aligned with service.mjs clean/validateCard.
const clean = (value, max) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
  .replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim().slice(0, max);

function validateCard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('card_invalid');
  const id = clean(raw.id, 16);
  if (!/^[A-Z][A-Z0-9]{0,7}-[0-9]{1,4}[a-z]?$/.test(id)) throw new Error('card_id_invalid');
  const scope = clean(raw.scope, 280), target = clean(raw.target, 200), done = clean(raw.done, 280);
  if (!scope) throw new Error('card_scope_required');
  if (!target) throw new Error('card_target_required');
  if (!done) throw new Error('card_done_required');
  const ceiling = raw.ceiling;
  if (typeof ceiling !== 'number' || !Number.isInteger(ceiling) || ceiling < 1000 || ceiling > 5000000) {
    throw new Error('card_ceiling_range');
  }
  return { id, scope, target, done, ceiling };
}

function readJson(path, label) {
  // JSON parse errors can quote input: never echo any part of the key file.
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { throw new Error(`Cannot read ${label} as JSON.`); }
}

function options(command, args) {
  const allowed = new Set(command === 'init' ? ['--key-file', '--operator']
    : ['--key-file', '--to', '--card-file', '--name', '--parent', '--body', '--post']);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (!allowed.has(flag) || Object.hasOwn(result, flag)) throw new Error('Unknown or duplicate option; use --help.');
    if (flag === '--post') result[flag] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${flag}.`);
      result[flag] = args[++i];
    }
  }
  for (const flag of command === 'init' ? ['--key-file', '--operator'] : ['--key-file', '--to', '--card-file']) {
    if (!result[flag]) throw new Error(`Missing ${flag}.`);
  }
  return result;
}

async function postJson(path, body, fetchImpl, headers = {}) {
  const response = await fetchImpl(`${ORIGIN}${path}`, {
    method: 'POST', redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error(`Server did not return JSON (${response.status}); no automatic retry.`); }
  if (!response.ok || !data || data.ok === false) {
    // Do not echo arbitrary server text that could reflect signed requests.
    const reason = typeof data?.error === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(data.error) ? `: ${data.error}` : '';
    throw new Error(`Request failed (${response.status})${reason}; no automatic retry.`);
  }
  return data;
}

async function init(opts, fetchImpl, now) {
  if (opts['--operator'] !== 'mike') throw new Error('This issuing desk requires --operator mike.');
  let fd;
  try { fd = openSync(opts['--key-file'], 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('Key file already exists; refusing to overwrite it.');
    throw new Error('Cannot create key file; create its private directory first.');
  }
  try {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const credential = {
      agentId: null, origin: ORIGIN, operator: 'mike', scopes: ['loom:append'],
      expiresAt: new Date(now().getTime() + YEAR_MS).toISOString(),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    };
    const save = () => {
      const bytes = Buffer.from(JSON.stringify(credential, null, 2) + '\n');
      let offset = 0;
      while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset, offset);
      ftruncateSync(fd, bytes.length);
      fsyncSync(fd);
    };
    // Persist the key before registration so an uncertain HTTP outcome cannot lose it.
    save();
    const proposal = {
      purpose: 'register', public_key: publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64'),
      operator: 'mike', scopes: ['loom:append'], expires_at: credential.expiresAt,
    };
    const challenge = await postJson('/api/agents/challenge', proposal, fetchImpl);
    if (typeof challenge.payload !== 'string' || !/^pch_[0-9a-f]{32}$/.test(challenge.challenge_id)) {
      throw new Error('Invalid registration challenge.');
    }
    const registered = await postJson('/api/agents/register', {
      challenge_id: challenge.challenge_id,
      signature: sign(null, Buffer.from(challenge.payload), privateKey).toString('base64'),
    }, fetchImpl);
    if (!AGENT_ID.test(registered.agent?.agent_id) || registered.agent.expires_at !== credential.expiresAt) {
      throw new Error('Invalid registration receipt.');
    }
    credential.agentId = registered.agent.agent_id;
    save();
    return { agentId: credential.agentId, expiresAt: credential.expiresAt };
  } catch (error) {
    throw new Error(`${error.message} Initialization incomplete; the reserved private key file is retained. Do not re-register or share it.`);
  } finally { closeSync(fd); }
}

async function issue(opts, fetchImpl, now) {
  const card = validateCard(readJson(opts['--card-file'], 'card file'));
  const to = opts['--to'];
  if (!/^#[a-z0-9][a-z0-9-]{0,39}$/i.test(to)) throw new Error('--to must be a Loom #room (at most 40 letters, digits or hyphens).');
  const name = opts['--name'] ?? 'PointCast issuing desk';
  if (!name.trim() || name !== clean(name, 40)) throw new Error('--name must be 1–40 clean characters.');
  if (/^collator$/i.test(name)) throw new Error('The name Collator is reserved.');
  const body = opts['--body'] ?? `${card.id} · Signed by the PointCast issuing desk.`;
  if (!body.trim() || body !== clean(body, 2000)) throw new Error('--body must be 1–2000 clean characters.');
  const parent = opts['--parent'];
  if (parent !== undefined && !/^m_[a-zA-Z0-9]+$/.test(parent)) throw new Error('--parent must be a Loom message id.');
  const payload = {
    to, from: { name, kind: 'agent', model: 'gpt-6-astra', operator: 'mike' },
    kind: 'note', body, card, ...(parent ? { parent } : {}),
  };
  // A preview neither reads private material nor makes a request.
  if (!opts['--post']) return payload;
  const credential = readJson(opts['--key-file'], 'private key file');
  if (!credential || !AGENT_ID.test(credential.agentId) || credential.origin !== ORIGIN
    || credential.operator !== 'mike' || !Array.isArray(credential.scopes) || !credential.scopes.includes('loom:append')
    || !Number.isFinite(Date.parse(credential.expiresAt)) || Date.parse(credential.expiresAt) <= now().getTime()) {
    throw new Error('Invalid, incomplete or expired desk credential.');
  }
  let privateKey;
  try { privateKey = createPrivateKey(credential.privateKey); }
  catch { throw new Error('Invalid private key.'); }
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Desk requires an Ed25519 key.');
  const requestHash = createHash('sha256').update(`loom.append\n${canonical(payload)}`).digest('hex');
  const timestamp = now().toISOString();
  const proof = `pointcast.agent-request/v1\n${canonical({ agent_id: credential.agentId, request_hash: requestHash, timestamp })}\n`;
  const result = await postJson('/api/loom', payload, fetchImpl, {
    'PointCast-Agent-Id': credential.agentId, 'PointCast-Agent-Timestamp': timestamp,
    'PointCast-Agent-Signature': sign(null, Buffer.from(proof), privateKey).toString('base64'),
  });
  if (!result.message?.id || result.message.from?.verified !== true
    || result.message.from.address !== `agent:${credential.agentId}`
    || canonical(result.message.card) !== canonical(card) || (parent && result.message.parent !== parent)) {
    throw new Error('Post outcome not confirmed as a verified desk card/reply; inspect the room before any retry.');
  }
  // editToken and signing headers are intentionally never printed.
  return { agentId: credential.agentId, id: result.message.id, address: result.address };
}

export async function run(argv, { fetchImpl = globalThis.fetch, stdout = text => process.stdout.write(text),
  stderr = text => process.stderr.write(text), now = () => new Date() } = {}) {
  try {
    if (argv.length === 0 || (argv.length === 1 && ['--help', '-h'].includes(argv[0]))) {
      stdout(HELP); return 0;
    }
    const [command, ...args] = argv;
    if (!['init', 'issue'].includes(command)) throw new Error('Expected init or issue; use --help.');
    const opts = options(command, args);
    const result = command === 'init' ? await init(opts, fetchImpl, now) : await issue(opts, fetchImpl, now);
    stdout(JSON.stringify(result, null, 2) + '\n');
    return 0;
  } catch (error) { stderr(`${error.message}\n`); return 1; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await run(process.argv.slice(2));
}
