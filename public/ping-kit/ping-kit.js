/* Ping Kit — draws the ping network from /ping-kit/network.json.
 *
 * Each town is a dot placed by its latitude and longitude, sized by how many
 * jobs it posted. Selecting a town loads its own ping file and shows it.
 */
(function () {
  'use strict';
  // Place a point inside the map box. Longitude is squeezed by the cosine of
  // the latitude so the towns keep their real shape on the ground.
  function project(lat, lon, box, w, h, pad) {
    var k = Math.cos(((box.minLat + box.maxLat) / 2) * Math.PI / 180);
    var spanX = (box.maxLon - box.minLon) * k, spanY = box.maxLat - box.minLat;
    var scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
    var offX = (w - spanX * scale) / 2, offY = (h - spanY * scale) / 2;
    return { x: offX + (lon - box.minLon) * k * scale, y: offY + (box.maxLat - lat) * scale };
  }
  function bounds(towns) {
    var b = { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 };
    towns.forEach(function (t) {
      b.minLat = Math.min(b.minLat, t.lat); b.maxLat = Math.max(b.maxLat, t.lat);
      b.minLon = Math.min(b.minLon, t.lon); b.maxLon = Math.max(b.maxLon, t.lon);
    });
    return b;
  }
  // Dot radius: area grows with postings, so a town with four times the jobs looks four times as big.
  function radius(postings, max) { return 4 + 14 * Math.sqrt(Math.max(0, postings) / Math.max(1, max)); }
  // Each pair of neighbors once, whichever town listed the other.
  function links(towns) {
    var seen = {}, out = [];
    towns.forEach(function (t) {
      (t.neighbors || []).forEach(function (n) {
        var key = [t.slug, n].sort().join('|');
        if (!seen[key]) { seen[key] = true; out.push([t.slug, n]); }
      });
    });
    return out;
  }
  var PURE = { project: project, bounds: bounds, radius: radius, links: links };
  if (typeof module !== 'undefined' && module.exports) { module.exports = PURE; }
  if (typeof document === 'undefined') return;

  var NS = 'http://www.w3.org/2000/svg', W = 360, H = 400;
  var LABEL = { 'el-segundo': 'top', 'torrance': 'bottom' };
  var svg = document.getElementById('pk-svg'), card = document.getElementById('pk-card');
  function s(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

  function show(town, groups) {
    Object.keys(groups).forEach(function (k) { groups[k].classList.toggle('sel', k === town.slug); groups[k].classList.toggle('on', k === town.slug); });
    card.textContent = 'Reading ' + town.town + '’s ping…';
    fetch(town.ping.replace('https://pointcast.xyz', '')).then(function (r) { return r.json(); }).then(function (p) {
      card.textContent = '';
      card.appendChild(el('h3', '', p.town));
      var dl = el('dl');
      p.signals.forEach(function (sig) {
        dl.appendChild(el('dt', '', sig.label));
        var v = typeof sig.value === 'number' ? sig.value.toLocaleString('en-US') : sig.value + (sig.count ? ' (' + sig.count + ')' : '');
        dl.appendChild(el('dd', '', v + ' · grade ' + sig.grade));
      });
      dl.appendChild(el('dt', '', 'Needs'));
      dl.appendChild(el('dd', '', p.needs.map(function (n) { return n.need + ' (' + n.confidence + ' confidence)'; }).join('. ') + '.'));
      dl.appendChild(el('dt', '', 'Asks'));
      dl.appendChild(el('dd', '', p.asks.join(' ')));
      card.appendChild(dl);
      var row = el('div', 'pk-links');
      [['The full town page', p.home.replace('https://pointcast.xyz', '')], ['The ping file', town.ping.replace('https://pointcast.xyz', '')]].forEach(function (l) {
        var a = el('a', '', l[0]); a.href = l[1]; row.appendChild(a);
      });
      card.appendChild(row);
    }).catch(function () { card.textContent = 'That ping did not load. Try another town.'; });
  }

  function draw(net) {
    var towns = net.towns, box = bounds(towns), pos = {}, groups = {};
    var max = Math.max.apply(null, towns.map(function (t) { return t.jobs_posted_30d; }));
    towns.forEach(function (t) { pos[t.slug] = project(t.lat, t.lon, box, W, H, 46); });
    // The coast runs down the west side of these towns.
    svg.appendChild(s('path', { class: 'sea', d: 'M0 0 L' + (pos['el-segundo'].x - 26) + ' 0 L' + (pos['hermosa-beach'].x - 22) + ' ' + pos['hermosa-beach'].y + ' L' + (pos['redondo-beach'].x - 30) + ' ' + H + ' L0 ' + H + ' Z' }));
    links(towns).forEach(function (l) {
      if (!pos[l[0]] || !pos[l[1]]) return;
      svg.appendChild(s('line', { class: 'link', x1: pos[l[0]].x, y1: pos[l[0]].y, x2: pos[l[1]].x, y2: pos[l[1]].y }));
    });
    towns.forEach(function (t) {
      var p = pos[t.slug], r = radius(t.jobs_posted_30d, max);
      var g = s('g', {}); groups[t.slug] = g;
      g.appendChild(s('circle', { class: 'ring', cx: p.x, cy: p.y, r: 4 }));
      var dot = s('circle', { class: 'dot', cx: p.x, cy: p.y, r: r, tabindex: 0, role: 'button',
        'aria-label': t.town + ': ' + t.jobs_posted_30d.toLocaleString('en-US') + ' jobs posted in 30 days' });
      dot.addEventListener('click', function () { show(t, groups); });
      dot.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(t, groups); } });
      g.appendChild(dot);
      // Labels sit to the right unless that would run into a neighbor or off the map.
      var side = LABEL[t.slug] || (p.x < W * 0.85 ? 'right' : 'left');
      var label = side === 'top' ? s('text', { x: p.x, y: p.y - r - 7, 'text-anchor': 'middle' })
        : side === 'bottom' ? s('text', { x: p.x, y: p.y + r + 14, 'text-anchor': 'middle' })
        : s('text', { x: side === 'right' ? p.x + r + 5 : p.x - r - 5, y: p.y + 4, 'text-anchor': side === 'right' ? 'start' : 'end' });
      label.textContent = t.town; g.appendChild(label);
      svg.appendChild(g);
    });
    var first = towns.filter(function (t) { return t.slug === 'el-segundo'; })[0] || towns[0];
    show(first, groups);
  }

  fetch('/ping-kit/network.json').then(function (r) { return r.json(); }).then(draw)
    .catch(function () { card.textContent = 'The network file did not load. Try again in a moment.'; });

  fetch('/local-census/hermosa-beach/ping.json').then(function (r) { return r.json(); }).then(function (p) {
    var short = { ping: p.ping, town: p.town, updated: p.updated, signals: p.signals.slice(1, 3), needs: p.needs.slice(0, 1), asks: p.asks.slice(0, 2), neighbors: p.neighbors };
    document.getElementById('pk-sample').textContent = JSON.stringify(short, null, 2);
  }).catch(function () { document.getElementById('pk-sample').textContent = 'The sample did not load.'; });

  document.getElementById('pk-copy').addEventListener('click', function () {
    var note = document.getElementById('pk-copied');
    fetch('/ping-kit/brief.md').then(function (r) { return r.text(); })
      .then(function (t) { return navigator.clipboard.writeText(t); })
      .then(function () { note.textContent = 'Copied.'; })
      .catch(function () { note.textContent = 'Copy did not work here. Open the brief and copy it from there.'; });
  });
})();
