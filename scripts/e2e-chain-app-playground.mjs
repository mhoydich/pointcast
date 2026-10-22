#!/usr/bin/env node
// End-to-end run of the API Playground's logic (public/chain/apps/playground.js)
// against a LOCAL devnet worker:
//
//   node scripts/e2e-chain-app-playground.mjs http://127.0.0.1:8799
//
// It refuses any host that is not localhost or 127.0.0.1: the public devnet is
// only ever read with GET, and the playground's MCP calls are POSTs. What it
// does, in order:
//   1. GET /status, then the same tools/list the page sends on load, diffed
//      against the pinned list (public/chain/apps/playground-tools.json)
//   2. every read-only tool, run over MCP with arguments built by the form
//      logic (buildArguments), and again through its GET twin
//   3. every REST route the page lists, as its Try button sends it
//   4. errors: a 404 route, a tool that returns isError, a bad address, an
//      unknown tool, a JSON-RPC error
//   5. the guard: none of the nine writing tools (nor a stranger) is ever sent
//   6. the generated curl and Node snippets, executed for real, and one
//      writing-tool snippet (a check-in from "pg-e2e-bot") on this throwaway
//      local chain, to prove the copy-paste lines work
//   7. the CORS facts that make the page fall back to GET in a browser
// Exit code 0 only if every check passed.
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { promisify } from 'node:util';
import * as pg from '../public/chain/apps/playground.js';

const execFileAsync = promisify(execFile);
const base = (process.argv[2] || 'http://127.0.0.1:8799').replace(/\/+$/, '');
const origin = pg.parseLocalOrigin(base);
if (!origin) {
  console.error(`refusing ${base}: this script only talks to a local devnet worker (localhost or 127.0.0.1)`);
  process.exit(2);
}

const fixture = JSON.parse(readFileSync(new URL('../public/chain/apps/playground-tools.json', import.meta.url), 'utf8'));
const { tools: PINNED } = pg.parseToolsList({ result: { tools: fixture.tools } });

