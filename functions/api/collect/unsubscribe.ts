import {
  findSubscriberByToken,
  requireCollectDb,
  validBearerToken,
  type CollectEnv,
} from './_shared.ts';

function page(message: string, status = 200): Response {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Kennel Club email</title><body style="margin:0;background:#f6efe5;color:#171717;font:18px/1.5 Arial,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:28px;border:1px solid #171717;background:#fff"><p style="font:12px ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#8a2432">PointCast · Kennel Club</p><h1>${message}</h1><p><a href="/collect">Return to the collecting desk</a></p></main></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}

export const onRequestGet: PagesFunction<CollectEnv> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  if (!validBearerToken(token)) return page('That unsubscribe link is not valid.', 400);
  const db = requireCollectDb(env);
  if (!db) return page('Email preferences are temporarily unavailable.', 503);
  const subscriber = await findSubscriberByToken(db, token);
  if (!subscriber) return page('That unsubscribe link is not valid.', 404);
  await db.prepare("UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?")
    .bind(token)
    .run();
  return page('You are unsubscribed.');
};

