// Paddle takes — a reviewer's first-hand read on one paddle, not a lab score.
//
// A take has no stars. It has a verdict bucket, a disclosed relationship to
// the paddle, hours actually played, and a dated record of what happened
// along the way. `orderTakes` never reads verdict, relationship or
// affiliate — order can't be bought any more than the verdict can.
//
// This module is pure and self-contained: no runtime imports, so it can be
// unit-tested without Astro, Vite or the register.

export type Relationship = 'owner' | 'insider' | 'sample' | 'bought';
export type Verdict = 'bag' | 'depends' | 'pass';
export type TakeStatus = 'published' | 'draft';

export interface RecordEntry {
  date: string;
  note: string;
  source: string; // 'reviewer' or an https URL
}

export interface PaddleTake {
  id: string;
  paddleId: string;
  status: TakeStatus;
  publishedAt: string;
  reviewer: { handle: string; relationship: Relationship };
  thesis: string;
  wouldChange: string;
  hoursPlayed: number;
  testedFrom: string;
  testedTo: string;
  verdict: Verdict;
  record: RecordEntry[];
  affiliate: { program: string; url: string } | null;
  disclosure: string;
}

/**
 * bought: own money, retail. sample: free or discounted. insider: Mike's own
 * bag, bought at retail. owner: financial tie to the maker, ambassadors
 * included. When more than one fits, RELATIONSHIP_PRECEDENCE decides.
 */
export const RELATIONSHIP_WORDS: Record<Relationship, string> = {
  bought: 'Bought with own money, at retail',
  sample: 'Sent free or discounted',
  insider: "In Mike's own bag, bought at retail",
  owner: 'Financial tie to the maker, ambassadors included',
};

/**
 * The first relationship that fits is the one a take discloses. A financial
 * tie always reads `owner`; a free or discounted paddle always reads
 * `sample`, even once it lives in Mike's bag. `insider` is only ever a
 * retail purchase — how a paddle was obtained outranks who holds it.
 */
export const RELATIONSHIP_PRECEDENCE: Relationship[] = ['owner', 'sample', 'insider', 'bought'];

export const VERDICT_WORDS: Record<Verdict, string> = {
  bag: 'Stays in the bag',
  depends: 'Depends on your game',
  pass: 'Pass',
};

export const MIN_HOURS = 10;
export const MAX_HOURS = 2000;

export interface TakeField {
  label: string;
  meaning: string;
}

export const TAKE_FIELDS: Record<string, TakeField> = {
  reviewer: { label: 'Reviewer', meaning: "The handle filing the take, and how they got the paddle. The first that fits wins: owner, then sample, then insider, then bought." },
  thesis: { label: 'Thesis', meaning: 'The one idea the take is making, in 20–280 characters.' },
  wouldChange: { label: 'What would change my mind', meaning: 'The specific thing — a crack, a re-string, a different opponent — that would move the verdict.' },
  hoursPlayed: { label: 'Hours played', meaning: `At least ${MIN_HOURS} hours on real courts before a take publishes.` },
  tested: { label: 'Tested', meaning: 'The date range the reviewer actually played it, on or before the day it published.' },
  verdict: { label: 'Verdict', meaning: 'Stays in the bag, depends on your game, or pass — never a star count.' },
  record: { label: 'Record', meaning: 'What happened along the way, each entry sourced to the reviewer or a link.' },
};

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HANDLE_RE = /^@[a-z0-9_]{2,24}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_STAMP_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?)?$/;

const isIsoDate = (v: unknown): v is string => typeof v === 'string' && ISO_DATE_RE.test(v);
const isIsoStamp = (v: unknown): v is string => typeof v === 'string' && ISO_STAMP_RE.test(v);
const dateOnly = (v: string) => v.slice(0, 10);
const isHttpsUrl = (v: unknown): v is string => typeof v === 'string' && /^https:\/\//.test(v);

/** Off-site relative to PointCast — an affiliate link never points back at pointcast.xyz. */
function isOffSiteUrl(v: string): boolean {
  try {
    const host = new URL(v).hostname.toLowerCase().replace(/^www\./, '');
    return host !== 'pointcast.xyz' && !host.endsWith('.pointcast.xyz');
  } catch {
    return false;
  }
}

/**
 * Take ids become page paths under /reviews/paddles/. These would collide
 * with a static page there (or its index), so the static page would win and
 * the take would vanish instead of failing the build.
 */
export const RESERVED_TAKE_IDS = ['method', 'index'];

/**
 * Returns the list of validation failures for one take (empty means valid).
 * `knownIds` is the set of real paddle ids from the register; `method` is
 * never a valid paddleId (the method page is not a paddle). `knownPrograms`
 * is the set of affiliate program ids on file; it defaults to none, so a
 * caller that forgets to pass it rejects every affiliate instead of
 * accepting an unknown one.
 */
