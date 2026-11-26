// PointCast front page prototype: fills the instrument panel and the newest posts
// from same-origin JSON. If a source fails, the gauge says "unavailable". Never a made-up number.
(function () {
  'use strict';
  var TIMEOUT = 6000;

  function get(url) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : 0;
    return fetch(url, { headers: { accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .finally(function () { clearTimeout(timer); });
  }

  function gauge(name, text, live, title) {
    var el = document.querySelector('[data-gauge="' + name + '"]');
    if (!el) return;
    var val = el.querySelector('[data-val]');
    val.textContent = text;
    if (title) val.title = title; else val.removeAttribute('title');
    el.setAttribute('data-state', live ? 'live' : 'off');
    if (text !== 'unavailable') ok += 1;
  }

  var fmt = new Intl.NumberFormat('en-US');
  var ok = 0;
  var jobs = [];

  jobs.push(get('/now-playing.json').then(function (d) {
    if (d && d.live && d.status === 'playing' && d.title) {
      var t = d.title + (d.artist ? ' / ' + d.artist : '');
      gauge('air', t, true, t);
    } else {
      gauge('air', 'Off air', false);
    }
  }, function () { gauge('air', 'unavailable', false); }));

  jobs.push(get('/api/presence/snapshot').then(function (d) {
    var h = Number(d && d.humans), a = Number(d && d.agents);
    if (!isFinite(h) || !isFinite(a)) throw new Error('shape');
    gauge('here', h + (h === 1 ? ' person' : ' people') + ', ' + a + (a === 1 ? ' agent' : ' agents'), h + a > 0);
  }).catch(function () { gauge('here', 'unavailable', false); }));

  jobs.push(get('/api/drum').then(function (d) {
    var n = Number(d && d.globalTotal);
    if (!isFinite(n)) throw new Error('shape');
    gauge('drum', fmt.format(n), true);
  }).catch(function () { gauge('drum', 'unavailable', false); }));

  jobs.push(get('/api/weather?lat=33.9192&lng=-118.4165&label=El%20Segundo').then(function (d) {
    var f = Number(d && d.tempF);
    if (!d || !d.ok || !isFinite(f)) throw new Error('shape');
    gauge('sky', Math.round(f) + '°F' + (d.condition ? ', ' + d.condition : ''), true);
  }).catch(function () { gauge('sky', 'unavailable', false); }));

  var list = document.querySelector('[data-latest]');
  jobs.push(get('/now.json').then(function (d) {
    var items = (d && Array.isArray(d.latest) ? d.latest : []).filter(function (b) {
      return b && /^\d{4}$/.test(String(b.id)) && typeof b.title === 'string';
    }).slice(0, 5);
    if (!items.length || !list) return;
    var frag = document.createDocumentFragment();
    items.forEach(function (b) {
      var li = document.createElement('li');
      var meta = document.createElement('span');
      var when = new Date(b.timestamp);
      if (!isNaN(when)) {
        var time = document.createElement('time');
        time.dateTime = when.toISOString();
        time.textContent = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' });
        meta.appendChild(time);
      }
      var body = document.createElement('span');
      var a = document.createElement('a');
      a.href = '/b/' + b.id;
      a.textContent = b.title;
      body.appendChild(a);
      if (typeof b.channel === 'string' && /^[A-Z]{2,4}$/.test(b.channel)) {
        var ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = b.channel;
        body.appendChild(ch);
      }
      li.appendChild(meta);
      li.appendChild(body);
      frag.appendChild(li);
    });
    var all = document.createElement('li');
    all.className = 'posts-empty';
    all.innerHTML = '<a href="/archive">All posts in the archive</a>';
    frag.appendChild(all);
    list.replaceChildren(frag);
  }).catch(function () { /* keep the archive link that is already in the HTML */ }));

  Promise.all(jobs.map(function (p) { return p.catch(function () {}); })).then(function () {
    var s = document.querySelector('[data-status]');
    if (!s) return;
    var t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
    s.textContent = ok
      ? 'Read at ' + t + ' Pacific. A filled square means live; a hollow one means off or unavailable.'
      : 'Live readings are unavailable right now (checked ' + t + ' Pacific). Nothing here is estimated.';
  });
})();
