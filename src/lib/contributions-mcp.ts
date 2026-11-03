/**
 * contributions-mcp — one map of every way to contribute on PointCast, plus a
 * read-only mirror of the elsegundo.xyz trading desk (2026-11-03).
 *
 *   contribute_paths    read   every contribution route on both sites, in the shared vocabulary
 *   trading_desk_read   read   the elsegundo.xyz buying lab: book, ledger or a participant's record
 *
 * Kept out of mcp.ts like radio-mcp: spread CONTRIBUTIONS_TOOL_DEFINITIONS into
 * TOOLS and route both names to dispatchContributionsTool.
 *
 * The desk is the elsegundo.xyz buying lab (hello-token-reserve PR 193):
 * public read-only JSON at /api/v1/buying-lab (book), /ledger (append-only
 * events, newest first) and /record?handle= (one participant's record), with
 * writes on its own MCP at https://elsegundo.xyz/mcp/desk.
 *
 * Nothing here writes. Posting a signal, pledge or contribution happens on the
 * buying lab's own MCP or page; PointCast contributions keep their existing tools (guides intake,
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
  pairWithdrawals,
  type ContributionType,
  type LedgerEntry,
} from './contributions-schema.ts';

export const DESK_SITE = 'elsegundo.xyz';
export const DEFAULT_DESK_BASE = 'https://elsegundo.xyz/api/v1/buying-lab';
export const DESK_MCP_URL = 'https://elsegundo.xyz/mcp/desk';
export const DESK_VIEWS = ['book', 'ledger', 'reputation'] as const;

export interface ContributionPath {
  id: string;
  site: 'pointcast.xyz' | 'elsegundo.xyz';
  contributionType: ContributionType | 'signal' | 'pledge';
  what: string;
  tool: string | null;
  /** A tool on another site's MCP server, as "<server url> · <tool>". */
  remoteTool?: string;
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
  { id: 'desk-signal', site: 'elsegundo.xyz', contributionType: 'signal', what: 'Signal interest in an edition or place on the elsegundo.xyz buying lab, with a whole-dollar play price and a confidence from 0 to 100. Moneyless.', tool: null, remoteTool: `${DESK_MCP_URL} · post_signal`, url: 'https://elsegundo.xyz/value/market/', review: 'automatic', credit: 'Shows on the buying-lab ledger and in your record (trading_desk_read).' },
  { id: 'desk-pledge', site: 'elsegundo.xyz', contributionType: 'pledge', what: 'A pledge (a bid; the lab has no asks yet) to buy at a play price, with a confidence. Kept pledges add 3 to your score; withdraw with withdraw.', tool: null, remoteTool: `${DESK_MCP_URL} · post_pledge`, url: 'https://elsegundo.xyz/value/market/', review: 'automatic', credit: 'Kept pledges and Brier calibration on your buying-lab record.' },
  { id: 'desk-contribution', site: 'elsegundo.xyz', contributionType: 'data', what: 'A buying-lab contribution: place-data, correction, review, art, group-buy-host, bonfire-host, skill-night-teach, code or moderation (contribution_kinds lists them).', tool: null, remoteTool: `${DESK_MCP_URL} · contribute`, url: 'https://elsegundo.xyz/value/market/', review: 'human', credit: 'Stewards accept by PR; only accepted ids earn credit (contribution_status).' },
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
      'Read the elsegundo.xyz buying lab (the moneyless trading desk) from PointCast: view "book" (the lab\'s own book), "ledger" (recent pledges, signals, withdrawals and contributions, newest first, normalized to the shared schema pointcast.ledger/v1) or "reputation" (with handle: that participant\'s record, kept pledges, Brier calibration once a drop settles, contribution credit and score; without: a board counted from the ledger, withdrawals paired to what they cancel). Prices are play dollars and pledges are promises. Read-only mirror; post through https://elsegundo.xyz/mcp/desk.',
    inputSchema: {
      type: 'object',
      properties: {
        view: { type: 'string', enum: [...DESK_VIEWS], description: 'book, ledger or reputation. Default book.' },
        handle: { type: 'string', description: 'A nickname: only its rows (ledger) or its record (reputation).' },
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

/** Pull rows out of whatever envelope the desk serves: {events}, {entries}, {ledger}, {items}, {rows} or a bare array. */
export function extractRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    for (const key of ['events', 'entries', 'ledger', 'items', 'rows', 'signals']) if (Array.isArray(p[key])) return p[key] as unknown[];
  }
  return [];
}

type DeskRead<T> = { ok: true; source: string; data: T } | { ok: false; source: string; reason: string };

async function readDeskJson(fetcher: Fetcher, source: string): Promise<DeskRead<any>> {
  try {
    const res = await fetcher(source, { headers: { accept: 'application/json' } });
    if (!res.ok) return { ok: false, source, reason: `desk answered ${res.status}` };
    const data = await res.json();
    if (data && typeof data === 'object' && (data as any).ok === false) return { ok: false, source, reason: String((data as any).note || (data as any).error || 'desk said not ok') };
    return { ok: true, source, data };
  } catch (err: any) {
    return { ok: false, source, reason: err?.message || 'unreachable' };
  }
}

const deskRoot = (deskBase: string) => deskBase.replace(/\/$/, '');

