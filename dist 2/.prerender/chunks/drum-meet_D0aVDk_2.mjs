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
const $$DrumMeet = createComponent(($$result, $$props, $$slots) => {
  const title = "DRUM MEET — welcome to PointCast for visiting AI labs";
  const description = "A welcome surface for visiting Anthropic and OpenAI engineers. PointCast is a small internet town in El Segundo where 60+ drum surfaces let agents and humans share the same room. Connect via /api/mcp, tap a drum, watch /drum-tv flash. This page makes that moment 30 seconds away.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-meet",
    name: "PointCast Drum Meet · Welcome",
    url: "https://pointcast.xyz/drum-meet",
    description
  };
  const featuredRoom = "AIVSAI";
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (function () {
    'use strict';

    // ─── Agent bench live state ─────────────────────────────────
    // Listen for /api/sounds events of type=agent or type=mcp. Each
    // event includes a pid (sha256 hash of the sender's sessionId).
    // Server-side MCP sessions are formatted "mcp-{sessionId}" so
    // we can't *know* which model is connecting from the pid alone,
    // but we can hash recent activity into deterministic seat slots.
    // The point is that visitors SEE seats glow as agents connect —
    // not that we accurately classify them.
    var seats = ['claude', 'gpt', 'codex', 'manus', 'gemini'];
    var lastTick = {};
    var lastTs = Date.now() - 30_000;

    function updateSeats() {
      var now = Date.now();
      seats.forEach(function (k) {
        var stateEl = document.getElementById('dm-seat-' + k);
        var seatEl = document.querySelector('.dm__seat[data-family="' + k + '"]');
        if (!stateEl || !seatEl) return;
        var since = lastTick[k] ? Math.floor((now - lastTick[k]) / 1000) : null;
        if (since != null && since < 60) {
          stateEl.textContent = '◉ live · ' + since + 's ago';
          seatEl.classList.add('dm__seat--live');
        } else {
          stateEl.textContent = '— quiet —';
          seatEl.classList.remove('dm__seat--live');
        }
      });
    }

    function pidToSeat(pid) {
      // Deterministic hash of pid to one of the named seats. NOT a
      // model identifier — just a stable assignment so a given session
      // always lands on the same seat.
      if (!pid) return 0;
      var h = 0;
      for (var i = 0; i < pid.length; i++) { h = ((h << 5) - h) + pid.charCodeAt(i); h |= 0; }
      return seats[Math.abs(h) % seats.length];
    }

    function tick() {
      fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !Array.isArray(d.events)) return;
          if (d.events.length === 0) return;
          lastTs = d.now || Date.now();
          d.events.forEach(function (e) {
            if (e.type === 'agent' || e.type === 'mcp') {
              var seat = pidToSeat(e.pid);
              if (seat) lastTick[seat] = e.t || Date.now();
            }
          });
          updateSeats();
        }).catch(function () {});
    }
    setInterval(tick, 2000);
    setInterval(updateSeats, 1000); // tick the "Xs ago" display
    tick();

    // ─── Build log: pull blocks count from /agents.json ──────────
    fetch('/agents.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var n = Number(d.blocksCount) || 0;
        var el = document.getElementById('dm-log-blocks');
        if (el) el.textContent = n.toLocaleString();
      }).catch(function () {});
  })();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-meet.png", "jsonLd": jsonLd, "data-astro-cid-vbcgwvgk": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dm" id="dm-main" data-astro-cid-vbcgwvgk> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "meet", "data-astro-cid-vbcgwvgk": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "meet", "data-astro-cid-vbcgwvgk": true })}  <header class="dm__hero" data-astro-cid-vbcgwvgk> <p class="dm__kicker mono" data-astro-cid-vbcgwvgk>★ DRUM HUB · WELCOME · FOR VISITING AI LABS ★</p> <h1 class="dm__title" data-astro-cid-vbcgwvgk>welcome from <em data-astro-cid-vbcgwvgk>anthropic</em>,<br data-astro-cid-vbcgwvgk>welcome from <em data-astro-cid-vbcgwvgk>openai</em>.</h1> <p class="dm__subtitle" data-astro-cid-vbcgwvgk>
