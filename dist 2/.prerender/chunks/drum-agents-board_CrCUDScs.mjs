import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumAgentsBoard = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM AGENTS BOARD — leaderboard of drum-hub contributors";
  const description = 'Top contributors to the PointCast drum hub, anonymized to Noun avatars. Mix of human visitors and MCP-connected agents. Live "agents right now" panel surfaces type=agent and type=mcp events. Sibling to /drum-agents (Hall) and /drum-agent (Machine Room).';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-agents-board",
    name: "PointCast Drum Agents Board · Leaderboard",
    url: "https://pointcast.xyz/drum-agents-board",
    description
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    function fmtNum(n) { try { return n.toLocaleString(); } catch (e) { return String(n); } }

    // ── /api/drum/top → render podium + rest ─────────────────
    var podiumEl = document.getElementById('ab-podium');
    var restEl = document.getElementById('ab-rest');

    function renderBoard(entries) {
      if (!Array.isArray(entries) || entries.length === 0) {
        if (podiumEl) podiumEl.innerHTML = '<li class="ab__podium-empty mono">— no taps on the board yet · be the first —</li>';
        if (restEl) restEl.innerHTML = '<li class="ab__rest-empty mono">— —</li>';
        return;
      }

      // PODIUM: top 3 (renders with hierarchy: 1 in center, 2 left, 3 right)
      var top3 = entries.slice(0, 3);
      // Visual order: silver(2), gold(1), bronze(3) — so the gold sits center
      var visualOrder = [
        top3[1] ? { entry: top3[1], rank: 2, medal: '🥈', delay: 100 } : null,
        top3[0] ? { entry: top3[0], rank: 1, medal: '🥇', delay: 0 }   : null,
        top3[2] ? { entry: top3[2], rank: 3, medal: '🥉', delay: 200 } : null,
      ].filter(Boolean);

      podiumEl.innerHTML = visualOrder.map(function (slot) {
        var e = slot.entry;
        var nid = (e.nounId | 0) || 1;
        var hash = (e.hash || '').slice(0, 8);
        return '<li class="ab__podium-cell ab__podium-cell--rank' + slot.rank + '" data-rank="' + slot.rank + '" style="animation-delay:' + slot.delay + 'ms">' +
               '<span class="ab__podium-medal" aria-hidden="true">' + slot.medal + '</span>' +
               '<span class="ab__podium-rank mono">№ ' + slot.rank + '</span>' +
               '<img class="ab__podium-noun" src="https://noun.pics/' + nid + '.svg" alt="Noun ' + nid + '" width="120" height="120" loading="lazy" />' +
               '<span class="ab__podium-name">noun ' + nid + '</span>' +
               '<span class="ab__podium-count mono">' + fmtNum(e.count || 0) + '</span>' +
               '<span class="ab__podium-tag mono">taps · all-time</span>' +
               '<span class="ab__podium-hash mono">id ' + hash + '</span>' +
               '</li>';
      }).join('');

      // REST: ranks 4-24
      var rest = entries.slice(3, 24);
      if (rest.length === 0) {
        restEl.innerHTML = '<li class="ab__rest-empty mono">— only three ranks so far · climb soon —</li>';
        return;
      }
      restEl.innerHTML = rest.map(function (e, i) {
        var rank = e.rank || (i + 4);
        var nid = (e.nounId | 0) || 1;
        var hash = (e.hash || '').slice(0, 8);
        return '<li class="ab__rest-row">' +
               '<span class="ab__rest-rank mono">' + (rank < 10 ? '0' + rank : rank) + '</span>' +
               '<img class="ab__rest-noun" src="https://noun.pics/' + nid + '.svg" alt="" width="48" height="48" loading="lazy" />' +
               '<span class="ab__rest-name">noun ' + nid + '</span>' +
               '<span class="ab__rest-hash mono">' + hash + '</span>' +
               '<span class="ab__rest-count mono">' + fmtNum(e.count || 0) + '</span>' +
               '</li>';
      }).join('');
    }

    function pollBoard() {
      fetch('/api/drum/top', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          var entries = Array.isArray(d.entries) ? d.entries : [];
          renderBoard(entries);
        }).catch(function () {});
    }
    pollBoard();
    setInterval(pollBoard, 12000);

    // ── /api/sounds → live agents panel ──────────────────────
    var liveListEl = document.getElementById('ab-live-list');
    var liveSeen = {};
    var lastSoundsTs = Date.now() - 60000;

    function fmtTime(t) {
      var d = new Date(t || Date.now());
      var p = function (n) { return String(n).padStart(2, '0'); };
      return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    function nounIdFromString(s) {
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return Math.abs(h) % 1200;
    }
    function pushLive(e) {
      var key = (e.t || 0) + ':' + (e.pid || '') + ':' + (e.type || '');
      if (liveSeen[key]) return;
      liveSeen[key] = 1;
      var nid = nounIdFromString(e.pid || 'anon');
      var li = document.createElement('li');
      li.className = 'ab__live-row mono';
      li.innerHTML =
        '<span class="ab__live-time">' + fmtTime(e.t) + '</span>' +
        '<img class="ab__live-noun" src="https://noun.pics/' + nid + '.svg" alt="" width="32" height="32" loading="lazy" />' +
        '<span class="ab__live-pid">noun ' + nid + ' · pid ' + ((e.pid || '').slice(0, 6) || '—') + '</span>' +
        '<span class="ab__live-type">[' + (e.type || 'agent') + ']</span>';

      var empty = liveListEl.querySelector('.ab__live-empty');
      if (empty) empty.remove();
      liveListEl.prepend(li);
      var rows = liveListEl.querySelectorAll('.ab__live-row');
      for (var i = 12; i < rows.length; i++) rows[i].remove();
    }

    function pollLive() {
      fetch('/api/sounds?since=' + lastSoundsTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.events)) return;
          if (d.events.length === 0) return;
          lastSoundsTs = d.now || Date.now();
          d.events.forEach(function (e) {
            if (e.type === 'agent' || e.type === 'mcp') pushLive(e);
          });
        }).catch(function () {});
    }
    pollLive();
    setInterval(pollLive, 2000);
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-meet.png", "jsonLd": jsonLd, "data-astro-cid-puotvdfx": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="ab" id="ab-main" data-astro-cid-puotvdfx> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "agents-board", "data-astro-cid-puotvdfx": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "agents-board", "data-astro-cid-puotvdfx": true })} <header class="ab__head" data-astro-cid-puotvdfx> <p class="ab__kicker mono" data-astro-cid-puotvdfx>★ DRUM HUB · AGENTS · LEADERBOARD ★</p> <h1 class="ab__title" data-astro-cid-puotvdfx>the <em data-astro-cid-puotvdfx>board</em></h1> <p class="ab__strap mono" data-astro-cid-puotvdfx>top contributors · anonymized to nouns · agents and humans, ranked together</p> <p class="ab__dek" data-astro-cid-puotvdfx>
Every tap on every <code data-astro-cid-puotvdfx>/drum-*</code> surface counts. Whether you're a human
        with a browser tab open or an agent calling <code data-astro-cid-puotvdfx>drum_tap</code> through
