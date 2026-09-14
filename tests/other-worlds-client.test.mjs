import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const exhibition = JSON.parse(await readFile(new URL('../src/data/other-worlds.json', import.meta.url), 'utf8'));
const ADDRESS = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';
const HASH = `o${'1'.repeat(50)}`;
const SERVER_TIME = '2026-09-15T07:00:00.000Z';
const statuses = (extra = {}) => ({
  ok: true, enabled: true, phase: 'open', serverTime: SERVER_TIME,
  closesAt: exhibition.closesAt, collectorCostMutez: 0,
  artworks: exhibition.artworks.map((art) => ({ artworkId: art.id, editionSize: 27, remaining: 27 })),
  ...extra,
});
const receipt = (status = 'reserved', extra = {}) => ({
  id: '0bc6c01b-76d9-4b04-b1ad-b293dece2ea1', artworkId: 3, address: ADDRESS,
  status, operationHash: status === 'reserved' ? null : HASH, ...extra,
});

function makeDom() {
  const dom = new JSDOM(`<!doctype html><main data-other-worlds>
    <span data-drop-status></span>
    ${exhibition.artworks.map((art) => `<a data-open-artwork="${art.id}" href="${art.image}">${art.title}</a><span data-edition-count="${art.id}"></span>`).join('')}
    <dialog data-art-dialog><button data-close-dialog>Close</button>
      <img data-dialog-image /><h2 data-dialog-title></h2><p data-dialog-description></p><p data-dialog-number></p>
      <span data-dialog-editions></span><span data-wallet-address></span>
      <button data-claim-button></button><p data-claim-message></p><a data-receipt-link hidden></a><button data-retry-button hidden>Retry</button>
      <a data-original-link></a><a data-metadata-link></a>
      <button data-previous-artwork>Previous</button><button data-next-artwork>Next</button>
    </dialog></main>`, { url: 'https://pointcast.xyz/other-worlds' });
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  return dom;
}

async function withClient(run, options = {}) {
  const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'error' });
  const dom = makeDom();
  const calls = [];
  const signatures = [];
  let liveStatus = options.status ?? statuses();
  let currentReceipt = null;
  let deliveryReceipt = null;
  const api = {
    setStatus(value) { liveStatus = value; },
    setReceipt(value) { currentReceipt = value; },
    setDelivery(value) { deliveryReceipt = value; },
  };
  try {
    const { mountOtherWorlds } = await vite.ssrLoadModule('/src/lib/other-worlds-client.ts');
    const fetcher = async (url, init) => {
      const body = init.body ? JSON.parse(init.body) : null;
      calls.push({ url, method: init.method, body });
      let result;
      if (url.startsWith('/api/other-worlds?') || url === '/api/other-worlds') result = { ...liveStatus, ...(url.includes('?address=') ? { claim: currentReceipt } : {}) };
      else if (url === '/api/other-worlds/challenge') result = { ok: true, nonce: 'single-use-challenge', message: `Claim artwork ${body.artworkId}`, payload: '05010000' };
      else if (url === '/api/other-worlds/claim') {
        currentReceipt = deliveryReceipt ?? receipt('reserved', { artworkId: body.artworkId });
        result = { ok: true, claim: currentReceipt };
      } else if (url.startsWith('/api/other-worlds/receipt')) result = { ok: true, claim: deliveryReceipt ?? currentReceipt };
      else throw new Error(`Unexpected route: ${url}`);
      if (options.fetchOverride) result = await options.fetchOverride({ url, body, result });
      return { ok: result.ok !== false, status: result.ok === false ? 409 : 200, json: async () => result };
    };
    const wallet = async () => ({
      getActiveAddress: async () => options.activeAddress ?? null,
      connectKukaiForSigning: async () => ADDRESS,
      signTezosPayload: async (message) => {
        signatures.push(message);
        if (options.rejectSignature) throw new Error('User rejected signature');
        return { address: options.proofAddress ?? ADDRESS, publicKey: 'disposable-test-public-key', signature: 'disposable-test-signature', payload: '05010000' };
      },
    });
    const root = dom.window.document.querySelector('main');
    const client = mountOtherWorlds(root, exhibition.artworks, { fetcher, wallet, now: options.now ?? (() => Date.parse(SERVER_TIME)), pollMs: 60_000 });
    try {
      await client.ready;
      await run({ client, root, dom, calls, signatures, api, $: (selector) => root.querySelector(selector) });
    } finally {
      client.destroy();
    }
  } finally {
    dom.window.close();
    await vite.close();
  }
}

test('collector selects a transmission, signs the exact server message, and receives a pending reservation', async () => {
  await withClient(async ({ client, $, calls, signatures }) => {
    client.showArtwork(3);
    assert.equal($('[data-dialog-title]').textContent, 'River of Returning Light');
    assert.equal($('[data-claim-button]').disabled, false);
    await client.claimArtwork();
    assert.deepEqual(signatures, ['Claim artwork 3']);
    const posted = calls.find((call) => call.url === '/api/other-worlds/claim');
    assert.deepEqual(posted.body, { address: ADDRESS, artworkId: 3, nonce: 'single-use-challenge', publicKey: 'disposable-test-public-key', signature: 'disposable-test-signature' });
    assert.equal($('[data-claim-button]').textContent, 'Artwork reserved');
    assert.match($('[data-claim-message]').textContent, /not confirmed yet/);
    assert.equal($('[data-receipt-link]').hidden, true);
    assert.equal(calls.some((call) => /transfer|operation|mint/.test(call.url)), false);
  });
});

