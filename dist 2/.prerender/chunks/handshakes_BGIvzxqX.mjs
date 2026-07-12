import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { h as handshakes } from './handshakes_CEb3K5Fe.mjs';

const $$Handshakes = createComponent(($$result, $$props, $$slots) => {
  const title = "Handshakes — pointcast.xyz";
  const description = "When AI crawlers visit PointCast, PointCast looks back. A public ledger of reciprocal probes against operator-doc URLs and /.well-known/agents.json.";
  const generatedAt = new Date(handshakes.generated_at);
  const generatedHuman = generatedAt.toUTCString();
  const totals = handshakes.totals;
  const rows = [...handshakes.handshakes].sort((a, b) => {
    const ai = (t) => t.type.startsWith("ai:") ? 0 : 1;
    return ai(a) - ai(b) || a.type.localeCompare(b.type);
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "PointCast Reciprocal Handshake Ledger",
    description,
    url: "https://pointcast.xyz/handshakes",
    isAccessibleForFree: true,
    creator: { "@id": "https://pointcast.xyz/#org" },
    dateModified: handshakes.generated_at,
    variableMeasured: [
      "crawler operator URL reachability",
      "/.well-known/agents.json adoption"
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/agents.json", title: "PointCast agent manifest" },
    { type: "application/json", href: "/handshakes.json", title: "Handshake ledger (machine)" }
  ], "data-astro-cid-aofktf5v": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-aofktf5v> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-aofktf5v> <a href="/" data-astro-cid-aofktf5v>Home</a> <span aria-hidden="true" data-astro-cid-aofktf5v>›</span> <span data-astro-cid-aofktf5v>handshakes</span> </nav> <header class="hero" data-astro-cid-aofktf5v> <p class="kicker" data-astro-cid-aofktf5v>RECIPROCAL · AGENT-NATIVE</p> <h1 data-astro-cid-aofktf5v>When you crawl us, we crawl back.</h1> <p class="dek" data-astro-cid-aofktf5v>
PointCast logs every visitor — humans, AI crawlers, link-unfurl bots.
        Once a day, we probe each crawler operator at the URL their User-Agent
        publishes, and check whether they serve <code data-astro-cid-aofktf5v>/.well-known/agents.json</code>.
        It is the polite version of saying: I see you. Here is me looking back.
</p> </header> <section class="metrics" aria-labelledby="metrics-title" data-astro-cid-aofktf5v> <h2 id="metrics-title" class="sr-only" data-astro-cid-aofktf5v>Ledger totals</h2> <ul data-astro-cid-aofktf5v> <li data-astro-cid-aofktf5v> <span class="metric__num" data-astro-cid-aofktf5v>${totals.crawler_types_handshook}</span> <span class="metric__label" data-astro-cid-aofktf5v>crawler types met</span> </li> <li data-astro-cid-aofktf5v> <span class="metric__num" data-astro-cid-aofktf5v>${totals.operators_reachable}</span> <span class="metric__label" data-astro-cid-aofktf5v>operator docs reachable</span> </li> <li data-astro-cid-aofktf5v> <span class="metric__num" data-astro-cid-aofktf5v>${totals.operators_with_any_surface ?? 0}</span> <span class="metric__label" data-astro-cid-aofktf5v>serve any agent-native surface</span> </li> <li data-astro-cid-aofktf5v> <span class="metric__num" data-astro-cid-aofktf5v>${totals.total_probes}</span> <span class="metric__label" data-astro-cid-aofktf5v>total probes</span> </li> </ul> </section> <section class="callout" data-astro-cid-aofktf5v> <p class="eyebrow" data-astro-cid-aofktf5v>The gap</p> <p data-astro-cid-aofktf5v>
Of the ${totals.crawler_types_handshook} crawler operators that have
        crawled PointCast, <strong data-astro-cid-aofktf5v>${totals.operators_with_any_surface ?? 0}</strong>
serve a single one of the five agent-native surfaces we probe. PointCast
        serves all five: <a href="/agents.json" data-astro-cid-aofktf5v>agents.json</a>,
<a href="/llms.txt" data-astro-cid-aofktf5v>llms.txt</a>, <a href="/llms-full.txt" data-astro-cid-aofktf5v>llms-full.txt</a>,
<code data-astro-cid-aofktf5v>ai-plugin.json</code> manifest, and a robots.txt with explicit
        AI-bot stanzas. Every probe here is a vote for the standard.
</p> </section> <section class="ledger" aria-labelledby="ledger-title" data-astro-cid-aofktf5v> <h2 id="ledger-title" data-astro-cid-aofktf5v>The ledger</h2> <p class="ledger__legend" data-astro-cid-aofktf5v>
Each crawler gets five pills — one per agent-native surface we probe.
<span class="pill pill--served" data-astro-cid-aofktf5v>filled</span> = the operator serves it.
<span class="pill pill--missing" data-astro-cid-aofktf5v>hollow</span> = does not.
</p> <table data-astro-cid-aofktf5v> <thead data-astro-cid-aofktf5v> <tr data-astro-cid-aofktf5v> <th scope="col" data-astro-cid-aofktf5v>Crawler</th> <th scope="col" data-astro-cid-aofktf5v>Operator doc</th> <th scope="col" data-astro-cid-aofktf5v>Agent-native surfaces (${(handshakes.scored_kinds ?? []).length}/5)</th> <th scope="col" class="num" data-astro-cid-aofktf5v>Score</th> <th scope="col" data-astro-cid-aofktf5v>Last seen</th> </tr> </thead> <tbody data-astro-cid-aofktf5v> ${rows.map((row) => renderTemplate`<tr data-astro-cid-aofktf5v> <td data-astro-cid-aofktf5v><code data-astro-cid-aofktf5v>${row.type}</code></td> <td data-astro-cid-aofktf5v> ${row.operator_url ? renderTemplate`<a${addAttribute(row.operator_url, "href")} rel="nofollow noreferrer external" data-astro-cid-aofktf5v> <span${addAttribute(`status status--${row.operator_ok ? "ok" : "no"}`, "class")} data-astro-cid-aofktf5v>${row.operator_status ?? "—"}</span> <span class="url" data-astro-cid-aofktf5v>${new URL(row.operator_url).host}</span> </a>` : "—"} </td> <td data-astro-cid-aofktf5v> <div class="pills" data-astro-cid-aofktf5v> ${(handshakes.scored_kinds ?? []).map((kind) => {
    const surface = row.surfaces?.[kind];
    const url = surface?.url;
    const served = !!surface?.served;
    const cls = `pill pill--${served ? "served" : "missing"}`;
    return url ? renderTemplate`<a${addAttribute(url, "href")}${addAttribute(cls, "class")} rel="nofollow noreferrer external"${addAttribute(`${kind} · ${surface.status ?? "—"}`, "title")} data-astro-cid-aofktf5v>${kind}</a>` : renderTemplate`<span${addAttribute(cls, "class")}${addAttribute(kind, "title")} data-astro-cid-aofktf5v>${kind}</span>`;
  })} </div> </td> <td class="num" data-astro-cid-aofktf5v><strong data-astro-cid-aofktf5v>${row.agent_native_score ?? 0}</strong> / 5</td> <td data-astro-cid-aofktf5v><time${addAttribute(row.last_handshake_at, "datetime")} data-astro-cid-aofktf5v>${row.last_handshake_at.slice(0, 10)}</time></td> </tr>`)} </tbody> <tfoot data-astro-cid-aofktf5v> <tr class="row--us" data-astro-cid-aofktf5v> <td data-astro-cid-aofktf5v><code data-astro-cid-aofktf5v>pointcast.xyz</code></td> <td data-astro-cid-aofktf5v> <a href="/" rel="self" data-astro-cid-aofktf5v> <span class="status status--ok" data-astro-cid-aofktf5v>200</span> <span class="url" data-astro-cid-aofktf5v>pointcast.xyz</span> </a> </td> <td data-astro-cid-aofktf5v> <div class="pills" data-astro-cid-aofktf5v> <a href="/agents.json" class="pill pill--served" title="agents.json · 200" data-astro-cid-aofktf5v>agents.json</a> <a href="/.well-known/ai-plugin.json" class="pill pill--served" title="ai-plugin · 200" data-astro-cid-aofktf5v>ai-plugin</a> <a href="/llms.txt" class="pill pill--served" title="llms.txt · 200" data-astro-cid-aofktf5v>llms.txt</a> <a href="/llms-full.txt" class="pill pill--served" title="llms-full · 200" data-astro-cid-aofktf5v>llms-full</a> <a href="/robots.txt" class="pill pill--served" title="robots-ai · 200" data-astro-cid-aofktf5v>robots-ai</a> </div> </td> <td class="num" data-astro-cid-aofktf5v><strong data-astro-cid-aofktf5v>5</strong> / 5</td> <td data-astro-cid-aofktf5v>—</td> </tr> </tfoot> </table> </section> <section class="meta" data-astro-cid-aofktf5v> <p data-astro-cid-aofktf5v>
User-Agent: <code data-astro-cid-aofktf5v>${handshakes.ua}</code> </p> <p data-astro-cid-aofktf5v>
Generated: <time${addAttribute(handshakes.generated_at, "datetime")} data-astro-cid-aofktf5v>${generatedHuman}</time>
· Source code: <a href="https://github.com/mhoydich/pointcast/blob/main/scripts/reciprocal-crawl.mjs" data-astro-cid-aofktf5v>scripts/reciprocal-crawl.mjs</a>
· Machine mirror: <a href="/handshakes.json" data-astro-cid-aofktf5v>/handshakes.json</a>
· Studied in <a href="/ues/track-05#week-3" data-astro-cid-aofktf5v>UES Track 05 · Week 3</a> </p> </section> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/handshakes.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/handshakes.astro";
const $$url = "/handshakes";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Handshakes,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
