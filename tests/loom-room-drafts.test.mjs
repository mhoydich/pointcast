// Drive the public form and room links. The Loom handler and storage stay local.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { handleLoom } from '../src/lib/loom/service.mjs';

const source = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const body = source.split('<body>')[1].split('<script is:inline>')[0];
const script = source.split('<script is:inline>')[1].split('</script>')[0];
const origin = 'https://pointcast.xyz';
async function waitFor(predicate) {
  const deadline = Date.now() + 4000;
  while (!predicate() && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(predicate(), 'Loom reached the expected UI state');
}

async function view(t) {
  const dom = new JSDOM('<body>' + body + '</body>', { url: origin + '/loom?to=%23loom', runScripts: 'outside-only' });
  const w = dom.window, d = w.document;
  const reads = new Set();
  t.after(async () => {
    // A navigation can trigger directory backfills as well as its own thread read.
    do {
      await Promise.allSettled([...reads]);
      await new Promise(resolve => setImmediate(resolve));
    } while (reads.size);
    w.close();
  });
  const values = new Map();
  const kv = { get: async key => values.get(key) ?? null, put: async (key, value) => values.set(key, value) };
  w.localStorage.setItem('loom.name', 'fixture');
  w.fetch = (path, { signal, ...init } = {}) => {
    const read = handleLoom(new Request(new URL(path, origin), init), { kv });
    reads.add(read);
    return read.finally(() => reads.delete(read));
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.eval(script);
  const input = d.getElementById('bodyInput');
  const submit = id => d.getElementById(id).dispatchEvent(new w.Event('submit', { cancelable: true }));
  async function room(name) {
    d.getElementById('addrInput').value = name;
    submit('addrForm');
    await waitFor(() => d.getElementById('threadTitle').textContent === name.toLowerCase() && !reads.size);
  }
  await waitFor(() => d.querySelector('#msgs [data-act="reply"]'));
  return { w, d, input, submit, room };
}

test('unsent text and reply target belong to one room for this visit', async t => {
  const { w, d, input, room } = await view(t);
  const reply = d.querySelector('#msgs [data-act="reply"]');
  reply.click();
  input.value = '  first line\nsecond line  ';
  await room('#garden');
  assert.equal(input.value, '');
  assert.equal(d.getElementById('replyChip').hidden, true);
  input.value = 'Garden draft';
  await room('#LOOM');
  assert.equal(input.value, '  first line\nsecond line  ');
  assert.equal(d.getElementById('replyChip').hidden, false);
  d.getElementById('replyClear').click();
  input.value = '';
  await room('#garden');
  assert.equal(input.value, 'Garden draft');
  await room('#loom');
  assert.equal(input.value, '');
  assert.equal(d.getElementById('replyChip').hidden, true);
  assert.doesNotMatch(JSON.stringify(w.localStorage), /Garden draft|second line/);
});

for (const outcome of ['accepted', 'declined']) {
  test('delayed ' + outcome + ' send updates only its original room', async t => {
    const { w, d, input, room, submit } = await view(t);
    const originalFetch = w.fetch;
    let finish;
    w.fetch = (url, init) => {
      if (init?.method !== 'POST') return originalFetch(url, init);
      return new Promise(resolve => {
        finish = () => resolve(outcome === 'accepted'
          ? originalFetch(url, init)
          : Response.json({ error: 'store_unbound' }, { status: 503 }));
      });
    };
    input.value = 'Original draft';
    submit('composer');
    assert.equal(typeof finish, 'function');
    await room('#garden');
    input.value = 'New room text';
    finish();
    await waitFor(() => !d.getElementById('sendBtn').disabled);
    assert.equal(input.value, 'New room text');
    assert.equal(d.getElementById('sendStatus').textContent, '');
    await room('#loom');
    assert.equal(input.value, outcome === 'declined' ? 'Original draft' : '');
    await room('#garden');
    assert.equal(input.value, 'New room text');
  });
}

for (const leave of [false, true]) {
  test('recovers the failed reply alongside later typing' + (leave ? ' after leaving its room' : ' in place'), async t => {
    const { w, d, input, room, submit } = await view(t);
    const fetch = w.fetch;
    let fail, writes = 0;
    w.fetch = (url, init) => {
      if (init?.method !== 'POST') return fetch(url, init);
      writes++;
      return new Promise(resolve => { fail = () => resolve(Response.json({ error: 'store_unbound' }, { status: 503 })); });
    };
    const recovery = d.getElementById('draftRecovery');
    const open = d.getElementById('openDraft');
    d.querySelector('#msgs [data-act="reply"]').click();
    const replyName = d.getElementById('replyName').textContent;
    input.value = '  First reply\nwith details  ';
    submit('composer');
    input.value = '  Newer note  ';
    if (leave) { await room('#garden'); input.value = 'Garden text'; }
    fail();
    await waitFor(() => !d.getElementById('sendBtn').disabled);
    if (leave) {
      assert.equal(input.value, 'Garden text');
      assert.equal(recovery.hidden, true);
      assert.equal(d.getElementById('sendStatus').textContent, '');
      await room('#loom');
    } else {
      assert.match(d.getElementById('sendStatus').textContent, /Earlier note not sent/);
    }
    assert.equal(input.value, '  Newer note  ');
    assert.equal(recovery.hidden, false);
    assert.match(d.getElementById('draftPreview').textContent, /Earlier note not sent.*First reply/);
    open.click();
    assert.equal(input.value, '  First reply\nwith details  ');
    assert.equal(d.getElementById('replyChip').hidden, false);
    assert.equal(d.getElementById('replyName').textContent, replyName);
    assert.equal(d.activeElement, input);
    assert.match(d.getElementById('draftPreview').textContent, /Newer note/);
    open.click();
    assert.equal(input.value, '  Newer note  ');
    assert.equal(d.getElementById('replyChip').hidden, true);
    open.click();
    d.getElementById('replyClear').click();
    input.value = '';
    input.dispatchEvent(new w.Event('input'));
    open.click();
    assert.equal(recovery.hidden, true);
    assert.equal(input.value, '  Newer note  ');
    await room('#garden');
    assert.equal(input.value, leave ? 'Garden text' : '');
    await room('#loom');
    assert.equal(input.value, '  Newer note  ');
    assert.equal(recovery.hidden, true);
    assert.equal(writes, 1);
    assert.doesNotMatch(JSON.stringify(w.localStorage), /Newer note|First reply|Garden text/);
  });
}

test('a timeout readback clears only the landed attempt when the next draft has identical text', async t => {
  const { w, d, input, submit } = await view(t);
  const fetch = w.fetch;
  let finish;
  w.fetch = (url, init) => {
    if (init?.method !== 'POST') return fetch(url, init);
    return new Promise((_, reject) => {
      finish = async () => {
        await fetch(url, init);
        reject(new w.DOMException('No response', 'AbortError'));
      };
    });
  };
  input.value = 'Repeated wording';
  submit('composer');
  input.value = 'Repeated wording';
  input.dispatchEvent(new w.Event('input'));
  await finish();
  await waitFor(() => !d.getElementById('draftRecovery').hidden);
  assert.match(d.getElementById('draftPreview').textContent, /Send unconfirmed/);
  await waitFor(() => d.getElementById('sendStatus').textContent.includes('It did post'));
  assert.equal(d.getElementById('draftRecovery').hidden, true);
  assert.equal(input.value, 'Repeated wording');
});
