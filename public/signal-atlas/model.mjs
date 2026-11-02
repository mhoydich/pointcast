/**
 * Signal Atlas v0.1. Zero-dependency, read-only projection.
 * Legacy labels are UA assertions, not verified bot identities.
 */
export const VERSION = '0.1.0';
export const SITES = Object.freeze([
  { id: 'pointcast', name: 'PointCast', origin: 'https://pointcast.xyz', strength: 'Creative tools', adapter: 'legacy-visits' },
  { id: 'el-segundo', name: 'El Segundo', origin: 'https://elsegundo.xyz', strength: 'Local knowledge', adapter: null },
  { id: 'industrynext', name: 'IndustryNext', origin: 'https://www.industrynext.xyz', strength: 'Working systems', adapter: null },
]);
export const REGIONS = Object.freeze([{ id: 'ues', name: 'UES', siteId: 'pointcast', strength: 'Learning together' }]);
export const CATALOG = Object.freeze([
  { id: 'googlebot', name: 'Googlebot', role: 'Search indexer', family: 'Search', source: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers', color: 'mint' },
  { id: 'gptbot', name: 'GPTBot', role: 'Model development crawler', family: 'Research', source: 'https://developers.openai.com/api/docs/bots', color: 'coral' },
  { id: 'oai-searchbot', name: 'OAI-SearchBot', role: 'Search crawler', family: 'Search', source: 'https://developers.openai.com/api/docs/bots', color: 'gold' },
  { id: 'chatgpt-user', name: 'ChatGPT-User', role: 'User-directed fetcher', family: 'Companion', source: 'https://developers.openai.com/api/docs/bots', color: 'blue' },
  { id: 'claudebot', name: 'ClaudeBot', role: 'Model development crawler', family: 'Research', source: 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler', color: 'coral' },
  { id: 'claude-searchbot', name: 'Claude-SearchBot', role: 'Search crawler', family: 'Search', source: 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler', color: 'mint' },
  { id: 'claude-user', name: 'Claude-User', role: 'User-directed fetcher', family: 'Companion', source: 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler', color: 'blue' },
]);
const LEGACY_LABELS = Object.freeze({
  'ai:openai': 'OpenAI-family UA label', 'ai:anthropic': 'Anthropic-family UA label',
  'ai:perplexity': 'Perplexity-family UA label', 'ai:commoncrawl': 'Common Crawl UA label',
  'ai:bytedance': 'ByteDance UA label', 'ai:google': 'Google AI UA label',
  'ai:meta': 'Meta AI UA label', 'ai:cohere': 'Cohere UA label', 'ai:mistral': 'Mistral UA label',
  'ai:you': 'You.com UA label', 'bot:google': 'Googlebot UA label', 'bot:bing': 'Bingbot UA label',
  'bot:ddg': 'DuckDuckBot UA label', 'bot:yandex': 'Yandex UA label', 'bot:baidu': 'Baidu UA label',
  'bot:apple': 'Applebot UA label', 'bot:facebook': 'Facebook preview UA label',
  'bot:twitter': 'Twitter preview UA label', 'bot:linkedin': 'LinkedIn preview UA label',
  'bot:slack': 'Slack preview UA label', 'bot:discord': 'Discord preview UA label',
  'bot:telegram': 'Telegram preview UA label', 'bot:whatsapp': 'WhatsApp UA label',
});
export const COVERAGE = Object.freeze({
  source: 'PointCast legacy VISITS log',
  method: 'user-agent-classifier',
  completeness: 'partial-retained-sample',
  maxRetainedEntries: 100,
  lookbackHours: 24,
  caveats: [
    'User-agent labels can be spoofed and may group multiple products.',
    'Only some HTML GETs are recorded. API, JSON, text and asset fetches are omitted.',
    'The shared log retains at most 100 entries. Concurrent writes can lose entries.',
    'No origin verification, complete census, unique visitor total or traffic ranking is implied.',
  ],
});
export function disconnected(siteId = 'pointcast', status = 'not_connected') {
  const site = SITES.find(s => s.id === siteId);
  return { version: VERSION, siteId: site?.id ?? 'pointcast', mode: 'real',
    status: status === 'unavailable' ? status : 'not_connected', asOfDay: null,
    coverage: site?.adapter ? COVERAGE : null, observations: [], observedLabelCount: null,
    circuit: { status: 'not_open', standings: [] } };
}
export function summarizeLegacyLog(raw, { now = Date.now() } = {}) {
  if (!Number.isFinite(now) || now < 0) throw new TypeError('A valid clock is required');
  if (raw === null || raw === undefined) return disconnected();
  if (!Array.isArray(raw) || raw.length > 100) throw new TypeError('Expected a retained log of at most 100 entries');
  const labels = new Map();
  for (const row of raw) {
    if (!row || typeof row !== 'object' || typeof row.type !== 'string' ||
        !Object.hasOwn(LEGACY_LABELS, row.type) || !Number.isSafeInteger(row.t) ||
        row.t > now || row.t < now - 86_400_000) continue;
    const day = new Date(row.t).toISOString().slice(0, 10);
    const existing = labels.get(row.type);
    if (!existing || day > existing.lastObservedDay) {
      labels.set(row.type, { id: row.type.replace(':', '-'), label: LEGACY_LABELS[row.type],
        state: 'observed_unverified', lastObservedDay: day, evidence: 'legacy-ua-label',
        competitive: false });
    }
  }
  const observations = [...labels.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { version: VERSION, siteId: 'pointcast', mode: 'real', status: 'limited',
    asOfDay: new Date(now).toISOString().slice(0, 10), coverage: COVERAGE,
    observations, observedLabelCount: observations.length, circuit: { status: 'not_open', standings: [] } };
}
export function normalizeWishlist(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && CATALOG.some(bot => bot.id === id)))].slice(0, CATALOG.length);
}
export function demoSnapshot(siteId = 'pointcast') {
  const names = { pointcast: ['Lantern', 'Index Moth', 'Patch Finch'], 'el-segundo': ['Porchlight', 'Tide Reader'], industrynext: ['Relay', 'Patch Finch', 'Ledger Fox'] };
  const chosen = Object.hasOwn(names, siteId) ? siteId : 'pointcast';
  return { version: VERSION, siteId: chosen, mode: 'demo', status: 'demo', asOfDay: '2026-11-01',
    coverage: { source: 'Invented demonstration fixtures', completeness: 'demo-only', caveats: ['These characters and encounters are fictional. No public standings use them.'] },
    observations: names[chosen].map((label, index) => ({ id: 'demo-' + index, label, state: 'demo',
      lastObservedDay: '2026-11-01', evidence: 'invented-fixture', competitive: false })),
    observedLabelCount: names[chosen].length, circuit: { status: 'not_open', standings: [] } };
}
