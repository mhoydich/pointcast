import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';
import { $ as $$RoomPresenceChip } from './RoomPresenceChip_Dur7KbDI.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumLeague = createComponent(($$result, $$props, $$slots) => {
  const title = "Drum League — community competition for the drum hub";
  const description = "Every tap on any /drum-* surface ticks a single shared community counter. Climb the weekly leaderboard, jump into today's featured duel, see who else is in the room. Cooperative-with-a-leaderboard.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/drum-league",
    name: "PointCast Drum League",
    url: "https://pointcast.xyz/drum-league",
    description,
    applicationCategory: "GameApplication"
  };
  const today = /* @__PURE__ */ new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
  const ROOM_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function dailyRoomId(seedStr) {
    let h = 5381;
    for (let i = 0; i < seedStr.length; i++) h = (h << 5) + h + seedStr.charCodeAt(i) >>> 0;
    let s = "";
    for (let i = 0; i < 6; i++) {
      s += ROOM_ALPHA[h & 31];
      h = h >>> 5 | h << 27;
    }
    return s;
  }
  const featuredRoomId = dailyRoomId("league-" + yyyymmdd);
  const challenges = [
    { glyph: "🥁", text: "Tap on /drum (the original) and watch /drum-tv flash on a second screen. The classic everyone goes to." },
    { glyph: "🎂", text: "Light all the candles on /drum-cake — then come back and blow them out with someone." },
    { glyph: "💌", text: "Sign the /drum-card. Your noun joins the room's collective signature page." },
    { glyph: "🪅", text: "Take a swing on /drum-pinata. Help the room hit 100 — the burst is shared." },
    { glyph: "⚡", text: "Pick a friend, send them a /drum-vs link. Race to 50. First taps land sub-50ms once both phones are in." },
    { glyph: "🔔", text: "Try /drum-vs?mode=duel — bell rings random 2-5s, first tap after wins. Don't false-start." },
    { glyph: "🎺", text: "Visit /drum-v4 (orchestra). Tap a kick, a snare, a hihat. Cast surfaces flash on every note." },
    { glyph: "📻", text: "Open /drum-radio on a TV. Every tap from every room lands as a beat on 96.1 fm." },
    { glyph: "✉️", text: "Leave a note on /drum-letters. The next visitor gets your message. Past notes wait their turn." },
    { glyph: "🤖", text: "Connect a Claude/Cursor MCP client to /api/mcp and have your agent join the room. /drum-agent shows them in real time." },
    { glyph: "☕", text: "Tap on /kettle, then /drum, then /drum-pulse. The whole site is one slow-pulsing room." },
    { glyph: "✨", text: "Open /drum-press and pick a title you haven't played yet. There are 54 of them." },
    { glyph: "🌙", text: "Stay quiet. Open /drum-bulletin. Read what the room pinned. Pin one thing back." },
    { glyph: "🎯", text: "Beat the daily target. We're aiming for 50,000 taps this week — every contribution counts." }
  ];
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 864e5);
  const todayChallenge = challenges[dayOfYear % challenges.length];
  function weekLabel(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  }
  function shortDate(d) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function startOfWeek(d) {
    const out = new Date(d);
    const day = out.getDay() || 7;
    out.setDate(out.getDate() - (day - 1));
    return out;
  }
  function endOfWeek(d) {
    const s = startOfWeek(d);
    s.setDate(s.getDate() + 6);
    return s;
  }
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekStartLabel = shortDate(weekStart);
  const weekEndLabel = shortDate(weekEnd);
  const weekIso = weekLabel(today);
  const WEEKLY_TARGET = 5e4;
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ── Identity (sessionId → noun) ─────────────────────────────────
    function getSid() {
      try {
        var s = localStorage.getItem('pc:sid');
        if (s) return s;
        s = (Math.random().toString(36).slice(2) + Date.now().toString(36));
        localStorage.setItem('pc:sid', s);
        return s;
      } catch (e) { return 'anon-' + Date.now(); }
    }
    function nounIdFromString(s) {
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return Math.abs(h) % 1200;
    }
    var sid = getSid();
    var myNoun = nounIdFromString(sid);

    // Render YOUR card immediately (rest fetches async).
    var yoursNounEl = document.getElementById('dl-yours-noun');
    var yoursNounIdEl = document.getElementById('dl-yours-noun-id');
    if (yoursNounEl) {
      yoursNounEl.src = 'https://noun.pics/' + myNoun + '.svg';
      yoursNounEl.alt = 'Your Noun ' + myNoun;
      yoursNounEl.style.imageRendering = 'pixelated';
    }
    if (yoursNounIdEl) yoursNounIdEl.textContent = String(myNoun);

    // ── Tally: poll /api/drum?sessionId= for {globalTotal, yourTotal} ──
    function fmtNum(n) {
      try { return n.toLocaleString(); } catch (e) { return String(n); }
    }
    var tallyNumEl = document.getElementById('dl-tally-num');
    var tallyFillEl = document.getElementById('dl-tally-fill');
    var tallyHintEl = document.getElementById('dl-tally-hint');
    var yoursCountEl = document.getElementById('dl-yours-count');
    var yoursRankEl = document.getElementById('dl-yours-rank');
    var WEEKLY_TARGET = 50000;

    function pollTally() {
      fetch('/api/drum?sessionId=' + encodeURIComponent(sid), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          var total = Number(d.globalTotal) || 0;
          var yours = Number(d.yourTotal) || 0;
          if (tallyNumEl) tallyNumEl.textContent = fmtNum(total);
          var pct = Math.min(100, (total / WEEKLY_TARGET) * 100);
          if (tallyFillEl) tallyFillEl.style.width = pct + '%';
          if (tallyHintEl) {
            tallyHintEl.textContent = pct >= 100
              ? '🎉 weekly target hit · the league did it · keep going'
              : Math.round(pct) + '% to ' + fmtNum(WEEKLY_TARGET) + ' · the more we tap, the closer we get';
          }
          if (yoursCountEl) yoursCountEl.textContent = fmtNum(yours);
        }).catch(function () {});
    }
    pollTally();
    setInterval(pollTally, 4000);

    // ── Top 12 leaderboard ──────────────────────────────────────────
    var topListEl = document.getElementById('dl-top-list');
    function pollTop() {
      fetch('/api/drum/top', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          var entries = Array.isArray(d.entries) ? d.entries : [];
          if (!entries.length) {
            if (topListEl) topListEl.innerHTML = '<li class="dl__top-empty mono">— no taps yet · be the first —</li>';
            return;
          }
          // Build rows for top 12
          var rows = entries.slice(0, 12).map(function (e, i) {
            var rank = e.rank || (i + 1);
            var nid = (e.nounId | 0) || 1;
            var count = Number(e.count) || 0;
            var hash = (e.hash || '').slice(0, 8);
            var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            return '<li class="dl__top-row" data-rank="' + rank + '">' +
                   '<span class="dl__top-rank mono">' + (rank < 10 ? '0' + rank : rank) + '</span>' +
                   '<span class="dl__top-medal" aria-hidden="true">' + medal + '</span>' +
                   '<img class="dl__top-noun" src="https://noun.pics/' + nid + '.svg" alt="" width="40" height="40" loading="lazy" />' +
                   '<span class="dl__top-name">noun ' + nid + '</span>' +
                   '<span class="dl__top-hash mono">' + hash + '</span>' +
                   '<span class="dl__top-count mono">' + fmtNum(count) + '</span>' +
                   '</li>';
          }).join('');
          if (topListEl) topListEl.innerHTML = rows;

          // Compute your rank by hash match if possible
          if (yoursRankEl) {
            // sessionId hash isn't exposed client-side but server stores
            // it. Best approximation: match by nounId. If multiple match
            // we just show the best rank.
            var matched = entries.filter(function (e) { return e.nounId === myNoun; });
            if (matched.length === 0) {
              yoursRankEl.textContent = '— not on the leaderboard yet · keep tapping —';
            } else {
              var best = matched.reduce(function (m, e) {
                return (m.rank || 9999) <= (e.rank || 9999) ? m : e;
              });
              yoursRankEl.textContent = best.rank
                ? '★ rank #' + best.rank + ' · ' + fmtNum(best.count) + ' taps'
                : '— ranked outside top — ';
            }
          }
        }).catch(function () {});
    }
    pollTop();
    setInterval(pollTop, 8000);

    // ── Live pulse — /api/sounds firehose ───────────────────────────
    var pulseListEl = document.getElementById('dl-pulse-list');
    var lastPulseTs = Date.now() - 30000;
    var pulseSeen = {};
    function fmtTime(t) {
      var d = new Date(t || Date.now());
      var p = function (n) { return String(n).padStart(2, '0'); };
      return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
    function pulseRow(e) {
      var key = (e.t || 0) + ':' + (e.pid || '') + ':' + (e.type || '');
      if (pulseSeen[key]) return null;
      pulseSeen[key] = 1;
      // Map pid (server-derived hash, opaque) to a noun id
      var nid = nounIdFromString(e.pid || 'anon');
      var li = document.createElement('li');
      li.className = 'dl__pulse-row mono';
      li.innerHTML =
        '<span class="dl__pulse-time">' + fmtTime(e.t) + '</span>' +
        '<img class="dl__pulse-noun" src="https://noun.pics/' + nid + '.svg" alt="" width="22" height="22" loading="lazy" />' +
        '<span class="dl__pulse-type">[' + (e.type || 'tap') + ']</span>' +
        '<span class="dl__pulse-pid">noun ' + nid + '</span>';
      return li;
    }
    function pollPulse() {
      fetch('/api/sounds?since=' + lastPulseTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.events)) return;
          if (d.events.length === 0) return;
          lastPulseTs = d.now || Date.now();
          // Clear empty placeholder
          var empty = pulseListEl ? pulseListEl.querySelector('.dl__pulse-empty') : null;
          if (empty) empty.remove();
          var added = 0;
          d.events.forEach(function (e) {
            var li = pulseRow(e);
            if (li && pulseListEl) {
              pulseListEl.prepend(li);
              added++;
            }
          });
          if (pulseListEl) {
            // Trim to last 12 rows
            var rows = pulseListEl.querySelectorAll('.dl__pulse-row');
            for (var i = 12; i < rows.length; i++) rows[i].remove();
          }
        }).catch(function () {});
    }
    pollPulse();
    setInterval(pollPulse, 1500);
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum.png", "jsonLd": jsonLd, "data-astro-cid-hq7vt7rq": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dl" id="dl-main" data-astro-cid-hq7vt7rq> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "league", "data-astro-cid-hq7vt7rq": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "league", "data-astro-cid-hq7vt7rq": true })} <header class="dl__masthead" data-astro-cid-hq7vt7rq> <p class="dl__kicker mono" data-astro-cid-hq7vt7rq>★ DRUM HUB · COMMUNITY LEAGUE · ALL OF US TOGETHER ★</p> <h1 class="dl__title" data-astro-cid-hq7vt7rq>drum <em data-astro-cid-hq7vt7rq>league</em></h1> <p class="dl__strap mono" data-astro-cid-hq7vt7rq>
week of ${weekStartLabel} — ${weekEndLabel} · ${weekIso} </p> <p class="dl__dek" data-astro-cid-hq7vt7rq>
Every tap on every /drum-* surface ticks the same community counter.
        Climb the leaderboard, jump into today's featured duel, see who's
        in the pulse — your noun is in the credits no matter where you finish.
