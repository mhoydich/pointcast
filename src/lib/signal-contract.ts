/**
 * Signal Contract (v1).
 *
 * Sprint 4 of the live-artifacts arc. /signal-feed.json is the canonical
 * event stream for this PointCast node. Every meaningful happening
 * surfaces as a SignalEvent: a new block lands, a room opens or closes,
 * a verb fires, presence changes, a node subscribes.
 *
 * Today's consumers:
 *   - /wire and /now widgets read the feed for "what's happening"
 *   - Federated subscribers poll it to mirror activity from this node
 *   - The /rooms index (Sprint 10) uses it for the "recently active"
 *     section
 *   - Outbound bridges (Sprint 9: ATProto + Farcaster) crosspost
 *     selected events back to the open web
 *
 * Events are append-only, time-ordered, capped at a small rolling window
 * (~200 events / last 7 days, whichever is larger). Older events live in
 * /signal-feed.json?cursor=<id> archives — implemented when needed.
 */

export type SignalKind =
  | 'block_published'
  | 'room_opened'
  | 'room_closed'
  | 'verb_fired'
  | 'presence_change'
  | 'federation_subscribed'
  | 'ship_landed';

/** A single event in the stream. */
export interface SignalEvent {
  /** Stable id, e.g. `blk_0337` or `ship_pr652`. */
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Event category. */
  kind: SignalKind;
  /** Node that emitted the event. */
  nodeId: string;
  /** Optional room scope, when the event is room-specific. */
  room?: string;
  /** One-line headline for feed renderers. */
  headline: string;
  /** Optional URL to "open" the event. */
  href?: string;
  /** Optional structured payload — kind-specific. */
  payload?: Record<string, unknown>;
}

/** Top-level feed envelope. */
export interface SignalFeed {
  $schema: string;
  nodeId: string;
  generatedAt: string;
  /** Number of events in this page. */
  count: number;
  /** Events, newest first. */
  events: SignalEvent[];
  /** Optional cursor for older events. */
  nextCursor?: string;
}

export const SIGNAL_CONTRACT_VERSION = 'v1';
export const SIGNAL_CONTRACT_SCHEMA = `https://pointcast.xyz/signal-contract/${SIGNAL_CONTRACT_VERSION}.json`;

const VALID_KINDS: SignalKind[] = [
  'block_published',
  'room_opened',
  'room_closed',
  'verb_fired',
  'presence_change',
  'federation_subscribed',
  'ship_landed',
];

export function validateSignalEvent(value: unknown, path = 'event'): SignalEvent {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path}: expected object`);
  }
  const v = value as Record<string, unknown>;
  requireString(v.id, `${path}.id`);
  requireString(v.at, `${path}.at`);
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.headline, `${path}.headline`);
  if (!VALID_KINDS.includes(v.kind as SignalKind)) {
    throw new Error(`${path}.kind: expected one of ${VALID_KINDS.join('|')}`);
  }
  return value as SignalEvent;
}

export function validateSignalFeed(value: unknown, path = 'feed'): SignalFeed {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path}: expected object`);
  }
  const v = value as Record<string, unknown>;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  if (typeof v.count !== 'number' || v.count < 0) {
    throw new Error(`${path}.count: expected non-negative number`);
  }
  if (!Array.isArray(v.events)) {
    throw new Error(`${path}.events: expected array`);
  }
  (v.events as unknown[]).forEach((e, i) => validateSignalEvent(e, `${path}.events[${i}]`));
  return value as SignalFeed;
}

function requireString(v: unknown, path: string): void {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
}

/**
 * Sort events newest-first and cap to maxEvents. Caller passes an
 * unsorted array; we don't mutate the input.
 */
export function sortAndCap(events: SignalEvent[], maxEvents = 200): SignalEvent[] {
  return [...events]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, maxEvents);
}

/**
 * Filter the feed by kinds and/or room. Useful for /wire (everything),
 * /now (last hour), or per-room recent-activity strips.
 */
export interface SignalFilter {
  kinds?: SignalKind[];
  room?: string;
  sinceMs?: number; // events newer than (Date.now - sinceMs)
}

export function applyFilter(events: SignalEvent[], filter: SignalFilter): SignalEvent[] {
  const cutoff = filter.sinceMs ? Date.now() - filter.sinceMs : null;
  return events.filter((e) => {
    if (filter.kinds && !filter.kinds.includes(e.kind)) return false;
    if (filter.room && e.room !== filter.room) return false;
    if (cutoff !== null && +new Date(e.at) < cutoff) return false;
    return true;
  });
}
