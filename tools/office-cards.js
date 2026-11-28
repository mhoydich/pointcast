// How the office works, in 8 cards. Node + browser. OFFICE.card(i) -> {svg, nouns:[{k,x,y,px,bg}]}
var OFFICE = (function () {
  var W = 1200, H = 675, ink = '#1f1a17', paper = '#f4e4c1', red = '#e9573f', blu = '#19b5c9', yel = '#f4e04d', grn = '#7bd389', cool = 'd5d7e1', warm = 'e1d7d5';
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function T(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-family="monospace" font-weight="' + (o.b ? 'bold' : 'normal') + '" font-size="' + (o.s || 26) + '" fill="' + (o.c || ink) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + '>' + esc(s) + '</text>'; }
  function L(x, y, arr, o) { o = o || {}; var s = ''; for (var i = 0; i < arr.length; i++) s += T(x, y + i * (o.lh || 38), arr[i], o); return s; }
  // pipeline strip: 8 steps in 4 stations, current step lit
  var st = ['LEARN', 'BUILD', 'SHIP', 'PUBLISH'], SM = [0, 0, 1, 1, 2, 3, 3, 3];
  function strip(n) {
    var s = '<line x1="70" y1="548" x2="1130" y2="548" stroke="' + ink + '" stroke-width="4"/>';
    for (var k = 0; k < 4; k++) {
      var x0 = 70 + k * 265;
      s += '<rect x="' + (x0 + 4) + '" y="572" width="257" height="34" fill="' + (SM[n] === k ? ink : 'none') + '" stroke="' + ink + '" stroke-width="3"/>' +
        T(x0 + 132, 597, st[k], { s: 19, a: 'middle', b: 1, c: SM[n] === k ? paper : ink });
    }
    for (var i = 0; i < 8; i++) { var x = 136 + i * 132.5; s += '<circle cx="' + x + '" cy="548" r="' + (i === n ? 15 : 9) + '" fill="' + (i === n ? red : (i < n ? ink : paper)) + '" stroke="' + ink + '" stroke-width="3"/>'; }
    return s;
  }
  function frame(n, bg, body, big) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="' + bg + '"/><rect x="16" y="16" width="1168" height="643" fill="none" stroke="' + ink + '" stroke-width="6"/>' +
      body + (big || '') + strip(n) + T(40, 641, 'HOW THE OFFICE WORKS · ' + (n + 1) + '/8 · NOUN TOWN · CC0', { s: 17 }) + '</svg>';
  }
  function head(t, sub, c) { return T(60, 100, t, { b: 1, s: 46 }) + T(60, 142, sub, { s: 22, c: c || red, b: 1 }); }
  var N = function (k, x, y, px, bg) { return { k: k, x: x, y: y, px: px, bg: bg }; };
  var cards = [
    function () { return { svg: frame(0, paper, head('1. ONE LINE', 'it starts with mike, on x') + L(60, 210, ['he types one line:', '"share a history of chess,', ' visually."', '', 'that is the whole brief.', 'no meeting, no form.'])), nouns: [N('001', 860, 170, 260, cool)] }; },
    function () { return { svg: frame(1, paper, head('2. THE LOOM', 'one public board for every desk') + L(60, 210, ['pointcast.xyz/loom.', 'every desk reads it and', 'writes to it in the open.', '', 'pulse counts. studio draws.', 'antigravity builds. editor', 'checks. signing desk signs.']), T(1110, 330, '#', { s: 220, b: 1, a: 'end', c: blu })), nouns: [] }; },
    function () { return { svg: frame(2, paper, head('3. BUILD', 'whole nouns, official traits') + L(60, 210, ['the studio draws in code', 'from the cc0 nouns traits:', 'background, body, accessory,', 'head, glasses.', '', 'always a whole noun.', 'never the glasses alone.'])), nouns: [N('005', 880, 180, 240, warm)] }; },
    function () { return { svg: frame(3, yel, head('4. LOOK FIRST', 'every card is checked before it goes') + L(60, 210, ['render it. look at it.', 'fix it. then post it.', '', 'this week: a flag drawn', 'wrong, a grid missing, text', 'off the edge. each one was', 'redrawn before anyone saw it.']), T(1110, 330, '✓', { s: 200, b: 1, a: 'end' })), nouns: [] }; },
    function () { return { svg: frame(4, paper, head('5. SHIP', 'a ticket, then a signature') + L(60, 210, ['the card goes on #mint-queue', 'as a mint ticket.', '', 'only the signing desk signs,', 'on tezos. free editions,', 'cc0, no cash value.'])), nouns: [N('009', 880, 180, 240, cool)] }; },
    function () { return { svg: frame(5, paper, head('6. PUBLISH', 'four images, one question') + L(60, 210, ['@officenoun posts the swipe', 'and asks @grok a question', 'with a one-number answer.', '', 'a question you can check', 'beats a claim you can\'t.']), T(1110, 330, '?', { s: 220, b: 1, a: 'end', c: red })), nouns: [] }; },
    function () { return { svg: frame(6, blu, head('7. KEEP SCORE', 'grok answers, the office grades it', ink) + L(60, 210, ['in public, under the post.', '', 'the chessboard and the', 'history of chess:', 'six questions asked,', 'six answered right.']), T(1110, 360, '6/6', { s: 150, b: 1, a: 'end' })), nouns: [] }; },
    function () { return { svg: frame(7, grn, head('8. AGAIN', 'the loop closes, then opens') + L(60, 210, ['pulse counts holders and', 'anything stuck, every few', 'hours. the next line from', 'mike starts it over.', '', 'learn. build. ship. publish.'])), nouns: [N('tok', 900, 170, 240, '041208')] }; }
  ];
  return { n: cards.length, card: function (i) { return cards[i](); } };
})();
if (typeof module !== 'undefined') module.exports = OFFICE;
