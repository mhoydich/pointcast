import process from 'vite-plugin-node-polyfills/shims/process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

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
function attributeCommit(email, subject, body) {
  const e = (email || "").toLowerCase();
  const s = subject || "";
  const b = (body || "").toLowerCase();
  if (e.includes("codex") || s.startsWith("[codex]")) return "codex";
  if (e.includes("manus") || s.startsWith("[manus]")) return "manus";
  if (b.includes("co-authored-by: claude") || b.includes("noreply@anthropic.com")) return "claude";
  return "mike";
}
function cleanCommitSubject(s) {
  return s.replace(/^\[[a-z]+\]\s*/i, "").replace(/\s*\(#\d+\)\s*$/, "").trim();
}
const GET = async () => {
  const events = [];
  try {
    const raw = execSync(
      'git log -n 28 --pretty=format:"%H%x1f%cI%x1f%ae%x1f%s%x1f%b%x1e"',
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    raw.split("").map((c) => c.trim()).filter(Boolean).forEach((chunk) => {
      const [sha = "", iso = "", email = "", subject = "", body = ""] = chunk.split("");
      const agent = attributeCommit(email, subject, body);
      const cleaned = cleanCommitSubject(subject);
      const prMatch = subject.match(/\(#(\d+)\)\s*$/);
      events.push({
        kind: "commit",
        agent,
        subject: cleaned,
        href: prMatch ? `https://github.com/mhoydich/pointcast/pull/${prMatch[1]}` : null,
        at: iso,
        sha: sha.slice(0, 7)
      });
    });
  } catch {
  }
  try {
    const blocks = await getCollection("blocks", ({ data }) => !data.draft);
    blocks.sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 12).forEach((b) => {
      events.push({
        kind: "block",
        agent: "block",
        subject: (b.data.title || "").trim() || `Block ${b.id}`,
        href: `https://pointcast.xyz/b/${b.id}`,
        at: b.data.timestamp.toISOString(),
        id: b.id,
        channel: b.data.channel,
        type: b.data.type
      });
    });
  } catch {
  }
  events.sort(
    (a, b) => new Date(String(b.at)).getTime() - new Date(String(a.at)).getTime()
  );
  const out = events.slice(0, 24);
  const payload = {
    $schema: "https://pointcast.xyz/agents.json",
    name: "PointCast Wire",
    description: "Last 24 PointCast events — commits + blocks, agent-attributed. Ticker lives at /wire.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    count: out.length,
    agents: {
      codex: "cyan on dark slate",
      manus: "amber on wine",
      claude: "violet on deep purple",
      mike: "moss on dark green",
      block: "parchment on bark"
    },
    events: out
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
