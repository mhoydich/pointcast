// A history of chess in 8 cards. Works in node and the browser. HIST.card(i) -> {svg, nouns:[{k,x,y,px,bg}]}
var HIST = (function () {
  var W = 1200, H = 675, ink = '#1f1a17', paper = '#f4e4c1', red = '#e9573f', blu = '#19b5c9', yel = '#f4e04d', grn = '#7bd389';
  var G = 'DejaVu Sans, Segoe UI Symbol, Apple Symbols, Noto Sans Symbols2, sans-serif';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function T(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-family="' + (o.f || 'monospace') + '" font-weight="' + (o.b ? 'bold' : 'normal') + '" font-size="' + (o.s || 26) + '" fill="' + (o.c || ink) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + '>' + esc(s) + '</text>'; }
  function L(x, y, arr, o) { o = o || {}; var s = ''; for (var i = 0; i < arr.length; i++) s += T(x, y + i * (o.lh || 38), arr[i], o); return s; }
  // timeline strip along the bottom, with the current era lit
  var eras = ['~600', '~700', '~1000', '~1475', '1849', '1886', '1997', 'now'];
  function strip(n) {
    var s = '<line x1="70" y1="560" x2="1130" y2="560" stroke="' + ink + '" stroke-width="4"/>';
    for (var i = 0; i < 8; i++) { var x = 90 + i * 145; s += '<circle cx="' + x + '" cy="560" r="' + (i === n ? 15 : 9) + '" fill="' + (i === n ? red : (i < n ? ink : paper)) + '" stroke="' + ink + '" stroke-width="3"/>' + T(x, 598, eras[i], { s: 18, a: 'middle', b: i === n }); }
    return s;
  }
  function frame(n, bg, body, pieces) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="' + bg + '"/><rect x="16" y="16" width="1168" height="643" fill="none" stroke="' + ink + '" stroke-width="6"/>' +
      body + (pieces ? T(1130, 300, pieces, { f: G, s: 150, a: 'end' }) : '') + strip(n) +
      T(40, 641, 'A HISTORY OF CHESS · ' + (n + 1) + '/8 · NOUN TOWN · CC0', { s: 17 }) + '</svg>';
  }
  function head(t, sub) { return T(60, 100, t, { b: 1, s: 46 }) + T(60, 142, sub, { s: 22, c: red, b: 1 }); }
  var cards = [
    function () { return { svg: frame(0, paper, head('INDIA, AROUND 600 AD', 'chaturanga: a battle on 64 squares') + L(60, 210, ['the four arms of an army:', 'foot soldiers, horses,', 'elephants, chariots.', '', 'they become pawn, knight,', 'bishop and rook.'], { s: 26 }), '♙♘♗♖'), nouns: [] }; },
    function () { return { svg: frame(1, paper, head('PERSIA', 'shatranj, by the 600s') + L(60, 210, ['the game travels west.', 'the king is the shah.', '', 'when he has no way out:', '"shah mat".', 'the king is helpless.', 'that\'s where checkmate comes from.'], { s: 26 }), '♔'), nouns: [] }; },
    function () { return { svg: frame(2, paper, head('ACROSS THE ISLAMIC WORLD', 'into spain and italy by around 1000') + L(60, 210, ['traders and scholars carry it', 'from baghdad to cordoba.', '', 'in 1256 ibn khallikan writes', 'down a story about the board:', 'one grain of rice on square one,', 'doubled on every square after.'], { s: 25, lh: 36 }), '♖'), nouns: [] }; },
    function () { return { svg: frame(3, yel, head('SPAIN, AROUND 1475', 'the queen gets her long move') + L(60, 210, ['the old counselor piece could', 'step one square. now she', 'crosses the whole board.', '', 'the game gets fast. in 1497', 'lucena prints a book on it.', 'the modern game begins.'], { s: 26 }), '♕'), nouns: [] }; },
    function () { return { svg: frame(4, paper, head('LONDON, 1849 TO 1851', 'one set of pieces, one tournament') + L(60, 210, ['1849: the staunton design.', 'the pieces everyone pictures', 'today.', '', '1851: the first international', 'tournament, in london.', 'adolf anderssen wins.'], { s: 26 }), '♔♕'), nouns: [] }; },
    function () { return { svg: frame(5, paper, head('1886', 'the first world championship') + L(60, 210, ['wilhelm steinitz', 'beats johannes zukertort', 'in a match across three', 'american cities.', '', 'chess gets a champion,', 'and a line of them after.'], { s: 26 }), '♚'), nouns: [] }; },
    function () { return { svg: frame(6, blu, T(60, 100, '1997', { b: 1, s: 46 }) + T(60, 142, 'a machine wins a match', { s: 22, b: 1 }) + L(60, 210, ['ibm\'s deep blue beats', 'world champion garry kasparov,', '3.5 to 2.5 over six games.', '', '2017: alphazero learns chess', 'from the rules alone,', 'playing itself.'], { s: 26 }), '♞'), nouns: [] }; },
    function () { return { svg: frame(7, grn, head('NOW', 'same board, 1,400 years later') + L(60, 210, ['64 squares the whole time.', 'the pieces changed names,', 'the queen got faster,', 'the players became machines', 'and back again.', '', 'the board never changed.'], { s: 26 })), nouns: [{ k: 'tok', x: 900, y: 170, px: 240, bg: '041208' }] }; }
  ];
  return { n: cards.length, card: function (i) { return cards[i](); } };
})();
if (typeof module !== 'undefined') module.exports = HIST;
