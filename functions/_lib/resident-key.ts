/**
 * The house's resident shared secret (env.YARD_RESIDENT_KEY, header
 * X-Yard-Resident). One place compares it, in constant time, so no caller
 * reaches for a plain `===` on a secret.
 */

/** Constant-time string compare: never a plain `===` on a secret. Portable (no crypto.subtle.timingSafeEqual, a Workers-only extension). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Whether the request presents the resident key. False whenever the key is
 * unset or empty (an unset key never makes anyone a resident); a missing
 * header counts as an empty string.
 */
export function presentsResidentKey(request: Request, env: { YARD_RESIDENT_KEY?: string }): boolean {
  if (!env.YARD_RESIDENT_KEY) return false;
  const presented = request.headers.get('X-Yard-Resident') ?? '';
  return timingSafeEqual(presented, env.YARD_RESIDENT_KEY);
}
