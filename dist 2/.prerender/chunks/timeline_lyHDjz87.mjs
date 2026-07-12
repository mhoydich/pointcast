import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';

const $$Timeline = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => a.data.timestamp.getTime() - b.data.timestamp.getTime());
  function isoWeekKey(d) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const diff = date.getTime() - firstThursday.getTime();
    const week = 1 + Math.round(diff / 6048e5);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  function weekStartDate(key) {
    const [yearStr, weekStr] = key.split("-W");
    const year = Number(yearStr);
    const week = Number(weekStr);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = (jan4.getUTCDay() + 6) % 7;
    const mondayOfWeek1 = new Date(Date.UTC(year, 0, 4 - jan4Day));
    mondayOfWeek1.setUTCDate(mondayOfWeek1.getUTCDate() + (week - 1) * 7);
    return mondayOfWeek1;
  }
  const grid = {};
  const weekTotals = {};
  const channelTotals = {};
  const typeTotals = {};
  for (const b of blocks) {
    const wk = isoWeekKey(b.data.timestamp);
    const ch = b.data.channel;
    grid[wk] = grid[wk] ?? {};
    grid[wk][ch] = (grid[wk][ch] ?? 0) + 1;
    weekTotals[wk] = (weekTotals[wk] ?? 0) + 1;
    channelTotals[ch] = (channelTotals[ch] ?? 0) + 1;
    typeTotals[b.data.type] = (typeTotals[b.data.type] ?? 0) + 1;
  }
  const firstDate = blocks[0]?.data.timestamp ?? /* @__PURE__ */ new Date();
  const now = /* @__PURE__ */ new Date();
  const allWeeks = [];
  {
    let cursor = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate()));
    while (cursor <= now) {
      const k = isoWeekKey(cursor);
      if (!allWeeks.includes(k)) allWeeks.push(k);
      cursor = new Date(cursor.getTime() + 7 * 864e5);
    }
    const currentWeek = isoWeekKey(now);
    if (!allWeeks.includes(currentWeek)) allWeeks.push(currentWeek);
  }
  const overallWeeks = allWeeks.slice(-24);
  const overallMax = Math.max(1, ...overallWeeks.map((w) => weekTotals[w] ?? 0));
  const sparkWeeks = allWeeks.slice(-12);
  const sparkMax = Math.max(1, ...sparkWeeks.flatMap((w) => CHANNEL_LIST.map((c) => grid[w]?.[c.code] ?? 0)));
  const heatmapMaxPerCell = Math.max(1, ...sparkWeeks.flatMap((w) => CHANNEL_LIST.map((c) => grid[w]?.[c.code] ?? 0)));
  const typeOrder = ["READ", "NOTE", "LINK", "LISTEN", "WATCH", "VISIT", "MINT", "FAUCET"];
  const typeSum = typeOrder.reduce((s, t) => s + (typeTotals[t] ?? 0), 0) || 1;
  function fmtWeekLabel(key) {
    const d = weekStartDate(key);
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).format(d).toUpperCase();
  }
  const firstWeekLabel = overallWeeks[0] ? fmtWeekLabel(overallWeeks[0]) : "—";
  const lastWeekLabel = overallWeeks[overallWeeks.length - 1] ? fmtWeekLabel(overallWeeks[overallWeeks.length - 1]) : "—";
  const typeColors = {
    READ: "#185FA5",
    NOTE: "#5F5E5A",
    LINK: "#3B6D11",
    LISTEN: "#993C1D",
    WATCH: "#534AB7",
    VISIT: "#5F5E5A",
    MINT: "#993556",
    FAUCET: "#BA7517"
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/timeline",
    name: "PointCast · publication cadence",
    description: `Blocks-per-week over the last ${overallWeeks.length} weeks, per channel, plus type distribution. ${blocks.length} blocks since ${firstWeekLabel}.`,
    url: "https://pointcast.xyz/timeline"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Timeline", "description": `Publication cadence for PointCast. ${blocks.length} blocks across ${Object.keys(channelTotals).length} channels, ${firstWeekLabel} → ${lastWeekLabel}.`, "image": "/images/og/timeline.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/timeline.json", title: "Timeline (JSON)" }], "data-astro-cid-qlh7ngej": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page" data-astro-cid-qlh7ngej> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-qlh7ngej> <a href="/" data-astro-cid-qlh7ngej>Home</a> <span aria-hidden="true" data-astro-cid-qlh7ngej>›</span> <span data-astro-cid-qlh7ngej>timeline</span> </nav> <header class="hero" data-astro-cid-qlh7ngej> <p class="kicker" data-astro-cid-qlh7ngej>TIMELINE · PUBLICATION CADENCE</p> <h1 class="display" data-astro-cid-qlh7ngej>The shape of the broadcast.</h1> <p class="dek" data-astro-cid-qlh7ngej> ${blocks.length} blocks across ${Object.keys(channelTotals).length} channels since ${firstWeekLabel}. Every bar is one ISO week,
        height proportional to blocks published that week. All computed at
        build time from the blocks collection — no telemetry, no analytics.
</p> </header>  <section class="panel" data-astro-cid-qlh7ngej> <div class="panel__head" data-astro-cid-qlh7ngej> <p class="section-kicker" data-astro-cid-qlh7ngej>OVERALL · LAST ${overallWeeks.length} WEEKS</p> <p class="section-note" data-astro-cid-qlh7ngej>${firstWeekLabel} → ${lastWeekLabel} · peak ${overallMax} blocks in a week</p> </div> <svg class="chart chart--overall"${addAttribute(`0 0 ${overallWeeks.length * 24} 120`, "viewBox")} preserveAspectRatio="none" role="img" aria-label="Blocks per week, last 24 weeks" data-astro-cid-qlh7ngej> ${overallWeeks.map((wk, i) => {
    const count = weekTotals[wk] ?? 0;
    const h = count > 0 ? Math.max(3, count / overallMax * 100) : 0;
    return renderTemplate`<g data-astro-cid-qlh7ngej> <rect${addAttribute(i * 24 + 2, "x")}${addAttribute(110 - h, "y")} width="20"${addAttribute(h || 2, "height")}${addAttribute(count > 0 ? "#12110E" : "#E5E3DE", "fill")}${addAttribute(count > 0 ? 0.9 : 0.5, "opacity")} data-astro-cid-qlh7ngej> <title>${wk} · ${count} block${count === 1 ? "" : "s"}</title> </rect> <text${addAttribute(i * 24 + 12, "x")}${addAttribute(118, "y")} text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="7" fill="#5F5E5A" data-astro-cid-qlh7ngej>${i % 4 === 0 ? fmtWeekLabel(wk).slice(0, 3) : ""}</text> </g>`;
  })} </svg> </section>  <section class="panel" data-astro-cid-qlh7ngej> <div class="panel__head" data-astro-cid-qlh7ngej> <p class="section-kicker" data-astro-cid-qlh7ngej>PER CHANNEL · LAST ${sparkWeeks.length} WEEKS</p> <p class="section-note" data-astro-cid-qlh7ngej>Same y-scale across channels — tallest bar = ${sparkMax} block${sparkMax === 1 ? "" : "s"} in a week. Hover a bar for the count.</p> </div> <div class="sparklines" data-astro-cid-qlh7ngej> ${CHANNEL_LIST.map((ch) => {
    const total = channelTotals[ch.code] ?? 0;
    return renderTemplate`<a class="spark"${addAttribute(`/c/${ch.slug}`, "href")}${addAttribute(`--ch-c: ${ch.color600}; --ch-c50: ${ch.color50}; --ch-c8: ${ch.color800}`, "style")} data-astro-cid-qlh7ngej> <div class="spark__head" data-astro-cid-qlh7ngej> <span class="spark__code mono" data-astro-cid-qlh7ngej>CH.${ch.code}</span> <span class="spark__count mono" data-astro-cid-qlh7ngej>${total} total</span> </div> <svg class="spark__svg"${addAttribute(`0 0 ${sparkWeeks.length * 10} 38`, "viewBox")} preserveAspectRatio="none" role="img"${addAttribute(`${ch.name} — blocks per week for the last ${sparkWeeks.length} weeks`, "aria-label")} data-astro-cid-qlh7ngej> ${sparkWeeks.map((wk, i) => {
      const count = grid[wk]?.[ch.code] ?? 0;
      const h = count > 0 ? Math.max(3, count / sparkMax * 32) : 0;
      return renderTemplate`<rect${addAttribute(i * 10 + 1, "x")}${addAttribute(36 - h, "y")} width="8"${addAttribute(h || 1.5, "height")}${addAttribute(count > 0 ? ch.color600 : "#E5E3DE", "fill")}${addAttribute(count > 0 ? 1 : 0.6, "opacity")} data-astro-cid-qlh7ngej> <title>${wk} · ${count} ${count === 1 ? "block" : "blocks"}</title> </rect>`;
    })} </svg> <p class="spark__name" data-astro-cid-qlh7ngej>${ch.name}</p> </a>`;
  })} </div> </section>  <section class="panel" data-astro-cid-qlh7ngej> <div class="panel__head" data-astro-cid-qlh7ngej> <p class="section-kicker" data-astro-cid-qlh7ngej>HEATMAP · WEEKS × CHANNELS</p> <p class="section-note" data-astro-cid-qlh7ngej>${sparkWeeks.length}-week window. Cell intensity = fraction of the channel's busiest week. Empty cells are silent weeks.</p> </div> <div class="heatmap" data-astro-cid-qlh7ngej> <div class="heatmap__rows" data-astro-cid-qlh7ngej> ${CHANNEL_LIST.map((ch) => renderTemplate`<div class="heatmap__row" data-astro-cid-qlh7ngej> <span class="heatmap__label mono"${addAttribute(`color: ${ch.color800}`, "style")} data-astro-cid-qlh7ngej>CH.${ch.code}</span> <div class="heatmap__cells" data-astro-cid-qlh7ngej> ${sparkWeeks.map((wk) => {
    const count = grid[wk]?.[ch.code] ?? 0;
    const intensity = heatmapMaxPerCell > 0 ? count / heatmapMaxPerCell : 0;
    const bg = count > 0 ? `color-mix(in oklab, ${ch.color600} ${Math.max(10, intensity * 100)}%, #fff)` : "#fafaf8";
    return renderTemplate`<span class="cell"${addAttribute(`background: ${bg}`, "style")}${addAttribute(`${wk} · CH.${ch.code} · ${count} block${count === 1 ? "" : "s"}`, "title")} data-astro-cid-qlh7ngej> ${count > 0 ? count : ""} </span>`;
  })} </div> </div>`)} </div> <div class="heatmap__legend" data-astro-cid-qlh7ngej> <span class="mono" data-astro-cid-qlh7ngej>WEEK →</span> <span class="heatmap__week-labels" data-astro-cid-qlh7ngej> ${sparkWeeks.map((wk, i) => renderTemplate`<span class="heatmap__week-label mono" data-astro-cid-qlh7ngej>${i % 2 === 0 ? fmtWeekLabel(wk).split(" ")[1] : ""}</span>`)} </span> </div> </div> </section>  <section class="panel" data-astro-cid-qlh7ngej> <div class="panel__head" data-astro-cid-qlh7ngej> <p class="section-kicker" data-astro-cid-qlh7ngej>TYPE DISTRIBUTION · ALL TIME</p> <p class="section-note" data-astro-cid-qlh7ngej>What form do PointCast blocks take? ${blocks.length} total.</p> </div> <div class="types-bar" role="img" aria-label="Stacked bar showing block counts by type" data-astro-cid-qlh7ngej> ${typeOrder.map((t) => {
    const count = typeTotals[t] ?? 0;
    const pct = count / typeSum * 100;
    if (count === 0) return null;
    return renderTemplate`<span class="types-bar__seg"${addAttribute(`width: ${pct}%; background: ${typeColors[t]}`, "style")}${addAttribute(`${t} · ${count} block${count === 1 ? "" : "s"} · ${pct.toFixed(1)}%`, "title")} data-astro-cid-qlh7ngej> ${pct > 8 && renderTemplate`<span class="types-bar__label mono" data-astro-cid-qlh7ngej>${t}</span>`} </span>`;
  })} </div> <dl class="types-legend" data-astro-cid-qlh7ngej> ${typeOrder.map((t) => {
    const count = typeTotals[t] ?? 0;
    if (count === 0) return null;
    const pct = count / typeSum * 100;
    return renderTemplate`<div class="types-legend__item" data-astro-cid-qlh7ngej> <span class="types-legend__swatch"${addAttribute(`background: ${typeColors[t]}`, "style")} data-astro-cid-qlh7ngej></span> <dt class="mono" data-astro-cid-qlh7ngej>${t}</dt> <dd data-astro-cid-qlh7ngej>${count} · ${pct.toFixed(0)}%</dd> </div>`;
  })} </dl> </section> <aside class="surfaces" data-astro-cid-qlh7ngej> <p class="kicker" data-astro-cid-qlh7ngej>AGENT SURFACES</p> <ul class="surfaces__list" data-astro-cid-qlh7ngej> <li data-astro-cid-qlh7ngej><a href="/timeline.json" data-astro-cid-qlh7ngej><span class="mono" data-astro-cid-qlh7ngej>GET</span> /timeline.json</a></li> <li data-astro-cid-qlh7ngej><a href="/archive.json" data-astro-cid-qlh7ngej><span class="mono" data-astro-cid-qlh7ngej>GET</span> /archive.json</a></li> <li data-astro-cid-qlh7ngej><a href="/feed.json" data-astro-cid-qlh7ngej><span class="mono" data-astro-cid-qlh7ngej>GET</span> /feed.json</a></li> <li data-astro-cid-qlh7ngej><a href="/for-agents" data-astro-cid-qlh7ngej><span class="mono" data-astro-cid-qlh7ngej>SEE</span> /for-agents</a></li> </ul> </aside> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/timeline.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/timeline.astro";
const $$url = "/timeline";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Timeline,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
