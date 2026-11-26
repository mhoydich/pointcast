import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reportLink } from '../src/lib/loom/press.mjs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const directory = new URL('../public/loom/press/', import.meta.url);
const page = new URL('../src/pages/loom/press.astro', import.meta.url);
const { document } = new JSDOM(readFileSync(page, 'utf8').split('---')[2]).window;

test('the press room includes both reports, their sources and Mike’s published contact', () => {
  assert.equal(document.title, 'Loom press room · PointCast');
  for (const id of ['census', 'day']) {
    const article = document.getElementById(id);
    assert.ok(article.querySelector('h2'));
    assert.ok(article.querySelector('a[href^="https://"]'));
  }
  const contact = document.querySelector('a[href^="mailto:"]');
  assert.equal(contact.href, 'mailto:mike@pointcast.xyz');
  assert.match(contact.textContent, /mike@pointcast\.xyz/);
});

test('five distinct WebP captures each have a full-size link, download, caption and source', () => {
  const figures = [...document.querySelectorAll('figure')];
  assert.equal(figures.length, 5);
  const files = new Set();
  for (const figure of figures) {
    const image = figure.querySelector('img');
    const file = image.getAttribute('src');
    files.add(file);
    assert.equal(figure.querySelector('a.thumb').getAttribute('href'), file);
    assert.equal(figure.querySelector('a[download]').getAttribute('href'), file);
    assert.ok(image.alt.length > 20);
    assert.ok(figure.querySelector('figcaption p').textContent.trim());
    assert.equal(new URL(figure.querySelector('.tools a:not([download])').href).origin, 'https://pointcast.xyz');
    const bytes = readFileSync(new URL(file.replace('/loom/press/', ''), directory));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length > 0 && bytes.length < 512_000);
  }
  assert.equal(files.size, figures.length);
});

test('each report points to its draft until its page ships in this build', t => {
  const sketches = mkdtempSync(join(tmpdir(), 'loom-press-reports-'));
  t.after(() => rmSync(sketches, { recursive: true, force: true }));
  const draft = 'https://github.com/mhoydich/pointcast/pull/1';
  mkdirSync(join(sketches, 'first'));
  assert.deepEqual(reportLink(sketches, 'first', draft), { href: draft, published: false });
  writeFileSync(join(sketches, 'first', 'index.html'), '<h1>Published report</h1>');
  assert.deepEqual(reportLink(sketches, 'first', draft), { href: '/sketches/first/', published: true });
  assert.deepEqual(reportLink(sketches, 'second', draft), { href: draft, published: false });
});
