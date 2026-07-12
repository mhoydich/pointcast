import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { a as renderTemplate, r as renderComponent, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { $ as $$DrumNav } from './DrumNav_D5cUUl3f.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$DrumWalkie = createComponent(($$result, $$props, $$slots) => {
  const title = "/drum-walkie — push-to-talk channels";
  const description = "Walkie-talkie for the drum hub. Four channels, hold to talk, 100-char bursts. Pure transient — leave the page and your channel's history goes with you.";
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", "@id": "https://pointcast.xyz/drum-walkie", name: "PointCast Drum · Walkie", url: "https://pointcast.xyz/drum-walkie", description };
  const CHANNELS = [
    { id: "general", label: "GENERAL", color: "#5fbafd", note: "general chatter" },
    { id: "drums", label: "DRUMS", color: "#ff5c23", note: "room coordination" },
    { id: "calm", label: "CALM", color: "#8ec78a", note: "quiet check-ins" },
    { id: "loud", label: "LOUD", color: "#ffd400", note: "hype mode" }
  ];
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  var COLORS = { general: '#5fbafd', drums: '#ff5c23', calm: '#8ec78a', loud: '#ffd400' };
  var ptt = document.getElementById('wk-ptt');
  var input = document.getElementById('wk-input');
  var count = document.getElementById('wk-count');
  var feed = document.getElementById('wk-feed');
  var tuned = document.getElementById('wk-tuned');
  var band = document.getElementById('wk-band');
  var meta = document.getElementById('wk-meta');
  var currentChannel = 'general';
  var holding = false;

  function getSession() { try { var k='pc:session'; var s=localStorage.getItem(k); if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,s);} return s;} catch(e){ return 'wk-' + Math.random().toString(36).slice(2,10);} }
  function nounIdFor(sid) { var h=5381; for(var i=0;i<sid.length;i++) h=(h*33+sid.charCodeAt(i))&0x7fffffff; return h%1200; }
  var sid = getSession();
  var storedNoun = 0;
  try { var s = localStorage.getItem('pc:nounId'); storedNoun = s ? Number(s) : nounIdFor(sid); } catch(e){ storedNoun = nounIdFor(sid); }
  if (!Number.isFinite(storedNoun) || storedNoun < 0 || storedNoun > 1199) storedNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(storedNoun)); } catch(e){}

  // Apply channel colors
  document.querySelectorAll('.wk__chan').forEach(function(b){
    var c = b.getAttribute('data-color'); if (c) b.style.setProperty('--wk-color', c);
    b.addEventListener('click', function(){
      document.querySelectorAll('.wk__chan').forEach(function(x){ x.classList.remove('wk__chan--on'); });
      b.classList.add('wk__chan--on');
      currentChannel = b.getAttribute('data-channel') || 'general';
      tuned.textContent = currentChannel.toUpperCase();
      // Reset feed for the new channel
      feed.innerHTML = '<li class="wk__feed-empty mono">— no bursts yet on this channel —</li>';
      band.textContent = '— silent —';
      meta.textContent = 'noun #—';
    });
  });

  function startTalk(e) {
    if (holding) return;
    holding = true;
    ptt.classList.add('wk__ptt--down');
    input.disabled = false;
    input.focus();
    if (e) e.preventDefault();
  }
  function endTalk(e) {
    if (!holding) return;
    holding = false;
    ptt.classList.remove('wk__ptt--down');
    var text = (input.value || '').trim().slice(0, 100);
    input.value = ''; count.textContent = '0 / 100';
    input.disabled = true;
    if (text) sendBurst(text);
    if (e) e.preventDefault();
  }
  input.addEventListener('input', function(){ count.textContent = input.value.length + ' / 100'; });

  function sendBurst(text) {
    var payload = { type: 'walkie', sessionId: sid, channel: currentChannel, text: text, nounId: storedNoun };
    try {
      fetch('/api/sounds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch(e){}
    // Optimistic local render so the speaker sees their own burst land
    addBurst({ t: Date.now(), text: text, channel: currentChannel, nounId: storedNoun, _self: true });
  }

  function addBurst(b) {
    if (b.channel !== currentChannel) return;
    var emptyEl = feed.querySelector('.wk__feed-empty');
    if (emptyEl) emptyEl.remove();
    var color = COLORS[b.channel] || COLORS.general;
    var li = document.createElement('li');
    li.className = 'wk__feed-row' + (b._self ? ' wk__feed-row--self' : '');
    li.style.setProperty('--wk-row-color', color);
    var d = new Date(b.t || Date.now());
    var stamp = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
    li.innerHTML =
      '<span class="wk__feed-time mono"></span>' +
      '<img class="wk__feed-noun" alt="" width="22" height="22" loading="lazy" />' +
      '<span class="wk__feed-pid mono"></span>' +
      '<span class="wk__feed-text"></span>';
    li.querySelector('.wk__feed-time').textContent = stamp;
    li.querySelector('.wk__feed-noun').src = 'https://noun.pics/' + (b.nounId || 0) + '.svg';
    li.querySelector('.wk__feed-pid').textContent = 'noun #' + (b.nounId || '—');
    li.querySelector('.wk__feed-text').textContent = b.text || '';
    feed.prepend(li);
    var rows = feed.querySelectorAll('.wk__feed-row');
    if (rows.length > 12) for (var i = 12; i < rows.length; i++) rows[i].remove();
    band.textContent = b.text || '';
    meta.textContent = 'noun #' + (b.nounId || '—') + ' · ' + b.channel.toUpperCase();
  }

  // Mouse / touch on PTT
  ptt.addEventListener('mousedown', startTalk);
  ptt.addEventListener('touchstart', startTalk, { passive: false });
  window.addEventListener('mouseup', endTalk);
  window.addEventListener('touchend', endTalk);
  // Spacebar everywhere except inside the input itself (where space is text)
  window.addEventListener('keydown', function(e){
    if (e.repeat) return;
    if (e.code === 'Space' && document.activeElement !== input) startTalk(e);
  });
  window.addEventListener('keyup', function(e){
    if (e.code === 'Space' && document.activeElement !== input) endTalk(e);
  });

  // Poll for incoming bursts on the tuned channel
  var lastTs = Date.now() - 5000;
  var lastSendAt = 0;
  function poll() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' }).then(function(r){
      if (!r.ok) return null;
      return r.json();
    }).then(function(data){
      if (!data) return;
      var events = Array.isArray(data.events) ? data.events : [];
      if (!events.length) return;
      lastTs = events[events.length - 1].t || Date.now();
      events.forEach(function(e){
        if (e.type !== 'walkie' || !e.text) return;
        if (e.channel !== currentChannel) return;
        // Skip own optimistic echoes (timestamp window)
        if (Math.abs((e.t || 0) - lastSendAt) < 800) return;
        addBurst({ t: e.t, text: e.text, channel: e.channel, nounId: e.nounId });
      });
    }).catch(function(){});
  }
  setInterval(poll, 1500);
  poll();

  // Track lastSendAt by intercepting sendBurst echo through fetch
  var origSend = sendBurst;
  sendBurst = function(text) { lastSendAt = Date.now(); origSend(text); };
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-63xttl6t": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="wk" id="wk-main" data-astro-cid-63xttl6t> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "bulletin", "data-astro-cid-63xttl6t": true })} <header class="wk__head" data-astro-cid-63xttl6t> <p class="wk__kicker" data-astro-cid-63xttl6t>DRUM HUB · COMMS 6 · WALKIE · PUSH-TO-TALK · 4 CHANNELS</p> <h1 class="wk__title" data-astro-cid-63xttl6t><em data-astro-cid-63xttl6t>Pick a channel. Hold the button. Talk.</em></h1> <p class="wk__dek" data-astro-cid-63xttl6t>Four preset channels. Hold the button (mouse or spacebar) to start a burst, type your 100 chars, release to send. The room hears whatever's on their tuned channel. Bursts don't persist — leave the page and the history leaves with you.</p> </header> <section class="wk__rig" data-astro-cid-63xttl6t> <div class="wk__channels" role="radiogroup" aria-label="Channel" data-astro-cid-63xttl6t> ${CHANNELS.map((c, i) => renderTemplate`<button type="button"${addAttribute("wk__chan" + (i === 0 ? " wk__chan--on" : ""), "class")}${addAttribute(c.id, "data-channel")}${addAttribute(c.color, "data-color")}${addAttribute("Channel " + c.label, "aria-label")} data-astro-cid-63xttl6t> <span class="wk__chan-led" data-astro-cid-63xttl6t></span> <span class="wk__chan-label mono" data-astro-cid-63xttl6t>${c.label}</span> <span class="wk__chan-note mono" data-astro-cid-63xttl6t>${c.note}</span> </button>`)} </div> <div class="wk__panel" data-astro-cid-63xttl6t> <div class="wk__display" data-astro-cid-63xttl6t> <p class="wk__display-eyebrow mono" data-astro-cid-63xttl6t>★ TUNED · <span id="wk-tuned" data-astro-cid-63xttl6t>GENERAL</span> ★</p> <p class="wk__display-band mono" id="wk-band" data-astro-cid-63xttl6t>— silent —</p> <p class="wk__display-meta mono" id="wk-meta" data-astro-cid-63xttl6t>noun #—</p> </div> <div class="wk__controls" data-astro-cid-63xttl6t> <button type="button" class="wk__ptt" id="wk-ptt" aria-label="Push to talk" data-astro-cid-63xttl6t> <span class="wk__ptt-cap" data-astro-cid-63xttl6t> <span class="wk__ptt-icon" data-astro-cid-63xttl6t>📡</span> <span class="wk__ptt-text mono" data-astro-cid-63xttl6t>PUSH TO TALK</span> <span class="wk__ptt-kbd mono" data-astro-cid-63xttl6t>HOLD SPACE</span> </span> </button> <input class="wk__input" id="wk-input" maxlength="100" placeholder="Hold the button — start typing — release to send." disabled data-astro-cid-63xttl6t> <span class="wk__count mono" id="wk-count" data-astro-cid-63xttl6t>0 / 100</span> </div> </div> <ul class="wk__feed" id="wk-feed" aria-label="Recent bursts" data-astro-cid-63xttl6t> <li class="wk__feed-empty mono" data-astro-cid-63xttl6t>— no bursts yet on this channel —</li> </ul> </section> <footer class="wk__foot" data-astro-cid-63xttl6t> <p data-astro-cid-63xttl6t>Each burst fires <code data-astro-cid-63xttl6t>type=walkie</code> to <code data-astro-cid-63xttl6t>/api/sounds</code> with the channel and 100-char text. Cast surfaces (<a href="/drum-tv" data-astro-cid-63xttl6t>/drum-tv</a>, <a href="/drum-marquee" data-astro-cid-63xttl6t>/drum-marquee</a>) show all channels colored by id; this page filters to your tuned channel.</p> <p class="wk__credit mono" data-astro-cid-63xttl6t>v0.1 · 2026-04-28 · drum sprint · comms 6</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-walkie.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-walkie.astro";
const $$url = "/drum-walkie";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumWalkie,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
