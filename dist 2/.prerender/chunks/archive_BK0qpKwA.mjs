import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS, a as CHANNEL_LIST } from './channels_C2qW9mSV.mjs';
import { B as BLOCK_TYPE_LIST } from './block-types_l5R3rOkI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Archive = createComponent(async ($$result, $$props, $$slots) => {
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const channelCounts = {};
  const typeCounts = {};
  for (const b of blocks) {
    channelCounts[b.data.channel] = (channelCounts[b.data.channel] ?? 0) + 1;
    typeCounts[b.data.type] = (typeCounts[b.data.type] ?? 0) + 1;
  }
  const rows = [];
  let currentMonthKey = "";
  for (const b of blocks) {
    const d = b.data.timestamp;
    const mk = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (mk !== currentMonthKey) {
      currentMonthKey = mk;
      const monthLabel = new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      }).format(d).toUpperCase();
      rows.push({ kind: "divider", month: monthLabel });
    }
    rows.push({ kind: "block", block: b });
  }
  const firstYear = blocks.length > 0 ? blocks[blocks.length - 1].data.timestamp.getUTCFullYear() : (/* @__PURE__ */ new Date()).getUTCFullYear();
  const latestYear = blocks.length > 0 ? blocks[0].data.timestamp.getUTCFullYear() : (/* @__PURE__ */ new Date()).getUTCFullYear();
  const yearRange = firstYear === latestYear ? `${firstYear}` : `${firstYear}–${latestYear}`;
  function formatDate(d) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC"
    }).format(d).toUpperCase();
  }
  function formatDay(d) {
    return String(d.getUTCDate()).padStart(2, "0");
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://pointcast.xyz/archive",
        name: `PointCast archive · ${blocks.length} blocks`,
        description: `Chronological index of every PointCast block, ${yearRange}.`,
        url: "https://pointcast.xyz/archive",
        hasPart: blocks.slice(0, 50).map((b) => ({
          "@type": "CreativeWork",
          name: b.data.title,
          datePublished: b.data.timestamp.toISOString(),
          url: `https://pointcast.xyz/b/${b.data.id}`,
          identifier: b.data.id
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://pointcast.xyz/archive#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://pointcast.xyz/" },
          { "@type": "ListItem", position: 2, name: "Archive", item: "https://pointcast.xyz/archive" }
        ]
      },
      {
        "@type": "ItemList",
        "@id": "https://pointcast.xyz/archive#itemlist",
        numberOfItems: blocks.length,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        itemListElement: blocks.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://pointcast.xyz/b/${b.data.id}`,
          name: b.data.title
        }))
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Archive", "description": `Chronological index of every PointCast block. ${blocks.length} blocks across ${Object.keys(channelCounts).length} channels, ${yearRange}.`, "image": "/images/og/archive.png", "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/archive.json", title: "Archive (JSON)" }], "data-astro-cid-qma2cssl": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-qma2cssl> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-qma2cssl> <a href="/" data-astro-cid-qma2cssl>Home</a> <span aria-hidden="true" data-astro-cid-qma2cssl>›</span> <span data-astro-cid-qma2cssl>archive</span> </nav> <header class="hero" data-astro-cid-qma2cssl> <p class="kicker" data-astro-cid-qma2cssl>ARCHIVE · ', " BLOCKS · ", '</p> <h1 class="display" data-astro-cid-qma2cssl>Every block, chronologically.</h1> <p class="dek" data-astro-cid-qma2cssl>\nThe homepage is the living feed. This is the record. Every block\n        ever published, reverse-chronological, with channel and type filters.\n        The archive mirror is at <a href="/archive.json" data-astro-cid-qma2cssl>/archive.json</a>.\n</p> </header> <section class="filters" aria-label="Filters" data-astro-cid-qma2cssl> <div class="filter-row" data-astro-cid-qma2cssl> <p class="filter-row__label" data-astro-cid-qma2cssl>CHANNEL</p> <div class="chips" data-filter-group="channel" data-astro-cid-qma2cssl> <button type="button" class="chip chip--active" data-filter="all" data-group="channel" data-astro-cid-qma2cssl>\nALL <span class="chip__count" data-astro-cid-qma2cssl>', "</span> </button> ", ' </div> </div> <div class="filter-row" data-astro-cid-qma2cssl> <p class="filter-row__label" data-astro-cid-qma2cssl>TYPE</p> <div class="chips" data-filter-group="type" data-astro-cid-qma2cssl> <button type="button" class="chip chip--active" data-filter="all" data-group="type" data-astro-cid-qma2cssl>\nALL <span class="chip__count" data-astro-cid-qma2cssl>', "</span> </button> ", ' </div> </div> <div class="filter-row" data-astro-cid-qma2cssl> <p class="filter-row__label" data-astro-cid-qma2cssl>SEARCH</p> <input type="search" class="search" id="archive-search" placeholder="Title, channel, number…" aria-label="Search archive" data-astro-cid-qma2cssl> </div> </section> <section class="stream" id="archive-stream" aria-label="Archive" data-astro-cid-qma2cssl> ', ` </section> <aside class="agent-strip" data-astro-cid-qma2cssl> <p class="kicker" data-astro-cid-qma2cssl>AGENT SURFACES</p> <ul class="agent-strip__list" data-astro-cid-qma2cssl> <li data-astro-cid-qma2cssl><a href="/archive.json" data-astro-cid-qma2cssl><span class="mono" data-astro-cid-qma2cssl>GET</span> /archive.json</a></li> <li data-astro-cid-qma2cssl><a href="/blocks.json" data-astro-cid-qma2cssl><span class="mono" data-astro-cid-qma2cssl>GET</span> /blocks.json</a></li> <li data-astro-cid-qma2cssl><a href="/sitemap-blocks.xml" data-astro-cid-qma2cssl><span class="mono" data-astro-cid-qma2cssl>GET</span> /sitemap-blocks.xml</a></li> <li data-astro-cid-qma2cssl><a href="/rss.xml" data-astro-cid-qma2cssl><span class="mono" data-astro-cid-qma2cssl>RSS</span> /rss.xml</a></li> </ul> </aside> </div> <script>
    // Two-axis filtering: channel ∩ type ∩ search. Hidden rows get
    // display:none; month dividers are hidden if no visible blocks
    // follow them (until the next divider).
    (function () {
      var stream = document.getElementById('archive-stream');
      var search = document.getElementById('archive-search');
      if (!stream || !search) return;

      var state = { channel: 'all', type: 'all', q: '' };
      var rows = Array.prototype.slice.call(stream.querySelectorAll('[data-row]'));
      var chips = document.querySelectorAll('[data-group]');

      function apply() {
        var q = state.q.trim().toLowerCase();
        var lastDividerEl = null;
        var lastDividerHasVisible = false;

        rows.forEach(function (r) {
          if (r.dataset.row === 'divider') {
            if (lastDividerEl) {
              lastDividerEl.style.display = lastDividerHasVisible ? '' : 'none';
            }
            lastDividerEl = r;
            lastDividerHasVisible = false;
            return;
          }
          var matchCh = state.channel === 'all' || r.dataset.channel === state.channel;
          var matchTy = state.type === 'all' || r.dataset.type === state.type;
          var matchQ = !q || (r.dataset.search || '').indexOf(q) !== -1;
          var show = matchCh && matchTy && matchQ;
          r.style.display = show ? '' : 'none';
          if (show) lastDividerHasVisible = true;
        });

        if (lastDividerEl) {
          lastDividerEl.style.display = lastDividerHasVisible ? '' : 'none';
        }
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var group = chip.dataset.group;
          var siblings = document.querySelectorAll('[data-group="' + group + '"]');
          siblings.forEach(function (s) { s.classList.remove('chip--active'); });
          chip.classList.add('chip--active');
          state[group] = chip.dataset.filter;
          apply();
        });
      });

      search.addEventListener('input', function () {
        state.q = search.value || '';
        apply();
      });
    })();
  <\/script> `])), maybeRenderHead(), blocks.length, yearRange, blocks.length, CHANNEL_LIST.filter((c) => (channelCounts[c.code] ?? 0) > 0).map((c) => renderTemplate`<button type="button" class="chip"${addAttribute(c.code, "data-filter")} data-group="channel"${addAttribute(`--chip-c: ${c.color600}; --chip-c8: ${c.color800}; --chip-c50: ${c.color50};`, "style")} data-astro-cid-qma2cssl>
