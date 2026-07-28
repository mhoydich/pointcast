import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Mascot Atlas publishes exactly 25 school cards across eight creature classes', async () => {
  const data = await read('src/lib/mascot-battler.ts');
  const profileSection = data.split('const profiles: MascotProfile[] = [')[1].split('];')[0];
  const slugs = [...profileSection.matchAll(/^\s{4}slug: '([^']+)',/gm)].map((match) => match[1]);
  const classes = [...data.split('export const MASCOT_CLASSES')[1].split('];')[0].matchAll(/^\s{4}id: '([^']+)',/gm)]
    .map((match) => match[1]);

  assert.equal(slugs.length, 25);
  assert.equal(new Set(slugs).size, 25);
  assert.deepEqual(classes, ['flora', 'aerial', 'apex', 'hound', 'range', 'colossus', 'folklore', 'null']);
  assert.equal((profileSection.match(/^\s{4}sourceUrl: 'https:\/\//gm) || []).length, 25);
  assert.match(data, /Hoosier the Bison/);
  assert.match(data, /No official mascot/);
});

test('the battle is deterministic, three-round, local-first, and wager-free', async () => {
  const page = await read('src/pages/mascot-battler.astro');

  assert.match(page, /const seed = hash\(`\$\{conference\}:\$\{classId\}:\$\{arena\.id\}`\)/);
  assert.doesNotMatch(page, /battleNumber/);
  assert.match(page, /const roundNames = \['PLACE', 'LORE', 'SATURDAY'\]/);
  assert.match(page, /pc:mascot-atlas:cards/);
  assert.match(page, /localStorage/);
  assert.match(page, /data-filter-kind="conference"/);
  assert.match(page, /data-filter-kind="class"/);
  assert.match(page, /\[hidden\] \{ display: none !important; \}/);
  assert.match(page, /rightDeck\.filter\(\(card\) => card\.slug !== left\.slug\)/);
  assert.match(page, /clamp\(68px, 7\.5vw, 136px\)/);
  assert.match(page, /clamp\(58px, 17\.5vw, 74px\)/);
  assert.match(page, /No wagers/);
});

test('all eight original field plates are checked in at 1024 by 1280', async () => {
  const names = ['flora', 'aerial', 'apex', 'hound', 'range', 'colossus', 'folklore', 'null'];
  for (const name of names) {
    const path = new URL(`../public/images/mascot-battler/type-${name}.png`, import.meta.url);
    await access(path);
    const buffer = await readFile(path);
    assert.deepEqual(pngSize(buffer), { width: 1024, height: 1280 });
    const info = await stat(path);
    assert.ok(info.size > 500_000, `${name} should retain illustration detail`);
    assert.ok(info.size < 4_000_000, `${name} should remain web-manageable`);
  }
});

test('the main release social card is a 1200 by 630 PNG', async () => {
  const path = new URL('../public/images/og/b/0522.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});

test('every school card has human and JSON route templates with official-source context', async () => {
  const [page, json, cardPage, cardJson] = await Promise.all([
    read('src/pages/mascot-battler.astro'),
    read('src/pages/mascot-battler.json.ts'),
    read('src/pages/mascot-battler/[slug].astro'),
    read('src/pages/mascot-battler/[slug].json.ts'),
  ]);

  assert.match(page, /MASCOT_CARDS\.map/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(json, /methodology/);
  assert.match(cardPage, /getStaticPaths/);
  assert.match(cardPage, /Read \{card\.sourceLabel\}/);
  assert.match(cardPage, /PointCast checked the/);
  assert.match(cardJson, /pointcast\.mascot-field-card\/v1/);
  assert.match(cardJson, /Access-Control-Allow-Origin/);
});

test('Saturday Myth Machine is discoverable across PointCast human and machine surfaces', async () => {
  const [home, apps, sitemap, agents, forAgents, llms, llmsFull, blockText] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/content/blocks/0522.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const surface of [home, apps, sitemap, agents, forAgents, llms, llmsFull]) {
    assert.match(surface, /mascot-battler/);
  }
  assert.match(sitemap, /mascot-battler\/\$\{card\.slug\}/);
  assert.equal(block.id, '0522');
  assert.equal(block.channel, 'BTL');
  assert.equal(block.type, 'LINK');
  assert.equal(block.meta.cards, 25);
  assert.equal(block.meta.creatureClasses, 8);
  assert.equal(block.meta.rounds, 3);
  assert.equal(block.meta.wagering, false);
});
