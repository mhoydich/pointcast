import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PEOPLE_AND_BOTS } from '../src/lib/people-and-bots.mjs';

const page = readFileSync(new URL('../src/pages/people-and-bots/index.astro', import.meta.url), 'utf8');
const jsonRoute = readFileSync(new URL('../src/pages/people-and-bots.json.ts', import.meta.url), 'utf8');
const moduleSource = readFileSync(new URL('../src/lib/people-and-bots.mjs', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/layouts/BlockLayout.astro', import.meta.url), 'utf8');
const bundle = `${page}\n${jsonRoute}\n${moduleSource}\n${JSON.stringify(PEOPLE_AND_BOTS)}`;

test('the workshop is approved for publication and does not assert deploy state', () => {
  assert.equal(PEOPLE_AND_BOTS.path, '/people-and-bots/');
  assert.equal(PEOPLE_AND_BOTS.status, 'approved-for-publication');
  assert.equal(Object.hasOwn(PEOPLE_AND_BOTS, 'live'), false);
  assert.equal(PEOPLE_AND_BOTS.block, null);
  assert.equal(existsSync(new URL('../src/content/blocks/people-and-bots.json', import.meta.url)), false);
  assert.match(page, /creativeWorkStatus: 'Approved for publication'/);
  assert.match(page, /creditText: page\.creditText/);
  assert.match(jsonRoute, /approved-for-publication/);
  assert.match(PEOPLE_AND_BOTS.creditText, /Approved for publication by Michael Hoydich on 2026-11-07 at 6:34 PM ET/);
  for (const phrase of ['not yet live', 'already live', 'not-live', '"live"']) {
    assert.equal(bundle.toLowerCase().includes(phrase), false, phrase);
  }
  assert.equal(bundle.includes('Review pending'), false);
  assert.equal(bundle.includes('Not published'), false);
  assert.equal(page.includes('<form'), false);
  assert.equal(page.includes('mailto:'), false);
  assert.equal(bundle.includes('bots/board'), false);
  assert.equal(page.includes('href="/for-agents"'), true);
  const home = readFileSync(new URL('../src/components/HomeStartHere.astro', import.meta.url), 'utf8');
  const agents = readFileSync(new URL('../src/pages/for-agents.astro', import.meta.url), 'utf8');
  const manifest = readFileSync(new URL('../src/pages/agents.json.ts', import.meta.url), 'utf8');
  assert.equal(home.includes('people-and-bots'), false);
  assert.equal(agents.includes('people-and-bots'), false);
  assert.equal(manifest.includes('people-and-bots'), false);
});

test('Michael’s November 7 requests stay exact quotes, and $20 is not the listed price', () => {
  assert.deepEqual(PEOPLE_AND_BOTS.quotes.items, [
    'various ethos and a custom page on pointcast about this',
    'highlight our resources from claude to manus chat midjourney etc',
    'also very wikitwitter publish for posterity and affirmation of effort',
  ]);
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.request, 'request they do the $20 subscription');
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.clarification, 'I meant Grok Bot.');
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.means, 'for managing twitter accounts');
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.also, 'of course all the other benefits highlight them');
  assert.equal(PEOPLE_AND_BOTS.credits.published.quote, 'ok cool publish and let’s keep going check desk');
  assert.equal(PEOPLE_AND_BOTS.credits.published.time, '6:34 PM ET');
  assert.equal(PEOPLE_AND_BOTS.credits.curated.date, '2026-11-07');
  assert.equal(PEOPLE_AND_BOTS.credits.drafted.date, '2026-11-07');
  assert.match(PEOPLE_AND_BOTS.grokBeyondX.pricing.finding, /did not list a \$20/);
  assert.match(PEOPLE_AND_BOTS.grokBeyondX.pricing.finding, /Premium at \$30 per month/);
  assert.match(PEOPLE_AND_BOTS.grokBeyondX.pricing.docs, /existing Cursor, SuperGrok, and X Premium plans continue/);
  assert.doesNotMatch(bundle, /\$20\/(?:month|mo)/);
  assert.doesNotMatch(bundle, /X API credits/);
  assert.equal((JSON.stringify(PEOPLE_AND_BOTS).match(/\$20(?!\d)/g) ?? []).length, 2);
});

test('the shelf names the requested tools and keeps Midjourney human-operated', () => {
  assert.deepEqual(
    PEOPLE_AND_BOTS.resources.map((item) => item.name),
    ['Claude', 'ChatGPT', 'Manus', 'Midjourney', 'Grok Bot'],
  );
  for (const resource of PEOPLE_AND_BOTS.resources) {
    assert.match(resource.boundary, /does not include/i);
    assert.match(resource.boundary, /not shared|does not share|Logins are not shared/i);
  }
  const midjourney = PEOPLE_AND_BOTS.resources.find((item) => item.id === 'midjourney');
  assert.match(midjourney.check, /automated tools/);
  assert.match(midjourney.use, /human-operated/);
});

test('practices, provenance, and Grok Bot benefits are all present', () => {
  assert.deepEqual(
    PEOPLE_AND_BOTS.practices.map((item) => item.id),
    ['civic', 'memory', 'art', 'tezos', 'play', 'fiction'],
  );
  assert.deepEqual(
    PEOPLE_AND_BOTS.provenance.fields.map(([field]) => field),
    ['Title', 'Human owner', 'Date and version', 'Sources', 'Tools', 'Rights', 'Changes', 'Uncertainty'],
  );
  for (const line of ['Human owner:', 'Sources:', 'Tools, and what each one did:', 'Rights and license:', 'Uncertain:']) {
    assert.ok(PEOPLE_AND_BOTS.provenance.template.includes(line), line);
  }
  const benefitTitles = PEOPLE_AND_BOTS.grokBeyondX.benefits.map((item) => item.title);
  for (const title of ['Research', 'Writing', 'Code and a computer', 'Creative work', 'Reminders and routines', 'Connected apps, where supported']) {
    assert.ok(benefitTitles.includes(title), title);
  }
  assert.equal(page.includes('data-copy-provenance'), true);
  assert.equal(page.includes('type="button"'), true);
  assert.match(jsonRoute, /PEOPLE_AND_BOTS_PUBLIC/);
  const doors = PEOPLE_AND_BOTS.practices.find((item) => item.id === 'play').links.find((link) => link.href === '/ten-doors/');
  assert.match(doors.note, /TEN_DOORS_DATE to 2026-11-02/);
  assert.match(doors.note, /src\/lib\/ten-doors\.mjs/);
  assert.equal(PEOPLE_AND_BOTS.documentTitle, 'People and their bots | PointCast');
  assert.equal(PEOPLE_AND_BOTS.documentTitle.includes('—'), false);
  assert.match(page, /documentTitle=\{page\.documentTitle\}/);
  assert.match(layout, /const siteTitle = documentTitle/);
});

test('copy avoids em dashes, private desk material, and vendor or city affiliation', () => {
  assert.equal(bundle.includes('—'), false);
  assert.equal(bundle.includes('–'), false);
  for (const banned of ['cannabis', 'Shwa', 'principles.md', '/workspace', 'inbox/', 'investment return', 'guaranteed']) {
    assert.equal(bundle.toLowerCase().includes(banned.toLowerCase()), false, banned);
  }
  assert.match(PEOPLE_AND_BOTS.standing, /unaffiliated with the City of El Segundo/);
  assert.match(PEOPLE_AND_BOTS.standing, /unaffiliated with Anthropic, OpenAI, Manus, Midjourney, xAI/);
  assert.match(bundle, /does not promise that anyone’s bots are already connected/);
});
