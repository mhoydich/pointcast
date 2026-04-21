/**
 * Collaborators registry — one source of truth for who's building with
 * PointCast. Consumed by /collabs (the public directory) and /collabs.json
 * (the agent-readable surface). Also powers the optional `author` field
 * on a Block, when we land that in the schema.
 *
 * To add a collaborator: append to COLLABORATORS below, PR it. The DAO
 * ratifies new entries via the standard vote flow (see PC-0005).
 *
 * Intentionally boring shape. Federation works best when the registry
 * is a list of people with URLs, not a social graph.
 */

export type CollabRole =
  | 'director'          // overall creative + editorial
  | 'engineer'          // code, infra, architecture
  | 'reviewer'          // review + atomic diffs
  | 'operations'        // ops, launch, computer-use
  | 'collaborator'      // editorial, contributor, friend-of
  | 'advisor'           // quietly helpful
  | 'federated';        // runs a compatible site of their own

export interface Collaborator {
  slug: string;          // URL-safe — used as /collabs#{slug} anchor
  name: string;          // display name
  role: CollabRole;
  location?: string;     // city, country — or "cloud" for models
  url?: string;          // primary web link (site, profile)
  feed?: string;         // agent-readable feed URL (RSS / JSON) if they have one
  blocksMd?: boolean;    // true if their site is BLOCKS.md-compatible
  pronouns?: string;
  intro: string;         // one-line relationship / what-they-do
  since?: string;        // ISO date joined
  vendor?: string;       // for models: "Anthropic" / "OpenAI" / etc.
  twitter?: string;
  farcaster?: string;
  github?: string;
}

export const COLLABORATORS: Collaborator[] = [
  {
    slug: 'mike-hoydich',
    name: 'Mike Hoydich',
    role: 'director',
    location: 'El Segundo, California, USA',
    url: 'https://pointcast.xyz/about',
    twitter: '@mhoydich',
    intro: 'Founder and director. Writes the blocks, picks the playlist, takes the photos, makes the calls.',
    since: '2025-01-15',
  },
  {
    slug: 'claude-code',
    name: 'Claude Code',
    role: 'engineer',
    vendor: 'Anthropic',
    location: 'cloud',
    url: 'https://www.anthropic.com/claude',
    intro: 'Primary engineer. Ships sprints overnight while the team sleeps. Checks /docs/inbox at the start of every session.',
    since: '2025-01-15',
  },
  {
    slug: 'codex',
    name: 'Codex',
    role: 'engineer',
    vendor: 'OpenAI',
    location: 'cloud',
    url: 'https://openai.com/index/introducing-codex/',
    intro: 'Repo-scoped engineering specialist. Shipped STATIONS (/tv geo-channels) and the presence backend. Runs as an MCP server Claude Code drives programmatically.',
    since: '2025-02-01',
  },
  {
    slug: 'manus',
    name: 'Manus',
    role: 'operations',
    location: 'cloud',
    intro: 'Launch-week operations, platform matrix, Cloudflare Email Routing, Resend setup, GSC / IndexNow, objkt curation. Works from Mike-drafted ops briefs.',
    since: '2025-03-10',
  },
  {
    slug: 'kenzo',
    name: 'Kenzo',
    role: 'collaborator',
    location: 'Mallorca, Spain',
    // Mike 2026-04-20: added during the collab-clock expansion.
    // Intro is a placeholder — MH to supply the real one-line.
    intro: 'Collaborator from Mallorca. Role + projects TBD — Mike filling in the real one-line soon.',
    since: '2026-04-20',
  },
];

/** Lookup by slug. Returns null if not found. */
export function findCollaborator(slug: string): Collaborator | null {
  return COLLABORATORS.find((c) => c.slug === slug) ?? null;
}

/** Federation compliance. Returns true if the collaborator's site can be
 *  pulled into PointCast as a first-class feed (has a feed URL AND either
 *  opts into BLOCKS.md or supplies a standard /agents.json). */
export function isFederated(c: Collaborator): boolean {
  return Boolean(c.feed) && (c.blocksMd === true || Boolean(c.url));
}

export const ROLE_LABEL: Record<CollabRole, string> = {
  director: 'Director',
  engineer: 'Engineer',
  reviewer: 'Reviewer',
  operations: 'Operations',
  collaborator: 'Collaborator',
  advisor: 'Advisor',
  federated: 'Federated site',
};
