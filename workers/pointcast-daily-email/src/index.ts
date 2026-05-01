/**
 * pointcast-daily-email - daily PointCast update worker.
 *
 * The scheduled handler builds a public-source update, lists opt-in
 * recipients, and sends via Resend only when explicitly placed in live
 * mode. The default dry-run mode logs and exposes the preview without
 * contacting the provider.
 */

export interface Env {
  DAILY_EMAIL_AUDIENCE_KV?: KVNamespace;
  DAILY_EMAIL_FROM?: string;
  DAILY_EMAIL_FROM_NAME?: string;
  DAILY_EMAIL_ORIGIN?: string;
  DAILY_EMAIL_SEND_MODE?: string;
  DAILY_EMAIL_TO?: string;
  DAILY_EMAIL_OPS_TOKEN?: string;
  RESEND_API_KEY?: string;
}

interface Recipient {
  email: string;
  source: 'env' | 'kv';
  key?: string;
  record?: Record<string, unknown>;
}

interface DailySection {
  label: string;
  title: string;
  body: string;
  links: { label: string; href: string }[];
}

interface DailyUpdate {
  version: string;
  generatedAt: string;
  datePT: string;
  origin: string;
  subject: string;
  preheader: string;
  sections: DailySection[];
  sourceStatus: Record<string, 'ok' | 'unavailable'>;
}

interface SendMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendResult {
  ok: boolean;
  status: number;
  provider: 'resend' | 'dry-run';
  error?: string;
}

const VERSION = 'v0.1.0';
const PREFIX = 'sub:';
const DEFAULT_ORIGIN = 'https://pointcast.xyz';
const DEFAULT_FROM = 'hello@pointcast.xyz';
const DEFAULT_FROM_NAME = 'PointCast';

const SOURCE_PATHS = {
  blocks: '/blocks.json',
  sprints: '/sprints.json',
  battler: '/nouns-nation-battler.json',
  nation: '/nouns-nation.json',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
    },
  });
}

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return null;
  if (email.length > 254) return null;
  return email;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] || char;
  });
}

