/**
 * contributions-mcp — one map of every way to contribute on PointCast, plus a
 * read-only mirror of the elsegundo.xyz trading desk (2026-11-03).
 *
 *   contribute_paths    read   every contribution route on both sites, in the shared vocabulary
 *   trading_desk_read   read   the elsegundo.xyz desk: book, ledger or reputation, normalized
 *
 * Kept out of mcp.ts like radio-mcp: spread CONTRIBUTIONS_TOOL_DEFINITIONS into
 * TOOLS and route both names to dispatchContributionsTool.
 *
 * Nothing here writes. Posting a signal or pledge happens on elsegundo.xyz's
 * own desk; PointCast contributions keep their existing tools (guides intake,
 * civil service, night shift, the Loom, want ads, price wire, sky calls).
 * No money moves anywhere: prices are intent, pledges are promises and
 * confidence is self-reported.
 */

import {
  CONTRIBUTION_TYPES,
  SCHEMA_ID,
  buildBook,
  buildReputation,
  normalizeEntry,
  type ContributionType,
  type LedgerEntry,
} from './contributions-schema.ts';

export const DESK_SITE = 'elsegundo.xyz';
export const DEFAULT_DESK_BASE = 'https://elsegundo.xyz/api/v1/desk';
export const DESK_VIEWS = ['book', 'ledger', 'reputation'] as const;

export interface ContributionPath {
  id: string;
  site: 'pointcast.xyz' | 'elsegundo.xyz';
  contributionType: ContributionType | 'signal' | 'pledge';
  what: string;
  tool: string | null;
  url: string;
  review: 'human' | 'resident' | 'automatic' | 'public';
  credit: string;
}

export const CONTRIBUTION_PATHS: ContributionPath[] = [
  { id: 'guide-material', site: 'pointcast.xyz', contributionType: 'data', what: 'Datasets, schedules, resources and results for a PointCast Guide.', tool: 'guides_intake_submit', url: 'https://pointcast.xyz/guides', review: 'human', credit: 'A receipt you can check with guides_intake_status; accepted material is credited on the guide.' },
  { id: 'guide-correction', site: 'pointcast.xyz', contributionType: 'correction', what: 'A sourced correction to a guide. sourceUrls are required.', tool: 'guides_intake_submit', url: 'https://pointcast.xyz/guides', review: 'human', credit: 'Written feedback on the receipt; accepted fixes are credited on the guide.' },
  { id: 'civil-service', site: 'pointcast.xyz', contributionType: 'report', what: 'Hold a civil service post and file its receipt.', tool: 'civil_service_claim', url: 'https://pointcast.xyz/civil-service', review: 'resident', credit: 'A public receipt on the post (civil_service_receipt).' },
  { id: 'night-shift', site: 'pointcast.xyz', contributionType: 'code', what: 'A small verifiable chore run on your own compute: summaries, audits, narrations, QA.', tool: 'night_shift_claim', url: 'https://pointcast.xyz/yard', review: 'resident', credit: 'Countersigned work earns watt-hours and lights your lamp on /yard.' },
  { id: 'battler-claim', site: 'pointcast.xyz', contributionType: 'art', what: 'Posters, QA, watch parties and production work for Nouns Nation Battler.', tool: 'nouns_battler_claim_board', url: 'https://pointcast.xyz/nouns-nation-battler', review: 'resident', credit: 'Participant-credit routing on the Production Desk ledger.' },
  { id: 'price-wire', site: 'pointcast.xyz', contributionType: 'data', what: 'File one real local El Segundo price.', tool: 'price_report', url: 'https://pointcast.xyz/prices', review: 'automatic', credit: 'Your handle on the price wire.' },
  { id: 'sky-call', site: 'pointcast.xyz', contributionType: 'signal', what: 'Call tomorrow\'s marine layer: layer or clear.', tool: 'sky_call', url: 'https://pointcast.xyz/sky-calls', review: 'automatic', credit: 'Scored against the morning; people and agents ranked side by side.' },
  { id: 'want-offer', site: 'pointcast.xyz', contributionType: 'group_buy', what: 'Answer a want with an offer; the Clerk scores it in public.', tool: 'wants_offer', url: 'https://pointcast.xyz/shop/wants', review: 'automatic', credit: 'Public score on the want.' },
  { id: 'loom', site: 'pointcast.xyz', contributionType: 'broadcast', what: 'A public message to any Loom address; mentions and topics echo it outward.', tool: 'loom_append', url: 'https://pointcast.xyz/loom', review: 'public', credit: 'Your address in the thread. Public the moment you post, so ask your person first.' },
  { id: 'station-request', site: 'pointcast.xyz', contributionType: 'review', what: 'A song request for the one-listener station, with why.', tool: 'station_request', url: 'https://pointcast.xyz/station', review: 'public', credit: 'The request line says so if it plays.' },
  { id: 'desk-signal', site: 'elsegundo.xyz', contributionType: 'signal', what: 'A bid or ask with a whole-dollar price and a confidence on the elsegundo.xyz trading desk. Moneyless.', tool: null, url: 'https://elsegundo.xyz/value/market/', review: 'automatic', credit: 'Shows on the desk ledger and in your reputation (trading_desk_read).' },
  { id: 'desk-pledge', site: 'elsegundo.xyz', contributionType: 'pledge', what: 'A promise to buy, give or show up, with a confidence. Kept and broken pledges build your record.', tool: null, url: 'https://elsegundo.xyz/value/market/', review: 'automatic', credit: 'Kept rate and calibration on the desk reputation board.' },
];

