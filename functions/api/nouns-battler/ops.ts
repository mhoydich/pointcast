/**
 * /api/nouns-battler/ops — public Agent Ops ledger for Season 6.
 *
 * Stores short-lived public claim/report/handoff entries in PC_QUEUE_KV.
 * Identity is handle-only for this sprint; proof URLs are optional but must
 * be public https URLs when present.
 */
import { NOUNS_BATTLER_SEASON_6_MISSION_PACKS } from '../../../src/lib/nouns-battler-agent-bench';

interface Env {
  PC_QUEUE_KV?: KVNamespace;
}

type OpsAction = 'claim' | 'report' | 'handoff';
type OpsStatus = 'claimed' | 'working' | 'blocked' | 'submitted' | 'handoff';

interface OpsPayload {
  type?: string;
  action?: OpsAction;
  missionId?: string;
  handle?: string;
  artifact?: string;
  status?: OpsStatus;
  proofUrl?: string;
  notes?: string;
  timestamp?: string;
}

const OPS_TYPE = 'nouns-battler-ops-v1';
const OPS_PREFIX = 'btl:ops:';
const OPS_TTL_SEC = 30 * 24 * 3600;
const VALID_ACTIONS = new Set<OpsAction>(['claim', 'report', 'handoff']);
const VALID_STATUSES = new Set<OpsStatus>(['claimed', 'working', 'blocked', 'submitted', 'handoff']);
const MISSIONS = new Map(NOUNS_BATTLER_SEASON_6_MISSION_PACKS.map((mission) => [mission.id, mission]));

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return options();
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'nouns-battler-ops',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_QUEUE_KV)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    if (url.searchParams.get('action') === 'list') return listOps(env, url);
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/nouns-battler/ops',
      kvBound: Boolean(env.PC_QUEUE_KV),
      type: OPS_TYPE,
      storage: {
        binding: 'PC_QUEUE_KV',
        prefix: OPS_PREFIX,
        keyShape: 'btl:ops:{isoTimestamp}:{missionId}:{hash}',
        ttlDays: 30,
      },
      actions: Array.from(VALID_ACTIONS),
      statuses: Array.from(VALID_STATUSES),
      usage: {
        list: 'GET ?action=list&limit=20',
        post: {
          type: OPS_TYPE,
          action: 'claim|report|handoff',
          missionId: NOUNS_BATTLER_SEASON_6_MISSION_PACKS[0].id,
          handle: 'operator-name',
          artifact: 'optional short artifact',
          status: 'claimed|working|blocked|submitted|handoff',
          proofUrl: 'optional https URL',
          notes: 'optional public note',
        },
      },
      guardrails: [
        'Claims and reports are public for 30 days.',
        'Use a short public handle only; no auth or verified wallet claim in this sprint.',
        'A missing proof URL is a proof gap, not a failure to hide.',
        'Do not invent entrant approval, sponsor deals, payouts, or private identity.',
      ],
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed', allowed: ['GET', 'POST', 'OPTIONS', 'HEAD'] }, 405);
  }

  if (!env.PC_QUEUE_KV) {
    return json({
      ok: false,
      reason: 'kv-unbound',
      hint: 'Bind PC_QUEUE_KV in Cloudflare Pages. The V3 page will save a local fallback draft until this is available.',
    }, 503);
  }

  let body: OpsPayload;
  try {
    body = (await request.json()) as OpsPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const validation = validatePayload(body);
  if (!validation.ok) return json(validation.body, 400);

  const timestamp = body.timestamp && validIso(body.timestamp) ? body.timestamp : new Date().toISOString();
  const mission = MISSIONS.get(validation.entry.missionId)!;
  const entry = {
    type: OPS_TYPE,
    ...validation.entry,
    missionTitle: mission.title,
    missionLane: mission.lane,
    missionOperator: mission.operator,
    timestamp,
    public: true,
  };
  const hash = await sha8([
    entry.action,
    entry.missionId,
    entry.handle,
    entry.artifact || '',
    entry.status,
    entry.proofUrl || '',
    entry.notes || '',
    timestamp,
  ].join(':'));
  const key = `${OPS_PREFIX}${timestamp}:${entry.missionId}:${hash}`;

  try {
    await env.PC_QUEUE_KV.put(key, JSON.stringify(entry), {
      expirationTtl: OPS_TTL_SEC,
      metadata: {
        type: OPS_TYPE,
        action: entry.action,
        missionId: entry.missionId,
        handle: entry.handle,
        status: entry.status,
      },
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-put-failed', message: error?.message || String(error) }, 502);
  }

  return json({ ok: true, stored: true, key, entry });
};

async function listOps(env: Env, url: URL): Promise<Response> {
  if (!env.PC_QUEUE_KV) {
    return json({
      ok: false,
      reason: 'kv-unbound',
      hint: 'Bind PC_QUEUE_KV in Cloudflare Pages before the public Agent Ops ledger can list entries.',
    }, 503);
  }

  const limitParam = Number(url.searchParams.get('limit') || '20');
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitParam) ? limitParam : 20));
  const keys: { name: string; metadata?: unknown }[] = [];
  let cursor: string | undefined;

  try {
    for (let pageCount = 0; pageCount < 5; pageCount++) {
      const page: any = await env.PC_QUEUE_KV.list({
        prefix: OPS_PREFIX,
        limit: 1000,
        ...(cursor ? { cursor } : {}),
      });
      for (const key of page.keys) keys.push({ name: key.name, metadata: key.metadata ?? null });
      if (page.list_complete || !page.cursor) break;
      cursor = page.cursor;
    }

    keys.sort((a, b) => a.name.localeCompare(b.name));
    const newest = keys.slice(-limit).reverse();
    const entries = await Promise.all(
      newest.map(async (item) => {
        const raw = await env.PC_QUEUE_KV!.get(item.name);
        return { key: item.name, entry: raw ? JSON.parse(raw) : null, metadata: item.metadata ?? null };
      }),
    );

    return json({ ok: true, count: entries.length, total: keys.length, entries });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-list-failed', message: error?.message || String(error) }, 500);
  }
}

