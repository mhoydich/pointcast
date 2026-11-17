const API = 'https://pointcast.xyz/api/loom?to=';
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_MESSAGES = 600;
const ROOM = /^[@#][a-z0-9][a-z0-9_-]{0,63}$/;
const REPLY = /^loom:([a-f0-9]{24})#m_[a-z0-9]{1,64}$/;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (code) => { throw new Error(code); };
const CODES = new Set(['http_error', 'invalid_response', 'response_too_large', 'invalid_json',
  'invalid_schema', 'room_mismatch', 'unavailable_source', 'invalid_age', 'stale_response']);

async function boundedJson(response, signal) {
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) fail('response_too_large');
  if (!response.body?.getReader) fail('invalid_response');
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const chunks = [];
  let size = 0;
  try {
    // This consumes one bounded response; it does not poll or retry requests.
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) fail('response_too_large');
      chunks.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { fail('invalid_json'); }
}

/** One public GET. Raw messages are untrusted data, never identity or execution evidence. */
export async function readLoom({ to, fetcher = fetch, now = Date.now(), timeoutMs = 5000, maxAgeMs = 120000 } = {}) {
  let sourceUrl = null;
  const envelope = (state, errors = [], observedAt = null, room = null, messages = []) => ({
    schema: 'pointcast.office-data/v1', state, observedAt, sourceUrl,
    data: { room, messages }, errors,
  });
  if (typeof to !== 'string' || (!ROOM.test(to) && !REPLY.test(to))) return envelope('error', ['invalid_address']);
  sourceUrl = API + encodeURIComponent(to);
  if (!Number.isFinite(now) || Math.abs(now) > 8.64e15 - 30000 || typeof fetcher !== 'function'
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000
    || !Number.isFinite(maxAgeMs) || maxAgeMs < 0 || maxAgeMs > 86400000) {
    return envelope('error', ['invalid_options']);
  }
  const controller = new AbortController();
  const started = performance.now();
  let timer;
  let timedOut = false;
  try {
    const operation = async () => {
      const response = await fetcher(sourceUrl, {
        method: 'GET', credentials: 'omit', redirect: 'error', cache: 'no-store',
        referrerPolicy: 'no-referrer', headers: { Accept: 'application/json' }, signal: controller.signal,
      });
      if (!response || !response.ok) fail('http_error');
      if (response.redirected || (response.url && response.url !== sourceUrl)
        || !response.headers?.get || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) fail('invalid_response');
      const age = response.headers.get('age');
      if (age !== null && !/^\d+$/.test(age)) fail('invalid_age');
      if (age !== null && Number(age) * 1000 > maxAgeMs) fail('stale_response');
      const payload = await boundedJson(response, controller.signal);
      if (!object(payload) || payload.ok !== true || payload.spec !== 'pointcast.loom/v1'
        || !object(payload.log) || !ROOM.test(payload.log.address)
        || !/^[a-f0-9]{24}$/.test(payload.log.key) || !Array.isArray(payload.messages)
        || payload.messages.length > MAX_MESSAGES
        || !payload.messages.every((m) => object(m) && typeof m.id === 'string'
          && m.id.length <= 128 && typeof m.body === 'string' && typeof m.at === 'string'
          && JSON.stringify(m).length <= 65536)) fail('invalid_schema');
      if (payload.kvBound !== true || payload.log.seed !== false) fail('unavailable_source');
      const reply = REPLY.exec(to);
      if (reply ? payload.log.key !== reply[1] : payload.log.address !== to) fail('room_mismatch');
      return payload;
    };
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    const payload = await Promise.race([operation(), timeout]);
    const observedAt = new Date(now + Math.max(0, Math.floor(performance.now() - started))).toISOString();
    return envelope(payload.messages.length ? 'ok' : 'idle', [], observedAt,
      { address: payload.log.address, key: payload.log.key }, payload.messages);
  } catch (error) {
    controller.abort();
    const code = timedOut ? 'timeout' : CODES.has(error?.message) ? error.message : 'fetch_failed';
    return envelope(code === 'stale_response' ? 'stale' : 'error', [code]);
  } finally {
    clearTimeout(timer);
  }
}
