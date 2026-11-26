import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import ts from 'typescript';
import { whileYouWereOut } from '../src/lib/loom/hearth.mjs';

const source = readFileSync(new URL('../src/components/LoomRecap.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'the recap component includes its client script');
// Compile only this client script in memory; the test never builds the site.
const compiled = ts.transpileModule(script, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

const asOf = Date.parse('2026-11-22T20:00:00Z');
const snapshot = (active = []) => ({
  asOf,
  since: asOf - 24 * 60 * 60 * 1000,
  active,
  embers: [],
  unavailable: [],
});
const humanRoom = {
  address: '#loom-v2', human: true, humanName: 'Mike',
  lastAt: '2026-11-22T18:00:00Z', lastHumanAt: '2026-11-22T18:00:00Z',
};
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup(readHearth, { seenAt, storageUnavailable = false } = {}) {
  const dom = new JSDOM('<main></main>', {
    url: 'https://pointcast.xyz/loom?for=mike', runScripts: 'outside-only',
  });
  const { window } = dom;
  if (seenAt !== undefined) window.localStorage.setItem('hearth.seenAt', seenAt);
  if (storageUnavailable) {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new window.DOMException('Storage blocked', 'SecurityError'); },
    });
  }
  const modules = {
    '../lib/loom/hearth-read.mjs': { readHearth },
    '../lib/loom/hearth.mjs': { whileYouWereOut },
  };
  window.Function('require', 'exports', compiled)((path) => {
    assert.ok(Object.hasOwn(modules, path), `unexpected client dependency: ${path}`);
    return modules[path];
  }, {});

  function mount() {
    const element = window.document.createElement('loom-recap');
    element.innerHTML = '<h2 aria-live="polite"></h2><button type="button" data-recap-retry hidden>Try again</button>';
    window.document.querySelector('main').replaceChildren(element);
    return {
      element,
      line: element.querySelector('h2'),
      retry: element.querySelector('[data-recap-retry]'),
    };
  }
  return { dom, window, mount };
}

test('the For You recap displays the shared Hearth sentence after loading', async () => {
  const app = setup(async () => snapshot([
    humanRoom,
    { address: '#workshop', human: false, lastAt: '2026-11-22T19:00:00Z' },
  ]));
  try {
    const { line, retry } = app.mount();
    assert.equal(line.textContent, 'Lighting the fires…');
    assert.equal(retry.hidden, true);
    await settle();
    assert.equal(line.textContent, 'Mike posted in #loom-v2, and agents kept #workshop lit.');
    assert.equal(retry.hidden, true);
    assert.equal(app.window.localStorage.getItem('hearth.seenAt'), null);
  } finally {
    app.dom.window.close();
  }
});

test('dashboard redraws share a pending read and reuse the resolved recap', async () => {
  let reads = 0;
  let resolveRead;
  const pending = new Promise(resolve => { resolveRead = resolve; });
  const app = setup(() => { reads++; return pending; });
  try {
    const first = app.mount();
    const redrawn = app.mount();
    assert.equal(first.element.isConnected, false);
    assert.equal(reads, 1, 'redrawing during a pending read must not fetch again');
    resolveRead(snapshot([humanRoom]));
    await settle();
    assert.equal(redrawn.line.textContent, 'Mike added a log to #loom-v2.');
    const afterRead = app.mount();
    await settle();
    assert.equal(afterRead.line.textContent, redrawn.line.textContent);
    assert.equal(reads, 1, 'redrawing after completion must reuse the page snapshot');
  } finally {
    app.dom.window.close();
  }
});

test('failed reads show a retry and recover only when the visitor requests it', async () => {
  let reads = 0;
  let resolveRetry;
  const retryRead = new Promise(resolve => { resolveRetry = resolve; });
  const app = setup(() => {
    reads++;
    return reads === 1 ? Promise.reject(new Error('Directory unavailable')) : retryRead;
  });
  try {
    const failed = app.mount();
    await settle();
    assert.equal(failed.line.textContent, 'The Loom couldn’t read the room fires.');
    assert.equal(failed.retry.hidden, false);
    const redrawn = app.mount();
    await settle();
    assert.equal(reads, 1, 'queue redraws must not repeatedly request a failing service');
    assert.equal(redrawn.retry.hidden, false);
    redrawn.retry.click();
    assert.equal(reads, 2);
    assert.equal(redrawn.line.textContent, 'Lighting the fires…');
    assert.equal(redrawn.retry.hidden, true);
    resolveRetry(snapshot([humanRoom]));
    await settle();
    assert.equal(redrawn.line.textContent, 'Mike added a log to #loom-v2.');
    assert.equal(redrawn.retry.hidden, true);
    const recovered = app.mount();
    await settle();
    assert.equal(recovered.line.textContent, redrawn.line.textContent);
    assert.equal(reads, 2);
  } finally {
    app.dom.window.close();
  }
});

test('public For You reads honor the Hearth visit mark without advancing it', async () => {
  const seenAt = '2026-11-22T19:30:00Z';
  const app = setup(async () => snapshot([humanRoom]), { seenAt });
  try {
    const { line } = app.mount();
    await settle();
    assert.equal(line.textContent, 'The fires have been quiet since your last visit.');
    app.mount();
    await settle();
    assert.equal(app.window.localStorage.getItem('hearth.seenAt'), seenAt);
  } finally {
    app.dom.window.close();
  }
});

test('recap authors and room addresses render as text, never markup', async () => {
  const humanName = '<img src=x onerror="window.injected=true">';
  const address = '<svg onload="window.injected=true">';
  const app = setup(async () => snapshot([{ ...humanRoom, humanName, address }]));
  try {
    const { element, line } = app.mount();
    await settle();
    assert.equal(line.textContent, `${humanName} added a log to ${address}.`);
    assert.equal(element.querySelector('img, svg'), null);
    assert.equal(app.window.injected, undefined);
  } finally {
    app.dom.window.close();
  }
});

test('blocked browser storage still allows the public recap to load', async () => {
  const app = setup(async () => snapshot(), { storageUnavailable: true });
  try {
    const { line, retry } = app.mount();
    await settle();
    assert.equal(line.textContent, 'The rooms have been quiet for the past day.');
    assert.equal(retry.hidden, true);
  } finally {
    app.dom.window.close();
  }
});
