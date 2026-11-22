// Serve the built site, then run this file with the base URL. Uses an existing Playwright install.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.argv[2] || 'http://localhost:4321';
const url = new URL('/sketches/loom-share-cards/', origin).href;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
try {
  const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
  const page = await browser.newPage({ ...phone, reducedMotion: 'reduce' });
  const printedSource = 'pointcast.xyz/sketches/38/#day';
  await page.addInitScript(source => {
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (value, ...args) {
      if (this.canvas.id === 'art' && value === source) this.canvas.dataset.printedSource = source;
      return fillText.call(this, value, ...args);
    };
  }, printedSource);
  await page.goto(url);
  const hashes = new Set();
  for (const kind of ['message', 'day']) {
    await page.locator('[data-kind="' + kind + '"]').tap();
    if (kind === 'day') assert.equal(await page.locator('#art').getAttribute('data-printed-source'), printedSource);
    for (const layout of ['dispatch', 'signal', 'ledger']) {
      await page.locator('[data-layout="' + layout + '"]').tap();
      for (const format of ['landscape', 'portrait']) {
        await page.locator('button[data-format="' + format + '"]').tap();
        const [download] = await Promise.all([
          page.waitForEvent('download'), page.getByRole('link', { name: /Download PNG/ }).tap(),
        ]);
        const png = await readFile(await download.path());
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)],
          format === 'landscape' ? [1200, 675] : [1080, 1350]);
        assert.equal(download.suggestedFilename(), ['loom', layout, kind, format].join('-') + '.png');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
        hashes.add(createHash('sha256').update(png).digest('hex'));
      }
    }
  }
  assert.equal(hashes.size, 12, 'each subject, layout and size has its own output');
  await Promise.all([page.waitForURL('**/sketches/38/index.html#day'), page.locator('#original').tap()]);
  await page.locator('#day:target').waitFor();
  const noscript = await browser.newPage({ ...phone, javaScriptEnabled: false });
  await noscript.goto(url);
  assert.ok(await noscript.locator('#poster').evaluate(img => img.naturalWidth === 1200));
  assert.equal(await noscript.locator('#download').getAttribute('href'), './preview.png');
  console.log('All 12 PNG downloads, the day source and the no-script preview passed at 390px.');
} finally {
  await browser.close();
}
