/**
 * Reward tokens — the two signed strings PointCast and its satellites pass
 * through a URL fragment.
 *
 * A visitor who wants the reward starts on PointCast, signs in, and gets a
 * short-lived **launch ticket** that names the run. They carry it to the
 * satellite (Tone Bloom, Industry Next), do the thing, and the satellite hands
 * back a **completion receipt** for the same run. PointCast checks the receipt
 * and writes one ledger line. The satellite never sees a PointCast cookie, an
 * email, a user id, or an address; PointCast keeps the account-to-run mapping.
 *
 * Both strings use one format:
 *
 *   v1.<base64url(payload JSON)>.<base64url(HMAC-SHA-256 over "<purpose>\n<base64url payload>"))>
 *
 * The purpose (`launch` or `receipt`) is inside the signed message rather than
 * only in the payload, so a launch ticket can never be replayed as a receipt
 * even though both are signed with the same per-satellite secret. `kid` names
 * the key, which is what lets a secret rotate without either side accepting an
 * arbitrary algorithm or an unknown signer.
 *
 * Web Crypto only: this module runs unchanged in a Pages Function, in the
 * browser, and in `node --test`. No Node built-ins, no dependencies.
 *
 * The wire format, the checks and the test vectors are written down in
 * docs/plans/2026-09-05-rewards-protocol.md. Change one and change the other.
 */

export type RewardPurpose = 'launch' | 'receipt';

export interface RewardProgram {
  /** The allowlisted program id, as it travels in every payload. */
  id: string;
  /** Who signs the receipt, and the `aud` of the launch ticket. */
  issuer: string;
  /** Names the shared secret. Rotation ships `<issuer>-2` and keeps both live. */
  kid: string;
  /** Which faucet the completed run pays out of. */
  faucet: string;
  /** The satellite page. `launchUrlFor` hangs `#launch=<ticket>` off it. */
  launch: string;
  /** Server-credited seconds the satellite must certify. 0 means no duration rule. */
  minCreditedSeconds: number;
  /** Wall-clock seconds between `startedAt` and `finishedAt`. 0 means no rule. */
  minElapsedSeconds: number;
  /** Written onto the claim row, and shown back to the account as provenance. */
  via: string | null;
  /** Which server secret carries this issuer's key. */
  secretEnv: 'REWARDS_TONEBLOOM_SECRET' | 'REWARDS_INDUSTRYNEXT_SECRET';
  /** Desk copy for /rewards/start. Plain English, no promises about value. */
  title: string;
  blurb: string;
  cta: string;
}

/**
 * The allowlist. Two entries, both fixed here: a caller never supplies an
 * issuer, a token, an amount, or a return URL.
 */
export const REWARD_PROGRAMS: RewardProgram[] = [
  {
    id: 'fishclub-tonebloom',
    issuer: 'tonebloom',
    kid: 'tonebloom-1',
    faucet: 'fishclub',
    launch: 'https://tonebloom.xyz/fishclub',
    minCreditedSeconds: 300,
    minElapsedSeconds: 300,
    via: null,
    secretEnv: 'REWARDS_TONEBLOOM_SECRET',
    title: 'Five quiet minutes. A fish to keep.',
    blurb: 'Sign in on PointCast to keep one FISHCLUB when you’re done. No wallet needed.',
    cta: 'Start and keep a fish',
  },
  {
    id: 'industrynext-hello',
    issuer: 'industrynext',
    kid: 'industrynext-1',
    faucet: 'hello',
    launch: 'https://www.industrynext.xyz/hello',
    minCreditedSeconds: 0,
    minElapsedSeconds: 0,
    via: 'industrynext',
    secretEnv: 'REWARDS_INDUSTRYNEXT_SECRET',
    title: 'Say hello across town.',
    blurb: 'One HELLO, held for you on PointCast. Sign in here, say hello there, keep it here.',
    cta: 'Say hello',
  },
];

export function getRewardProgram(id: string | undefined | null): RewardProgram | null {
  if (!id) return null;
  return REWARD_PROGRAMS.find((program) => program.id === id) ?? null;
}

/** Every program that pays out of one faucet. Used to explain an empty desk. */
export function rewardProgramsForFaucet(slug: string): RewardProgram[] {
  return REWARD_PROGRAMS.filter((program) => program.faucet === slug);
}

export function launchUrlFor(program: RewardProgram, ticket: string): string {
  // The ticket rides in the fragment, never in a query string: fragments are
  // not sent to the server, so they stay out of access logs and referrers.
  return `${program.launch}#launch=${ticket}`;
}

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

export interface RewardLaunchPayload {
  v: 1;
  kid: string;
  iss: 'pointcast';
  /** The issuer this ticket is for. A satellite rejects anything else. */
  aud: string;
  program: string;
  run: string;
  /** Unix seconds. */
  iat: number;
  /** Unix seconds, iat + 300. */
  exp: number;
  nonce: string;
}

export interface RewardReceiptPayload {
  v: 1;
  kid: string;
  /** The satellite. Must match the program's issuer. */
  iss: string;
  aud: 'pointcast-rewards';
  program: string;
  run: string;
  /** Unix seconds, server-measured by the satellite. */
  startedAt: number;
  finishedAt: number;
  /** Non-overlapping server-credited seconds. Not a claim about human attention. */
  creditedSeconds: number;
  /** Stable across retries, so a retried finish is the same receipt. */
  nonce: string;
  iat: number;
  /** Unix seconds, iat + 1800. */
  exp: number;
}

