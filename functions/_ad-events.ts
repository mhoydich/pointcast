export type AdMetric = 'serve' | 'view' | 'click';

export interface AdsEnv {
  PC_ADS_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}
export type AdEvent = {
  metric: AdMetric;
  campaignId: string;
  creativeId: string;
  slot: string;
  placement: string;
  requestId: string;
};

const EVENT_TTL_SECONDS = 60 * 60 * 24 * 90;

export async function recordAdEvent(env: AdsEnv, event: AdEvent): Promise<void> {
  const occurredAt = new Date().toISOString();
  const payload = {
    ...event,
    occurredAt,
    billable: false,
    networkVersion: '0.1.0',
  };

  if (!env.PC_ADS_KV) {
    console.log(JSON.stringify({ type: 'pointcast_ad_event', storage: 'worker-log', ...payload }));
    return;
  }

  const key = `ad:event:${occurredAt}:${crypto.randomUUID()}`;
  await env.PC_ADS_KV.put(key, JSON.stringify(payload), {
    expirationTtl: EVENT_TTL_SECONDS,
  });
}

export function noStoreJson(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}
