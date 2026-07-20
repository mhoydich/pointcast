import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';
import { noStoreJson, recordAdEvent, type AdsEnv } from '../../_ad-events';
import { getAdCampaign, isAdSlotId, normalizePlacement } from '../../../src/lib/ad-network';

type ViewBody = {
  campaign?: unknown;
  creative?: unknown;
  slot?: unknown;
  placement?: unknown;
  request?: unknown;
};

export const onRequestPost: PagesFunction<AdsEnv> = async (context) => {
  const rate = await rateLimit(context.request, context.env, {
    bucket: 'ads:view',
    windowSec: 60,
    maxRequests: 120,
  });
  if (!rate.allowed) return rateLimitResponse(rate, 'ad view limit exceeded');

  const contentLength = Number(context.request.headers.get('content-length') ?? 0);
  if (contentLength > 4096) return noStoreJson({ ok: false, error: 'payload too large' }, 413);

  let body: ViewBody;
  try {
    body = await context.request.json() as ViewBody;
  } catch {
    return applyRateLimitHeaders(noStoreJson({ ok: false, error: 'invalid JSON' }, 400), rate);
  }

  const campaignId = typeof body.campaign === 'string' ? body.campaign : null;
  const creativeId = typeof body.creative === 'string' ? body.creative : null;
  const slot = typeof body.slot === 'string' ? body.slot : null;
  const placement = normalizePlacement(typeof body.placement === 'string' ? body.placement : null);
  const requestId = typeof body.request === 'string' && /^[0-9a-f-]{36}$/i.test(body.request)
    ? body.request
    : null;
  const campaign = getAdCampaign(campaignId);

  if (
    !campaign ||
    campaign.creativeId !== creativeId ||
    !isAdSlotId(slot) ||
    !campaign.slots.includes(slot) ||
    !placement ||
    !requestId
  ) {
    return applyRateLimitHeaders(noStoreJson({ ok: false, error: 'invalid ad event' }, 400), rate);
  }

  context.waitUntil(
    recordAdEvent(context.env, {
      metric: 'view',
      campaignId: campaign.id,
      creativeId: campaign.creativeId,
      slot,
      placement,
      requestId,
    }),
  );
  return applyRateLimitHeaders(new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }), rate);
};
