import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('Kennel Club ships its room, all per-sitting routes, and JSON twins', async () => {
  for (const path of [
    'src/lib/kennel-club.ts',
    'src/lib/kennel-club-mint.ts',
    'src/components/KennelClubMint.astro',
    'functions/api/kennel-club/mint.ts',
    'src/pages/kennel-club.astro',
    'src/pages/kennel-club.json.ts',
    'src/pages/kennel-club/[slug].astro',
    'src/pages/kennel-club/[slug].json.ts',
    'src/pages/send/kennel-club.astro',
    'src/pages/send/kennel-club.json.ts',
    'src/pages/send/kennel-club.txt.ts',
  ]) assert.ok(exists(path), path);

  const [room, helper, mintHelper, mintComponent, mintApi, plate, plateJson, calendarJson, tezos] = await Promise.all([
    read('src/pages/kennel-club.astro'),
    read('src/lib/kennel-club.ts'),
    read('src/lib/kennel-club-mint.ts'),
    read('src/components/KennelClubMint.astro'),
    read('functions/api/kennel-club/mint.ts'),
    read('src/pages/kennel-club/[slug].astro'),
    read('src/pages/kennel-club/[slug].json.ts'),
    read('src/pages/kennel-club.json.ts'),
    read('src/lib/tezos.ts'),
  ]);
  assert.match(helper, /America\/Los_Angeles/);
  assert.match(helper, /sittingOfTheDay/);
  assert.match(helper, /export function calendar/);
  assert.match(room, /The club opened two days late; the first two dogs were already waiting\./);
  assert.match(room, /KennelClubMint tokenId=\{today\.tokenId\}/);
  assert.match(plate, /KennelClubMint tokenId=\{sitting\.tokenId\}/);
  assert.match(mintComponent, /Mint today&apos;s sitting · 1 ꜩ/);
  assert.match(mintComponent, /https:\/\/pointcast\.xyz\/api\/kennel-club\/mint/);
  assert.doesNotMatch(mintComponent, /https:\/\/api\.tzkt\.io/);
  assert.match(mintApi, /getKennelClubMintSnapshot/);
  assert.match(mintApi, /unavailableKennelClubMintSnapshot/);
  assert.match(mintApi, /max-age=30, s-maxage=30/);
  assert.match(mintComponent, /document\.addEventListener\('click'/);
  assert.doesNotMatch(mintComponent, /\s(?:id|for)=/);
  assert.match(mintHelper, /v1\/contracts\/\$\{KENNEL_CLUB_CONTRACT\}\/storage/);
  assert.match(mintHelper, /v1\/bigmaps\/\$\{supplyBigMap\}\/keys\?key=\$\{tokenId\}/);
  assert.match(calendarJson, /getKennelClubMintState/);
  assert.match(calendarJson, /unavailableKennelClubMintState/);
  assert.match(calendarJson, /liveUrl/);
  assert.match(calendarJson, /snapshotAt/);
  assert.match(helper, /liveUrl/);
  assert.match(helper, /snapshotAt/);
  assert.match(tezos, /mintKennelClubSitting/);
  assert.match(tezos, /\.methods as any\)\.mint\(params\.tokenId\)\.send/);
  assert.match(room, /calendar__grid/);
  assert.match(room, /data-sitting-date/);
  assert.match(room, /imageWidth=\{1024\}/);
  assert.match(plate, /TZIP-21-style metadata/);
  assert.match(plate, /image=\{sitting\.image\.png\}/);
  assert.match(plateJson, /sittingPayload/);
});

test('Kennel Club TzKT reader maps paused storage, today\'s supply, and window without an RPC call', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const { getKennelClubMintState } = await server.ssrLoadModule('/src/lib/kennel-club-mint.ts');
    const requests = [];
    const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
    const state = await getKennelClubMintState(1, {
      now: new Date('2026-09-02T12:00:00Z'),
      fetcher: async (url) => {
        requests.push(url);
        if (url.endsWith('/storage')) return response({ paused: true, price_mutez: '1000000', edition_mode: 'open', supply: 91, windows: 92 });
        if (url.includes('/bigmaps/91/')) return response([{ value: '7' }]);
        if (url.includes('/bigmaps/92/')) return response([{ value: { open_at: '2026-09-02T07:00:00Z', close_at: '2026-09-03T07:00:00Z' } }]);
        throw new Error(`unexpected TzKT URL: ${url}`);
      },
    });
    assert.equal(state.paused, true);
    assert.equal(state.today.tokenId, 1);
    assert.equal(state.today.minted, 7);
    assert.equal(state.today.windowOpen, true);
    assert.equal(requests.length, 3);
    assert.ok(requests.every((url) => url.startsWith('https://api.tzkt.io/')));
  } finally {
    await server.close();
  }
});

