import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createServer } from 'vite';

async function withMiddleware(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(
      await server.ssrLoadModule('/functions/_middleware.ts'),
      await server.ssrLoadModule('/src/lib/server/starjam-audio-range.ts'),
    );
  } finally {
    await server.close();
  }
}

const welcomeBytes = readFileSync(new URL('../public/audio/starjam/welcome.m4a', import.meta.url));
const backingBytes = readFileSync(new URL('../public/audio/starjam/garden-gentle.m4a', import.meta.url));

function assetResponse(bytes = welcomeBytes, { status = 200, headers = {}, body = bytes } = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'audio/mp4',
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'no-store, max-age=0',
      ETag: '"starjam-original"',
      ...headers,
    },
  });
}

function assetRequest({ range, ifRange, file = 'welcome.m4a', method = 'GET', pathname } = {}) {
  return new Request(`https://pointcast.xyz${pathname || `/audio/starjam/${file}`}`, {
    method,
    headers: {
      Accept: '*/*',
      ...(range === undefined ? {} : { Range: range }),
      ...(ifRange === undefined ? {} : { 'If-Range': ifRange }),
    },
  });
}

async function route(onRequest, request, upstream) {
  let calls = 0;
  const response = await onRequest({
    request,
    env: {},
    next: async (...args) => { calls++; assert.deepEqual(args, []); return upstream; },
    waitUntil: () => assert.fail('audio requests do not log HTML visits'),
  });
  assert.equal(calls, 1);
  return response;
}

