/** Public declarations are data. Only a trusted caller may supply attestation. */
const ATTESTATION_WINDOW_MS = 24 * 60 * 60 * 1000;
// Structural family rules only; these do not attest an actual child session.
const families = new Map([
  ['@ada', { prefix: 'astra', model: 'gpt-6-astra' }],
  ['@sid', { prefix: 'sol', model: 'gpt-6.1-sol' }],
  ['@tess', { prefix: 'terra', model: 'gpt-6.1-terra' }],
  ['@lou', { prefix: 'luna', model: 'gpt-6-luna' }],
]);
const fields = ['schema', 'handle', 'name', 'parentSeat', 'model', 'runtimeId', 'job', 'ownedFiles', 'never', 'approver', 'maxCycles', 'cycle', 'expiresAt'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value, max = 256) => typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value && !/[\u0000-\u001f\u007f]/u.test(value);
const list = (value, check, max = 64) => Array.isArray(value) && value.length > 0 && value.length <= max && value.every(check) && new Set(value).size === value.length;
const path = value => text(value) && /^(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(value);
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === (value.length === 20 ? value.replace('Z', '.000Z') : value) ? ms : NaN;
}
function receipt(value) {
  if (!record(value) || !/^m_[a-z0-9]{1,64}$/.test(value.messageId) || !text(value.sourceUrl, 512)) return false;
  try {
    const url = new URL(value.sourceUrl);
    return url.origin === 'https://pointcast.xyz' && !url.username && !url.password && url.pathname === '/loom' && !url.hash &&
      [...url.searchParams.keys()].length === 1 && url.searchParams.get('to')?.match(/^loom:[a-f0-9]{24}#m_[a-z0-9]{1,64}$/)?.[0]?.endsWith(`#${value.messageId}`) === true;
  } catch { return false; }
}

/** Returns a detached declaration or null. Does not fetch, authenticate, or approve. */
export function validateDeclaration(input, { attestation = null, now = Date.now() } = {}) {
  const errors = [];
  const fail = code => errors.push(code);
  if (!record(input)) return { valid: false, verified: false, declaration: null, errors: ['invalid_declaration'] };
  if (Object.keys(input).some(key => !fields.includes(key)) || fields.some(key => !Object.hasOwn(input, key))) fail('invalid_fields');
  if (input.schema !== 'pointcast.office-declaration/v1') fail('invalid_schema');
  if (!text(input.handle, 64) || !/^@[a-z0-9][a-z0-9_-]*$/.test(input.handle)) fail('invalid_handle');
  for (const key of ['name', 'model', 'runtimeId', 'job']) if (!text(input[key], key === 'job' ? 1000 : 256)) fail(`invalid_${key}`);
  const family = families.get(input.parentSeat);
  if (!family) fail('invalid_parent');
  else {
    const child = typeof input.handle === 'string' && input.handle.match(new RegExp(`^@${family.prefix}-([1-9][0-9]*)$`));
    if (!child || input.runtimeId !== `/root/${family.prefix}_${child[1]}` || input.model !== family.model) fail('invalid_parentage');
  }
  if (!list(input.ownedFiles, path)) fail('invalid_owned_files');
  if (!list(input.never, value => text(value), 32)) fail('invalid_never');
  const a = input.approver;
  if (!record(a) || Object.keys(a).length !== 3 || a.name !== 'Mike' || a.boardIdentityIsApproval !== false ||
      !Array.isArray(a.via) || a.via.length !== 2 || a.via[0] !== 'Shwa' || a.via[1] !== 'Loom desk') fail('invalid_approver');
  if (!Number.isInteger(input.maxCycles) || input.maxCycles < 1 || input.maxCycles > 3 ||
      !Number.isInteger(input.cycle) || input.cycle < 1 || input.cycle > input.maxCycles) fail('invalid_cycles');
  const expiry = timestamp(input.expiresAt);
  if (!Number.isFinite(now) || Math.abs(now) > 8.64e15) fail('invalid_now');
  if (!Number.isFinite(expiry)) fail('invalid_expiry');
  else if (expiry <= now) fail('expired_declaration');
  if (errors.length) return { valid: false, verified: false, declaration: null, errors };
  const declaration = Object.fromEntries(fields.map(key => [key, input[key]]));
  declaration.ownedFiles = [...input.ownedFiles];
  declaration.never = [...input.never];
  declaration.approver = { name: 'Mike', via: ['Shwa', 'Loom desk'], boardIdentityIsApproval: false };
  if (attestation === null) fail('missing_attestation');
  else if (!record(attestation)) fail('invalid_attestation');
  else {
    const identity = ['handle', 'parentSeat', 'model', 'runtimeId', 'job'];
    if (identity.some(key => attestation[key] !== declaration[key]) || !Array.isArray(attestation.ownedFiles) ||
        attestation.ownedFiles.length !== declaration.ownedFiles.length ||
        declaration.ownedFiles.some((file, i) => file !== attestation.ownedFiles[i])) fail('attestation_mismatch');
    const verifiedAt = timestamp(attestation.verifiedAt);
    if (!Number.isFinite(verifiedAt) || verifiedAt > now) fail('invalid_attestation_time');
    else if (expiry - verifiedAt > ATTESTATION_WINDOW_MS) fail('stale_attestation');
    if (!receipt(attestation.declarationReceipt)) fail('invalid_attestation_receipt');
  }
  return { valid: true, verified: errors.length === 0, declaration, errors };
}
