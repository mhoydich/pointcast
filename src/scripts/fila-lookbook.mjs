export function initFilaLookbooks(doc = document) {
  for (const root of doc.querySelectorAll('[data-fila-lookbook]')) {
    if (root.dataset.initialized) continue;
    root.dataset.initialized = 'true';
    const win = doc.defaultView;
    const track = root.querySelector('[data-look-track]');
    const cards = [...root.querySelectorAll('[data-look]')];
    const dialog = root.querySelector('[data-look-dialog]');
    const dialogImage = root.querySelector('[data-dialog-image]');
    const stage = root.querySelector('[data-dialog-stage]');
    const reduced = () => win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let palette = 'all', garment = 'all', current = 0, openedCard, opener;
    const visible = () => cards.filter(card => !card.hidden);
    const viewName = view => view === 'detail' ? 'detail crop' : `${view} view`;
    function setView(card, view) {
      const img = card.querySelector('[data-look-image]');
      img.src = img.dataset[view];
      img.dataset.currentView = view;
      img.alt = `AI-generated independent concept, look ${card.dataset.lookId}: ${card.querySelector('.look-outfit').textContent}, ${viewName(view)}.`;
      card.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    }
    function page() {
      const count = visible().length;
      current = Math.max(0, Math.min(current, count - 1));
      root.querySelector('[data-page]').textContent = count ? `${String(current + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}` : '00 / 00';
      root.querySelectorAll('[data-prev],[data-next]').forEach(button => button.disabled = count < 2);
    }
    function go(index) {
      const list = visible();
      if (!list.length) return;
      current = (index + list.length) % list.length;
      const offset = list[current].offsetLeft - list[0].offsetLeft;
      track.scrollTo({ left: offset, behavior: reduced() ? 'instant' : 'smooth' });
      page();
    }
    function filter() {
      cards.forEach(card => card.hidden = (palette !== 'all' && card.dataset.capsule !== palette) || (garment !== 'all' && card.dataset.category !== garment));
      const count = visible().length;
      root.querySelector('[data-result-count]').textContent = `${count} ${count === 1 ? 'look' : 'looks'}`;
      root.querySelector('[data-empty]').hidden = count > 0;
      track.hidden = count === 0;
      current = 0;
      track.scrollTo({left:0, behavior:'instant'});
      page();
    }
    root.querySelectorAll('[data-palette]').forEach(button => button.addEventListener('click', () => {
      palette = button.dataset.palette;
      root.querySelectorAll('[data-palette]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      filter();
    }));
    root.querySelector('[data-garment]').addEventListener('change', event => { garment = event.target.value; filter(); });
    root.querySelector('[data-reset]').addEventListener('click', () => {
      palette = garment = 'all';
      root.querySelector('[data-garment]').value = 'all';
      root.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === 'all')));
      filter();
    });
    root.querySelector('[data-prev]').addEventListener('click', () => go(current - 1));
    root.querySelector('[data-next]').addEventListener('click', () => go(current + 1));
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); go(current + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    let scrollTimer;
    track.addEventListener('scroll', () => {
      win.clearTimeout(scrollTimer);
      scrollTimer = win.setTimeout(() => {
        const list = visible();
        if (!list.length) return;
        const first = list[0].offsetLeft;
        let distance = Infinity;
        list.forEach((card, index) => {
          const delta = Math.abs(card.offsetLeft - first - track.scrollLeft);
          if (delta < distance) { distance = delta; current = index; }
        });
        page();
      }, 140);
    }, { passive: true });
    function dialogView(view) {
      if (!openedCard) return;
      const img = openedCard.querySelector('[data-look-image]');
      dialogImage.src = img.dataset[view];
      dialogImage.alt = `AI-generated independent concept, look ${openedCard.dataset.lookId}, ${viewName(view)}.`;
      root.querySelectorAll('[data-dialog-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dialogView === view)));
      root.querySelector('[data-dialog-caption]').textContent = `Original AI-generated independent 2027 concept / ${viewName(view)}. ${view === 'detail' ? 'Detail is a crop of the front render; it is not a physical fabric sample.' : 'Imagined garment view; not an official FILA product.'}`;
      stage.classList.remove('magnified');
      stage.scrollTo({left:0,top:0,behavior:'instant'});
      root.querySelector('[data-magnify]').setAttribute('aria-pressed','false');
      root.querySelector('[data-magnify]').textContent = 'Magnify +';
    }
    cards.forEach(card => {
      card.querySelector('[data-view-controls]').hidden = false;
      card.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(card, button.dataset.view)));
      const enlarge = card.querySelector('[data-enlarge]');
      if (typeof dialog.showModal === 'function') {
        enlarge.disabled = false;
        card.querySelector('[data-zoom-hint]').hidden = false;
        enlarge.addEventListener('click', () => {
          openedCard = card; opener = enlarge;
          root.querySelector('[data-dialog-title]').textContent = `Look ${card.dataset.lookId} / ${card.querySelector('h3').textContent}`;
          dialogView(card.querySelector('[data-look-image]').dataset.currentView || 'front');
          dialog.showModal();
          root.querySelector('[data-close]').focus();
        });
      }
    });
    root.querySelectorAll('[data-dialog-view]').forEach(button => button.addEventListener('click', () => dialogView(button.dataset.dialogView)));
    root.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => opener?.focus());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    root.querySelector('[data-magnify]').addEventListener('click', event => {
      const active = stage.classList.toggle('magnified');
      event.currentTarget.setAttribute('aria-pressed',String(active));
      event.currentTarget.textContent = active ? 'Fit image −' : 'Magnify +';
    });
    root.querySelector('[data-book-controls]').hidden = false;
    root.querySelector('[data-book-help]').textContent = 'Swipe / scroll. Use ← → when the gallery is focused. Tap image to enlarge.';
    page();
  }
}
