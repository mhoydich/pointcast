import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { m as maybeRenderHead, b as addAttribute, a as renderTemplate, r as renderComponent } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import 'clsx';
import { $ as $$WalletConnect } from './WalletConnect_C-fpO83k.mjs';
import { $ as $$ShareThis } from './ShareThis_CLgipRxL.mjs';

const $$CoffeePot = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$CoffeePot;
  const { size = 256, className = "", on = true } = Astro2.props;
  const C = {
    bg: "transparent",
    body: "#3c2817",
    // dark espresso
    bodyHi: "#5a3b22",
    // body highlight
    bodyLo: "#241510",
    // body shadow
    lid: "#1f1110",
    // near-black lid
    knob: "#7a5230",
    // wooden knob
    joint: "#5a3b22",
    // metal collar
    handle: "#1a1208",
    steam: "#fef5e7",
    heat: "#d4623a"};
  const pixels = [
    // Lid knob (small block on top)
    [14, 5, 4, 2, C.knob],
    [15, 4, 2, 1, C.knob],
    // Lid (rounded trapezoid suggested by stacked bands)
    [11, 7, 10, 1, C.lid],
    [10, 8, 12, 1, C.lid],
    [9, 9, 14, 1, C.lid],
    // Top body (collector) — wider than lid, narrows top
    [8, 10, 16, 1, C.bodyLo],
    [8, 11, 16, 4, C.body],
    [8, 11, 1, 4, C.bodyHi],
    // left highlight column
    [9, 11, 1, 1, C.bodyHi],
    // tiny corner highlight
    // Joint (metal collar between top + bottom halves)
    [8, 15, 16, 1, C.joint],
    // Handle (right side) — sticks out as an open D shape
    [24, 11, 1, 1, C.handle],
    [25, 11, 1, 1, C.handle],
    [26, 12, 2, 1, C.handle],
    [27, 13, 1, 1, C.handle],
    [27, 14, 1, 1, C.handle],
    [26, 15, 2, 1, C.handle],
    [25, 15, 1, 1, C.handle],
    [24, 15, 1, 1, C.handle],
    // Bottom body (boiler) — same width as top, slight curve at base
    [8, 16, 16, 4, C.body],
    [8, 16, 1, 4, C.bodyHi],
    // left highlight
    [23, 16, 1, 4, C.bodyLo],
    // right shadow
    [9, 20, 14, 1, C.body],
    [10, 21, 12, 1, C.bodyLo],
    // Heat plate / coaster
    [9, 23, 14, 1, C.lid],
    [10, 24, 12, 1, C.lid]
  ];
  return renderTemplate`${maybeRenderHead()}<figure${addAttribute(`coffee-pot ${on ? "coffee-pot--on" : "coffee-pot--off"} ${className}`, "class")}${addAttribute(`--pot-size:${size}px`, "style")} data-astro-cid-ysiuazii> <svg viewBox="0 0 32 32"${addAttribute(size, "width")}${addAttribute(size, "height")} aria-label="Pixel-art stovetop coffee pot, steaming" role="img" shape-rendering="crispEdges" data-astro-cid-ysiuazii> <!-- Background (transparent for re-use; subtle warm wash if needed) --> <rect x="0" y="0" width="32" height="32"${addAttribute(C.bg, "fill")} data-astro-cid-ysiuazii></rect> <!-- Steam wisps — three vertical "smoke trails" of small pixels.
         Each wisp is its own group so they animate at different phases. --> <g class="steam steam--1" data-astro-cid-ysiuazii> <rect x="13" y="3" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.85" data-astro-cid-ysiuazii></rect> <rect x="14" y="2" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.7" data-astro-cid-ysiuazii></rect> <rect x="13" y="1" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.5" data-astro-cid-ysiuazii></rect> <rect x="14" y="0" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.3" data-astro-cid-ysiuazii></rect> </g> <g class="steam steam--2" data-astro-cid-ysiuazii> <rect x="16" y="4" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.85" data-astro-cid-ysiuazii></rect> <rect x="15" y="3" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.7" data-astro-cid-ysiuazii></rect> <rect x="16" y="2" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.5" data-astro-cid-ysiuazii></rect> <rect x="15" y="1" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.3" data-astro-cid-ysiuazii></rect> </g> <g class="steam steam--3" data-astro-cid-ysiuazii> <rect x="18" y="3" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.85" data-astro-cid-ysiuazii></rect> <rect x="19" y="2" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.7" data-astro-cid-ysiuazii></rect> <rect x="18" y="1" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.5" data-astro-cid-ysiuazii></rect> <rect x="19" y="0" width="1" height="1"${addAttribute(C.steam, "fill")} opacity="0.3" data-astro-cid-ysiuazii></rect> </g> <!-- Pot body, lid, handle, coaster — composed from rectangular regions. --> ${pixels.map(([x, y, w, h, fill]) => renderTemplate`<rect${addAttribute(x, "x")}${addAttribute(y, "y")}${addAttribute(w, "width")}${addAttribute(h, "height")}${addAttribute(fill, "fill")} data-astro-cid-ysiuazii></rect>`)} <!-- Heat dots beneath the coaster — three pulsing embers. --> <g class="heat" data-astro-cid-ysiuazii> <rect class="heat__dot heat__dot--1" x="11" y="26" width="2" height="1"${addAttribute(C.heat, "fill")} data-astro-cid-ysiuazii></rect> <rect class="heat__dot heat__dot--2" x="15" y="26" width="2" height="1"${addAttribute(C.heat, "fill")} data-astro-cid-ysiuazii></rect> <rect class="heat__dot heat__dot--3" x="19" y="26" width="2" height="1"${addAttribute(C.heat, "fill")} data-astro-cid-ysiuazii></rect> </g> </svg> </figure>`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/CoffeePot.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Coffee = createComponent(async ($$result, $$props, $$slots) => {
  const MUG_TIERS = {
    ceramic: { rarity: "common", editions: 333, threshold: 1, hex: "#5F5E5A" },
    espresso: { rarity: "uncommon", editions: 144, threshold: 3, hex: "#0F6E56" },
    latte: { rarity: "rare", editions: 64, threshold: 7, hex: "#185FA5" },
    paper: { rarity: "ultra-rare", editions: 21, threshold: 15, hex: "#993556" },
    bistro: { rarity: "legendary", editions: 8, threshold: 30, hex: "#c4952e" }
  };
  const MUGS = [
    {
      slug: "ceramic",
      label: "ceramic mug",
      pixels: [
        // body (white ceramic) + handle
        [4, 6, 12, 1, "#f8f4ec"],
        // top rim
        [4, 7, 12, 8, "#f3eee0"],
        // body
        [4, 15, 12, 1, "#d8cdb8"],
        // bottom shadow
        // coffee inside (top dark band)
        [5, 7, 10, 2, "#3c2817"],
        // coffee top
        [5, 9, 10, 1, "#5a3b22"],
        // coffee mid highlight
        // handle (right side)
        [16, 8, 1, 1, "#1a1208"],
        [17, 8, 2, 1, "#1a1208"],
        [19, 9, 1, 1, "#1a1208"],
        [19, 10, 1, 1, "#1a1208"],
        [19, 11, 1, 1, "#1a1208"],
        [17, 12, 2, 1, "#1a1208"],
        [16, 12, 1, 1, "#1a1208"]
      ]
    },
    {
      slug: "espresso",
      label: "espresso cup",
      pixels: [
        // small cup
        [9, 9, 6, 1, "#f8f4ec"],
        [9, 10, 6, 4, "#f3eee0"],
        // dark coffee
        [10, 10, 4, 1, "#1a1208"],
        [10, 11, 4, 2, "#3c2817"],
        // bottom curve
        [10, 14, 4, 1, "#d8cdb8"],
        // tiny handle
        [15, 11, 1, 1, "#1a1208"],
        [16, 11, 1, 1, "#1a1208"],
        [16, 12, 1, 1, "#1a1208"],
        [15, 12, 1, 1, "#1a1208"],
        // saucer
        [7, 16, 10, 1, "#e8dec8"],
        [8, 17, 8, 1, "#d8cdb8"]
      ]
    },
    {
      slug: "latte",
      label: "latte glass",
      pixels: [
        // tall glass body
        [7, 4, 9, 1, "#e0dccc"],
        // top rim
        [7, 5, 9, 12, "#f1eedf"],
        // glass
        [7, 17, 9, 1, "#c8bfa8"],
        // base
        // foam (top)
        [8, 5, 7, 2, "#fef5e7"],
        // milk
        [8, 7, 7, 3, "#e9dcc0"],
        // milk-coffee mixing
        [8, 10, 7, 1, "#b89668"],
        // coffee
        [8, 11, 7, 5, "#3c2817"],
        // base highlight
        [8, 16, 7, 1, "#5a3b22"]
      ]
    },
    {
      slug: "paper",
      label: "paper cup",
      pixels: [
        // lid (wider than cup)
        [6, 4, 12, 1, "#3c2817"],
        // dark lid edge
        [6, 5, 12, 1, "#5a3b22"],
        // lid
        [10, 5, 4, 1, "#1a1208"],
        // sip hole
        // cup body (tapers)
        [7, 6, 10, 1, "#f3eee0"],
        [7, 7, 10, 2, "#f8f4ec"],
        // sleeve (middle band)
        [7, 9, 10, 4, "#8d6b3a"],
        [8, 9, 8, 1, "#a87f48"],
        // sleeve highlight
        // bottom (tapers in)
        [8, 13, 8, 2, "#f3eee0"],
        [9, 15, 6, 1, "#e8dec8"],
        [10, 16, 4, 1, "#d8cdb8"]
      ]
    },
    {
      slug: "bistro",
      label: "bistro cup",
      pixels: [
        // wide cup
        [4, 7, 14, 1, "#f8f4ec"],
        // rim
        [4, 8, 14, 4, "#f3eee0"],
        // body
        // coffee
        [5, 8, 12, 2, "#1a1208"],
        [5, 10, 12, 1, "#3c2817"],
        // taper
        [5, 12, 12, 1, "#e8dec8"],
        [6, 13, 10, 1, "#d8cdb8"],
        // saucer
        [3, 15, 16, 1, "#e8dec8"],
        [4, 16, 14, 1, "#c8bfa8"]
      ]
    }
  ];
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    var STORAGE_KEY = 'pc:coffee:cups';
    var DATE_KEY    = 'pc:coffee:date';

    function ptToday() {
      try {
        // Local PT date string YYYY-MM-DD via Intl
        var fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
        return fmt.format(new Date());
      } catch (e) {
        // Fallback — use the browser's local date.
        var d = new Date();
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }
    }

    function readCups() {
      try {
        var savedDate = localStorage.getItem(DATE_KEY);
        var today = ptToday();
        if (savedDate !== today) {
          // New PT day — reset.
          localStorage.setItem(DATE_KEY, today);
          localStorage.setItem(STORAGE_KEY, '0');
          return 0;
        }
        return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
      } catch (e) {
        return 0;
      }
    }

    function writeCups(n) {
      try {
        localStorage.setItem(STORAGE_KEY, String(n));
        localStorage.setItem(DATE_KEY, ptToday());
      } catch (e) { /* private mode etc */ }
    }

    function greetingFor(hourPT) {
      // Time-of-day greeting in PT. The 23-4 branch is the overnight
      // "the lights are low" feel — added Sprint 41 as a small gesture
      // for late visitors.
      if (hourPT >= 5  && hourPT < 10) return "First cup of the day.";
      if (hourPT >= 10 && hourPT < 13) return "Late morning. The pot still has more.";
      if (hourPT >= 13 && hourPT < 17) return "Afternoon refill. Pace yourself.";
      if (hourPT >= 17 && hourPT < 21) return "Evening. Decaf, maybe.";
      if (hourPT >= 21 && hourPT < 23) return "Late hour. Tea would be wiser, honestly.";
      if (hourPT >= 23 || hourPT < 2)  return "The pot's still on. The lights are low. See you tomorrow.";
      return "Very late. Sleep is the wisest pour.";
    }

    function noteFor(cups) {
      if (cups === 0) return '';
      if (cups === 1) return "One cup. A reasonable opening.";
      if (cups === 2) return "Two. The morning has been productive.";
      if (cups === 3) return "Three. Approaching the limit.";
      if (cups === 4) return "Four cups. You\\u2019re jittery.";
      if (cups <  10) return cups + " cups. The pot may need a refill.";
      return cups + " cups. Touch grass, friend.";
    }

    function ptHour() {
      try {
        var fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric', hour12: false
        });
        return parseInt(fmt.format(new Date()), 10);
      } catch (e) {
        return new Date().getHours();
      }
    }

    var btn        = document.getElementById('coffee-pour');
    var numEl      = document.getElementById('coffee-cups-num');
    var noteEl     = document.getElementById('coffee-tally-note');
    var greetingEl = document.getElementById('coffee-greeting');
    var globalRoot = document.getElementById('coffee-global');
    var globalNum  = document.getElementById('coffee-global-num');
    var shelfRoot   = document.getElementById('coffee-shelf');
    var shelfList   = document.getElementById('coffee-shelf-list');
    var shelfHead   = document.getElementById('coffee-shelf-heading');
    var shelfNote   = document.getElementById('coffee-shelf-note');
    var historyRail = document.getElementById('coffee-history-rail');
    var historyTotalEl = document.getElementById('coffee-history-total');
    var nounEl      = document.getElementById('coffee-noun');
    var nounImg     = document.getElementById('coffee-noun-img');

    // Variants must match MUGS array in frontmatter + MUG_VARIANTS in
    // functions/api/coffee/pour.ts.
    var VARIANT_TO_TPL_IDX = {
      ceramic:  0,
      espresso: 1,
      latte:    2,
      paper:    3,
      bistro:   4,
    };

    function mugTemplateBySlug(slug) {
      var idx = VARIANT_TO_TPL_IDX[slug];
      if (idx == null) return null;
      return document.getElementById('coffee-mug-' + idx);
    }

    function shortRel(iso) {
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return '';
      var s = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (s < 60)    return s + 's';
      if (s < 3600)  return Math.floor(s / 60) + 'm';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      return Math.floor(s / 86400) + 'd';
    }

    function renderMugRecord(record, animate) {
      var tpl = mugTemplateBySlug(record.mug);
      if (!tpl || !shelfList) return;
      var clone = tpl.content.cloneNode(true);
      var li = clone.querySelector('li');
      if (!li) return;
      if (animate) li.classList.add('coffee-mug--new');
      // Annotate with hover title showing how long ago.
      var rel = shortRel(record.at);
      if (rel) li.setAttribute('title', li.getAttribute('title') + ' · ' + rel + ' ago');
      shelfList.appendChild(clone);
      // Trim to last 24 visible.
      while (shelfList.children.length > 24) {
        shelfList.removeChild(shelfList.firstElementChild);
      }
    }

    function setShelfHead(count, others) {
      if (!shelfHead) return;
      if (count <= 0) {
        shelfHead.textContent = "No cups poured yet today";
        return;
      }
      if (others <= 0) {
        shelfHead.textContent = "Today's mugs · " + count + " poured";
      } else {
        shelfHead.textContent = "Today's mugs · " + count + " poured · " + others + " from others";
      }
    }

    function renderGlobalShelf(globalMugs, localCount) {
      if (!shelfList || !shelfRoot) return;
      shelfList.innerHTML = '';
      var visible = (globalMugs || []).slice(-24);
      for (var i = 0; i < visible.length; i++) {
        renderMugRecord(visible[i], false);
      }
      var totalCount = (globalMugs || []).length;
      var others = Math.max(0, totalCount - localCount);
      setShelfHead(totalCount, others);
      shelfRoot.hidden = totalCount <= 0;
    }

    if (greetingEl) {
      greetingEl.textContent = greetingFor(ptHour());
    }

    var cups = readCups();
    if (numEl) numEl.textContent = String(cups);
    if (noteEl) noteEl.textContent = noteFor(cups);

    // Hydrate the global cup count + mug shelf from /api/coffee/today.
    // The shelf shows the last 24 mugs from EVERYONE today, including
    // mugs other visitors poured before you arrived.
    function hydrateGlobal() {
      fetch('/api/coffee/today', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || data.count == null) {
            if (globalRoot) globalRoot.hidden = true;
            renderGlobalShelf([], cups);
            return;
          }
          if (globalNum)  globalNum.textContent = String(data.count);
          if (globalRoot) globalRoot.hidden = false;
          renderGlobalShelf(Array.isArray(data.mugs) ? data.mugs : [], cups);
        })
        .catch(function () { /* network blip — leave shelf as-is */ });
    }
    hydrateGlobal();
    setInterval(hydrateGlobal, 30_000);

    // ── HISTORY ──────────────────────────────────────────────────
    function fmtDayShort(iso) {
      // iso like "2026-04-25" → "Sat 04-25"
      try {
        var d = new Date(iso + 'T12:00:00Z');
        var dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
        return dow + ' ' + iso.slice(5);
      } catch (e) { return iso; }
    }

    function renderHistory(data) {
      if (!historyRail) return;
      var days = (data && data.days) ? data.days : [];
      if (days.length === 0) {
        historyRail.innerHTML = '<div class="coffee__history-skel mono">no data yet</div>';
        return;
      }
      var max = days.reduce(function (m, d) { return d.count > m ? d.count : m; }, 1);
      var html = '';
      for (var i = 0; i < days.length; i++) {
        var d = days[i];
        var pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
        var heightStyle = 'height:' + Math.max(pct, 4) + '%';
        var isToday = (i === days.length - 1);
        var bar = '<div class="coffee__hbar' + (isToday ? ' coffee__hbar--today' : '') + (d.count > 0 ? '' : ' coffee__hbar--empty') + '">' +
          '<div class="coffee__hbar-fill" style="' + heightStyle + '" title="' + d.day + ' · ' + d.count + ' cups"></div>' +
          '<div class="coffee__hbar-num mono">' + d.count + '</div>' +
          '<div class="coffee__hbar-day mono">' + fmtDayShort(d.day) + '</div>' +
          '</div>';
        html += bar;
      }
      historyRail.innerHTML = html;
      if (historyTotalEl && data.total != null) {
        historyTotalEl.textContent = String(data.total);
      }
    }

    function hydrateHistory() {
      fetch('/api/coffee/history?days=7', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) { if (data && data.days) renderHistory(data); })
        .catch(function () { /* leave skel */ });
    }
    hydrateHistory();
    setInterval(hydrateHistory, 60_000);

    // ── MINTABLES — wallet-aware claim flow with banked receipts
    var MUG_THRESHOLDS = { ceramic: 1, espresso: 3, latte: 7, paper: 15, bistro: 30 };
    var CLAIMS_KEY = 'pc:coffee:claims';

    function readWallet() {
      try {
        var raw = localStorage.getItem('pc:wallet');
        if (!raw) return null;
        var w = JSON.parse(raw);
        return (w && w.address) ? w : null;
      } catch (e) { return null; }
    }

    function readClaims() {
      try {
        var raw = localStorage.getItem(CLAIMS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) || {};
      } catch (e) { return {}; }
    }

    function writeClaims(claims) {
      try { localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims)); }
      catch (e) {}
    }

    function shortAddr(addr) {
      if (!addr) return '';
      return addr.slice(0, 5) + '…' + addr.slice(-4);
    }

    // ── Your shelf — visual display of mugs owned on the connected wallet ─
    // Server renders all 5 tiles hidden inside #coffee-shelf. We unhide
    // the ones with a corresponding claims[slug].opHash and link each to
    // tzkt. Section auto-hides if no mugs are owned (wallet not connected
    // or wallet owns zero mugs).
    function refreshShelf() {
      var shelfWrap = document.getElementById('coffee-shelf');
      var countEl = document.getElementById('coffee-shelf-count');
      var pluralEl = document.getElementById('coffee-shelf-count-s');
      if (!shelfWrap) return;
      var claims = readClaims();
      var owned = 0;
      var slugs = ['ceramic','espresso','latte','paper','bistro'];
      slugs.forEach(function (slug) {
        var tile = document.querySelector('[data-shelf-tile="' + slug + '"]');
        var link = document.querySelector('[data-shelf-link="' + slug + '"]');
        var hashEl = document.querySelector('[data-shelf-hash="' + slug + '"]');
        if (!tile || !link) return;
        var entry = claims[slug];
        if (entry && entry.opHash) {
          tile.hidden = false;
          link.href = 'https://tzkt.io/' + entry.opHash;
          if (hashEl) hashEl.textContent = entry.opHash.slice(0, 8) + '…';
          owned++;
        } else {
          tile.hidden = true;
          link.href = '#';
          if (hashEl) hashEl.textContent = '';
        }
      });
      shelfWrap.hidden = (owned === 0);
      if (countEl) countEl.textContent = String(owned);
      if (pluralEl) pluralEl.textContent = (owned === 1 ? '' : 's');
    }

    function refreshMintables() {
      var localCount = readCups();
      var wallet = readWallet();
      var claims = readClaims();
      var hint = document.getElementById('coffee-mint-wallet-hint');
      if (hint) {
        if (wallet && wallet.address) {
          hint.textContent = 'connected · ' + shortAddr(wallet.address) + ' · claim eligible mugs below';
        } else {
          hint.textContent = 'connect to claim · cups stay yours either way';
        }
      }

      var slugs = ['ceramic','espresso','latte','paper','bistro'];
      for (var i = 0; i < slugs.length; i++) {
        var slug = slugs[i];
        var threshold = MUG_THRESHOLDS[slug];
        var chip = document.querySelector('[data-mug-state="' + slug + '"]');
        var btn  = document.querySelector('[data-mug-claim="' + slug + '"]');
        if (!chip || !btn) continue;

        var entry = claims && claims[slug];
        var minted = entry && entry.opHash;
        var banked = entry && !entry.opHash;
        var eligible = localCount >= threshold;
        var hasWallet = !!(wallet && wallet.address);

        btn.disabled = true;
        if (minted) {
          // Already minted — show a tzkt link, button stays disabled.
          chip.innerHTML = '✓ <a href="https://tzkt.io/' + entry.opHash +
            '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">minted ↗</a>';
          btn.setAttribute('data-state', 'minted');
        } else if (banked) {
          // Banked locally — contract was off when claimed; redeem path TBD.
          chip.textContent = 'banked';
          btn.setAttribute('data-state', 'banked');
        } else if (eligible && hasWallet) {
          chip.textContent = 'mint to ' + shortAddr(wallet.address);
          btn.disabled = false;
          btn.setAttribute('data-state', 'eligible');
        } else if (eligible && !hasWallet) {
          chip.textContent = 'connect wallet';
          btn.setAttribute('data-state', 'connect');
        } else {
          var remain = threshold - localCount;
          chip.textContent = remain + ' more cup' + (remain === 1 ? '' : 's');
          btn.setAttribute('data-state', 'preview');
        }
      }
    }
    refreshMintables();
    refreshShelf();

    // Click handlers on each claim button.
    //
    // Two-phase claim: first POST /api/coffee/claim, which returns either
    //   • mode: 'banked'   — contract not live; receipt stored locally
    //   • mode: 'mintable' — contract live; we fire mint_mug(token_id)
    //     from the visitor's wallet via Beacon and surface the tzkt link
    //
    // The /api/coffee/claim endpoint reads contracts.coffee_mugs.mainnet
    // at request time, so it auto-flips banked → mintable on origination
    // without a frontend deploy. After this lands, the loop closes.
    function setMintRowState(slug, status, label) {
      var chip = document.querySelector('[data-mug-state="' + slug + '"]');
      var btn = document.querySelector('[data-mug-claim="' + slug + '"]');
      if (chip) chip.textContent = label;
      if (btn) btn.setAttribute('data-state', status);
    }

    async function claimMug(slug) {
      var wallet = readWallet();
      if (!wallet) {
        try { window.dispatchEvent(new CustomEvent('pc:open-wallet-menu')); }
        catch (e) {}
        return;
      }
      if (readCups() < MUG_THRESHOLDS[slug]) return;

      var existing = readClaims();
      if (existing[slug] && existing[slug].opHash) return; // already minted

      var btn = document.querySelector('[data-mug-claim="' + slug + '"]');
      if (btn) btn.disabled = true;
      setMintRowState(slug, 'requesting', 'requesting receipt…');

      var payload;
      try {
        var res = await fetch('/api/coffee/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mug: slug, address: wallet.address }),
        });
        payload = await res.json();
        if (!payload || payload.ok === false) {
          var msg = (payload && (payload.error || payload.reason)) || 'request failed';
          setMintRowState(slug, 'error', msg);
          if (btn) btn.disabled = false;
          return;
        }
      } catch (err) {
        setMintRowState(slug, 'error', 'network error');
        if (btn) btn.disabled = false;
        return;
      }

      // Banked mode — contract not live. Persist the receipt locally and
      // wait for the contract to flip on. Same UX as before this rewrite.
      if (payload.mode === 'banked' || !payload.mint) {
        var claims = readClaims();
        claims[slug] = payload.receipt || {
          mug: slug, address: wallet.address, bankedAt: new Date().toISOString(),
        };
        writeClaims(claims);
        refreshMintables();
      refreshShelf();
        var row = document.querySelector('[data-mug="' + slug + '"]');
        if (row) {
          row.classList.add('coffee-mint--just-banked');
          setTimeout(function () { row.classList.remove('coffee-mint--just-banked'); }, 900);
        }
        return;
      }

      // Mintable mode — call mint_mug(token_id) via Beacon. Same plumbing
      // as /admin/deploy/[slug] but driven from a visitor's wallet.
      setMintRowState(slug, 'minting', 'awaiting kukai…');
      try {
        var taquito = await import('@taquito/taquito');
        var beacon = await import('@taquito/beacon-wallet');
        var tezos = new taquito.TezosToolkit('https://mainnet.api.tez.ie');
        var beaconWallet = new beacon.BeaconWallet({
          name: 'PointCast',
          network: { type: 'mainnet' },
        });
        tezos.setWalletProvider(beaconWallet);

        var active = await beaconWallet.client.getActiveAccount();
        if (!active || (active.network && active.network.type !== 'mainnet')) {
          try { await beaconWallet.clearActiveAccount(); } catch (e) {}
          await beaconWallet.client.requestPermissions();
        }

        var mint = payload.mint;
        var contract = await tezos.wallet.at(mint.contract);
        var op = await contract.methodsObject[mint.entrypoint](mint.params.token_id).send();
        var opHash = (op && op.opHash) ? op.opHash : '';

        // Persist the in-flight mint so a refresh shows "minting" → tzkt.
        var claims = readClaims();
        claims[slug] = Object.assign({}, payload.receipt || {}, {
          opHash: opHash,
          mintedAt: new Date().toISOString(),
        });
        writeClaims(claims);

        setMintRowState(slug, 'minting', 'broadcast ' + opHash.slice(0, 10) + '…');
        await op.confirmation();
        setMintRowState(slug, 'minted', '✓ minted');

        // Replace the chip with a clickable tzkt link.
        var chip = document.querySelector('[data-mug-state="' + slug + '"]');
        if (chip && opHash) {
          chip.innerHTML = '✓ <a href="https://tzkt.io/' + opHash +
            '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">minted ↗</a>';
        }
        refreshMintables();
      refreshShelf();

        // Brief visual nudge — same just-banked animation.
        var row = document.querySelector('[data-mug="' + slug + '"]');
        if (row) {
          row.classList.add('coffee-mint--just-banked');
          setTimeout(function () { row.classList.remove('coffee-mint--just-banked'); }, 1500);
        }
      } catch (err) {
        var msg = (err && err.message) ? err.message : String(err || 'unknown');
        if (/ABORTED|reject|cancel/i.test(msg)) {
          setMintRowState(slug, 'eligible', 'cancelled · try again');
        } else if (/NotEnoughBalance|balance/i.test(msg)) {
          setMintRowState(slug, 'eligible', 'fund wallet (~0.5 ꜩ for gas)');
        } else if (/EDITION_CAP_REACHED/i.test(msg)) {
          setMintRowState(slug, 'capped', 'edition cap reached');
        } else {
          setMintRowState(slug, 'error', String(msg).slice(0, 40));
        }
        if (btn) btn.disabled = false;
      }
    }

    document.querySelectorAll('[data-mug-claim]').forEach(function (b) {
      b.addEventListener('click', function () {
        var slug = b.getAttribute('data-mug-claim');
        if (slug) claimMug(slug);
      });
    });

    // ── On-chain editions panel + wallet-aware ownership sync ──────────
    // Reads:
    //   • /v1/contracts/<KT1>/storage      → bigmap pointers (mug_supply, ledger)
    //   • /v1/bigmaps/<mug_supply_id>/keys → per-token mint counts
    //   • /v1/operations/transactions?...  → wallet's mint_mug history → opHashes
    // and:
    //   • populates [data-mug-supply] chips with "X minted" labels
    //   • populates #coffee-mint-total with "X minted of 570 total"
    //   • when wallet is connected, marks any mug the wallet has minted
    //     as "minted ↗ tzkt" in localStorage so refreshMintables shows
    //     the success state — bridges /admin/deploy mints over to /coffee.
    var COFFEE_KT1 = 'KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt';
    var TOKEN_ID_TO_SLUG = { '0': 'ceramic', '1': 'espresso', '2': 'latte', '3': 'paper', '4': 'bistro' };
    var SLUG_TO_TOKEN_ID = { ceramic: 0, espresso: 1, latte: 2, paper: 3, bistro: 4 };
    var MUG_CAPS = { ceramic: 333, espresso: 144, latte: 64, paper: 21, bistro: 8 };
    var MUG_TOTAL_CAP = 333 + 144 + 64 + 21 + 8; // 570

    async function fetchEditionCounts() {
      var totalEl = document.getElementById('coffee-mint-total');
      try {
        // Fetch storage to discover the mug_supply bigmap pointer.
        var storageRes = await fetch(
          'https://api.tzkt.io/v1/contracts/' + COFFEE_KT1 + '/storage',
          { cache: 'no-store' }
        );
        if (!storageRes.ok) throw new Error('tzkt /storage ' + storageRes.status);
        var storage = await storageRes.json();
        var pointer = (typeof storage.mug_supply === 'number') ? storage.mug_supply
          : (typeof storage.supply === 'number') ? storage.supply
          : null;
        if (pointer == null) {
          if (totalEl) totalEl.textContent = '— minted of ' + MUG_TOTAL_CAP + ' total';
          return null;
        }
        var keysRes = await fetch(
          'https://api.tzkt.io/v1/bigmaps/' + pointer + '/keys?limit=100&select=key,value',
          { cache: 'no-store' }
        );
        if (!keysRes.ok) throw new Error('tzkt /bigmaps ' + keysRes.status);
        var keys = await keysRes.json();
        var supplyByTokenId = {};
        var totalMinted = 0;
        if (Array.isArray(keys)) {
          keys.forEach(function (row) {
            if (row && row.key !== undefined) {
              var n = parseInt(row.value, 10) || 0;
              supplyByTokenId[String(row.key)] = n;
              totalMinted += n;
            }
          });
        }
        // Populate per-mug supply chips.
        var slugs = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'];
        slugs.forEach(function (slug) {
          var tokenId = SLUG_TO_TOKEN_ID[slug];
          var minted = supplyByTokenId[String(tokenId)] || 0;
          var cap = MUG_CAPS[slug];
          var label = ' · ' + minted + ' / ' + cap + ' minted';
          var chip = document.querySelector('[data-mug-supply="' + slug + '"]');
          if (chip) chip.textContent = label;
        });
        if (totalEl) {
          var pct = MUG_TOTAL_CAP > 0 ? Math.round((totalMinted / MUG_TOTAL_CAP) * 100) : 0;
          totalEl.innerHTML =
            '<strong>' + totalMinted + '</strong> minted of ' + MUG_TOTAL_CAP +
            ' total · ' + pct + '% claimed · <a href="https://tzkt.io/' + COFFEE_KT1 +
            '" target="_blank" rel="noopener">on-chain ↗</a>';
        }
        return supplyByTokenId;
      } catch (err) {
        if (totalEl) totalEl.textContent = 'on-chain count unavailable';
        return null;
      }
    }

    // For a connected wallet, find every mint_mug they've called and
    // sync /coffee localStorage so refreshMintables shows "minted ↗"
    // even if the mint was done from /admin/deploy.
    async function syncOnChainOwnership() {
      var wallet = readWallet();
      if (!wallet || !wallet.address) return;
      try {
        var url = 'https://api.tzkt.io/v1/operations/transactions?target=' + COFFEE_KT1 +
          '&sender=' + wallet.address + '&entrypoint=mint_mug&status=applied' +
          '&select=hash,parameter,timestamp&limit=50&sort.desc=id';
        var res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        var rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) return;
        var claims = readClaims();
        var changed = false;
        rows.forEach(function (op) {
          // tzkt returns parameter.value as the unwrapped Michelson value;
          // for mint_mug(token_id) this is the nat as a string.
          var raw = op && op.parameter && (op.parameter.value !== undefined ? op.parameter.value : op.parameter);
          var tokenIdStr = (raw && typeof raw === 'object') ? String(raw.value || raw) : String(raw);
          var slug = TOKEN_ID_TO_SLUG[tokenIdStr];
          if (!slug) return;
          var existing = claims[slug] || {};
          // Keep the FIRST opHash we find per slug — sort.desc means we
          // see the most recent first, but we want the one that matches
          // their first claim. Both are equally valid for tzkt linking.
          if (!existing.opHash) {
            claims[slug] = Object.assign({}, existing, {
              mug: slug,
              address: wallet.address,
              opHash: op.hash || '',
              mintedAt: op.timestamp || new Date().toISOString(),
              source: 'on-chain-sync',
            });
            changed = true;
          }
        });
        if (changed) {
          writeClaims(claims);
          refreshMintables();
      refreshShelf();
        }
      } catch (e) { /* tzkt down? skip */ }
    }

    // Initial fetch on load + every 60s for live updates.
    fetchEditionCounts();
    setInterval(fetchEditionCounts, 60_000);

    // ── Latest mints feed (visitor-facing social proof) ──────────────
    var SLUG_LABEL = {
      ceramic: 'Ceramic Mug',
      espresso: 'Espresso Cup',
      latte: 'Latte Glass',
      paper: 'Paper Cup',
      bistro: 'Bistro Cup',
    };

    function relativeTime(iso) {
      try {
        var t = new Date(iso).getTime();
        if (!t) return '';
        var diff = Math.max(0, (Date.now() - t) / 1000);
        if (diff < 60) return Math.floor(diff) + 's ago';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
      } catch (e) { return ''; }
    }

    async function fetchLatestMints() {
      var wrap = document.getElementById('coffee-mint-feed-wrap');
      var list = document.getElementById('coffee-mint-feed');
      if (!list || !wrap) return;
      try {
        var url = 'https://api.tzkt.io/v1/operations/transactions?target=' + COFFEE_KT1 +
          '&entrypoint=mint_mug&status=applied' +
          '&select=hash,sender,parameter,timestamp&limit=8&sort.desc=id';
        var res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('tzkt ' + res.status);
        var rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          wrap.hidden = true;
          return;
        }
        wrap.hidden = false;
        var myAddr = (readWallet() || {}).address || '';
        list.innerHTML = rows.map(function (op) {
          var raw = op && op.parameter && (op.parameter.value !== undefined ? op.parameter.value : op.parameter);
          var tokenIdStr = (raw && typeof raw === 'object') ? String(raw.value !== undefined ? raw.value : raw) : String(raw);
          var slug = TOKEN_ID_TO_SLUG[tokenIdStr] || ('token ' + tokenIdStr);
          var label = SLUG_LABEL[slug] || slug;
          var senderRaw = (op.sender && (op.sender.address || op.sender)) || '';
          var sender = typeof senderRaw === 'string' ? senderRaw : '';
          var senderShort = sender ? (sender.slice(0, 6) + '…' + sender.slice(-4)) : '?';
          var isMe = sender && myAddr && sender === myAddr;
          var ts = relativeTime(op.timestamp);
          var hashShort = op.hash ? op.hash.slice(0, 8) : '';
          return (
            '<li class="coffee__mint-feed-row' + (isMe ? ' coffee__mint-feed-row--me' : '') + '">' +
              '<span class="coffee__mint-feed-mug">' + label + '</span>' +
              '<span class="coffee__mint-feed-dot">·</span>' +
              '<span class="coffee__mint-feed-by">' + (isMe ? 'you' : senderShort) + '</span>' +
              '<span class="coffee__mint-feed-dot">·</span>' +
              '<span class="coffee__mint-feed-time">' + ts + '</span>' +
              (hashShort ?
                '<a class="coffee__mint-feed-link" href="https://tzkt.io/' + op.hash +
                '" target="_blank" rel="noopener" title="' + op.hash + '">tzkt ↗</a>' : '') +
            '</li>'
          );
        }).join('');
      } catch (e) {
        // Don't surface error noise on the public page — just hide.
        wrap.hidden = true;
      }
    }

    fetchLatestMints();
    setInterval(fetchLatestMints, 60_000);

    // On-chain sync runs whenever the wallet changes (connect / switch).
    syncOnChainOwnership();

    // Re-render whenever the wallet connects or disconnects.
    window.addEventListener('pc:wallet-change', function () {
      refreshMintables();
      refreshShelf();
      syncOnChainOwnership();
    });

    // ── NOUNS COMPANION — random noun walks across the bottom slowly.
    // Discovery, not in your face. Click = friendly nudge.
    function placeNoun() {
      if (!nounEl || !nounImg) return;
      var nounId = Math.floor(Math.random() * 1200);
      nounImg.src = 'https://noun.pics/' + nounId + '.svg';
      nounImg.alt = 'noun ' + nounId;
      nounEl.setAttribute('data-noun-id', String(nounId));
      nounEl.classList.add('coffee__noun--in');
    }
    if (nounEl) {
      // Show only after a delay so first impression is the pot, not a wandering noun.
      setTimeout(placeNoun, 8000);
      nounEl.addEventListener('click', function () {
        // Click bonus — pour an extra mug. Discovery reward.
        if (!btn) return;
        btn.click();
        // Brief sparkle on the noun
        nounEl.classList.add('coffee__noun--blip');
        setTimeout(function () { nounEl.classList.remove('coffee__noun--blip'); }, 600);
      });
    }

    // Update mintables when a pour happens
    if (btn) {
      btn.addEventListener('click', refreshMintables);
    }

    if (btn) {
      btn.addEventListener('click', function () {
        cups = readCups() + 1;
        writeCups(cups);
        if (numEl) numEl.textContent = String(cups);
        if (noteEl) noteEl.textContent = noteFor(cups);

        // Local optimistic mug append — server will return canonical
        // record and we re-render the shelf from that on .then below.
        var localVariants = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'];
        var optimistic = {
          mug: localVariants[(cups - 1) % localVariants.length],
          at: new Date().toISOString(),
        };
        renderMugRecord(optimistic, true);
        if (shelfRoot) shelfRoot.hidden = false;

        // Tiny visual nudge — the button briefly glows.
        btn.classList.add('coffee__pour--poured');
        setTimeout(function () { btn.classList.remove('coffee__pour--poured'); }, 600);

        // Best-effort global increment. Server returns canonical
        // count + mug list; re-render the shelf from that.
        fetch('/api/coffee/pour', { method: 'POST', cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || data.count == null) return;
            if (globalNum)  globalNum.textContent = String(data.count);
            if (globalRoot) globalRoot.hidden = false;
            // Rerender from canonical server list (replaces optimistic mug).
            renderGlobalShelf(Array.isArray(data.mugs) ? data.mugs : [], cups);
          })
          .catch(function () { /* offline / blocked — local optimistic mug stays */ });
      });
    }
  })();