</p> </header> <hr class="dl__rule dl__rule--ornate" data-astro-cid-hq7vt7rq>  <section class="dl__tally" aria-label="This week's tally" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>▌ THIS WEEK'S TALLY</p> <div class="dl__tally-card" data-astro-cid-hq7vt7rq> <div class="dl__tally-num" data-astro-cid-hq7vt7rq> <strong id="dl-tally-num" aria-live="polite" data-astro-cid-hq7vt7rq>—</strong> <span class="dl__tally-of mono" data-astro-cid-hq7vt7rq>of ${WEEKLY_TARGET.toLocaleString()}</span> </div> <div class="dl__tally-bar" aria-hidden="true" data-astro-cid-hq7vt7rq> <div class="dl__tally-fill" id="dl-tally-fill" data-astro-cid-hq7vt7rq></div> </div> <p class="dl__tally-hint mono" id="dl-tally-hint" data-astro-cid-hq7vt7rq>— loading global drum count —</p> </div> </section>  <section class="dl__featured" aria-label="Today's featured duel" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>⚡ TODAY'S FEATURED DUEL</p> <div class="dl__featured-card" data-astro-cid-hq7vt7rq> <div class="dl__featured-body" data-astro-cid-hq7vt7rq> <h2 class="dl__featured-title" data-astro-cid-hq7vt7rq>join room <em data-astro-cid-hq7vt7rq>${featuredRoomId}</em></h2> <p class="dl__featured-note" data-astro-cid-hq7vt7rq>
Everyone landing on this page today shares the same featured-duel room id.
            First two visitors get the seats; the rest watch (or open a fresh duel of their own).
            Resets at midnight PT.
