// Serve public/ locally, then run this script with the origin and an optional screenshot directory.
// PLAYWRIGHT_MODULE and CHROMIUM_PATH can point to an existing Playwright and Chromium install.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = new URL(process.argv[2] || 'http://127.0.0.1:8000').origin;
assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'Use a local static server');
const screenshotDir = process.argv[3];
if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

try {
  for (const width of [390, 1280]) {
    const phone = width === 390;
    const page = await browser.newPage({
      viewport: { width, height: 844 }, isMobile: phone, hasTouch: phone,
      reducedMotion: phone ? 'reduce' : 'no-preference',
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let nextResponse = 'hold';
    const held = Promise.withResolvers();
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin || request.method() !== 'GET') {
        errors.push(request.method() + ' ' + url.href);
        return route.abort();
      }
      if (request.isNavigationRequest() && request.frame() === page.mainFrame() && url.href === origin + '/') {
        // Verify the exit without including the homepage's assets in the sketch audit.
        return route.fulfill({ contentType: 'text/html', body: '<title>PointCast home</title>' });
      }
      if (url.pathname === '/atlas/blocks-atlas.json') {
        if (nextResponse === 'hold') {
          await held.promise;
        } else if (nextResponse === 'error') {
          return route.fulfill({ status: 503, body: 'Atlas unavailable' });
        } else if (nextResponse === 'no points') {
          return route.fulfill({ json: { ok: true, points: [] } });
        }
      }
      return route.continue();
    });

    const card = page.locator('#state-card');
    const title = page.locator('#state-title');
    const matches = page.locator('#matches a');
    async function expectState(state, text) {
      await page.locator('#state-card[data-state="' + state + '"]').waitFor({ state: 'attached' });
      if (text) {
        assert.equal(await title.innerText(), text);
        assert((await page.locator('#announcement').textContent()).includes(text));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    async function action(name) {
      const button = card.getByRole('button', { name, exact: true });
      const box = await button.boundingBox();
      assert(box && box.width >= 44 && box.height >= 44, name + ' should have a finger-sized target');
      if (phone) await button.tap();
      else await button.click();
    }
    async function capture(name) {
      if (screenshotDir && phone) await page.screenshot({ path: join(screenshotDir, name + '-390.png') });
    }

    await Promise.all([
      page.waitForRequest(request => new URL(request.url()).pathname === '/atlas/blocks-atlas.json'),
      page.goto(origin + '/sketches/pointcast-loading/', { waitUntil: 'commit' }),
    ]);
    await expectState('loading', 'Loading the atlas…');
    assert.equal(await page.locator('#search-input').inputValue(), 'Moon orchard');
    assert.equal(await page.getByText('No matching blocks', { exact: true }).count(), 0);
    assert.equal(await matches.count(), 0);
    const artwork = page.locator('#flame-view');
    assert.equal(await artwork.getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#announcement').getAttribute('role'), 'status');
    const kit = await page.request.get(origin + '/loom/kit/flame.mjs');
    const hasKit = kit.ok() && /javascript/.test(kit.headers()['content-type'] || '');
    async function expectFlame(state) {
      if (hasKit) await artwork.locator('figure[data-state="' + state + '"] canvas').waitFor();
      else {
        const still = artwork.locator('img:visible');
        await still.evaluate(image => image.decode());
        assert((await still.getAttribute('src')).endsWith('flame-' + state + '.png'));
      }
    }
    await expectFlame('steady');
    if (phone) {
      // Reduced motion should settle to the same pixels while the request is still pending.
      await page.waitForTimeout(350);
      const first = await artwork.screenshot();
      await page.waitForTimeout(200);
      assert.deepEqual(await artwork.screenshot(), first);
    }
    const replayTop = (await page.locator('#replay').boundingBox()).y;
    await capture('loading');
    nextResponse = 'normal';
    held.resolve();
    await expectState('empty', 'No matching blocks');
    assert.equal(await matches.count(), 0);
    await expectFlame('embers');
    if (phone) await page.waitForTimeout(350); // Let the kit's reduced-motion crossfade settle.
    assert(Math.abs((await page.locator('#replay').boundingBox()).y - replayTop) <= 1);
    await capture('empty');
    await action('Clear search');
    await expectState('results');
    assert.equal(await page.locator('#search-input').inputValue(), '');
    const link = matches.first();
    await link.waitFor();
    assert.match(await link.getAttribute('href'), /^\/b\/[\w-]+\/?$/);
    assert((await link.innerText()).trim());

    nextResponse = 'error';
    await page.getByRole('button', { name: 'Replay loading', exact: true }).click();
    await expectState('error', 'Atlas unavailable');
    assert.equal(await matches.count(), 0);
    nextResponse = 'normal';
    await action('Try again');
    await page.waitForFunction(() => ['results', 'empty'].includes(document.querySelector('#state-card').dataset.state));
    if (await card.getAttribute('data-state') === 'empty') await action('Clear search');
    await expectState('results');
    await matches.first().waitFor();
    nextResponse = 'no points';
    await page.getByRole('button', { name: 'Replay loading', exact: true }).click();
    await expectState('empty', 'No blocks yet');
    assert.equal(await matches.count(), 0);
    await expectFlame('embers');
    if (phone) await page.waitForTimeout(350);
    await capture('no-blocks');
    await action('Open PointCast');
    await page.waitForURL(origin + '/');
    assert.deepEqual(errors, []);
    console.log(width + 'px: loading, no matches, results, retry and genuinely empty atlas passed');
    await page.close();
  }
} finally {
  await browser.close();
}