let passed = 0;
let failed = 0;
const ok = (name, detail = '') => {
  passed += 1;
  console.log(`ok   ${name}${detail ? `  ${detail}` : ''}`);
};
const bad = (name, detail = '') => {
  failed += 1;
  console.log(`FAIL ${name}${detail ? `  ${detail}` : ''}`);
};
const check = (cond, name, detail = '') => (cond ? ok(name, detail) : bad(name, detail));
const keys = (v) => (v && typeof v === 'object' ? Object.keys(v).sort().join(',') : String(v));
const clip = (s, n = 60) => {
  const t = String(s).trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** A fetch that counts requests, so the guard can be shown to send none. */
const sent = [];
const spyFetch = (url, init = {}) => {
  sent.push({ url: String(url), method: init.method || 'GET', body: init.body ? String(init.body) : '' });
  return fetch(url, init);
};
const client = pg.createClient({ base: origin, fetch: spyFetch, timeoutMs: 10_000 });

console.log(`# API Playground e2e against ${origin}`);

// ------------------------------------------------------------ 1. status and tools/list
const status = await (await fetch(`${origin}/status`)).json();
check(status.network === 'devnet' && typeof status.chain_id === 'string', 'GET /status', `${status.chain_id} · height ${status.height} · worker ${status.worker_version} · records ${(status.records || []).join(',')}`);
const house = status.house;

const found = await client.discover(PINNED);
check(found.mode === 'live' && client.transport === 'mcp', 'tools/list over MCP, as the page sends it on load', `mode ${found.mode}, transport ${client.transport}, ${found.tools.length} tools`);
check(found.diff && found.diff.same, 'live tools/list equals the pinned list', found.diff ? `added [${found.diff.added}] removed [${found.diff.removed}] changed [${found.diff.changed}]` : '');
console.log(`     status line: ${pg.discoveryMessage(found, { pinnedAt: fixture.captured_at.slice(0, 10) })}`);
const tools = found.tools;
const kindOf = Object.fromEntries(tools.map((t) => [t.name, pg.classifyTool(t).kind]));
check(tools.filter((t) => kindOf[t.name] === 'read').length === 12 && tools.filter((t) => kindOf[t.name] === 'write').length === 9, 'classification', `${tools.filter((t) => kindOf[t.name] === 'read').length} read-only (Run), ${tools.filter((t) => kindOf[t.name] === 'write').length} writing (no Run), ${tools.filter((t) => kindOf[t.name] === 'unknown').length} unknown`);

// ------------------------------------------------------------ 2. read-only tools over MCP, then through their GET twins
const formValues = {
  chain_status: {},
  chain_feed: { limit: '3' },
  chain_read_block: { height: '1' },
  chain_read_account: { address: house },
  chain_tx_digest: { tx: JSON.stringify({ sender: house, type: 'transfer', to: house, amount: 1 }) },
  editions_list: {},
  station_get: { code: 'GDN' },
  capsules_due: { limit: '5' },
  chain_duties: { bot: 'pg-e2e-bot' },
  chain_daily_lot: {},
  nm_ledger: { limit: '3' },
  nm_note: { serial: '1', svg: 'false' },
};
const mcpResults = {};
for (const tool of tools.filter((t) => kindOf[t.name] === 'read')) {
  const { fields, root } = pg.fieldsFromSchema(tool.inputSchema);
  const built = pg.buildArguments(fields, formValues[tool.name], root);
  if (!built.ok) {
    bad(`${tool.name}: form builds arguments`, JSON.stringify(built.errors));
    continue;
  }
  const r = await client.run(tool, built.args);
  mcpResults[tool.name] = { args: built.args, r };
  // nm_note 1 does not exist on a fresh devnet: a graceful isError with a message is the right answer.
  const expectError = tool.name === 'nm_note' && r.isError;
  check(r.via === 'mcp' && (!r.isError || expectError) && r.json !== undefined, `Run ${tool.name} over MCP`, `${r.isError ? `isError: ${clip(JSON.stringify(r.json))}` : `{${clip(keys(r.json), 70)}}`} · ${r.ms} ms`);
}
// What each call returned, in the one place the page would show it.
const m = mcpResults;
check(m.chain_status?.r.json.chain_id === status.chain_id && m.chain_status.r.json.genesis_hash === status.genesis_hash, 'chain_status matches GET /status');
check(Array.isArray(m.chain_feed?.r.json.blocks), 'chain_feed returns blocks', `${m.chain_feed?.r.json.blocks?.length} blocks, tip ${m.chain_feed?.r.json.tip}`);
check(m.chain_read_block?.r.json.header?.height === 1 || m.chain_read_block?.r.json.height === 1 || m.chain_read_block?.r.json.block !== undefined || m.chain_read_block?.r.json.txs !== undefined, 'chain_read_block 1 returns block 1', clip(keys(m.chain_read_block?.r.json)));
check(typeof m.chain_tx_digest?.r.json.digest === 'string' && m.chain_tx_digest.r.json.digest.length === 64, 'chain_tx_digest returns a 64-hex digest and posts nothing', m.chain_tx_digest?.r.json.digest?.slice(0, 16));

// The same questions through the GET twins (what a browser that cannot read /mcp gets).
client.transport = 'rest';
const stable = ['chain_read_block', 'editions_list', 'station_get'];
for (const [name, { args, r }] of Object.entries(mcpResults)) {
  const tool = tools.find((t) => t.name === name);
  const t = await client.run(tool, args);
  const twin = pg.twinFor(name, args);
  const reachedRoute = t.via === 'rest' && t.status !== undefined;
  if (name === 'nm_note' || name === 'chain_tx_digest' || name === 'chain_duties') {
    check(reachedRoute && (t.status === 200 || (name === 'nm_note' && t.status === 404)), `GET twin of ${name}`, `${pg.twinLabel(twin)} → HTTP ${t.status}${twin.note ? ` · note: ${clip(twin.note, 50)}` : ''}`);
  } else if (stable.includes(name)) {
    check(reachedRoute && JSON.stringify(t.json) === JSON.stringify(r.json), `GET twin of ${name} returns exactly what MCP did`, `${pg.twinLabel(twin)} → HTTP ${t.status}`);
  } else {
    check(reachedRoute && t.status === 200 && (name === 'chain_feed' ? Array.isArray(t.json.blocks) : keys(t.json) === keys(r.json) || name === 'chain_status' || name === 'nm_ledger' || name === 'chain_daily_lot' || name === 'chain_read_account'), `GET twin of ${name}`, `${pg.twinLabel(twin)} → HTTP ${t.status} · {${clip(keys(t.json), 60)}}`);
  }
}
const feedTwin = pg.twinFor('chain_feed', { limit: 3, channel: 'BOT' });
check(feedTwin.dropped.join() === 'channel', 'GET /feed cannot take channel, and the page says so', feedTwin.note);
client.transport = 'mcp';

// ------------------------------------------------------------ 3. every REST route, as Try sends it
const tryValues = { 'raw-block': { height: '1' }, station: { code: 'GDN' }, account: { address: house } };
for (const route of pg.REST_ROUTES) {
  const r = await client.runRoute(route, tryValues[route.id] || {});
  const label = `Try ${route.path.replace('{height}', tryValues['raw-block'].height).replace('{code}', 'GDN').replace('{address}', `${house.slice(0, 6)}…`)}${Object.keys(r.built.query).length ? `?${new URLSearchParams(r.built.query)}` : ''}`;
  check(r.ok && r.status === 200 && r.json !== undefined, label, `HTTP ${r.status} · {${clip(keys(r.json), 60)}} · ${r.ms} ms`);
}

// ------------------------------------------------------------ 4. errors
const rb = pg.REST_ROUTES.find((r) => r.id === 'raw-block');
const notFound = await client.runRoute(rb, { height: '99999999' });
check(!notFound.ok && notFound.status === 404 && /not found/.test(notFound.json?.error || ''), 'a 404 route is a result, with its body', `HTTP ${notFound.status} ${JSON.stringify(notFound.json)}`);
const blockTool = tools.find((t) => t.name === 'chain_read_block');
const missing = await client.run(blockTool, { height: 99999999 });
check(missing.via === 'mcp' && missing.isError === true && /not found/.test(missing.json?.error || ''), 'a tool that returns isError is shown as an error with its JSON', JSON.stringify(missing.json));
const badAddr = await client.get('/account/zzz');
check(!badAddr.ok && typeof (badAddr.json?.error ?? badAddr.text) === 'string', 'a bad address: the devnet’s refusal is shown', `HTTP ${badAddr.status} ${clip(badAddr.text, 70)}`);
const unknown = await client.callTool('pg_e2e_no_such_tool', {});
check(unknown.isError === true && /unknown tool/.test(unknown.json?.error || ''), 'an unknown tool name is an isError result', JSON.stringify(unknown.json));
let rpcErr = null;
const rpcClient = pg.createClient({ base: origin, mcp: `${origin}/mcp`, fetch: (url, init) => spyFetch(url, { ...init, body: JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'nope/nope' }) }) });
try {
  await rpcClient.listTools();
} catch (e) {
  rpcErr = e;
}
check(rpcErr && rpcErr.kind === 'rpc' && rpcErr.code === -32601, 'a JSON-RPC error becomes a PgError(rpc)', rpcErr && `${rpcErr.code} ${rpcErr.message}`);
const offline = pg.createClient({ base: 'http://127.0.0.1:1', timeoutMs: 3000 });
const down = await offline.discover(PINNED);
check(down.mode === 'fixture' && down.reason === 'unreachable' && /devnet unreachable/.test(pg.discoveryMessage(down)), 'nothing listening: unreachable, with the pinned list', pg.discoveryMessage(down).slice(0, 80));
const refused = await offline.run(tools.find((t) => t.name === 'chain_status'), {}).then(() => null, (e) => e);
check(refused && refused.kind === 'network' && /devnet unreachable/.test(pg.friendlyError(refused)), 'Run against a dead devnet says devnet unreachable', pg.friendlyError(refused).slice(0, 70));

