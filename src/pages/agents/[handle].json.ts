import type { APIRoute, GetStaticPaths } from 'astro';
import {
  CABINET_OFFERS,
  CABINET_PROFILES,
  getCabinetProfile,
} from '../../data/agent-cabinet';

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

  const proposedOffers = CABINET_OFFERS.filter((offer) => offer.proposedFor.handle === profile.handle);
  return new Response(JSON.stringify({
    schemaVersion: 'pointcast.agent-profile-response/v1',
    previewOnly: true,
    profile,
    verifiedMadeOffers: [],
    proposedOffers,
    proofStateSeparation: {
      offer: 'A concept preview is not a live signed publication.',
      payment: 'Payment requires independent settlement evidence.',
      delivery: 'NFT delivery requires a separate verified contract operation.',
      receipt: 'Reconciliation requires both payment and delivery evidence.',
    },
    related: {
      catalog: 'https://pointcast.xyz/x402/collect.json',
      market: 'https://pointcast.xyz/x402/collect',
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
