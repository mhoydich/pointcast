// The Morning Edition by email: a scheduled Worker (pointcast-morning-daily).
// Spec: docs/plans/2026-10-18-field-reports-v2-paper-spec.md §6.
//
// Two jobs on every tick:
//   1. sweepConfirms: send the double opt-in mail to signups that came in while
//      the paper's mail was off, and prune pending rows whose mail went out 30+
//      days ago.
//   2. runMorningDaily: in the 6 AM LA hour only, read /morning.json?d=<day>
//      (the read is what freezes the edition), and mail the frozen edition to
//      each confirmed subscriber once.
//
// Nothing here writes an email address to a log line or a response.
import { sendMail, type MailEnv } from '../../../src/lib/mail';
// @ts-ignore — plain module shared with the Pages routes and the tests
import { CONFIRM_RESEND_MS, CONFIRM_TTL_MS, EDITION_FROM, FIRST_EDITION, PRUNE_SENT_PENDING_MS, confirmEmail, editionEmail, frozenItem, mailReadiness, newToken, sha256Hex, shouldSend } from '../../../functions/_lib/edition-mail.mjs';

export interface Env extends MailEnv {
  AUTH_DB?: D1Database;
  MORNING_DAILY_DRY_RUN?: string;
  MORNING_SEND_EMAIL_READY?: string;
  MORNING_EDITION_URL?: string;
  MORNING_INTERNAL_KEY?: string;
}

export type Deps = { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> };

export type RunResult = {
  ok: true;
  day: string;
  skipped?: string;
  frozen: boolean;
  editionNumber: number | null;
  reason: string | null;
  configured: boolean;
  dryRun: boolean;
  attempted: number;
  sent: number;
  failed: number;
};

type Readiness = { configured: boolean; via: string | null; reason: string | null; note: string | null };

const EDITION_URL = 'https://pointcast.xyz/morning.json';
const USER_AGENT = 'PointCast Morning Daily (+https://pointcast.xyz/morning)';
/** Waits before each of the five attempts. Pages edge-caches a provisional ?d= answer for 60 s, so each retry is spaced past it. */
const ATTEMPT_WAITS_MS = [0, 65_000, 130_000, 260_000, 400_000];
const SWEEP_LIMIT = 50;
const SEND_LIMIT = 1000;

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify(event));
}

/** An error message with anything address-shaped removed, for a log line. */
export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[^\s<>"',;()]+@[^\s<>"',;()]+/gu, '[address]').slice(0, 200);
}

/** The mail env sendMail sees: a blank RESEND_API_KEY must not count, matching mailReadiness. */
function mailEnv(env: Env): MailEnv {
  const key = typeof env.RESEND_API_KEY === 'string' && env.RESEND_API_KEY.trim() !== '' ? env.RESEND_API_KEY : undefined;
  return { RESEND_API_KEY: key, SEND_EMAIL: env.SEND_EMAIL };
}

const readiness = (env: Env): Readiness => mailReadiness(env) as Readiness;

export async function sendConfirm(
  env: Env,
  email: string,
  o: { now: number },
): Promise<{ sent: boolean; reason: null | 'email-not-configured' | 'recent' | 'not-pending' | 'send-failed' }> {
  const db = env.AUTH_DB;
  if (!db || !readiness(env).configured) return { sent: false, reason: 'email-not-configured' };

  const raw = newToken() as string;
  const hash = (await sha256Hex(raw)) as string;
  const claim = await db.prepare(
    "UPDATE edition_subscribers SET confirm_hash = ?, confirm_expires_at = ?, confirm_sent_at = ? WHERE email = ? AND status = 'pending' AND (confirm_sent_at IS NULL OR confirm_sent_at <= ?) RETURNING status",
  ).bind(hash, o.now + CONFIRM_TTL_MS, o.now, email, o.now - CONFIRM_RESEND_MS).all();
  if ((claim.results ?? []).length === 0) {
    const row = await db.prepare('SELECT status FROM edition_subscribers WHERE email = ?').bind(email).first<{ status: string }>();
    return { sent: false, reason: row?.status === 'pending' ? 'recent' : 'not-pending' };
  }

  let delivered = false;
  try {
    const result = await sendMail({ from: EDITION_FROM, to: email, ...confirmEmail(raw) }, mailEnv(env));
    delivered = result.configured === true;
  } catch (error) {
    log({ message: 'morning confirm send failed', error: safeError(error) });
  }
  if (!delivered) {
    await db.prepare(
      'UPDATE edition_subscribers SET confirm_hash = NULL, confirm_expires_at = NULL, confirm_sent_at = NULL WHERE email = ? AND confirm_hash = ?',
    ).bind(email, hash).run();
    return { sent: false, reason: 'send-failed' };
  }
  return { sent: true, reason: null };
}

