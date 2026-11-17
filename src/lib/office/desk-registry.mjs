/** Pure projection of trusted declaration validation results; never execution evidence. */
const SCHEMA = 'pointcast.office-data/v1';
const PROVENANCE = 'https://pointcast.xyz/images/ufogp/provenance.json';
// Existing whole portraits recorded in that manifest; cards/flags are not portraits.
const ART = new Set(['ada', 'sid', 'tess', 'lou', 'mike', 'loom-desk']
  .map(name => `/images/ufogp/${name}.svg`));
const handleOK = value => typeof value === 'string' && /^@[a-z0-9][a-z0-9_-]{0,63}$/.test(value);
const textOK = value => typeof value === 'string' && value.length > 0 && value.length <= 2000;
const objectOK = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function expiry(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return NaN;
  const time = Date.parse(value);
  if (!Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== value.replace('.000Z', 'Z')) return NaN;
  return time;
}

function receiptUrl(receipt) {
  if (!/^m_[a-z0-9]{1,64}$/.test(receipt?.messageId ?? '') || !textOK(receipt?.sourceUrl)) return null;
  try {
    const url = new URL(receipt.sourceUrl);
    if (url.origin !== 'https://pointcast.xyz' || url.pathname !== '/loom' || url.hash || url.username || url.password) return null;
    if ([...url.searchParams.keys()].join(',') !== 'to') return null;
    if (!new RegExp(`^loom:[a-f0-9]{24}#${receipt.messageId}$`).test(url.searchParams.get('to'))) return null;
    return url.href;
  } catch { return null; }
}

function portraitFor(portrait) {
  if (!objectOK(portrait) || portrait.whole !== true || portrait.provenance !== 'official-nouns-traits'
    || !ART.has(portrait.src) || portrait.sourceUrl !== PROVENANCE) return null;
  return { src: portrait.src, whole: true, provenance: 'official-nouns-traits', sourceUrl: PROVENANCE };
}

/**
 * Pass validation results directly from validateDeclaration with trusted attestations.
 * Never deserialize public-board "valid"/"verified" flags as validation results.
 * Portrait assignment is explicit caller data, not an identity claim or inferred roster.
 */
export function buildDeskRegistry({ declarations = [], portraits = {}, now = Date.now() } = {}) {
  const result = { schema: SCHEMA, state: 'idle', observedAt: null, sourceUrl: null,
    data: { desks: [], unresolved: [] }, errors: [] };
  const fail = code => { result.state = 'error'; result.errors.push(code); return result; };
  if (!Number.isFinite(now) || Math.abs(now) > 8.64e15) return fail('invalid_now');
  if (!Array.isArray(declarations) || declarations.length > 256 || !objectOK(portraits)
    || Object.keys(portraits).length > 256) return fail('invalid_input');
  result.observedAt = new Date(now).toISOString(); // Assembly time, never agent activity.
  const counts = new Map();
  for (const record of declarations) {
    const handle = record?.validation?.declaration?.handle;
    if (handleOK(handle)) counts.set(handle, (counts.get(handle) ?? 0) + 1);
  }
  const seen = new Set();
  const issue = (handle, state, code) => {
    result.data.unresolved.push({ handle, state, errors: [code] });
    if (!result.errors.includes(code)) result.errors.push(code);
  };
  for (const record of declarations) {
    const validation = record?.validation;
    const card = validation?.declaration;
    if (!objectOK(card) || !handleOK(card.handle)) {
      const expired = Array.isArray(validation?.errors) && validation.errors.includes('expired_declaration');
      issue(null, expired ? 'stale' : 'unverified', expired ? 'expired_declaration' : 'missing_declaration');
      continue;
    }
    const handle = card.handle;
    if (seen.has(handle)) continue;
    seen.add(handle);
    const sourceUrl = receiptUrl(record.receipt);
    const portrait = portraitFor(Object.hasOwn(portraits, handle) ? portraits[handle] : null);
    const expires = expiry(card.expiresAt);
    let state = 'idle';
    let code = null;
    if (counts.get(handle) > 1) { state = 'error'; code = 'duplicate_handle'; }
    else if (!Number.isFinite(expires)) { state = 'error'; code = 'invalid_expiry'; }
    else if (expires <= now) { state = 'stale'; code = 'expired_declaration'; }
    else if (Array.isArray(validation.errors) && validation.errors.includes('stale_attestation')) { state = 'stale'; code = 'stale_attestation'; }
    else if (validation.valid !== true || validation.verified !== true) { state = 'unverified'; code = 'unverified_declaration'; }
    else if (!sourceUrl) { state = 'unverified'; code = 'missing_receipt'; }
    else if (![card.name, card.runtimeId, card.model, card.job].every(textOK)
      || !Array.isArray(card.ownedFiles) || card.ownedFiles.length === 0
      || card.ownedFiles.length > 64 || !card.ownedFiles.every(textOK)) { state = 'error'; code = 'invalid_card'; }
    else if (!portrait) { state = 'unverified'; code = 'unverified_portrait'; }
    if (code) issue(handle, state, code);
    result.data.desks.push({ handle, name: textOK(card.name) ? card.name : null,
      runtimeId: textOK(card.runtimeId) ? card.runtimeId : null, model: textOK(card.model) ? card.model : null,
      job: textOK(card.job) ? card.job : null,
      ownedFiles: Array.isArray(card.ownedFiles) ? card.ownedFiles.filter(textOK).slice(0, 64) : [],
      eligible: state === 'idle', state, portrait, sourceUrl });
  }
  for (const handle of Object.keys(portraits)) {
    if (!seen.has(handle)) issue(handleOK(handle) ? handle : null, 'unverified', 'missing_declaration');
  }
  if (result.data.unresolved.some(item => item.state === 'error')) result.state = 'error';
  else if (result.data.unresolved.some(item => item.state === 'stale')) result.state = 'stale';
  else if (result.data.desks.some(desk => desk.eligible)) result.state = 'ok';
  return result;
}
