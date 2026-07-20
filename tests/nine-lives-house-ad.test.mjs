import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const advertUrl = new URL('../src/components/TownAdverts.astro', import.meta.url);
const homeUrl = new URL('../src/pages/index.astro', import.meta.url);

test('the PointCast homepage carries an attributed Nine Lives house signal', async () => {
  const [advert, home] = await Promise.all([
    readFile(advertUrl, 'utf8'),
    readFile(homeUrl, 'utf8'),
  ]);

  assert.match(home, /<TownAdverts\s*\/>/);
  assert.match(advert, /HOUSE SIGNAL · ALLWORTHY/);
  assert.match(advert, /One tez\. Nine doors\./);
  assert.match(advert, /One giant kitty\./);
  assert.match(advert, /https:\/\/allworthy\.xyz\/nine-lives\?utm_source=pointcast&amp;utm_medium=house-ad&amp;utm_campaign=nine-lives/);
  assert.match(advert, /target="_blank"/);
  assert.match(advert, /rel="noopener noreferrer"/);
});

test('the Nine Lives house signal keeps the public simulation boundary visible', async () => {
  const advert = await readFile(advertUrl, 'utf8');

  assert.match(advert, /VIEW ONLY · NO WALLET · NO FUNDS MOVE/);
  assert.match(advert, /view-only Tezos distribution experiment/i);
  assert.match(advert, /fictional peer doors/);
  assert.match(advert, /simulated reservoir/);
  assert.doesNotMatch(advert, /\b(?:earn|yield|return|dividend|jackpot)\b/i);
});

test('the art-led placement is responsive, accessible, and motion-safe', async () => {
  const advert = await readFile(advertUrl, 'utf8');

  assert.match(advert, /src="https:\/\/allworthy\.xyz\/nine-lives-og\.png"/);
  assert.match(advert, /alt=""/);
  assert.match(advert, /width="1200"/);
  assert.match(advert, /height="630"/);
  assert.match(advert, /loading="lazy"/);
  assert.match(advert, /Opens Allworthy Nine Lives in a new tab\./);
  assert.doesNotMatch(advert, /aria-label="Enter Allworthy Nine Lives/);
  assert.match(advert, /\.ad:focus-visible/);
  assert.match(advert, /\.ad--nine \.ad__kicker \{ color: #b8321c; \}/);
  assert.match(advert, /@media \(max-width: 720px\)[\s\S]*\.ad--nine/);
  assert.match(advert, /@media \(prefers-reduced-motion: reduce\)/);
});
