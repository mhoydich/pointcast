export const AI_SERVICES_PATH = '/ai/services';
export const AI_VALUE_PATH = '/ai/value';
export const AI_RANKING_METRICS = {
  'web-visits': 'Web visits',
  'mobile-mau': 'Mobile monthly active users',
  'consumer-card-spend': 'Observed U.S. consumer-card spend',
};
const readable = value => typeof value === 'string' && value.trim().length > 0;
const list = value => Array.isArray(value) && value.length > 0 && value.every(readable);
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
export const aiServicePath = service => `${AI_SERVICES_PATH}/${service.slug}`;

export function assertAIService(service) {
  if (!service || typeof service !== 'object') throw new Error('A researched service entry is required.');
  for (const field of ['slug', 'name', 'dek', 'category']) if (!readable(service[field])) throw new Error(`Missing service ${field}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service.slug)) throw new Error('Invalid service route.');
  if (!['service', 'vendor'].includes(service.entityType)) throw new Error('Identify a service or vendor without substituting one for the other.');
  if (!date(service.checkedDate)) throw new Error('Dated research is required.');
  if (service.identityStatus === 'unresolved') {
    if (service.officialUrl !== null || !list(service.identityNotes)) throw new Error('An unresolved chart identity needs a readable explanation and no confirmed-product CTA.');
  } else if (!https(service.officialUrl)) throw new Error('Resolved identities need a verified official destination.');
  if (!list(service.about)) throw new Error('An original source-grounded service description is required.');
  if (!Array.isArray(service.useCases) || service.useCases.length < 2 || service.useCases.some(use => !readable(use.title) || !list(use.paragraphs))) throw new Error('At least two explained use cases are required.');
  if (!list(service.limitations) || !list(service.privacy?.paragraphs) || !date(service.privacy?.checkedDate)) throw new Error('Limitations and dated privacy context are required.');
  if (!['published', 'not-public', 'unclear'].includes(service.pricing?.status) || !date(service.pricing?.checkedDate) || !list(service.pricing?.paragraphs)) throw new Error('Pricing needs a dated explanation of availability and billing terms.');
  if (!Array.isArray(service.alternatives) || !service.alternatives.length || service.alternatives.some(alt => !readable(alt.name) || (!https(alt.officialUrl) && !readable(alt.internalSlug)) || !readable(alt.reason))) throw new Error('Alternatives require real identities and explained comparisons.');
  if (!readable(service.companions?.industrynext?.title) || !list(service.companions.industrynext.paragraphs) || !readable(service.companions?.ues?.title) || !list(service.companions.ues.prompts)) throw new Error('Complete work and independent-learning companions are required.');
  if (!Array.isArray(service.sources) || !service.sources.length) throw new Error('An inspectable service source ledger is required.');
  const ids = new Set();
  for (const source of service.sources) {
    if (!readable(source.id) || ids.has(source.id) || !readable(source.title) || !readable(source.publisher) || !https(source.url)) throw new Error('Service sources need unique IDs and real HTTPS references.');
    ids.add(source.id);
  }
  const cited = [service, service.pricing, service.privacy, ...service.useCases, ...service.alternatives, service.companions.industrynext, service.companions.ues];
  for (const section of cited) if (!Array.isArray(section.sourceIds) || !section.sourceIds.length || section.sourceIds.some(id => !ids.has(id))) throw new Error('Every service section needs known source references.');
  if (!Array.isArray(service.rankings) || !service.rankings.length) throw new Error('Keep the source inventory membership explicit.');
  const metrics = new Set();
  for (const ranking of service.rankings) {
    if (!AI_RANKING_METRICS[ranking.metric] || metrics.has(ranking.metric) || !Number.isInteger(ranking.rank) || ranking.rank < 1 || ranking.rank > 50 || ranking.edition !== 7 || !['product', 'vendor'].includes(ranking.scope) || !readable(ranking.measurementPeriod) || !readable(ranking.geography) || !readable(ranking.sourceLabel) || !readable(ranking.caveat) || !ids.has(ranking.sourceId)) throw new Error('Rankings need their separate metric, rank, entity label/scope, caveat, period, geography and source.');
    metrics.add(ranking.metric);
  }
  return service;
}

export function assertAIServiceDirectory(directory, { requireCompleteInventory = true } = {}) {
  if (!directory || !Array.isArray(directory.services) || !directory.services.length || !readable(directory.methodology) || !date(directory.checkedDate)) throw new Error('Do not publish an empty or unsourced service directory.');
  const slugs = new Set(); const slots = new Set();
  for (const service of directory.services) {
    assertAIService(service);
    if (slugs.has(service.slug)) throw new Error('Duplicate service identity route.');
    slugs.add(service.slug);
    for (const rank of service.rankings) { const key = `${rank.metric}:${rank.rank}`; if (slots.has(key)) throw new Error('Duplicate ranking slot.'); slots.add(key); }
  }
  if (requireCompleteInventory && (slugs.size !== 110 || slots.size !== 150)) throw new Error('Reconcile all 110 deduplicated entries and 150 ranking slots before publishing this inventory.');
  return directory;
}
