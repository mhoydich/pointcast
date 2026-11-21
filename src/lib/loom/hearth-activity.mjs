import { hearthActivity, HEARTH_BATCH } from './hearth-day.mjs';
import { addressKey, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';

export async function serveHearthActivity(request, kv, now = Date.now()) {
  const params = new URL(request.url).searchParams.getAll('room');
  if (!params.length || params.length > HEARTH_BATCH) return Response.json({ ok: false }, { status: 400 });
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
  const rooms = await Promise.all(addresses.map(async address => {
    try {
      const log = await kv.get('loom:log:' + await addressKey(address), 'json');
      if (!Array.isArray(log?.ops)) return { address, state: 'unavailable' };
      const messages = fold(log.ops).messages;
      const trimmedSince = log.trimmedBefore ? log.ops[0]?.at || 'unknown' : null;
      return { address, ...hearthActivity(messages, { now, trimmedSince }) };
    } catch {
      return { address, state: 'unavailable' };
    }
  }));
  const partial = rooms.some(room => room.state === 'unavailable');
  return Response.json({ ok: true, rooms }, {
    headers: { 'Cache-Control': partial ? 'no-store' : 'public, max-age=30' },
  });
}
