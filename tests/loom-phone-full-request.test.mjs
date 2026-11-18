import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const spec = 'pointcast.loom/v1';
const key = '0123456789abcdef01234567';
const id = 'm_abcdef';
const target = `loom:${key}#${id}`;
const body = 'First line <em>as posted</em>.\n\nThe final condition must remain visible.';
const item = (id, snippet) => ({ id, link: `loom:${key}#${id}`, snippet });

test('a truncated gate reads its exact original on demand, handles failures, and reuses a successful read', async (t) => {
  const html = await readFile(new URL('../public/loom/phone/index.html', import.meta.url), 'utf8');
  const { window } = new JSDOM(html, { url: 'https://pointcast.xyz/loom/phone/' });
  globalThis.document = window.document;
  globalThis.location = window.location;
  t.after(() => {
    delete globalThis.document;
    delete globalThis.location;
    window.close();
  });

  const reads = [];
  let respond;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.method ?? 'GET', 'GET');
    const query = new URL(url, location).searchParams;
    if (query.has('for')) return Response.json({
      ok: true, spec, owner: '@mike',
      piles: { needsYes: [item(id, 'First line…'), item('m_short1', 'Short ask')] },
      activity: { replies: [item('m_reply1', 'Reply…')] },
    });
    if (query.get('to') === '#officenoun-tasks') return Response.json({
      ok: true, spec, log: { address: '#officenoun-tasks', key }, messages: [],
    });
    reads.push(query.get('to'));
    return new Promise((resolve) => { respond = resolve; });
  });

  await import('../public/loom/phone/screen.mjs');
  await setImmediate();
  assert.equal(document.querySelectorAll('article details').length, 1);
  const details = document.querySelector('#gates article details');
  const preview = details.parentElement.querySelector('.question');
  const link = details.nextElementSibling;
  assert.equal(link.textContent, 'Open thread');
  assert.equal(link.href, `https://pointcast.xyz/loom?to=${encodeURIComponent(target)}`);
  assert.equal(reads.length, 0);

  async function toggle(open) {
    const changed = new Promise((resolve) => details.addEventListener('toggle', resolve, { once: true }));
    details.open = open;
    await changed;
  }
  const source = { ok: true, spec, log: { key }, messages: [{ id, body }] };
  for (const failed of [
    new Response(null, { status: 503 }),
    Response.json({ ...source, log: { key: 'different-log' } }),
    Response.json({ ...source, messages: [{ id: 'm_other1', body }] }),
    Response.json({ ...source, messages: [{ id, body, hidden: true }] }),
    Response.json({ ...source, messages: [{ id, body, withdrawn: true }] }),
  ]) {
    await toggle(true);
    respond(failed);
    await setImmediate();
    assert.match(details.textContent, /Couldn’t load/);
    assert.equal(preview.hidden, false);
    await toggle(false);
  }

  await toggle(true);
  await toggle(false);
  await toggle(true);
  assert.equal(reads.length, 6);
  respond(Response.json({ ...source, messages: [{ id: 'm_other1', body: 'A different note.' }, { id, body }] }));
  await setImmediate();
  assert.equal(details.querySelector('p').textContent, body);
  assert.equal(details.querySelector('em'), null);
  assert.equal(preview.hidden, true);
  await toggle(false);
  assert.equal(preview.hidden, false);
  assert.equal(details.querySelector('summary').textContent, 'Read full request');
  await toggle(true);
  assert.equal(details.querySelector('p').textContent, body);
  assert.deepEqual(reads, Array(6).fill(target));
});
