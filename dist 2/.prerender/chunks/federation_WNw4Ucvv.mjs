import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Federation = createComponent(async ($$result, $$props, $$slots) => {
  const mesh = (await getCollection("mesh", ({ data }) => data.listed)).sort((a, b) => {
    const order = { close: 0, known: 1, interesting: 2, watching: 3 };
    return (order[a.data.trust] ?? 4) - (order[b.data.trust] ?? 4);
  });
  const W = 1040;
  const H = 640;
  const cx = W / 2;
  const cy = H / 2;
  const ringR = { close: 120, known: 200, interesting: 270, watching: 330 };
  const tiers = { close: [], known: [], interesting: [], watching: [] };
  mesh.forEach((n) => {
    tiers[n.data.trust]?.push(n);
  });
  const positions = [];
  ["close", "known", "interesting", "watching"].forEach((tier) => {
    const group = tiers[tier];
    if (!group.length) return;
    const r = ringR[tier];
    const baseAngle = { close: 0, known: 0.4, interesting: 0.8, watching: 1.1 }[tier];
    group.forEach((n, i) => {
      const angle = baseAngle + i / group.length * Math.PI * 2;
      positions.push({
        slug: n.data.slug,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        node: n
      });
    });
  });
  const kindColor = {
    blog: "#185FA5",
    zine: "#5F3DC4",
    broadcast: "#C95019",
    gallery: "#8A2432",
    feed: "#0F6E56",
    bench: "#3A1F8B",
    agent: "#E89A22",
    node: "#5F5E5A"
  };
  const statusDash = {
    imagined: "4 4",
    live: "",
    archived: "1 4"
  };
  const clientNodes = mesh.map((n) => ({
    slug: n.data.slug,
    name: n.data.name,
    url: n.data.url,
    kind: n.data.kind,
    status: n.data.status,
    trust: n.data.trust,
    description: n.data.description,
    vibeProfile: n.data.vibeProfile ?? null
  }));
  const title = "Federation · the node roster";
  const description = `PointCast as a node in a network of ${mesh.length} PointCast-adjacent nodes — friend blogs, zines, benches, broadcasts, feeds. Cross-linked, structured, ambient.`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://pointcast.xyz/federation"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "jsonLd": jsonLd, "data-astro-cid-vovdujbv": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="page" data-astro-cid-vovdujbv> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-vovdujbv> <a href="/" data-astro-cid-vovdujbv>Home</a> <span aria-hidden="true" data-astro-cid-vovdujbv>›</span> <a href="/mesh" data-astro-cid-vovdujbv>mesh</a> <span aria-hidden="true" data-astro-cid-vovdujbv>›</span> <span data-astro-cid-vovdujbv>federation</span> </nav> <header class="head" data-astro-cid-vovdujbv> <p class="kicker mono" data-astro-cid-vovdujbv>FEDERATION · ', " NODES · ", ' IMAGINED</p> <h1 class="title" data-astro-cid-vovdujbv>PointCast is a node.</h1> <p class="dek" data-astro-cid-vovdujbv>\nMost blogs are islands. A federation is a network. Every dot below is a\n        PointCast-adjacent node — real, imagined, or somewhere between. Inner\n        ring is <em data-astro-cid-vovdujbv>close</em>; outer ring is <em data-astro-cid-vovdujbv>watching</em>. Colors are kinds: blog,\n        zine, bench, broadcast, feed. Dashed edges mean imagined — a\n        placeholder describing what a node <em data-astro-cid-vovdujbv>would</em> be if it existed.\n        Promote to live when the URL resolves.\n</p> </header> <section class="fed-wrap" aria-label="Federation graph" data-astro-cid-vovdujbv> <svg class="fed-svg"', ' preserveAspectRatio="xMidYMid meet" role="img"', ' data-astro-cid-vovdujbv> <defs data-astro-cid-vovdujbv> <radialGradient id="me-grad" cx="50%" cy="50%" r="50%" data-astro-cid-vovdujbv> <stop offset="0%" stop-color="#FBB040" data-astro-cid-vovdujbv></stop> <stop offset="100%" stop-color="#8A2432" data-astro-cid-vovdujbv></stop> </radialGradient> </defs> ', " ", " <circle", "", ' r="28" fill="url(#me-grad)" stroke="#12110E" stroke-width="2" data-astro-cid-vovdujbv></circle> <text', "", ' text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#fff" font-weight="700" data-astro-cid-vovdujbv>ME</text> <text', "", ' text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="0.1em" fill="#5F5E5A" data-astro-cid-vovdujbv>POINTCAST.XYZ</text> ', ' </svg> <div class="tooltip" id="fed-tooltip" hidden data-astro-cid-vovdujbv> <p class="tooltip__kicker mono" data-role="tt-kicker" data-astro-cid-vovdujbv>—</p> <p class="tooltip__name" data-role="tt-name" data-astro-cid-vovdujbv>—</p> <p class="tooltip__dek" data-role="tt-dek" data-astro-cid-vovdujbv>—</p> <p class="tooltip__cta mono" data-astro-cid-vovdujbv>visit →</p> </div> <aside class="legend" aria-label="Legend" data-astro-cid-vovdujbv> <p class="legend__kicker mono" data-astro-cid-vovdujbv>KIND</p> ', ' <hr data-astro-cid-vovdujbv> <p class="legend__kicker mono" data-astro-cid-vovdujbv>STATUS</p> <div class="legend__row legend__row--line" data-astro-cid-vovdujbv> <svg viewBox="0 0 30 6" width="30" height="6" aria-hidden="true" data-astro-cid-vovdujbv><line x1="1" y1="3" x2="29" y2="3" stroke="#8a8878" stroke-width="1.6" data-astro-cid-vovdujbv></line></svg> <span data-astro-cid-vovdujbv>LIVE</span> </div> <div class="legend__row legend__row--line" data-astro-cid-vovdujbv> <svg viewBox="0 0 30 6" width="30" height="6" aria-hidden="true" data-astro-cid-vovdujbv><line x1="1" y1="3" x2="29" y2="3" stroke="#8a8878" stroke-width="1.6" stroke-dasharray="4 4" data-astro-cid-vovdujbv></line></svg> <span data-astro-cid-vovdujbv>IMAGINED</span> </div> </aside> </section> <section class="nodelist" data-astro-cid-vovdujbv> <p class="kicker mono" data-astro-cid-vovdujbv>THE NODES · IN FULL</p> <ul class="nodelist__list" data-astro-cid-vovdujbv> ', ' </ul> </section> <section class="embed" data-astro-cid-vovdujbv> <p class="kicker mono" data-astro-cid-vovdujbv>EMBED · "SEEN ON POINTCAST"</p> <p class="embed__dek" data-astro-cid-vovdujbv>Other nodes can embed this badge to indicate a PointCast citation. Compact SVG, cacheable, degrades cleanly. Paste the line below on your own page.</p> <div class="embed__preview" data-astro-cid-vovdujbv> <img src="/api/badge.svg" alt="Seen on PointCast" width="110" height="28" data-astro-cid-vovdujbv> </div> <pre class="embed__code mono" data-astro-cid-vovdujbv><code data-astro-cid-vovdujbv>&lt;a href="https://pointcast.xyz"&gt;&lt;img src="https://pointcast.xyz/api/badge.svg" alt="Seen on PointCast" width="110" height="28"&gt;&lt;/a&gt;</code></pre> </section> <section class="agent-strip" data-astro-cid-vovdujbv> <p class="agent-strip__label mono" data-astro-cid-vovdujbv>MACHINE-READABLE</p> <ul data-astro-cid-vovdujbv> <li data-astro-cid-vovdujbv><a href="/api/mesh.jsonl" data-astro-cid-vovdujbv>/api/mesh.jsonl</a></li> <li data-astro-cid-vovdujbv><a href="/api/badge.svg" data-astro-cid-vovdujbv>/api/badge.svg</a></li> <li data-astro-cid-vovdujbv><a href="/mesh" data-astro-cid-vovdujbv>/mesh (three layers)</a></li> <li data-astro-cid-vovdujbv><a href="/for-nodes" data-astro-cid-vovdujbv>/for-nodes</a></li> <li data-astro-cid-vovdujbv><a href="/for-agents" data-astro-cid-vovdujbv>/for-agents</a></li> </ul> </section> <script type="application/json" id="fed-nodes">', `<\/script> <script>
      (() => {
        const blob = document.getElementById('fed-nodes');
        if (!blob) return;
        let meta = {};
        try { meta = JSON.parse(blob.textContent || '[]').reduce((a, n) => (a[n.slug] = n, a), {}); } catch(e) {}

        const tooltip = document.getElementById('fed-tooltip');
        const tK = tooltip?.querySelector('[data-role="tt-kicker"]');
        const tN = tooltip?.querySelector('[data-role="tt-name"]');
        const tD = tooltip?.querySelector('[data-role="tt-dek"]');

        const nodes = Array.from(document.querySelectorAll('.fed-svg .node[data-slug]'));
        const edges = Array.from(document.querySelectorAll('.fed-svg .edge[data-slug]'));

        function showTip(slug, x, y) {
          const n = meta[slug]; if (!n || !tooltip) return;
          if (tK) tK.textContent = [n.kind.toUpperCase(), n.status.toUpperCase(), 'TRUST · ' + n.trust.toUpperCase()].join(' · ');
          if (tN) tN.textContent = n.name;
          if (tD) tD.textContent = n.description;
          const wrap = tooltip.parentElement;
          if (wrap) {
            const rect = wrap.getBoundingClientRect();
            const tw = 300, th = 130;
            let tx = x - rect.left + 14, ty = y - rect.top + 14;
            if (tx + tw > rect.width) tx = x - rect.left - tw - 14;
            if (ty + th > rect.height) ty = y - rect.top - th - 14;
            tooltip.style.left = Math.max(6, tx) + 'px';
            tooltip.style.top = Math.max(6, ty) + 'px';
          }
          tooltip.hidden = false;
        }
        function hideTip() { if (tooltip) tooltip.hidden = true; }

        function focus(slug) {
          nodes.forEach((n) => n.classList.toggle('node--dim', n.getAttribute('data-slug') !== slug));
          edges.forEach((e) => e.classList.toggle('edge--focus', e.getAttribute('data-slug') === slug));
        }
        function clearFocus() {
          nodes.forEach((n) => n.classList.remove('node--dim'));
          edges.forEach((e) => e.classList.remove('edge--focus'));
        }

        let ctx = null, armed = false;
        const arm = () => { armed = true; };
        window.addEventListener('pointerdown', arm, { once: true });
        window.addEventListener('keydown', arm, { once: true });
        function blip(slug) {
          if (!armed) return;
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          if (!ctx) ctx = new AC();
          if (ctx.state === 'suspended') ctx.resume();
          const n = meta[slug]; if (!n) return;
          const profileTone = { 'el-segundo': 440, 'medway': 392, 'nyc': 523.25, 'london': 349.23, 'mallorca': 329.63, 'istanbul': 293.66, 'tokyo': 659.25, 'mexico-city': 493.88 };
          let h = 0; for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
          const f = n.vibeProfile && profileTone[n.vibeProfile] ? profileTone[n.vibeProfile] : 220 + (Math.abs(h) % 8) * 60;
          const t = ctx.currentTime;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.05, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
          o.connect(g).connect(ctx.destination);
          o.start(t); o.stop(t + 0.32);
        }

        nodes.forEach((n) => {
          const slug = n.getAttribute('data-slug');
          n.addEventListener('mouseenter', (ev) => { focus(slug); showTip(slug, ev.clientX, ev.clientY); blip(slug); });
          n.addEventListener('mousemove', (ev) => showTip(slug, ev.clientX, ev.clientY));
          n.addEventListener('mouseleave', () => { clearFocus(); hideTip(); });
        });
      })();
    <\/script> </main> `])), maybeRenderHead(), mesh.length, mesh.filter((m) => m.data.status === "imagined").length, addAttribute(`0 0 ${W} ${H}`, "viewBox"), addAttribute(`Graph of PointCast + ${mesh.length} federated nodes`, "aria-label"), ["close", "known", "interesting", "watching"].map((tier) => renderTemplate`<circle${addAttribute(cx, "cx")}${addAttribute(cy, "cy")}${addAttribute(ringR[tier], "r")} fill="none" stroke="#D6D4CD" stroke-width="0.8" stroke-dasharray="1 3" opacity="0.6" data-astro-cid-vovdujbv></circle>`), positions.map((p) => renderTemplate`<line${addAttribute(cx, "x1")}${addAttribute(cy, "y1")}${addAttribute(p.x, "x2")}${addAttribute(p.y, "y2")} class="edge"${addAttribute(p.slug, "data-slug")} stroke="#a8a6a0" stroke-width="1.2"${addAttribute(statusDash[p.node.data.status] || "", "stroke-dasharray")} opacity="0.5" data-astro-cid-vovdujbv></line>`), addAttribute(cx, "cx"), addAttribute(cy, "cy"), addAttribute(cx, "x"), addAttribute(cy + 4, "y"), addAttribute(cx, "x"), addAttribute(cy + 46, "y"), positions.map((p) => {
    const color = kindColor[p.node.data.kind] ?? "#5F5E5A";
    const r = p.node.data.trust === "close" ? 18 : p.node.data.trust === "known" ? 15 : 13;
    return renderTemplate`<g class="node"${addAttribute(p.slug, "data-slug")} data-astro-cid-vovdujbv> <a${addAttribute(p.node.data.url, "href")} rel="noopener" target="_blank" data-astro-cid-vovdujbv> <circle${addAttribute(p.x, "cx")}${addAttribute(p.y, "cy")}${addAttribute(r + 4, "r")} fill="none"${addAttribute(color, "stroke")} stroke-width="1" opacity="0.3" data-astro-cid-vovdujbv></circle> <circle${addAttribute(p.x, "cx")}${addAttribute(p.y, "cy")}${addAttribute(r, "r")}${addAttribute(color, "fill")} stroke="#12110E" stroke-width="1" data-astro-cid-vovdujbv></circle> <text${addAttribute(p.x, "x")}${addAttribute(p.y + 3, "y")} text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#fff" font-weight="700" data-astro-cid-vovdujbv> ${p.node.data.name.slice(0, 2).toUpperCase()} </text> <text${addAttribute(p.x, "x")}${addAttribute(p.y + r + 14, "y")} text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="0.08em" fill="#38373A" data-astro-cid-vovdujbv> ${p.node.data.name.toUpperCase()} </text> <title>${p.node.data.name} · ${p.node.data.description}</title> </a> </g>`;
  }), Object.entries(kindColor).filter(([k]) => mesh.some((m) => m.data.kind === k)).map(([k, c]) => renderTemplate`<div class="legend__row" data-astro-cid-vovdujbv> <span class="legend__swatch"${addAttribute(`background:${c}`, "style")} aria-hidden="true" data-astro-cid-vovdujbv></span> <span data-astro-cid-vovdujbv>${k.toUpperCase()}</span> </div>`), mesh.map((n) => renderTemplate`<li${addAttribute(`noderow noderow--${n.data.status}`, "class")} data-astro-cid-vovdujbv> <a class="noderow__link"${addAttribute(n.data.url, "href")} rel="noopener" target="_blank" data-astro-cid-vovdujbv> <span class="noderow__chips mono" data-astro-cid-vovdujbv> <span class="chip chip--kind"${addAttribute(`background:${kindColor[n.data.kind]};color:#fff`, "style")} data-astro-cid-vovdujbv>${n.data.kind.toUpperCase()}</span> <span${addAttribute(`chip chip--status-${n.data.status}`, "class")} data-astro-cid-vovdujbv>${n.data.status.toUpperCase()}</span> <span class="chip chip--trust" data-astro-cid-vovdujbv>TRUST · ${n.data.trust.toUpperCase()}</span> ${n.data.vibeProfile && renderTemplate`<span class="chip chip--vibe" data-astro-cid-vovdujbv>♪ ${n.data.vibeProfile}</span>`} </span> <h2 class="noderow__name" data-astro-cid-vovdujbv>${n.data.name}</h2> <p class="noderow__url mono" data-astro-cid-vovdujbv>${n.data.url}</p> <p class="noderow__dek" data-astro-cid-vovdujbv>${n.data.description}</p> </a> </li>`), unescapeHTML(JSON.stringify(clientNodes))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/federation.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/federation.astro";
const $$url = "/federation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Federation,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
