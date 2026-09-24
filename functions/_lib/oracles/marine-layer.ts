import { OracleUnavailable } from '../oracle-errors.ts';
import type { OracleSpec } from '../oracle-kit.ts';
import {
  answerMarine,
  MARINE_ROOM,
  marineBodyFromParams,
  MarineSourceError,
  parseMarineQuery,
  previewMarine,
  type MarineDeps,
  type MarineQuery,
} from '../../../src/lib/marine-oracle.ts';

/** Cloudflare Cache API when present (production), a pass-through elsewhere (tests, node). */
async function edgeCached(url: string, ttlSeconds: number, load: () => Promise<string>): Promise<string> {
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  if (!cache) return load();
  const key = new Request(`${url}${url.includes('?') ? '&' : '?'}__pointcast_oracle=1`);
  try {
    const hit = await cache.match(key);
    if (hit) return await hit.text();
  } catch { /* a cache miss is fine */ }
  const text = await load();
  try {
    await cache.put(key, new Response(text, { headers: { 'Cache-Control': `public, max-age=${ttlSeconds}` } }));
  } catch { /* caching is best effort */ }
  return text;
}

const deps = (): MarineDeps => ({ fetch: (url) => fetch(url, { headers: { 'User-Agent': 'PointCast Marine Layer Oracle (pointcast.xyz)' } }), now: new Date(), cached: edgeCached });

const guard = async <T>(run: () => Promise<T>): Promise<T> => {
  try { return await run(); }
  catch (error) {
    if (error instanceof MarineSourceError) throw new OracleUnavailable(error.message, 60);
    throw error;
  }
};

/** The Marine Layer Oracle: did the sky over El Segundo open this morning, and when. */
export const MARINE_ORACLE: OracleSpec<MarineQuery> = {
  id: 'marine-layer',
  action: 'oracle-marine',
  name: 'Marine Layer Oracle',
  room: 'https://pointcast.xyz/oracles/marine-layer',
  description: 'The Marine Layer Oracle: did the coastal stratus over El Segundo, CA burn off on a given morning, and when? Judged from KLAX hourly reports (NOAA / Iowa State ASOS) with a published rule: BKN/OVC/VV deck under 3000 ft, cleared and held 2 hours after sunrise. Returns verdict, final flag, hourly reports, raw METARs, sources, signed attestation. Any date since 2000.',
  tags: ['weather', 'marine-layer', 'fog', 'oracle', 'los-angeles', 'resolution-source'],
  contributor: {
    name: 'noaa-asos',
    address: null,
    terms: 'Public-domain federal observations. The network half accrues to the town weather commons; it is not owed to NOAA.',
  },
  parse: (input) => parseMarineQuery(input),
  fromParams: marineBodyFromParams,
  answer: (query) => guard(() => answerMarine(query, deps())),
  preview: () => guard(() => previewMarine(deps())),
  discovery: {
    input: { date: '2026-09-23' },
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'El Segundo local date (YYYY-MM-DD), 2000-01-01 through today. Omit for this morning.' },
      },
      additionalProperties: false,
    },
    output: {
      example: {
        ok: true,
        oracle: 'marine-layer',
        result: {
          answer: { date: '2026-09-23', verdict: { state: 'opened', final: true, openedAt: '10:53 am', lowestCeilingFt: 1100, sentence: 'the sky opened at 10:53 am.' } },
          attestation: { signed: true, alg: 'Ed25519' },
        },
      },
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          oracle: { type: 'string' },
          result: {
            type: 'object',
            properties: {
              answer: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  verdict: {
                    type: 'object',
                    properties: {
                      state: { type: 'string', enum: ['opened', 'never', 'no-layer', 'no-record', 'watching'] },
                      final: { type: 'boolean' },
                      openedAt: { type: ['string', 'null'] },
                      lowestCeilingFt: { type: ['number', 'null'] },
                    },
                    required: ['state', 'final'],
                  },
                  observations: { type: 'array', items: { type: 'object' } },
                  sources: { type: 'array', items: { type: 'object' } },
                },
                required: ['date', 'verdict'],
              },
              attestation: { type: 'object' },
            },
            required: ['answer', 'attestation'],
          },
        },
        required: ['ok', 'result'],
      },
    },
  },
};

export { MARINE_ROOM };
