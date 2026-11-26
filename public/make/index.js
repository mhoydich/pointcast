/* PointCast Make index. Lists every configurator in tools.json. */
(function () {
  'use strict';
  var list = document.getElementById('tools');
  var note = document.getElementById('tools-note');
  function local(p) {
    var rel = String(p || '').replace(/^\/make\//, '');
    if (location.protocol === 'file:' && /\/$/.test(rel)) rel += 'index.html';
    return rel;
  }
  function item(t, i) {
    var li = document.createElement('li');
    li.className = 'mk-item';
    var a = document.createElement('a');
    a.href = local(t.path);
    if (t.thumb) {
      var img = document.createElement('img');
      img.className = 'mk-thumb'; img.src = local(t.thumb); img.alt = ''; img.loading = 'lazy'; img.width = 132; img.height = 132;
      a.appendChild(img);
    } else {
      var ph = document.createElement('span'); ph.className = 'mk-thumb'; ph.setAttribute('aria-hidden', 'true'); a.appendChild(ph);
    }
    var txt = document.createElement('span');
    var no = document.createElement('span'); no.className = 'mk-item-no'; no.textContent = 'No. ' + String(i + 1).padStart(2, '0') + (t.by ? ' · by ' + t.by : '');
    var ti = document.createElement('span'); ti.className = 'mk-item-title'; ti.textContent = t.title;
    var ln = document.createElement('span'); ln.className = 'mk-item-line'; ln.textContent = t.line || '';
    txt.appendChild(no); txt.appendChild(ti); txt.appendChild(ln);
    a.appendChild(txt);
    li.appendChild(a);
    return li;
  }
  fetch('tools.json', { cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (data) {
    list.textContent = '';
    (data.tools || []).forEach(function (t, i) { list.appendChild(item(t, i)); });
    note.textContent = (data.tools || []).length + ' tools. More get added as rows in tools.json.';
  }).catch(function () {
    note.textContent = 'The tool list did not load. Each tool lives at /make/<name>/.';
  });
})();
