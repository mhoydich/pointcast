import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('both Wednesday issues publish labeled eight-card visual boards', async () => {
  const data = await read('src/lib/wednesday-pinboards.ts');

  assert.equal((data.match(/kind: 'playlist'/g) ?? []).length, 2);
  assert.equal((data.match(/kind: 'openai-image'/g) ?? []).length, 2);
  assert.equal((data.match(/kind: 'midjourney-archive'/g) ?? []).length, 6);
  assert.equal((data.match(/kind: 'outside-door'/g) ?? []).length, 6);

  assert.match(data, /route: '\/wednesday\/001\/board'/);
  assert.match(data, /route: '\/wednesday\/002\/board'/);
  assert.match(data, /OpenAI image generation/);
  assert.match(data, /Michael Hoydich · Midjourney archive/);
  assert.match(data, /Outside door · Grateful Dead official archive/);
  assert.match(data, /Outside door · Museum of Modern Art/);
  assert.match(data, /Outside-door cards link to their original publishers and do not copy their artwork/);
});

test('outside doors remain source links without copied image fields', async () => {
  const data = await read('src/lib/wednesday-pinboards.ts');
  const outsideIds = [
    'ripple-story',
    'shady-grove',
    'pizza-tapes',
    'eno-about',
    'eno-moma',
    'making-music-modern',
  ];

  for (const id of outsideIds) {
    const start = data.indexOf(`id: '${id}'`);
    assert.ok(start >= 0, `${id} must be present`);
    const end = data.indexOf('\n    },', start);
    const card = data.slice(start, end);
    assert.match(card, /kind: 'outside-door'/);
    assert.match(card, /href: 'https:\/\//);
    assert.doesNotMatch(card, /\n\s+image:/);
  }
});

test('pinboard pages are art-forward, responsive, and machine-readable', async () => {
  const [component, firstPage, secondPage, firstJson, secondJson] = await Promise.all([
    read('src/components/WednesdayPinboard.astro'),
    read('src/pages/wednesday/001/board.astro'),
    read('src/pages/wednesday/002/board.astro'),
    read('src/pages/wednesday/001/board.json.ts'),
    read('src/pages/wednesday/002/board.json.ts'),
  ]);

  assert.match(component, /CollectionPage/);
  assert.match(component, /PUBLIC VISUAL PINBOARD/);
  assert.match(component, /Collected, generated, and linked are different verbs/);
  assert.match(component, /columns: 4 270px/);
  assert.match(component, /@media \(max-width: 620px\)/);
  assert.match(component, /prefers-reduced-motion/);
  assert.match(component, /pinterestBoardUrl/);
  assert.match(firstPage, /UPDRAFT_PINBOARD/);
  assert.match(secondPage, /GOOD_WORK_PINBOARD/);
  assert.match(firstJson, /Access-Control-Allow-Origin/);
  assert.match(secondJson, /Access-Control-Allow-Origin/);
});

test('pinboard routes travel through issue, Block, sitemap, agent, and LLM discovery', async () => {
  const surfaces = await Promise.all([
    read('src/pages/wednesday/index.astro'),
    read('src/pages/wednesday/002.astro'),
    read('src/pages/playlists/wednesday-morning-uplift.astro'),
    read('src/content/blocks/0537.json'),
    read('src/content/blocks/0538.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const surface of surfaces) {
    assert.match(
      surface,
      /visual board|visual pinboard|Visual board|Visual pinboard|boardRoute|VisualBoard|wednesday\/00[12]\/board/,
    );
  }

  assert.match(surfaces[5], /wednesday\/001\/board\.json/);
  assert.match(surfaces[5], /wednesday\/002\/board\.json/);
  assert.match(surfaces[6], /wednesdayGoodWorkVisualBoard/);
  assert.match(surfaces[6], /wednesdayMorningUpliftVisualBoard/);
});

test('all ten checked-in pinboard image assets are present', async () => {
  const imagePaths = [
    'public/images/playlists/wednesday-morning-uplift-cover.png',
    'public/images/playlists/wednesday-0934-good-work-cover.png',
    'public/images/wednesday/001/porch-strings-0934.jpg',
    'public/images/wednesday/001/open-road-first-light.webp',
    'public/images/wednesday/001/open-road-green-shade.webp',
    'public/images/wednesday/001/open-road-garden-road.webp',
    'public/images/wednesday/002/beautifully-lit-desk.jpg',
    'public/showcast/bells-bloom/assets/07-dial-tone-garden.jpg',
    'public/showcast/bells-bloom/assets/08-bell-black-base.jpg',
    'public/showcast/bells-bloom/assets/27-bell-labs-cutaway.jpg',
  ];

  await Promise.all(imagePaths.map((path) => access(new URL(path, root))));
});
