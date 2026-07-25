#!/usr/bin/env node
/**
 * town-inspector — walks every door the manifest advertises and checks
 * every claim it makes against what production actually serves.
 *
 * PointCast's promise to agents is that /agents.json is true. This script
 * is the office that keeps the promise: it reads the manifest, visits each
 * advertised URL, and re-verifies the specific claims (agent-mode header,
 * CORS openness, well-known aliases, citable block JSON, honest freshness
 * in /explore.json, a living MCP endpoint). Drift becomes a report, not
 * a surprise found by a visiting agent.
 *
 * Usage:
 *   node scripts/town-inspector.mjs                 # inspect production
 *   node scripts/town-inspector.mjs --base URL      # inspect a preview
 *   node scripts/town-inspector.mjs --write         # save the report to
 *                                                   # src/data/town-inspector-report.json
 *
 * Exits 1 when any door is broken or any claim fails, so it can gate a
 * deploy. Network-only — safe to run from anywhere with no repo state.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const args = process.argv.slice(2);
const BASE = (args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://pointcast.xyz').replace(/\/$/, '');
const WRITE = args.includes('--write');

const INSPECTOR_UA = 'PointCast-TownInspector/1.0 (+https://pointcast.xyz/health)';
const AGENT_UA = 'ClaudeBot/1.0 (town-inspector agent-mode probe)';
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const TIMEOUT_MS = 25_000;
const CONCURRENCY = 8;

/** fetch with a deadline; body is cancelled unless the caller wants it. */
async function probe(url, { ua = INSPECTOR_UA, readBody = false, method = 'GET', headers = {}, body } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'User-Agent': ua, ...headers },
      body,
    });
    let text = null;
    if (readBody) text = await res.text();
    else await res.body?.cancel();
    return { status: res.status, headers: res.headers, text };
  } catch (err) {
    return { status: 0, headers: new Headers(), text: null, error: String(err?.cause ?? err).slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

/** Every same-origin, non-templated URL reachable from the manifest's endpoint tree. */
function collectDoors(node, out = new Set()) {
  if (typeof node === 'string') {
    if (node.startsWith(`${BASE}/`) && !node.includes('{')) out.add(node.split('#')[0]);
  } else if (Array.isArray(node)) {
    for (const v of node) collectDoors(v, out);
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) collectDoors(v, out);
  }
  return out;
}

async function pooled(items, worker) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await worker(items[idx], idx);
      }
    }),
  );
  return results;
}

