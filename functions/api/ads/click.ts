import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';
import { recordAdEvent, type AdsEnv } from '../../_ad-events';
import {
  destinationWithAttribution,
  getAdCampaign,
  isAdSlotId,
  normalizePlacement,
} from '../../../src/lib/ad-network';

export const onRequestGet: PagesFunction<AdsEnv> = async (context) => {
  const rate = await rateLimit(context.request, context.env, {
    bucket: 'ads:click',
    windowSec: 60,
    maxRequests: 60,
  });
  if (!rate.allowed) return rateLimitResponse(rate, 'ad click limit exceeded');

  const url = new URL(context.request.url);
  const campaign = getAdCampaign(url.searchParams.get('campaign'));
  const creativeId = url.searchParams.get('creative');
  const slot = url.searchParams.get('slot');
  const placement = normalizePlacement(url.searchParams.get('placement'));
  const requestId = url.searchParams.get('request');

  if (
    !campaign ||
    campaign.creativeId !== creativeId ||
    !isAdSlotId(slot) ||
    !campaign.slots.includes(slot) ||
    !placement ||
    !requestId ||
    !/^[0-9a-f-]{36}$/i.test(requestId)
  ) {
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: new URL('/ad-network?ad_error=invalid', url).toString(),
        'Cache-Control': 'no-store',
      },
    });
    return applyRateLimitHeaders(response, rate);
  }

  context.waitUntil(
    recordAdEvent(context.env, {
      metric: 'click',
      campaignId: campaign.id,
      creativeId: campaign.creativeId,
      slot,
      placement,
      requestId,
    }),
  );

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: destinationWithAttribution(campaign, placement),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
  return applyRateLimitHeaders(response, rate);
};
