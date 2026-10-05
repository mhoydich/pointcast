/**
 * Fill a Daily Almanac card from /almanac.json.
 * The page prints no heights, indexes, or temperatures until this read returns.
 */

const card = document.querySelector('[data-almanac-card]');

function paint(root, data) {
  const lines = data?.card || data;
  for (const key of ['tide', 'marine', 'basket', 'pick', 'weather']) {
    const line = root.querySelector(`[data-line="${key}"]`);
    const flag = root.querySelector(`[data-flag="${key}"]`);
    const row = lines?.[key];
    if (line) line.textContent = row?.line || 'Missing.';
    if (flag) {
      const missing = row?.status !== 'present';
      flag.textContent = missing ? 'missing' : 'on the card';
      flag.classList.toggle('is-missing', missing);
    }
  }
}

if (card) {
  const date = card.getAttribute('data-date');
  fetch(`/almanac.json?date=${encodeURIComponent(date || '')}`, { headers: { accept: 'application/json' } })
    .then((response) => response.json())
    .then((body) => paint(card, body))
    .catch(() => paint(card, {}));
}

const todayMark = document.querySelector('[data-almanac-binder]');
if (todayMark) {
  fetch('/almanac.json', { headers: { accept: 'application/json' } })
    .then((response) => response.json())
    .then((body) => {
      const today = body?.today;
      if (!today) return;
      const hit = todayMark.querySelector(`[data-card-date="${today}"]`);
      if (hit) hit.classList.add('is-today');
    })
    .catch(() => {});
}