function todayPT(now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

function siteOrigin(env: Env): string {
  return (env.DAILY_EMAIL_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, '');
}

async function fetchJson(origin: string, path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${origin}${path}`, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 60, cacheEverything: true },
    } as RequestInit);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickBlockLines(payload: unknown): string[] {
  const anyPayload = payload as any;
  const list = Array.isArray(anyPayload?.blocks)
    ? anyPayload.blocks
    : Array.isArray(anyPayload)
      ? anyPayload
      : [];
  return list.slice(0, 3).map((block: any) => {
    const id = block?.id || block?.data?.id || block?.slug || 'block';
    const title = block?.title || block?.data?.title || block?.headline || `Block ${id}`;
    const channel = block?.channel || block?.data?.channel || block?.type || 'PointCast';
    return `${title} (${channel}, ${id})`;
  });
}

function pickSprintLines(payload: unknown): string[] {
  const anyPayload = payload as any;
  const list = Array.isArray(anyPayload?.sprints) ? anyPayload.sprints : [];
  return list.slice(0, 3).map((sprint: any) => {
    const title = sprint?.title || sprint?.sprintId || 'Sprint receipt';
    const status = sprint?.status || sprint?.trigger || 'logged';
    return `${title} - ${status}`;
  });
}

function firstString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

async function buildDailyUpdate(env: Env, now = new Date()): Promise<DailyUpdate> {
  const origin = siteOrigin(env);
  const [blocks, sprints, battler, nation] = await Promise.all([
    fetchJson(origin, SOURCE_PATHS.blocks),
    fetchJson(origin, SOURCE_PATHS.sprints),
    fetchJson(origin, SOURCE_PATHS.battler),
    fetchJson(origin, SOURCE_PATHS.nation),
  ]);

  const datePT = todayPT(now);
  const blockLines = pickBlockLines(blocks);
  const sprintLines = pickSprintLines(sprints);
  const battlerAny = battler as any;
  const nationAny = nation as any;
  const battlerStatus = firstString(battlerAny?.status, 'Battle Desk V3 federation coverage is ready.');
  const nationSummary = firstString(nationAny?.summary, 'Nouns Nation federation manifest is ready.');

  const lead = blockLines[0] || 'Nouns Nation and sprint wire';
  const subject = `PointCast Daily - ${datePT} - ${lead.slice(0, 72)}`;

  return {
    version: VERSION,
    generatedAt: now.toISOString(),
    datePT,
    origin,
    subject,
    preheader:
      'Nouns Nation coverage, fresh PointCast blocks, shipped sprint receipts, and the next operator move.',
    sourceStatus: {
      blocks: blocks ? 'ok' : 'unavailable',
      sprints: sprints ? 'ok' : 'unavailable',
      battler: battler ? 'ok' : 'unavailable',
      nation: nation ? 'ok' : 'unavailable',
    },
    sections: [
      {
        label: 'Topline',
        title: lead,
        body:
          blockLines.length > 1
            ? blockLines.join(' / ')
            : 'PointCast Daily is ready to send once provider and opt-in audience settings are configured.',
        links: [
          { label: 'Archive', href: `${origin}/archive` },
          { label: 'Blocks JSON', href: `${origin}/blocks.json` },
        ],
      },
      {
        label: 'Nouns Desk',
        title: 'Nouns Nation battler and federation wire',
        body: `${battlerStatus} ${nationSummary}`,
        links: [
          { label: 'Battle Desk V3', href: `${origin}/nouns-nation-battler-v3/` },
          { label: 'Nouns Nation', href: `${origin}/nouns-nation/` },
        ],
      },
      {
        label: 'Sprint Log',
        title: sprintLines[0] || 'No new sprint receipts surfaced',
        body:
          sprintLines.length > 0
            ? sprintLines.join(' / ')
            : 'The scheduler could not read /sprints.json on this tick. Keep the email useful by linking the public sprint log.',
        links: [
          { label: 'Sprints', href: `${origin}/sprints` },
          { label: 'Sprints JSON', href: `${origin}/sprints.json` },
        ],
      },
      {
        label: 'Next Action',
        title: 'Preview, then switch live mode only after setup',
        body:
          'Confirm the preview, bind RESEND_API_KEY, set DAILY_EMAIL_SEND_MODE=live, and keep recipients limited to explicit opt-in addresses.',
        links: [
          { label: 'Scheduler', href: `${origin}/email-scheduler` },
          { label: 'Scheduler JSON', href: `${origin}/email-scheduler.json` },
        ],
      },
    ],
  };
}

function renderText(update: DailyUpdate, recipient: string): string {
  const lines = [
    'PointCast Daily',
    update.datePT,
    '',
    update.preheader,
    '',
    ...update.sections.flatMap((section) => [
      `${section.label}: ${section.title}`,
      section.body,
      ...section.links.map((link) => `${link.label}: ${link.href}`),
      '',
    ]),
    'You are receiving this because this address was added to the opt-in PointCast Daily audience.',
    `Reply or contact hello@pointcast.xyz to update preferences. Recipient: ${recipient}`,
  ];
  return lines.join('\n');
}

function renderHtml(update: DailyUpdate, recipient: string): string {
  const sections = update.sections.map((section) => `
    <tr>
      <td style="padding:18px 0;border-top:1px solid #ddd;">
        <p style="font:11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#185fa5;margin:0 0 7px;">${escapeHtml(section.label)}</p>
        <h2 style="font:500 22px/1.1 Inter,Arial,sans-serif;margin:0 0 8px;color:#111;">${escapeHtml(section.title)}</h2>
        <p style="font:15px/1.55 Inter,Arial,sans-serif;margin:0 0 10px;color:#333;">${escapeHtml(section.body)}</p>
        <p style="font:13px/1.5 Inter,Arial,sans-serif;margin:0;">
          ${section.links.map((link) => `<a href="${escapeHtml(link.href)}" style="color:#185fa5;text-decoration:none;">${escapeHtml(link.label)}</a>`).join(' &nbsp; ')}
        </p>
      </td>
    </tr>`).join('');

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f5f1;padding:24px;color:#111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #d8d6cf;">
      <tr>
        <td style="padding:24px 24px 10px;">
          <p style="font:11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#8a4b10;margin:0 0 8px;">POINTCAST DAILY / ${escapeHtml(update.datePT)}</p>
          <h1 style="font:500 34px/1 Inter,Arial,sans-serif;margin:0 0 10px;color:#111;">PointCast Daily</h1>
          <p style="font:15px/1.55 Inter,Arial,sans-serif;margin:0;color:#333;">${escapeHtml(update.preheader)}</p>
        </td>
      </tr>
      ${sections}
      <tr>
        <td style="padding:18px 24px 24px;border-top:1px solid #ddd;">
          <p style="font:12px/1.5 Inter,Arial,sans-serif;color:#666;margin:0;">
            You are receiving this because ${escapeHtml(recipient)} was added to the opt-in PointCast Daily audience.
            Reply or contact <a href="mailto:hello@pointcast.xyz" style="color:#185fa5;">hello@pointcast.xyz</a> to update preferences.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function listRecipients(env: Env): Promise<Recipient[]> {
  const recipients = new Map<string, Recipient>();

  for (const raw of (env.DAILY_EMAIL_TO || '').split(',')) {
    const email = normalizeEmail(raw);
    if (email) recipients.set(email, { email, source: 'env' });
  }

  if (env.DAILY_EMAIL_AUDIENCE_KV) {
    let cursor: string | undefined;
    do {
      const page = await env.DAILY_EMAIL_AUDIENCE_KV.list({ prefix: PREFIX, cursor, limit: 1000 });
      for (const key of page.keys) {
        const raw = await env.DAILY_EMAIL_AUDIENCE_KV.get(key.name);
        let record: Record<string, unknown> = {};
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') record = parsed as Record<string, unknown>;
          } catch {
            record = {};
          }
        }
        if (record.active === false || record.status === 'unsubscribed') continue;
        const email = normalizeEmail(record.email || key.name.slice(PREFIX.length));
        if (email) recipients.set(email, { email, source: 'kv', key: key.name, record });
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }

  return Array.from(recipients.values()).sort((a, b) => a.email.localeCompare(b.email));
}

function liveSendingEnabled(env: Env): boolean {
  return (env.DAILY_EMAIL_SEND_MODE || '').toLowerCase() === 'live' && Boolean(env.RESEND_API_KEY);
}

async function sendViaResend(env: Env, message: SendMessage): Promise<SendResult> {
  if (!liveSendingEnabled(env)) {
    return { ok: true, status: 0, provider: 'dry-run' };
  }

  const fromEmail = env.DAILY_EMAIL_FROM || DEFAULT_FROM;
  const fromName = env.DAILY_EMAIL_FROM_NAME || DEFAULT_FROM_NAME;
  const from = `${fromName} <${fromEmail}>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (response.ok) {
      return { ok: true, status: response.status, provider: 'resend' };
    }

    const text = await response.text().catch(() => '');
    return {
      ok: false,
      status: response.status,
      provider: 'resend',
      error: text.slice(0, 500) || `Resend ${response.status}`,
    };
  } catch (err) {
    return { ok: false, status: 0, provider: 'resend', error: String(err) };
  }
}

