import { POCKET_KEY, readPocket, SHOPPING_ITEMS, SHOPPING_STUDY } from '../lib/shopping';

const controllers = new WeakMap<HTMLElement, AbortController>();

export function initShoppingPocket() {
  const root = document.querySelector<HTMLElement>('[data-shopping-root]');
  if (!root) return;
  const previous = controllers.get(root);
  if (previous && !previous.signal.aborted) return;
  root.dataset.ready = 'true';
  const controller = new AbortController();
  controllers.set(root, controller);
  const options = { signal: controller.signal };
  document.addEventListener('astro:before-swap', () => {
    controller.abort();
    delete root.dataset.ready;
  }, { once: true, ...options });
  let saved: string[] = [];
  let persistent = true;
  let filter = root.dataset.shoppingDefault === 'saved' ? 'saved' : 'all';
  try { saved = readPocket(localStorage.getItem(POCKET_KEY)); } catch { persistent = false; }
  const status = root.querySelector<HTMLElement>('[data-pocket-status]')!;
  const render = () => {
    document.querySelectorAll<HTMLButtonElement>('[data-pocket-save]').forEach(button => {
      button.hidden = false;
      const id = button.dataset.pocketSave!;
      const selected = saved.includes(id);
      const name = SHOPPING_ITEMS.find(item => item.id === id)?.name ?? id;
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Remove' : 'Save'} ${name}${selected ? ' from saved finds' : ''}`);
      button.textContent = selected ? 'Saved ✓' : 'Save';
    });
    root.querySelectorAll<HTMLElement>('[data-shopping-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shoppingFilter === filter)));
    root.querySelector<HTMLElement>('[data-pocket-count]')!.textContent = `· ${saved.length} saved`;
    root.querySelectorAll<HTMLElement>('[data-shopping-item]').forEach(card => {
      card.hidden = filter === 'saved' && !saved.includes(card.dataset.shoppingItem!);
    });
    root.querySelector<HTMLElement>('[data-pocket-empty]')!.hidden = filter !== 'saved' || saved.length > 0;
    root.querySelector<HTMLElement>('[data-shopping-tools]')!.hidden = false;
    if (!persistent) root.querySelector<HTMLElement>('[data-pocket-storage]')!.textContent = 'Browser storage is unavailable. Your saved list lasts only for this page visit.';
  };
  const persist = () => {
    try { localStorage.setItem(POCKET_KEY, JSON.stringify(saved)); } catch { persistent = false; }
    render();
  };
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-shopping-specs]')) document.querySelector<HTMLButtonElement>('[data-pocket-filter=all]')?.click();
    const save = event.target.closest<HTMLButtonElement>('[data-pocket-save]');
    if (save) {
      const id = save.dataset.pocketSave!;
      if (!SHOPPING_ITEMS.some(item => item.id === id)) return;
      const removing = saved.includes(id);
      saved = removing ? saved.filter(item => item !== id) : [...saved, id];
      persist();
      status.textContent = `${SHOPPING_ITEMS.find(item => item.id === id)!.name} ${removing ? 'removed from' : 'added to'} your saved finds.`;
    }
    const selection = event.target.closest<HTMLButtonElement>('[data-shopping-filter]');
    if (selection) {
      filter = selection.dataset.shoppingFilter!;
      root.querySelectorAll('[data-shopping-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === selection)));
      render();
    }
    if (event.target.closest('[data-pocket-clear]')) { saved = []; persist(); status.textContent = 'Saved list cleared from this browser.'; }
  }, options);
  const track = (event: MouseEvent) => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('[data-shop-link]');
    if (!link || !SHOPPING_ITEMS.some(item => item.id === link.dataset.shopLink)) return;
    try {
      void fetch('/api/shopping-metrics', { method: 'POST', credentials: 'omit', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study: SHOPPING_STUDY, product: link.dataset.shopLink, eventId: crypto.randomUUID() })
      }).catch(() => {});
    } catch { /* Merchant navigation always works when telemetry is unavailable. */ }
  };
  document.addEventListener('click', track, options);
  document.addEventListener('auxclick', track, options);
  window.addEventListener('storage', event => {
    if (event.key !== POCKET_KEY && event.key !== null) return;
    saved = readPocket(event.newValue); render();
  }, options);
  render();
}
