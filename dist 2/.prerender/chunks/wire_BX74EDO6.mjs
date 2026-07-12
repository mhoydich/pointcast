import process from 'vite-plugin-node-polyfills/shims/process';
import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Wire = createComponent(async ($$result, $$props, $$slots) => {
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
  const AGENT_LABEL = {
    codex: "Codex",
    manus: "Manus",
    claude: "Claude",
    mike: "Mike",
    block: "Block"
  };
  function relTime(iso) {
    const now2 = Date.now();
    const t = new Date(iso).getTime();
    const delta = Math.max(0, Math.floor((now2 - t) / 1e3));
    if (delta < 60) return `${delta}s`;
    if (delta < 3600) return `${Math.floor(delta / 60)}m`;
    if (delta < 86400) return `${Math.floor(delta / 3600)}h`;
    if (delta < 86400 * 7) return `${Math.floor(delta / 86400)}d`;
    return new Date(iso).toISOString().slice(0, 10);
  }
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
  let commits = [];
  try {
    const raw = execSync(
      'git log -n 28 --pretty=format:"%H%x1f%cI%x1f%ae%x1f%s%x1f%b%x1e"',
      { cwd: REPO_ROOT, encoding: "utf8" }
    );
    commits = raw.split("").map((c) => c.trim()).filter(Boolean).map((chunk) => {
      const [sha = "", iso = "", email = "", subject = "", body = ""] = chunk.split("");
      const agent = attributeCommit(email, subject, body);
      const cleaned = cleanCommitSubject(subject);
      const prMatch = subject.match(/\(#(\d+)\)\s*$/);
      const href = prMatch ? `https://github.com/mhoydich/pointcast/pull/${prMatch[1]}` : null;
      return {
        kind: "commit",
        agent,
        subject: cleaned.length > 96 ? cleaned.slice(0, 93) + "…" : cleaned,
        href,
        when: relTime(iso),
        iso,
        sha: sha.slice(0, 7)
      };
    });
  } catch {
    commits = [];
  }
  let blockEvents = [];
  try {
    const blocks = await getCollection("blocks", ({ data }) => !data.draft);
    blockEvents = blocks.sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()).slice(0, 12).map((b) => {
      const iso = b.data.timestamp.toISOString();
      const title2 = (b.data.title || "").trim() || `Block ${b.id}`;
      return {
        kind: "block",
        agent: "block",
        subject: title2.length > 96 ? title2.slice(0, 93) + "…" : title2,
        href: `/b/${b.id}`,
        when: relTime(iso),
        iso,
        id: b.id,
        channel: b.data.channel,
        type: b.data.type
      };
    });
  } catch {
    blockEvents = [];
  }
  const merged = [...commits, ...blockEvents].sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime()).slice(0, 24);
  const since = /* @__PURE__ */ new Date();
  since.setHours(0, 0, 0, 0);
  const agentCounts = { codex: 0, manus: 0, claude: 0, mike: 0, block: 0 };
  for (const e of merged) {
    if (new Date(e.iso).getTime() >= since.getTime()) agentCounts[e.agent]++;
  }
  const now = /* @__PURE__ */ new Date();
  const hour = now.getHours();
  function skyForHour(h) {
    if (h >= 5 && h < 7) return { bg: "linear-gradient(180deg,#1b1a2e 0%,#2a1e36 50%,#a35f3a 100%)", fg: "#fbe7c8", accent: "#f9a26c" };
    if (h >= 7 && h < 11) return { bg: "linear-gradient(180deg,#47345e 0%,#a35f3a 55%,#e9c79a 100%)", fg: "#2d1f08", accent: "#8a2432" };
    if (h >= 11 && h < 16) return { bg: "linear-gradient(180deg,#7e9ebf 0%,#bcd0e3 55%,#f2ecd8 100%)", fg: "#1e2a38", accent: "#2e5c8a" };
    if (h >= 16 && h < 19) return { bg: "linear-gradient(180deg,#3c2a4e 0%,#8a2432 55%,#f2a35f 100%)", fg: "#fff3dc", accent: "#ffd180" };
    if (h >= 19 && h < 22) return { bg: "linear-gradient(180deg,#121230 0%,#2b1d4a 55%,#4a2a5a 100%)", fg: "#e9d5ff", accent: "#a78bfa" };
    return { bg: "linear-gradient(180deg,#08090f 0%,#121230 70%,#1a1830 100%)", fg: "#e3e2f3", accent: "#67e8f9" };
  }
  const sky = skyForHour(hour);
  const title = "PointCast Wire";
  const description = "Live news-ticker of the last 24 PointCast events — commits, ships, blocks. Agent-attributed, hour-tinted, always on.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
  // Sprint 20: client-side refresh. Rebuild both marquee rows from
  // /wire.json on demand without a page reload. The build-time render
  // is the source of truth on first paint; this hydrates it with live
  // data if the user clicks refresh or leaves the tab open past build.
  (function () {
    'use strict';
    var btn = document.getElementById('wire-refresh-btn');
    var statusEl = document.getElementById('wire-refresh-status');
    var track = document.querySelector('.wire-track');
    if (!btn || !track) return;

    var AGENT_LABEL = {
      codex: 'Codex', manus: 'Manus', claude: 'Claude', mike: 'Mike', block: 'Block'
    };

    function relTime(iso) {
      var now = Date.now();
      var t = new Date(iso).getTime();
      var d = Math.max(0, Math.floor((now - t) / 1000));
      if (d < 60) return d + 's';
      if (d < 3600) return Math.floor(d / 60) + 'm';
      if (d < 86400) return Math.floor(d / 3600) + 'h';
      if (d < 86400 * 7) return Math.floor(d / 86400) + 'd';
      return new Date(iso).toISOString().slice(0, 10);
    }

    function chipMarkup(e) {
      var agent = e.agent in AGENT_LABEL ? e.agent : 'block';
      var label = AGENT_LABEL[agent];
      var subject = String(e.subject || '').slice(0, 96);
      var when = relTime(e.at || new Date().toISOString());
      var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
      }); };
      var inner =
        '<span class="wc__agent mono">' + esc(label) + '</span>' +
        '<span class="wc__subject">' + esc(subject) + '</span>' +
        '<span class="wc__when mono">' + esc(when) + '</span>';
      var kindCls = e.kind === 'block' ? 'wc--block' : 'wc--commit';
      if (e.href) {
        return '<li class="wc wc--' + agent + ' ' + kindCls + '">' +
          '<a href="' + esc(e.href) + '" class="wc__link">' + inner + '</a></li>';
      }
      return '<li class="wc wc--' + agent + ' ' + kindCls + '">' +
        '<div class="wc__link wc__link--static">' + inner + '</div></li>';
    }

    function rebuild(events) {
      // Replace both rows' HTML in one go. The CSS animation keyframes
      // reference \`50% - 7px\` which depends on content width — updating
      // both rows to the same list keeps the seamless loop intact.
      var rows = track.querySelectorAll('.wire-row');
      if (rows.length < 2) return;
      var html = events.map(chipMarkup).join('');
      rows[0].innerHTML = html;
      rows[1].innerHTML = html;
    }

    function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

    async function refresh() {
      if (btn.disabled) return;
      btn.disabled = true;
      setStatus('fetching…');
      try {
        var res = await fetch('/wire.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        var events = Array.isArray(data.events) ? data.events : [];
        if (events.length) rebuild(events);
        var gen = data.generatedAt ? new Date(data.generatedAt).toISOString().slice(11, 19) + ' UTC' : 'live';
        setStatus('refresh · ' + gen);
      } catch (e) {
        setStatus('refresh failed · retry');
      } finally {
        setTimeout(function () { btn.disabled = false; }, 1500);
      }
    }

    btn.addEventListener('click', refresh);
  })();
