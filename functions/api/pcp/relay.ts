import { applyRateLimitHeaders, rateLimit, rateLimitResponse } from '../../_rate-limit';

export interface Env {
  PC_PCP_RELAY_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
}

interface RelayPayload {
  type?: string;
  recipient?: string;
  topic?: string;
  expiresAt?: string;
  packet?: Record<string, any>;
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'pcp-relay',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_PCP_RELAY_KV)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const recipient = url.searchParams.get('recipient') || '';
    const topic = url.searchParams.get('topic') || '';

    if (!recipient) {
      return json({
        ok: true,
        endpoint: 'https://pointcast.xyz/api/pcp/relay',
        kvBound: Boolean(env.PC_PCP_RELAY_KV),
        status: 'prototype',
        usage: {
          post: 'POST { type: "pcp-relay-v1", recipient, topic?, expiresAt?, packet }',
          get: 'GET ?recipient=<peer-id>&topic=<topic>',
        },
        plaintextPolicy: [
          'packet.body, packet.message, packet.text, packet.content, and packet.plaintext are rejected.',
          'packet.encrypted.ciphertext is required.',
          'The relay stores opaque encrypted envelopes only.',
        ],
        spec: 'https://pointcast.xyz/protocol',
      });
    }

    if (!env.PC_PCP_RELAY_KV) {
      return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_PCP_RELAY_KV before relay pickup can work.' }, 503);
    }

    const rl = await rateLimit(request, env, {
      bucket: 'pcp-relay:get',
      windowSec: 60,
      maxRequests: 60,
      clientId: recipient,
    });
    if (!rl.allowed) return rateLimitResponse(rl);

    const recipientHash = await shortHash(recipient);
    const topicHash = topic ? await shortHash(topic) : '';
    const prefix = topicHash
      ? `pcp:relay:${recipientHash}:${topicHash}:`
      : `pcp:relay:${recipientHash}:`;

    try {
      const list = await env.PC_PCP_RELAY_KV.list({ prefix, limit: 50 });
      const packets = await Promise.all(
        list.keys.map(async (key) => {
          const raw = await env.PC_PCP_RELAY_KV!.get(key.name);
          return raw ? JSON.parse(raw) : null;
        }),
      );
      return applyRateLimitHeaders(
        json({
          ok: true,
          recipient,
          topic: topic || null,
          count: packets.filter(Boolean).length,
          packets: packets.filter(Boolean),
        }),
        rl,
      );
    } catch (err: any) {
      return json({ ok: false, error: 'kv-list-failed', message: err?.message || String(err) }, 500);
    }
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  if (!env.PC_PCP_RELAY_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_PCP_RELAY_KV before relay storage can work.' }, 503);
  }

  const rl = await rateLimit(request, env, {
    bucket: 'pcp-relay:post',
    windowSec: 60,
    maxRequests: 20,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  let body: RelayPayload;
  try {
    body = (await request.json()) as RelayPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const error = validateRelayPayload(body);
  if (error) return json({ ok: false, error }, 400);

  const recipient = body.recipient || body.packet!.to[0];
  const topic = body.topic || body.packet!.transport?.topic || 'pcp/pointcast/messages';
  const recipientHash = await shortHash(recipient);
  const topicHash = await shortHash(topic);
  const key = `pcp:relay:${recipientHash}:${topicHash}:${body.packet!.id}`;
  const ttl = expirationTtl(body.expiresAt);

  try {
    const existing = await env.PC_PCP_RELAY_KV.get(key);
    if (existing) {
      return applyRateLimitHeaders(
        json({ ok: true, duplicate: true, key, ttl, note: 'Packet already queued.' }),
        rl,
      );
    }

    await env.PC_PCP_RELAY_KV.put(
      key,
      JSON.stringify({
        id: body.packet!.id,
        recipient,
        topic,
        storedAt: new Date().toISOString(),
        expiresAt: body.expiresAt || null,
        packet: body.packet,
      }),
      {
        expirationTtl: ttl,
        metadata: {
          recipientHash,
          topicHash,
          packetId: body.packet!.id,
        },
      },
    );
  } catch (err: any) {
    return json({ ok: false, error: 'kv-put-failed', message: err?.message || String(err) }, 500);
  }

  return applyRateLimitHeaders(json({ ok: true, key, ttl, queued: body.packet!.id }), rl);
};

function validateRelayPayload(body: RelayPayload): string | null {
  if (body.type !== 'pcp-relay-v1') return 'unsupported-type';
  if (!body.packet || typeof body.packet !== 'object') return 'missing-packet';
  if (typeof body.packet.id !== 'string' || !/^pc1:[a-z2-7]{40,80}$/.test(body.packet.id)) return 'bad-packet-id';
  if (containsPlaintext(body.packet)) return 'plaintext-packet-rejected';
  if (!body.packet.encrypted || typeof body.packet.encrypted !== 'object') return 'missing-encrypted-envelope';
  if (typeof body.packet.encrypted.ciphertext !== 'string' || body.packet.encrypted.ciphertext.length < 16) return 'bad-ciphertext';
  const recipient = body.recipient || body.packet.to?.[0];
  if (typeof recipient !== 'string' || !recipient.startsWith('peer:')) return 'bad-recipient';
  if (body.topic && body.topic.length > 180) return 'topic-too-long';
  if (body.expiresAt && Number.isNaN(Date.parse(body.expiresAt))) return 'bad-expiresAt';
  return null;
}

function containsPlaintext(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsPlaintext);

  for (const [key, next] of Object.entries(value as Record<string, unknown>)) {
    const lowered = key.toLowerCase();
    if (['body', 'message', 'text', 'content', 'plaintext'].includes(lowered)) {
      if (typeof next === 'string' && next.trim().length > 0) return true;
    }
    if (containsPlaintext(next)) return true;
  }

  return false;
}

function expirationTtl(expiresAt?: string): number {
  if (!expiresAt) return 24 * 3600;
  const seconds = Math.floor((Date.parse(expiresAt) - Date.now()) / 1000);
  return Math.max(60, Math.min(seconds, 7 * 24 * 3600));
}

async function shortHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
