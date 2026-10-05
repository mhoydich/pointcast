const mounted = new WeakMap();
const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function matchesShelfBook(searchText, themes, query, theme) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return (theme === 'all' || themes.includes(theme)) && words.every((word) => normalize(searchText).includes(word));
}

/** Enhance a fully readable shelf; search and themes combine without persistence. */
export function mountBookshelf(root) {
  if (mounted.has(root)) return mounted.get(root);
  const controls = root.querySelector('[data-shelf-controls]');
  const input = root.querySelector('[data-shelf-search]');
  const reset = root.querySelector('[data-shelf-reset]');
  const status = root.querySelector('[data-shelf-status]');
  const empty = root.querySelector('[data-shelf-empty]');
  const buttons = [...root.querySelectorAll('[data-shelf-theme]')];
  const cards = [...root.querySelectorAll('[data-shelf-book]')];
  if (!controls || !input || !reset || !status || !empty || !cards.length) return () => {};
  let theme = 'all';
  const update = () => {
    let count = 0;
    for (const card of cards) {
      const show = matchesShelfBook(card.dataset.shelfSearch, (card.dataset.shelfThemes || '').split(' '), input.value, theme);
      card.hidden = !show;
      if (show) count += 1;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.shelfTheme === theme));
    status.textContent = `${count} of ${cards.length} reading doors shown.`;
    empty.hidden = count !== 0;
    reset.disabled = theme === 'all' && !input.value;
  };
  const onReset = () => { input.value = ''; theme = 'all'; update(); input.focus(); };
  const handlers = buttons.map((button) => {
    const handle = () => { theme = button.dataset.shelfTheme; update(); };
    button.addEventListener('click', handle);
    return [button, handle];
  });
  input.addEventListener('input', update);
  reset.addEventListener('click', onReset);
  controls.hidden = false;
  update();
  const dispose = () => {
    input.removeEventListener('input', update);
    reset.removeEventListener('click', onReset);
    handlers.forEach(([button, handle]) => button.removeEventListener('click', handle));
    cards.forEach((card) => { card.hidden = false; });
    empty.hidden = true;
    controls.hidden = true;
    status.textContent = `All ${cards.length} reading doors shown.`;
    mounted.delete(root);
  };
  mounted.set(root, dispose);
  return dispose;
}