export function validateTake(take: PaddleTake, knownIds: string[], knownPrograms: string[] = []): string[] {
  const errors: string[] = [];
  const fail = (msg: string) => { errors.push(msg); };

  if (!take || typeof take !== 'object') return ['take must be an object'];

  if (!isSlug(take.id)) fail('id must be a slug');
  if (RESERVED_TAKE_IDS.includes(take.id)) fail(`id must not be a reserved page name (${RESERVED_TAKE_IDS.join(', ')})`);

  if (typeof take.paddleId !== 'string' || take.paddleId === 'method' || !knownIds.includes(take.paddleId)) {
    fail('paddleId must be a known paddle id, and not "method"');
  }

  if (take.status !== 'published' && take.status !== 'draft') fail('status must be "published" or "draft"');

  if (!isIsoStamp(take.publishedAt)) fail('publishedAt must be an ISO date');

  if (!take.reviewer || !HANDLE_RE.test(take.reviewer.handle || '')) fail('reviewer.handle must match /^@[a-z0-9_]{2,24}$/i');
  if (!take.reviewer || !(take.reviewer.relationship in RELATIONSHIP_WORDS)) fail('reviewer.relationship must be a known relationship');

  if (typeof take.thesis !== 'string' || take.thesis.length < 20 || take.thesis.length > 280) fail('thesis must be 20-280 characters');
  if (typeof take.wouldChange !== 'string' || take.wouldChange.length < 10 || take.wouldChange.length > 280) fail('wouldChange must be 10-280 characters');

  if (typeof take.hoursPlayed !== 'number' || !Number.isFinite(take.hoursPlayed) || take.hoursPlayed < MIN_HOURS || take.hoursPlayed > MAX_HOURS) {
    fail(`hoursPlayed must be ${MIN_HOURS}-${MAX_HOURS}`);
  }

  const fromOk = isIsoDate(take.testedFrom);
  const toOk = isIsoDate(take.testedTo);
  if (!fromOk) fail('testedFrom must be an ISO date');
  if (!toOk) fail('testedTo must be an ISO date');
  if (fromOk && toOk && take.testedFrom > take.testedTo) fail('testedFrom must be on or before testedTo');
  if (toOk && isIsoStamp(take.publishedAt) && take.testedTo > dateOnly(take.publishedAt)) {
    fail('testedTo must be on or before publishedAt');
  }

  if (!(take.verdict in VERDICT_WORDS)) fail('verdict must be a known verdict');

  if (!Array.isArray(take.record) || take.record.length === 0) {
    fail('record must be a non-empty array');
  } else {
    take.record.forEach((entry, i) => {
      if (!entry || !isIsoDate(entry.date)) fail(`record[${i}].date must be an ISO date`);
      if (!entry || typeof entry.note !== 'string' || !entry.note.trim()) fail(`record[${i}].note must be non-empty`);
      const source = entry?.source;
      if (source !== 'reviewer' && !isHttpsUrl(source)) fail(`record[${i}].source must be "reviewer" or an https URL`);
    });
  }

  if (typeof take.disclosure !== 'string' || !take.disclosure.trim()) fail('disclosure must be non-empty');

  if (take.affiliate !== null) {
    if (!take.affiliate || !isSlug(take.affiliate.program) || !knownPrograms.includes(take.affiliate.program)) {
      fail('affiliate.program must be a known program id');
    }
    if (!take.affiliate || !isHttpsUrl(take.affiliate.url)) fail('affiliate.url must be an https URL');
    if (take.affiliate && isHttpsUrl(take.affiliate.url) && !isOffSiteUrl(take.affiliate.url)) fail('affiliate.url must be off-site');
  }

  return errors;
}

function isSlug(v: unknown): v is string {
  return typeof v === 'string' && SLUG_RE.test(v);
}

/**
 * Drops drafts and validates every published take. Throws — rather than
 * silently dropping — on an invalid published take or a duplicate id, so a
 * bad entry fails the build instead of vanishing from the site.
 */
export function publishableTakes(takes: PaddleTake[], knownIds: string[], knownPrograms: string[] = []): PaddleTake[] {
  const seen = new Set<string>();
  const out: PaddleTake[] = [];
  for (const take of takes) {
    if (take.status === 'draft') continue;
    const errors = validateTake(take, knownIds, knownPrograms);
    if (errors.length) throw new Error(`invalid published paddle take "${take.id}": ${errors.join('; ')}`);
    if (seen.has(take.id)) throw new Error(`duplicate paddle take id "${take.id}"`);
    seen.add(take.id);
    out.push(take);
  }
  return out;
}

const latestRecordDate = (take: PaddleTake): string =>
  take.record.reduce((max, entry) => (entry.date > max ? entry.date : max), '');

/**
 * Orders by latest record date, then publishedAt, then id. Never reads
 * verdict, relationship or affiliate — order can't be bought.
 */
export function orderTakes(takes: PaddleTake[]): PaddleTake[] {
  return [...takes].sort((a, b) =>
    latestRecordDate(b).localeCompare(latestRecordDate(a))
    || dateOnly(b.publishedAt).localeCompare(dateOnly(a.publishedAt))
    || a.id.localeCompare(b.id));
}
