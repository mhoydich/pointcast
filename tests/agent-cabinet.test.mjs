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
    const [data, catalogRoute, profileRoute, shared] = await Promise.all([
      server.ssrLoadModule('/src/data/agent-cabinet.ts'),
      server.ssrLoadModule('/src/pages/x402/collect.json.ts'),
      server.ssrLoadModule('/src/pages/agents/[handle].json.ts'),
      server.ssrLoadModule('/functions/api/agent-cabinet/_shared.ts'),
    ]);
    return await run({ data, catalogRoute, profileRoute, shared });
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
      assert.equal(offer.status, 'publication-prepared');
      assert.equal('creator' in offer, false);
      assert.match(offer.proposedFor.residentIdentityId, /^pcr_/);
      assert.equal(offer.creatorAuthorization.status, 'unverified');
      assert.equal(offer.creatorAuthorization.runtimePublisherId, null);
      assert.equal(offer.creatorAuthorization.signature, null);
      const proposedProfile = data.CABINET_PROFILES.find((profile) => profile.handle === offer.proposedFor.handle);
      assert.ok(proposedProfile, `missing proposed profile ${offer.proposedFor.handle}`);
      assert.ok(proposedProfile.proposedOfferSlugs.includes(offer.slug));
      assert.equal(offer.edition.kept, 0);
      assert.match(offer.image.url, /^https:\/\/pointcast\.xyz\/collectibles\/agent-cabinet\/artifacts\/.+\.svg$/u);
      assert.match(offer.image.hash, /^[a-f0-9]{64}$/u);
      assert.equal(offer.artifact.uri, offer.image.url);
      assert.equal(offer.artifact.contentHash, offer.image.hash);
      assert.match(offer.artifact.metadataUri, new RegExp(`${offer.artifact.metadataHash}\\.json$`, 'u'));
      assert.match(offer.artifact.metadataHash, /^[a-f0-9]{64}$/u);
      assert.equal(offer.edition.supplyCap, 27);
      assert.equal(offer.payment.enabled, false);
      assert.equal(offer.payment.protocol, 'x402');
      assert.equal(offer.payment.network, 'eip155:42793');
      assert.equal(offer.payment.method, 'Permit2');
      assert.equal(offer.payment.permit2, '0x000000000022D473030F116dDEE9F6B43aC78BA3');
      assert.equal(offer.payment.profile, 'pointcast.bubbletez-permit2-exact/v1');
      assert.equal(offer.payment.profileStatus, 'facilitator-specific');
      assert.equal(offer.payment.canonicalCurrentX402Permit2Compatible, false);
      assert.equal(offer.payment.asset.symbol, 'USDC');
      assert.equal(offer.payment.asset.address, '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9');
      assert.equal(offer.payment.amount.units, '10000');
      assert.equal(offer.payment.payTo, '0x48e8479b4906d45fbe702a18ac2454f800238b37');
      assert.equal(offer.delivery.enabled, false);
      assert.equal(offer.delivery.network, 'tezos');
      assert.equal(offer.delivery.standard, 'FA2');
      assert.equal(offer.delivery.contract, 'KT1N1U6esJHuhLpUKiebpyW9MJUCoqJyREtb');
      assert.match(offer.delivery.tokenId, /^(?:10|11|12)$/u);
      assert.equal(offer.delivery.status, 'prepared-only');
      assert.equal(offer.delivery.recipientRequired, true);
      assert.equal(offer.delivery.walletProofRequired, true);
      assert.deepEqual(offer.proofStates.map((proof) => proof.stage), [
        'offer-published',
        'payment-settled',
        'nft-delivered',
        'rails-reconciled',
      ]);
      assert.equal(offer.proofStates[0].status, 'preview-only');
      assert.ok(offer.proofStates.slice(1).every((proof) => proof.status === 'not-run' && proof.evidence === null));
    }
  });
});

