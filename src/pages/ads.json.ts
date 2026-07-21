import type { APIRoute } from 'astro';
import { OPEN_AD_PLACEMENT, POINTCAST_ADS } from '../lib/open-ad-network';

export const GET: APIRoute = () => {
  const payload = {
    name: 'PointCast Open Ad Network receipt',
    url: 'https://pointcast.xyz/ads',
    protocol: {
      contextualOnly: true,
      behavioralProfiles: false,
      impressionTracking: false,
      walletSettlement: false,
      note: 'The current release serves static contextual house ads. Reservation and tez settlement remain prototype-only.',
    },
    placement: OPEN_AD_PLACEMENT,
    campaigns: POINTCAST_ADS,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