// ------------------------------------------------------------ 5. the guard
const before = sent.length;
const writers = tools.filter((t) => kindOf[t.name] !== 'read');
let refusedAll = true;
for (const t of writers) {
  const err = await client.run(t, { bot: 'pg-e2e-bot', title: 'must not be sent' }).then(() => null, (e) => e);
  if (!err || err.kind !== 'refused') refusedAll = false;
}
const stranger = await client.run({ name: 'chain_peek', description: 'reads', annotations: { readOnlyHint: true } }, {}).then(() => null, (e) => e);
check(refusedAll && stranger && stranger.kind === 'refused' && sent.length === before, 'Run refuses all 9 writing tools and an unknown tool, before any request', `${writers.length} refused, ${sent.length - before} requests sent`);
const callNames = sent.filter((s) => s.body.includes('"tools/call"')).map((s) => JSON.parse(s.body).params.name);
check(callNames.every((n) => pg.READ_TOOLS.includes(n) || n === 'pg_e2e_no_such_tool'), 'every tools/call this run sent was a read-only tool', `${new Set(callNames).size} distinct names`);

// ------------------------------------------------------------ 6. the snippets, executed
const mcpUrl = `${origin}/mcp`;
const feedArgs = { limit: 2 };
const curl = pg.curlSnippet(mcpUrl, 'chain_feed', feedArgs);
const viaCurl = await execFileAsync('bash', ['-c', curl], { encoding: 'utf8', timeout: 15_000 });
const curlJson = JSON.parse(viaCurl.stdout);
check(curlJson.result?.structuredContent?.blocks?.length <= 2 && curlJson.result.isError === false, 'the generated curl runs', `${curl.split('\n').length} lines → ${curlJson.result?.structuredContent?.blocks?.length} blocks`);
const nodeSrc = pg.nodeSnippet(mcpUrl, 'chain_status', {});
const viaNode = await execFileAsync(process.execPath, ['--input-type=module', '-e', nodeSrc], { encoding: 'utf8', timeout: 15_000 });
const nodeJson = JSON.parse(viaNode.stdout);
check(nodeSrc.split('\n').length === 10 && nodeJson.chain_id === status.chain_id, 'the generated ten-line Node snippet runs', `${nodeSrc.split('\n').length} lines → ${nodeJson.chain_id}`);
const twinCurl = pg.restCurl(origin, '/feed', pg.twinFor('chain_feed', feedArgs).query);
const viaTwin = await execFileAsync('bash', ['-c', twinCurl], { encoding: 'utf8', timeout: 15_000 });
check(Array.isArray(JSON.parse(viaTwin.stdout).blocks), 'the GET-twin curl runs', twinCurl);

