import {
  AGENT_CAPABILITIES,
  AGENT_CAPABILITY_MAX_BYTES,
  type CapabilityDefinition,
  type CapabilityReadiness,
} from '../../src/lib/agent-capabilities.ts';

const CACHE_SECONDS = 60;
const PROBE_TIMEOUT_MS = 5_000;
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
};

type ProbeFetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function probeKey(capability: CapabilityDefinition): string {
  return JSON.stringify(capability.probe);
}

async function runProbe(origin: string, capability: CapabilityDefinition, fetcher: ProbeFetcher) {
  const observedAt = new Date().toISOString();
  if (capability.id === 'capabilities.list') {
    return { state: 'live' as CapabilityReadiness, observedAt, status: 200, detail: 'capability handler is serving this index' };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetcher(new URL(capability.probe.path, origin), {
      method: capability.probe.method,
      headers: capability.probe.body ? { 'Content-Type': 'application/json', 'User-Agent': 'PointCast-Conformance/1.0' } : { 'User-Agent': 'PointCast-Conformance/1.0' },
      body: capability.probe.body ? JSON.stringify(capability.probe.body) : undefined,
      redirect: 'manual',
      signal: controller.signal,
    });
    const expected = capability.probe.expected.includes(response.status);
    const state: CapabilityReadiness = !expected
      ? 'unavailable'
      : capability.probe.quoteOnly
        ? 'degraded'
        : 'live';
    return {
      state,
      observedAt,
      status: response.status,
      detail: expected
        ? capability.probe.quoteOnly
          ? 'safe quote probe passed; settlement and side effects were not exercised'
          : 'safe readiness probe passed'
        : `probe returned ${response.status}; expected ${capability.probe.expected.join(' or ')}`,
    };
  } catch (error) {
    return {
      state: 'unavailable' as CapabilityReadiness,
      observedAt,
      status: null,
      detail: error instanceof Error ? error.message : 'probe failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function buildCapabilityIndex(
  request: Request,
  fetcher: ProbeFetcher = fetch,
): Promise<Record<string, unknown>> {
  const origin = new URL(request.url).origin;
  const pending = new Map<string, Promise<Awaited<ReturnType<typeof runProbe>>>>();
  for (const capability of AGENT_CAPABILITIES) {
    const key = probeKey(capability);
    if (!pending.has(key)) pending.set(key, runProbe(origin, capability, fetcher));
  }
  const capabilities = await Promise.all(AGENT_CAPABILITIES.map(async (capability) => ({
    ...capability,
    readiness: await pending.get(probeKey(capability)),
  })));
  return {
    schema: 'pointcast.agent-capabilities/v1',
    generatedAt: new Date().toISOString(),
    cacheSeconds: CACHE_SECONDS,
    contractScope: 'transactional, identity, receipt, verification, and recovery actions; editorial discovery remains in /agents.json',
    capabilityCount: capabilities.length,
    capabilities,
  };
}

export async function handleCapabilities(
  request: Request,
  options: { fetcher?: ProbeFetcher; cache?: Cache; waitUntil?: (promise: Promise<unknown>) => void } = {},
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = new Request(`${url.origin}${url.pathname}`, { headers: { Accept: 'application/json' } });
  if (!url.searchParams.has('refresh') && options.cache) {
    const cached = await options.cache.match(cacheKey);
    if (cached) return cached;
  }
  const body = JSON.stringify(await buildCapabilityIndex(request, options.fetcher));
  if (new TextEncoder().encode(body).byteLength > AGENT_CAPABILITY_MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'capability-index-exceeds-20kb' }), {
      status: 500,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
    });
  }
  const response = new Response(body, { status: 200, headers: HEADERS });
  if (options.cache) {
    const put = options.cache.put(cacheKey, response.clone());
    if (options.waitUntil) options.waitUntil(put);
    else await put;
  }
  return response;
}

export const onRequestOptions = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet: PagesFunction = async ({ request, waitUntil }) => {
  const cache = typeof caches === 'undefined' ? undefined : caches.default;
  return handleCapabilities(request, { cache, waitUntil: (promise) => waitUntil(promise) });
};