</p> </div> <div class="dl__featured-cta" data-astro-cid-hq7vt7rq> <a class="dl__btn dl__btn--magenta"${addAttribute(`/drum-vs?room=${featuredRoomId}`, "href")} data-astro-cid-hq7vt7rq>
▸ join the duel
<span class="dl__btn-sub mono" data-astro-cid-hq7vt7rq>tug-of-war · first to 50</span> </a> <a class="dl__btn"${addAttribute(`/drum-vs?room=${featuredRoomId}&mode=duel`, "href")} data-astro-cid-hq7vt7rq>
▸ as a reaction duel
<span class="dl__btn-sub mono" data-astro-cid-hq7vt7rq>bell · first tap wins</span> </a> </div> </div> </section> <hr class="dl__rule" data-astro-cid-hq7vt7rq>  <section class="dl__pulse" aria-label="Live pulse" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>◉ LIVE PULSE · LAST 30 SECONDS</p> <ul class="dl__pulse-list" id="dl-pulse-list" role="list" data-astro-cid-hq7vt7rq> <li class="dl__pulse-empty mono" data-astro-cid-hq7vt7rq>— stream open · waiting for the first tap —</li> </ul> </section>  <section class="dl__top" aria-label="Top contributors" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>★ TOP 12 CONTRIBUTORS · ALL-TIME</p> <ol class="dl__top-list" id="dl-top-list" role="list" data-astro-cid-hq7vt7rq> <li class="dl__top-empty mono" data-astro-cid-hq7vt7rq>— loading leaderboard —</li> </ol> <p class="dl__top-foot mono" data-astro-cid-hq7vt7rq>
anonymized to noun id · counts are stable per browser session ·
        names are nobody's business here
