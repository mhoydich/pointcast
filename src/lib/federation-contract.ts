/**
 * Federation Contract (v1).
 *
 * Sprint 3 of the live-artifacts arc. A PointCast node advertises the
 * rooms it hosts via `/node.json`. Another node can subscribe to that
 * advertisement and render its rooms with attribution back to the source.
 *
 * Federation is what turns PointCast from "one website" into a webring
 * of broadcast nodes. A node fork (Sprint 8: `pointcast-template`) just
 * needs to expose `/node.json` in this shape to be discoverable.
 *
 * Self-federation: a node can list itself in `federatedFrom` to prove
 * the protocol works end-to-end with one node. That's how the demo at
 * /r/federation/demo runs.
 *
 * See docs/federation-contract.md.
 */

/** Top-level node descriptor. */
export interface NodeSpec {
  /** Pointer to the contract version. */
  $schema: string;
  /** Stable node id, e.g. "pointcast" or "house-of-still-hours". */
  id: string;
  /** Display name. */
  name: string;
  /** One-sentence description of this broadcast. */
  description: string;
  /** Canonical node URL. */
  home: string;
  /** ISO timestamp; consumers compare for staleness. */
  generatedAt: string;
  /** Rooms hosted on this node. */
  rooms: NodeRoom[];
  /** Other nodes this one subscribes to. */
  federatedFrom?: NodeRef[];
  /** Optional contact info for the node operator. */
  operator?: { handle: string; url?: string };
  /** Optional location string — informational only. */
  location?: string;
}

export interface NodeRoom {
  /** Matches the room's RoomSpec.id. */
  id: string;
  /** Room's display title. */
  title: string;
  /** Room URL on this node. */
  url: string;
  /** Room JSON contract URL on this node. */
  jsonUrl: string;
  /** Lifecycle state — informational, not enforced. */
  status?: 'open' | 'closed' | 'scheduled' | 'beta';
  /** RoomSpec.visualizer.type — lets index renderers preview the icon. */
  visualizer?: 'breath' | 'pour' | 'tap' | 'wave' | 'lantern';
  /** Optional preview card. */
  artifact?: { name: string; image: string };
}

export interface NodeRef {
  /** Remote node's id. */
  id: string;
  /** Remote node's canonical URL. */
  home: string;
  /** Remote node's `/node.json` URL — what the subscriber fetches. */
  nodeJsonUrl: string;
  /** Optional friendly name override for display. */
  label?: string;
}

export const FEDERATION_CONTRACT_VERSION = 'v1';
export const FEDERATION_CONTRACT_SCHEMA = `https://pointcast.xyz/federation-contract/${FEDERATION_CONTRACT_VERSION}.json`;

/**
 * Validate a NodeSpec at the boundary (fetch result, build-time check,
 * etc.). Throws on first violation with a pointer to the offending path.
 */
