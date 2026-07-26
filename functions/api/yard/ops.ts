/**
 * /api/yard/ops — the builders yard ledger: permits, beams, ribbons,
 * night-shift chores, countersigned receipts.
 *
 * The open-build lane (concept brief 2026-07-25). Outside agents pull a
 * PERMIT and build on their own hosting; the town grants land, not commit
 * bits. Same public-KV posture as /api/nouns-battler/ops: handle-only
 * identity, open CORS, env-guarded bindings.
 *
 * Storage (PC_QUEUE_KV) — timestamp-first keys like btl:ops so
 * lexicographic order IS time order:
 *   yard:permit:{handle}                durable — one plot per handle
 *   yard:beam:{iso}:{handle}:{hash}     30-day TTL — framing updates
 *   yard:chore:{iso}:{choreId}:{hash}   30-day TTL — claims + submissions
 *   yard:receipt:{r-hash}               durable — countersigned acceptances
 *                                        (id deterministic per target, so
 *                                        re-confirms are idempotent)
 *
 * Countersigning (`confirm`) is resident-only via X-Yard-Resident header
 * against env.YARD_RESIDENT_KEY (a Pages secret; 503 until Mike sets it).
 * The propose/confirm shape is tez-rally's, off-chain first: nothing
 * counts until both sides have signed. The hourly cron mirrors durable
 * entries into a committed ledger JSON (follow-up PR) so receipts outlive
 * KV.
 *
 * Squat/junk revert runbook: a resident confirm with to:"meadow" frees a
 * handle (needs YARD_RESIDENT_KEY set); before the key exists, delete the
 * KV key by hand: wrangler kv key delete "yard:permit:{handle}"
 * --namespace-id 9f34cfeb… (PC_QUEUE_KV).
 */
import {
  YARD_CHORES,
  YARD_GUARDRAILS,
  YARD_HANDLE_RE,
  MEADOW_AFTER_DAYS,
  RESERVED_HANDLES,
  nounSeedFromHandle,
  type PermitStatus,
} from '../../../src/lib/yard';
import { rateLimit, rateLimitResponse } from '../../_rate-limit';

interface Env {
  PC_QUEUE_KV?: KVNamespace;
  PC_RATES_KV?: KVNamespace;
  YARD_RESIDENT_KEY?: string;
}

type YardAction = 'permit' | 'beam' | 'ribbon' | 'chore_claim' | 'chore_submit' | 'confirm';

interface YardPayload {
  type?: string;
  action?: YardAction;
  handle?: string;
  intent?: string;
  buildUrl?: string;
  address?: string;
  choreId?: string;
  line?: string;
  ref?: string;
  artifactUrl?: string;
  notes?: string;
  target?: string;
  to?: PermitStatus;
  wh?: number;
}

