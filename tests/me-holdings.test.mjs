import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

async function withHoldingsModule(run) {
  const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  try {
    const module = await server.ssrLoadModule('/functions/api/me/_holdings.ts');
    return await run(module);
  } finally {
    await server.close();
  }
}

test('session identity extraction accepts linked Tezos identities only and deduplicates them', async () => {
  await withHoldingsModule(({ tezosIdentities }) => {
    const first = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const second = 'tz2CfwkUFqB9LYwhQ5zu6gH1hgbKYdNwmLQp';
    assert.deepEqual(tezosIdentities([
      { provider: 'google', id: 'person@example.com' },
      { provider: 'kukai', id: first },
      { provider: 'temple', id: second },
      { provider: 'kukai', id: first },
      { provider: 'metamask', id: '0x1234' },
    ]), [first, second]);
  });
});

test('PointCast holdings collections come from the live contract registry', async () => {
  await withHoldingsModule(({ pointCastCollections }) => {
    const addresses = new Map(pointCastCollections().map((collection) => [collection.slug, collection.contract]));
    assert.equal(addresses.get('visit_nouns'), 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh');
    assert.equal(addresses.get('coffee_mugs'), 'KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt');
    assert.equal(addresses.get('kennel_club'), 'KT1JWNAKyiWVsbfNrHBQuuBDaGRBYqfehwdq');
    assert.equal(addresses.has('marketplace'), false);
  });
});

test('wallet holdings normalize TZIP-21 images and cache one snapshot per address', async () => {
  await withHoldingsModule(async ({ getWalletHoldings }) => {
    const address = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const collection = {
      slug: 'visit_nouns',
      name: 'Visit Nouns',
      href: '/visit-nouns',
      contract: 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
      symbol: 'PCVN',
    };
    const stored = new Map();
    const cache = {
      async match(request) { return stored.get(request.url)?.clone(); },
      async put(request, response) { stored.set(request.url, response.clone()); },
    };
    let calls = 0;
    const fetcher = async (url) => {
      calls += 1;
      if (String(url).includes('/count')) return Response.json(4);
      return Response.json([{
        balance: '2',
        token: {
          tokenId: '137',
          metadata: { name: 'Visit Noun #137', displayUri: 'ipfs://ipfs/QmDisplay' },
        },
      }]);
    };

    const first = await getWalletHoldings(address, { collections: [collection], fetcher, cache });
    assert.equal(first.cache, 'miss');
    assert.equal(first.everythingElseCount, 3);
    assert.equal(first.collections[0].tokens[0].thumbnailUrl, 'https://ipfs.io/ipfs/QmDisplay');
    assert.equal(first.collections[0].unitBalance, '2');

    const second = await getWalletHoldings(address, {
      collections: [collection],
      fetcher: async () => { throw new Error('cache was bypassed'); },
      cache,
    });
    assert.equal(second.cache, 'hit');
    assert.equal(calls, 4);
  });
});

test('v1 and v2 seal shelves are keyed by contract plus token id and cached per address', async () => {
  await withHoldingsModule(async ({ getWalletHoldings }) => {
    const address = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const stored = new Map();
    const cache = {
      async match(request) { return stored.get(request.url)?.clone(); },
      async put(request, response) { stored.set(request.url, response.clone()); },
    };
    let sealCalls = 0;
    const fetcher = async (url) => {
      const value = String(url);
      if (value.includes('/tokens/balances/count')) return Response.json(1);
      if (value.includes('/bigmaps/seals/keys')) {
        sealCalls += 1;
        const v2 = value.includes('KT1UVn9CDToAbyoxARLPfNtVkvKgzCwuroy3');
        return Response.json([{ key: '4', value: {
          holder: address,
          kind: v2 ? '73747265616b2d37' : '73686f7765642d7570',
          evidence: v2 ? '736576656e2d64617973' : '6669656c642d72656365697074',
          issuer: 'tz2CfwkUFqB9LYwhQ5zu6gH1hgbKYdNwmLQp',
          attested_at: '2026-09-02T21:30:55Z',
          revoked: v2,
        } }]);
      }
      return Response.json([]);
    };
    const first = await getWalletHoldings(address, { collections: [], fetcher, cache });
    assert.equal(first.sealShelf.state, 'available');
    assert.equal(first.seals.length, 2);
    assert.equal(new Set(first.seals.map((seal) => seal.key)).size, 2);
    assert.equal(first.seals.find((seal) => seal.version === 'v1').evidence, 'field-receipt');
    assert.equal(first.sealShelf.groups.find((group) => group.kind === 'streak-7').revoked, 1);
    const second = await getWalletHoldings(address, { collections: [], fetcher, cache });
    assert.equal(second.seals[0].tokenId, '4');
    assert.equal(sealCalls, 2);
  });
});

test('seal shelf exposes partial and unavailable states instead of claiming an empty shelf', async () => {
  await withHoldingsModule(async ({ getWalletHoldings }) => {
    const address = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const partial = await getWalletHoldings(address, {
      collections: [],
      cache: null,
      fetcher: async (url) => {
        const value = String(url);
        if (value.includes('/tokens/balances/count')) return Response.json(0);
        if (value.includes('KT19DHCY5S9x48npRyAhUCM2SyLWZMNh3yQ1')) return Response.json([]);
        return new Response('down', { status: 503 });
      },
    });
    assert.equal(partial.cache, 'miss');
    assert.equal(partial.sealShelf.state, 'partial');
    assert.equal(partial.sealShelf.contracts[1].state, 'unavailable');

    const unavailable = await getWalletHoldings(address, {
      collections: [],
      cache: null,
      fetcher: async (url) => String(url).includes('/tokens/balances/count')
        ? Response.json(0)
        : new Response('down', { status: 503 }),
    });
    assert.equal(unavailable.cache, 'miss');
    assert.equal(unavailable.sealShelf.state, 'unavailable');
    assert.deepEqual(unavailable.seals, []);
  });
});

test('cache failures do not hide fresh TzKT holdings', async () => {
  await withHoldingsModule(async ({ getWalletHoldings }) => {
    const address = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
    const collection = {
      slug: 'visit_nouns',
      name: 'Visit Nouns',
      href: '/visit-nouns',
      contract: 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh',
      symbol: 'PCVN',
    };
    const cache = {
      async match() { throw new Error('cache read unavailable'); },
      async put() { throw new Error('cache write unavailable'); },
    };
    const fetcher = async (url) => String(url).includes('/count')
      ? Response.json(1)
      : Response.json([{
        balance: '1',
        token: { tokenId: '42', metadata: { name: 'Visit Noun #42' } },
      }]);

    const result = await getWalletHoldings(address, { collections: [collection], fetcher, cache });
    assert.equal(result.cache, 'miss');
    assert.equal(result.collections[0].tokens[0].name, 'Visit Noun #42');
  });
});

test('both private holdings routes share the session gate and never accept a wallet query', async () => {
  const [shared, api, twin] = await Promise.all([
    readFile(new URL('functions/api/me/_holdings.ts', root), 'utf8'),
    readFile(new URL('functions/api/me/holdings.ts', root), 'utf8'),
    readFile(new URL('functions/me.json.ts', root), 'utf8'),
  ]);
  assert.match(shared, /readSessionFromRequest\(request, env\)/);
  assert.match(shared, /private, no-store/);
  assert.match(shared, /caches\.default/);
  assert.doesNotMatch(shared, /searchParams\.get\(['"](?:wallet|address)/);
  assert.match(api, /meHoldingsResponse/);
  assert.match(twin, /meHoldingsResponse/);
});

test('private holdings surface D1 claim streak and the next seal threshold', async () => {
  await withHoldingsModule(async ({ getMeHoldingsPayload }) => {
    const payload = await getMeHoldingsPayload({
      userId: 'pcu_streak',
      preferredName: 'Streak Member',
      identities: [],
      roles: [],
      createdAt: '2026-09-01T00:00:00.000Z',
    }, {
      now: new Date('2026-09-07T16:00:00Z'),
      dogs: Array.from({ length: 7 }, (_, tokenId) => ({
        id: `claim_${tokenId}`,
        tokenId,
        sitting: `Sitting ${tokenId + 1}`,
        status: tokenId === 6 ? 'held' : 'delivered',
        opHash: null,
        deliveredTo: null,
        createdAt: '2026-09-03T00:00:00.000Z',
        seal: { kind: 'showed-up', status: tokenId === 6 ? 'pending_wallet' : 'attested', opHash: null },
      })),
    });
    assert.equal(payload.streak, 7);
    assert.equal(payload.nextSealAt, 30);
  });
});
