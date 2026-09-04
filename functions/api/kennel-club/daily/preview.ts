import { collectSitting, dailyEmail } from '../../../../src/lib/collect-desk.ts';
import { authJson, readSessionFromRequest } from '../../auth/session.ts';
import type { CollectEnv } from '../../collect/_shared.ts';

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const current = await readSessionFromRequest(request, env);
  if (!current?.user.roles?.includes('broadcaster')) {
    return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
  }
  const content = dailyEmail(
    collectSitting(),
    'preview-login-token-not-valid',
    'preview-unsubscribe-token-not-valid',
  );
  return new Response(content.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-PointCast-Preview': 'kennel-daily',
    },
  });
};
