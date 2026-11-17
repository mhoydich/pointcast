import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const origin = 'https://pointcast.xyz';
const assetPaths = {
  phone: ['phone.css', 'screen.mjs'],
  call: ['call.css', 'call.mjs'],
  morning: ['view.mjs'],
};

for (const [page, files] of Object.entries(assetPaths)) {
  test(`Loom ${page} loads its assets with either route spelling`, () => {
    const path = `/loom/${page}`;
    const html = readFileSync(new URL(`../public${path}/index.html`, import.meta.url), 'utf8');
    const assets = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|mjs))"/g)].map((match) => match[1]);
    for (const suffix of ['', '/']) {
      const urls = assets.map((asset) => new URL(asset, `${origin}${path}${suffix}`).href);
      assert.deepEqual(urls, files.map((file) => `${origin}${path}/${file}`));
    }
  });
}
