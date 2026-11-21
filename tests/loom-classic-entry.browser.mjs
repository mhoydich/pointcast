import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.argv[2] || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const log = { address: '#desk', label: '#desk', title: 'The test desk', kind: 'topic' };
const ops = Array.from({ length: 20 }, (_, i) => ({
  op: 'append', seq: i + 1, id: 'm_record' + i, at: '2026-11-18T12:00:00Z',
  from: { name: 'Reader', kind: 'human' }, kind: 'note', body: 'Test note ' + i,
}));

async function visit(width, suffix) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  await page.route('**/api/loom*', route => {
    const isThread = new URL(route.request().url()).searchParams.has('to');
    return route.fulfill({ json: isThread ? { ok: true, log, seq: ops.length, ops } :
      { logs: Array(20).fill(log), network: { logs: 20, kinds: {}, hosts: [] } } });
  });
  await page.goto(new URL('/loom/classic' + suffix, origin).href);
  await page.waitForSelector('[data-logs] a');
  return page;
}
try {
  const mobile = await visit(390, '?to=%23desk');
  const heading = mobile.locator('[data-log-title]');
  assert.equal(await heading.textContent(), log.title);
  assert(await heading.evaluate(el => el === document.activeElement));
  const box = await heading.boundingBox();
  assert(box.y >= -1 && box.y + box.height <= 844);

  const anchored = await visit(390, '?to=%23desk#m_record15');
  const message = await anchored.locator('#m_record15').boundingBox();
  assert(message.y >= 0 && message.y + message.height <= 844);

  for (const [width, path] of [[390, ''], [1440, '?to=%23desk']]) {
    const page = await visit(width, path);
    assert.equal(await page.evaluate(() => window.scrollY), 0);
  }
  console.log('Classic entry passed: 390px deep link, message fragment, directory and desktop.');
} finally {
  await browser.close();
}
