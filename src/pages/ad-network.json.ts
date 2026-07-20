import type { APIRoute } from 'astro';
import { AD_CAMPAIGNS, AD_NETWORK_VERSION, AD_SLOTS } from '../lib/ad-network';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/schemas/ad-network-v1.json',
    network: 'PointCast Ads',
    version: AD_NETWORK_VERSION,
    status: 'house-alpha',
    human: 'https://pointcast.xyz/ad-network',
    serveEndpoint: 'https://pointcast.xyz/api/ads/serve{?slot,placement,exclude}',
    clickEndpoint: 'https://pointcast.xyz/api/ads/click',
    viewEndpoint: 'https://pointcast.xyz/api/ads/view',
    standards: {
      posture: 'IAB-compatible fixed units with responsive rendering; not an IAB certification claim',
      portfolio: 'https://iabtechlab.com/standards/iab-new-ad-portfolio-guidelines/',
      lean: ['lightweight', 'encrypted delivery', 'clear disclosure', 'non-invasive creative'],
    },
    measurement: {
      viewedImpression: '50% of the slot in view for one continuous second',
      billable: false,
      retentionDays: 90,
      identifiers: [],
      notes: 'No cookies, wallet addresses, fingerprinting, or cross-site identifiers. Device-local recent-view state is used only to improve rotation.',
    },
    slots: Object.values(AD_SLOTS),
    campaigns: AD_CAMPAIGNS.map((campaign) => ({
      id: campaign.id,
      creativeId: campaign.creativeId,
      name: campaign.name,
      sponsor: campaign.sponsor,
      kind: campaign.kind,
      status: campaign.status,
      startsAt: campaign.startsAt,
      slots: campaign.slots,
      destinationSurface: campaign.destinationSurface,
      creative: {
        mark: campaign.mark,
        kicker: campaign.kicker,
        headline: campaign.headline,
        body: campaign.body,
        cta: campaign.cta,
        boundary: campaign.boundary ?? null,
        theme: campaign.theme,
      },
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