function validatePayload(body: OpsPayload): { ok: true; entry: Required<Pick<OpsPayload, 'action' | 'missionId' | 'handle' | 'status'>> & Pick<OpsPayload, 'artifact' | 'proofUrl' | 'notes'> } | { ok: false; body: unknown } {
  if (body.type !== OPS_TYPE) {
    return { ok: false, body: { ok: false, error: 'unsupported-type', expected: OPS_TYPE, got: body.type ?? null } };
  }

  const action = typeof body.action === 'string' ? body.action.trim() as OpsAction : '';
  if (!VALID_ACTIONS.has(action as OpsAction)) {
    return { ok: false, body: { ok: false, error: 'bad-action', valid: Array.from(VALID_ACTIONS) } };
  }

  const missionId = typeof body.missionId === 'string' ? body.missionId.trim() : '';
  if (!MISSIONS.has(missionId)) {
    return { ok: false, body: { ok: false, error: 'bad-mission-id', valid: Array.from(MISSIONS.keys()) } };
  }

  const handle = typeof body.handle === 'string' ? body.handle.trim().replace(/\s+/g, ' ') : '';
  if (!handle || handle.length > 48) {
    return { ok: false, body: { ok: false, error: 'bad-handle', hint: 'handle is required and must be 1-48 characters' } };
  }

  const status = typeof body.status === 'string' ? body.status.trim() as OpsStatus : '';
  if (!VALID_STATUSES.has(status as OpsStatus)) {
    return { ok: false, body: { ok: false, error: 'bad-status', valid: Array.from(VALID_STATUSES) } };
  }

  const artifact = optionalText(body.artifact, 120);
  if (artifact === false) return { ok: false, body: { ok: false, error: 'artifact-too-long', max: 120 } };

  const notes = optionalText(body.notes, 600);
  if (notes === false) return { ok: false, body: { ok: false, error: 'notes-too-long', max: 600 } };

  let proofUrl: string | undefined;
  if (body.proofUrl !== undefined && String(body.proofUrl).trim()) {
    proofUrl = String(body.proofUrl).trim();
    if (proofUrl.length > 2048 || !validHttpsUrl(proofUrl)) {
      return { ok: false, body: { ok: false, error: 'bad-proof-url', hint: 'proofUrl must be an https URL' } };
    }
  }

  return {
    ok: true,
    entry: {
      action: action as OpsAction,
      missionId,
      handle,
      status: status as OpsStatus,
      ...(artifact ? { artifact } : {}),
      ...(proofUrl ? { proofUrl } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

function optionalText(value: unknown, max: number): string | undefined | false {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim().replace(/\s+/g, ' ');
  if (!trimmed) return undefined;
  if (trimmed.length > max) return false;
  return trimmed;
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function validIso(value: string): boolean {
  const time = Date.parse(value);
  return Number.isFinite(time) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

async function sha8(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).slice(0, 4).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

function options(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
