import {
  aliasIsActive,
  publicAlias,
  validateAliasName,
  type PostOfficeAliasRow,
} from '../../../../src/lib/post-office.ts';

type StatusEnv = { AUTH_DB?: D1Database };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30, s-maxage=30',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}

export async function handleAliasStatus(
  env: StatusEnv,
  rawName: string | undefined,
  now = new Date(),
): Promise<Response> {
  if (!env.AUTH_DB) return json({ error: 'registry-not-configured' }, 503);
  let name: string;
  try {
    name = validateAliasName(rawName);
  } catch {
    return json({ error: 'alias-not-found' }, 404);
  }
  const row = await env.AUTH_DB.prepare(`
    SELECT name, forward_kind, forward_target, owner, receipt_hash, agent_id,
           created_at, renewed_at, expires_at, forwarded_count, status
    FROM aliases WHERE name = ? LIMIT 1
  `).bind(name).first<PostOfficeAliasRow>();
  if (!row) return json({ error: 'alias-not-found' }, 404);
  const visible = publicAlias(row, now);
  return json({
    alias: visible.alias,
    status: aliasIsActive(row, now) ? 'active' : 'expired',
    since: visible.since,
    expiresAt: visible.expiresAt,
    count: visible.forwardedCount,
    agentId: visible.agentId,
  });
}

export const onRequestGet: PagesFunction<StatusEnv> = async ({ env, params }) =>
  handleAliasStatus(env, typeof params.name === 'string' ? params.name : undefined);
