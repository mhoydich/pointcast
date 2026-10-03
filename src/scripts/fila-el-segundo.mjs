const STORAGE_KEY = 'pointcast:fila-el-segundo:afternoon-edit:v1';
const CANONICAL = 'https://pointcast.xyz/fila/el-segundo/';

/** Enhance the complete server-rendered collection; storage and clipboard are optional. */
export function initElSegundoCollection(doc = document) {
  const win = doc.defaultView;
  if (!win) return;
  for (const root of doc.querySelectorAll('[data-fila-el-segundo]')) {
    if (root.dataset.esInitialized === 'true') continue;
    const track = root.querySelector('[data-es-track]');
    const cards = [...root.querySelectorAll('[data-es-look]')];
    if (!track || !cards.length) continue;
    const q = selector => root.querySelector(selector);
    const all = selector => [...root.querySelectorAll(selector)];
    const known = new Set(cards.map(card => card.dataset.lookId));
    const validate = ids => [...new Set(ids.filter(id => known.has(id)))].slice(0, 3);
    const parse = raw => {
      try { const value = JSON.parse(raw); return Array.isArray(value) ? validate(value) : []; }
      catch { return []; }
    };
    let saved = [], storageAvailable = true;
    try { saved = parse(win.localStorage.getItem(STORAGE_KEY)); }
    catch { storageAvailable = false; }
    try {
      const url = new URL(win.location.href);
      if (url.searchParams.has('edit')) saved = validate((url.searchParams.get('edit') || '').split(','));
    } catch { /* The collection also works in a document without a parseable URL. */ }
    let chapter = 'all', garment = 'all', savedOnly = false, current = 0;
    let openedCard = null, opener = null, scrollTimer, copyRequest = 0;
    const dialog = q('[data-es-dialog]');
    const stage = q('[data-es-dialog-stage]');
    const dialogImage = q('[data-es-dialog-image]');
    const viewName = view => view === 'detail' ? 'detail crop' : `${view} view`;
    const views = new Set(['front', 'back', 'detail']);
    const reduced = () => typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visible = () => cards.filter(card => !card.hidden);
    const announce = message => { const status = q('[data-es-status]'); if (status) status.textContent = message; };
    const stableControl = () => q('[data-es-saved-only]') || q('[data-es-reset]') || track;
    const focusable = node => node?.isConnected && !node.closest('[hidden]') && !node.disabled;
    const orderedSaved = () => cards.filter(card => saved.includes(card.dataset.lookId)).map(card => card.dataset.lookId);
    const shareURL = () => {
      const url = new URL(CANONICAL);
      const ids = orderedSaved();
      if (ids.length) url.searchParams.set('edit', ids.join(','));
      // URLSearchParams encodes commas; the readable canonical form is intentional.
      return ids.length ? `${CANONICAL}?edit=${ids.join(',')}` : url.href;
    };
    function persist() {
      if (!storageAvailable) return;
      try { win.localStorage.setItem(STORAGE_KEY, JSON.stringify(orderedSaved())); }
      catch { storageAvailable = false; }
    }
    function scrollToLook(index) {
      const list = visible();
      if (!list.length) return;
      current = Math.max(0, Math.min(index, list.length - 1));
      const left = Math.max(0, list[current].offsetLeft - list[0].offsetLeft);
      if (typeof track.scrollTo === 'function') track.scrollTo({ left, behavior: reduced() ? 'instant' : 'smooth' });
      else track.scrollLeft = left;
      updatePage();
    }
    function updatePage() {
      const count = visible().length;
      current = Math.max(0, Math.min(current, count - 1));
      q('[data-es-page]').textContent = count ? `${String(current + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}` : '00 / 00';
      q('[data-es-prev]').disabled = count < 2 || current === 0;
      q('[data-es-next]').disabled = count < 2 || current >= count - 1;
    }
    function applyFilters(resetPosition = true) {
      const previousCard = visible()[current];
      const shouldHide = card => (chapter !== 'all' && card.dataset.chapter !== chapter)
        || (garment !== 'all' && card.dataset.category !== garment)
        || (savedOnly && !saved.includes(card.dataset.lookId));
      const activeCard = doc.activeElement?.closest('[data-es-look]');
      // Move focus before removing the card containing it from the accessibility tree.
      if (activeCard && root.contains(activeCard) && shouldHide(activeCard)) stableControl().focus();
      cards.forEach(card => { card.hidden = shouldHide(card); });
      const count = visible().length;
      if (!count && doc.activeElement === track) stableControl().focus();
      q('[data-es-result-count]').textContent = `${count} ${count === 1 ? 'look' : 'looks'}`;
      q('[data-es-empty]').hidden = count !== 0;
      track.hidden = count === 0;
      if (resetPosition) {
        current = 0;
        if (typeof track.scrollTo === 'function') track.scrollTo({ left: 0, behavior: 'instant' });
        else track.scrollLeft = 0;
      } else {
        const previousIndex = visible().indexOf(previousCard);
        current = previousIndex >= 0 ? previousIndex : Math.min(current, Math.max(0, count - 1));
        if (savedOnly && count) scrollToLook(current);
      }
      updatePage();
    }
    function updateChapterButtons() {
      all('[data-es-chapter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.esChapter === chapter)));
    }
    function resetFilters() {
      chapter = garment = 'all'; savedOnly = false;
      q('[data-es-garment]').value = 'all';
      q('[data-es-saved-only]').setAttribute('aria-pressed', 'false');
      updateChapterButtons(); applyFilters();
    }
    function updateEdit() {
      const ids = orderedSaved();
      q('[data-es-saved-count]').textContent = `${ids.length} / 3`;
      q('[data-es-clear]').disabled = ids.length === 0;
      q('[data-es-copy]').disabled = ids.length === 0;
      cards.forEach(card => {
        const active = ids.includes(card.dataset.lookId), button = card.querySelector('[data-es-save]');
        button.setAttribute('aria-pressed', String(active));
        button.textContent = active ? 'Saved ✓' : 'Save +';
        button.setAttribute('aria-label', `${active ? 'Remove' : 'Save'} look ${card.dataset.lookId}, ${card.querySelector('h3').textContent.trim()}${active ? ' from your afternoon edit' : ' to your afternoon edit'}`);
      });
      const list = q('[data-es-saved-list]');
      list.replaceChildren();
      ids.forEach(id => {
        const card = cards.find(item => item.dataset.lookId === id);
        const item = doc.createElement('li'), button = doc.createElement('button');
        button.type = 'button';
        button.textContent = `${id} / ${card.querySelector('h3').textContent.trim()}`;
        button.setAttribute('aria-label', `Show saved look ${id}, ${card.querySelector('h3').textContent.trim()}`);
        button.addEventListener('click', () => {
          resetFilters();
          scrollToLook(visible().indexOf(card));
          track.focus({ preventScroll: true });
        });
        item.append(button); list.append(item);
      });
      q('[data-es-edit-empty]').hidden = ids.length !== 0;
      q('[data-es-share-fallback]').hidden = true;
      q('[data-es-share-status]').textContent = '';
      copyRequest += 1; // A changed edit invalidates an outstanding clipboard result.
    }
    function setView(card, rawView) {
      const view = views.has(rawView) ? rawView : 'front';
      const image = card.querySelector('[data-es-image]');
      image.src = image.dataset[view]; image.dataset.currentView = view;
      image.alt = `Original AI-generated independent concept, look ${card.dataset.lookId}: ${card.querySelector('[data-es-outfit]').textContent.trim()}, ${viewName(view)}.`;
      card.querySelector('[data-es-enlarge]').href = image.dataset[view];
      card.querySelectorAll('[data-es-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.esView === view)));
      card.querySelector('[data-es-view-label]').textContent = viewName(view);
    }
    function dialogView(rawView) {
      if (!openedCard || !dialogImage || !stage) return;
      const view = views.has(rawView) ? rawView : 'front';
      const image = openedCard.querySelector('[data-es-image]');
      dialogImage.src = image.dataset[view];
      dialogImage.alt = `Original AI-generated independent concept, look ${openedCard.dataset.lookId}: ${openedCard.querySelector('[data-es-outfit]').textContent.trim()}, ${viewName(view)}.`;
      all('[data-es-dialog-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.esDialogView === view)));
      q('[data-es-dialog-caption]').textContent = `${viewName(view)} · Original AI-generated independent collection concept. ${view === 'detail' ? 'This is a crop of the front rendering, not a physical fabric sample.' : 'Imagined garment view, not an official FILA product or physical sample.'}`;
      stage.classList.remove('is-magnified');
      if (typeof stage.scrollTo === 'function') stage.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      else { stage.scrollTop = 0; stage.scrollLeft = 0; }
      q('[data-es-magnify]').setAttribute('aria-pressed', 'false');
      q('[data-es-magnify]').textContent = 'Magnify +';
    }
    all('[data-es-chapter]').forEach(button => button.addEventListener('click', () => {
      chapter = button.dataset.esChapter; updateChapterButtons(); applyFilters();
    }));
    q('[data-es-garment]').addEventListener('change', event => { garment = event.currentTarget.value; applyFilters(); });
    q('[data-es-reset]').addEventListener('click', resetFilters);
    q('[data-es-saved-only]').addEventListener('click', event => {
      savedOnly = !savedOnly; event.currentTarget.setAttribute('aria-pressed', String(savedOnly)); applyFilters();
    });
    q('[data-es-prev]').addEventListener('click', () => scrollToLook(current - 1));
    q('[data-es-next]').addEventListener('click', () => scrollToLook(current + 1));
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      scrollToLook(event.key === 'Home' ? 0 : event.key === 'End' ? visible().length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    track.addEventListener('scroll', () => {
      win.clearTimeout(scrollTimer);
      scrollTimer = win.setTimeout(() => {
        const list = visible(); if (!list.length) return;
        const first = list[0].offsetLeft;
        let distance = Infinity;
        list.forEach((card, index) => {
          const delta = Math.abs(card.offsetLeft - first - track.scrollLeft);
          if (delta < distance) { distance = delta; current = index; }
        });
        updatePage();
      }, 100);
    }, { passive: true });
    cards.forEach(card => {
      card.querySelectorAll('[data-es-view]').forEach(button => button.addEventListener('click', () => setView(card, button.dataset.esView)));
      card.querySelector('[data-es-save]').addEventListener('click', () => {
        const id = card.dataset.lookId, removing = saved.includes(id);
        if (!removing && saved.length >= 3) { announce('Your edit has three looks. Remove one to make room for another.'); return; }
        if (removing && savedOnly && card.contains(doc.activeElement)) stableControl().focus();
        saved = removing ? saved.filter(value => value !== id) : [...saved, id];
        persist(); updateEdit(); applyFilters(false);
        announce(`Look ${id} ${removing ? 'removed from' : 'added to'} your afternoon edit. ${saved.length} of 3 selected.${storageAvailable ? '' : ' Your edit is saved for this visit.'}`);
      });
      const enlarge = card.querySelector('[data-es-enlarge]');
      if (dialog && typeof dialog.showModal === 'function') enlarge.addEventListener('click', event => {
        event.preventDefault(); openedCard = card; opener = enlarge;
        q('[data-es-dialog-title]').textContent = `Look ${card.dataset.lookId} / ${card.querySelector('h3').textContent.trim()}`;
        dialogView(card.querySelector('[data-es-image]').dataset.currentView || 'front');
        try { dialog.showModal(); q('[data-es-close]').focus(); }
        catch { win.location.assign(enlarge.href); }
      });
    });
    if (dialog) {
      all('[data-es-dialog-view]').forEach(button => button.addEventListener('click', () => dialogView(button.dataset.esDialogView)));
      q('[data-es-close]').addEventListener('click', () => dialog.close());
      dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
      dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); dialog.close(); } });
      dialog.addEventListener('close', () => {
        (focusable(opener) ? opener : stableControl()).focus();
        openedCard = opener = null;
      });
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      });
      q('[data-es-magnify]').addEventListener('click', event => {
        const active = stage.classList.toggle('is-magnified');
        event.currentTarget.setAttribute('aria-pressed', String(active));
        event.currentTarget.textContent = active ? 'Fit image −' : 'Magnify +';
      });
    }
    q('[data-es-clear]').addEventListener('click', () => {
      stableControl().focus(); saved = []; persist(); updateEdit(); applyFilters(); announce('Your afternoon edit is clear.');
    });
    q('[data-es-copy]').addEventListener('click', async () => {
      if (!saved.length) return;
      const url = shareURL(), request = ++copyRequest, status = q('[data-es-share-status]');
      status.textContent = '';
      try {
        if (typeof win.navigator.clipboard?.writeText !== 'function') throw new Error('Clipboard unavailable');
        await win.navigator.clipboard.writeText(url);
        if (request !== copyRequest) return;
        q('[data-es-share-fallback]').hidden = true;
        status.textContent = 'Copied your afternoon edit link.';
      } catch {
        if (request !== copyRequest) return;
        const input = q('[data-es-share-url]'); input.value = url;
        q('[data-es-share-fallback]').hidden = false;
        status.textContent = 'Select and copy your edit link below.';
        input.focus(); input.select();
      }
    });
    // Register every listener before exposing controls. None of the optional APIs gates enhancement.
    root.dataset.esInitialized = 'true';
    root.classList.add('is-enhanced');
    track.tabIndex = 0;
    track.setAttribute('aria-describedby', 'es-gallery-help');
    all('[data-es-js]').forEach(control => { control.hidden = false; });
    q('[data-es-help]').textContent = 'Swipe or scroll. Focus the gallery to use ← →, Home and End. Enlarge any look for a closer view.';
    persist(); updateEdit(); applyFilters();
  }
}
