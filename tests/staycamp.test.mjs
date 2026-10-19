import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planWater } from '../src/lib/staycamp-planner.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const data = read('src/data/staycamp.ts');
const deck = read('src/data/staycamp-deck.ts');
const layout = read('src/layouts/StaycampLayout.astro');
const pages = ['staycamp.astro', 'staycamp/planner.astro', 'staycamp/deck.astro', 'staycamp/porch.astro', 'staycamp/launch.astro'].map((p) => read(`src/pages/${p}`));

test('four people for fourteen days need 56 gallons and six extra starter-kit jugs', () => {
  assert.deepEqual(planWater(4, 14), { gallons: 56, jugs: 12, baseJugs: 6, extraJugs: 6, kit: 'The Fortnight' });
  assert.match(data, /four people for 14 days need at least 56 gallons, so add 6 more 5-gallon jugs/);
});

test('weekend and week plans round capacity up without pretending five gallons is a week', () => {
  assert.deepEqual(planWater(2, 3), { gallons: 6, jugs: 2, baseJugs: 2, extraJugs: 0, kit: 'The Weekender' });
  assert.deepEqual(planWater(5, 7), { gallons: 35, jugs: 7, baseJugs: 6, extraJugs: 1, kit: 'The Fortnight' });
  assert.equal(planWater(1, 7).gallons, 7);
});

test('every selectable household receives at least one gallon per person-day', () => {
  for (let people = 1; people <= 12; people++) {
    for (const days of [3, 7, 14]) {
      const plan = planWater(people, days);
      assert.equal(plan.gallons, people * days);
      assert.ok(plan.jugs * 5 >= people * days);
      assert.ok((plan.baseJugs + plan.extraJugs) * 5 >= people * days);
      assert.ok((plan.jugs - 1) * 5 < people * days);
    }
  }
});

test('invalid counts cannot silently yield an undersized water recommendation', () => {
  for (const people of [0, -1, 13, 1.5, NaN, Infinity, '4']) assert.throws(() => planWater(people, 14), RangeError);
  for (const days of [0, -1, 4, 3.5, NaN, Infinity, '14']) assert.throws(() => planWater(4, days), RangeError);
});

test('planner uses the tested calculation and does not credit household tank water', () => {
  assert.match(pages[1], /planWater\(n, days\)/);
  assert.match(pages[1], /Household tanks and bathtubs are not included/);
  assert.doesNotMatch(pages[1], /name="tank"/);
});

test('all five routes include the shared safety sources and indoor-combustion warning', () => {
  for (const page of pages) assert.match(page, /<StaycampLayout\b/);
  assert.match(layout, /Portable gas camp stoves and charcoal grills are outdoors only/);
  assert.match(layout, /more than 20 feet from doors, windows and vents/);
  assert.match(layout, /safetySources\.map/);
  const sources = [...data.matchAll(/url: '(https:[^']+)'/g)].map((m) => new URL(m[1]));
  assert.equal(sources.length, 6);
  for (const source of sources) assert.ok(['www.cdc.gov', 'www.fda.gov', 'www.foodsafety.gov'].includes(source.hostname));
});

test('supper cards retain temperature safeguards and reject unsafe leftover instructions', () => {
  assert.match(deck, /Discard thawed perishables held above 40°F \(4°C\) for more than two hours/);
  assert.match(deck, /Do not keep cooked rice overnight at room temperature/);
  assert.match(deck, /Portable gas camp stoves and charcoal grills are outdoors only/);
  const copy = [data, deck, ...pages].join('\n');
  for (const phrase of ['Cook outdoors or by an open window', 'Whatever thawed gets cooked', 'Yesterday’s rice', 'sized for one person-week each', 'it never freezes them', 'before anything with a flame comes in']) {
    assert.ok(!copy.includes(phrase), `unsafe copy returned: ${phrase}`);
  }
});

test('printable neighbour materials retain emergency and medicine boundaries', () => {
  const printable = pages[3].split('<section class="wrap sheet"')[1].split('<section class="wrap section no-print">')[0];
  assert.match(printable, /call 911 or your local emergency number/);
  assert.match(printable, /Medical-device power and medicine storage need a plan with your clinician and supplier/);
  assert.match(printable, /Do not wait for someone to see this sign/);
});