<\/script>`], ["", ` <script>
  // Sprint 20: client-side refresh. Rebuild both marquee rows from
  // /wire.json on demand without a page reload. The build-time render
  // is the source of truth on first paint; this hydrates it with live
  // data if the user clicks refresh or leaves the tab open past build.
  (function () {
    'use strict';
    var btn = document.getElementById('wire-refresh-btn');
    var statusEl = document.getElementById('wire-refresh-status');
    var track = document.querySelector('.wire-track');
    if (!btn || !track) return;

    var AGENT_LABEL = {
      codex: 'Codex', manus: 'Manus', claude: 'Claude', mike: 'Mike', block: 'Block'
    };

    function relTime(iso) {
      var now = Date.now();
      var t = new Date(iso).getTime();
      var d = Math.max(0, Math.floor((now - t) / 1000));
      if (d < 60) return d + 's';
      if (d < 3600) return Math.floor(d / 60) + 'm';
      if (d < 86400) return Math.floor(d / 3600) + 'h';
      if (d < 86400 * 7) return Math.floor(d / 86400) + 'd';
      return new Date(iso).toISOString().slice(0, 10);
    }

    function chipMarkup(e) {
      var agent = e.agent in AGENT_LABEL ? e.agent : 'block';
      var label = AGENT_LABEL[agent];
      var subject = String(e.subject || '').slice(0, 96);
      var when = relTime(e.at || new Date().toISOString());
      var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
      }); };
      var inner =
        '<span class="wc__agent mono">' + esc(label) + '</span>' +
        '<span class="wc__subject">' + esc(subject) + '</span>' +
        '<span class="wc__when mono">' + esc(when) + '</span>';
      var kindCls = e.kind === 'block' ? 'wc--block' : 'wc--commit';
      if (e.href) {
        return '<li class="wc wc--' + agent + ' ' + kindCls + '">' +
          '<a href="' + esc(e.href) + '" class="wc__link">' + inner + '</a></li>';
      }
      return '<li class="wc wc--' + agent + ' ' + kindCls + '">' +
        '<div class="wc__link wc__link--static">' + inner + '</div></li>';
    }

    function rebuild(events) {
      // Replace both rows' HTML in one go. The CSS animation keyframes
      // reference \\\`50% - 7px\\\` which depends on content width — updating
      // both rows to the same list keeps the seamless loop intact.
      var rows = track.querySelectorAll('.wire-row');
      if (rows.length < 2) return;
      var html = events.map(chipMarkup).join('');
      rows[0].innerHTML = html;
      rows[1].innerHTML = html;
    }

    function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

    async function refresh() {
      if (btn.disabled) return;
      btn.disabled = true;
      setStatus('fetching…');
      try {
        var res = await fetch('/wire.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        var events = Array.isArray(data.events) ? data.events : [];
        if (events.length) rebuild(events);
        var gen = data.generatedAt ? new Date(data.generatedAt).toISOString().slice(11, 19) + ' UTC' : 'live';
        setStatus('refresh · ' + gen);
      } catch (e) {
        setStatus('refresh failed · retry');
      } finally {
        setTimeout(function () { btn.disabled = false; }, 1500);
      }
    }

    btn.addEventListener('click', refresh);
  })();