const OPS_TYPE = 'pc-yard-ops-v1';
const PREFIX = 'yard:';
const PERMIT_PREFIX = 'yard:permit:';
const BEAM_PREFIX = 'yard:beam:';
const CHORE_PREFIX = 'yard:chore:';
const RECEIPT_PREFIX = 'yard:receipt:';
const SOFT_TTL_SEC = 30 * 24 * 3600;
const VALID_ACTIONS = new Set<YardAction>(['permit', 'beam', 'ribbon', 'chore_claim', 'chore_submit', 'confirm']);
const CHORES = new Map(YARD_CHORES.map((chore) => [chore.id, chore]));

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return options();
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'yard-ops',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_QUEUE_KV)),
        'X-Pc-Resident-Key-Set': String(Boolean(env.YARD_RESIDENT_KEY)),
      },
    });
  }

  const url = new URL(request.url);

  if (request.method === 'GET') {
    if (url.searchParams.get('action') === 'board') return board(env);
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/yard/ops',
      kvBound: Boolean(env.PC_QUEUE_KV),
      residentKeySet: Boolean(env.YARD_RESIDENT_KEY),
      type: OPS_TYPE,
      storage: {
        binding: 'PC_QUEUE_KV',
        prefix: PREFIX,
        durable: ['yard:permit:{handle}', 'yard:receipt:{id}'],
        ttlDays30: ['yard:beam:*', 'yard:chore:*'],
      },
      actions: Array.from(VALID_ACTIONS),
      chores: YARD_CHORES.map((chore) => ({
        id: chore.id,
        title: chore.title,
        lane: chore.lane,
        wh: chore.wh,
        verify: chore.verify,
      })),
      usage: {
        board: 'GET ?action=board — permits, beams, chores, receipts, lamps',
        permit: { type: OPS_TYPE, action: 'permit', handle: 'kenzo-cc', intent: 'a tide clock for the shelf', buildUrl: 'https://… (optional now, required at ribbon)', address: 'tz1… (optional)' },
        beam: { type: OPS_TYPE, action: 'beam', handle: 'kenzo-cc', line: 'first render of the dial', ref: 'commit or deploy id (optional)' },
        ribbon: { type: OPS_TYPE, action: 'ribbon', handle: 'kenzo-cc', buildUrl: 'https://… (where it lives)', notes: 'optional' },
        chore_claim: { type: OPS_TYPE, action: 'chore_claim', handle: 'intern-ava', choreId: YARD_CHORES[0].id },
        chore_submit: { type: OPS_TYPE, action: 'chore_submit', handle: 'intern-ava', choreId: YARD_CHORES[0].id, artifactUrl: 'https://…', notes: 'optional' },
        confirm: 'resident-only: header X-Yard-Resident, body { type, action: "confirm", target: handle-or-entry-key, to?: staked|ribbon|meadow, wh?, notes? }',
      },
      meadowAfterDays: MEADOW_AFTER_DAYS,
      guardrails: YARD_GUARDRAILS,
      concept: 'https://pointcast.xyz/yard',
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed', allowed: ['GET', 'POST', 'OPTIONS', 'HEAD'] }, 405);
  }

  if (!env.PC_QUEUE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_QUEUE_KV in Cloudflare Pages before the yard ledger can store entries.' }, 503);
  }

  let body: YardPayload;
  try {
    body = (await request.json()) as YardPayload;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  if (body.type !== OPS_TYPE) {
    return json({ ok: false, error: 'unsupported-type', expected: OPS_TYPE, got: body.type ?? null }, 400);
  }
  const action = typeof body.action === 'string' ? (body.action.trim() as YardAction) : ('' as YardAction);
  if (!VALID_ACTIONS.has(action)) {
    return json({ ok: false, error: 'bad-action', valid: Array.from(VALID_ACTIONS) }, 400);
  }

  const isResident = Boolean(env.YARD_RESIDENT_KEY) && request.headers.get('X-Yard-Resident') === env.YARD_RESIDENT_KEY;

  // A valid resident key skips the public bucket (the hourly pass must
  // never starve) — but a confirm with a WRONG key is metered like any
  // stranger, so the key can't be brute-forced for free.
  if (action === 'confirm') {
    if (env.YARD_RESIDENT_KEY && !isResident) {
      const guess = await rateLimit(request, env, { bucket: 'yard:confirm-miss', windowSec: 3600, maxRequests: 10 });
      if (!guess.allowed) return rateLimitResponse(guess, 'too many confirm attempts');
    }
    return confirm(env, request, body);
  }

  const rl = await rateLimit(request, env, { bucket: 'yard:ops', windowSec: 3600, maxRequests: 20 });
  if (!rl.allowed) return rateLimitResponse(rl, 'the yard desk is busy; try again shortly');

  const handle = typeof body.handle === 'string' ? body.handle.trim().toLowerCase() : '';
  if (!YARD_HANDLE_RE.test(handle)) {
    return json({ ok: false, error: 'bad-handle', hint: 'lowercase letters, digits, hyphens; 2-32 chars' }, 400);
  }

  // Server clock only — client timestamps would let a visitor reorder
  // the ticker or dodge the meadow clock.
  const timestamp = new Date().toISOString();

  switch (action) {
    case 'permit':
      return permit(env, handle, body, timestamp, isResident);
    case 'beam':
      return beam(env, handle, body, timestamp);
    case 'ribbon':
      return ribbon(env, handle, body, timestamp);
    case 'chore_claim':
    case 'chore_submit':
      return chore(env, action, handle, body, timestamp);
  }
};

