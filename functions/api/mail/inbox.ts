import { authJson, readSessionFromRequest, type AuthEnv } from '../auth/session.ts';

interface InboxEnv extends AuthEnv {
  AUTH_DB?: D1Database;
}

type InboxRow = {
  from_address: string;
  to_addresses: string;
  subject: string;
  text: string;
  received_at: string;
};

function parseRecipients(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<InboxEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'director-only' }, { status: 403 });
  }
  if (!env.AUTH_DB) return authJson({ ok: false, reason: 'mail-inbox-not-configured' }, { status: 503 });
  const requestedLimit = Number.parseInt(new URL(request.url).searchParams.get('limit') ?? '50', 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 50;
  const query = await env.AUTH_DB.prepare(`
    SELECT from_address, to_addresses, subject, text, received_at
    FROM inbox
    ORDER BY received_at DESC
    LIMIT ?
  `).bind(limit).all<InboxRow>();
  return authJson({
    ok: true,
    messages: (query.results ?? []).map((row) => ({
      from: row.from_address,
      to: parseRecipients(row.to_addresses),
      subject: row.subject,
      text: row.text,
      receivedAt: row.received_at,
    })),
  });
};
