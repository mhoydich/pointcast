import { disconnected, summarizeLegacyLog } from './model.mjs';

/** Reads only the existing log. No credentials, cookies, IPs, presence IDs,
 * geographic fields, notes, counters or raw user agents leave this adapter.
 * It does not change the existing collector or its retention policy.
 */
export async function readLegacySnapshot(env, { now = Date.now(), timeoutMs = 2000 } = {}) {
  if (!env?.VISITS || typeof env.VISITS.get !== 'function') return disconnected();
  let timer;
  try {
    const raw = await Promise.race([
      env.VISITS.get('log'),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('source timeout')), timeoutMs); }),
    ]);
    if (raw !== null && (typeof raw !== 'string' || raw.length > 65_536)) throw new Error('invalid source');
    if (raw === null) return disconnected();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('invalid source');
    return summarizeLegacyLog(parsed, { now });
  } catch {
    return disconnected('pointcast', 'unavailable');
  } finally {
    clearTimeout(timer);
  }
}
