import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const PLATES = ['01-the-sign', '02-the-survey', '03-the-lot', '04-the-pledge-board', '05-the-plunge', '06-the-pocket-park', '07-the-ledger', '08-the-ring', '09-banner'];

test('Pool Together publishes one open lot with an all-or-nothing goal, ten rules, and nine plates', async () => {
  const [lib, page, blockText] = await Promise.all([read('src/lib/pool-together.ts'), read('src/pages/pool-together.astro'), read('src/content/blocks/0585.json')]);
  const block = JSON.parse(blockText);
  assert.match(lib, /id: '000',\s+title: 'The Survey'/);
  assert.match(lib, /goal: \{ hands: 100, memos: 25 \}/);
  assert.match(lib, /deadline: '2026-12-05'/);
  assert.equal((lib.match(/^  '.+',$/gm) || []).filter((line) => /All or nothing|No yield|never holds title|One parcel per lot|Agents do work|receipt|intents until|90245 first|human signs off|agreed to anything/.test(line)).length, 10);
  for (const plate of PLATES) assert.match(lib, new RegExp(`/pool-together/plates/${plate}\\.webp`));
  assert.equal(block.id, '0585');
  assert.equal(block.media.src, '/pool-together/plates/01-the-sign.webp');
  assert.ok(block.companions.some((c) => c.id === '/pool-together'));
  assert.match(page, /all or nothing/i);
  assert.match(page, /collects no money/i);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
});

test('Pool Together keeps its money, party, and agent boundaries explicit', async () => {
  const [lib, json, page] = await Promise.all([read('src/lib/pool-together.ts'), read('src/pages/pool-together.json.ts'), read('src/pages/pool-together.astro')]);
  assert.match(lib, /Nothing on this page collects money/);
  assert.match(lib, /no offering of any kind is being made/);
  assert.match(json, /collects: false/);
  assert.match(json, /has agreed to anything/);
  assert.match(json, /Agents do not pledge money and cannot hold land/);
  assert.match(page, /Nobody named here has agreed to anything/);
});

test('Pool Together wires the free memo desk, the paid memo action, and the pledge desk', async () => {
  const [free, paid, pledge, store, actions, buyer] = await Promise.all([
    read('functions/api/pool-together/memo.ts'),
    read('functions/api/agent/memo.ts'),
    read('functions/api/pool-together/pledge.ts'),
    read('functions/api/pool-together/_store.ts'),
    read('functions/_lib/paid-town-actions.ts'),
    read('src/lib/x402-buyer.ts'),
  ]);
  assert.match(free, /bucket: 'pool-together-memo'/);
  assert.match(free, /seal: 'https:\/\/pointcast\.xyz\/api\/agent\/memo'/);
  assert.match(paid, /action: 'memo'/);
  assert.match(paid, /beginPaidIntent\(request, env\.AUTH_DB, 'memo', normalized\.canonical\)/);
  assert.match(paid, /storeMemo\(env, memo\)/);
  assert.match(pledge, /verifySignature\(michelineStringPayload\(message\), publicKey, signature\)/);
  assert.match(pledge, /verifyMessage\(\{ address/);
  assert.match(pledge, /nonceSeen\(env, nonce\)/);
  assert.match(store, /pt:pledges:/);
  assert.match(store, /sealed: null \| \{ receiptHash: string; payer: string/);
  assert.match(actions, /endpoint: 'https:\/\/pointcast\.xyz\/api\/agent\/memo'/);
  assert.match(actions, /room: 'https:\/\/pointcast\.xyz\/pool-together'/);
  assert.match(buyer, /'bench' \| 'cast' \| 'claim' \| 'memo'/);
  assert.match(buyer, /\['bench', 'cast', 'claim', 'memo'\]\.includes/);
});

test('Pool Together has nine plates at the right sizes and all publication twins', async () => {
  const [sitemap, llms, og] = await Promise.all([read('src/pages/sitemap-discovery.xml.ts'), read('public/llms.txt'), read('scripts/generate-pool-together-social.mjs')]);
  assert.match(sitemap, /pointcast\.xyz\/pool-together', 'weekly'/);
  assert.match(sitemap, /pointcast\.xyz\/pool-together\.json', 'weekly'/);
  assert.match(llms, /\[Pool Together\]\(https:\/\/pointcast\.xyz\/pool-together\)/);
  assert.match(og, /images\/og\/b\/0585\.png/);
  await access(new URL('public/images/og/b/0585.png', root));
  const dims = await Promise.all(PLATES.map(async (name) => {
    const meta = await sharp(new URL(`public/pool-together/plates/${name}.webp`, root).pathname).metadata();
    return { width: meta.width, height: meta.height };
  }));
  assert.deepEqual(dims, PLATES.map((name) => (name === '09-banner' ? { width: 1536, height: 1024 } : { width: 1024, height: 1536 })));
});
