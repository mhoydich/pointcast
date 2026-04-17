#!/usr/bin/env node
/**
 * manus.mjs — thin wrapper around the Manus REST API.
 *
 * Reads MANUS_API_KEY from .env.local (gitignored). Endpoints use the
 * `{resource}.{verb}` convention (e.g. task.list, task.create, task.get).
 * Auth is a single header: x-manus-api-key.
 *
 * Commands:
 *   node scripts/manus.mjs list            List your tasks (latest first)
 *   node scripts/manus.mjs get <task_id>   Fetch a task's detail + output
 *   node scripts/manus.mjs create "..."    Kick off a new task with a prompt
 *   node scripts/manus.mjs watch <id>      Poll a task until done
 *
 * Exit codes: 0 success, 1 API error, 2 missing key, 3 bad args.
 *
 * Why a local wrapper vs calling the API directly each time: (a) keeps
 * the key out of shell history, (b) gives us one place to pin on version
 * changes, (c) a future Claude session can import + script against this.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(REPO_ROOT, '.env.local');
const BASE_URL = 'https://api.manus.ai';

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error(`[manus] missing ${ENV_FILE} — put MANUS_API_KEY=... there`);
    process.exit(2);
  }
  const raw = fs.readFileSync(ENV_FILE, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
  if (!process.env.MANUS_API_KEY) {
    console.error('[manus] MANUS_API_KEY not set in .env.local');
    process.exit(2);
  }
}

async function api(pathAndVerb, init = {}) {
  const res = await fetch(`${BASE_URL}${pathAndVerb}`, {
    ...init,
    headers: {
      'x-manus-api-key': process.env.MANUS_API_KEY,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    console.error(`[manus] ${pathAndVerb} → HTTP ${res.status}`);
    console.error(JSON.stringify(json, null, 2));
    process.exit(1);
  }
  return json;
}

function fmtRel(ts) {
  const seconds = Math.floor(Date.now() / 1000 - Number(ts));
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function cmdList() {
  const data = await api('/v2/task.list');
  const tasks = data.data ?? [];
  if (!tasks.length) { console.log('(no tasks)'); return; }
  for (const t of tasks) {
    const badge = t.status === 'running' ? '⏳' : t.status === 'completed' ? '✓' : t.status === 'failed' ? '✗' : '•';
    console.log(`${badge} ${t.id}  ${t.status.padEnd(10)}  ${fmtRel(t.created_at).padEnd(10)}  ${t.credit_usage} cr  ${t.title}`);
  }
}

async function cmdGet(id) {
  if (!id) { console.error('usage: manus.mjs get <task_id>'); process.exit(3); }
  const data = await api(`/v2/task.get?task_id=${encodeURIComponent(id)}`);
  console.log(JSON.stringify(data, null, 2));
}

async function cmdCreate(prompt) {
  if (!prompt) { console.error('usage: manus.mjs create "prompt..."'); process.exit(3); }
  // API expects { task_type, message: { content } } — NOT `input`.
  const data = await api('/v2/task.create', {
    method: 'POST',
    body: JSON.stringify({ task_type: 'standard', message: { content: prompt } }),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdWatch(id) {
  if (!id) { console.error('usage: manus.mjs watch <task_id>'); process.exit(3); }
  const start = Date.now();
  while (true) {
    const data = await api(`/v2/task.get?task_id=${encodeURIComponent(id)}`);
    const task = data.data ?? data;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    process.stderr.write(`\r[${elapsed}s] status=${task.status} credits=${task.credit_usage}        `);
    if (task.status !== 'running' && task.status !== 'pending') {
      process.stderr.write('\n');
      console.log(JSON.stringify(task, null, 2));
      return;
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
}

const [,, cmd, ...rest] = process.argv;
loadEnv();
switch (cmd) {
  case 'list':   await cmdList(); break;
  case 'get':    await cmdGet(rest[0]); break;
  case 'create': await cmdCreate(rest.join(' ')); break;
  case 'watch':  await cmdWatch(rest[0]); break;
  default:
    console.error('usage: manus.mjs <list|get|create|watch> [args]');
    process.exit(3);
}
