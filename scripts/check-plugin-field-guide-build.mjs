/** Verify the actual prerendered guide after build:bare. No network or deploy. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, appendFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { guideMarkdown, GUIDE_BRANDS } from '../src/lib/plugin-field-guide.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.match(head, /^[a-f0-9]{40}$/);
if (process.env.GUIDE_EXPECTED_SHA) assert.equal(head, process.env.GUIDE_EXPECTED_SHA, 'checkout must be the exact reviewed PR head');

const read = (path) => readFile(resolve(root, path), 'utf8');
const guide = JSON.parse(await read('src/data/plugin-field-guide.json'));
const html = await read('dist/ues/plugin-field-guide/index.html');
const markdown = await read('dist/ues/plugin-field-guide.md');
const json = await read('dist/ues/plugin-field-guide.json');
assert.equal(markdown, guideMarkdown(guide), 'generated Markdown must contain the final source text');
assert.equal(markdown, await read('docs/field-guides/2026-10-03-plugin-field-guide.md'));
assert.deepEqual(JSON.parse(json), {
  kind: 'educational-field-guide',
  publicationStatus: 'draft-review-required',
  author: 'codex',
  featureActivation: false,
  ...guide,
}, 'generated JSON must contain the final guide and explicit draft/no-activation metadata');

const dom = new JSDOM(html);
const { document } = dom.window;
const normalize = (value) => value.replace(/\s+/gu, ' ').trim();
const reader = document.querySelector('[data-plugin-field-guide]');
assert.ok(reader, 'generated reading surface must exist');
const renderedText = normalize(reader.textContent);
const paragraphs = (value) => Array.isArray(value) ? value : [value];
const finalText = [guide.title, guide.subtitle, ...guide.intro,
  ...guide.baselines.map((item) => item.body), ...guide.recommendations.map((item) => item.body),
  ...guide.topics.flatMap((topic) => [topic.title, topic.definition, ...paragraphs(topic.use), ...paragraphs(topic.avoid),
    ...topic.architecture, ...topic.practices.map((item) => item.body), topic.availability,
    ...topic.examples.flatMap((item) => [item.title, item.body, item.prompt, item.output, item.firstStep]),
    ...(topic.code ? [topic.code.caption, topic.code.text] : [])]),
  ...guide.sharedPractices.map((item) => item.body), ...guide.pilotSteps.map((item) => item.body), ...guide.limitations];
for (const text of finalText) assert.ok(renderedText.includes(normalize(text)), `final prose absent from generated HTML: ${text.slice(0, 100)}`);

assert.equal(document.documentElement.dataset.pcIsolated, 'true');
assert.equal(document.querySelector('meta[name="robots"]')?.content, 'noindex, nofollow');
const canonical = new URL(document.querySelector('link[rel="canonical"]')?.href);
assert.equal(canonical.origin, 'https://pointcast.xyz');
assert.equal(canonical.pathname.replace(/\/$/u, ''), '/ues/plugin-field-guide');
assert.equal(reader.querySelectorAll('.fg-example-card').length, 15);
assert.equal(reader.querySelectorAll('.fg-example-card[hidden]').length, 0, 'all examples must be readable before JavaScript');
assert.equal(reader.querySelector('[data-brand-filter-ui]')?.hidden, true);
assert.equal(reader.querySelector('#fg-example-count')?.getAttribute('aria-live'), 'polite');
for (const brand of Object.keys(GUIDE_BRANDS)) assert.equal(reader.querySelectorAll(`.fg-example-card[data-brand="${brand}"]`).length, 5);
for (const link of reader.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1))), `broken fragment: ${link.getAttribute('href')}`);
for (const source of guide.sources) assert.ok([...reader.querySelectorAll('a[href]')].some((link) => link.href === source.url), `missing source link: ${source.id}`);
for (const [type, path] of [['text/markdown', '/ues/plugin-field-guide.md'], ['application/json', '/ues/plugin-field-guide.json']]) {
  assert.ok([...document.querySelectorAll('link[rel="alternate"]')].some((link) => link.type === type && new URL(link.href, canonical).pathname === path));
}
assert.equal(document.querySelectorAll('[data-dock], .cursor-room, [src="/js/pc-layers.js"]').length, 0, 'isolated guide must not mount global interactive chrome');

const assets = new Set();
for (const element of document.querySelectorAll('script[src], link[rel="stylesheet"][href]')) {
  const url = new URL(element.getAttribute('src') ?? element.getAttribute('href'), canonical);
  if (url.origin === canonical.origin && url.pathname.startsWith('/_astro/')) assets.add(url.pathname);
}
for (const asset of assets) assert.ok((await stat(resolve(root, 'dist', asset.slice(1)))).isFile(), `missing generated asset: ${asset}`);
dom.window.close();

const hash = (value) => createHash('sha256').update(value).digest('hex');
const report = {
  head,
  checkedAt: new Date().toISOString(),
  canonical: canonical.href,
  capabilityCount: guide.topics.length,
  exampleCount: 15,
  renderedFinalParagraphs: finalText.length,
  generatedAssetCount: assets.size,
  checks: ['exact-checkout', 'final-html-prose', 'exact-markdown', 'exact-json', 'draft-no-activation', 'noindex', 'canonical', 'all-15-without-js', 'live-status', 'anchors', 'source-links', 'isolated-chrome', 'generated-assets'],
  sha256: { html: hash(html), markdown: hash(markdown), json: hash(json) },
  deploymentPerformed: false,
};
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Plugin field guide verification\n\nExact head: \`${head}\`\n\nFive capabilities, fifteen examples, and ${finalText.length} final text passages match the generated output. Markdown and JSON match the source, and canonical/noindex, anchors, isolation, and generated assets passed. No deployment was performed.\n`);
console.log(JSON.stringify(report, null, 2));
