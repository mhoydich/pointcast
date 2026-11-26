import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountNewestHolders } from '../public/nouns-money/newest-holders/strip.mjs';
import { newestHoldersMarkup } from '../src/lib/nouns-money-newest-holders-markup.mjs';
import config from '../src/data/nouns-money-collections.json' with { type: 'json' };

const office = 'tz1UWibBbQXvuSkThsLUGAaL4R5j7X3PSCKj';
const address = 'tz1' + 'A'.repeat(33);
const now = new Date('2026-11-25T12:00:00Z');
const received = {
  id: 3, timestamp: '2026-11-25T11:00:00Z', amount: '1', to: { address },
  token: { contract: { address: config.collections[0].contract }, tokenId: '6',
    metadata: { name: '<img src=x onerror=alert(1)>', thumbnailUri: 'https://example.com/note.webp' } },
};

function fixture(t) {
  const dom = new JSDOM(newestHoldersMarkup(config), { url: 'https://nounsmoney.xyz/' });
  t.after(() => dom.window.close());
  return dom.window.document.querySelector('[data-newest-holders]');
}

function fetcher(transfers = [received], domains = []) {
  return async input => {
    const url = new URL(input);
    if (url.searchParams.has('name')) return Response.json([{
      name: 'officenoun.tez', expiration: '2027-11-25T12:00:00Z', address: { address: office },
    }]);
    if (url.pathname.endsWith('/transfers')) return Response.json(transfers);
    return Response.json(domains);
  };
}

test('strip reveals successful recipients with safe text, note link, thumbnail and receive time', async t => {
  const root = fixture(t);
  assert.equal(root.hidden, true);
  await mountNewestHolders(root, config, { fetcher: fetcher(), now });
  assert.equal(root.hidden, false);
  assert.equal(root.querySelectorAll('li').length, 1);
  assert.equal(root.querySelector('.nmh-note').textContent, received.token.metadata.name);
  assert.equal(root.querySelectorAll('img').length, 1, 'metadata name cannot inject an image');
  assert.equal(root.querySelector('img').src, received.token.metadata.thumbnailUri);
  assert.equal(root.querySelector('li a').href, `https://objkt.com/tokens/tezos/${config.collections[0].contract}/6`);
  assert.equal(root.querySelector('time').textContent, '1h ago');
  assert.equal(root.querySelector('time').dateTime, '2026-11-25T11:00:00.000Z');
  assert.match(root.querySelector('.nmh-invite').textContent, /reply to an Office Noun post with your tz address/);
});

test('failed or empty reads leave no visible strip or error box, including after a prior success', async t => {
  const root = fixture(t);
  await mountNewestHolders(root, config, { fetcher: fetcher(), now });
  assert.equal(root.hidden, false);
  await mountNewestHolders(root, config, { fetcher: async () => { throw new Error('offline'); }, now });
  assert.equal(root.hidden, true);
  assert.equal(root.querySelectorAll('li').length, 0);
  await mountNewestHolders(root, config, { fetcher: fetcher([]), now });
  assert.equal(root.hidden, true);
  assert.equal(root.querySelectorAll('[role=alert]').length, 0);
});

test('thumbnail errors keep the note link usable and no-JavaScript markup stays hidden', async t => {
  const root = fixture(t);
  assert.equal(root.hidden, true);
  await mountNewestHolders(root, config, { fetcher: fetcher(), now });
  const img = root.querySelector('img');
  img.dispatchEvent(new root.ownerDocument.defaultView.Event('error'));
  assert.equal(root.querySelector('img'), null);
  assert.equal(root.querySelector('.nmh-art').textContent, 'Note');
  assert.ok(root.querySelector('li a').href.startsWith('https://objkt.com/'));
});