export function validateNodeSpec(value: unknown, path = 'node'): NodeSpec {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path}: expected object, got ${typeof value}`);
  }
  const v = value as Record<string, unknown>;

  requireString(v.id, `${path}.id`);
  requireString(v.name, `${path}.name`);
  requireString(v.description, `${path}.description`);
  requireString(v.home, `${path}.home`);
  requireString(v.generatedAt, `${path}.generatedAt`);

  requireArray(v.rooms, `${path}.rooms`);
  (v.rooms as unknown[]).forEach((r, i) => validateNodeRoom(r, `${path}.rooms[${i}]`));

  if (v.federatedFrom !== undefined) {
    requireArray(v.federatedFrom, `${path}.federatedFrom`);
    (v.federatedFrom as unknown[]).forEach((r, i) => validateNodeRef(r, `${path}.federatedFrom[${i}]`));
  }

  return value as NodeSpec;
}

function validateNodeRoom(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.title, `${path}.title`);
  requireString(o.url, `${path}.url`);
  requireString(o.jsonUrl, `${path}.jsonUrl`);
  if (o.status !== undefined && !['open', 'closed', 'scheduled', 'beta'].includes(o.status as string)) {
    throw new Error(`${path}.status: expected open|closed|scheduled|beta`);
  }
  if (o.visualizer !== undefined && !['breath', 'pour', 'tap', 'wave', 'lantern'].includes(o.visualizer as string)) {
    throw new Error(`${path}.visualizer: expected breath|pour|tap|wave|lantern`);
  }
}

function validateNodeRef(v: unknown, path: string): void {
  if (!v || typeof v !== 'object') throw new Error(`${path}: expected object`);
  const o = v as Record<string, unknown>;
  requireString(o.id, `${path}.id`);
  requireString(o.home, `${path}.home`);
  requireString(o.nodeJsonUrl, `${path}.nodeJsonUrl`);
}

function requireString(v: unknown, path: string): void {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
}

function requireArray(v: unknown, path: string): void {
  if (!Array.isArray(v)) {
    throw new Error(`${path}: expected array`);
  }
}

/**
 * Federation client — fetch a remote node.json, validate, return rooms
 * with the remote node ref attached for attribution. Throws on bad
 * payload so the caller can fall back to a placeholder card.
 *
 * Pass `fetch` (works in both Node and edge envs); pass `cache` to
 * memoize during SSG so repeated calls don't hammer the remote.
 */
export async function fetchFederatedNode(
  nodeJsonUrl: string,
  fetcher: typeof fetch = fetch,
  cache?: Map<string, NodeSpec>,
): Promise<NodeSpec> {
  if (cache?.has(nodeJsonUrl)) return cache.get(nodeJsonUrl)!;

  const res = await fetcher(nodeJsonUrl);
  if (!res.ok) {
    throw new Error(`federation: ${nodeJsonUrl} returned ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  const node = validateNodeSpec(json, `node[${nodeJsonUrl}]`);
  cache?.set(nodeJsonUrl, node);
  return node;
}

/**
 * Presence Contract (v1). Source-of-truth for "who is here" across
 * web + artifact + embed surfaces. Pulled by status badges in
 * RoomRenderer and by the index page.
 */

export interface PresenceSpec {
  $schema: string;
  /** Node this presence count belongs to. */
  nodeId: string;
  /** Room id if filtered by room; omitted means node-wide. */
  room?: string;
  humans: number;
  agents: number;
  total: number;
  /** Optional recent visitor sketches (anonymized). */
  recent?: PresenceVisitor[];
  generatedAt: string;
}

export interface PresenceVisitor {
  /** Anonymized session id. */
  id: string;
  kind: 'human' | 'agent';
  room?: string;
  arrivedAt: string;
  surface?: 'web' | 'artifact' | 'embed';
}

export const PRESENCE_CONTRACT_VERSION = 'v1';
export const PRESENCE_CONTRACT_SCHEMA = `https://pointcast.xyz/presence-contract/${PRESENCE_CONTRACT_VERSION}.json`;

export function validatePresenceSpec(value: unknown, path = 'presence'): PresenceSpec {
  if (!value || typeof value !== 'object') {
    throw new Error(`${path}: expected object, got ${typeof value}`);
  }
  const v = value as Record<string, unknown>;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  requireNumber(v.humans, `${path}.humans`);
  requireNumber(v.agents, `${path}.agents`);
  requireNumber(v.total, `${path}.total`);
  if (v.recent !== undefined) {
    requireArray(v.recent, `${path}.recent`);
  }
  return value as PresenceSpec;
}

function requireNumber(v: unknown, path: string): void {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new Error(`${path}: expected non-negative finite number`);
  }
}

/**
 * Format a presence record as the badge value used in /meditate's
 * status chyron: "1 humans · 0 agents". Handles pluralization-agnostic
 * Mike-voice ("1 humans" is intentional, not a typo).
 */
export function formatPresenceBadge(p: Pick<PresenceSpec, 'humans' | 'agents'>): string {
  return `${p.humans} humans · ${p.agents} agents`;
}
