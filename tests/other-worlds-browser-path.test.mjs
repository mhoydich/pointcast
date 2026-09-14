import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { InMemorySigner } from '@taquito/signer';
import { b58Encode, PrefixV2 } from '@taquito/utils';

// The application client, real handlers, real migration and real Tezos signature
// verification run together. Only chain I/O and the wallet's UI are replaced.
// Generated disposable signing keys are memory-only, unfunded and never logged.
class LocalD1 {
  constructor(sql) { this.db = new DatabaseSync(':memory:'); this.db.exec(sql); }
  prepare(sql) {
    const db = this.db;
    let args = [];
    const statement = {
      bind(...values) { args = values; return statement; },
      async first() { return db.prepare(sql).get(...args) ?? null; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
      async run() { return db.prepare(sql).run(...args); },
    };
    return statement;
  }
  async batch(statements) {
    this.db.exec('BEGIN');
    try { const results = []; for (const statement of statements) results.push(await statement.run()); this.db.exec('COMMIT'); return results; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}

function galleryDom(artworks) {
  const dom = new JSDOM(`<main data-other-worlds><span data-drop-status></span>
    ${artworks.map((art) => `<a href="${art.image}" data-open-artwork="${art.id}">${art.title}</a><span data-edition-count="${art.id}"></span>`).join('')}
    <dialog data-art-dialog><button data-close-dialog>Close</button><img data-dialog-image />
    <h2 data-dialog-title></h2><p data-dialog-description></p><span data-dialog-number></span><p data-dialog-editions></p>
    <p data-wallet-address></p><button data-claim-button>Claim</button><p data-claim-message></p><a data-receipt-link hidden></a>
    <button data-retry-button hidden>Retry</button><a data-original-link></a><a data-metadata-link></a>
    <button data-previous-artwork>Previous</button><button data-next-artwork>Next</button></dialog></main>`, { url: 'https://pointcast.xyz/other-worlds' });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  return dom;
}

test('full gallery claim path uses a genuine disposable Tezos signature, durable reservation and verified receipt', async () => {
  const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const data = JSON.parse(await readFile(new URL('../src/data/other-worlds.json', import.meta.url), 'utf8'));
  const db = new LocalD1(await readFile(new URL('../migrations/auth/0020_other_worlds.sql', import.meta.url), 'utf8'));
  const dom = galleryDom(data.artworks);
  let client;
  try {
    const [{ mountOtherWorlds }, handlers, shared] = await Promise.all([
      vite.ssrLoadModule('/src/lib/other-worlds-client.ts'),
      vite.ssrLoadModule('/functions/api/other-worlds/_handlers.ts'),
      vite.ssrLoadModule('/functions/api/other-worlds/_shared.ts'),
    ]);
    const collector = await InMemorySigner.fromSecretKey(b58Encode(randomBytes(32), PrefixV2.Ed25519Seed));
    const address = await collector.publicKeyHash();
    const publicKey = await collector.publicKey();
    const sponsor = await InMemorySigner.fromSecretKey(b58Encode(randomBytes(32), PrefixV2.Ed25519Seed));
    const items = data.artworks.map((art) => ({
      id: art.id, slug: art.slug, artifactUri: `https://example.test/art/${art.id}.png`,
      artifactSha256: 'a'.repeat(64), metadataUri: `https://example.test/metadata/${art.id}.json`, metadataSha256: 'b'.repeat(64),
    }));
    const env = {
      AUTH_DB: db,
      OTHER_WORLDS_ENABLED: 'true', OTHER_WORLDS_MAINNET_APPROVED: 'true',
      OTHER_WORLDS_FA2_CONTRACT: 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton',
      OTHER_WORLDS_SPONSOR_ADDRESS: await sponsor.publicKeyHash(),
      OTHER_WORLDS_SPONSOR_SECRET_KEY: 'fake-chain-adapter-does-not-read-a-key',
      OTHER_WORLDS_RPC_URL: 'https://example.test/unused-rpc',
      OTHER_WORLDS_TOKEN_MAP: JSON.stringify(Object.fromEntries(items.map((item) => [item.id, String(item.id - 1)]))),
      OTHER_WORLDS_MAX_OPERATION_MUTEZ: '10000', OTHER_WORLDS_TOTAL_BUDGET_MUTEZ: '1000000',
    };
    let chainState = 'pending';
    let timestamp = shared.CLOSES_MS - 10_000;
    const operationHash = `o${'1'.repeat(50)}`;
    const transfers = [];
    const broadcasts = [];
    const signatures = [];
    const chain = {
      async ready() {},
      async prepare(row) { transfers.push({ address: row.address, artworkId: row.artwork_id, sponsor: row.sponsor, tokenId: row.token_id }); return { bytes: 'deadbeef', hash: operationHash, maximumCostMutez: 1300 }; },
      async broadcast(bytes) { broadcasts.push(bytes); return operationHash; },
      async status() { return chainState; },
    };
    const opts = { now: () => timestamp, items, chainFactory: async () => chain };
    const fetcher = async (url, init) => {
      const request = new Request(`https://pointcast.xyz${url}`, { ...init, headers: { ...init.headers, origin: 'https://pointcast.xyz' } });
      if (url.startsWith('/api/other-worlds/receipt')) return handlers.handleReceipt(request, env, opts);
      if (url === '/api/other-worlds/challenge') return handlers.handleChallenge(request, env, opts);
      if (url === '/api/other-worlds/claim') return handlers.handleClaim(request, env, opts);
      return handlers.handleStatus(request, env, opts);
    };
    const root = dom.window.document.querySelector('main');
    const $ = (selector) => root.querySelector(selector);
    client = mountOtherWorlds(root, data.artworks, {
      fetcher, now: () => timestamp, pollMs: 60000,
      wallet: async () => ({
        getActiveAddress: async () => address,
        connectKukaiForSigning: async () => address,
        signTezosPayload: async (message) => {
          signatures.push(message);
          const payload = shared.payload(message);
          const proof = await collector.sign(payload);
          return { address, publicKey, payload, signature: proof.prefixSig };
        },
      }),
    });
    await client.ready;
    client.showArtwork(7);
    assert.equal($('[data-dialog-title]').textContent, 'The Interchange Dream');
    await client.claimArtwork();
    assert.equal(signatures.length, 1);
    assert.match(signatures[0], /Artwork: 7 \/ the-interchange-dream/);
    assert.match(signatures[0], /Collector pays: 0 mutez/);
    assert.equal(transfers.length, 0, 'first response reserves without spending or signing a transfer');
    assert.equal($('[data-claim-button]').textContent, 'Artwork reserved');
    await client.pollReceipt();
    assert.equal(transfers.length, 1);
    assert.equal(transfers[0].address, address);
    assert.equal(transfers[0].artworkId, 7);
    assert.equal(transfers[0].tokenId, '6');
    assert.equal(transfers[0].sponsor, env.OTHER_WORLDS_SPONSOR_ADDRESS);
    assert.equal($('[data-claim-button]').textContent, 'Delivery pending');
    assert.match($('[data-claim-message]').textContent, /not confirmed yet/);
    assert.equal(db.db.prepare('SELECT COUNT(*) AS n FROM other_worlds_claims').get().n, 1);
    await client.refreshStatus();
    assert.equal($('[data-edition-count="7"]').textContent, '26 of 27 available');

    // Midnight closes NEW claims but cannot strand an already authorized claim.
    timestamp = shared.CLOSES_MS + 1000;
    await client.refreshStatus();
    assert.equal(root.dataset.phase, 'closed');
    await client.pollReceipt(true);
    assert.equal(transfers.length, 1, 'retry must not prepare another transfer');
    assert.deepEqual(broadcasts, ['deadbeef', 'deadbeef']);
    chainState = 'confirmed';
    await client.pollReceipt();
    assert.equal($('[data-claim-button]').textContent, 'Artwork delivered');
    assert.equal($('[data-receipt-link]').href, `https://tzkt.io/${operationHash}`);
    assert.equal(db.db.prepare('SELECT status FROM other_worlds_claims').get().status, 'confirmed');
    client.showArtwork(1);
    await client.claimArtwork();
    assert.equal(signatures.length, 1, 'a wallet cannot claim a second artwork');
    assert.equal(transfers.length, 1);
  } finally {
    client?.destroy();
    dom.window.close();
    db.db.close();
    await vite.close();
  }
});
