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

import { buildUnsubUrl } from './signing';
import { sendViaMailChannels as sendMail, type SendResult } from './send';
import { collectAcrossRelays, newestPerAuthorByDTag, type NostrEvent } from './nostr';

export interface Env {
  SPARROW_DIGEST_KV: KVNamespace;
  DIGEST_FROM: string;
  DIGEST_FROM_NAME: string;
  SPARROW_ORIGIN: string;
  /** v0.34: shared HMAC signing secret. Must be bound with the same
   *  value on the Pages Function (`functions/api/sparrow/digest-subscribe.ts`)
   *  so the unsubscribe link in the email footer verifies on click. */
  SPARROW_DIGEST_SIGNING_KEY: string;
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
 * Render the weekly digest email.
 *
 * v0.34: signed unsubscribe link.
 * v0.35: when the subscriber has an npub, fetch their followed-pubkeys
 * from Nostr (their own kind-3 contact list) and show "your N friends
 * have published M saved-list events since last digest." Full signals
 * aggregation (co-saves, channel distribution) still to come in v0.36
 * — this is the first sprint where the digest has ANY real content.
 *
 * Subscribers without an npub get a short "open signals" prompt only.
 */
async function renderDigestEmail(
  sub: Subscription,
  env: Env,
): Promise<{ subject: string; html: string; text: string }> {
  const subject = 'Sparrow · your federation recap';
  const signalsUrl = `${env.SPARROW_ORIGIN}/sparrow/signals`;
  const friendsUrl = `${env.SPARROW_ORIGIN}/sparrow/friends`;
  const unsubHref = env.SPARROW_DIGEST_SIGNING_KEY
    ? await buildUnsubUrl(env.SPARROW_ORIGIN, sub.email, env.SPARROW_DIGEST_SIGNING_KEY)
    : `${env.SPARROW_ORIGIN}/api/sparrow/digest-subscribe?email=${encodeURIComponent(sub.email)}`;

  // v0.35: best-effort live fetch. We don't have the subscriber's
  // follow list server-side (it lives in their browser localStorage
  // or in their Nostr kind-3). Fetching kind-3 for the subscriber's
  // own pubkey gives us their follow list from their signer-of-record.
  let friendsSummary = '';
  let friendsSummaryText = '';
  if (sub.npub && sub.relays?.length) {
    try {
      const { collectAcrossRelays } = await import('./nostr');
      const { events: contactsEvents } = await collectAcrossRelays(
        sub.relays.slice(0, 4),
        { kinds: [3], authors: [sub.npub], limit: 1 },
        { timeoutMs: 5_000, maxEvents: 3 },
      );
      const contacts = contactsEvents[0];
      const followedPubkeys = contacts
        ? contacts.tags.filter((t) => t[0] === 'p' && typeof t[1] === 'string').map((t) => t[1])
        : [];
      if (followedPubkeys.length) {
        const { newestPerAuthor, relayCount } = await fetchFriendsSavedLists(
          sub.relays,
          followedPubkeys,
        );
        const activeFriends = newestPerAuthor.size;
        const totalSaves = Array.from(newestPerAuthor.values()).reduce((acc, ev) => {
          try {
            const body = JSON.parse(ev.content);
            const list = body?.saved?.value;
            return acc + (Array.isArray(list) ? list.length : 0);
          } catch { return acc; }
        }, 0);
        friendsSummary = `<p><strong>${activeFriends}</strong> of <strong>${followedPubkeys.length}</strong> followed signers published public saved lists in the last cycle, ` +
          `totaling <strong>${totalSaves}</strong> saved-block references across ${relayCount} relays.</p>`;
        friendsSummaryText = `${activeFriends} of ${followedPubkeys.length} followed signers published public saved lists · ${totalSaves} total saved-block references.`;
      }
    } catch {
      // Network hiccup — email still sends, just without the summary.
    }
  }

  const text = [
    `Sparrow · ${sub.frequency} digest`,
    '',
    friendsSummaryText || 'Your digest is ready.',
    '',
    `Federation signals: ${signalsUrl}`,
    `Your friends: ${friendsUrl}`,
    '',
    `Unsubscribe: ${unsubHref}`,
  ].join('\n');
  const html = `
<!doctype html>
<html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a2e;">
  <h1 style="font-family:'Gloock',Georgia,serif;font-weight:400;">Sparrow · your federation recap</h1>
  <p style="color:#555;">Your ${sub.frequency} digest.</p>
  ${friendsSummary}
  <p>
    <a href="${signalsUrl}" style="color:#c8742a;">Open signals in Sparrow →</a><br>
    <a href="${friendsUrl}" style="color:#c8742a;">Manage your friends →</a>
  </p>
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">
  <p style="font-size:11px;color:#888;">
    <a href="${unsubHref}" style="color:#888;">Unsubscribe</a> · sent by Sparrow · pointcast.xyz
  </p>
</body></html>`;
  return { subject, html, text };
}

/**
 * MailChannels transport. v0.35 extracted to workers/sparrow-digest/
 * src/send.ts with retry-with-jitter + dead-letter classification. Wrap
 * it here so the legacy-shape call site in scheduled() stays readable.
 */
async function sendViaMailChannels(
  sub: Subscription,
  env: Env,
  payload: { subject: string; html: string; text: string },
): Promise<SendResult> {
  return sendMail(env, { to: sub.email, ...payload });
}

/**
 * v0.35: fetch the newest public saved-list event per followed-pubkey
 * across the subscriber's relay pool. Returns the raw kind-30078
 * events keyed by pubkey. Caller is responsible for parsing the JSON
 * content + applying the sparrow-public-saved-v1 schema.
 *
 * Why cap authors: each REQ filter carries every author in one shot;
 * most relays cap `authors` at 512. We defensively trim.
 */
async function fetchFriendsSavedLists(
  relays: string[],
  authorPubkeys: string[],
): Promise<{ newestPerAuthor: Map<string, NostrEvent>; relayCount: number; totalSeen: number }> {
  const defaultRelays = ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nos.lol'];
  const pool = relays.length ? relays.slice(0, 8) : defaultRelays;
  const authors = authorPubkeys.slice(0, 256);
  if (!authors.length) {
    return { newestPerAuthor: new Map(), relayCount: pool.length, totalSeen: 0 };
  }
  const { events } = await collectAcrossRelays(
    pool,
    {
      kinds: [30078],
      authors,
      '#d': ['sparrow-public-saved-v1'],
      limit: authors.length * 2,
    },
    { timeoutMs: 6_000, maxEvents: authors.length * 3 },
  );
  return {
    newestPerAuthor: newestPerAuthorByDTag(events, 'sparrow-public-saved-v1'),
    relayCount: pool.length,
    totalSeen: events.length,
  };
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
    let retriableFailed = 0;
    for (const sub of due) {
      const email = await renderDigestEmail(sub, env);
      const result = await sendViaMailChannels(sub, env, email);
      if (result.ok) {
        sub.last_sent_at = now.toISOString();
        await env.SPARROW_DIGEST_KV.put(`${PREFIX}${sub.email}`, JSON.stringify(sub), {
          expirationTtl: 60 * 60 * 24 * 400,
          metadata: { frequency: sub.frequency, last_sent_at: sub.last_sent_at },
        });
        sent += 1;
      } else {
        failed += 1;
        if (result.retriable) retriableFailed += 1;
        // v0.35: retriable failures do NOT update last_sent_at, so the
        // next cron tick tries again. Permanent failures (401/403/422)
        // also don't update last_sent_at here — ops needs to see them;
        // a future sprint may add a dead-letter KV bucket and
        // exponential-backoff across cron ticks.
        console.warn(
          `[sparrow-digest] send failed for ${sub.email} · status=${result.status} · ` +
          `attempts=${result.attempts} · retriable=${result.retriable} · ${result.finalError ?? ''}`,
        );
      }
    }

    ctx.waitUntil(Promise.resolve());
    console.log(
      `[sparrow-digest] done · sent ${sent} · failed ${failed} ` +
      `(${retriableFailed} retriable) · elapsed ${Date.now() - started}ms`,
    );
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
        worker_version: 'v0.35',
      }, null, 2), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return new Response('sparrow-digest cron worker · v0.35\nsee README.md for deploy instructions.\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
