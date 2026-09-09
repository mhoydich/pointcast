import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const TEXT_LIMIT = 16_000;
export const PROMPT_LIMIT = 6_000;
export const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$/;
export function validateModel(model) {
  if (model == null) return null;
  if (typeof model !== 'string' || !MODEL_ID.test(model)) throw new Error('invalid-model');
  return model;
}
export function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > PROMPT_LIMIT) throw new Error('invalid-prompt');
  return prompt;
}
export function nativeEnvironment(provider, source = process.env) {
  const env = { ...source };
  // Providers keep their own native auth stores. The companion neither reads
  // those files nor forwards any API-billing or gateway override to a worker.
  for (const key of Object.keys(env)) {
    if (/^(ANTHROPIC_|OPENAI_API_KEY$|OPENAI_BASE_URL$|CLAUDE_CODE_OAUTH_TOKEN$|CLAUDE_CODE_USE_|CODEX_API_KEY$)/.test(key)) delete env[key];
  }
  delete env.CLAUDECODE;
  delete env.NODE_OPTIONS;
  if (provider === 'claude') env.CLAUDE_CODE_SAFE_MODE = '1';
  return env;
}
export function stopProcess(child, kill = process.kill) {
  if (!child || child.exitCode != null || child.signalCode != null) return;
  const send = (signal) => {
    try { if (child.pid && process.platform !== 'win32') kill(-child.pid, signal); else child.kill(signal); }
    catch { try { child.kill(signal); } catch { /* Already stopped. */ } }
  };
  send('SIGTERM');
  const timer = setTimeout(() => send('SIGKILL'), 1500);
  timer.unref?.();
  child.once('close', () => clearTimeout(timer));
}
export async function isolatedDirectory(run) {
  const cwd = await mkdtemp(join(tmpdir(), 'pointcast-native-'));
  try { return await run(cwd); } finally { await rm(cwd, { recursive: true, force: true }); }
}
export function captureNative(binary, args, {
  spawnImpl = spawn, env, cwd, input = '', signal, timeoutMs = 15_000,
  maxBytes = 512_000, onChunk, stopImpl = stopProcess,
} = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new Error('cancelled')); return; }
    let child;
    try { child = spawnImpl(binary, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], detached: process.platform !== 'win32' }); }
    catch { reject(new Error('native-cli-unavailable')); return; }
    let stdout = '', stderr = '', size = 0, settled = false, progress = Promise.resolve();
    const finish = (error, result) => {
      if (settled) return;
      settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) { stopImpl(child); reject(error); } else resolve(result);
    };
    const abort = () => finish(new Error('cancelled'));
    const timer = setTimeout(() => finish(new Error('native-timeout')), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    const chunk = (value, isError) => {
      if (settled) return;
      size += Buffer.byteLength(value);
      if (size > maxBytes) { finish(new Error('native-output-too-large')); return; }
      const text = value.toString();
      if (isError) stderr += text; else stdout += text;
      if (onChunk) progress = progress.then(() => { if (!settled) return onChunk(text); }).catch(() => finish(new Error('native-progress-failed')));
    };
    child.stdout.setEncoding?.('utf8');
    child.stderr.setEncoding?.('utf8');
    child.stdout.on('data', (data) => chunk(data, false));
    child.stderr.on('data', (data) => chunk(data, true));
    child.once('error', () => finish(new Error('native-cli-unavailable')));
    child.once('close', (code) => { void progress.then(() => finish(null, { code, stdout, stderr })); });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
export function parseJson(stdout) {
  try { const parsed = JSON.parse(stdout); if (parsed && typeof parsed === 'object') return parsed; } catch { /* Fail closed below. */ }
  throw new Error('native-json-unavailable');
}
export function safeLoginUrl(value, provider) {
  try {
    const url = new URL(value);
    const hosts = provider === 'codex' ? ['auth.openai.com', 'chatgpt.com']
      : provider === 'claude' ? ['claude.ai', 'claude.com', 'platform.claude.com', 'console.anthropic.com']
        : ['auth.openai.com', 'chatgpt.com', 'claude.ai', 'claude.com', 'platform.claude.com', 'console.anthropic.com'];
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!hosts.includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}
