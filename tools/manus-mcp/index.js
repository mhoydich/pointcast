#!/usr/bin/env node
/**
 * manus-mcp — a minimal MCP stdio server that wraps the Manus REST API.
 *
 * Purpose: let Claude Code delegate to Manus on Mike's Manus credit budget,
 * so "operationalize Manus" stops meaning "write briefs and wait for Mike to
 * run the session." Follows the same shape as the Codex MCP integration
 * (stdio JSON-RPC), but proxies to Manus's HTTP API instead of a local CLI.
 *
 * Protocol: MCP (Model Context Protocol) over stdio. Hand-rolled JSON-RPC
 * 2.0 — no SDK dep, zero npm install. Compatible with Claude Code's
 * `claude mcp add` command.
 *
 * Tools exposed:
 *   - manus_run_task(prompt, files?, agent?, poll_timeout_sec?)
 *       Creates a Manus task, polls until done, returns final result.
 *   - manus_task_status(task_id)
 *       Returns current status + partial output for a task already in flight.
 *
 * Config (env vars):
 *   - MANUS_API_KEY            required. From manus.im → Settings → API.
 *   - MANUS_BASE_URL           default: https://api.manus.ai
 *   - MANUS_AGENT_DEFAULT      default: manus-1.6-max
 *   - MANUS_POLL_INTERVAL_MS   default: 3000
 *   - MANUS_MAX_POLL_SEC       default: 600 (10 min)
 *   - MANUS_CREATE_PATH        default: /v2/tasks            (POST)
 *   - MANUS_STATUS_PATH_TPL    default: /v2/tasks/{id}       (GET; {id} replaced)
 *   - MANUS_AUTH_SCHEME        default: Bearer (becomes "Bearer $KEY")
 *                              set to "X-API-Key" to send as header instead
 *
 * Docs: https://manus.im/docs/integrations/manus-api
 *       https://open.manus.im/docs (full API reference; requires login)
 *
 * Install into Claude Code:
 *   claude mcp add manus -e MANUS_API_KEY=$MANUS_API_KEY -- node /path/to/manus-mcp/index.js
 *
 * Then restart Claude Code, run /mcp inside, and `manus` should appear with
 * the two tools above.
 *
 * Author: cc. Source: Mike 2026-04-20 17:32 PT chat ("yah, build the shim").
 */

import { readFileSync } from 'node:fs';

const CONFIG = {
  apiKey: process.env.MANUS_API_KEY || '',
  baseUrl: (process.env.MANUS_BASE_URL || 'https://api.manus.ai').replace(/\/$/, ''),
  agentDefault: process.env.MANUS_AGENT_DEFAULT || 'manus-1.6-max',
  pollIntervalMs: parseInt(process.env.MANUS_POLL_INTERVAL_MS || '3000', 10),
  maxPollSec: parseInt(process.env.MANUS_MAX_POLL_SEC || '600', 10),
  createPath: process.env.MANUS_CREATE_PATH || '/v2/tasks',
  statusPathTpl: process.env.MANUS_STATUS_PATH_TPL || '/v2/tasks/{id}',
  authScheme: process.env.MANUS_AUTH_SCHEME || 'Bearer',
};

// ---- JSON-RPC framing over stdio ------------------------------------------

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  // MCP uses newline-delimited JSON (LSP-style Content-Length is optional but
  // the Claude Code MCP client accepts NDJSON for stdio servers).
  let idx;
  while ((idx = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      handleMessage(msg).catch((err) => {
        writeError(msg.id, -32000, String(err?.message || err));
      });
    } catch (err) {
      writeError(null, -32700, 'Parse error: ' + String(err?.message || err));
    }
  }
});

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
function writeResult(id, result) { send({ jsonrpc: '2.0', id, result }); }
function writeError(id, code, message, data) {
  const err = { code, message };
  if (data !== undefined) err.data = data;
  send({ jsonrpc: '2.0', id, error: err });
}

// ---- MCP protocol handlers -------------------------------------------------

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0') {
    writeError(msg?.id ?? null, -32600, 'Invalid Request');
    return;
  }
  const { method, params, id } = msg;
  switch (method) {
    case 'initialize':           return writeResult(id, handleInitialize(params));
    case 'tools/list':           return writeResult(id, handleListTools());
    case 'tools/call':           return writeResult(id, await handleCallTool(params));
    case 'ping':                 return writeResult(id, {});
    case 'shutdown':             process.exit(0);
    default:
      // Notifications (no id) are accepted silently.
      if (id === undefined) return;
      writeError(id, -32601, 'Method not found: ' + method);
  }
}

function handleInitialize(_params) {
  return {
    protocolVersion: '2025-06-18',
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: 'manus-mcp',
      version: '0.1.0',
    },
  };
}

