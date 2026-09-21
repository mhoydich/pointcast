import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

async function withModules(run) {
  const server = await createServer({
    root: root.pathname,
    configFile: false,
    appType: 'custom',
    logLevel: 'error',
    cacheDir: '.astro/agent-cabinet-test-cache',
  });
  try {
    const [data, catalogRoute, profileRoute] = await Promise.all([
      server.ssrLoadModule('/src/data/agent-cabinet.ts'),
      server.ssrLoadModule('/src/pages/x402/collect.json.ts'),
      server.ssrLoadModule('/src/pages/agents/[handle].json.ts'),
    ]);
    return await run({ data, catalogRoute, profileRoute });
  } finally {
    await server.close();
  }
}

test('Agent Cabinet catalog keeps identity, payment, and delivery boundaries explicit', async () => {
  await withModules(async ({ data }) => {
    assert.equal(data.CABINET_PROFILES.length, 3);
    assert.deepEqual(data.CABINET_PROFILES.map((profile) => profile.handle), ['codex', 'cc', 'manus']);
    assert.equal(data.CABINET_OFFERS.length, 3);
    assert.equal(new Set(data.CABINET_PROFILES.map((profile) => profile.handle)).size, data.CABINET_PROFILES.length);
    assert.equal(new Set(data.CABINET_PROFILES.map((profile) => profile.urls.human)).size, data.CABINET_PROFILES.length);
    assert.equal(new Set(data.CABINET_OFFERS.map((offer) => offer.slug)).size, data.CABINET_OFFERS.length);
    assert.equal(new Set(data.CABINET_OFFERS.map((offer) => offer.urls.human)).size, data.CABINET_OFFERS.length);

    for (const profile of data.CABINET_PROFILES) {
      assert.equal(profile.schemaVersion, 'pointcast.agent-profile/v1');
      assert.equal(profile.previewOnly, true);
      assert.equal(profile.editorialRole.source, 'pointcast-editorial-proposal');
      assert.equal(profile.editorialRole.residentAttestation, 'not-provided');
      assert.doesNotMatch(profile.editorialRole.statement, /^I\b/);
      assert.match(profile.lineage.residentIdentity.id, /^pcr_/);
      assert.equal(profile.lineage.runtimePublisher.id, null);
      assert.equal(profile.lineage.runtimePublisher.status, 'unbound');
      assert.equal(profile.lineage.wallets.evm, null);
      assert.equal(profile.lineage.wallets.tezos, null);
      assert.equal(profile.capabilities.inspectOffers, true);
      assert.equal(profile.capabilities.draftOfferPreview, true);
      assert.equal(profile.capabilities.publishPreview, false);
      assert.equal(profile.capabilities.publishLive, false);
      assert.equal(profile.capabilities.spend, false);
      assert.equal(profile.capabilities.mint, false);
      assert.deepEqual(profile.madeOfferSlugs, []);
      assert.equal(profile.proposedOfferSlugs.length, 1);
      assert.deepEqual(profile.keptOfferSlugs, []);
      for (const slug of profile.proposedOfferSlugs) {
        const offer = data.CABINET_OFFERS.find((candidate) => candidate.slug === slug);
        assert.ok(offer, `missing proposed offer ${slug}`);
        assert.equal(offer.proposedFor.handle, profile.handle);
      }
    }

    for (const offer of data.CABINET_OFFERS) {
      assert.equal(offer.schemaVersion, 'pointcast.object-offer/v1');
      assert.equal(offer.previewOnly, true);
      assert.equal(offer.status, 'concept-preview');
      assert.equal('creator' in offer, false);
      assert.match(offer.proposedFor.residentIdentityId, /^pcr_/);
      assert.equal(offer.creatorAuthorization.status, 'unverified');
      assert.equal(offer.creatorAuthorization.runtimePublisherId, null);
      assert.equal(offer.creatorAuthorization.signature, null);
      const proposedProfile = data.CABINET_PROFILES.find((profile) => profile.handle === offer.proposedFor.handle);
      assert.ok(proposedProfile, `missing proposed profile ${offer.proposedFor.handle}`);
      assert.ok(proposedProfile.proposedOfferSlugs.includes(offer.slug));
      assert.equal(offer.edition.kept, 0);
      assert.equal(offer.image.url, null);
      assert.equal(offer.image.hash, null);
      assert.equal(offer.artifact.contentHash, null);
      assert.equal(offer.payment.enabled, false);
      assert.equal(offer.payment.protocol, 'x402');
      assert.equal(offer.payment.network, 'eip155:42793');
      assert.equal(offer.payment.method, 'Permit2');
      assert.equal(offer.payment.permit2, '0x000000000022D473030F116dDEE9F6B43aC78BA3');
      assert.equal(offer.payment.asset.symbol, 'USDC');
      assert.equal(offer.payment.asset.address, '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9');
      assert.equal(offer.payment.amount.units, '10000');
      assert.equal(offer.payment.payTo, '0x48e8479b4906d45fbe702a18ac2454f800238b37');
      assert.equal(offer.delivery.enabled, false);
      assert.equal(offer.delivery.network, 'tezos');
      assert.equal(offer.delivery.standard, 'FA2');
      assert.equal(offer.delivery.contract, null);
      assert.equal(offer.delivery.tokenId, null);
      assert.equal(offer.delivery.recipientRequired, true);
      assert.equal(offer.delivery.walletProofRequired, true);
      assert.deepEqual(offer.proofStates.map((proof) => proof.stage), [
        'offer-published',
        'payment-settled',
        'nft-delivered',
        'receipt-reconciled',
      ]);
      assert.equal(offer.proofStates[0].status, 'preview-only');
      assert.ok(offer.proofStates.slice(1).every((proof) => proof.status === 'not-run' && proof.evidence === null));
    }
  });
});

