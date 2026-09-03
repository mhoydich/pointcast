import {
  COLLECT_EMAIL_FROM,
  collectDay,
  collectSitting,
  dailyEmail,
  unsubscribeUrl,
} from '../../../src/lib/collect-desk';
import { sendMail, type MailEnv } from '../../../src/lib/mail';

interface Env extends MailEnv {
  AUTH_DB: D1Database;
  PRESENCE_BUS: Fetcher;
  KENNEL_DAILY_DRY_RUN: string;
}

type DailySubscriberRow = {
  email: string;
  token: string;
  last_sent_day: string | null;
};

export type DailyRunResult = {
  ok: true;
  day: string;
  sitting: number;
  configured: boolean;
  dryRun: boolean;
  attempted: number;
  sent: number;
  failed: number;
};

type OptionalDailyEnv = Env & {
  AUTH_DB?: D1Database;
  PRESENCE_BUS?: Fetcher;
};

function hasMail(env: OptionalDailyEnv): boolean {
  return Boolean(env.RESEND_API_KEY || env.SEND_EMAIL);
}

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify(event));
}

async function writeRun(
  db: D1Database,
  result: DailyRunResult,
  startedAt: string,
): Promise<void> {
  await db.prepare(`
    INSERT INTO kennel_daily_runs
      (day, started_at, finished_at, attempted, sent, failed, dry_run, configured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(day) DO UPDATE SET
      started_at = excluded.started_at,
      finished_at = excluded.finished_at,
      attempted = excluded.attempted,
      sent = excluded.sent,
      failed = excluded.failed,
      dry_run = excluded.dry_run,
      configured = excluded.configured
  `).bind(
    result.day,
    startedAt,
    new Date().toISOString(),
    result.attempted,
    result.sent,
    result.failed,
    result.dryRun ? 1 : 0,
    result.configured ? 1 : 0,
  ).run();
}

async function publishDailyBurst(env: OptionalDailyEnv, result: DailyRunResult, name: string): Promise<void> {
  if (!env.PRESENCE_BUS || result.dryRun || !result.configured) return;
  try {
    const response = await env.PRESENCE_BUS.fetch('https://presence.internal/burst', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'daily',
        clientId: `kennel-daily:${result.day}`,
        by: { handle: 'kennel-club' },
        meta: {
          day: result.day,
          sitting: result.sitting,
          name,
          sent: result.sent,
          href: '/collect',
        },
      }),
    });
    if (!response.ok) log({ message: 'kennel daily burst rejected', status: response.status, day: result.day });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'kennel daily burst failed',
      day: result.day,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

export async function runKennelDaily(
  rawEnv: Env,
  options: { now?: Date; dryRun?: boolean } = {},
): Promise<DailyRunResult> {
  const env: OptionalDailyEnv = rawEnv;
  const startedAt = new Date().toISOString();
  const now = options.now ?? new Date();
  const day = collectDay(now);
  const sitting = collectSitting(now);
  const dryRun = options.dryRun ?? String(env.KENNEL_DAILY_DRY_RUN) === 'true';
  const configured = Boolean(env.AUTH_DB && hasMail(env));
  const result: DailyRunResult = {
    ok: true,
    day,
    sitting: sitting.day,
    configured,
    dryRun,
    attempted: 0,
    sent: 0,
    failed: 0,
  };

  if (!env.AUTH_DB) {
    log({ message: 'kennel daily skipped', reason: 'auth-db-not-configured', ...result });
    return result;
  }
  if (!hasMail(env) && !dryRun) {
    log({ message: 'kennel daily skipped', reason: 'email-not-configured', ...result });
    await writeRun(env.AUTH_DB, result, startedAt);
    return result;
  }

  const query = await env.AUTH_DB.prepare(`
    SELECT email, token, last_sent_day
    FROM subscribers
    WHERE status = 'confirmed' AND (last_sent_day IS NULL OR last_sent_day <> ?)
    ORDER BY confirmed_at, email
    LIMIT 1000
  `).bind(day).all<DailySubscriberRow>();
  const subscribers = query.results ?? [];
  result.attempted = subscribers.length;

  for (const subscriber of subscribers) {
    if (dryRun) continue;
    const mark = await env.AUTH_DB.prepare(`
      UPDATE subscribers SET last_sent_day = ?
      WHERE email = ? AND status = 'confirmed'
        AND (last_sent_day IS NULL OR last_sent_day <> ?)
    `).bind(day, subscriber.email, day).run();
    if ((mark.meta.changes ?? 0) !== 1) continue;
    const content = dailyEmail(sitting, subscriber.token);
    try {
      await sendMail({
        to: subscriber.email,
        from: `PointCast Kennel Club <${COLLECT_EMAIL_FROM}>`,
        subject: content.subject,
        text: content.text,
        html: content.html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl(subscriber.token)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, env);
      result.sent += 1;
    } catch (error) {
      result.failed += 1;
      await env.AUTH_DB.prepare(`
        UPDATE subscribers SET last_sent_day = ?
        WHERE email = ? AND last_sent_day = ?
      `).bind(subscriber.last_sent_day, subscriber.email, day).run();
      console.error(JSON.stringify({
        message: 'kennel daily send failed',
        day,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }

  await writeRun(env.AUTH_DB, result, startedAt);
  await publishDailyBurst(env, result, sitting.name);
  log({ message: 'kennel daily complete', ...result });
  return result;
}

async function status(rawEnv: Env): Promise<Response> {
  const env: OptionalDailyEnv = rawEnv;
  let lastRun: Record<string, unknown> | null = null;
  if (env.AUTH_DB) {
    lastRun = await env.AUTH_DB.prepare(`
      SELECT day, started_at, finished_at, attempted, sent, failed, dry_run, configured
      FROM kennel_daily_runs ORDER BY day DESC LIMIT 1
    `).first<Record<string, unknown>>();
  }
  return Response.json({
    ok: true,
    configured: Boolean(env.AUTH_DB && hasMail(env)),
    bindings: {
      authDb: Boolean(env.AUTH_DB),
      email: hasMail(env),
      resend: Boolean(env.RESEND_API_KEY),
      presence: Boolean(env.PRESENCE_BUS),
    },
    cron: '0 7 * * *',
    timeZone: 'America/Los_Angeles',
    dryRun: String(env.KENNEL_DAILY_DRY_RUN) === 'true',
    lastRun,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) {
      return status(env);
    }
    return new Response('Not found', { status: 404 });
  },
  async scheduled(controller, env): Promise<void> {
    await runKennelDaily(env, { now: new Date(controller.scheduledTime) });
  },
} satisfies ExportedHandler<Env>;
