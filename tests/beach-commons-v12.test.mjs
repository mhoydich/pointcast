import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-useful-marina.png',
  '02-five-future-triage.png',
  '03-hull-library.png',
  '04-clean-bilge-lab.png',
  '05-public-launch.png',
  '06-workboat-cutaway.png',
  '07-harbor-radio.png',
  '08-contentment-pier.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('Harbor Works publishes eight useful marina rooms', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v12.astro'),
    read('src/lib/beach-commons-v12.ts'),
  ]);

  assert.match(page, /A marina is not parking/);
  assert.match(page, /Provocation ≠ condition report/);
  assert.match(page, /Eight useful harbor rooms/);
  assert.match(page, /One boat\. Five futures\./);
  assert.match(page, /Three ways to make it real/);
  assert.match(page, /aria-label="Harbor Works full image viewer"/);
  assert.match(page, /\[hidden\] \{ display: none !important; \}/);
  assert.match(page, /prefers-reduced-motion/);

  for (const title of [
    'The Useful Marina',
    'The Five-Future Triage Hall',
    'The Hull Library',
    'The Clean Bilge Lab',
    'The Public Launch Commons',
    'The Workboat Cutaway',
    'Harbor Radio at Blue Hour',
    'The Contentment Pier',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('One Boat, Five Futures is local, gated, and educational', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v12.astro'),
    read('src/pages/beach-commons/v12.json.ts'),
    read('src/content/blocks/0532.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const label of [
    'Keep Sailing',
    'Repair + Train',
    'Donate to the Shared Fleet',
    'Harvest Safe Parts',
    'Licensed Dismantling',
    'Resolve Ownership',
    'Contain + Survey',
  ]) {
    assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(page, /localStorage/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /storage: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /realVesselAssessment: false/);
  assert.equal(block.meta.localSorter, true);
  assert.equal(block.meta.networkWrites, false);
  assert.equal(block.meta.realVesselsAssessed, 0);
});

test('Harbor Works keeps ownership, hazards, work, and current-condition claims bounded', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v12.astro'),
    read('src/lib/beach-commons-v12.ts'),
    read('src/pages/beach-commons/v12.json.ts'),
    read('src/content/blocks/0532.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /creative prompt, not a verified inventory/);
  assert.match(page, /massive abandoned boat epidemic/);
  assert.match(page, /more than 4,600 slips across 23 marinas/);
  assert.match(data, /Resolve title, ownership, liens, authorization/);
  assert.match(data, /major repair, fabrication, grinding, painting, fluid removal, and dismantling/);
  assert.match(data, /five-knot limit, working slips, public paths, emergency access, and habitat/);
  assert.match(endpoint, /No real vessel is assessed, acquired, offered, salvaged, dismantled/);
  assert.match(block.meta.provocationBoundary, /not a verified inventory/);
  assert.match(block.meta.ownershipBoundary, /title, liens, owner authorization/);
  assert.match(block.meta.eventBoundary, /no lease, acquisition, repair program/);
});

test('Harbor Works has machine, Block, homepage, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, homepage, rack] = await Promise.all([
    read('src/pages/beach-commons/v12.json.ts'),
    read('src/content/blocks/0532.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/index.astro'),
    read('src/components/HomeMagazineRack.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0532');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.vesselFutures, 5);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v12');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v12'/);
  assert.match(llms, /PointCast Field Study 012/);
  assert.match(llmsFull, /HARBOR WORKS/);
  // front door rebuilt 2026-09-01: Beach Commons doors live in index.astro's beachCommonsVolumes/covers arrays and render through <HomeMagazineRack /> (№ blockId chips + the index JSON link).
  assert.match(homepage, /<HomeMagazineRack\b/);
  assert.match(homepage, /href: '\/beach-commons\/v12'/);
  assert.match(homepage, /label: 'V12 Harbor Works', blockId: '0532'/);
  assert.match(rack, /№ \{v\.blockId\}/);
  assert.match(homepage, /href: '\/beach-commons\/v11'/);
  assert.match(homepage, /href: '\/beach-commons'/);
  assert.match(rack, /href="\/beach-commons\.json"/);
});

test('Harbor Works image assets have the intended dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v12/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));
});
