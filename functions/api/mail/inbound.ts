import type { AuthEnv } from '../auth/session.ts';

interface InboundEnv extends AuthEnv {
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  PRESENCE?: DurableObjectNamespace;
}

type ReceivedEmail = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  receivedAt: string;
};

const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function verifySvixSignature(
  payload: string,
  headers: Headers,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatures = headers.get('svix-signature');
  if (!id || !timestamp || !signatures || id.includes('.') || timestamp.includes('.')) return false;
  const timestampSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  if (Math.abs(Math.floor(now / 1000) - timestampSeconds) > MAX_SIGNATURE_AGE_SECONDS) return false;

  try {
    const serializedSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
    const key = await crypto.subtle.importKey(
      'raw',
      decodeBase64(serializedSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signedContent = new TextEncoder().encode(`${id}.${timestamp}.${payload}`);
    for (const candidate of signatures.split(' ')) {
      if (!candidate.startsWith('v1,')) continue;
      const encoded = candidate.slice(3);
      if (!encoded) continue;
      if (await crypto.subtle.verify('HMAC', key, decodeBase64(encoded), signedContent)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;
}

async function retrieveReceivedEmail(apiKey: string, emailId: string): Promise<ReceivedEmail> {
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`resend-receive-failed:${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object') throw new Error('resend-receive-invalid');
  const record = payload as Record<string, unknown>;
  const from = stringField(record.from);
  const to = stringArray(record.to);
  const subject = stringField(record.subject);
  const text = record.text === null ? '' : stringField(record.text);
  const receivedAt = stringField(record.created_at);
  if (from === null || to === null || subject === null || text === null || receivedAt === null) {
    throw new Error('resend-receive-invalid');
  }
  return { from, to, subject, text, receivedAt };
}

async function publishMailBurst(env: InboundEnv, webhookId: string): Promise<void> {
  if (!env.PRESENCE) return;
  try {
    const stub = env.PRESENCE.get(env.PRESENCE.idFromName('global'));
    const response = await stub.fetch('https://presence.internal/burst', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'mail',
        clientId: `town-mail:${webhookId}`,
        by: { handle: 'town-post' },
        meta: { label: 'town mail', href: '/api/mail/inbox' },
      }),
    });
    if (!response.ok) {
      console.error(JSON.stringify({ message: 'town mail burst rejected', status: response.status }));
    }
  } catch (error) {
    console.error(JSON.stringify({
      message: 'town mail burst failed',
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

export const onRequestPost: PagesFunction<InboundEnv> = async ({ request, env }) => {
  if (!env.RESEND_WEBHOOK_SECRET || !env.RESEND_API_KEY || !env.AUTH_DB) {
    return json({ ok: false, reason: 'mail-inbound-not-configured' }, 503);
  }
  const payload = await request.text();
  if (!await verifySvixSignature(payload, request.headers, env.RESEND_WEBHOOK_SECRET)) {
    return json({ ok: false, reason: 'invalid-signature' }, 401);
  }

  let event: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    event = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, reason: 'invalid-json' }, 400);
  }
  if (event.type !== 'email.received') return json({ ok: true, ignored: true });
  const data = event.data && typeof event.data === 'object'
    ? event.data as Record<string, unknown>
    : null;
  const emailId = stringField(data?.email_id);
  const webhookId = request.headers.get('svix-id');
  if (!emailId || !webhookId) return json({ ok: false, reason: 'invalid-event' }, 400);
  const duplicate = await env.AUTH_DB.prepare(
    'SELECT 1 AS present FROM inbox WHERE webhook_id = ? LIMIT 1',
  ).bind(webhookId).first<{ present: number }>();
  if (duplicate) return json({ ok: true, stored: false });

  let email: ReceivedEmail;
  try {
    email = await retrieveReceivedEmail(env.RESEND_API_KEY, emailId);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'town mail retrieval failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return json({ ok: false, reason: 'mail-retrieval-failed' }, 502);
  }

  const result = await env.AUTH_DB.prepare(`
    INSERT OR IGNORE INTO inbox
      (webhook_id, resend_email_id, from_address, to_addresses, subject, text, received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    webhookId,
    emailId,
    email.from,
    JSON.stringify(email.to),
    email.subject,
    email.text,
    email.receivedAt,
  ).run();
  const stored = (result.meta.changes ?? 0) === 1;
  if (stored) await publishMailBurst(env, webhookId);
  return json({ ok: true, stored });
};
