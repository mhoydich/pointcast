(() => {
  'use strict';
  const filters = document.querySelector('.filter-group');
  const designCards = [...document.querySelectorAll('[data-design-type]')];
  const result = document.querySelector('.filter-result');
  if (filters && designCards.length) {
    filters.hidden = false;
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-filter]');
      if (!button || !filters.contains(button)) return;
      const type = button.dataset.filter;
      if (!['all', 'tee', 'ad'].includes(type)) return;
      let count = 0;
      designCards.forEach(card => {
        card.hidden = type !== 'all' && card.dataset.designType !== type;
        if (!card.hidden) count += 1;
      });
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (result) result.textContent = `${count} ${type === 'tee' ? 'T-shirt concepts' : type === 'ad' ? 'print ads' : 'designs'} shown.`;
    });
  }

  const copyStatus = document.getElementById('copy-status');
  document.querySelectorAll('button[data-copy]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;
      const text = target.textContent.trim();
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); copied = true; } catch (_) { /* Use a local selection fallback. */ }
      }
      if (!copied) {
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = window.getSelection();
        if (selection) { selection.removeAllRanges(); selection.addRange(range); }
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      }
      button.textContent = copied ? 'Copied ✓' : 'Text selected — copy manually';
      if (copyStatus) copyStatus.textContent = copied ? 'Caption copied. Nothing has been posted.' : 'Caption selected. Use your browser copy command to copy it.';
      window.setTimeout(() => { button.textContent = 'Copy caption'; }, 2500);
    });
  });

  document.querySelectorAll('img[data-fallback]').forEach(img => {
    const fallback = () => {
      const next = img.dataset.fallback;
      if (!next) return;
      delete img.dataset.fallback;
      img.src = next;
    };
    img.addEventListener('error', fallback, { once: true });
    if (img.complete && img.naturalWidth === 0) fallback();
  });
})();
