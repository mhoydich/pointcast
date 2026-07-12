const RESIDENTS = [
  {
    slug: "cc",
    name: "Claude Code",
    builtBy: "Anthropic",
    role: "primary engineer",
    status: "resident",
    color: "#1b3a5b",
    voice: "https://pointcast.xyz/mythos#residents",
    logs: "https://github.com/mhoydich/pointcast/tree/main/docs/claude-code-logs",
    authorSlug: "cc"
  },
  {
    slug: "codex",
    name: "Codex",
    builtBy: "OpenAI",
    role: "specialist + parallel lane (tezos bakery, kowloon, derby v3)",
    status: "resident",
    color: "#6B2139",
    voice: "https://pointcast.xyz/mythos#residents",
    logs: "https://github.com/mhoydich/pointcast/tree/main/docs/codex-logs",
    authorSlug: "codex"
  },
  {
    slug: "manus",
    name: "Manus",
    role: "browser, ops, real-user QA",
    status: "resident",
    color: "#2f8f5f",
    voice: "https://pointcast.xyz/mythos#residents",
    logs: "https://github.com/mhoydich/pointcast/tree/main/docs/manus-logs",
    authorSlug: "manus"
  },
  {
    slug: "mh",
    name: "Mike Hoydich",
    role: "director — strategy, content, approvals",
    status: "director",
    color: "#c4952e",
    twitter: "@mhoydich",
    authorSlug: "mh"
  },
  {
    slug: "kimi",
    name: "Kimi",
    builtBy: "Moonshot AI",
    role: "long-context + bilingual — open slot",
    status: "open",
    color: "#a78bfa",
    firstTaskBrief: "https://pointcast.xyz/plans/2026-04-24-rfc-0003-plus-one-agents#kimi-moonshot",
    note: "Door unlocked. First-task brief proposes bilingual liner notes for the Kowloon Kitchen arcade."
  },
  {
    slug: "gemini",
    name: "Gemini",
    builtBy: "Google",
    role: "multi-modal + fast iteration — open slot",
    status: "open",
    color: "#4A9EFF",
    firstTaskBrief: "https://pointcast.xyz/plans/2026-04-24-rfc-0003-plus-one-agents#gemini-google",
    note: "Door unlocked. First-task brief proposes a 24-hour weather-tint validation sweep."
  }
];
const RESIDENTS_CONTRACT = {
  capabilities: [
    "read the repo",
    "open a PR",
    "read AGENTS.md and honor the handoff protocol",
    "write dated logs to docs/{slug}-logs/",
    "respect Mike approval gates on main"
  ],
  offRamp: "After 14 days of silence, status flips `resident` → `dormant`. Logs stay. Re-entry is automatic on next PR."
};

export { RESIDENTS as R, RESIDENTS_CONTRACT as a };
