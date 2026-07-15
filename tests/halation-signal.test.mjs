import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Halation bridge federates the public JSON Feed with cache and CORS', async () => {
  const [bridge, model] = await Promise.all([
    read('functions/api/halation.ts'),
    read('src/lib/halation.ts'),
  ]);

  assert.match(model, /halation-diary\.mhoydich\.chatgpt\.site/);
  assert.match(model, /HALATION_ORIGIN\}\/feed\.json/);
  assert.match(model, /published — not minted/);
  assert.match(bridge, /fetchHalationSignal/);
  assert.match(bridge, /Access-Control-Allow-Origin/);
  assert.match(bridge, /stale-while-revalidate=300/);
  assert.match(bridge, /pageIsPrimary: true/);
  assert.match(bridge, /mintIsOptional: true/);
});

test('Halation station keeps page, source, and receipt rails distinct', async () => {
  const page = await read('src/pages/halation.astro');

  assert.match(page, /The page is enough\./);
  assert.match(page, /The receipt is optional\./);
  assert.match(page, /01<\/b> page/);
  assert.match(page, /02<\/b> source/);
  assert.match(page, /03<\/b> receipt/);
  assert.match(page, /fetch\('\/api\/halation'/);
  assert.match(page, /data-exposure-dial/);
  assert.match(page, /prefers-reduced-motion/);
});

test('Halation is discoverable from the home, apps, Passport, and agent manifest', async () => {
  const [home, apps, passport, agents] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/passport.astro'),
    read('src/pages/agents.json.ts'),
  ]);

  assert.match(home, /<HalationLightLeak signal=\{halationSignal\}/);
  assert.match(apps, /slug: 'halation-signal-station'/);
  assert.match(passport, /href="\/halation"/);
  assert.match(agents, /halation: 'https:\/\/pointcast\.xyz\/halation'/);
  assert.match(agents, /halation: 'https:\/\/pointcast\.xyz\/api\/halation'/);
});
