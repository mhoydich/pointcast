/**
 * Session Validation Endpoint
 * @file functions/api/auth/me.ts
 *
 * GET /api/auth/me — Returns the current user's profile if authenticated.
 * DELETE /api/auth/me — Logs out the current user.
 *
 * Required Cloudflare Pages env vars:
 *   AUTH_KV — KV namespace binding
 */

import type { EventContext } from '@cloudflare/workers-types';
import {
  parseSessionCookie,
  getSession,
  getUser,
  clearSessionCookie,
  deleteUser,
} from '../../../src/lib/auth/session';

export interface Env {
  AUTH_KV: KVNamespace;
}

// ---------------------------------------------------------------------------
// GET /api/auth/me — Validate session and return user profile
// ---------------------------------------------------------------------------
export const onRequestGet = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie');
  const sessionId = parseSessionCookie(cookieHeader);

  if (!sessionId) {
    return jsonResponse({ authenticated: false }, 401);
  }

  const session = await getSession(env.AUTH_KV, sessionId);
  if (!session) {
    return jsonResponse({ authenticated: false }, 401);
  }

  const user = await getUser(env.AUTH_KV, session.userId);
  if (!user) {
    return jsonResponse({ authenticated: false }, 401);
  }

  return jsonResponse({
    authenticated: true,
    user: {
      id: user.id,
      preferences: user.preferences,
      identities: user.identities.map(i => ({
        provider: i.provider,
        // Return only the provider name, not the raw providerId, for privacy
      })),
    },
  });
};

// ---------------------------------------------------------------------------
// DELETE /api/auth/me — Log out (revoke session)
// ---------------------------------------------------------------------------
export const onRequestDelete = async (context: EventContext<Env, any, any>) => {
  const { request, env } = context;

  const cookieHeader = request.headers.get('Cookie');
  const sessionId = parseSessionCookie(cookieHeader);

  if (sessionId) {
    await env.AUTH_KV.delete(`session:${sessionId}`);
  }

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': clearSessionCookie(),
  });

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};

// ---------------------------------------------------------------------------
// DELETE /api/auth/me/account — Full GDPR account deletion
// ---------------------------------------------------------------------------
// TODO: Add a separate route or query param to distinguish logout vs. full delete
// For full delete, call deleteUser(env.AUTH_KV, userId) from session.ts

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function jsonResponse(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
