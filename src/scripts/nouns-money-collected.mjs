export function initCollectedHub() {
  const search = document.querySelector('#nc-search');
  if (!search || search.dataset.ready) return;
  search.dataset.ready = 'true';
  const cards = [...document.querySelectorAll('[data-nc-search]')];
  const count = document.querySelector('#nc-count');
  const empty = document.querySelector('[data-nc-empty]');
  search.addEventListener('input', () => {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !terms.every(term => card.dataset.ncSearch.includes(term));
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} of ${cards.length} collections`;
    empty.hidden = visible !== 0;
  });
  function revealAnchor() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = id && document.getElementById(id);
    if (!target) return;
    let details = target.closest('details');
    let changed = false;
    while (details) { if (!details.open) { details.open = true; changed = true; } details = details.parentElement.closest('details'); }
    if (changed) requestAnimationFrame(() => target.scrollIntoView());
  }
  revealAnchor();
  window.addEventListener('hashchange', revealAnchor);
  document.addEventListener('astro:before-swap', () => window.removeEventListener('hashchange', revealAnchor), { once: true });
}
