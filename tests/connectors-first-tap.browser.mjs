// Run against a served production build: node tests/connectors-first-tap.browser.mjs http://localhost:4321
// PLAYWRIGHT_MODULE can point to an existing playwright-core install; CHROMIUM_PATH selects Chromium.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, test } from 'node:test';

const base = new URL(process.argv[2] || 'http://localhost:4321');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
let browser;
before(async () => {
  const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

for (const javaScriptEnabled of [true, false]) {
  test(`fresh 390px visitor can tap Open My AI with JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, async (t) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, javaScriptEnabled,
    });
    t.after(() => context.close());
    const page = await context.newPage();
    await page.goto(new URL('/connectors/', base).href);
    await page.evaluate(() => document.fonts.ready);
    const link = page.getByRole('link', { name: /^Open My AI\b/ });
    const result = await link.evaluate((a) => {
      const box = a.getBoundingClientRect();
      const x = Math.floor(box.left + box.width / 2);
      const points = [Math.floor(box.top + box.height / 2), Math.floor(box.bottom) - 2];
      return {
        x, points, scroll: window.scrollY, top: box.top, bottom: box.bottom,
        hits: points.map(y => {
          const target = document.elementFromPoint(x, y);
          return a.contains(target) ? 'link' : target?.outerHTML.slice(0, 100);
        }),
      };
    });
    assert.equal(result.scroll, 0, 'check the initial viewport');
    assert.ok(result.top >= 0 && result.bottom <= 844, 'the full CTA fits on the first screen');
    assert.deepEqual(result.hits, ['link', 'link'], 'both the center and lower edge reach the CTA');
    // A locator click could scroll the CTA away from the fixed bar or retry an intercepted tap.
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
      page.touchscreen.tap(result.x, result.points[0]),
    ]);
    assert.equal(response?.status(), 200, 'the first tap loads the profile document');
    assert.match(response.headers()['content-type'], /text\/html/);
    const destination = new URL(page.url());
    assert.equal(destination.origin, base.origin);
    assert.match(destination.pathname, /^\/me\/?$/);
    assert.equal(destination.hash, '#my-ai');
    assert.ok(await page.locator('a[name="my-ai"], #my-ai').count(), 'the document contains the native fragment target');
  });
}
