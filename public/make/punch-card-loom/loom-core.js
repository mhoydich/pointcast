/* Punch-card loom: pure card and weave logic. No DOM, so node tests can load it.
   An 80-column, 12-row card. Each card row lifts warp ends for a run of picks, like a
   Jacquard card lifting hooks. Characters punch with the Hollerith code used on keypunch cards. */
(function (root) {
  'use strict';
  var COLS = 80, ROWS = 12;
  // top to bottom, as printed on a card
  var ROW_NAMES = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  function r(name) { return ROW_NAMES.indexOf(String(name)); }

  // Hollerith zone + digit punches
  var CODE = {};
  (function build() {
    var i;
    for (i = 0; i <= 9; i++) CODE[String(i)] = [String(i)];
    'ABCDEFGHI'.split('').forEach(function (c, k) { CODE[c] = ['12', String(k + 1)]; });
    'JKLMNOPQR'.split('').forEach(function (c, k) { CODE[c] = ['11', String(k + 1)]; });
    'STUVWXYZ'.split('').forEach(function (c, k) { CODE[c] = ['0', String(k + 2)]; });
    var extra = {
      ' ': [], '&': ['12'], '-': ['11'], '/': ['0', '1'],
      '.': ['12', '3', '8'], '<': ['12', '4', '8'], '(': ['12', '5', '8'], '+': ['12', '6', '8'], '|': ['12', '7', '8'],
      '!': ['11', '2', '8'], '$': ['11', '3', '8'], '*': ['11', '4', '8'], ')': ['11', '5', '8'], ';': ['11', '6', '8'],
      ',': ['0', '3', '8'], '%': ['0', '4', '8'], '_': ['0', '5', '8'], '>': ['0', '6', '8'], '?': ['0', '7', '8'],
      ':': ['2', '8'], '#': ['3', '8'], '@': ['4', '8'], "'": ['5', '8'], '=': ['6', '8'], '"': ['7', '8']
    };
    Object.keys(extra).forEach(function (k) { CODE[k] = extra[k]; });
  })();

  function blank() { return new Uint8Array(COLS * ROWS); }
  function idx(col, row) { return col * ROWS + row; }

  function punchesFor(ch) {
    var c = String(ch).toUpperCase();
    return CODE.hasOwnProperty(c) ? CODE[c].map(r) : null;
  }
  // Returns { card, used } where used is the text actually punched (unknown characters skipped).
  function fromPhrase(text) {
    var card = blank(), used = '', col = 0;
    var s = String(text || '');
    for (var i = 0; i < s.length && col < COLS; i++) {
      var p = punchesFor(s[i]);
      if (!p) continue;
      for (var k = 0; k < p.length; k++) card[idx(col, p[k])] = 1;
      used += s[i].toUpperCase();
      col++;
    }
    return { card: card, used: used };
  }
  // Read a column back as a character (or '' when the punches match none).
  var DECODE = {};
  Object.keys(CODE).forEach(function (c) { DECODE[CODE[c].map(r).sort(function (a, b) { return a - b; }).join(',')] = c; });
  function readColumn(card, col) {
    var p = [];
    for (var row = 0; row < ROWS; row++) if (card[idx(col, row)]) p.push(row);
    var k = p.join(',');
    return DECODE.hasOwnProperty(k) ? DECODE[k] : '·';
  }
  function readCard(card) {
    var s = '';
    for (var c = 0; c < COLS; c++) s += readColumn(card, c);
    return s.replace(/[ ·]+$/, '');
  }

  // 3 hex digits per column, trailing blank columns dropped.
  function encode(card) {
    var out = '';
    for (var c = 0; c < COLS; c++) {
      var v = 0;
      for (var row = 0; row < ROWS; row++) if (card[idx(c, row)]) v |= 1 << (ROWS - 1 - row);
      out += ('00' + v.toString(16)).slice(-3);
    }
    return out.replace(/(000)+$/, '');
  }
  function decode(hex) {
    var card = blank();
    hex = String(hex || '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, COLS * 3);
    for (var c = 0; c * 3 < hex.length; c++) {
      var v = parseInt(hex.slice(c * 3, c * 3 + 3), 16) || 0;
      for (var row = 0; row < ROWS; row++) if (v & (1 << (ROWS - 1 - row))) card[idx(c, row)] = 1;
    }
    return card;
  }
  function count(card) { var n = 0; for (var i = 0; i < card.length; i++) n += card[i]; return n; }

  // ---- seeded cards -----------------------------------------------------------
  var PHRASES = [
    'WARP AND WEFT', 'THE CARD IS THE CLOTH', 'TWELVE ROWS, EIGHTY COLUMNS', 'HELLO FROM THE LOOM',
    'DO NOT FOLD OR SPINDLE', 'POINTCAST LOOM 01', 'ONE HOLE, ONE LIFT', 'THREAD COUNT 80',
    'PATTERN = PROGRAM', 'SHUTTLE / BEAT / REPEAT', 'SOFT GOODS, HARD CODE', 'LOOM.EXE'
  ];
  function seeded(rand) {
    var mode = Math.floor(rand() * 4);
    var card = blank(), c, row;
    if (mode === 0) {
      var ph = PHRASES[Math.floor(rand() * PHRASES.length)];
      var reps = 1 + Math.floor(rand() * 3), s = '';
      while (s.length < COLS && reps-- > 0) s += (s ? '  ' : '') + ph;
      return { card: fromPhrase(s).card, kind: 'phrase', text: s.slice(0, COLS) };
    }
    if (mode === 1) { // diamonds from triangle waves
      var p = 6 + Math.floor(rand() * 10), off = Math.floor(rand() * p), th = 1 + Math.floor(rand() * 3);
      for (c = 0; c < COLS; c++) {
        var tri = Math.abs(((c + off) % (2 * p)) - p) / p * (ROWS - 1);
        for (row = 0; row < ROWS; row++) {
          if (Math.abs(row - tri) < th || Math.abs((ROWS - 1 - row) - tri) < th) card[idx(c, row)] = 1;
        }
      }
      return { card: card, kind: 'diamond' };
    }
    if (mode === 2) { // stepped twill lines
      var step = 1 + Math.floor(rand() * 3), width = 2 + Math.floor(rand() * 4), gap = width + 2 + Math.floor(rand() * 6);
      for (c = 0; c < COLS; c++) for (row = 0; row < ROWS; row++) {
        if (((c + row * step) % gap) < width) card[idx(c, row)] = 1;
      }
      return { card: card, kind: 'twill' };
    }
    // mode 3: mirrored random motif, like a border band
    var half = 4 + Math.floor(rand() * 8), dens = 0.3 + rand() * 0.25;
    var motif = [];
    for (c = 0; c < half; c++) { motif.push([]); for (row = 0; row < ROWS / 2; row++) motif[c].push(rand() < dens ? 1 : 0); }
    for (c = 0; c < COLS; c++) {
      var m = c % (half * 2), mc = m < half ? m : half * 2 - 1 - m;
      for (row = 0; row < ROWS; row++) {
        var mr = row < ROWS / 2 ? row : ROWS - 1 - row;
        if (motif[mc][mr]) card[idx(c, row)] = 1;
      }
    }
    return { card: card, kind: 'motif' };
  }

  // ---- weave --------------------------------------------------------------------
  var GROUNDS = ['float', 'damask', 'twill'];
  var REPEATS = ['straight', 'mirror', 'drop'];
  // Size of one repeat in ends (columns) x picks.
  function repeatSize(opt) {
    var pk = opt.picks || 1, ex = opt.ends || 1;
    var w = COLS * ex, h = ROWS * pk;
    if (opt.repeat === 'mirror') { w = (COLS * 2 - 2) * ex; h = (ROWS * 2 - 2) * pk; }
    if (opt.repeat === 'drop') { w = COLS * ex * 2; }
    return { w: w, h: h };
  }
  // Is the card hole at this end/pick punched? (true = figure)
  function figureAt(card, end, pick, opt) {
    var pk = opt.picks || 1, ex = opt.ends || 1;
    var e = Math.floor(end / ex), p = Math.floor(pick / pk);
    var col, row;
    if (opt.repeat === 'mirror') {
      var cw = COLS * 2 - 2, rh = ROWS * 2 - 2;
      col = e % cw; if (col >= COLS) col = cw - col;
      row = p % rh; if (row >= ROWS) row = rh - row;
    } else if (opt.repeat === 'drop') {
      var block = Math.floor(e / COLS);
      col = e % COLS;
      row = (p + (block & 1) * (ROWS / 2)) % ROWS;
    } else {
      col = e % COLS; row = p % ROWS;
    }
    return card[idx(col, row)] === 1;
  }
  // Is the warp end lifted over the weft at this crossing? (true = warp shows)
  function lift(card, end, pick, opt) {
    var f = figureAt(card, end, pick, opt);
    var g = opt.ground || 'float';
    if (g === 'damask') { // 5-end satin: warp-faced figure on a weft-faced ground
      var tie = ((end * 2 + pick) % 5) === 0;
      return f ? !tie : tie;
    }
    if (g === 'twill') { // 3/1 twill figure on a 1/3 twill ground
      var t = ((end + pick) % 4) === 0;
      return f ? !t : t;
    }
    return f;
  }

  root.LoomCore = {
    COLS: COLS, ROWS: ROWS, ROW_NAMES: ROW_NAMES, CODE: CODE, GROUNDS: GROUNDS, REPEATS: REPEATS, PHRASES: PHRASES,
    blank: blank, idx: idx, punchesFor: punchesFor, fromPhrase: fromPhrase, readColumn: readColumn, readCard: readCard,
    encode: encode, decode: decode, count: count, seeded: seeded, repeatSize: repeatSize, figureAt: figureAt, lift: lift
  };
})(typeof window !== 'undefined' ? window : globalThis);
