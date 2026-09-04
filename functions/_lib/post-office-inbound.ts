import { sendMail, type MailEnv } from './mail.ts';
import {
  X402_TREASURY_AGENT_ID,
  canonicalJson,
  importReceiptPrivateKey,
  signCanonicalPayload,
} from '../../src/lib/x402.ts';
import {
  POST_OFFICE_ALIAS_ENDPOINT,
  POST_OFFICE_DOMAIN,
  POST_OFFICE_ENVELOPE_SPEC,
  aliasAddress,
  aliasIsActive,
  parseAliasInput,
  type PostOfficeAliasRow,
} from '../../src/lib/post-office.ts';

export type PostOfficeReceivedEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  receivedAt: string;
};

export type PostOfficeInboundEnv = MailEnv & {
  AUTH_DB?: D1Database;
  PC_RATES_KV?: KVNamespace;
  X402_RECEIPT_SK?: string;
  POST_OFFICE_ALIAS_DAILY_CAP?: string;
  POST_OFFICE_GLOBAL_DAILY_CAP?: string;
};

type ForwardDependencies = {
  fetcher?: typeof fetch;
  now?: Date;
};

const FROM = `PointCast Post Office <post@${POST_OFFICE_DOMAIN}>`;
const MAX_QUOTED_TEXT = 100_000;
const COUNTER_LOCK_TTL_MS = 10_000;

type DeliveryOutcome = 'reserved' | 'forwarded' | 'bounced' | 'unroutable' | 'rate_limited' | 'failed';

interface DeliveryRow {
  delivery_id: string;
  outcome: DeliveryOutcome;
}

