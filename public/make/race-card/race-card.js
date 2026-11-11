/* Race card. A one-page program for an invented race day. Odds are made up, for fun, not betting. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  var W = 850, H = 1100;

  var SILK = ['#c8102e', '#0b3d91', '#f2c500', '#1a7a3c', '#111111', '#f6f4ee', '#e46c0a', '#6a2c91', '#7fb2e5', '#8b5a2b', '#e86fa5', '#5b6770'];
  var CLOTH = [['#c8102e', '#fff'], ['#f6f4ee', '#111'], ['#0b3d91', '#fff'], ['#f2c500', '#111'], ['#1a7a3c', '#fff'], ['#111111', '#f2c500'], ['#e46c0a', '#111'], ['#e86fa5', '#111'], ['#7fb2e5', '#c8102e'], ['#6a2c91', '#fff'], ['#5b6770', '#c8102e'], ['#9acd32', '#111']];
  var PATTERNS = ['plain', 'hoops', 'stripes', 'quarters', 'sash', 'diamond', 'spots', 'halves'];
  var SYL = ['bel', 'ko', 'ra', 'mi', 'tu', 'zan', 'or', 've', 'lin', 'pa', 'sho', 'dex', 'mo', 'ri', 'qua', 'nel', 'fa', 'ty', 'gar', 'lu'];
  var WORDS = ['Velvet', 'Copper', 'Midnight', 'Harbor', 'Paper', 'Lucky', 'Quiet', 'Salt', 'Morning', 'Signal', 'Lantern', 'Pocket', 'Golden', 'Rolling', 'Tin', 'Clover', 'Breezy', 'Second', 'Little', 'Canyon'];
  var TAILS = ['Run', 'Echo', 'Parade', 'Promise', 'Drift', 'Kite', 'Comet', 'Biscuit', 'Tide', 'Rumor', 'Ribbon', 'Sprint', 'Engine', 'Waltz', 'Pilot', 'Pebble'];

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'raceday-0011', max: 32, hint: 'Names the field, dresses the silks and sets the odds.' },
    { key: 'track', type: 'text', label: 'Track name', def: '', max: 24, hint: 'Leave blank for an invented track.' },
    { key: 'kind', type: 'seg', label: 'Field', def: 'horses', options: [{ v: 'horses', label: 'Horses' }, { v: 'runners', label: 'Foot race' }] },
    { group: 'Race', key: 'race', type: 'range', label: 'Race number', def: 4, min: 1, max: 12, step: 1 },
    { key: 'field', type: 'range', label: 'Starters', def: 8, min: 4, max: 12, step: 1 },
    { key: 'dist', type: 'seg', label: 'Distance', def: 'mile', options: [{ v: 'sprint', label: 'Sprint' }, { v: 'mile', label: 'Mile' }, { v: 'route', label: 'Long' }] },
    { key: 'surface', type: 'seg', label: 'Surface', def: 'turf', options: [{ v: 'turf', label: 'Turf' }, { v: 'dirt', label: 'Dirt' }, { v: 'sand', label: 'Beach sand' }] },
    { key: 'date', type: 'date', label: 'Race day', def: '2026-11-11' },
    { key: 'post', type: 'text', label: 'Post time', def: '3:45 PM', max: 8, pattern: /[^0-9: APMapm]/g }
  ];

  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  function trackName(st) {
    if (st.track && st.track.trim()) return st.track.trim();
    var r = K.rng('track|' + st.seed);
    return cap(r.pick(SYL) + r.pick(SYL)) + ' ' + r.pick(['Downs', 'Park', 'Meadows', 'Fields', 'Commons', 'Sands']);
  }

  function field(st) {
    var r = K.rng('race|' + st.seed + '|' + st.race + '|' + st.kind), out = [], names = {};
    var weights = [];
    for (var i = 0; i < st.field; i++) {
      var nm;
      do {
        nm = st.kind === 'horses'
          ? (r.chance(0.55) ? r.pick(WORDS) + ' ' + r.pick(TAILS) : cap(r.pick(SYL) + r.pick(SYL) + r.pick(SYL)))
          : r.pick(['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'J.', 'K.', 'L.', 'M.', 'N.', 'R.', 'S.', 'T.']) + ' ' + cap(r.pick(SYL) + r.pick(SYL) + (r.chance(0.5) ? r.pick(SYL) : ''));
      } while (names[nm]);
      names[nm] = 1;
      var body = r.int(0, SILK.length - 1), alt;
      do { alt = r.int(0, SILK.length - 1); } while (alt === body);
      weights.push(Math.pow(r(), 1.6) + 0.04);
      out.push({ no: i + 1, name: nm, body: SILK[body], alt: SILK[alt], pattern: r.pick(PATTERNS), cap: r.chance(0.5) ? SILK[alt] : SILK[body],
        age: r.int(3, 7), wt: st.kind === 'horses' ? r.int(116, 126) : r.int(18, 64), form: formLine(r) });
    }
    var tot = weights.reduce(function (a, b) { return a + b; }, 0);
    out.forEach(function (h, i) { h.odds = oddsText(weights[i] / tot * 0.82); });
    return out;
  }
  function formLine(r) { var s = ''; for (var i = 0; i < 5; i++) s += r.chance(0.12) ? '-' : String(r.int(1, 9)); return s; }
  var LADDER = [[1, 2], [3, 5], [4, 5], [1, 1], [6, 5], [7, 5], [3, 2], [8, 5], [9, 5], [2, 1], [5, 2], [3, 1], [7, 2], [4, 1], [9, 2], [5, 1], [6, 1], [8, 1], [10, 1], [12, 1], [15, 1], [20, 1], [30, 1], [50, 1], [99, 1]];
  // Made-up odds: turn a pretend chance into the nearest step on the familiar ladder.
  function oddsText(p) {
    var want = 1 / Math.max(0.005, p) - 1, best = LADDER[0];
    LADDER.forEach(function (l) { if (Math.abs(l[0] / l[1] - want) < Math.abs(best[0] / best[1] - want)) best = l; });
    return best[0] + '-' + best[1];
  }

  function silks(h, x, y, kind) {
    // a jersey: body, two sleeves, a cap; the pattern drawn in the second colour
    var id = 'rc-silk-' + h.no, o = '';
    var bodyPath = 'M' + (x + 14) + ' ' + (y + 12) + 'L' + (x + 46) + ' ' + (y + 12) + 'L' + (x + 50) + ' ' + (y + 60) + 'L' + (x + 10) + ' ' + (y + 60) + 'Z';
    o += '<defs><clipPath id="' + id + '"><path d="' + bodyPath + '"/></clipPath></defs>';
    o += '<path d="' + bodyPath + '" fill="' + h.body + '"/>';
    o += '<g clip-path="url(#' + id + ')" fill="' + h.alt + '">';
    if (h.pattern === 'hoops') for (var i = 0; i < 4; i++) o += '<rect x="' + x + '" y="' + (y + 18 + i * 12) + '" width="60" height="6"/>';
    if (h.pattern === 'stripes') for (var j = 0; j < 5; j++) o += '<rect x="' + (x + 12 + j * 8) + '" y="' + y + '" width="4" height="64"/>';
    if (h.pattern === 'quarters') o += '<rect x="' + (x + 30) + '" y="' + (y + 12) + '" width="30" height="24"/><rect x="' + x + '" y="' + (y + 36) + '" width="30" height="30"/>';
    if (h.pattern === 'sash') o += '<path d="M' + (x + 12) + ' ' + (y + 10) + 'L' + (x + 22) + ' ' + (y + 10) + 'L' + (x + 52) + ' ' + (y + 62) + 'L' + (x + 42) + ' ' + (y + 62) + 'Z"/>';
    if (h.pattern === 'diamond') o += '<path d="M' + (x + 30) + ' ' + (y + 20) + 'L' + (x + 42) + ' ' + (y + 36) + 'L' + (x + 30) + ' ' + (y + 52) + 'L' + (x + 18) + ' ' + (y + 36) + 'Z"/>';
    if (h.pattern === 'spots') for (var k = 0; k < 6; k++) o += '<circle cx="' + (x + 20 + (k % 3) * 10) + '" cy="' + (y + 24 + Math.floor(k / 3) * 18) + '" r="3.5"/>';
    if (h.pattern === 'halves') o += '<rect x="' + (x + 30) + '" y="' + y + '" width="30" height="64"/>';
    o += '</g>';
    var sleeve = h.pattern === 'plain' ? h.alt : h.body;
    o += '<path d="M' + (x + 14) + ' ' + (y + 12) + 'L' + (x + 2) + ' ' + (y + 34) + 'L' + (x + 9) + ' ' + (y + 38) + 'L' + (x + 16) + ' ' + (y + 26) + 'Z" fill="' + sleeve + '"/>';
    o += '<path d="M' + (x + 46) + ' ' + (y + 12) + 'L' + (x + 58) + ' ' + (y + 34) + 'L' + (x + 51) + ' ' + (y + 38) + 'L' + (x + 44) + ' ' + (y + 26) + 'Z" fill="' + sleeve + '"/>';
    o += '<g fill="none" stroke="#111" stroke-width="1.2" stroke-linejoin="round"><path d="' + bodyPath + '"/><path d="M' + (x + 14) + ' ' + (y + 12) + 'L' + (x + 2) + ' ' + (y + 34) + 'L' + (x + 9) + ' ' + (y + 38) + 'L' + (x + 16) + ' ' + (y + 26) + '"/><path d="M' + (x + 46) + ' ' + (y + 12) + 'L' + (x + 58) + ' ' + (y + 34) + 'L' + (x + 51) + ' ' + (y + 38) + 'L' + (x + 44) + ' ' + (y + 26) + '"/></g>';
    if (kind === 'horses') o += '<path d="M' + (x + 19) + ' ' + (y + 10) + 'A11 9 0 0 1 ' + (x + 41) + ' ' + (y + 10) + 'Z" fill="' + h.cap + '" stroke="#111" stroke-width="1.2"/><rect x="' + (x + 36) + '" y="' + (y + 8) + '" width="12" height="3" fill="' + h.cap + '" stroke="#111" stroke-width="1"/>';
    else o += '<rect x="' + (x + 20) + '" y="' + (y + 30) + '" width="20" height="16" fill="#fff" stroke="#111" stroke-width="1"/><text x="' + (x + 30) + '" y="' + (y + 43) + '" text-anchor="middle" font-family="' + K.FONT.mono + '" font-weight="700" font-size="11" fill="#111">' + h.no + '</text>';
    return o;
  }

  var DIST = { sprint: { horses: '6 FURLONGS', runners: '100 METRES' }, mile: { horses: '1 MILE', runners: '1 MILE' }, route: { horses: '1 1/4 MILES', runners: '10 KILOMETRES' } };

  function render(st, opts) {
    opts = opts || {};
    var ink = '#141414', paper = '#f6f4ee', acc = '#c8102e', sans = K.FONT.sans, mono = K.FONT.mono, serif = K.FONT.serif;
    var r = K.rng('race-head|' + st.seed + '|' + st.race);
    var horses = field(st), tn = trackName(st);
    var o = '<rect width="' + W + '" height="' + H + '" fill="' + paper + '"/>';
    o += '<rect x="24" y="24" width="' + (W - 48) + '" height="' + (H - 48) + '" fill="none" stroke="' + ink + '" stroke-width="2"/>';
    o += '<text x="50" y="74" font-family="' + sans + '" font-size="13" font-weight="700" letter-spacing="4" fill="' + ink + '">RACE DAY PROGRAM · ' + K.esc(dayText(st.date)) + '</text>';
    o += '<text x="50" y="128" font-family="' + serif + '" font-size="' + K.n1(Math.min(50, 1300 / Math.max(8, tn.length * 1.05))) + '" font-weight="700" fill="' + ink + '">' + K.esc(tn) + '</text>';
    o += '<rect x="' + (W - 190) + '" y="46" width="140" height="96" fill="' + ink + '"/>';
    o += '<text x="' + (W - 120) + '" y="72" text-anchor="middle" font-family="' + sans + '" font-size="12" letter-spacing="3" font-weight="700" fill="' + paper + '">RACE</text>';
    o += '<text x="' + (W - 120) + '" y="132" text-anchor="middle" font-family="' + sans + '" font-size="64" font-weight="800" fill="' + paper + '">' + st.race + '</text>';
    var purse = '$' + String(r.int(2, 40) * 500).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var title = (st.kind === 'horses' ? r.pick(['The ', 'The ', '']) + r.pick(WORDS) + ' ' + r.pick(['Stakes', 'Handicap', 'Cup', 'Purse', 'Plate']) : 'The ' + r.pick(WORDS) + ' ' + r.pick(['Dash', 'Mile', 'Relay Cup', 'Open']));
    o += '<line x1="50" y1="160" x2="' + (W - 50) + '" y2="160" stroke="' + ink + '" stroke-width="1.5"/>';
    o += '<text x="50" y="196" font-family="' + sans + '" font-size="24" font-weight="700" fill="' + ink + '">' + K.esc(title) + '</text>';
    o += '<text x="50" y="224" font-family="' + mono + '" font-size="14" fill="' + ink + '">' + DIST[st.dist][st.kind] + ' · ' + st.surface.toUpperCase() + ' · POST ' + K.esc((st.post || '').toUpperCase()) + ' · PRETEND PURSE ' + purse + '</text>';
    // header row
    var y0 = 262;
    o += '<rect x="50" y="' + y0 + '" width="' + (W - 100) + '" height="26" fill="' + ink + '"/>';
    var hd = [[62, 'NO.'], [180, st.kind === 'horses' ? 'HORSE' : 'RUNNER'], [500, 'FORM'], [600, st.kind === 'horses' ? 'WT' : 'AGE'], [W - 62, 'ODDS*']];
    hd.forEach(function (h, i) { o += '<text x="' + h[0] + '" y="' + (y0 + 18) + '"' + (i === 4 ? ' text-anchor="end"' : '') + ' font-family="' + sans + '" font-size="12" font-weight="700" letter-spacing="2" fill="' + paper + '">' + h[1] + '</text>'; });
    var rowH = Math.min(84, (H - 150 - y0 - 30) / horses.length);
    horses.forEach(function (h, i) {
      var y = y0 + 30 + i * rowH, cy = y + rowH / 2, cl = CLOTH[i % CLOTH.length], sc = Math.min(1.15, rowH / 68);
      if (i % 2) o += '<rect x="50" y="' + K.n1(y) + '" width="' + (W - 100) + '" height="' + K.n1(rowH) + '" fill="#ebe7dc"/>';
      o += '<rect x="58" y="' + K.n1(cy - 20) + '" width="40" height="40" fill="' + cl[0] + '" stroke="' + ink + '" stroke-width="1"/>';
      o += '<text x="78" y="' + K.n1(cy + 9) + '" text-anchor="middle" font-family="' + sans + '" font-size="24" font-weight="800" fill="' + cl[1] + '">' + h.no + '</text>';
      o += '<g transform="translate(110 ' + K.n1(cy - 34 * sc) + ') scale(' + K.n2(sc) + ')">' + silks(h, 0, 0, st.kind) + '</g>';
      o += '<text x="180" y="' + K.n1(cy + 2) + '" font-family="' + sans + '" font-size="21" font-weight="700" fill="' + ink + '">' + K.esc(h.name) + '</text>';
      o += '<text x="180" y="' + K.n1(cy + 21) + '" font-family="' + mono + '" font-size="11.5" fill="#55524c">' + (st.kind === 'horses' ? h.age + 'YO · ' + h.pattern.toUpperCase() + ' SILKS' : 'CLUB ' + h.pattern.toUpperCase()) + '</text>';
      o += '<text x="500" y="' + K.n1(cy + 6) + '" font-family="' + mono + '" font-size="17" letter-spacing="2" fill="' + ink + '">' + h.form + '</text>';
      o += '<text x="600" y="' + K.n1(cy + 6) + '" font-family="' + mono + '" font-size="17" fill="' + ink + '">' + h.wt + '</text>';
      o += '<text x="' + (W - 62) + '" y="' + K.n1(cy + 8) + '" text-anchor="end" font-family="' + sans + '" font-size="24" font-weight="800" fill="' + acc + '">' + h.odds + '</text>';
    });
    var fy = H - 120;
    o += '<line x1="50" y1="' + fy + '" x2="' + (W - 50) + '" y2="' + fy + '" stroke="' + ink + '" stroke-width="1.5"/>';
    o += '<text x="50" y="' + (fy + 30) + '" font-family="' + sans + '" font-size="15" font-weight="800" letter-spacing="2" fill="' + acc + '">* ODDS ARE MADE UP. FOR FUN, NOT BETTING.</text>';
    o += '<text x="50" y="' + (fy + 54) + '" font-family="' + sans + '" font-size="12.5" fill="' + ink + '">Every name, track, silk and number on this card is invented by a seeded generator. Any likeness is a coincidence.</text>';
    o += '<text x="50" y="' + (fy + 80) + '" font-family="' + mono + '" font-size="11" letter-spacing="1" fill="' + ink + '" opacity="0.7">SEED ' + K.esc(st.seed.toUpperCase()) + ' · POINTCAST.XYZ/MAKE/RACE-CARD</text>';
    return K.svgDoc(W, H, o, { label: describe(st), physical: opts.physical });
  }

  function dayText(d) {
    var dt = new Date(d + 'T12:00:00Z');
    var days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    var mo = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return days[dt.getUTCDay()] + ' ' + dt.getUTCDate() + ' ' + mo[dt.getUTCMonth()] + ' ' + dt.getUTCFullYear();
  }
  function describe(st) { return 'Race card for race ' + st.race + ' at ' + trackName(st) + ', ' + st.field + ' invented starters. Odds are made up, for fun, not betting.'; }
  function shuffle(r) { return { track: '', kind: r.chance(0.25) ? 'runners' : 'horses', race: r.int(1, 10), field: r.int(5, 12), dist: r.pick(['sprint', 'mile', 'route']), surface: r.pick(['turf', 'dirt', 'sand']), post: r.int(1, 6) + ':' + r.pick(['05', '15', '30', '45', '50']) + ' PM' }; }

  var T = {
    slug: 'race-card', title: 'Race card', schema: schema, render: render, describe: describe, shuffle: shuffle,
    field: field, oddsText: oddsText, trackName: trackName,
    size: function () { return { w: 2550, h: 3300, dpi: 300, label: '8.5 x 11 in', bg: '#f6f4ee', physical: ['8.5in', '11in'] }; }
  };
  g.MakeTools['race-card'] = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