test('Pages full 200 audio responses become exact prefix, offset, suffix and open ranges', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => assert.fail('range handling must not fetch another URL'));
  await withMiddleware(async ({ onRequest }) => {
    for (const { bytes, file, range, start, end } of [
      { bytes: welcomeBytes, file: 'welcome.m4a', range: 'bytes=0-1', start: 0, end: 1 },
      { bytes: welcomeBytes, file: 'welcome.m4a', range: 'bytes=0-63', start: 0, end: 63 },
      { bytes: backingBytes, file: 'garden-gentle.m4a', range: 'bytes=8192-8447', start: 8192, end: 8447 },
      { bytes: welcomeBytes, file: 'welcome.m4a', range: 'bytes=-64', start: welcomeBytes.length - 64, end: welcomeBytes.length - 1 },
      { bytes: welcomeBytes, file: 'welcome.m4a', range: `bytes=${welcomeBytes.length - 17}-`, start: welcomeBytes.length - 17, end: welcomeBytes.length - 1 },
      { bytes: welcomeBytes, file: 'welcome.m4a', range: 'bytes=9-999999', start: 9, end: welcomeBytes.length - 1 },
      { bytes: welcomeBytes, file: 'welcome.m4a', range: 'bytes=-999999', start: 0, end: welcomeBytes.length - 1 },
    ]) {
      const response = await route(onRequest, assetRequest({ file, range }), assetResponse(bytes));
      assert.equal(response.status, 206, range);
      assert.equal(response.headers.get('content-type'), 'audio/mp4');
      assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${bytes.length}`);
      assert.equal(response.headers.get('content-length'), String(end - start + 1));
      assert.equal(response.headers.get('accept-ranges'), 'bytes');
      assert.equal(response.headers.get('etag'), '"starjam-original"');
      assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
      assert.equal(response.headers.get('x-pointcast-tezos-session-bridge'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(start, end + 1));
    }
  });
});

test('unsatisfiable and reversed ranges return empty 416 with representation length', async () => {
  await withMiddleware(async ({ onRequest }) => {
    for (const range of [`bytes=${welcomeBytes.length}-`, 'bytes=999999-9999999', 'bytes=-0', 'bytes=63-0']) {
      const response = await route(onRequest, assetRequest({ range }), assetResponse());
      assert.equal(response.status, 416, range);
      assert.equal(response.headers.get('content-range'), `bytes */${welcomeBytes.length}`);
      assert.equal(response.headers.get('content-length'), '0');
      assert.equal((await response.arrayBuffer()).byteLength, 0);
    }
  });
});

test('only a matching strong If-Range tag permits partial bytes', async () => {
  await withMiddleware(async ({ onRequest }) => {
    for (const ifRange of ['"different-recording"', 'W/"starjam-original"', 'Mon, 14 Sep 2026 12:00:00 GMT']) {
      const response = await route(onRequest, assetRequest({ range: 'bytes=0-1', ifRange }),
        assetResponse(welcomeBytes, { headers: { 'Last-Modified': 'Mon, 14 Sep 2026 12:00:00 GMT' } }));
      assert.equal(response.status, 200, ifRange);
      assert.equal(response.headers.get('content-range'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), welcomeBytes);
    }
    const response = await route(onRequest,
      assetRequest({ range: 'bytes=0-1', ifRange: '"starjam-original"' }), assetResponse());
    assert.equal(response.status, 206);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), welcomeBytes.subarray(0, 2));
  });
});

test('unsupported, multipart and malformed ranges retain the complete response', async () => {
  await withMiddleware(async ({ onRequest }) => {
    for (const range of ['seconds=0-1', 'bytes=0-1,5-9', 'bytes=-', 'bytes=word-12', 'bytes=0-1junk', 'bytes=9007199254740993-']) {
      const response = await route(onRequest, assetRequest({ range }), assetResponse());
      assert.equal(response.status, 200, range);
      assert.equal(response.headers.get('content-range'), null);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), welcomeBytes);
    }
  });
});

test('ordinary GET and HEAD advertise ranges without slicing the response', async () => {
  await withMiddleware(async ({ onRequest }) => {
    const response = await route(onRequest, assetRequest(), assetResponse());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.equal(response.headers.get('content-length'), String(welcomeBytes.length));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), welcomeBytes);
    const head = await route(onRequest, assetRequest({ method: 'HEAD', range: 'bytes=0-1' }), assetResponse(welcomeBytes, { body: null }));
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('accept-ranges'), 'bytes');
    assert.equal(head.headers.get('content-length'), String(welcomeBytes.length));
    assert.equal(head.headers.get('content-range'), null);
    assert.equal(head.body, null);
  });
});

test('range fallback leaves other paths, methods, encodings, types, statuses and sizes untouched', async () => {
  await withMiddleware(async (_, { withStarjamAudioRange }) => {
    for (const options of [
      { request: { pathname: '/audio/starjam/unknown.m4a' } },
      { request: { pathname: '/another/welcome.m4a' } },
      { request: { method: 'POST' } },
      { headers: { 'Content-Type': 'application/octet-stream' } },
      { headers: { 'Content-Type': 'text/html' } },
      { headers: { 'Content-Encoding': 'gzip' } },
      { headers: { 'Content-Length': String(512 * 1024 + 1) } },
      { headers: { 'Content-Length': '0' } },
      { headers: { 'Content-Length': 'not-a-length' } },
      { headers: { 'Content-Length': '9007199254740993' } },
      { status: 404 },
      { status: 503 },
    ]) {
      const upstream = assetResponse(welcomeBytes, options);
      const response = await withStarjamAudioRange(assetRequest({ range: 'bytes=0-1', ...options.request }), upstream);
      assert.equal(response, upstream, JSON.stringify(options));
      assert.equal(upstream.bodyUsed, false, 'unmatched responses are never read');
    }
    const missingLength = assetResponse();
    missingLength.headers.delete('content-length');
    assert.equal(await withStarjamAudioRange(assetRequest({ range: 'bytes=0-1' }), missingLength), missingLength);
  });
});

test('an actual body larger than its declared bounded length cancels without returning partial audio', async () => {
  await withMiddleware(async (_, { withStarjamAudioRange }) => {
    let cancelled = false;
    const body = new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(12)); },
      cancel() { cancelled = true; },
    });
    const upstream = assetResponse(Buffer.alloc(4), { body });
    const response = await withStarjamAudioRange(assetRequest({ range: 'bytes=0-1' }), upstream);
    assert.equal(response.status, 502);
    assert.equal(cancelled, true);
    assert.equal(response.headers.get('content-range'), null);
    assert.match(await response.text(), /unavailable/i);
  });
});

test('a truncated full body cannot be relabeled as a successful partial response', async () => {
  await withMiddleware(async (_, { withStarjamAudioRange }) => {
    const upstream = assetResponse(Buffer.alloc(12), { body: Buffer.alloc(4) });
    const response = await withStarjamAudioRange(assetRequest({ range: 'bytes=0-1' }), upstream);
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('content-range'), null);
    assert.match(await response.text(), /unavailable/i);
  });
});

test('an upstream body read failure returns a controlled unavailable response', async () => {
  await withMiddleware(async (_, { withStarjamAudioRange }) => {
    const body = new ReadableStream({ start(controller) { controller.error(new Error('upstream disconnected')); } });
    const response = await withStarjamAudioRange(assetRequest({ range: 'bytes=0-1' }), assetResponse(Buffer.alloc(4), { body }));
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('content-range'), null);
    assert.match(await response.text(), /unavailable/i);
  });
});

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
