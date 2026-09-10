import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('/me is a private session view with a signed-out door and no visitor wallet fallback', async () => {
  const page = await read('src/pages/me.astro');
  assert.match(page, /getSession\(\)/);
  assert.match(page, /fetch\('\/api\/me\/holdings'/);
  assert.match(page, /data-me-signed-out/);
  assert.match(page, /<AuthMenu autoOpen=\{true\}/);
  assert.match(page, /Nothing on this page falls back to another person’s wallet/);
  assert.doesNotMatch(page, /tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/);
});

test('/me follows the ClientRouter DOM contract and keeps the utility rows', async () => {
  const page = await read('src/pages/me.astro');
  assert.doesNotMatch(page, /<[^>]+\sid=/, 'the new profile surface must not use element ids');
  assert.match(page, /document\.addEventListener\('click'/);
  assert.match(page, /__pointCastMeAbort/);
  assert.match(page, /astro:page-load/);
  assert.match(page, /pc:visitor:noun/);
  assert.match(page, /href="\/passport"/);
  assert.match(page, /href="\/townsfolk"/);
  assert.match(page, /Signal Pup/);
  assert.match(page, /name="holdings"/);
  assert.match(page, /location\.hash === '#holdings'/);
  assert.match(page, /scrollIntoView/);
});

test('legacy profile surfaces are permanent redirects to /me', async () => {
  const [redirects, middleware] = await Promise.all([
    read('public/_redirects'),
    read('functions/_middleware.ts'),
  ]);
  assert.match(redirects, /\/profile\s+\/me\s+301/);
  assert.match(redirects, /\/minted\s+\/me#holdings\s+301/);
  assert.match(redirects, /\/dashboard\s+\/me\s+301/);
  assert.match(middleware, /\['\/profile', '\/me'\]/);
  assert.match(middleware, /\['\/minted', '\/me#holdings'\]/);
  assert.match(middleware, /\['\/dashboard', '\/me'\]/);
});

test('profile entry points use /me and generic visitor collection links are retired', async () => {
  const [footer, dock, walletChip, here, constellation] = await Promise.all([
    read('src/components/FooterBar.astro'),
    read('src/components/DockLauncher.astro'),
    read('src/components/WalletChip.astro'),
    read('src/components/VisitorHereStrip.astro'),
    read('src/components/HomeConstellation.astro'),
  ]);
  for (const source of [footer, dock, walletChip, here, constellation]) {
    assert.doesNotMatch(source, /href="\/profile"|href="\/minted"|href="\/dashboard"/);
    assert.doesNotMatch(source, /href="\/collection"/);
  }
  assert.match(footer, /href="\/me">View profile/);
  assert.match(dock, /href="\/me"[^>]*data-dock-title="Profile"/);
});


test('both legacy login URLs redirect before rewriting and preserve the auth query', async (t) => {
  const redirects = (await read('public/_redirects')).split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => line.trim().split(/\s+/));
  for (const path of ['/login', '/login/']) {
    assert.deepEqual(redirects.filter(([from]) => from === path), [[path, '/auth', '301']]);
  }
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  t.after(() => server.close());
  const { onRequest } = await server.ssrLoadModule('/functions/_middleware.ts');
  t.mock.method(globalThis, 'fetch', () => { throw new Error('login must redirect before fetching a directory'); });
  const query = '?returnTo=%2Fme%3Fpanel%3Dconnections%23my-ai&source=old+link&source=again';
  for (const path of ['/login', '/login/']) {
    for (const method of ['GET', 'HEAD']) {
      for (const search of ['', query, '?returnTo=https%3A%2F%2Fexample.invalid%2F']) {
        const response = await onRequest({
          request: new Request(`https://pointcast.xyz${path}${search}`, { method }),
          env: {},
          next: () => { throw new Error('login must redirect before static routing'); },
          waitUntil: () => { throw new Error('login must redirect before visit logging'); },
        });
        assert.equal(response.status, 301);
        assert.equal(response.headers.get('location'), `https://pointcast.xyz/auth${search}`);
      }
    }
  }
  // Existing profile aliases retain their destinations and fragment behavior.
  for (const [path, target] of [['/profile', '/me'], ['/profile/', '/me'], ['/minted', '/me#holdings'],
    ['/minted/', '/me#holdings'], ['/dashboard', '/me'], ['/dashboard/', '/me']]) {
    const response = await onRequest({
      request: new Request(`https://pointcast.xyz${path}?old=1`), env: {},
      next: () => { throw new Error('profile alias must redirect'); }, waitUntil: () => {},
    });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `https://pointcast.xyz${target}`);
  }
});
