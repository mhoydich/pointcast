import type { APIRoute } from 'astro';
import { NOW_PLAYING } from '../data/now-playing';
import { ART_KITTY_CAMPAIGN, BEACH_COMMONS_V5_CAMPAIGN, BELLS_BLOOM_CAMPAIGN, DRUM_COMPENDIUM_CAMPAIGN, DRUM_NOUN_UNIVERSE_CAMPAIGN, HOLDERS_CUT_CAMPAIGN, INDUSTRY_NEXT_CAMPAIGN, LOCAL_STAR_COMMONS_CAMPAIGN, NETWORK_EL_SEGUNDO_CAMPAIGN, NETWORK_FIRST_100_SIGNAL, NOUN_BATTLER_ANNUAL_CAMPAIGN, NOUNS_ABOUT_CAMPAIGN, OPEN_AD_NETWORK, OPEN_AD_PLACEMENT, OPEN_AD_PUBLISHERS, PERMISSION_LAB_CAMPAIGN, POINTCAST_ADS } from '../lib/open-ad-network';

export const GET: APIRoute = () => {
  const payload = {
    name: 'PointCast Open Ad Network receipt',
    url: 'https://pointcast.xyz/ads',
    nowPlaying: NOW_PLAYING,
    protocol: {
      contextualOnly: true,
      behavioralProfiles: false,
      aggregateEventTelemetry: true,
      visitorIdentifiers: false,
      publisherAttribution: true,
      pointerMovementTelemetry: false,
      walletSettlement: false,
      reportUrl: 'https://pointcast.xyz/ads/report',
      reportJson: 'https://pointcast.xyz/api/ad-metrics?days=30',
      note: 'The current release publishes aggregate, first-party impression and click counts. No IP, user agent, cookie, wallet, or visitor identifier is stored with an ad event. Reservation and tez settlement remain prototype-only.',
    },
    network: {
      ...OPEN_AD_NETWORK,
      publishers: OPEN_AD_PUBLISHERS,
      embed: {
        mount: '<div data-pointcast-network data-publisher="YOUR-PUBLISHER-ID" data-placement="site-footer"></div>',
        script: '<script async src="https://pointcast.xyz/open-ad-network.js"></script>',
        attributes: ['data-publisher', 'data-placement', 'data-context', 'data-theme', 'data-campaign'],
        interaction: 'CSS 3D pointer and arrow-key tilt with a reduced-motion fallback. Pointer movement is rendered locally and never transmitted.',
      },
    },
    placement: OPEN_AD_PLACEMENT,
    ownedSignals: [NETWORK_FIRST_100_SIGNAL],
    houseSeries: [NOUN_BATTLER_ANNUAL_CAMPAIGN, BEACH_COMMONS_V5_CAMPAIGN, BELLS_BLOOM_CAMPAIGN, LOCAL_STAR_COMMONS_CAMPAIGN, NETWORK_EL_SEGUNDO_CAMPAIGN, ART_KITTY_CAMPAIGN, HOLDERS_CUT_CAMPAIGN, INDUSTRY_NEXT_CAMPAIGN, NOUNS_ABOUT_CAMPAIGN, PERMISSION_LAB_CAMPAIGN, DRUM_NOUN_UNIVERSE_CAMPAIGN, DRUM_COMPENDIUM_CAMPAIGN],
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