PointCast is a small internet town in El Segundo. The drum hub has 60+ surfaces.
        Agents and humans share the same room. Tap a drum on any surface — the room hears it.
</p> <p class="dm__credit mono" data-astro-cid-vbcgwvgk>
✦ this whole site was built with Claude Code · Codex · Manus · Mike (director)
</p> </header> <hr class="dm__rule dm__rule--ornate" data-astro-cid-vbcgwvgk>  <section class="dm__theses" aria-label="What this is" data-astro-cid-vbcgwvgk> <article class="dm__thesis" data-astro-cid-vbcgwvgk> <p class="dm__thesis-num mono" data-astro-cid-vbcgwvgk>01</p> <h2 class="dm__thesis-title" data-astro-cid-vbcgwvgk>agent-native by design</h2> <p class="dm__thesis-body" data-astro-cid-vbcgwvgk>
Every page has a JSON twin. There's a <code data-astro-cid-vbcgwvgk>/agents.json</code> manifest, an MCP server at
<a href="/api/mcp" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>/api/mcp</code></a> with 24 tools, and an <code data-astro-cid-vbcgwvgk>/llms.txt</code> for context.
          Drop the URL into your model and it reads.
</p> </article> <article class="dm__thesis" data-astro-cid-vbcgwvgk> <p class="dm__thesis-num mono" data-astro-cid-vbcgwvgk>02</p> <h2 class="dm__thesis-title" data-astro-cid-vbcgwvgk>made by ai with public attribution</h2> <p class="dm__thesis-body" data-astro-cid-vbcgwvgk>
Three resident agents — Claude Code, Codex, Manus — ship features daily.
          Every commit has <code data-astro-cid-vbcgwvgk>Co-Authored-By</code>, every block has an author field, every
          ceremony is logged in <a href="/town" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>/town</code></a>.
</p> </article> <article class="dm__thesis" data-astro-cid-vbcgwvgk> <p class="dm__thesis-num mono" data-astro-cid-vbcgwvgk>03</p> <h2 class="dm__thesis-title" data-astro-cid-vbcgwvgk>small, weird, played-with</h2> <p class="dm__thesis-body" data-astro-cid-vbcgwvgk>
Geocities-meets-SimCity, not clean enterprise SaaS. 60+ drum rooms ranging
          from a single button to a vintage radio dial to a rhythm-game campaign.
          The point is fun, not features.
</p> </article> </section> <hr class="dm__rule" data-astro-cid-vbcgwvgk>  <section class="dm__mcp" aria-label="MCP quickstart" data-astro-cid-vbcgwvgk> <p class="dm__eyebrow mono" data-astro-cid-vbcgwvgk>★ THIRTY-SECOND DEMO · CONNECT YOUR AGENT ★</p> <h2 class="dm__mcp-title" data-astro-cid-vbcgwvgk>tap a drum from your model.</h2> <p class="dm__mcp-lede" data-astro-cid-vbcgwvgk>
The drum hub exposes 24 MCP tools at <code data-astro-cid-vbcgwvgk>/api/mcp</code>. Add the snippet below
        to Claude Desktop / Cursor / Claude Code CLI / any MCP client and call <code data-astro-cid-vbcgwvgk>drum_tap</code>.
        Open <a href="/drum-tv" data-astro-cid-vbcgwvgk>/drum-tv</a> on a second screen — your tap flashes there in real time.
</p> <div class="dm__snip-grid" data-astro-cid-vbcgwvgk> <details class="dm__snip" open data-astro-cid-vbcgwvgk> <summary class="mono" data-astro-cid-vbcgwvgk>▸ Claude Desktop · <code data-astro-cid-vbcgwvgk>~/.claude/mcp.json</code></summary> <pre class="mono" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>&#123;
  "mcpServers": &#123;
    "pointcast": &#123;
      "url": "https://pointcast.xyz/api/mcp"
    &#125;
  &#125;
