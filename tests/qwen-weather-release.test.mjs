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
    read('src/content/blocks/0493.json'),
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
  assert.equal(block.id, '0493');
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
    read('src/content/blocks/0493.json'),
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
