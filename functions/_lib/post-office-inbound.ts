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
const DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60;
const COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60;

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

async function claimCounter(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const raw = await kv.get(key);
  const count = raw && /^\d+$/u.test(raw) ? Number(raw) : 0;
  if (count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: COUNTER_TTL_SECONDS });
  return true;
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
): Promise<void> {
  await retryTwice(async () => {
    const result = await sendMail({
      from: FROM,
      to: row.forward_target,
      subject: `Fwd: ${email.subject || '(no subject)'}`,
      text: quotedBody(email, aliasAddress(row.name)),
      headers: { 'X-PointCast-Alias': aliasAddress(row.name) },
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
      headers: { 'X-Auto-Response-Suppress': 'All' },
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
  if (!env.AUTH_DB || !env.PC_RATES_KV) {
    return json({ ok: false, reason: 'post-office-not-configured', stored: false }, 503);
  }
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const aliasCap = positiveLimit(env.POST_OFFICE_ALIAS_DAILY_CAP, 100);
  const globalCap = positiveLimit(env.POST_OFFICE_GLOBAL_DAILY_CAP, 1000);
  let forwarded = 0;
  let duplicate = 0;
  let rateLimited = 0;
  const missing: string[] = [];
  const missingKeys: string[] = [];

  for (const name of names) {
    const opaque = await sha256(`${webhookId}:${name}`);
    const dedupeKey = `post-office:processed:${opaque}`;
    if (await env.PC_RATES_KV.get(dedupeKey)) {
      duplicate += 1;
      continue;
    }
    const row = await env.AUTH_DB.prepare(`
      SELECT name, forward_kind, forward_target, owner, receipt_hash,
             created_at, renewed_at, expires_at, forwarded_count, status
      FROM aliases WHERE name = ? LIMIT 1
    `).bind(name).first<PostOfficeAliasRow>();
    if (!row || !aliasIsActive(row, now)) {
      missing.push(name);
      missingKeys.push(dedupeKey);
      continue;
    }

    const [globalAllowed, aliasAllowed] = await Promise.all([
      claimCounter(env.PC_RATES_KV, `post-office:rate:${day}:global`, globalCap),
      claimCounter(env.PC_RATES_KV, `post-office:rate:${day}:alias:${name}`, aliasCap),
    ]);
    if (!globalAllowed || !aliasAllowed) {
      rateLimited += 1;
      await env.PC_RATES_KV.put(dedupeKey, 'rate-limited', { expirationTtl: DEDUPE_TTL_SECONDS });
      continue;
    }

    try {
      parseAliasInput({ name: row.name, forward: { kind: row.forward_kind, target: row.forward_target }, owner: row.owner });
      if (row.forward_kind === 'email') {
        await forwardEmail(env, row, email, fetcher);
      } else {
        await forwardWebhook(env, row, email, opaque, now, fetcher);
      }
      await env.AUTH_DB.prepare(`
        UPDATE aliases SET forwarded_count = forwarded_count + 1
        WHERE name = ? AND status = 'active' AND expires_at > ?
      `).bind(name, now.toISOString()).run();
      await env.PC_RATES_KV.put(dedupeKey, 'forwarded', { expirationTtl: DEDUPE_TTL_SECONDS });
      forwarded += 1;
    } catch (error) {
      console.error(JSON.stringify({
        message: 'post office forward failed',
        alias: name,
        error: error instanceof Error ? error.message : String(error),
      }));
      return json({ ok: false, reason: 'post-office-forward-failed', stored: false }, 502);
    }
  }

  let bounced = false;
  if (missing.length > 0) {
    const [globalAllowed, ...aliasAllowed] = await Promise.all([
      claimCounter(env.PC_RATES_KV, `post-office:rate:${day}:global`, globalCap),
      ...missing.map((name) => claimCounter(
        env.PC_RATES_KV!,
        `post-office:rate:${day}:alias:${name}`,
        aliasCap,
      )),
    ]);
    if (!globalAllowed || aliasAllowed.some((allowed) => !allowed)) {
      rateLimited += missing.length;
      await Promise.all(missingKeys.map((key) => env.PC_RATES_KV!.put(
        key,
        'rate-limited',
        { expirationTtl: DEDUPE_TTL_SECONDS },
      )));
      return json({ ok: true, forwarded, bounced, duplicate, rateLimited, stored: false });
    }
    try {
      bounced = await bounce(env, email, missing, fetcher);
      if (bounced) {
        await Promise.all(missingKeys.map((key) => env.PC_RATES_KV!.put(key, 'bounced', { expirationTtl: DEDUPE_TTL_SECONDS })));
      }
    } catch (error) {
      console.error(JSON.stringify({
        message: 'post office bounce failed',
        aliases: missing,
        error: error instanceof Error ? error.message : String(error),
      }));
      return json({ ok: false, reason: 'post-office-bounce-failed', stored: false }, 502);
    }
  }

  return json({ ok: true, forwarded, bounced, duplicate, rateLimited, stored: false });
}