test('the paid API cannot open ahead of the committed public inventory state', async () => {
  const [prepared, provenance] = await Promise.all([
    read('src/data/agent-cabinet-publication.json').then(JSON.parse),
    read('src/data/agent-cabinet-provenance.json').then(JSON.parse),
  ]);
  await withModules(async ({ data, shared }) => {
    const operationHash = `o${'1'.repeat(50)}`;
    const live = {
      ...prepared,
      schema: 'pointcast.agent-cabinet.verified-publication/v1',
      status: 'minted',
      verified: true,
      verifiedAt: '2026-09-21T22:00:00.000Z',
      mainnetApproved: true,
      requestable: true,
      operationHash,
      level: 10_000_000,
      publisherAuthorization: { status: 'approved', administrator: prepared.administrator, operationHash },
      inventoryEvidence: provenance.items.map((item) => ({
        slug: item.slug,
        tokenId: String(item.id),
        metadataSha256: item.metadataSha256,
        artifactSha256: item.artifactSha256,
        totalSupply: item.editions,
        inventoryBalance: item.editions,
        confirmations: 2,
      })),
    };
    const env = {
      AUTH_DB: {},
      AGENT_CABINET_ENABLED: 'true',
      AGENT_CABINET_MAINNET_APPROVED: 'true',
      AGENT_CABINET_X402_PROFILE_APPROVED: 'pointcast.bubbletez-permit2-exact/v1',
      AGENT_CABINET_PUBLICATION_JSON: JSON.stringify(live),
      AGENT_CABINET_SPONSOR_ADDRESS: prepared.inventoryRecipient,
      AGENT_CABINET_SPONSOR_SECRET_KEY: 'test-only',
      AGENT_CABINET_RPC_URL: 'https://rpc.invalid',
      AGENT_CABINET_MAX_OPERATION_MUTEZ: '5000',
      AGENT_CABINET_TOTAL_BUDGET_MUTEZ: '500000',
    };
    assert.equal(await shared.configuration(env), null, 'an env-only publication cannot outrun the checked-in overlay');
    assert.ok(await shared.configuration(env, live), 'the same committed live overlay can open runtime configuration');
    delete env.AGENT_CABINET_X402_PROFILE_APPROVED;
    assert.equal(await shared.configuration(env, live), null, 'the named facilitator profile requires separate launch approval');
    env.AGENT_CABINET_X402_PROFILE_APPROVED = 'pointcast.bubbletez-permit2-exact/v1';
    const catalog = data.buildCabinetCatalog(live);
    assert.equal(catalog.previewOnly, false);
    assert.equal(catalog.counts.liveOffers, 3);
    assert.ok(catalog.offers.every((offer) => offer.payment.enabled && offer.delivery.enabled));
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

test('Agent Cabinet browser surfaces document the gated protocol without executing purchases', async () => {
  const [market, profile, profileJson, wellKnownPayments, forAgents, capabilities, layout, chrome, residents, astroConfig] = await Promise.all([
    read('src/pages/x402/collect.astro'),
    read('src/pages/agents/[handle].astro'),
    read('src/pages/agents/[handle].json.ts'),
    read('src/pages/.well-known/agent-payments.json.ts'),
    read('src/pages/for-agents.astro'),
    read('src/lib/agent-capabilities.ts'),
    read('src/layouts/BlockLayout.astro'),
    read('src/scripts/chrome.ts'),
    read('src/pages/residents.astro'),
    read('astro.config.mjs'),
  ]);
  assert.match(market, /preview[- ]only/i);
  assert.match(market, /no money/i);
  assert.match(market, /approval_required/);
  assert.match(market, /No resident authorship[\s\S]{0,120}publication signature is\s+claimed/i);
  assert.doesNotMatch(market, /offer\.creator/);
  assert.match(market, /collect\.json/);
  assert.match(market, /Payment-Signature/);
  assert.match(market, /quote POST → paid POST → zero or more server-directed delivery-resume POSTs/);
  assert.match(market, /intent\.next\.action[\s\S]{0,400}poll-status/);
  assert.match(market, /will not be resubmitted/i);
  assert.match(market, /buildCabinetCatalog\(\)/);
  assert.match(market, /cabinet\.counts\.liveOffers/);
  assert.match(market, /facilitator-specific BubbleTez\/TZAPAC Permit2 profile/i);
  assert.match(market, /not the current canonical x402 Permit2 typed-data/i);
  assert.doesNotMatch(market, /<strong>0<\/strong><span>live offers/);
  assert.doesNotMatch(market, /\bfetch\s*\(/);
  assert.doesNotMatch(market, /<form\b[^>]*\s(?:action|method)=/i);
  assert.match(market, /<BlockLayout[\s\S]{0,900}\bisolated\b/);
  assert.match(profile, /runtime publisher/i);
  assert.match(profile, /no authorship is claimed/i);
  assert.match(profile, /cannot spend/i);
  assert.match(profile, /buildCabinetCatalog\(\)/);
  assert.match(profile, /\.json/);
  assert.match(profile, /<BlockLayout[\s\S]{0,600}\bisolated\b/);
  assert.match(profileJson, /previewOnly: cabinet\.previewOnly/);
  assert.match(profileJson, /facilitator-specific-not-canonical-current-permit2/);
  assert.match(wellKnownPayments, /status: cabinet\.status\.offers/);
  assert.match(wellKnownPayments, /current_canonical_proxy: X402_CURRENT_SPEC_PROXY/);
  assert.match(forAgents, /AGENT_CABINET_PUBLICATION_LIVE/);
  assert.match(forAgents, /not generic compatibility with current canonical x402 Permit2 typed data/i);
  assert.match(capabilities, /publicationAvailability: CABINET_PUBLICATION_AVAILABILITY/g);
  assert.match(capabilities, /paymentProfile: CABINET_PAYMENT_PROFILE/);
  assert.match(layout, /\{!isolated && <PageviewBeacon \/>\}/);
  assert.match(layout, /\{!isolated && <TezosSessionBridge \/>\}/);
  assert.match(chrome, /dataset\.pcIsolated !== 'true'/);
  assert.match(chrome, /dataset\.pcIsolated === 'true'\) return/);
  assert.match(residents, /href="\/x402\/collect"[^>]*data-astro-reload/);
  assert.match(astroConfig, /discoveryDynamicPrefixes = \[[^\]]*'\/agents\/'/);
});
