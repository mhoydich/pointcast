import type { AuthIdentity } from '../../../../src/lib/auth/types.ts';
import { appendResult, safeReturnTo } from '../_oauth.ts';

export const GITHUB_STATE_PREFIX = 'oauth-state:github:';
export const GITHUB_STATE_COOKIE = '__Host-pc_github_oauth';
export const GITHUB_CALLBACK_PATH = '/api/auth/github/callback';

export interface GitHubStateRecord {
  browserToken: string;
  codeVerifier: string;
  returnTo: string;
  origin: string;
  intent: 'login' | 'link';
  currentUserId: string | null;
  sessionToken: string | null;
  createdAt: string;
}

export async function githubReady(env: Cloudflare.Env): Promise<boolean> {
  if (!env.AUTH_DB || !env.GITHUB_CLIENT_ID?.trim() || !env.GITHUB_CLIENT_SECRET?.trim()) return false;
  try {
    const tables = await env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'identities', 'sessions', 'oauth_states')")
      .first<{ count: number }>();
    await env.AUTH_DB.prepare('SELECT authenticated_at FROM sessions LIMIT 1').first();
    return tables?.count === 4;
  } catch { return false; }
}

export async function githubPkceChallenge(verifier: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  return btoa(String.fromCharCode(...hash)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function githubBrowserToken(request: Request): string {
  return (request.headers.get('cookie') ?? '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${GITHUB_STATE_COOKIE}=`))?.slice(GITHUB_STATE_COOKIE.length + 1) ?? '';
}

export function githubCookie(value: string, maxAge = 600): string {
  return `${GITHUB_STATE_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function githubRedirect(request: Request, returnTo: string, key: string, value: string): Response {
  return new Response(null, { status: 302, headers: {
    Location: new URL(appendResult(safeReturnTo(returnTo), key, value), request.url).toString(),
    'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer',
    'Set-Cookie': githubCookie('', 0),
  } });
}

export function githubIdentity(value: unknown): AuthIdentity | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.id !== 'number' || !Number.isSafeInteger(data.id) || data.id <= 0
    || data.type !== 'User' || typeof data.login !== 'string'
    || !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/u.test(data.login)) return null;
  let avatar: string | undefined;
  if (typeof data.avatar_url === 'string') {
    try {
      const url = new URL(data.avatar_url);
      if (url.protocol === 'https:' && url.hostname === 'avatars.githubusercontent.com'
        && !url.username && !url.password && !url.port) avatar = url.toString();
    } catch { /* A missing avatar does not invalidate the verified identity. */ }
  }
  return {
    provider: 'github', id: String(data.id), username: data.login,
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 100) : data.login,
    ...(avatar ? { avatar } : {}), verifiedAt: new Date().toISOString(),
  };
}

export async function githubJson(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('github-empty-response');
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 64 * 1024) { await reader.cancel(); throw new Error('github-response-too-large'); }
      text += decoder.decode(value, { stream: true });
    }
    const payload: unknown = JSON.parse(text + decoder.decode());
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('github-invalid-response');
    return payload as Record<string, unknown>;
  } finally { reader.releaseLock(); }
}
