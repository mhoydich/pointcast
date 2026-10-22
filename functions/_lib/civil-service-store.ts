/**
 * El Segundo Civil Service desk — sign-ups, receipts, and the public roster.
 *
 * Same public-KV posture as the builders yard (/api/yard/ops): handle-only
 * identity, server clock only, timestamp-first keys so list order is time
 * order. No email, account, or contact detail is accepted or stored, and
 * email-looking text inside a receipt is redacted before it is written.
 *
 * Storage (PC_QUEUE_KV):
 *   escs:holder:{post}:{handle}                 durable — one seat per handle per post
 *                                                (roster facts ride in KV metadata so the
 *                                                board needs no per-key reads)
 *   escs:receipt:{iso}:{post}:{handle}:{hash}   durable — the public credential
 *   escs:sworn:{handle}                          durable — first-receipt marker (Sworn In)
 */
import {
  CIVIL_SERVICE_POSTS,
  ESCS_HANDLE_RE,
  ESCS_RESERVED_HANDLES,
  OFFER_CLOCK_DAYS,
  POST_BY_CODE,
  RECEIPT_SUMMARY_MAX,
  SWORN_IN_STAMP_ID,
  kindFitsPost,
  type ApplicantKind,
  type CivilServicePost,
} from '../../src/data/civil-service.ts';

export const OPS_TYPE = 'pc-civil-service-v1';
export const HOLDER_PREFIX = 'escs:holder:';
export const RECEIPT_PREFIX = 'escs:receipt:';
export const SWORN_PREFIX = 'escs:sworn:';
const DAY_MS = 86_400_000;
const KINDS = new Set<ApplicantKind>(['neighbor', 'agent', 'pair']);
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** The slice of KVNamespace this desk uses; a Map-backed fake satisfies it in tests. */
export interface DeskKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { metadata?: Record<string, unknown>; expirationTtl?: number }): Promise<void>;
  list(options: { prefix: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface DeskResult {
  status: number;
  body: Record<string, unknown>;
}

export interface HolderMeta {
  kind: ApplicantKind;
  signedAt: string;
  offerBy: string;
}

const ok = (body: Record<string, unknown>): DeskResult => ({ status: 200, body: { ok: true, ...body } });
const fail = (status: number, error: string, extra: Record<string, unknown> = {}): DeskResult => ({
  status,
  body: { ok: false, error, ...extra },
});

export function normalizeHandle(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function checkHandle(handle: string, isResident = false): DeskResult | null {
  if (!ESCS_HANDLE_RE.test(handle)) {
    return fail(400, 'bad-handle', { hint: 'lowercase letters, digits, hyphens; 2-32 chars' });
  }
  if (ESCS_RESERVED_HANDLES.has(handle) && !isResident) {
    return fail(403, 'reserved-handle', { hint: 'that name belongs to the town; pick your own' });
  }
  return null;
}

export function redactEmails(text: string): string {
  return text.replace(EMAIL_RE, '[email removed]');
}

function cleanText(value: unknown, max: number): string | undefined | false {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim().replace(/\s+/g, ' ');
  if (!trimmed) return undefined;
  if (trimmed.length > max) return false;
  return trimmed;
}

function cleanUrl(value: unknown): string | undefined | false {
  if (value === undefined || value === null || !String(value).trim()) return undefined;
  const candidate = String(value).trim();
  if (candidate.length > 2048) return false;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || !url.hostname) return false;
    if (url.username || url.password) return false;
    return url.toString();
  } catch {
    return false;
  }
}

async function sha8(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .slice(0, 4)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function listAll(kv: DeskKV, prefix: string, maxPages: number) {
  const keys: Array<{ name: string; metadata?: unknown }> = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const res = await kv.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    keys.push(...res.keys);
    if (res.list_complete || !res.cursor) break;
    cursor = res.cursor;
  }
  return keys;
}

/** escs:holder:{post}:{handle} */
function parseHolderKey(name: string): { post: string; handle: string } | null {
  const rest = name.slice(HOLDER_PREFIX.length);
  const match = rest.match(/^(ESC-\d{3}):([a-z0-9-]+)$/);
  return match ? { post: match[1], handle: match[2] } : null;
}

/** escs:receipt:{iso}:{post}:{handle}:{hash} */
function parseReceiptKey(name: string): { at: string; post: string; handle: string } | null {
  const rest = name.slice(RECEIPT_PREFIX.length);
  const match = rest.match(/^(\d{4}-\d{2}-\d{2}T[0-9:.]+Z):(ESC-\d{3}):([a-z0-9-]+):[0-9a-f]{8}$/);
  return match ? { at: match[1], post: match[2], handle: match[3] } : null;
}

/** Holder counts per post, from key names alone. */
async function holderCounts(kv: DeskKV): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const key of await listAll(kv, HOLDER_PREFIX, 2)) {
    const parsed = parseHolderKey(key.name);
    if (parsed) counts.set(parsed.post, (counts.get(parsed.post) || 0) + 1);
  }
  return counts;
}

/**
 * "Match me": the eligible post with the fewest holders, ties broken by
 * notice order, so new sign-ups spread across the board.
 */
