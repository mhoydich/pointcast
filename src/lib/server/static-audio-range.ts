import manifest from '../../../public/audio/starjam/manifest.json';
import chimeChecks from '../../../public/chime/chime-checks.json';

// Pages currently serves full 200s for Range requests. Keep this fallback
// limited to STARJAM's finite AAC assets and Chime's one demonstration WAV.
// https://developers.cloudflare.com/pages/configuration/serving-pages/#behavior
const STARJAM_AUDIO = /^\/audio\/starjam\/(?:welcome|level-clear|hit-[0-2]|(?:garden|rush|shell|storm)-(?:drift|gentle|playful))\.m4a$/;
const MAX_BYTES = 512 * 1024;
const ASSET_BYTES = new Map(manifest.tracks.map(track => [`/audio/starjam/${track.file}`, track.bytes]));
const CHIME_AUDIO = '/chime/chime-demo.wav';
// The shipped WAV is 526,252 bytes: just above STARJAM's unchanged ceiling.
const CHIME_MAX_BYTES = 600 * 1024;

export async function withStaticAudioRange(request: Request, response: Response): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const isChime = pathname === CHIME_AUDIO;
  const contentType = isChime ? /^audio\/wav(?:;|$)/i : /^audio\/mp4(?:;|$)/i;
  if ((!isChime && !STARJAM_AUDIO.test(pathname))
      || !['GET', 'HEAD'].includes(request.method) || response.status !== 200
      || !contentType.test(response.headers.get('content-type') || '')) return response;
  const encoding = response.headers.get('content-encoding');
  const lengthHeader = response.headers.get('content-length');
  // Pages can add Content-Length only after the Function returns. The shipped
  // manifest/check report supplies the verified size when next() omits it.
  const size = lengthHeader === null ? (isChime ? chimeChecks.audio.bytes : ASSET_BYTES.get(pathname)) : Number(lengthHeader);
  const maxBytes = isChime ? CHIME_MAX_BYTES : MAX_BYTES;
  if ((encoding && encoding !== 'identity') || (lengthHeader !== null && !/^\d+$/.test(lengthHeader))
      || size === undefined
      || !Number.isSafeInteger(size) || size < 1 || size > maxBytes) return response;

  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Length', String(size));
  const full = () => new Response(response.body, { status: 200, headers });
  const range = request.headers.get('range');
  if (request.method === 'HEAD' || !range) return full();
  const ifRange = request.headers.get('if-range');
  if (ifRange) {
    // Weak validators cannot establish that a partial representation matches.
    const etag = response.headers.get('etag');
    // Pages supplies a strong ETag. Dates alone do not establish that the
    // resource's Last-Modified value is a strong validator, so send it whole.
    const matches = ifRange.startsWith('"') && ifRange === etag;
    if (!matches) return full();
  }
  // A server may ignore unsupported range units and multipart requests.
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (!match[1] && !match[2])) return full();
  const first = match[1] ? Number(match[1]) : undefined;
  const last = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first))
      || (last !== undefined && !Number.isSafeInteger(last))) return full();
  const start = first === undefined ? Math.max(0, size - last!) : first;
  const end = first === undefined || last === undefined ? size - 1 : Math.min(last, size - 1);
  if (start >= size || end < start || (first === undefined && last === 0)) {
    await response.body?.cancel();
    headers.set('Content-Range', `bytes */${size}`);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, headers });
  }

  // Bound actual consumption too, even if a future asset has a bad length.
  const reader = response.body?.getReader();
  if (!reader) return full();
  const bytes = new Uint8Array(size);
  let offset = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (offset + value.byteLength > size) {
        await reader.cancel();
        return new Response('Audio temporarily unavailable', { status: 502 });
      }
      bytes.set(value, offset);
      offset += value.byteLength;
    }
  } catch {
    try { await reader.cancel(); } catch { /* The stream may already be errored. */ }
    return new Response('Audio temporarily unavailable', { status: 502 });
  } finally {
    reader.releaseLock();
  }
  if (offset !== size) return new Response('Audio temporarily unavailable', { status: 502 });
  const part = bytes.slice(start, end + 1);
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(part.byteLength));
  return new Response(part, { status: 206, statusText: 'Partial Content', headers });
}
