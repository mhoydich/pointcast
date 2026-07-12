import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { b as addAttribute, e as renderHead, r as renderComponent, F as Fragment, a as renderTemplate } from './prerender_CmTjnOuJ.mjs';

async function getStaticPaths() {
  try {
    const baseUrl = "https://pointcast.xyz";
    const res = await fetch(`${baseUrl}/api/recap?index=true`);
    if (!res.ok) return [];
    const ids = await res.json();
    return ids.map((id) => ({ params: { week: id } }));
  } catch {
    return [];
  }
}
const $$week = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$week;
  const { week } = Astro2.params;
  const isValidWeek = /^\d{4}-w\d{2}$/.test(week ?? "");
  let recap = null;
  let notFound = false;
  if (!isValidWeek) {
    notFound = true;
  } else {
    try {
      const baseUrl = "https://pointcast.xyz";
      const res = await fetch(`${baseUrl}/api/recap?week=${week}`, {
        cf: { cacheTtl: 3600, cacheEverything: true }
      });
      if (res.status === 404) {
        notFound = true;
      } else if (res.ok) {
        recap = await res.json();
      }
    } catch {
      notFound = true;
    }
  }
  if (notFound) {
    return Astro2.redirect("/404");
  }
  function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOpts = { month: "long", day: "numeric" };
    const endOpts = { month: "long", day: "numeric", year: "numeric" };
    return `${start.toLocaleDateString("en-US", startOpts)} – ${end.toLocaleDateString("en-US", endOpts)}`;
  }
  function formatNumber(n) {
    return n.toLocaleString("en-US");
  }
  function formatPublishedDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  const dateRange = recap ? formatDateRange(recap.startDate, recap.endDate) : "";
  const publishedDate = recap ? formatPublishedDate(recap.publishedAt) : "";
  const pageTitle = recap ? `Week of ${dateRange} — PointCast Dispatch` : "Dispatch Not Found";
  const canonicalUrl = `https://pointcast.xyz/recap/${week}`;
  return renderTemplate`<html lang="en" data-astro-cid-np7w55go> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${pageTitle}</title><meta name="description"${addAttribute(recap ? `PointCast weekly dispatch: ${recap.heroMoment.headline}` : "PointCast weekly recap", "content")}><link rel="canonical"${addAttribute(canonicalUrl, "href")}><!-- Open Graph --><meta property="og:type" content="article"><meta property="og:title"${addAttribute(pageTitle, "content")}><meta property="og:description"${addAttribute(recap?.heroMoment.headline ?? "", "content")}><meta property="og:url"${addAttribute(canonicalUrl, "content")}><meta property="og:site_name" content="PointCast"><!-- RSS Discovery --><link rel="alternate" type="application/rss+xml" title="PointCast Weekly Dispatch" href="/rss.xml">${renderHead()}</head> <body data-astro-cid-np7w55go> ${recap && renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result2) => renderTemplate`  <header class="masthead" data-astro-cid-np7w55go> <a href="/" class="masthead__back" data-astro-cid-np7w55go>&larr; PointCast</a> <p class="masthead__nameplate" data-astro-cid-np7w55go>The PointCast Dispatch</p> <h1 class="masthead__title" data-astro-cid-np7w55go>This Week at PointCast</h1> <p class="masthead__dateline" data-astro-cid-np7w55go> ${dateRange} &nbsp;&mdash;&nbsp; Published ${publishedDate} </p> </header> <main class="dispatch" data-astro-cid-np7w55go> ${recap.isQuietWeek ? renderTemplate`<!-- Zero-activity week -->
        <p class="quiet-week-notice" data-astro-cid-np7w55go> ${recap.heroMoment.description} </p>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result3) => renderTemplate`  <p class="section-label" data-astro-cid-np7w55go>By the numbers</p> <div class="stats-grid" data-astro-cid-np7w55go> <div class="stat-block" data-astro-cid-np7w55go> <span class="stat-block__number" data-astro-cid-np7w55go>${formatNumber(recap.totalDrums)}</span> <p class="stat-block__caption" data-astro-cid-np7w55go>
Drums this week.
${recap.topDrummerHandle !== "anonymous" && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result4) => renderTemplate` Led by <strong data-astro-cid-np7w55go>@${recap.topDrummerHandle}</strong> with ${formatNumber(recap.topDrummerCount)}.` })}`} </p> </div> <div class="stat-block" data-astro-cid-np7w55go> <span class="stat-block__number" data-astro-cid-np7w55go>${formatNumber(recap.newVisitors)}</span> <p class="stat-block__caption" data-astro-cid-np7w55go>
New visitors cast their presence.
</p> </div> <div class="stat-block" data-astro-cid-np7w55go> <span class="stat-block__number" data-astro-cid-np7w55go>#${recap.topNounId}</span> <p class="stat-block__caption" data-astro-cid-np7w55go>
Top noun of the week.
${recap.topNounVisits > 0 && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result4) => renderTemplate` Chosen by <strong data-astro-cid-np7w55go>${formatNumber(recap.topNounVisits)}</strong> visitors.` })}`} </p> </div> ${recap.newDrops.length > 0 && renderTemplate`<div class="stat-block" data-astro-cid-np7w55go> <span class="stat-block__number" data-astro-cid-np7w55go>${recap.newDrops.length}</span> <p class="stat-block__caption" data-astro-cid-np7w55go>
New ${recap.newDrops.length === 1 ? "drop" : "drops"} published this week.
</p> </div>`} ${recap.nounBreakdown.length > 0 && renderTemplate`<div class="stat-block" data-astro-cid-np7w55go> <span class="stat-block__number" data-astro-cid-np7w55go>${recap.nounBreakdown.length}</span> <p class="stat-block__caption" data-astro-cid-np7w55go>
Distinct nouns represented across all visits.
</p> </div>`} </div>  <hr class="section-rule" data-astro-cid-np7w55go> <div class="hero-moment" data-astro-cid-np7w55go> <span class="hero-moment__tag" data-astro-cid-np7w55go>Moment of the Week</span> <h2 class="hero-moment__headline" data-astro-cid-np7w55go>${recap.heroMoment.headline}</h2> <p class="hero-moment__description" data-astro-cid-np7w55go>${recap.heroMoment.description}</p> </div>  ${recap.nounBreakdown.length > 1 && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result4) => renderTemplate` <hr class="section-rule" data-astro-cid-np7w55go> <p class="section-label" data-astro-cid-np7w55go>Noun leaderboard</p> <div class="noun-leaderboard" data-astro-cid-np7w55go> ${recap.nounBreakdown.slice(0, 8).map((entry, i) => {
    const maxVisits = recap.nounBreakdown[0].visitCount;
    const pct = maxVisits > 0 ? Math.round(entry.visitCount / maxVisits * 100) : 0;
    return renderTemplate`<div class="noun-row" data-astro-cid-np7w55go> <span class="noun-row__rank" data-astro-cid-np7w55go>${i + 1}</span> <div class="noun-row__label" data-astro-cid-np7w55go> <span class="noun-row__id" data-astro-cid-np7w55go>Noun #${entry.nounId}</span> <div class="noun-row__bar-wrap" data-astro-cid-np7w55go> <div class="noun-row__bar"${addAttribute(`width: ${pct}%`, "style")} data-astro-cid-np7w55go></div> </div> </div> <span class="noun-row__visits" data-astro-cid-np7w55go>${formatNumber(entry.visitCount)}</span> </div>`;
  })} </div> ` })}`} ${recap.newDrops.length > 0 && renderTemplate`${renderComponent($$result3, "Fragment", Fragment, { "data-astro-cid-np7w55go": true }, { "default": async ($$result4) => renderTemplate` <hr class="section-rule" data-astro-cid-np7w55go> <p class="section-label" data-astro-cid-np7w55go>New this week</p> <div class="drops-list" data-astro-cid-np7w55go> ${recap.newDrops.map((drop) => renderTemplate`<div class="drop-item" data-astro-cid-np7w55go> <a${addAttribute(drop.url, "href")} class="drop-item__title" target="_blank" rel="noopener" data-astro-cid-np7w55go> ${drop.title} </a> ${drop.teaser && renderTemplate`<p class="drop-item__teaser" data-astro-cid-np7w55go>${drop.teaser}</p>`} </div>`)} </div> ` })}`}` })}`} <!-- Footer --> <footer class="dispatch-footer" data-astro-cid-np7w55go> <span data-astro-cid-np7w55go>PointCast Dispatch &mdash; ${recap.id}</span> <a href="/rss.xml" data-astro-cid-np7w55go>RSS Feed</a> </footer> </main> ` })}`} </body></html>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/recap/[week].astro", void 0);
const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/recap/[week].astro";
const $$url = "/recap/[week]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$week,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
