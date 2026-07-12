import process from 'vite-plugin-node-polyfills/shims/process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { R as RACE_REGISTRY, d as deriveStatus } from './races_BtvB86Iy.mjs';

function findRepoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  let dir = here;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}
const REPO_ROOT = findRepoRoot();
const AGENT_ORDER = ["claude", "codex", "manus", "mike"];
function attributeCommit(email, subject, body) {
  const e = (email || "").toLowerCase();
  const s = subject || "";
  const b = (body || "").toLowerCase();
  if (e.includes("codex") || s.startsWith("[codex]")) return "codex";
  if (e.includes("manus") || s.startsWith("[manus]")) return "manus";
  if (b.includes("co-authored-by: claude") || b.includes("noreply@anthropic.com")) return "claude";
  return "mike";
}
function mapBlockAuthor(a) {
  if (a === "codex") return "codex";
  if (a === "manus") return "manus";
  if (a === "mike" || a === "mh+cc") return "mike";
  return "claude";
}
const GET = async () => {
  const now = Date.now();
  let commits = [];
  try {
    const raw = execSync(
      'git log -n 200 --pretty=format:"%cI%x1f%ae%x1f%s%x1f%b%x1e"',
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    commits = raw.split("").map((c) => c.trim()).filter(Boolean).map((chunk) => {
      const [iso = "", email = "", subject = "", body = ""] = chunk.split("");
      const ms = Date.parse(iso);
      return Number.isFinite(ms) ? { ms, agent: attributeCommit(email, subject, body) } : null;
    }).filter((c) => c !== null);
  } catch {
    commits = [];
  }
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).map((b) => ({
    ms: b.data.timestamp.getTime(),
    agent: mapBlockAuthor(b.data.author)
  }));
  const WINDOWS = [
    { key: "1h", ms: 60 * 60 * 1e3 },
    { key: "24h", ms: 24 * 60 * 60 * 1e3 },
    { key: "7d", ms: 7 * 24 * 60 * 60 * 1e3 }
  ];
  const windows = WINDOWS.map((w) => {
    const cutoff = now - w.ms;
    const scores = {
      codex: { ships: 0, blocks: 0, total: 0 },
      manus: { ships: 0, blocks: 0, total: 0 },
      claude: { ships: 0, blocks: 0, total: 0 },
      mike: { ships: 0, blocks: 0, total: 0 }
    };
    for (const c of commits) if (c.ms >= cutoff) scores[c.agent].ships++;
    for (const b of blocks) if (b.ms >= cutoff) scores[b.agent].blocks++;
    AGENT_ORDER.forEach((a) => {
      scores[a].total = scores[a].ships + scores[a].blocks;
    });
    let leader = null;
    AGENT_ORDER.forEach((a) => {
      if (!leader || scores[a].total > leader.points) leader = { agent: a, points: scores[a].total };
    });
    return {
      window: w.key,
      cutoff: new Date(cutoff).toISOString(),
      scores,
      leader: leader && leader.points > 0 ? leader : null
    };
  });
  const races = RACE_REGISTRY.map((r) => ({
    slug: r.slug,
    title: r.title,
    channel: r.channel,
    mode: r.mode,
    status: deriveStatus(r),
    opensAt: r.opensAt,
    closesAt: r.closesAt,
    leaderboard: `/api/race/${r.slug}/leaderboard`,
    submit: `/api/race/${r.slug}/submit`
  }));
  const payload = {
    $schema: "https://pointcast.xyz/agents.json",
    name: "PointCast Scoreboard",
    description: "Cross-agent competition reporting. Per-agent ships (commits) + blocks across 1h/24h/7d. Race System registry + endpoints.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    agents: AGENT_ORDER,
    windows,
    races
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