const claims = [];
function claim(id, label, ok, note) {
  claims.push({ id, label, ok, note });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${id} — ${note}`);
}

console.log(`town-inspector · base ${BASE}\n`);

// 1 — the manifest itself.
const manifestRes = await probe(`${BASE}/agents.json`, { readBody: true });
if (manifestRes.status !== 200) {
  console.error(`agents.json unreachable (${manifestRes.status}) — nothing to inspect.`);
  process.exit(1);
}
const manifest = JSON.parse(manifestRes.text);

// 2 — walk every advertised door.
const doors = [...collectDoors(manifest.endpoints)].sort();
console.log(`walking ${doors.length} advertised doors…`);
const doorResults = await pooled(doors, async (url) => ({ url, ...(await probe(url)) }));
const broken = doorResults
  .filter((r) => r.status !== 200)
  .map((r) => ({ url: r.url, status: r.status, ...(r.error ? { error: r.error } : {}) }));
console.log(`${doors.length - broken.length}/${doors.length} doors open\n`);

// 3 — the specific claims the manifest makes.

// Well-known aliases resolve to the manifest.
for (const [id, url] of [
  ['well-known-agents-alias', manifest.endpoints?.discovery?.wellKnownAgents],
  ['well-known-ai-alias', manifest.endpoints?.discovery?.wellKnownAi],
]) {
  if (!url) continue;
  const res = await probe(url, { readBody: true });
  let ok = res.status === 200;
  try {
    ok = ok && JSON.parse(res.text).name === 'PointCast';
  } catch {
    ok = false;
  }
  claim(id, `${url.replace(BASE, '')} serves the manifest`, ok, ok ? 'resolves and parses' : `status ${res.status}`);
}

// Agent mode: stripped payload + X-Agent-Mode header for crawler UAs.
{
  const asAgent = await probe(`${BASE}/`, { ua: AGENT_UA, readBody: true });
  const asHuman = await probe(`${BASE}/`, { ua: BROWSER_UA, readBody: true });
  const header = asAgent.headers.get('x-agent-mode');
  const smaller = (asAgent.text?.length ?? 0) > 0 && (asAgent.text?.length ?? 0) < (asHuman.text?.length ?? 0);
  claim(
    'agent-mode-strip',
    'crawler UAs get stripped HTML with X-Agent-Mode',
    Boolean(header) && smaller,
    header
      ? `header "${header}" · ${asAgent.text?.length ?? 0} vs ${asHuman.text?.length ?? 0} bytes`
      : 'X-Agent-Mode header missing',
  );
}

// CORS: the applies-list carries Access-Control-Allow-Origin: *.
{
  const applies = (manifest.cors?.applies ?? []).filter((p) => !p.includes('*')).slice(0, 8);
  const misses = [];
  for (const p of applies) {
    const res = await probe(`${BASE}${p}`);
    if (res.status === 200 && res.headers.get('access-control-allow-origin') !== '*') misses.push(p);
  }
  claim(
    'cors-open',
    'agent surfaces are fetchable from any origin',
    misses.length === 0,
    misses.length ? `missing ACAO on ${misses.join(', ')}` : `${applies.length} sampled, all open`,
  );
}

// Citation layer: the newest block has parseable JSON evidence.
{
  const res = await probe(`${BASE}/blocks.json`, { readBody: true });
  let ok = false;
  let note = `blocks.json status ${res.status}`;
  try {
    const blocks = JSON.parse(res.text);
    const list = Array.isArray(blocks) ? blocks : blocks.blocks ?? blocks.items ?? [];
    const latest = list.map((b) => b.id).sort().at(-1);
    const bRes = await probe(`${BASE}/b/${latest}.json`, { readBody: true });
    const b = JSON.parse(bRes.text);
    ok = Boolean(b.id && b.title && b.channel);
    note = ok ? `block ${latest} cites clean` : `block ${latest} missing fields`;
  } catch (err) {
    note = `parse failure: ${String(err).slice(0, 80)}`;
  }
  claim('block-json-citable', 'latest block resolves as citation-grade JSON', ok, note);
}

// /explore.json: no leaked template placeholders, no fake freshness.
{
  const res = await probe(`${BASE}/explore.json`, { readBody: true });
  try {
    const explore = JSON.parse(res.text);
    const feats = explore.features ?? [];
    const placeholders = feats.filter((f) => f.title === 'app.name' || f.description === 'app.description');
    claim(
      'explore-no-placeholders',
      'no unresolved template strings in /explore.json',
      placeholders.length === 0,
      placeholders.length ? `${placeholders.length} features still read "app.name"` : `${feats.length} features clean`,
    );
    const stamps = new Set(feats.map((f) => f.lastCommit).filter(Boolean));
    const honest = stamps.size !== 1 || feats.length < 20;
    claim(
      'explore-freshness-honest',
      'lastCommit varies per page (or is honestly absent)',
      honest,
      honest ? `${stamps.size} distinct timestamps` : 'every feature shares one timestamp — degenerate checkout',
    );
  } catch (err) {
    claim('explore-no-placeholders', 'explore.json parses', false, String(err).slice(0, 80));
  }
}

// MCP: the advertised endpoint answers a JSON-RPC initialize.
{
  const url = manifest.endpoints?.mcp?.endpoint;
  if (url) {
    const res = await probe(url, {
      method: 'POST',
      readBody: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'town-inspector', version: '1.0' } },
      }),
    });
    let ok = false;
    let note = `status ${res.status}`;
    try {
      const name = JSON.parse(res.text)?.result?.serverInfo?.name;
      ok = Boolean(name);
      note = ok ? `serverInfo.name "${name}"` : 'no serverInfo in reply';
    } catch {
      note = 'initialize reply did not parse';
    }
    claim('mcp-alive', 'MCP endpoint answers initialize', ok, note);
  }
}

// Orientation files: the short one should be the short one. A note, not a
// failure — the manifest never promises it, but agents pay for the tokens.
const notes = [];
{
  const short = await probe(`${BASE}/llms.txt`, { readBody: true });
  const full = await probe(`${BASE}/llms-full.txt`, { readBody: true });
  if (short.status === 200 && full.status === 200 && short.text.length > full.text.length) {
    notes.push(
      `llms.txt (${short.text.length} bytes) is larger than llms-full.txt (${full.text.length} bytes) — the short orientation outgrew the long one.`,
    );
  }
}

// 4 — the report.
const failedClaims = claims.filter((c) => !c.ok);
const report = {
  $schema: 'https://pointcast.xyz/health.json',
  name: 'PointCast Town Inspector',
  description:
    'Walks every door /agents.json advertises and re-verifies every claim it makes. Drift becomes a report, not a surprise.',
  inspectedAt: new Date().toISOString(),
  base: BASE,
  doors: {
    checked: doors.length,
    open: doors.length - broken.length,
    broken,
  },
  claims,
  notes,
  verdict: broken.length === 0 && failedClaims.length === 0 ? 'clean' : 'drift',
};

console.log(`\ndoors: ${report.doors.open}/${report.doors.checked} open · claims: ${claims.length - failedClaims.length}/${claims.length} pass · verdict: ${report.verdict}`);
for (const b of broken) console.log(`  broken ${b.status}: ${b.url}`);
for (const n of notes) console.log(`  note: ${n}`);

if (WRITE) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const out = path.join(repoRoot, 'src/data/town-inspector-report.json');
  writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nreport written → ${path.relative(repoRoot, out)}`);
}

process.exit(report.verdict === 'clean' ? 0 : 1);
