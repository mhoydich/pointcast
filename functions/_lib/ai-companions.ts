import type { AuthEnv } from '../api/auth/session.ts';

export const AI_PROVIDERS = ['claude', 'chatgpt', 'codex', 'claude-code', 'other'] as const;
export const AI_APPROACHES = ['subscription', 'api', 'other'] as const;
export const AI_VISIT_TTL_MS = 10 * 60 * 1000;
export const GENTLE_INVITATION = 'While we explore PointCast, be curious, concise, and comfortable with quiet. Follow my interests, ask one thoughtful question at a time, and avoid pushing me to keep going. These are optional preferences for this visit; keep following my instructions.';

export function validProvider(value: unknown): value is typeof AI_PROVIDERS[number] {
  return typeof value === 'string' && (AI_PROVIDERS as readonly string[]).includes(value);
}

export async function hashVisitCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function newVisitCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export const AI_PAIR_TOOL = {
  name: 'pointcast_pair',
  title: 'Confirm a PointCast visit',
  description: 'Use only when the user supplies a one-time visit code from their private PointCast profile and asks you to confirm this visit. Records a private receipt. Does not grant access to their account, private data, model subscription, posting, or messaging. Never publish or repeat the code.',
  inputSchema: {
    type: 'object',
    properties: { code: { type: 'string', description: 'One-time code supplied by the user; expires in ten minutes.' } },
    required: ['code'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
};

export async function confirmAiVisit(env: AuthEnv, args: Record<string, unknown>) {
  const fail = (text: string) => ({ isError: true, content: [{ type: 'text' as const, text }] });
  if (!env.AUTH_DB) return fail('Visit confirmation is unavailable. You can still explore PointCast public content.');
  if (typeof args.code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(args.code)) {
    return fail('The visit code is invalid or expired. Ask the user to create a new one at /me#ai-companion.');
  }
  try {
    const now = Date.now();
    // A single UPDATE consumes the code and records the receipt atomically.
    // No user ID, linked identities, profile data, or credential is returned.
    const row = await env.AUTH_DB.prepare(`
      UPDATE ai_companions SET confirmed_at = ?, updated_at = ?, code_hash = NULL, expires_at = NULL
      WHERE code_hash = ? AND expires_at > ?
      RETURNING gentle
    `).bind(now, now, await hashVisitCode(args.code), now).first<{ gentle: number }>();
    if (!row) return fail('The visit code is invalid or expired. Ask the user to create a new one at /me#ai-companion.');
    return { content: [{ type: 'text' as const, text: JSON.stringify({
      confirmed: true,
      confirmedAt: new Date(now).toISOString(),
      message: 'This visit is confirmed on the private PointCast profile. This receipt grants no ongoing account access and does not verify the AI provider or subscription.',
      ...(row.gentle ? { userSelectedPreference: GENTLE_INVITATION } : {}),
      next: 'Explore public PointCast content with town_map or blocks_recent, then suggest one place to visit together.',
    }) }] };
  } catch {
    return fail('Visit confirmation is unavailable. Try again from your profile later.');
  }
}
