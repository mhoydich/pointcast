/**
 * /api/loom — the Loom, PointCast's federated public message system.
 * Logic lives in src/lib/loom/service.mjs (tested in tests/loom.test.mjs);
 * this wrapper supplies storage, rate limits and optional agent signatures.
 *
 * Storage: env.PC_LOOM_KV when bound, otherwise the shared VISITS namespace
 * under the `loom:` prefix. Moderation: set the LOOM_ADMIN_KEY Pages secret and
 * send it as X-Loom-Admin with {action:"hide"}.
 */
import { handleLoom } from '../../src/lib/loom/service.mjs';
import {authorizeHandle,reserveDestinations,primary} from '../../src/lib/loom/handles.mjs';
import {handleJson,handlePrincipal,boundedHandleJson} from '../_lib/loom-handle-auth.ts';
import { rateLimit } from '../_rate-limit.ts';

type Env = {
  PC_LOOM_KV?: KVNamespace;
  VISITS?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  AUTH_DB?: D1Database;
  USERS?: KVNamespace;
  LOOM_HANDLES_ENABLED?: string;
  LOOM_ADMIN_KEY?: string;
  DRUM_COUNTER?: DurableObjectNamespace;
};

/**
 * The drum's all-time count for the "drum" magic word (OFF-49), read the same way /api/drum's GET
 * reads it (functions/api/drum.ts): the DrumCounter Durable Object first, then the legacy
 * VISITS `drum:total` key. Read-only; null when neither answers.
 */
async function drumCount(env: Env): Promise<number | null> {
  if (env.DRUM_COUNTER) {
    try {
      const res = await env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global')).fetch('https://drum-counter.internal/', { method: 'GET' });
      if (res.ok) {
        const data = (await res.json()) as { globalTotal?: unknown };
        if (typeof data.globalTotal === 'number' && Number.isFinite(data.globalTotal)) return data.globalTotal;
      }
    } catch { /* fall through to KV */ }
  }
  if (env.VISITS) {
    const raw = await env.VISITS.get('drum:total');
    if (raw !== null && Number.isFinite(Number(raw))) return Number(raw);
  }
  return null;
}

const LIMITS: Record<string, { windowSec: number; maxRequests: number }> = {
  'loom:append': { windowSec: 600, maxRequests: 12 },
  'loom:append:verified': { windowSec: 600, maxRequests: 60 },
  // Per-IP ceiling (2x one sender's budget) behind the per-sender budget, so rotating names cannot flood.
  'loom:append:ip': { windowSec: 600, maxRequests: 24 },
  // Board-wide ceiling on automatic first-hello replies (OFF-36), so a wave of new names cannot flood.
  'loom:welcome': { windowSec: 600, maxRequests: 12 },
  'loom:plus': { windowSec: 600, maxRequests: 60 },
  // For you seen mark (OFF-45): "new since you last looked", moved forward only.
  'loom:seen': { windowSec: 600, maxRequests: 30 },
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  let verifiedAgent: string | null = null;
  let auth: any = {principal:null};
  let authorizeFrom: any = null;
  let reserveAddresses: any = null;
  if(request.method === 'POST') {
    const parsed=await boundedHandleJson(request,16384);if(parsed.response)return parsed.response;
    const payload=parsed.payload;
    try {
      // Reject partial proof even when the handle feature is disabled; never downgrade it.
      if(['append','edit','withdraw'].includes(String(payload.action??'append')) || ['PointCast-Agent-Id','PointCast-Agent-Timestamp','PointCast-Agent-Signature'].some(h=>request.headers.has(h))) {
        auth=await handlePrincipal(request,env,payload,'loom.append','loom:append');
        if(auth.response)return auth.response;
        verifiedAgent=auth.agentId??null;
      }
      if(['append','edit','withdraw'].includes(String(payload.action??'append'))) {
        if(!env.AUTH_DB)return handleJson({ok:false,error:'claim_store_unavailable'},503);
        const db=primary(env.AUTH_DB);
        reserveAddresses=(addresses:string[])=>reserveDestinations(db,addresses);
        authorizeFrom=async (from:any,address:any) => {
          try {return await authorizeHandle(db,from,address,auth.principal,auth.fingerprint);}
          catch {return {error:'claim_store_unavailable',status:503};}
        };
      }
    }catch {return handleJson({ok:false,error:'proof_store_unavailable'},503);}
  }
  return handleLoom(request, {
    kv: env.PC_LOOM_KV ?? env.VISITS ?? null,
    verifiedAgent,
    authorizeFrom,
    reserveAddresses,
    authorizeMutation: authorizeFrom,
    adminKey: env.LOOM_ADMIN_KEY ?? '',
    drumCount: () => drumCount(env),
    // Full result ({ allowed, retryAfter }) so refusals can say when to retry; clientId keys the per-sender budget.
    limit: async (bucket: string, clientId?: string) => rateLimit(request, env, { bucket, clientId, ...(LIMITS[bucket] ?? { windowSec: 600, maxRequests: 30 }) }),
  });
};
