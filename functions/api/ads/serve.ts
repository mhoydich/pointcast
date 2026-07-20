import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';
import { noStoreJson, recordAdEvent, type AdsEnv } from '../../_ad-events';
import {
  AD_NETWORK_VERSION,
  AD_SLOTS,
  isAdSlotId,
  normalizePlacement,
  selectAdCampaign,
} from '../../../src/lib/ad-network';

export const onRequestGet: PagesFunction<AdsEnv> = async (context) => {
  const rate = await rateLimit(context.request, context.env, {
    bucket: 'ads:serve',
    windowSec: 60,
    maxRequests: 180,
  });
  if (!rate.allowed) return rateLimitResponse(rate, 'ad request limit exceeded');

  const url = new URL(context.request.url);
  const slot = url.searchParams.get('slot');
  const placement = normalizePlacement(url.searchParams.get('placement'));
  if (!isAdSlotId(slot) || !placement) {
    return applyRateLimitHeaders(
      noStoreJson(
        {
          ok: false,
          error: 'slot and placement are required',
          allowedSlots: Object.keys(AD_SLOTS),
          placementPattern: 'lowercase letters, numbers, dots, underscores, colons, or hyphens; max 64',
        },
        400,
      ),
      rate,
    );
  }

  const excluded = (url.searchParams.get('exclude') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
  const requestId = crypto.randomUUID();
  const campaign = selectAdCampaign(slot, requestId, excluded);
  if (!campaign) {
    return applyRateLimitHeaders(noStoreJson({ ok: false, error: 'no eligible creative' }, 404), rate);
  }

  const origin = url.origin;
  const params = new URLSearchParams({
    campaign: campaign.id,
    creative: campaign.creativeId,
    slot,
    placement,
    request: requestId,
  });
  const event = {
    metric: 'serve' as const,
    campaignId: campaign.id,
    creativeId: campaign.creativeId,
    slot,
    placement,
    requestId,
  };
  context.waitUntil(recordAdEvent(context.env, event));

  const response = noStoreJson({
    ok: true,
    network: 'PointCast Ads',
    version: AD_NETWORK_VERSION,
    servedAt: new Date().toISOString(),
    requestId,
    placement,
    slot: AD_SLOTS[slot],
    campaign: {
      id: campaign.id,
      creativeId: campaign.creativeId,
      name: campaign.name,
      sponsor: campaign.sponsor,
      kind: campaign.kind,
    },
    creative: {
      mark: campaign.mark,
      kicker: campaign.kicker,
      headline: campaign.headline,
      body: campaign.body,
      cta: campaign.cta,
      boundary: campaign.boundary ?? null,
      theme: campaign.theme,
      destinationSurface: campaign.destinationSurface,
    },
    clickUrl: `${origin}/api/ads/click?${params}`,
    viewUrl: `${origin}/api/ads/view`,
    disclosure: 'House advertisement',
    measurement: {
      viewDefinition: '50% of the slot in view for one continuous second',
      billable: false,
      identifiers: 'No cookies, wallet addresses, fingerprinting, or cross-site identifiers',
    },
  });
  response.headers.set('Vary', 'Accept-Encoding');
  return applyRateLimitHeaders(response, rate);
};