export async function matchPost(kv: DeskKV, kind: ApplicantKind): Promise<CivilServicePost> {
  const counts = await holderCounts(kv);
  const eligible = CIVIL_SERVICE_POSTS.filter((post) => kindFitsPost(kind, post));
  return eligible.reduce((best, post) => ((counts.get(post.code) || 0) < (counts.get(best.code) || 0) ? post : best), eligible[0]);
}

export interface SignUpInput {
  handle?: unknown;
  post?: unknown;
  kind?: unknown;
  via?: unknown;
}

export async function signUp(kv: DeskKV, input: SignUpInput, now = new Date(), isResident = false): Promise<DeskResult> {
  const handle = normalizeHandle(input.handle);
  const handleError = checkHandle(handle, isResident);
  if (handleError) return handleError;

  const kind = (typeof input.kind === 'string' ? input.kind.trim().toLowerCase() : 'neighbor') as ApplicantKind;
  if (!KINDS.has(kind)) return fail(400, 'bad-kind', { valid: Array.from(KINDS) });

  const requested = typeof input.post === 'string' ? input.post.trim().toUpperCase() : '';
  let post: CivilServicePost | undefined;
  let matched = false;
  if (!requested || requested === 'MATCH' || requested === 'ANY') {
    post = await matchPost(kv, kind);
    matched = true;
  } else {
    post = POST_BY_CODE.get(requested);
    if (!post) return fail(400, 'bad-post', { valid: [...POST_BY_CODE.keys(), 'match'] });
    if (!kindFitsPost(kind, post)) {
      return fail(409, 'post-not-open-to-kind', {
        hint: `${post.code} ${post.title} is a ${post.who} post. Sign up as a pair, or pick an ${kind === 'agent' ? 'agent or either' : 'either'} post.`,
      });
    }
  }

  const key = `${HOLDER_PREFIX}${post.code}:${handle}`;
  const existingRaw = await kv.get(key);
  if (existingRaw) {
    const existing = JSON.parse(existingRaw);
    return ok({ alreadyHolding: true, matched, post: publicPost(post), entry: existing, receipt: receiptCard(existing, post) });
  }

  const signedAt = now.toISOString();
  const offerBy = new Date(now.getTime() + OFFER_CLOCK_DAYS * DAY_MS).toISOString();
  const via = input.via === 'mcp' ? 'mcp' : 'web';
  const entry = { type: OPS_TYPE, kind: 'holder', post: post.code, handle, applicant: kind, signedAt, offerBy, via, public: true };
  const metadata: HolderMeta = { kind, signedAt, offerBy };
  await kv.put(key, JSON.stringify(entry), { metadata: metadata as unknown as Record<string, unknown> });

  return ok({
    stored: true,
    matched,
    post: publicPost(post),
    entry,
    receipt: receiptCard(entry, post),
    next: `File one small piece of the work as a receipt before ${offerBy.slice(0, 10)} (Art. III, ${OFFER_CLOCK_DAYS}-day clock).`,
  });
}

export interface ReceiptInput {
  handle?: unknown;
  post?: unknown;
  summary?: unknown;
  link?: unknown;
  via?: unknown;
}

export async function fileReceipt(kv: DeskKV, input: ReceiptInput, now = new Date()): Promise<DeskResult> {
  const handle = normalizeHandle(input.handle);
  if (!ESCS_HANDLE_RE.test(handle)) return fail(400, 'bad-handle', { hint: 'lowercase letters, digits, hyphens; 2-32 chars' });

  const code = typeof input.post === 'string' ? input.post.trim().toUpperCase() : '';
  const post = POST_BY_CODE.get(code);
  if (!post) return fail(400, 'bad-post', { valid: [...POST_BY_CODE.keys()] });

  const holderRaw = await kv.get(`${HOLDER_PREFIX}${post.code}:${handle}`);
  if (!holderRaw) return fail(404, 'not-holding-post', { hint: `sign up for ${post.code} first (action: sign_up)` });

  const summaryRaw = cleanText(input.summary, RECEIPT_SUMMARY_MAX);
  if (summaryRaw === false) return fail(400, 'summary-too-long', { max: RECEIPT_SUMMARY_MAX });
  if (!summaryRaw) return fail(400, 'missing-summary', { hint: `what you did, in ≤${RECEIPT_SUMMARY_MAX} chars. Shape: ${post.receipt}` });
  const summary = redactEmails(summaryRaw);

  const link = cleanUrl(input.link);
  if (link === false) return fail(400, 'bad-link', { hint: 'link must be an https URL' });

  const filedAt = now.toISOString();
  const hash = await sha8([post.code, handle, summary, link || '', filedAt].join(':'));
  const key = `${RECEIPT_PREFIX}${filedAt}:${post.code}:${handle}:${hash}`;
  const via = input.via === 'mcp' ? 'mcp' : 'web';
  const entry = {
    type: OPS_TYPE,
    kind: 'receipt',
    id: `escs-${hash}`,
    post: post.code,
    postTitle: post.title,
    handle,
    summary,
    ...(link ? { link } : {}),
    points: post.points,
    filedAt,
    via,
    public: true,
  };
  await kv.put(key, JSON.stringify(entry), { metadata: { post: post.code, handle } });

  const swornKey = `${SWORN_PREFIX}${handle}`;
  const firstReceipt = !(await kv.get(swornKey));
  if (firstReceipt) await kv.put(swornKey, JSON.stringify({ handle, swornAt: filedAt, firstPost: post.code }));

  return ok({
    stored: true,
    entry,
    swornIn: firstReceipt,
    stamp: firstReceipt ? { id: SWORN_IN_STAMP_ID, label: 'Sworn In', points: 3 } : null,
    next: firstReceipt
      ? 'Sworn in. Your first receipt is on the public roster; the Sworn In stamp is yours.'
      : 'Receipt filed. It counts toward the guild vice-chair seat (first holder to 5 receipts).',
  });
}

