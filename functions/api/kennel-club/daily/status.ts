import { authJson } from '../../auth/session.ts';

interface StatusEnv {
  KENNEL_DAILY?: Fetcher;
}

const WORKER = 'pointcast-kennel-daily';

function unavailable(reason: string, status = 503): Response {
  return authJson({
    ok: false,
    configured: false,
    ready: false,
    state: 'unavailable',
    reason,
    source: 'kennel-daily-service-binding',
    worker: WORKER,
    lastRun: null,
    providerAcceptance: null,
    deliveryOutcome: { state: 'unknown' },
  }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function dailyStatusResponse(env: StatusEnv): Promise<Response> {
  if (!env.KENNEL_DAILY) return unavailable('kennel-daily-service-not-bound');
  let response: Response;
  try {
    response = await env.KENNEL_DAILY.fetch('https://kennel-daily.internal/status', {
      headers: { Accept: 'application/json' },
    });
  } catch {
    return unavailable('kennel-daily-service-unreachable', 502);
  }
  if (!response.ok) return unavailable(`kennel-daily-status-${response.status}`, 502);
  try {
    const status = await response.json() as Record<string, unknown>;
    if (status.ok !== true || typeof status.configured !== 'boolean') {
      return unavailable('kennel-daily-status-invalid', 502);
    }
    return authJson({
      ...status,
      source: 'kennel-daily-service-binding',
      worker: WORKER,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return unavailable('kennel-daily-status-invalid', 502);
  }
}

export const onRequestGet: PagesFunction<StatusEnv> = async ({ env }) => dailyStatusResponse(env);
