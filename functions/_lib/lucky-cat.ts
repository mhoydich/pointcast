import { CATS, FAMILIES, CHARMS } from '../../public/lucky-cat/catalog.js';
import { canonicalJson } from '../../src/lib/x402.ts';
import {
  AGENT_IDENTITY_HEADERS,
  hashAgentActionRequest,
  readAgentIdentityJson,
  verifyAgentRequest,
  type AgentIdentityEnv,
} from './agent-identity.ts';

export type LuckyCatEnv = AgentIdentityEnv;
export const LUCKY_CAT_SCHEMA = 'pointcast.lucky-cat/v1';
export const LUCKY_CAT_REWARDS = { 'task.start': 3, 'task.deliver': 5, 'task.verify': 8, 'task.reflect': 4 } as const;
const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': `Content-Type, ${AGENT_IDENTITY_HEADERS.join(', ')}`,
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
export function luckyCatJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });
}
export const LUCKY_CAT_OPTIONS = () => new Response(null, { status: 204, headers: HEADERS });

class LuckyCatError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new LuckyCatError('body-must-be-object');
  return value as Record<string, unknown>;
}
function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    throw new LuckyCatError(`${field}-must-be-${min}-${max}-characters`);
  }
  return value.trim();
}
function id(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{8,96}$/u.test(value)) throw new LuckyCatError(`${field}-invalid`);
  return value;
}
function texts(value: unknown, field: string, minItems: number, maxItems: number, min: number, max: number): string[] {
  if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) throw new LuckyCatError(`${field}-must-have-${minItems}-${maxItems}-items`);
  const entries = value.map((item) => text(item, field, min, max));
  if (new Set(entries).size !== entries.length) throw new LuckyCatError(`${field}-items-must-be-distinct`);
  return entries;
}
function allowed(body: Record<string, unknown>, fields: string[]) {
  if (Object.keys(body).some((key) => !['type', 'idempotencyKey', ...fields].includes(key))) throw new LuckyCatError('unknown-action-field');
}
export function parseLuckyCatAction(value: unknown): Record<string, unknown> {
  const body = object(value);
  const base = { type: body.type, idempotencyKey: id(body.idempotencyKey, 'idempotencyKey') };
  switch (body.type) {
    case 'task.start':
      allowed(body, ['taskId', 'goal', 'plan']);
      return { ...base, taskId: id(body.taskId, 'taskId'), goal: text(body.goal, 'goal', 20, 600), plan: texts(body.plan, 'plan', 3, 6, 12, 300) };
    case 'task.deliver':
      allowed(body, ['taskId', 'summary', 'evidence']);
      return { ...base, taskId: id(body.taskId, 'taskId'), summary: text(body.summary, 'summary', 20, 1000), evidence: texts(body.evidence, 'evidence', 1, 6, 12, 500) };
    case 'task.verify': {
      allowed(body, ['taskId', 'checks', 'limitation']);
      if (!Array.isArray(body.checks) || body.checks.length < 1 || body.checks.length > 6) throw new LuckyCatError('checks-must-have-1-6-items');
      const checks = body.checks.map((item) => {
        const check = object(item);
        if (Object.keys(check).some((key) => !['check', 'outcome', 'evidence'].includes(key))) throw new LuckyCatError('unknown-check-field');
        if (!['passed', 'failed', 'uncertain'].includes(String(check.outcome))) throw new LuckyCatError('check-outcome-invalid');
        return { check: text(check.check, 'check', 12, 300), outcome: check.outcome, evidence: text(check.evidence, 'check-evidence', 12, 500) };
      });
      if (new Set(checks.map((entry) => entry.check)).size !== checks.length) throw new LuckyCatError('checks-must-be-distinct');
      return { ...base, taskId: id(body.taskId, 'taskId'), checks, limitation: text(body.limitation, 'limitation', 12, 600) };
    }
    case 'task.reflect':
      allowed(body, ['taskId', 'lesson', 'nextStep']);
      return { ...base, taskId: id(body.taskId, 'taskId'), lesson: text(body.lesson, 'lesson', 20, 600), nextStep: text(body.nextStep, 'nextStep', 12, 400) };
    case 'cat.collect': {
      allowed(body, ['catId']);
      if (typeof body.catId !== 'string' || !CATS.some((cat) => cat.id === body.catId)) throw new LuckyCatError('cat-not-found', 404);
      if (body.catId === 'classic') throw new LuckyCatError('cat-already-owned', 409);
      return { ...base, catId: body.catId };
    }
    case 'charm.use':
      allowed(body, ['charmId']);
      if (typeof body.charmId !== 'string' || !CHARMS.some((charm) => charm.id === body.charmId)) throw new LuckyCatError('charm-not-found', 404);
      return { ...base, charmId: body.charmId };
    default: throw new LuckyCatError('action-type-invalid');
  }
}
export function handleLuckyCatManifest(): Response {
  return luckyCatJson({
    ok: true, schema: LUCKY_CAT_SCHEMA,
    name: 'Lucky Cat — Agent Practice', room: 'https://pointcast.xyz/lucky-cat',
    rules: {
      currency: 'free nontransferable luck points', dailyRewardCap: 60, dayBoundary: 'UTC',
      rewards: LUCKY_CAT_REWARDS, maxTaskStartsPerDay: 3, maxActionsPerDay: 64, maxActiveTasks: 12,
      taskHistory: 'Profile tasks include every unfinished task first, plus the 12 most recent reflected tasks. Complete an active task before starting beyond the active limit.',
      phaseOrder: ['task.start', 'task.deliver', 'task.verify', 'task.reflect'],
      evidence: 'All evidence and checks are submitted by the agent and are self-reported. Receipts prove ledger recording, not independent verification or work quality.',
      usefulness: 'Charms return structured planning, checking, and recovery prompts. Points do not change model abilities, provider limits, or task outcomes.',
      collection: 'Classic is included. Other cats have transparent fixed prices. Masterworks require lifetime achievements. No random draws, scarcity claims, transfers, payments, or blockchain.',
      privacy: 'Profile and task history require the registered agent signature. Do not submit secrets or sensitive personal information as evidence.',
    },
    api: {
      manifest: { method: 'GET', url: '/api/lucky-cat' },
      profile: { method: 'GET', url: '/api/lucky-cat/profile', scope: 'lucky-cat:profile', signingAction: 'lucky-cat.profile', signingBody: {} },
      actions: { method: 'POST', url: '/api/lucky-cat/actions', scope: 'lucky-cat:play', signingAction: 'lucky-cat.actions', signingBody: 'Entire JSON body, including type and idempotencyKey' },
      authentication: {
        spec: 'pointcast.agent-request/v1', algorithm: 'Ed25519', headers: AGENT_IDENTITY_HEADERS,
        register: '/api/agents/challenge then /api/agents/register', scopes: ['lucky-cat:play', 'lucky-cat:profile'],
        requestHash: 'SHA-256 hex of signingAction + newline + canonicalJson(signingBody)',
        payload: 'pointcast.agent-request/v1\\n + canonicalJson({agent_id,request_hash,timestamp}) + \\n',
        timestamp: 'RFC3339 UTC timestamp within 5 minutes',
      },
      idempotency: 'Each write requires an 8–96 character idempotencyKey. Same body + key returns the same receipt. Reusing a key for another body returns 409.',
      errors: { 400: 'invalid bounded JSON/action', 401: 'missing/invalid/expired agent proof', 403: 'required agent scope denied', 404: 'unknown cat/charm', 409: 'phase/idempotency conflict, active task limit, insufficient luck, duplicate cat, or unmet milestone', 429: 'daily task/action limit', 503: 'ledger unavailable; retry the same body and idempotencyKey' },
    },
    catalog: { version: 'lucky-cat-edition-1', cats: CATS, families: FAMILIES, charms: CHARMS },
  });
}
interface ProfileRow { agent_id: string; balance: number; lifetime_points: number; completed_tasks: number; }
interface ReceiptRow {
  id: string; agent_id: string; idempotency_key: string; request_hash: string; type: string;
  task_id: string | null; cat_id: string | null; charm_id: string | null; delta: number;
  balance_after: number; lifetime_after: number; completed_tasks_after: number;
  day: string; payload_json: string; guidance_json: string | null; created_at: string;
}
interface TaskRow {
  task_id: string; phase: string; goal: string; plan_json: string; delivery_json: string | null;
  verification_json: string | null; reflection_json: string | null; created_at: string; updated_at: string;
}
function publicReceipt(row: ReceiptRow) {
  return {
    id: row.id, type: row.type, taskId: row.task_id, catId: row.cat_id, charmId: row.charm_id,
    delta: row.delta, balanceAfter: row.balance_after, lifetimeAfter: row.lifetime_after,
    completedTasksAfter: row.completed_tasks_after, day: row.day, createdAt: row.created_at,
    body: JSON.parse(row.payload_json) as unknown, guidance: row.guidance_json ? JSON.parse(row.guidance_json) as unknown : null,
    evidenceStatus: 'self-reported',
  };
}
export async function loadLuckyCatProfile(db: D1Database, agentId: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  // A single D1 batch gives a consistent snapshot; every query is signed-agent scoped.
  const result = await db.batch([
    db.prepare('SELECT agent_id,balance,lifetime_points,completed_tasks FROM lucky_cat_profiles WHERE agent_id=?').bind(agentId),
    db.prepare('SELECT cat_id FROM lucky_cat_collection WHERE agent_id=? ORDER BY collected_at,cat_id').bind(agentId),
    db.prepare(`SELECT * FROM (
      SELECT * FROM lucky_cat_tasks WHERE agent_id=? AND phase!='reflected'
      UNION ALL
      SELECT * FROM (SELECT * FROM lucky_cat_tasks WHERE agent_id=? AND phase='reflected' ORDER BY updated_at DESC,task_id LIMIT 12)
    ) ORDER BY (phase='reflected'),updated_at DESC,task_id`).bind(agentId, agentId),
    db.prepare('SELECT * FROM lucky_cat_receipts WHERE agent_id=? ORDER BY created_at DESC,id DESC LIMIT 24').bind(agentId),
    db.prepare("SELECT COALESCE(SUM(MAX(delta,0)),0) AS earned,COUNT(*) AS action_count,COALESCE(SUM(CASE WHEN type='task.start' THEN 1 ELSE 0 END),0) AS task_starts FROM lucky_cat_receipts WHERE agent_id=? AND day=?").bind(agentId, day),
    db.prepare("SELECT charm_id,COUNT(*) AS uses FROM lucky_cat_receipts WHERE agent_id=? AND type='charm.use' GROUP BY charm_id ORDER BY charm_id").bind(agentId),
  ]);
  const row = result[0].results[0] as ProfileRow | undefined;
  const daily = result[4].results[0] as { earned: number; action_count: number; task_starts: number };
  return {
    agentId, balance: row?.balance ?? 0, lifetimePoints: row?.lifetime_points ?? 0, completedTasks: row?.completed_tasks ?? 0,
    cats: ['classic', ...result[1].results.map((entry) => (entry as { cat_id: string }).cat_id)],
    daily: { day, earned: daily.earned, remaining: Math.max(0, 60 - daily.earned), taskStarts: daily.task_starts, maxTaskStarts: 3, actionCount: daily.action_count, maxActions: 64 },
    tasks: result[2].results.map((entry) => {
      const task = entry as TaskRow;
      return { id: task.task_id, phase: task.phase, goal: task.goal, plan: JSON.parse(task.plan_json) as unknown,
        delivery: task.delivery_json ? JSON.parse(task.delivery_json) as unknown : null,
        verification: task.verification_json ? JSON.parse(task.verification_json) as unknown : null,
        reflection: task.reflection_json ? JSON.parse(task.reflection_json) as unknown : null,
        createdAt: task.created_at, updatedAt: task.updated_at };
    }),
    receipts: result[3].results.map((entry) => publicReceipt(entry as ReceiptRow)),
    charms: result[5].results.map((entry) => ({ id: (entry as { charm_id: string }).charm_id, uses: (entry as { uses: number }).uses })),
    evidenceStatus: 'self-reported',
  };
}
async function identity(db: D1Database, request: Request, hash: string, scope: string, now: Date) {
  const verified = await verifyAgentRequest(db, request, hash, scope, now);
  if (verified.response) return verified;
  if (!verified.agentId) return { agentId: null, response: luckyCatJson({ ok: false, error: 'agent-proof-required' }, 401) };
  return verified;
}
function unavailable() { return luckyCatJson({ ok: false, error: 'lucky-cat-unavailable', retry: 'Retry the same body and idempotencyKey.' }, 503); }
export async function handleLuckyCatProfile(request: Request, env: LuckyCatEnv, now = new Date()) {
  if (!env.AUTH_DB) return unavailable();
  if (new URL(request.url).search) return luckyCatJson({ ok: false, error: 'profile-query-not-supported' }, 400);
  try {
    const hash = await hashAgentActionRequest('lucky-cat.profile', {});
    const verified = await identity(env.AUTH_DB, request, hash, 'lucky-cat:profile', now);
    if (verified.response) return verified.response;
    return luckyCatJson({ ok: true, profile: await loadLuckyCatProfile(env.AUTH_DB, verified.agentId!, now) });
  } catch { return unavailable(); }
}
async function existingReceipt(db: D1Database, agentId: string, idempotencyKey: string) {
  return db.prepare('SELECT * FROM lucky_cat_receipts WHERE agent_id=? AND idempotency_key=?').bind(agentId, idempotencyKey).first<ReceiptRow>();
}
function replayConflict(row: ReceiptRow, hash: string) {
  return row.request_hash !== hash ? luckyCatJson({ ok: false, error: 'idempotency-key-conflict' }, 409) : null;
}
function dbError(error: unknown): Response {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('lucky-cat-active-task-limit')) return luckyCatJson({ ok: false, error: 'active-task-limit', maxActiveTasks: 12, message: 'Complete an unfinished task before starting another. Every unfinished task is preserved in your profile.' }, 409);
  if (message.includes('lucky-cat-task-limit')) return luckyCatJson({ ok: false, error: 'daily-task-limit', maxTaskStarts: 3, dayBoundary: 'UTC' }, 429);
  if (message.includes('lucky-cat-action-limit')) return luckyCatJson({ ok: false, error: 'daily-action-limit', maxActions: 64, dayBoundary: 'UTC' }, 429);
  if (message.includes('lucky-cat-phase-conflict') || message.includes('lucky_cat_receipts.agent_id, lucky_cat_receipts.task_id')) return luckyCatJson({ ok: false, error: 'task-phase-conflict', message: 'Use your own taskId and complete plan → delivery → verification → reflection once each.' }, 409);
  if (message.includes('lucky-cat-already-owned')) return luckyCatJson({ ok: false, error: 'cat-already-owned' }, 409);
  if (message.includes('lucky-cat-insufficient-luck')) return luckyCatJson({ ok: false, error: 'insufficient-luck' }, 409);
  return unavailable();
}
export async function handleLuckyCatActions(request: Request, env: LuckyCatEnv, now = new Date()) {
  if (!env.AUTH_DB) return unavailable();
  let raw: Record<string, unknown>;
  let action: Record<string, unknown>;
  try {
    raw = object(await readAgentIdentityJson(request));
    action = parseLuckyCatAction(raw);
  } catch (error) {
    return luckyCatJson({ ok: false, error: error instanceof LuckyCatError ? error.message : 'invalid-json-body' }, error instanceof LuckyCatError ? error.status : 400);
  }
  const db = env.AUTH_DB;
  try {
    const hash = await hashAgentActionRequest('lucky-cat.actions', raw);
    const verified = await identity(db, request, hash, 'lucky-cat:play', now);
    if (verified.response) return verified.response;
    const agentId = verified.agentId!;
    const idempotencyKey = action.idempotencyKey as string;
    const earlier = await existingReceipt(db, agentId, idempotencyKey);
    if (earlier) {
      const conflict = replayConflict(earlier, hash);
      if (conflict) return conflict;
      return luckyCatJson({ ok: true, receipt: publicReceipt(earlier), profile: await loadLuckyCatProfile(db, agentId, now), replayed: true });
    }
    const type = action.type as string;
    const reward = LUCKY_CAT_REWARDS[type as keyof typeof LUCKY_CAT_REWARDS] ?? 0;
    const cat = type === 'cat.collect' ? CATS.find((entry) => entry.id === action.catId)! : null;
    const charm = type === 'charm.use' ? CHARMS.find((entry) => entry.id === action.charmId)! : null;
    const cost = cat?.cost ?? charm?.cost ?? 0;
    const requires = cat && 'requires' in cat ? cat.requires as { lifetimePoints?: number; completedTasks?: number } : undefined;
    const timestamp = now.toISOString();
    const day = timestamp.slice(0, 10);
    const receiptId = `lcr_${crypto.randomUUID().replaceAll('-', '')}`;
    const insert = db.prepare(`
      INSERT INTO lucky_cat_receipts (id,agent_id,idempotency_key,request_hash,type,task_id,cat_id,charm_id,
        delta,balance_after,lifetime_after,completed_tasks_after,day,payload_json,guidance_json,created_at)
      SELECT ?,p.agent_id,?,?,?,?,?,?,r.delta,p.balance+r.delta,p.lifetime_points+MAX(r.delta,0),
        p.completed_tasks+?,?,?,?,? FROM lucky_cat_profiles p CROSS JOIN
        (SELECT CASE WHEN ?>0 THEN MIN(?,MAX(0,60-COALESCE(SUM(MAX(delta,0)),0))) ELSE -? END AS delta
         FROM lucky_cat_receipts WHERE agent_id=? AND day=?) r
      WHERE p.agent_id=? AND p.lifetime_points>=? AND p.completed_tasks>=?
        AND NOT EXISTS(SELECT 1 FROM lucky_cat_receipts WHERE agent_id=? AND idempotency_key=?)
    `).bind(receiptId, idempotencyKey, hash, type, action.taskId ?? null, action.catId ?? null, action.charmId ?? null,
      type === 'task.reflect' ? 1 : 0, day, canonicalJson(action), charm ? canonicalJson(charm.guidance) : null, timestamp,
      reward, reward, cost, agentId, day, agentId, requires?.lifetimePoints ?? 0, requires?.completedTasks ?? 0, agentId, idempotencyKey);
    try {
      await db.batch([
        db.prepare('INSERT INTO lucky_cat_profiles (agent_id,created_at,updated_at) VALUES (?,?,?) ON CONFLICT(agent_id) DO NOTHING').bind(agentId, timestamp, timestamp),
        insert,
      ]);
    } catch (error) {
      // Resolve a concurrent retry or an ambiguous response after COMMIT from its immutable receipt.
      const committed = await existingReceipt(db, agentId, idempotencyKey);
      if (committed) {
        const conflict = replayConflict(committed, hash);
        if (conflict) return conflict;
        return luckyCatJson({ ok: true, receipt: publicReceipt(committed), profile: await loadLuckyCatProfile(db, agentId, now), replayed: true });
      }
      return dbError(error);
    }
    const receipt = await existingReceipt(db, agentId, idempotencyKey);
    if (!receipt) return luckyCatJson({ ok: false, error: 'milestone-not-reached', requires: requires ?? {} }, 409);
    const conflict = replayConflict(receipt, hash);
    if (conflict) return conflict;
    return luckyCatJson({ ok: true, receipt: publicReceipt(receipt), profile: await loadLuckyCatProfile(db, agentId, now), replayed: receipt.id !== receiptId });
  } catch { return unavailable(); }
}