// A writing tool's snippet, built from the form, run on this throwaway local chain.
const checkin = tools.find((t) => t.name === 'chain_checkin');
const cf = pg.fieldsFromSchema(checkin.inputSchema).fields;
const cargs = pg.snippetArgs(cf, { bot: 'pg-e2e-bot', note: 'checking in from the playground e2e', idempotency_key: 'pg-e2e-1' });
const writeCurl = pg.curlSnippet(mcpUrl, 'chain_checkin', cargs);
const wrote = JSON.parse((await execFileAsync('bash', ['-c', writeCurl], { encoding: 'utf8', timeout: 15_000 })).stdout);
const wr = wrote.result?.structuredContent;
check(wrote.jsonrpc === '2.0' && wr && (wrote.result.isError === false ? typeof wr.tx_hash === 'string' : typeof wr.error === 'string'), 'a writing tool’s snippet works when pasted (local throwaway chain only)', wrote.result.isError ? `isError: ${clip(JSON.stringify(wr))}` : `tx ${wr.tx_hash.slice(0, 12)}… ${wr.status}${wr.duplicate ? ' (duplicate)' : ''}`);

// ------------------------------------------------------------ 7. why the page falls back to GET in a browser
const raw = (method, path, headers, body) =>
  new Promise((resolve, reject) => {
    const u = new URL(path, origin);
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname, method, headers }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.end(body);
  });
const pre = await raw('OPTIONS', '/mcp', { origin: 'https://pointcast.xyz', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' });
const post = await raw('POST', '/mcp', { origin: 'https://pointcast.xyz', 'content-type': 'application/json' }, JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }));
const getReq = await raw('GET', '/status', { origin: 'https://pointcast.xyz' });
check(!pre.headers['access-control-allow-origin'] && !post.headers['access-control-allow-origin'], 'FINDING: /mcp sends no access-control-allow-origin (preflight or POST), so a browser page cannot read it', `OPTIONS ${pre.status}, POST ${post.status}`);
check(getReq.headers['access-control-allow-origin'] === '*', 'GET /status sends access-control-allow-origin: * (the fallback works in a browser)', `GET ${getReq.status}`);
const digestPre = await raw('OPTIONS', '/tx/digest', { origin: 'https://pointcast.xyz', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' });
check(digestPre.headers['access-control-allow-origin'] === '*', 'POST /tx/digest allows browsers (the one POST twin)', `OPTIONS ${digestPre.status}`);

console.log(`# ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
