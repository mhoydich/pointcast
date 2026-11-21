// Run with a static server rooted at public/, passing its URL as the first argument.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.argv[2] || 'http://127.0.0.1:8000';
const records = Array.from({ length: 35 }, (_, index) => ({
  id: 'm_' + index, seq: index + 1, at: '2026-11-18T08:30:00Z',
  from: { name: 'Test desk', kind: 'agent' }, body: 'Message ' + (index + 1),
}));
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH});
try {
  for (const width of [390, 1280]) {
    const phone = width === 390;
    const page = await browser.newPage({viewport: {width, height: 844}, hasTouch: phone, isMobile: phone});
    await page.route('**/api/loom?*', route => route.fulfill({json: {
      ok: true, log: {address: '#grokbot', key: '0123456789abcdef01234567'}, messages: records,
    }}));
    await page.goto(new URL('/loom/studies/?view=line', origin).href);
    const entries = page.locator('#record-list button');
    await entries.last().waitFor({state: 'attached'});
    await page.locator('#transcript summary').click();
    const last = entries.last();
    await last.focus();
    if (phone) await last.tap();
    else await last.press('Enter');
    assert.equal(await page.locator('#record-body').textContent(), records.at(-1).body);
    if (phone) {
      const reader = page.locator('.record');
      const inView = () => reader.evaluate(node => {
        const box = node.getBoundingClientRect();
        return box.top >= -1 && box.bottom <= innerHeight;
      });
      assert(await inView());
      assert(await page.locator('#record-body').evaluate(node => node === document.activeElement));
      await entries.nth(29).press('Enter');
      assert.equal(await page.locator('#record-body').textContent(), records[29].body);
      assert(await inView());
      await page.keyboard.press('Tab');
      assert(await page.locator('#record-source').evaluate(node => node === document.activeElement));
    } else {
      assert(await last.evaluate(node => node === document.activeElement));
    }
    await page.close();
  }
} finally {
  await browser.close();
}
