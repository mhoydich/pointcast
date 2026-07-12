import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, F as Fragment, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { f as findRace, d as deriveStatus } from './races_BtvB86Iy.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$FrontDoor = createComponent(async ($$result, $$props, $$slots) => {
  const race = findRace("front-door");
  const status = race ? deriveStatus(race) : "scheduled";
  const title = race ? `${race.title} · PointCast Race` : "Front Door · PointCast Race";
  const description = race?.description ?? "Today’s Front Door race on PointCast.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
  // Live-hydrate the leaderboard every 15s while the tab is open.
  // Endpoint is graceful-no-op when PC_RACE_KV is unbound; we surface
  // that explicitly in the status line.
  (function () {
    'use strict';
    var rowsEl   = document.getElementById('race-board-rows');
    var statusEl = document.getElementById('race-board-status');
    if (!rowsEl || !statusEl) return;

    function fmtScore(ms) {
      if (!isFinite(ms)) return '—';
      var s = ms / 1000;
      if (s < 1)  return Math.round(ms) + ' ms';
      if (s < 10) return s.toFixed(2) + ' s';
      return Math.round(s) + ' s';
    }

    function trimId(id) {
      if (!id) return '—';
      if (id.length <= 14) return id;
      return id.slice(0, 6) + '…' + id.slice(-4);
    }

    function render(data) {
      var entries = (data && Array.isArray(data.entries)) ? data.entries : [];
      var you = (data && data.you) || null;
      var count = (data && typeof data.count === 'number') ? data.count : entries.length;
      var reason = (data && data.reason) || '';

      if (reason === 'kv-unbound') {
        statusEl.textContent = 'WAITING FOR KV · ' + count + ' IN';
      } else if (entries.length === 0) {
        statusEl.textContent = 'NO ENTRIES YET · FIRST CLICK WINS';
      } else {
        statusEl.textContent = count + ' ENTRANTS';
      }

      if (entries.length === 0) {
        rowsEl.innerHTML = '<li class="race-row race-row--empty"><span class="race-row__rank mono">—</span><span class="race-row__entrant mono">No entries yet. Go click a block.</span></li>';
        return;
      }

      var html = entries.map(function (e) {
        var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) {
          return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
        }); };
        var isYou = you && you.entrantId === e.entrantId;
        return '<li class="race-row' + (isYou ? ' race-row--you' : '') + '">' +
          '<span class="race-row__rank mono">#' + e.rank + '</span>' +
          '<span class="race-row__entrant mono" title="' + esc(e.entrantId) + '">' + esc(trimId(e.entrantId)) + (isYou ? ' · you' : '') + '</span>' +
          '<span class="race-row__kind mono">' + esc(e.entrantKind) + '</span>' +
          '<span class="race-row__score mono">' + esc(fmtScore(e.score)) + '</span>' +
          '</li>';
      }).join('');

      // Append "you" row if the viewer is in the pool but not in the
      // top-N (i.e. ranked past the displayed limit).
      if (you && !entries.some(function (e) { return e.entrantId === you.entrantId; })) {
        html += '<li class="race-row race-row--you race-row--elsewhere">' +
          '<span class="race-row__rank mono">#' + you.rank + '</span>' +
          '<span class="race-row__entrant mono">' + trimId(you.entrantId) + ' · you</span>' +
          '<span class="race-row__kind mono">' + you.entrantKind + '</span>' +
          '<span class="race-row__score mono">' + fmtScore(you.score) + '</span>' +
          '</li>';
      }

      rowsEl.innerHTML = html;
    }

    function getEntrantId() {
      try {
        var active = localStorage.getItem('pc:wallet-active');
        if (active) return active;
        return localStorage.getItem('pc:room:sid') || '';
      } catch (e) { return ''; }
    }

    async function refresh() {
      try {
        var q = '';
        var id = getEntrantId();
        if (id) q = '?entrantId=' + encodeURIComponent(id) + '&limit=10';
        else    q = '?limit=10';
        var res = await fetch('/api/race/front-door/leaderboard' + q, { cache: 'no-store' });
        if (!res.ok) { statusEl.textContent = 'OFFLINE · retry in 15s'; return; }
        var data = await res.json();
        render(data);
      } catch (e) {
        statusEl.textContent = 'OFFLINE · retry in 15s';
      }
    }

    refresh();
    setInterval(refresh, 15_000);
  })();
