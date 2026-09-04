import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

async function withModule(path, run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    return await run(await server.ssrLoadModule(path));
  } finally {
    await server.close();
  }
}

test('Pages daily status proxies the scheduled worker rather than inspecting Pages email bindings', async () => {
  await withModule('/functions/api/kennel-club/daily/status.ts', async ({ dailyStatusResponse }) => {
    let requested = '';
    const response = await dailyStatusResponse({
      SEND_EMAIL: {},
      KENNEL_DAILY: {
        async fetch(input) {
          requested = String(input);
          return Response.json({
            ok: true,
            configured: true,
            ready: true,
            state: 'available',
            lastRun: { day: '2026-09-04', sent: 12 },
            providerAcceptance: { attempted: 12, accepted: 12, failed: 0 },
            deliveryOutcome: { state: 'unknown' },
          });
        },
      },
    });
    assert.equal(response.status, 200);
    assert.equal(requested, 'https://kennel-daily.internal/status');
    const body = await response.json();
    assert.equal(body.source, 'kennel-daily-service-binding');
    assert.equal(body.lastRun.day, '2026-09-04');
    assert.equal(body.providerAcceptance.accepted, 12);
    assert.equal(body.deliveryOutcome.state, 'unknown');
  });
});

test('Pages daily status reports an unbound or unreachable worker as unavailable', async () => {
  await withModule('/functions/api/kennel-club/daily/status.ts', async ({ dailyStatusResponse }) => {
    const unbound = await dailyStatusResponse({ SEND_EMAIL: {} });
    assert.equal(unbound.status, 503);
    assert.equal((await unbound.json()).reason, 'kennel-daily-service-not-bound');
    const unreachable = await dailyStatusResponse({ KENNEL_DAILY: { async fetch() { throw new Error('down'); } } });
    assert.equal(unreachable.status, 502);
    const body = await unreachable.json();
    assert.equal(body.state, 'unavailable');
    assert.equal(body.lastRun, null);
  });
});

test('scheduled worker status separates provider acceptance from unknown inbox delivery', async () => {
  await withModule('/workers/kennel-daily/src/index.ts', async ({ default: worker }) => {
    const db = {
      prepare(sql) {
        assert.match(sql, /FROM kennel_daily_runs/);
        return {
          async first() {
            return { day: '2026-09-04', attempted: 10, sent: 8, failed: 2, dry_run: 0, configured: 1 };
          },
        };
      },
    };
    const response = await worker.fetch(new Request('https://daily.internal/status'), {
      AUTH_DB: db,
      SEND_EMAIL: { async send() {} },
      KENNEL_DAILY_DRY_RUN: 'false',
    });
    const body = await response.json();
    assert.equal(body.ready, true);
    assert.deepEqual(body.providerAcceptance, { accepted: 8, failed: 2, attempted: 10 });
    assert.equal(body.deliveryOutcome.state, 'unknown');
    assert.match(body.deliveryOutcome.note, /does not establish inbox delivery/);
  });
});

test('status source, binding config, and collect UI preserve the authoritative boundary', async () => {
  const [source, config, collect] = await Promise.all([
    readFile(new URL('functions/api/kennel-club/daily/status.ts', root), 'utf8'),
    readFile(new URL('wrangler.toml', root), 'utf8'),
    readFile(new URL('src/pages/collect.astro', root), 'utf8'),
  ]);
  assert.doesNotMatch(source, /env\.(?:SEND_EMAIL|AUTH_DB)/);
  assert.match(source, /env\.KENNEL_DAILY\.fetch/);
  assert.match(config, /binding = "KENNEL_DAILY"\s+service = "pointcast-kennel-daily"/);
  assert.match(collect, /data-daily-readiness/);
  assert.match(collect, /Inbox delivery is not independently verified/);
});
