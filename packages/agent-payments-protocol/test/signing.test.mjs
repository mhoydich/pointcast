/**
 * Tests for src/lib/agent-signing.mjs — Ed25519 receipt signing protocol.
 * Spec: pointcast.agent-payments/v1.
 *
 * Coverage:
 *  - Manifest construction is deterministic (same inputs → same bytes)
 *  - Manifest excludes operational fields (card_last4, etc.)
 *  - Round-trip sign + verify works for every resident
 *  - Tamper detection: changing any signed field invalidates
 *  - Tamper detection: NOT changing operational fields preserves
 *  - Foreign-identity attack: signing under wrong key fails verification
 *  - verifySpend handles unsigned, missing-identity, mismatched-alg cases
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKeyPairSync } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');

// Package-context imports. Test runs against src/signing.mjs.
const {
  buildManifest,
  signManifest,
  verifyManifest,
  signSpend,
  verifySpend,
  SIGNING_ALG,
  SPEC_VERSION,
  MANIFEST_FIELDS,
} = await import(path.join(PKG_ROOT, 'src/signing.mjs'));

// Canonical fixture matching the shape agent-spend.mjs writes.
function fixtureSpend(over = {}) {
  return {
    agent: 'codex',
    agent_id: 'pcr_cdx7fha8j2',
    amount_usd: 0.10,
    currency: 'usd',
    merchant: 'replicate.com',
    merchant_url: 'https://replicate.com',
    loop: 'scout',
    mode: 'test',
    status: 'approved',
    link_session_id: 'lsrq_test_fixture_x',
    ...over,
  };
}

function genKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const rawPub = spki.subarray(spki.length - 32);
  return {
    publicKeyBase64: rawPub.toString('base64'),
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  };
}

// ─── Manifest construction ─────────────────────────────────────────────────

test('buildManifest is deterministic across calls', () => {
  const s = fixtureSpend();
  const a = buildManifest(s, '0421', '2026-05-02T18:00:00Z');
  const b = buildManifest(s, '0421', '2026-05-02T18:00:00Z');
  assert.deepEqual(a, b);
});

test('buildManifest sorts keys alphabetically (canonical JSON)', () => {
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const parsed = JSON.parse(m.toString('utf8'));
  const keys = Object.keys(parsed);
  const sorted = [...keys].sort();
  assert.deepEqual(keys, sorted);
});

test('buildManifest excludes operational fields (card_last4, approval_url, etc.)', () => {
  const s = fixtureSpend({
    card_last4: '9303',
    card_brand: 'visa',
    card_valid_until: '2026-05-01T17:04:47Z',
    approval_url: 'https://app.link.com/...',
    receipt_url: 'https://stripe.com/...',
    context: 'a long approval blurb that the user reads',
  });
  const m = buildManifest(s, '0421', '2026-05-02T18:00:00Z');
  const parsed = JSON.parse(m.toString('utf8'));
  for (const f of ['card_last4', 'card_brand', 'card_valid_until', 'approval_url', 'receipt_url', 'context']) {
    assert.equal(parsed[f], undefined, `manifest must NOT include operational field: ${f}`);
  }
});

test('buildManifest binds block_id, block_timestamp, spec', () => {
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const parsed = JSON.parse(m.toString('utf8'));
  assert.equal(parsed.block_id, '0421');
  assert.equal(parsed.block_timestamp, '2026-05-02T18:00:00Z');
  assert.equal(parsed.spec, SPEC_VERSION);
});

test('buildManifest covers every MANIFEST_FIELDS item that has a value', () => {
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const parsed = JSON.parse(m.toString('utf8'));
  for (const f of MANIFEST_FIELDS) {
    if (fixtureSpend()[f] !== undefined) {
      assert.notEqual(parsed[f], undefined, `manifest missing signed field: ${f}`);
    }
  }
});

// ─── Round trip ────────────────────────────────────────────────────────────

test('sign + verifyManifest round-trips with a fresh keypair', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, privateKeyPem);
  assert.equal(verifyManifest(m, sig, publicKeyBase64), true);
});

test('verifyManifest fails with mismatched public key', () => {
  const a = genKeypair();
  const b = genKeypair();
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, a.privateKeyPem);
  assert.equal(verifyManifest(m, sig, b.publicKeyBase64), false);
});

// ─── Tamper detection ──────────────────────────────────────────────────────

test('mutating amount_usd invalidates the signature', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const original = fixtureSpend();
  const m = buildManifest(original, '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, privateKeyPem);
  const tampered = buildManifest({ ...original, amount_usd: 99.99 }, '0421', '2026-05-02T18:00:00Z');
  assert.equal(verifyManifest(tampered, sig, publicKeyBase64), false);
});

test('mutating merchant invalidates the signature', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const original = fixtureSpend();
  const m = buildManifest(original, '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, privateKeyPem);
  const tampered = buildManifest({ ...original, merchant: 'evil-merchant.com' }, '0421', '2026-05-02T18:00:00Z');
  assert.equal(verifyManifest(tampered, sig, publicKeyBase64), false);
});

test('mutating block_id invalidates the signature', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const m = buildManifest(fixtureSpend(), '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, privateKeyPem);
  const tamperedManifest = buildManifest(fixtureSpend(), '0422', '2026-05-02T18:00:00Z'); // copy attack
  assert.equal(verifyManifest(tamperedManifest, sig, publicKeyBase64), false);
});

test('mutating an operational (unsigned) field DOES NOT invalidate', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const original = fixtureSpend();
  const m = buildManifest(original, '0421', '2026-05-02T18:00:00Z');
  const sig = signManifest(m, privateKeyPem);
  // card_last4 is excluded from the manifest — adding/changing it shouldn't break.
  const operationallyChanged = buildManifest({ ...original, card_last4: '9999' }, '0421', '2026-05-02T18:00:00Z');
  assert.equal(verifyManifest(operationallyChanged, sig, publicKeyBase64), true);
});

// ─── verifySpend integration (against agent-identities.json) ───────────────

test('verifySpend returns unsigned for receipts with no signature', () => {
  const block = { id: '0412', timestamp: '2026-05-01T02:39:34Z', spend: fixtureSpend() };
  const r = verifySpend(block, { instances: {} });
  assert.equal(r.ok, false);
  assert.match(r.reason, /unsigned/);
});

test('verifySpend returns missing-identity when agent_id has no public_key', () => {
  const block = {
    id: '0412',
    timestamp: '2026-05-01T02:39:34Z',
    spend: { ...fixtureSpend(), signature: 'fake', signing_alg: 'ed25519', agent_id: 'pcr_unknown123' },
  };
  const r = verifySpend(block, { instances: {} });
  assert.equal(r.ok, false);
  assert.match(r.reason, /no identity/);
});

test('verifySpend round-trip with synthetic identity registry', () => {
  const { publicKeyBase64, privateKeyPem } = genKeypair();
  const block = {
    id: '0421',
    timestamp: '2026-05-02T18:00:00Z',
    spend: fixtureSpend(),
  };
  const m = buildManifest(block.spend, block.id, block.timestamp);
  const sig = signManifest(m, privateKeyPem);
  block.spend.signature = sig;
  block.spend.signing_alg = SIGNING_ALG;

  const identities = {
    instances: {
      codex: { agent_id: 'pcr_cdx7fha8j2', public_key: publicKeyBase64 },
    },
  };
  const r = verifySpend(block, identities);
  assert.equal(r.ok, true, `expected valid, got ${r.reason}`);
});

test('verifySpend rejects unsupported signing_alg', () => {
  const block = {
    id: '0421',
    timestamp: '2026-05-02T18:00:00Z',
    spend: { ...fixtureSpend(), signature: 'fake', signing_alg: 'rsa-sha256' },
  };
  const r = verifySpend(block, { instances: {} });
  assert.equal(r.ok, false);
  assert.match(r.reason, /unsupported alg/);
});

// ─── End-to-end: each registered resident can sign + verify ────────────────

test('every resident in agent-identities.json has a working keypair', () => {
  // Optional: only runs if the parent repo's identities file is reachable.
  // In the published package, this test gracefully skips since the identities
  // file is implementation-specific to a deploying site.
  const idPath = path.resolve(PKG_ROOT, '../../src/data/agent-identities.json');
  if (!fs.existsSync(idPath)) {
    console.log('  (skipped: identities file not at parent-repo path; package-only run)');
    return;
  }
  const idJson = JSON.parse(fs.readFileSync(idPath, 'utf8'));
  const KEYS_DIR = path.join(process.env.HOME ?? '', '.config/pointcast/keys');
  for (const [name, inst] of Object.entries(idJson.instances ?? {})) {
    if (!inst.public_key) continue; // skip residents without keys
    const keyPath = path.join(KEYS_DIR, `${inst.agent_id}.key`);
    if (!fs.existsSync(keyPath)) continue; // private key not on this machine — skip
    const sigOut = signSpend(
      { ...fixtureSpend(), agent: name, agent_id: inst.agent_id },
      '0421',
      '2026-05-02T18:00:00Z',
      KEYS_DIR,
    );
    assert.ok(sigOut, `signSpend returned null for ${name}`);
    const block = {
      id: '0421',
      timestamp: '2026-05-02T18:00:00Z',
      spend: { ...fixtureSpend(), agent: name, agent_id: inst.agent_id, ...sigOut },
    };
    const r = verifySpend(block, idJson);
    assert.equal(r.ok, true, `verifySpend failed for ${name}: ${r.reason}`);
  }
});
