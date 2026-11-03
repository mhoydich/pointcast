/**
 * contributions-schema — the one ledger shape PointCast and elsegundo.xyz
 * share for signals, pledges and contributions (2026-11-03).
 *
 * Nothing here moves money. A "price" is a whole-dollar statement of intent,
 * a "pledge" is a promise someone can keep or break, and "confidence" is how
 * sure they say they are. Reputation is counted from kept and broken pledges
 * and accepted contributions, and calibration is a Brier score over resolved
 * pledges (lower is better).
 *
 * The elsegundo.xyz trading desk is the writer of record for desk entries;
 * PointCast only reads it (trading_desk_read) and normalizes whatever comes
 * back through normalizeEntry(), so a field the desk renames later degrades
 * to "missing" instead of breaking the MCP. See docs/contributions-schema.md.
 */

export const SCHEMA_ID = 'pointcast.ledger/v1';

export const ENTRY_KINDS = ['signal', 'pledge', 'contribution'] as const;
export const ACTORS = ['person', 'agent'] as const;
export const SIDES = ['bid', 'ask'] as const;
export const TARGET_TYPES = ['item', 'edition', 'place', 'page', 'event', 'job', 'block'] as const;
export const STATUSES = ['open', 'kept', 'broken', 'withdrawn', 'accepted', 'declined'] as const;
export const CONTRIBUTION_TYPES = [
  'data',
  'correction',
  'review',
  'art',
  'code',
  'host',
  'teach',
  'group_buy',
  'report',
  'broadcast',
  'moderation',
] as const;

/**
 * The elsegundo.xyz buying lab names its contribution kinds its own way; each
 * maps onto the shared vocabulary here. Kinds already shared (correction,
 * review, art, code) pass straight through.
 */
export const DESK_KIND_ALIASES: Record<string, string> = {
  'place-data': 'data',
  'group-buy-host': 'group_buy',
  'bonfire-host': 'host',
  'skill-night-teach': 'teach',
};

/** Buying-lab contribution statuses mapped onto ours. "hidden" rows are never mirrored. */
const DESK_STATUS_ALIASES: Record<string, string> = { pending: 'open', 'not-yet': 'declined' };

/** Buying-lab ledger event types (append-only; withdraw is its own event). */
const DESK_EVENT_TYPES = ['pledge', 'signal', 'withdraw', 'contribution'];

