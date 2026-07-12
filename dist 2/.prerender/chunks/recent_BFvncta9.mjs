import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Recent = createComponent(async ($$result, $$props, $$slots) => {
  const title = "/bath/recent — what the bath has been listening to";
  const description = "The public bath log — recent Spotify saves from anyone who tapped SAVE TO BATH at /bath. Updates live.";
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () {
  'use strict';

  var MOOD_DOT = {
    warm: '#F5A623', cool: '#4A9EFF', electric: '#FF00AA', earth: '#7B9E5E',
    void: '#8060C0', dawn: '#FFB4A2', neon: '#39FF14', ocean: '#00B4D8',
  };

  function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function escAttr(s) { return escHtml(s); }
  function shortAddr(a) { return (a && a.length > 12) ? (a.slice(0, 6) + '…' + a.slice(-4)) : (a || ''); }

  function renderCassette(s) {
    var dot = MOOD_DOT[s.mood] || '#888';
    var date = s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
    var type = (s.spotify_type || '').toUpperCase();
    var url = s.spotify_url || ('https://open.spotify.com/' + s.spotify_type + '/' + s.spotify_id);
    var eh = s.spotify_type === 'track' ? '80' : '152';
    var addrChip = s.address
      ? '<span class="brec-cassette__addr mono" title="' + escAttr(s.address) + '">' + escHtml(shortAddr(s.address)) + '</span>'
      : '<span class="brec-cassette__addr brec-cassette__addr--anon mono">anon</span>';
    return '<div class="brec-cassette">' +
      '<div class="brec-cassette__stripe" style="background:' + dot + ';box-shadow:0 0 12px ' + dot + '55"></div>' +
      '<div class="brec-cassette__body">' +
        '<iframe src="https://open.spotify.com/embed/' + escAttr(s.spotify_type) + '/' + escAttr(s.spotify_id) + '?utm_source=pointcast" ' +
          'width="100%" height="' + eh + '" frameborder="0" ' +
          'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>' +
        '<div class="brec-cassette__meta">' +
          '<span class="brec-cassette__type">' + type + '</span>' +
          '<span class="brec-cassette__mood">' + escHtml(s.mood || '—') + '</span>' +
          addrChip +
          '<span class="brec-cassette__date">' + escHtml(date) + '</span>' +
          '<a class="brec-cassette__open" href="' + escAttr(url) + '" target="_blank" rel="noopener">open ↗</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function load() {
    var grid = document.getElementById('brec-grid');
    var status = document.getElementById('brec-status');
    if (!grid) return;
    try {
      var r = await fetch('/api/bath', { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      var data = await r.json();
      if (!data || data.ok === false) {
        // Graceful KV-unbound empty
        var reason = data && data.reason || 'unknown';
        grid.innerHTML = '<div class="brec__empty">' +
          '<p class="brec__empty-head mono">THE BATH LOG GOES LIVE WHEN KV IS BOUND</p>' +
          '<p class="brec__empty-body">Provision <code>PC_BATH_KV</code> via <code>npx wrangler kv namespace create "PC_BATH_KV"</code> and the public feed lights up. Local saves on individual browsers still work — see <a href="/bath">/bath</a>. Reason: <code>' + escHtml(reason) + '</code></p>' +
          '</div>';
        if (status) status.textContent = 'kv unbound · feed not yet live';
        return;
      }
      var recent = (data.recent || []).filter(function (s) {
        return s && s.spotify_id && /^[A-Za-z0-9]{22}$/.test(s.spotify_id);
      });
      if (recent.length === 0) {
        grid.innerHTML = '<div class="brec__empty">' +
          '<p class="brec__empty-head mono">NO SAVES YET</p>' +
          '<p class="brec__empty-body">Be the first — visit <a href="/bath">/bath</a>, pick a mood, paste any Spotify link, hit SAVE TO BATH.</p>' +
          '</div>';
        if (status) status.textContent = '0 saves · cap 50';
        return;
      }
      grid.innerHTML = recent.map(renderCassette).join('');
      if (status) status.textContent = recent.length + ' save' + (recent.length === 1 ? '' : 's') + ' · live · cap 50';
    } catch (e) {
      var msg = (e && e.message) ? e.message : String(e);
      grid.innerHTML = '<p class="brec__empty mono">FETCH ERROR · ' + escHtml(msg) + '</p>';
      if (status) status.textContent = 'error';
    }
  }

  function tick() {
    var el = document.getElementById('brec-clock');
    if (!el) return;
    var n = new Date();
    el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') + ' PT';
  }

  load();
  tick();
  setInterval(tick, 60 * 1000);
  setInterval(load, 60 * 1000);
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="brec" id="brec-main"> <header class="brec__head"> <p class="brec__kicker">ROOM · BATH · RECENT · EL SEGUNDO</p> <h1 class="brec__title">The public bath log.</h1> <p class="brec__dek">
Recent Spotify links saved by anyone using <a href="/bath">/bath</a> —
        the room with eight color moods and a paste-a-link box. Cap 50.
        Mood-tagged. Wallet-tagged when a Tezos wallet was connected.
</p> <p class="brec__status mono" id="brec-status">loading…</p> </header> <section class="brec__grid" id="brec-grid" aria-live="polite"> <p class="brec__loading mono">FETCHING…</p> </section> <nav class="brec__links" aria-label="Other rooms"> <a class="brec__link" href="/bath"><span class="brec__link-label mono">/BATH</span><span class="brec__link-desc">eight moods · paste a Spotify link · save</span></a> <a class="brec__link" href="/anytime"><span class="brec__link-label mono">/ANYTIME</span><span class="brec__link-desc">George Harrison listening room</span></a> <a class="brec__link" href="/room"><span class="brec__link-label mono">/ROOM</span><span class="brec__link-desc">the mix room · 10 tracks · 1h 11m</span></a> <a class="brec__link" href="/"><span class="brec__link-label mono">/</span><span class="brec__link-desc">back to the broadcast</span></a> </nav> <footer class="brec__foot mono"> <span>on air · el segundo · live · cc0</span> <span id="brec-clock">—</span> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/bath/recent.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/bath/recent.astro";
const $$url = "/bath/recent";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Recent,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