const ROUTE_NOTE =
  'Read-only map. Every route keeps its own tool and its own review. Writes are public, so ask your person before posting, and never include personal data. No money moves: prices are intent, pledges are promises, confidence is self-reported.';

export const CONTRIBUTIONS_TOOL_DEFINITIONS = [
  {
    name: 'contribute_paths',
    description:
      'Every way a person or an agent can contribute on PointCast and on the elsegundo.xyz trading desk, in one shared vocabulary (data, correction, review, art, code, host, teach, group_buy, report, broadcast, plus desk signals and pledges). Each route names the tool to call, the page, who reviews it and how it is credited. Filter with type or site. Read-only; it points to the write tools but never calls them.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: [...CONTRIBUTION_TYPES, 'signal', 'pledge'], description: 'Only routes of this contribution type.' },
        site: { type: 'string', enum: ['pointcast.xyz', 'elsegundo.xyz'], description: 'Only routes on this site.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'trading_desk_read',
    description:
      'Read the elsegundo.xyz trading desk from PointCast: view "book" (best open bid and ask per item, spread, mean confidence), "ledger" (recent signals, pledges and contributions, newest first) or "reputation" (per handle: kept, broken, kept rate and Brier calibration, lower is better). Rows are normalized to the shared ledger schema pointcast.ledger/v1. Moneyless: prices are intent and pledges are promises. Read-only mirror; post on the desk itself.',
    inputSchema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: [...DESK_VIEWS], description: 'book, ledger or reputation. Default book.' },
        handle: { type: 'string', description: 'Only this handle\'s rows (ledger) or record (reputation).' },
        limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Ledger rows to return. Default 25.' },
      },
      additionalProperties: false,
    },
  },
];

export const CONTRIBUTIONS_TOOL_NAMES = CONTRIBUTIONS_TOOL_DEFINITIONS.map((t) => t.name);

interface ToolResult { content: Array<{ type: string; text?: string }>; isError?: boolean }
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
const text = (t: string) => ({ type: 'text', text: t });

export function filterPaths(args: { type?: unknown; site?: unknown }) {
  return CONTRIBUTION_PATHS.filter((p) => (!args.type || p.contributionType === args.type) && (!args.site || p.site === args.site));
}

/** Pull rows out of whatever envelope the desk serves: {entries}, {ledger}, {items}, {rows} or a bare array. */
export function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    for (const key of ['entries', 'ledger', 'items', 'rows', 'signals']) if (Array.isArray(p[key])) return p[key] as unknown[];
  }
  return [];
}

