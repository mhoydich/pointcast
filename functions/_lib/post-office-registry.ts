import {
  POST_OFFICE_DISCOVERY,
  publicAlias,
  type PostOfficeAliasRow,
} from '../../src/lib/post-office.ts';

type RegistryEnv = { AUTH_DB?: D1Database };

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=30, s-maxage=30',
};

export async function registryResponse(env: RegistryEnv, now = new Date()): Promise<Response> {
  if (!env.AUTH_DB) {
    return Response.json({ ...POST_OFFICE_DISCOVERY, aliases: [], error: 'registry-not-configured' }, {
      status: 503,
      headers: { ...HEADERS, 'Cache-Control': 'no-store' },
    });
  }
  const query = await env.AUTH_DB.prepare(`
    SELECT name, forward_kind, forward_target, owner, receipt_hash, agent_id,
           created_at, renewed_at, expires_at, forwarded_count, status
    FROM aliases
    ORDER BY created_at ASC, name ASC
    LIMIT 1000
  `).all<PostOfficeAliasRow>();
  return Response.json({
    ...POST_OFFICE_DISCOVERY,
    generatedAt: now.toISOString(),
    aliases: (query.results ?? []).map((row) => publicAlias(row, now)),
  }, { headers: HEADERS });
}
