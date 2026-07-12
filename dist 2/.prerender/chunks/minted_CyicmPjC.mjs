import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import contracts from './contracts_B1zhgPPX.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Minted = createComponent(async ($$result, $$props, $$slots) => {
  const c = contracts;
  const COFFEE_KT1 = (c.coffee_mugs?.mainnet).trim();
  const VN_KT1 = (c.visit_nouns?.mainnet).trim();
  const WS_KT1 = (c.window_snapshots?.mainnet).trim();
  const COFFEE_SLUGS = { 0: "ceramic", 1: "espresso", 2: "latte", 3: "paper", 4: "bistro" };
  const COFFEE_NAMES = {
    0: "Ceramic Mug",
    1: "Espresso Cup",
    2: "Latte Glass",
    3: "Paper Cup",
    4: "Bistro Cup"
  };
  const WS_SLUGS = { 0: "0-galley", 1: "1-long-room", 2: "2-lamp-wall" };
  const WS_NAMES = { 0: "Galley", 1: "Long Room", 2: "Lamp Wall" };
  const COLLECTIONS = [];
  if (COFFEE_KT1.startsWith("KT1")) {
    COLLECTIONS.push({
      slug: "coffee_mugs",
      name: "Coffee Mugs",
      href: "/coffee",
      kt1: COFFEE_KT1,
      symbol: "PCMUG",
      imageFor: (id) => COFFEE_SLUGS[id] ? `/images/coffee-mugs/${COFFEE_SLUGS[id]}.svg` : null,
      nameFor: (id) => COFFEE_NAMES[id] ?? `Coffee Mug #${id}`
    });
  }
  if (VN_KT1.startsWith("KT1")) {
    COLLECTIONS.push({
      slug: "visit_nouns",
      name: "Visit Nouns",
      href: "/visit-nouns",
      kt1: VN_KT1,
      symbol: "PCVN",
      imageFor: (id) => `https://noun.pics/${id}.svg`,
      nameFor: (id) => `Visit Noun #${id}`
    });
  }
  if (WS_KT1.startsWith("KT1")) {
    COLLECTIONS.push({
      slug: "window_snapshots",
      name: "Window Snapshots",
      href: "/snapshots",
      kt1: WS_KT1,
      symbol: "PCWIN",
      imageFor: (id) => WS_SLUGS[id] ? `/images/window-snapshots/${WS_SLUGS[id]}.jpg` : null,
      nameFor: (id) => WS_NAMES[id] ?? `Window Snapshot #${id}`
    });
  }
  const PENDING_LANES = [
    { slug: "window_snapshots", name: "Window Snapshots", href: "/snapshots", kt1: WS_KT1 },
    { slug: "birthdays", name: "Birthdays", href: "/cake", kt1: (c.birthdays?.mainnet).trim() },
    { slug: "drum_token", name: "Drum Token", href: "/drum", kt1: (c.drum_token?.mainnet).trim() },
    { slug: "zen_cats", name: "Zen Cats", href: "/zen-cats", kt1: (c.zen_cats?.mainnet).trim() }
  ].filter((l) => !l.kt1.startsWith("KT1"));
  const title = "/minted — what you hold on PointCast";
  const description = "Per-wallet live view of your holdings across PointCast Tezos collections — Coffee Mugs, Visit Nouns, Window Snapshots, and more.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';
  var MIKE_FALLBACK = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

  function readActiveAddress() {
    try { return localStorage.getItem('pc:wallet-active'); } catch (e) { return null; }
  }
  function readCollections() {
    var main = document.getElementById('minted-main');
    var raw = main && main.getAttribute('data-collections');
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch (e) { return []; }
  }
  function shortAddr(a) { return (a && a.length > 12) ? (a.slice(0, 6) + '…' + a.slice(-4)) : (a || ''); }
  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function escAttr(s) { return escHtml(s); }
  function imageFor(slug, tokenId) {
    if (slug === 'coffee_mugs') {
      var s = ['ceramic','espresso','latte','paper','bistro'][parseInt(tokenId, 10)];
      return s ? '/images/coffee-mugs/' + s + '.svg' : null;
    }
    if (slug === 'visit_nouns') return 'https://noun.pics/' + parseInt(tokenId, 10) + '.svg';
    if (slug === 'window_snapshots') {
      var w = ['0-galley','1-long-room','2-lamp-wall'][parseInt(tokenId, 10)];
      return w ? '/images/window-snapshots/' + w + '.jpg' : null;
    }
    return null;
  }
  function nameFor(slug, tokenId) {
    if (slug === 'coffee_mugs') return ['Ceramic Mug','Espresso Cup','Latte Glass','Paper Cup','Bistro Cup'][parseInt(tokenId, 10)] || ('Coffee #' + tokenId);
    if (slug === 'visit_nouns') return 'Visit Noun #' + tokenId;
    if (slug === 'window_snapshots') return ['Galley','Long Room','Lamp Wall'][parseInt(tokenId, 10)] || ('Snapshot #' + tokenId);
    return slug + ' #' + tokenId;
  }

  async function loadHoldings(addr, isOwn) {
    var lanes = document.getElementById('minted-lanes');
    var ownerEl = document.getElementById('minted-owner');
    if (!lanes) return;
    var collections = readCollections();
    if (collections.length === 0) {
      lanes.innerHTML = '<p class="minted__empty mono">no live PointCast collections yet · check back after origination</p>';
      if (ownerEl) ownerEl.textContent = '—';
      return;
    }
    if (ownerEl) {
      ownerEl.innerHTML = isOwn
        ? 'your wallet · <code>' + escHtml(shortAddr(addr)) + '</code>'
        : 'sample · Mike\\'s wallet · <code>' + escHtml(shortAddr(addr)) + '</code> · connect yours via the wallet chip';
    }

    var results = await Promise.all(collections.map(function (coll) {
      var url = 'https://api.tzkt.io/v1/tokens/balances' +
        '?account=' + encodeURIComponent(addr) +
        '&token.contract=' + encodeURIComponent(coll.kt1) +
        '&balance.gt=0' +
        '&select=token.tokenId,balance' +
        '&limit=200';
      return fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) { return { coll: coll, rows: Array.isArray(rows) ? rows : [] }; })
        .catch(function () { return { coll: coll, rows: [] }; });
    }));

    var html = '';
    var totalHeld = 0;
    results.forEach(function (res) {
      var coll = res.coll;
      var rows = res.rows;
      var heldCount = 0;
      rows.forEach(function (r) { heldCount += parseInt(r.balance || '0', 10) || 0; });
      totalHeld += heldCount;
      var lane = '<section class="minted-lane" data-slug="' + escAttr(coll.slug) + '">' +
        '<header class="minted-lane__head">' +
          '<a class="minted-lane__name" href="' + escAttr(coll.href) + '">' + escHtml(coll.name) + '</a>' +
          '<span class="minted-lane__kt1 mono">' + escHtml(shortAddr(coll.kt1)) + '</span>' +
          '<span class="minted-lane__count mono">' + heldCount + ' held</span>' +
        '</header>';
      if (rows.length === 0) {
        lane += '<p class="minted-lane__empty mono">none yet · ' +
          (coll.slug === 'coffee_mugs' ? 'pour at <a href="/coffee">/coffee</a>' :
           coll.slug === 'visit_nouns' ? 'claim at <a href="/visit-nouns">/visit-nouns</a>' :
           coll.slug === 'window_snapshots' ? 'mint at <a href="/snapshots">/snapshots</a>' :
           'see <a href="' + escAttr(coll.href) + '">' + escAttr(coll.href) + '</a>') +
          '</p>';
      } else {
        lane += '<div class="minted-lane__grid">';
        rows.forEach(function (r) {
          var tokenIdRaw = r['token.tokenId'] !== undefined ? r['token.tokenId'] : r.tokenId;
          var tokenId = parseInt(tokenIdRaw, 10);
          var balance = parseInt(r.balance || '0', 10) || 0;
          if (!Number.isFinite(tokenId) || balance <= 0) return;
          var img = imageFor(coll.slug, tokenId);
          var nm = nameFor(coll.slug, tokenId);
          lane += '<a class="minted-card" href="https://objkt.com/tokens/' + escAttr(coll.kt1) + '/' + tokenId + '" target="_blank" rel="noopener">' +
            '<div class="minted-card__art">' +
              (img ? '<img src="' + escAttr(img) + '" alt="' + escAttr(nm) + '" loading="lazy" />' : '<div class="minted-card__placeholder">№' + tokenId + '</div>') +
              '<span class="minted-card__balance mono">×' + balance + '</span>' +
            '</div>' +
            '<p class="minted-card__name">' + escHtml(nm) + '</p>' +
            '<p class="minted-card__meta mono">№' + tokenId + ' · objkt ↗</p>' +
          '</a>';
        });
        lane += '</div>';
      }
      lane += '</section>';
      html += lane;
    });

    lanes.innerHTML = html || '<p class="minted__empty mono">no PointCast tokens held yet</p>';
  }

  function tick() {
    var el = document.getElementById('minted-clock');
    if (!el) return;
    var n = new Date();
    el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ' PT';
  }

  function repaint() {
    var addr = readActiveAddress();
    if (addr) loadHoldings(addr, true);
    else loadHoldings(MIKE_FALLBACK, false);
  }

  repaint();
  tick();
  setInterval(tick, 60 * 1000);
  window.addEventListener('storage', function (e) { if (e.key === 'pc:wallet-active') repaint(); });
  window.addEventListener('pc:wallet-change', repaint);
})();
<\/script>`], ["", ` <script>
(function () {
  'use strict';
  var MIKE_FALLBACK = 'tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw';

  function readActiveAddress() {
    try { return localStorage.getItem('pc:wallet-active'); } catch (e) { return null; }
  }
  function readCollections() {
    var main = document.getElementById('minted-main');
    var raw = main && main.getAttribute('data-collections');
    if (!raw) return [];
    try { return JSON.parse(raw) || []; } catch (e) { return []; }
  }
  function shortAddr(a) { return (a && a.length > 12) ? (a.slice(0, 6) + '…' + a.slice(-4)) : (a || ''); }
  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function escAttr(s) { return escHtml(s); }
  function imageFor(slug, tokenId) {
    if (slug === 'coffee_mugs') {
      var s = ['ceramic','espresso','latte','paper','bistro'][parseInt(tokenId, 10)];
      return s ? '/images/coffee-mugs/' + s + '.svg' : null;
    }
    if (slug === 'visit_nouns') return 'https://noun.pics/' + parseInt(tokenId, 10) + '.svg';
    if (slug === 'window_snapshots') {
      var w = ['0-galley','1-long-room','2-lamp-wall'][parseInt(tokenId, 10)];
      return w ? '/images/window-snapshots/' + w + '.jpg' : null;
    }
    return null;
  }
  function nameFor(slug, tokenId) {
    if (slug === 'coffee_mugs') return ['Ceramic Mug','Espresso Cup','Latte Glass','Paper Cup','Bistro Cup'][parseInt(tokenId, 10)] || ('Coffee #' + tokenId);
    if (slug === 'visit_nouns') return 'Visit Noun #' + tokenId;
    if (slug === 'window_snapshots') return ['Galley','Long Room','Lamp Wall'][parseInt(tokenId, 10)] || ('Snapshot #' + tokenId);
    return slug + ' #' + tokenId;
  }

  async function loadHoldings(addr, isOwn) {
    var lanes = document.getElementById('minted-lanes');
    var ownerEl = document.getElementById('minted-owner');
    if (!lanes) return;
    var collections = readCollections();
    if (collections.length === 0) {
      lanes.innerHTML = '<p class="minted__empty mono">no live PointCast collections yet · check back after origination</p>';
      if (ownerEl) ownerEl.textContent = '—';
      return;
    }
    if (ownerEl) {
      ownerEl.innerHTML = isOwn
        ? 'your wallet · <code>' + escHtml(shortAddr(addr)) + '</code>'
        : 'sample · Mike\\\\'s wallet · <code>' + escHtml(shortAddr(addr)) + '</code> · connect yours via the wallet chip';
    }

    var results = await Promise.all(collections.map(function (coll) {
      var url = 'https://api.tzkt.io/v1/tokens/balances' +
        '?account=' + encodeURIComponent(addr) +
        '&token.contract=' + encodeURIComponent(coll.kt1) +
        '&balance.gt=0' +
        '&select=token.tokenId,balance' +
        '&limit=200';
      return fetch(url, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (rows) { return { coll: coll, rows: Array.isArray(rows) ? rows : [] }; })
        .catch(function () { return { coll: coll, rows: [] }; });
    }));

    var html = '';
    var totalHeld = 0;
    results.forEach(function (res) {
      var coll = res.coll;
      var rows = res.rows;
      var heldCount = 0;
      rows.forEach(function (r) { heldCount += parseInt(r.balance || '0', 10) || 0; });
      totalHeld += heldCount;
      var lane = '<section class="minted-lane" data-slug="' + escAttr(coll.slug) + '">' +
        '<header class="minted-lane__head">' +
          '<a class="minted-lane__name" href="' + escAttr(coll.href) + '">' + escHtml(coll.name) + '</a>' +
          '<span class="minted-lane__kt1 mono">' + escHtml(shortAddr(coll.kt1)) + '</span>' +
          '<span class="minted-lane__count mono">' + heldCount + ' held</span>' +
        '</header>';
      if (rows.length === 0) {
        lane += '<p class="minted-lane__empty mono">none yet · ' +
          (coll.slug === 'coffee_mugs' ? 'pour at <a href="/coffee">/coffee</a>' :
           coll.slug === 'visit_nouns' ? 'claim at <a href="/visit-nouns">/visit-nouns</a>' :
           coll.slug === 'window_snapshots' ? 'mint at <a href="/snapshots">/snapshots</a>' :
           'see <a href="' + escAttr(coll.href) + '">' + escAttr(coll.href) + '</a>') +
          '</p>';
      } else {
        lane += '<div class="minted-lane__grid">';
        rows.forEach(function (r) {
          var tokenIdRaw = r['token.tokenId'] !== undefined ? r['token.tokenId'] : r.tokenId;
          var tokenId = parseInt(tokenIdRaw, 10);
          var balance = parseInt(r.balance || '0', 10) || 0;
          if (!Number.isFinite(tokenId) || balance <= 0) return;
          var img = imageFor(coll.slug, tokenId);
          var nm = nameFor(coll.slug, tokenId);
          lane += '<a class="minted-card" href="https://objkt.com/tokens/' + escAttr(coll.kt1) + '/' + tokenId + '" target="_blank" rel="noopener">' +
            '<div class="minted-card__art">' +
              (img ? '<img src="' + escAttr(img) + '" alt="' + escAttr(nm) + '" loading="lazy" />' : '<div class="minted-card__placeholder">№' + tokenId + '</div>') +
              '<span class="minted-card__balance mono">×' + balance + '</span>' +
            '</div>' +
            '<p class="minted-card__name">' + escHtml(nm) + '</p>' +
            '<p class="minted-card__meta mono">№' + tokenId + ' · objkt ↗</p>' +
          '</a>';
        });
        lane += '</div>';
      }
      lane += '</section>';
      html += lane;
    });

    lanes.innerHTML = html || '<p class="minted__empty mono">no PointCast tokens held yet</p>';
  }

  function tick() {
    var el = document.getElementById('minted-clock');
    if (!el) return;
    var n = new Date();
    el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ' PT';
  }

  function repaint() {
    var addr = readActiveAddress();
    if (addr) loadHoldings(addr, true);
    else loadHoldings(MIKE_FALLBACK, false);
  }

  repaint();
  tick();
  setInterval(tick, 60 * 1000);
  window.addEventListener('storage', function (e) { if (e.key === 'pc:wallet-active') repaint(); });
  window.addEventListener('pc:wallet-change', repaint);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="minted" id="minted-main"${addAttribute(JSON.stringify(COLLECTIONS.map((coll) => ({
    slug: coll.slug,
    name: coll.name,
    href: coll.href,
    kt1: coll.kt1,
    symbol: coll.symbol
  }))), "data-collections")}> <header class="minted__head"> <p class="minted__kicker">PROFILE · MINTED · POINTCAST · EL SEGUNDO</p> <h1 class="minted__title">What you hold on PointCast.</h1> <p class="minted__dek">
Live from tzkt — every PointCast FA2 token in your connected wallet,
        grouped by collection. If no wallet is connected, you'll see Mike's
        as a sample.
</p> <p class="minted__owner mono" id="minted-owner">checking wallet…</p> </header> <section class="minted__lanes" id="minted-lanes" aria-live="polite"> <p class="minted__loading mono">LOADING HOLDINGS…</p> </section> ${PENDING_LANES.length > 0 && renderTemplate`<section class="minted__pending"> <p class="minted__sub-kicker mono">ORIGINATING SOON · ${PENDING_LANES.length} collection${PENDING_LANES.length === 1 ? "" : "s"}</p> <ul class="minted__pending-list"> ${PENDING_LANES.map((p) => renderTemplate`<li class="minted__pending-row"> <a${addAttribute(p.href, "href")}> <span class="minted__pending-name">${p.name}</span> <span class="minted__pending-status mono">contract not yet originated · preview at <code>${p.href}</code></span> </a> </li>`)} </ul> </section>`} <nav class="minted__links" aria-label="Other surfaces"> <a class="minted__link" href="/coffee"><span class="minted__link-label mono">/COFFEE</span><span class="minted__link-desc">five mugs · pour to unlock</span></a> <a class="minted__link" href="/visit-nouns"><span class="minted__link-label mono">/VISIT-NOUNS</span><span class="minted__link-desc">noun-by-noun · one per visit</span></a> <a class="minted__link" href="/snapshots"><span class="minted__link-label mono">/SNAPSHOTS</span><span class="minted__link-desc">three painted interiors</span></a> <a class="minted__link" href="/market"><span class="minted__link-label mono">/MARKET</span><span class="minted__link-desc">trade every PointCast FA2</span></a> </nav> <footer class="minted__foot mono"> <span>on air · el segundo · live · cc0</span> <span id="minted-clock">—</span> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/minted.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/minted.astro";
const $$url = "/minted";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Minted,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
