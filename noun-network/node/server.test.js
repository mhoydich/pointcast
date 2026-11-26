import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { test } from 'node:test';
import { startNode } from './server.js';

const address = '#same-room';
const local = node => `http://127.0.0.1:${node.port}`;
const lines = (node, since = 0) => get(node, '/lines?' + new URLSearchParams({ to: address, since }));
async function get(node, path) {
  const response = await fetch(local(node) + path);
  assert.equal(response.status, 200);
  return response.json();
}
function post(node, line) {
  return fetch(local(node) + '/lines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(line),
  });
}
async function eventually(check) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await setTimeout(40);
  }
  assert.fail('Nodes did not converge');
}

test('two mDNS nodes converge after independent writes to the same address', async t => {
  const root = await mkdtemp(join(tmpdir(), 'noun-test-'));
  const nodes = [];
  t.after(async () => {
    await Promise.all(nodes.map(node => node.close()));
    await rm(root, { recursive: true, force: true });
  });
  for (const name of ['a', 'b']) {
    nodes.push(await startNode({ directory: join(root, name), port: 0, interval: 50 }));
  }
  const [a, b] = nodes;
  const originals = [];
  for (const [node, body] of [[a, 'First'], [b, 'Second']]) {
    const response = await post(node, { address, sender: 'Test node', body });
    assert.equal(response.status, 201);
    originals.push(await response.json());
    assert.equal(originals.at(-1).seq, 1);
  }
  assert.equal((await post(b, { ...originals[0], body: 'Tampered' })).status, 400);
  await eventually(async () => (await Promise.all(nodes.map(node => lines(node))))
    .every(log => log.length === 2));
  for (const node of nodes) {
    const log = await lines(node);
    assert.deepEqual(log.map(line => line.body).sort(), ['First', 'Second']);
    assert.deepEqual(log.map(line => line.sig).sort(), originals.map(line => line.sig).sort());
    assert.deepEqual(log.map(line => line.seq), [1, 2]);
    assert.deepEqual(await lines(node, 1), [log[1]]);
    assert.deepEqual(await get(node, '/have'), { [address]: 2 });
    assert.equal((await post(node, originals[0])).status, 200);
  }
  await a.close();
  nodes.shift();
  const restarted = await startNode({ directory: join(root, 'a'), port: 0, mdns: false });
  nodes.push(restarted);
  assert.deepEqual(await lines(restarted), [originals[0], { ...originals[1], seq: 2 }]);
  const added = await (await post(restarted, { address, sender: 'Test node', body: 'Third' })).json();
  assert.equal(added.sig.split('.')[0], originals[0].sig.split('.')[0]);
  assert.equal(added.seq, 3);
  const log = await readFile(join(root, 'a', 'lines.jsonl'), 'utf8');
  assert.equal(log.trim().split('\n').length, 3);
});

test('serves TV files and imports Loom appends without duplicates on restart', async t => {
  const root = await mkdtemp(join(tmpdir(), 'noun-bridge-'));
  const tvDirectory = join(root, 'tv');
  await mkdir(tvDirectory);
  await writeFile(join(tvDirectory, 'index.html'), '<title>Test TV</title>');
  let node;
  t.after(async () => {
    await node?.close();
    await rm(root, { recursive: true, force: true });
  });
  const queries = [];
  const options = {
    directory: join(root, 'data'), tvDirectory, port: 0, mdns: false, bridge: [address], interval: 30,
    async fetchJson(url) {
      assert.equal(url.origin + url.pathname, 'https://pointcast.xyz/api/loom');
      assert.equal(url.searchParams.get('to'), address);
      const since = url.searchParams.get('since');
      queries.push(since);
      const ops = since === '0' ? [
        { op: 'append', id: 'm_test', at: '2026-11-25T12:00:00Z', from: { name: 'Loom author' },
          body: 'Artwork', media: { url: 'https://example.com/art.png' } },
        { op: 'hide' },
      ] : [];
      return Response.json({ ok: true, exists: true, spec: 'pointcast.loom/v1', seq: 2, ops,
        log: { key: 'test-log' } });
    },
  };
  node = await startNode(options);
  assert.equal(await (await fetch(local(node))).text(), '<title>Test TV</title>');
  await eventually(() => queries.includes('2'));
  const imported = await lines(node);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].sender, 'Loom: Loom author');
  assert.equal(imported[0].image, 'https://example.com/art.png');
  await node.close();
  queries.length = 0;
  node = await startNode(options);
  await eventually(() => queries.includes('2'));
  assert.deepEqual(await lines(node), imported);
});