async function markSent(env: Env, recipient: Recipient, now: Date): Promise<void> {
  if (!env.DAILY_EMAIL_AUDIENCE_KV || recipient.source !== 'kv' || !recipient.key) return;
  const nextRecord = {
    ...(recipient.record || {}),
    email: recipient.email,
    active: recipient.record?.active ?? true,
    last_sent_at: now.toISOString(),
  };
  await env.DAILY_EMAIL_AUDIENCE_KV.put(recipient.key, JSON.stringify(nextRecord), {
    metadata: { last_sent_at: now.toISOString() },
  });
}

async function runDaily(env: Env, now = new Date()) {
  const update = await buildDailyUpdate(env, now);
  const recipients = await listRecipients(env);
  const sendingEnabled = liveSendingEnabled(env);
  const results: Array<{ email: string; ok: boolean; provider: string; status: number; error?: string }> = [];

  for (const recipient of recipients) {
    const message = {
      to: recipient.email,
      subject: update.subject,
      html: renderHtml(update, recipient.email),
      text: renderText(update, recipient.email),
    };
    const result = await sendViaResend(env, message);
    results.push({
      email: recipient.email,
      ok: result.ok,
      provider: result.provider,
      status: result.status,
      error: result.error,
    });
    if (sendingEnabled && result.ok) {
      await markSent(env, recipient, now);
    }
  }

  return {
    ok: results.every((result) => result.ok),
    workerVersion: VERSION,
    mode: sendingEnabled ? 'live' : 'dry-run',
    generatedAt: update.generatedAt,
    subject: update.subject,
    recipients: recipients.length,
    sent: sendingEnabled ? results.filter((result) => result.ok).length : 0,
    dryRun: !sendingEnabled,
    sourceStatus: update.sourceStatus,
    results,
  };
}

