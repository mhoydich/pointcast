/* Local Census — one template, one data file per town.
 *
 * A town page sets window.LOCAL_CENSUS = { town: 'el-segundo' } and this script
 * draws it from towns/<slug>.json. The index page sets { region: true } and
 * draws region.json. To add a town, add its JSON file and a folder with a copy
 * of a town page; nothing here changes.
 *
 * Every figure carries a grade, so a reader can tell a Census count from one
 * of our own counts or guesses:
 *   A  official count or estimate, current
 *   B  official survey estimate, a few years old, with a margin of error
 *   C  counted by us or stated by a source without a method
 *   D  our estimate
 */
(function () {
  'use strict';
  var GRADES = {
    A: 'Official and current',
    B: 'Official survey, a few years old',
    C: 'Our count, or a figure given without a method',
    D: 'Our estimate'
  };
  function fmt(v, f) {
    if (f === '$') return '$' + Math.round(v).toLocaleString('en-US');
    if (f === '%') return (v > 0 ? '' : '') + v.toLocaleString('en-US') + '%';
    if (f === 'min') return v.toLocaleString('en-US') + ' min';
    if (f === 'n~') return 'about ' + Math.round(v).toLocaleString('en-US');
    return Math.round(v).toLocaleString('en-US');
  }
  // Postings per 100 households: how much hiring a town does for its size.
  function per100(postings, households) {
    if (!households) return null;
    return Math.round((postings / households) * 1000) / 10;
  }
  var PURE = { fmt: fmt, per100: per100, GRADES: GRADES };
  if (typeof module !== 'undefined' && module.exports) { module.exports = PURE; }
  if (typeof document === 'undefined') return;

  var CFG = window.LOCAL_CENSUS || {};
  var BASE = CFG.base || '/local-census/';
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function grade(g) {
    var s = el('span', 'lc-grade lc-g' + g, g);
    s.title = GRADES[g]; s.setAttribute('aria-label', 'Grade ' + g + ': ' + GRADES[g]);
    return s;
  }
  function bars(rows, max, labelKey) {
    var wrap = el('div', 'lc-bars');
    rows.forEach(function (r) {
      var row = el('div', 'lc-bar');
      var name = el('span', 'lc-bar-name');
      if (r.page) { var a = el('a', '', r[labelKey]); a.href = BASE + r.slug + '/'; name.appendChild(a); }
      else name.textContent = r[labelKey];
      var track = el('span', 'lc-bar-track'), fill = el('i');
      fill.style.width = Math.max(0.5, (r.value / max) * 100) + '%';
      track.appendChild(fill);
      row.appendChild(name); row.appendChild(track); row.appendChild(el('b', '', r.value.toLocaleString('en-US')));
      wrap.appendChild(row);
    });
    return wrap;
  }
  function section(title, lede) {
    var s = el('section', 'lc-sec');
    s.appendChild(el('h2', '', title));
    if (lede) s.appendChild(el('p', 'lc-lede', lede));
    return s;
  }
  function key() {
    var k = el('ul', 'lc-key');
    Object.keys(GRADES).forEach(function (g) { var li = el('li'); li.appendChild(grade(g)); li.appendChild(el('span', '', GRADES[g])); k.appendChild(li); });
    return k;
  }

  function drawTown(t, root) {
    document.title = t.name + ' · Local Census';
    root.appendChild(el('p', 'lc-kicker', 'Local Census · snapshot ' + t.snapshot));
    root.appendChild(el('h1', '', t.name));
    if (t.snapshot_note) root.appendChild(el('p', 'lc-note', t.snapshot_note));
    var hh = (t.official.filter(function (o) { return o.label === 'Households'; })[0] || {}).value;
    var rate = per100(t.postings.total, hh);
    var hero = el('div', 'lc-hero');
    [[t.postings.total.toLocaleString('en-US'), 'jobs posted in ' + t.postings.window_days + ' days', 'C'],
     [rate === null ? '–' : String(rate), 'postings per 100 households', 'C']].forEach(function (h) {
      var d = el('div'); d.appendChild(el('b', '', h[0]));
      var cap = el('span', '', h[1] + ' '); cap.appendChild(grade(h[2])); d.appendChild(cap); hero.appendChild(d);
    });
    root.appendChild(hero);

    var s1 = section('The official picture', 'What the Census and the city say about the people who live here.');
    var grid = el('div', 'lc-facts');
    t.official.forEach(function (o) {
      var c = el('div', 'lc-fact');
      var top = el('div', 'lc-fact-top'); top.appendChild(el('span', '', o.label)); top.appendChild(grade(o.grade)); c.appendChild(top);
      c.appendChild(el('b', '', fmt(o.value, o.fmt)));
      c.appendChild(el('p', '', o.note));
      var a = el('a', '', o.source); a.href = o.url; a.rel = 'noopener'; c.appendChild(a);
      grid.appendChild(c);
    });
    s1.appendChild(grid); root.appendChild(s1);

    var s2 = section('Who is hiring', 'Open postings by the words in the job title. A posting can fall in more than one family or in none, so the rows do not add up to the total.');
    var fams = t.postings.families.map(function (f) { return { name: f.name, value: f.count }; }).sort(function (a, b) { return b.value - a.value; });
    s2.appendChild(bars(fams, Math.max.apply(null, fams.map(function (f) { return f.value; })) || 1, 'name'));
    if (t.samples && t.samples.length) {
      var ul = el('ul', 'lc-samples');
      t.samples.forEach(function (j) { var li = el('li'); li.appendChild(el('span', '', j.title)); li.appendChild(el('em', '', j.company)); ul.appendChild(li); });
      s2.appendChild(el('h3', '', 'A few of the postings')); s2.appendChild(ul);
    }
    root.appendChild(s2);

    var s3 = section('What the town needs', 'Our reading of the numbers above, with how sure we are of each.');
    t.reads.forEach(function (r) {
      var card = el('article', 'lc-read');
      var head = el('div', 'lc-read-head'); head.appendChild(el('h3', '', r.need)); head.appendChild(el('span', 'lc-conf lc-' + r.confidence, r.confidence + ' confidence')); card.appendChild(head);
      [['The numbers', r.evidence], ['What it means for living here', r.quality], ['A next step', r.move], ['Why we are not surer', r.why]].forEach(function (p) {
        var dl = el('div', 'lc-pair'); dl.appendChild(el('span', '', p[0])); dl.appendChild(el('p', '', p[1])); card.appendChild(dl);
      });
      s3.appendChild(card);
    });
    root.appendChild(s3);

    var s4 = section('What we do not know yet');
    var gl = el('ul', 'lc-gaps'); t.gaps.forEach(function (g) { gl.appendChild(el('li', '', g)); }); s4.appendChild(gl);
    root.appendChild(s4);
    root.appendChild(method(t.snapshot));
  }

  function drawRegion(r, root) {
    root.appendChild(el('p', 'lc-kicker', 'Local Census · snapshot ' + r.snapshot));
    root.appendChild(el('h1', '', 'Ten towns around El Segundo'));
    if (r.snapshot_note) root.appendChild(el('p', 'lc-note', r.snapshot_note));
    var hero = el('div', 'lc-hero');
    var d = el('div'); d.appendChild(el('b', '', r.total.toLocaleString('en-US')));
    var cap = el('span', '', 'jobs posted across ten towns in ' + r.window_days + ' days '); cap.appendChild(grade('C')); d.appendChild(cap); hero.appendChild(d);
    root.appendChild(hero);
    var s1 = section('Where the hiring is', 'Open postings by town. Each town links to its own page.');
    var towns = r.towns.map(function (t) { return { name: t.name, value: t.postings, page: t.page, slug: t.slug }; });
    s1.appendChild(bars(towns, towns[0].value, 'name')); root.appendChild(s1);
    var rated = r.towns.filter(function (t) { return typeof t.per100 === 'number'; })
      .map(function (t) { return { name: t.name, value: t.per100, page: t.page, slug: t.slug }; })
      .sort(function (a, b) { return b.value - a.value; });
    if (rated.length) {
      var sr = section('Hiring for its size', 'Postings for every 100 households. A high number is a town people travel into for work; a low one is a town people leave each morning.');
      sr.appendChild(bars(rated, rated[0].value, 'name')); root.appendChild(sr);
    }
    var s2 = section('What the region is hiring for', 'By the words in the job title, across all ten towns. Rows overlap and do not add up to the total.');
    var fams = r.families.map(function (f) { return { name: f.name, value: f.count }; }).sort(function (a, b) { return b.value - a.value; });
    s2.appendChild(bars(fams, fams[0].value, 'name')); root.appendChild(s2);
    root.appendChild(method(r.snapshot));
  }

  function method(snapshot) {
    var s = section('How to read this');
    s.appendChild(key());
    [
      'Job figures are a count of live postings in a LinkedIn-based feed (BlitzAPI, through Firecrawl) on ' + snapshot + ', for the 30 days before. A posting is not a job: one posting can cover several hires, and one job can be posted twice.',
      'That feed is strongest on large employers and office work. Restaurants, schools, trades and small shops hire in ways it mostly misses, so low numbers there may be a blind spot, not a finding.',
      'Postings are placed by the city named in the listing, which for a big employer is often the head office.',
      'Census figures are the 2019–2023 American Community Survey unless a date says otherwise. They describe residents, not the people who work in the town.',
      'This is an independent reading. It is not a government census and no city has reviewed it.'
    ].forEach(function (p) { s.appendChild(el('p', 'lc-note', p)); });
    return s;
  }

  function init() {
    var root = document.getElementById('lc-root');
    var url = CFG.region ? BASE + 'region.json' : BASE + 'towns/' + CFG.town + '.json';
    fetch(url).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (data) { root.textContent = ''; if (CFG.region) drawRegion(data, root); else drawTown(data, root); })
      .catch(function () { root.textContent = 'The census data did not load. Try again in a moment.'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
