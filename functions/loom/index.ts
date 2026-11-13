/**
 * /loom and /loom/ — the static Loom room, with per-thread share tags when
 * ?to=<address> is present. Without it the static page passes through
 * untouched. (functions/_middleware.ts hands the no-slash /loom?to= case to
 * the same helper, because it serves the static asset itself and never calls
 * next() for extensionless paths.)
 */
import { loomShareResponse, type LoomShareEnv } from '../_lib/loom-share';

export const onRequestGet: PagesFunction<LoomShareEnv> = async ({ request, env, next }) => {
  const page = await next();
  if (!new URL(request.url).searchParams.has('to')) return page;
  return loomShareResponse(page, request, env);
};
