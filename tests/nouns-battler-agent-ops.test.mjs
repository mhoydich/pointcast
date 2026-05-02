import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const API_PATH = new URL('../functions/api/nouns-battler/ops.ts', import.meta.url);
const BENCH_PATH = new URL('../src/lib/nouns-battler-agent-bench.ts', import.meta.url);
const V3_PATH = new URL('../src/pages/nouns-nation-battler-v3.astro', import.meta.url);
const SPRINT_JSON_PATH = new URL('../src/pages/nouns-nation-battler-sprint.json.ts', import.meta.url);
const MANIFEST_PATH = new URL('../src/pages/nouns-nation-battler.json.ts', import.meta.url);

test('Agent Ops API stores public ops entries in PC_QUEUE_KV', async () => {
  const source = await readFile(API_PATH, 'utf8');

  assert.match(source, /PC_QUEUE_KV/);
  assert.match(source, /btl:ops:/);
  assert.match(source, /nouns-battler-ops-v1/);
  assert.match(source, /'claim', 'report', 'handoff'/);
  assert.match(source, /'claimed', 'working', 'blocked', 'submitted', 'handoff'/);
  assert.match(source, /expirationTtl: OPS_TTL_SEC/);
  assert.match(source, /keyShape: 'btl:ops:\{isoTimestamp\}:\{missionId\}:\{hash\}'/);
  assert.match(source, /proofUrl must be an https URL/);
});

test('Agent Ops contract is exposed through shared Battler agent data', async () => {
  const source = await readFile(BENCH_PATH, 'utf8');

  assert.match(source, /NOUNS_BATTLER_AGENT_BENCH_VERSION = '1\.10\.0'/);
  assert.match(source, /export const NOUNS_BATTLER_AGENT_OPS_LOOP/);
  assert.match(source, /route: 'https:\/\/pointcast\.xyz\/nouns-nation-battler-v3\/#ops-ledger'/);
  assert.match(source, /api: 'https:\/\/pointcast\.xyz\/api\/nouns-battler\/ops'/);
  assert.match(source, /fallbackStorageKey: 'pc:nouns-battler:ops-drafts'/);
  assert.match(source, /requestShape: \{/);
  assert.match(source, /agentOps: NOUNS_BATTLER_AGENT_OPS_LOOP/);
});

test('V3 page includes mobile Agent Ops ledger, API fetch, and local fallback', async () => {
  const source = await readFile(V3_PATH, 'utf8');

  assert.match(source, /id="ops-ledger"/);
  assert.match(source, /data-ops-mission/);
  assert.match(source, /data-ops-form/);
  assert.match(source, /action: 'claim'/);
  assert.match(source, /action: 'report'/);
  assert.match(source, /action: 'handoff'/);
  assert.match(source, /data-ops-action=\{button\.action\}/);
  assert.match(source, /\/api\/nouns-battler\/ops/);
  assert.match(source, /fetch\(endpoint \+ '\?action=list&limit=20'/);
  assert.match(source, /localStorage\.setItem\(storageKey/);
  assert.match(source, /pc:nouns-battler:ops-drafts/);
  assert.match(source, /data-copy-action/);
  assert.match(source, /href="#ops-ledger">Ops<\/a>/);
});

test('Sprint and manifest JSON expose Agent Ops v42', async () => {
  const sprint = await readFile(SPRINT_JSON_PATH, 'utf8');
  const manifest = await readFile(MANIFEST_PATH, 'utf8');

  assert.match(sprint, /NOUNS_BATTLER_AGENT_OPS_LOOP/);
  assert.match(sprint, /agentOps: NOUNS_BATTLER_AGENT_OPS_LOOP/);
  assert.match(manifest, /playable browser prototype v42 agent ops ledger/);
  assert.match(manifest, /agentOps: NOUNS_BATTLER_AGENT_OPS_LOOP/);
  assert.match(manifest, /agentOps: 'https:\/\/pointcast\.xyz\/nouns-nation-battler-v3\/#ops-ledger'/);
  assert.match(manifest, /agentOpsApi: 'https:\/\/pointcast\.xyz\/api\/nouns-battler\/ops'/);
  assert.match(manifest, /Season 6 Agent Ops ledger/);
});
