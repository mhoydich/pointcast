import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const DATA = new URL("../src/lib/noun-battler-annual.ts", import.meta.url);
const PAGE = new URL("../src/pages/noun-battler-annual.astro", import.meta.url);
const JSON_ROUTE = new URL("../src/pages/noun-battler-annual.json.ts", import.meta.url);
const PACIFIC = new URL("../src/pages/noun-battler.astro", import.meta.url);
const DESK = new URL("../src/pages/nouns-nation-battler.astro", import.meta.url);
const FOR_AGENTS = new URL("../src/pages/for-agents.astro", import.meta.url);
const AGENTS_JSON = new URL("../src/pages/agents.json.ts", import.meta.url);
const LLMS = new URL("../public/llms.txt", import.meta.url);
const LLMS_FULL = new URL("../public/llms-full.txt", import.meta.url);

const {
  NOUN_BATTLER_ANNUAL_META,
  NOUN_BATTLER_FIELDS,
  NOUN_BATTLER_GANGS,
  NOUN_BATTLER_HISTORY,
  NOUN_BATTLER_ROLES,
  NOUN_BATTLER_ROUTES,
} = await import(DATA);

const [page, json, pacific, desk, forAgents, agentsJson, llms, llmsFull] = await Promise.all([
  readFile(PAGE, "utf8"),
  readFile(JSON_ROUTE, "utf8"),
  readFile(PACIFIC, "utf8"),
  readFile(DESK, "utf8"),
  readFile(FOR_AGENTS, "utf8"),
  readFile(AGENTS_JSON, "utf8"),
  readFile(LLMS, "utf8"),
  readFile(LLMS_FULL, "utf8"),
]);

test("the annual preserves the verified Battler lineage as substantial editorial history", () => {
  assert.equal(NOUN_BATTLER_HISTORY.length, 8);
  assert.match(NOUN_BATTLER_HISTORY[0].body, /Strike, Guard, and Focus/);
  assert.match(NOUN_BATTLER_HISTORY[2].body, /four-match-per-day double round robin/);
  assert.match(NOUN_BATTLER_HISTORY.at(-1).body, /48-battler set/);
  for (const entry of NOUN_BATTLER_HISTORY) {
    assert.ok(entry.title.length >= 25);
    assert.ok(entry.body.length >= 180);
    assert.ok(entry.routes.length >= 2);
  }
});

test("the scouting book mirrors the playable eight gangs, five roles, and eight fields", async () => {
  assert.deepEqual(
    NOUN_BATTLER_GANGS.map((gang) => gang.short),
    ["TN", "CF", "GN", "GS", "PU", "NA", "SP", "MC"],
  );
  assert.equal(NOUN_BATTLER_ROLES.length, 5);
  assert.equal(NOUN_BATTLER_FIELDS.length, 8);
  assert.equal(new Set(NOUN_BATTLER_GANGS.map((gang) => gang.id)).size, 8);
  for (const gang of NOUN_BATTLER_GANGS) {
    assert.ok(gang.scouting.length >= 65);
    await access(
      new URL(`../public/games/nouns-nation-battler/assets/noun-${gang.noun}.svg`, import.meta.url),
    );
  }
});

test("three original editorial plates are checked in, compressed, credited, and described", async () => {
  assert.equal(NOUN_BATTLER_ANNUAL_META.plates.length, 3);
  for (const plate of NOUN_BATTLER_ANNUAL_META.plates) {
    assert.match(plate.path, /^\/noun-battler-annual\/plates\/.+\.jpg$/);
    assert.ok(plate.alt.length >= 140);
    const path = new URL(`../public${plate.path}`, import.meta.url);
    await access(path);
    const info = await stat(path);
    assert.ok(info.size > 500_000, `${plate.name} should retain full editorial detail`);
    assert.ok(info.size < 1_000_000, `${plate.name} should stay below one megabyte`);
  }
  assert.match(page, /Original PointCast generator-made plate/);
  assert.match(page, /poster-image series workflow/);
});

test("the magazine is interactive, printable, and honest about the projection boundary", () => {
  assert.match(page, /data-matchup-lab/);
  assert.match(page, /data-run-tape/);
  assert.match(page, /runProjection/);
  assert.match(page, /does not write to the real league table/i);
  assert.match(page, /no saved state · no wagering/i);
  assert.match(page, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(page, /@media print/);
  assert.match(page, /@type": "Article"/);
  assert.match(page, /@type": "ItemList"/);
  assert.match(json, /editorial-history\/v1/);
  assert.match(json, /Access-Control-Allow-Origin/);
});

test("every room named by the annual is a checked-in PointCast surface", async () => {
  assert.equal(NOUN_BATTLER_ROUTES.length, 7);
  for (const route of NOUN_BATTLER_ROUTES) {
    assert.match(route.path, /^\/[a-z0-9-/]+\/?$/);
    const clean = route.path.replace(/\/$/, "");
    const astro = new URL(`../src/pages${clean}.astro`, import.meta.url);
    const html = new URL(`../public${route.path}index.html`, import.meta.url);
    await assert.doesNotReject(async () => {
      try {
        await access(astro);
      } catch {
        await access(html);
      }
    });
  }
});

test("the annual is discoverable from both Battler families and agent surfaces", () => {
  assert.match(pacific, /href="\/noun-battler-annual"/);
  assert.match(desk, /href="\/noun-battler-annual"/);
  assert.match(forAgents, /<code>\/noun-battler-annual<\/code>/);
  assert.match(agentsJson, /nounBattlerAnnual: 'https:\/\/pointcast\.xyz\/noun-battler-annual'/);
  assert.match(agentsJson, /nounBattlerAnnual: 'https:\/\/pointcast\.xyz\/noun-battler-annual\.json'/);
  assert.match(llms, /Machine\s+twin: \/noun-battler-annual\.json/);
  assert.match(llmsFull, /three-round duel[\s\S]*eight-gang 30-v-30 Nouns Nation[\s\S]*league/);
});
