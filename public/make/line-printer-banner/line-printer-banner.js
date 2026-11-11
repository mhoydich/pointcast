/* Line-printer banner. Huge letters built from characters on fan-fold paper. */
(function (g) {
  'use strict';
  var K = g.MakeKit;
  // Units are 1/100 inch. 10 characters per inch, 6 lines per inch, 132 columns.
  var CW = 10, LH = 100 / 6, COLS = 132, PAGE = 66;
  var W = 1488, MARGIN = 84, TOP = 0;

  var G = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
    G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
    K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
    2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '#####|...#.|..#..|...#.|....#|#...#|.###.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
    6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
    '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    '.': '.....|.....|.....|.....|.....|.##..|.##..', '-': '.....|.....|.....|#####|.....|.....|.....',
    "'": '..#..|..#..|.#...|.....|.....|.....|.....', ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
    '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
    ' ': '.....|.....|.....|.....|.....|.....|.....'
  };
  var FONT = {};
  Object.keys(G).forEach(function (c) { FONT[c] = G[c].split('|'); });

  var PAPERS = {
    green: { label: 'Green bar', bg: '#fbfbf6', bar: '#d9ecd6', edge: '#9fbf9a' },
    blue: { label: 'Blue bar', bg: '#fbfbf8', bar: '#d8e4f1', edge: '#98aecb' },
    plain: { label: 'Plain', bg: '#fbfaf5', bar: '#fbfaf5', edge: '#bdb8ac' }
  };

  var schema = [
    { key: 'seed', type: 'text', label: 'Seed', def: 'job-0421', max: 32, hint: 'Sets the job number and the overstrike pattern.' },
    { key: 'text', type: 'text', label: 'Banner text', def: 'HELLO TOWN', max: 24, upper: true, pattern: /[^A-Z0-9 !?.\-':\/+&#]/g, hint: 'Letters, numbers and a little punctuation.' },
    { group: 'Print', key: 'dir', type: 'seg', label: 'Direction', def: 'across', options: [{ v: 'across', label: 'Across the page' }, { v: 'sideways', label: 'Sideways (classic)' }], hint: 'Sideways runs one huge letter per sheet down the fan-fold, the way banners were hung.' },
    { key: 'scale', type: 'seg', label: 'Banner height', def: '2', options: [{ v: '1', label: 'Small' }, { v: '2', label: 'Medium' }, { v: '3', label: 'Large' }] },
    { key: 'chars', type: 'seg', label: 'Character set', def: 'self', options: [{ v: 'self', label: 'The letter itself' }, { v: 'hash', label: '#' }, { v: 'x', label: 'X' }, { v: 'over', label: 'Overstrike' }] },
    { key: 'paper', type: 'seg', label: 'Paper', def: 'green', options: Object.keys(PAPERS).map(function (k) { return { v: k, label: PAPERS[k].label, swatch: PAPERS[k].bar }; }) },
    { key: 'header', type: 'toggle', label: 'Job header line', def: true }
  ];

  function cellChar(st, ch, r) {
    if (st.chars === 'hash') return '#';
    if (st.chars === 'x') return 'X';
    if (st.chars === 'over') return r.pick(['@', '#', '%', '&', '$', 'M', 'W', '8']);
    return ch === ' ' ? '#' : ch;
  }
  function pad(s) { return (s + new Array(COLS + 1).join(' ')).slice(0, COLS); }

  // The banner as plain text rows, exactly COLS wide. Same rows go into the .txt download.
  function bannerRows(st) {
    var r = K.rng('banner|' + st.seed);
    var s = Number(st.scale), text = st.text || ' ', rows = [];
    function blank(n) { for (var i = 0; i < n; i++) rows.push(pad('')); }
    if (st.dir === 'across') {
      var pw = 2 * s, per = Math.floor(COLS / (6 * pw)), words = text.split(/\s+/).filter(Boolean), lines = [], cur = '';
      words.forEach(function (w) {
        while (w.length > per) { if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, per)); w = w.slice(per); }
        if (!w) return;
        if (!cur) cur = w; else if ((cur + ' ' + w).length <= per) cur += ' ' + w; else { lines.push(cur); cur = w; }
      });
      if (cur) lines.push(cur);
      if (!lines.length) lines.push('');
      lines.forEach(function (ln, li) {
        if (li) blank(s * 2);
        var width = ln.length * 6 * pw - pw, left = Math.max(0, Math.floor((COLS - width) / 2));
        for (var gy = 0; gy < 7; gy++) {
          var row = '';
          for (var c = 0; c < ln.length; c++) {
            var gl = FONT[ln[c]] || FONT[' '];
            for (var gx = 0; gx < 6; gx++) {
              var on = gx < 5 && gl[gy][gx] === '#';
              for (var k = 0; k < pw; k++) row += on ? cellChar(st, ln[c], r) : ' ';
            }
          }
          var line = pad(new Array(left + 1).join(' ') + row);
          for (var q = 0; q < s; q++) rows.push(line);
        }
      });
    } else {
      // Sideways: read it by turning the paper a quarter turn anticlockwise. Glyph row y maps to columns right to left.
      var pc = 6 * s, pl = Math.round(pc * CW / LH * 1.0), across = 7 * pc, lft = Math.floor((COLS - across) / 2);
      for (var i = 0; i < text.length; i++) {
        var gl2 = FONT[text[i]] || FONT[' '];
        for (var gx2 = 0; gx2 < 6; gx2++) {
          var row2 = '';
          for (var cc = 0; cc < 7; cc++) {
            var gy2 = 6 - cc, on2 = gx2 < 5 && gl2[gy2][gx2] === '#';
            for (var k2 = 0; k2 < pc; k2++) row2 += on2 ? cellChar(st, text[i], r) : ' ';
          }
          var line2 = pad(new Array(lft + 1).join(' ') + row2);
          for (var q2 = 0; q2 < pl; q2++) rows.push(line2);
        }
      }
    }
    return rows;
  }

  function headerLine(st) {
    var r = K.rng('banner-job|' + st.seed);
    return pad('  POINTCAST LP-132  JOB ' + String(r.int(1, 9999)).padStart(4, '0') + '  USER MAKE  FORM ' + st.paper.toUpperCase() + '-BAR  SEED ' + st.seed.toUpperCase() + '  ***  ' + (st.text || '').trim());
  }

  function layout(st) {
    var rows = bannerRows(st), all = [];
    var head = st.header ? [headerLine(st), pad(''), pad(new Array(COLS + 1).join('-')), pad('')] : [];
    all = head.concat([pad(''), pad('')], rows, [pad(''), pad('')]);
    if (st.header) all = all.concat([pad(new Array(COLS + 1).join('-')), pad('  END OF JOB  ' + rows.length + ' LINES  POINTCAST.XYZ/MAKE/LINE-PRINTER-BANNER')]);
    var pages = Math.max(1, Math.ceil((all.length + 6) / PAGE));
    return { rows: all, pages: pages, lines: pages * PAGE };
  }

  function render(st, opts) {
    opts = opts || {};
    var L = layout(st), P = PAPERS[st.paper], H = L.lines * LH;
    var o = '<rect width="' + W + '" height="' + K.n1(H) + '" fill="' + P.bg + '"/>';
    // bars every 3 lines (half inch), alternating
    for (var b = 0; b < L.lines; b += 6) o += '<rect x="' + MARGIN + '" y="' + K.n1(b * LH) + '" width="' + (W - 2 * MARGIN) + '" height="' + K.n1(3 * LH) + '" fill="' + P.bar + '"/>';
    // tractor strips
    ['l', 'r'].forEach(function (side) {
      var x = side === 'l' ? 25 : W - 25, lx = side === 'l' ? 56 : W - 56;
      o += '<line x1="' + lx + '" y1="0" x2="' + lx + '" y2="' + K.n1(H) + '" stroke="' + P.edge + '" stroke-width="1" stroke-dasharray="3 3"/>';
      for (var y = 25; y < H; y += 50) o += '<circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#2a2a2a" fill-opacity="0.88"/>';
    });
    for (var p = 1; p < L.pages; p++) o += '<line x1="0" y1="' + K.n1(p * PAGE * LH) + '" x2="' + W + '" y2="' + K.n1(p * PAGE * LH) + '" stroke="' + P.edge + '" stroke-width="1.2" stroke-dasharray="6 4"/>';
    // the print, one text row per line, held to the 10 cpi grid
    var top = 3;
    o += '<g font-family="' + K.FONT.mono + '" font-size="15.5" fill="#1b1b1b" fill-opacity="0.92">';
    L.rows.forEach(function (row, i) {
      if (!row.trim()) return;
      var y = (top + i + 0.78) * LH;
      o += '<text x="' + MARGIN + '" y="' + K.n1(y) + '" textLength="' + COLS * CW + '" lengthAdjust="spacingAndGlyphs" xml:space="preserve">' + K.esc(row) + '</text>';
    });
    o += '</g>';
    o += '<text x="' + (W / 2) + '" y="' + K.n1(H - 8) + '" text-anchor="middle" font-family="' + K.FONT.sans + '" font-size="9" letter-spacing="2" fill="#8a857a">FAN-FOLD 14 7/8 X 11 · ' + L.pages + ' SHEET' + (L.pages > 1 ? 'S' : '') + '</text>';
    return K.svgDoc(W, K.n1(H), o, { label: describe(st), physical: opts.physical });
  }

  function describe(st) {
    return 'Line-printer banner reading ' + (st.text || 'nothing') + ', printed ' + (st.dir === 'across' ? 'across' : 'sideways') + ' on ' + PAPERS[st.paper].label.toLowerCase() + ' fan-fold paper.';
  }
  function shuffle(r) {
    var words = ['HELLO TOWN', 'GOOD MORNING', 'OPEN LATE', 'WELCOME HOME', 'GO TEAM', 'NICE SHOT', 'HAPPY DAY', 'SURF IS UP', 'ON AIR', 'THANK YOU'];
    return { text: r.pick(words), dir: r.chance(0.3) ? 'sideways' : 'across', scale: r.pick(['1', '2', '2', '3']), chars: r.pick(['self', 'hash', 'x', 'over']), paper: r.pick(['green', 'green', 'blue', 'plain']) };
  }

  var T = {
    slug: 'line-printer-banner', title: 'Line-printer banner', schema: schema, render: render, describe: describe, shuffle: shuffle,
    FONT: FONT, bannerRows: bannerRows, COLS: COLS,
    txt: function (st) { return layout(st).rows.map(function (r) { return r.replace(/\s+$/, ''); }).join('\n') + '\n'; },
    size: function (st) { var L = layout(st); return { w: W * 3, h: Math.round(L.lines * LH * 3), dpi: 300, label: '14 7/8 x ' + (11 * L.pages) + ' in', bg: PAPERS[st.paper].bg, physical: ['14.88in', (11 * L.pages) + 'in'] }; },
    actions: {
      txt: function (st, b, say) {
        var blob = new Blob([T.txt(st)], { type: 'text/plain' });
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'pointcast-line-printer-banner-' + String(st.seed).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        say('Text saved. Open it in any plain text editor with a monospace font.');
      }
    }
  };
  g.MakeTools['line-printer-banner'] = T;
  if (g.document && document.getElementById('art')) K.mount(T);
})(typeof globalThis !== 'undefined' ? globalThis : this);
