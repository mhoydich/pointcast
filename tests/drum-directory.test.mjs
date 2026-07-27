import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const DATA = new URL("../src/lib/drum-directory.ts", import.meta.url);
const PAGE = new URL("../src/pages/drum-directory.astro", import.meta.url);
const JSON_ROUTE = new URL("../src/pages/drum-directory.json.ts", import.meta.url);
const NAV = new URL("../src/components/DrumNav.astro", import.meta.url);
const ARCADE = new URL("../src/pages/drum-games.astro", import.meta.url);
const FOR_AGENTS = new URL("../src/pages/for-agents.astro", import.meta.url);
const AGENTS_JSON = new URL("../src/pages/agents.json.ts", import.meta.url);
const LLMS = new URL("../public/llms.txt", import.meta.url);
const LLMS_FULL = new URL("../public/llms-full.txt", import.meta.url);
const {
  DRUM_DIRECTORY_CHAPTERS,
  DRUM_DIRECTORY_COUNTS,
  DRUM_DIRECTORY_ENTRIES,
  DRUM_DIRECTORY_META,
  DRUM_RUNNER_EDITIONS,
} = await import(DATA);
const [pageSource, jsonSource, navSource, arcadeSource, forAgentsSource, agentsJsonSource, llmsSource, llmsFullSource] = await Promise.all([
  readFile(PAGE, "utf8"),
  readFile(JSON_ROUTE, "utf8"),
  readFile(NAV, "utf8"),
  readFile(ARCADE, "utf8"),
  readFile(FOR_AGENTS, "utf8"),
  readFile(AGENTS_JSON, "utf8"),
  readFile(LLMS, "utf8"),
  readFile(LLMS_FULL, "utf8"),
]);

test("the directory is a substantial four-chapter editorial, not a five-link reskin", () => {
  assert.deepEqual(DRUM_DIRECTORY_CHAPTERS.map((chapter) => chapter.id), [
    "the-five",
    "nouns",
    "together",
    "after-hours",
  ]);
  assert.ok(DRUM_DIRECTORY_ENTRIES.length >= 30);
  assert.equal(DRUM_DIRECTORY_COUNTS.described, DRUM_DIRECTORY_ENTRIES.length);
  assert.equal(new Set(DRUM_DIRECTORY_ENTRIES.map((entry) => entry.slug)).size, DRUM_DIRECTORY_ENTRIES.length);
  assert.equal(new Set(DRUM_DIRECTORY_ENTRIES.map((entry) => entry.path)).size, DRUM_DIRECTORY_ENTRIES.length);

  for (const entry of DRUM_DIRECTORY_ENTRIES) {
    assert.ok(entry.description.length >= 70, `${entry.name} needs a real description`);
    assert.ok(entry.fieldNote.length >= 100, `${entry.name} needs a reported field note`);
    assert.ok(entry.tags.length >= 3, `${entry.name} needs useful indexing tags`);
  }
});

test("every described game links to a checked-in PointCast page", async () => {
  for (const entry of DRUM_DIRECTORY_ENTRIES) {
    assert.match(entry.path, /^\/[a-z0-9-/]+$/);
    await access(new URL(`../src/pages${entry.path}.astro`, import.meta.url));
  }
});

test("the complete seven-edition Beat Runner lineage stays linked and narrated", async () => {
  assert.deepEqual(DRUM_RUNNER_EDITIONS.map((edition) => edition.version), [
    "v1",
    "v2",
    "v3",
    "v4",
    "v5",
    "v6",
    "v7",
  ]);
  assert.deepEqual(DRUM_RUNNER_EDITIONS.map((edition) => edition.path), [
    "/drum-runner-v1",
    "/drum-runner-v2",
    "/drum-runner-v3",
    "/drum-runner-v4",
    "/drum-runner-v5",
    "/drum-runner-v6",
    "/drum-runner",
  ]);
  for (const edition of DRUM_RUNNER_EDITIONS) {
    assert.ok(edition.premise.length >= 75);
    assert.ok(edition.fieldNote.length >= 75);
    await access(new URL(`../src/pages${edition.path}.astro`, import.meta.url));
  }
});

test("original editorial plates are checked in, compressed, credited, and described", async () => {
  assert.equal(DRUM_DIRECTORY_META.generatedPlates.length, 3);
  for (const plate of DRUM_DIRECTORY_META.generatedPlates) {
    assert.match(plate.path, /^\/drum-directory\/plates\/.+\.jpg$/);
    assert.ok(plate.alt.length >= 100);
    const url = new URL(`../public${plate.path}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size > 200_000, `${plate.name} should contain full editorial artwork`);
    assert.ok(info.size < 1_000_000, `${plate.name} should stay below one megabyte`);
  }
  assert.match(pageSource, /Original generator-made PointCast/);
  assert.match(pageSource, /The visual plates are original generator-made editorial art/);
});

test("every promised play image is a real compressed browser capture", async () => {
  const pictured = DRUM_DIRECTORY_ENTRIES.filter((entry) => entry.screenshot);
  assert.ok(pictured.length >= 10);
  for (const entry of pictured) {
    assert.match(entry.screenshot, /^\/drum-directory\/screenshots\/.+\.jpg$/);
    const url = new URL(`../public${entry.screenshot}`, import.meta.url);
    await access(url);
    const info = await stat(url);
    assert.ok(info.size > 50_000, `${entry.name} capture should contain a real screen`);
    assert.ok(info.size < 300_000, `${entry.name} capture should stay compact`);
  }
});

test("the article exposes human, machine, random-discovery, print, and reduced-motion surfaces", () => {
  assert.match(pageSource, /@type": "Article"/);
  assert.match(pageSource, /@type": "ItemList"/);
  assert.match(pageSource, /href: "\/drum-directory\.json"/);
  assert.match(pageSource, /data-surprise/);
  assert.match(pageSource, /scrollIntoView\(\{ behavior: "smooth"/);
  assert.match(pageSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(pageSource, /@media print/);
  assert.match(jsonSource, /editorial-directory\/v1/);
  assert.match(jsonSource, /Access-Control-Allow-Origin/);
});

test("the shared Drum navigation makes the directory discoverable", () => {
  assert.match(navSource, /\['directory', '\/drum-directory'\]/);
  assert.match(arcadeSource, /href="\/drum-directory"/);
  assert.match(forAgentsSource, /<code>\/drum-directory<\/code>/);
  assert.match(agentsJsonSource, /drumDirectory: 'https:\/\/pointcast\.xyz\/drum-directory'/);
  assert.match(llmsSource, /Machine twin: \/drum-directory\.json/);
  assert.match(llmsFullSource, /Beat Runner v1[\s\S]*through v7 history/);
});