CH.${c.code} · ${c.name} <span class="chip__count" data-astro-cid-qma2cssl>${channelCounts[c.code] ?? 0}</span> </button>`), blocks.length, BLOCK_TYPE_LIST.filter((t) => (typeCounts[t.code] ?? 0) > 0).map((t) => renderTemplate`<button type="button" class="chip"${addAttribute(t.code, "data-filter")} data-group="type" data-astro-cid-qma2cssl> ${t.label} <span class="chip__count" data-astro-cid-qma2cssl>${typeCounts[t.code] ?? 0}</span> </button>`), rows.map((row) => {
    if (row.kind === "divider") {
      return renderTemplate`<div class="divider" data-row="divider" data-astro-cid-qma2cssl> <span class="divider__month" data-astro-cid-qma2cssl>${row.month}</span> <span class="divider__rule" aria-hidden="true" data-astro-cid-qma2cssl></span> </div>`;
    }
    const b = row.block;
    const ch = CHANNELS[b.data.channel];
    const d = b.data.timestamp;
    const isReadOrPost = b.data.type === "READ" && b.data.slug;
    const href = isReadOrPost ? `/posts/${b.data.slug}` : `/b/${b.data.id}`;
    return renderTemplate`<a class="row"${addAttribute(href, "href")} data-row="block"${addAttribute(b.data.channel, "data-channel")}${addAttribute(b.data.type, "data-type")}${addAttribute(`${b.data.title} ${b.data.id} ${ch.code} ${b.data.type} ${ch.name}`.toLowerCase(), "data-search")}${addAttribute(`--row-c: ${ch.color600}; --row-c8: ${ch.color800}; --row-c50: ${ch.color50};`, "style")} data-astro-cid-qma2cssl> <span class="row__date mono"${addAttribute(d.toISOString(), "aria-label")} data-astro-cid-qma2cssl> <span class="row__day" data-astro-cid-qma2cssl>${formatDay(d)}</span> <span class="row__month" data-astro-cid-qma2cssl>${formatDate(d).split(" ")[0]}</span> </span> <span class="row__id mono" data-astro-cid-qma2cssl>№${b.data.id}</span> <span class="row__ch" data-astro-cid-qma2cssl>CH.${ch.code}</span> <span class="row__type mono" data-astro-cid-qma2cssl>${b.data.type}</span> <span class="row__title" data-astro-cid-qma2cssl>${b.data.title}</span> ${b.data.dek && renderTemplate`<span class="row__dek" data-astro-cid-qma2cssl>${b.data.dek}</span>`} </a>`;
  })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/archive.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/archive.astro";
const $$url = "/archive";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Archive,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
