import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// Copy checks for the launchpad case study grow with each PR. This PR ships the library only, so only purity is checked.
const LIB = new URL('../src/lib/launchpad/', import.meta.url);
const IMPURE = [/\bfetch\s*\(/, /WebSocket/, /XMLHttpRequest/, /Date\.now/, /new Date\(/, /Math\.random/, /localStorage/, /sessionStorage/];

test('src/lib/launchpad is pure: no network, clock, storage or unseeded randomness', () => {
  const files = readdirSync(LIB).filter((f) => f.endsWith('.mjs'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = readFileSync(new URL(file, LIB), 'utf8');
    for (const banned of IMPURE) assert.doesNotMatch(src, banned, `${file} avoids ${banned}`);
  }
});
