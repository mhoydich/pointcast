// The Desk — small shared helpers. No I/O.

/** YYYY-MM-DD for `ms` in the desk's timezone (the daily-loss day). */
export function deskDay(ms, timeZone = 'America/Los_Angeles') {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

export function iso(ms) {
  return new Date(ms).toISOString();
}

/** Round to cents; money never carries float dust into the ledger. */
export function cents(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

/** Round quantities to 6 places (fractional shares). */
export function qty6(x) {
  return Math.round((x + Number.EPSILON) * 1e6) / 1e6;
}

/** JSON with sorted keys, so a commitment hashes the same everywhere. */
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function sha256hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(bytes = 16) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Deep-freeze so nothing downstream can loosen a limit at runtime. */
export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const v of Object.values(obj)) deepFreeze(v);
  }
  return obj;
}

/** Next weekday (Mon–Fri) after `ms`, at 21:00 UTC: a conservative T+1 for US equities. */
export function nextSettlementMs(ms) {
  const d = new Date(ms);
  d.setUTCHours(21, 0, 0, 0);
  do d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.getTime();
}

/** Constant-time compare for the resident key. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
