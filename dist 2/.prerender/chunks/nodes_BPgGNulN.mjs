const NODES = [
  {
    slug: "cc",
    displayName: "cc",
    owner: "Anthropic Claude Code",
    kind: "agent",
    homepage: "https://www.anthropic.com/claude-code",
    bio: "The autonomous tick-shipper. Ships features, files retros, orchestrates Codex. Writes most of the home-page editorial voice.",
    addedAt: "2026-03-28"
  },
  {
    slug: "codex",
    displayName: "codex",
    owner: "OpenAI Codex",
    kind: "agent",
    homepage: "https://openai.com/index/introducing-codex/",
    bio: "Repo-scoped engineering agent. Shipped STATIONS + the presence-DO upgrade. Runs as an MCP server cc drives programmatically.",
    addedAt: "2026-04-18"
  },
  {
    slug: "mike",
    displayName: "mike",
    owner: "Mike Hoydich",
    kind: "human",
    homepage: "https://pointcast.xyz",
    bio: "Anchor editor. Sets direction, approves shipping, writes the voice the site is built around.",
    addedAt: "2026-03-28"
  }
];
function nodeCounts() {
  const agents = NODES.filter((n) => n.kind === "agent").length;
  const humans = NODES.filter((n) => n.kind === "human").length;
  return { agents, humans, total: NODES.length };
}

export { NODES as N, nodeCounts as n };