<\/script>`], ["", ` <script>
  (function () {
    'use strict';

    var STORAGE_KEY = 'pc:coffee:cups';
    var DATE_KEY    = 'pc:coffee:date';

    function ptToday() {
      try {
        // Local PT date string YYYY-MM-DD via Intl
        var fmt = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric', month: '2-digit', day: '2-digit'
        });
        return fmt.format(new Date());
      } catch (e) {
        // Fallback — use the browser's local date.
        var d = new Date();
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      }
    }

    function readCups() {
      try {
        var savedDate = localStorage.getItem(DATE_KEY);
        var today = ptToday();
        if (savedDate !== today) {
          // New PT day — reset.
          localStorage.setItem(DATE_KEY, today);
          localStorage.setItem(STORAGE_KEY, '0');
          return 0;
        }
        return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
      } catch (e) {
        return 0;
      }
    }

    function writeCups(n) {
      try {
        localStorage.setItem(STORAGE_KEY, String(n));
        localStorage.setItem(DATE_KEY, ptToday());
      } catch (e) { /* private mode etc */ }
    }

    function greetingFor(hourPT) {
      // Time-of-day greeting in PT. The 23-4 branch is the overnight
      // "the lights are low" feel — added Sprint 41 as a small gesture
      // for late visitors.
      if (hourPT >= 5  && hourPT < 10) return "First cup of the day.";
      if (hourPT >= 10 && hourPT < 13) return "Late morning. The pot still has more.";
      if (hourPT >= 13 && hourPT < 17) return "Afternoon refill. Pace yourself.";
      if (hourPT >= 17 && hourPT < 21) return "Evening. Decaf, maybe.";
      if (hourPT >= 21 && hourPT < 23) return "Late hour. Tea would be wiser, honestly.";
      if (hourPT >= 23 || hourPT < 2)  return "The pot's still on. The lights are low. See you tomorrow.";
      return "Very late. Sleep is the wisest pour.";
    }

    function noteFor(cups) {
      if (cups === 0) return '';
      if (cups === 1) return "One cup. A reasonable opening.";
      if (cups === 2) return "Two. The morning has been productive.";
      if (cups === 3) return "Three. Approaching the limit.";
      if (cups === 4) return "Four cups. You\\\\u2019re jittery.";
      if (cups <  10) return cups + " cups. The pot may need a refill.";
      return cups + " cups. Touch grass, friend.";
    }

    function ptHour() {
      try {
        var fmt = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric', hour12: false
        });
        return parseInt(fmt.format(new Date()), 10);
      } catch (e) {
        return new Date().getHours();
      }
    }

    var btn        = document.getElementById('coffee-pour');
    var numEl      = document.getElementById('coffee-cups-num');
    var noteEl     = document.getElementById('coffee-tally-note');
    var greetingEl = document.getElementById('coffee-greeting');
    var globalRoot = document.getElementById('coffee-global');
    var globalNum  = document.getElementById('coffee-global-num');
    var shelfRoot   = document.getElementById('coffee-shelf');
    var shelfList   = document.getElementById('coffee-shelf-list');
    var shelfHead   = document.getElementById('coffee-shelf-heading');
    var shelfNote   = document.getElementById('coffee-shelf-note');
    var historyRail = document.getElementById('coffee-history-rail');
    var historyTotalEl = document.getElementById('coffee-history-total');
    var nounEl      = document.getElementById('coffee-noun');
    var nounImg     = document.getElementById('coffee-noun-img');

    // Variants must match MUGS array in frontmatter + MUG_VARIANTS in
    // functions/api/coffee/pour.ts.
    var VARIANT_TO_TPL_IDX = {
      ceramic:  0,
      espresso: 1,
      latte:    2,
      paper:    3,
      bistro:   4,
    };

    function mugTemplateBySlug(slug) {
      var idx = VARIANT_TO_TPL_IDX[slug];
      if (idx == null) return null;
      return document.getElementById('coffee-mug-' + idx);
    }

    function shortRel(iso) {
      var t = new Date(iso).getTime();
      if (!isFinite(t)) return '';
      var s = Math.max(0, Math.floor((Date.now() - t) / 1000));
      if (s < 60)    return s + 's';
      if (s < 3600)  return Math.floor(s / 60) + 'm';
      if (s < 86400) return Math.floor(s / 3600) + 'h';
      return Math.floor(s / 86400) + 'd';
    }

    function renderMugRecord(record, animate) {
      var tpl = mugTemplateBySlug(record.mug);
      if (!tpl || !shelfList) return;
      var clone = tpl.content.cloneNode(true);
      var li = clone.querySelector('li');
      if (!li) return;
      if (animate) li.classList.add('coffee-mug--new');
      // Annotate with hover title showing how long ago.
      var rel = shortRel(record.at);
      if (rel) li.setAttribute('title', li.getAttribute('title') + ' · ' + rel + ' ago');
      shelfList.appendChild(clone);
      // Trim to last 24 visible.
      while (shelfList.children.length > 24) {
        shelfList.removeChild(shelfList.firstElementChild);
      }
    }

    function setShelfHead(count, others) {
      if (!shelfHead) return;
      if (count <= 0) {
        shelfHead.textContent = "No cups poured yet today";
        return;
      }
      if (others <= 0) {
        shelfHead.textContent = "Today's mugs · " + count + " poured";
      } else {
        shelfHead.textContent = "Today's mugs · " + count + " poured · " + others + " from others";
      }
    }

    function renderGlobalShelf(globalMugs, localCount) {
      if (!shelfList || !shelfRoot) return;
      shelfList.innerHTML = '';
      var visible = (globalMugs || []).slice(-24);
      for (var i = 0; i < visible.length; i++) {
        renderMugRecord(visible[i], false);
      }
      var totalCount = (globalMugs || []).length;
      var others = Math.max(0, totalCount - localCount);
      setShelfHead(totalCount, others);
      shelfRoot.hidden = totalCount <= 0;
    }

    if (greetingEl) {
      greetingEl.textContent = greetingFor(ptHour());
    }

    var cups = readCups();
    if (numEl) numEl.textContent = String(cups);
    if (noteEl) noteEl.textContent = noteFor(cups);

    // Hydrate the global cup count + mug shelf from /api/coffee/today.
    // The shelf shows the last 24 mugs from EVERYONE today, including
    // mugs other visitors poured before you arrived.
    function hydrateGlobal() {
      fetch('/api/coffee/today', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || data.count == null) {
            if (globalRoot) globalRoot.hidden = true;
            renderGlobalShelf([], cups);
            return;
          }
          if (globalNum)  globalNum.textContent = String(data.count);
          if (globalRoot) globalRoot.hidden = false;
          renderGlobalShelf(Array.isArray(data.mugs) ? data.mugs : [], cups);
        })
        .catch(function () { /* network blip — leave shelf as-is */ });
    }
    hydrateGlobal();
    setInterval(hydrateGlobal, 30_000);

    // ── HISTORY ──────────────────────────────────────────────────
    function fmtDayShort(iso) {
      // iso like "2026-04-25" → "Sat 04-25"
      try {
        var d = new Date(iso + 'T12:00:00Z');
        var dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
        return dow + ' ' + iso.slice(5);
      } catch (e) { return iso; }
    }

    function renderHistory(data) {
      if (!historyRail) return;
      var days = (data && data.days) ? data.days : [];
      if (days.length === 0) {
        historyRail.innerHTML = '<div class="coffee__history-skel mono">no data yet</div>';
        return;
      }
      var max = days.reduce(function (m, d) { return d.count > m ? d.count : m; }, 1);
      var html = '';
      for (var i = 0; i < days.length; i++) {
        var d = days[i];
        var pct = max > 0 ? Math.round((d.count / max) * 100) : 0;
        var heightStyle = 'height:' + Math.max(pct, 4) + '%';
        var isToday = (i === days.length - 1);
        var bar = '<div class="coffee__hbar' + (isToday ? ' coffee__hbar--today' : '') + (d.count > 0 ? '' : ' coffee__hbar--empty') + '">' +
          '<div class="coffee__hbar-fill" style="' + heightStyle + '" title="' + d.day + ' · ' + d.count + ' cups"></div>' +
          '<div class="coffee__hbar-num mono">' + d.count + '</div>' +
          '<div class="coffee__hbar-day mono">' + fmtDayShort(d.day) + '</div>' +
          '</div>';
        html += bar;
      }
      historyRail.innerHTML = html;
      if (historyTotalEl && data.total != null) {
        historyTotalEl.textContent = String(data.total);
      }
    }

    function hydrateHistory() {
      fetch('/api/coffee/history?days=7', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) { if (data && data.days) renderHistory(data); })
        .catch(function () { /* leave skel */ });
    }
    hydrateHistory();
    setInterval(hydrateHistory, 60_000);

    // ── MINTABLES — wallet-aware claim flow with banked receipts
    var MUG_THRESHOLDS = { ceramic: 1, espresso: 3, latte: 7, paper: 15, bistro: 30 };
    var CLAIMS_KEY = 'pc:coffee:claims';

    function readWallet() {
      try {
        var raw = localStorage.getItem('pc:wallet');
        if (!raw) return null;
        var w = JSON.parse(raw);
        return (w && w.address) ? w : null;
      } catch (e) { return null; }
    }

    function readClaims() {
      try {
        var raw = localStorage.getItem(CLAIMS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) || {};
      } catch (e) { return {}; }
    }

    function writeClaims(claims) {
      try { localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims)); }
      catch (e) {}
    }

    function shortAddr(addr) {
      if (!addr) return '';
      return addr.slice(0, 5) + '…' + addr.slice(-4);
    }

    // ── Your shelf — visual display of mugs owned on the connected wallet ─
    // Server renders all 5 tiles hidden inside #coffee-shelf. We unhide
    // the ones with a corresponding claims[slug].opHash and link each to
    // tzkt. Section auto-hides if no mugs are owned (wallet not connected
    // or wallet owns zero mugs).
    function refreshShelf() {
      var shelfWrap = document.getElementById('coffee-shelf');
      var countEl = document.getElementById('coffee-shelf-count');
      var pluralEl = document.getElementById('coffee-shelf-count-s');
      if (!shelfWrap) return;
      var claims = readClaims();
      var owned = 0;
      var slugs = ['ceramic','espresso','latte','paper','bistro'];
      slugs.forEach(function (slug) {
        var tile = document.querySelector('[data-shelf-tile="' + slug + '"]');
        var link = document.querySelector('[data-shelf-link="' + slug + '"]');
        var hashEl = document.querySelector('[data-shelf-hash="' + slug + '"]');
        if (!tile || !link) return;
        var entry = claims[slug];
        if (entry && entry.opHash) {
          tile.hidden = false;
          link.href = 'https://tzkt.io/' + entry.opHash;
          if (hashEl) hashEl.textContent = entry.opHash.slice(0, 8) + '…';
          owned++;
        } else {
          tile.hidden = true;
          link.href = '#';
          if (hashEl) hashEl.textContent = '';
        }
      });
      shelfWrap.hidden = (owned === 0);
      if (countEl) countEl.textContent = String(owned);
      if (pluralEl) pluralEl.textContent = (owned === 1 ? '' : 's');
    }

    function refreshMintables() {
      var localCount = readCups();
      var wallet = readWallet();
      var claims = readClaims();
      var hint = document.getElementById('coffee-mint-wallet-hint');
      if (hint) {
        if (wallet && wallet.address) {
          hint.textContent = 'connected · ' + shortAddr(wallet.address) + ' · claim eligible mugs below';
        } else {
          hint.textContent = 'connect to claim · cups stay yours either way';
        }
      }

      var slugs = ['ceramic','espresso','latte','paper','bistro'];
      for (var i = 0; i < slugs.length; i++) {
        var slug = slugs[i];
        var threshold = MUG_THRESHOLDS[slug];
        var chip = document.querySelector('[data-mug-state="' + slug + '"]');
        var btn  = document.querySelector('[data-mug-claim="' + slug + '"]');
        if (!chip || !btn) continue;

        var entry = claims && claims[slug];
        var minted = entry && entry.opHash;
        var banked = entry && !entry.opHash;
        var eligible = localCount >= threshold;
        var hasWallet = !!(wallet && wallet.address);

        btn.disabled = true;
        if (minted) {
          // Already minted — show a tzkt link, button stays disabled.
          chip.innerHTML = '✓ <a href="https://tzkt.io/' + entry.opHash +
            '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">minted ↗</a>';
          btn.setAttribute('data-state', 'minted');
        } else if (banked) {
          // Banked locally — contract was off when claimed; redeem path TBD.
          chip.textContent = 'banked';
          btn.setAttribute('data-state', 'banked');
        } else if (eligible && hasWallet) {
          chip.textContent = 'mint to ' + shortAddr(wallet.address);
          btn.disabled = false;
          btn.setAttribute('data-state', 'eligible');
        } else if (eligible && !hasWallet) {
          chip.textContent = 'connect wallet';
          btn.setAttribute('data-state', 'connect');
        } else {
          var remain = threshold - localCount;
          chip.textContent = remain + ' more cup' + (remain === 1 ? '' : 's');
          btn.setAttribute('data-state', 'preview');
        }
      }
    }
    refreshMintables();
    refreshShelf();

    // Click handlers on each claim button.
    //
    // Two-phase claim: first POST /api/coffee/claim, which returns either
    //   • mode: 'banked'   — contract not live; receipt stored locally
    //   • mode: 'mintable' — contract live; we fire mint_mug(token_id)
    //     from the visitor's wallet via Beacon and surface the tzkt link
    //
    // The /api/coffee/claim endpoint reads contracts.coffee_mugs.mainnet
    // at request time, so it auto-flips banked → mintable on origination
    // without a frontend deploy. After this lands, the loop closes.
    function setMintRowState(slug, status, label) {
      var chip = document.querySelector('[data-mug-state="' + slug + '"]');
      var btn = document.querySelector('[data-mug-claim="' + slug + '"]');
      if (chip) chip.textContent = label;
      if (btn) btn.setAttribute('data-state', status);
    }

    async function claimMug(slug) {
      var wallet = readWallet();
      if (!wallet) {
        try { window.dispatchEvent(new CustomEvent('pc:open-wallet-menu')); }
        catch (e) {}
        return;
      }
      if (readCups() < MUG_THRESHOLDS[slug]) return;

      var existing = readClaims();
      if (existing[slug] && existing[slug].opHash) return; // already minted

      var btn = document.querySelector('[data-mug-claim="' + slug + '"]');
      if (btn) btn.disabled = true;
      setMintRowState(slug, 'requesting', 'requesting receipt…');

      var payload;
      try {
        var res = await fetch('/api/coffee/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mug: slug, address: wallet.address }),
        });
        payload = await res.json();
        if (!payload || payload.ok === false) {
          var msg = (payload && (payload.error || payload.reason)) || 'request failed';
          setMintRowState(slug, 'error', msg);
          if (btn) btn.disabled = false;
          return;
        }
      } catch (err) {
        setMintRowState(slug, 'error', 'network error');
        if (btn) btn.disabled = false;
        return;
      }

      // Banked mode — contract not live. Persist the receipt locally and
      // wait for the contract to flip on. Same UX as before this rewrite.
      if (payload.mode === 'banked' || !payload.mint) {
        var claims = readClaims();
        claims[slug] = payload.receipt || {
          mug: slug, address: wallet.address, bankedAt: new Date().toISOString(),
        };
        writeClaims(claims);
        refreshMintables();
      refreshShelf();
        var row = document.querySelector('[data-mug="' + slug + '"]');
        if (row) {
          row.classList.add('coffee-mint--just-banked');
          setTimeout(function () { row.classList.remove('coffee-mint--just-banked'); }, 900);
        }
        return;
      }

      // Mintable mode — call mint_mug(token_id) via Beacon. Same plumbing
      // as /admin/deploy/[slug] but driven from a visitor's wallet.
      setMintRowState(slug, 'minting', 'awaiting kukai…');
      try {
        var taquito = await import('@taquito/taquito');
        var beacon = await import('@taquito/beacon-wallet');
        var tezos = new taquito.TezosToolkit('https://mainnet.api.tez.ie');
        var beaconWallet = new beacon.BeaconWallet({
          name: 'PointCast',
          network: { type: 'mainnet' },
        });
        tezos.setWalletProvider(beaconWallet);

        var active = await beaconWallet.client.getActiveAccount();
        if (!active || (active.network && active.network.type !== 'mainnet')) {
          try { await beaconWallet.clearActiveAccount(); } catch (e) {}
          await beaconWallet.client.requestPermissions();
        }

        var mint = payload.mint;
        var contract = await tezos.wallet.at(mint.contract);
        var op = await contract.methodsObject[mint.entrypoint](mint.params.token_id).send();
        var opHash = (op && op.opHash) ? op.opHash : '';

        // Persist the in-flight mint so a refresh shows "minting" → tzkt.
        var claims = readClaims();
        claims[slug] = Object.assign({}, payload.receipt || {}, {
          opHash: opHash,
          mintedAt: new Date().toISOString(),
        });
        writeClaims(claims);

        setMintRowState(slug, 'minting', 'broadcast ' + opHash.slice(0, 10) + '…');
        await op.confirmation();
        setMintRowState(slug, 'minted', '✓ minted');

        // Replace the chip with a clickable tzkt link.
        var chip = document.querySelector('[data-mug-state="' + slug + '"]');
        if (chip && opHash) {
          chip.innerHTML = '✓ <a href="https://tzkt.io/' + opHash +
            '" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline;">minted ↗</a>';
        }
        refreshMintables();
      refreshShelf();

        // Brief visual nudge — same just-banked animation.
        var row = document.querySelector('[data-mug="' + slug + '"]');
        if (row) {
          row.classList.add('coffee-mint--just-banked');
          setTimeout(function () { row.classList.remove('coffee-mint--just-banked'); }, 1500);
        }
      } catch (err) {
        var msg = (err && err.message) ? err.message : String(err || 'unknown');
        if (/ABORTED|reject|cancel/i.test(msg)) {
          setMintRowState(slug, 'eligible', 'cancelled · try again');
        } else if (/NotEnoughBalance|balance/i.test(msg)) {
          setMintRowState(slug, 'eligible', 'fund wallet (~0.5 ꜩ for gas)');
        } else if (/EDITION_CAP_REACHED/i.test(msg)) {
          setMintRowState(slug, 'capped', 'edition cap reached');
        } else {
          setMintRowState(slug, 'error', String(msg).slice(0, 40));
        }
        if (btn) btn.disabled = false;
      }
    }

    document.querySelectorAll('[data-mug-claim]').forEach(function (b) {
      b.addEventListener('click', function () {
        var slug = b.getAttribute('data-mug-claim');
        if (slug) claimMug(slug);
      });
    });

    // ── On-chain editions panel + wallet-aware ownership sync ──────────
    // Reads:
    //   • /v1/contracts/<KT1>/storage      → bigmap pointers (mug_supply, ledger)
    //   • /v1/bigmaps/<mug_supply_id>/keys → per-token mint counts
    //   • /v1/operations/transactions?...  → wallet's mint_mug history → opHashes
    // and:
    //   • populates [data-mug-supply] chips with "X minted" labels
    //   • populates #coffee-mint-total with "X minted of 570 total"
    //   • when wallet is connected, marks any mug the wallet has minted
    //     as "minted ↗ tzkt" in localStorage so refreshMintables shows
    //     the success state — bridges /admin/deploy mints over to /coffee.
    var COFFEE_KT1 = 'KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt';
    var TOKEN_ID_TO_SLUG = { '0': 'ceramic', '1': 'espresso', '2': 'latte', '3': 'paper', '4': 'bistro' };
    var SLUG_TO_TOKEN_ID = { ceramic: 0, espresso: 1, latte: 2, paper: 3, bistro: 4 };
    var MUG_CAPS = { ceramic: 333, espresso: 144, latte: 64, paper: 21, bistro: 8 };
    var MUG_TOTAL_CAP = 333 + 144 + 64 + 21 + 8; // 570

    async function fetchEditionCounts() {
      var totalEl = document.getElementById('coffee-mint-total');
      try {
        // Fetch storage to discover the mug_supply bigmap pointer.
        var storageRes = await fetch(
          'https://api.tzkt.io/v1/contracts/' + COFFEE_KT1 + '/storage',
          { cache: 'no-store' }
        );
        if (!storageRes.ok) throw new Error('tzkt /storage ' + storageRes.status);
        var storage = await storageRes.json();
        var pointer = (typeof storage.mug_supply === 'number') ? storage.mug_supply
          : (typeof storage.supply === 'number') ? storage.supply
          : null;
        if (pointer == null) {
          if (totalEl) totalEl.textContent = '— minted of ' + MUG_TOTAL_CAP + ' total';
          return null;
        }
        var keysRes = await fetch(
          'https://api.tzkt.io/v1/bigmaps/' + pointer + '/keys?limit=100&select=key,value',
          { cache: 'no-store' }
        );
        if (!keysRes.ok) throw new Error('tzkt /bigmaps ' + keysRes.status);
        var keys = await keysRes.json();
        var supplyByTokenId = {};
        var totalMinted = 0;
        if (Array.isArray(keys)) {
          keys.forEach(function (row) {
            if (row && row.key !== undefined) {
              var n = parseInt(row.value, 10) || 0;
              supplyByTokenId[String(row.key)] = n;
              totalMinted += n;
            }
          });
        }
        // Populate per-mug supply chips.
        var slugs = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'];
        slugs.forEach(function (slug) {
          var tokenId = SLUG_TO_TOKEN_ID[slug];
          var minted = supplyByTokenId[String(tokenId)] || 0;
          var cap = MUG_CAPS[slug];
          var label = ' · ' + minted + ' / ' + cap + ' minted';
          var chip = document.querySelector('[data-mug-supply="' + slug + '"]');
          if (chip) chip.textContent = label;
        });
        if (totalEl) {
          var pct = MUG_TOTAL_CAP > 0 ? Math.round((totalMinted / MUG_TOTAL_CAP) * 100) : 0;
          totalEl.innerHTML =
            '<strong>' + totalMinted + '</strong> minted of ' + MUG_TOTAL_CAP +
            ' total · ' + pct + '% claimed · <a href="https://tzkt.io/' + COFFEE_KT1 +
            '" target="_blank" rel="noopener">on-chain ↗</a>';
        }
        return supplyByTokenId;
      } catch (err) {
        if (totalEl) totalEl.textContent = 'on-chain count unavailable';
        return null;
      }
    }

    // For a connected wallet, find every mint_mug they've called and
    // sync /coffee localStorage so refreshMintables shows "minted ↗"
    // even if the mint was done from /admin/deploy.
    async function syncOnChainOwnership() {
      var wallet = readWallet();
      if (!wallet || !wallet.address) return;
      try {
        var url = 'https://api.tzkt.io/v1/operations/transactions?target=' + COFFEE_KT1 +
          '&sender=' + wallet.address + '&entrypoint=mint_mug&status=applied' +
          '&select=hash,parameter,timestamp&limit=50&sort.desc=id';
        var res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        var rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) return;
        var claims = readClaims();
        var changed = false;
        rows.forEach(function (op) {
          // tzkt returns parameter.value as the unwrapped Michelson value;
          // for mint_mug(token_id) this is the nat as a string.
          var raw = op && op.parameter && (op.parameter.value !== undefined ? op.parameter.value : op.parameter);
          var tokenIdStr = (raw && typeof raw === 'object') ? String(raw.value || raw) : String(raw);
          var slug = TOKEN_ID_TO_SLUG[tokenIdStr];
          if (!slug) return;
          var existing = claims[slug] || {};
          // Keep the FIRST opHash we find per slug — sort.desc means we
          // see the most recent first, but we want the one that matches
          // their first claim. Both are equally valid for tzkt linking.
          if (!existing.opHash) {
            claims[slug] = Object.assign({}, existing, {
              mug: slug,
              address: wallet.address,
              opHash: op.hash || '',
              mintedAt: op.timestamp || new Date().toISOString(),
              source: 'on-chain-sync',
            });
            changed = true;
          }
        });
        if (changed) {
          writeClaims(claims);
          refreshMintables();
      refreshShelf();
        }
      } catch (e) { /* tzkt down? skip */ }
    }

    // Initial fetch on load + every 60s for live updates.
    fetchEditionCounts();
    setInterval(fetchEditionCounts, 60_000);

    // ── Latest mints feed (visitor-facing social proof) ──────────────
    var SLUG_LABEL = {
      ceramic: 'Ceramic Mug',
      espresso: 'Espresso Cup',
      latte: 'Latte Glass',
      paper: 'Paper Cup',
      bistro: 'Bistro Cup',
    };

    function relativeTime(iso) {
      try {
        var t = new Date(iso).getTime();
        if (!t) return '';
        var diff = Math.max(0, (Date.now() - t) / 1000);
        if (diff < 60) return Math.floor(diff) + 's ago';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return Math.floor(diff / 86400) + 'd ago';
      } catch (e) { return ''; }
    }

    async function fetchLatestMints() {
      var wrap = document.getElementById('coffee-mint-feed-wrap');
      var list = document.getElementById('coffee-mint-feed');
      if (!list || !wrap) return;
      try {
        var url = 'https://api.tzkt.io/v1/operations/transactions?target=' + COFFEE_KT1 +
          '&entrypoint=mint_mug&status=applied' +
          '&select=hash,sender,parameter,timestamp&limit=8&sort.desc=id';
        var res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('tzkt ' + res.status);
        var rows = await res.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          wrap.hidden = true;
          return;
        }
        wrap.hidden = false;
        var myAddr = (readWallet() || {}).address || '';
        list.innerHTML = rows.map(function (op) {
          var raw = op && op.parameter && (op.parameter.value !== undefined ? op.parameter.value : op.parameter);
          var tokenIdStr = (raw && typeof raw === 'object') ? String(raw.value !== undefined ? raw.value : raw) : String(raw);
          var slug = TOKEN_ID_TO_SLUG[tokenIdStr] || ('token ' + tokenIdStr);
          var label = SLUG_LABEL[slug] || slug;
          var senderRaw = (op.sender && (op.sender.address || op.sender)) || '';
          var sender = typeof senderRaw === 'string' ? senderRaw : '';
          var senderShort = sender ? (sender.slice(0, 6) + '…' + sender.slice(-4)) : '?';
          var isMe = sender && myAddr && sender === myAddr;
          var ts = relativeTime(op.timestamp);
          var hashShort = op.hash ? op.hash.slice(0, 8) : '';
          return (
            '<li class="coffee__mint-feed-row' + (isMe ? ' coffee__mint-feed-row--me' : '') + '">' +
              '<span class="coffee__mint-feed-mug">' + label + '</span>' +
              '<span class="coffee__mint-feed-dot">·</span>' +
              '<span class="coffee__mint-feed-by">' + (isMe ? 'you' : senderShort) + '</span>' +
              '<span class="coffee__mint-feed-dot">·</span>' +
              '<span class="coffee__mint-feed-time">' + ts + '</span>' +
              (hashShort ?
                '<a class="coffee__mint-feed-link" href="https://tzkt.io/' + op.hash +
                '" target="_blank" rel="noopener" title="' + op.hash + '">tzkt ↗</a>' : '') +
            '</li>'
          );
        }).join('');
      } catch (e) {
        // Don't surface error noise on the public page — just hide.
        wrap.hidden = true;
      }
    }

    fetchLatestMints();
    setInterval(fetchLatestMints, 60_000);

    // On-chain sync runs whenever the wallet changes (connect / switch).
    syncOnChainOwnership();

    // Re-render whenever the wallet connects or disconnects.
    window.addEventListener('pc:wallet-change', function () {
      refreshMintables();
      refreshShelf();
      syncOnChainOwnership();
    });

    // ── NOUNS COMPANION — random noun walks across the bottom slowly.
    // Discovery, not in your face. Click = friendly nudge.
    function placeNoun() {
      if (!nounEl || !nounImg) return;
      var nounId = Math.floor(Math.random() * 1200);
      nounImg.src = 'https://noun.pics/' + nounId + '.svg';
      nounImg.alt = 'noun ' + nounId;
      nounEl.setAttribute('data-noun-id', String(nounId));
      nounEl.classList.add('coffee__noun--in');
    }
    if (nounEl) {
      // Show only after a delay so first impression is the pot, not a wandering noun.
      setTimeout(placeNoun, 8000);
      nounEl.addEventListener('click', function () {
        // Click bonus — pour an extra mug. Discovery reward.
        if (!btn) return;
        btn.click();
        // Brief sparkle on the noun
        nounEl.classList.add('coffee__noun--blip');
        setTimeout(function () { nounEl.classList.remove('coffee__noun--blip'); }, 600);
      });
    }

    // Update mintables when a pour happens
    if (btn) {
      btn.addEventListener('click', refreshMintables);
    }

    if (btn) {
      btn.addEventListener('click', function () {
        cups = readCups() + 1;
        writeCups(cups);
        if (numEl) numEl.textContent = String(cups);
        if (noteEl) noteEl.textContent = noteFor(cups);

        // Local optimistic mug append — server will return canonical
        // record and we re-render the shelf from that on .then below.
        var localVariants = ['ceramic', 'espresso', 'latte', 'paper', 'bistro'];
        var optimistic = {
          mug: localVariants[(cups - 1) % localVariants.length],
          at: new Date().toISOString(),
        };
        renderMugRecord(optimistic, true);
        if (shelfRoot) shelfRoot.hidden = false;

        // Tiny visual nudge — the button briefly glows.
        btn.classList.add('coffee__pour--poured');
        setTimeout(function () { btn.classList.remove('coffee__pour--poured'); }, 600);

        // Best-effort global increment. Server returns canonical
        // count + mug list; re-render the shelf from that.
        fetch('/api/coffee/pour', { method: 'POST', cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (data) {
            if (!data || data.count == null) return;
            if (globalNum)  globalNum.textContent = String(data.count);
            if (globalRoot) globalRoot.hidden = false;
            // Rerender from canonical server list (replaces optimistic mug).
            renderGlobalShelf(Array.isArray(data.mugs) ? data.mugs : [], cups);
          })
          .catch(function () { /* offline / blocked — local optimistic mug stays */ });
      });
    }
  })();
