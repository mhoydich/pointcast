// Each PMM and Nouns Messenger worker records DIGEST, a hash of the files it precaches. When a
// precached file changes, update DIGEST (the failure prints the value). That one-line change alters
// sw.js, so browsers reinstall the worker and re-precache every file on their next visit, on top of
// the background refresh stale-while-revalidate already does. VERSION stays as it is: bump it only
// when FILES changes shape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const PUBLIC = resolve(import.meta.dirname, '../public');

export function digestOf(src) {
  const files = [...(/const FILES = \[([^\]]*)\]/.exec(src)?.[1] || '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const h = createHash('sha256');
  for (const f of files) {
    h.update(f + '\0');
    h.update(readFileSync(resolve(PUBLIC, '.' + (f.endsWith('/') ? f + 'index.html' : f))));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}

for (const app of ['pmm', 'nouns-messenger']) {
  test(`${app}: DIGEST matches the precached files`, () => {
    const src = readFileSync(resolve(PUBLIC, app, 'sw.js'), 'utf8');
    const want = digestOf(src);
    const have = /const DIGEST = '([^']+)'/.exec(src)?.[1];
    assert.equal(have, want, `public/${app}/sw.js: a precached file changed. Set DIGEST to '${want}' (no VERSION bump needed).`);
  });
}
