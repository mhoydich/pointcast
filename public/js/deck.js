// /deck: Back/Next buttons, dots and arrow keys for the swipe cards.
// The cards scroll and snap with CSS alone; this only helps. Stores nothing, sends nothing.
(function () {
  'use strict';
  var deck = document.getElementById('deck');
  if (!deck) return;
  var cards = Array.prototype.slice.call(deck.children);
  var prev = document.getElementById('deck-prev');
  var next = document.getElementById('deck-next');
  var dots = document.getElementById('deck-dots');
  if (!cards.length || !prev || !next || !dots) return;
  var smooth = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function offset(card) { return card.offsetLeft - cards[0].offsetLeft; }
  function current() {
    var x = deck.scrollLeft, best = 0, gap = Infinity;
    cards.forEach(function (c, i) { var d = Math.abs(offset(c) - x); if (d < gap) { gap = d; best = i; } });
    if (deck.scrollLeft + deck.clientWidth >= deck.scrollWidth - 4) best = cards.length - 1;
    return best;
  }
  function go(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    deck.scrollTo({ left: offset(cards[i]), behavior: smooth ? 'smooth' : 'auto' });
  }
  function paint() {
    var i = current();
    while (dots.firstChild) dots.removeChild(dots.firstChild);
    cards.forEach(function (c, k) {
      var el = document.createElement(k === i ? 'b' : 'span');
      el.textContent = '●';
      dots.appendChild(el);
    });
    prev.disabled = i === 0;
    next.disabled = i === cards.length - 1;
  }

  prev.hidden = false;
  next.hidden = false;
  prev.addEventListener('click', function () { go(current() - 1); });
  next.addEventListener('click', function () { go(current() + 1); });
  deck.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
  });
  var t;
  deck.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(paint, 80); }, { passive: true });
  if (location.hash) {
    var at = cards.indexOf(document.getElementById(location.hash.slice(1)));
    if (at > 0) deck.scrollLeft = offset(cards[at]);
  }
  paint();
})();
