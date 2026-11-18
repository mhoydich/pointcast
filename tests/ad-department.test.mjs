import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const repo = join(import.meta.dirname, '..');
const rack = '/ads/department/';
const base = 'https://pointcast.xyz';
const deck = 'https://objkt.com/collections/KT19uYnRbBA7jnepfcqEr3rZHUoVeLHz2RkF';
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
const hash = (s) => createHash('sha256').update(s).digest('hex');

// Source edition mhoydich/brutalist-motor-art@12f7d54. For the long-copy
// ads, hash each normalized paragraph or list item in reading order, joined by LF.
const originals = [
  ['square-glasses', 'The Noun in the square glasses.', ['car.svg'], '1d6a6367df665af2fc7e4fe30a1b68a1c791517d30d00b03c044531ef8c2237a'],
  ['sixty-miles', '“At sixty miles an hour the loudest noise in this picture comes from the concrete.”', ['el-segundo-ferrari.png', 'taxi.svg'], '42a1272f321082e4824556b6c4c47fd697f313f853d0209809f7ae79d03f8835'],
  ['concrete', 'Concrete', ['wall.svg'], null, 'for the garage'],
  ['how-to-look', 'How to look at a building.', ['noggles.svg'], 'aa8a41a0458ecf520bf8b5dfdc4e17877d15c34182bae21dcf690333568b8c2d'],
  ['skate-building', 'How to skate a building.', ['skate.svg'], 'a4d47c2bfe224759159dfaa2869de27b5564b53441ec9f57a948b383213b4607'],
  ['noggles-deck', 'Noggles', ['noggles.svg'], null, 'now in seven-ply maple'],
];

let root;
async function getPage(route = rack) {
  const html = await readFile(join(root, 'dist', route, 'index.html'), 'utf8');
  return new JSDOM(html, { url: base + route }).window.document;
}

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'ad-department-'));
  const inputs = ['package.json', 'src/components/ad-department', 'src/lib/ad-department',
    'src/pages/ads/department', 'src/assets/currency-builder/fonts/BodoniModa-opsz-wght.ttf', 'public/ad-department'];
  for (const input of inputs) {
    const destination = join(root, input);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(repo, input), destination, { recursive: true });
  }
  await symlink(join(repo, 'node_modules'), join(root, 'node_modules'), 'dir');

  // A seventh file exercises the full discovery path, including the share route.
  await writeFile(join(root, 'src/components/ad-department/posters/99-test.astro'), `---
export const ad = { slug: 'test-poster', title: 'Seventh poster', description: 'Fixture', art: '/ad-department/art/car.svg' };
---
<article>Seventh poster</article>`);
  await promisify(execFile)(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--site', base],
    { cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
});
after(async () => { if (root) await rm(root, { recursive: true, force: true }); });

test('static rack exposes the original ads, native fragment paging, source and skate decks', async () => {
  const page = await getPage();
  assert.match(page.body.textContent, /El Segundo Auto Repair/);
  assert.ok(page.querySelector(`a[href="${deck}"]`));
  assert.ok(page.querySelector('a[href^="https://github.com/mhoydich/brutalist-motor-art"]'));
  for (const [slug] of originals) {
    assert.ok(page.querySelector(`a[href="#${slug}"]`), slug);
    assert.ok(page.getElementById(slug).querySelector(`a[href="${rack}${slug}/"]`), slug);
  }
});

test('original poster readers preserve the source text, illustrated plates and static navigation', async () => {
  for (const [i, [slug, title, art, copy, subtitle]] of originals.entries()) {
    const page = await getPage(rack + slug + '/');
    const poster = page.querySelector('article.campaign-ad');
    assert.equal(normalize(poster.querySelector('h2').textContent), title);
    assert.deepEqual([...poster.querySelectorAll('img')].map(img => img.src.split('/').pop()), art);
    if (copy) {
      const paragraphs = [...poster.querySelectorAll('.ad-copy p, .ad-copy li')];
      assert.equal(hash(paragraphs.map(p => normalize(p.textContent)).join('\n')), copy, slug);
    } else {
      assert.equal(normalize(poster.querySelector('.ad-plate-sub').textContent), subtitle);
    }
    assert.ok(page.querySelector(`a[href="${rack}#${slug}"]`));
    if (i) assert.equal(page.querySelector('[rel="prev"]').pathname, rack + originals[i - 1][0] + '/');
    if (i + 1 < originals.length) assert.equal(page.querySelector('[rel="next"]').pathname, rack + originals[i + 1][0] + '/');
  }
});

test('each reader, including a newly added poster file, publishes a distinct social preview', async () => {
  const previews = new Set();
  const page = await getPage();
  assert.ok(page.querySelector(`a[href="${rack}test-poster/"]`));
  for (const slug of [...originals.map(([slug]) => slug), 'test-poster']) {
    const route = rack + slug + '/';
    const reader = await getPage(route);
    assert.equal(reader.querySelector('[rel="canonical"]').href, base + route);
    for (const attr of ['property="og:image"', 'name="twitter:image"']) {
      assert.equal(reader.querySelector(`meta[${attr}]`).content, base + route + 'share.png');
    }
    const bytes = await readFile(join(root, 'dist', route, 'share.png'));
    const { format, width, height } = await sharp(bytes).metadata();
    assert.deepEqual([format, width, height], ['png', 1200, 630]);
    assert.ok(!previews.has(hash(bytes)), 'Duplicate share image: ' + slug);
    previews.add(hash(bytes));
  }
});
