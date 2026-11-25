import { hearthActivity, HEARTH_BATCH } from './hearth-day.mjs';
import { addressKey, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';
import { personName, personThread } from './hearth-person.mjs';
import { ledgerThread, LEDGER_ROOMS } from './hearth-ledger.mjs';

export async function serveHearthActivity(request, kv, now = Date.now(), { cache, waitUntil } = {}) {
  const query = new URL(request.url).searchParams;
  const params = query.getAll('room');
  const person = query.get('person');
  const ledger = query.get('ledger');
  if (!params.length || params.length > HEARTH_BATCH) return Response.json({ ok: false }, { status: 400 });
  if (ledger !== null && (ledger !== '1' || person !== null)) return Response.json({ ok: false }, { status: 400 });
  if (person !== null && (!person.trim().replace(/^@+/, '').trim() || person.length > 120)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!kv) return Response.json({ ok: false }, { status: 503 });
  let addresses;
  try {
    addresses = [...new Set(params.map(value => {
      const parsed = parseAddress(value);
      if (parsed.kind !== 'topic' && parsed.kind !== 'handle') throw new Error('Expected a room');
      return parsed.address;
    }))];
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (ledger && addresses.some(address => !LEDGER_ROOMS.includes(address))) return Response.json({ ok: false }, { status: 400 });
  const cachedRead = person !== null || ledger !== null;
  let cacheKey;
  if (cachedRead && cache) {
    const url = new URL('/api/loom-hearth', request.url);
    if (ledger) url.searchParams.set('ledger', '1');
    else url.searchParams.set('person', personName(person));
    // Preserve room order and isolate ledger/person reads, but discard unrelated
    // query parameters and request headers so they cannot fragment the cache.
    for (const address of addresses) url.searchParams.append('room', address);
    cacheKey = new Request(url);
    try {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    } catch { /* A cache outage must not prevent a public room read. */ }
  }
  const rooms = await Promise.all(addresses.map(async address => {
    try {
      const key = await addressKey(address);
      const log = await kv.get('loom:log:' + key, 'json');
      if (!Array.isArray(log?.ops)) return { address, state: 'unavailable' };
      const messages = fold(log.ops).messages;
      // A compact public read of the same folded log; never return raw ops.
      if (person !== null) return personThread(messages, { name: person, room: address, key, trimmed: !!log.trimmedBefore, now });
      if (ledger) return ledgerThread(messages, { room: address, key, trimmed: !!log.trimmedBefore, now });
      const trimmedSince = log.trimmedBefore ? log.ops[0]?.at || 'unknown' : null;
      return { address, ...hearthActivity(messages, { now, trimmedSince }) };
    } catch {
      return { address, state: 'unavailable' };
    }
  }));
  const partial = rooms.some(room => room.state === 'unavailable');
  const response = Response.json({ ok: true, rooms }, {
    headers: { 'Cache-Control': partial ? 'no-store'
      : cachedRead ? 'public, max-age=0, s-maxage=60' : 'public, max-age=30' },
  });
  if (cacheKey && !partial) {
    const store = cache.put(cacheKey, response.clone()).catch(() => {});
    if (waitUntil) waitUntil(store);
    else await store;
  }
  return response;
}
