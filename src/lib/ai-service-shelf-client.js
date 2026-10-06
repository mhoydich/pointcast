export function setupAIServiceShelf() {
  for (const shelf of document.querySelectorAll('[data-ai-service-shelf]')) {
    if (shelf.dataset.ready) continue;
    const form = shelf.querySelector('[data-ai-service-filter]');
    if (!form) continue;
    shelf.dataset.ready = 'true';
    form.addEventListener('submit', event => event.preventDefault());
    const cards = [...shelf.querySelectorAll('[data-ai-card]')];
    const apply = () => {
      const query = form.elements.query.value.trim().toLocaleLowerCase();
      const { category, metric, entity } = form.elements;
      let count = 0;
      for (const card of cards) {
        const visible = (!query || card.textContent.toLocaleLowerCase().includes(query))
          && (!category.value || card.dataset.category === category.value)
          && (!metric.value || card.dataset.metrics.split(' ').includes(metric.value))
          && (!entity.value || card.dataset.entity === entity.value);
        card.hidden = !visible;
        if (visible) count++;
      }
      shelf.querySelector('[data-ai-count]').textContent = `${count} of ${cards.length} resources`;
      shelf.querySelector('[data-ai-empty]').hidden = count > 0;
    };
    form.addEventListener('input', apply);
    form.addEventListener('change', apply);
    form.addEventListener('reset', () => requestAnimationFrame(apply));
    apply();
  }
}
