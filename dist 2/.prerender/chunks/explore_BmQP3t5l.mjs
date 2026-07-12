import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, d as defineScriptVars, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { c as countByCategory, F as FEATURES, r as recentFeatures, s as staleFeatures, C as CATEGORIES } from './explore_VIsa8iQ4.mjs';
import { P as POINTCAST_APPS } from './pointcast-apps_DuRB6sfu.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Explore = createComponent(($$result, $$props, $$slots) => {
  const counts = countByCategory();
  const total = FEATURES.length;
  const channelList = Object.values(CHANNELS);
  const recent = recentFeatures(7, 16);
  const stale = staleFeatures(90, 12);
  function howRecent(unix) {
    const days = Math.floor((Date.now() / 1e3 - unix) / 86400);
    if (days <= 0) return "today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  }
  function howStale(unix) {
    const days = Math.floor((Date.now() / 1e3 - unix) / 86400);
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years}y untouched`;
    }
    return `${days}d untouched`;
  }
  const orderedCategories = CATEGORIES.filter((c) => (counts[c.key] ?? 0) > 0).concat([
    { key: "misc", label: "Other Rooms", blurb: "Everything else — the long tail.", match: () => true }
  ]);
  const featuresByCat = {};
  for (const c of orderedCategories) featuresByCat[c.key] = [];
  for (const f of FEATURES) (featuresByCat[f.category] ??= []).push(f);
  const slugList = JSON.stringify(FEATURES.map((f) => f.slug));
  const title = "PointCast Feature Explorer";
  const description = "One directory of every PointCast surface — drum hub, Nouns Battler, agent lanes, Sing, Visit log, sprints, local rooms, channels, apps. Filter, search, click. Auto-built from the page tree.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/explore",
    name: title,
    description,
    url: "https://pointcast.xyz/explore",
    numberOfItems: total
  };
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", "\n  (function () {\n    var search = document.getElementById('explorer-search');\n    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));\n    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));\n    var sections = Array.prototype.slice.call(document.querySelectorAll('.bucket, .apps'));\n    var empty = document.getElementById('empty');\n    var random = document.getElementById('random-door');\n\n    var activeCat = 'all';\n    var query = '';\n    var slugs = [];\n    try { slugs = JSON.parse(slugList); } catch (e) { slugs = []; }\n\n    function apply() {\n      var q = query.trim().toLowerCase();\n      var visible = 0;\n      tiles.forEach(function (tile) {\n        var section = tile.closest('.bucket') || tile.closest('.apps');\n        var tileCat = 'misc';\n        if (section) {\n          if (section.classList.contains('apps')) tileCat = 'apps';\n          else if (section.dataset && section.dataset.cat) tileCat = section.dataset.cat;\n        }\n        var hay = tile.dataset.haystack || (tile.textContent || '').toLowerCase();\n        var catOk = activeCat === 'all' || tileCat === activeCat;\n        var qOk = q === '' || hay.indexOf(q) !== -1;\n        var show = catOk && qOk;\n        tile.classList.toggle('is-hidden', !show);\n        if (show) visible++;\n      });\n      sections.forEach(function (section) {\n        var anyVisible = !!section.querySelector('.tile:not(.is-hidden)');\n        section.classList.toggle('is-hidden', !anyVisible);\n      });\n      if (empty) empty.hidden = visible !== 0;\n    }\n\n    if (search) {\n      search.addEventListener('input', function (e) {\n        query = e.target.value;\n        apply();\n      });\n    }\n\n    chips.forEach(function (chip) {\n      chip.addEventListener('click', function () {\n        chips.forEach(function (c) { c.classList.remove('is-on'); });\n        chip.classList.add('is-on');\n        activeCat = chip.dataset.cat || 'all';\n        apply();\n      });\n    });\n\n    function rollDoor() {\n      if (!slugs.length) return;\n      var pick = slugs[Math.floor(Math.random() * slugs.length)];\n      window.location.href = pick;\n    }\n    if (random) random.addEventListener('click', rollDoor);\n\n    document.addEventListener('keydown', function (e) {\n      var tag = (e.target && e.target.tagName) || '';\n      var inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';\n      if (e.key === '/' && !inField) {\n        e.preventDefault();\n        if (search) search.focus();\n      } else if (e.key === '?' && !inField) {\n        e.preventDefault();\n        rollDoor();\n      } else if (e.key === 'Escape' && inField && search && e.target === search) {\n        search.value = '';\n        query = '';\n        apply();\n        search.blur();\n      }\n    });\n  })();\n})();<\/script>"])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/explore.json", title: "PointCast Explorer (JSON)" },
    { type: "application/rss+xml", href: "/explore.rss", title: "PointCast Explorer · New rooms (RSS)" }
  ], "data-astro-cid-jsy7jxlt": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="explorer" data-astro-cid-jsy7jxlt> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-jsy7jxlt> <a href="/" data-astro-cid-jsy7jxlt>Home</a> <span aria-hidden="true" data-astro-cid-jsy7jxlt>/</span> <span data-astro-cid-jsy7jxlt>explore</span> </nav> <header class="hero" data-astro-cid-jsy7jxlt> <p class="kicker" data-astro-cid-jsy7jxlt>▓▒░ FEATURE EXPLORER · ${total} ROOMS ░▒▓</p> <h1 data-astro-cid-jsy7jxlt>Every door in PointCast, on one street.</h1> <p class="lede" data-astro-cid-jsy7jxlt>
PointCast has grown into a small internet town. This is the directory:
        every public surface, bucketed by neighborhood, searchable, walkable.
        Press <kbd data-astro-cid-jsy7jxlt>/</kbd> to search, <kbd data-astro-cid-jsy7jxlt>?</kbd> for a random door, <kbd data-astro-cid-jsy7jxlt>Esc</kbd> to clear.
</p> <p class="agent-link" data-astro-cid-jsy7jxlt>
Agents: see <a href="/explore.json" data-astro-cid-jsy7jxlt>/explore.json</a> for the structured manifest,
        or <a href="/explore.rss" data-astro-cid-jsy7jxlt>/explore.rss</a> to subscribe to new rooms.
</p> </header> <section class="controls" aria-label="Filter" data-astro-cid-jsy7jxlt> <div class="row" data-astro-cid-jsy7jxlt> <label class="search" data-astro-cid-jsy7jxlt> <span class="srlbl" data-astro-cid-jsy7jxlt>Search</span> <input id="explorer-search" type="search" placeholder="search rooms, e.g. drum, nouns, sing…" autocomplete="off" data-astro-cid-jsy7jxlt> </label> <button id="random-door" type="button" class="random" title="Random door (?)" data-astro-cid-jsy7jxlt> <span aria-hidden="true" data-astro-cid-jsy7jxlt>⚀</span> random
</button> </div> <div class="chips" role="tablist" aria-label="Category filter" data-astro-cid-jsy7jxlt> <button class="chip is-on" data-cat="all" type="button" data-astro-cid-jsy7jxlt>
All <em data-astro-cid-jsy7jxlt>${total}</em> </button> ${orderedCategories.map((c) => renderTemplate`<button class="chip"${addAttribute(c.key, "data-cat")} type="button" data-astro-cid-jsy7jxlt> ${c.label} <em data-astro-cid-jsy7jxlt>${counts[c.key] ?? featuresByCat[c.key]?.length ?? 0}</em> </button>`)} </div> </section> ${recent.length > 0 && renderTemplate`<section class="recent" data-cat="recent" data-astro-cid-jsy7jxlt> <header class="bucket-head" data-astro-cid-jsy7jxlt> <h2 data-astro-cid-jsy7jxlt><span class="dot dot--new" data-astro-cid-jsy7jxlt></span>New this week</h2> <p data-astro-cid-jsy7jxlt>Pages whose latest commit landed in the last 7 days. Newest first.</p> <span class="bucket-count" data-astro-cid-jsy7jxlt>${recent.length}</span> </header> <ul class="recent-strip" data-astro-cid-jsy7jxlt> ${recent.map((f) => renderTemplate`<li class="strip-tile" data-astro-cid-jsy7jxlt> <a${addAttribute(f.slug, "href")} data-astro-cid-jsy7jxlt> <span class="strip-when" data-astro-cid-jsy7jxlt>${howRecent(f.mtime)}</span> <span class="strip-slug" data-astro-cid-jsy7jxlt>${f.slug}</span> <span class="strip-title" data-astro-cid-jsy7jxlt>${f.title}</span> </a> </li>`)} </ul> </section>`} <section class="channels" data-astro-cid-jsy7jxlt> <header class="bucket-head" data-astro-cid-jsy7jxlt> <h2 data-astro-cid-jsy7jxlt><span class="dot dot--ch" data-astro-cid-jsy7jxlt></span>Channels</h2> <p data-astro-cid-jsy7jxlt>The 10 BLOCKS.md primitives — every block belongs to one.</p> <span class="bucket-count" data-astro-cid-jsy7jxlt>${channelList.length}</span> </header> <ul class="ch-grid" data-astro-cid-jsy7jxlt> ${channelList.map((ch) => renderTemplate`<li class="ch-tile"${addAttribute(`--ch-600: ${ch.color600}; --ch-50: ${ch.color50}`, "style")} data-astro-cid-jsy7jxlt> <a${addAttribute(`/c/${ch.slug}`, "href")} data-astro-cid-jsy7jxlt> <span class="ch-code" data-astro-cid-jsy7jxlt>${ch.code}</span> <span class="ch-name" data-astro-cid-jsy7jxlt>${ch.name}</span> <span class="ch-purpose" data-astro-cid-jsy7jxlt>${ch.purpose}</span> </a> </li>`)} </ul> </section> ${orderedCategories.map((c) => {
    const items = featuresByCat[c.key];
    if (!items || items.length === 0) return null;
    return renderTemplate`<section class="bucket"${addAttribute(c.key, "data-cat")} data-astro-cid-jsy7jxlt> <header class="bucket-head" data-astro-cid-jsy7jxlt> <h2 data-astro-cid-jsy7jxlt><span class="dot" data-astro-cid-jsy7jxlt></span>${c.label}</h2> <p data-astro-cid-jsy7jxlt>${c.blurb}</p> <span class="bucket-count" data-astro-cid-jsy7jxlt>${items.length}</span> </header> <ul class="grid" data-astro-cid-jsy7jxlt> ${items.map((f) => renderTemplate`<li class="tile"${addAttribute(`${f.slug} ${f.title} ${f.description}`.toLowerCase(), "data-haystack")} data-astro-cid-jsy7jxlt> <a${addAttribute(f.slug, "href")} data-astro-cid-jsy7jxlt> <span class="slug" data-astro-cid-jsy7jxlt>${f.slug}</span> <span class="title" data-astro-cid-jsy7jxlt>${f.title}</span> ${f.description && renderTemplate`<span class="dek" data-astro-cid-jsy7jxlt>${f.description}</span>`} <span class="cta" data-astro-cid-jsy7jxlt>enter →</span> </a> </li>`)} </ul> </section>`;
  })} <section class="apps" data-cat="apps" data-astro-cid-jsy7jxlt> <header class="bucket-head" data-astro-cid-jsy7jxlt> <h2 data-astro-cid-jsy7jxlt><span class="dot dot--apps" data-astro-cid-jsy7jxlt></span>External Apps</h2> <p data-astro-cid-jsy7jxlt>Standalone surfaces that live outside this repo but flag up here.</p> <span class="bucket-count" data-astro-cid-jsy7jxlt>${POINTCAST_APPS.length}</span> </header> <ul class="grid" data-astro-cid-jsy7jxlt> ${POINTCAST_APPS.map((a) => renderTemplate`<li class="tile tile--ext"${addAttribute(`${a.name} ${a.url} ${a.description}`.toLowerCase(), "data-haystack")} data-astro-cid-jsy7jxlt> <a${addAttribute(a.url, "href")} target="_blank" rel="noopener" data-astro-cid-jsy7jxlt> <span class="slug" data-astro-cid-jsy7jxlt>${a.url.replace(/^https?:\/\//, "")}</span> <span class="title" data-astro-cid-jsy7jxlt>${a.name}</span> <span class="dek" data-astro-cid-jsy7jxlt>${a.description}</span> <span class="cta" data-astro-cid-jsy7jxlt>launch ↗</span> </a> </li>`)} </ul> </section> ${stale.length > 0 && renderTemplate`<section class="stale" data-astro-cid-jsy7jxlt> <header class="bucket-head" data-astro-cid-jsy7jxlt> <h2 data-astro-cid-jsy7jxlt><span class="dot dot--stale" data-astro-cid-jsy7jxlt></span>Forgotten doors</h2> <p data-astro-cid-jsy7jxlt>Pages with no commits in 90+ days. Maybe ripe for a revisit, a refresh, or a quiet retirement.</p> <span class="bucket-count" data-astro-cid-jsy7jxlt>${stale.length}</span> </header> <ul class="stale-list" data-astro-cid-jsy7jxlt> ${stale.map((f) => renderTemplate`<li class="stale-row" data-astro-cid-jsy7jxlt> <a${addAttribute(f.slug, "href")} data-astro-cid-jsy7jxlt> <span class="stale-when" data-astro-cid-jsy7jxlt>${howStale(f.mtime)}</span> <span class="stale-slug" data-astro-cid-jsy7jxlt>${f.slug}</span> <span class="stale-title" data-astro-cid-jsy7jxlt>${f.title}</span> </a> </li>`)} </ul> </section>`} <p id="empty" class="empty" hidden data-astro-cid-jsy7jxlt>No rooms match — try another word.</p> <footer class="ex-foot" data-astro-cid-jsy7jxlt> <span data-astro-cid-jsy7jxlt>·</span><span data-astro-cid-jsy7jxlt>·</span><span data-astro-cid-jsy7jxlt>·</span> <p data-astro-cid-jsy7jxlt>${total} rooms · ${channelList.length} channels · ${POINTCAST_APPS.length} apps</p> <span data-astro-cid-jsy7jxlt>·</span><span data-astro-cid-jsy7jxlt>·</span><span data-astro-cid-jsy7jxlt>·</span> </footer> </main> ` }), defineScriptVars({ slugList }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/explore.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/explore.astro";
const $$url = "/explore";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Explore,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
