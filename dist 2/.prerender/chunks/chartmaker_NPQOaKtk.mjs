import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getChartmakerPacket } from './chartmaker_CXC3xuzN.mjs';

const $$Chartmaker = createComponent(($$result, $$props, $$slots) => {
  const packet = getChartmakerPacket();
  const nativeSources = packet.sources.filter((source) => source.status === "native");
  const addableSources = packet.sources.filter((source) => source.status !== "native");
  const todayCharts = packet.today.charts;
  const remixes = packet.today.remixes;
  const description = packet.description;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://pointcast.xyz/chartmaker",
    name: packet.name,
    url: packet.canonical,
    description,
    applicationCategory: "DataVisualizationApplication",
    operatingSystem: "Any modern browser"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Chartmaker", "description": description, "image": "/images/og/og-home-v2.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/chartmaker.json", title: "PointCast Chartmaker JSON" }] }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="chartmaker" id="chartmaker"> <nav class="crumb" aria-label="Breadcrumb"> <a href="/">Home</a> <span aria-hidden="true">/</span> <span>chartmaker</span> </nav> <section class="maker-hero" aria-labelledby="maker-title"> <div> <p class="kicker">CHARTMAKER · FEEDS · CROSS-CHARTS</p> <h1 id="maker-title">Make the daily chart weirder, richer, and more useful.</h1> <p>
Chartmaker is the lab behind Chart of the Day: PointCast data first,
          then add weather, stocks, sports, feeds, and local-only memory as chartable lanes.
</p> </div> <aside class="maker-score" aria-label="Chartmaker inventory"> <span>${packet.sources.length} sources</span> <strong>${todayCharts.length}</strong> <em>charts today</em> </aside> </section> <section class="v3-strip" aria-label="Chartmaker v3 thesis"> <p class="kicker">V3 · REMIX DESK</p> <h2>${packet.today.v3.name}</h2> <p>${packet.today.v3.thesis}</p> <strong>${packet.today.v3.primaryAction}</strong> </section> <section class="today-board" aria-labelledby="today-title"> <div class="section-head"> <div> <p class="kicker">TODAY BOARD · ${packet.today.label}</p> <h2 id="today-title">10 charts for today</h2> </div> <a href="/chartmaker.json">Open the data</a> </div> <div class="today-charts"> ${todayCharts.map((chart, index) => {
    const max = Math.max(1, ...chart.points.map((point) => point.value));
    return renderTemplate`<article${addAttribute(`today-chart today-chart--${chart.mode}`, "class")}> <div class="today-chart__top"> <span>${String(index + 1).padStart(2, "0")} · ${chart.kicker}</span> <strong>${chart.mode}</strong> </div> <h3>${chart.title}</h3> <p>${chart.summary}</p> <div class="mini-chart"${addAttribute(`${chart.title} chart values`, "aria-label")}> ${chart.points.map((point) => {
      const height = Math.max(8, Math.round(point.value / max * 100));
      return renderTemplate`<div class="mini-chart__item"> <span class="mini-chart__value">${point.value}</span> <span class="mini-chart__bar"${addAttribute(`height: ${height}%`, "style")}></span> <span class="mini-chart__label">${point.label}</span> </div>`;
    })} </div> <p class="today-chart__read">${chart.read}</p> <div class="chips"${addAttribute(`${chart.title} source`, "aria-label")}> <code>${chart.unit}</code> <a${addAttribute(chart.sourceUrl, "href")}>${chart.source}</a> </div> </article>`;
  })} </div> </section> <section class="remix-board" aria-labelledby="remix-title"> <div class="section-head"> <div> <p class="kicker">REMIX QUEUE</p> <h2 id="remix-title">5 crossovers worth building next</h2> </div> </div> <div class="remixes"> ${remixes.map((remix) => renderTemplate`<article${addAttribute(`remix remix--${remix.lane}`, "class")}> <span>${remix.lane}</span> <h3>${remix.title}</h3> <p>${remix.why}</p> <strong>${remix.nextAction}</strong> <div class="chips"${addAttribute(`${remix.title} chart ingredients`, "aria-label")}> ${remix.charts.map((chart) => renderTemplate`<code>${chart}</code>`)} </div> </article>`)} </div> </section> <section class="recipe-board" aria-labelledby="recipes-title"> <div class="section-head"> <p class="kicker">STARTER CHARTS</p> <h2 id="recipes-title">Cross-chart recipes</h2> </div> <div class="recipes"> ${packet.recipes.map((recipe) => renderTemplate`<article class="recipe"> <span>${recipe.mode}</span> <h3>${recipe.name}</h3> <p>${recipe.question}</p> <em>${recipe.output}</em> <div class="chips"${addAttribute(`${recipe.name} sources`, "aria-label")}> ${recipe.sources.map((source) => renderTemplate`<code>${source}</code>`)} </div> </article>`)} </div> </section> <section class="source-grid" aria-labelledby="sources-title"> <div class="section-head"> <p class="kicker">DATA SOURCES</p> <h2 id="sources-title">Native now, addable next</h2> </div> <div class="lane"> <h3>Native PointCast feeds</h3> <div class="sources"> ${nativeSources.map((source) => renderTemplate`<article class="source source--native"> <span>${source.category} · ${source.status}</span> <h4>${source.name}</h4> <a${addAttribute(source.endpoint, "href")}>${source.endpoint}</a> <p>${source.note}</p> <div class="chips"> ${source.measures.map((measure) => renderTemplate`<code>${measure}</code>`)} </div> </article>`)} </div> </div> <div class="lane"> <h3>Addable feeds</h3> <div class="sources"> ${addableSources.map((source) => renderTemplate`<article class="source"> <span>${source.category} · ${source.status}</span> <h4>${source.name}</h4> <p class="endpoint">${source.endpoint}</p> <p>${source.note}</p> <div class="chips"> ${source.joinKeys.map((key) => renderTemplate`<code>${key}</code>`)} </div> </article>`)} </div> </div> </section> <section class="next" aria-labelledby="next-title"> <div> <p class="kicker">NEXT BUILDS</p> <h2 id="next-title">Turn this into an actual chart bench.</h2> </div> <ol> ${packet.nextBuilds.map((item) => renderTemplate`<li>${item}</li>`)} </ol> <div class="link-grid"> <a href="/chart">Open Chart of the Day</a> <a href="/chartmaker.json">Open /chartmaker.json</a> <a href="/app">Back to app shell</a> </div> </section> </main> ` })} <style>
  :global(body:has(#chartmaker)) {
    background: #eef3ed;
  }

  .chartmaker {
    --ink: #171610;
    --muted: #5f6259;
    --paper: #fffdf6;
    --leaf: #236b4e;
    --blue: #155c9f;
    --gold: #bb7c1e;
    max-width: 1180px;
    margin: 0 auto;
    padding: 22px 16px 88px;
    color: var(--ink);
  }

  .crumb,
  .kicker,
  .maker-score span,
  .maker-score em,
  .today-chart__top,
  .mini-chart__label,
  .mini-chart__value,
  .remix span,
  .recipe span,
  .source span,
  code,
  .link-grid a {
    font-family: var(--pc-font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .crumb {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    color: var(--muted);
    font-size: 10px;
  }

  .maker-hero,
  .v3-strip,
  .today-board,
  .remix-board,
  .recipe-board,
  .source-grid,
  .next {
    margin-top: 14px;
  }

  .maker-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
    gap: 14px;
  }

  .maker-hero > div,
  .maker-score,
  .v3-strip,
  .today-board,
  .remix-board,
  .recipe-board,
  .source-grid,
  .next,
  .recipe,
  .today-chart,
  .remix,
  .source {
    border: 1.5px solid var(--ink);
    background: var(--paper);
    box-shadow: 4px 4px 0 var(--ink);
  }

  .maker-hero > div,
  .maker-score,
  .v3-strip,
  .today-board,
  .remix-board,
  .recipe-board,
  .source-grid,
  .next {
    padding: clamp(18px, 3vw, 34px);
  }

  .kicker {
    margin: 0 0 10px;
    color: var(--leaf);
    font-size: 10px;
    font-weight: 800;
  }

  h1 {
    max-width: 860px;
    margin: 0;
    font-size: clamp(42px, 7vw, 86px);
    line-height: 0.92;
    font-weight: 650;
    letter-spacing: 0;
  }

  .maker-hero p,
  .v3-strip p,
  .remix p,
  .recipe p,
  .source p,
  .next li {
    color: var(--muted);
    font-size: 16px;
    line-height: 1.45;
  }

  .maker-score {
    display: grid;
    align-content: center;
    gap: 10px;
  }

  .maker-score strong {
    color: var(--blue);
    font-size: clamp(88px, 15vw, 150px);
    line-height: 0.82;
  }

  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .section-head > a {
    color: var(--blue);
    font-weight: 800;
  }

  h2,
  h3,
  h4 {
    margin: 0;
    letter-spacing: 0;
  }

  h2 {
    font-size: clamp(28px, 4vw, 48px);
    line-height: 0.98;
  }

  .recipes,
  .today-charts,
  .remixes,
  .sources {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .today-charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .recipe,
  .today-chart,
  .remix,
  .source {
    box-shadow: 2px 2px 0 var(--ink);
    padding: 16px;
  }

  .recipe span,
  .today-chart__top,
  .remix span,
  .source span {
    color: var(--gold);
    font-size: 9px;
    font-weight: 800;
  }

  .v3-strip {
    display: grid;
    gap: 8px;
  }

  .v3-strip strong,
  .remix strong {
    color: var(--blue);
  }

  .remix {
    display: grid;
    gap: 10px;
  }

  .remix h3 {
    margin: 0;
    font-size: clamp(24px, 3vw, 34px);
    line-height: 0.98;
  }

  .remix p {
    margin: 0;
  }

  .remix--local { background: #f4fbf0; }
  .remix--market { background: #f6f8ff; }
  .remix--sports { background: #fff8ea; }
  .remix--planet { background: #f0f8f8; }
  .remix--culture { background: #fbf2f7; }

  .today-chart {
    display: grid;
    gap: 12px;
  }

  .today-chart__top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .today-chart h3 {
    margin: 0;
    font-size: clamp(26px, 3vw, 38px);
    line-height: 0.98;
  }

  .today-chart p {
    margin: 0;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.45;
  }

  .today-chart__read {
    border-top: 1px solid rgba(23, 22, 16, 0.18);
    padding-top: 10px;
  }

  .mini-chart {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(34px, 1fr);
    align-items: end;
    gap: 7px;
    height: 156px;
    overflow-x: auto;
    border: 1px solid rgba(23, 22, 16, 0.18);
    background: #fff;
    padding: 10px;
  }

  .mini-chart__item {
    display: grid;
    grid-template-rows: 24px 1fr 24px;
    align-items: end;
    gap: 5px;
    min-width: 34px;
    height: 100%;
  }

  .mini-chart__value,
  .mini-chart__label {
    color: var(--muted);
    font-size: 9px;
    font-weight: 800;
    text-align: center;
  }

  .mini-chart__bar {
    display: block;
    min-height: 8px;
    border: 1px solid var(--ink);
    background: linear-gradient(180deg, #f1c45a, #155c9f);
    box-shadow: 2px 2px 0 var(--ink);
  }

  .today-chart--line .mini-chart__bar {
    background: linear-gradient(180deg, #7eb98a, #155c9f);
  }

  .today-chart--timeline .mini-chart__bar,
  .today-chart--scorecard .mini-chart__bar {
    background: linear-gradient(180deg, #f1c45a, #236b4e);
  }

  .recipe h3,
  .source h4,
  .lane h3 {
    margin-top: 8px;
    font-size: 24px;
    line-height: 1;
  }

  .recipe em,
  .source a,
  .endpoint {
    overflow-wrap: anywhere;
  }

  .recipe em {
    display: block;
    color: var(--blue);
    font-style: normal;
    font-weight: 650;
  }

  .lane + .lane {
    margin-top: 22px;
  }

  .lane h3 {
    margin-bottom: 12px;
  }

  .source--native {
    background: #f2f9f3;
  }

  .source a {
    display: inline-block;
    margin-top: 8px;
    color: var(--blue);
    font-weight: 700;
  }

  .today-chart .chips a {
    border: 1px solid rgba(23, 22, 16, 0.22);
    background: #fff;
    padding: 5px 7px;
    color: var(--blue);
    font-family: var(--pc-font-mono);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
  }

  code {
    border: 1px solid rgba(23, 22, 16, 0.22);
    background: #fff;
    padding: 5px 7px;
    color: var(--ink);
    font-size: 9px;
  }

  .next {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1fr);
    gap: 18px;
    align-items: start;
  }

  .next ol {
    margin: 0;
    padding-left: 20px;
  }

  .link-grid {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .link-grid a {
    display: flex;
    align-items: center;
    min-height: 44px;
    border: 1px solid var(--ink);
    padding: 0 12px;
    color: var(--ink);
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }

  @media (max-width: 860px) {
    .maker-hero,
    .remixes,
    .today-charts,
    .next,
    .recipes,
    .sources,
    .link-grid {
      grid-template-columns: 1fr;
    }

    .section-head {
      display: grid;
      align-items: start;
    }
  }
</style>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/chartmaker.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/chartmaker.astro";
const $$url = "/chartmaker";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Chartmaker,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
