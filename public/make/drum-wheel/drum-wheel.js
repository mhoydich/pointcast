/* Drum wheel. A Euclidean rhythm drawn as a poster. The poster is also the beat: press play. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 1200, H = 1500, CX = 600, CY = 728, TAU = Math.PI * 2;

  var VOICES = [
    { id: 'kick', label: 'Kick', kmin: 2, kmax: 5 },
    { id: 'snare', label: 'Snare', kmin: 1, kmax: 3 },
    { id: 'clap', label: 'Clap', kmin: 1, kmax: 4 },
    { id: 'bell', label: 'Bell', kmin: 2, kmax: 7 },
    { id: 'hat', label: 'Hat', kmin: 5, kmax: 12 }
  ];
  var PAPERS = {
    paper: { bg: '#f6f4ee', ink: '#141414', faint: '#cfcac0', accent: '#e2400c' },
    night: { bg: '#101010', ink: '#efece4', faint: '#3a3833', accent: '#ff6a2b' }
  };

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'drum-0001', max: 32, hint: 'Picks how many hits each voice gets and where each ring starts.' },
    { key: 'title', type: 'text', label: 'Title', def: 'SURF BEAT', max: 16, upper: true },
    { group: 'Rhythm', key: 'steps', type: 'seg', label: 'Steps per bar', def: '16', options: ['8', '12', '16', '24', '32'] },
    { key: 'voices', type: 'range', label: 'Voices (rings)', def: 4, min: 2, max: 5, step: 1 },
    { key: 'density', type: 'range', label: 'Density', def: 3, min: 1, max: 5, step: 1, hint: 'More hits per ring as it rises.' },
    { key: 'bpm', type: 'range', label: 'Tempo', def: 104, min: 60, max: 180, step: 1, unit: 'BPM' },
    { group: 'Print', key: 'cell', type: 'seg', label: 'Mark', def: 'pixel', options: [{ v: 'pixel', label: 'Pixel' }, { v: 'dot', label: 'Dot' }, { v: 'block', label: 'Block' }] },
    { key: 'accent', type: 'seg', label: 'Accent voice', def: 'snare', options: VOICES.map(function (v) { return { v: v.id, label: v.label }; }) },
    { key: 'paper', type: 'seg', label: 'Paper', def: 'paper', options: [{ v: 'paper', label: 'Paper', swatch: '#f6f4ee' }, { v: 'night', label: 'Night', swatch: '#101010' }] }
  ];

  // Even spread of k hits over n steps (Bresenham form of the Euclidean rhythm).
  function euclid(k, n, rot) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var j = ((i + rot) % n + n) % n;
      out.push((j * k) % n < k ? 1 : 0);
    }
    return out;
  }

  function pattern(st) {
    var r = K.rng('drum|' + st.seed), n = Number(st.steps);
    var pick = { 2: [0, 4], 3: [0, 1, 4], 4: [0, 1, 2, 4], 5: [0, 1, 2, 3, 4] }[st.voices] || [0, 1, 2, 4];
    var list = pick.map(function (i) { return VOICES[i]; });
    return list.map(function (v) {
      var span = v.kmax - v.kmin, base = v.kmin + span * (st.density - 1) / 4;
      var k = Math.max(1, Math.min(n - 1, Math.round((base + r.range(-0.8, 0.8)) * n / 16)));
      var rot = v.id === 'kick' ? 0 : r.int(0, n - 1);
      return { id: v.id, label: v.label, k: k, n: n, rot: rot, hits: euclid(k, n, rot) };
    });
  }

  function mark(cell, x, y, size, ang, fill, ring) {
    if (cell === 'dot') return '<circle cx="' + K.n1(x) + '" cy="' + K.n1(y) + '" r="' + K.n1(size / 2) + '" fill="' + fill + '"/>';
    if (cell === 'block') {
      var a0 = ang - ring.da * 0.42, a1 = ang + ring.da * 0.42, r0 = ring.r - size / 2, r1 = ring.r + size / 2;
      var p = function (a, rr) { return K.n1(CX + rr * Math.cos(a)) + ' ' + K.n1(CY + rr * Math.sin(a)); };
      return '<path d="M' + p(a0, r0) + 'L' + p(a0, r1) + 'A' + r1 + ' ' + r1 + ' 0 0 1 ' + p(a1, r1) + 'L' + p(a1, r0) + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + p(a0, r0) + 'Z" fill="' + fill + '"/>';
    }
    var sz = Math.round(size);
    return '<rect x="' + Math.round(x - sz / 2) + '" y="' + Math.round(y - sz / 2) + '" width="' + sz + '" height="' + sz + '" fill="' + fill + '" shape-rendering="crispEdges"/>';
  }

  function render(st, opts) {
    opts = opts || {};
    var P = PAPERS[st.paper], pat = pattern(st), n = Number(st.steps);
    var body = '<rect width="' + W + '" height="' + H + '" fill="' + P.bg + '"/>';
    // header
    body += '<text x="60" y="92" font-family="' + K.FONT.mono + '" font-size="20" letter-spacing="5" fill="' + P.ink + '">DRUM WHEEL · ' + n + ' STEPS · ' + pat.length + ' VOICES</text>';
    body += '<text x="' + (W - 60) + '" y="92" text-anchor="end" font-family="' + K.FONT.mono + '" font-size="20" letter-spacing="5" fill="' + P.ink + '">POINTCAST</text>';
    body += '<line x1="60" y1="112" x2="' + (W - 60) + '" y2="112" stroke="' + P.ink + '" stroke-width="2"/>';
    var title = st.title.trim() || 'UNTITLED';
    var tfs = Math.min(96, 1080 / Math.max(1, title.length * 0.62));
    body += '<text x="56" y="' + K.n1(132 + tfs * 0.8) + '" font-family="' + K.FONT.sans + '" font-weight="900" font-size="' + K.n1(tfs) + '" letter-spacing="-1" fill="' + P.ink + '"' + (title.length > 8 ? ' textLength="' + K.n1(Math.min(1080, title.length * tfs * 0.62)) + '" lengthAdjust="spacingAndGlyphs"' : '') + '>' + K.esc(title) + '</text>';

    // rings
    var rIn = 140, rOut = 390, gap = pat.length > 1 ? (rOut - rIn) / (pat.length - 1) : 0;
    var da = TAU / n, spokes = '', marks = '', rests = '';
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * da;
      spokes += 'M' + K.n1(CX + (rIn - 40) * Math.cos(a)) + ' ' + K.n1(CY + (rIn - 40) * Math.sin(a)) + 'L' + K.n1(CX + (rOut + 40) * Math.cos(a)) + ' ' + K.n1(CY + (rOut + 40) * Math.sin(a));
      if (i % (n % 3 === 0 ? 3 : 4) === 0) {
        body += '<text x="' + K.n1(CX + (rOut + 68) * Math.cos(a)) + '" y="' + K.n1(CY + (rOut + 68) * Math.sin(a) + 7) + '" text-anchor="middle" font-family="' + K.FONT.mono + '" font-size="20" fill="' + P.ink + '">' + (i + 1) + '</text>';
      }
    }
    body += '<path d="' + spokes + '" stroke="' + P.faint + '" stroke-width="1"/>';
    pat.forEach(function (v, vi) {
      var rr = rIn + vi * gap, ring = { r: rr, da: da };
      var size = Math.min(gap ? gap * 0.62 : 60, rr * da * 0.78, 54);
      var fill = v.id === st.accent ? P.accent : P.ink;
      body += '<circle cx="' + CX + '" cy="' + CY + '" r="' + K.n1(rr) + '" fill="none" stroke="' + P.faint + '" stroke-width="1"/>';
      for (var s = 0; s < n; s++) {
        var a = -Math.PI / 2 + s * da, x = CX + rr * Math.cos(a), y = CY + rr * Math.sin(a);
        if (v.hits[s]) marks += mark(st.cell, x, y, size, a, fill, ring);
        else rests += '<rect x="' + K.n1(x - 2.5) + '" y="' + K.n1(y - 2.5) + '" width="5" height="5" fill="' + P.ink + '" opacity="0.45"/>';
      }
    });
    body += rests + marks;
    // downbeat marker
    body += '<path d="M' + (CX - 12) + ' ' + (CY - rOut - 102) + 'L' + (CX + 12) + ' ' + (CY - rOut - 102) + 'L' + CX + ' ' + (CY - rOut - 84) + 'Z" fill="' + P.ink + '"/>';
    // playhead, moved by the page while playing
    body += '<g id="dw-head" opacity="0"><line x1="' + CX + '" y1="' + (CY - rIn + 60) + '" x2="' + CX + '" y2="' + (CY - rOut - 40) + '" stroke="' + P.accent + '" stroke-width="5"/></g>';
    // centre
    body += '<circle cx="' + CX + '" cy="' + CY + '" r="96" fill="' + P.bg + '" stroke="' + P.ink + '" stroke-width="2"/>';
    body += '<text x="' + CX + '" y="' + (CY + 18) + '" text-anchor="middle" font-family="' + K.FONT.mono + '" font-weight="800" font-size="64" fill="' + P.ink + '">' + st.bpm + '</text>';
    body += '<text x="' + CX + '" y="' + (CY + 50) + '" text-anchor="middle" font-family="' + K.FONT.sans + '" font-weight="600" font-size="17" letter-spacing="4" fill="' + P.ink + '">BPM</text>';

    // legend: one strip per voice
    var ly = 1250, rowH = Math.min(42, 196 / pat.length);
    body += '<line x1="60" y1="' + (ly - 26) + '" x2="' + (W - 60) + '" y2="' + (ly - 26) + '" stroke="' + P.ink + '" stroke-width="2"/>';
    pat.slice().reverse().forEach(function (v, i) {
      var y = ly + i * rowH, fill = v.id === st.accent ? P.accent : P.ink;
      body += '<text x="60" y="' + K.n1(y + rowH * 0.62) + '" font-family="' + K.FONT.sans + '" font-weight="700" font-size="18" letter-spacing="3" fill="' + P.ink + '">' + v.label.toUpperCase() + '</text>';
      body += '<text x="170" y="' + K.n1(y + rowH * 0.62) + '" font-family="' + K.FONT.mono + '" font-size="18" fill="' + P.ink + '">E(' + v.k + ',' + v.n + ') +' + v.rot + '</text>';
      var x0 = 360, cw = (W - 60 - x0) / n, sz = Math.min(cw * 0.7, rowH * 0.6);
      for (var s = 0; s < n; s++) {
        var cx = x0 + s * cw + cw / 2, cy = y + rowH / 2;
        if (v.hits[s]) body += '<rect x="' + K.n1(cx - sz / 2) + '" y="' + K.n1(cy - sz / 2) + '" width="' + K.n1(sz) + '" height="' + K.n1(sz) + '" fill="' + fill + '" shape-rendering="crispEdges"/>';
        else body += '<rect x="' + K.n1(cx - 2) + '" y="' + K.n1(cy - 2) + '" width="4" height="4" fill="' + P.ink + '" opacity="0.45"/>';
        if (s % 4 === 0) body += '<line x1="' + K.n1(x0 + s * cw) + '" y1="' + K.n1(y + 4) + '" x2="' + K.n1(x0 + s * cw) + '" y2="' + K.n1(y + rowH - 4) + '" stroke="' + P.faint + '" stroke-width="1"/>';
      }
    });
    body += '<text x="60" y="' + (H - 34) + '" font-family="' + K.FONT.mono + '" font-size="15" letter-spacing="1.5" fill="' + P.ink + '" opacity="0.75">THIS POSTER IS A BEAT. OPEN THE LINK AND PRESS PLAY. POINTCAST.XYZ/MAKE/DRUM-WHEEL · SEED ' + K.esc(st.seed.toUpperCase()) + '</text>';
    return K.svgDoc(W, H, body, { label: describe(st), physical: opts.physical });
  }

  function describe(st) {
    var pat = pattern(st);
    return 'Drum wheel poster titled ' + (st.title || 'untitled') + ', ' + st.steps + ' steps at ' + st.bpm + ' BPM: ' +
      pat.map(function (v) { return v.label + ' ' + v.k + ' of ' + v.n; }).join(', ') + '.';
  }

  function shuffle(r) {
    return {
      steps: r.pick(['8', '12', '16', '16', '24', '32']), voices: r.int(3, 5), density: r.int(1, 5), bpm: r.int(72, 160),
      cell: r.pick(['pixel', 'dot', 'block']), accent: r.pick(VOICES).id, paper: r.chance(0.3) ? 'night' : 'paper'
    };
  }

  /* ---------- sound: synthesized in the browser, nothing loaded ---------- */
  var audio = null, timer = null, step = 0, nextTime = 0, live = null, playBtn = null;
  var reduce = g.matchMedia ? g.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  function noiseBuf(ctx) {
    var b = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate), d = b.getChannelData(0), r = K.rng(7);
    for (var i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    return b;
  }
  function env(ctx, t, peak, dur, dest) {
    var gn = ctx.createGain();
    gn.gain.setValueAtTime(peak, t);
    gn.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    gn.connect(dest);
    return gn;
  }
  function hit(id, t, loud) {
    var ctx = audio.ctx, out = audio.out, v = loud ? 1.25 : 1, o, n, f;
    if (id === 'kick') {
      o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      o.connect(env(ctx, t, 0.9 * v, 0.38, out)); o.start(t); o.stop(t + 0.4);
    } else if (id === 'snare' || id === 'clap' || id === 'hat') {
      var bursts = id === 'clap' ? 3 : 1;
      for (var b = 0; b < bursts; b++) {
        var tb = t + b * 0.011;
        n = ctx.createBufferSource(); n.buffer = audio.noise;
        f = ctx.createBiquadFilter();
        if (id === 'hat') { f.type = 'highpass'; f.frequency.value = 7000; }
        else if (id === 'clap') { f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.8; }
        else { f.type = 'highpass'; f.frequency.value = 1100; }
        n.connect(f); f.connect(env(ctx, tb, (id === 'hat' ? 0.22 : 0.5) * v, id === 'hat' ? 0.05 : id === 'clap' ? 0.12 : 0.18, out));
        n.start(tb); n.stop(tb + 0.25);
      }
      if (id === 'snare') { o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 190; o.connect(env(ctx, t, 0.3 * v, 0.1, out)); o.start(t); o.stop(t + 0.12); }
    } else if (id === 'bell') {
      [660, 991, 1320].forEach(function (fq, i) {
        o = ctx.createOscillator(); o.frequency.value = fq; o.connect(env(ctx, t, (0.16 / (i + 1)) * v, 0.6, out)); o.start(t); o.stop(t + 0.62);
      });
    }
  }
  function moveHead(s) {
    var head = document.getElementById('dw-head');
    if (!head) return;
    if (s < 0 || reduce.matches) { head.setAttribute('opacity', '0'); return; }
    head.setAttribute('opacity', '1');
    head.setAttribute('transform', 'rotate(' + K.n1(s * 360 / Number(live.steps)) + ' ' + CX + ' ' + CY + ')');
  }
  function tick() {
    var ctx = audio.ctx, pat = pattern(live), n = Number(live.steps), dur = 60 / live.bpm / 4;
    while (nextTime < ctx.currentTime + 0.12) {
      var s = step % n;
      pat.forEach(function (v) { if (v.hits[s]) hit(v.id, nextTime, v.id === live.accent); });
      (function (s2, when) { setTimeout(function () { if (timer) moveHead(s2); }, Math.max(0, (when - ctx.currentTime) * 1000)); })(s, nextTime);
      nextTime += dur;
      step++;
    }
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    moveHead(-1);
    if (playBtn) { playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play the beat'; }
  }
  function play(state, btn, say) {
    live = state; playBtn = btn;
    if (timer) { stop(); say('Stopped.'); return; }
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) { say('This browser has no Web Audio.'); return; }
    if (!audio) { var ctx = new AC(), out = ctx.createGain(); out.gain.value = 0.55; out.connect(ctx.destination); audio = { ctx: ctx, out: out, noise: noiseBuf(ctx) }; }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    step = 0; nextTime = audio.ctx.currentTime + 0.06;
    timer = setInterval(tick, 25); tick();
    btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Stop';
    say('Playing ' + state.bpm + ' BPM. Change anything; the beat follows.');
  }
  if (g.document) g.document.addEventListener('visibilitychange', function () { if (document.hidden && timer) stop(); });

  var T = {
    slug: 'drum-wheel', title: 'Drum wheel', schema: schema, render: render, describe: describe, shuffle: shuffle,
    euclid: euclid, pattern: pattern,
    actions: { play: play },
    init: function (state) { live = state; },
    afterRender: function () { if (timer) moveHead((step - 1) % Number(live.steps)); },
    size: function (st) { return { w: 2400, h: 3000, dpi: 300, label: '8 x 10 in', bg: PAPERS[st.paper].bg, physical: ['8in', '10in'] }; }
  };
  g.MakeTools['drum-wheel'] = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