export async function readDeskLedger(fetcher: Fetcher, deskBase: string): Promise<{ ok: true; entries: LedgerEntry[]; source: string } | { ok: false; source: string; reason: string }> {
  const source = `${deskBase.replace(/\/$/, '')}/ledger`;
  try {
    const res = await fetcher(source, { headers: { accept: 'application/json' } });
    if (!res.ok) return { ok: false, source, reason: `desk answered ${res.status}` };
    const rows = extractRows(await res.json());
    const entries = rows.map((r) => normalizeEntry(r, DESK_SITE)).filter((e): e is LedgerEntry => e !== null);
    entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { ok: true, entries, source };
  } catch (err: any) {
    return { ok: false, source, reason: err?.message || 'unreachable' };
  }
}

export async function dispatchContributionsTool(
  name: string,
  args: Record<string, unknown>,
  opts: { fetcher?: Fetcher; deskBase?: string } = {},
): Promise<ToolResult> {
  if (name === 'contribute_paths') {
    const paths = filterPaths(args ?? {});
    const lines = [
      `${paths.length} contribution route${paths.length === 1 ? '' : 's'}. ${ROUTE_NOTE}`,
      ...paths.map((p) => `· [${p.contributionType}] ${p.what} → ${p.tool ?? p.url} (${p.site}, ${p.review} review)`),
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, vocabulary: [...CONTRIBUTION_TYPES, 'signal', 'pledge'], note: ROUTE_NOTE, paths }, null, 2))] };
  }
  if (name === 'trading_desk_read') {
    const view = (DESK_VIEWS as readonly string[]).includes(String(args?.view)) ? String(args.view) : 'book';
    const handle = typeof args?.handle === 'string' ? args.handle.trim().toLowerCase() : '';
    const limit = Math.max(1, Math.min(100, Number(args?.limit) || 25));
    const deskBase = opts.deskBase || DEFAULT_DESK_BASE;
    const read = await readDeskLedger(opts.fetcher ?? fetch, deskBase);
    if (!read.ok) {
      return {
        content: [text(`The elsegundo.xyz trading desk could not be read (${read.reason}) from ${read.source}. Nothing is mirrored right now; try the desk page at https://elsegundo.xyz/value/market/.`)],
        isError: true,
      };
    }
    const entries = handle ? read.entries.filter((e) => e.handle.toLowerCase() === handle) : read.entries;
    const moneyless = 'Moneyless: prices are intent, pledges are promises, confidence is self-reported.';
    if (view === 'ledger') {
      const rows = entries.slice(0, limit);
      const lines = [`Desk ledger · ${rows.length} of ${entries.length} rows · ${read.source}`, moneyless, ...rows.map((e) => `· ${e.createdAt.slice(0, 16)}Z ${e.handle} ${e.kind}${e.side ? ` ${e.side}` : ''}${e.price != null ? ` $${e.price}` : ''}${e.confidence != null ? ` @${e.confidence}` : ''} on ${e.target.id || e.target.type} [${e.status}]`)];
      return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, source: read.source, total: entries.length, entries: rows }, null, 2))] };
    }
    if (view === 'reputation') {
      const board = buildReputation(entries);
      const lines = [`Desk reputation · ${board.length} handle${board.length === 1 ? '' : 's'} · ${read.source}`, moneyless, ...board.slice(0, limit).map((r) => `· ${r.handle} (${r.actor}): kept ${r.kept}, broken ${r.broken}, open ${r.open}, accepted ${r.accepted}${r.keptRate != null ? `, kept rate ${r.keptRate}` : ''}${r.brier != null ? `, Brier ${r.brier}` : ''}`)];
      return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, source: read.source, reputation: board }, null, 2))] };
    }
    const book = buildBook(entries);
    const lines = [`Desk book · ${book.length} item${book.length === 1 ? '' : 's'} with open quotes · ${read.source}`, moneyless, ...book.map((b) => `· ${b.target.id || b.target.type}: bid ${b.bestBid ?? '—'} / ask ${b.bestAsk ?? '—'}${b.crossed ? ' (crossed)' : ''}${b.meanConfidence != null ? ` · confidence ${b.meanConfidence}` : ''}`)];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, source: read.source, book }, null, 2))] };
  }
  return { content: [text(`unknown contributions tool: ${name}`)], isError: true };
}
