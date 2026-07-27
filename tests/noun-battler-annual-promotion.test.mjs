import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const promotion = await import(new URL("src/lib/noun-battler-annual-promotion.ts", root));

const [home, homeStyles, registry, desk, receipt, share, shareJson, annualJson, agents, forAgents, llms, llmsFull] =
  await Promise.all([
    readFile(new URL("src/pages/index.astro", root), "utf8"),
    readFile(new URL("src/styles/front-door-fresh.css", root), "utf8"),
    readFile(new URL("src/lib/open-ad-network.ts", root), "utf8"),
    readFile(new URL("src/pages/ads.astro", root), "utf8"),
    readFile(new URL("src/pages/ads.json.ts", root), "utf8"),
    readFile(new URL("src/pages/noun-battler-annual/share.astro", root), "utf8"),
    readFile(new URL("src/pages/noun-battler-annual/share.json.ts", root), "utf8"),
    readFile(new URL("src/pages/noun-battler-annual.json.ts", root), "utf8"),
    readFile(new URL("src/pages/agents.json.ts", root), "utf8"),
    readFile(new URL("src/pages/for-agents.astro", root), "utf8"),
    readFile(new URL("public/llms.txt", root), "utf8"),
    readFile(new URL("public/llms-full.txt", root), "utf8"),
  ]);

test("the annual gets three coherent, copy-ready sports-desk dispatches", async () => {
  assert.equal(promotion.NOUN_BATTLER_ANNUAL_CAMPAIGN.creativeCount, 3);
  assert.equal(promotion.NOUN_BATTLER_PROMO_DISPATCHES.length, 3);
  assert.equal(
    new Set(promotion.NOUN_BATTLER_PROMO_DISPATCHES.map((dispatch) => dispatch.id)).size,
    3,
  );

  for (const dispatch of promotion.NOUN_BATTLER_PROMO_DISPATCHES) {
    assert.match(dispatch.href, /^\/noun-battler-annual/);
    assert.match(dispatch.image, /^\/noun-battler-annual\/plates\/.+\.jpg$/);
    assert.ok(dispatch.shareCopy.includes("https://pointcast.xyz/noun-battler-annual"));
    assert.ok(dispatch.copy.length >= 100);
    await access(new URL(`public${dispatch.image}`, root));
  }
});

test("the homepage runs a professional top-of-edition annual feature", () => {
  assert.match(home, /battle-record-splash/);
  assert.match(home, /Now on the newsstand/);
  assert.match(home, /Read the interactive annual/);
  assert.match(home, /NOUN_BATTLER_ANNUAL_META\.plates\[0\]\.path/);
  assert.match(home, /mainEntity:[\s\S]*NOUN_BATTLER_ANNUAL_META\.canonical/);
  assert.match(homeStyles, /\.battle-record-splash__scorebug/);
  assert.match(homeStyles, /@media \(max-width: 600px\)[\s\S]*\.battle-record-splash__bottomline/);
  assert.match(homeStyles, /grid-template-columns: minmax\(0, 1fr\) auto/);
});

test("the opening-week campaign is public, contextual, and pinned without self-advertising", () => {
  assert.match(registry, /NOUN_BATTLER_ANNUAL_CAMPAIGN/);
  assert.equal((registry.match(/id: dispatch\.id/g) || []).length, 1);
  assert.match(registry, /isNounBattlerAnnualSurface/);
  assert.match(registry, /annualCreative/);
  assert.match(registry, /isNounBattlerAnnualSurface \? undefined : annualCreative/);
  assert.match(
    promotion.NOUN_BATTLER_ANNUAL_CAMPAIGN.note,
    /no paid media, odds, wagering, wallet action, or saved league result/i,
  );
  assert.match(desk, /OPENING-WEEK SPORTS DESK CAMPAIGN/);
  assert.match(desk, /READ THE BATTLE RECORD/);
  assert.match(desk, /OPEN THE SHARE KIT/);
  assert.match(receipt, /NOUN_BATTLER_ANNUAL_CAMPAIGN/);
});

test("the promotion desk is interactive, machine-readable, and explicit about boundaries", () => {
  assert.match(share, /data-copy-dispatch/);
  assert.match(share, /data-native-share/);
  assert.match(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard/);
  assert.match(share, /0 ODDS \/ 0 WAGERS/);
  assert.match(share, /Context, never visitor behavior/);
  assert.match(share, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(shareJson, /promotion-packet\/v1/);
  assert.match(shareJson, /Access-Control-Allow-Origin/);
  assert.match(shareJson, /Aggregate impressions and clicks; no visitor identifiers or profiles/);
  assert.match(annualJson, /NOUN_BATTLER_PROMO_DISPATCHES/);
  assert.match(annualJson, /NOUN_BATTLER_PROMO_LINKS/);
});

test("agents and language-model manifests expose the promotion packet", () => {
  assert.match(agents, /nounBattlerAnnualPromotionDesk/);
  assert.match(agents, /nounBattlerAnnualPromotionPacket/);
  assert.match(forAgents, /<code>\/noun-battler-annual\/share<\/code>/);
  assert.match(forAgents, /<code>\/noun-battler-annual\/share\.json<\/code>/);
  assert.match(llms, /Promotion desk and CORS-open packet/);
  assert.match(llmsFull, /copy-ready sports-desk dispatches/);
});