test('null closing date remains claimable years after the original deadline', async () => {
  assert.equal(exhibition.closesAt, null);
  const future = '2036-09-14T07:00:00.000Z';
  await withClient(async ({ client, root, $, signatures }) => {
    client.showArtwork(4);
    assert.equal(root.dataset.phase, 'open');
    assert.equal($('[data-claim-button]').disabled, false);
    await client.claimArtwork();
    assert.deepEqual(signatures, ['Claim artwork 4']);
  }, { status: statuses({ serverTime: future }), now: () => Date.parse(future) });
});

test('a reservation or submitted operation never renders delivery success; confirmed chain receipt does', async () => {
  await withClient(async ({ client, $, api }) => {
    client.showArtwork(3);
    await client.claimArtwork();
    api.setDelivery(receipt('submitted'));
    await client.pollReceipt();
    assert.equal($('[data-claim-button]').textContent, 'Delivery pending');
    assert.match($('[data-receipt-link]').textContent, /pending/);
    api.setDelivery(receipt('confirmed'));
    await client.pollReceipt();
    assert.equal($('[data-claim-button]').textContent, 'Artwork delivered');
    assert.match($('[data-claim-message]').textContent, /confirmed in your wallet/);
    assert.equal($('[data-receipt-link]').href, `https://tzkt.io/${HASH}`);
    assert.equal($('[data-retry-button]').hidden, true);
  });
});

test('a claimed status without an operation hash cannot show confirmed delivery', async () => {
  await withClient(async ({ client, $, api }) => {
    api.setDelivery(receipt('confirmed', { operationHash: null }));
    client.showArtwork(3);
    await client.claimArtwork();
    assert.notEqual($('[data-claim-button]').textContent, 'Artwork delivered');
    assert.equal($('[data-receipt-link]').hidden, true);
  });
});

test('cancelling the wallet-control signature sends no claim and preserves a retryable choice', async () => {
  await withClient(async ({ client, $, calls }) => {
    client.showArtwork(6);
    await client.claimArtwork();
    assert.equal(calls.filter((call) => call.url === '/api/other-worlds/claim').length, 0);
    assert.equal($('[data-claim-button]').disabled, false);
    assert.match($('[data-claim-message]').textContent, /cancelled/);
  }, { rejectSignature: true });
});

test('preview, unavailable, nonzero collector cost and closed states cannot ask for a signature', async () => {
  for (const status of [
    statuses({ enabled: false, phase: 'preview' }),
    statuses({ enabled: false, phase: 'unavailable' }),
    statuses({ collectorCostMutez: 1 }),
    statuses({ serverTime: '2026-09-14T07:00:00.000Z', closesAt: '2026-09-14T07:00:00.000Z' }),
    statuses({ phase: 'closed' }),
    statuses({ closesAt: undefined }),
    statuses({ closesAt: 'invalid' }),
  ]) {
    await withClient(async ({ client, $, signatures }) => {
      client.showArtwork(1);
      assert.equal($('[data-claim-button]').disabled, true);
      await client.claimArtwork();
      assert.deepEqual(signatures, []);
    }, { status });
  }
});

test('sold-out selected artwork is disabled while another artwork remains claimable', async () => {
  const status = statuses();
  status.artworks[0].remaining = 0;
  await withClient(async ({ client, $, signatures }) => {
    client.showArtwork(1);
    assert.equal($('[data-claim-button]').textContent, 'All 27 editions claimed');
    await client.claimArtwork();
    assert.deepEqual(signatures, []);
    client.showArtwork(2);
    assert.equal($('[data-claim-button]').disabled, false);
  }, { status });
});

test('an existing wallet claim blocks a second artwork before the signature step', async () => {
  await withClient(async ({ client, $, api, signatures }) => {
    api.setReceipt(receipt('confirmed'));
    client.showArtwork(8);
    await client.claimArtwork();
    assert.deepEqual(signatures, []);
    assert.equal($('[data-claim-button]').textContent, 'Artwork delivered');
    assert.match($('[data-claim-message]').textContent, /River of Returning Light/);
  });
});

test('claim retries reuse the exact authorized body and never make another signature request', async () => {
  await withClient(async ({ client, calls, signatures }) => {
    client.showArtwork(3);
    await client.claimArtwork();
    await client.pollReceipt(true);
    const posts = calls.filter((call) => call.url === '/api/other-worlds/claim');
    assert.equal(posts.length, 2);
    assert.deepEqual(posts[0].body, posts[1].body);
    assert.equal(signatures.length, 1);
  });
});

test('wallet changes during signing cannot send a claim for another address', async () => {
  await withClient(async ({ client, $, calls }) => {
    client.showArtwork(1);
    await client.claimArtwork();
    assert.equal(calls.filter((call) => call.url === '/api/other-worlds/claim').length, 0);
    assert.match($('[data-claim-message]').textContent, /active wallet changed/);
  }, { proofAddress: 'tz1DifferentWallet' });
});

test('keyboard gallery navigation keeps selection explicit and close restores the opener', async () => {
  await withClient(async ({ client, $, dom }) => {
    const opener = $('[data-open-artwork="1"]');
    client.showArtwork(1, opener);
    $('[data-art-dialog]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal($('[data-dialog-title]').textContent, 'The Reservoir Above');
    $('[data-close-dialog]').click();
    assert.equal($('[data-art-dialog]').open, false);
    assert.equal(dom.window.document.activeElement, opener);
  });
});
