/**
 * POST /api/talk — Voice Dispatch Phase 2 stub + Phase 3 rate limit
 *
 * Accepts a multipart/form-data POST from /talk with:
 *   - file:     audio blob (audio/webm or audio/mp4)
 *   - duration: seconds
 *   - channel:  channel code (default FD)
 *   - title:    required string
 *   - dek:      optional string
 *   - location: optional string
 *
 * Phase 2 scope: validate shape, return a mock block ID.
 * Phase 3 (Sprint 18): per-IP rate limit (5 uploads per 10 min) via the
 * shared `_rate-limit.ts` helper. R2 storage + TALK block persistence
 * still deferred until `env.TALK_AUDIO` bucket is provisioned by Mike.
 *
 * GET /api/talk returns a JSON status + schema hint for agents.
 */

import { rateLimit, rateLimitResponse, applyRateLimitHeaders } from '../_rate-limit';

type Env = {
  PC_RATES_KV?: KVNamespace;
  TALK_AUDIO?: R2Bucket; // present only after bucket is provisioned + bound
};

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 5 Voice Dispatches per 10 minutes per IP. Generous for a human
  // talking; tight enough that a loop can't flood the stub endpoint.
  const rl = await rateLimit(request, env, {
    bucket: 'talk:post',
    windowSec: 600,
    maxRequests: 5,
  });
  if (!rl.allowed) return rateLimitResponse(rl, 'too many voice dispatches; slow down');

  let form: FormData;
  try {
    form = await request.formData();
  } catch (e) {
    return applyRateLimitHeaders(
      json({ ok: false, error: 'expected multipart/form-data' }, 400),
      rl,
    );
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
    return applyRateLimitHeaders(json({ ok: false, error: 'file missing' }, 400), rl);
  }
  const sizeBytes = (file as Blob).size;
  if (sizeBytes <= 0) {
    return applyRateLimitHeaders(json({ ok: false, error: 'empty file' }, 400), rl);
  }
  if (sizeBytes > 2_500_000) {
    return applyRateLimitHeaders(json({ ok: false, error: 'file too large (max ~2.5 MB)' }, 413), rl);
  }

  const duration = Number.parseInt(durationStr, 10);
  if (!Number.isFinite(duration) || duration < 10 || duration > 65) {
    return applyRateLimitHeaders(json({ ok: false, error: 'duration must be 10-60 sec' }, 400), rl);
  }

  if (!title || title.length < 2) {
    return applyRateLimitHeaders(json({ ok: false, error: 'title required (2+ chars)' }, 400), rl);
  }
  if (title.length > 80) {
    return applyRateLimitHeaders(json({ ok: false, error: 'title too long (max 80)' }, 400), rl);
  }

  const VALID_CHANNELS = new Set(['FD', 'CRT', 'SPN', 'GF', 'GDN', 'ESC', 'FCT', 'VST', 'BTL']);
  if (!VALID_CHANNELS.has(channel)) {
    return applyRateLimitHeaders(json({ ok: false, error: 'invalid channel code' }, 400), rl);
  }

  // Phase 2: generate a mock block ID. Phase 3 replaces this with a
  // real monotonic allocation + GitHub commit + R2 upload.
  const mockId = 'T-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const mimeType = (file as Blob).type || 'audio/webm';
  const format = mimeType.split(';')[0].split('/')[1] || 'webm';

  // Phase 3 scaffold — if the R2 bucket is bound, attempt to persist
  // the blob. Until Mike provisions + binds `TALK_AUDIO` in the CF
  // dashboard, env.TALK_AUDIO is undefined and this branch is skipped;
  // the response falls through to the Phase 2 stub shape as before.
  // (See docs/plans/voice-dispatch-phase-3.md for the key layout +
  // TTL + quota thinking.)
  let audioKey: string | null = null;
  let audioUrl: string | null = null;
  let phase = '2-stub';
  if (env.TALK_AUDIO) {
    try {
      // Scaffolded but intentionally NOT wired in this sprint — final
      // key layout + publishing flow is specified in the Phase 3 doc.
      // The bound-bucket branch stays behind this flag until the doc
      // questions are answered (mintage approach, agent bloom policy).
      // Flip this `false` to `true` after RFC 0001 Q7 + Q8 resolve.
      if (false as boolean) {
        audioKey = `drafts/${mockId}.${format}`;
        await env.TALK_AUDIO.put(audioKey, file as Blob, {
          httpMetadata: { contentType: mimeType },
        });
        audioUrl = `https://pointcast.xyz/audio/${mockId}.${format}`;
        phase = '3-r2-draft';
      }
    } catch (e) {
      // Fall back to stub — never fail the upload on storage error.
      audioKey = null;
      audioUrl = null;
    }
  }

  return applyRateLimitHeaders(json({
    ok: true,
    phase,
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
      ...(audioKey ? { audio: { key: audioKey, url: audioUrl, format, durationSec: duration, sizeBytes } } : {}),
      note: audioKey
        ? 'Phase 3 draft — audio persisted to R2; block promotion pending human review.'
        : 'Phase 2 stub — audio was NOT stored. Phase 3 writes to R2 once the bucket is bound.',
    },
    rfc: 'https://github.com/mhoydich/pointcast/blob/main/docs/rfc/0001-voice-dispatch.md',
    rateLimit: { remaining: rl.remaining, resetInSec: rl.retryAfter, limit: rl.limit },
  }), rl);
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
