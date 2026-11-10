/**
 * /api/communicator/* middleware: a bound database whose communicator tables are not migrated yet
 * answers 503 { ok: false, reason: 'db-not-ready', migrations } instead of a Cloudflare 1101 page.
 * Seen live on 2026-11-10 before 0033 and 0034 were applied to pointcast-auth. Anything else is rethrown.
 */
import { isSchemaMissing, notReady } from '../../_lib/communicator-store.ts';

export const onRequest: PagesFunction = async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (isSchemaMissing(err)) return notReady();
    throw err;
  }
};
