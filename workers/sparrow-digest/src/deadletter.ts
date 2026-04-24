/**
 * sparrow-digest · deadletter.ts — v0.36 failure tracking
 *
 * Two KV prefixes live alongside the `sub:` subscription store in
 * SPARROW_DIGEST_KV:
 *
 *   · `fail:<email>`  — counter for consecutive retriable failures.
 *                        TTL 60 days so a quiet month doesn't reset
 *                        state prematurely. Cleared on a successful
 *                        send.
 *   · `dl:<email>`   — dead-letter record. Written when a subscription
 *                        hits the threshold (3 consecutive retriable
 *                        failures OR any permanent failure). Carries
 *                        the last error + attempts + epoch. Persists
 *                        until an operator clears it via
 *                        /ops/release?email=<addr>.
 *
 * The main subscription row (`sub:<email>`) is NOT deleted when a
 * subscription is dead-lettered. It's left intact so an operator can
 * inspect + release. scheduled() skips dead-lettered subs on every
 * cron tick until they're released.
 */

export interface FailureRecord {
  email: string;
  status: number;
  attempts: number;
  error?: string;
  retriable: boolean;
  first_failed_at: string;
  last_failed_at: string;
  consecutive: number;
}

export interface DeadLetterRecord {
  email: string;
  dead_lettered_at: string;
  reason: 'retriable-threshold' | 'permanent-failure';
  last_status: number;
  last_error?: string;
  last_attempts: number;
  consecutive_failures: number;
}

export interface DeadLetterKV {
  get<T = unknown>(key: string, opts?: { type: 'json' }): Promise<T | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number; metadata?: unknown }): Promise<void>;
  delete(key: string): Promise<void>;
  list(opts?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    keys: Array<{ name: string; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

const FAIL_PREFIX = 'fail:';
const DL_PREFIX = 'dl:';
const FAIL_TTL_S = 60 * 60 * 24 * 60;        // 60 days
const DL_TTL_S = 60 * 60 * 24 * 365;         // 1 year
const RETRIABLE_THRESHOLD = 3;               // 3 consecutive retriable → dead-letter

export async function isDeadLettered(kv: DeadLetterKV, email: string): Promise<boolean> {
  const hit = await kv.get<DeadLetterRecord>(`${DL_PREFIX}${email}`, { type: 'json' });
  return !!hit;
}

/**
 * Record a send failure. Returns the updated record and whether the
 * caller should dead-letter the subscription (stop future sends until
 * an operator releases it).
 */
export async function recordFailure(
  kv: DeadLetterKV,
  email: string,
  status: number,
  attempts: number,
  retriable: boolean,
  error?: string,
): Promise<{ record: FailureRecord; shouldDeadLetter: boolean; reason?: DeadLetterRecord['reason'] }> {
  const nowISO = new Date().toISOString();
  const prior = await kv.get<FailureRecord>(`${FAIL_PREFIX}${email}`, { type: 'json' });
  const record: FailureRecord = prior
    ? {
        ...prior,
        status,
        attempts,
        error,
        retriable,
        last_failed_at: nowISO,
        consecutive: prior.consecutive + 1,
      }
    : {
        email,
        status,
        attempts,
        error,
        retriable,
        first_failed_at: nowISO,
        last_failed_at: nowISO,
        consecutive: 1,
      };
  await kv.put(`${FAIL_PREFIX}${email}`, JSON.stringify(record), {
    expirationTtl: FAIL_TTL_S,
    metadata: { status, retriable, consecutive: record.consecutive },
  });

  if (!retriable) {
    return { record, shouldDeadLetter: true, reason: 'permanent-failure' };
  }
  if (record.consecutive >= RETRIABLE_THRESHOLD) {
    return { record, shouldDeadLetter: true, reason: 'retriable-threshold' };
  }
  return { record, shouldDeadLetter: false };
}

export async function clearFailure(kv: DeadLetterKV, email: string): Promise<void> {
  await kv.delete(`${FAIL_PREFIX}${email}`);
}

export async function deadLetter(
  kv: DeadLetterKV,
  email: string,
  reason: DeadLetterRecord['reason'],
  record: FailureRecord,
): Promise<DeadLetterRecord> {
  const dl: DeadLetterRecord = {
    email,
    dead_lettered_at: new Date().toISOString(),
    reason,
    last_status: record.status,
    last_error: record.error,
    last_attempts: record.attempts,
    consecutive_failures: record.consecutive,
  };
  await kv.put(`${DL_PREFIX}${email}`, JSON.stringify(dl), {
    expirationTtl: DL_TTL_S,
    metadata: { reason, last_status: record.status },
  });
  return dl;
}

/**
 * Page through every dead-letter entry. Good enough for a
 * tens-to-hundreds scale; add a cursor query param when it grows.
 */
export async function listDeadLetter(kv: DeadLetterKV): Promise<DeadLetterRecord[]> {
  const out: DeadLetterRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: DL_PREFIX, cursor, limit: 1000 });
    for (const { name } of page.keys) {
      const hit = await kv.get<DeadLetterRecord>(name, { type: 'json' });
      if (hit) out.push(hit);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

/**
 * Clear the dead-letter + failure counter for an email. Does NOT
 * delete the `sub:<email>` row — ops decides that separately.
 */
export async function releaseDeadLetter(kv: DeadLetterKV, email: string): Promise<void> {
  await kv.delete(`${DL_PREFIX}${email}`);
  await kv.delete(`${FAIL_PREFIX}${email}`);
}
