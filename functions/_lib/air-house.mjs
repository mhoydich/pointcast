// Who is house, for Field Reports v2 counts (the kill test and the paper's
// busiest-court pick). Pure and import-free so the Pages functions, the
// edition and the tests share one rule
// (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §2.1, §3.1).
//
// A report row is house when its phone or account is on air_house, or its
// account is a director account: a `broadcaster` or `director` role, or the
// linked director wallet. The wallet rule mirrors hasLinkedDirectorWallet in
// src/lib/director-access.ts. users.payload is read here only, and nothing
// from it leaves these functions but a boolean.

export const HOUSE_ROLES = Object.freeze(['broadcaster', 'director']);
/** Equals DIRECTOR_ADMIN_ADDRESS in src/lib/director-access.ts (a test reads that file and pins it). */
export const DIRECTOR_WALLET = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';
export const DIRECTOR_WALLET_PROVIDERS = Object.freeze(['kukai', 'temple', 'umami', 'metamask-tezos']);
/** §2.1's three columns, one line, single spaces. */
export const HOUSE_SELECT = "EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'pid' AND h.value = r.pid_hash) AS house_pid, EXISTS (SELECT 1 FROM air_house h WHERE h.kind = 'user' AND h.value = r.user_id) AS house_user, (SELECT u.payload FROM users u WHERE u.id = r.user_id) AS user_payload";

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function asPayload(payload) {
  if (isObj(payload)) return payload;
  if (typeof payload !== 'string' || payload === '') return null;
  try {
    const parsed = JSON.parse(payload);
    return isObj(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isDirectorWallet(identity) {
  if (!isObj(identity) || typeof identity.id !== 'string') return false;
  const provider = String(identity.provider);
  const tezos = DIRECTOR_WALLET_PROVIDERS.includes(provider)
    || (provider === 'metamask' && identity.id.startsWith('tz'));
  return tezos && identity.id === DIRECTOR_WALLET;
}

/** users.payload (a JSON string, an object, or null) → whether it is a director account (§2.1). Bad JSON, null, non-objects → false. */
export function houseUser(payload) {
  const user = asPayload(payload);
  if (!user) return false;
  if (Array.isArray(user.roles) && user.roles.some((role) => HOUSE_ROLES.includes(role))) return true;
  return Array.isArray(user.identities) && user.identities.some(isDirectorWallet);
}

const flag = (v) => v === true || v === 1 || v === '1' || v === 1n;

/** A row with house_pid, house_user (0/1, true/false, or null) and user_payload → house? */
export function isHouseRow(row) {
  if (!isObj(row)) return false;
  return flag(row.house_pid) || flag(row.house_user) || houseUser(row.user_payload);
}

/** Collapse runs of whitespace to one space and trim: for tests comparing SQL text with HOUSE_SELECT. */
export function squash(sql) {
  return String(sql ?? '').replace(/\s+/g, ' ').trim();
}
