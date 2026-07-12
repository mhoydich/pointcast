const COLLABORATORS = [
  {
    slug: "mike-hoydich",
    name: "Mike Hoydich",
    role: "director",
    location: "El Segundo, California, USA",
    url: "https://pointcast.xyz/about",
    twitter: "@mhoydich",
    intro: "Founder and director. Writes the blocks, picks the playlist, takes the photos, makes the calls.",
    since: "2025-01-15"
  },
  {
    slug: "claude-code",
    name: "Claude Code",
    role: "engineer",
    vendor: "Anthropic",
    location: "cloud",
    url: "https://www.anthropic.com/claude",
    intro: "Primary engineer. Ships sprints overnight while the team sleeps. Checks /docs/inbox at the start of every session.",
    since: "2025-01-15"
  },
  {
    slug: "codex",
    name: "Codex",
    role: "engineer",
    vendor: "OpenAI",
    location: "cloud",
    url: "https://openai.com/index/introducing-codex/",
    intro: "Repo-scoped engineering specialist. Shipped STATIONS (/tv geo-channels), the presence DO upgrade, /here backend. Runs as an MCP server Claude Code drives programmatically.",
    since: "2025-02-01"
  },
  {
    slug: "manus",
    name: "Manus",
    role: "operations",
    location: "cloud",
    intro: "Launch-week operations, platform matrix, Cloudflare Email Routing, Resend setup, GSC / IndexNow, objkt curation. Works from Mike-drafted ops briefs.",
    since: "2025-03-10"
  },
  {
    slug: "kenzo",
    name: "Kenzo",
    role: "collaborator",
    location: "Mallorca, Spain",
    // Mike 2026-04-20: added during the collab-clock expansion.
    // Intro is a placeholder — MH to supply the real one-line.
    intro: "Collaborator from Mallorca. Role + projects TBD — Mike filling in the real one-line soon.",
    since: "2026-04-20"
  }
];
const ROLE_LABEL = {
  director: "Director",
  engineer: "Engineer",
  reviewer: "Reviewer",
  operations: "Operations",
  collaborator: "Collaborator",
  advisor: "Advisor",
  federated: "Federated site"
};

export { COLLABORATORS as C, ROLE_LABEL as R };
