import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, u as unescapeHTML } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { r as readAllRecaps, s as summary } from './sprint-recap_OvTdaPLs.mjs';

const $$Sprints = createComponent(($$result, $$props, $$slots) => {
  const recaps = readAllRecaps();
  const stats = summary(recaps);
  const title = "Sprints — autonomous work log";
  const description = "Every sprint cc has shipped, in chronological order. Each entry: trigger, duration, what shipped, what didn't, follow-ups, notes. Read by humans + agents.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PointCast Sprint Log",
    description,
    url: "https://pointcast.xyz/sprints",
    hasPart: recaps.map((r) => ({
      "@type": "Article",
      name: r.title,
      datePublished: r.firedAt,
      url: `https://pointcast.xyz/sprints#${r.sprintId}`,
      author: { "@type": "SoftwareApplication", name: "Claude Code" }
    }))
  };
  function fmtTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Los_Angeles"
      }).format(d) + " PT";
    } catch {
      return iso;
    }
  }
  function bulletize(raw) {
    return raw.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-")).map((l) => l.replace(/^-\s*/, ""));
  }
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/sprints.png", "jsonLd": jsonLd, "data-astro-cid-odw6m7su": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page" data-astro-cid-odw6m7su> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-odw6m7su> <a href="/" data-astro-cid-odw6m7su>Home</a> <span aria-hidden="true" data-astro-cid-odw6m7su>›</span> <span data-astro-cid-odw6m7su>sprints</span> </nav> <header class="head" data-astro-cid-odw6m7su> <p class="kicker mono" data-astro-cid-odw6m7su>SPRINTS · AUTONOMOUS WORK LOG</p> <h1 class="title" data-astro-cid-odw6m7su>Every sprint cc has shipped.</h1> <p class="dek" data-astro-cid-odw6m7su>
Each entry is a recap file at <code data-astro-cid-odw6m7su>docs/sprints/&#123;date&#125;-&#123;slug&#125;.md</code>
written by cc on the cron tick (or chat tick) that fired it.
<a href="/sprint" data-astro-cid-odw6m7su>/sprint</a> is the picker; this is the record.
        Schema docs at <code data-astro-cid-odw6m7su>docs/sprints/README.md</code>; companion JSON
        at <a href="/sprints.json" data-astro-cid-odw6m7su>/sprints.json</a>.