test('the September calendar is complete and every plate has a verified image route', async () => {
  const series = JSON.parse(await read('src/data/kennel-club-september-sitting.json'));
  assert.equal(series.sittings.length, 30);
  assert.deepEqual(series.sittings.map((sitting) => sitting.day), Array.from({ length: 30 }, (_, index) => index + 1));
  for (const sitting of series.sittings) {
    assert.equal(sitting.image.status, 'verified');
    assert.ok(exists(`public${sitting.image.png}`), `${sitting.slug} PNG`);
    assert.ok(exists(`public${sitting.image.webp}`), `${sitting.slug} WebP`);
  }
});

test('the front door and send shelf expose today’s sitting', async () => {
  const [home, send, sitemap] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/send-sheets.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
  ]);
  assert.match(home, /title: 'Today’s Sitting', href: '\/kennel-club'/);
  assert.match(home, /tag: 'KENNEL'/);
  assert.match(send, /slug: 'kennel-club'/);
  assert.match(send, /Thirty original dog portrait plates/);
  for (const route of ['/kennel-club', '/kennel-club.json', '/send/kennel-club', '/send/kennel-club.json', '/send/kennel-club.txt']) {
    assert.ok(sitemap.includes(`'https://pointcast.xyz${route}'`), `${route} in discovery sitemap`);
  }
});

test('built Kennel Club routes have a resolved today, 30 calendar records, and plate OG metadata', { skip: !exists('dist/kennel-club.json') && 'run npm run build:bare first' }, async () => {
  const calendar = JSON.parse(await read('dist/kennel-club.json'));
  const sitting = JSON.parse(await read('dist/kennel-club/02-hartley.json'));
  const page = await read('dist/kennel-club/02-hartley/index.html');
  assert.equal(calendar.calendar.length, 30);
  assert.ok(calendar.today?.sitting?.slug, 'today resolves to a sitting');
  assert.equal(calendar.mint.contract, 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq');
  assert.equal(calendar.mint.network, 'mainnet');
  assert.equal(calendar.mint.priceMutez, 1_000_000);
  assert.equal(calendar.mint.edition, 'open');
  assert.equal(typeof calendar.mint.paused, 'boolean');
  assert.equal(calendar.mint.today.tokenId, calendar.today.mint.tokenId);
  assert.equal(typeof calendar.mint.today.windowOpen, 'boolean');
  assert.equal(typeof calendar.mint.today.minted, 'number');
  assert.equal(calendar.mint.liveUrl, 'https://pointcast.xyz/api/kennel-club/mint');
  assert.ok(Date.parse(calendar.mint.snapshotAt), 'calendar mint has a build timestamp');
  assert.equal(sitting.mint.liveUrl, 'https://pointcast.xyz/api/kennel-club/mint');
  assert.ok(Date.parse(sitting.mint.snapshotAt), 'plate mint has a build timestamp');
  assert.equal(sitting.attributes.length, 5, 'TZIP-21-style attributes arrive in the JSON twin');
  assert.match(page, /og:image/);
  assert.match(page, /02-hartley\.png/);
});

test('Kennel Club mint API returns a live 30-token snapshot and a static fallback with mocked TzKT', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const originalFetch = globalThis.fetch;
  try {
    const { onRequestGet } = await server.ssrLoadModule('/functions/api/kennel-club/mint.ts');
    const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
    globalThis.fetch = async (url) => {
      const text = String(url);
      if (text.endsWith('/storage')) return response({ paused: false, price_mutez: '1000000', edition_mode: 'open', supply: 91, windows: 92 });
      if (text.includes('/bigmaps/91/')) return response([{ key: 0, value: '3' }, { key: 1, value: '7' }]);
      if (text.includes('/bigmaps/92/')) return response([{ value: { open_at: '2026-09-01T07:00:00Z', close_at: '2026-10-01T07:00:00Z' } }]);
      throw new Error(`unexpected TzKT URL: ${text}`);
    };
    const live = await onRequestGet({ request: new Request('https://pointcast.xyz/api/kennel-club/mint') });
    const payload = await live.json();
    assert.equal(live.headers.get('access-control-allow-origin'), '*');
    assert.equal(live.headers.get('cache-control'), 'public, max-age=30, s-maxage=30');
    assert.equal(payload.live, true);
    assert.equal(payload.paused, false);
    assert.equal(payload.minted['0'], 3);
    assert.equal(payload.minted['1'], 7);
    assert.equal(Object.keys(payload.minted).length, 30);
    assert.equal(payload.totalMinted, 10);

    globalThis.fetch = async () => { throw new Error('TzKT unavailable'); };
    const fallback = await onRequestGet({ request: new Request('https://pointcast.xyz/api/kennel-club/mint') });
    const fallbackPayload = await fallback.json();
    assert.equal(fallbackPayload.live, false);
    assert.equal(fallbackPayload.paused, true);
    assert.equal(Object.keys(fallbackPayload.minted).length, 30);
    assert.equal(fallbackPayload.totalMinted, 0);
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
