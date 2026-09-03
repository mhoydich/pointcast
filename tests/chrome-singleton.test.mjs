import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const pagesRoot = join(repoRoot, 'src/pages');
const layoutsRoot = join(repoRoot, 'src/layouts');
const componentsRoot = join(repoRoot, 'src/components');

function filesUnder(root, extension = '.astro') {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...filesUnder(path, extension));
    else if (extname(entry.name) === extension) files.push(path);
  }
  return files;
}

function occurrences(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test('pages cannot import the retired BaseLayout or PeerCursors stack', () => {
  const offenders = [];
  for (const path of filesUnder(pagesRoot)) {
    const source = readFileSync(path, 'utf8');
    if (/^import\s+.+\s+from\s+['"][^'"]*(?:BaseLayout|PeerCursors)\.astro['"];?/m.test(source)) {
      offenders.push(path.slice(repoRoot.length + 1));
    }
  }
  assert.deepEqual(offenders, []);
  assert.equal(existsSync(join(layoutsRoot, 'BaseLayout.astro')), false);
  assert.equal(existsSync(join(componentsRoot, 'PeerCursors.astro')), false);
});

test('BlockLayout is the only owner of the dock, room client, burst layer, and tug chrome', () => {
  const blockPath = join(layoutsRoot, 'BlockLayout.astro');
  const block = readFileSync(blockPath, 'utf8');
  const chrome = ['FooterBar', 'CursorRoom', 'SpellLayer', 'TugRope'];

  for (const component of chrome) {
    assert.equal(occurrences(block, new RegExp(`<${component}\\b`, 'g')), 1, `${component} must mount exactly once`);
  }

  const otherRoots = [pagesRoot, layoutsRoot];
  const offenders = [];
  for (const root of otherRoots) {
    for (const path of filesUnder(root)) {
      if (path === blockPath) continue;
      const source = readFileSync(path, 'utf8');
      if (new RegExp(`^import\\s+.+\\s+from\\s+['"][^'"]*(?:${chrome.join('|')}|PeerCursors)\\.astro['"];?`, 'm').test(source)) {
        offenders.push(path.slice(repoRoot.length + 1));
      }
    }
  }
  assert.deepEqual(offenders, []);

  const footer = readFileSync(join(componentsRoot, 'FooterBar.astro'), 'utf8');
  assert.equal(occurrences(footer, /\sdata-dock(?:\s|>)/g), 1, 'dock root must be unique');
});

test('the shared chrome can instantiate at most one room presence client per page', () => {
  const block = readFileSync(join(layoutsRoot, 'BlockLayout.astro'), 'utf8');
  const room = readFileSync(join(componentsRoot, 'CursorRoom.astro'), 'utf8');

  assert.equal(occurrences(block, /<CursorRoom\b/g), 1);
  assert.equal(occurrences(room, /['"]\/api\/room\?/g), 1, 'one room WebSocket endpoint');
  assert.equal(occurrences(room, /['"]\/api\/burst\?/g), 1, 'one burst WebSocket endpoint');
  assert.doesNotMatch(room, /\/api\/presence(?:\?|['"])/, 'shared chrome must not revive the legacy global presence client');

  for (const path of filesUnder(pagesRoot)) {
    const source = readFileSync(path, 'utf8');
    assert.ok(occurrences(source, /<BlockLayout\b/g) <= 1, `${path} mounts BlockLayout more than once`);
    assert.doesNotMatch(source, /<CursorRoom\b/, `${path} bypasses the layout presence singleton`);
  }
});