</p> <ul class="stats" data-astro-cid-odw6m7su> <li data-astro-cid-odw6m7su><span class="stats__num" data-astro-cid-odw6m7su>${stats.count}</span><span class="stats__lbl mono" data-astro-cid-odw6m7su>SPRINTS</span></li> <li data-astro-cid-odw6m7su><span class="stats__num" data-astro-cid-odw6m7su>${stats.totalMin}</span><span class="stats__lbl mono" data-astro-cid-odw6m7su>CC MINUTES</span></li> <li data-astro-cid-odw6m7su><span class="stats__num" data-astro-cid-odw6m7su>${stats.totalHours}h</span><span class="stats__lbl mono" data-astro-cid-odw6m7su>CUMULATIVE</span></li> <li data-astro-cid-odw6m7su><span class="stats__num" data-astro-cid-odw6m7su>${stats.byTrigger.cron || 0}</span><span class="stats__lbl mono" data-astro-cid-odw6m7su>CRON-FIRED</span></li> </ul> </header> ${recaps.length === 0 ? renderTemplate`<section class="empty" data-astro-cid-odw6m7su> <p data-astro-cid-odw6m7su>No sprint recaps yet. Once cc fires its first sprint, it lands here.</p> </section>` : renderTemplate`<ol class="recaps" data-astro-cid-odw6m7su> ${recaps.map((r) => renderTemplate`<li class="recap"${addAttribute(r.sprintId, "id")} data-astro-cid-odw6m7su> <header class="recap__head" data-astro-cid-odw6m7su> <h2 class="recap__title" data-astro-cid-odw6m7su>${r.title}</h2> <div class="recap__meta mono" data-astro-cid-odw6m7su> <span${addAttribute(`recap__trigger recap__trigger--${r.trigger || "unknown"}`, "class")} data-astro-cid-odw6m7su>${(r.trigger || "?").toUpperCase()}</span> <span class="recap__time" data-astro-cid-odw6m7su>${fmtTime(r.firedAt)}</span> ${typeof r.durationMin === "number" && renderTemplate`<span class="recap__duration" data-astro-cid-odw6m7su>${r.durationMin}m</span>`} ${r.status && renderTemplate`<span${addAttribute(`recap__status recap__status--${r.status.replace(/-/g, "_")}`, "class")} data-astro-cid-odw6m7su>${r.status.toUpperCase()}</span>`} </div> <p class="recap__id mono" data-astro-cid-odw6m7su>#${r.sprintId}${r.shippedAs ? ` · ${r.shippedAs}` : ""}</p> </header> ${r.sections["what-shipped"] && renderTemplate`<div class="recap__section" data-astro-cid-odw6m7su> <p class="recap__section-title mono" data-astro-cid-odw6m7su>WHAT SHIPPED</p> <ul class="recap__bullets" data-astro-cid-odw6m7su> ${bulletize(r.sections["what-shipped"]).map((b) => renderTemplate`<li data-astro-cid-odw6m7su>${unescapeHTML(
    b.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  )}</li>`)} </ul> </div>`} ${r.sections["what-didn-t"] && renderTemplate`<details class="recap__section recap__section--collapsible" data-astro-cid-odw6m7su> <summary class="recap__section-title mono" data-astro-cid-odw6m7su>WHAT DIDN'T · expand</summary> <ul class="recap__bullets" data-astro-cid-odw6m7su> ${bulletize(r.sections["what-didn-t"]).map((b) => renderTemplate`<li data-astro-cid-odw6m7su>${unescapeHTML(
    b.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  )}</li>`)} </ul> </details>`} ${r.sections["follow-ups"] && renderTemplate`<details class="recap__section recap__section--collapsible" data-astro-cid-odw6m7su> <summary class="recap__section-title mono" data-astro-cid-odw6m7su>FOLLOW-UPS · expand</summary> <ul class="recap__bullets" data-astro-cid-odw6m7su> ${bulletize(r.sections["follow-ups"]).map((b) => renderTemplate`<li data-astro-cid-odw6m7su>${unescapeHTML(
    b.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  )}</li>`)} </ul> </details>`} ${r.sections["notes"] && renderTemplate`<details class="recap__section recap__section--collapsible" data-astro-cid-odw6m7su> <summary class="recap__section-title mono" data-astro-cid-odw6m7su>NOTES · expand</summary> <p class="recap__notes" data-astro-cid-odw6m7su>${r.sections["notes"]}</p> </details>`} </li>`)} </ol>`} <section class="agent-strip" data-astro-cid-odw6m7su> <p class="agent-strip__label mono" data-astro-cid-odw6m7su>MACHINE-READABLE</p> <ul data-astro-cid-odw6m7su> <li data-astro-cid-odw6m7su><a href="/sprints.json" data-astro-cid-odw6m7su>/sprints.json</a></li> <li data-astro-cid-odw6m7su><a href="/sprint" data-astro-cid-odw6m7su>/sprint</a></li> <li data-astro-cid-odw6m7su><a href="/api/queue" data-astro-cid-odw6m7su>/api/queue</a></li> <li data-astro-cid-odw6m7su><a href="/agents.json" data-astro-cid-odw6m7su>/agents.json</a></li> <li data-astro-cid-odw6m7su><a href="/for-agents" data-astro-cid-odw6m7su>/for-agents</a></li> </ul> </section> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sprints.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/sprints.astro";
const $$url = "/sprints";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sprints,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
