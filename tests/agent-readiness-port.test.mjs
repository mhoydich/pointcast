import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

async function withChecker(run) {
  const server = await createServer({ root: new URL('../', import.meta.url).pathname, configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(await server.ssrLoadModule('/functions/api/agent-readiness.ts'));
  } finally {
    await server.close();
  }
}

test('agent readiness rejects unsafe schemes and private, loopback, and link-local hosts before fetching', async () => {
  await withChecker(async ({ onRequestGet }) => {
    const originalFetch = globalThis.fetch;
    let fetches = 0;
    globalThis.fetch = async () => {
      fetches += 1;
      throw new Error('unsafe request reached fetch');
    };
    try {
      for (const target of [
        'ftp://example.com', 'http://localhost', 'http://127.0.0.1', 'http://10.0.0.1',
        'http://172.16.0.1', 'http://192.168.1.1', 'http://169.254.169.254', 'http://[::1]',
        'http://[fe80::1]', 'http://[fc00::1]',
      ]) {
        const response = await onRequestGet({ request: new Request(`https://pointcast.xyz/api/agent-readiness?url=${encodeURIComponent(target)}`) });
        assert.equal(response.status, 400, target);
      }
      assert.equal(fetches, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('agent readiness scores the local pointcast.xyz dist without network access', async () => {
  await withChecker(async ({ onRequestGet }) => {
    const originalFetch = globalThis.fetch;
    const files = new Map([
      ['/', ['dist/index.html', 'text/html; charset=utf-8']],
      ['/llms.txt', ['dist/llms.txt', 'text/plain; charset=utf-8']],
      ['/llms-full.txt', ['dist/llms-full.txt', 'text/plain; charset=utf-8']],
      ['/robots.txt', ['dist/robots.txt', 'text/plain; charset=utf-8']],
      ['/agents.json', ['dist/agents.json', 'application/json; charset=utf-8']],
      ['/sitemap-index.xml', ['dist/sitemap-index.xml', 'application/xml; charset=utf-8']],
    ]);
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      assert.equal(url.origin, 'https://pointcast.xyz');
      const entry = files.get(url.pathname);
      if (!entry) return new Response('', { status: 404, headers: { 'content-type': 'text/plain' } });
      return new Response(await readFile(new URL(`../${entry[0]}`, import.meta.url)), { status: 200, headers: { 'content-type': entry[1] } });
    };
    try {
      const response = await onRequestGet({ request: new Request('https://pointcast.xyz/api/agent-readiness?url=https%3A%2F%2Fpointcast.xyz') });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.score, 100);
      assert.equal(payload.grade, 'agent-native');
      assert.equal(payload.earned, payload.possible);
      assert.ok(payload.checks.every((check) => check.passed));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
