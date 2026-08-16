import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Signal Run is a bounded, local player-fidelity game over the existing archival sequence', async () => {
  const [model, page, source, exhibition] = await Promise.all([
    read('src/lib/pointcast-haptic-dreams-signal-run.ts'),
    read('src/pages/haptic-dreams/play.astro'),
    read('src/lib/pointcast-haptic-dreams.ts'),
    read('src/pages/haptic-dreams.astro'),
  ]);

  assert.match(model, /SIGNAL_RUN_DURATION_SECONDS = 180/);
  assert.equal((model.match(/windowMs: 10000/g) ?? []).length, 11);
  assert.match(model, /type SignalAction = 'advance' \| 'arc' \| 'reverse' \| 'chorus' \| 'settle'/);
  assert.match(model, /evaluateSignal/);
  assert.match(model, /SIGNAL_RUN_STORAGE_KEY/);
  assert.match(page, /HAPTIC_DREAMS_PLAYS\.map/);
  assert.match(page, /localStorage/);
  assert.match(page, /setPointerCapture/);
  assert.match(page, /const play = activePlay\(\);[\s\S]{0,120}if \(!play\) \{ pointer = null; tapAt = 0; return; \}/);
  assert.match(page, /pointer = null;[\s\S]{0,30}tapAt = 0;[\s\S]{0,80}const play = activePlay\(\)/);
  assert.doesNotMatch(page, /activePlay\(\)\.team/);
  assert.match(page, /window\.addEventListener\('keydown'/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /soundOn = false/);
  assert.match(page, /vibrationOn = false/);
  assert.match(page, /The historical record is locked/);
  assert.match(page, /MICHIGAN 13 · OHIO STATE 10/);
  assert.match(exhibition, /href="\/haptic-dreams\/play"/);
  assert.equal((source.match(/world: \{ possession:/g) ?? []).length, 18);
});

test('Signal Run has no live, ranked, wallet, or alternate-score surface', async () => {
  const page = await read('src/pages/haptic-dreams/play.astro');

  assert.doesNotMatch(page, /wallet|token|NFT|leaderboard|ranking/i);
  assert.match(page, /not a live score feed/);
  assert.match(page, /cannot alter the recorded game/);
  assert.match(page, /HAPTIC_DREAMS_SOURCES/);
});

test('Signal Run is present across PointCast machine discovery', async () => {
  const [agents, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const surface of [agents, sitemap, llms, llmsFull]) {
    assert.match(surface, /haptic-dreams\/play/);
  }
  assert.match(agents, /hapticDreamsSignalRun/);
});
