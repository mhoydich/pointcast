import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, d as defineScriptVars, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Search = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Search;
  const blocks = (await getCollection("blocks", ({ data }) => !data.draft)).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const polls = (await getCollection("polls", ({ data }) => !data.draft)).sort((a, b) => b.data.openedAt.getTime() - a.data.openedAt.getTime());
  const products = (await getCollection("products", ({ data }) => !data.draft)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const blockRows = blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    return {
      kind: "BLOCK",
      id: b.data.id,
      url: `/b/${b.data.id}`,
      label: `CH.${ch.code}`,
      labelBg: ch.color50,
      labelFg: ch.color800,
      type: b.data.type,
      title: b.data.title,
      dek: b.data.dek ?? "",
      timestamp: b.data.timestamp.toISOString(),
      haystack: [
        b.data.id,
        b.data.title,
        b.data.dek ?? "",
        b.data.body ?? "",
        ch.code,
        ch.name,
        ch.slug,
        b.data.type,
        b.data.mood ?? "",
        b.data.author
      ].join(" ").toLowerCase()
    };
  });
  const pollRows = polls.map((p) => {
    const zeitgeist = p.data.zeitgeist ? "ZEITGEIST" : "";
    return {
      kind: "POLL",
      id: p.data.slug,
      url: `/poll/${p.data.slug}`,
      label: "POLL",
      labelBg: "#f5f0ff",
      labelFg: "#5F3DC4",
      type: (p.data.purpose || "coordination").toUpperCase(),
      title: p.data.question,
      dek: p.data.dek ?? "",
      timestamp: p.data.openedAt.toISOString(),
      haystack: [
        p.data.slug,
        p.data.question,
        p.data.dek ?? "",
        p.data.purpose,
        zeitgeist,
        p.data.options.map((o) => `${o.label} ${o.hint ?? ""}`).join(" ")
      ].join(" ").toLowerCase()
    };
  });
  const productRows = products.map((pr) => ({
    kind: "PRODUCT",
    id: pr.data.slug,
    url: `/products/${pr.data.slug}`,
    label: "PROD",
    labelBg: "#e6f5ee",
    labelFg: "#0F6E56",
    type: (pr.data.category || "product").toUpperCase(),
    title: pr.data.name,
    dek: pr.data.dek ?? pr.data.description.slice(0, 140),
    timestamp: pr.data.addedAt.toISOString(),
    haystack: [
      pr.data.slug,
      pr.data.name,
      pr.data.description,
      pr.data.dek ?? "",
      pr.data.category ?? "",
      pr.data.brand,
      (pr.data.effects ?? []).join(" "),
      (pr.data.ingredients ?? []).join(" ")
    ].join(" ").toLowerCase()
  }));
  const INDEX = [...blockRows, ...pollRows, ...productRows];
  const TOTAL_COUNT = INDEX.length;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://pointcast.xyz/search",
    name: "PointCast · search",
    url: "https://pointcast.xyz/search",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://pointcast.xyz/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Search", "description": `Search every PointCast block, poll, and product by title, channel, option, or id. ${TOTAL_COUNT} items indexed across 3 kinds, fully client-side.`, "image": "/images/og/search.png", "jsonLd": jsonLd, "data-astro-cid-ipsxrsrh": true }, { "default": async ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-ipsxrsrh> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-ipsxrsrh> <a href="/" data-astro-cid-ipsxrsrh>Home</a> <span aria-hidden="true" data-astro-cid-ipsxrsrh>›</span> <span data-astro-cid-ipsxrsrh>search</span> </nav> <header class="hero" data-astro-cid-ipsxrsrh> <p class="kicker" data-astro-cid-ipsxrsrh>SEARCH · ', " BLOCKS · ", " POLLS · ", ' PRODUCTS</p> <h1 class="display" data-astro-cid-ipsxrsrh>Find any block, poll, or product.</h1> <p class="dek" data-astro-cid-ipsxrsrh>\nClient-side search across every title, dek, body, channel code, poll\n        option, and product effect. Starts filtering the moment you type.\n        Hit enter to open the top result. No network, no rate limit.\n</p> </header> <form class="form" role="search" id="search-form" autocomplete="off" data-astro-cid-ipsxrsrh> <label class="form__field" data-astro-cid-ipsxrsrh> <span class="sr-only" data-astro-cid-ipsxrsrh>Search query</span> <input type="search" id="q" name="q" placeholder="el segundo, zeitgeist, mallorca, CH.FD, POLL, PROD…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-describedby="count" data-astro-cid-ipsxrsrh> </label> <div class="form__filters mono" role="group" aria-label="Filter by kind" data-astro-cid-ipsxrsrh> <button type="button" class="kind-filter kind-filter--active" data-kind="ALL" data-astro-cid-ipsxrsrh>ALL</button> <button type="button" class="kind-filter" data-kind="BLOCK" data-astro-cid-ipsxrsrh>BLOCKS</button> <button type="button" class="kind-filter" data-kind="POLL" data-astro-cid-ipsxrsrh>POLLS</button> <button type="button" class="kind-filter" data-kind="PRODUCT" data-astro-cid-ipsxrsrh>PRODUCTS</button> </div> <p class="form__meta mono" data-astro-cid-ipsxrsrh> <span id="count" data-astro-cid-ipsxrsrh>— of ', '</span> <span class="sep" aria-hidden="true" data-astro-cid-ipsxrsrh>·</span> <span data-astro-cid-ipsxrsrh>TRY · <button type="button" class="q-hint" data-q="el segundo" data-astro-cid-ipsxrsrh>el segundo</button>, <button type="button" class="q-hint" data-q="zeitgeist" data-astro-cid-ipsxrsrh>zeitgeist</button>, <button type="button" class="q-hint" data-q="CH.FD" data-astro-cid-ipsxrsrh>CH.FD</button></span> </p> </form> <section class="results" id="results" aria-live="polite" aria-label="Search results" data-astro-cid-ipsxrsrh>  </section> <aside class="surfaces" data-astro-cid-ipsxrsrh> <p class="kicker" data-astro-cid-ipsxrsrh>AGENT SURFACES</p> <ul class="surfaces__list" data-astro-cid-ipsxrsrh> <li data-astro-cid-ipsxrsrh><a href="/blocks.json" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>GET</span> /blocks.json</a></li> <li data-astro-cid-ipsxrsrh><a href="/api/blocks.jsonl" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>GET</span> /api/blocks.jsonl</a></li> <li data-astro-cid-ipsxrsrh><a href="/api/soundtracks.jsonl" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>GET</span> /api/soundtracks.jsonl</a></li> <li data-astro-cid-ipsxrsrh><a href="/api/clock/0324.json" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>GET</span> /api/clock/0324.json</a></li> <li data-astro-cid-ipsxrsrh><a href="/archive.json" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>GET</span> /archive.json</a></li> <li data-astro-cid-ipsxrsrh><a href="/for-agents" data-astro-cid-ipsxrsrh><span class="mono" data-astro-cid-ipsxrsrh>SEE</span> /for-agents</a></li> </ul> </aside> </div> <script>(function(){', `
    (function () {
      const input = document.getElementById('q');
      const countEl = document.getElementById('count');
      const out = document.getElementById('results');
      const form = document.getElementById('search-form');
      const kindButtons = Array.from(document.querySelectorAll('.kind-filter'));

      let activeKind = 'ALL';

      function idLabel(row) {
        if (row.kind === 'BLOCK') return '№' + row.id;
        if (row.kind === 'POLL') return '/' + row.id;
        if (row.kind === 'PRODUCT') return '/' + row.id;
        return row.id;
      }

      function render(list) {
        if (list.length === 0) {
          out.innerHTML = '<p class="empty">No matches. Try a looser query, a channel code like <code>CH.FD</code>, a kind like <code>POLL</code>, or a term like <code>zeitgeist</code>.</p>';
          return;
        }
        out.innerHTML = list.slice(0, 80).map(function (row) {
          const dateShort = new Date(row.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' }).toUpperCase();
          const dekSafe = row.dek ? row.dek.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
          const titleSafe = row.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return (
            '<a class="hit hit--' + row.kind.toLowerCase() + '" href="' + row.url + '"'
              + ' style="--row-c50: ' + row.labelBg + '; --row-c8: ' + row.labelFg + '">'
              + '<span class="hit__ch" style="background:' + row.labelBg + '; color:' + row.labelFg + '; border-color:' + row.labelFg + '">' + row.label + '</span>'
              + '<span class="hit__id mono">' + idLabel(row) + '</span>'
              + '<span class="hit__type mono">' + row.type + '</span>'
              + '<span class="hit__date mono">' + dateShort + '</span>'
              + '<span class="hit__title">' + titleSafe + '</span>'
              + (dekSafe ? '<span class="hit__dek">' + dekSafe + '</span>' : '')
            + '</a>'
          );
        }).join('');
      }

      function runQuery(q) {
        const needle = q.trim().toLowerCase();
        const byKind = activeKind === 'ALL' ? INDEX : INDEX.filter(function (r) { return r.kind === activeKind; });
        if (!needle) {
          const top = byKind.slice(0, 24);
          countEl.textContent = 'Showing latest ' + Math.min(24, byKind.length) + ' of ' + byKind.length + (activeKind !== 'ALL' ? ' ' + activeKind.toLowerCase() + 's' : '');
          render(top);
          return;
        }
        const hits = byKind.filter(function (r) {
          return r.haystack.indexOf(needle) !== -1;
        });
        countEl.textContent = hits.length + ' of ' + byKind.length + (activeKind !== 'ALL' ? ' ' + activeKind.toLowerCase() + 's' : '');
        render(hits);
      }

      // Kind filter toggle
      kindButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeKind = btn.getAttribute('data-kind') || 'ALL';
          kindButtons.forEach(function (b) { b.classList.toggle('kind-filter--active', b === btn); });
          runQuery(input.value || '');
        });
      });

      // Initial state (honor ?q= and ?kind= on load)
      const params = new URLSearchParams(window.location.search);
      const initial = params.get('q') || '';
      const kindParam = (params.get('kind') || 'ALL').toUpperCase();
      if (['ALL','BLOCK','POLL','PRODUCT'].indexOf(kindParam) !== -1) {
        activeKind = kindParam;
        kindButtons.forEach(function (b) { b.classList.toggle('kind-filter--active', (b.getAttribute('data-kind') || 'ALL') === activeKind); });
      }
      if (initial) input.value = initial;
      runQuery(initial);

      input.addEventListener('input', function () {
        runQuery(input.value || '');
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const first = out.querySelector('.hit');
        if (first) window.location.href = first.getAttribute('href');
      });

      document.querySelectorAll('.q-hint').forEach(function (btn) {
        btn.addEventListener('click', function () {
          input.value = btn.getAttribute('data-q') || '';
          runQuery(input.value);
          input.focus();
        });
      });

      if (window.matchMedia && window.matchMedia('(min-width: 720px)').matches) {
        input.focus();
      }
    })();
  })();<\/script> `])), maybeRenderHead(), blocks.length, polls.length, products.length, TOTAL_COUNT, defineScriptVars({ INDEX })) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/search.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/search.astro";
const $$url = "/search";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Search,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
