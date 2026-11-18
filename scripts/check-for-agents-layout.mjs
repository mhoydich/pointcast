// Serve dist locally, then run this check against its origin.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PROGRESS_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright-core');
const url = new URL('/for-agents/', process.argv[2] || 'http://localhost:4321');
const browser = await chromium.launch({ executablePath: process.env.PROGRESS_CHROMIUM_PATH });

try {
  for (const width of [320, 375, 390, 768, 1280]) {
    const page = await browser.newPage({
      viewport: { width, height: 844 },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const response = await page.goto(url.href);
    assert.equal(response.status(), 200);
    await page.evaluate(() => document.fonts.ready);

    const table = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Purpose' }) });
    const bounds = await table.evaluate(element => {
      const { left, right } = element.getBoundingClientRect();
      const column = element.closest('section').getBoundingClientRect();
      return { left, right, columnLeft: column.left, columnRight: column.right,
        pageWidth: document.documentElement.scrollWidth };
    });
    assert.equal(bounds.pageWidth, width, `Page overflows at ${width}px`);
    assert.ok(bounds.left >= bounds.columnLeft - 1 && bounds.right <= bounds.columnRight + 1,
      `Channels table exceeds its column at ${width}px`);
    assert.ok(await table.getByRole('link', { name: '/c/front-door' }).isVisible());
    console.log(`${width}px · page ${bounds.pageWidth}px · Channels table x=${bounds.left}–${bounds.right}`);
    await page.close();
  }
} finally {
  await browser.close();
}
