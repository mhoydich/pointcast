import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, u as unescapeHTML, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$ZeitgeistMap = createComponent(async ($$result, $$props, $$slots) => {
  const polls = (await getCollection("polls", ({ data }) => !data.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const W = 1040;
  const H = 720;
  const positions = /* @__PURE__ */ new Map();
  const cx = W / 2, cy = H / 2;
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  polls.forEach((p) => {
    const ringFactor = p.data.zeitgeist ? 0.18 : 0.38;
    const angle = rand() * Math.PI * 2;
    const r = Math.min(W, H) * ringFactor * (0.6 + rand() * 0.8);
    positions.set(p.data.slug, {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  });
  const edgeKey = (a, b) => a < b ? `${a}__${b}` : `${b}__${a}`;
  const edgeMap = /* @__PURE__ */ new Map();
  polls.forEach((p) => {
    Object.entries(p.data.followUps ?? {}).forEach(([optId, slug]) => {
      if (!positions.has(slug)) return;
      const key = edgeKey(p.data.slug, slug);
      edgeMap.set(key, { from: p.data.slug, to: slug, kind: "followUp", optionId: optId });
    });
    (p.data.related ?? []).forEach((slug) => {
      if (!positions.has(slug)) return;
      const key = edgeKey(p.data.slug, slug);
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from: p.data.slug, to: slug, kind: "related" });
      }
    });
  });
  const edges = Array.from(edgeMap.values());
  const n = polls.length;
  const area = W * H;
  const k = Math.sqrt(area / Math.max(n, 1)) * 0.85;
  const ITER = 300;
  const T_START = Math.min(W, H) / 8;
  for (let iter = 0; iter < ITER; iter++) {
    const t = T_START * (1 - iter / ITER);
    const forces = /* @__PURE__ */ new Map();
    polls.forEach((p) => forces.set(p.data.slug, { x: 0, y: 0 }));
    const slugs = polls.map((p) => p.data.slug);
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const a = positions.get(slugs[i]);
        const b = positions.get(slugs[j]);
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          dist = 0.01;
          dx = rand() - 0.5;
          dy = rand() - 0.5;
        }
        const f = k * k / dist;
        const fx = dx / dist * f;
        const fy = dy / dist * f;
        forces.get(slugs[i]).x += fx;
        forces.get(slugs[i]).y += fy;
        forces.get(slugs[j]).x -= fx;
        forces.get(slugs[j]).y -= fy;
      }
    }
    edges.forEach((e) => {
      const a = positions.get(e.from);
      const b = positions.get(e.to);
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const scale = e.kind === "followUp" ? 1.4 : 0.7;
      const f = dist * dist / k * scale;
      forces.get(e.from).x += dx / dist * f;
      forces.get(e.from).y += dy / dist * f;
      forces.get(e.to).x -= dx / dist * f;
      forces.get(e.to).y -= dy / dist * f;
    });
    polls.forEach((p) => {
      if (!p.data.zeitgeist) return;
      const pos = positions.get(p.data.slug);
      const dx = cx - pos.x, dy = cy - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = dist * 0.05;
      forces.get(p.data.slug).x += dx / dist * f;
      forces.get(p.data.slug).y += dy / dist * f;
    });
    polls.forEach((p) => {
      const pos = positions.get(p.data.slug);
      const f = forces.get(p.data.slug);
      const fmag = Math.sqrt(f.x * f.x + f.y * f.y) || 1;
      const capped = Math.min(fmag, t);
      pos.x += f.x / fmag * capped;
      pos.y += f.y / fmag * capped;
      pos.x = Math.max(60, Math.min(W - 60, pos.x));
      pos.y = Math.max(50, Math.min(H - 50, pos.y));
    });
  }
  const purposeColor = {
    coordination: "#185FA5",
    utility: "#0F6E56",
    editorial: "#5F3DC4",
    decision: "#C95019",
    forecast: "#E89A22"
  };
  function nodeRadius(optionCount) {
    return 7 + optionCount * 1;
  }
  function initials(slug) {
    const parts = slug.split("-");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const clusterStats = {
    zeitgeist: polls.filter((p) => p.data.zeitgeist).length,
    pathway: polls.filter((p) => Object.keys(p.data.followUps ?? {}).length > 0).length,
    followUp: new Set(polls.flatMap((p) => Object.values(p.data.followUps ?? {}))).size,
    edges: edges.length,
    followUpEdges: edges.filter((e) => e.kind === "followUp").length
  };
  const title = "Zeitgeist Map · poll constellation";
  const description = "Every PointCast poll positioned by how it connects. Zeitgeist polls glow red. Solid arrows are pathways (pick this option → get next poll). Dashed lines are related polls. Click any node to vote.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: "https://pointcast.xyz/zeitgeist-map"
  };
  const clientPolls = polls.map((p) => ({
    slug: p.data.slug,
    question: p.data.question,
    dek: p.data.dek ?? "",
    purpose: p.data.purpose,
    zeitgeist: p.data.zeitgeist ?? false,
    options: p.data.options.length,
    hasPathway: Object.keys(p.data.followUps ?? {}).length > 0
  }));
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "jsonLd": jsonLd, "data-astro-cid-ltqeulec": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<main class="page" data-astro-cid-ltqeulec> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ltqeulec> <a href="/" data-astro-cid-ltqeulec>Home</a> <span aria-hidden="true" data-astro-cid-ltqeulec>›</span> <a href="/polls" data-astro-cid-ltqeulec>polls</a> <span aria-hidden="true" data-astro-cid-ltqeulec>›</span> <span data-astro-cid-ltqeulec>zeitgeist map</span> </nav> <header class="head" data-astro-cid-ltqeulec> <p class="kicker mono" data-astro-cid-ltqeulec>MAP · ', " POLLS · ", ` CONNECTIONS</p> <h1 class="title" data-astro-cid-ltqeulec>The Poll Constellation</h1> <p class="dek" data-astro-cid-ltqeulec>
Every poll, positioned by how they connect. Zeitgeist polls glow red.
        Solid arrows are <strong data-astro-cid-ltqeulec>pathways</strong> — pick that option, get the
        next poll. Dashed lines are <strong data-astro-cid-ltqeulec>related</strong> — sideways jumps.
        Gold rings mark polls <strong data-astro-cid-ltqeulec>you've voted on</strong>. Click any node.
