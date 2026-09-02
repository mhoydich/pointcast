import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('the visible strip is six live stamps and workbench keeps 04/05 reachable', async () => {
  const [footer, kit] = await Promise.all([read('src/components/FooterBar.astro'), read('src/data/dock-kit.ts')]);
  assert.match(footer, /STRIP_DOCK_KIT\.map/);
  assert.match(footer, /WORKBENCH · COMING/);
  assert.match(footer, /Number\(item\.number\) === Number\(e\.key\)/, 'shortcuts follow stable stamp numbers, not visible array indexes');
  assert.match(kit, /id: 'fed'[\s\S]*?placement: 'workbench'[\s\S]*?status: 'coming'/);
  assert.match(kit, /id: 'broadcast'[\s\S]*?placement: 'workbench'[\s\S]*?status: 'coming'/);
});

test('CursorRoom waits for the server id before logging a connected local chat', async () => {
  const source = await read('src/components/CursorRoom.astro');
  assert.match(source, /entry\.id \? \('id:' \+ entry\.id\)/);
  assert.match(source, /if \(state\.wsState === 'open' && state\.ws\) \{[\s\S]*?state\.ws\.send[\s\S]*?\} else \{[\s\S]*?pushLocalLogEntry\(entry\)/);
  assert.doesNotMatch(source, /pushLocalLogEntry\(entry\);\s*renderLog\(\);\s*\/\/ Forward to server/);
});

test('only explicit CAST bursts depend on ROOM while caused utility bursts still post', async () => {
  const source = await read('src/components/CursorRoom.astro');
  assert.match(source, /function postBurst\(detail\) \{\s*if \(!detail \|\| !detail\.kind\) return/);
  assert.match(source, /pc:spell:cast[\s\S]*?if \(!state\.on\) return;[\s\S]*?detail\.source !== 'magic-word'/);
});

test('idle controls gate tug polling and seismo animation', async () => {
  const [tug, footer] = await Promise.all([read('src/components/TugRope.astro'), read('src/components/FooterBar.astro')]);
  assert.match(tug, /IntersectionObserver/);
  assert.match(tug, /HIDDEN_POLL_MS = 30000/);
  assert.match(tug, /if \(!inViewport\) return/);
  assert.match(footer, /if \(document\.hidden\) \{ sgRunning = false; return; \}/);
});

test('dock analytics are full-weight non-pageview events and the scorer registers /dock', async () => {
  const [ticker, analytics, live, scorer] = await Promise.all([
    read('src/components/DockBurstTicker.astro'), read('functions/api/analytics.ts'),
    read('scripts/score-live.mjs'), read('scripts/score-projects.mjs'),
  ]);
  for (const action of ['tray_open', 'stamp_action', 'burst_seen', 'say_sent']) assert.match(ticker, new RegExp(action));
  assert.match(ticker, /track\('dock'/);
  assert.match(analytics, /const isPageview = event === 'pageview'/);
  assert.match(live, /record\?\.event === 'dock'/);
  assert.match(scorer, /\['\/dock','PointCast Dock'\]/);
});

test('FooterBar inline JS stays at or below the measured baseline', async () => {
  const source = await read('src/components/FooterBar.astro');
  const scripts = [...source.matchAll(/<script\b[^>]*is:inline[^>]*>([\s\S]*?)<\/script>/g)];
  const bytes = scripts.reduce((sum, match) => sum + Buffer.byteLength(match[1]), 0);
  assert.ok(bytes <= 74_369, `FooterBar inline JS grew: ${bytes} > 74369`);
});

test('mint bursts require an applied Kennel Club mint returned by TzKT', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { verifyKennelMint } = await server.ssrLoadModule('/functions/api/burst.ts');
    const opHash = `o${'1'.repeat(50)}`;
    const applied = await verifyKennelMint(opHash, async () => Response.json([{
      status: 'applied',
      sender: { address: 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw' },
      target: { address: 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq' },
      parameter: { entrypoint: 'mint' },
    }]));
    assert.equal(applied.ok, true);
    const wrongTarget = await verifyKennelMint(opHash, async () => Response.json([{
      status: 'applied', target: { address: 'KT1wrong' }, parameter: { entrypoint: 'mint' },
    }]));
    assert.equal(wrongTarget.ok, false);
  } finally {
    await server.close();
  }
});
