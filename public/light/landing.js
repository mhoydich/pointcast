/* Light Companion — the landing page (/light/). */
(function () {
  'use strict';
  var make = document.getElementById('make');
  var note = document.getElementById('make-note');

  function remembered() {
    try { var all = JSON.parse(localStorage.getItem('pc:light:circles') || '{}'); return all && typeof all === 'object' ? all : {}; } catch (e) { return {}; }
  }
  var mine = remembered();
  var ids = Object.keys(mine).filter(function (id) { return /^[a-z0-9]{32}$/.test(id); })
    .sort(function (a, b) { return (mine[b].at || 0) - (mine[a].at || 0); });
  if (ids.length) {
    var list = document.getElementById('mine-list');
    ids.forEach(function (id, index) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'btn'; a.href = '/light/c/' + id; a.rel = 'noreferrer';
      var name = typeof mine[id].name === 'string' ? mine[id].name.slice(0, 24) : '';
      a.textContent = name ? 'Open the circle where you are ' + name : 'Open circle ' + (index + 1);
      li.appendChild(a); list.appendChild(li);
    });
    document.getElementById('mine').hidden = false;
  }

  make.addEventListener('click', function () {
    make.disabled = true;
    note.textContent = 'Making a circle…';
    fetch('/api/light', {
      method: 'POST', cache: 'no-store', referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' })
    }).then(function (res) { return res.json(); }).then(function (data) {
      if (data && data.ok && /^\/light\/c\/[a-z0-9]{32}$/.test(data.path || '')) { location.href = data.path; return; }
      throw new Error((data && data.error) || 'no circle');
    }).catch(function (err) {
      make.disabled = false;
      note.textContent = /hour/.test(String(err && err.message)) ? err.message : 'Could not make a circle just now. Nothing was created. Try again in a moment.';
    });
  });
})();
