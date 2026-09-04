import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { JSDOM } from 'jsdom';

process.env.TZ = 'America/Los_Angeles';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function viteServer() {
  const { createServer } = await import('vite');
  return createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
}

function claimedDom() {
  return new JSDOM(`
    <main data-kennel-claimed-surface>
      <div data-kennel-unclaimed>claim controls</div>
      <span data-kennel-went-home-stamp hidden></span>
      <section data-kennel-holding hidden>
        <p data-kennel-holding-line></p>
        <p data-kennel-holding-summary></p>
        <p data-kennel-holding-where></p>
        <a data-kennel-holding-receipt hidden>receipt</a>
        <a data-kennel-holding-move hidden>move</a>
      </section>
      ${[1, 2, 3, 4, 5].map((day) => `<li data-kennel-claimed-tile data-kennel-day="${day}"><span data-kennel-owner-mark hidden></span></li>`).join('')}
    </main>
  `);
}

const today = {
  spec: 'pointcast.kennel-club-today/v1',
  date: '2026-09-04',
  day: 4,
  tokenId: 3,
  slug: '04-barnaby',
  name: 'Barnaby',
  breed: 'Wirehaired Vizsla',
  title: 'The Fourth Chair',
  wardrobe: 'Club scarf',
  alt: 'Barnaby sits for his portrait.',
  image: { png: '/barnaby.png', webp: '/barnaby.webp' },
  href: '/kennel-club/04-barnaby',
  json: 'https://pointcast.xyz/kennel-club/04-barnaby.json',
  inSeason: true,
  windowOpen: true,
  minted: 4,
  claimsRemaining: 46,
  claimsClaimed: 4,
  live: true,
  updatedAt: '2026-09-04T21:48:00.000Z',
};

const fakeUser = {
  userId: 'user_mike',
  createdAt: '2026-09-01T00:00:00.000Z',
  preferredName: 'Mike Hoydich',
  identities: [{ provider: 'google', id: 'mike@example.test', name: 'Mike', verifiedAt: '2026-09-01T00:00:00.000Z' }],
};

test('claimed-state hydration uses fake today + session APIs and renders the light held card', async () => {
  const server = await viteServer();
  const dom = claimedDom();
  const requests = [];
  const opHash = `o${'1'.repeat(50)}`;
  const collection = {
    collector: { name: 'Mike Hoydich', wallets: [] },
    claimedDays: [1, 2, 3, 4],
    streak: 4,
    completion: { claimed: 4, total: 30 },
    handle: { status: 'claimed', handle: 'mike' },
    claims: [{ tokenId: 3, sitting: 'Barnaby', status: 'held', opHash, deliveredTo: null, createdAt: '2026-09-04T21:41:00.000Z' }],
  };
  try {
    const { hydrateKennelClaimedState } = await server.ssrLoadModule('/src/lib/kennel-club-claimed-client.ts');
    const fetcher = async (input, init) => {
      requests.push({ input, init });
      if (input === '/api/kennel-club/today') return { ok: true, status: 200, json: async () => today };
      if (input === '/api/collect/me') return { ok: true, status: 200, json: async () => collection };
      throw new Error(`unexpected request: ${input}`);
    };
    const state = await hydrateKennelClaimedState({
      root: dom.window.document,
      fetcher,
      getSession: async () => fakeUser,
      now: new Date('2026-09-04T21:48:00.000Z'),
    });

    assert.equal(state.displayName, '@mike');
    assert.deepEqual(requests.map(({ input }) => input), ['/api/kennel-club/today', '/api/collect/me']);
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-line]').textContent, 'Barnaby went home with @mike · 2:41pm');
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-summary]').textContent, 'You hold 4 of 30 · next sitting opens in 9h 12m');
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-where]').textContent, 'held for you until you link a wallet');
    assert.equal(dom.window.document.querySelector('[data-kennel-holding]').hidden, false);
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-move]').hidden, false);
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-receipt]').href, `https://tzkt.io/${opHash}`);
    assert.equal(dom.window.document.querySelector('[data-kennel-went-home-stamp]').textContent, 'WENT HOME · 04 · @mike');
    assert.equal(dom.window.document.querySelector('[data-kennel-claimed-surface]').dataset.kennelClaimedState, 'held');

    const marked = [...dom.window.document.querySelectorAll('[data-kennel-yours]')];
    assert.deepEqual(marked.map((tile) => tile.dataset.kennelDay), ['1', '2', '3', '4']);
    assert.ok(marked.every((tile) => tile.querySelector('[data-kennel-owner-mark]').textContent === 'M'));
    assert.equal(dom.window.document.querySelector('[data-kennel-day="5"] [data-kennel-owner-mark]').hidden, true);
  } finally {
    await server.close();
    dom.window.close();
  }
});

test('delivered state says in your wallet, uses the short address, and has no move action', async () => {
  const server = await viteServer();
  const dom = claimedDom();
  const address = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
  try {
    const { hydrateKennelClaimedState } = await server.ssrLoadModule('/src/lib/kennel-club-claimed-client.ts');
    const collection = {
      collector: { name: 'Mike Hoydich', wallets: [address] },
      claimedDays: [4],
      streak: 1,
      completion: { claimed: 1, total: 30 },
      handle: { status: 'available' },
      claims: [{
        tokenId: 3,
        sitting: 'Barnaby',
        status: 'delivered',
        opHash: `o${'2'.repeat(50)}`,
        deliveredTo: address,
        createdAt: '2026-09-04T21:41:00.000Z',
      }],
    };
    const state = await hydrateKennelClaimedState({
      root: dom.window.document,
      fetcher: async (input) => ({
        ok: true,
        status: 200,
        json: async () => input === '/api/kennel-club/today' ? today : collection,
      }),
      getSession: async () => fakeUser,
      now: new Date('2026-09-04T21:48:00.000Z'),
    });
    assert.equal(state.displayName, 'tz2FjJh…MxdFw');
    assert.match(dom.window.document.querySelector('[data-kennel-holding-line]').textContent, /tz2FjJh…MxdFw/);
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-where]').textContent, 'in your wallet');
    assert.equal(dom.window.document.querySelector('[data-kennel-holding-move]').hidden, true);
  } finally {
    await server.close();
    dom.window.close();
  }
});

test('claimed surfaces contain one holding contract and no legacy repeated ownership labels', async () => {
  const [holding, renderer, claim, mint, room, collect] = await Promise.all([
    read('src/components/KennelClubHolding.astro'),
    read('src/lib/kennel-club-claimed-client.ts'),
    read('src/components/KennelClubClaim.astro'),
    read('src/components/KennelClubMint.astro'),
    read('src/pages/kennel-club.astro'),
    read('src/pages/collect.astro'),
  ]);
  assert.match(renderer, /You hold/);
  assert.match(holding, /Move it to a wallet you control/);
  assert.doesNotMatch(holding, /\s(?:id|for)=/);
  assert.doesNotMatch([claim, mint, room, collect].join('\n'), /free spots left|already minted by you|already on your shelf/i);
  assert.match(room, /data-kennel-went-home-stamp/);
  assert.match(collect, /Streak · \$\{payload\.streak\}/);
});
