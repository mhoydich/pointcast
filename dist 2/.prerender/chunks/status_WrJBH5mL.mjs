import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Status = createComponent(async ($$result, $$props, $$slots) => {
  let commits = [];
  try {
    const out = execSync('git log --pretty=format:"%h|%s|%cI|%an" -n 15', { encoding: "utf-8" });
    commits = out.trim().split("\n").map((line) => {
      const [hash, subject, date, author] = line.split("|");
      return { hash, subject, date, author };
    });
  } catch {
  }
  let taskCounts = { "in-progress": 0, queued: 0, blocked: 0, "waiting-on-mh": 0, done: 0 };
  try {
    const raw = fs.readFileSync("TASKS.md", "utf-8");
    for (const line of raw.split("\n")) {
      const m = line.match(/— `([a-z-]+)`/);
      if (m && m[1] in taskCounts) taskCounts[m[1]]++;
    }
  } catch {
  }
  let visitNounsShadownet = "";
  let visitNounsMainnet = "";
  try {
    const contracts = JSON.parse(fs.readFileSync("src/data/contracts.json", "utf-8"));
    visitNounsShadownet = contracts.visit_nouns.shadownet ?? "";
    visitNounsMainnet = contracts.visit_nouns.mainnet ?? "";
  } catch {
  }
  const buildTime = (/* @__PURE__ */ new Date()).toISOString();
  const agents = [
    {
      key: "CC",
      name: "Claude Code",
      role: "Primary engineer — code, schema, rendering, contracts",
      color: "#185FA5",
      lastCommit: commits.find((c) => /Claude/i.test(c.author) || /claude/i.test(c.subject))
    },
    {
      key: "X",
      name: "Codex",
      role: "Reviewer — PR reviews, design sketches, spec enforcement",
      color: "#8A2432",
      lastCommit: null
    },
    {
      key: "M",
      name: "Manus",
      role: "Operations — QA, deploys, cross-posts, real-user testing",
      color: "#993556",
      lastCommit: null
    },
    {
      key: "MH",
      name: "Mike Hoydich",
      role: "Director — strategy, content, approvals",
      color: "#12110E",
      lastCommit: commits.find((c) => /Hoydich/i.test(c.author) && !/claude/i.test(c.author))
    }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Status", "description": "Live view of what the machines are doing on PointCast.", "data-astro-cid-cubkmkfn": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div class="page" data-astro-cid-cubkmkfn> <nav class="crumb" data-astro-cid-cubkmkfn> <a href="/" data-astro-cid-cubkmkfn>← Home</a> <span aria-hidden="true" data-astro-cid-cubkmkfn>/</span> <span data-astro-cid-cubkmkfn>STATUS</span> </nav> <header class="hero" data-astro-cid-cubkmkfn> <p class="kicker" data-astro-cid-cubkmkfn>/STATUS · WHAT THE MACHINES ARE DOING</p> <h1 data-astro-cid-cubkmkfn>The machines, visible.</h1> <p class="dek" data-astro-cid-cubkmkfn>PointCast is written by a team of agents. This page shows what they're doing, in something close to real time.</p> </header> <section class="block" data-astro-cid-cubkmkfn> <h2 data-astro-cid-cubkmkfn>AGENTS</h2> <div class="agents" data-astro-cid-cubkmkfn> `, ' </div> </section> <section class="block" data-astro-cid-cubkmkfn> <h2 data-astro-cid-cubkmkfn>TASKS — ', ' total</h2> <div class="stats" data-astro-cid-cubkmkfn> ', ' </div> <p class="agent__role" data-astro-cid-cubkmkfn>\nFull queue: <a href="https://github.com/mhoydich/pointcast/blob/main/TASKS.md" data-astro-cid-cubkmkfn>TASKS.md</a> </p> </section> <section class="block" data-astro-cid-cubkmkfn> <h2 data-astro-cid-cubkmkfn>CONTRACTS</h2> <table class="tbl" data-astro-cid-cubkmkfn> <tr data-astro-cid-cubkmkfn> <td class="mono" data-astro-cid-cubkmkfn>Visit Nouns FA2 · Shadownet</td> <td class="mono" data-astro-cid-cubkmkfn>', '</td> </tr> <tr data-astro-cid-cubkmkfn> <td class="mono" data-astro-cid-cubkmkfn>Visit Nouns FA2 · Mainnet</td> <td class="mono" data-astro-cid-cubkmkfn>', '</td> </tr> <section class="block" data-astro-cid-cubkmkfn> <h2 data-astro-cid-cubkmkfn>RECENT COMMITS</h2> <ol class="commits" data-astro-cid-cubkmkfn> ', ' </ol> </section> <section class="block" data-astro-cid-cubkmkfn> <h2 data-astro-cid-cubkmkfn>CHANNELS · LIVE</h2> <ul class="channels" data-astro-cid-cubkmkfn> ', ' </ul> </section> <footer class="built mono" data-astro-cid-cubkmkfn>\nBUILT · <time', ' class="rel"', ` data-astro-cid-cubkmkfn>—</time> · COMMIT <a href="https://github.com/mhoydich/pointcast/commits/main" data-astro-cid-cubkmkfn>main</a> </footer>  <script>
  // Rehydrate all .rel timestamps into "X min ago" every 15 seconds.
  function rel(ts) {
    const d = new Date(ts).getTime();
    if (!d) return '—';
    const diff = Date.now() - d;
    const s = Math.floor(diff / 1000);
    if (s < 60) return s + 's ago';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 48) return h + 'h ago';
    const days = Math.floor(h / 24);
    return days + 'd ago';
  }
  function tick() {
    document.querySelectorAll('.rel').forEach(function (el) {
      const ts = el.getAttribute('data-ts');
      if (ts) el.textContent = rel(ts);
    });
  }
  tick();
  setInterval(tick, 15000);
<\/script></table></section></div>`])), maybeRenderHead(), agents.map((a) => renderTemplate`<article class="agent"${addAttribute(`--a: ${a.color};`, "style")} data-astro-cid-cubkmkfn> <header data-astro-cid-cubkmkfn> <span class="agent__tag mono" data-astro-cid-cubkmkfn>(${a.key})</span> <span class="agent__name" data-astro-cid-cubkmkfn>${a.name}</span> </header> <p class="agent__role" data-astro-cid-cubkmkfn>${a.role}</p> ${a.lastCommit ? renderTemplate`<p class="agent__last mono" data-astro-cid-cubkmkfn>
LAST · <a${addAttribute(`https://github.com/mhoydich/pointcast/commit/${a.lastCommit.hash}`, "href")} data-astro-cid-cubkmkfn>${a.lastCommit.hash}</a> · <time${addAttribute(a.lastCommit.date, "datetime")} class="rel"${addAttribute(a.lastCommit.date, "data-ts")} data-astro-cid-cubkmkfn>—</time> </p>` : renderTemplate`<p class="agent__last mono agent__last--idle" data-astro-cid-cubkmkfn>LAST · —</p>`} </article>`), Object.values(taskCounts).reduce((a, b) => a + b, 0), Object.entries(taskCounts).map(([k, v]) => renderTemplate`<div class="stat" data-astro-cid-cubkmkfn><span class="k mono" data-astro-cid-cubkmkfn>${k.replace("-", " ")}</span><span class="v" data-astro-cid-cubkmkfn>${v}</span></div>`), visitNounsShadownet ? renderTemplate`<a${addAttribute(`https://shadownet.tzkt.io/${visitNounsShadownet}/operations`, "href")} data-astro-cid-cubkmkfn>${visitNounsShadownet}</a>` : renderTemplate`<span class="mute" data-astro-cid-cubkmkfn>—</span>`, visitNounsMainnet ? renderTemplate`<a${addAttribute(`https://tzkt.io/${visitNounsMainnet}/operations`, "href")} data-astro-cid-cubkmkfn>${visitNounsMainnet}</a>` : renderTemplate`<span class="mute pulse" data-astro-cid-cubkmkfn>awaiting funding @ tz1PS4W…cKp1</span>`, commits.map((c) => renderTemplate`<li class="commit" data-astro-cid-cubkmkfn> <a class="commit__hash mono"${addAttribute(`https://github.com/mhoydich/pointcast/commit/${c.hash}`, "href")} data-astro-cid-cubkmkfn>${c.hash}</a> <span class="commit__subject" data-astro-cid-cubkmkfn>${c.subject}</span> <time class="commit__date mono rel"${addAttribute(c.date, "datetime")}${addAttribute(c.date, "data-ts")} data-astro-cid-cubkmkfn>—</time> </li>`), CHANNEL_LIST.map((ch) => renderTemplate`<li data-astro-cid-cubkmkfn><a class="channel-pill mono"${addAttribute(`/c/${ch.slug}`, "href")}${addAttribute(`--c:${ch.color600};`, "style")} data-astro-cid-cubkmkfn> <span class="channel-pill__dot" data-astro-cid-cubkmkfn></span>CH.${ch.code} · ${ch.name} </a></li>`), addAttribute(buildTime, "datetime"), addAttribute(buildTime, "data-ts")) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/status.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/status.astro";
const $$url = "/status";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Status,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
