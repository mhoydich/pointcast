import assert from 'node:assert/strict';
import test from 'node:test';
import { claimProfileHandleWith, pagePayload, setProfilePageWith, utf8ToHex } from '../src/lib/profile-operations.mjs';
import { decodeProfileLink, encodeProfileLink, readProfileHandle } from '../src/lib/profile-object.mjs';

test('live profile reader treats TzKT 204 as free and joins owner/page for taken handles', async () => {
  const contract = 'KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh';
  const free = await readProfileHandle(contract, 'fresh-handle', async () => new Response(null, { status: 204 }));
  assert.equal(free, null);
  const fetcher = async (url) => {
    const value = String(url);
    if (value.includes('tokens_by_handle')) return Response.json({ value: '9' });
    if (value.includes('/pages/')) return Response.json({ value: {
      name: utf8ToHex('Mike'), bio: utf8ToHex('PointCast neighbor.'),
      links: [encodeProfileLink('PointCast', 'https://pointcast.xyz')], noun_seed: '205',
    } });
    if (value.includes('/ledger/')) return Response.json({ value: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb' });
    return new Response(null, { status: 404 });
  };
  const profile = await readProfileHandle(contract, '@mike', fetcher);
  assert.equal(profile.tokenId, 9);
  assert.equal(profile.owner, 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb');
  assert.deepEqual(profile.links[0], { label: 'PointCast', url: 'https://pointcast.xyz/' });
  assert.deepEqual(decodeProfileLink(encodeProfileLink('Home', 'https://pointcast.xyz')), { label: 'Home', url: 'https://pointcast.xyz/' });
});

test('mock Beacon/Taquito adapter confirms claim through methodsObject with UTF-8 bytes', async () => {
  const calls = [];
  const confirmation = Promise.resolve({ completed: true });
  const adapter = {
    async connect() { calls.push(['beacon']); return 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'; },
    async at(address) {
      calls.push(['at', address]);
      return { methodsObject: { claim(bytes) {
        calls.push(['claim', bytes]);
        return { async send(options) { calls.push(['send', options]); return { opHash: 'opClaim', confirmation: () => confirmation }; } };
      } } };
    },
  };
  const operation = await claimProfileHandleWith({ contract: 'KT1Profile', handle: 'café' }, adapter).catch((error) => error);
  assert.match(operation.message, /lowercase letters/);
  const valid = await claimProfileHandleWith({ contract: 'KT1Profile', handle: 'mike-205' }, adapter);
  assert.equal(valid.opHash, 'opClaim');
  assert.deepEqual(calls.at(-2), ['claim', '6d696b652d323035']);
  assert.deepEqual(calls.at(-1), ['send', { amount: 0, mutez: true }]);
  await valid.confirmation;
});

test('mock Beacon/Taquito adapter sends exact set_page record and bounded JSON links', async () => {
  let sentPayload;
  const adapter = {
    async connect() { return 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'; },
    async at() { return { methodsObject: { set_page(payload) {
      sentPayload = payload;
      return { async send() { return { opHash: 'opPage', confirmation: () => Promise.resolve() }; } };
    } } }; },
  };
  const params = { contract: 'KT1Profile', tokenId: 7, name: 'Mike', bio: 'hello', links: [{ label: 'PC', url: 'https://pointcast.xyz' }], nounSeed: 205 };
  const operation = await setProfilePageWith(params, adapter);
  assert.equal(operation.opHash, 'opPage');
  assert.deepEqual(sentPayload, pagePayload(params));
  assert.equal(sentPayload.page.name, '4d696b65');
  assert.equal(sentPayload.page.noun_seed, 205);
  assert.throws(() => pagePayload({ ...params, bio: 'x'.repeat(281) }), /280/);
  assert.throws(() => pagePayload({ ...params, links: Array(9).fill(params.links[0]) }), /8/);
});

test('profile routes expose aliases, chain shelves, OG handle art, and an unclaimed 404 door', async () => {
  const { readFile } = await import('node:fs/promises');
  const root = new URL('../', import.meta.url);
  const [page, twin, me, notFound, og, liveRoute, liveOg] = await Promise.all([
    readFile(new URL('src/pages/p/[handle].astro', root), 'utf8'),
    readFile(new URL('src/pages/p/[handle].json.ts', root), 'utf8'),
    readFile(new URL('src/pages/me.astro', root), 'utf8'),
    readFile(new URL('src/pages/404.astro', root), 'utf8'),
    readFile(new URL('src/pages/p/og/[handle].svg.ts', root), 'utf8'),
    readFile(new URL('functions/p/[handle].ts', root), 'utf8'),
    readFile(new URL('functions/p/og/[handle].ts', root), 'utf8'),
  ]);
  assert.match(page, /`@\$\{profile\.handle\}`/);
  assert.match(twin, /listOwnerKennelDogs/);
  assert.match(page, /Soulbound seals/);
  assert.match(me, /claimProfileHandle/);
  assert.match(me, /setProfilePage/);
  assert.doesNotMatch(me, /Buffer/);
  assert.match(notFound, /Claim @/);
  assert.match(og, /noun\.pics/);
  assert.match(og, /@\$\{handle\}/);
  assert.match(liveRoute, /readProfileHandle/);
  assert.match(liveRoute, /reason: 'unclaimed'/);
  assert.match(liveRoute, /reason: 'tzkt-unavailable'/);
  assert.match(liveOg, /readProfileHandle/);
});
