import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import * as model from '../public/signal-atlas/model.mjs';
import { SITE_CONFIG, observationEndpoint } from '../public/signal-atlas/site-config.mjs';

async function setup() {
  const html = await readFile(new URL('../public/signal-atlas/index.html', import.meta.url), 'utf8');
  const source = await readFile(new URL('../public/signal-atlas/app.mjs', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'https://pointcast.xyz/signal-atlas/' });
  const { window } = dom;
  const pending = [];
  window.model = model;
  window.siteConfig = { SITE_CONFIG, observationEndpoint: id => observationEndpoint(id, window.location.href) };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.requestAnimationFrame = callback => callback();
  window.fetch = (url, options) => new Promise(resolve => pending.push({ url, options, resolve }));
  window.eval(source.replace(/^import .*from '\.\/model\.mjs';/m,
    'const {SITES,CATALOG,disconnected,demoSnapshot,normalizeWishlist} = window.model;')
    .replace(/^import .*from '\.\/site-config\.mjs';/m,
      'const {SITE_CONFIG,observationEndpoint} = window.siteConfig;'));
  const $ = id => window.document.getElementById(id);
  const click = (id, more = {}) => $(id).dispatchEvent(new window.MouseEvent('click', { button: 0, bubbles: true, cancelable: true, ...more }));
  const reply = async (index, data) => { pending[index].resolve({ ok: true, json: async () => data }); await new Promise(resolve => setImmediate(resolve)); };
  return { dom, window, $, click, pending, reply };
}

test('real-evidence action leaves the sample, clears sample search, and ignores an earlier delayed read', async () => {
  const { dom, window, $, click, pending, reply } = await setup();
  try {
    assert.equal(pending.length, 1);
    click('start-tour');
    assert.equal($('demo').checked, true);
    assert.match($('cards').textContent, /Lantern/);
    $('search').value = 'Lantern';
    $('search').dispatchEvent(new window.Event('input'));
    click('show-evidence');
    assert.equal($('demo').checked, false);
    assert.equal($('search').value, '');
    assert.equal($('cards').querySelectorAll('article').length, 0);
    assert.equal(window.document.activeElement, $('collection-title'));
    assert.equal(window.location.hash, '#collection');
    assert.equal(pending.length, 2);
    const now = Date.parse('2026-11-01T15:00:00Z');
    await reply(1, model.summarizeLegacyLog([{ type: 'bot:google', t: now }], { now }));
    assert.match($('cards').textContent, /Googlebot/);
    assert.doesNotMatch($('cards').textContent, /Lantern|Invented demo/);
    await reply(0, model.summarizeLegacyLog([{ type: 'ai:openai', t: now }], { now }));
    assert.match($('cards').textContent, /Googlebot/);
    assert.doesNotMatch($('cards').textContent, /OpenAI/);
    assert.equal(window.document.activeElement, $('collection-title'));
    assert.match($('league-rows').textContent, /Not open · unranked/);
  } finally { dom.window.close(); }
});

test('a modified real-evidence link click does not silently mutate the current sample', async () => {
  const { dom, $, click, pending, reply } = await setup();
  try {
    await reply(0, model.disconnected());
    click('start-tour');
    assert.equal(click('show-evidence', { ctrlKey: true }), true);
    assert.equal($('demo').checked, true);
    assert.match($('cards').textContent, /Lantern/);
    assert.equal(pending.length, 1);
  } finally { dom.window.close(); }
});

test('delayed evidence preserves focus on catalog wishlist and expanded documentation controls', async () => {
  for (const controlType of ['wishlist', 'documentation']) {
    const { dom, window, $, reply } = await setup();
    try {
      $('filters').querySelector('[data-filter="possible"]').click();
      const selector = '[data-atlas-control-id$="-' + controlType + '"]';
      const before = $('cards').querySelector(selector);
      if (controlType === 'documentation') before.closest('details').open = true;
      before.focus();
      const token = before.dataset.atlasControlId;
      await reply(0, model.disconnected());
      assert.equal(window.document.activeElement.dataset.atlasControlId, token);
      assert.equal(window.document.activeElement.isConnected, true);
      if (controlType === 'documentation') assert.equal(window.document.activeElement.closest('details').open, true);
    } finally { dom.window.close(); }
  }
});
