/**
 * POST /api/talk — Voice Dispatch Phase 2 stub
 *
 * Accepts a multipart/form-data POST from /talk with:
 *   - file:     audio blob (audio/webm or audio/mp4)
 *   - duration: seconds
 *   - channel:  channel code (default FD)
 *   - title:    required string
 *   - dek:      optional string
 *   - location: optional string
 *
 * Phase 2 scope: validate shape, return a mock block ID. No storage,
 * no persistence, no rate limit. Phase 3 wires the Cloudflare R2
 * bucket (`pointcast-audio`), per-IP rate limits, and TALK block
 * persistence via GitHub commit or KV-backed draft per RFC 0001.
 *
 * GET /api/talk returns a JSON status + schema hint for agents.
 */

type Env = Record<string, unknown>;

export const onRequestGet: PagesFunction<Env> = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/api/talk#schema',
    endpoint: 'https://pointcast.xyz/api/talk',
    method: 'POST',
    status: 'phase-2-stub',
    description:
      'Voice Dispatch capture endpoint. Phase 2 validates shape and returns a mock block ID. Phase 3 adds R2 storage + rate-limit + TALK block persistence.',
    contentType: 'multipart/form-data',
    fields: {
      file: { type: 'Blob', required: true, description: 'audio/webm or audio/mp4, 10-60s' },
      duration: { type: 'integer', required: true, description: 'seconds, 10-60' },
      channel: { type: 'string', required: false, default: 'FD', description: 'PointCast channel code' },
      title: { type: 'string', required: true, description: 'short title, max 80 chars' },
      dek: { type: 'string', required: false, description: 'one-line description, max 160 chars' },
      location: { type: 'string', required: false, default: 'El Segundo, CA' },
    },
    response: {
      phase2: '{ ok: true, block: { id, mockDurationSec, mockSizeBytes, mockFormat }, phase: "2-stub" }',
      phase3Plan: '{ ok: true, block: { id, audio: { url, duration, format, sizeBytes } }, phase: "3-r2" }',
    },
    rfc: 'https://github.com/mhoydich/pointcast/blob/main/docs/rfc/0001-voice-dispatch.md',
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ ok: false, error: 'expected multipart/form-data' }, 400);
  }

  const file = form.get('file');
  const durationStr = String(form.get('duration') ?? '');
  const channel = String(form.get('channel') ?? 'FD').toUpperCase();
  const title = String(form.get('title') ?? '').trim();
  const dek = String(form.get('dek') ?? '').trim();
  const location = String(form.get('location') ?? 'El Segundo, CA').trim();

  // Basic validation. Phase 3 adds server-side duration re-check via
  // ffprobe / media inspection.
  if (!(file instanceof File) && !(file instanceof Blob)) {
    return json({ ok: false, error: 'file missing' }, 400);
  }
  const sizeBytes = (file as Blob).size;
  if (sizeBytes <= 0) {
    return json({ ok: false, error: 'empty file' }, 400);
  }
  if (sizeBytes > 2_500_000) {
    return json({ ok: false, error: 'file too large (max ~2.5 MB)' }, 413);
  }

  const duration = Number.parseInt(durationStr, 10);
  if (!Number.isFinite(duration) || duration < 10 || duration > 65) {
    return json({ ok: false, error: 'duration must be 10-60 sec' }, 400);
  }

  if (!title || title.length < 2) {
    return json({ ok: false, error: 'title required (2+ chars)' }, 400);
  }
  if (title.length > 80) {
    return json({ ok: false, error: 'title too long (max 80)' }, 400);
  }

  const VALID_CHANNELS = new Set(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL']);
  if (!VALID_CHANNELS.has(channel)) {
    return json({ ok: false, error: 'invalid channel code' }, 400);
  }

  // Phase 2: generate a mock block ID. Phase 3 replaces this with a
  // real monotonic allocation + GitHub commit + R2 upload.
  const mockId = 'T-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const mimeType = (file as Blob).type || 'audio/webm';
  const format = mimeType.split(';')[0].split('/')[1] || 'webm';

  return json({
    ok: true,
    phase: '2-stub',
    block: {
      id: mockId,
      type: 'TALK',
      channel,
      title,
      dek: dek || undefined,
      location,
      mockDurationSec: duration,
      mockSizeBytes: sizeBytes,
      mockFormat: format,
      note: 'Phase 2 stub — audio was NOT stored. Phase 3 writes to R2 and returns a real /audio/{id}.{ext} URL.',
    },
    rfc: 'https://github.com/mhoydich/pointcast/blob/main/docs/rfc/0001-voice-dispatch.md',
  });
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