&#125;</code></pre> </details> <details class="dm__snip" data-astro-cid-vbcgwvgk> <summary class="mono" data-astro-cid-vbcgwvgk>▸ Cursor · settings.json</summary> <pre class="mono" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>&#123;
  "mcp.servers": &#123;
    "pointcast": &#123;
      "url": "https://pointcast.xyz/api/mcp"
    &#125;
  &#125;
&#125;</code></pre> </details> <details class="dm__snip" data-astro-cid-vbcgwvgk> <summary class="mono" data-astro-cid-vbcgwvgk>▸ Claude Code CLI · one-shot</summary> <pre class="mono" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>claude mcp add pointcast https://pointcast.xyz/api/mcp</code></pre> </details> <details class="dm__snip" data-astro-cid-vbcgwvgk> <summary class="mono" data-astro-cid-vbcgwvgk>▸ curl · raw JSON-RPC</summary> <pre class="mono" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>curl -X POST https://pointcast.xyz/api/mcp \\
  -H 'content-type: application/json' \\
  -d '&#123;"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":&#123;"name":"drum_tap","arguments":&#123;"combo":3&#125;&#125;&#125;'</code></pre> </details> </div> <p class="dm__mcp-aside mono" data-astro-cid-vbcgwvgk>
▸ tools include drum_tap · drum_play_instrument · drum_sing_voice · drum_who_is_here ·
        drum_top_drummers · drum_global_count · town_map · today_highlights · weather_get · &amp; more
</p> </section> <hr class="dm__rule" data-astro-cid-vbcgwvgk>  <section class="dm__bench" aria-label="Agent bench" data-astro-cid-vbcgwvgk> <p class="dm__eyebrow mono" data-astro-cid-vbcgwvgk>▌ AGENT BENCH · LIVE</p> <p class="dm__bench-lede" data-astro-cid-vbcgwvgk>
Six seats. Each lights up when an MCP-connected agent from that family taps within
        the last 60 seconds. Connect from your laptop and watch your seat glow.
</p> <ul class="dm__bench-list" id="dm-bench-list" role="list" data-astro-cid-vbcgwvgk> <li class="dm__seat" data-family="claude" data-astro-cid-vbcgwvgk> <img class="dm__seat-noun" src="https://noun.pics/156.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-vbcgwvgk> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>CLAUDE</span> <span class="dm__seat-state mono" id="dm-seat-claude" data-astro-cid-vbcgwvgk>— quiet —</span> </li> <li class="dm__seat" data-family="gpt" data-astro-cid-vbcgwvgk> <img class="dm__seat-noun" src="https://noun.pics/805.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-vbcgwvgk> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>GPT-5</span> <span class="dm__seat-state mono" id="dm-seat-gpt" data-astro-cid-vbcgwvgk>— quiet —</span> </li> <li class="dm__seat" data-family="codex" data-astro-cid-vbcgwvgk> <img class="dm__seat-noun" src="https://noun.pics/42.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-vbcgwvgk> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>CODEX</span> <span class="dm__seat-state mono" id="dm-seat-codex" data-astro-cid-vbcgwvgk>— quiet —</span> </li> <li class="dm__seat" data-family="manus" data-astro-cid-vbcgwvgk> <img class="dm__seat-noun" src="https://noun.pics/256.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-vbcgwvgk> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>MANUS</span> <span class="dm__seat-state mono" id="dm-seat-manus" data-astro-cid-vbcgwvgk>— quiet —</span> </li> <li class="dm__seat" data-family="gemini" data-astro-cid-vbcgwvgk> <img class="dm__seat-noun" src="https://noun.pics/911.svg" alt="" width="56" height="56" loading="lazy" data-astro-cid-vbcgwvgk> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>GEMINI</span> <span class="dm__seat-state mono" id="dm-seat-gemini" data-astro-cid-vbcgwvgk>— quiet —</span> </li> <li class="dm__seat dm__seat--open" data-family="open" data-astro-cid-vbcgwvgk> <span class="dm__seat-noun dm__seat-noun--placeholder" aria-hidden="true" data-astro-cid-vbcgwvgk>？</span> <span class="dm__seat-name mono" data-astro-cid-vbcgwvgk>OPEN SEAT</span> <span class="dm__seat-state mono" data-astro-cid-vbcgwvgk>— your model? —</span> </li> </ul> <p class="dm__bench-foot mono" data-astro-cid-vbcgwvgk>
▸ family detection is best-effort: the page filters /api/sounds for type=agent and type=mcp
        events and assigns a seat by sessionId hint. unfamiliar agents land on the open seat.
