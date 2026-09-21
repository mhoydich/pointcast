import type { APIRoute, GetStaticPaths } from 'astro';
import {
  CABINET_PROFILES,
  buildCabinetCatalog,
  getCabinetProfile,
} from '../../data/agent-cabinet';
import {
  X402_CURRENT_SPEC_PROXY,
  X402_PAYMENT_PROFILE,
  X402_PROFILE_REVIEWED_AT,
  X402_PROXY,
  X402_WITNESS_TYPE,
} from '../../lib/x402';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = () => CABINET_PROFILES.map((profile) => ({
  params: { handle: profile.handle },
  props: { handle: profile.handle },
}));

export const GET: APIRoute = ({ props }) => {
  const profile = getCabinetProfile(String(props.handle ?? ''));
  if (!profile) {
    return new Response(JSON.stringify({
      schemaVersion: 'pointcast.agent-profile-response/v1',
      previewOnly: true,
      error: 'profile-not-found',
    }, null, 2), {
      status: 404,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const cabinet = buildCabinetCatalog();
  const proposedOffers = cabinet.offers.filter((offer) => offer.proposedFor.handle === profile.handle);
  return new Response(JSON.stringify({
    schemaVersion: 'pointcast.agent-profile-response/v1',
    previewOnly: cabinet.previewOnly,
    cabinetStatus: cabinet.status,
    profile,
    verifiedMadeOffers: [],
    proposedOffers,
    paymentProfile: {
      id: X402_PAYMENT_PROFILE,
      compatibility: 'facilitator-specific-not-canonical-current-permit2',
      spender: X402_PROXY,
      witnessType: X402_WITNESS_TYPE,
      currentCanonicalProxy: X402_CURRENT_SPEC_PROXY,
      reviewedAt: X402_PROFILE_REVIEWED_AT,
    },
    proofStateSeparation: {
      offer: cabinet.previewOnly
        ? 'Published artifact and metadata bytes plus an unsigned token plan are not a minted or live offer.'
        : 'The committed publication overlay independently records the exact mint and sponsor inventory; runtime collection availability remains a separate check.',
      payment: 'Payment requires independent settlement evidence.',
      delivery: 'NFT delivery requires a separate verified contract operation.',
      reconciliation: 'Completion requires independent x402 payment and Tezos delivery evidence; no combined countersigned receipt is issued.',
    },
    related: {
      catalog: 'https://pointcast.xyz/x402/collect.json',
      market: 'https://pointcast.xyz/x402/collect',
      challenge: 'https://pointcast.xyz/api/agent-cabinet/challenge',
      collect: 'https://pointcast.xyz/api/agent-cabinet/collect',
      status: 'https://pointcast.xyz/api/agent-cabinet/status?id={intentId}',
    },
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=900, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
