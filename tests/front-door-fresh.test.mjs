import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the PointCast front door is a focused live edition with stable discovery exits', async () => {
  const [home, layout] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/layouts/BlockLayout.astro'),
  ]);

  assert.match(home, /one live signal, three clear doors, four current stories, then channels/i);
  assert.match(home, /showNetworkStrip=\{false\}/);
  assert.match(layout, /showNetworkStrip\?: boolean/);
  assert.match(layout, /\{showNetworkStrip && <NetworkFirst100Strip\s*\/>\}/);

  assert.equal((home.match(/class="fresh-door /g) ?? []).length, 3);
  assert.match(home, /href="\/now"/);
  assert.match(home, /href="\/win95-games"/);
  assert.match(home, /href="\/network-el-segundo"/);

  const storySource = home.slice(home.indexOf('const stories'), home.indexOf('function prettyShipTime'));
  assert.equal((storySource.match(/href:\s*'\//g) ?? []).length, 4);
  assert.match(home, /CHANNEL_LIST\.map/);
  assert.match(home, /href="\/archive"/);
  assert.match(home, /href="\/press"/);
  assert.match(home, /href="\/blocks\.json"/);
  assert.match(home, /href="\/feed\.json"/);
  assert.match(home, /href="\/feed\.xml"/);
  assert.match(home, /href="\/agents\.json"/);
  assert.match(home, /href="\/for-agents"/);
});

test('the fresh front door is responsive, accessible, and motion-safe by construction', async () => {
  const [home, css] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/styles/front-door-fresh.css'),
  ]);

  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
  assert.match(home, /aria-labelledby="fresh-hero-title"/);
  assert.match(home, /aria-label="PointCast channels"/);
  assert.match(home, /alt=\{heroSignals\[0\]\.alt\}/);
  assert.match(home, /image\.alt = next\.alt/);
  assert.match(home, /timeZone: 'America\/Los_Angeles'/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.fresh-home :focus-visible/);
});