</p> </header> <section class="constellation-wrap" aria-label="Poll graph" data-astro-cid-ltqeulec> <svg class="constellation"`, ' preserveAspectRatio="xMidYMid meet" role="img"', ' data-astro-cid-ltqeulec> <defs data-astro-cid-ltqeulec>  <marker id="arrow-strong" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" data-astro-cid-ltqeulec> <path d="M0,0 L10,5 L0,10 Z" fill="#5F3DC4" data-astro-cid-ltqeulec></path> </marker> <marker id="arrow-weak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" data-astro-cid-ltqeulec> <path d="M0,0 L10,5 L0,10 Z" fill="#a8a6a0" opacity="0.5" data-astro-cid-ltqeulec></path> </marker> <filter id="zeitgeist-glow" x="-50%" y="-50%" width="200%" height="200%" data-astro-cid-ltqeulec> <feGaussianBlur stdDeviation="2.5" result="blur" data-astro-cid-ltqeulec></feGaussianBlur> <feMerge data-astro-cid-ltqeulec> <feMergeNode in="blur" data-astro-cid-ltqeulec></feMergeNode> <feMergeNode in="SourceGraphic" data-astro-cid-ltqeulec></feMergeNode> </feMerge> </filter> </defs>  <g class="edges" aria-hidden="true" data-astro-cid-ltqeulec> ', ' </g>  <g class="nodes" data-astro-cid-ltqeulec> ', ' </g> </svg>  <div class="tooltip" id="constellation-tooltip" aria-live="polite" hidden data-astro-cid-ltqeulec> <p class="tooltip__kicker mono" data-role="tooltip-kicker" data-astro-cid-ltqeulec>—</p> <p class="tooltip__q" data-role="tooltip-q" data-astro-cid-ltqeulec>—</p> <p class="tooltip__dek" data-role="tooltip-dek" data-astro-cid-ltqeulec>—</p> <p class="tooltip__cta mono" data-astro-cid-ltqeulec>click to open →</p> </div>  <aside class="legend" aria-label="Legend" data-astro-cid-ltqeulec> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__swatch legend__swatch--zeit" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>ZEITGEIST · ', ' polls</span> </div> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__swatch legend__swatch--coord" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>COORDINATION</span> </div> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__swatch legend__swatch--util" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>UTILITY</span> </div> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__swatch legend__swatch--ed" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>EDITORIAL</span> </div> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__swatch legend__swatch--dec" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>DECISION</span> </div> <hr data-astro-cid-ltqeulec> <div class="legend__row legend__row--line" data-astro-cid-ltqeulec> <svg viewBox="0 0 40 10" width="40" height="10" aria-hidden="true" data-astro-cid-ltqeulec> <line x1="2" y1="5" x2="34" y2="5" stroke="#5F3DC4" stroke-width="1.6" marker-end="url(#legend-arrow)" data-astro-cid-ltqeulec></line> <defs data-astro-cid-ltqeulec> <marker id="legend-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse" data-astro-cid-ltqeulec> <path d="M0,0 L10,5 L0,10 Z" fill="#5F3DC4" data-astro-cid-ltqeulec></path> </marker> </defs> </svg> <span data-astro-cid-ltqeulec>PATHWAY · ', '</span> </div> <div class="legend__row legend__row--line" data-astro-cid-ltqeulec> <svg viewBox="0 0 40 10" width="40" height="10" aria-hidden="true" data-astro-cid-ltqeulec> <line x1="2" y1="5" x2="38" y2="5" stroke="#a8a6a0" stroke-width="1.4" stroke-dasharray="3 3" data-astro-cid-ltqeulec></line> </svg> <span data-astro-cid-ltqeulec>RELATED · ', `</span> </div> <hr data-astro-cid-ltqeulec> <div class="legend__row" data-astro-cid-ltqeulec> <span class="legend__ring" aria-hidden="true" data-astro-cid-ltqeulec></span> <span data-astro-cid-ltqeulec>YOUR PATH · <span data-role="path-count" data-astro-cid-ltqeulec>0</span> voted</span> </div> </aside> </section> <section class="how" data-astro-cid-ltqeulec> <p class="kicker mono" data-astro-cid-ltqeulec>READING THE MAP</p> <ul class="how__list" data-astro-cid-ltqeulec> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>Node size</strong> = number of options.</li> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>Node color</strong> = poll purpose (see legend).</li> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>Red glow</strong> = zeitgeist poll — cultural snapshot, never resolves.</li> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>Gold ring</strong> = you've voted on that poll. Your path, local to this device.</li> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>Center bias</strong> — zeitgeist polls pull toward the middle; entry polls anchor there.</li> <li data-astro-cid-ltqeulec><strong data-astro-cid-ltqeulec>The layout is deterministic</strong> — built by a spring-embedder at publish time. Same graph every visit.</li> </ul> </section> <section class="agent-strip" data-astro-cid-ltqeulec> <p class="agent-strip__label mono" data-astro-cid-ltqeulec>MACHINE-READABLE</p> <ul data-astro-cid-ltqeulec> <li data-astro-cid-ltqeulec><a href="/api/poll" data-astro-cid-ltqeulec>/api/poll</a></li> <li data-astro-cid-ltqeulec><a href="/polls" data-astro-cid-ltqeulec>/polls</a></li> <li data-astro-cid-ltqeulec><a href="/for-agents" data-astro-cid-ltqeulec>/for-agents</a></li> </ul> </section>  <script type="application/json" id="constellation-polls">`, `<\/script> <script>
      (() => {
        const blob = document.getElementById('constellation-polls');
        if (!blob) return;
        let pollMeta = {};
        try { pollMeta = JSON.parse(blob.textContent || '[]').reduce((a, p) => (a[p.slug] = p, a), {}); } catch(e) {}

        const nodes = Array.from(document.querySelectorAll('.node[data-slug]'));
        const tooltip = document.getElementById('constellation-tooltip');
        const tK = tooltip?.querySelector('[data-role="tooltip-kicker"]');
        const tQ = tooltip?.querySelector('[data-role="tooltip-q"]');
        const tD = tooltip?.querySelector('[data-role="tooltip-dek"]');
        const pathCountEl = document.querySelector('[data-role="path-count"]');

        // Your-path rings — reveal for any localStorage-voted slug.
        let pathCount = 0;
        nodes.forEach((n) => {
          const slug = n.getAttribute('data-slug');
          const ring = n.querySelector('.node__ring');
          try {
            if (localStorage.getItem('pc:poll:voted:' + slug)) {
              if (ring) ring.setAttribute('opacity', '1');
              n.setAttribute('data-voted', 'true');
              pathCount++;
            }
          } catch (e) {}
        });
        if (pathCountEl) pathCountEl.textContent = String(pathCount);

        // Hover behavior — raise edges that touch the hovered node, dim others.
        const edges = Array.from(document.querySelectorAll('.edge'));

        function focusNode(slug) {
          nodes.forEach((n) => n.classList.toggle('node--dim', n.getAttribute('data-slug') !== slug));
          nodes.forEach((n) => n.classList.toggle('node--focus', n.getAttribute('data-slug') === slug));
          edges.forEach((e) => {
            const hit = e.getAttribute('data-from') === slug || e.getAttribute('data-to') === slug;
            e.classList.toggle('edge--focus', hit);
            e.classList.toggle('edge--dim', !hit);
          });
        }
        function clearFocus() {
          nodes.forEach((n) => { n.classList.remove('node--dim'); n.classList.remove('node--focus'); });
          edges.forEach((e) => { e.classList.remove('edge--focus'); e.classList.remove('edge--dim'); });
        }

        function showTooltip(slug, x, y) {
          const p = pollMeta[slug];
          if (!p || !tooltip) return;
          if (tK) {
            const chips = [];
            chips.push(p.purpose.toUpperCase());
            if (p.zeitgeist) chips.push('ZEITGEIST');
            if (p.hasPathway) chips.push('PATHWAY');
            chips.push(p.options + ' OPTIONS');
            tK.textContent = chips.join(' · ');
          }
          if (tQ) tQ.textContent = p.question;
          if (tD) tD.textContent = p.dek || '';
          tooltip.hidden = false;
          // Position near pointer, clamped to wrap.
          const wrap = tooltip.parentElement;
          if (wrap) {
            const rect = wrap.getBoundingClientRect();
            const tw = 280;
            const th = 120;
            let tx = x - rect.left + 14;
            let ty = y - rect.top + 14;
            if (tx + tw > rect.width) tx = x - rect.left - tw - 14;
            if (ty + th > rect.height) ty = y - rect.top - th - 14;
            tooltip.style.left = Math.max(6, tx) + 'px';
            tooltip.style.top = Math.max(6, ty) + 'px';
          }
        }
        function hideTooltip() {
          if (tooltip) tooltip.hidden = true;
        }

        nodes.forEach((n) => {
          const slug = n.getAttribute('data-slug');
          n.addEventListener('mouseenter', (ev) => {
            focusNode(slug);
            showTooltip(slug, ev.clientX, ev.clientY);
          });
          n.addEventListener('mousemove', (ev) => {
            showTooltip(slug, ev.clientX, ev.clientY);
          });
          n.addEventListener('mouseleave', () => {
            clearFocus();
            hideTooltip();
          });
          n.addEventListener('focus', () => focusNode(slug), true);
          n.addEventListener('blur', () => clearFocus(), true);
        });

        // Sonic postcards tie-in — hover plays a short sine blip keyed off
        // the slug hash. Distinct tone per poll, <50ms, gentle. Disabled if
        // the user hasn't interacted yet (autoplay policy).
        let ctx = null;
        let armed = false;
        const arm = () => { armed = true; };
        window.addEventListener('pointerdown', arm, { once: true });
        window.addEventListener('keydown', arm, { once: true });

        function slugHash(s) {
          let h = 0;
          for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
          return Math.abs(h);
        }

        function blip(slug) {
          if (!armed) return;
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          if (!ctx) ctx = new AC();
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const h = slugHash(slug);
          // Pentatonic-ish frequencies (A minor): 220, 261.6, 329.6, 392, 440, 523, 659, 784
          const scale = [220, 261.6, 329.6, 392, 440, 523.25, 659.25, 783.99];
          const f = scale[h % scale.length] * (1 + ((h >> 3) % 3) * 0.5);
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.04, now + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
          o.connect(g).connect(ctx.destination);
          o.start(now);
          o.stop(now + 0.25);
        }

        nodes.forEach((n) => {
          const slug = n.getAttribute('data-slug');
          n.addEventListener('mouseenter', () => blip(slug));
        });
      })();
    <\/script> </main> `])), maybeRenderHead(), polls.length, clusterStats.edges, addAttribute(`0 0 ${W} ${H}`, "viewBox"), addAttribute(`Graph of ${polls.length} polls and ${clusterStats.edges} connections`, "aria-label"), edges.map((e) => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const fromP = polls.find((p) => p.data.slug === e.from);
    const toP = polls.find((p) => p.data.slug === e.to);
    const ra = nodeRadius(fromP.data.options.length) + 2;
    const rb = nodeRadius(toP.data.options.length) + 4;
    const x1 = a.x + ux * ra;
    const y1 = a.y + uy * ra;
    const x2 = b.x - ux * rb;
    const y2 = b.y - uy * rb;
    return renderTemplate`<line${addAttribute(x1, "x1")}${addAttribute(y1, "y1")}${addAttribute(x2, "x2")}${addAttribute(y2, "y2")}${addAttribute(`edge edge--${e.kind}`, "class")}${addAttribute(e.from, "data-from")}${addAttribute(e.to, "data-to")}${addAttribute(e.kind === "followUp" ? "url(#arrow-strong)" : "url(#arrow-weak)", "marker-end")} data-astro-cid-ltqeulec></line>`;
  }), polls.map((p) => {
    const pos = positions.get(p.data.slug);
    const r = nodeRadius(p.data.options.length);
    const fill = purposeColor[p.data.purpose] ?? "#5F3DC4";
    return renderTemplate`<g class="node"${addAttribute(p.data.slug, "data-slug")}${addAttribute(String(p.data.zeitgeist ?? false), "data-zeitgeist")} data-astro-cid-ltqeulec> <a${addAttribute(`/poll/${p.data.slug}`, "href")} data-astro-cid-ltqeulec>  <circle class="node__ring"${addAttribute(pos.x, "cx")}${addAttribute(pos.y, "cy")}${addAttribute(r + 5, "r")} fill="none" stroke="#FBB040" stroke-width="2" opacity="0" data-astro-cid-ltqeulec></circle> <circle${addAttribute(`node__dot${p.data.zeitgeist ? " node__dot--zeitgeist" : ""}`, "class")}${addAttribute(pos.x, "cx")}${addAttribute(pos.y, "cy")}${addAttribute(r, "r")}${addAttribute(fill, "fill")}${addAttribute(p.data.zeitgeist ? "url(#zeitgeist-glow)" : void 0, "filter")} data-astro-cid-ltqeulec></circle> <text class="node__initials"${addAttribute(pos.x, "x")}${addAttribute(pos.y + 3.5, "y")} text-anchor="middle"${addAttribute(Math.max(7, r * 0.75), "font-size")} fill="#fff" font-weight="700" data-astro-cid-ltqeulec>${initials(p.data.slug)}</text> <title>${p.data.question}</title> </a> </g>`;
  }), clusterStats.zeitgeist, clusterStats.followUpEdges, clusterStats.edges - clusterStats.followUpEdges, unescapeHTML(JSON.stringify(clientPolls))) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/zeitgeist-map.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/zeitgeist-map.astro";
const $$url = "/zeitgeist-map";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ZeitgeistMap,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