<\/script>`])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "data-astro-cid-mtp74m5z": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="wire"${addAttribute(`--wire-bg:${sky.bg};--wire-fg:${sky.fg};--wire-accent:${sky.accent};`, "style")} data-astro-cid-mtp74m5z> <header class="wire-head" data-astro-cid-mtp74m5z> <p class="wire-head__kicker mono" data-astro-cid-mtp74m5z>POINTCAST · WIRE</p> <h1 class="wire-head__title" data-astro-cid-mtp74m5z>The last <span class="wire-head__count" data-astro-cid-mtp74m5z>${merged.length}</span> events.</h1> <p class="wire-head__dek" data-astro-cid-mtp74m5z>
Commits, ships, blocks. Agent-attributed. Right-to-left, always on.
<a class="wire-head__more" href="/status" data-astro-cid-mtp74m5z>full ledger at /status →</a> </p> </header> <!-- Active-tonight sidebar + marquee share a row on desktop. --> <div class="wire-stage" data-astro-cid-mtp74m5z> <aside class="wire-side" aria-label="Agents active since midnight" data-astro-cid-mtp74m5z> <p class="wire-side__head mono" data-astro-cid-mtp74m5z>ACTIVE · TONIGHT</p> <ul class="wire-side__list" data-astro-cid-mtp74m5z> ${["codex", "manus", "claude", "mike", "block"].map((a) => renderTemplate`<li${addAttribute(`ws ws--${a}`, "class")} data-astro-cid-mtp74m5z> <span class="ws__label mono" data-astro-cid-mtp74m5z>${AGENT_LABEL[a]}</span> <span class="ws__count mono" data-astro-cid-mtp74m5z>${agentCounts[a]}</span> </li>`)} </ul> <p class="wire-side__foot mono" data-astro-cid-mtp74m5z>
tint · ${hour.toString().padStart(2, "0")}:00 sky<br data-astro-cid-mtp74m5z> <span id="wire-refresh-status" data-astro-cid-mtp74m5z>refresh · build</span> </p> <button type="button" class="wire-side__refresh mono" id="wire-refresh-btn" aria-label="Refresh wire events from /wire.json" data-astro-cid-mtp74m5z>↺ refresh</button> </aside> <!-- The marquee itself — content is duplicated so the scroll loop is
           visually seamless; aria-hidden on the clone so screen readers only
           get one pass. --> <section class="wire-track" aria-label="Event ticker" data-astro-cid-mtp74m5z> ${merged.length === 0 ? renderTemplate`<p class="wire-empty mono" data-astro-cid-mtp74m5z>no events yet · the wire is warming up</p>` : renderTemplate`<div class="wire-rail" data-astro-cid-mtp74m5z> <ol class="wire-row" role="list" data-astro-cid-mtp74m5z> ${merged.map((e) => renderTemplate`<li${addAttribute(`wc wc--${e.agent} wc--${e.kind}`, "class")} data-astro-cid-mtp74m5z> ${e.href ? renderTemplate`<a${addAttribute(e.href, "href")} class="wc__link" data-astro-cid-mtp74m5z> <span class="wc__agent mono" data-astro-cid-mtp74m5z>${AGENT_LABEL[e.agent]}</span> <span class="wc__subject" data-astro-cid-mtp74m5z>${e.subject}</span> <span class="wc__when mono" data-astro-cid-mtp74m5z>${e.when}</span> </a>` : renderTemplate`<div class="wc__link wc__link--static" data-astro-cid-mtp74m5z> <span class="wc__agent mono" data-astro-cid-mtp74m5z>${AGENT_LABEL[e.agent]}</span> <span class="wc__subject" data-astro-cid-mtp74m5z>${e.subject}</span> <span class="wc__when mono" data-astro-cid-mtp74m5z>${e.when}</span> </div>`} </li>`)} </ol> <ol class="wire-row" role="list" aria-hidden="true" data-astro-cid-mtp74m5z> ${merged.map((e) => renderTemplate`<li${addAttribute(`wc wc--${e.agent} wc--${e.kind}`, "class")} data-astro-cid-mtp74m5z> <div class="wc__link wc__link--static" data-astro-cid-mtp74m5z> <span class="wc__agent mono" data-astro-cid-mtp74m5z>${AGENT_LABEL[e.agent]}</span> <span class="wc__subject" data-astro-cid-mtp74m5z>${e.subject}</span> <span class="wc__when mono" data-astro-cid-mtp74m5z>${e.when}</span> </div> </li>`)} </ol> </div>`} </section> </div> <footer class="wire-foot mono" data-astro-cid-mtp74m5z> <span data-astro-cid-mtp74m5z>/wire · generated at build</span> <span data-astro-cid-mtp74m5z>·</span> <a href="/wire.json" data-astro-cid-mtp74m5z>wire.json</a> <span data-astro-cid-mtp74m5z>·</span> <a href="/scoreboard" data-astro-cid-mtp74m5z>scoreboard</a> <span data-astro-cid-mtp74m5z>·</span> <a href="/gamgee" data-astro-cid-mtp74m5z>gamgee</a> <span data-astro-cid-mtp74m5z>·</span> <a href="/status" data-astro-cid-mtp74m5z>status</a> <span data-astro-cid-mtp74m5z>·</span> <a href="/" data-astro-cid-mtp74m5z>home</a> </footer> </main>  <div class="wire-scan" aria-hidden="true" data-astro-cid-mtp74m5z></div> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wire.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/wire.astro";
const $$url = "/wire";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Wire,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
