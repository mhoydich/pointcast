import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'vite';

async function withMiddleware(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(await server.ssrLoadModule('/functions/_middleware.ts'));
  } finally {
    await server.close();
  }
}

for (const { file, start, end } of [
  { file: 'welcome.m4a', start: 0, end: 1 },
  { file: 'garden-gentle.m4a', start: 8192, end: 8447 },
]) {
  test(`native ${file} range requests bypass HTML directory rewriting`, async (t) => {
    const fetches = [];
    t.mock.method(globalThis, 'fetch', async (input) => {
      fetches.push(String(input));
      assert.fail(`An audio request must not internally fetch a rewritten URL: ${input}`);
    });
    await withMiddleware(async ({ onRequest }) => {
      const asset = readFileSync(new URL(`../public/audio/starjam/${file}`, import.meta.url));
      const bytes = asset.subarray(start, end + 1);
      const url = `https://pointcast.xyz/audio/starjam/${file}`;
      const request = new Request(url, {
        method: 'GET',
        headers: {
          Accept: '*/*',
          Range: `bytes=${start}-${end}`,
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
        },
      });
      const upstream = new Response(bytes, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': 'audio/mp4',
          'Content-Range': `bytes ${start}-${end}/${asset.byteLength}`,
          'Content-Length': String(bytes.byteLength),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
      let nextCalls = 0;
      const response = await onRequest({
        request,
        env: {},
        next: async (...args) => {
          nextCalls += 1;
          assert.deepEqual(args, [], 'pass the original asset request to Pages');
          assert.equal(request.url, url);
          assert.equal(request.method, 'GET');
          assert.equal(request.headers.get('accept'), '*/*');
          assert.equal(request.headers.get('range'), `bytes=${start}-${end}`);
          return upstream;
        },
        waitUntil: () => assert.fail('audio assets must not trigger page-visit logging'),
      });
      assert.equal(nextCalls, 1);
      assert.deepEqual(fetches, [], `never fetch /audio/starjam/${file}/`);
      assert.equal(response, upstream, 'preserve the native media response without HTML transformation');
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('content-type'), 'audio/mp4');
      assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${asset.byteLength}`);
      assert.equal(response.headers.get('content-length'), String(bytes.byteLength));
      assert.equal(response.headers.get('accept-ranges'), 'bytes');
      assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    });
  });
}
