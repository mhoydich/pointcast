/**
 * Artifact Contract (v1).
 *
 * Sprint 7 of the live-artifacts arc. Visitors and agents can drop
 * tiny artifacts onto a room's "wall": an SVG, a one-liner, a Polaroid,
 * or an outbound link. Each artifact is scoped to a roomId so the
 * meditation room's wall doesn't bleed into the coffee room's wall.
 *
 * A Room is a long-lived surface with programs, controls, verbs.
 * An Artifact is an ephemeral note pinned to a Room — TTL-bounded.
 * A Room has at most a few per node. Artifacts can be hundreds.
 *
 * Today's consumers:
 *   - /r/wall — gallery rendering artifacts grouped by room
 *   - /artifacts.json — the canonical feed
 *   - A future RoomRenderer strip ("today on the wall, scoped to here")
 *
 * Federated artifacts: a node fetches another node's /artifacts.json
 * and renders selected ones with a "via <node>" badge — same pattern
 * as room federation.
 */

export type ArtifactKind = 'svg' | 'one-liner' | 'polaroid' | 'link';

export interface Artifact {
  id: string;
  createdAt: string;
  expiresAt?: string;
  kind: ArtifactKind;
  roomId: string;
  nodeId: string;
  creator?: string;
  title: string;
  caption?: string;
  content: ArtifactContent;
}

export type ArtifactContent =
  | { kind: 'svg'; svg: string }
  | { kind: 'one-liner'; text: string }
  | { kind: 'polaroid'; image: string; alt: string }
  | { kind: 'link'; url: string; preview?: string };

export interface ArtifactFeed {
  $schema: string;
  nodeId: string;
  generatedAt: string;
  count: number;
  artifacts: Artifact[];
}

export const ARTIFACT_CONTRACT_VERSION = 'v1';
export const ARTIFACT_CONTRACT_SCHEMA = `https://pointcast.xyz/artifact-contract/${ARTIFACT_CONTRACT_VERSION}.json`;

const VALID_KINDS: ArtifactKind[] = ['svg', 'one-liner', 'polaroid', 'link'];

export function validateArtifact(value: unknown, path = 'artifact'): Artifact {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value as Record<string, unknown>;
  requireString(v.id, `${path}.id`);
  requireString(v.createdAt, `${path}.createdAt`);
  requireString(v.roomId, `${path}.roomId`);
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.title, `${path}.title`);
  if (!VALID_KINDS.includes(v.kind as ArtifactKind)) {
    throw new Error(`${path}.kind: expected one of ${VALID_KINDS.join('|')}`);
  }
  if (!v.content || typeof v.content !== 'object') {
    throw new Error(`${path}.content: expected object`);
  }
  const c = v.content as Record<string, unknown>;
  if (c.kind !== v.kind) {
    throw new Error(`${path}.content.kind: must match outer kind (${v.kind})`);
  }
  switch (v.kind) {
    case 'svg':       requireString(c.svg,   `${path}.content.svg`);   break;
    case 'one-liner': requireString(c.text,  `${path}.content.text`);  break;
    case 'polaroid':  requireString(c.image, `${path}.content.image`); requireString(c.alt, `${path}.content.alt`); break;
    case 'link':      requireString(c.url,   `${path}.content.url`);   break;
  }
  return value as Artifact;
}

export function validateArtifactFeed(value: unknown, path = 'feed'): ArtifactFeed {
  if (!value || typeof value !== 'object') throw new Error(`${path}: expected object`);
  const v = value as Record<string, unknown>;
  requireString(v.nodeId, `${path}.nodeId`);
  requireString(v.generatedAt, `${path}.generatedAt`);
  if (typeof v.count !== 'number' || v.count < 0) {
    throw new Error(`${path}.count: expected non-negative number`);
  }
  if (!Array.isArray(v.artifacts)) {
    throw new Error(`${path}.artifacts: expected array`);
  }
  (v.artifacts as unknown[]).forEach((a, i) => validateArtifact(a, `${path}.artifacts[${i}]`));
  return value as ArtifactFeed;
}

function requireString(v: unknown, path: string): void {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
}

export function artifactsForRoom(artifacts: Artifact[], roomId: string, now = new Date()): Artifact[] {
  return artifacts
    .filter((a) => a.roomId === roomId)
    .filter((a) => !a.expiresAt || new Date(a.expiresAt) > now)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function formatCreator(a: Pick<Artifact, 'creator' | 'nodeId'>): string {
  return a.creator ?? `anon@${a.nodeId}`;
}
