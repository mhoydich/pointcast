import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Adventure Networks is present across the PointCast discovery contract', async () => {
  const [page, packet, apps, launch, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/adventure-networks.astro'),
    read('src/pages/adventure-networks.json.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/components/AppLaunchStrip.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  await access(new URL('src/assets/adventure-networks/og.png', root));
  assert.match(apps, /slug: 'adventure-networks'/);
  assert.match(apps, /https:\/\/adventure-networks-field-guide\.mhoydich\.chatgpt\.site/);
  assert.match(apps, /path: '\/adventure-networks'/);
  assert.match(launch, /ADVENTURE NETWORKS/);
  assert.match(page, /Go somewhere on purpose/);
  assert.match(page, /adventureNetworksCard/);
  assert.match(packet, /Markdown dispatch export/);
  assert.match(sitemap, /pointcast\.xyz\/adventure-networks\.json/);
  assert.match(llms, /Adventure Networks, a public Qwen-built field guide/);
  assert.match(llmsFull, /Adventure Networks Field Guide/);
});
