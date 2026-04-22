/**
 * sparrow-digest · send.ts — v0.35 MailChannels transport with retry
 *
 * Splits the MailChannels concern out of index.ts so the cron handler
 * stays readable. Adds:
 *
 *   · exponential backoff with jitter on 5xx or network error
 *   · dead-letter drop (returns structured failure so the cron can
 *     surface it in the run log; the subscription row is NOT touched
 *     so the next cron tick retries cleanly)
 *   · rate-friendly ceiling (max 3 attempts) so a bad domain config
 *     doesn't keep a cron tick alive forever
 *
 * MailChannels quirks worth knowing:
 *   · 401 means the sending-domain's DKIM/DMARC + `_mailchannels` TXT
 *     lockdown isn't configured — no amount of retry fixes that.
 *   · 403 similarly is a domain-auth problem.
 *   · 429 is real rate limiting; backoff helps.
 *   · 500-599 is usually a transient MailChannels problem; retry.
 */

export interface SendEnv {
  DIGEST_FROM: string;
  DIGEST_FROM_NAME: string;
}

export interface SendMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface SendResult {
  ok: boolean;
  status: number;
  attempts: number;
  finalError?: string;
  retriable: boolean;
}

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 800;

function jitterBackoff(attempt: number): number {
  // Exponential doubling + full jitter.
  // attempt=1 → 0..800ms · attempt=2 → 0..1600ms · attempt=3 → 0..3200ms.
  const ceiling = BASE_BACKOFF_MS * 2 ** (attempt - 1);
  return Math.floor(Math.random() * ceiling);
}

function isRetriable(status: number): boolean {
  // Retriable: transient server errors + rate limits.
  // Not retriable: auth failures (401/403), config errors (422), 2xx.
  if (status >= 500 && status < 600) return true;
  if (status === 429) return true;
  if (status === 408) return true;
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send via MailChannels with retry. Always resolves; `ok` reflects
 * whether MailChannels accepted the message. Non-ok results carry
 * enough context for the caller to decide whether to roll back the
 * subscription's `last_sent_at` (retriable) or leave it alone
 * (permanent failure, e.g. invalid email).
 */
export async function sendViaMailChannels(
  env: SendEnv,
  msg: SendMessage,
): Promise<SendResult> {
  let lastStatus = 0;
  let lastError: string | undefined;
  let retriable = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const body = {
      personalizations: [{ to: [{ email: msg.to }] }],
      from: { email: env.DIGEST_FROM, name: env.DIGEST_FROM_NAME },
      subject: msg.subject,
      content: [
        { type: 'text/plain', value: msg.text },
        { type: 'text/html',  value: msg.html  },
      ],
    };
    try {
      const r = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      lastStatus = r.status;
      if (r.ok) {
        return { ok: true, status: r.status, attempts: attempt, retriable: false };
      }
      retriable = isRetriable(r.status);
      if (!retriable) {
        // Fail-fast on auth / validation errors.
        return {
          ok: false,
          status: r.status,
          attempts: attempt,
          finalError: `MailChannels ${r.status} (non-retriable)`,
          retriable: false,
        };
      }
    } catch (err) {
      lastError = String(err);
      retriable = true;
    }
    if (attempt < MAX_ATTEMPTS) {
      await sleep(jitterBackoff(attempt));
    }
  }
  return {
    ok: false,
    status: lastStatus,
    attempts: MAX_ATTEMPTS,
    finalError: lastError || `MailChannels ${lastStatus} after ${MAX_ATTEMPTS} attempts`,
    retriable,
  };
}