function handleListTools() {
  return {
    tools: [
      {
        name: 'manus_run_task',
        description:
          "Create a Manus task and wait for completion. Returns the final output. Good for long-horizon research, file-producing tasks, web automation where Manus's browser sandbox is the moat. Default agent is manus-1.6-max; specify a different one if you have access.",
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The task description / instruction for Manus.',
            },
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of file URLs or identifiers to attach.',
            },
            agent: {
              type: 'string',
              description: 'Agent profile to run. Defaults to MANUS_AGENT_DEFAULT env var (manus-1.6-max).',
            },
            poll_timeout_sec: {
              type: 'number',
              description: 'Max seconds to poll before returning partial state. Defaults to MANUS_MAX_POLL_SEC (600).',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'manus_task_status',
        description:
          'Check the current status + partial output of a Manus task by ID. Useful when a long-running task started and you want to check in without blocking for the full poll loop.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'ID returned by manus_run_task or a prior task create.' },
          },
          required: ['task_id'],
        },
      },
    ],
  };
}

async function handleCallTool(params) {
  const name = params?.name;
  const args = params?.arguments || {};
  if (name === 'manus_run_task') {
    return { content: [{ type: 'text', text: JSON.stringify(await runTask(args), null, 2) }] };
  }
  if (name === 'manus_task_status') {
    return { content: [{ type: 'text', text: JSON.stringify(await taskStatus(args), null, 2) }] };
  }
  throw new Error('Unknown tool: ' + String(name));
}

// ---- Manus REST client -----------------------------------------------------

function headers() {
  if (!CONFIG.apiKey) {
    throw new Error('MANUS_API_KEY env var is not set. Get a key from manus.im → Settings → API.');
  }
  const h = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (CONFIG.authScheme === 'X-API-Key') {
    h['X-API-Key'] = CONFIG.apiKey;
  } else {
    h['Authorization'] = CONFIG.authScheme + ' ' + CONFIG.apiKey;
  }
  return h;
}

async function createTask({ prompt, files, agent }) {
  const body = {
    agent: agent || CONFIG.agentDefault,
    prompt: prompt,
  };
  if (Array.isArray(files) && files.length) body.files = files;
  const res = await fetch(CONFIG.baseUrl + CONFIG.createPath, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error('Manus create-task failed: HTTP ' + res.status + ' — ' + (json?.error?.message || text.slice(0, 400)));
  }
  return json;
}

async function getTask(taskId) {
  const path = CONFIG.statusPathTpl.replace('{id}', encodeURIComponent(taskId));
  const res = await fetch(CONFIG.baseUrl + path, { method: 'GET', headers: headers() });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error('Manus task-status failed: HTTP ' + res.status + ' — ' + (json?.error?.message || text.slice(0, 400)));
  }
  return json;
}

function extractTaskId(createResp) {
  // Manus wrap pattern: { ok, request_id, data: { id | task_id, ... } }
  return (
    createResp?.data?.task_id ||
    createResp?.data?.id ||
    createResp?.task_id ||
    createResp?.id ||
    null
  );
}

function extractStatus(statusResp) {
  // Common states: pending / running / completed / failed / cancelled
  return (
    statusResp?.data?.status ||
    statusResp?.status ||
    statusResp?.state ||
    'unknown'
  );
}

function isTerminal(status) {
  const s = String(status || '').toLowerCase();
  return (
    s === 'completed' || s === 'success' || s === 'succeeded' ||
    s === 'failed' || s === 'error' || s === 'errored' ||
    s === 'cancelled' || s === 'canceled'
  );
}

async function runTask(args) {
  const created = await createTask(args);
  const taskId = extractTaskId(created);
  if (!taskId) {
    return {
      ok: false,
      error: 'create-succeeded-but-no-task-id',
      note: 'Manus returned 2xx but we could not find a task ID in the response. Check MANUS_CREATE_PATH + response shape in env.',
      response: created,
    };
  }
  const pollTimeoutSec = Math.min(
    Math.max(args.poll_timeout_sec || CONFIG.maxPollSec, 5),
    CONFIG.maxPollSec * 2,
  );
  const deadline = Date.now() + pollTimeoutSec * 1000;
  let last = null;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, CONFIG.pollIntervalMs));
    try {
      last = await getTask(taskId);
    } catch (err) {
      // Transient fetch error — keep trying up to deadline.
      last = { error: String(err?.message || err) };
      continue;
    }
    if (isTerminal(extractStatus(last))) {
      return { ok: true, task_id: taskId, status: extractStatus(last), result: last };
    }
  }
  return {
    ok: false,
    task_id: taskId,
    status: extractStatus(last),
    note: 'Polled past poll_timeout_sec without terminal state. Use manus_task_status with this task_id to check later.',
    last: last,
  };
}

async function taskStatus(args) {
  if (!args?.task_id) throw new Error('task_id is required');
  const r = await getTask(args.task_id);
  return { ok: true, task_id: args.task_id, status: extractStatus(r), raw: r };
}

// ---- Startup log (stderr so it doesn't pollute stdio JSON-RPC) -------------
process.stderr.write(
  '[manus-mcp] ready · base=' + CONFIG.baseUrl +
  ' · agent=' + CONFIG.agentDefault +
  ' · poll=' + CONFIG.pollIntervalMs + 'ms×' + CONFIG.maxPollSec + 's' +
  ' · auth=' + CONFIG.authScheme +
  (CONFIG.apiKey ? ' · key-set' : ' · KEY-MISSING') + '\n',
);