<\/script>`])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "Coffee · PointCast", "description": "The coffee pot, still on. A small cozy room with a pixel-art moka pot, a pour button, and a quiet count of cups poured today.", "image": "/images/og/coffee.png", "data-astro-cid-jpmfcwuz": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="coffee" data-astro-cid-jpmfcwuz> <!-- Site masthead — same warm-mono treatment as /admin/deploy + /drum.
         Wallet connector lives here too so visitors can connect once
         and have their state surface across the page (mints feed,
         your-shelf tiles, claim button). --> <div class="coffee__masthead" data-astro-cid-jpmfcwuz> <a href="/" class="coffee__home" data-astro-cid-jpmfcwuz>PointCast</a> <span class="coffee__path" data-astro-cid-jpmfcwuz>/ coffee</span> <span class="coffee__masthead-spacer" data-astro-cid-jpmfcwuz></span> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-jpmfcwuz": true })} </div> <article class="coffee__hero" data-astro-cid-jpmfcwuz> <p class="coffee__kicker mono" data-astro-cid-jpmfcwuz>The pot · always on</p> <h1 class="coffee__title" data-astro-cid-jpmfcwuz>Coffee.</h1> <p class="coffee__greeting" id="coffee-greeting" data-astro-cid-jpmfcwuz>It's a fine time for a cup.</p> </article> <section class="coffee__stage" aria-label="Pixel-art coffee pot" data-astro-cid-jpmfcwuz> ${renderComponent($$result2, "CoffeePot", $$CoffeePot, { "size": 320, "data-astro-cid-jpmfcwuz": true })} </section> <section class="coffee__interact" aria-label="Pour a cup" data-astro-cid-jpmfcwuz> <button type="button" id="coffee-pour" class="coffee__pour mono" aria-describedby="coffee-tally" data-astro-cid-jpmfcwuz>
Pour a cup
</button> <p class="coffee__tally mono" id="coffee-tally" data-astro-cid-jpmfcwuz> <span id="coffee-cups-num" data-astro-cid-jpmfcwuz>0</span> <span class="coffee__tally-lbl" data-astro-cid-jpmfcwuz>cups poured here · today</span> </p> <p class="coffee__tally-note mono" id="coffee-tally-note" aria-live="polite" data-astro-cid-jpmfcwuz></p> <p class="coffee__global mono" id="coffee-global" aria-live="polite" hidden data-astro-cid-jpmfcwuz> <span class="coffee__global-icon" aria-hidden="true" data-astro-cid-jpmfcwuz>·</span> <span id="coffee-global-num" data-astro-cid-jpmfcwuz>0</span> <span class="coffee__global-lbl" data-astro-cid-jpmfcwuz>poured globally today</span> </p> </section> <section class="coffee__shelf" aria-labelledby="shelf-title" hidden id="coffee-shelf" data-astro-cid-jpmfcwuz> <h2 id="shelf-title" class="coffee__shelf-title mono" data-astro-cid-jpmfcwuz> <span id="coffee-shelf-heading" data-astro-cid-jpmfcwuz>Today's mugs</span> </h2> <ul class="coffee__shelf-list" id="coffee-shelf-list" role="list" data-astro-cid-jpmfcwuz></ul> <p class="coffee__shelf-note mono" id="coffee-shelf-note" data-astro-cid-jpmfcwuz>
Resets at midnight PT.
</p> </section> <!-- Hidden template — rendered as <template>s for the JS to clone. --> <div class="coffee__templates" hidden aria-hidden="true" data-astro-cid-jpmfcwuz> ${MUGS.map((mug, i) => renderTemplate`<template${addAttribute(`coffee-mug-${i}`, "id")}${addAttribute(mug.slug, "data-slug")}${addAttribute(mug.label, "data-label")} data-astro-cid-jpmfcwuz> <li${addAttribute(`coffee-mug coffee-mug--${mug.slug}`, "class")}${addAttribute(mug.label, "title")} data-astro-cid-jpmfcwuz> <svg viewBox="0 0 24 24" width="48" height="48" shape-rendering="crispEdges"${addAttribute(mug.label, "aria-label")} role="img" data-astro-cid-jpmfcwuz> ${mug.pixels.map(([x, y, w, h, fill]) => renderTemplate`<rect${addAttribute(x, "x")}${addAttribute(y, "y")}${addAttribute(w, "width")}${addAttribute(h, "height")}${addAttribute(fill, "fill")} data-astro-cid-jpmfcwuz></rect>`)} </svg> </li> </template>`)} </div> <!-- HISTORY · through the days --> <section class="coffee__history" aria-labelledby="coffee-history-title" data-astro-cid-jpmfcwuz> <header class="coffee__section-head" data-astro-cid-jpmfcwuz> <p class="coffee__section-kicker mono" data-astro-cid-jpmfcwuz>Through the days</p> <h2 id="coffee-history-title" class="coffee__section-title" data-astro-cid-jpmfcwuz>Cups poured · since the pot lit.</h2> </header> <div class="coffee__history-stat" id="coffee-history-stat" data-astro-cid-jpmfcwuz> <span class="coffee__history-num mono" id="coffee-history-total" data-astro-cid-jpmfcwuz>—</span> <span class="coffee__history-num-lbl mono" data-astro-cid-jpmfcwuz>cumulative</span> </div> <div class="coffee__history-rail" id="coffee-history-rail" aria-label="Last 7 days, daily cup counts" data-astro-cid-jpmfcwuz> <!-- Bars hydrated client-side from /api/coffee/history?days=7 --> <div class="coffee__history-skel mono" data-astro-cid-jpmfcwuz>loading…</div> </div> <p class="coffee__history-note mono" data-astro-cid-jpmfcwuz>
The pot lit Friday April 24. Every PT-day is a fresh count; the bars hold the shape.
</p> </section> <!-- MINTABLES · five mugs, five rarity tiers, real wallet connect --> <!-- Your minted shelf — visible only when the connected wallet has
         minted at least one mug on-chain. Server-rendered with all 5
         tiles hidden; the script unhides the ones the wallet owns and
         updates each link to the relevant tzkt op. --> <section class="coffee__shelf" id="coffee-shelf" hidden aria-labelledby="coffee-shelf-title" data-astro-cid-jpmfcwuz> <header class="coffee__shelf-head" data-astro-cid-jpmfcwuz> <p class="coffee__shelf-kicker mono" data-astro-cid-jpmfcwuz>Your shelf</p> <h2 id="coffee-shelf-title" class="coffee__shelf-title" data-astro-cid-jpmfcwuz> <span id="coffee-shelf-count" data-astro-cid-jpmfcwuz>0</span> mug<span id="coffee-shelf-count-s" data-astro-cid-jpmfcwuz></span> on this wallet
</h2> <p class="coffee__shelf-dek mono" data-astro-cid-jpmfcwuz>click any mug to view the mint on tzkt · they live in your Tezos wallet</p> </header> <ul class="coffee__shelf-list" role="list" data-astro-cid-jpmfcwuz> ${MUGS.map((mug) => {
    const tier = MUG_TIERS[mug.slug];
    return renderTemplate`<li${addAttribute(`coffee-shelf-tile coffee-shelf-tile--${tier.rarity}`, "class")}${addAttribute(mug.slug, "data-shelf-tile")} hidden data-astro-cid-jpmfcwuz> <a class="coffee-shelf-tile__link"${addAttribute(mug.slug, "data-shelf-link")} target="_blank" rel="noopener" href="#"${addAttribute(`Your ${mug.label} mint on tzkt`, "title")} data-astro-cid-jpmfcwuz> <span class="coffee-shelf-tile__art"${addAttribute(`--rarity-color:${tier.hex}`, "style")} aria-hidden="true" data-astro-cid-jpmfcwuz> <svg viewBox="0 0 24 24" width="56" height="56" shape-rendering="crispEdges" data-astro-cid-jpmfcwuz> ${mug.pixels.map(([x, y, w, h, fill]) => renderTemplate`<rect${addAttribute(x, "x")}${addAttribute(y, "y")}${addAttribute(w, "width")}${addAttribute(h, "height")}${addAttribute(fill, "fill")} data-astro-cid-jpmfcwuz></rect>`)} </svg> </span> <span class="coffee-shelf-tile__name" data-astro-cid-jpmfcwuz>${mug.label}</span> <span${addAttribute(`coffee-shelf-tile__rarity mono coffee-shelf-tile__rarity--${tier.rarity}`, "class")} data-astro-cid-jpmfcwuz>${tier.rarity}</span> <span class="coffee-shelf-tile__hash mono"${addAttribute(mug.slug, "data-shelf-hash")} data-astro-cid-jpmfcwuz></span> </a> </li>`;
  })} </ul> </section> <section class="coffee__mintables" aria-labelledby="coffee-mint-title" data-astro-cid-jpmfcwuz> <header class="coffee__section-head" data-astro-cid-jpmfcwuz> <p class="coffee__section-kicker mono" data-astro-cid-jpmfcwuz>Mintables</p> <h2 id="coffee-mint-title" class="coffee__section-title" data-astro-cid-jpmfcwuz>Five mugs. Five tiers. Connect a wallet.</h2> <p class="coffee__section-dek" data-astro-cid-jpmfcwuz>
Each mug is a tiny edition. Pour past the threshold and the mug becomes claimable to your Tezos wallet. The FA2 contract is <em data-astro-cid-jpmfcwuz>live</em> on mainnet (<a href="https://tzkt.io/KT1JQ3AjzFvMnjZ9mGqrM13aj8LQBx9JpoXt" target="_blank" rel="noopener" data-astro-cid-jpmfcwuz>KT1JQ3Aj…</a>) — claims fire <code data-astro-cid-jpmfcwuz>mint_mug</code> from your wallet, gas-only.
</p> <div class="coffee__mint-wallet" data-astro-cid-jpmfcwuz> ${renderComponent($$result2, "WalletConnect", $$WalletConnect, { "data-astro-cid-jpmfcwuz": true })} <p class="coffee__mint-wallet-hint mono" id="coffee-mint-wallet-hint" data-astro-cid-jpmfcwuz>connect to claim · cups stay yours either way</p> </div> <p class="coffee__mint-total mono" id="coffee-mint-total" aria-live="polite" data-astro-cid-jpmfcwuz>
loading on-chain count…
</p> </header> <ul class="coffee__mint-list" role="list" data-astro-cid-jpmfcwuz> ${MUGS.map((mug) => {
    const tier = MUG_TIERS[mug.slug];
    return renderTemplate`<li${addAttribute(`coffee-mint coffee-mint--${mug.slug} coffee-mint--${tier.rarity}`, "class")}${addAttribute(mug.slug, "data-mug")}${addAttribute(tier.threshold, "data-threshold")} data-astro-cid-jpmfcwuz> <div class="coffee-mint__art" aria-hidden="true"${addAttribute(`--rarity-color:${tier.hex}`, "style")} data-astro-cid-jpmfcwuz> <svg viewBox="0 0 24 24" width="64" height="64" shape-rendering="crispEdges"${addAttribute(mug.label, "aria-label")} role="img" data-astro-cid-jpmfcwuz> ${mug.pixels.map(([x, y, w, h, fill]) => renderTemplate`<rect${addAttribute(x, "x")}${addAttribute(y, "y")}${addAttribute(w, "width")}${addAttribute(h, "height")}${addAttribute(fill, "fill")} data-astro-cid-jpmfcwuz></rect>`)} </svg> </div> <div class="coffee-mint__meta" data-astro-cid-jpmfcwuz> <div class="coffee-mint__name-row" data-astro-cid-jpmfcwuz> <p class="coffee-mint__name" data-astro-cid-jpmfcwuz>${mug.label}</p> <span${addAttribute(`coffee-mint__rarity mono coffee-mint__rarity--${tier.rarity}`, "class")} data-astro-cid-jpmfcwuz>${tier.rarity}</span> </div> <p class="coffee-mint__edition mono" data-astro-cid-jpmfcwuz>