export type RewardTokenPayload = RewardLaunchPayload | RewardReceiptPayload;

/** Ticket lifetime, seconds. Long enough to click through, short enough to matter. */
export const LAUNCH_TTL_SECONDS = 300;
/** Receipt lifetime, seconds. Long enough to sign in again on the way back. */
export const RECEIPT_TTL_SECONDS = 1800;
/** A run stays open this long. Past it, listening again is a new run. */
export const RUN_TTL_SECONDS = 2 * 60 * 60;

// ---------------------------------------------------------------------------
// base64url, HMAC, constant-time compare
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function base64urlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function base64urlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function base64urlFromString(value: string): string {
  return base64urlFromBytes(encoder.encode(value));
}

export function base64urlToString(value: string): string {
  return decoder.decode(base64urlToBytes(value));
}

/** Only base64url characters. Anything else is malformed before it is decoded. */
const BASE64URL = /^[A-Za-z0-9_-]+$/;

async function hmacBase64url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64urlFromBytes(new Uint8Array(signature));
}

/**
 * Compare without leaking where two strings diverge. Length is not a secret
 * here (every signature is 43 characters), but the prefix is: a comparison
 * that returns early hands an attacker a byte-at-a-time oracle.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Sign and verify
// ---------------------------------------------------------------------------

/** The exact bytes both sides sign. Domain-separated by purpose. */
export function rewardSigningMessage(purpose: RewardPurpose, encodedPayload: string): string {
  return `${purpose}\n${encodedPayload}`;
}

export async function signRewardToken(
  purpose: RewardPurpose,
  payload: RewardTokenPayload,
  secret: string,
): Promise<string> {
  const body = base64urlFromString(JSON.stringify(payload));
  const signature = await hmacBase64url(secret, rewardSigningMessage(purpose, body));
  return `v1.${body}.${signature}`;
}

export type RewardVerifyReason = 'malformed' | 'unknown-kid' | 'bad-signature' | 'expired';

export type RewardVerifyResult<T extends RewardTokenPayload> =
  | { ok: true; payload: T }
  | { ok: false; reason: RewardVerifyReason };

/** Longer than any token this protocol produces; a guard against a paste bomb. */
const MAX_TOKEN_LENGTH = 4_096;

/**
 * Verify a token and hand back its payload.
 *
 * Nothing inside the payload is trusted before the signature checks out — not
 * the expiry, not the program, not the run. `kid` is read early because it
 * only selects which allowlisted key to check against; an unknown one is
 * refused rather than defaulted.
 */
export async function verifyRewardToken<T extends RewardTokenPayload = RewardTokenPayload>(
  purpose: RewardPurpose,
  token: string,
  secretsByKid: Readonly<Record<string, string | undefined>>,
  now: number = Math.floor(Date.now() / 1000),
): Promise<RewardVerifyResult<T>> {
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: 'malformed' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [version, body, signature] = parts;
  if (version !== 'v1') return { ok: false, reason: 'malformed' };
  if (!BASE64URL.test(body) || !BASE64URL.test(signature)) return { ok: false, reason: 'malformed' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlToString(body));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'malformed' };
  const payload = parsed as Record<string, unknown>;
  if (payload.v !== 1) return { ok: false, reason: 'malformed' };
  const kid = payload.kid;
  if (typeof kid !== 'string' || !kid) return { ok: false, reason: 'malformed' };

  const secret = secretsByKid[kid];
  if (!secret) return { ok: false, reason: 'unknown-kid' };

  const expected = await hmacBase64url(secret, rewardSigningMessage(purpose, body));
  if (!constantTimeEqual(expected, signature)) return { ok: false, reason: 'bad-signature' };

  // Signed, so the fields are the issuer's. Now the clock gets a say.
  const exp = payload.exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return { ok: false, reason: 'malformed' };
  if (exp <= now) return { ok: false, reason: 'expired' };

  return { ok: true, payload: payload as unknown as T };
}

/** Shape check for a receipt, after the signature says who wrote it. */
export function isRewardReceiptPayload(payload: RewardTokenPayload): payload is RewardReceiptPayload {
  const candidate = payload as Partial<RewardReceiptPayload>;
  return (
    candidate.aud === 'pointcast-rewards'
    && typeof candidate.iss === 'string'
    && typeof candidate.program === 'string'
    && typeof candidate.run === 'string'
    && typeof candidate.nonce === 'string'
    && candidate.nonce.length > 0
    && typeof candidate.startedAt === 'number'
    && typeof candidate.finishedAt === 'number'
    && typeof candidate.creditedSeconds === 'number'
    && Number.isFinite(candidate.startedAt)
    && Number.isFinite(candidate.finishedAt)
    && Number.isFinite(candidate.creditedSeconds)
  );
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** `run_<32 hex>`, the id PointCast keeps and the satellite echoes back. */
export function newRunId(): string {
  return `run_${crypto.randomUUID().replaceAll('-', '')}`;
}

/** A nonce is only ever compared, never parsed. */
export function newRewardNonce(): string {
  return crypto.randomUUID().replaceAll('-', '');
}
