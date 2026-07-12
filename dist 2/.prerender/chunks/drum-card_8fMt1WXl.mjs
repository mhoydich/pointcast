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
const $$DrumCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$DrumCard;
  const title = "/drum-card — sign the birthday card";
  const description = "A collaborative birthday card. Tap to sign — your Noun stamps onto the page. Customize it for someone with ?for=NAME&from=SENDER and share the signed link.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://pointcast.xyz/drum-card",
    name: "PointCast Drum · Birthday Card",
    url: "https://pointcast.xyz/drum-card",
    description
  };
  return renderTemplate(_a || (_a = __template(["", ` <script>
(function () { 'use strict';
  var GRID_COLS = 6;
  var GRID_ROWS = 4;
  var GRID_SLOTS = GRID_COLS * GRID_ROWS;
  var GRID_X0 = 560;
  var GRID_Y0 = 348;
  var GRID_DX = 64;
  var GRID_DY = 44;

  var qs = function(s){ return document.querySelector(s); };
  var stage = qs('#dcd-card');
  var sigGrid = document.getElementById('dcd-sig-grid');
  var stripEl = document.getElementById('dcd-strip');
  var noteEl = document.getElementById('dcd-note');
  var metaEl = document.getElementById('dcd-meta');
  var btn = document.getElementById('dcd-sign');
  var inFor = document.getElementById('dcd-for');
  var inFrom = document.getElementById('dcd-from');
  var inMsg = document.getElementById('dcd-msg');
  var svgFor = document.getElementById('dcd-svg-for');
  var svgFrom = document.getElementById('dcd-svg-from');
  var svgMsg = document.getElementById('dcd-svg-msg');
  var copyBtn = document.getElementById('dcd-copy');
  var tweetA = document.getElementById('dcd-tweet');
  var nativeBtn = document.getElementById('dcd-native');
  var urlEl = document.getElementById('dcd-url');

  function getSession() {
    try {
      var k='pc:session';
      var s=localStorage.getItem(k);
      if(!s){ s=Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem(k,s); }
      return s;
    } catch(e){ return 'dcd-' + Math.random().toString(36).slice(2,10); }
  }
  function hash32(s){ var h=5381; for(var i=0;i<s.length;i++) h=(h*33 + s.charCodeAt(i)) & 0x7fffffff; return h; }
  function nounIdFor(sid){ return hash32(sid) % 1200; }

  var sid = getSession();
  var myNoun = 0;
  try {
    var stored = localStorage.getItem('pc:nounId');
    myNoun = stored ? Number(stored) : nounIdFor(sid);
  } catch(e){ myNoun = nounIdFor(sid); }
  if (!Number.isFinite(myNoun) || myNoun < 0 || myNoun > 1199) myNoun = nounIdFor(sid);
  try { localStorage.setItem('pc:nounId', String(myNoun)); } catch(e){}

  var shortPid = '';
  try {
    if (window.crypto && crypto.subtle) {
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(sid)).then(function(buf){
        var arr = Array.from(new Uint8Array(buf)).slice(0, 4);
        shortPid = arr.map(function(b){ return b.toString(16).padStart(2,'0'); }).join('').slice(0, 8);
        renderNote();
      }).catch(function(){});
    }
  } catch(e){}

  function escapeHTML(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function softTrim(s, n){ s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

  function readParams() {
    var url = new URL(window.location.href);
    var forName = softTrim(url.searchParams.get('for') || 'friend', 40);
    var fromName = softTrim(url.searchParams.get('from') || 'the room', 40);
    var msg = '';
    var hash = window.location.hash || '';
    if (hash.indexOf('#m=') === 0) {
      try { msg = softTrim(decodeURIComponent(hash.slice(3)), 60); } catch(e){ msg = ''; }
    }
    return { for: forName, from: fromName, msg: msg };
  }

  function setSvgText(el, text){ if (el) el.textContent = text; }

  function renderCard(p) {
    setSvgText(svgFor, p.for);
    setSvgText(svgFrom, p.from);
    if (svgMsg) svgMsg.textContent = p.msg ? '"' + p.msg + '"' : '— a small note from the room —';
    inFor.value = (p.for === 'friend') ? '' : p.for;
    inFrom.value = (p.from === 'the room') ? '' : p.from;
    inMsg.value = p.msg || '';
    updateShareUrl(p);
    document.title = '/drum-card — happy birthday, ' + p.for;
  }

  function buildShareUrl(p) {
    var url = new URL(window.location.origin + '/drum-card');
    if (p.for && p.for !== 'friend') url.searchParams.set('for', p.for);
    if (p.from && p.from !== 'the room') url.searchParams.set('from', p.from);
    var s = url.toString();
    if (p.msg) s += '#m=' + encodeURIComponent(p.msg);
    return s;
  }

  function updateShareUrl(p) {
    var s = buildShareUrl(p);
    urlEl.textContent = s;
    var tweetText = 'happy birthday, ' + p.for + ' — sign the card on PointCast';
    tweetA.href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText) + '&url=' + encodeURIComponent(s);
    history.replaceState(null, '', s.replace(window.location.origin, ''));
  }

  // ---- signature grid ----
  var slotsUsed = 0;
  var slotColors = ['#c4351c','#c9982a','#3b6e3b','#13110d','#7a1a0c','#205d83'];

  function gridXY(i) {
    var col = i % GRID_COLS;
    var row = Math.floor(i / GRID_COLS) % GRID_ROWS;
    return { x: GRID_X0 + col * GRID_DX, y: GRID_Y0 + row * GRID_DY };
  }

  function marginXY(i) {
    var ringIdx = i - GRID_SLOTS;
    var ring = Math.floor(ringIdx / 28);
    var step = ringIdx % 28;
    var x, y;
    if (step < 7) { x = 540 + step * 60; y = 60 - ring * 10; }
    else if (step < 14) { x = 940 + ring * 8; y = 90 + (step - 7) * 60; }
    else if (step < 21) { x = 940 - (step - 14) * 60; y = 580 + ring * 10; }
    else { x = 540 - ring * 8; y = 580 - (step - 21) * 60; }
    if (x < 510) x = 510; if (x > 990) x = 990;
    if (y < 36) y = 36; if (y > 588) y = 588;
    return { x: x, y: y };
  }

  function placeSignature(seed, idx) {
    var pos = idx < GRID_SLOTS ? gridXY(idx) : marginXY(idx);
    var size = idx < GRID_SLOTS ? 26 : 16;
    var rot = ((hash32(String(seed) + '-rot') % 22) - 11);

    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', pos.x);
    ring.setAttribute('cy', pos.y);
    ring.setAttribute('r', size + 1);
    ring.setAttribute('fill', '#fffaf0');
    ring.setAttribute('stroke', slotColors[seed % slotColors.length]);
    ring.setAttribute('stroke-width', '1.4');
    sigGrid.appendChild(ring);

    var img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'https://noun.pics/' + (seed % 1200) + '.svg');
    img.setAttribute('href', 'https://noun.pics/' + (seed % 1200) + '.svg');
    img.setAttribute('x', pos.x - size);
    img.setAttribute('y', pos.y - size);
    img.setAttribute('width', size * 2);
    img.setAttribute('height', size * 2);
    img.setAttribute('clip-path', 'circle(' + size + 'px at ' + size + 'px ' + size + 'px)');
    img.setAttribute('transform', 'rotate(' + rot + ' ' + pos.x + ' ' + pos.y + ')');
    img.setAttribute('class', 'dcd__sig-noun');
    sigGrid.appendChild(img);

    slotsUsed += 1;
  }

  // ---- live strip ----
  function pushStrip(seed) {
    var emptyEl = stripEl.querySelector('.dcd__strip-empty');
    if (emptyEl) emptyEl.remove();
    var li = document.createElement('li');
    li.className = 'dcd__strip-cell';
    li.innerHTML = '<img class="dcd__strip-noun" src="https://noun.pics/' + (seed % 1200) + '.svg" alt="signature noun #' + (seed % 1200) + '" loading="lazy"/>';
    stripEl.prepend(li);
    var cells = stripEl.querySelectorAll('.dcd__strip-cell');
    if (cells.length > 8) for (var i = 8; i < cells.length; i++) cells[i].remove();
  }

  // ---- sound: pen scratch ----
  var ac = null;
  function ensureAC() {
    if (!ac) {
      try {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) ac = new Ctx();
      } catch(e){}
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function playScratch() {
    var ctx = ensureAC();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var buf = ctx.createBuffer(1, 4410, 22050);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < ch.length; i++) {
      var env = Math.exp(-i / 1500);
      ch[i] = (Math.random() * 2 - 1) * 0.35 * env;
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    var g = ctx.createGain(); g.gain.value = 0.18;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + 0.25);

    var osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 740;
    var og = ctx.createGain(); og.gain.value = 0; og.gain.linearRampToValueAtTime(0.04, t0 + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + 0.2);
  }

  // ---- self count + room count ----
  var myCount = 0;
  var roomCount = 0;
  function renderMeta() {
    metaEl.innerHTML = 'your signatures: <strong>' + myCount + '</strong> · room signatures: <strong>' + (roomCount || '—') + '</strong>';
  }
  function renderNote(extra) {
    var pid = shortPid || '—';
    noteEl.textContent = (extra || '— ready') + ' · noun #' + myNoun + ' · pid ' + pid;
  }

  // ---- sign action ----
  function fireSign() {
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
    myCount += 1;
    btn.classList.remove('dcd__cta--hit'); void btn.offsetWidth; btn.classList.add('dcd__cta--hit');
    placeSignature(myNoun, slotsUsed);
    pushStrip(myNoun);
    playScratch();
    renderMeta();
    renderNote('signed');

    fetch('/api/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sign', sessionId: sid, nounId: myNoun, note: 'card' })
    }).then(function(r){ return r.json(); }).then(function(data){
      if (data && data.ok) renderNote('transmitted'); else renderNote('local-only');
    }).catch(function(){ renderNote('offline'); });
  }

  btn.addEventListener('mousedown', function(e){ fireSign(); e.preventDefault(); });
  btn.addEventListener('touchstart', function(e){ fireSign(); e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', function(e){
    var t = e.target;
    var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return;
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') { fireSign(); e.preventDefault(); }
  });

  // ---- live tail ----
  var lastTs = Date.now() - 2000;
  function tail() {
    fetch('/api/sounds?since=' + lastTs, { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(data){
        if (!data) return;
        var events = Array.isArray(data.events) ? data.events : [];
        if (!events.length) return;
        lastTs = events[events.length - 1].t || Date.now();
        events.forEach(function(e){
          if (e.type !== 'sign') return;
          if (e.sessionId && e.sessionId === sid) return;
          if (Math.abs((e.t || 0) - Date.now()) < 4000 && e.pid === shortPid) return;
          var seed = (typeof e.nounId === 'number' && e.nounId >= 0 && e.nounId < 1200)
            ? e.nounId
            : hash32(String(e.sessionId || e.pid || Math.random())) % 1200;
          placeSignature(seed, slotsUsed);
          pushStrip(seed);
          roomCount += 1;
          renderMeta();
        });
      }).catch(function(){});
  }
  setInterval(tail, 2200); tail();

  // ---- inputs · update card live + URL ----
  function readInputs() {
    return {
      for: softTrim(inFor.value.trim() || 'friend', 40),
      from: softTrim(inFrom.value.trim() || 'the room', 40),
      msg: softTrim(inMsg.value.trim(), 60)
    };
  }
  function onChange() { var p = readInputs(); renderCard(p); }
  [inFor, inFrom, inMsg].forEach(function(el){
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
  });

  // ---- share buttons ----
  copyBtn.addEventListener('click', function(){
    var p = readInputs();
    var s = buildShareUrl(p);
    try {
      navigator.clipboard.writeText(s).then(function(){
        copyBtn.textContent = 'copied ✓';
        setTimeout(function(){ copyBtn.textContent = 'copy link'; }, 1400);
      });
    } catch(e){
      copyBtn.textContent = 'select & copy';
    }
  });
  nativeBtn.addEventListener('click', function(){
    var p = readInputs();
    var s = buildShareUrl(p);
    if (navigator.share) {
      navigator.share({ title: 'happy birthday, ' + p.for, text: 'sign the card', url: s }).catch(function(){});
    } else {
      copyBtn.click();
    }
  });

  // ---- init ----
  renderCard(readParams());
  renderMeta();
  renderNote();
})();
<\/script>`])), renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og-drum-card.png", "jsonLd": jsonLd, "data-astro-cid-b2f2xw3q": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="dcd" id="dcd-main" data-astro-cid-b2f2xw3q> ${renderComponent($$result2, "DrumNav", $$DrumNav, { "current": "card", "data-astro-cid-b2f2xw3q": true })} ${renderComponent($$result2, "RoomPresenceChip", $$RoomPresenceChip, { "surface": "card", "data-astro-cid-b2f2xw3q": true })} <header class="dcd__head" data-astro-cid-b2f2xw3q> <p class="dcd__kicker mono" data-astro-cid-b2f2xw3q>BIRTHDAY IMPRINT · TYPE=SIGN · COLLABORATIVE CARD</p> <h1 class="dcd__title" data-astro-cid-b2f2xw3q><em data-astro-cid-b2f2xw3q>Sign the card.</em></h1> <p class="dcd__dek" data-astro-cid-b2f2xw3q>A birthday card you can sign together. Each tap leaves your mark — a small Noun stamped into the page. Customize the greeting with <code data-astro-cid-b2f2xw3q>?for=NAME</code> and <code data-astro-cid-b2f2xw3q>?from=SENDER</code>, write a one-line message, share the signed link.</p> </header> <section class="dcd__stage" aria-label="Birthday card" data-astro-cid-b2f2xw3q> <div class="dcd__card" id="dcd-card" role="img" aria-label="Open birthday card" data-astro-cid-b2f2xw3q> <svg class="dcd__svg" viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-astro-cid-b2f2xw3q> <defs data-astro-cid-b2f2xw3q> <filter id="dcd-paper" x="0" y="0" width="100%" height="100%" data-astro-cid-b2f2xw3q> <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" data-astro-cid-b2f2xw3q></feTurbulence> <feColorMatrix values="0 0 0 0 0.96  0 0 0 0 0.93  0 0 0 0 0.85  0 0 0 0.04 0" data-astro-cid-b2f2xw3q></feColorMatrix> <feComposite in2="SourceGraphic" operator="in" data-astro-cid-b2f2xw3q></feComposite> </filter> <linearGradient id="dcd-fold" x1="0" x2="1" y1="0" y2="0" data-astro-cid-b2f2xw3q> <stop offset="0%" stop-color="rgba(0,0,0,0)" data-astro-cid-b2f2xw3q></stop> <stop offset="48%" stop-color="rgba(0,0,0,0.06)" data-astro-cid-b2f2xw3q></stop> <stop offset="50%" stop-color="rgba(0,0,0,0.18)" data-astro-cid-b2f2xw3q></stop> <stop offset="52%" stop-color="rgba(0,0,0,0.06)" data-astro-cid-b2f2xw3q></stop> <stop offset="100%" stop-color="rgba(0,0,0,0)" data-astro-cid-b2f2xw3q></stop> </linearGradient> <pattern id="dcd-dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse" data-astro-cid-b2f2xw3q> <circle cx="2" cy="2" r="0.7" fill="#c4351c" opacity="0.18" data-astro-cid-b2f2xw3q></circle> </pattern> </defs> <!-- card body / paper --> <rect x="20" y="30" width="960" height="560" rx="6" ry="6" fill="#fffaf0" stroke="#13110d" stroke-width="2" data-astro-cid-b2f2xw3q></rect> <rect x="20" y="30" width="960" height="560" rx="6" ry="6" fill="#13110d" filter="url(#dcd-paper)" opacity="0.5" data-astro-cid-b2f2xw3q></rect> <!-- center fold --> <rect x="20" y="30" width="960" height="560" fill="url(#dcd-fold)" data-astro-cid-b2f2xw3q></rect> <line x1="500" y1="30" x2="500" y2="590" stroke="#13110d" stroke-width="0.8" stroke-dasharray="2 4" opacity="0.4" data-astro-cid-b2f2xw3q></line> <!-- LEFT PAGE · COVER --> <g class="dcd__cover" data-astro-cid-b2f2xw3q> <!-- pattern field --> <rect x="40" y="50" width="440" height="520" fill="url(#dcd-dots)" data-astro-cid-b2f2xw3q></rect> <!-- ribbon --> <rect x="40" y="200" width="440" height="56" fill="#c4351c" data-astro-cid-b2f2xw3q></rect> <rect x="40" y="200" width="440" height="56" fill="#13110d" opacity="0.06" data-astro-cid-b2f2xw3q></rect> <!-- bow knot --> <ellipse cx="260" cy="228" rx="46" ry="22" fill="#c4351c" stroke="#7a1a0c" stroke-width="1.5" data-astro-cid-b2f2xw3q></ellipse> <ellipse cx="216" cy="228" rx="22" ry="14" fill="#c4351c" stroke="#7a1a0c" stroke-width="1.5" data-astro-cid-b2f2xw3q></ellipse> <ellipse cx="304" cy="228" rx="22" ry="14" fill="#c4351c" stroke="#7a1a0c" stroke-width="1.5" data-astro-cid-b2f2xw3q></ellipse> <circle cx="260" cy="228" r="9" fill="#7a1a0c" data-astro-cid-b2f2xw3q></circle> <!-- ribbon tails --> <path d="M250 256 L240 308 L262 296 L256 326 L268 320 L280 256 Z" fill="#c4351c" stroke="#7a1a0c" stroke-width="1" data-astro-cid-b2f2xw3q></path> <!-- "happy birthday" script --> <text class="dcd__cover-script" x="260" y="430" text-anchor="middle" data-astro-cid-b2f2xw3q>happy birthday</text> <text class="dcd__cover-kicker mono" x="260" y="510" text-anchor="middle" data-astro-cid-b2f2xw3q>A POINTCAST CARD</text> <text class="dcd__cover-kicker mono" x="260" y="528" text-anchor="middle" data-astro-cid-b2f2xw3q>EL SEGUNDO · CC0</text> <!-- gold corner stars --> <text class="dcd__cover-star" x="68" y="92" data-astro-cid-b2f2xw3q>✦</text> <text class="dcd__cover-star" x="448" y="92" data-astro-cid-b2f2xw3q>✦</text> <text class="dcd__cover-star" x="68" y="572" data-astro-cid-b2f2xw3q>✦</text> <text class="dcd__cover-star" x="448" y="572" data-astro-cid-b2f2xw3q>✦</text> </g> <!-- RIGHT PAGE · INSIDE --> <g class="dcd__inside" data-astro-cid-b2f2xw3q> <!-- inside greeting --> <text class="dcd__inside-kicker mono" x="540" y="92" data-astro-cid-b2f2xw3q>— DEAR —</text> <text class="dcd__inside-name" id="dcd-svg-for" x="740" y="148" text-anchor="middle" data-astro-cid-b2f2xw3q>friend</text> <line x1="540" y1="172" x2="940" y2="172" stroke="#13110d" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.3" data-astro-cid-b2f2xw3q></line> <text class="dcd__inside-greeting" x="740" y="220" text-anchor="middle" data-astro-cid-b2f2xw3q>happy birthday.</text> <!-- message slot (bound at runtime) --> <foreignObject x="540" y="240" width="400" height="60" data-astro-cid-b2f2xw3q> <p xmlns="http://www.w3.org/1999/xhtml" class="dcd__inside-msg" id="dcd-svg-msg" data-astro-cid-b2f2xw3q>— a small note from the room —</p> </foreignObject> <!-- signature grid label --> <text class="dcd__inside-kicker mono" x="540" y="332" data-astro-cid-b2f2xw3q>— SIGNED BY —</text> <!-- 24 signature spots in a 6x4 grid · positions held in JS too --> <g id="dcd-sig-grid" data-astro-cid-b2f2xw3q></g> <!-- from line --> <line x1="540" y1="528" x2="940" y2="528" stroke="#13110d" stroke-width="0.6" stroke-dasharray="2 3" opacity="0.3" data-astro-cid-b2f2xw3q></line> <text class="dcd__inside-kicker mono" x="540" y="552" data-astro-cid-b2f2xw3q>— FROM —</text> <text class="dcd__inside-from" id="dcd-svg-from" x="740" y="552" text-anchor="middle" data-astro-cid-b2f2xw3q>the room</text> </g> </svg> <!-- overlay flourish --> <div class="dcd__shine" aria-hidden="true" data-astro-cid-b2f2xw3q></div> </div> </section> <section class="dcd__sign" aria-label="Sign the card" data-astro-cid-b2f2xw3q> <button type="button" class="dcd__cta" id="dcd-sign" aria-label="Sign the card" data-astro-cid-b2f2xw3q> <span class="dcd__cta-glyph" aria-hidden="true" data-astro-cid-b2f2xw3q>✒︎</span> <span class="dcd__cta-label" data-astro-cid-b2f2xw3q>SIGN THE CARD</span> <span class="dcd__cta-kbd mono" data-astro-cid-b2f2xw3q>SPACE / ENTER</span> </button> <p class="dcd__cta-note mono" id="dcd-note" data-astro-cid-b2f2xw3q>— ready · noun #— —</p> <p class="dcd__cta-meta mono" id="dcd-meta" data-astro-cid-b2f2xw3q>your signatures: <strong data-astro-cid-b2f2xw3q>0</strong> · room signatures: <strong data-astro-cid-b2f2xw3q>—</strong></p> </section> <section class="dcd__customize" aria-label="Customize the card" data-astro-cid-b2f2xw3q> <h2 class="dcd__h mono" data-astro-cid-b2f2xw3q>★ CUSTOMIZE</h2> <div class="dcd__inputs" data-astro-cid-b2f2xw3q> <label class="dcd__field" data-astro-cid-b2f2xw3q> <span class="dcd__field-label mono" data-astro-cid-b2f2xw3q>FOR</span> <input type="text" id="dcd-for" maxlength="40" placeholder="friend" autocomplete="off" data-astro-cid-b2f2xw3q> </label> <label class="dcd__field" data-astro-cid-b2f2xw3q> <span class="dcd__field-label mono" data-astro-cid-b2f2xw3q>FROM</span> <input type="text" id="dcd-from" maxlength="40" placeholder="the room" autocomplete="off" data-astro-cid-b2f2xw3q> </label> <label class="dcd__field dcd__field--wide" data-astro-cid-b2f2xw3q> <span class="dcd__field-label mono" data-astro-cid-b2f2xw3q>A LINE (max 60 · stays in URL only)</span> <input type="text" id="dcd-msg" maxlength="60" placeholder="a small note that stays in your link" autocomplete="off" data-astro-cid-b2f2xw3q> </label> </div> <p class="dcd__hint" data-astro-cid-b2f2xw3q>Your message lives in the URL hash — never written to a server. Share the signed link to send the card.</p> </section> <section class="dcd__share" aria-label="Share the card" data-astro-cid-b2f2xw3q> <h2 class="dcd__h mono" data-astro-cid-b2f2xw3q>★ SHARE</h2> <div class="dcd__share-row" data-astro-cid-b2f2xw3q> <button type="button" class="dcd__btn" id="dcd-copy" data-astro-cid-b2f2xw3q>copy link</button> <a href="#" class="dcd__btn" id="dcd-tweet" target="_blank" rel="noopener" data-astro-cid-b2f2xw3q>tweet</a> <button type="button" class="dcd__btn" id="dcd-native" data-astro-cid-b2f2xw3q>native share</button> </div> <p class="dcd__share-url mono" id="dcd-url" data-astro-cid-b2f2xw3q>—</p> </section> <section class="dcd__strip" aria-label="Last 8 signatures" data-astro-cid-b2f2xw3q> <h2 class="dcd__h mono" data-astro-cid-b2f2xw3q>★ WHO'S SIGNED · LAST 8</h2> <ul class="dcd__strip-row" id="dcd-strip" role="list" data-astro-cid-b2f2xw3q> <li class="dcd__strip-empty mono" data-astro-cid-b2f2xw3q>— waiting on the first signature —</li> </ul> </section> <footer class="dcd__foot" data-astro-cid-b2f2xw3q> <p data-astro-cid-b2f2xw3q>Part of the Birthday Imprint — <a href="/drum-cake" data-astro-cid-b2f2xw3q>/drum-cake</a> · <a href="/drum-card" data-astro-cid-b2f2xw3q>/drum-card</a> · <a href="/drum-pinata" data-astro-cid-b2f2xw3q>/drum-pinata</a>. The card is the slow one. Let it fill up.</p> <p class="dcd__credit mono" data-astro-cid-b2f2xw3q>v0.1 · 2026-04-29 · pointcast.xyz/drum-card</p> </footer> </main> ` }));
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-card.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/drum-card.astro";
const $$url = "/drum-card";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$DrumCard,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
