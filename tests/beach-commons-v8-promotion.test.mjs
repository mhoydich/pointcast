import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const promotion = await import(new URL('src/lib/beach-commons-v8-promotion.ts', root));
const read = (path) => readFile(new URL(path, root), 'utf8');

const [share, shareJson, reviewJson, registry, desk, receipt, agents, forAgents, sitemap, llms, llmsFull, press] =
  await Promise.all([
    read('src/pages/beach-commons/v8/share.astro'),
    read('src/pages/beach-commons/v8/share.json.ts'),
    read('src/pages/beach-commons/v8.json.ts'),
    read('src/lib/open-ad-network.ts'),
    read('src/pages/ads.astro'),
    read('src/pages/ads.json.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/press-releases.json'),
  ]);

test('the blanket review gets four channel-specific, copy-ready dispatches', async () => {
  assert.equal(promotion.BEACH_BLANKET_PROMOTION_CAMPAIGN.creativeCount, 4);
  assert.equal(promotion.BEACH_BLANKET_PROMO_DISPATCHES.length, 4);
  assert.deepEqual(
    new Set(promotion.BEACH_BLANKET_PROMO_DISPATCHES.map((dispatch) => dispatch.channel)),
    new Set(['LinkedIn', 'X', 'Newsletter', 'Press']),
  );

  for (const dispatch of promotion.BEACH_BLANKET_PROMO_DISPATCHES) {
    assert.match(dispatch.href, /^\/beach-commons\/v8/);
    assert.match(dispatch.image, /^\/beach-commons\/v8\/products\/.+\.webp$/);
    assert.ok(dispatch.shareCopy.includes('https://pointcast.xyz/'));
    assert.ok(dispatch.copy.length >= 100);
    await access(new URL(`public${dispatch.image}`, root));
  }

  const linkedin = promotion.BEACH_BLANKET_PROMO_DISPATCHES.find(
    (dispatch) => dispatch.channel === 'LinkedIn',
  );
  assert.match(linkedin.shareCopy, /\$99\.99 sand kit/);
  assert.match(linkedin.shareCopy, /\$99\.96 layer lab/);
  assert.match(linkedin.shareCopy, /PointCast earns \$0/);
  assert.match(linkedin.shareCopy, /utm_source=linkedin/);
});

test('the promotion desk is a full post with product imagery and useful interaction', () => {
  assert.match(share, /A BLANKET[\s\S]*IS A TINY[\s\S]*PUBLIC ROOM/);
  assert.match(share, /You brought a blanket\. Did you bring a floor\?/);
  assert.match(share, /data-copy-dispatch/);
  assert.match(share, /data-native-share/);
  assert.match(share, /navigator\.clipboard/);
  assert.match(share, /navigator\.share/);
  assert.match(share, /COVERAGE LADDER/);
  assert.match(share, /Four people\. One hundred dollars\. One floor\./);
  assert.match(share, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal((share.match(/\/beach-commons\/v8\/products\/\$\{id\}\.webp/g) || []).length, 1);
});

test('the coverage ladder uses official routes and does not promise Yahoo or earned coverage', () => {
  assert.equal(promotion.BEACH_BLANKET_COVERAGE_PATHS.length, 6);
  const paths = new Map(
    promotion.BEACH_BLANKET_COVERAGE_PATHS.map((path) => [path.id, path]),
  );

  assert.equal(paths.get('yahoo-creators').url, 'https://creators.yahoo.com/apply');
  assert.match(paths.get('yahoo-creators').boundary, /10,000 combined followers/);
  assert.match(paths.get('patch').boundary, /self-publishing/);
  assert.match(paths.get('designboom').boundary, /not the merchant product photographs/);
  assert.equal(paths.get('apartment-therapy').fit, 'after a field test');
  assert.match(paths.get('laist').boundary, /facts and evidence/);
  assert.match(promotion.BEACH_BLANKET_PROMOTION_CAMPAIGN.note, /no live event/i);
  assert.match(promotion.BEACH_BLANKET_PROMOTION_CAMPAIGN.note, /promised coverage/i);
});

test('the promotion packet is machine-readable and nested in the review JSON', () => {
  assert.match(shareJson, /promotion-packet\/v1/);
  assert.match(shareJson, /BEACH_BLANKET_COVERAGE_PATHS/);
  assert.match(shareJson, /Access-Control-Allow-Origin/);
  assert.match(shareJson, /do not guarantee independent coverage/);
  assert.match(shareJson, /Third-party publications should request their own merchant permissions/);
  assert.match(reviewJson, /BEACH_BLANKET_PROMOTION_CAMPAIGN/);
  assert.match(reviewJson, /coveragePaths/);
  assert.match(reviewJson, /promotion desk and coverage ladder/);
});

test('the campaign runs across the public ad network without advertising to itself', () => {
  assert.match(registry, /BEACH_BLANKET_PROMOTION_CAMPAIGN/);
  assert.equal((registry.match(/id: blanketDispatch\.id/g) || []).length, 1);
  assert.match(registry, /isBeachBlanketSurface/);
  assert.match(registry, /isBeachBlanketSurface \? undefined : blanketCreative/);
  assert.match(registry, /BEACH_BLANKET_PROMOTION_CAMPAIGN/);
  assert.match(desk, /FULL PROMOTION CAMPAIGN/);
  assert.match(desk, /OPEN THE PROMOTION DESK/);
  assert.match(receipt, /BEACH_BLANKET_PROMOTION_CAMPAIGN/);
});

test('discovery, press, and agent surfaces expose the promotion packet', () => {
  assert.match(agents, /beachBlanketPromotionDesk/);
  assert.match(agents, /beachBlanketPromotionPacket/);
  assert.match(forAgents, /<code>\/beach-commons\/v8\/share<\/code>/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v8\/share'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v8\/share\.json'/);
  assert.match(llms, /PC-BEACH-BLANKET-REVIEW-2026/);
  assert.match(llmsFull, /four copy-ready LinkedIn, X, newsletter, and press/);
  assert.match(press, /Promotion desk, copy-ready dispatches, and coverage ladder/);
});