</p> </section> <hr class="dl__rule" data-astro-cid-hq7vt7rq>  <section class="dl__yours" aria-label="Your lane" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>☞ YOUR LANE</p> <div class="dl__yours-card" data-astro-cid-hq7vt7rq> <div class="dl__yours-noun-wrap" data-astro-cid-hq7vt7rq> <img class="dl__yours-noun" id="dl-yours-noun" src="" alt="" width="96" height="96" data-astro-cid-hq7vt7rq> </div> <div class="dl__yours-body" data-astro-cid-hq7vt7rq> <p class="dl__yours-tag mono" data-astro-cid-hq7vt7rq>YOU · NOUN <strong id="dl-yours-noun-id" data-astro-cid-hq7vt7rq>—</strong></p> <p class="dl__yours-stat" data-astro-cid-hq7vt7rq> <strong id="dl-yours-count" aria-live="polite" data-astro-cid-hq7vt7rq>—</strong> <span class="dl__yours-of mono" data-astro-cid-hq7vt7rq>taps so far</span> </p> <p class="dl__yours-rank mono" id="dl-yours-rank" data-astro-cid-hq7vt7rq>— calculating rank —</p> </div> </div> </section>  <section class="dl__challenge" aria-label="Today's challenge" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>❡ TODAY'S CHALLENGE</p> <div class="dl__challenge-card" data-astro-cid-hq7vt7rq> <span class="dl__challenge-glyph" aria-hidden="true" data-astro-cid-hq7vt7rq>${todayChallenge.glyph}</span> <p class="dl__challenge-text" data-astro-cid-hq7vt7rq>${todayChallenge.text}</p> </div> </section> <hr class="dl__rule dl__rule--ornate" data-astro-cid-hq7vt7rq>  <section class="dl__ceremony" aria-label="Ceremony hall" data-astro-cid-hq7vt7rq> <p class="dl__eyebrow mono" data-astro-cid-hq7vt7rq>※ CEREMONY HALL</p> <p class="dl__ceremony-body" data-astro-cid-hq7vt7rq>
Sundays at 5pm PT, the top three contributors get a portrait card on the
        masthead and a permanent block in the Drum Press. The League is young —
        the first ceremony is coming. Until then, this hall is quiet.
</p> <p class="dl__ceremony-note mono" data-astro-cid-hq7vt7rq>
※ first ceremony scheduled for the first Sunday after launch ·
        check back · or simply keep playing
</p> </section>  <footer class="dl__foot" data-astro-cid-hq7vt7rq> <p class="mono" data-astro-cid-hq7vt7rq>
DRUM LEAGUE · v0.1 · 2026-04-30 · pointcast.xyz/drum-league ·
        cooperative + leaderboarded · every tap counts ·
<a href="/drum-press" data-astro-cid-hq7vt7rq>all 54 titles in print →</a> </p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-league.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-league.astro";
const $$url = "/drum-league";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumLeague,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
