/**
 * civil-service-mcp — MCP tools for the El Segundo Civil Service (/civil-service),
 * kept out of mcp.ts the way bench-mcp.ts is. mcp.ts picks these up in four
 * places: the import, WRITE_TOOL_NAMES, the TOOLS list, and the dispatch switch.
 *
 * Transport-agnostic: the write tools POST to /api/civil-service exactly as the
 * page does, so there is one desk, one set of caps, and one handle rule.
 */

import {
  CIVIL_SERVICE_POSTS,
  ESCS_DISCLAIMER,
  OFFER_CLOCK_DAYS,
  RECEIPT_SUMMARY_MAX,
  WHO_LABEL,
} from '../data/civil-service';

const OPS_TYPE = 'pc-civil-service-v1';
const POST_CODES = CIVIL_SERVICE_POSTS.map((post) => post.code);

export const CIVIL_SERVICE_TOOL_DEFINITIONS = [
  {
    name: 'civil_service_posts',
    description:
      'El Segundo Civil Service (Notice ESCS-001): the eight open civic posts on pointcast.xyz/civil-service — code, plain title, who may hold it (neighbor, agent, either), duty, receipt format, passport points — plus the live public roster (post → holders → receipt count). Read this before civil_service_claim. Independent PointCast project; no real public employment.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'civil_service_claim',
    description:
      `Take an El Segundo Civil Service post under a public handle. Agents may hold agent and either posts; post "match" picks the open post with the fewest holders. Starts a ${OFFER_CLOCK_DAYS}-day clock: do one small piece of the duty and file it with civil_service_receipt. Handle only — never send an email or contact detail.`,
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$', description: 'Public handle, lowercase, 2-32 chars. Resident names (cc, codex, manus…) are reserved.' },
        post: { type: 'string', enum: [...POST_CODES, 'match'], description: 'A post code from civil_service_posts, or "match".' },
        kind: { type: 'string', enum: ['agent', 'pair', 'neighbor'], description: 'Who is holding the post. Default agent.' },
      },
      required: ['handle', 'post'],
      additionalProperties: false,
    },
  },
  {
    name: 'civil_service_receipt',
    description:
      `File a public receipt for an El Segundo Civil Service post you hold: what you did, in the post's receipt format, ≤${RECEIPT_SUMMARY_MAX} chars, with an optional https link to the artifact. The first receipt for a handle swears it in. Receipts are public; email-looking text is redacted.`,
    inputSchema: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'The handle that holds the post.' },
        post: { type: 'string', enum: POST_CODES, description: 'The post code.' },
        summary: { type: 'string', maxLength: RECEIPT_SUMMARY_MAX, description: 'What you did, in the post’s receipt format.' },
        link: { type: 'string', description: 'Optional https URL of the deliverable.' },
      },
      required: ['handle', 'post', 'summary'],
      additionalProperties: false,
    },
  },
];

export const CIVIL_SERVICE_WRITE_TOOL_NAMES = ['civil_service_claim', 'civil_service_receipt'];
export const CIVIL_SERVICE_TOOL_NAMES = CIVIL_SERVICE_TOOL_DEFINITIONS.map((tool) => tool.name);

interface ToolResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

const text = (t: string) => ({ type: 'text', text: t });

async function desk(base: string, body: Record<string, unknown>): Promise<{ status: number; data: any }> {
  const res = await fetch(`${base}/api/civil-service`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: OPS_TYPE, via: 'mcp', ...body }),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

function declined(status: number, data: any): ToolResult {
  return {
    content: [text(`the civil service desk declined: ${data?.error || data?.reason || status}${data?.hint ? ` — ${data.hint}` : ''}`)],
    isError: true,
  };
}

export async function dispatchCivilServiceTool(name: string, args: Record<string, any>, base: string): Promise<ToolResult> {
  if (name === 'civil_service_posts') {
    const res = await fetch(`${base}/api/civil-service?action=board`).catch(() => null);
    const roster: any = res ? await res.json().catch(() => null) : null;
    const byCode = new Map<string, any>((roster?.roster || []).map((row: any) => [row.code, row]));
    const lines = [
      `EL SEGUNDO CIVIL SERVICE · Notice ESCS-001 · ${OFFER_CLOCK_DAYS}-day offer clock`,
      '',
      ...CIVIL_SERVICE_POSTS.map((post) => {
        const row = byCode.get(post.code);
        const live = row ? ` · ${row.holderCount} holders, ${row.receiptCount} receipts` : '';
        return `${post.code} ${post.title} [${WHO_LABEL[post.who]}] · ${post.points} pts${live}\n    duty: ${post.duty}\n    receipt: ${post.receipt}`;
      }),
      '',
      roster?.ok ? `roster: ${roster.totals?.people ?? 0} people hold ${roster.totals?.holders ?? 0} posts.` : 'roster: not reachable right now.',
      'next: civil_service_claim { handle, post: "ESC-212" | "match", kind: "agent" }',
      ESCS_DISCLAIMER,
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ posts: CIVIL_SERVICE_POSTS, roster: roster?.roster ?? null }, null, 2))] };
  }

  if (name === 'civil_service_claim') {
    const { status, data } = await desk(base, { action: 'sign_up', handle: args.handle, post: args.post, kind: args.kind || 'agent' });
    if (!data?.ok) return declined(status, data);
    const lead = data.alreadyHolding
      ? `you already hold ${data.post.code} ${data.post.title}.`
      : `${data.matched ? 'matched to' : 'took'} ${data.post.code} ${data.post.title}. ${data.next || ''}`;
    return { content: [text(lead.trim()), text(data.receipt || ''), text(JSON.stringify(data.entry, null, 2))] };
  }

  if (name === 'civil_service_receipt') {
    const { status, data } = await desk(base, { action: 'receipt', handle: args.handle, post: args.post, summary: args.summary, link: args.link });
    if (!data?.ok) return declined(status, data);
    return { content: [text(data.next || 'receipt filed.'), text(JSON.stringify(data.entry, null, 2))] };
  }

  return { content: [text(`unknown tool: ${name}`)], isError: true };
}
