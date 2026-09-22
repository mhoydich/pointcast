import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';

const root = new URL('../', import.meta.url);
const registryPath = new URL('src/lib/open-ad-network.ts', root).pathname;

async function loadSelector() {
  const build = await esbuild.build({
    entryPoints: [registryPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    write: false,
    plugins: [{
      name: 'mock-static-campaign-assets',
      setup(builder) {
        builder.onResolve({ filter: /\.(?:webp|png|jpe?g)$/i }, (args) => ({ path: args.path, namespace: 'asset' }));
        builder.onLoad({ filter: /.*/, namespace: 'asset' }, () => ({
          contents: 'export default { src: "/test-campaign-asset" };',
          loader: 'js',
        }));
      },
    }],
  });
  const directory = await mkdtemp(join(tmpdir(), 'pointcast-open-ad-selector-'));
  const modulePath = join(directory, 'registry.mjs');
  await writeFile(modulePath, build.outputFiles[0].text);
  try {
    return await import(`${pathToFileURL(modulePath).href}?${Date.now()}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('Nouns Drum Club campaign is inside the normal native rail count on Nouns and music paths only', async () => {
  const { selectAdsForPath, POINTCAST_ADS } = await loadSelector();
  const campaign = 'PC-NOUNS-EVERYBODY-2026';

  for (const ad of POINTCAST_ADS.filter(ad => ad.campaign === campaign)) {
    assert.equal(ad.seriesIndex, undefined, 'Nouns image ads must not render unrelated six-part Drum Compendium art');
  }

  for (const path of ['/nouns/', '/station/party/', '/now']) {
    const normalRail = selectAdsForPath(path, 3);
    const compactRail = selectAdsForPath(path, 2);
    assert.ok(normalRail.some((ad) => ad.campaign === campaign), `${path} normal rail omitted Drum Club`);
    assert.ok(compactRail.some((ad) => ad.campaign === campaign), `${path} compact rail omitted Drum Club`);
  }

  assert.ok(
    !selectAdsForPath('/nouns/drum-club/', 3).some((ad) => ad.campaign === campaign),
    'the canonical Drum Club route must not advertise itself',
  );
});
