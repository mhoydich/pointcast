import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server, registry, onRequest;
before(async () => {
  server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  ({ onRequest } = await server.ssrLoadModule('/functions/api/open-press/recent.ts'));
  ({ default: registry } = await server.ssrLoadModule('/src/data/contracts.json'));
});
after(() => server.close());

function recent(method = 'GET') {
  return onRequest({ request: new Request('https://pointcast.xyz/api/open-press/recent', { method }) });
}

test('unconfigured and write requests do not contact TzKT', async (t) => {
  const saved = registry.openPress.mainnet;
  t.after(() => { registry.openPress.mainnet = saved; });
  registry.openPress.mainnet = '';
  const fetch = t.mock.method(globalThis, 'fetch', () => assert.fail('unexpected TzKT read'));

  const response = await recent();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
  assert.equal((await recent('POST')).status, 405);
  assert.equal(fetch.mock.callCount(), 0);
});

test('configured feed reads the newest mint transfers and reports upstream failures', async (t) => {
  const address = 'KT1S3BkgEQsW62vqkuatueUhzcTqkTfb4EXs';
  const saved = registry.openPress.mainnet;
  t.after(() => { registry.openPress.mainnet = saved; });
  registry.openPress.mainnet = address;
  const rows = [{ tokenId: '3', mintedBy: 'tz1-reader', editions: '10000', timestamp: '2026-11-21T00:00:00Z' }];
  const fetch = t.mock.method(globalThis, 'fetch', () => Response.json(rows));

  const response = await recent();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), rows);
  const [url] = fetch.mock.calls[0].arguments;
  assert.equal(url.origin + url.pathname, 'https://api.tzkt.io/v1/tokens/transfers');
  assert.equal(url.searchParams.get('token.contract'), address);
  assert.equal(url.searchParams.get('from.null'), 'true');
  assert.ok(url.searchParams.get('select').split(',').includes('to.address as mintedBy'));
  assert.equal(url.searchParams.get('sort.desc'), 'id');
  assert.equal(url.searchParams.get('limit'), '20');
  fetch.mock.mockImplementation(() => new Response(null, { status: 429 }));
  assert.equal((await recent()).status, 502);
});
