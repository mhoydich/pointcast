export function setupEditorialReview(root = document) {
  for (const form of root.querySelectorAll('[data-editorial-filter]')) {
    if (form.dataset.bound) continue;
    form.dataset.bound = 'true';
    const section = form.closest('section');
    const cards = [...section.querySelectorAll('[data-card]')];
    const apply = () => {
      const values = Object.fromEntries(new FormData(form));
      let count = 0;
      for (const card of cards) {
        const query = String(values.query || '').trim().toLowerCase();
        const matches = (!query || card.textContent.toLowerCase().includes(query)) &&
          (!values.group || card.dataset.group === values.group) &&
          (!values.status || card.dataset.status === values.status);
        card.hidden = !matches;
        if (matches) count++;
      }
      section.querySelector('[data-count]').textContent = `${count} of ${cards.length} cards`;
      section.querySelector('[data-empty]').hidden = count !== 0;
    };
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    form.addEventListener('reset', () => setTimeout(apply, 0));
  }
}
