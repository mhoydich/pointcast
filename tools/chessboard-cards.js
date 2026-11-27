// 20 cards: the king's chessboard and what compounds in noun town. Works in node and in the browser.
// CARDS(i) -> {svg, nouns:[{k,x,y,px,bg}]}
var BOARD = (function () {
  var W = 1200, H = 675, ink = '#1f1a17', paper = '#f4e4c1', red = '#e9573f', blu = '#19b5c9', yel = '#f4e04d', grn = '#7bd389', pnk = '#f6c1d0';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function T(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-family="monospace" font-weight="' + (o.b ? 'bold' : 'normal') + '" font-size="' + (o.s || 26) + '" fill="' + (o.c || ink) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + '>' + esc(s) + '</text>'; }
  function L(x, y, arr, o) { o = o || {}; var s = ''; for (var i = 0; i < arr.length; i++) s += T(x, y + i * (o.lh || 40), arr[i], o); return s; }
  function frame(bg, n, part, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="' + bg + '"/>' +
      '<rect x="16" y="16" width="' + (W - 32) + '" height="' + (H - 32) + '" fill="none" stroke="' + ink + '" stroke-width="6"/>' + body +
      T(40, H - 34, 'THE KING\'S CHESSBOARD · ' + part + ' · ' + n + '/20 · NOUN TOWN · CC0', { s: 17 }) + '</svg>';
  }
  function head(t, sub) { return T(60, 104, t, { b: 1, s: 50 }) + (sub ? T(60, 146, sub, { s: 22, c: red, b: 1 }) : ''); }
  // chessboard: fills = function(i) -> color or null, labels = function(i) -> text
  function board(x, y, cell, fill, label) {
    var s = '';
    for (var i = 0; i < 64; i++) {
      var r = Math.floor(i / 8), c = i % 8;
      var base = (r + c) % 2 ? '#c9b48f' : '#efe2c4';
      var f = fill ? fill(i) : null;
      s += '<rect x="' + (x + c * cell) + '" y="' + (y + r * cell) + '" width="' + cell + '" height="' + cell + '" fill="' + (f || base) + '" stroke="' + ink + '" stroke-width="1.5"/>';
      var lb = label ? label(i) : '';
      if (lb) s += T(x + c * cell + cell / 2, y + r * cell + cell / 2 + 6, lb, { s: Math.min(18, cell / 3), a: 'middle', b: 1 });
    }
    return s + '<rect x="' + x + '" y="' + y + '" width="' + cell * 8 + '" height="' + cell * 8 + '" fill="none" stroke="' + ink + '" stroke-width="5"/>';
  }
  function bars(x, y, rows, max, w) {
    var s = '';
    for (var i = 0; i < rows.length; i++) {
      var bw = Math.max(4, rows[i][1] / max * w);
      s += T(x, y + i * 70 + 30, rows[i][0], { s: 22, b: 1 }) + '<rect x="' + (x + 330) + '" y="' + (y + i * 70) + '" width="' + bw + '" height="42" fill="' + rows[i][2] + '" stroke="' + ink + '" stroke-width="3"/>' + T(x + 340 + bw, y + i * 70 + 30, rows[i][3], { s: 22 });
    }
    return s;
  }
  var P1 = 'PART 1 · DOUBLING', P2 = 'PART 2 · HABITS', P3 = 'PART 3 · CONVERSATION', P4 = 'PART 4 · WHAT COMPOUNDS', P5 = 'PART 5 · IF';
  var cards = [
    // ---------- part 1: the legend ----------
    function () { return { svg: frame(paper, 1, P1, T(470, 150, 'AN OLD STORY', { s: 24, c: red, b: 1 }) + L(470, 240, ['ONE GRAIN', 'OF RICE'], { b: 1, s: 80, lh: 90 }) + L(470, 440, ['a king offers the inventor of chess', 'any reward. the inventor asks for', 'rice: one grain on the first square,', 'double it on each square after.'], { s: 24, lh: 36 })), nouns: [{ k: '007', x: 60, y: 140, px: 370, bg: 'efe2c4' }] }; },
    function () { var v = [1, 2, 4, 8, 16, 32, 64, 128]; return { svg: frame(paper, 2, P1, head('THE FIRST ROW', 'the king laughs. it looks like nothing.') + board(60, 190, 52, function (i) { return i < 8 ? yel : null; }, function (i) { return i < 8 ? String(v[i]) : ''; }) + L(560, 260, ['square 1: 1 grain', 'square 2: 2', 'square 3: 4', '...', 'square 8: 128', '', 'the whole first row:', '255 grains. a spoonful.'], { s: 26, lh: 40 })), nouns: [] }; },
    function () { return { svg: frame(paper, 3, P1, head('HALFWAY', 'squares 1 to 32') + board(60, 190, 52, function (i) { return i < 32 ? yel : null; }) + L(560, 260, ['by the end of square 32:', '4,294,967,295 grains.', '', 'about four billion grains,', 'over a hundred tons of rice.', 'the king stops laughing.'], { s: 26, lh: 40 })), nouns: [] }; },
    function () { return { svg: frame(yel, 4, P1, head('ALL 64 SQUARES', 'the second half is where it happens') + board(60, 190, 52, function (i) { return i < 32 ? '#f9e9a0' : red; }) + L(560, 260, ['2^64 − 1 grains:', '18,446,744,073,709,551,615.', '', 'hundreds of years of', 'the whole world\'s rice harvest.', '', 'same rule on every square.', 'the rule didn\'t change. time did.'], { s: 24, lh: 38 })), nouns: [] }; },
    // ---------- part 2: habits ----------
    function () { return { svg: frame(paper, 5, P2, head('1% A DAY', 'the same math, applied to a person') + bars(60, 230, [['1% better a day', 37.8, grn, '1.01^365 ≈ 37.8×'], ['the same, every day', 1, '#c9b48f', '1×'], ['1% worse a day', 0.026, red, '0.99^365 ≈ 0.03×']], 37.8, 520) + T(60, 500, 'over one year. small steps, same direction, every day.', { s: 22 })), nouns: [] }; },
    function () {
      var kept = [4, 5, 1, 6], s = '';
      for (var b = 0; b < 4; b++) {
        var x = 60 + b * 280; s += '<rect x="' + x + '" y="200" width="240" height="300" fill="#fff" stroke="' + ink + '" stroke-width="4"/>' + T(x + 20, 240, 'BLOCK ' + b, { b: 1, s: 26 }) + T(x + 20, 272, ['nov 22', 'nov 23', 'nov 24', 'nov 25'][b], { s: 20 });
        for (var h = 0; h < 6; h++) s += '<circle cx="' + (x + 40 + (h % 3) * 80) + '" cy="' + (330 + Math.floor(h / 3) * 60) + '" r="20" fill="' + (h < kept[b] ? grn : 'none') + '" stroke="' + ink + '" stroke-width="3"/>';
        s += T(x + 20, 480, kept[b] + ' of 6 kept', { s: 20, b: 1 });
        if (b < 3) s += '<line x1="' + (x + 240) + '" y1="350" x2="' + (x + 280) + '" y2="350" stroke="' + red + '" stroke-width="6"/>';
      }
      return { svg: frame(paper, 6, P2, head('NOUNS WAVE', 'our habit chain: one block a day, six habits') + s + T(60, 560, 'draw · mint · post · gift · note · ship. each block holds the last block\'s hash.', { s: 20 })), nouns: [] };
    },
    function () { return { svg: frame(paper, 7, P2, head('THE HASH DRAWS THE NOUN', 'the day\'s record picks the day\'s face') + L(60, 230, ['seal the day\'s habits.', 'hash it with yesterday\'s hash.', 'the hash picks a head, body,', 'glasses and accessory from the', 'official cc0 nouns traits.', '', 'you can\'t fake a day without', 'changing every day after it.'], { s: 26, lh: 40 })), nouns: [{ k: 'tok', x: 780, y: 200, px: 340, bg: '041208' }] }; },
    function () { return { svg: frame(grn, 8, P2, T(60, 110, 'THE RULE', { s: 24, b: 1 }) + L(60, 230, ['NEVER MISS TWICE.', 'A BAD DAY IS A SQUARE.', 'A STREAK IS A BOARD.'], { b: 1, s: 56, lh: 72 })), nouns: [{ k: '004', x: 920, y: 380, px: 210, bg: 'cfe8f0' }] }; },
    // ---------- part 3: conversation ----------
    function () {
      var s = '', items = ['question', 'grok answers', 'grade it', 'new picture', 'new question'];
      for (var i = 0; i < 5; i++) { var x = 60 + i * 225; s += '<rect x="' + x + '" y="260" width="190" height="90" rx="14" fill="#fff" stroke="' + ink + '" stroke-width="4"/>' + T(x + 95, 314, items[i], { s: 20, a: 'middle', b: 1 }); if (i < 4) s += '<line x1="' + (x + 190) + '" y1="305" x2="' + (x + 225) + '" y2="305" stroke="' + red + '" stroke-width="6"/>'; }
      return { svg: frame(paper, 9, P3, head('A REPLY CHAIN', 'every answer is a link, every link is a square') + s + T(60, 450, 'one-number questions about a picture. grok answers in about a minute.', { s: 22 }) + T(60, 490, 'wrong answers count too: the miss is the lesson.', { s: 22 })), nouns: [] };
    },
    function () {
      var s = ''; for (var i = 0; i < 51; i++) s += '<rect x="' + (60 + (i % 17) * 64) + '" y="' + (220 + Math.floor(i / 17) * 64) + '" width="52" height="52" fill="' + [blu, red, yel, grn, pnk][Math.floor(i / 11) % 5] + '" stroke="' + ink + '" stroke-width="3"/>';
      return { svg: frame(paper, 10, P3, head('51 LINKS IN ONE DAY', 'wed nov 25: a brewer to a box of floppies') + s + T(60, 470, 'three award cards on the way: links 10, 25, 50.', { s: 22 }) + T(60, 510, 'fri nov 27: the roll call chain hit 10 before 10am pacific.', { s: 22 })), nouns: [] };
    },
    function () { return { svg: frame(paper, 11, P3, head('WHAT THE FEED REWARDS', 'x\'s ranking code, open-sourced in 2023') + bars(60, 210, [['a like', 0.5, '#c9b48f', '0.5'], ['a repost', 1, '#c9b48f', '1'], ['a reply', 13.5, blu, '13.5'], ['answered reply', 75, red, '75']], 75, 560) + T(60, 520, 'answered reply = a reply the author answers back. weights from that version; may have changed.', { s: 18 })), nouns: [] }; },
    function () { return { svg: frame(blu, 12, P3, T(60, 110, 'THE LESSON', { s: 24, b: 1 }) + L(60, 230, ['A CONVERSATION', 'TRAVELS FURTHER', 'THAN A LIKE.'], { b: 1, s: 60, lh: 76 })), nouns: [{ k: '001', x: 920, y: 380, px: 210, bg: 'cfe8f0' }] }; },
    // ---------- part 4: what compounds ----------
    function () {
      var s = '', st = ['a noun', 'a card', 'a mint', 'a gift', 'a holder', 'a reply'];
      for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3, x = 600 + Math.cos(a) * 200, y = 370 + Math.sin(a) * 170; s += '<circle cx="' + x + '" cy="' + y + '" r="62" fill="#fff" stroke="' + ink + '" stroke-width="4"/>' + T(x, y + 8, st[i], { s: 22, a: 'middle', b: 1 }); }
      s += '<circle cx="600" cy="370" r="200" fill="none" stroke="' + red + '" stroke-width="5" stroke-dasharray="14 10"/>';
      return { svg: frame(paper, 13, P4, head('THE LOOP', 'each thing becomes the next thing') + s), nouns: [] };
    },
    function () {
      var s = ''; var ks = ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013'];
      var nouns = ks.map(function (k, i) { return { k: k, x: 60 + (i % 7) * 156, y: 190 + Math.floor(i / 7) * 170, px: 130, bg: 'efe2c4' }; });
      return { svg: frame(paper, 14, P4, head('THE TOWN', 'one resident a day: 13 so far') + T(60, 560, 'plane spotter to the library. every one a whole noun, cc0.', { s: 22 })), nouns: nouns };
    },
    function () { return { svg: frame(paper, 15, P4, head('THE RECORD', 'everything leaves a receipt') + L(60, 230, ['13 residents in noun town', '13 lessons at noun school', '4 blocks on the habit chain', '2 reply chains, 62 links', '4 chain award cards', '', 'all cc0. all public. all dated.'], { s: 28, lh: 44 })), nouns: [{ k: '012', x: 880, y: 220, px: 250, bg: 'efe2c4' }] }; },
    function () { return { svg: frame(yel, 16, P4, T(60, 110, 'THE LESSON', { s: 24, b: 1 }) + L(60, 230, ['DON\'T COUNT THE GRAINS.', 'COUNT THE SQUARES', 'YOU SHOWED UP FOR.'], { b: 1, s: 56, lh: 72 })), nouns: [{ k: '006', x: 920, y: 380, px: 210, bg: 'efe2c4' }] }; },
    // ---------- part 5: if ----------
    function () { return { svg: frame(paper, 17, P5, head('WHAT ADDS', 'one a day, every day') + bars(60, 230, [['after 1 week', 7, grn, '7 residents'], ['after 1 month', 30, grn, '30'], ['after 1 year', 365, grn, '365']], 365, 560) + T(60, 480, 'a straight line. steady, and it never surprises you.', { s: 22 })), nouns: [] }; },
    function () { return { svg: frame(paper, 18, P5, head('WHAT MULTIPLIES', 'when each step makes the next step easier') + L(60, 230, ['a holder replies → a new question', 'a question → grok answers → a link', 'a link → an award → more holders', '', 'if each round brought in just one', 'more person than the last, the curve', 'bends like the chessboard, not the ruler.'], { s: 26, lh: 40 })), nouns: [] }; },
    function () {
      var s = '<line x1="100" y1="520" x2="1100" y2="520" stroke="' + ink + '" stroke-width="4"/><line x1="100" y1="520" x2="100" y2="190" stroke="' + ink + '" stroke-width="4"/>', a = '', b = '';
      for (var d = 0; d <= 20; d++) { var x = 100 + d * 50; a += (d ? ' L' : 'M') + x + ',' + (520 - d * 15); b += (d ? ' L' : 'M') + x + ',' + Math.max(190, 520 - (Math.pow(1.27, d) - 1) * 3); }
      s += '<path d="' + a + '" fill="none" stroke="' + grn + '" stroke-width="6"/><path d="' + b + '" fill="none" stroke="' + red + '" stroke-width="6"/>' + T(820, 230, 'multiplies', { s: 22, c: red, b: 1 }) + T(1010, 250, 'adds', { s: 22, c: '#3b8a4a', b: 1 });
      return { svg: frame(paper, 19, P5, head('ADDS VS MULTIPLIES', 'an illustration, not a forecast') + s + T(100, 560, 'early on they look the same. that\'s the trap, and the point.', { s: 20 })), nouns: [] };
    },
    function () { return { svg: frame(red, 20, P5, T(60, 110, 'THE BOARD', { s: 24, b: 1, c: paper }) + L(60, 230, ['SMALL. DAILY.', 'ON THE RECORD.', 'SQUARE BY SQUARE.'], { b: 1, s: 64, lh: 80, c: paper }) + T(60, 520, 'noun town · noun school · nouns wave · el segundo', { s: 22, c: paper })), nouns: [{ k: 'tok', x: 900, y: 360, px: 220, bg: '041208' }] }; }
  ];
  return { W: W, H: H, n: cards.length, card: function (i) { return cards[i](); } };
})();
if (typeof module !== 'undefined') module.exports = BOARD;
