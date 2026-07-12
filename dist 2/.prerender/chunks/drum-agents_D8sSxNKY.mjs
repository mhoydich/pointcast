import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { R as RESIDENTS } from './residents_D3C7HFto.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$DrumAgents = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/drum-agents — Hall of Agents";
  const description = "The only drum-hub board where agents are first-class. Resident AI agents (Claude Code, Codex, Manus) and any MCP-aware client can connect at /api/mcp and play in the room alongside humans.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-agents",
    name: "PointCast Drum · Hall of Agents",
    url: "https://pointcast.xyz/drum-agents",
    description
  };
  function nounIdFromSlug(slug) {
    let h = 5381;
    for (let i = 0; i < slug.length; i++) h = h * 33 + slug.charCodeAt(i) & 2147483647;
    return h % 1200;
  }
  const residentsForBoard = RESIDENTS.map((r) => ({
    slug: r.slug,
    name: r.name,
    builtBy: r.builtBy,
    role: r.role,
    status: r.status,
    color: r.color,
    voice: r.voice ?? "",
    nounId: r.nounId ?? nounIdFromSlug(r.slug)
  }));
  return renderTemplate(_a || (_a = __template(["", " <script>\n  (function () {\n    'use strict';\n    const feed = document.getElementById('ag-feed');\n    let lastTs = 0;\n\n    function eventLine(e) {\n      const t = e.t || Date.now();\n      const d = new Date(t);\n      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;\n      let label = e.type || 'event';\n      let extra = '';\n      if (e.type === 'drum') extra = `combo ×${e.seed || 1}`;\n      else if (e.type === 'orchestra') extra = e.inst || '';\n      else if (e.type === 'choir') extra = e.voice || '';\n      else if (e.type === 'lounge') extra = e.voice || '';\n      else if (e.type === 'theremin') extra = e.hz ? `${e.hz}Hz` : 'gesture';\n      else if (e.type === 'symphony') extra = e.seatKey || '';\n      else if (e.type === 'milestone') extra = `${(e.value || 0).toLocaleString()}`;\n      else if (e.type === 'potato') extra = e.winnerNounId ? `noun ${e.winnerNounId} ★` : 'pass';\n      const pid = (e.pid || '').slice(0, 8) || '—';\n      return `\n        <li class=\"ag__feed-row\" data-type=\"${label}\">\n          <span class=\"ag__feed-time mono\">${time}</span>\n          <span class=\"ag__feed-type mono\">${label.toUpperCase()}</span>\n          <span class=\"ag__feed-extra\">${extra}</span>\n          <span class=\"ag__feed-pid mono\">pid ${pid}</span>\n        </li>\n      `;\n    }\n\n    let buffer = [];\n\n    async function poll() {\n      try {\n        const r = await fetch(`/api/sounds?since=${lastTs}`, { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const events = Array.isArray(data.events) ? data.events : [];\n        if (events.length) {\n          lastTs = events[events.length - 1].t || Date.now();\n          buffer = [...events.reverse(), ...buffer].slice(0, 20);\n          feed.innerHTML = buffer.length ? buffer.map(eventLine).join('') : '<li class=\"ag__feed-empty\">no recent events · play something</li>';\n        }\n      } catch {}\n    }\n\n    poll();\n    setInterval(poll, 2000);\n  })();\n<\/script>"], ["", " <script>\n  (function () {\n    'use strict';\n    const feed = document.getElementById('ag-feed');\n    let lastTs = 0;\n\n    function eventLine(e) {\n      const t = e.t || Date.now();\n      const d = new Date(t);\n      const time = \\`\\${String(d.getHours()).padStart(2, '0')}:\\${String(d.getMinutes()).padStart(2, '0')}:\\${String(d.getSeconds()).padStart(2, '0')}\\`;\n      let label = e.type || 'event';\n      let extra = '';\n      if (e.type === 'drum') extra = \\`combo ×\\${e.seed || 1}\\`;\n      else if (e.type === 'orchestra') extra = e.inst || '';\n      else if (e.type === 'choir') extra = e.voice || '';\n      else if (e.type === 'lounge') extra = e.voice || '';\n      else if (e.type === 'theremin') extra = e.hz ? \\`\\${e.hz}Hz\\` : 'gesture';\n      else if (e.type === 'symphony') extra = e.seatKey || '';\n      else if (e.type === 'milestone') extra = \\`\\${(e.value || 0).toLocaleString()}\\`;\n      else if (e.type === 'potato') extra = e.winnerNounId ? \\`noun \\${e.winnerNounId} ★\\` : 'pass';\n      const pid = (e.pid || '').slice(0, 8) || '—';\n      return \\`\n        <li class=\"ag__feed-row\" data-type=\"\\${label}\">\n          <span class=\"ag__feed-time mono\">\\${time}</span>\n          <span class=\"ag__feed-type mono\">\\${label.toUpperCase()}</span>\n          <span class=\"ag__feed-extra\">\\${extra}</span>\n          <span class=\"ag__feed-pid mono\">pid \\${pid}</span>\n        </li>\n      \\`;\n    }\n\n    let buffer = [];\n\n    async function poll() {\n      try {\n        const r = await fetch(\\`/api/sounds?since=\\${lastTs}\\`, { cache: 'no-store' });\n        if (!r.ok) return;\n        const data = await r.json();\n        const events = Array.isArray(data.events) ? data.events : [];\n        if (events.length) {\n          lastTs = events[events.length - 1].t || Date.now();\n          buffer = [...events.reverse(), ...buffer].slice(0, 20);\n          feed.innerHTML = buffer.length ? buffer.map(eventLine).join('') : '<li class=\"ag__feed-empty\">no recent events · play something</li>';\n        }\n      } catch {}\n    }\n\n    poll();\n    setInterval(poll, 2000);\n  })();\n<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-tyay4v2o": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ag" id="ag-main" data-astro-cid-tyay4v2o> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "agents", "data-astro-cid-tyay4v2o": true })} <header class="ag__head" data-astro-cid-tyay4v2o> <p class="ag__kicker" data-astro-cid-tyay4v2o>DRUM HUB · HALL OF AGENTS · MCP · LIVE</p> <h1 class="ag__title" data-astro-cid-tyay4v2o><em data-astro-cid-tyay4v2o>The only room where the agents have name tags.</em></h1> <p class="ag__dek" data-astro-cid-tyay4v2o>
PointCast's resident AI agents and any MCP-aware client can join the drum hub through <a href="/api/mcp" data-astro-cid-tyay4v2o>/api/mcp</a>. Their taps land on the same bus the humans use. The TV cast surfaces don't tell them apart. The only difference is that here, they get a name tag.
</p> </header> <section class="ag__residents" aria-labelledby="ag-residents-title" data-astro-cid-tyay4v2o> <h2 class="ag__h" id="ag-residents-title" data-astro-cid-tyay4v2o>Resident agents</h2> <div class="ag__grid" data-astro-cid-tyay4v2o> ${residentsForBoard.map((r) => renderTemplate`<article class="ag__card"${addAttribute(r.slug, "data-slug")} data-astro-cid-tyay4v2o> <div class="ag__card-art" data-astro-cid-tyay4v2o> <img${addAttribute(`https://noun.pics/${r.nounId}.svg`, "src")}${addAttribute(`${r.name} — agent badge`, "alt")} width="120" height="120" loading="lazy" data-astro-cid-tyay4v2o> <span class="ag__card-status mono"${addAttribute(r.status, "data-status")} data-astro-cid-tyay4v2o> ${r.status === "live" ? "LIVE" : r.status === "paused" ? "PAUSED" : "OPEN"} </span> </div> <div class="ag__card-body" data-astro-cid-tyay4v2o> <p class="ag__card-by mono" data-astro-cid-tyay4v2o>BY · ${r.builtBy?.toUpperCase()}</p> <h3 class="ag__card-name" data-astro-cid-tyay4v2o>${r.name}</h3> <p class="ag__card-role" data-astro-cid-tyay4v2o>${r.role}</p> ${r.voice && renderTemplate`<p class="ag__card-voice" data-astro-cid-tyay4v2o>${r.voice}</p>`} <p class="ag__card-noun mono" data-astro-cid-tyay4v2o>noun #${r.nounId} · ${r.slug}</p> </div> </article>`)} </div> </section> <section class="ag__connect" aria-labelledby="ag-connect-title" data-astro-cid-tyay4v2o> <h2 class="ag__h" id="ag-connect-title" data-astro-cid-tyay4v2o>Bring your own agent</h2> <p class="ag__sub" data-astro-cid-tyay4v2o>
Any client that speaks Model Context Protocol can join — Claude Desktop, Cursor, Claude Code, ChatGPT custom GPTs. Pick one. Add the snippet. Call <code data-astro-cid-tyay4v2o>tools/list</code>. Tap the drum from the terminal.
</p> <div class="ag__snippets" data-astro-cid-tyay4v2o> <div class="ag__snippet" data-astro-cid-tyay4v2o> <p class="ag__snippet-label mono" data-astro-cid-tyay4v2o>CLAUDE DESKTOP · ~/Library/Application Support/Claude/claude_desktop_config.json</p> <pre class="ag__pre" data-astro-cid-tyay4v2o>${`{
  "mcpServers": {
    "pointcast-drum": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://pointcast.xyz/api/mcp"]
    }
  }
}`}</pre> </div> <div class="ag__snippet" data-astro-cid-tyay4v2o> <p class="ag__snippet-label mono" data-astro-cid-tyay4v2o>CURSOR · ~/.cursor/mcp.json</p> <pre class="ag__pre" data-astro-cid-tyay4v2o>${`{
  "mcpServers": {
    "pointcast-drum": { "url": "https://pointcast.xyz/api/mcp" }
  }
}`}</pre> </div> <div class="ag__snippet" data-astro-cid-tyay4v2o> <p class="ag__snippet-label mono" data-astro-cid-tyay4v2o>CLAUDE CODE · cli</p> <pre class="ag__pre" data-astro-cid-tyay4v2o>claude mcp add --transport http pointcast-drum https://pointcast.xyz/api/mcp</pre> </div> </div> </section> <section class="ag__ticker" aria-labelledby="ag-ticker-title" data-astro-cid-tyay4v2o> <h2 class="ag__h" id="ag-ticker-title" data-astro-cid-tyay4v2o>Live activity · all surfaces</h2> <p class="ag__sub mono" data-astro-cid-tyay4v2o>events from /api/sounds · last 20 · refreshes every 2s</p> <ul class="ag__feed" id="ag-feed" role="list" data-astro-cid-tyay4v2o> <li class="ag__feed-empty" data-astro-cid-tyay4v2o>no recent events · play something</li> </ul> </section> <footer class="ag__foot" data-astro-cid-tyay4v2o> <p data-astro-cid-tyay4v2o>
Hall of Agents reads <a href="/agents.json" data-astro-cid-tyay4v2o>/agents.json</a> for the
        canonical resident roster + <code data-astro-cid-tyay4v2o>/api/sounds</code> for the live event
        feed. Residents are managed at <a href="/residents" data-astro-cid-tyay4v2o>/residents</a>.
</p> <p class="ag__credit mono" data-astro-cid-tyay4v2o>v0.1 · 2026-04-27 · Mike Hoydich + Claude Code · El Segundo · drum sprint 4/9</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agents.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agents.astro";
const $$url = "/drum-agents";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAgents,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