function publicPost(post: CivilServicePost) {
  return { code: post.code, title: post.title, who: post.who, duty: post.duty, receipt: post.receipt, points: post.points };
}

function receiptCard(entry: { handle: string; applicant: string; signedAt: string; offerBy: string }, post: CivilServicePost): string {
  return [
    'EL SEGUNDO CIVIL SERVICE · SIGN-UP RECEIPT',
    `Post:       ${post.code} ${post.title}`,
    `Holder:     ${entry.handle}`,
    `Type:       ${entry.applicant}`,
    `Filed:      ${entry.signedAt.slice(0, 10)}`,
    `Offer by:   ${entry.offerBy.slice(0, 10)}  (Art. III, ${OFFER_CLOCK_DAYS}-day clock)`,
    '',
    `Duty:       ${post.duty}`,
    `Receipt:    ${post.receipt}`,
    '',
    'Roster: https://pointcast.xyz/civil-service#roster',
  ].join('\n');
}

/** The public roster: post → holders → receipt count, plus the newest receipts. */
export async function board(kv: DeskKV, now = new Date()): Promise<DeskResult> {
  const [holderKeys, receiptKeys] = await Promise.all([listAll(kv, HOLDER_PREFIX, 2), listAll(kv, RECEIPT_PREFIX, 3)]);

  const receiptCount = new Map<string, number>();
  const byHandle = new Map<string, number>();
  for (const key of receiptKeys) {
    const parsed = parseReceiptKey(key.name);
    if (!parsed) continue;
    const id = `${parsed.post}:${parsed.handle}`;
    receiptCount.set(id, (receiptCount.get(id) || 0) + 1);
    byHandle.set(parsed.handle, (byHandle.get(parsed.handle) || 0) + 1);
  }

  const holdersByPost = new Map<string, Array<Record<string, unknown>>>();
  for (const key of holderKeys) {
    const parsed = parseHolderKey(key.name);
    if (!parsed) continue;
    const meta = (key.metadata || {}) as Partial<HolderMeta>;
    const receipts = receiptCount.get(`${parsed.post}:${parsed.handle}`) || 0;
    const offerBy = meta.offerBy || null;
    const list = holdersByPost.get(parsed.post) || [];
    list.push({
      handle: parsed.handle,
      kind: meta.kind || null,
      signedAt: meta.signedAt || null,
      offerBy,
      receipts,
      status: receipts > 0 ? 'sworn' : offerBy && offerBy < now.toISOString() ? 'clock-out' : 'clock-running',
    });
    holdersByPost.set(parsed.post, list);
  }

  const roster = CIVIL_SERVICE_POSTS.map((post) => {
    const holders = (holdersByPost.get(post.code) || []).sort((a, b) =>
      Number(b.receipts) - Number(a.receipts) || String(a.signedAt).localeCompare(String(b.signedAt)),
    );
    return {
      code: post.code,
      title: post.title,
      who: post.who,
      holders,
      holderCount: holders.length,
      receiptCount: holders.reduce((sum, holder) => sum + Number(holder.receipts), 0),
    };
  });

  const newestNames = receiptKeys
    .map((key) => key.name)
    .filter((name) => parseReceiptKey(name))
    .sort()
    .slice(-20)
    .reverse();
  const latest = (
    await Promise.all(
      newestNames.map(async (name) => {
        const raw = await kv.get(name);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        return { id: entry.id, post: entry.post, postTitle: entry.postTitle, handle: entry.handle, summary: entry.summary, link: entry.link || null, filedAt: entry.filedAt };
      }),
    )
  ).filter(Boolean);

  const vice = [...byHandle.entries()].filter(([, count]) => count >= 5).map(([handle]) => handle);

  return ok({
    generatedAt: now.toISOString(),
    totals: {
      holders: roster.reduce((sum, post) => sum + post.holderCount, 0),
      people: new Set(holderKeys.map((key) => parseHolderKey(key.name)?.handle).filter(Boolean)).size,
      receipts: [...receiptCount.values()].reduce((sum, count) => sum + count, 0),
    },
    roster,
    latestReceipts: latest,
    guild: { viceChairEligible: vice, rule: 'First post-holder to log 5 receipts takes the vice-chair seat.' },
    privacy: 'Handles only. No email or contact detail is collected or shown.',
  });
}