export type EntryKind = (typeof ENTRY_KINDS)[number];
export type Actor = (typeof ACTORS)[number];
export type Side = (typeof SIDES)[number];
export type TargetType = (typeof TARGET_TYPES)[number];
export type Status = (typeof STATUSES)[number];
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export interface LedgerEntry {
  id: string;
  kind: EntryKind;
  site: string;
  handle: string;
  actor: Actor;
  operator: string | null;
  target: { type: TargetType; id: string; url: string | null };
  side: Side | null;
  price: number | null;
  confidence: number | null;
  contributionType: ContributionType | null;
  body: string;
  proofUrl: string | null;
  status: Status;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Reputation {
  handle: string;
  actor: Actor;
  entries: number;
  open: number;
  kept: number;
  broken: number;
  withdrawn: number;
  accepted: number;
  declined: number;
  keptRate: number | null;
  brier: number | null;
  lastSeen: string | null;
}

export const BODY_MAX = 500;
const HANDLE_RE = /^[A-Za-z0-9_.@-]{1,40}$/;

const pick = <T extends string>(list: readonly T[], value: unknown): T | null =>
  typeof value === 'string' && (list as readonly string[]).includes(value) ? (value as T) : null;

function isoOrNull(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function httpsOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Accept 0..1 or 0..100; anything else is null. With percent=true the value is
 * always read as 0..100 (the buying lab's integer scale), so 1 means 1%.
 */
export function normalizeConfidence(value: unknown, percent = false): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  if (percent) return n <= 100 ? Math.round(n) / 100 : null;
  if (n <= 1) return Math.round(n * 100) / 100;
  if (n <= 100) return Math.round(n) / 100;
  return null;
}

/**
 * Normalize one row from either site into the shared shape. Returns null
 * when the row has no usable id, handle or kind. Personal data never gets in:
 * only a public handle and an optional operator handle are kept.
 */
export function normalizeEntry(raw: unknown, site: string): LedgerEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, any>;
  const id = typeof r.id === 'string' || typeof r.id === 'number' ? String(r.id) : '';
  const handle = String(r.handle ?? r.who ?? r.name ?? '').trim();

  // Buying-lab events carry `type` (pledge|signal|withdraw|contribution) and
  // use `kind` for the contribution kind, or the withdrawn kind on a withdraw.
  const deskType = typeof r.type === 'string' && DESK_EVENT_TYPES.includes(r.type) ? r.type : null;
  if (deskType && r.status === 'hidden') return null;
  let kind: EntryKind | null;
  let status: Status | null = null;
  if (deskType === 'withdraw') {
    kind = pick(ENTRY_KINDS, r.kind) ?? 'pledge';
    status = 'withdrawn';
  } else if (deskType) {
    kind = deskType as EntryKind;
  } else {
    kind = pick(ENTRY_KINDS, r.kind) ?? (r.contributionType ? 'contribution' : r.side ? 'signal' : null);
  }
  if (!id || !kind || !HANDLE_RE.test(handle)) return null;

  let targetRaw: any;
  if (r.target && typeof r.target === 'object') targetRaw = r.target;
  else if (deskType && r.place) targetRaw = { type: 'place', id: r.place, url: r.url };
  else if (deskType && r.item) targetRaw = { type: 'edition', id: r.tier ? `${r.item}:${r.tier}` : r.item, url: r.url };
  else targetRaw = { type: r.targetType, id: r.targetId ?? r.item ?? r.itemId, url: r.targetUrl };

  const priceNum = Number(r.price);
  const price = Number.isFinite(priceNum) && priceNum >= 0 && r.price !== null && r.price !== '' && r.price !== undefined ? Math.round(priceNum) : null;
  const createdAt = isoOrNull(r.createdAt ?? r.at ?? r.ts) ?? new Date(0).toISOString();
  const rawContribution = String(r.contributionType ?? (deskType ? (kind === 'contribution' ? r.kind : '') : r.type) ?? '');
  const rawStatus = typeof r.status === 'string' ? DESK_STATUS_ALIASES[r.status] ?? r.status : r.status;

  return {
    id,
    kind,
    site: String(r.site || site),
    handle,
    actor: pick(ACTORS, r.actor ?? r.by ?? r.via) ?? 'person',
    operator: typeof r.operator === 'string' && HANDLE_RE.test(r.operator) ? r.operator : null,
    target: {
      type: pick(TARGET_TYPES, targetRaw?.type) ?? 'item',
      id: String(targetRaw?.id ?? ''),
      url: httpsOrNull(targetRaw?.url),
    },
    // The buying lab has no asks yet: a priced pledge or signal there is a bid.
    side: pick(SIDES, r.side) ?? (deskType && deskType !== 'contribution' && price != null ? 'bid' : null),
    price,
    confidence: normalizeConfidence(r.confidence, Boolean(deskType)),
    contributionType: pick(CONTRIBUTION_TYPES, DESK_KIND_ALIASES[rawContribution] ?? rawContribution),
    body: String(r.body ?? r.note ?? r.title ?? '').slice(0, BODY_MAX),
    proofUrl: httpsOrNull(r.proofUrl),
    status: status ?? pick(STATUSES, rawStatus) ?? 'open',
    createdAt,
    resolvedAt: isoOrNull(r.resolvedAt),
  };
}

/**
 * Count each handle's record. keptRate = kept / (kept + broken). brier is the
 * mean of (confidence - outcome)^2 over resolved pledges that stated a
 * confidence, where kept = 1 and broken = 0.
 */
export function buildReputation(entries: LedgerEntry[]): Reputation[] {
  const by = new Map<string, Reputation & { _sq: number; _n: number }>();
  for (const e of entries) {
    const key = e.handle.toLowerCase();
    let r = by.get(key);
    if (!r) {
      r = { handle: e.handle, actor: e.actor, entries: 0, open: 0, kept: 0, broken: 0, withdrawn: 0, accepted: 0, declined: 0, keptRate: null, brier: null, lastSeen: null, _sq: 0, _n: 0 };
      by.set(key, r);
    }
    r.entries += 1;
    r[e.status] += 1;
    if (!r.lastSeen || e.createdAt > r.lastSeen) r.lastSeen = e.createdAt;
    if (e.kind === 'pledge' && (e.status === 'kept' || e.status === 'broken') && e.confidence != null) {
      const outcome = e.status === 'kept' ? 1 : 0;
      r._sq += (e.confidence - outcome) ** 2;
      r._n += 1;
    }
  }
  return [...by.values()]
    .map(({ _sq, _n, ...r }) => ({
      ...r,
      keptRate: r.kept + r.broken > 0 ? Math.round((r.kept / (r.kept + r.broken)) * 100) / 100 : null,
      brier: _n > 0 ? Math.round((_sq / _n) * 1000) / 1000 : null,
    }))
    .sort((a, b) => b.kept + b.accepted - (a.kept + a.accepted) || a.handle.localeCompare(b.handle));
}

/** Best open bid and ask per target, from open signals and pledges. */
export function buildBook(entries: LedgerEntry[]) {
  const rows = new Map<string, { target: LedgerEntry['target']; bestBid: number | null; bestAsk: number | null; bids: number; asks: number; meanConfidence: number | null; _c: number[] }>();
  for (const e of entries) {
    if (e.status !== 'open' || e.kind === 'contribution' || e.price == null || !e.side) continue;
    const key = `${e.target.type}:${e.target.id}`;
    let row = rows.get(key);
    if (!row) {
      row = { target: e.target, bestBid: null, bestAsk: null, bids: 0, asks: 0, meanConfidence: null, _c: [] };
      rows.set(key, row);
    }
    if (e.side === 'bid') {
      row.bids += 1;
      row.bestBid = row.bestBid == null ? e.price : Math.max(row.bestBid, e.price);
    } else {
      row.asks += 1;
      row.bestAsk = row.bestAsk == null ? e.price : Math.min(row.bestAsk, e.price);
    }
    if (e.confidence != null) row._c.push(e.confidence);
  }
  return [...rows.values()].map(({ _c, ...row }) => ({
    ...row,
    spread: row.bestBid != null && row.bestAsk != null ? row.bestAsk - row.bestBid : null,
    crossed: row.bestBid != null && row.bestAsk != null && row.bestBid >= row.bestAsk,
    meanConfidence: _c.length ? Math.round((_c.reduce((a, b) => a + b, 0) / _c.length) * 100) / 100 : null,
  }));
}
