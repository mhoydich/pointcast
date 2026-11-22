// Run against the built site with HELLO_URL and the repo's browser-test runner.
import assert from 'node:assert/strict';
import { nounFor } from '../src/lib/loom/magic.mjs';
import { renderPortrait } from '../src/lib/nouns-parts.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
  });
  await page.goto(process.env.HELLO_URL || 'http://127.0.0.1:4321/loom/hello/');
  const card = page.locator('li').first();
  const name = await card.locator('figcaption b').innerText();
  const { svg } = renderPortrait(await nounFor(name));
  const picture = card.getByRole('img');
  assert.equal(decodeURIComponent((await picture.getAttribute('src')).split(',')[1]), svg);
  assert.ok(await picture.evaluate(img => img.complete && img.naturalWidth > 0));
  const note = await card.locator('.public-note').innerText();
  assert.match(note, /Your name and post will be public\./);
  assert.match(note, /not a minted token, and names are self-declared\./);
  assert.doesNotMatch(await page.locator('footer').innerText(), /names are self-declared/i);
  const action = card.getByRole('link');
  assert.equal(await action.count(), 1);
  const box = await action.boundingBox();
  assert.ok(box && box.height >= 44 && box.y + box.height <= 844);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.keyboard.press('Tab'); // Loom back link
  await page.keyboard.press('Tab');
  assert.ok(await action.evaluate(a => a === document.activeElement));
  await page.keyboard.press('Enter');
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === '/loom' &&
    url.searchParams.get('to') === '#loom' && url.searchParams.get('compose') === '1');
  console.log('390px Noun card: official artwork, one visible action, keyboard navigation and script-free rendering passed.');
} finally {
  await browser.close();
}
