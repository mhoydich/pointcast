/* Local Census — one template, one data file per town.
 *
 * A town page sets window.LOCAL_CENSUS = { town: 'el-segundo' } and this script
 * draws it from towns/<slug>.json. The index page sets { region: true } and
 * draws region.json. To add a town, add its JSON file and a folder with a copy
 * of a town page; nothing here changes.
 *
 * A town file may leave out "postings" (no jobs feed) and the page still draws.
 * "review" says whether someone who lives there has read it, and "status":
 * "draft" marks a town built without anyone local.
 *
 * Two boxes need a small server and are left out when it cannot be reached:
 *   Back this step  one tap per person on a next step, counted by /api/poll
 *   Ping back       a tap to say you live or work here, and a private note
 *                   sent to /api/feedback
 * Set window.LOCAL_CENSUS.api to another origin to use its endpoints, or to
 * false to leave both boxes out.
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
    if (f === '%') return v.toLocaleString('en-US') + '%';
    if (f === '+%') return (v > 0 ? '+' : '') + v.toLocaleString('en-US') + '%';
    if (f === 'min') return v.toLocaleString('en-US') + ' min';
    if (f === 'n~') return 'about ' + Math.round(v).toLocaleString('en-US');
    return Math.round(v).toLocaleString('en-US');
  }
  // Postings per 100 households: how much hiring a town does for its size.
  function per100(postings, households) {
    if (!households) return null;
    return Math.round((postings / households) * 1000) / 10;
  }
  // Names of the two counts kept for a town, and the bodies sent to the server.
  function backSlug(town) { return 'census-' + town; }
  function hereSlug(town) { return 'here-' + town; }
  function vote(slug, optionId, when) { return { type: 'pc-poll-v1', slug: slug, optionId: optionId, timestamp: when }; }
  function count(tally, id) { var n = tally ? tally[id] : 0; return typeof n === 'number' && n > 0 ? n : 0; }
  function backLine(n) { return n === 0 ? 'No one has backed this step yet' : n === 1 ? '1 person would start here' : n.toLocaleString('en-US') + ' people would start here'; }
  // A note carries the town in its first words so it can be told apart in the inbox.
  function note(town, text, contact, path) {
    var body = String(text || '').trim();
    if (!body) return null;
    return { message: ('Census note, ' + town + ': ' + body).slice(0, 2000), contact: String(contact || '').trim().slice(0, 200), path: String(path || '').slice(0, 200) };
  }
  var HERE = [['live', 'I live here'], ['work', 'I work here'], ['visit', 'Passing through']];
  var PURE = { fmt: fmt, per100: per100, GRADES: GRADES, backSlug: backSlug, hereSlug: hereSlug, vote: vote, count: count, backLine: backLine, note: note, HERE: HERE };
  if (typeof module !== 'undefined' && module.exports) { module.exports = PURE; }
  if (typeof document === 'undefined') return;

  var CFG = window.LOCAL_CENSUS || {};
  var BASE = CFG.base || '/local-census/';
  var API = CFG.api === false ? null : (CFG.api || '');
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
    if (t.region) root.appendChild(el('p', 'lc-kicker lc-where', t.region));
    var rv = t.review || {};
    if (t.status === 'draft' || rv.state) {
      var st = el('div', 'lc-status');
      if (t.status === 'draft') st.appendChild(el('b', 'lc-tag', 'Draft'));
      st.appendChild(el('span', '', rv.state === 'read'
        ? (rv.by || 'A resident') + ' read this page' + (rv.date ? ' on ' + rv.date : '') + '.'
        : 'No one who lives in ' + t.name + ' has read this page yet.'));
      st.id = 'lc-status'; root.appendChild(st);
    }
    if (t.snapshot_note) root.appendChild(el('p', 'lc-note', t.snapshot_note));
    var P = t.postings, heroRows = [];
    var find = function (label) { return t.official.filter(function (o) { return o.label === label; })[0]; };
    if (P) {
      var rate = per100(P.total, (find('Households') || {}).value);
      heroRows = [[P.total.toLocaleString('en-US'), 'jobs posted in ' + P.window_days + ' days', 'C'],
                  [rate === null ? '–' : String(rate), 'postings per 100 households', 'C']];
    } else if (find('Residents')) {
      heroRows = [[fmt(find('Residents').value, 'n'), 'residents', find('Residents').grade]];
    }
    if (heroRows.length) {
      var hero = el('div', 'lc-hero');
      heroRows.forEach(function (h) {
        var d = el('div'); d.appendChild(el('b', '', h[0]));
        var cap = el('span', '', h[1] + ' '); cap.appendChild(grade(h[2])); d.appendChild(cap); hero.appendChild(d);
      });
      root.appendChild(hero);
    }

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

    if (P) {
    var s2 = section('Who is hiring', 'Open postings by the words in the job title. A posting can fall in more than one family or in none, so the rows do not add up to the total.');
    if (P.note) s2.appendChild(el('p', 'lc-note', P.note));
    var fams = P.families.map(function (f) { return { name: f.name, value: f.count }; }).sort(function (a, b) { return b.value - a.value; });
    s2.appendChild(bars(fams, Math.max.apply(null, fams.map(function (f) { return f.value; })) || 1, 'name'));
    if (t.samples && t.samples.length) {
      var ul = el('ul', 'lc-samples');
      t.samples.forEach(function (j) { var li = el('li'); li.appendChild(el('span', '', j.title)); li.appendChild(el('em', '', j.company)); ul.appendChild(li); });
      s2.appendChild(el('h3', '', 'A few of the postings')); s2.appendChild(ul);
    }
    root.appendChild(s2);
    } else {
      root.appendChild(el('p', 'lc-note', 'No job counts on this page yet. It is built from official figures only.'));
    }

    var s3 = section('What the town needs', 'Our reading of the numbers above, with how sure we are of each.');
    var backs = [];
    (t.reads || []).forEach(function (r) {
      var card = el('article', 'lc-read');
      var head = el('div', 'lc-read-head'); head.appendChild(el('h3', '', r.need)); head.appendChild(el('span', 'lc-conf lc-' + r.confidence, r.confidence + ' confidence')); card.appendChild(head);
      [['The numbers', r.evidence], ['What it means for living here', r.quality], ['A next step', r.move], ['Why we are not surer', r.why]].forEach(function (p) {
        var dl = el('div', 'lc-pair'); dl.appendChild(el('span', '', p[0])); dl.appendChild(el('p', '', p[1])); card.appendChild(dl);
      });
      if (r.id) {
        var row = el('div', 'lc-back'); row.hidden = true;
        var btn = el('button', 'lc-btn', 'Back this step'); btn.type = 'button';
        var num = el('span', 'lc-count'); num.setAttribute('role', 'status');
        row.appendChild(btn); row.appendChild(num); card.appendChild(row);
        backs.push({ id: r.id, row: row, btn: btn, num: num });
      }
      s3.appendChild(card);
    });
    var backMsg = el('p', 'lc-msg'); backMsg.setAttribute('role', 'status'); s3.appendChild(backMsg);
    if ((t.reads || []).length) root.appendChild(s3);

    if ((t.gaps || []).length) {
      var s4 = section('What we do not know yet');
      var gl = el('ul', 'lc-gaps'); t.gaps.forEach(function (g) { gl.appendChild(el('li', '', g)); }); s4.appendChild(gl);
      root.appendChild(s4);
    }
    var s5 = section('Ping back', 'This page was written from data, not from living in ' + t.name + '. If you know the town, say so, and say what the page gets wrong.');
    s5.id = 'lc-pingback'; s5.hidden = true; root.appendChild(s5);
    root.appendChild(method());
    if (API !== null) live(t, backs, backMsg, s3, s5);
  }

  // ---- The two boxes that need a server ----
  function recall(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function keep(key, v) { try { window.localStorage.setItem(key, v); } catch (e) { /* private mode: the server still remembers */ } }
  function tally(slug) {
    return fetch(API + '/api/poll?slug=' + slug).then(function (r) { if (!r.ok) throw new Error('tally'); return r.json(); })
      .then(function (d) { if (!d || !d.ok) throw new Error('tally'); return d.tally || {}; });
  }
  // One tap per person per count. The server refuses a second, and says which it kept.
  function cast(slug, id) {
    return fetch(API + '/api/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vote(slug, id, new Date().toISOString())) })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d || {} }; }); });
  }
  function picker(slug, items, msg, words) {
    var mine = recall('lc:' + slug), counts = {}, busy = false;
    function paint() {
      items.forEach(function (it) {
        it.btn.disabled = busy || !!mine;
        it.btn.classList.toggle('lc-on', mine === it.id);
        it.btn.setAttribute('aria-pressed', mine === it.id ? 'true' : 'false');
        it.paint(count(counts, it.id), mine === it.id);
      });
    }
    function settle(id, text) { mine = id; keep('lc:' + slug, id); msg.textContent = text; }
    items.forEach(function (it) {
      it.btn.addEventListener('click', function () {
        if (busy || mine) return;
        busy = true; msg.textContent = ''; paint();
        cast(slug, it.id).then(function (res) {
          if (res.status === 200 && res.data.ok) { counts[it.id] = res.data.count; settle(it.id, words.done); }
          else if (res.status === 409 && res.data.votedFor) settle(res.data.votedFor, words.already);
          else msg.textContent = words.failed;
        }).catch(function () { msg.textContent = words.failed; }).then(function () { busy = false; paint(); });
      });
    });
    return function (t) { counts = t; paint(); };
  }
  function live(t, backs, backMsg, needs, box) {
    Promise.all([tally(backSlug(t.slug)), tally(hereSlug(t.slug))]).then(function (got) {
      if (backs.length) {
        needs.querySelector('.lc-lede').textContent += ' Each has a next step. Back the one you would start with: one tap per person, no sign-up, and no money changes hands.';
        backs.forEach(function (b) {
          b.row.hidden = false;
          b.paint = function (n, on) { b.btn.textContent = on ? 'You backed this' : 'Back this step'; b.num.textContent = backLine(n); };
        });
        picker(backSlug(t.slug), backs, backMsg, {
          done: 'Counted. Thank you.', already: 'A tap from this device or network was already counted.', failed: 'That did not go through. Try again in a moment.'
        })(got[0]);
      }
      pingBack(t, box, got[1]);
      var st = document.getElementById('lc-status');
      if (st && (t.review || {}).state !== 'read') { var a = el('a', '', 'Know the town? Ping back'); a.href = '#lc-pingback'; st.appendChild(a); }
    }).catch(function () { /* no server here: the page stands without the two boxes */ });
  }
  function pingBack(t, box, counts) {
    var row = el('div', 'lc-here'), msg = el('p', 'lc-msg'); msg.setAttribute('role', 'status');
    var items = HERE.map(function (h) {
      var btn = el('button', 'lc-btn lc-btn-quiet', h[1]); btn.type = 'button'; row.appendChild(btn);
      return { id: h[0], btn: btn, paint: function (n) { btn.textContent = h[1] + ' · ' + n.toLocaleString('en-US'); } };
    });
    box.appendChild(row); box.appendChild(msg);
    var cap = el('p', 'lc-note', 'A count of taps, one per device, not checked against who lives here. '); cap.appendChild(grade('C')); box.appendChild(cap);
    picker(hereSlug(t.slug), items, msg, {
      done: 'Counted. Thank you.', already: 'A tap from this device or network was already counted.', failed: 'That did not go through. Try again in a moment.'
    })(counts);

    var form = el('form', 'lc-form');
    var l1 = el('label', '', 'What does this page get wrong, or what can you answer?'); l1.htmlFor = 'lc-note-text';
    var text = el('textarea'); text.id = 'lc-note-text'; text.maxLength = 1900; text.required = true;
    var l2 = el('label', '', 'An email or number, only if you want a reply'); l2.htmlFor = 'lc-note-contact';
    var contact = el('input'); contact.id = 'lc-note-contact'; contact.type = 'text'; contact.maxLength = 200; contact.autocomplete = 'email';
    var send = el('button', 'lc-btn', 'Send the note'); send.type = 'submit';
    var out = el('p', 'lc-msg'); out.setAttribute('role', 'status');
    [l1, text, l2, contact, send, out].forEach(function (n) { form.appendChild(n); });
    form.appendChild(el('p', 'lc-note', 'Your note is private. It is kept for 30 days for the people who keep this page, along with the city your connection comes from. It is not shown here.'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var body = note(t.name, text.value, contact.value, window.location.pathname);
      if (!body) { out.textContent = 'Write a line first.'; return; }
      send.disabled = true; out.textContent = 'Sending…';
      fetch(API + '/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (d) { return { status: r.status, ok: r.ok && d && d.ok }; }); })
        .then(function (res) {
          if (res.ok) { text.value = ''; contact.value = ''; out.textContent = 'Sent. Thank you.'; }
          else out.textContent = res.status === 429 ? 'Too many notes from this connection. Try again in a minute.' : 'That did not send. Try again, or write to mh@pointcast.xyz.';
        }).catch(function () { out.textContent = 'That did not send. Try again, or write to mh@pointcast.xyz.'; })
        .then(function () { send.disabled = false; });
    });
    box.appendChild(form); box.hidden = false;
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
    if ((r.elsewhere || []).length) {
      var se = section('Elsewhere', 'Towns from farther away, built with the same kit. They are not in the totals above.');
      var ul = el('ul', 'lc-samples');
      r.elsewhere.forEach(function (t) {
        var li = el('li'), a = el('a', '', t.name + (t.status === 'draft' ? ' (draft)' : '')); a.href = BASE + t.slug + '/';
        var left = el('span'); left.appendChild(a); li.appendChild(left);
        li.appendChild(el('em', '', t.region + ' · ' + t.postings.toLocaleString('en-US') + ' postings')); ul.appendChild(li);
      });
      se.appendChild(ul); root.appendChild(se);
    }
    root.appendChild(method());
  }

  function method() {
    var s = section('How to read this');
    s.appendChild(key());
    [
      'Job figures are a count of live postings in a LinkedIn-based feed (BlitzAPI, through Firecrawl) for the 30 days before the count. The date of the count is at the top of the page. A posting is not a job: one posting can cover several hires, and one job can be posted twice.',
      'That feed is strongest on large employers and office work. Restaurants, schools, trades and small shops hire in ways it mostly misses, so low numbers there may be a blind spot, not a finding.',
      'Postings are placed by the city named in the listing, which for a big employer is often the head office.',
      'Each Census figure shows its own date. They describe residents, not the people who work in the town.',
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
