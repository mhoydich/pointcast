import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Sound Garden is discoverable through the app registry, machine surfaces, and sitemap', async () => {
  const [page, packet, apps, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/sound-garden.astro'),
    read('src/pages/sound-garden.json.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  await access(new URL('src/assets/sound-garden/og.png', root));
  assert.match(apps, /slug: 'sound-garden'/);
  assert.match(apps, /https:\/\/sound-garden-001\.mhoydich\.chatgpt\.site/);
  assert.match(page, /OPEN SOUND GARDEN/);
  assert.match(page, /Stable core/);
  assert.match(page, /does not listen through your microphone/i);
  assert.match(packet, /externalModelCalls: false/);
  assert.match(packet, /Access-Control-Allow-Origin/);
  assert.match(sitemap, /pointcast\.xyz\/sound-garden\.json/);
  assert.match(llms, /Sound Garden 001, a public generative browser instrument/);
  assert.match(llmsFull, /Sound Garden 001/);
});
