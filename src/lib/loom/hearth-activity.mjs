import { hearthActivity, HEARTH_BATCH } from './hearth-day.mjs';
import { addressKey, parseAddress } from './address.mjs';
import { fold } from './fold.mjs';
import { personThread } from './hearth-person.mjs';

export async function serveHearthActivity(request, kv, now = Date.now()) {
  const query = new URL(request.url).searchParams;
  const params = query.getAll('room');
  const person = query.get('person');
  if (!params.length || params.length > HEARTH_BATCH) return Response.json({ ok: false }, { status: 400 });
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
  const rooms = await Promise.all(addresses.map(async address => {
    try {
      const key = await addressKey(address);
      const log = await kv.get('loom:log:' + key, 'json');
      if (!Array.isArray(log?.ops)) return { address, state: 'unavailable' };
      const messages = fold(log.ops).messages;
      // A compact public read of the same folded log; never return raw ops.
      if (person !== null) return personThread(messages, { name: person, room: address, key, trimmed: !!log.trimmedBefore, now });
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
