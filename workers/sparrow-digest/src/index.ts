/**
 * sparrow-digest cron worker — v0.33 scaffold
 *
 * Reads sparrow-digest-subscription-v1 records from SPARROW_DIGEST_KV
 * (written by functions/api/sparrow/digest-subscribe.ts), rebuilds each
 * subscriber's /sparrow/signals bundle by subscribing to their listed
 * relays, renders a small HTML email, and sends via MailChannels (no
 * API key needed from Cloudflare Workers — the hop is authenticated
 * by the DKIM/DMARC lockdown record on the sending domain).
 *
 * Runtime shape (happy path):
 *   scheduled trigger → list KV entries with prefix "sub:" →
 *   for each record whose frequency + last_sent_at qualifies,
 *   aggregate signals → render email → MailChannels POST.
 *
 * This file is deliberately a scaffold in v0.33. The pieces that still
 * need implementing:
 *   · Nostr client: port of NostrRelayClient.swift from sparrow-app —
 *     a tiny ws:// REQ-and-close helper using the native WebSocket
 *     API Workers expose.
 *   · Signals aggregation: mirror the logic in
 *     src/pages/sparrow/signals.astro (top co-saved + recent adds
 *     + channel distribution). Share the block lookup by fetching
 *     /b/<id>.json at render time — or pre-cache it in KV.
 *   · Unsubscribe token: HMAC-SHA256 of email+kid, 7-day rotation.
 *   · Frequency gating: skip biweekly if last_sent_at within 13d,
 *     monthly if within 28d.
 */

export interface Env {
  SPARROW_DIGEST_KV: KVNamespace;
  DIGEST_FROM: string;
  DIGEST_FROM_NAME: string;
  SPARROW_ORIGIN: string;
}

interface Subscription {
  schema: 'sparrow-digest-subscription-v1';
  email: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  npub?: string | null;
  relays?: string[];
  client_created_at?: string | null;
  received_at?: string;
  user_agent?: string;
  last_sent_at?: string;
}

const PREFIX = 'sub:';

function isDue(sub: Subscription, now: Date): boolean {
  if (!sub.last_sent_at) return true;
  const last = new Date(sub.last_sent_at).getTime();
  if (!Number.isFinite(last)) return true;
  const age = now.getTime() - last;
  const day = 86_400_000;
  switch (sub.frequency) {
    case 'biweekly': return age >= 13 * day;
    case 'monthly':  return age >= 28 * day;
    case 'weekly':
    default:         return age >= 6 * day;
  }
}

async function listAllSubscriptions(env: Env): Promise<Subscription[]> {
  const out: Subscription[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.SPARROW_DIGEST_KV.list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const key of page.keys) {
      const raw = await env.SPARROW_DIGEST_KV.get(key.name);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as Subscription;
        if (parsed && parsed.schema === 'sparrow-digest-subscription-v1') out.push(parsed);
      } catch { /* skip malformed */ }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

/**
 * Placeholder renderer. Real version will assemble the signals bundle.
 */
function renderDigestEmail(sub: Subscription, env: Env): { subject: string; html: string; text: string } {
  const subject = 'Sparrow · your federation recap';
  const signalsUrl = `${env.SPARROW_ORIGIN}/sparrow/signals`;
  const unsubHref = `${env.SPARROW_ORIGIN}/api/sparrow/digest-subscribe?email=${encodeURIComponent(sub.email)}`;
  const text = [
    `Sparrow · ${sub.frequency} digest`,
    '',
    `Latest federation signals: ${signalsUrl}`,
    '',
    `Unsubscribe (token-verified): ${unsubHref}`,
  ].join('\n');
  const html = `
<!doctype html>
<html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;">
  <h1 style="font-family:'Gloock',Georgia,serif;">Sparrow · your federation recap</h1>
  <p>Your ${sub.frequency} digest.</p>
  <p><a href="${signalsUrl}">Open signals in Sparrow →</a></p>
  <hr>
  <p style="font-size:11px;color:#666;">
    <a href="${unsubHref}">Unsubscribe</a> · sent by Sparrow · pointcast.xyz
  </p>
</body></html>`;
  return { subject, html, text };
}

/**
 * MailChannels transport. When running under the Cloudflare Workers
 * runtime on a domain with proper DKIM + DMARC + the MailChannels
 * lockdown TXT record, this hop authenticates without a key.
 */
async function sendViaMailChannels(
  sub: Subscription,
  env: Env,
  { subject, html, text }: { subject: string; html: string; text: string }
): Promise<boolean> {
  const body = {
    personalizations: [{ to: [{ email: sub.email }] }],
    from: { email: env.DIGEST_FROM, name: env.DIGEST_FROM_NAME },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html',  value: html  },
    ],
  };
  try {
    const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const started = Date.now();
    const subs = await listAllSubscriptions(env);
    const now = new Date();
    const due = subs.filter((s) => isDue(s, now));
    console.log(`[sparrow-digest] ${due.length} of ${subs.length} subscribers due at ${now.toISOString()}`);

    let sent = 0;
    let failed = 0;
    for (const sub of due) {
      const email = renderDigestEmail(sub, env);
      const ok = await sendViaMailChannels(sub, env, email);
      if (ok) {
        sub.last_sent_at = now.toISOString();
        await env.SPARROW_DIGEST_KV.put(`${PREFIX}${sub.email}`, JSON.stringify(sub), {
          expirationTtl: 60 * 60 * 24 * 400,
          metadata: { frequency: sub.frequency, last_sent_at: sub.last_sent_at },
        });
        sent += 1;
      } else {
        failed += 1;
      }
    }

    ctx.waitUntil(Promise.resolve());
    console.log(`[sparrow-digest] done · sent ${sent} · failed ${failed} · elapsed ${Date.now() - started}ms`);
  },

  async fetch(request: Request, env: Env) {
    // Manual trigger endpoint for testing: GET /dry-run simulates a
    // scheduled tick and returns a summary. Deploy-time, guard this
    // with an auth header or route it through an admin domain.
    const url = new URL(request.url);
    if (url.pathname === '/dry-run') {
      const subs = await listAllSubscriptions(env);
      const now = new Date();
      const due = subs.filter((s) => isDue(s, now));
      return new Response(JSON.stringify({
        ok: true,
        total: subs.length,
        due: due.length,
        now: now.toISOString(),
        worker_version: 'v0.33',
      }, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return new Response('sparrow-digest cron worker · v0.33\nsee README.md for deploy instructions.\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
