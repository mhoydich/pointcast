import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$RoomPresenceChip = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$RoomPresenceChip;
  const { surface } = Astro2.props;
  return renderTemplate(_a || (_a = __template(["", '<aside class="rpc"', ' data-astro-cid-6oebmqhy> <span class="rpc__label mono" data-astro-cid-6oebmqhy>★ ROOM · ', `</span> <span class="rpc__sep" aria-hidden="true" data-astro-cid-6oebmqhy>·</span> <span class="rpc__count mono" data-astro-cid-6oebmqhy><strong id="rpc-count" data-astro-cid-6oebmqhy>—</strong> here</span> <ul class="rpc__avatars" id="rpc-avatars" role="list" aria-live="polite" aria-atomic="false" data-astro-cid-6oebmqhy></ul> <span class="rpc__hint mono" id="rpc-hint" data-astro-cid-6oebmqhy>opening room…</span> </aside> <script>
  (function () {
    var countEl = document.getElementById('rpc-count');
    var avatarsEl = document.getElementById('rpc-avatars');
    var hintEl = document.getElementById('rpc-hint');
    if (!countEl || !avatarsEl) return;

    // Self-register so the visitor counts as present too. Otherwise
    // the chip says "0 here" while the visitor is staring at their
    // own page — the worst kind of empty room.
    var sid = '';
    try { sid = localStorage.getItem('pc:sid') || ''; } catch (e) {}
    if (!sid) {
      sid = (Math.random().toString(36).slice(2) + Date.now().toString(36));
      try { localStorage.setItem('pc:sid', sid); } catch (e) {}
    }

    function selfRegister() {
      try {
        fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, room: 'drum' }),
        }).catch(function () {});
      } catch (e) {}
    }
    selfRegister();
    // Re-register every 30s so we don't drop off the roster.
    setInterval(selfRegister, 30_000);

    function tick() {
      fetch('/api/visit', { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          var present = Array.isArray(data.present) ? data.present : [];
          var humans = present.filter(function (p) { return p && p.pid; });
          // Active count from various API shape variants
          var n = data.activeCount || data.active || data.count || humans.length || 0;
          countEl.textContent = String(n);
          // Render up to 6 mini-noun avatars
          var slice = humans.slice(0, 6);
          var html = slice.map(function (p) {
            var nounId = (p.nounId | 0) || 1;
            var label = p.tag || ('noun ' + nounId);
            return '<li class="rpc__av" title="' + label + '">' +
                   '<img src="https://noun.pics/' + nounId + '.svg" alt="" width="22" height="22" loading="lazy" />' +
                   '</li>';
          }).join('');
          if (humans.length > 6) {
            html += '<li class="rpc__more mono">+' + (humans.length - 6) + '</li>';
          }
          avatarsEl.innerHTML = html;
          if (hintEl) {
            if (n <= 1) hintEl.textContent = 'just you so far · share the link →';
            else if (n === 2) hintEl.textContent = 'you + 1 other · tap together';
            else hintEl.textContent = n + ' in the room · live';
          }
        }).catch(function () {});
    }
    tick();
    setInterval(tick, 10_000);
  })();
<\/script>`])), maybeRenderHead(), addAttribute(`Who's in the ${surface} room`, "aria-label"), surface.toUpperCase());
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/components/RoomPresenceChip.astro", void 0);

export { $$RoomPresenceChip as $ };