export async function sweepConfirms(env: Env, o: { now: number }): Promise<{ sent: number; failed: number; pruned: number }> {
  const out = { sent: 0, failed: 0, pruned: 0 };
  const db = env.AUTH_DB;
  if (!db) return out;

  const prune = await db.prepare(
    "DELETE FROM edition_subscribers WHERE status = 'pending' AND confirm_sent_at IS NOT NULL AND confirm_sent_at < ?",
  ).bind(o.now - PRUNE_SENT_PENDING_MS).run();
  out.pruned = Number(prune.meta?.changes) || 0;

  if (readiness(env).configured) {
    const waiting = await db.prepare(
      "SELECT email FROM edition_subscribers WHERE status = 'pending' AND confirm_sent_at IS NULL ORDER BY created_at LIMIT 50",
    ).bind().all<{ email: string }>();
    for (const row of (waiting.results ?? []).slice(0, SWEEP_LIMIT)) {
      const r = await sendConfirm(env, row.email, o);
      if (r.sent) out.sent += 1;
      else if (r.reason === 'send-failed') out.failed += 1;
    }
  }
  log({ message: 'morning confirm sweep', ...out });
  return out;
}

type RunRow = {
  day: string;
  edition_number: number | null;
  frozen: 0 | 1;
  reason: string | null;
  started_at: number;
  finished_at: number;
  attempted: number;
  sent: number;
  failed: number;
  dry_run: 0 | 1;
  configured: 0 | 1;
};

/** One row per LA day. A later real run replaces it; a dry run never replaces a real run's counts. */
async function writeRun(db: D1Database, row: RunRow): Promise<void> {
  await db.prepare(
    'INSERT INTO morning_daily_runs (day, edition_number, frozen, reason, started_at, finished_at, attempted, sent, failed, dry_run, configured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(day) DO UPDATE SET edition_number = excluded.edition_number, frozen = excluded.frozen, reason = excluded.reason, started_at = excluded.started_at, finished_at = excluded.finished_at, attempted = excluded.attempted, sent = excluded.sent, failed = excluded.failed, dry_run = excluded.dry_run, configured = excluded.configured WHERE morning_daily_runs.dry_run = 1 OR excluded.dry_run = 0',
  ).bind(
    row.day, row.edition_number, row.frozen, row.reason, row.started_at, row.finished_at,
    row.attempted, row.sent, row.failed, row.dry_run, row.configured,
  ).run();
}

