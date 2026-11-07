import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PEOPLE_AND_BOTS } from '../src/lib/people-and-bots.mjs';

const page = readFileSync(new URL('../src/pages/people-and-bots/index.astro', import.meta.url), 'utf8');
const jsonRoute = readFileSync(new URL('../src/pages/people-and-bots.json.ts', import.meta.url), 'utf8');
const moduleSource = readFileSync(new URL('../src/lib/people-and-bots.mjs', import.meta.url), 'utf8');
const bundle = `${page}\n${jsonRoute}\n${moduleSource}\n${JSON.stringify(PEOPLE_AND_BOTS)}`;

test('the workshop draft is additive, unledgered, and not a live claim', () => {
  assert.equal(PEOPLE_AND_BOTS.path, '/people-and-bots/');
  assert.equal(PEOPLE_AND_BOTS.status, 'draft');
  assert.equal(PEOPLE_AND_BOTS.block, null);
  assert.equal(existsSync(new URL('../src/content/blocks/people-and-bots.json', import.meta.url)), false);
  assert.match(page, /creativeWorkStatus: 'Draft'/);
  assert.match(page, /Not published by Mike Hoydich/);
  assert.match(page, /Review pending/);
  assert.doesNotMatch(bundle, /Published by Mike Hoydich/);
  assert.equal(page.includes('<form'), false);
  assert.equal(page.includes('mailto:'), false);
  assert.equal(bundle.includes('bots/board'), false);
});

test('Mike’s November 7 requests stay exact quotes, and $20 is not the published price', () => {
  assert.deepEqual(PEOPLE_AND_BOTS.quotes.items, [
    'various ethos and a custom page on pointcast about this',
    'highlight our resources from claude to manus chat midjourney etc',
    'also very wikitwitter publish for posterity and affirmation of effort',
  ]);
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.means, 'for managing twitter accounts');
  assert.equal(PEOPLE_AND_BOTS.quotes.subscription.also, 'of course all the other benefits highlight them');
  assert.match(PEOPLE_AND_BOTS.grokBeyondX.pricing.finding, /Neither official page listed a \$20/);
  assert.doesNotMatch(bundle, /\$20\/(?:month|mo)/);
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