export async function readDeskLedger(fetcher: Fetcher, deskBase: string, opts: { limit?: number; handle?: string } = {}): Promise<{ ok: true; entries: LedgerEntry[]; source: string; total: number | null } | { ok: false; source: string; reason: string }> {
  const limit = Math.max(1, Math.min(100, opts.limit ?? 100));
  const read = await readDeskJson(fetcher, `${deskRoot(deskBase)}/ledger?limit=${limit}`);
  if (!read.ok) return read;
  let entries = extractRows(read.data).map((r) => normalizeEntry(r, DESK_SITE)).filter((e): e is LedgerEntry => e !== null);
  if (opts.handle) entries = entries.filter((e) => e.handle.toLowerCase() === opts.handle);
  entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = typeof read.data?.total === 'number' ? read.data.total : null;
  return { ok: true, entries, source: read.source, total };
}

const MONEYLESS = 'Moneyless: prices are play dollars, pledges are promises, confidence is self-reported.';

function downResult(source: string, reason: string): ToolResult {
  return {
    content: [text(`The elsegundo.xyz buying lab could not be read (${reason}) from ${source}. Nothing is mirrored right now; try the desk page at https://elsegundo.xyz/value/market/.`)],
    isError: true,
  };
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
      ...paths.map((p) => `· [${p.contributionType}] ${p.what} → ${p.tool ?? p.remoteTool ?? p.url} (${p.site}, ${p.review} review)`),
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, vocabulary: [...CONTRIBUTION_TYPES, 'signal', 'pledge'], note: ROUTE_NOTE, paths }, null, 2))] };
  }
  if (name === 'trading_desk_read') {
    const view = (DESK_VIEWS as readonly string[]).includes(String(args?.view)) ? String(args.view) : 'book';
    const handle = typeof args?.handle === 'string' ? args.handle.trim().toLowerCase() : '';
    const limit = Math.max(1, Math.min(100, Number(args?.limit) || 25));
    const deskBase = opts.deskBase || DEFAULT_DESK_BASE;
    const fetcher = opts.fetcher ?? fetch;

    if (view === 'book') {
      // The lab serves its own book; withdrawals are separate ledger events,
      // so its book is the honest view of what is still open.
      const read = await readDeskJson(fetcher, deskRoot(deskBase));
      if (!read.ok) return downResult(read.source, read.reason);
      const rows = extractRows(read.data);
      const editions = Array.isArray(read.data?.editions) ? read.data.editions : rows;
      const lines = [`Buying-lab book · ${read.source}`, MONEYLESS];
      if (typeof read.data?.note === 'string') lines.push(read.data.note.slice(0, 300));
      if (editions.length) lines.push(`${editions.length} edition${editions.length === 1 ? '' : 's'} listed.`);
      return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, site: DESK_SITE, source: read.source, book: read.data }, null, 2))] };
    }

    if (view === 'reputation' && handle) {
      const read = await readDeskJson(fetcher, `${deskRoot(deskBase)}/record?handle=${encodeURIComponent(handle)}`);
      if (!read.ok) return downResult(read.source, read.reason);
      const record = read.data?.record ?? read.data;
      if (!record || record.found === false) {
        return { content: [text(`No buying-lab record for ${handle} yet. ${MONEYLESS}`)] };
      }
      const p = record.pledges ?? {};
      const rep = record.reputation ?? {};
      const brier = record.calibration?.brier;
      const line = `${record.handle ?? handle}: score ${rep.score ?? '—'} (credit ${rep.credit ?? 0}, kept pledges ${rep.keptPledges ?? p.kept ?? 0}), pledges open ${p.open ?? 0} / settled ${p.settled ?? 0} / withdrawn ${p.withdrawn ?? 0}, Brier ${brier ?? 'not yet (no drop settled)'}, contributions ${record.contributions?.accepted ?? 0} accepted of ${record.contributions?.total ?? 0}`;
      return { content: [text([`Buying-lab record · ${read.source}`, MONEYLESS, line].join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, site: DESK_SITE, source: read.source, record }, null, 2))] };
    }

    const read = await readDeskLedger(fetcher, deskBase, { limit: 100, handle });
    if (!read.ok) return downResult(read.source, read.reason);
    const entries = read.entries;
    if (view === 'ledger') {
      const rows = entries.slice(0, limit);
      const lines = [`Buying-lab ledger · ${rows.length} of ${entries.length} events read${read.total != null ? ` (${read.total} in all)` : ''} · ${read.source}`, MONEYLESS, ...rows.map((e) => `· ${e.createdAt.slice(0, 16)}Z ${e.handle} ${e.status === 'withdrawn' ? `withdrew a ${e.kind}` : e.kind}${e.contributionType ? ` (${e.contributionType})` : ''}${e.price != null ? ` $${e.price}` : ''}${e.confidence != null ? ` @${e.confidence}` : ''} on ${e.target.id || e.target.type} [${e.status}]`)];
      return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, site: DESK_SITE, source: read.source, total: read.total ?? entries.length, entries: rows }, null, 2))] };
    }
    const board = buildReputation(pairWithdrawals(entries));
    const lines = [`Buying-lab board from the last ${entries.length} ledger events · ${read.source}`, MONEYLESS, 'Pass handle for a participant\'s full record, scored by the lab itself.', ...board.slice(0, limit).map((r) => `· ${r.handle} (${r.actor}): ${r.entries} events, open ${r.open}, withdrawn ${r.withdrawn}, accepted ${r.accepted}${r.keptRate != null ? `, kept rate ${r.keptRate}` : ''}${r.brier != null ? `, Brier ${r.brier}` : ''}`)];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: SCHEMA_ID, site: DESK_SITE, source: read.source, reputation: board }, null, 2))] };
  }
  return { content: [text(`unknown contributions tool: ${name}`)], isError: true };
}
