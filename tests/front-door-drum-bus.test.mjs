import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// 2026-09-01: the front-door Rosebud pads and the full garden at /rosebud count in the drum house.
// Every hand hit batches a delta to POST /api/drum and rides the shared /api/sounds bus, the way
// DrumModule and HomeBeatDesk already do. The page fetches GET /api/drum once (index.astro) and
// broadcasts pc:drum; the pads never fetch it on load.

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const POST_DRUM = /fetch\('\/api\/drum',\s*\{\s*method: 'POST'/;
const POST_SOUNDS = /fetch\('\/api\/sounds',\s*\{\s*method: 'POST'/;

for (const file of ['src/components/HomePlayFirst.astro', 'src/pages/rosebud.astro']) {
  test(`${file} counts pad hits in the drum house and rides the sounds bus`, async () => {
    const src = await read(file);
    // Same drummer as /drum + DrumModule (src/lib/chimes.ts SESSION_KEY).
    assert.match(src, /'pc:reactSessionId'/);
    // Batched delta, the drum.ts contract: { delta, sessionId }, ten hits or five seconds, keepalive, requeue on failure.
    assert.match(src, POST_DRUM);
    assert.match(src, /JSON\.stringify\(\{ delta, sessionId \}\)/);
    assert.match(src, /pendingDelta >= 10/);
    assert.match(src, /setTimeout\(flushDelta, 5000\)/);
    assert.match(src, /keepalive: true/);
    assert.match(src, /catch \{\s*pendingDelta \+= delta;/);
    assert.match(src, /navigator\.sendBeacon\('\/api\/drum'/);
    // Shared sounds bus, the body HomeBeatDesk sends, throttled and best effort.
    assert.match(src, POST_SOUNDS);
    assert.match(src, /JSON\.stringify\(\{ type: 'drum', seed: padOrder\.indexOf\(drum\), sessionId \}\)/);
    assert.match(src, /lastBroadcast < 900/);
    assert.match(src, /\}\)\.catch\(\(\) => \{\}\);/);
  });
}

test('HomePlayFirst only POSTs to /api/drum; index.astro is the one GET and pc:drum broadcast', async () => {
  const [play, home] = await Promise.all([
    read('src/components/HomePlayFirst.astro'),
    read('src/pages/index.astro'),
  ]);
  const all = play.match(/fetch\(['"`]\/api\/drum/g) ?? [];
  const posts = play.match(/fetch\('\/api\/drum',\s*\{\s*method: 'POST'/g) ?? [];
  assert.ok(all.length >= 1, 'HomePlayFirst posts to /api/drum');
  assert.equal(all.length, posts.length, 'every /api/drum fetch in HomePlayFirst is a POST, none on load');
  assert.doesNotMatch(play, /fetch\(`\/api\/drum\?/);
  assert.match(play, /addEventListener\('pc:drum'/);
  assert.equal((home.match(/fetch\('\/api\/drum'/g) ?? []).length, 1, 'index.astro fetches /api/drum exactly once');
  // POST answers { ok, globalTotal, yourTotal }; the new total goes out on pc:drum so every counter on the page agrees.
  assert.match(play, /typeof data\.globalTotal === 'number'\) document\.dispatchEvent\(new CustomEvent\('pc:drum', \{ detail: data \}\)\)/);
  // Honest counters: the local line says the hits count, the global line stays.
  assert.match(play, /<b data-hit-count>000<\/b> hits this visit · they count in the drum house/);
  assert.match(play, /<b data-drum-global>/);
  assert.doesNotMatch(play, /yours, resets when you leave/);
});

test('Rosebud counts hand hits only; sequencer playback stays local', async () => {
  const room = await read('src/pages/rosebud.astro');
  assert.match(room, /const strike = \(drum\) => \{\s*hit\(drum\);\s*queueDrum\(\);\s*broadcast\(drum\);\s*\}/);
  assert.match(room, /if \(row\[currentStep\]\) hit\(padIds\[rowIndex\]\);/, 'the 16-step clock plays hit(), not strike()');
  assert.match(room, /addEventListener\('pointerdown', \(\) => strike\(button\.dataset\.drum\)\)/);
  assert.match(room, /if \(drum\) strike\(drum\);/);
  assert.match(room, /<span data-hit-count>000<\/span> blooms sent · pad hits count in the drum house/);
});