interface CounterRow {
  global_count: number | string | null;
  alias_count: number | string | null;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function positiveLimit(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/u.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function postOfficeNames(recipients: string[]): string[] {
  const suffix = `@${POST_OFFICE_DOMAIN}`;
  return [...new Set(recipients.map((address) => address.trim().toLowerCase())
    .filter((address) => address.endsWith(suffix))
    .map((address) => address.slice(0, -suffix.length))
    .filter(Boolean))];
}

function senderAddress(from: string): string | null {
  const bracketed = from.match(/<([^<>]+)>\s*$/u)?.[1];
  const candidate = (bracketed || from).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(candidate)) return null;
  if (/^(mailer-daemon|postmaster|bounce|no-?reply)@/u.test(candidate)) return null;
  return candidate;
}

function quotedBody(email: PostOfficeReceivedEmail, alias: string): string {
  const clipped = email.text.length > MAX_QUOTED_TEXT
    ? `${email.text.slice(0, MAX_QUOTED_TEXT)}\n[message clipped by PointCast Post Office]`
    : email.text;
  const quote = (clipped || '[no plain-text body]').split(/\r?\n/u).map((line) => `> ${line}`).join('\n');
  return [
    `Forwarded by ${alias}`,
    'PointCast is a forwarding registry, not a mailbox. This message was not retained.',
    '',
    `From: ${email.from}`,
    `To: ${email.to.join(', ')}`,
    `Received: ${email.receivedAt}`,
    `Subject: ${email.subject || '(no subject)'}`,
    '',
    quote,
  ].join('\n');
}

async function acquireCounterLock(db: D1Database, day: string, holder: string): Promise<boolean> {
  const now = Date.now();
  const row = await db.prepare(`
    INSERT INTO post_office_counter_locks (day, holder, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET holder = excluded.holder, expires_at = excluded.expires_at
    WHERE post_office_counter_locks.holder IS NULL
       OR post_office_counter_locks.expires_at <= ?
       OR post_office_counter_locks.holder = excluded.holder
    RETURNING holder
  `).bind(day, holder, now + COUNTER_LOCK_TTL_MS, now).first<{ holder: string }>();
  return row?.holder === holder;
}

async function releaseCounterLock(db: D1Database, day: string, holder: string): Promise<void> {
  await db.prepare(`
    UPDATE post_office_counter_locks SET holder = NULL, expires_at = NULL
    WHERE day = ? AND holder = ?
  `).bind(day, holder).run();
}

async function reserveDelivery(
  db: D1Database,
  webhookId: string,
  aliasName: string,
  day: string,
  aliasCap: number,
  globalCap: number,
  now: Date,
): Promise<{ state: 'reserved' | 'duplicate' | 'rate_limited' | 'busy'; deliveryId: string }> {
  const [webhookHash, aliasHash] = await Promise.all([sha256(webhookId), sha256(aliasName)]);
  const deliveryId = await sha256(`${webhookId}:${aliasName}`);
  const existing = await db.prepare(`
    SELECT delivery_id, outcome FROM post_office_deliveries
    WHERE webhook_hash = ? AND alias_hash = ?
  `).bind(webhookHash, aliasHash).first<DeliveryRow>();
  if (existing) return { state: 'duplicate', deliveryId: existing.delivery_id };

  const holder = `pod_${crypto.randomUUID().replaceAll('-', '')}`;
  if (!await acquireCounterLock(db, day, holder)) return { state: 'busy', deliveryId };
  try {
    const raced = await db.prepare(`
      SELECT delivery_id, outcome FROM post_office_deliveries
      WHERE webhook_hash = ? AND alias_hash = ?
    `).bind(webhookHash, aliasHash).first<DeliveryRow>();
    if (raced) return { state: 'duplicate', deliveryId: raced.delivery_id };
    const scope = `alias:${aliasHash}`;
    const counts = await db.prepare(`
      SELECT
        COALESCE((SELECT count FROM post_office_daily_counters WHERE day = ? AND scope = 'global'), 0) AS global_count,
        COALESCE((SELECT count FROM post_office_daily_counters WHERE day = ? AND scope = ?), 0) AS alias_count
    `).bind(day, day, scope).first<CounterRow>();
    const acceptedAt = now.toISOString();
    const downstreamKey = `post-office:${deliveryId}`;
    if (Number(counts?.global_count ?? 0) >= globalCap || Number(counts?.alias_count ?? 0) >= aliasCap) {
      await db.prepare(`
        INSERT INTO post_office_deliveries
          (delivery_id, webhook_hash, alias_hash, day, downstream_idempotency_key,
           provider_accepted, outcome, error, accepted_at, completed_at)
        VALUES (?, ?, ?, ?, ?, 1, 'rate_limited', NULL, ?, ?)
        ON CONFLICT DO NOTHING
      `).bind(deliveryId, webhookHash, aliasHash, day, downstreamKey, acceptedAt, acceptedAt).run();
      return { state: 'rate_limited', deliveryId };
    }
    await db.batch([
      db.prepare(`
        INSERT INTO post_office_deliveries
          (delivery_id, webhook_hash, alias_hash, day, downstream_idempotency_key,
           provider_accepted, outcome, error, accepted_at, completed_at)
        VALUES (?, ?, ?, ?, ?, 1, 'reserved', NULL, ?, NULL)
      `).bind(deliveryId, webhookHash, aliasHash, day, downstreamKey, acceptedAt),
      db.prepare(`
        INSERT INTO post_office_daily_counters (day, scope, count, updated_at)
        VALUES (?, 'global', 1, ?)
        ON CONFLICT(day, scope) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
      `).bind(day, acceptedAt),
      db.prepare(`
        INSERT INTO post_office_daily_counters (day, scope, count, updated_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(day, scope) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
      `).bind(day, scope, acceptedAt),
    ]);
    return { state: 'reserved', deliveryId };
  } finally {
    await releaseCounterLock(db, day, holder).catch(() => undefined);
  }
}

async function completeDelivery(
  db: D1Database,
  deliveryId: string,
  outcome: Exclude<DeliveryOutcome, 'reserved'>,
  now: Date,
  error: string | null = null,
): Promise<void> {
  await db.prepare(`
    UPDATE post_office_deliveries
    SET outcome = ?, error = ?, completed_at = ?
    WHERE delivery_id = ? AND outcome = 'reserved'
  `).bind(outcome, error, now.toISOString(), deliveryId).run();
}

function deliveryResponse(
  values: {
    forwarded: number;
    bounced: boolean;
    duplicate: number;
    rateLimited: number;
    failed?: number;
    reason?: string;
  },
  status = 200,
): Response {
  const delivery = {
    forwarded: values.forwarded,
    bounced: values.bounced,
    duplicate: values.duplicate,
    rateLimited: values.rateLimited,
    failed: values.failed ?? 0,
  };
  return json({
    ok: status < 400,
    providerAcceptance: { accepted: true },
    delivery,
    ...delivery,
    ...(values.reason ? { reason: values.reason } : {}),
    stored: false,
  }, status);
}

async function retryTwice(operation: () => Promise<void>): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function forwardEmail(
  env: PostOfficeInboundEnv,
  row: PostOfficeAliasRow,
  email: PostOfficeReceivedEmail,
  fetcher: typeof fetch,
  deliveryId: string,
): Promise<void> {
  await retryTwice(async () => {
    const result = await sendMail({
      from: FROM,
      to: row.forward_target,
      subject: `Fwd: ${email.subject || '(no subject)'}`,
      text: quotedBody(email, aliasAddress(row.name)),
      headers: {
        'X-PointCast-Alias': aliasAddress(row.name),
        'X-PointCast-Delivery-Id': deliveryId,
        'Idempotency-Key': `post-office:${deliveryId}`,
      },
    }, env, fetcher);
    if (!result.configured) throw new Error('mail-adapter-not-configured');
  });
}

async function forwardWebhook(
  env: PostOfficeInboundEnv,
  row: PostOfficeAliasRow,
  email: PostOfficeReceivedEmail,
  deliveryId: string,
  now: Date,
  fetcher: typeof fetch,
): Promise<void> {
  if (!env.X402_RECEIPT_SK) throw new Error('webhook-signer-not-configured');
  const signingKey = await importReceiptPrivateKey(env.X402_RECEIPT_SK);
  const envelope = {
    spec: POST_OFFICE_ENVELOPE_SPEC,
    deliveryId,
    sentAt: now.toISOString(),
    alias: aliasAddress(row.name),
    original: {
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text.slice(0, MAX_QUOTED_TEXT),
      receivedAt: email.receivedAt,
    },
  };
  const payload = canonicalJson(envelope);
  const signature = await signCanonicalPayload(payload, signingKey);
  await retryTwice(async () => {
    const response = await fetcher(row.forward_target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PointCast-Delivery-Id': deliveryId,
        'Idempotency-Key': `post-office:${deliveryId}`,
        'X-PointCast-Key-Id': X402_TREASURY_AGENT_ID,
        'X-PointCast-Signature': signature,
        'X-PointCast-Signature-Input': 'canonical-json',
      },
      body: payload,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`webhook-forward-failed:${response.status}`);
    }
    await response.body?.cancel();
  });
}

