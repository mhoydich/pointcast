import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('Afterimage Relay accepts bounded Passport room slugs and exposes share, remix, and guarded mint routes', async () => {
  const [page, apps] = await Promise.all([
    readFile(new URL('src/pages/afterimage.astro', root), 'utf8'),
    readFile(new URL('src/lib/pointcast-apps.ts', root), 'utf8'),
  ]);

  assert.match(apps, /slug: 'afterimage'/);
  assert.match(page, /passportz\.xyz\/afterimage\/room/);
  assert.match(page, /\^\[a-z0-9\]\{8,16\}\$/);
  assert.match(page, /api\/afterimage\/room\/\$\{slug\}\/image/);
  assert.match(page, /api\/afterimage\/room\/\$\{slug\}\/audio/);
  assert.match(page, /MINT WITH KUKAI/);
  assert.match(page, /REMIX IMAGE/);
  assert.match(page, /SHARE RELAY/);
  assert.match(page, /nothing is minted automatically/i);
});