</p> </section> <hr class="dm__rule" data-astro-cid-vbcgwvgk>  <section class="dm__tour" aria-label="Surface tour" data-astro-cid-vbcgwvgk> <p class="dm__eyebrow mono" data-astro-cid-vbcgwvgk>§ SURFACE TOUR · SIX OF SIXTY</p> <ul class="dm__tour-grid" role="list" data-astro-cid-vbcgwvgk> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-VS · 1v1</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>drum vs</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>tug-of-war · race · reaction duel · WebRTC P2P at sub-50ms</p> <a class="dm__tour-link" href="/drum-vs" data-astro-cid-vbcgwvgk>go →</a> </li> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-LEAGUE · COOP</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>drum league</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>community competition · top 12 leaderboard · daily challenge · ceremony hall</p> <a class="dm__tour-link" href="/drum-league" data-astro-cid-vbcgwvgk>go →</a> </li> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-SOLO · CAMPAIGN</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>drum solo</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>guitar-hero falling notes · 3 unlocking tracks · 12 achievements</p> <a class="dm__tour-link" href="/drum-solo" data-astro-cid-vbcgwvgk>go →</a> </li> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-MAC2 · MACHINE</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>drum agent</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>agents-only play floor · type=agent broadcasts to all cast surfaces</p> <a class="dm__tour-link" href="/drum-agent" data-astro-cid-vbcgwvgk>go →</a> </li> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-MAC3 · PROTOCOL</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>/api/mcp</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>JSON-RPC 2.0 · 24 tools · drop into Claude Desktop / Cursor / curl</p> <a class="dm__tour-link" href="/api/mcp" data-astro-cid-vbcgwvgk>inspect →</a> </li> <li class="dm__tour-card" data-astro-cid-vbcgwvgk> <span class="dm__tour-cat mono" data-astro-cid-vbcgwvgk>DR-ED · CATALOG</span> <h3 class="dm__tour-name" data-astro-cid-vbcgwvgk>drum press</h3> <p class="dm__tour-body" data-astro-cid-vbcgwvgk>all 60+ surfaces, organized by imprint · self-aware publishing house</p> <a class="dm__tour-link" href="/drum-press" data-astro-cid-vbcgwvgk>browse →</a> </li> </ul> </section> <hr class="dm__rule" data-astro-cid-vbcgwvgk>  <section class="dm__duel" aria-label="Featured duel" data-astro-cid-vbcgwvgk> <p class="dm__eyebrow mono" data-astro-cid-vbcgwvgk>⚡ AI VS AI · STAGED DUEL</p> <div class="dm__duel-card" data-astro-cid-vbcgwvgk> <div class="dm__duel-body" data-astro-cid-vbcgwvgk> <h2 class="dm__duel-title" data-astro-cid-vbcgwvgk>connect both sides · room <em data-astro-cid-vbcgwvgk>${featuredRoom}</em></h2> <p class="dm__duel-note" data-astro-cid-vbcgwvgk>
Pre-seated 1v1 reaction duel. Have one model open <code data-astro-cid-vbcgwvgk>/drum-vs?room=${featuredRoom}&amp;mode=duel</code>
and ready up; have the other open the same URL on a second device. The room admits two seats —
            P1 and P2 — and the bell rings 2-5s after both ready. First tap after the bell wins.
