import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Open Studio keeps the public build ledger beside the playable artifact', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/haptic-dreams/build.astro'),
    read('src/lib/pointcast-buildcast.ts'),
  ]);

  assert.match(page, /class="studio-grid"/);
  assert.match(page, /src="\/haptic-dreams\/play"/);
  assert.match(page, /title="Saturday Kingdom: Signal Run playable game"/);
  assert.match(page, /WATCH THE BUILD/);
  assert.match(page, /PLAY THE GAME/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /setInterval\(poll, 3500\)/);
  assert.match(page, /document\.hidden/);
  assert.match(page, /RETURN TO LATEST/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /Sound and vibration remain off/);
  assert.equal((data.match(/id: 'seed-/g) ?? []).length, 4);
  assert.match(data, /Seeded milestones work without infrastructure/);
});

test('Buildcast API is curated, separately bound, authenticated for writes, and quiet without infrastructure', async () => {
  const [api, data] = await Promise.all([
    read('functions/api/buildcast.ts'),
    read('src/lib/pointcast-buildcast.ts'),
  ]);

  assert.match(api, /PC_BUILDCAST_KV\?: KVNamespace/);
  assert.match(api, /PC_BUILDCAST_TOKEN\?: string/);
  assert.match(api, /buildcast-writer-not-configured/);
  assert.match(api, /tokenMatches/);
  assert.match(api, /unknown-field/);
  assert.match(api, /invalid-or-sensitive-summary/);
  assert.match(api, /\\\/Users\\\//);
  assert.match(api, /EVENT_TTL_SECONDS = 30/);
  assert.match(api, /mode: 'seeded' \| 'read-only-edge' \| 'curated-edge'/);
  assert.doesNotMatch(api, /PC_PING_KV|api\/ping|action=list/);
  assert.match(data, /prompts or private model reasoning/);
  assert.match(data, /terminal output, stack traces, or full diffs/);
  assert.match(data, /email, inboxes, local paths, tokens, headers, or private URLs/);
});

test('Buildcast helper only emits explicit curated fields and defaults to a dry run without network writes', async () => {
  const script = new URL('../scripts/buildcast-event.mjs', import.meta.url);
  const { stdout } = await execFileAsync(process.execPath, [
    script.pathname,
    '--dry-run',
    '--agent', 'luna',
    '--type', 'test.passed',
    '--phase', 'playtest',
    '--status', 'passed',
    '--title', 'Pocket layout verified',
    '--summary', 'Studio and game modes remain usable at 390 pixels.',
  ]);
  const event = JSON.parse(stdout);
  assert.deepEqual(Object.keys(event), ['agent', 'type', 'phase', 'status', 'title', 'summary']);
  assert.equal(event.agent, 'luna');
  assert.equal(event.summary, 'Studio and game modes remain usable at 390 pixels.');
});

test('Open Studio is discoverable without pretending its writer bindings exist', async () => {
  const [apps, agents, sitemap, llms, llmsFull, wrangler] = await Promise.all([
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('wrangler.toml'),
  ]);
  assert.match(apps, /slug: 'haptic-dreams-open-studio'/);
  assert.match(agents, /hapticDreamsBuildcast/);
  assert.match(agents, /buildcast: 'https:\/\/pointcast\.xyz\/api\/buildcast\?project=haptic-dreams'/);
  assert.match(sitemap, /pointcast\.xyz\/haptic-dreams\/build/);
  assert.match(llms, /Public build data/);
  assert.match(llmsFull, /not a raw activity monitor/);
  assert.doesNotMatch(wrangler, /binding = "PC_BUILDCAST_KV"/);
});