function requireOps(request: Request, env: Env): Response | null {
  if (!env.DAILY_EMAIL_OPS_TOKEN) {
    return jsonResponse(503, { ok: false, reason: 'ops-token-not-configured' });
  }
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${env.DAILY_EMAIL_OPS_TOKEN}`) {
    return jsonResponse(401, { ok: false, reason: 'bad-token' });
  }
  return null;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const now = new Date(event.scheduledTime || Date.now());
    const result = await runDaily(env, now);
    console.log(
      `[pointcast-daily-email] ${result.mode} ${result.subject} recipients=${result.recipients} sent=${result.sent} ok=${result.ok}`,
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'authorization, content-type',
        },
      });
    }

    if (url.pathname === '/health') {
      const recipients = await listRecipients(env);
      return jsonResponse(200, {
        ok: true,
        workerVersion: VERSION,
        mode: liveSendingEnabled(env) ? 'live' : 'dry-run',
        hasResendKey: Boolean(env.RESEND_API_KEY),
        hasAudienceKv: Boolean(env.DAILY_EMAIL_AUDIENCE_KV),
        envRecipientCount: (env.DAILY_EMAIL_TO || '').split(',').map(normalizeEmail).filter(Boolean).length,
        recipientCount: recipients.length,
      });
    }

    if (url.pathname === '/preview') {
      const update = await buildDailyUpdate(env);
      return jsonResponse(200, update);
    }

    if (url.pathname === '/dry-run') {
      const denied = requireOps(request, env);
      if (denied) return denied;
      return jsonResponse(200, await runDaily(env));
    }

    if (url.pathname === '/send-test' && request.method === 'POST') {
      const denied = requireOps(request, env);
      if (denied) return denied;
      const to = normalizeEmail(url.searchParams.get('to'));
      if (!to) return jsonResponse(400, { ok: false, reason: 'valid ?to= email required' });

      const update = await buildDailyUpdate(env);
      const result = await sendViaResend(env, {
        to,
        subject: `[test] ${update.subject}`,
        html: renderHtml(update, to),
        text: renderText(update, to),
      });
      return jsonResponse(result.ok ? 200 : 502, {
        ok: result.ok,
        mode: liveSendingEnabled(env) ? 'live' : 'dry-run',
        provider: result.provider,
        status: result.status,
        error: result.error,
      });
    }

    return new Response(
      'pointcast-daily-email worker\nroutes: /health, /preview, /dry-run, POST /send-test?to=email\n',
      { headers: { 'content-type': 'text/plain; charset=utf-8' } },
    );
  },
};