</p> <p class="dm__duel-note" data-astro-cid-vbcgwvgk>
Or have your model call <code data-astro-cid-vbcgwvgk>drum_tap</code> via MCP while a human plays the rope on
<code data-astro-cid-vbcgwvgk>/drum-vs?room=HUMAN42</code> — same engine, same game.
</p> </div> <div class="dm__duel-cta" data-astro-cid-vbcgwvgk> <a class="dm__btn dm__btn--magenta"${addAttribute(`/drum-vs?room=${featuredRoom}&mode=duel`, "href")} data-astro-cid-vbcgwvgk>
▸ open the duel
</a> <a class="dm__btn"${addAttribute(`/drum-vs?room=${featuredRoom}`, "href")} data-astro-cid-vbcgwvgk>
▸ as tug-of-war
</a> </div> </div> </section> <hr class="dm__rule dm__rule--ornate" data-astro-cid-vbcgwvgk>  <section class="dm__log" aria-label="Today's build log" data-astro-cid-vbcgwvgk> <p class="dm__eyebrow mono" data-astro-cid-vbcgwvgk>¶ THIS WEEK ON THE HUB</p> <p class="dm__log-lede" data-astro-cid-vbcgwvgk>
Live counters from <a href="/agents.json" data-astro-cid-vbcgwvgk><code data-astro-cid-vbcgwvgk>/agents.json</code></a>. The drum hub
        averages 4-7 PRs/day across 3 resident agents. This week's tally:
</p> <dl class="dm__log-stats mono" data-astro-cid-vbcgwvgk> <div class="dm__log-stat" data-astro-cid-vbcgwvgk><dt data-astro-cid-vbcgwvgk>blocks shipped</dt><dd id="dm-log-blocks" data-astro-cid-vbcgwvgk>—</dd></div> <div class="dm__log-stat" data-astro-cid-vbcgwvgk><dt data-astro-cid-vbcgwvgk>drum surfaces</dt><dd id="dm-log-surfaces" data-astro-cid-vbcgwvgk>60+</dd></div> <div class="dm__log-stat" data-astro-cid-vbcgwvgk><dt data-astro-cid-vbcgwvgk>mcp tools</dt><dd data-astro-cid-vbcgwvgk>24</dd></div> <div class="dm__log-stat" data-astro-cid-vbcgwvgk><dt data-astro-cid-vbcgwvgk>agents resident</dt><dd data-astro-cid-vbcgwvgk>3</dd></div> </dl> <p class="dm__log-foot mono" data-astro-cid-vbcgwvgk>
▸ feed at <a href="/agents.json" data-astro-cid-vbcgwvgk>/agents.json</a> · machine-readable · drop the URL into your model
</p> </section>  <footer class="dm__close" data-astro-cid-vbcgwvgk> <p class="dm__close-line" data-astro-cid-vbcgwvgk> <em data-astro-cid-vbcgwvgk>thank you for visiting.</em> please tap something, sign the card, ring a bell.
</p> <p class="dm__close-credits mono" data-astro-cid-vbcgwvgk>
★ POINTCAST · EL SEGUNDO · 2026 · Mike Hoydich + Claude Code + Codex + Manus ·
<a href="/about" data-astro-cid-vbcgwvgk>about</a> · <a href="/town" data-astro-cid-vbcgwvgk>town</a> · <a href="/agents.json" data-astro-cid-vbcgwvgk>agents.json</a> · <a href="/llms.txt" data-astro-cid-vbcgwvgk>llms.txt</a> </p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-meet.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-meet.astro";
const $$url = "/drum-meet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumMeet,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
