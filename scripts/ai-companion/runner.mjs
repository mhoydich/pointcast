#!/usr/bin/env node
import { constants } from 'node:fs';
import { access, mkdir, open, lstat, realpath, rename, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { CodexNative } from './codex-native.mjs';
import { ClaudeNative } from './claude-native.mjs';
import { validateModel } from './native-process.mjs';

const SECRET = /^[A-Za-z0-9_-]{43}$/;
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_STATE = join(homedir(), 'Library', 'Application Support', 'PointCast AI Companion', 'runtime.json');
export function normalizeOrigin(value = 'https://pointcast.xyz') {
  let url; try { url = new URL(value); } catch { throw new Error('invalid-origin'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) throw new Error('origin-must-be-https-or-localhost');
  return url.origin;
}
function inside(root, path) { const rel = relative(root, path); return !rel || (!rel.startsWith('..') && !isAbsolute(rel)); }
export async function validatePairingPath(statePath, { repoRoot = REPO_ROOT } = {}) {
  statePath = resolve(statePath);
  const parent = dirname(statePath);
  if (inside(resolve(repoRoot), statePath)) throw new Error('pairing-token-must-be-outside-repository');
  await mkdir(parent, { recursive: true, mode: 0o700 });
  if (inside(await realpath(repoRoot), await realpath(parent))) throw new Error('pairing-token-must-be-outside-repository');
  try {
    const target = await lstat(statePath);
    if (target.isSymbolicLink()) throw new Error('pairing-file-must-not-be-symlink');
    if (!target.isFile()) throw new Error('pairing-path-must-be-file');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await access(parent, constants.W_OK);
  return statePath;
}
export async function savePairing(statePath, state, { repoRoot = REPO_ROOT } = {}) {
  if (!SECRET.test(state.token) || typeof state.runtimeId !== 'string') throw new Error('invalid-pairing-response');
  statePath = await validatePairingPath(statePath, { repoRoot });
  const parent = dirname(statePath);
  const temp = join(parent, `.runtime-${randomUUID()}.tmp`);
  const fd = await open(temp, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
  try {
    await fd.writeFile(JSON.stringify({ version: 1, origin: normalizeOrigin(state.origin), runtimeId: state.runtimeId, token: state.token }));
    await fd.sync(); await fd.close(); await rename(temp, statePath);
  } catch (error) { await fd.close().catch(() => {}); await rm(temp, { force: true }); throw error; }
}
export async function pairRuntime({ client, code, label, stateFile = DEFAULT_STATE, origin = 'https://pointcast.xyz', repoRoot = REPO_ROOT }) {
  if (!SECRET.test(code)) throw new Error('invalid-pairing-code');
  origin = normalizeOrigin(origin);
  // Do all predictable path checks before consuming a one-use pairing code.
  stateFile = await validatePairingPath(stateFile, { repoRoot });
  const paired = await client.call('pair', { code, ...(label === undefined ? {} : { label }) });
  const state = { origin, runtimeId: paired.runtimeId, token: paired.token };
  await savePairing(stateFile, state, { repoRoot });
  return state;
}
export async function loadPairing(statePath = DEFAULT_STATE) {
  const fd = await open(resolve(statePath), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.size > 16_384 || (stat.mode & 0o077)) throw new Error('pairing-file-requires-mode-0600');
    const state = JSON.parse(await fd.readFile('utf8'));
    if (state.version !== 1 || !SECRET.test(state.token) || typeof state.runtimeId !== 'string') throw new Error('invalid-pairing-file');
    return { ...state, origin: normalizeOrigin(state.origin) };
  } finally { await fd.close(); }
}

export class RuntimeHttpError extends Error {
  constructor(status) { super(status === 401 ? 'runtime-pairing-expired-or-revoked' : status === 409 ? 'job-no-longer-active' : `runtime-request-failed-${status}`); this.status = status; }
}
export class RuntimeClient {
  constructor({ origin = 'https://pointcast.xyz', token = null, fetchImpl = fetch } = {}) {
    this.origin = normalizeOrigin(origin); this.token = token; this.fetch = fetchImpl;
  }
  async call(operation, values = {}) {
    const response = await this.fetch(`${this.origin}/api/ai-runtime`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: { 'content-type': 'application/json', ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) },
      body: JSON.stringify({ operation, ...values }),
    });
    if (!response.ok) throw new RuntimeHttpError(response.status);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('runtime-response-invalid');
    let size = 0; const chunks = [];
    for (;;) { const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength; if (size > 98_304) { await reader.cancel(); throw new Error('runtime-response-too-large'); } chunks.push(value); }
    const payload = JSON.parse(Buffer.concat(chunks).toString());
    if (payload?.ok !== true) throw new Error('runtime-response-invalid');
    return payload;
  }
}
export async function providerStates(adapters) {
  return Promise.all(Object.entries(adapters).map(async ([provider, adapter]) => {
    let account; try { account = await adapter.inspectAccount(); } catch { account = {}; }
    let models = { models: [], modelDiscovery: 'unavailable' };
    if (account.available) { try { models = await adapter.listModels(); } catch { /* Discovery remains explicitly unavailable. */ } }
    return { provider, available: account.available === true, authenticated: account.authenticated === true,
      authMode: ['subscription', 'api'].includes(account.authMode) ? account.authMode : 'unknown',
      models: models.models.slice(0, 100), modelDiscovery: models.modelDiscovery };
  }));
}
export class CompanionRunner {
  constructor({ client, adapters, heartbeatMs = 15_000, log = () => {} } = {}) {
    this.client = client; this.adapters = adapters; this.heartbeatMs = heartbeatMs; this.log = log;
    this.active = null; this.closed = false;
  }
  async heartbeat() {
    const response = await this.client.call('heartbeat', { providers: await providerStates(this.adapters) });
    if (this.active && response.cancelledJobIds?.includes(this.active.id)) this.active.controller.abort();
    return response;
  }
  async once({ signal } = {}) {
    if (this.closed || signal?.aborted) return { status: 'stopped' };
    await this.heartbeat();
    const { job } = await this.client.call('claim');
    if (!job) return { status: 'idle' };
    if (!job || typeof job.id !== 'string' || !['login', 'prompt'].includes(job.kind)
      || !this.adapters[job.provider] || !SECRET.test(job.leaseToken)) throw new Error('runtime-job-invalid');
    const expiresAt = Date.parse(job.expiresAt);
    const controller = new AbortController();
    this.active = { id: job.id, controller };
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const remaining = expiresAt - Date.now();
    const expiry = setTimeout(abort, Number.isFinite(remaining) ? Math.max(0, remaining - 1000) : 0);
    let heartbeatPending = null, heartbeatFailure = null;
    const timer = setInterval(() => {
      if (heartbeatPending) return;
      const pending = this.heartbeat().catch((error) => { heartbeatFailure = error; abort(); });
      heartbeatPending = pending;
      void pending.finally(() => { if (heartbeatPending === pending) heartbeatPending = null; });
    }, this.heartbeatMs);
    let completion;
    try {
      if (!Number.isFinite(remaining) || remaining <= 1000) throw new Error('job-expired');
      const adapter = this.adapters[job.provider];
      const result = job.kind === 'login'
        ? await adapter.login({ signal: controller.signal, timeoutMs: Math.min(300_000, remaining - 1000),
          onProgress: (login) => this.client.call('progress', { jobId: job.id, leaseToken: job.leaseToken, login }) })
        : await adapter.runText({ prompt: job.prompt, model: job.model, signal: controller.signal,
          timeoutMs: Math.min(120_000, remaining - 1000) });
      if (controller.signal.aborted) throw new Error('cancelled');
      // Only reviewed, sanitized text/model fields leave the native machine.
      completion = { status: 'succeeded', result: { text: result.text,
        ...(result.requestedModel ? { requestedModel: result.requestedModel } : {}), actualModels: result.actualModels || [] } };
    } catch (error) {
      const reason = /^[a-z0-9-]{1,100}$/.test(error.message || '') ? error.message : 'native-task-failed';
      completion = { status: 'failed', error: reason };
    } finally {
      clearInterval(timer);
      // Preserve the active controller until the last already-started heartbeat
      // settles. A late cancellation/failure must win over a native success.
      await heartbeatPending;
      if (controller.signal.aborted && completion?.status === 'succeeded') completion = { status: 'failed', error: 'cancelled' };
      clearTimeout(expiry); signal?.removeEventListener('abort', abort); this.active = null;
    }
    // A failed delivery may be ambiguous, so never repeat the inference or
    // automatically retry claim/completion. Cloud leases do not requeue jobs.
    try { await this.client.call('complete', { jobId: job.id, leaseToken: job.leaseToken, ...completion }); }
    catch (error) {
      if (error.status === 409) { this.log({ jobId: job.id, status: 'cancelled-or-expired' }); return { status: 'cancelled-or-expired' }; }
      throw error;
    }
    if (heartbeatFailure) throw heartbeatFailure;
    this.log({ jobId: job.id, status: completion.status });
    return { status: completion.status, jobId: job.id };
  }
  async run({ once = false, signal } = {}) {
    try {
      do {
        const result = await this.once({ signal });
        if (once || this.closed || signal?.aborted) return result;
        await new Promise((resolve) => { const timer = setTimeout(done, 5000);
          function done() { clearTimeout(timer); signal?.removeEventListener('abort', done); resolve(); }
          signal?.addEventListener('abort', done, { once: true }); if (signal?.aborted) done(); });
      } while (!this.closed && !signal?.aborted);
    } finally { await this.close(); }
  }
  async close() { this.closed = true; this.active?.controller.abort(); await Promise.allSettled(Object.values(this.adapters).map((a) => a.close())); }
}

export function parseOptions(argv) {
  const options = { once: false, stateFile: DEFAULT_STATE, claudeModels: [] };
  const flags = { '--origin': 'origin', '--state-file': 'stateFile', '--label': 'label', '--pair': 'pair',
    '--codex-bin': 'codexBin', '--claude-bin': 'claudeBin', '--login': 'login' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--once') options.once = true;
    else if (arg === '--status') options.status = true;
    else if (arg === '--pair-stdin') options.pairStdin = true;
    else if (arg === '--help') options.help = true;
    else if (arg === '--claude-model') { const value = argv[++i]; if (!value) throw new Error('missing-option-value'); options.claudeModels.push(validateModel(value)); }
    else if (flags[arg]) { const value = argv[++i]; if (!value || (value.startsWith('--') && !(arg === '--pair' && SECRET.test(value)))) throw new Error('missing-option-value'); options[flags[arg]] = value; }
    else throw new Error('unknown-option');
  }
  if (options.pair && options.pairStdin) throw new Error('choose-one-pairing-input');
  if (options.login && !['codex', 'claude'].includes(options.login)) throw new Error('invalid-provider');
  return options;
}
export async function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv);
  if (options.help) { console.log('PointCast native companion\n  --pair-stdin [--label NAME] [--origin HTTPS_OR_LOCALHOST] [--state-file PATH]\n  --once | --status | --login codex|claude\n  --claude-model MODEL (repeatable; configured choices, not native discovery)\n  --codex-bin PATH --claude-bin PATH\nPairing credentials stay in a mode-0600 file outside the repository. Provider credentials stay in native stores.'); return; }
  const adapters = { codex: new CodexNative({ binary: options.codexBin }), claude: new ClaudeNative({ binary: options.claudeBin, models: options.claudeModels }) };
  const controller = new AbortController();
  const stop = () => controller.abort(); process.once('SIGINT', stop); process.once('SIGTERM', stop);
  try {
    if (options.status) { console.log(JSON.stringify(await providerStates(adapters), null, 2)); return; }
    if (options.login) { console.log(JSON.stringify(await adapters[options.login].login({ signal: controller.signal,
      onProgress: (login) => console.log(JSON.stringify({ provider: options.login, login })) }))); return; }
    if (options.pairStdin) {
      let code = ''; for await (const chunk of process.stdin) { code += chunk.toString(); if (code.length > 256) throw new Error('invalid-pairing-code'); }
      options.pair = code.trim();
    }
    let state;
    if (options.pair) {
      const origin = normalizeOrigin(options.origin);
      state = await pairRuntime({ client: new RuntimeClient({ origin }), origin, code: options.pair,
        label: options.label, stateFile: options.stateFile });
      console.log(JSON.stringify({ paired: true, runtimeId: state.runtimeId }));
    } else state = await loadPairing(options.stateFile);
    if (options.origin && normalizeOrigin(options.origin) !== state.origin) throw new Error('stored-pairing-origin-mismatch');
    const runner = new CompanionRunner({ client: new RuntimeClient(state), adapters, log: (event) => console.log(JSON.stringify(event)) });
    await runner.run({ once: options.once, signal: controller.signal });
  } finally {
    process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
    await Promise.allSettled(Object.values(adapters).map((adapter) => adapter.close()));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(/^[a-z0-9-]{1,100}$/.test(error.message || '') ? error.message : 'companion-stopped'); process.exitCode = 1; });
}
