// Seedworks pieces: self-contained, same runtime everywhere, deterministic per seed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve('public/art/seedworks');
const slugs = fs.readdirSync(ROOT).filter((d) => fs.existsSync(path.join(ROOT, d, 'index.html')));
const read = (slug) => fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
const runtimeOf = (html) => {
  const a = html.indexOf('/* seedworks-runtime v1');
  const b = html.indexOf('/* end seedworks-runtime */');
  return a >= 0 && b > a ? html.slice(a, b) : null;
};

// Run a piece with a stub DOM and canvas; return the features it reports.
function run(html, seed) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      return (...args) => {
        for (const v of args) if (typeof v === 'number' && !Number.isFinite(v)) throw new Error(`non-finite argument to ${String(k)}`);
      };
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  const el = () => ({ getContext: () => ctx, style: {}, addEventListener() {} });
  let message = null;
  const win = {
    innerWidth: 800, innerHeight: 800, devicePixelRatio: 1, addEventListener() {},
    location: { search: `?seed=${seed}` },
    document: { getElementById: el },
    URLSearchParams, Math,
  };
  win.window = win;
  win.parent = { postMessage: (m) => { message = m; } };
  vm.createContext(win);
  for (const s of scripts) vm.runInContext(s, win);
  return message;
}

test('there are 3 to 5 pieces, and the registry lists each one', async () => {
  assert.ok(slugs.length >= 3 && slugs.length <= 5, `found ${slugs.length}`);
  const reg = fs.readFileSync('src/lib/seedworks.ts', 'utf8');
  for (const s of slugs) assert.ok(reg.includes(`slug: '${s}'`), `${s} missing from src/lib/seedworks.ts`);
});

test('every piece carries the identical runtime block', () => {
  const blocks = slugs.map((s) => runtimeOf(read(s)));
  blocks.forEach((b, i) => assert.ok(b, `${slugs[i]} has no runtime block`));
  for (let i = 1; i < blocks.length; i++) assert.equal(blocks[i], blocks[0], `${slugs[i]} runtime differs from ${slugs[0]}`);
});

test('pieces are self-contained: no remote URLs, no fetch, no Math.random in the drawing', () => {
  for (const s of slugs) {
    const html = read(s);
    assert.ok(!/(src|href)\s*=\s*["']https?:/i.test(html), `${s} loads a remote resource`);
    assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(html), `${s} makes a network request`);
    const art = html.slice(html.indexOf('/* end seedworks-runtime */'));
    // Noise buffers for drum sounds may use Math.random; the picture may not.
    const uses = art.split('\n').filter((l) => l.includes('Math.random') && !l.includes('getChannelData') && !/d\[i\]\s*=/.test(l));
    assert.equal(uses.length, 0, `${s} uses Math.random outside the runtime:\n${uses.join('\n')}`);
  }
});

test('same seed gives the same features; different seeds vary', () => {
  for (const s of slugs) {
    const html = read(s);
    const a = run(html, 'sw-test-a');
    const b = run(html, 'sw-test-a');
    assert.equal(a?.type, 'seedworks:done', `${s} did not call $sw.done`);
    assert.equal(a.seed, 'sw-test-a');
    assert.equal(JSON.stringify(a.features), JSON.stringify(b.features), `${s} is not deterministic`);
    const seen = new Set(['x1', 'x2', 'x3', 'x4', 'x5', 'x6'].map((seed) => JSON.stringify(run(html, seed).features)));
    assert.ok(seen.size > 1, `${s} draws the same features for every seed`);
  }
});
