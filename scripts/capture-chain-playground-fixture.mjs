#!/usr/bin/env node
// Captures the API Playground's pinned tool list: POST tools/list to a LOCAL
// devnet worker (the same code and launch records as the public devnet) and
// write public/chain/apps/playground-tools.json.
//
//   node scripts/capture-chain-playground-fixture.mjs http://127.0.0.1:8799
//
// It refuses any host that is not localhost or 127.0.0.1: the public devnet is
// only ever read with GET, and tools/list is a POST.
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:8799').replace(/\/+$/, '');
const u = new URL(base);
if (!['localhost', '127.0.0.1'].includes(u.hostname)) {
  console.error(`refusing ${u.hostname}: this script only talks to a local devnet worker`);
  process.exit(2);
}

const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
const rpc = async (body) => {
  const res = await fetch(`${u.origin}/mcp`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST /mcp ${res.status}`);
  return res.json();
};

const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'pg-capture', version: '1' } } });
const list = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
const status = await (await fetch(`${u.origin}/status`)).json();
const tools = list?.result?.tools;
if (!Array.isArray(tools) || tools.length === 0) throw new Error('no tools in tools/list');

const out = {
  schema: 'pointcast-devnet/playground-tools/v1',
  captured_at: new Date().toISOString(),
  source: 'POST tools/list on a local devnet-2 worker running the public devnet’s code (same launch records), not on the public devnet itself',
  worker_version: String(status.worker_version ?? ''),
  chain_epoch: String(status.chain_epoch ?? ''),
  records: Array.isArray(status.records) ? status.records : [],
  protocol_version: String(init?.result?.protocolVersion ?? ''),
  server_name: String(init?.result?.serverInfo?.name ?? ''),
  count: tools.length,
  tools,
};
writeFileSync(new URL('../public/chain/apps/playground-tools.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`captured ${tools.length} tools from ${u.origin} (worker ${out.worker_version}, records ${out.records.join(',')})`);
