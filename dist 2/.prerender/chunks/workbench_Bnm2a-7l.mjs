import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { n as nodeCounts, N as NODES } from './nodes_BPgGNulN.mjs';
import { C as COLLABORATORS, R as ROLE_LABEL } from './collaborators_9CJdrF6c.mjs';
import fs from 'node:fs';
import path from 'node:path';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Workbench = createComponent(($$result, $$props, $$slots) => {
  const repoRoot = path.resolve(".");
  const sprintsDir = path.join(repoRoot, "docs/sprints");
  const briefsDir = path.join(repoRoot, "docs/briefs");
  function safeRead(dir) {
    try {
      return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().reverse();
    } catch {
      return [];
    }
  }
  function titleFrom(md, fallback) {
    const m1 = md.match(/^#\s+(.+)$/m);
    if (m1) return m1[1].trim().slice(0, 140);
    return fallback;
  }
  function kindFrom(slug) {
    if (slug.includes("-codex-")) return "codex";
    if (slug.includes("-manus-")) return "manus";
    return "other";
  }
  const sprintFiles = safeRead(sprintsDir).slice(0, 12);
  const sprints = sprintFiles.map((slug) => {
    const full = path.join(sprintsDir, slug);
    const stat = fs.statSync(full);
    const raw = fs.readFileSync(full, "utf8");
    const date = slug.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
    return {
      slug: slug.replace(/\.md$/, ""),
      date,
      title: titleFrom(raw, slug),
      size: stat.size
    };
  });
  const briefFiles = safeRead(briefsDir);
  const briefs = briefFiles.map((slug) => {
    const raw = fs.readFileSync(path.join(briefsDir, slug), "utf8");
    return {
      slug: slug.replace(/\.md$/, ""),
      kind: kindFrom(slug),
      title: titleFrom(raw, slug)
    };
  }).filter((b) => b.kind !== "other");
  const codexBriefs = briefs.filter((b) => b.kind === "codex");
  const manusBriefs = briefs.filter((b) => b.kind === "manus");
  const counts = nodeCounts();
  const shippedToday = sprints.filter((s) => s.date === (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) || s.date === "2026-04-19" || s.date === "2026-04-20").length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/workbench",
    name: "PointCast — workbench",
    description: "Cross-agent activity dashboard. Who is building what, what is queued, where to dig in.",
    url: "https://pointcast.xyz/workbench"
  };
  return renderTemplate(_a || (_a = __template(["", " <script>\n  // Hydrate live-count from the presence snapshot.\n  fetch('/api/presence/snapshot', { cache: 'no-store' })\n    .then(function (r) { return r.ok ? r.json() : null; })\n    .then(function (j) {\n      if (!j) return;\n      var total = (j.humans || 0) + (j.agents || 0);\n      var el = document.getElementById('wb-live');\n      if (el) el.textContent = String(Math.max(total, 1));\n    })\n    .catch(function () { /* ignore — static value stays */ });\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Workbench", "description": "Cross-agent activity dashboard — who's building what, right now.", "jsonLd": jsonLd, "data-astro-cid-nldvb3f7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-nldvb3f7> <nav class="crumb mono" data-astro-cid-nldvb3f7> <a href="/" data-astro-cid-nldvb3f7>← Home</a> <span aria-hidden="true" data-astro-cid-nldvb3f7>·</span> <a href="/here" data-astro-cid-nldvb3f7>/here</a> <span aria-hidden="true" data-astro-cid-nldvb3f7>·</span> <a href="/for-nodes" data-astro-cid-nldvb3f7>/for-nodes</a> <span aria-hidden="true" data-astro-cid-nldvb3f7>·</span> <a href="/sprints" data-astro-cid-nldvb3f7>/sprints</a> </nav> <header class="head" data-astro-cid-nldvb3f7> <p class="kicker mono" data-astro-cid-nldvb3f7>WORKBENCH · CROSS-AGENT DASHBOARD</p> <h1 class="title" data-astro-cid-nldvb3f7>Who's building what.</h1> <p class="dek" data-astro-cid-nldvb3f7>
PointCast is a small, real project run by four identities —
        Mike anchoring, cc orchestrating + shipping, Codex engineering,
        Manus doing ops. This page is one glance at what each is doing
        right now, what's queued, and where to dig in.
</p> </header> <section class="stats" aria-label="Headline stats" data-astro-cid-nldvb3f7> <div class="stat" data-astro-cid-nldvb3f7><p class="stat__n mono" id="wb-live" data-astro-cid-nldvb3f7>1</p><p class="stat__l mono" data-astro-cid-nldvb3f7>HERE NOW</p></div> <div class="stat" data-astro-cid-nldvb3f7><p class="stat__n mono" data-astro-cid-nldvb3f7>${shippedToday}</p><p class="stat__l mono" data-astro-cid-nldvb3f7>RECENT SHIPS</p></div> <div class="stat" data-astro-cid-nldvb3f7><p class="stat__n mono" data-astro-cid-nldvb3f7>${codexBriefs.length}</p><p class="stat__l mono" data-astro-cid-nldvb3f7>CODEX QUEUE</p></div> <div class="stat" data-astro-cid-nldvb3f7><p class="stat__n mono" data-astro-cid-nldvb3f7>${manusBriefs.length}</p><p class="stat__l mono" data-astro-cid-nldvb3f7>MANUS QUEUE</p></div> <div class="stat" data-astro-cid-nldvb3f7><p class="stat__n mono" data-astro-cid-nldvb3f7>${counts.total}</p><p class="stat__l mono" data-astro-cid-nldvb3f7>NODES</p></div> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>LIVE · WHO'S CONNECTED</p> <p class="panel__intro" data-astro-cid-nldvb3f7>
Real-time view of visitors currently broadcasting presence —
        humans, wallets, agents. Updated live via the
<a href="/api/presence/snapshot" data-astro-cid-nldvb3f7>presence DO</a>.
</p> <p class="panel__cta" data-astro-cid-nldvb3f7> <a class="btn" href="/here" data-astro-cid-nldvb3f7>open /here →</a> </p> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>CODEX QUEUE · ${codexBriefs.length} BRIEFS</p> <p class="panel__intro" data-astro-cid-nldvb3f7>
Filed by cc. Executed by Codex via MCP. Each brief ships
        atomically (one file per MCP turn, ~60s ceiling). Status
        reflects current disk state — shipped briefs move to /sprints.
</p> <ul class="brief-list" data-astro-cid-nldvb3f7> ${codexBriefs.map((b) => renderTemplate`<li class="brief" data-astro-cid-nldvb3f7> <p class="brief__title" data-astro-cid-nldvb3f7>${b.title}</p> <p class="brief__meta mono" data-astro-cid-nldvb3f7>${b.slug}</p> </li>`)} </ul> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>MANUS QUEUE · ${manusBriefs.length} BRIEFS</p> <p class="panel__intro" data-astro-cid-nldvb3f7>
Filed by cc. Executed by Manus (Mike dispatches from Manus chat).
        Ops-facing — platform matrix, email routing, launch-day checklist.
</p> <ul class="brief-list" data-astro-cid-nldvb3f7> ${manusBriefs.map((b) => renderTemplate`<li class="brief" data-astro-cid-nldvb3f7> <p class="brief__title" data-astro-cid-nldvb3f7>${b.title}</p> <p class="brief__meta mono" data-astro-cid-nldvb3f7>${b.slug}</p> </li>`)} </ul> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>RECENT SHIPS · 12 MOST RECENT</p> <p class="panel__intro" data-astro-cid-nldvb3f7>
Every cc tick (cron-fired or chat-fired) writes a retro at
<code data-astro-cid-nldvb3f7>docs/sprints/&lt;slug&gt;.md</code>. This shows the last
        12; the full log is at <a href="/sprints" data-astro-cid-nldvb3f7>/sprints</a>.
</p> <ul class="sprint-list" data-astro-cid-nldvb3f7> ${sprints.map((s) => renderTemplate`<li class="sprint" data-astro-cid-nldvb3f7> <p class="sprint__date mono" data-astro-cid-nldvb3f7>${s.date}</p> <p class="sprint__title" data-astro-cid-nldvb3f7>${s.title.replace(/^(cron tick —|chat tick —|.*tick — )/, "")}</p> </li>`)} </ul> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>NODES · ${counts.total} REGISTERED · ${counts.agents} AGENTS · ${counts.humans} HUMANS</p> <ul class="node-list" data-astro-cid-nldvb3f7> ${NODES.map((n) => renderTemplate`<li class="node" data-astro-cid-nldvb3f7> <p class="node__head" data-astro-cid-nldvb3f7> <span class="node__slug mono" data-astro-cid-nldvb3f7>/${n.slug}</span> <span class="node__kind mono" data-astro-cid-nldvb3f7>· ${n.kind}</span> </p> <p class="node__name" data-astro-cid-nldvb3f7><strong data-astro-cid-nldvb3f7>${n.displayName}</strong>${n.owner && renderTemplate`<span class="node__owner" data-astro-cid-nldvb3f7> · ${n.owner}</span>`}</p> </li>`)} </ul> <p class="panel__cta" data-astro-cid-nldvb3f7> <a class="btn" href="/for-nodes" data-astro-cid-nldvb3f7>+ become node #${counts.total + 1} →</a> </p> </section> <section class="panel" data-astro-cid-nldvb3f7> <p class="panel__kicker mono" data-astro-cid-nldvb3f7>COLLABORATORS · ${COLLABORATORS.length}</p> <ul class="collab-strip" data-astro-cid-nldvb3f7> ${COLLABORATORS.map((c) => renderTemplate`<li class="collab-chip mono" data-astro-cid-nldvb3f7> ${c.name} · ${ROLE_LABEL[c.role]} </li>`)} </ul> <p class="panel__cta" data-astro-cid-nldvb3f7> <a class="btn" href="/collabs" data-astro-cid-nldvb3f7>/collabs →</a> </p> </section> <aside class="agent-strip" data-astro-cid-nldvb3f7> <p class="agent-strip__label mono" data-astro-cid-nldvb3f7>MACHINE-READABLE</p> <ul data-astro-cid-nldvb3f7> <li data-astro-cid-nldvb3f7><a href="/sprints.json" data-astro-cid-nldvb3f7>/sprints.json</a></li> <li data-astro-cid-nldvb3f7><a href="/collabs.json" data-astro-cid-nldvb3f7>/collabs.json</a></li> <li data-astro-cid-nldvb3f7><a href="/api/presence/snapshot" data-astro-cid-nldvb3f7>/api/presence/snapshot</a></li> <li data-astro-cid-nldvb3f7><a href="/agents.json" data-astro-cid-nldvb3f7>/agents.json</a></li> </ul> </aside> </div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/workbench.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/workbench.astro";
const $$url = "/workbench";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Workbench,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
