import assert from 'node:assert/strict';
import test from 'node:test';
import { callEnvironment, postCallAnswer, readCallAsks } from '../public/loom/call/call.mjs';
import { handleLoom } from '../src/lib/loom/service.mjs';

const pointcast = 'https://pointcast.xyz';
const live = callEnvironment(pointcast);
const parent = 'm_parent123';
const staticTarget = `loom:${'a'.repeat(24)}#${parent}`;
const feed = (needsYes) => Response.json({ ok: true, owner: '@mike', piles: { needsYes } });

test('reads the real Loom For You feed anonymously and uses only canonical ask links', async () => {
  const preview = callEnvironment('https://rawcdn.githack.com');
  assert.deepEqual(preview, { endpoint: `${pointcast}/api/loom`, canPost: false });
  const ask = { snippet: 'NEEDS MIKE · pick the label', from: { name: 'Art desk' }, label: '#officenoun-tasks', link: staticTarget, url: 'https://unrelated.example/' };
  const asks = await readCallAsks(preview.endpoint, async (url, options) => {
    assert.equal(url, `${pointcast}/api/loom?for=mike&format=json`);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.method, undefined);
    return feed([ask, ask]);
  });
  assert.deepEqual(asks, [{
    target: staticTarget, text: ask.snippet, source: 'Art desk · #officenoun-tasks',
    url: `${pointcast}/loom?to=${encodeURIComponent(staticTarget)}`,
  }]);
  assert.deepEqual(await readCallAsks(live.endpoint, async () => feed([])), []);
  await assert.rejects(readCallAsks(live.endpoint, async () => new Response(null, { status: 503 })), /read failed/);
  await assert.rejects(readCallAsks(live.endpoint, async () => feed([{ ...ask, link: 'javascript:alert(1)' }])), /Invalid Loom ask/);
});

test('one public answer lands under the chosen original message through the Loom service', async () => {
  const entries = new Map();
  const kv = {
    get: async (key) => entries.get(key) ?? null,
    put: async (key, value) => { entries.set(key, value); },
  };
  const callApi = (input, options) => handleLoom(new Request(new URL(input, pointcast), options), {
    kv, clock: () => new Date('2026-11-17T18:25:00Z'), firstHelloEnabled: false,
  });
  const placeAsk = async (to, label) => {
    const response = await callApi('/api/loom', {
      method: 'POST',
      body: JSON.stringify({ to, from: { name: 'Art desk', kind: 'agent' }, kind: 'note', body: `NEEDS MIKE · ${label} · reply here` }),
    });
    assert.equal(response.status, 201);
    return response.json();
  };
  const board = '#officenoun-tasks';
  const first = await placeAsk(board, 'pick the label');
  const second = await placeAsk(board, 'check the copy');
  const asks = await readCallAsks(live.endpoint, callApi);
  assert.equal(asks.length, 2);
  const picked = asks.find((ask) => ask.target === first.address);
  const receipt = await postCallAnswer(live, { target: picked.target, name: ' Mike ', body: 'Yes' }, callApi);
  const thread = await (await callApi(`/api/loom?to=${encodeURIComponent(board)}`)).json();
  const replies = thread.messages.filter((message) => message.kind === 'answer');
  assert.equal(replies.length, 1);
  assert.equal(replies[0].body, 'Yes');
  assert.equal(replies[0].parent, first.message.id);
  assert.notEqual(replies[0].parent, second.message.id);
  assert.deepEqual(replies[0].from, { name: 'Mike', kind: 'human', verified: false });
  assert.equal(receipt, `${pointcast}/loom?to=${encodeURIComponent(`loom:${thread.log.key}#${replies[0].id}`)}`);
});

test('rejects preview writes, missing names, and a receipt for the wrong parent', async () => {
  const checkNoRequest = () => assert.fail('Invalid action must not call the Loom');
  const answer = { target: staticTarget, name: 'Mike', body: 'A short reply' };
  await assert.rejects(postCallAnswer(callEnvironment('https://pointcast.xyz.example'), answer, checkNoRequest), /read-only/);
  await assert.rejects(postCallAnswer(live, { ...answer, name: ' ' }, checkNoRequest), /Invalid Loom answer/);
  await assert.rejects(postCallAnswer(live, answer, async () => Response.json({
    ok: true, address: `loom:${'a'.repeat(24)}#m_receipt01`,
    message: { id: 'm_receipt01', parent: 'm_other123' },
  })), /Unconfirmed Loom answer/);
});

test('call companion explains its manual, decision-only scope and always offers the full inbox', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../public/loom/call/index.html', import.meta.url), 'utf8');
  assert.match(html, /does not connect to, listen to, or transcribe your call/);
  assert.match(html, /Your spoken answers are not posted here/);
  assert.match(html, /Only items marked as needing Mike’s decision appear here/);
  assert.match(html, /href="https:\/\/pointcast.xyz\/loom\/for\/mike">Open Mike’s full Loom inbox/);
  assert.match(html, /This can take up to 12 seconds/);
});

test('an empty decision pile is valid even with messages elsewhere in the inbox', async () => {
  const asks = await readCallAsks('/api/loom', async () => Response.json({
    ok: true, owner: '@mike', piles: { needsYes: [], people: [{ snippet: 'Other conversation' }] },
  }));
  assert.deepEqual(asks, []);
});
