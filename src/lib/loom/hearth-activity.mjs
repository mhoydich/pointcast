import { hearthActivity, HEARTH_BATCH } from './hearth-day.mjs';
import { roomBrief } from './hearth-summary.mjs';
import { parseAddress } from './address.mjs';
import { handleLoom } from './service.mjs';
import { personName, personThread } from './hearth-person.mjs';
import { ledgerThread, LEDGER_ROOMS } from './hearth-ledger.mjs';

export async function serveHearthActivity(request, source, now = Date.now(), { cache, waitUntil } = {}) {
  const query = new URL(request.url).searchParams;
  const params = query.getAll('room');
  const person = query.get('person');
  const ledger = query.get('ledger');
  if (!params.length || params.length > HEARTH_BATCH) return Response.json({ ok: false }, { status: 400 });
  if (ledger !== null && (ledger !== '1' || person !== null)) return Response.json({ ok: false }, { status: 400 });
  if (person !== null && (!person.trim().replace(/^@+/, '').trim() || person.length > 120)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!source) return Response.json({ ok: false }, { status: 503 });
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
  // Use Loom's own GET and folded view, like the other server readers. The
  // Pages wrapper injects the authoritative atomic reader when D1 is bound.
  const read = typeof source === 'function' ? source : request => handleLoom(request, { kv: source });
  const rooms = await Promise.all(addresses.map(async address => {
    try {
      const url = new URL('/api/loom', request.url);
      url.searchParams.set('to', address);
      const response = await read(new Request(url));
      if (!response.ok) return { address, state: 'unavailable' };
      const data = await response.json();
      if (!data.ok || !data.kvBound || !data.exists || !Array.isArray(data.messages) || !Array.isArray(data.ops)) {
        return { address, state: 'unavailable' };
      }
      const { log, messages, ops } = data;
      const key = log.key;
      // A compact public read of the same folded log; never return raw ops.
      if (person !== null) return personThread(messages, { name: person, room: address, key, trimmed: !!log.trimmedBefore, now });
      if (ledger) return ledgerThread(messages, { room: address, key, trimmed: !!log.trimmedBefore, now });
      const trimmedSince = log.trimmedBefore ? ops[0]?.at || 'unknown' : null;
      const activity = hearthActivity(messages, { now, trimmedSince });
      // Lit rooms also say what was reported done and what is still open.
      if (activity.state === 'active') activity.brief = roomBrief(messages, { log: { address, key }, now });
      return { address, ...activity };
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
