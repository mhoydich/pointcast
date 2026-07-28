import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadLegacyData() {
  const script = `
    import {
      LEGACY_ART,
      LEGACY_CREDITS,
      LEGACY_META,
      LEGACY_SECTIONS,
      LEGACY_VOWS,
    } from './src/lib/digital-pets-legacy.ts';
    process.stdout.write(JSON.stringify({
      art: LEGACY_ART,
      credits: LEGACY_CREDITS,
      meta: LEGACY_META,
      sections: LEGACY_SECTIONS,
      vows: LEGACY_VOWS,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('The Amber Seed is a complete original philosophical fable', () => {
  const legacy = loadLegacyData();
  const manuscript = legacy.sections.flatMap((section) => section.paragraphs).join(' ');
  const words = manuscript.trim().split(/\s+/).length;

  assert.equal(legacy.meta.title, 'The Amber Seed');
  assert.equal(legacy.meta.setting, 'Greater Los Angeles, 2098');
  assert.equal(legacy.sections.length, 4);
  assert.equal(new Set(legacy.sections.map((section) => section.slug)).size, 4);
  assert.ok(words >= 2_500 && words <= 3_500, `legacy story has ${words} words`);
  assert.match(legacy.meta.fictionNotice, /This is fiction/);
  assert.match(legacy.meta.styleNote, /without imitating Hermann Hesse’s exact prose/);
  assert.equal(legacy.vows.length, 3);
  assert.deepEqual(
    legacy.vows.map((vow) => vow.id),
    ['mend', 'carry', 'release'],
  );
  assert.ok(legacy.credits.some((credit) => credit.name === 'Michael Hoydich'));
  assert.ok(legacy.credits.some((credit) => credit.name === 'Codex / OpenAI'));
  assert.doesNotMatch(manuscript.toLowerCase(), /in conclusion/);
});

test('the literary issue keeps its interaction local, optional, and accessible', async () => {
  const [page, css, json] = await Promise.all([
    read('src/pages/digital-pets/legacy.astro'),
    read('src/styles/digital-pets-legacy.css'),
    read('src/pages/digital-pets/legacy.json.ts'),
  ]);

  assert.match(page, /LEGACY_SECTIONS\.map/);
  assert.match(page, /data-vow-button/);
  assert.match(page, /aria-pressed="false"/);
  assert.match(page, /pc:amber-seed-v1/);
  assert.match(page, /localStorage/);
  assert.match(page, /AudioContext/);
  assert.match(page, /Sound begins only when you ask/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media print/);
  assert.match(json, /transmission: 'none'/);
  assert.match(json, /browser localStorage only/);
});

test('generated hero and cartoons are compact project WebP assets', async () => {
  const expected = [
    ['hero.webp', 1536, 1024, 400_000],
    ['cartoon-board.webp', 1200, 900, 250_000],
    ['cartoon-bridge.webp', 1200, 900, 250_000],
  ];

  for (const [filename, width, height, limit] of expected) {
    const path = new URL(`public/images/digital-pets/legacy/${filename}`, root);
    const pathName = fileURLToPath(path);
    const [file, metadata] = await Promise.all([stat(path), sharp(pathName).metadata()]);
    assert.ok(file.size < limit, `${path.pathname} is too large`);
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);
    assert.equal(metadata.format, 'webp');
  }
});

test('Michael’s existing Midjourney archive supplies three credited interludes', async () => {
  const legacy = loadLegacyData();
  assert.equal(legacy.art.midjourney.length, 3);

  for (const work of legacy.art.midjourney) {
    assert.match(work.caption, /Midjourney image directed and curated by Michael Hoydich/);
    const path = new URL(`public${work.src}`, root);
    const file = await stat(path);
    assert.ok(file.size > 10_000, `${work.src} is missing or empty`);
  }
});

test('Companion 02 is linked across the book, Commons, JSON, and discovery surfaces', async () => {
  const [book, bookJson, commons, sitemap, agents, forAgents, llms, llmsFull, tasks] =
    await Promise.all([
      read('src/pages/digital-pets.astro'),
      read('src/pages/digital-pets.json.ts'),
      read('src/pages/digital-pets/commons.astro'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('TASKS.md'),
    ]);

  assert.match(book, /href="\/digital-pets\/legacy"/);
  assert.match(bookJson, /legacyStoryJson/);
  assert.match(commons, /Read The Amber Seed/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/legacy\.json/);
  assert.match(agents, /digitalPetsLegacy: 'https:\/\/pointcast\.xyz\/digital-pets\/legacy\.json'/);
  assert.match(forAgents, /The Amber Seed/);
  assert.match(llms, /Companion\s+02 to Future Book 001/);
  assert.match(llmsFull, /original philosophical fable set in Greater Los Angeles in 2098/);
  assert.match(tasks, /The Amber Seed — Future Book 001 Companion 02/);
});
