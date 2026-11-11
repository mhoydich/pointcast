/* Court lines poster: page wiring. */
(function () {
  'use strict';
  var K = window.KitB, C = window.CourtCore;
  var $ = K.$;
  var lastSvg = '';
  var PRESETS = [
    ['#101010', '#f3f1ea', 'Ink on paper'],
    ['#f3f1ea', '#101010', 'Paper on ink'],
    ['#f3f1ea', '#1f4f8a', 'Court blue'],
    ['#f3f1ea', '#2f5e3e', 'Court green'],
    ['#c9351a', '#f3f1ea', 'Vermilion'],
    ['#101010', '#d7e04a', 'Ball yellow']
  ];
  function defaultTitle(seed) {
    var r = K.rng(seed + ':title');
    var a = ['Kitchen', 'Baseline', 'Third Shot', 'Net Post', 'Centre Line', 'Long Point', 'Soft Game', 'Dawn'];
    var b = ['Study', 'Rally', 'Diagram', 'Exercise', 'Score', 'Drill'];
    return a[Math.floor(r() * a.length)] + ' ' + b[Math.floor(r() * b.length)] + ' No. ' + (1 + Math.floor(r() * 99));
  }
  function defaults() {
    return { seed: 'court', lw: 2, rot: 0, style: 'lines', path: 'on', ink: '#101010', ground: '#f3f1ea', t: null };
  }
  function fromHash() {
    var h = K.readHash(), d = defaults();
    var s = {
      seed: K.cleanSeed(h.seed) || (Object.keys(h).length ? K.newSeed() : d.seed),
      lw: Math.round(K.num(h.lw, 1, 12, d.lw) * 2) / 2,
      rot: Math.round(K.num(h.rot, -90, 90, d.rot)),
      style: K.pick(h.style, ['lines', 'solid'], d.style),
      path: K.pick(h.path, ['on', 'off'], d.path),
      ink: K.hex(h.ink, d.ink), ground: K.hex(h.ground, d.ground),
      t: h.t != null ? String(h.t).slice(0, 48) : null
    };
    return s;
  }
  var st = fromHash();
  function title() { return st.t != null && st.t !== '' ? st.t : defaultTitle(st.seed); }
  function toHash() {
    K.writeHash({ seed: st.seed, lw: st.lw, rot: st.rot, style: st.style, path: st.path, ink: st.ink.slice(1), ground: st.ground.slice(1), t: st.t || undefined });
  }

  function render() {
    var shots = C.rally(K.rng(st.seed));
    lastSvg = C.poster({ ground: st.ground, ink: st.ink, weightIn: st.lw, rotation: st.rot, style: st.style, title: title(), shots: shots, showPath: st.path === 'on', seed: st.seed.toUpperCase() });
    var stage = $('#stage');
    stage.innerHTML = lastSvg;
    stage.style.background = st.ground;
    var svg = stage.querySelector('svg');
    var seq = C.describe(shots);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Poster titled ' + title() + '. A pickleball court, 20 by 44 feet, rotated ' + st.rot + ' degrees' + (st.path === 'on' ? ', with a rally: ' + seq : '') + '.');
    $('#rally-note').textContent = shots.length + ' shots: ' + seq + '.';
    $('#cap-left').innerHTML = '<b>Seed ' + K.escapeXml(st.seed) + '</b> · ' + shots.length + ' shots';
    $('#ttl').placeholder = defaultTitle(st.seed);
    toHash();
  }

  var seedIn = $('#seed'), lwIn = $('#lw'), rotIn = $('#rot'), inkIn = $('#ink'), gIn = $('#ground'), tIn = $('#ttl');
  var syncLw = K.bindOutput(lwIn, function (v) { return v + ' in' + (+v === 2 ? ' · regulation' : ''); });
  var syncRot = K.bindOutput(rotIn, function (v) { return v + '°'; });
  var syncInk = K.bindColor(inkIn), syncG = K.bindColor(gIn);
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'kb-swatch'; b.title = p[2];
    b.setAttribute('aria-label', p[2] + ' preset');
    b.innerHTML = '<i style="background:' + p[0] + '"></i><i style="background:' + p[1] + '"></i>';
    b.addEventListener('click', function () { st.ink = p[0]; st.ground = p[1]; push(); });
    $('#swatches').appendChild(b);
  });
  function push() {
    seedIn.value = st.seed; lwIn.value = st.lw; rotIn.value = st.rot; inkIn.value = st.ink; gIn.value = st.ground;
    tIn.value = st.t || '';
    syncLw(); syncRot(); syncInk(); syncG();
    K.setRadio('style', st.style); K.setRadio('path', st.path);
    render();
  }
  seedIn.addEventListener('change', function () { st.seed = K.cleanSeed(seedIn.value) || K.newSeed(); push(); });
  $('#reseed').addEventListener('click', function () { st.seed = K.newSeed(); push(); });
  lwIn.addEventListener('input', function () { st.lw = +lwIn.value; render(); });
  rotIn.addEventListener('input', function () { st.rot = +rotIn.value; render(); });
  inkIn.addEventListener('input', function () { st.ink = inkIn.value; render(); });
  gIn.addEventListener('input', function () { st.ground = gIn.value; render(); });
  tIn.addEventListener('input', function () { st.t = tIn.value.slice(0, 48); render(); });
  K.$all('input[name="style"]').forEach(function (r) { r.addEventListener('change', function () { st.style = r.value; render(); }); });
  K.$all('input[name="path"]').forEach(function (r) { r.addEventListener('change', function () { st.path = r.value; render(); }); });
  $('#swap').addEventListener('click', function () { var t = st.ink; st.ink = st.ground; st.ground = t; push(); });
  $('#shuffle').addEventListener('click', function () {
    var r = K.rng(K.newSeed());
    st.seed = K.newSeed();
    st.lw = [1.5, 2, 2, 3, 4, 6][Math.floor(r() * 6)];
    st.rot = r() < 0.5 ? 0 : [90, -90, 12, -8, 30, -45, 45][Math.floor(r() * 7)];
    st.style = r() < 0.7 ? 'lines' : 'solid';
    st.path = 'on';
    var p = PRESETS[Math.floor(r() * PRESETS.length)];
    st.ink = p[0]; st.ground = p[1];
    st.t = null;
    push();
  });
  $('#copy').addEventListener('click', function () { toHash(); K.copyLink(); });
  function base() { return 'pointcast-court-' + K.slugify(title()); }
  $('#svg').addEventListener('click', function () { K.downloadSvg(lastSvg, base() + '.svg'); });
  $('#png').addEventListener('click', function () { K.downloadSvgAsPng(lastSvg, C.PW * 2, C.PH * 2, base() + '.png'); });

  window.addEventListener('hashchange', function () { st = fromHash(); push(); });
  push();
})();
