import type { APIRoute } from 'astro';
import { DRUM_COMPENDIUM_CAMPAIGN, DRUM_NOUN_UNIVERSE_CAMPAIGN, NOUNS_ABOUT_CAMPAIGN, OPEN_AD_PLACEMENT, POINTCAST_ADS } from '../lib/open-ad-network';

export const GET: APIRoute = () => {
  const payload = {
    name: 'PointCast Open Ad Network receipt',
    url: 'https://pointcast.xyz/ads',
    protocol: {
      contextualOnly: true,
      behavioralProfiles: false,
      aggregateEventTelemetry: true,
      visitorIdentifiers: false,
      walletSettlement: false,
      reportUrl: 'https://pointcast.xyz/ads/report',
      reportJson: 'https://pointcast.xyz/api/ad-metrics?days=30',
      note: 'The current release publishes aggregate, first-party impression and click counts. No IP, user agent, cookie, wallet, or visitor identifier is stored with an ad event. Reservation and tez settlement remain prototype-only.',
    },
    placement: OPEN_AD_PLACEMENT,
    houseSeries: [NOUNS_ABOUT_CAMPAIGN, DRUM_NOUN_UNIVERSE_CAMPAIGN, DRUM_COMPENDIUM_CAMPAIGN],
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
