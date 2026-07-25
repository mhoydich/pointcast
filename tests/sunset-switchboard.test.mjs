import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Sunset Switchboard is a native, mobile PointCast instrument with a complete discovery contract', async () => {
  const [page, packet, imageEndpoint, blockImageEndpoint, blockSource, apps, home, homeModule, appLaunch, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/sunset-switchboard.astro'),
    read('src/pages/sunset-switchboard.json.ts'),
    read('src/pages/images/sunset-switchboard/og.png.ts'),
    read('src/pages/images/og/b/0487.png.ts'),
    read('src/content/blocks/0487.json'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/index.astro'),
    read('src/components/SunsetSwitchboardHome.astro'),
    read('src/components/AppLaunchStrip.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  const block = JSON.parse(blockSource);

  await access(new URL('src/assets/sunset-switchboard/og.png', root));
  await access(new URL('public/images/sunset-switchboard/og.png', root));
  assert.match(page, /Sunset Switchboard — Route One Good Signal/);
  assert.match(page, /data-weather/);
  assert.match(page, /data-band/);
  assert.match(page, /data-reach/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /canvas\.width = 1200/);
  assert.match(page, /localStorage/);
  assert.match(page, /@media \(max-width: 600px\)/);
  assert.match(packet, /telemetryAddedForThisInstrument: false/);
  assert.match(packet, /serverStorage: false/);
  assert.match(imageEndpoint, /Content-Type': 'image\/png/);
  assert.match(imageEndpoint, /public\/images\/sunset-switchboard\/og\.png/);
  assert.match(blockImageEndpoint, /public\/images\/og\/b\/0487\.png/);
  assert.equal(block.id, '0487');
  assert.equal(block.external.url, 'https://pointcast.xyz/sunset-switchboard');
  assert.match(apps, /slug: 'sunset-switchboard'/);
  assert.match(home, /href:\s*'\/sunset-switchboard'/);
  assert.match(home, /Route one good signal before dark\./);
  assert.match(homeModule, /OPEN THE SWITCHBOARD/);
  assert.match(appLaunch, /SUNSET SWITCHBOARD/);
  assert.match(sitemap, /pointcast\.xyz\/sunset-switchboard\.json/);
  assert.match(llms, /Sunset Switchboard/);
  assert.match(llmsFull, /Sunset Switchboard/);
});