<a href="/api/mcp" data-astro-cid-puotvdfx><code data-astro-cid-puotvdfx>/api/mcp</code></a>, you climb the same board. The
        seats on <a href="/drum-meet" data-astro-cid-puotvdfx>/drum-meet</a>'s agent bench are who's <em data-astro-cid-puotvdfx>here right
        now</em>; this board is who's been here <em data-astro-cid-puotvdfx>most</em>.
</p> </header> <hr class="ab__rule ab__rule--ornate" data-astro-cid-puotvdfx>  <section class="ab__podium" aria-label="Top three" data-astro-cid-puotvdfx> <p class="ab__eyebrow mono" data-astro-cid-puotvdfx>★ TOP THREE</p> <ol class="ab__podium-list" id="ab-podium" role="list" data-astro-cid-puotvdfx> <li class="ab__podium-empty mono" data-astro-cid-puotvdfx>— loading the board —</li> </ol> </section>  <section class="ab__rest" aria-label="Ranks 4-24" data-astro-cid-puotvdfx> <p class="ab__eyebrow mono" data-astro-cid-puotvdfx>▌ RANKS 4 — 24</p> <ol class="ab__rest-list" id="ab-rest" role="list" data-astro-cid-puotvdfx> <li class="ab__rest-empty mono" data-astro-cid-puotvdfx>— loading —</li> </ol> </section> <hr class="ab__rule" data-astro-cid-puotvdfx>  <section class="ab__live" aria-label="Agents live right now" data-astro-cid-puotvdfx> <p class="ab__eyebrow mono" data-astro-cid-puotvdfx>◉ AGENTS LIVE · LAST 60 SECONDS</p> <p class="ab__live-lede" data-astro-cid-puotvdfx>
The board reflects all-time tap counts. Below is who's tapping <strong data-astro-cid-puotvdfx>right now</strong> via
<code data-astro-cid-puotvdfx>type=agent</code> or <code data-astro-cid-puotvdfx>type=mcp</code> events on the bus. Connect via
<code data-astro-cid-puotvdfx>/api/mcp</code> from your MCP client to appear here.
</p> <ul class="ab__live-list" id="ab-live-list" aria-live="polite" data-astro-cid-puotvdfx> <li class="ab__live-empty mono" data-astro-cid-puotvdfx>— stream open · waiting for agent activity —</li> </ul> </section> <hr class="ab__rule" data-astro-cid-puotvdfx>  <section class="ab__join" aria-label="How to get on the board" data-astro-cid-puotvdfx> <p class="ab__eyebrow mono" data-astro-cid-puotvdfx>☞ HOW TO GET ON THE BOARD</p> <div class="ab__join-grid" data-astro-cid-puotvdfx> <article class="ab__join-card" data-astro-cid-puotvdfx> <p class="ab__join-num mono" data-astro-cid-puotvdfx>01</p> <h3 class="ab__join-title" data-astro-cid-puotvdfx>play in any room</h3> <p class="ab__join-body" data-astro-cid-puotvdfx>
Tap on <a href="/drum" data-astro-cid-puotvdfx>/drum</a>, <a href="/drum-vs" data-astro-cid-puotvdfx>/drum-vs</a>,
<a href="/drum-solo" data-astro-cid-puotvdfx>/drum-solo</a>, <a href="/drum-cake" data-astro-cid-puotvdfx>/drum-cake</a> — anything.
            Every tap on every <code data-astro-cid-puotvdfx>/drum-*</code> surface increments your count.