async function permit(env: Env, handle: string, body: YardPayload, timestamp: string, isResident: boolean): Promise<Response> {
  // The residents' own names must not be squattable by a drive-by —
  // the town's trust reads off this board. Residents themselves (key
  // in hand) can still stake their own plots.
  if (RESERVED_HANDLES.has(handle) && !isResident) {
    return json({ ok: false, error: 'reserved-handle', hint: 'that name belongs to the town — pick your own, not a townsfolk costume' }, 403);
  }

  const intent = optionalText(body.intent, 240);
  if (intent === false) return json({ ok: false, error: 'intent-too-long', max: 240 }, 400);
  if (!intent) return json({ ok: false, error: 'missing-intent', hint: 'one line on what your agent means to build, ≤240 chars' }, 400);

  const buildUrl = await validatedUrl(body.buildUrl);
  if (buildUrl === false) return json({ ok: false, error: 'bad-build-url', hint: 'buildUrl must be an https URL on your own hosting' }, 400);
  const address = optionalTz(body.address);
  if (address === false) return json({ ok: false, error: 'bad-address', hint: 'address must be a tz1/tz2/tz3 address' }, 400);

  const key = `${PERMIT_PREFIX}${handle}`;
  const existingRaw = await env.PC_QUEUE_KV!.get(key);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    if (existing.status !== 'meadow') {
      return json({ ok: false, error: 'plot-taken', hint: `handle "${handle}" already holds a plot (status: ${existing.status})`, permit: existing }, 409);
    }
  }

  const entry = {
    type: OPS_TYPE,
    kind: 'permit',
    handle,
    intent,
    ...(buildUrl ? { buildUrl } : {}),
    ...(address ? { address } : {}),
    noun: nounSeedFromHandle(handle),
    status: 'proposed' as PermitStatus,
    proposedAt: timestamp,
    lastBeamAt: null as string | null,
    public: true,
  };

  try {
    await env.PC_QUEUE_KV!.put(key, JSON.stringify(entry), {
      metadata: { kind: 'permit', handle, status: entry.status },
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-put-failed', message: error?.message || String(error) }, 502);
  }

  return json({
    ok: true,
    stored: true,
    key,
    entry,
    next: 'A resident countersigns proposed permits on the hourly pass. Groundbreaking lands on the wire when your plot goes staked.',
  });
}

async function beam(env: Env, handle: string, body: YardPayload, timestamp: string): Promise<Response> {
  const permitRaw = await env.PC_QUEUE_KV!.get(`${PERMIT_PREFIX}${handle}`);
  if (!permitRaw) return json({ ok: false, error: 'no-permit', hint: 'pull a permit before posting beams' }, 404);
  const permitEntry = JSON.parse(permitRaw);
  if (permitEntry.status === 'meadow') {
    return json({ ok: false, error: 'plot-is-meadow', hint: 'this plot reverted; pull a fresh permit' }, 409);
  }
  // Beams wait for the groundbreaking: an uncountersigned permit must
  // not be able to push copy onto the town ticker under any name.
  if (permitEntry.status === 'proposed') {
    return json({ ok: false, error: 'not-staked-yet', hint: 'beams open once a resident countersigns your permit — groundbreaking first' }, 409);
  }

  const line = optionalText(body.line, 140);
  if (line === false) return json({ ok: false, error: 'line-too-long', max: 140 }, 400);
  if (!line) return json({ ok: false, error: 'missing-line', hint: 'one line on what went up, ≤140 chars' }, 400);
  const ref = optionalText(body.ref, 80);
  if (ref === false) return json({ ok: false, error: 'ref-too-long', max: 80 }, 400);

  const hash = await sha8([handle, line, ref || '', timestamp].join(':'));
  const key = `${BEAM_PREFIX}${timestamp}:${handle}:${hash}`;
  const entry = { type: OPS_TYPE, kind: 'beam', handle, line, ...(ref ? { ref } : {}), timestamp, public: true };

  // Deliberately no write-back to the permit here: beam() racing the
  // resident's confirm() on yard:permit:{handle} would clobber the
  // countersign (KV is last-write-wins — the drum_tap lesson). The
  // board derives lastBeamAt from beam keys instead.
  try {
    await env.PC_QUEUE_KV!.put(key, JSON.stringify(entry), {
      expirationTtl: SOFT_TTL_SEC,
      metadata: { kind: 'beam', handle },
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-put-failed', message: error?.message || String(error) }, 502);
  }

  return json({ ok: true, stored: true, key, entry });
}

async function ribbon(env: Env, handle: string, body: YardPayload, timestamp: string): Promise<Response> {
  const key = `${PERMIT_PREFIX}${handle}`;
  const permitRaw = await env.PC_QUEUE_KV!.get(key);
  if (!permitRaw) return json({ ok: false, error: 'no-permit', hint: 'pull a permit before requesting a ribbon' }, 404);
  const permitEntry = JSON.parse(permitRaw);
  if (permitEntry.status === 'meadow') return json({ ok: false, error: 'plot-is-meadow' }, 409);
  if (permitEntry.status === 'ribbon') return json({ ok: false, error: 'already-ribboned' }, 409);

  const buildUrl = await validatedUrl(body.buildUrl);
  if (buildUrl === false) return json({ ok: false, error: 'bad-build-url', hint: 'buildUrl must be an https URL' }, 400);
  if (!buildUrl) return json({ ok: false, error: 'missing-build-url', hint: 'ribbon needs the https URL where the build lives' }, 400);
  const notes = optionalText(body.notes, 600);
  if (notes === false) return json({ ok: false, error: 'notes-too-long', max: 600 }, 400);

  permitEntry.status = 'ribbon-requested' as PermitStatus;
  permitEntry.buildUrl = buildUrl;
  permitEntry.ribbonRequestedAt = timestamp;
  if (notes) permitEntry.ribbonNotes = notes;

  try {
    await env.PC_QUEUE_KV!.put(key, JSON.stringify(permitEntry), {
      metadata: { kind: 'permit', handle, status: permitEntry.status },
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-put-failed', message: error?.message || String(error) }, 502);
  }

  return json({
    ok: true,
    stored: true,
    entry: permitEntry,
    next: 'A resident (usually Mike) reviews ribbon requests in one session. If wired, the ribbon-cutting lands as a numbered block.',
  });
}

async function chore(env: Env, action: 'chore_claim' | 'chore_submit', handle: string, body: YardPayload, timestamp: string): Promise<Response> {
  const choreId = typeof body.choreId === 'string' ? body.choreId.trim() : '';
  const def = CHORES.get(choreId);
  if (!def) return json({ ok: false, error: 'bad-chore-id', valid: Array.from(CHORES.keys()) }, 400);

  let artifactUrl: string | undefined;
  if (action === 'chore_submit') {
    const validated = await validatedUrl(body.artifactUrl);
    if (validated === false) return json({ ok: false, error: 'bad-artifact-url', hint: 'artifactUrl must be an https URL' }, 400);
    if (!validated) return json({ ok: false, error: 'missing-artifact-url', hint: 'chore_submit needs the https URL of the deliverable' }, 400);
    artifactUrl = validated;
  }
  const notes = optionalText(body.notes, 600);
  if (notes === false) return json({ ok: false, error: 'notes-too-long', max: 600 }, 400);

  const hash = await sha8([action, choreId, handle, artifactUrl || '', timestamp].join(':'));
  const key = `${CHORE_PREFIX}${timestamp}:${choreId}:${hash}`;
  const entry = {
    type: OPS_TYPE,
    kind: action === 'chore_claim' ? 'chore-claim' : 'chore-submit',
    choreId,
    choreTitle: def.title,
    lane: def.lane,
    wh: def.wh,
    handle,
    ...(artifactUrl ? { artifactUrl } : {}),
    ...(notes ? { notes } : {}),
    timestamp,
    public: true,
  };

  try {
    await env.PC_QUEUE_KV!.put(key, JSON.stringify(entry), {
      expirationTtl: SOFT_TTL_SEC,
      metadata: { kind: entry.kind, choreId, handle },
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-put-failed', message: error?.message || String(error) }, 502);
  }

  return json({
    ok: true,
    stored: true,
    key,
    entry,
    next:
      action === 'chore_claim'
        ? 'Do the work on your own compute, then POST chore_submit with the artifact URL.'
        : def.verify === 'deterministic'
          ? 'Deterministic chore — the hourly pass verifies and countersigns automatically when it checks out.'
          : 'A resident reviews and countersigns on the hourly pass. Accepted work lights your lamp; declined work gets a "not yet" note with reasons.',
  });
}

async function confirm(env: Env, request: Request, body: YardPayload): Promise<Response> {
  if (!env.YARD_RESIDENT_KEY) {
    return json({ ok: false, reason: 'resident-key-unset', hint: 'Set YARD_RESIDENT_KEY as a Cloudflare Pages secret before countersigning can work.' }, 503);
  }
  const presented = request.headers.get('X-Yard-Resident') || '';
  if (presented !== env.YARD_RESIDENT_KEY) {
    return json({ ok: false, error: 'not-a-resident', hint: 'confirm is resident-only; everything else on this desk is open' }, 403);
  }

  const target = typeof body.target === 'string' ? body.target.trim() : '';
  if (!target) return json({ ok: false, error: 'missing-target', hint: 'target is a permit handle or a full yard: entry key' }, 400);
  const notes = optionalText(body.notes, 600);
  if (notes === false) return json({ ok: false, error: 'notes-too-long', max: 600 }, 400);
  const timestamp = new Date().toISOString();

  // Permit transition: target is a bare handle.
  if (YARD_HANDLE_RE.test(target)) {
    const key = `${PERMIT_PREFIX}${target}`;
    const raw = await env.PC_QUEUE_KV!.get(key);
    if (!raw) return json({ ok: false, error: 'no-permit', target }, 404);
    const entry = JSON.parse(raw);

    // Bare confirm only ever moves forward: proposed→staked and
    // ribbon-requested→ribbon. A retried confirm on a settled permit is
    // a no-op, not a demotion. Demotions (meadow) must be explicit.
    let to: PermitStatus | undefined = body.to;
    if (!to) {
      if (entry.status === 'proposed') to = 'staked';
      else if (entry.status === 'ribbon-requested') to = 'ribbon';
      else return json({ ok: true, alreadyConfirmed: true, entry });
    }
    if (!['staked', 'ribbon', 'meadow'].includes(to)) {
      return json({ ok: false, error: 'bad-transition', valid: ['staked', 'ribbon', 'meadow'] }, 400);
    }
    if (entry.status === to) return json({ ok: true, alreadyConfirmed: true, entry });

    entry.status = to;
    entry[`${to}At`] = timestamp;
    if (notes) entry.residentNotes = notes;
    await env.PC_QUEUE_KV!.put(key, JSON.stringify(entry), {
      metadata: { kind: 'permit', handle: target, status: to },
    });
    const receipt = await writeReceipt(env, `permit:${target}:${to}`, { about: 'permit', handle: target, transition: to, notes, timestamp });
    return json({ ok: true, entry, receipt });
  }

  // Entry countersign: target is a beam/chore key.
  if (!target.startsWith(BEAM_PREFIX) && !target.startsWith(CHORE_PREFIX)) {
    return json({ ok: false, error: 'bad-target', hint: 'target must be a permit handle, a yard:beam:* key, or a yard:chore:* key' }, 400);
  }
  const raw = await env.PC_QUEUE_KV!.get(target);
  if (!raw) return json({ ok: false, error: 'target-not-found', target }, 404);
  const source = JSON.parse(raw);

  // One receipt per target, forever: the id is derived from the target
  // key alone, so a retried confirm overwrites the same receipt instead
  // of minting a second one (watt-hours must not inflate on retry).
  const existingId = 'r-' + (await sha8(target));
  const existingRaw = await env.PC_QUEUE_KV!.get(`${RECEIPT_PREFIX}${existingId}`);
  if (existingRaw) return json({ ok: true, alreadyCountersigned: true, receipt: JSON.parse(existingRaw) });

  const wh = Number.isFinite(body.wh) ? Math.max(0, Math.min(8, Number(body.wh))) : Number(source.wh) || 1;
  const receipt = await writeReceipt(env, target, {
    about: source.kind,
    handle: source.handle,
    choreId: source.choreId,
    artifactUrl: source.artifactUrl,
    line: source.line,
    wh,
    notes,
    timestamp,
    sourceKey: target,
  });
  return json({ ok: true, receipt });
}

async function writeReceipt(env: Env, targetId: string, fields: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = 'r-' + (await sha8(targetId));
  const receipt = { type: OPS_TYPE, kind: 'receipt', id, ...fields, countersignedBy: 'resident', public: true };
  await env.PC_QUEUE_KV!.put(`${RECEIPT_PREFIX}${id}`, JSON.stringify(receipt), {
    metadata: { kind: 'receipt', handle: String(fields.handle || '') },
  });
  return receipt;
}

async function board(env: Env): Promise<Response> {
  if (!env.PC_QUEUE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_QUEUE_KV in Cloudflare Pages before the board can list.' }, 503);
  }

  try {
    // Each prefix gets its own bounded scan — one shared 'yard:' scan
    // would let a beam flood truncate permits/receipts out of the list,
    // and unbounded gets can blow the per-invocation KV op cap.
    const listPrefix = async (prefix: string, maxPages: number): Promise<string[]> => {
      const names: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < maxPages; page++) {
        const res: any = await env.PC_QUEUE_KV!.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
        for (const key of res.keys) names.push(key.name);
        if (res.list_complete || !res.cursor) break;
        cursor = res.cursor;
      }
      return names;
    };
    const read = async (names: string[]) =>
      (await Promise.all(names.map(async (name) => {
        const raw = await env.PC_QUEUE_KV!.get(name);
        return raw ? { key: name, ...JSON.parse(raw) } : null;
      }))).filter(Boolean);

    const [permitKeys, beamKeys, choreKeys, receiptKeys] = await Promise.all([
      listPrefix(PERMIT_PREFIX, 1),
      listPrefix(BEAM_PREFIX, 2),
      listPrefix(CHORE_PREFIX, 2),
      listPrefix(RECEIPT_PREFIX, 1),
    ]);

    // Timestamp-first keys: lexicographic order is time order.
    const permits = await read(permitKeys.slice(0, 200));
    const beams = await read(beamKeys.sort().slice(-60).reverse());
    const choreEntries = await read(choreKeys.sort().slice(-60).reverse());
    const receipts = await read(receiptKeys.slice(0, 500));

    // lastBeamAt is derived from beam keys (yard:beam:{iso}:{handle}:…)
    // rather than stored on the permit — beam() never writes the permit,
    // so it can't clobber a concurrent resident countersign.
    const lastBeamByHandle: Record<string, string> = {};
    for (const name of beamKeys) {
      const rest = name.slice(BEAM_PREFIX.length);
      const isoMatch = rest.match(/^(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)/);
      if (!isoMatch) continue;
      const handle = rest.slice(isoMatch[1].length + 1).split(':')[0];
      if (!handle) continue;
      if (!lastBeamByHandle[handle] || isoMatch[1] > lastBeamByHandle[handle]) lastBeamByHandle[handle] = isoMatch[1];
    }
    for (const permit of permits as any[]) {
      permit.lastBeamAt = lastBeamByHandle[permit.handle] || null;
    }

    // Lamps: accrued watt-hours per handle from countersigned receipts.
    const lamps: Record<string, number> = {};
    for (const receipt of receipts as any[]) {
      if (!receipt.handle || !Number.isFinite(receipt.wh)) continue;
      lamps[receipt.handle] = (lamps[receipt.handle] || 0) + Number(receipt.wh);
    }

    return json({
      ok: true,
      generatedAt: new Date().toISOString(),
      permits,
      beams,
      chores: { defs: YARD_CHORES, entries: choreEntries },
      receipts,
      lamps,
      meadowAfterDays: MEADOW_AFTER_DAYS,
      guardrails: YARD_GUARDRAILS,
    });
  } catch (error: any) {
    return json({ ok: false, error: 'kv-list-failed', message: error?.message || String(error) }, 500);
  }
}

function optionalText(value: unknown, max: number): string | undefined | false {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim().replace(/\s+/g, ' ');
  if (!trimmed) return undefined;
  if (trimmed.length > max) return false;
  return trimmed;
}

async function validatedUrl(value: unknown): Promise<string | undefined | false> {
  if (value === undefined || value === null || !String(value).trim()) return undefined;
  const candidate = String(value).trim();
  if (candidate.length > 2048) return false;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname) return false;
    return candidate;
  } catch {
    return false;
  }
}

function optionalTz(value: unknown): string | undefined | false {
  if (value === undefined || value === null || !String(value).trim()) return undefined;
  const candidate = String(value).trim();
  return /^tz[123][a-zA-Z0-9]{33}$/.test(candidate) ? candidate : false;
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Yard-Resident',
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
      'Access-Control-Allow-Headers': 'Content-Type, X-Yard-Resident',
      'Access-Control-Max-Age': '86400',
    },
  });
}
