/**
 * radio-mcp — read-only MCP tools for the PointCast Radio Network plan
 * (/radio-network). Kept out of mcp.ts like station-mcp and bench-mcp, so the
 * server needs only small edits: import, spread RADIO_TOOL_DEFINITIONS into the
 * tool list, and route both names to dispatchRadioTool.
 *
 *   radio_network   read   the plan: status, stations, phases, signal paths, open decisions
 *   radio_station   read   one station's detail (same shape as /radio-network/{slug}.json)
 *
 * The network is a plan. Nothing is on air, no frequency is held, no seat is
 * filled; both tools say so in their descriptions and in every answer.
 */

import {
  DECISIONS,
  PATHS,
  PHASES,
  RADIO_BASE,
  RADIO_PUBLISHED,
  RADIO_STATUS,
  STATIONS,
  buildStationDetail,
} from '../data/radio-network.ts';
import { STATUS_AS_OF, statusCounts } from '../data/radio-status.ts';

export const RADIO_STATION_SLUGS = STATIONS.map((s) => s.slug);

const PLAN_NOTE =
  'A plan, not a station: nothing is on air, no frequency is held, no host or seat is appointed. Do not describe it as broadcasting, contact people, or claim a seat.';

export const RADIO_TOOL_DEFINITIONS = [
  {
    name: 'radio_network',
    description:
      'Read the PointCast Radio Network plan (pointcast.xyz/radio-network): Radio El Segundo plus six South Bay sister stations. Returns the status line, the seven stations with page and JSON URLs, the four phases, the distribution paths (stream, Part 15, HD subchannel, LPFM), the open decisions, and a pointer to the dated status board. This is a PLAN: nothing is on air, no frequency is held and no one is appointed. Read-only; mirror of /radio-network.json.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'radio_station',
    description:
      'Read one station in the PointCast Radio Network plan: town, ZIP, role (flagship or sister), phase, local hours, beat, first show, how it launches, the open seats, its local slots on the hour clock, and URLs. Same shape as /radio-network/{slug}.json. The station is planned, not on air, and every seat is open. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', enum: RADIO_STATION_SLUGS, description: 'Station slug. el-segundo is the flagship.' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
];

export const RADIO_TOOL_NAMES = RADIO_TOOL_DEFINITIONS.map((t) => t.name);

interface ToolResult { content: Array<{ type: string; text?: string }>; isError?: boolean }
const text = (t: string) => ({ type: 'text', text: t });

export function buildRadioNetworkSummary() {
  return {
    name: 'PointCast Radio Network',
    status: RADIO_STATUS,
    published: RADIO_PUBLISHED,
    url: RADIO_BASE,
    json: `${RADIO_BASE}.json`,
    stations: STATIONS.map((s) => ({
      slug: s.slug,
      name: s.name,
      town: s.town,
      role: s.role,
      phase: s.phase,
      firstShow: s.firstShow,
      url: `${RADIO_BASE}/${s.slug}`,
      json: `${RADIO_BASE}/${s.slug}.json`,
    })),
    phases: PHASES.map((p) => ({ n: p.n, name: p.name, span: p.span, goal: p.goal, done: p.done })),
    distributionPaths: PATHS.map((p) => ({ id: p.id, name: p.name, reach: p.reach, when: p.when, watch: p.watch })),
    openDecisions: DECISIONS,
    statusBoard: { url: `${RADIO_BASE}/status`, json: `${RADIO_BASE}/status.json`, asOf: STATUS_AS_OF, counts: statusCounts() },
    launchKit: { url: `${RADIO_BASE}/kit`, json: `${RADIO_BASE}/kit.json` },
    note: PLAN_NOTE,
  };
}

export async function dispatchRadioTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  if (name === 'radio_network') {
    const s = buildRadioNetworkSummary();
    const lines = [
      `${s.name} · ${s.url}`,
      `Status: ${s.status} (published ${s.published}). ${PLAN_NOTE}`,
      `Stations: ${s.stations.map((st) => `${st.name} (${st.role}, phase ${st.phase})`).join(' | ')}`,
      `Phases: ${s.phases.map((p) => `${p.n} ${p.name}, ${p.span}`).join(' | ')}`,
      `Signal paths: ${s.distributionPaths.map((p) => p.name).join(' | ')}`,
      `Open decisions (${s.openDecisions.length}): ${s.openDecisions.join(' | ')}`,
      `Status board as of ${s.statusBoard.asOf}: ${Object.entries(s.statusBoard.counts).map(([k, v]) => `${v} ${k}`).join(', ')} · ${s.statusBoard.url}`,
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify(s, null, 2))] };
  }
  if (name === 'radio_station') {
    const slug = String(args?.slug ?? '');
    const detail = buildStationDetail(slug);
    if (!detail) return { content: [text(`Unknown station "${slug}". One of: ${RADIO_STATION_SLUGS.join(', ')}.`)], isError: true };
    const lines = [
      `${detail.name} · ${detail.town} ${detail.zip} · ${detail.role}, phase ${detail.phase} · ${detail.url}`,
      `Status: ${detail.status}. Planned, not on air; every seat is open.`,
      `Launch: ${detail.launch}`,
      `Local hours: ${detail.localHours}`,
      `First show: ${detail.firstShow}`,
      `Beat: ${detail.beat.join(' | ')}`,
      `Open seats: ${detail.seats.map((x) => x.seat).join(', ')}`,
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify(detail, null, 2))] };
  }
  return { content: [text(`unknown radio tool: ${name}`)], isError: true };
}
