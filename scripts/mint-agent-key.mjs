#!/usr/bin/env node
/**
 * mint-agent-key.mjs — generate an Ed25519 keypair for a resident agent.
 *
 * Public key (base64-raw, 32 bytes) goes into src/data/agent-identities.json
 * under instances.{name}.public_key.
 *
 * Private key (PEM, PKCS8) is written to ~/.config/pointcast/keys/{pcr_xxx}.key
 * with file mode 0600. Outside the repo, never committed, never read by any
 * runtime besides agent-spend.mjs (which signs receipts on behalf of the
 * resident).
 *
 * Idempotent: if a resident already has a public_key in the json AND the
 * matching private key file exists, the script reports and exits 0. If
 * EITHER is missing, it regenerates a fresh keypair (so re-running after
 * a private-key file loss works).
 *
 * Usage:
 *   node scripts/mint-agent-key.mjs <name>          # mint for one resident
 *   node scripts/mint-agent-key.mjs --all           # mint missing for all residents
 *   node scripts/mint-agent-key.mjs --all --force   # rotate every resident's key
 *
 * Exit codes: 0 success, 1 unknown resident, 2 fs error, 3 bad args.
 *
 * Spec: pointcast.agent-payments/v1. Algorithm: Ed25519 (RFC 8032).
 */

import { generateKeyPairSync, createPrivateKey } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const IDENTITIES_FILE = path.join(REPO_ROOT, 'src/data/agent-identities.json');
const KEYS_DIR = path.join(process.env.HOME ?? '', '.config/pointcast/keys');

function die(code, msg) {
  process.stderr.write(`\n✗ ${msg}\n\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = { positional: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--force') args.force = true;
    else args.positional.push(a);
  }
  return args;
}

function ensureKeysDir() {
  fs.mkdirSync(KEYS_DIR, { recursive: true, mode: 0o700 });
}

// Generate one Ed25519 keypair. Returns { publicKeyBase64, privateKeyPem }.
// Public key is the raw 32-byte Ed25519 public key, base64-encoded (no padding
// stripping; same shape as the JWK 'x' field b64-decoded).
function generate() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  // Extract the raw 32-byte public key from the SubjectPublicKeyInfo DER.
  // Ed25519 SPKI is fixed-shape: 12-byte algorithm prefix + 32-byte raw key.
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const rawPublic = spki.subarray(spki.length - 32);
  const publicKeyBase64 = rawPublic.toString('base64');
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  return { publicKeyBase64, privateKeyPem };
}

function mintFor(name, json, opts = {}) {
  const inst = json.instances?.[name];
  if (!inst) die(1, `unknown resident "${name}". Known: ${Object.keys(json.instances ?? {}).join(', ')}`);
  const agentId = inst.agent_id;
  if (!agentId) die(2, `resident "${name}" has no agent_id in identities file`);

  const keyPath = path.join(KEYS_DIR, `${agentId}.key`);
  const hasPublic = !!inst.public_key;
  const hasPrivate = fs.existsSync(keyPath);

  if (hasPublic && hasPrivate && !opts.force) {
    process.stdout.write(`  ${name.padEnd(8)} ${agentId}  already minted (public_key on file, private key at ${keyPath})\n`);
    return false;
  }

  const { publicKeyBase64, privateKeyPem } = generate();
  fs.writeFileSync(keyPath, privateKeyPem, { mode: 0o600 });
  fs.chmodSync(keyPath, 0o600);

  inst.public_key = publicKeyBase64;
  inst.public_key_alg = 'ed25519';
  inst.public_key_minted_at = new Date().toISOString();
  process.stdout.write(`  ${name.padEnd(8)} ${agentId}  ✓ minted — pub: ${publicKeyBase64.slice(0, 12)}…  priv: ${keyPath} (mode 0600)\n`);
  return true;
}

(function main() {
  const args = parseArgs(process.argv);
  if (!args.all && args.positional.length === 0) {
    die(3, 'need <name> or --all. Try: node scripts/mint-agent-key.mjs --all');
  }
  if (!fs.existsSync(IDENTITIES_FILE)) die(2, `${IDENTITIES_FILE} not found`);
  ensureKeysDir();

  const json = JSON.parse(fs.readFileSync(IDENTITIES_FILE, 'utf8'));
  const targets = args.all ? Object.keys(json.instances ?? {}) : args.positional;
  let any = false;
  process.stdout.write('\n— minting Ed25519 keys —\n');
  for (const name of targets) {
    if (mintFor(name, json, { force: args.force })) any = true;
  }
  if (any) {
    fs.writeFileSync(IDENTITIES_FILE, JSON.stringify(json, null, 2) + '\n');
    process.stdout.write(`\n✓ updated ${IDENTITIES_FILE}\n\n`);
  } else {
    process.stdout.write('\nno changes.\n\n');
  }
})();
