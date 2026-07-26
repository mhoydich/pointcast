import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const fileStat = (path) => stat(new URL(path, root));

test('Qwen Weather ships as a native human, machine, Block, homepage, and ad release', async () => {
  const [page, jsonRoute, blockText, home, ads, video, poster, still] = await Promise.all([
    read('src/pages/qwen-weather.astro'),
    read('src/pages/qwen-weather.json.ts'),
    read('src/content/blocks/0494.json'),
    read('src/pages/index.astro'),
    read('src/lib/open-ad-network.ts'),
    fileStat('public/images/qwen-weather/weather-memory.mp4'),
    fileStat('public/images/qwen-weather/qwen-weather-og.png'),
    fileStat('public/images/qwen-weather/weather-organism.jpg'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /https:\/\/pointcast\.xyz\/qwen-weather/);
  assert.match(page, /Qwen 3\.8 Max/);
  assert.match(page, /GLM-5\.2/);
  assert.match(page, /Wan 2\.7 Image Pro/);
  assert.match(page, /HappyHorse 1\.1/);
  assert.match(page, /data-sound-button/);
  assert.match(page, /prefers-reduced-motion: reduce/);
  assert.match(jsonRoute, /pointcast\.model-study\/v1/);
  assert.equal(block.id, '0494');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'WATCH');
  assert.equal(block.meta.provider, 'QwenCloud');
  assert.equal(block.meta.models.length, 4);
  assert.match(home, /fresh-qwen-feature/);
  assert.match(home, /One forecast\.<br \/>Four model minds\./);
  assert.match(ads, /PC-QWEN-WEATHER-2026/);
  assert.match(ads, /PC-QWEN-WEATHER-001/);
  assert.ok(video.size > 1_000_000);
  assert.ok(poster.size > 100_000);
  assert.ok(still.size > 100_000);
});

test('Qwen Weather keeps credentials and live inference outside PointCast', async () => {
  const [page, jsonRoute, block, ads, videoRoute, posterRoute, stillRoute] = await Promise.all([
    read('src/pages/qwen-weather.astro'),
    read('src/pages/qwen-weather.json.ts'),
    read('src/content/blocks/0494.json'),
    read('src/lib/open-ad-network.ts'),
    read('src/pages/images/qwen-weather/weather-memory.mp4.ts'),
    read('src/pages/images/qwen-weather/qwen-weather-og.png.ts'),
    read('src/pages/images/qwen-weather/weather-organism.jpg.ts'),
  ]);
  const publicSurface = [page, jsonRoute, block, ads].join('\n');

  assert.doesNotMatch(publicSurface, /sk-sp-[A-Za-z0-9_-]+/);
  assert.doesNotMatch(publicSurface, /QWEN_TOKEN_PLAN_KEY/);
  assert.doesNotMatch(publicSurface, /token-plan\.ap-southeast-1\.maas\.aliyuncs\.com/);
  assert.match(publicSurface, /pre-rendered/i);
  assert.match(publicSurface, /no (?:QwenCloud )?(?:credential|token|private token)/i);
  assert.match(videoRoute, /Content-Type': 'video\/mp4/);
  assert.match(videoRoute, /Accept-Ranges': 'bytes/);
  assert.match(posterRoute, /Content-Type': 'image\/png/);
  assert.match(stillRoute, /Content-Type': 'image\/jpeg/);
});

test('Qwen Silver Letter ships as a regional human, machine, homepage, and discovery study', async () => {
  const [page, jsonRoute, home, llms, llmsFull, sitemap, imageRoute, poster] =
    await Promise.all([
      read('src/pages/qwen-silver-letter.astro'),
      read('src/pages/qwen-silver-letter.json.ts'),
      read('src/pages/index.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/images/qwen-silver-letter/og.png.ts'),
      fileStat('public/images/qwen-silver-letter/og.png'),
    ]);

  assert.match(page, /银信气象台/);
  assert.match(page, /Kaiping/);
  assert.match(page, /Qwen does not speak for the community/);
  assert.equal((page.match(/{ key: '[^']+'/g) ?? []).length, 4);
  assert.match(jsonRoute, /PC-QWEN-SILVER-LETTER-2026/);
  assert.match(jsonRoute, /staged_pending_current_plan_entitlement/);
  assert.match(home, /fresh-qwen-followup/);
  assert.match(home, /QWEN MODEL STUDY 002/);
  assert.match(llms, /pointcast\.xyz\/qwen-silver-letter/);
  assert.match(llmsFull, /Qwen model-study series/);
  assert.match(sitemap, /pointcast\.xyz\/qwen-silver-letter/);
  assert.match(imageRoute, /Content-Type': 'image\/png/);
  assert.ok(poster.size > 100_000);
});

test('Qwen Silver Letter keeps its PointCast edition local and its model boundary explicit', async () => {
  const [page, jsonRoute] = await Promise.all([
    read('src/pages/qwen-silver-letter.astro'),
    read('src/pages/qwen-silver-letter.json.ts'),
  ]);
  const publicSurface = `${page}\n${jsonRoute}`;

  assert.doesNotMatch(publicSurface, /QWEN_TOKEN_PLAN_KEY|DASHSCOPE_API_KEY/);
  assert.doesNotMatch(publicSurface, /token-plan\.ap-southeast-1\.maas\.aliyuncs\.com/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(page, /PointCast edition stays on this device/);
  assert.match(jsonRoute, /storedIdentity: false/);
  assert.match(jsonRoute, /storedLocation: false/);
  assert.match(jsonRoute, /workspaceAccess: 'owner-only'/);
});

test('Qwen Good Intelligence ships as a human, machine, homepage, and discovery study', async () => {
  const [page, jsonRoute, home, llms, llmsFull, sitemap, imageRoute, poster] =
    await Promise.all([
      read('src/pages/qwen-good-intelligence.astro'),
      read('src/pages/qwen-good-intelligence.json.ts'),
      read('src/pages/index.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/images/qwen-good-intelligence/og.png.ts'),
      fileStat('public/images/qwen-good-intelligence/og.png'),
    ]);

  assert.match(page, /善智调度局/);
  assert.match(page, /Qwen Model Study 003/);
  assert.match(page, /Intelligence for good does not score people\./);
  assert.equal((page.match(/data-need=\{need\.id\}/g) ?? []).length, 1);
  assert.equal((page.match(/data-capacity=\{capacity\.id\}/g) ?? []).length, 1);
  assert.match(page, /needs\.flatMap/);
  assert.match(jsonRoute, /PC-QWEN-GOOD-INTELLIGENCE-2026/);
  assert.match(jsonRoute, /staged_pending_current_plan_entitlement/);
  assert.match(home, /QWEN MODEL STUDY 003/);
  assert.match(home, /fresh-qwen-followup--good/);
  assert.match(llms, /pointcast\.xyz\/qwen-good-intelligence/);
  assert.match(llmsFull, /Good Intelligence Dispatch/);
  assert.match(sitemap, /pointcast\.xyz\/qwen-good-intelligence/);
  assert.match(imageRoute, /Content-Type': 'image\/png/);
  assert.ok(poster.size > 100_000);
});

test('Qwen Good Intelligence is local, bounded, and makes no automated decision', async () => {
  const [page, jsonRoute] = await Promise.all([
    read('src/pages/qwen-good-intelligence.astro'),
    read('src/pages/qwen-good-intelligence.json.ts'),
  ]);
  const publicSurface = `${page}\n${jsonRoute}`;

  assert.doesNotMatch(publicSurface, /QWEN_TOKEN_PLAN_KEY|DASHSCOPE_API_KEY/);
  assert.doesNotMatch(publicSurface, /token-plan\.ap-southeast-1\.maas\.aliyuncs\.com/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(page, /NOTHING LEAVES THIS DEVICE/);
  assert.match(page, /It may not decide who deserves help\./);
  assert.match(jsonRoute, /storedIdentity: false/);
  assert.match(jsonRoute, /storedLocation: false/);
  assert.match(jsonRoute, /automatedDecision: false/);
  assert.match(jsonRoute, /workspaceAccess: 'owner-only'/);
});

test('Qwen Tan River ships as a human, machine, homepage, and discovery study', async () => {
  const [page, jsonRoute, home, llms, llmsFull, sitemap, imageRoute, poster] =
    await Promise.all([
      read('src/pages/qwen-tan-river.astro'),
      read('src/pages/qwen-tan-river.json.ts'),
      read('src/pages/index.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/images/qwen-tan-river/og.png.ts'),
      fileStat('public/images/qwen-tan-river/og.png'),
    ]);

  assert.match(page, /潭江记忆潮汐/);
  assert.match(page, /Qwen Model Study 004/);
  assert.match(page, /This map remembers\. It does not predict\./);
  assert.match(page, /雨水浸透了银信，墨迹沿潭江散开/);
  assert.equal((page.match(/data-tide=\{tide\.id\}/g) ?? []).length, 1);
  assert.match(jsonRoute, /PC-QWEN-TAN-RIVER-2026/);
  assert.match(jsonRoute, /completed_via_qwen_token_plan_2026_07_26/);
  assert.match(home, /QWEN MODEL STUDY 004/);
  assert.match(home, /fresh-qwen-followup--tide/);
  assert.match(llms, /pointcast\.xyz\/qwen-tan-river/);
  assert.match(llmsFull, /Tan River Memory Tides/);
  assert.match(sitemap, /pointcast\.xyz\/qwen-tan-river/);
  assert.match(imageRoute, /Content-Type': 'image\/png/);
  assert.ok(poster.size > 100_000);
});

test('Qwen Tan River is device-local and explicitly not a warning system', async () => {
  const [page, jsonRoute] = await Promise.all([
    read('src/pages/qwen-tan-river.astro'),
    read('src/pages/qwen-tan-river.json.ts'),
  ]);
  const publicSurface = `${page}\n${jsonRoute}`;

  assert.doesNotMatch(publicSurface, /QWEN_TOKEN_PLAN_KEY|DASHSCOPE_API_KEY/);
  assert.doesNotMatch(publicSurface, /token-plan\.ap-southeast-1\.maas\.aliyuncs\.com/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(page, /This PointCast edition stays on this device/);
  assert.match(page, /Not a flood-warning system\./);
  assert.match(page, /Qwen-authored poetic seeds/);
  assert.match(jsonRoute, /storedIdentity: false/);
  assert.match(jsonRoute, /storedVoice: false/);
  assert.match(jsonRoute, /storedLocation: false/);
  assert.match(jsonRoute, /workspaceAccess: 'owner-only'/);
});
