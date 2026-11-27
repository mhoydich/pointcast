import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { JSDOM } from 'jsdom';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/pages/loom/index.astro');

function visit(path) {
  const gate = source.match(/<script\b[^>]*\bdata-hearth-front-door\b[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(gate, 'the browser gate is explicitly marked for regression checks');
  assert.ok(source.indexOf(gate[0]) < source.indexOf('</head>'), 'the gate runs before the app body');
  const url = new URL(path, 'https://pointcast.xyz');
  const replacements = [];
  const location = {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    replace: (target) => replacements.push(target),
  };
  runInNewContext(gate[1], { location });
  return replacements;
}

test('plain Loom opens Hearth without creating a back-button redirect loop', () => {
  for (const path of ['/loom', '/loom/']) {
    assert.deepEqual(visit(path), ['/loom/hearth/'], path);
  }
});

test('existing Loom query links keep the interactive reader', () => {
  const paths = [
    '/loom?to=%23loom',
    '/loom/?to=%40mike',
    '/loom?to=%23loom#m_abc123',
    '/loom/?to=%23loom#m_abc123',
    '/loom?to=loom%3A59bd98330ba4e9fadf436bfc%23m_abc123',
    '/loom?to=%23loom&compose=1#thread',
    '/loom?to=',
    '/loom?for=mike',
    '/loom?as=Mike',
    '/loom?compose=1',
    '/loom?unknown=value',
  ];
  for (const path of paths) assert.deepEqual(visit(path), [], path);
});

test('message fragments and existing navigation fragments stay on the interactive reader', () => {
  for (const fragment of ['m_abc123', 'thread', 'directory', 'for-you', 'other-anchor']) {
    for (const path of ['/loom', '/loom/']) {
      assert.deepEqual(visit(`${path}#${fragment}`), [], `${path}#${fragment}`);
    }
  }
});

test('the front-door gate does not apply to other Loom routes', () => {
  for (const path of ['/loom/classic', '/loom/classic/', '/loom/hearth/', '/loom/for/mike', '/api/loom', '/loom.json', '/loom/topic/loom']) {
    assert.deepEqual(visit(path), [], path);
  }
});

test('Hearth keeps Full Loom one tap away through the existing directory fragment', () => {
  const hearth = read('src/pages/loom/hearth/index.astro');
  const dom = new JSDOM(hearth);
  try {
    const link = [...dom.window.document.querySelectorAll('a')].find((anchor) => {
      const label = anchor.cloneNode(true);
      label.querySelectorAll('[aria-hidden="true"]').forEach((decoration) => decoration.remove());
      return label.textContent.trim() === 'Full Loom';
    });
    assert.ok(link, 'Hearth offers a plainly named Full Loom link');
    assert.equal(link.getAttribute('href'), '/loom#directory');
    assert.deepEqual(visit(link.getAttribute('href')), [], 'Full Loom must bypass the Hearth gate');
  } finally {
    dom.window.close();
  }
});
