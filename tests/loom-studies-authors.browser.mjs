// Serve public/ locally and run with the existing Playwright/Chromium toolchain.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const url = process.argv[2] || 'http://127.0.0.1:8000/loom/studies/';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const authors = ['Window Desk', 'Archive Desk', ...Array.from({ length: 24 }, (_, i) => 'Desk ' + i)];
  const last = 'Long' + 'name'.repeat(20);
  authors.push(last);
  await page.route('**/api/loom?*', async route => {
    const room = new URL(route.request().url()).searchParams.get('to');
    const names = room === '#grokbot' ? authors : ['New Desk'];
    await route.fulfill({ json: {
      ok: true, log: { address: room },
      messages: names.map((name, i) => ({
        id: 'm_' + i, seq: i + 1, at: '2026-11-18T12:00:00Z',
        from: { kind: 'agent', name }, body: 'Report from ' + name,
      })),
    } });
  });
  await page.goto(url);
  const picker = page.locator('#field-authors');
  const canvas = page.locator('#study-canvas');
  const buttons = picker.getByRole('button');
  await page.locator('#camera:not([hidden])').waitFor();
  await page.locator('#stage-message[hidden]').waitFor({ state: 'attached' });
  assert.equal(await buttons.count(), authors.length);
  assert.ok(await picker.isVisible());
  assert.ok(await picker.evaluate(e => e.scrollHeight > e.clientHeight && e.scrollWidth <= e.clientWidth));
  assert.ok(await buttons.first().evaluate(e => e.clientHeight >= 42));
  const grid = await picker.boundingBox();
  const image = await canvas.boundingBox();
  assert.ok(grid.y + grid.height <= image.y + 1 && image.height >= 190);

  await buttons.nth(1).tap();
  assert.equal(await page.locator('#record-body').innerText(), 'Report from Archive Desk');
  await buttons.last().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#record-author').innerText(), last);
  assert.equal(await buttons.last().getAttribute('aria-pressed'), 'true');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('#prev').tap();
  assert.equal(await buttons.nth(authors.length - 2).getAttribute('aria-pressed'), 'true');

  await page.getByRole('button', { name: /Weave/ }).tap();
  assert.ok(await picker.isHidden());
  await page.getByRole('button', { name: /Field/ }).tap();
  await page.locator('#room').selectOption('#loom');
  await page.locator('#field-authors button', { hasText: 'New Desk' }).waitFor();
  assert.equal(await buttons.count(), 1);
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'true');
  await page.setViewportSize({ width: 1024, height: 844 });
  const desktop = await picker.boundingBox();
  assert.ok(desktop.x + desktop.width <= (await canvas.boundingBox()).x + 1);
  console.log('Field picker checks passed at 390×844 and 1024×844.');
} finally {
  await browser.close();
}