export async function runMorningDaily(env: Env, o: { now: number; dryRun?: boolean; force?: boolean } & Deps): Promise<RunResult> {
  const startedAt = Date.now();
  const gate = shouldSend(o.now) as { send: boolean; day: string; reason: string | null };
  const day = gate.day;
  const dryRun = o.dryRun ?? env.MORNING_DAILY_DRY_RUN === 'true';
  const mail = readiness(env);
  const configured = Boolean(env.AUTH_DB) && mail.configured;
  const result: RunResult = {
    ok: true, day, frozen: false, editionNumber: null, reason: null, configured, dryRun, attempted: 0, sent: 0, failed: 0,
  };

  if (!gate.send && !(o.force && gate.reason !== 'before-first-edition')) {
    log({ message: 'morning daily skipped', reason: gate.reason });
    return { ...result, skipped: gate.reason ?? 'not-6am' };
  }
  const db = env.AUTH_DB;
  if (!db) {
    log({ message: 'morning daily skipped', reason: 'auth-db-not-configured' });
    return { ...result, skipped: 'auth-db-not-configured' };
  }

  const doFetch: typeof fetch = o.fetch ?? ((...args) => fetch(...args));
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const base = typeof env.MORNING_EDITION_URL === 'string' && env.MORNING_EDITION_URL ? env.MORNING_EDITION_URL : EDITION_URL;
  const url = `${base}?d=${day}`;

  // The read itself freezes the edition. A 400 (the clock a hair before 6:45), a 5xx, a network
  // error, bad JSON and a provisional edition all mean: wait and read again.
  let item: any = null;
  let attempts = 0;
  for (const wait of ATTEMPT_WAITS_MS) {
    if (wait > 0) await sleep(wait);
    attempts += 1;
    try {
      const response = await doFetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/feed+json' } });
      if (response.status === 200) item = frozenItem(await response.json(), day);
    } catch (error) {
      log({ message: 'morning daily read failed', day, attempt: attempts, error: safeError(error) });
    }
    if (item) break;
  }

  const finish = async (fields: Partial<RunRow>): Promise<RunResult> => {
    const row: RunRow = {
      day, edition_number: null, frozen: 0, reason: null, started_at: startedAt, finished_at: Date.now(),
      attempted: result.attempted, sent: result.sent, failed: result.failed, dry_run: dryRun ? 1 : 0, configured: configured ? 1 : 0,
      ...fields,
    };
    await writeRun(db, row);
    result.frozen = row.frozen === 1;
    result.editionNumber = row.edition_number;
    result.reason = row.reason;
    log({ message: 'morning daily complete', ...result, attempts });
    return result;
  };

  if (!item) return finish({ frozen: 0, reason: 'not-frozen' });
  const rawNumber = item._pointcast?.number;
  const editionNumber = Number.isFinite(Number(rawNumber)) && rawNumber !== null && rawNumber !== undefined ? Number(rawNumber) : null;

  if (!configured && !dryRun) return finish({ frozen: 1, edition_number: editionNumber, reason: 'email-not-configured' });

  const query = await db.prepare(
    "SELECT email, token, last_sent_day FROM edition_subscribers WHERE status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?) ORDER BY confirmed_at, email LIMIT 1000",
  ).bind(day).all<{ email: string; token: string; last_sent_day: string | null }>();
  const subscribers = (query.results ?? []).slice(0, SEND_LIMIT);
  if (subscribers.length === 0) return finish({ frozen: 1, edition_number: editionNumber, reason: 'no-subscribers' });

  for (const subscriber of subscribers) {
    result.attempted += 1;
    if (dryRun) continue;
    const claim = await db.prepare(
      "UPDATE edition_subscribers SET last_sent_day = ? WHERE email = ? AND status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?)",
    ).bind(day, subscriber.email, day).run();
    if ((claim.meta?.changes ?? 0) !== 1) continue;
    let delivered = false;
    try {
      const sent = await sendMail({ from: EDITION_FROM, to: subscriber.email, ...editionEmail(item, subscriber.token) }, mailEnv(env));
      delivered = sent.configured === true;
    } catch (error) {
      log({ message: 'morning daily send failed', day, error: safeError(error) });
    }
    if (delivered) {
      result.sent += 1;
    } else {
      result.failed += 1;
      await db.prepare(
        'UPDATE edition_subscribers SET last_sent_day = ? WHERE email = ? AND last_sent_day = ?',
      ).bind(subscriber.last_sent_day, subscriber.email, day).run();
    }
  }
  return finish({ frozen: 1, edition_number: editionNumber, reason: null });
}

export async function status(env: Env): Promise<Response> {
  const mail = readiness(env);
  const authDb = Boolean(env.AUTH_DB);
  const configured = authDb && mail.configured;
  let lastRun: Record<string, unknown> | null = null;
  let subscribers: { confirmed: number; pending: number; waiting: number } | null = null;
  if (env.AUTH_DB) {
    try {
      lastRun = await env.AUTH_DB.prepare(
        'SELECT day, edition_number, frozen, reason, started_at, finished_at, attempted, sent, failed, dry_run, configured FROM morning_daily_runs ORDER BY day DESC LIMIT 1',
      ).bind().first<Record<string, unknown>>();
    } catch {
      lastRun = null;
    }
    try {
      const rows = await env.AUTH_DB.prepare(
        'SELECT status, (confirm_sent_at IS NULL) AS waiting, COUNT(*) AS n FROM edition_subscribers GROUP BY status, waiting',
      ).bind().all<{ status: string; waiting: number; n: number }>();
      subscribers = { confirmed: 0, pending: 0, waiting: 0 };
      for (const row of rows.results ?? []) {
        const n = Number(row.n) || 0;
        if (row.status === 'confirmed') subscribers.confirmed += n;
        if (row.status === 'pending') {
          subscribers.pending += n;
          if (Number(row.waiting) === 1) subscribers.waiting += n;
        }
      }
    } catch {
      subscribers = null;
    }
  }
  return Response.json({
    ok: true,
    configured,
    reason: mail.reason ?? (authDb ? null : 'auth-db-not-bound'),
    note: mail.note,
    dryRun: env.MORNING_DAILY_DRY_RUN === 'true',
    bindings: {
      authDb,
      sendEmail: Boolean(env.SEND_EMAIL),
      sendEmailReady: env.MORNING_SEND_EMAIL_READY === 'true',
      resend: typeof env.RESEND_API_KEY === 'string' && env.RESEND_API_KEY.trim() !== '',
      internalKey: Boolean(env.MORNING_INTERNAL_KEY),
    },
    crons: ['45 13 * * *', '45 14 * * *'],
    timeZone: 'America/Los_Angeles',
    firstEdition: FIRST_EDITION,
    lastRun,
    subscribers,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
