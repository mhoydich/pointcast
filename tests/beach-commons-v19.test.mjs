import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import {
  BEACH_COMMONS_V19,
  BEACH_SEATS,
  POCKET_SEATS,
  POCKET_SEATS_INTRO,
  POCKET_SEATS_SHORTLIST,
  POCKET_SEAT_TESTS,
  ROOM_LAYOUTS,
} from '../src/lib/beach-commons-v19.ts';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const allSeats = [...BEACH_SEATS, ...POCKET_SEATS];
const sourceHostsByMaker = {
  'REI Co-op': ['www.rei.com'],
  'Tommy Bahama': ['www.tommybahama.com'],
  Helinox: ['helinox.com', 'guides.helinox.com'],
  Kelty: ['kelty.com'],
  'GCI Outdoor': ['gcioutdoor.com'],
  Coleman: ['www.coleman.com'],
  NUMANU: ['numanu.com'],
  Hillsound: ['hillsound.com'],
  CLIQ: ['www.cliqproducts.com'],
  NEMO: ['www.nemoequipment.com', 'www.campman.com'],
  KingCamp: ['www.kingcamp.com'],
};

test('V19 has twelve unique seats with usable prices and explicit research fields', () => {
  assert.equal(BEACH_SEATS.length, 6);
  assert.equal(POCKET_SEATS.length, 6);
  assert.equal(new Set(allSeats.map((seat) => seat.id)).size, 12);

  for (const seat of allSeats) {
    assert.match(seat.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const key of ['maker', 'name', 'role', 'packed', 'weight', 'seatHeight', 'capacity', 'description', 'caveat']) {
      assert.equal(typeof seat[key], 'string', `${seat.id}: ${key} is text`);
      assert.ok(seat[key].trim().length > 0, `${seat.id}: ${key} cannot silently disappear`);
    }
    assert.ok(Number.isFinite(seat.priceUsd) && seat.priceUsd > 0, `${seat.id}: positive finite price`);
    assert.ok(Math.abs(seat.priceUsd * 100 - Math.round(seat.priceUsd * 100)) < 1e-8, `${seat.id}: whole cents`);
    const shownPrice = seat.priceLabel.match(/^\$([\d,]+(?:\.\d{2})?)(?:\s|$)/);
    assert.ok(shownPrice, `${seat.id}: price label begins with its USD price`);
    assert.equal(Number(shownPrice[1].replaceAll(',', '')), seat.priceUsd, `${seat.id}: displayed and machine prices agree`);
    assert.equal(new Set(seat.tags).size, seat.tags.length, `${seat.id}: unique tags`);
  }
});