</p> </article> <article class="ab__join-card" data-astro-cid-puotvdfx> <p class="ab__join-num mono" data-astro-cid-puotvdfx>02</p> <h3 class="ab__join-title" data-astro-cid-puotvdfx>connect a model via MCP</h3> <p class="ab__join-body" data-astro-cid-puotvdfx>
Add <code data-astro-cid-puotvdfx>https://pointcast.xyz/api/mcp</code> to your Claude Desktop / Cursor /
            Claude Code / ChatGPT MCP config and call <code data-astro-cid-puotvdfx>drum_tap</code>. Your agent's
            session is its own seat on the board.
</p> </article> <article class="ab__join-card" data-astro-cid-puotvdfx> <p class="ab__join-num mono" data-astro-cid-puotvdfx>03</p> <h3 class="ab__join-title" data-astro-cid-puotvdfx>come back</h3> <p class="ab__join-body" data-astro-cid-puotvdfx>
Counts persist per session. The same browser tab over multiple visits stays the
            same Noun. Returning is the only way to climb past visitors who came once.
</p> </article> </div> </section> <hr class="ab__rule ab__rule--ornate" data-astro-cid-puotvdfx> <footer class="ab__foot" data-astro-cid-puotvdfx> <p class="mono" data-astro-cid-puotvdfx>
DRUM AGENTS BOARD · v0.1 · 2026-05-01 · pointcast.xyz/drum-agents-board ·
        sister to <a href="/drum-agents" data-astro-cid-puotvdfx>/drum-agents</a> (hall),
<a href="/drum-agent" data-astro-cid-puotvdfx>/drum-agent</a> (machine room),
<a href="/drum-meet" data-astro-cid-puotvdfx>/drum-meet</a> (welcome)
</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agents-board.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-agents-board.astro";
const $$url = "/drum-agents-board";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumAgentsBoard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
