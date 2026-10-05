import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GUIDE_BRANDS, guideMarkdown } from '../src/lib/plugin-field-guide.mjs';

const guide = JSON.parse(await readFile(new URL('../src/data/plugin-field-guide.json', import.meta.url), 'utf8'));

test('every capability has grounded distinctions and all three brand applications', () => {
  assert.equal(guide.topics.length, 5);
  const statuses = new Set(guide.statusLabels.map((item) => item.id));
  const sources = new Set(guide.sources.map((item) => item.id));
  for (const topic of guide.topics) {
    assert.deepEqual(topic.examples.map((item) => item.brand).sort(), Object.keys(GUIDE_BRANDS).sort());
    assert.ok(topic.use && topic.avoid && topic.availability && topic.architecture.length);
    assert.ok(topic.examples.every((item) => statuses.has(item.status) && item.firstStep && item.output));
    assert.ok(topic.sources.every((id) => sources.has(id)));
    if (topic.code) assert.ok(sources.has(topic.code.source));
  }
  for (const item of guide.sources) assert.ok(['developers.openai.com', 'platform.openai.com', 'learn.chatgpt.com'].includes(new URL(item.url).hostname));
});

test('the proposed event illustration constrains both subscription and payload', () => {
  const event = JSON.parse(guide.topics.find((item) => item.id === 'events').code.text);
  assert.deepEqual(event.delivery, ['webhook']);
  assert.equal(event.inputSchema.additionalProperties, false);
  assert.equal(event.payloadSchema.additionalProperties, false);
  assert.deepEqual(event.inputSchema.required, ['signal_id']);
  for (const key of event.payloadSchema.required) assert.ok(event.payloadSchema.properties[key]);
});

test('the actual client filter announces each brand and safely reinitializes', async () => {
  const { JSDOM } = await import('jsdom');
  const { transpileModule } = await import('typescript');
  const client = await readFile(new URL('../src/scripts/plugin-field-guide.ts', import.meta.url), 'utf8');
  const code = transpileModule(client, { compilerOptions: { target: 9 } }).outputText;
  const cards = guide.topics.flatMap((topic) => topic.examples).map((example) => `<article class="fg-example-card" data-brand="${example.brand}"></article>`).join('');
  const dom = new JSDOM(`<article data-plugin-field-guide><div data-brand-filter-ui hidden></div><select id="fg-brand-filter"><option value="all">All</option><option value="pointcast">PointCast</option><option value="ues">UES</option><option value="industrynext">IndustryNext</option></select><p id="fg-example-count" aria-live="polite"></p>${cards}</article>`, { runScripts: 'outside-only', url: 'https://example.test' });
  const { window } = dom;
  assert.equal(window.document.querySelectorAll('.fg-example-card:not([hidden])').length, 15);
  window.eval(code);
  const select = window.document.querySelector('select');
  for (const brand of ['pointcast', 'ues', 'industrynext', 'all']) {
    select.value = brand;
    select.dispatchEvent(new window.Event('change'));
    assert.equal(window.document.querySelectorAll('.fg-example-card:not([hidden])').length, brand === 'all' ? 15 : 5);
    assert.ok(window.document.querySelector('#fg-example-count').textContent.includes(brand === 'all' ? 'all 15' : GUIDE_BRANDS[brand]));
  }
  window.eval(code);
  window.document.dispatchEvent(new window.Event('astro:page-load'));
  assert.equal(window.document.querySelectorAll('.fg-example-card:not([hidden])').length, 15);
  assert.equal(window.localStorage.length, 0);
  assert.equal(window.document.querySelector('[data-brand-filter-ui]').hidden, false);
  dom.window.close();
});

test('the standalone companion retains all examples, boundaries and exact source links', async () => {
  const rendered = guideMarkdown(guide);
  const saved = await readFile(new URL('../docs/field-guides/2026-10-03-plugin-field-guide.md', import.meta.url), 'utf8');
  assert.equal(rendered, saved);
  for (const topic of guide.topics) for (const example of topic.examples) assert.ok(rendered.includes(example.prompt));
  for (const source of guide.sources) assert.ok(rendered.includes(source.url));
  for (const limit of guide.limitations) assert.ok(rendered.includes(limit));
  assert.ok(rendered.includes('2026-07-28') && rendered.includes('2025-06-18'));
  assert.ok(rendered.includes('unverified') && rendered.includes('does not establish a ranking algorithm'));
});