async function bounce(
  env: PostOfficeInboundEnv,
  email: PostOfficeReceivedEmail,
  names: string[],
  fetcher: typeof fetch,
  deliveryId: string,
): Promise<boolean> {
  const to = senderAddress(email.from);
  if (!to) return false;
  await retryTwice(async () => {
    const result = await sendMail({
      from: FROM,
      to,
      subject: `Undeliverable: ${email.subject || '(no subject)'}`,
      text: [
        `PointCast could not forward mail for ${names.map(aliasAddress).join(', ')} because the alias is unknown or expired.`,
        '',
        `Create or renew an alias by POSTing to the x402 terms URL: ${POST_OFFICE_ALIAS_ENDPOINT}`,
        '',
        'PointCast did not retain the original message.',
      ].join('\n'),
      headers: {
        'X-Auto-Response-Suppress': 'All',
        'X-PointCast-Delivery-Id': deliveryId,
        'Idempotency-Key': `post-office:${deliveryId}`,
      },
    }, env, fetcher);
    if (!result.configured) throw new Error('mail-adapter-not-configured');
  });
  return true;
}

export async function routePostOfficeInbound(
  env: PostOfficeInboundEnv,
  webhookId: string,
  email: PostOfficeReceivedEmail,
  dependencies: ForwardDependencies = {},
): Promise<Response | null> {
  const names = postOfficeNames(email.to);
  if (names.length === 0) return null;
  if (!env.AUTH_DB) {
    return deliveryResponse({
      forwarded: 0,
      bounced: false,
      duplicate: 0,
      rateLimited: 0,
      failed: names.length,
      reason: 'post-office-not-configured',
    }, 503);
  }
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const aliasCap = positiveLimit(env.POST_OFFICE_ALIAS_DAILY_CAP, 100);
  const globalCap = positiveLimit(env.POST_OFFICE_GLOBAL_DAILY_CAP, 1000);
  let forwarded = 0;
  let duplicate = 0;
  let rateLimited = 0;
  let failed = 0;
  const missing: Array<{ name: string; deliveryId: string }> = [];

  for (const name of names) {
    const reservation = await reserveDelivery(
      env.AUTH_DB,
      webhookId,
      name,
      day,
      aliasCap,
      globalCap,
      now,
    );
    if (reservation.state === 'duplicate') {
      duplicate += 1;
      continue;
    }
    if (reservation.state === 'rate_limited') {
      rateLimited += 1;
      continue;
    }
    if (reservation.state === 'busy') {
      return deliveryResponse({
        forwarded, bounced: false, duplicate, rateLimited, failed,
        reason: 'post-office-reservation-busy',
      }, 503);
    }
    const row = await env.AUTH_DB.prepare(`
      SELECT name, forward_kind, forward_target, owner, receipt_hash,
             created_at, renewed_at, expires_at, forwarded_count, status
      FROM aliases WHERE name = ? LIMIT 1
    `).bind(name).first<PostOfficeAliasRow>();
    if (!row || !aliasIsActive(row, now)) {
      missing.push({ name, deliveryId: reservation.deliveryId });
      continue;
    }

    try {
      parseAliasInput({ name: row.name, forward: { kind: row.forward_kind, target: row.forward_target }, owner: row.owner });
      if (row.forward_kind === 'email') {
        await forwardEmail(env, row, email, fetcher, reservation.deliveryId);
      } else {
        await forwardWebhook(env, row, email, reservation.deliveryId, now, fetcher);
      }
      await env.AUTH_DB.batch([
        env.AUTH_DB.prepare(`
          UPDATE aliases SET forwarded_count = forwarded_count + 1
          WHERE name = ? AND status = 'active' AND expires_at > ?
        `).bind(name, now.toISOString()),
        env.AUTH_DB.prepare(`
          UPDATE post_office_deliveries
          SET outcome = 'forwarded', error = NULL, completed_at = ?
          WHERE delivery_id = ? AND outcome = 'reserved'
        `).bind(now.toISOString(), reservation.deliveryId),
      ]);
      forwarded += 1;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      failed += 1;
      await completeDelivery(env.AUTH_DB, reservation.deliveryId, 'failed', now, detail.slice(0, 240));
      console.error(JSON.stringify({
        message: 'post office forward failed',
        alias: name,
        error: detail,
      }));
      return deliveryResponse({
        forwarded, bounced: false, duplicate, rateLimited, failed,
        reason: 'post-office-forward-failed',
      }, 502);
    }
  }

  let bounced = false;
  if (missing.length > 0) {
    try {
      const bounceId = missing[0].deliveryId;
      bounced = await bounce(env, email, missing.map((entry) => entry.name), fetcher, bounceId);
      await env.AUTH_DB.batch(missing.map((entry) => env.AUTH_DB!.prepare(`
        UPDATE post_office_deliveries
        SET outcome = ?, error = NULL, completed_at = ?
        WHERE delivery_id = ? AND outcome = 'reserved'
      `).bind(bounced ? 'bounced' : 'unroutable', now.toISOString(), entry.deliveryId)));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      failed += missing.length;
      await env.AUTH_DB.batch(missing.map((entry) => env.AUTH_DB!.prepare(`
        UPDATE post_office_deliveries
        SET outcome = 'failed', error = ?, completed_at = ?
        WHERE delivery_id = ? AND outcome = 'reserved'
      `).bind(detail.slice(0, 240), now.toISOString(), entry.deliveryId)));
      console.error(JSON.stringify({
        message: 'post office bounce failed',
        aliases: missing.map((entry) => entry.name),
        error: detail,
      }));
      return deliveryResponse({
        forwarded, bounced, duplicate, rateLimited, failed,
        reason: 'post-office-bounce-failed',
      }, 502);
    }
  }

  return deliveryResponse({ forwarded, bounced, duplicate, rateLimited, failed });
}
