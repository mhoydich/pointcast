/**
 * Tests for the agent-payments script trio:
 *   scripts/agent-spend.mjs
 *   scripts/recover-credential.mjs
 *   scripts/audit-spend.mjs
 *
 * These all run as subprocesses with --dry-run or analogous read-only
 * flags. No live link-cli calls; no money moves; no Block JSON written.
 *
 * Each test asserts on:
 *   - exit code (0 = ok, 2 = cap/whitelist violation, 3 = bad args)
 *   - stdout patterns (key strings the user / agent depends on)
 *   - stderr patterns (error message clarity for human + machine)
 *
 * Per #262 (Stripe Link agent payments).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function runScript(scriptName, args = []) {
  const result = spawnSync('node', [path.join('scripts', scriptName), ...args], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: { ...process.env, LINK_PAYMENT_METHOD_ID: 'csmrpd_test_for_unit_tests' },
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

const validContext = 'A 100+ char context string for the spend-request, describing what the loop is buying and why the user can approve it confidently.';
const validBaseArgs = [
  '--dry-run',
  '--agent', 'codex',
  '--loop', 'scout',
  '--amount', '0.10',
  '--merchant', 'replicate.com',
  '--merchant-url', 'https://replicate.com',
  '--context', validContext,
];

// ─── agent-spend.mjs — happy path ──────────────────────────────────────────

test('agent-spend: --dry-run testmode happy path exits 0', () => {
  const r = runScript('agent-spend.mjs', validBaseArgs);
  assert.equal(r.code, 0, `expected exit 0, got ${r.code} — stderr: ${r.stderr}`);
  assert.match(r.stdout, /DRY RUN/);
  assert.match(r.stdout, /agent:\s+codex/);
  assert.match(r.stdout, /amount:\s+\$0\.10/);
  assert.match(r.stdout, /next id:\s+\d{4}/);
});

test('agent-spend: --dry-run --live shows LIVE label', () => {
  const r = runScript('agent-spend.mjs', [...validBaseArgs, '--live']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /LIVE — REAL MONEY/);
});

function withoutFlag(args, flag) {
  const i = args.indexOf(flag);
  if (i < 0) return [...args];
  return [...args.slice(0, i), ...args.slice(i + 2)];
}
function replaceFlag(args, flag, newValue) {
  const i = args.indexOf(flag);
  if (i < 0) return [...args, flag, newValue];
  const out = [...args];
  out[i + 1] = newValue;
  return out;
}

test('agent-spend: --dry-run --live --amount 5 passes (post-#295 cap=$10)', () => {
  const args = [...replaceFlag(validBaseArgs, '--amount', '5.00'), '--live'];
  const r = runScript('agent-spend.mjs', args);
  assert.equal(r.code, 0, `expected $5 to pass post cap-bump, got ${r.code} — stderr: ${r.stderr}`);
});

// ─── agent-spend.mjs — validation errors ───────────────────────────────────

test('agent-spend: missing --agent exits 3', () => {
  const r = runScript('agent-spend.mjs', withoutFlag(validBaseArgs, '--agent'));
  assert.equal(r.code, 3);
  assert.match(r.stderr, /--agent must be one of/);
});

test('agent-spend: invalid --agent exits 3', () => {
  const r = runScript('agent-spend.mjs', replaceFlag(validBaseArgs, '--agent', 'rogue-agent'));
  assert.equal(r.code, 3);
  assert.match(r.stderr, /--agent must be one of/);
});

test('agent-spend: missing --loop exits 3', () => {
  const r = runScript('agent-spend.mjs', withoutFlag(validBaseArgs, '--loop'));
  assert.equal(r.code, 3);
  assert.match(r.stderr, /--loop required/);
});

test('agent-spend: amount above per-purchase cap exits 2', () => {
  const r = runScript('agent-spend.mjs', replaceFlag(validBaseArgs, '--amount', '50.00'));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /exceeds per-purchase cap/);
});

test('agent-spend: --live amount above $10 exits 2', () => {
  const r = runScript('agent-spend.mjs', [...replaceFlag(validBaseArgs, '--amount', '20'), '--live']);
  assert.equal(r.code, 2);
});

test('agent-spend: merchant outside whitelist exits 2', () => {
  const r = runScript('agent-spend.mjs', replaceFlag(validBaseArgs, '--merchant', 'shady-merchant.example'));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /not in v0 whitelist/);
});

test('agent-spend: short context exits 3', () => {
  const r = runScript('agent-spend.mjs', replaceFlag(validBaseArgs, '--context', 'too short'));
  assert.equal(r.code, 3);
  assert.match(r.stderr, /min 100 chars/);
});

test('agent-spend: missing --merchant-url exits 3', () => {
  const r = runScript('agent-spend.mjs', withoutFlag(validBaseArgs, '--merchant-url'));
  assert.equal(r.code, 3);
  assert.match(r.stderr, /--merchant-url required/);
});

// ─── recover-credential.mjs ────────────────────────────────────────────────

test('recover-credential: missing positional id exits 3', () => {
  const r = runScript('recover-credential.mjs', []);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /first positional arg must be the spend-request id/);
});

test('recover-credential: non-lsrq id exits 3', () => {
  const r = runScript('recover-credential.mjs', ['srq_wrongprefix']);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /lsrq_xxx/);
});

// ─── audit-spend.mjs ───────────────────────────────────────────────────────

test('audit-spend: read-only run exits 0', () => {
  const r = runScript('audit-spend.mjs', []);
  assert.equal(r.code, 0, `stderr: ${r.stderr}`);
  // Either reports receipts or "No blocks with spend field found"
  assert.ok(
    /\/money audit/.test(r.stdout) || /No blocks with spend field/.test(r.stdout),
    `unexpected output: ${r.stdout.slice(0, 200)}`,
  );
});

test('audit-spend: --json emits parseable JSON', () => {
  const r = runScript('audit-spend.mjs', ['--json']);
  assert.equal(r.code, 0);
  // Empty case won't emit JSON; only assert when there's at least one receipt
  if (r.stdout.includes('total_count')) {
    const parsed = JSON.parse(r.stdout);
    assert.ok(typeof parsed.totals === 'object' || typeof parsed.total_count === 'number');
    assert.ok(Array.isArray(parsed.receipts));
  }
});
