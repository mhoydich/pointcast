/* 1-bit dither studio: page wiring. */
(function () {
  'use strict';
  var K = window.KitB, D = window.DitherCore;
  var $ = K.$;
  var art = $('#art');
  var ctx = art.getContext('2d');
  var OUT = 720; // output long side in device pixels before pixel-size scaling
  var photo = null; // HTMLImageElement or ImageBitmap, never stored or sent anywhere
  var photoName = '';
  var lastBits = null, lastW = 0, lastH = 0;

  var PRESETS = [
    ['#101010', '#f3f1ea', 'Ink on paper'],
    ['#f3f1ea', '#101010', 'Paper on ink'],
    ['#7dff8a', '#0b120c', 'Phosphor'],
    ['#ffb547', '#140d04', 'Amber terminal'],
    ['#f3f1ea', '#1d3b8f', 'Blueprint'],
    ['#c9351a', '#f3f1ea', 'Vermilion'],
    ['#2b2b2b', '#d9d4c7', 'Newsprint']
  ];
  var NOTES = {
    atkinson: 'Spreads 6/8 of each error to six neighbours. Crisp highlights, open shadows.',
    'floyd-steinberg': 'Spreads all of the error to four neighbours. Smooth, fine grain.',
    bayer: 'Compares each pixel to a fixed 8×8 threshold map. Cross-hatched, no wandering.',
    threshold: 'Light becomes paper, dark becomes ink. Pure poster.'
  };

  var state = defaults();
  function defaults() {
    return { src: 'scene', seed: K.newSeed(), algo: 'atkinson', px: 3, c: 10, b: 0, ink: '#101010', paper: '#f3f1ea' };
  }
  function fromHash() {
    var h = K.readHash(), d = defaults();
    var s = {
      src: K.pick(h.src, ['scene', 'card'], d.src),
      seed: K.cleanSeed(h.seed) || d.seed,
      algo: K.pick(h.algo, D.ALGOS, d.algo),
      px: Math.round(K.num(h.px, 1, 8, d.px)),
      c: Math.round(K.num(h.c, -100, 100, d.c)),
      b: Math.round(K.num(h.b, -100, 100, d.b)),
      ink: K.hex(h.ink, d.ink),
      paper: K.hex(h.paper, d.paper)
    };
    return s;
  }
  function toHash() {
    // a photo is never in the link: the link falls back to the scene
    K.writeHash({ src: state.src === 'photo' ? 'scene' : state.src, seed: state.seed, algo: state.algo, px: state.px,
      c: state.c, b: state.b, ink: state.ink.slice(1), paper: state.paper.slice(1) });
  }

  // ---- controls -----------------------------------------------------------
  var seedIn = $('#seed'), pxIn = $('#px'), cIn = $('#contrast'), bIn = $('#bright'), inkIn = $('#ink'), paperIn = $('#paper');
  var syncPx = K.bindOutput(pxIn, function (v) { return v + ' px'; });
  var syncC = K.bindOutput(cIn, function (v) { return (v > 0 ? '+' : '') + v; });
  var syncB = K.bindOutput(bIn, function (v) { return (v > 0 ? '+' : '') + v; });
  var syncInk = K.bindColor(inkIn), syncPaper = K.bindColor(paperIn);

  var sw = $('#swatches');
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'kb-swatch';
    b.setAttribute('aria-label', p[2] + ' preset');
    b.title = p[2];
    b.innerHTML = '<i style="background:' + p[0] + '"></i><i style="background:' + p[1] + '"></i>';
    b.addEventListener('click', function () { state.ink = p[0]; state.paper = p[1]; push(); });
    sw.appendChild(b);
  });

  function push() {
    seedIn.value = state.seed;
    pxIn.value = state.px; cIn.value = state.c; bIn.value = state.b;
    inkIn.value = state.ink; paperIn.value = state.paper;
    syncPx(); syncC(); syncB(); syncInk(); syncPaper();
    K.setRadio('src', state.src); K.setRadio('algo', state.algo);
    $('#photo-field').hidden = state.src !== 'photo';
    $('#seed-field').hidden = state.src === 'photo';
    $('#algo-note').textContent = NOTES[state.algo];
    render();
  }

  K.$all('input[name="src"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.src = r.value;
      if (state.src === 'photo' && !photo) $('#file').click();
      push();
    });
  });
  K.$all('input[name="algo"]').forEach(function (r) {
    r.addEventListener('change', function () { state.algo = r.value; push(); });
  });
  seedIn.addEventListener('change', function () { state.seed = K.cleanSeed(seedIn.value) || K.newSeed(); push(); });
  $('#reseed').addEventListener('click', function () { state.seed = K.newSeed(); push(); });
  var slow = K.debounce(function () { render(); }, 30);
  pxIn.addEventListener('input', function () { state.px = +pxIn.value; slow(); });
  cIn.addEventListener('input', function () { state.c = +cIn.value; slow(); });
  bIn.addEventListener('input', function () { state.b = +bIn.value; slow(); });
  inkIn.addEventListener('input', function () { state.ink = inkIn.value; paint(); toHash(); });
  paperIn.addEventListener('input', function () { state.paper = paperIn.value; paint(); toHash(); });

  $('#shuffle').addEventListener('click', function () {
    var r = K.rng(K.newSeed());
    state.seed = K.newSeed();
    if (state.src === 'photo' && photo) state.seed = state.seed; // keep the photo, change the treatment
    else state.src = r() < 0.75 ? 'scene' : 'card';
    state.algo = D.ALGOS[Math.floor(r() * 3)];
    state.px = 2 + Math.floor(r() * 4);
    state.c = Math.round(r() * 40 - 5);
    state.b = Math.round(r() * 20 - 10);
    var p = PRESETS[Math.floor(r() * PRESETS.length)];
    state.ink = p[0]; state.paper = p[1];
    push();
  });
  $('#swap').addEventListener('click', function () { var t = state.ink; state.ink = state.paper; state.paper = t; push(); });
  $('#copy').addEventListener('click', function () {
    toHash(); K.copyLink();
    if (state.src === 'photo') setTimeout(function () { K.status('Link copied. It carries settings, not your photo.'); }, 50);
  });
  $('#png').addEventListener('click', function () { K.downloadCanvas(art, fileBase() + '.png'); });
  $('#svg').addEventListener('click', function () {
    if (!lastBits) return;
    K.downloadSvg(D.toSvg(lastBits, lastW, lastH, state.px, state.ink, state.paper), fileBase() + '.svg');
  });
  function fileBase() {
    return 'pointcast-dither-' + (state.src === 'photo' ? 'photo' : state.seed) + '-' + state.algo;
  }

  // ---- photo input (local only) -------------------------------------------
  function loadFile(file) {
    if (!file || !/^image\//.test(file.type)) { K.status('That file is not an image'); return; }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      photo = img; photoName = file.name;
      state.src = 'photo';
      $('#drop-text').textContent = 'Photo loaded. Choose another';
      push();
      URL.revokeObjectURL(url);
      K.status('Photo loaded on this device only');
    };
    img.onerror = function () { URL.revokeObjectURL(url); K.status('Could not read that image'); };
    img.src = url;
  }
  $('#file').addEventListener('change', function (e) { loadFile(e.target.files[0]); });
  [$('#drop'), $('#drop-stage')].forEach(function (zone) {
    zone.addEventListener('dragover', function (e) { e.preventDefault(); $('#drop').classList.add('is-over'); });
    zone.addEventListener('dragleave', function () { $('#drop').classList.remove('is-over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); $('#drop').classList.remove('is-over');
      if (e.dataTransfer && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    });
  });

  // ---- render ---------------------------------------------------------------
  function sourceGray(w, h) {
    if (state.src === 'photo' && photo) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      var x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.drawImage(photo, 0, 0, w, h);
      return D.rgbaToGray(x.getImageData(0, 0, w, h).data, w, h);
    }
    var rand = K.rng(state.seed + ':' + state.src);
    return state.src === 'card' ? D.testCard(w, h, rand) : D.scene(w, h, rand);
  }
  function gridSize() {
    var px = state.px, aw = OUT, ah = OUT;
    if (state.src === 'photo' && photo) {
      var ratio = (photo.naturalHeight || photo.height) / (photo.naturalWidth || photo.width);
      ratio = K.clamp(ratio, 0.4, 1.6);
      if (ratio > 1) { ah = OUT * 1.25; aw = ah / ratio; } else { ah = OUT * ratio; }
    }
    return [Math.max(8, Math.round(aw / px)), Math.max(8, Math.round(ah / px))];
  }
  function render() {
    var g = gridSize(), w = g[0], h = g[1];
    var gray = D.adjust(sourceGray(w, h), state.c, state.b);
    lastBits = D.dither(gray, w, h, state.algo); lastW = w; lastH = h;
    paint();
    toHash();
  }
  function paint() {
    if (!lastBits) return;
    var w = lastW, h = lastH, px = state.px;
    var img = new ImageData(w, h);
    var a = K.hexToRgb(state.ink), b = K.hexToRgb(state.paper);
    for (var i = 0, j = 0; i < w * h; i++, j += 4) {
      var c = lastBits[i] ? b : a;
      img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255;
    }
    var small = document.createElement('canvas');
    small.width = w; small.height = h;
    small.getContext('2d').putImageData(img, 0, 0);
    art.width = w * px; art.height = h * px;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, w * px, h * px);
    var name = { atkinson: 'Atkinson', 'floyd-steinberg': 'Floyd-Steinberg', bayer: 'Bayer 8×8', threshold: 'Threshold' }[state.algo];
    var srcName = state.src === 'photo' ? 'Your photo' : state.src === 'card' ? 'Test card' : 'Scene';
    $('#cap-left').innerHTML = '<b>' + srcName + '</b>' + (state.src === 'photo' ? '' : ' · seed ' + K.escapeXml(state.seed));
    $('#cap-right').textContent = name + ' · ' + w + '×' + h + ' cells · ' + px + ' px';
    art.setAttribute('aria-label', srcName + ' dithered with ' + name + ' at ' + px + ' pixel size, in two inks ' + state.ink + ' and ' + state.paper);
  }

  window.addEventListener('hashchange', function () { state = fromHash(); push(); });
  state = fromHash();
  push();
})();