edition · ${tier.editions} · threshold · ${tier.threshold} cup${tier.threshold === 1 ? "" : "s"} <span class="coffee-mint__supply"${addAttribute(mug.slug, "data-mug-supply")} data-astro-cid-jpmfcwuz> · — minted</span> </p> <p class="coffee-mint__unlock mono"${addAttribute(mug.slug, "data-mug-unlock")} data-astro-cid-jpmfcwuz>${tier.threshold === 1 ? "unlock with first pour" : `unlock at ${tier.threshold} cumulative cups`}</p> </div> <button type="button" class="coffee-mint__claim mono"${addAttribute(mug.slug, "data-mug-claim")} disabled${addAttribute(`Claim ${mug.label}`, "aria-label")} data-astro-cid-jpmfcwuz> <span${addAttribute(mug.slug, "data-mug-state")} data-astro-cid-jpmfcwuz>preview</span> </button> </li>`;
  })} </ul> <p class="coffee__mint-foot mono" data-astro-cid-jpmfcwuz>
Status moves <em data-astro-cid-jpmfcwuz>preview</em> → <em data-astro-cid-jpmfcwuz>eligible</em> → <em data-astro-cid-jpmfcwuz>minting</em> → <em data-astro-cid-jpmfcwuz>minted</em>. Banked claims (from before the contract went live 2026-04-25) stay redeemable.
<a href="/b/0356" data-astro-cid-jpmfcwuz>how Tezos staking works →</a> </p> <!-- Latest mints — live on-chain feed. Visitors see who's minted
           recently + a click path to tzkt for each op. Polls every 60s.
           Hidden until tzkt returns at least one row. --> <aside class="coffee__mint-feed-wrap" hidden id="coffee-mint-feed-wrap" aria-labelledby="coffee-mint-feed-title" data-astro-cid-jpmfcwuz> <h3 class="coffee__mint-feed-title mono" id="coffee-mint-feed-title" data-astro-cid-jpmfcwuz>Latest mints</h3> <ol class="coffee__mint-feed mono" id="coffee-mint-feed" role="list" data-astro-cid-jpmfcwuz> <li class="coffee__mint-feed-empty" data-astro-cid-jpmfcwuz>loading…</li> </ol> </aside> </section> <section class="coffee__about" aria-label="About the pot" data-astro-cid-jpmfcwuz> <p data-astro-cid-jpmfcwuz>
This corner exists because the line "coffee pot, still on" has been closing cc's blocks for a few sprints now. Mike asked for the motif made literal. Here it is.
</p> <p data-astro-cid-jpmfcwuz>
The pot is on. The steam is real (CSS keyframes). The heat dots pulse on a 1.8s loop. Reduced motion stops everything but keeps the silhouette. Pour a cup with the button — count is local to your browser, resets at midnight PT.
</p> <p class="coffee__quiet" data-astro-cid-jpmfcwuz>
A garden is slow on purpose. A broadcast is too. A good cup of coffee is in the same family.
</p> </section> <!-- Nouns companion · walks across the bottom of the page on a slow loop. --> <!-- Discovery, not in your face. Builds in /coffee but sits at fixed bottom. --> <div class="coffee__noun" aria-hidden="true" id="coffee-noun" data-astro-cid-jpmfcwuz> <img class="coffee__noun-img" id="coffee-noun-img" alt="" decoding="async" loading="lazy" data-astro-cid-jpmfcwuz> </div> <nav class="coffee__exits" aria-label="Coffee exits" data-astro-cid-jpmfcwuz> <a href="/" class="coffee__exit mono" data-astro-cid-jpmfcwuz>← the front door</a> <a href="/mythos" class="coffee__exit mono" data-astro-cid-jpmfcwuz>the mythos</a> <a href="/taproom" class="coffee__exit mono" data-astro-cid-jpmfcwuz>the taproom</a> <a href="/wire" class="coffee__exit mono" data-astro-cid-jpmfcwuz>the wire</a> </nav> ${renderComponent($$result2, "ShareThis", $$ShareThis, { "url": "/coffee", "kind": "coffee", "data-astro-cid-jpmfcwuz": true })} </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/coffee.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/coffee.astro";
const $$url = "/coffee";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Coffee,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
