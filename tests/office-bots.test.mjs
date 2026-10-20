import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { OFFICE_BOTS_ART, OFFICE_BOTS_CAST, OFFICE_BOTS_EPISODES, OFFICE_BOTS_URL, officeBotsManifest } from '../src/lib/office-bots.mjs';

const text = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

test('ten bots and ten episodes, every episode featuring a distinct cast member', () => {
  assert.equal(OFFICE_BOTS_CAST.length, 10);
  assert.equal(OFFICE_BOTS_EPISODES.length, 10);
  const slugs = new Set(OFFICE_BOTS_CAST.map((c) => c.slug));
  assert.equal(slugs.size, 10);
  assert.deepEqual(new Set(OFFICE_BOTS_EPISODES.map((e) => e.hero)), slugs);
  OFFICE_BOTS_EPISODES.forEach((e, i) => {
    assert.equal(e.number, i + 1);
    assert.ok(e.coldOpen.length >= 8, `${e.slug} cold open is a real scene`);
    assert.ok(e.button.length > 20);
  });
});

test('every spoken line belongs to a cast member or a named off-screen client', () => {
  const names = new Set(OFFICE_BOTS_CAST.map((c) => c.name));
  names.add('Prospect');
  for (const e of OFFICE_BOTS_EPISODES) for (const [who] of e.coldOpen) if (who) assert.ok(names.has(who), `${e.slug}: unknown speaker ${who}`);
});

test('art files exist, match the manifest hash, and are inert SVG', () => {
  for (const c of OFFICE_BOTS_CAST) {
    for (const [kind, entry] of [['cast', OFFICE_BOTS_ART.cast[c.slug]], ['bg', OFFICE_BOTS_ART.backgrounds[c.slug]]]) {
      assert.ok(entry, `${kind}/${c.slug} in manifest`);
      const file = `public${entry.file}`;
      assert.ok(existsSync(new URL(`../${file}`, import.meta.url)), `${file} exists`);
      const svg = text(file);
      assert.equal(sha(svg), entry.sha256_16, `${file} matches manifest (re-run npm run art:office-bots)`);
      assert.match(svg, /^<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.doesNotMatch(svg, /<script|onload=|href="http|<image/i, `${file} is self-contained and inert`);
      assert.ok(entry.bytes < 400 * 1024, `${file} stays under 400 KB`);
    }
  }
  assert.ok(existsSync(new URL('../public/images/office-bots/cover.png', import.meta.url)));
});

test('each background documents its algorithm, seed and stats', () => {
  for (const [slug, bg] of Object.entries(OFFICE_BOTS_ART.backgrounds)) {
    assert.ok(bg.algorithm && bg.technique.length > 60, `${slug} technique`);
    assert.ok(Number.isInteger(bg.seed));
    assert.ok(Object.keys(bg.stats).length >= 3, `${slug} stats`);
  }
});

test('manifest, block, home feed, llms.txt and sitemap all point at the series', () => {
  const m = officeBotsManifest();
  assert.equal(m.schema, 'pointcast.office-bots/v1');
  assert.equal(m.attribution.kind, 'fiction');
  const block = JSON.parse(text('src/content/blocks/0720.json'));
  assert.equal(block.author, 'cc');
  assert.equal(block.draft, false);
  assert.equal(block.meta.feature_json, '/office-bots.json');
  assert.ok(JSON.parse(text('src/data/new-today.json')).some((i) => i.link === '/office-bots/' && i.block === block.id));
  assert.match(text('public/llms.txt'), /https:\/\/pointcast\.xyz\/office-bots\//);
  assert.match(text('src/pages/sitemap-discovery.xml.ts'), /pointcast\.xyz\/office-bots\//);
  assert.match(text('public/_headers'), /\/office-bots\.json\n\s+Access-Control-Allow-Origin: \*/);
  assert.equal(OFFICE_BOTS_URL, 'https://pointcast.xyz/office-bots/');
});