<\/script>`])), renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "data-astro-cid-bdzsipxq": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="race-page" data-slug="front-door" data-astro-cid-bdzsipxq> <header class="race-head" data-astro-cid-bdzsipxq> <p class="race-head__kicker mono" data-astro-cid-bdzsipxq>POINTCAST · RACE · FRONT DOOR</p> ${race ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-bdzsipxq": true }, { "default": async ($$result3) => renderTemplate` <h1 class="race-head__title" data-astro-cid-bdzsipxq>${race.title}</h1> <p class="race-head__dek" data-astro-cid-bdzsipxq>${race.description}</p> <dl class="race-head__meta" data-astro-cid-bdzsipxq> <div class="race-head__meta-row" data-astro-cid-bdzsipxq> <dt class="mono" data-astro-cid-bdzsipxq>STATUS</dt> <dd class="race-head__status mono"${addAttribute(status, "data-status")} data-astro-cid-bdzsipxq>${status.toUpperCase()}</dd> </div> <div class="race-head__meta-row" data-astro-cid-bdzsipxq> <dt class="mono" data-astro-cid-bdzsipxq>OPENS</dt> <dd data-astro-cid-bdzsipxq><time${addAttribute(race.opensAt, "datetime")} data-astro-cid-bdzsipxq>${new Date(race.opensAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</time></dd> </div> <div class="race-head__meta-row" data-astro-cid-bdzsipxq> <dt class="mono" data-astro-cid-bdzsipxq>CLOSES</dt> <dd data-astro-cid-bdzsipxq><time${addAttribute(race.closesAt, "datetime")} id="race-closes-at" data-astro-cid-bdzsipxq>${new Date(race.closesAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</time></dd> </div> <div class="race-head__meta-row" data-astro-cid-bdzsipxq> <dt class="mono" data-astro-cid-bdzsipxq>MODE</dt> <dd data-astro-cid-bdzsipxq>${race.mode} — lowest score wins</dd> </div> ${race.prize && renderTemplate`<div class="race-head__meta-row" data-astro-cid-bdzsipxq> <dt class="mono" data-astro-cid-bdzsipxq>PRIZE</dt> <dd data-astro-cid-bdzsipxq>${race.prize}</dd> </div>`} </dl> ` })}` : renderTemplate`<p class="race-head__missing" data-astro-cid-bdzsipxq>No race registered.</p>`} </header> <section class="race-how mono" aria-label="How to enter" data-astro-cid-bdzsipxq> <p class="race-how__label" data-astro-cid-bdzsipxq>HOW TO ENTER</p> <ol class="race-how__steps" data-astro-cid-bdzsipxq> <li data-astro-cid-bdzsipxq>Open <a href="/" data-astro-cid-bdzsipxq>the home</a>.</li> <li data-astro-cid-bdzsipxq>Click any block card. Your time is measured from page load to that click.</li> <li data-astro-cid-bdzsipxq>Your score + rank appear in the <strong data-astro-cid-bdzsipxq>RACE chip</strong> in the masthead.</li> </ol> <p class="race-how__fine" data-astro-cid-bdzsipxq>
One entry per session (per browser). If the server KV isn’t bound yet, submissions show
<code data-astro-cid-bdzsipxq>stored: false</code> — that’s Mike’s last provisioning step. Scoring is lowest-ms-wins.
</p> </section> <section class="race-board" aria-labelledby="race-board-title" id="race-board" data-astro-cid-bdzsipxq> <header class="race-board__head" data-astro-cid-bdzsipxq> <h2 id="race-board-title" class="race-board__title" data-astro-cid-bdzsipxq>Leaderboard</h2> <p class="race-board__status mono" id="race-board-status" data-astro-cid-bdzsipxq>LOADING…</p> </header> <ol class="race-board__rows" id="race-board-rows" data-astro-cid-bdzsipxq> <li class="race-row race-row--empty" data-astro-cid-bdzsipxq> <span class="race-row__rank mono" data-astro-cid-bdzsipxq>—</span> <span class="race-row__entrant mono" data-astro-cid-bdzsipxq>(waiting for the board)</span> </li> </ol> </section> <footer class="race-foot mono" data-astro-cid-bdzsipxq> <a href="/api/race/front-door/leaderboard" data-astro-cid-bdzsipxq>leaderboard json</a> <span data-astro-cid-bdzsipxq>·</span> <a href="/scoreboard" data-astro-cid-bdzsipxq>scoreboard</a> <span data-astro-cid-bdzsipxq>·</span> <a href="/wire" data-astro-cid-bdzsipxq>wire</a> <span data-astro-cid-bdzsipxq>·</span> <a href="/" data-astro-cid-bdzsipxq>home</a> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/race/front-door.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/race/front-door.astro";
const $$url = "/race/front-door";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$FrontDoor,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
