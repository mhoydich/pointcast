/* Punch-card loom: page wiring, card drawing and cloth drawing. */
(function () {
  'use strict';
  var K = window.KitB, L = window.LoomCore;
  var $ = K.$;
  var COLS = L.COLS, ROWS = L.ROWS;
  var cardCv = $('#card'), cctx = cardCv.getContext('2d');
  var cloth = $('#cloth'), xctx = cloth.getContext('2d');
  var MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

  var PRESETS = [
    ['#101010', '#f3f1ea', 'Ink and paper'],
    ['#c9351a', '#f3f1ea', 'Vermilion on paper'],
    ['#1d3b8f', '#e9e4d6', 'Indigo and undyed'],
    ['#f3f1ea', '#101010', 'Paper on ink'],
    ['#d9b23a', '#20201c', 'Gold on charcoal'],
    ['#2f5e3e', '#ece6d3', 'Moss and linen']
  ];
  var GROUND_NOTES = {
    float: 'Pure lift plan: holes show warp, blanks show weft. Long floats, bold figure.',
    damask: 'Five-end satin. Figure is warp-faced, ground is weft-faced, like table linen.',
    twill: 'Three-over-one twill figure on a one-over-three twill ground. Diagonal grain.'
  };

  var card = L.blank();
  var st = {};
  var cursor = { c: 0, r: 0 };

  function defaults() {
    // a fixed seeded border motif, so a bare link always opens on the same cloth
    return { card: L.encode(L.seeded(K.rng('d')).card), w: '#101010', f: '#f3f1ea', g: 'float', rep: 'mirror', pk: 3, sz: 8 };
  }
  function fromHash() {
    var h = K.readHash(), d = defaults();
    var s = {
      card: h.card != null ? h.card : d.card,
      w: K.hex(h.w, d.w), f: K.hex(h.f, d.f),
      g: K.pick(h.g, L.GROUNDS, d.g), rep: K.pick(h.rep, L.REPEATS, d.rep),
      pk: Math.round(K.num(h.pk, 1, 8, d.pk)), sz: Math.round(K.num(h.sz, 4, 20, d.sz))
    };
    card = L.decode(s.card);
    return s;
  }
  function toHash() {
    K.writeHash({ card: L.encode(card) || '0', w: st.w.slice(1), f: st.f.slice(1), g: st.g, rep: st.rep, pk: st.pk, sz: st.sz });
  }

  // ---- card drawing -----------------------------------------------------------
  var CW = cardCv.width, CH = cardCv.height;
  var GX = 52, GY = 92, GW = CW - GX - 36, GH = CH - GY - 64;
  var cw = GW / COLS, ch = GH / ROWS;
  function cellAt(px, py) {
    var c = Math.floor((px - GX) / cw), r = Math.floor((py - GY) / ch);
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
    return { c: c, r: r };
  }
  function drawCard() {
    var paper = '#f3f1ea', ink = '#101010', mute = '#55554f', accent = '#c9351a';
    cctx.clearRect(0, 0, CW, CH);
    // card body with the clipped corner
    cctx.fillStyle = '#e9e4d6';
    cctx.beginPath();
    cctx.moveTo(34, 8); cctx.lineTo(CW - 8, 8); cctx.lineTo(CW - 8, CH - 8); cctx.lineTo(8, CH - 8); cctx.lineTo(8, 34); cctx.closePath();
    cctx.fill();
    cctx.strokeStyle = ink; cctx.lineWidth = 2; cctx.stroke();
    // interpreted line: what each column reads as
    cctx.textAlign = 'center'; cctx.textBaseline = 'middle';
    cctx.font = '600 15px ' + MONO;
    cctx.fillStyle = ink;
    for (var c = 0; c < COLS; c++) {
      var chr = L.readColumn(card, c);
      if (chr !== ' ' && chr !== '·') cctx.fillText(chr, GX + c * cw + cw / 2, 40);
      else if (chr === '·' && colHasPunch(c)) { cctx.fillStyle = accent; cctx.fillText('·', GX + c * cw + cw / 2, 40); cctx.fillStyle = ink; }
    }
    // row labels
    cctx.font = '600 12px ' + MONO; cctx.fillStyle = mute;
    for (var r = 0; r < ROWS; r++) cctx.fillText(L.ROW_NAMES[r], 30, GY + r * ch + ch / 2);
    // printed digits and holes
    cctx.font = '12px ' + MONO;
    for (c = 0; c < COLS; c++) {
      for (r = 0; r < ROWS; r++) {
        var x = GX + c * cw, y = GY + r * ch;
        if (card[L.idx(c, r)]) {
          cctx.fillStyle = ink;
          cctx.fillRect(Math.round(x + cw * 0.2), Math.round(y + ch * 0.16), Math.round(cw * 0.6), Math.round(ch * 0.68));
        } else if (r >= 2) {
          cctx.fillStyle = mute;
          cctx.fillText(L.ROW_NAMES[r], x + cw / 2, y + ch / 2 + 1);
        } else {
          cctx.fillStyle = '#c9c3b2';
          cctx.fillRect(Math.round(x + cw / 2 - 1), Math.round(y + ch / 2 - 1), 2, 2);
        }
      }
    }
    // column numbers under the 0 row and along the bottom, every fifth
    cctx.font = '10px ' + MONO; cctx.fillStyle = mute;
    for (c = 0; c < COLS; c++) {
      if ((c + 1) % 5 === 0 || c === 0) cctx.fillText(String(c + 1), GX + c * cw + cw / 2, GY + GH + 16);
    }
    cctx.textAlign = 'left';
    cctx.font = '600 12px ' + MONO; cctx.fillStyle = ink;
    cctx.fillText('POINTCAST LOOM CARD  B.02', GX, CH - 26);
    cctx.textAlign = 'right';
    cctx.fillText(L.count(card) + ' HOLES', GX + GW, CH - 26);
    // cursor
    if (document.activeElement === cardCv) {
      cctx.strokeStyle = accent; cctx.lineWidth = 3;
      cctx.strokeRect(GX + cursor.c * cw + 1.5, GY + cursor.r * ch + 1.5, cw - 3, ch - 3);
      cctx.globalAlpha = 0.12; cctx.fillStyle = accent;
      cctx.fillRect(GX + cursor.c * cw, GY, cw, GH);
      cctx.globalAlpha = 1;
    }
  }
  function colHasPunch(c) { for (var r = 0; r < ROWS; r++) if (card[L.idx(c, r)]) return true; return false; }

  // ---- cloth drawing ----------------------------------------------------------
  function threadColors() {
    return { w: st.w, wd: K.mix(st.w, '#000000', 0.38), wl: K.mix(st.w, '#ffffff', 0.12), f: st.f, fd: K.mix(st.f, '#000000', 0.3), fl: K.mix(st.f, '#ffffff', 0.1) };
  }
  function opts() { return { ground: st.g, repeat: st.rep, picks: st.pk, ends: 1 }; }
  function drawCloth(ctx, W, H, s) {
    var o = opts(), col = threadColors();
    var nx = Math.ceil(W / s), ny = Math.ceil(H / s);
    var e = Math.max(1, Math.round(s / 6));
    ctx.fillStyle = col.f; ctx.fillRect(0, 0, W, H);
    for (var p = 0; p < ny; p++) {
      for (var en = 0; en < nx; en++) {
        var x = en * s, y = p * s;
        if (L.lift(card, en, p, o)) {
          ctx.fillStyle = col.w; ctx.fillRect(x, y, s, s);
          ctx.fillStyle = col.wd; ctx.fillRect(x, y, e, s); ctx.fillRect(x + s - e, y, e, s);
          ctx.fillStyle = col.wl; ctx.fillRect(x + Math.floor(s / 2) - (e >> 1), y, e, s);
        } else {
          ctx.fillStyle = col.fd; ctx.fillRect(x, y, s, e); ctx.fillRect(x, y + s - e, s, e);
          ctx.fillStyle = col.fl; ctx.fillRect(x, y + Math.floor(s / 2) - (e >> 1), s, e);
        }
      }
    }
  }
  function clothSvg(W, H, s) {
    var o = opts(), col = threadColors();
    var nx = Math.ceil(W / s), ny = Math.ceil(H / s);
    var e = Math.max(1, Math.round(s / 6)), m = Math.floor(s / 2) - (e >> 1);
    var d = [];
    for (var p = 0; p < ny; p++) {
      var en = 0;
      while (en < nx) {
        if (L.lift(card, en, p, o)) {
          var start = en;
          while (en < nx && L.lift(card, en, p, o)) en++;
          d.push('M' + (start * s) + ' ' + (p * s) + 'h' + ((en - start) * s) + 'v' + s + 'h-' + ((en - start) * s) + 'z');
        } else en++;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" shape-rendering="crispEdges">' +
      '<defs>' +
      '<pattern id="weft" width="' + s + '" height="' + s + '" patternUnits="userSpaceOnUse">' +
      '<rect width="' + s + '" height="' + s + '" fill="' + col.f + '"/><rect width="' + s + '" height="' + e + '" fill="' + col.fd + '"/>' +
      '<rect y="' + (s - e) + '" width="' + s + '" height="' + e + '" fill="' + col.fd + '"/><rect y="' + m + '" width="' + s + '" height="' + e + '" fill="' + col.fl + '"/></pattern>' +
      '<pattern id="warp" width="' + s + '" height="' + s + '" patternUnits="userSpaceOnUse">' +
      '<rect width="' + s + '" height="' + s + '" fill="' + col.w + '"/><rect width="' + e + '" height="' + s + '" fill="' + col.wd + '"/>' +
      '<rect x="' + (s - e) + '" width="' + e + '" height="' + s + '" fill="' + col.wd + '"/><rect x="' + m + '" width="' + e + '" height="' + s + '" fill="' + col.wl + '"/></pattern>' +
      '</defs><rect width="' + W + '" height="' + H + '" fill="url(#weft)"/><path fill="url(#warp)" d="' + d.join('') + '"/></svg>';
  }

  function render() {
    drawCard();
    drawCloth(xctx, cloth.width, cloth.height, st.sz);
    var rs = L.repeatSize(opts());
    var reads = L.readCard(card);
    var odd = (reads.match(/\u00b7/g) || []).length;
    $('#reads').textContent = !reads ? 'Card is blank. Tap holes or punch a phrase.'
      : odd > reads.length * 0.3 ? 'Card reads as a pattern, not text (' + L.count(card) + ' holes).' : 'Card reads: ' + reads;
    $('#cap-left').innerHTML = '<b>' + st.g + '</b> · ' + st.rep + ' repeat';
    $('#cap-right').textContent = 'repeat ' + rs.w + ' ends × ' + rs.h + ' picks · ' + L.count(card) + ' holes';
    cloth.setAttribute('aria-label', 'Woven cloth, ' + st.g + ' ground, ' + st.rep + ' repeat, warp ' + st.w + ', weft ' + st.f + (reads ? ', from a card that reads ' + reads : ''));
    toHash();
  }
  var renderSoon = (function () {
    var q = false;
    return function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; render(); }); };
  })();

  // ---- controls -----------------------------------------------------------------
  var pkIn = $('#pk'), szIn = $('#sz'), warpIn = $('#warp'), weftIn = $('#weft');
  var syncPk = K.bindOutput(pkIn), syncSz = K.bindOutput(szIn, function (v) { return v + ' px'; });
  var syncW = K.bindColor(warpIn), syncF = K.bindColor(weftIn);
  PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'kb-swatch'; b.title = p[2];
    b.setAttribute('aria-label', p[2] + ' preset');
    b.innerHTML = '<i style="background:' + p[0] + '"></i><i style="background:' + p[1] + '"></i>';
    b.addEventListener('click', function () { st.w = p[0]; st.f = p[1]; push(); });
    $('#swatches').appendChild(b);
  });
  function push() {
    pkIn.value = st.pk; szIn.value = st.sz; warpIn.value = st.w; weftIn.value = st.f;
    syncPk(); syncSz(); syncW(); syncF();
    K.setRadio('ground', st.g); K.setRadio('rep', st.rep);
    $('#ground-note').textContent = GROUND_NOTES[st.g];
    render();
  }
  K.$all('input[name="ground"]').forEach(function (r) { r.addEventListener('change', function () { st.g = r.value; push(); }); });
  K.$all('input[name="rep"]').forEach(function (r) { r.addEventListener('change', function () { st.rep = r.value; push(); }); });
  pkIn.addEventListener('input', function () { st.pk = +pkIn.value; renderSoon(); });
  szIn.addEventListener('input', function () { st.sz = +szIn.value; renderSoon(); });
  warpIn.addEventListener('input', function () { st.w = warpIn.value; renderSoon(); });
  weftIn.addEventListener('input', function () { st.f = weftIn.value; renderSoon(); });

  function punchPhrase() {
    var res = L.fromPhrase($('#phrase').value);
    card = res.card;
    K.status(res.used ? 'Punched ' + res.used.length + ' columns' : 'Nothing to punch. Try letters or digits.');
    render();
  }
  $('#punch').addEventListener('click', punchPhrase);
  $('#phrase').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); punchPhrase(); } });
  $('#clear').addEventListener('click', function () { card = L.blank(); render(); K.status('Card cleared'); });
  $('#invert').addEventListener('click', function () { for (var i = 0; i < card.length; i++) card[i] = card[i] ? 0 : 1; render(); });
  $('#swap').addEventListener('click', function () { var t = st.w; st.w = st.f; st.f = t; push(); });
  $('#shuffle').addEventListener('click', function () {
    var r = K.rng(K.newSeed());
    var s = L.seeded(r);
    card = s.card;
    $('#phrase').value = s.text || '';
    st.g = L.GROUNDS[Math.floor(r() * 3)];
    st.rep = L.REPEATS[Math.floor(r() * 3)];
    st.pk = 1 + Math.floor(r() * 5);
    st.sz = 5 + Math.floor(r() * 8);
    var p = PRESETS[Math.floor(r() * PRESETS.length)];
    st.w = p[0]; st.f = p[1];
    push();
  });
  $('#copy').addEventListener('click', function () { toHash(); K.copyLink(); });
  $('#png').addEventListener('click', function () { K.downloadCanvas(cloth, 'pointcast-loom-cloth.png'); });
  $('#svg').addEventListener('click', function () { K.downloadSvg(clothSvg(cloth.width, cloth.height, st.sz), 'pointcast-loom-cloth.svg'); });
  $('#cardpng').addEventListener('click', function () { K.downloadCanvas(cardCv, 'pointcast-loom-card.png'); });

  // ---- card input: tap, drag (mouse), keyboard ----------------------------------
  function toCanvas(e) {
    var b = cardCv.getBoundingClientRect();
    return cellAt((e.clientX - b.left) * CW / b.width, (e.clientY - b.top) * CH / b.height);
  }
  function setHole(cell, v) {
    var i = L.idx(cell.c, cell.r);
    if (card[i] === v) return false;
    card[i] = v; return true;
  }
  function announce() {
    var on = card[L.idx(cursor.c, cursor.r)] ? 'punched' : 'blank';
    $('#card-pos').innerHTML = '<b>Col ' + ('0' + (cursor.c + 1)).slice(-2) + '</b> · Row ' + L.ROW_NAMES[cursor.r] + ' · ' + on;
    $('#announce').textContent = 'Column ' + (cursor.c + 1) + ', row ' + L.ROW_NAMES[cursor.r] + ', ' + on;
  }
  var drag = null;
  cardCv.addEventListener('pointerdown', function (e) {
    var cell = toCanvas(e);
    if (!cell) return;
    drag = { x: e.clientX, y: e.clientY, cell: cell, mouse: e.pointerType === 'mouse', value: card[L.idx(cell.c, cell.r)] ? 0 : 1, moved: false };
    if (drag.mouse) { setHole(cell, drag.value); cursor = cell; announce(); renderSoon(); }
  });
  cardCv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
    if (!drag.mouse) return;
    var cell = toCanvas(e);
    if (cell && setHole(cell, drag.value)) { cursor = cell; announce(); renderSoon(); }
  });
  window.addEventListener('pointerup', function () {
    if (drag && !drag.mouse && !drag.moved) { setHole(drag.cell, drag.value); cursor = drag.cell; announce(); renderSoon(); }
    drag = null;
  });
  window.addEventListener('pointercancel', function () { drag = null; });
  cardCv.addEventListener('focus', function () { announce(); drawCard(); });
  cardCv.addEventListener('blur', drawCard);
  cardCv.addEventListener('keydown', function (e) {
    var k = e.key, moved = true;
    if (k === 'ArrowRight') cursor.c = Math.min(COLS - 1, cursor.c + 1);
    else if (k === 'ArrowLeft') cursor.c = Math.max(0, cursor.c - 1);
    else if (k === 'ArrowDown') cursor.r = Math.min(ROWS - 1, cursor.r + 1);
    else if (k === 'ArrowUp') cursor.r = Math.max(0, cursor.r - 1);
    else if (k === 'Home') cursor.c = 0;
    else if (k === 'End') cursor.c = COLS - 1;
    else if (k === ' ' || k === 'Enter') { var i = L.idx(cursor.c, cursor.r); card[i] = card[i] ? 0 : 1; }
    else if (k === 'Delete' || k === 'Backspace') { card[L.idx(cursor.c, cursor.r)] = 0; }
    else moved = false;
    if (!moved) return;
    e.preventDefault();
    announce(); render();
    // keep the cursor visible inside the scrolling card
    var wrap = cardCv.parentNode, b = cardCv.getBoundingClientRect();
    var cx = (GX + cursor.c * cw) * b.width / CW;
    if (cx < wrap.scrollLeft + 20 || cx > wrap.scrollLeft + wrap.clientWidth - 40) wrap.scrollLeft = cx - wrap.clientWidth / 2;
  });

  window.addEventListener('hashchange', function () { st = fromHash(); push(); });
  st = fromHash();
  push();
})();
