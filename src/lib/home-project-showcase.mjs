/** A native scrolling list, enhanced with bounded controls. No timers or fetches. */
export function initializeProjectShowcase(root) {
  if (!root || root.hasAttribute('data-showcase-ready')) return null;
  const rail = root.querySelector('[data-showcase-rail]');
  const items = [...root.querySelectorAll('[data-showcase-item]')];
  const previous = root.querySelector('[data-showcase-previous]');
  const next = root.querySelector('[data-showcase-next]');
  const counter = root.querySelector('[data-showcase-counter]');
  const status = root.querySelector('[data-showcase-status]');
  if (!rail || !items.length || !previous || !next) return null;
  const view = root.ownerDocument.defaultView;
  const reducedMotion = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const maxScroll = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
  const positions = () => {
    const box = rail.getBoundingClientRect();
    return items.map(item => item.getBoundingClientRect().left - box.left + rail.scrollLeft - 4);
  };
  const currentIndex = () => {
    const offsets = positions();
    return offsets.reduce((closest, offset, index) => Math.abs(offset - rail.scrollLeft) < Math.abs(offsets[closest] - rail.scrollLeft) ? index : closest, 0);
  };
  const update = () => {
    previous.setAttribute('aria-disabled', String(rail.scrollLeft <= 2));
    next.setAttribute('aria-disabled', String(rail.scrollLeft >= maxScroll() - 2));
    if (counter) counter.textContent = `${String(currentIndex() + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
  };
  const moveTo = (left, behavior = reducedMotion?.matches ? 'instant' : 'smooth') => {
    rail.scrollTo({ left: Math.min(maxScroll(), Math.max(0, left)), behavior });
    update();
  };
  const announce = index => {
    if (status) status.textContent = `${items[index].querySelector('h3')?.textContent ?? 'Project'}, ${index + 1} of ${items.length}.`;
  };
  const step = direction => {
    if (direction < 0 && rail.scrollLeft <= 2 || direction > 0 && rail.scrollLeft >= maxScroll() - 2) return;
    const offsets = positions();
    // Move relative to the actual scroll position, including between snap points.
    const index = direction > 0
      ? offsets.findIndex(offset => offset > rail.scrollLeft + 3)
      : offsets.findLastIndex(offset => offset < rail.scrollLeft - 3);
    const target = index < 0 ? direction > 0 ? items.length - 1 : 0 : index;
    moveTo(offsets[target]);
    announce(target);
  };
  const onPrevious = () => step(-1);
  const onNext = () => step(1);
  const onKey = event => {
    // Links keep their native keyboard behavior; Tab can leave the rail freely.
    if (event.target !== rail || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') {
      const index = event.key === 'Home' ? 0 : items.length - 1;
      moveTo(event.key === 'Home' ? 0 : maxScroll());
      announce(index);
    } else step(event.key === 'ArrowRight' ? 1 : -1);
  };
  const onFocus = event => {
    const item = event.target.closest?.('[data-showcase-item]');
    if (!item) return;
    const bounds = item.getBoundingClientRect();
    const viewport = rail.getBoundingClientRect();
    if (bounds.left < viewport.left + 3) moveTo(rail.scrollLeft + bounds.left - viewport.left - 4, 'instant');
    else if (bounds.right > viewport.right - 3) moveTo(rail.scrollLeft + bounds.right - viewport.right + 4, 'instant');
  };
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);
  rail.addEventListener('scroll', update, { passive: true });
  rail.addEventListener('keydown', onKey);
  rail.addEventListener('focusin', onFocus);
  view.addEventListener('resize', update);
  // Observe layout changes as well as viewport changes (e.g. browser back).
  const observer = view.ResizeObserver ? new view.ResizeObserver(update) : null;
  observer?.observe(rail);
  update();
  root.setAttribute('data-showcase-ready', '');
  return {
    destroy() {
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      rail.removeEventListener('scroll', update);
      rail.removeEventListener('keydown', onKey);
      rail.removeEventListener('focusin', onFocus);
      view.removeEventListener('resize', update);
      observer?.disconnect();
      root.removeAttribute('data-showcase-ready');
    },
  };
}
