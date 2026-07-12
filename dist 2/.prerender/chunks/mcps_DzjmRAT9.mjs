import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';

const $$Mcps = createComponent(($$result, $$props, $$slots) => {
  const MCPS = [
    {
      slug: "digital-fireplace",
      name: "Digital Fireplace",
      blurb: "34 embeddable pixel-art fireplaces. Brought to you by Good Feels.",
      description: "An MCP server and a self-hosted gallery of 34 pixel-art fireplaces — stone hearths, CRT yule logs, plasma reactors, glowing joints, sparklers, phoenix eggs. Each one is a single self-contained HTML page with a tap-to-light audio gate and a Good Feels attribution. Embed any of them with one iframe. CC0.",
      liveUrl: "/fireplaces/index.html",
      embedSnippet: `<iframe src="https://pointcast.xyz/fireplaces/joint-tray.html"
        width="800" height="500" frameborder="0" allow="autoplay"
        title="Good Feels · digital fireplace"
        style="border:none;"></iframe>`,
      github: "https://github.com/mhoydich/digital-fireplace-mcp",
      tools: [
        "fireplace_list_styles",
        "fireplace_get_html",
        "fireplace_get_embed_code",
        "fireplace_get_url",
        "fireplace_random",
        "fireplace_get_gallery_url",
        "fireplace_recommend"
      ],
      tags: ["fire", "pixel-art", "embed", "cc0", "good-feels"],
      status: "live"
    },
    {
      slug: "pointcast-control-deck",
      name: "PointCast Control Deck",
      blurb: "Real-time dashboard for pointcast.xyz — presence, wire, channel meter.",
      description: "A geocities-meets-SimCity live dashboard that polls pointcast.xyz every few seconds: who's in the room, what's on the wire, blocks per channel, and the most recent broadcast. Late-90s web chrome, channel-coloured bars, scrolling marquee, blinking LEDs.",
      liveUrl: void 0,
      tools: [
        "(local stdio · runs against pointcast.xyz public APIs)"
      ],
      tags: ["pointcast", "real-time", "dashboard", "wire"],
      status: "preview",
      channel: "FCT"
    }
  ];
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "MCPs", "description": "Mike's MCP servers — small Model Context Protocol servers that plug into Claude Cowork. Brought to you by Good Feels.", "image": "/images/og-about.png", "data-astro-cid-qd4eh4el": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mcps-page" data-astro-cid-qd4eh4el> <a href="/" class="back-link" data-astro-cid-qd4eh4el>&larr; PointCast</a> <header class="page-head" data-astro-cid-qd4eh4el> <div class="kicker" data-astro-cid-qd4eh4el>MCPs</div> <h1 data-astro-cid-qd4eh4el>Neat MCPs</h1> <p class="lead" data-astro-cid-qd4eh4el>
Small <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" data-astro-cid-qd4eh4el>Model Context Protocol</a> servers
        that plug into Claude Cowork (and any other MCP client). Built in public from El Segundo.
        Brought to you by <a href="https://getgoodfeels.com" target="_blank" rel="noopener sponsored" data-astro-cid-qd4eh4el>Good Feels</a>.
</p> </header> <div class="mcps-grid" data-astro-cid-qd4eh4el> ${MCPS.map((m) => renderTemplate`<article${addAttribute(`mcp ${m.status}`, "class")}${addAttribute(m.slug, "id")} data-astro-cid-qd4eh4el> <header class="mcp-head" data-astro-cid-qd4eh4el> <div class="status-pip" data-astro-cid-qd4eh4el>${m.status}</div> <h2 data-astro-cid-qd4eh4el>${m.name}</h2> <p class="blurb" data-astro-cid-qd4eh4el>${m.blurb}</p> </header> <p class="desc" data-astro-cid-qd4eh4el>${m.description}</p> ${m.tags.length > 0 && renderTemplate`<div class="tags" data-astro-cid-qd4eh4el> ${m.tags.map((t) => renderTemplate`<span class="tag" data-astro-cid-qd4eh4el>${t}</span>`)} </div>`} <div class="tools" data-astro-cid-qd4eh4el> <div class="tools-label" data-astro-cid-qd4eh4el>Tools</div> <ul data-astro-cid-qd4eh4el> ${m.tools.map((t) => renderTemplate`<li data-astro-cid-qd4eh4el><code data-astro-cid-qd4eh4el>${t}</code></li>`)} </ul> </div> ${m.embedSnippet && renderTemplate`<details class="embed" data-astro-cid-qd4eh4el> <summary data-astro-cid-qd4eh4el>embed snippet</summary> <pre data-astro-cid-qd4eh4el>${m.embedSnippet}</pre> </details>`} <div class="actions" data-astro-cid-qd4eh4el> ${m.liveUrl && renderTemplate`<a${addAttribute(m.liveUrl, "href")} class="btn primary" data-astro-cid-qd4eh4el>open gallery →</a>`} ${m.github && renderTemplate`<a${addAttribute(m.github, "href")} target="_blank" rel="noopener" class="btn" data-astro-cid-qd4eh4el>github →</a>`} </div> </article>`)} </div> <footer class="page-foot" data-astro-cid-qd4eh4el> <p data-astro-cid-qd4eh4el>
Want to wire one into your Claude Code? Each repo's README has the JSON snippet for <code data-astro-cid-qd4eh4el>~/.claude/settings.json</code>.
        Want one built for your team? <a href="/about" data-astro-cid-qd4eh4el>Drop me a line</a>.
</p> </footer> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mcps.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/mcps.astro";
const $$url = "/mcps";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Mcps,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
