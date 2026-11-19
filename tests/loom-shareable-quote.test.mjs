import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const directory = new URL('../public/sketches/shareables/quote/', import.meta.url);
const html = readFileSync(new URL('index.html', directory), 'utf8');
const preview = readFileSync(new URL('quote.png', directory));

test('the quote card fits the portable shareables budget with its preview', () => {
  assert.ok(Buffer.byteLength(html) + preview.length < 60_000);
  assert.match(html, /SPDX-License-Identifier: CC0-1.0/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=|<link\b[^>]*rel="stylesheet"/i);
  assert.match(html, /https:\/\/pointcast\.xyz\/sketches\/shareables\/quote\/quote\.png/);
  assert.deepEqual([...preview.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
  const offline = html.match(/id="save" href="data:image\/png;base64,([^"]+)"/);
  assert.ok(offline, 'the initial picture remains downloadable offline with JavaScript disabled');
  assert.deepEqual(Buffer.from(offline[1], 'base64'), preview);
});

test('the initial HTML includes the attributed excerpt and a link to its original post', () => {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.match(withoutScripts, /Continuous publishing stays on\.\s+Volume is the method\./);
  assert.match(withoutScripts, /X desk/);
  assert.match(withoutScripts, /#loom-ux/i);
  assert.match(withoutScripts, /href="https:\/\/pointcast\.xyz\/loom[^"]*m_4t1d0t5q0y/);
});

const messageId = 'm_4t1d0t5q0y';
const roomKey = '59bd98330ba4e9fadf436bfc';
const publicRoom = {
  ok: true, exists: true,
  log: { address: '#loom-ux', key: roomKey },
  messages: [{ id: messageId, body: 'One line from the desk.', from: { name: 'X desk' } }],
};

function quoteLookup(response) {
  const lookupCode = html.match(/<script id="quote-lookup">([\s\S]*?)<\/script>/)[1];
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => response };
  };
  const read = runInNewContext(lookupCode + '\nread', { URL, fetch });
  return { read, calls };
}

test('topic, modern, Classic and reply links resolve to the same original', async () => {
  const { read, calls } = quoteLookup(publicRoom);
  const canonical = 'https://pointcast.xyz/loom/classic?to=%23loom-ux#' + messageId;
  for (const link of [
    'https://pointcast.xyz/loom/topic/loom-ux#' + messageId,
    'https://pointcast.xyz/loom?to=%23loom-ux#' + messageId,
    canonical,
    'loom:' + roomKey + '#' + messageId,
  ]) {
    const result = await read(link);
    assert.equal(result.source, canonical);
    assert.equal(result.body, publicRoom.messages[0].body);
    assert.equal(result.by, 'X desk');
  }
  assert.equal(calls.length, 4);
  assert.ok(calls.every(({ url, options }) =>
    new URL(url).origin === 'https://pointcast.xyz' && options.method === 'GET' && options.credentials === 'omit'
  ));
});

test('unrelated links, hidden quotes and a mismatched room cannot become a picture', async () => {
  const unrelated = quoteLookup(publicRoom);
  await assert.rejects(unrelated.read('https://example.org/loom/topic/test#' + messageId));
  assert.equal(unrelated.calls.length, 0);
  const modern = 'https://pointcast.xyz/loom?to=%23loom-ux#' + messageId;
  const hidden = { ...publicRoom, messages: [{ ...publicRoom.messages[0], hidden: true }] };
  await assert.rejects(quoteLookup(hidden).read(modern));
  await assert.rejects(quoteLookup({ ...publicRoom, log: { address: '#other' } }).read(modern));
});
