/** Run with node using the same Playwright and Chromium overrides as check-loom-task-status-browser.mjs. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PROGRESS_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright-core');
const contentTypes = { html: 'text/html', mjs: 'text/javascript', css: 'text/css' };
const record = (id, seq, body) => ({
  id, seq, body, at: '2026-01-01T00:00:00Z', from: { name: 'Reader', kind: 'human' },
});

let roomRead = 'initial';
let finishOldRead;
const server = createServer(async (request, response) => {
  const { pathname, searchParams } = new URL(request.url, 'http://localhost');
  if (pathname === '/api/loom' && request.method === 'GET') {
    const address = searchParams.get('to');
    if (address === '#grokbot' && roomRead === 'failed') return response.writeHead(503).end();
    if (address === '#grokbot' && roomRead === 'delayed') {
      finishOldRead = () => response.writeHead(503).end();
      return;
    }
    const messages = address === '#grokbot'
      ? [record('m_first', 1, 'First record'), record('m_selected', 2, roomRead === 'updated' ? 'Updated record' : 'Selected record')]
      : [record('m_other', 1, 'Other room record')];
    return response.writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ ok: true, log: { address, key: '1234567890abcdef12345678' }, messages }));
  }

  const asset = pathname === '/loom/studies/' ? 'index.html' : /^\/loom\/studies\/([\w.-]+)$/.exec(pathname)?.[1];
  const type = contentTypes[asset?.split('.').pop()];
  if (request.method !== 'GET' || !type) return response.writeHead(404).end();
  try {
    const file = await readFile(new URL('../public/loom/studies/' + asset, import.meta.url));
    response.writeHead(200, { 'Content-Type': type }).end(file);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PROGRESS_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const fetchRoom = window.fetch.bind(window);
    window.fetch = async (url, options) => {
      // Let the delayed fixture reach the stale-request guard even after navigation aborts it.
      if (window.allowOldRead && url === '/api/loom?to=%23grokbot') {
        const result = await fetchRoom(url, { ...options, signal: undefined });
        window.oldReadCompleted = true;
        return result;
      }
      return fetchRoom(url, options);
    };
  });
  await page.goto(origin + '/loom/studies/?view=line&record=m_selected');

  const waitForText = (id, text) => page.waitForFunction(
    ([id, text]) => document.getElementById(id).textContent === text, [id, text],
  );
  const snapshot = () => page.evaluate(() => ({
    url: location.href,
    body: document.querySelector('#record-body').textContent,
    source: document.querySelector('#record-source').getAttribute('href'),
    selected: document.querySelector('#record-list [aria-current=true]')?.value,
    records: document.querySelector('#record-list').textContent,
  }));
  await waitForText('record-body', 'Selected record');
  const initial = await snapshot();
  assert.equal(initial.selected, 'm_selected');
  const canvas = await page.locator('#study-canvas').elementHandle();
  await page.locator('#transcript summary').tap();

  roomRead = 'failed';
  await page.locator('#refresh').tap();
  await waitForText('refresh-status', 'Refresh failed. Showing the last loaded records. Use Refresh records to retry.');
  assert.deepEqual(await snapshot(), initial);
  assert.ok(await canvas.evaluate(node => node === document.getElementById('study-canvas')));
  assert.ok(await page.locator('#record-list [aria-current=true]').isVisible());
  assert.ok(await page.locator('#record-source').isVisible());

  roomRead = 'updated';
  await page.locator('#refresh').tap();
  await waitForText('refresh-status', 'Records refreshed.');
  const updated = await snapshot();
  assert.equal(updated.body, 'Updated record');
  assert.equal(updated.selected, initial.selected);
  assert.equal(updated.url, initial.url);
  assert.equal(updated.source, initial.source);

  roomRead = 'delayed';
  await page.evaluate(() => { window.allowOldRead = true; });
  const oldRequest = page.waitForRequest(request => request.url().endsWith('/api/loom?to=%23grokbot'));
  await page.locator('#refresh').tap();
  await oldRequest;
  await page.locator('#room').selectOption('#metaverse');
  await waitForText('record-body', 'Other room record');
  const other = await snapshot();
  assert.equal(other.selected, 'm_other');
  assert.equal(new URL(other.url).searchParams.get('room'), '#metaverse');
  finishOldRead();
  await page.waitForFunction(() => window.oldReadCompleted);
  assert.deepEqual(await snapshot(), other);
  assert.equal(await page.locator('#refresh-status').textContent(), '');
  assert.deepEqual(errors, []);
  console.log('PASS: phone refresh preserves the reader, canvas, index and permalink; retry updates the selected record; stale failure leaves the new room intact.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
