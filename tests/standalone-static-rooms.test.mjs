// /make/ and /home-next/ are hand-built static rooms with a strict CSP meta
// (script-src 'self'). The middleware must not inject its inline Tezos
// session bridge there: the browser refuses it and logs a CSP error.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isStandaloneStaticRoom } from '../src/lib/standalone-static-rooms.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');

test('make and home-next paths are standalone rooms; neighbours are not', () => {
  for (const p of ['/make', '/make/', '/make/sticker/', '/make/sticker', '/make/kit-b/kit-b.js', '/home-next', '/home-next/', '/home-next/index.html']) {
    assert.equal(isStandaloneStaticRoom(p), true, p);
  }
  for (const p of ['/', '/maker', '/makers/', '/make-room/', '/home', '/home-nextdoor/', '/b/make/', '', undefined]) {
    assert.equal(isStandaloneStaticRoom(p), false, String(p));
  }
});

test('middleware skips the session bridge for standalone rooms on both HTML paths', () => {
  const src = fs.readFileSync(path.join(ROOT, 'functions', '_middleware.ts'), 'utf8');
  assert.match(src, /import \{ isStandaloneStaticRoom \} from '\.\.\/src\/lib\/standalone-static-rooms\.mjs'/);
  assert.match(src, /isQuietUesStudyPath\(url\.pathname\) \|\| isStandaloneStaticRoom\(url\.pathname\)\s*\n\s*\? directoryResponse/);
  assert.match(src, /!isQuietUesStudyPath\(url\.pathname\) && !isStandaloneStaticRoom\(url\.pathname\)\s*\n\s*\? injectTezosSessionBridge\(response\)/);
});

test('the rooms that set a strict CSP really do forbid inline script', () => {
  const pages = ['public/make/index.html', 'public/make/sticker/index.html', 'public/make/guilloche/index.html'];
  for (const p of pages) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert.match(html, /http-equiv="Content-Security-Policy"[^>]*script-src 'self';/, p);
  }
});
