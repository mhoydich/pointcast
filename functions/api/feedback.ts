/**
 * /api/feedback — capture visitor feedback + ping Mike.
 *
 * Two-channel delivery:
 *   1. Store every submission in KV under `feedback:<ts>:<random>` with a
 *      30-day TTL. Viewable by Mike at /admin/feedback (token-auth).
 *   2. Optionally email to mhoydich@gmail.com via Resend when the
 *      `RESEND_API_KEY` env secret is set. If not set, storage-only
 *      (Mike still sees it in the admin viewer). Makes it zero-config
 *      to ship, one-config-step to upgrade to real email.
 *
 * No auth on submit. Rate-limited per-IP to 5/min so a rogue browser
 * can't flood the inbox.
 *
 * POST body:
 *   {
 *     message:  string (required, 1..2000 chars)
 *     mood?:    'loving' | 'confused' | 'annoyed' | 'impressed' | 'broken'
 *     contact?: string (optional email/phone for replies, <=200 chars)
 *     path?:    string (page they were on, <=200 chars)
 *   }
 */

import { sha256, type Env as VisitEnv } from './visit';

interface Env extends VisitEnv {
  // Optional secret; when set, feedback also emails Mike via Resend.
  RESEND_API_KEY?: string;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};
const RATE_PREFIX = 'fb:rate:';
const FEEDBACK_PREFIX = 'feedback:';
const RATE_WINDOW_SEC = 60;
const RATE_LIMIT = 5;
const FEEDBACK_TTL_SECONDS = 60 * 60 * 24 * 30;   // 30 days
const MIKE_EMAIL = 'mhoydich@gmail.com';

const ALLOWED_MOODS = new Set(['loving', 'confused', 'annoyed', 'impressed', 'broken']);

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init?.headers ?? {}) },
  });
}

function clip(s: unknown, max: number): string {
  if (typeof s !== 'string') return '';
  return s.slice(0, max).trim();
}

async function rateLimit(env: Env, ip: string): Promise<boolean> {
  if (!env.VISITS) return true; // storage unavailable — allow
  const key = `${RATE_PREFIX}${(await sha256(ip)).slice(0, 16)}`;
  const raw = await env.VISITS.get(key);
  const count = raw ? Number(raw) || 0 : 0;
  if (count >= RATE_LIMIT) return false;
  await env.VISITS.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_SEC });
  return true;
}

async function sendEmailViaResend(env: Env, subject: string, body: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PointCast Feedback <feedback@pointcast.xyz>',
        to: [MIKE_EMAIL],
        subject,
        text: body,
      }),
    });
  } catch { /* non-fatal — KV has it */ }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? '';

  if (!(await rateLimit(env, ip))) {
    return json({ ok: false, reason: 'rate-limit' }, { status: 429 });
  }

  let body: any;
  try { body = await request.json(); }
  catch { return json({ ok: false, reason: 'bad-body' }, { status: 400 }); }

  const message = clip(body?.message, 2000);
  if (message.length < 1) {
    return json({ ok: false, reason: 'empty' }, { status: 400 });
  }
  const mood = typeof body?.mood === 'string' && ALLOWED_MOODS.has(body.mood) ? body.mood : '';
  const contact = clip(body?.contact, 200);
  const path = clip(body?.path, 200);

  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${FEEDBACK_PREFIX}${now}:${rand}`;

  // Capture low-privacy geo so Mike sees "from Fullerton" rather than an IP.
  const cf = (request as any).cf ?? {};
  const city = typeof cf.city === 'string' ? cf.city : '';
  const region = typeof cf.region === 'string' ? cf.region : '';
  const country = typeof cf.country === 'string' ? cf.country : '';

  const entry = {
    t: now, message, mood, contact, path,
    city, region, country,
    ua: ua.slice(0, 200),
  };

  if (env.VISITS) {
    try {
      await env.VISITS.put(key, JSON.stringify(entry), {
        expirationTtl: FEEDBACK_TTL_SECONDS,
      });
    } catch { /* non-fatal; email path still runs */ }
  }

  // Email Mike (if Resend is configured). Body includes everything useful
  // in plain text so Mike can eyeball quickly.
  const locBits = [city, region, country].filter(Boolean).join(', ');
  const subject = `PointCast feedback${mood ? ` [${mood}]` : ''} — ${message.slice(0, 60)}${message.length > 60 ? '…' : ''}`;
  const emailBody = [
    `New PointCast feedback at ${new Date(now).toISOString()}`,
    ``,
    `Mood:    ${mood || '—'}`,
    `From:    ${locBits || '—'}`,
    `Page:    ${path || '—'}`,
    `Contact: ${contact || '—'}`,
    ``,
    `Message:`,
    message,
    ``,
    `---`,
    `UA: ${entry.ua}`,
  ].join('\n');

  await sendEmailViaResend(env, subject, emailBody);

  return json({ ok: true });
};

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
