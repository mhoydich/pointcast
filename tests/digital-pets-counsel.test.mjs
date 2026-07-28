import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadCounselData() {
  const script = `
    import {
      COUNSEL_ART,
      COUNSEL_CREDITS,
      COUNSEL_META,
      COUNSEL_MOTIONS,
      COUNSEL_SECTIONS,
    } from './src/lib/digital-pets-counsel.ts';
    process.stdout.write(JSON.stringify({
      art: COUNSEL_ART,
      credits: COUNSEL_CREDITS,
      meta: COUNSEL_META,
      motions: COUNSEL_MOTIONS,
      sections: COUNSEL_SECTIONS,
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

test('My Pet Has Retained Counsel is a complete original domestic satire', () => {
  const counsel = loadCounselData();
  const manuscript = counsel.sections.flatMap((section) => section.paragraphs).join(' ');
  const words = manuscript.trim().split(/\s+/).length;

  assert.equal(counsel.meta.title, 'My Pet Has Retained Counsel');
  assert.equal(counsel.meta.setting, 'El Segundo, 2043');
  assert.equal(counsel.sections.length, 4);
  assert.equal(new Set(counsel.sections.map((section) => section.slug)).size, 4);
  assert.ok(words >= 1_900 && words <= 2_400, `counsel story has ${words} words`);
  assert.match(counsel.meta.fictionNotice, /This is fiction/);
  assert.match(counsel.meta.styleNote, /does not imitate any particular writer or publication/);
  assert.equal(counsel.motions.length, 3);
  assert.deepEqual(
    counsel.motions.map((motion) => motion.id),
    ['concede', 'represent', 'adjourn'],
  );
  assert.match(manuscript, /alleging vibes/);
  assert.match(manuscript, /person with the passwords/);
  assert.match(manuscript, /advised by counsel, declined to comment/);
  assert.ok(counsel.credits.some((credit) => credit.name === 'Michael Hoydich'));
  assert.ok(counsel.credits.some((credit) => credit.name === 'Codex / OpenAI'));
  assert.doesNotMatch(manuscript.toLowerCase(), /in conclusion/);
});

test('the comedy issue keeps its ridiculous ruling local, optional, and accessible', async () => {
  const [page, css, json] = await Promise.all([
    read('src/pages/digital-pets/counsel.astro'),
    read('src/styles/digital-pets-counsel.css'),
    read('src/pages/digital-pets/counsel.json.ts'),
  ]);

  assert.match(page, /COUNSEL_SECTIONS\.map/);
  assert.match(page, /data-motion-button/);
  assert.match(page, /aria-pressed="false"/);
  assert.match(page, /pc:counsel-motion-v1/);
  assert.match(page, /localStorage/);
  assert.match(page, /AudioContext/);
  assert.match(page, /One tasteful bureaucratic thunk/);
  assert.match(page, /Every household is a tiny constitution with crumbs in it/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media print/);
  assert.match(json, /transmission: 'none'/);
  assert.match(json, /browser localStorage only/);
});

test('generated hero and cartoons are compact project WebP assets', async () => {
  const expected = [
    ['hero.webp', 1536, 1024, 300_000],
    ['cartoon-deposition.webp', 1448, 1086, 250_000],
    ['cartoon-strike.webp', 1448, 1086, 250_000],
  ];

  for (const [filename, width, height, limit] of expected) {
    const path = new URL(`public/images/digital-pets/counsel/${filename}`, root);
    const pathName = fileURLToPath(path);
    const [file, metadata] = await Promise.all([stat(path), sharp(pathName).metadata()]);
    assert.ok(file.size < limit, `${path.pathname} is too large`);
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);
    assert.equal(metadata.format, 'webp');
  }
});

test('Michael’s existing Midjourney archive supplies three credited exhibits', async () => {
  const counsel = loadCounselData();
  assert.equal(counsel.art.midjourney.length, 3);

  for (const work of counsel.art.midjourney) {
    assert.match(work.caption, /Midjourney image directed and curated by Michael Hoydich/);
    const path = new URL(`public${work.src}`, root);
    const file = await stat(path);
    assert.ok(file.size > 10_000, `${work.src} is missing or empty`);
  }
});

test('Companion 03 is linked across the book, Commons, fable, JSON, and discovery surfaces', async () => {
  const [book, bookJson, commons, legacy, sitemap, agents, forAgents, llms, llmsFull, tasks] =
    await Promise.all([
      read('src/pages/digital-pets.astro'),
      read('src/pages/digital-pets.json.ts'),
      read('src/pages/digital-pets/commons.astro'),
      read('src/pages/digital-pets/legacy.astro'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('TASKS.md'),
    ]);

  assert.match(book, /href="\/digital-pets\/counsel"/);
  assert.match(bookJson, /comedyStoryJson/);
  assert.match(commons, /My Pet Has Retained Counsel/);
  assert.match(legacy, /My Pet Has Retained Counsel/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/counsel\.json/);
  assert.match(agents, /digitalPetsComedy: 'https:\/\/pointcast\.xyz\/digital-pets\/counsel\.json'/);
  assert.match(forAgents, /My Pet Has Retained Counsel/);
  assert.match(llms, /Companion\s+03 to Future Book 001/);
  assert.match(llmsFull, /original domestic satire set in El Segundo\s+in 2043/);
  assert.match(tasks, /My Pet Has Retained Counsel — Future Book 001 Companion 03/);
});