test('Agent Cabinet JSON twins are static, CORS-readable, and preview-only', async () => {
  await withModules(async ({ catalogRoute, profileRoute }) => {
    const catalogResponse = catalogRoute.GET({});
    const catalog = await catalogResponse.json();
    assert.equal(catalogResponse.status, 200);
    assert.match(catalogResponse.headers.get('content-type'), /^application\/json/);
    assert.equal(catalogResponse.headers.get('access-control-allow-origin'), '*');
    assert.equal(catalog.previewOnly, true);
    assert.equal(catalog.offers.length, 3);

    const paths = profileRoute.getStaticPaths();
    assert.deepEqual(paths.map((entry) => entry.params.handle), ['codex', 'cc', 'manus']);
    for (const path of paths) {
      const response = profileRoute.GET({ props: path.props });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('access-control-allow-origin'), '*');
      assert.equal(payload.previewOnly, true);
      assert.equal(payload.profile.handle, path.params.handle);
      assert.equal(payload.profile.lineage.runtimePublisher.status, 'unbound');
      assert.deepEqual(payload.verifiedMadeOffers, []);
      assert.ok(payload.proposedOffers.every((offer) => offer.proposedFor.handle === path.params.handle));
      assert.match(payload.proofStateSeparation.payment, /settlement evidence/i);
      assert.match(payload.proofStateSeparation.delivery, /separate verified contract operation/i);
    }
  });
});

test('Agent Cabinet browser surfaces contain no networked purchase or publishing path', async () => {
  const [market, profile, layout, chrome, residents, astroConfig] = await Promise.all([
    read('src/pages/x402/collect.astro'),
    read('src/pages/agents/[handle].astro'),
    read('src/layouts/BlockLayout.astro'),
    read('src/scripts/chrome.ts'),
    read('src/pages/residents.astro'),
    read('astro.config.mjs'),
  ]);
  assert.match(market, /preview only/i);
  assert.match(market, /no money/i);
  assert.match(market, /approval_required/);
  assert.match(market, /creator authorization is unverified/i);
  assert.doesNotMatch(market, /offer\.creator/);
  assert.match(market, /collect\.json/);
  assert.doesNotMatch(market, /\bfetch\s*\(/);
  assert.doesNotMatch(market, /Payment-Signature/);
  assert.doesNotMatch(market, /<form\b[^>]*\s(?:action|method)=/i);
  assert.match(market, /<BlockLayout[\s\S]{0,500}\bisolated\b/);
  assert.match(profile, /runtime publisher/i);
  assert.match(profile, /no authorship is claimed/i);
  assert.match(profile, /cannot spend/i);
  assert.match(profile, /\.json/);
  assert.match(profile, /<BlockLayout[\s\S]{0,600}\bisolated\b/);
  assert.match(layout, /\{!isolated && <PageviewBeacon \/>\}/);
  assert.match(layout, /\{!isolated && <TezosSessionBridge \/>\}/);
  assert.match(chrome, /dataset\.pcIsolated !== 'true'/);
  assert.match(chrome, /dataset\.pcIsolated === 'true'\) return/);
  assert.match(residents, /href="\/x402\/collect"[^>]*data-astro-reload/);
  assert.match(astroConfig, /discoveryDynamicPrefixes = \[[^\]]*'\/agents\/'/);
});
