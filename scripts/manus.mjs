#!/usr/bin/env node
/**
 * manus.mjs — thin wrapper around the Manus REST API.
 *
 * Reads MANUS_API_KEY from .env.local (gitignored). Endpoints use the
 * `{resource}.{verb}` convention (e.g. task.list, task.create, task.detail).
 * Auth is a single header: x-manus-api-key.
 *
 * Commands:
 *   node scripts/manus.mjs list            List your tasks (latest first)
 *   node scripts/manus.mjs get <task_id>   Fetch task status + messages
 *   node scripts/manus.mjs create "..."    Kick off a new task with a prompt
 *   node scripts/manus.mjs create --title "QA pass" --file docs/briefs/foo.md
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
  if (fs.existsSync(ENV_FILE)) {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } else if (!process.env.MANUS_API_KEY) {
    console.error(`[manus] missing ${ENV_FILE} — put MANUS_API_KEY=... there`);
    process.exit(2);
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
  const [detail, messages] = await Promise.all([
    api(`/v2/task.detail?task_id=${encodeURIComponent(id)}`),
    api(`/v2/task.listMessages?task_id=${encodeURIComponent(id)}&order=desc&limit=50`),
  ]);
  console.log(JSON.stringify({
    ok: detail.ok && messages.ok,
    request_id: detail.request_id,
    task: detail.task,
    messages: messages.messages ?? [],
  }, null, 2));
}

function parseCreateArgs(args) {
  const opts = {
    title: null,
    file: null,
    profile: 'manus-1.6-max',
    visibility: 'private',
    interactive: false,
    promptParts: [],
  };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--title') opts.title = args[++i];
    else if (arg === '--file') opts.file = args[++i];
    else if (arg === '--profile') opts.profile = args[++i];
    else if (arg === '--public') opts.visibility = 'public';
    else if (arg === '--team') opts.visibility = 'team';
    else if (arg === '--interactive') opts.interactive = true;
    else opts.promptParts.push(arg);
  }
  return opts;
}

async function cmdCreate(args) {
  const opts = parseCreateArgs(args);
  let prompt = opts.promptParts.join(' ').trim();
  if (opts.file) {
    const filePath = path.resolve(REPO_ROOT, opts.file);
    prompt = fs.readFileSync(filePath, 'utf8') + (prompt ? `\n\n${prompt}` : '');
  }
  if (!prompt) {
    console.error('usage: manus.mjs create "prompt..." [--title "..."] [--file docs/briefs/foo.md] [--profile manus-1.6-max]');
    process.exit(3);
  }
  const data = await api('/v2/task.create', {
    method: 'POST',
    body: JSON.stringify({
      title: opts.title || undefined,
      agent_profile: opts.profile,
      interactive_mode: opts.interactive,
      share_visibility: opts.visibility,
      message: {
        content: prompt,
      },
    }),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function cmdWatch(id) {
  if (!id) { console.error('usage: manus.mjs watch <task_id>'); process.exit(3); }
  const start = Date.now();
  while (true) {
    const data = await api(`/v2/task.detail?task_id=${encodeURIComponent(id)}`);
    const task = data.task ?? data;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    process.stderr.write(`\r[${elapsed}s] status=${task.status} credits=${task.credit_usage}        `);
    if (task.status !== 'running') {
      const messages = await api(`/v2/task.listMessages?task_id=${encodeURIComponent(id)}&order=desc&limit=50`);
      process.stderr.write('\n');
      console.log(JSON.stringify({
        ok: data.ok && messages.ok,
        request_id: data.request_id,
        task,
        messages: messages.messages ?? [],
      }, null, 2));
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
  case 'create': await cmdCreate(rest); break;
  case 'watch':  await cmdWatch(rest[0]); break;
  default:
    console.error('usage: manus.mjs <list|get|create|watch> [args]');
    process.exit(3);
}
