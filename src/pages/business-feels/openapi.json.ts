import type { APIRoute } from 'astro';

export const prerender = true;
const nullableString = { type: ['string', 'null'] };
const status = { type: 'string', enum: ['snapshot', 'fresh', 'stale', 'unavailable', 'setup-required'] };
const observation = { type: 'object', required: ['date', 'value'], properties: { date: { type: 'string', format: 'date' }, value: { type: 'number' }, preliminary: { type: 'boolean' } } };
const document = {
  openapi: '3.1.0',
  info: { title: 'PointCast Business Feels', version: '1.0.0', description: 'Public, read-only, dated economic references. Only ECB FX and U.S. Treasury support bounded request-time reads. BLS and policy data are verified snapshots. No orders, accounts, transactions or personalized advice.' },
  servers: [{ url: 'https://pointcast.xyz' }],
  'x-pointcast-read-only': true,
  security: [],
  paths: {
    '/api/business-feels': {
      get: { operationId: 'getBusinessSignals', summary: 'Read dated signals with best-effort cache and snapshot fallback', description: 'No query parameters are supported. Best-effort cached retry intervals are FX 1 hour and Treasury 6 hours. Concurrent cold cache misses or eviction can duplicate upstream reads; there is no hard per-data-center or global request cap. Cache eviction can revert to bundled evidence. No BLS runtime request is made.', responses: { '200': { description: 'Signals with independent observation, retrieval, and source health timestamps', content: { 'application/json': { schema: { $ref: '#/components/schemas/SignalSet' } } } }, '405': { description: 'Only GET, HEAD and OPTIONS are permitted' } } },
      head: { operationId: 'headBusinessSignals', summary: 'Read the same response headers without a body', responses: { '200': { description: 'Read-only public response headers' } } },
      options: { operationId: 'optionsBusinessSignals', responses: { '204': { description: 'Public CORS methods: GET, HEAD, OPTIONS' } } },
    },
    '/business-feels.json': { get: { operationId: 'getBusinessSignalsSnapshot', summary: 'Read build-time bundled evidence without upstream requests', responses: { '200': { description: 'Dated snapshot; generatedAt is build time, not a live verification time', content: { 'application/json': { schema: { $ref: '#/components/schemas/SignalSet' } } } } } } },
  },
  components: { schemas: {
    Signal: {
      type: 'object', required: ['id', 'title', 'category', 'unit', 'frequency', 'sourceId', 'sourceUrl', 'observationDate', 'value', 'history', 'status', 'fetchedAt', 'lastSuccessAt', 'staleAfterDays', 'context', 'drivers', 'matters'],
      properties: { id: { type: 'string' }, title: { type: 'string' }, category: { type: 'string', enum: ['policy', 'yields', 'economy', 'mortgage', 'commodities'] }, unit: { type: 'string' }, frequency: { type: 'string' }, sourceId: { type: 'string' }, sourceUrl: { type: 'string', format: 'uri' }, observationDate: { type: ['string', 'null'], format: 'date' }, releaseDate: { type: 'string', format: 'date' }, dateMeaning: { type: 'string' }, value: { type: ['number', 'null'] }, history: { type: 'array', items: observation }, status, fetchedAt: { ...nullableString, format: 'date-time' }, lastSuccessAt: { ...nullableString, format: 'date-time' }, staleAfterDays: { type: 'number' }, delivery: { type: 'string', enum: ['snapshot', 'runtime', 'disabled'] }, drivers: { type: 'string' }, matters: { type: 'string' }, context: { type: 'string' }, preliminary: { type: 'boolean' } },
    },
    SourceHealth: {
      type: 'object', required: ['id', 'title', 'sourceUrl', 'frequency', 'licenseUrl', 'status', 'fetchedAt', 'lastSuccessAt', 'lastAttemptAt', 'lastError', 'reason', 'cacheSeconds', 'runtimeEnabled'],
      properties: { id: { type: 'string' }, title: { type: 'string' }, sourceUrl: { type: 'string', format: 'uri' }, frequency: { type: 'string' }, licenseUrl: { type: 'string', format: 'uri' }, status, fetchedAt: { ...nullableString, format: 'date-time' }, lastSuccessAt: { ...nullableString, format: 'date-time' }, lastAttemptAt: { ...nullableString, format: 'date-time' }, lastError: { oneOf: [{ type: 'null' }, { type: 'object', required: ['at', 'message'], properties: { at: { type: 'string', format: 'date-time' }, message: { type: 'string' } } }] }, reason: { type: 'string' }, cacheSeconds: { type: 'integer' }, runtimeEnabled: { type: 'boolean' } },
    },
    Fx: {
      type: ['object', 'null'], required: ['base', 'date', 'rates', 'history', 'sourceId', 'status', 'fetchedAt', 'lastSuccessAt', 'staleAfterDays', 'disclaimer'],
      properties: { base: { const: 'EUR' }, date: { type: 'string', format: 'date' }, rates: { type: 'object', additionalProperties: { type: 'number', exclusiveMinimum: 0 }, description: 'Units of currency per EUR. Every current rate shares the same date.' }, history: { type: 'array', items: { type: 'object', required: ['date', 'rates'], properties: { date: { type: 'string', format: 'date' }, rates: { type: 'object', additionalProperties: { type: 'number' } } } } }, sourceId: { const: 'ecb-fx' }, status, fetchedAt: nullableString, lastSuccessAt: nullableString, staleAfterDays: { type: 'number' }, disclaimer: { type: 'string' } },
    },
    YieldCurve: { type: ['object', 'null'], required: ['date', 'points', 'sourceId', 'status'], properties: { date: { type: 'string', format: 'date' }, points: { type: 'array', items: { type: 'object', required: ['tenor', 'years', 'value'], properties: { tenor: { type: 'string' }, years: { type: 'number' }, value: { type: 'number', description: 'Par yield, percent' } } } }, sourceId: { const: 'treasury' }, status, fetchedAt: nullableString, lastSuccessAt: nullableString } },
    SignalSet: { type: 'object', required: ['schemaVersion', 'generatedAt', 'mode', 'series', 'fx', 'yieldCurve', 'sourceHealth', 'disclosures'], properties: { schemaVersion: { const: 'pointcast.business-feels/v1' }, generatedAt: { type: 'string', format: 'date-time' }, verifiedAt: { type: 'string', format: 'date-time', description: 'Manual bundle verification time' }, mode: { enum: ['snapshot', 'mixed'] }, series: { type: 'array', items: { $ref: '#/components/schemas/Signal' } }, fx: { $ref: '#/components/schemas/Fx' }, yieldCurve: { $ref: '#/components/schemas/YieldCurve' }, sourceHealth: { type: 'array', items: { $ref: '#/components/schemas/SourceHealth' } }, disclosures: { type: 'array', items: { type: 'string' } }, cache: { type: 'object', description: 'Best-effort per-data-center retention and any cache failure. Does not guarantee a global API quota.' } } },
  } },
};
export const GET: APIRoute = () => new Response(JSON.stringify(document, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
