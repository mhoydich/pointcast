import { NounsMoneyCollection, DEVICE_COLLECTION_KEY } from '../lib/nouns-money/collection';
import { SOURCE_NOTES } from '../lib/nouns-money/catalog';
let disposeCollection = () => {};
export function mountCollectionAreas() {
  disposeCollection();
  const roots = [...document.querySelectorAll<HTMLElement>('[data-nm-collection]')];
  if (!roots.length) return;
  const collection = new NounsMoneyCollection();
  const subscriptions = roots.map(root => collection.subscribe(view => {
    root.querySelector('[data-nm-count]')!.textContent = `${view.noteIds.length} / 100`;
    root.querySelector('[data-nm-collection-status]')!.textContent = view.message;
    const only = root.querySelector<HTMLInputElement>('[data-nm-collected-only]')?.checked;
    root.querySelectorAll<HTMLElement>('[data-nm-note]').forEach(card => {
      const kept = view.noteIds.includes(card.dataset.nmNote!);
      card.hidden = Boolean(only && !kept);
      card.classList.toggle('is-collected', kept);
      const button = card.querySelector<HTMLButtonElement>('[data-nm-toggle]')!;
      button.disabled = view.busy || view.storage === 'unavailable';
      button.setAttribute('aria-pressed', String(kept)); button.textContent = kept ? 'Remove' : 'Collect';
      button.setAttribute('aria-label', `${kept ? 'Remove' : 'Collect'} Noun #${SOURCE_NOTES.find(note => note.id === card.dataset.nmNote)?.nounId}`);
    });
    const empty = root.querySelector<HTMLElement>('[data-nm-empty]');
    if (empty) empty.hidden = !only || view.noteIds.length > 0;
    const shelf = root.querySelector('[data-nm-shelf]');
    if (shelf) {
      shelf.replaceChildren();
      const notes = SOURCE_NOTES.filter(note => view.noteIds.includes(note.id));
      if (!notes.length) { const p = document.createElement('p'); p.textContent = view.busy ? 'Reading your shelf…' : 'Your shelf is ready for a first note.'; shelf.append(p); }
      for (const note of notes) {
        const card = document.createElement('article');
        const img = document.createElement('img'); img.src = note.image; img.alt = `Nouns Money · Noun #${note.nounId}`; img.width = 1000; img.height = 500; img.loading = 'lazy';
        const button = document.createElement('button'); button.type = 'button'; button.dataset.nmToggle = note.id; button.disabled = view.busy; button.textContent = `Remove #${note.nounId}`;
        card.append(img, button); shelf.append(card);
      }
    }
    root.querySelector<HTMLButtonElement>('[data-nm-refresh]')!.disabled = view.busy;
  }));
  const click = (event: Event) => {
    const target = (event.target as Element).closest<HTMLElement>('[data-nm-toggle], [data-nm-refresh]');
    if (!target || !roots.some(root => root.contains(target))) return;
    if (target.hasAttribute('data-nm-refresh')) void collection.refresh(); else void collection.toggle(target.dataset.nmToggle!);
  };
  const change = (event: Event) => { if ((event.target as Element).matches('[data-nm-collected-only]')) { for (const root of roots) root.querySelectorAll<HTMLElement>('[data-nm-note]').forEach(card => { card.hidden = Boolean(root.querySelector<HTMLInputElement>('[data-nm-collected-only]')?.checked && !collection.view.noteIds.includes(card.dataset.nmNote!)); }); const empty=document.querySelector<HTMLElement>('[data-nm-empty]'); if(empty)empty.hidden=!(event.target as HTMLInputElement).checked||collection.view.noteIds.length>0; } };
  const refresh = () => { void collection.refresh(); };
  const storage = (event: StorageEvent) => { if (event.key === DEVICE_COLLECTION_KEY || event.key === null) collection.deviceStorageChanged(); if (event.key === null || ['pc:wallet','pc:wallet-active','pc:auth:last-user'].includes(event.key || '')) refresh(); };
  const focus = () => { refresh(); };
  document.addEventListener('click', click); document.addEventListener('change', change);
  window.addEventListener('pc:auth-change', refresh); window.addEventListener('pc:auth-refresh', refresh); window.addEventListener('storage', storage); window.addEventListener('focus', focus);
  disposeCollection = () => { subscriptions.forEach(unsubscribe => unsubscribe()); collection.dispose(); document.removeEventListener('click', click); document.removeEventListener('change', change); window.removeEventListener('pc:auth-change', refresh); window.removeEventListener('pc:auth-refresh', refresh); window.removeEventListener('storage', storage); window.removeEventListener('focus', focus); };
  void collection.refresh();
}
