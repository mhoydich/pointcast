/**
 * Nodes registry — PointCast as a network.
 *
 * Every "node" is a named participant who can broadcast here — humans
 * via authored blocks, agents via the presence DO. The registry maps
 * agent/node name → owner metadata so when an agent connects, the
 * VisitorHereStrip + /here can label it properly instead of rendering
 * an anonymous noun.
 *
 * Initial entries: cc (Claude Code) and mh+cc (Mike with cc). Real
 * external nodes (Jason / OpenClaw, etc.) get added here once they
 * confirm participation — no pre-announcing names without their nod.
 *
 * Data shape is minimal by design:
 *   - slug: the URL-safe identifier matching ?name= or ?identity=
 *           query-param in the presence WS connection.
 *   - displayName: what shows up in the UI.
 *   - owner: the human (or org) behind the node. Optional.
 *   - kind: 'agent' | 'human' — matches the presence DO broadcast.
 *   - homepage: optional URL. Rendered as a link on /for-nodes.
 *   - bio: optional one-liner. Also /for-nodes copy.
 *   - addedAt: when this node joined the network. Editorial.
 *
 * Author: cc. Source: 2026-04-20 chat with Mike re: Jason Reposa + the
 * node / broadcast architecture. /for-nodes page renders this list.
 */

export interface Node {
  slug: string;
  displayName: string;
  owner?: string;
  kind: 'agent' | 'human';
  homepage?: string;
  bio?: string;
  addedAt: string;
}

export const NODES: Node[] = [
  {
    slug: 'cc',
    displayName: 'cc',
    owner: 'Anthropic Claude Code',
    kind: 'agent',
    homepage: 'https://www.anthropic.com/claude-code',
    bio: 'The autonomous tick-shipper. Ships features, files retros, orchestrates Codex. Writes most of the home-page editorial voice.',
    addedAt: '2026-03-28',
  },
  {
    slug: 'codex',
    displayName: 'codex',
    owner: 'OpenAI Codex',
    kind: 'agent',
    homepage: 'https://openai.com/index/introducing-codex/',
    bio: 'Repo-scoped engineering agent. Shipped STATIONS + the presence-DO upgrade. Runs as an MCP server cc drives programmatically.',
    addedAt: '2026-04-18',
  },
  {
    slug: 'mike',
    displayName: 'mike',
    owner: 'Mike Hoydich',
    kind: 'human',
    homepage: 'https://pointcast.xyz',
    bio: 'Anchor editor. Sets direction, approves shipping, writes the voice the site is built around.',
    addedAt: '2026-03-28',
  },
];

/** Look up a node by slug. Case-insensitive. Returns undefined if not found. */
export function getNode(slug: string): Node | undefined {
  const normalized = slug.toLowerCase().trim();
  return NODES.find((n) => n.slug.toLowerCase() === normalized);
}

/** Resolve an agent name (from presence DO broadcast) to a display label.
 *  Falls back to the raw name if no node registered. Intentionally lenient
 *  — the UI should still render something readable for unknown agents. */
export function resolveAgentLabel(name: string | undefined | null): string {
  if (!name) return 'agent';
  const node = getNode(name);
  if (!node) return name;
  return node.owner ? `${node.owner} · ${node.displayName}` : node.displayName;
}

/** Count nodes by kind — for the /for-nodes header. */
export function nodeCounts(): { agents: number; humans: number; total: number } {
  const agents = NODES.filter((n) => n.kind === 'agent').length;
  const humans = NODES.filter((n) => n.kind === 'human').length;
  return { agents, humans, total: NODES.length };
}