test('Pocket Seats reports packed dimensions and distinguishes weight and capacity evidence', () => {
  for (const seat of POCKET_SEATS) {
    assert.match(seat.packed, /\bin\b/, `${seat.id}: packed dimensions carry a unit`);
    const dimensions = [...seat.packed.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    assert.equal(dimensions.length, /diameter/.test(seat.packed) ? 2 : 3, `${seat.id}: complete disc or box dimensions`);
    assert.ok(dimensions.every((value) => Number.isFinite(value) && value > 0), `${seat.id}: positive dimensions`);
    assert.ok(seat.tags.length > 0 && seat.tags.every((tag) => ['perch', 'backrest', 'lounge'].includes(tag)), `${seat.id}: filterable seating role`);
  }

  for (const seat of allSeats) {
    assert.match(seat.weight, /\d+(?:\.\d+)?\s*(?:lb|oz|g)\b/, `${seat.id}: weight unit`);
    assert.match(seat.weight, /\b(?:packed|product weight|listed)\b/i, `${seat.id}: weight basis is explicit`);
    if (/^Not verified$/i.test(seat.capacity)) continue;
    assert.match(seat.capacity, /^\d+(?:\.\d+)?\s*lb\b/, `${seat.id}: capacity unit`);
    assert.match(seat.capacity, /maker (?:rating|claim)/, `${seat.id}: capacity remains attributed`);
  }

  const moonlite = POCKET_SEATS.find((seat) => seat.id === 'moonlite-elite');
  assert.match(moonlite.weight, /1 lb 7 oz packed.*Campman/);
  assert.match(moonlite.caveat, /1 lb 3 oz minimum/);
  assert.ok(moonlite.sourceUrls.some((url) => new URL(url).hostname === 'www.campman.com'));
  const numanu = POCKET_SEATS.find((seat) => seat.id === 'numanu');
  assert.match(numanu.capacity, /not independently tested/);
});

test('all shopping and supplemental sources stay direct, attributed and free of tracking', () => {
  for (const seat of allSeats) {
    const sources = [seat.url, ...(seat.sourceUrls ?? [])];
    assert.ok(sourceHostsByMaker[seat.maker], `${seat.id}: known source provenance`);
    for (const source of sources) {
      const url = new URL(source);
      assert.equal(url.protocol, 'https:', `${seat.id}: secure source`);
      assert.equal(url.username + url.password, '', `${seat.id}: no embedded credentials`);
      assert.equal(url.search, '', `${seat.id}: plain link without affiliate or campaign parameters`);
      assert.equal(url.hash, '', `${seat.id}: direct product/source document`);
      assert.ok(sourceHostsByMaker[seat.maker].includes(url.hostname), `${seat.id}: maker or named evidence source`);
      assert.notEqual(url.pathname, '/', `${seat.id}: link points to a specific source`);
    }
    if (seat.sourceUrls) assert.ok(seat.sourceUrls.includes(seat.url), `${seat.id}: supplemental evidence retains the product source`);
  }
});

test('the public JSON handler preserves the researched values and provenance', async () => {
  const compiled = await build({
    entryPoints: [fileURLToPath(new URL('../src/pages/beach-commons/v19.json.ts', import.meta.url))],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
  });
  const endpoint = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
  const response = endpoint.GET();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /^application\/json/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  assert.ok(response.headers.get('Link').includes(BEACH_COMMONS_V19.url));
  const packet = await response.json();
  for (const [key, value] of Object.entries(BEACH_COMMONS_V19)) assert.deepEqual(packet[key], value, key);
  assert.deepEqual(packet.beachSeats, BEACH_SEATS);
  assert.deepEqual(packet.pocketSeats.picks, POCKET_SEATS);
  assert.equal(packet.pocketSeats.introduction, POCKET_SEATS_INTRO);
  assert.equal(packet.pocketSeats.firstToTryForPickleball, POCKET_SEATS_SHORTLIST);
  assert.deepEqual(packet.pocketSeats.suggestedFieldTests, POCKET_SEAT_TESTS);
  assert.deepEqual(packet.roomLayouts, ROOM_LAYOUTS);
  assert.deepEqual(packet.pocketSeats.filters.map((filter) => filter.id), [...new Set(POCKET_SEATS.flatMap((seat) => seat.tags))]);
  assert.equal(packet.methodology.researchCheckedAt, BEACH_COMMONS_V19.priceCheckedAt);
  assert.equal(packet.methodology.status, BEACH_COMMONS_V19.testingBoundary);
  assert.equal(packet.methodology.links, BEACH_COMMONS_V19.linkBoundary);
  assert.equal(packet.rights.illustration, BEACH_COMMONS_V19.illustrationBoundary);
});

test('Pocket Seats filters the real catalog, updates its count and restores all cards', async (t) => {
  const page = await read('src/pages/beach-commons/v19.astro');
  const scripts = [...page.matchAll(/<script\b([^>]*\bis:inline\b[^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((match) => match[2].includes('data-pocket-filter'));
  assert.equal(scripts.length, 1, 'exercise the page’s own standalone filter controller');

  // Astro renders these data-driven cards. The fixture supplies the same catalog
  // and public selector contract; only the production script handles the clicks.
  const filters = ['all', 'perch', 'backrest', 'lounge'];
  const dom = new JSDOM(`<!doctype html><main>
    <article id="beach-seat" data-tags="beach">Beach seat outside the filter</article>
    <section id="pocket-seats">
      <div class="pocket-filters" data-pocket-filters>
        ${filters.map((filter) => `<button type="button" data-pocket-filter="${filter}" aria-pressed="${filter === 'all'}"><span>${filter}</span></button>`).join('')}
      </div>
      <p id="pocket-count" aria-live="polite">${POCKET_SEATS.length} seats</p>
      <div class="pocket-grid">
        ${POCKET_SEATS.map((seat) => `<article data-pocket-seat="${seat.id}" data-tags="${seat.tags.join(' ')}">${seat.name}</article>`).join('')}
      </div>
    </section>
  </main>`, { url: BEACH_COMMONS_V19.url, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  dom.window.eval(scripts[0][2]);

  const document = dom.window.document;
  const visibleIds = () => [...document.querySelectorAll('[data-pocket-seat]')]
    .filter((card) => !card.hidden)
    .map((card) => card.dataset.pocketSeat);
  assert.deepEqual(visibleIds(), POCKET_SEATS.map((seat) => seat.id));

  for (const filter of ['perch', 'backrest', 'lounge', 'all', 'perch']) {
    const button = document.querySelector(`[data-pocket-filter="${filter}"]`);
    // A click on the label child also checks that nested button content works.
    button.querySelector('span').click();
    const expectedIds = POCKET_SEATS.filter((seat) => filter === 'all' || seat.tags.includes(filter)).map((seat) => seat.id);
    assert.deepEqual(visibleIds(), expectedIds, `${filter}: exactly the relevant seats remain`);
    assert.equal(button.getAttribute('aria-pressed'), 'true', `${filter}: selected state is exposed`);
    assert.equal(document.querySelectorAll('[data-pocket-filter][aria-pressed="true"]').length, 1);
    const count = document.getElementById('pocket-count');
    assert.equal(Number(count.textContent.match(/\d+/)?.[0]), expectedIds.length, `${filter}: count reflects visible cards`);
    assert.equal(count.getAttribute('aria-live'), 'polite');
    assert.equal(document.getElementById('beach-seat').hidden, false, 'the main beach shortlist remains visible');
  }
});
